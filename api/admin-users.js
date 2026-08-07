import { createClient } from '@supabase/supabase-js';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const authorization = request.headers.authorization;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return response.status(500).json({
        error: 'Variables Vercel manquantes : SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY.'
      });
    }

    if (!authorization) {
      return response.status(401).json({ error: 'Session administrateur manquante.' });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: callerData, error: callerError } = await callerClient.auth.getUser();

    if (callerError || !callerData.user) {
      return response.status(401).json({ error: 'Session administrateur invalide.' });
    }

    const callerAuthUser = callerData.user;
    const callerProfileId = callerAuthUser.user_metadata?.profile_id;

    let callerProfile = null;

    const candidateIds = [callerAuthUser.id, callerProfileId].filter(Boolean);

    if (candidateIds.length) {
      const { data } = await adminClient
        .from('profiles')
        .select('id, role')
        .in('id', candidateIds)
        .limit(1)
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
      return response.status(403).json({ error: 'Action réservée aux administrateurs.' });
    }

    const body = request.body || {};
    const action = body.action;
    const incomingUser = body.user || {};
    const requestedProfileId = String(incomingUser.id || body.userId || '').trim();
    const email = normalizeEmail(incomingUser.email);
    const password = String(incomingUser.password || '').trim();

    const findAuthUser = async (profileId, userEmail) => {
      let page = 1;

      while (page <= 10) {
        const { data, error } = await adminClient.auth.admin.listUsers({
          page,
          perPage: 100
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

    if (action === 'list_orders') {
      const { data: orders, error: ordersError } = await adminClient
        .from('transactions')
        .select('id,user_id,amount,reason,type,date,order_status,distributed_at')
        .eq('type', 'spend')
        .ilike('reason', 'Achat :%')
        .order('date', { ascending: false })
        .limit(500);

      if (ordersError) throw ordersError;

      return response.status(200).json({
        ok: true,
        orders: orders || []
      });
    }

    if (action === 'delete_order') {
      const orderId = String(body.orderId || '').trim();

      if (!orderId) {
        return response.status(400).json({ error: 'Identifiant de commande manquant.' });
      }

      const { data: order, error: orderLookupError } = await adminClient
        .from('transactions')
        .select('id,type,reason,order_status')
        .eq('id', orderId)
        .maybeSingle();

      if (orderLookupError || !order) {
        return response.status(404).json({ error: 'Commande introuvable.' });
      }

      if (order.type !== 'spend' || !String(order.reason || '').match(/^Achat\s*:/i)) {
        return response.status(400).json({ error: 'Cette transaction n’est pas une commande Boutique.' });
      }

      if (order.order_status !== 'distributed') {
        return response.status(400).json({
          error: 'Seules les commandes déjà distribuées peuvent être supprimées.'
        });
      }

      const { error: deleteError } = await adminClient
        .from('transactions')
        .delete()
        .eq('id', orderId);

      if (deleteError) throw deleteError;

      return response.status(200).json({
        ok: true,
        orderId
      });
    }

    if (action === 'mark_order_distributed') {
      const orderId = String(body.orderId || '').trim();

      if (!orderId) {
        return response.status(400).json({ error: 'Identifiant de commande manquant.' });
      }

      const { data: order, error: orderLookupError } = await adminClient
        .from('transactions')
        .select('id,type,reason,order_status')
        .eq('id', orderId)
        .maybeSingle();

      if (orderLookupError || !order) {
        return response.status(404).json({ error: 'Commande introuvable.' });
      }

      if (order.type !== 'spend' || !String(order.reason || '').match(/^Achat\s*:/i)) {
        return response.status(400).json({ error: 'Cette transaction n’est pas une commande Boutique.' });
      }

      const nextStatus = order.order_status === 'distributed' ? 'pending' : 'distributed';
      const distributedAt = nextStatus === 'distributed' ? new Date().toISOString() : null;

      const { error: updateError } = await adminClient
        .from('transactions')
        .update({
          order_status: nextStatus,
          distributed_at: distributedAt
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return response.status(200).json({
        ok: true,
        orderId,
        orderStatus: nextStatus,
        distributedAt
      });
    }

    if (action === 'adjust_points') {
      const userId = String(body.userId || '').trim();
      const delta = Number(body.delta || 0);

      if (!userId) {
        return response.status(400).json({ error: 'Identifiant utilisateur manquant.' });
      }

      if (!Number.isFinite(delta) || delta === 0 || Math.abs(delta) > 100000) {
        return response.status(400).json({ error: 'Ajustement de points invalide.' });
      }

      const { data: targetProfile, error: targetError } = await adminClient
        .from('profiles')
        .select('id, points, name')
        .eq('id', userId)
        .maybeSingle();

      if (targetError || !targetProfile) {
        return response.status(404).json({ error: 'Profil utilisateur introuvable.' });
      }

      const previousPoints = Number(targetProfile.points || 0);
      const nextPoints = Math.max(0, previousPoints + delta);
      const effectiveDelta = nextPoints - previousPoints;

      if (effectiveDelta === 0) {
        return response.status(200).json({
          ok: true,
          userId,
          points: nextPoints,
          delta: 0
        });
      }

      const { error: pointsError } = await adminClient
        .from('profiles')
        .update({ points: nextPoints })
        .eq('id', userId);

      if (pointsError) throw pointsError;

      const { error: transactionError } = await adminClient
        .from('transactions')
        .insert({
          user_id: userId,
          amount: Math.abs(effectiveDelta),
          reason: effectiveDelta > 0
            ? 'Ajustement administrateur : points ajoutés'
            : 'Ajustement administrateur : points retirés',
          type: effectiveDelta > 0 ? 'earn' : 'spend',
          date: new Date().toISOString()
        });

      if (transactionError) {
        // Retour à l'ancien solde pour ne jamais laisser un ajustement sans trace.
        await adminClient
          .from('profiles')
          .update({ points: previousPoints })
          .eq('id', userId);

        throw transactionError;
      }

      return response.status(200).json({
        ok: true,
        userId,
        points: nextPoints,
        delta: effectiveDelta
      });
    }

    if (action === 'delete') {
      if (!requestedProfileId) {
        return response.status(400).json({ error: 'Identifiant utilisateur manquant.' });
      }

      if (requestedProfileId === callerProfile.id) {
        return response.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte.' });
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

      return response.status(200).json({ ok: true });
    }

    if (!email) {
      return response.status(400).json({ error: 'Adresse e-mail obligatoire.' });
    }

    if (action === 'create' && password.length < 6) {
      return response.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères.' });
    }

    const rawAvatar =
      typeof incomingUser.avatar === 'string'
        ? incomingUser.avatar
        : null;

    const safeAvatar =
      rawAvatar && !rawAvatar.startsWith('data:')
        ? rawAvatar.slice(0, 2048)
        : null;

    const baseProfilePayload = {
      email,
      name: String(incomingUser.name || '').trim().slice(0, 160),
      role: incomingUser.role || 'USER',
      department: String(incomingUser.department || '').slice(0, 160),
      company: String(incomingUser.company || 'Star Fruits').slice(0, 160),
      birthday: incomingUser.birthday || null,
      points: Number(incomingUser.points || 0),
      phone: incomingUser.phone ? String(incomingUser.phone).slice(0, 80) : null,
      job_function: incomingUser.job_function ? String(incomingUser.job_function).slice(0, 160) : null,
      notification_settings: null
    };

    if (action === 'create') {
      const { data: existingProfile } = await adminClient
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      if (existingProfile) {
        return response.status(409).json({ error: 'Un profil existe déjà avec cette adresse e-mail.' });
      }

      const { data: created, error: authCreateError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            name: baseProfilePayload.name
          }
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
            name: baseProfilePayload.name
          }
        }
      );

      if (metadataError) throw metadataError;

      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: profileId,
          ...baseProfilePayload,
          avatar: safeAvatar || ''
        });

      if (profileError) {
        await adminClient.auth.admin.deleteUser(created.user.id);
        throw profileError;
      }

      return response.status(200).json({
        ok: true,
        profileId,
        authUserId: created.user.id
      });
    }

    if (action === 'update') {
      if (!requestedProfileId) {
        return response.status(400).json({ error: 'Identifiant utilisateur manquant.' });
      }

      const { data: previousProfile, error: previousError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', requestedProfileId)
        .maybeSingle();

      if (previousError || !previousProfile) {
        return response.status(404).json({ error: 'Profil utilisateur introuvable.' });
      }

      let authUser = await findAuthUser(
        requestedProfileId,
        normalizeEmail(previousProfile.email)
      );

      if (!authUser) {
        if (password.length < 6) {
          return response.status(400).json({
            error: 'Ce profil n’a pas encore de compte de connexion. Saisissez un mot de passe d’au moins 6 caractères.'
          });
        }

        const { data: created, error: createError } =
          await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              profile_id: requestedProfileId,
              name: baseProfilePayload.name
            }
          });

        if (createError || !created.user) throw createError;

        authUser = created.user;
      } else {
        const authChanges = {
          email,
          email_confirm: true,
          user_metadata: {
            profile_id: requestedProfileId,
            name: baseProfilePayload.name
          }
        };

        if (password) authChanges.password = password;

        const { error: authUpdateError } =
          await adminClient.auth.admin.updateUserById(authUser.id, authChanges);

        if (authUpdateError) throw authUpdateError;
      }

      const { error: profileUpdateError } = await adminClient
        .from('profiles')
        .update({
          ...baseProfilePayload,
          avatar: safeAvatar || previousProfile.avatar || '',
          notification_settings: previousProfile.notification_settings || null
        })
        .eq('id', requestedProfileId);

      if (profileUpdateError) throw profileUpdateError;

      return response.status(200).json({
        ok: true,
        profileId: requestedProfileId,
        authUserId: authUser.id
      });
    }

    return response.status(400).json({ error: 'Action inconnue.' });
  } catch (error) {
    console.error(error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : typeof error === 'string'
            ? error
            : 'Erreur interne du service utilisateurs.';

    return response.status(500).json({
      error: errorMessage
    });
  }
}
