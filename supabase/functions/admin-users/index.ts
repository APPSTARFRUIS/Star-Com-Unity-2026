import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizeEmail = (value: unknown) => String(value || '').trim().toLowerCase();

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
      return json({ error: 'Configuration Supabase incomplète.' }, 500);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerData.user) {
      return json({ error: 'Session administrateur invalide.' }, 401);
    }

    const callerAuthUser = callerData.user;
    const callerProfileId = callerAuthUser.user_metadata?.profile_id as string | undefined;

    let callerProfile: any = null;

    const candidateIds = [callerAuthUser.id, callerProfileId].filter(Boolean) as string[];
    if (candidateIds.length) {
      const { data } = await adminClient
        .from('profiles')
        .select('id, role')
        .in('id', candidateIds)
        .maybeSingle();
      callerProfile = data;
    }

    if (!callerProfile && callerAuthUser.email) {
      const { data } = await adminClient
        .from('profiles')
        .select('id, role')
        .ilike('email', callerAuthUser.email)
        .maybeSingle();
      callerProfile = data;
    }

    if (callerProfile?.role !== 'ADMIN') {
      return json({ error: 'Action réservée aux administrateurs.' }, 403);
    }

    const body = await request.json();
    const action = body.action as 'create' | 'update' | 'delete';
    const incomingUser = body.user || {};
    const requestedProfileId = String(incomingUser.id || body.userId || '').trim();
    const email = normalizeEmail(incomingUser.email);
    const password = String(incomingUser.password || '').trim();

    const findAuthUser = async (profileId: string, userEmail: string) => {
      let page = 1;

      while (page <= 10) {
        const { data, error } = await adminClient.auth.admin.listUsers({
          page,
          perPage: 100,
        });

        if (error) throw error;

        const found = data.users.find((authUser) =>
          authUser.id === profileId ||
          authUser.user_metadata?.profile_id === profileId ||
          normalizeEmail(authUser.email) === userEmail
        );

        if (found) return found;
        if (data.users.length < 100) break;
        page += 1;
      }

      return null;
    };

    if (action === 'delete') {
      if (!requestedProfileId) return json({ error: 'Identifiant utilisateur manquant.' }, 400);
      if (requestedProfileId === callerProfile.id) {
        return json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' }, 400);
      }

      const { data: profile } = await adminClient
        .from('profiles')
        .select('email')
        .eq('id', requestedProfileId)
        .maybeSingle();

      const authUser = await findAuthUser(
        requestedProfileId,
        normalizeEmail(profile?.email)
      );

      if (authUser) {
        const { error } = await adminClient.auth.admin.deleteUser(authUser.id);
        if (error) throw error;
      }

      const { error: profileDeleteError } = await adminClient
        .from('profiles')
        .delete()
        .eq('id', requestedProfileId);

      if (profileDeleteError) throw profileDeleteError;

      return json({ ok: true });
    }

    if (!email) return json({ error: 'Adresse e-mail obligatoire.' }, 400);
    if (action === 'create' && password.length < 6) {
      return json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }, 400);
    }

    const profilePayload = {
      email,
      name: String(incomingUser.name || '').trim(),
      role: incomingUser.role || 'USER',
      avatar: incomingUser.avatar || '',
      department: incomingUser.department || '',
      company: incomingUser.company || 'Star Fruits',
      birthday: incomingUser.birthday || null,
      points: Number(incomingUser.points || 0),
      phone: incomingUser.phone || null,
      job_function: incomingUser.job_function || null,
      notification_settings: incomingUser.notification_settings || null,
    };

    if (action === 'create') {
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (existingProfile) {
        return json({ error: 'Un profil existe déjà avec cette adresse e-mail.' }, 409);
      }

      const { data: created, error: authCreateError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            profile_id: null,
            name: profilePayload.name,
            avatar: profilePayload.avatar,
          },
        });

      if (authCreateError || !created.user) {
        throw authCreateError || new Error('Compte Auth impossible à créer.');
      }

      const profileId = created.user.id;

      const { error: metadataError } = await adminClient.auth.admin.updateUserById(
        created.user.id,
        {
          user_metadata: {
            profile_id: profileId,
            name: profilePayload.name,
            avatar: profilePayload.avatar,
          },
        }
      );

      if (metadataError) throw metadataError;

      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({ id: profileId, ...profilePayload });

      if (profileError) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        throw profileError;
      }

      return json({ ok: true, profileId, authUserId: created.user.id });
    }

    if (action === 'update') {
      if (!requestedProfileId) return json({ error: 'Identifiant utilisateur manquant.' }, 400);

      const { data: previousProfile, error: previousError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', requestedProfileId)
        .maybeSingle();

      if (previousError || !previousProfile) {
        return json({ error: 'Profil utilisateur introuvable.' }, 404);
      }

      let authUser = await findAuthUser(
        requestedProfileId,
        normalizeEmail(previousProfile.email)
      );

      if (!authUser) {
        if (password.length < 6) {
          return json({
            error: 'Ce profil n’avait pas encore de compte de connexion. Saisissez un mot de passe d’au moins 6 caractères pour le créer.'
          }, 400);
        }

        const { data: created, error: createError } =
          await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              profile_id: requestedProfileId,
              name: profilePayload.name,
              avatar: profilePayload.avatar,
            },
          });

        if (createError || !created.user) throw createError;
        authUser = created.user;
      } else {
        const authChanges: Record<string, unknown> = {
          email,
          email_confirm: true,
          user_metadata: {
            ...(authUser.user_metadata || {}),
            profile_id: requestedProfileId,
            name: profilePayload.name,
            avatar: profilePayload.avatar,
          },
        };

        if (password) authChanges.password = password;

        const { error: authUpdateError } =
          await adminClient.auth.admin.updateUserById(authUser.id, authChanges);

        if (authUpdateError) throw authUpdateError;
      }

      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update(profilePayload)
        .eq('id', requestedProfileId);

      if (profileUpdateError) throw profileUpdateError;

      return json({ ok: true, profileId: requestedProfileId, authUserId: authUser.id });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (error) {
    console.error(error);
    return json({
      error: error instanceof Error ? error.message : 'Erreur interne du service utilisateurs.'
    }, 500);
  }
});
