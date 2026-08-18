
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  supabase,
  isSupabaseConfigured } from './supabaseClient';
import { CATEGORIES,
  DEPARTMENTS,
  INITIAL_CONFIG } from './constants';
import {
  User,
  Post,
  UserRole,
  Comment,
  CompanyEvent,
  Message,
  Attachment,
  Idea,
  IdeaStatus,
  DocumentFile,
  Poll,
  PollResponse,
  MoodEntry,
  MoodValue,
  Celebration,
  Newsletter,
  AppConfig,
  WellnessContent,
  WellnessChallenge,
  CompanyGame,
  GameCompletion,
  GamePrediction,
  Reward,
  PointsTransaction,
  EngagementAnimation,
  AdventOpening,
  AppNotification,
  NotificationKind,
  OrgEntity,
  OrgService,
  OrgContact
} from './types';
import Sidebar, { ViewType } from './components/Sidebar';
import PostCard from './components/PostCard';
import PostCreator from './components/PostCreator';
import AdminPanel from './components/AdminPanel';
import TeamView from './components/TeamView';
import MessagesView from './components/MessagesView';
import IdeesView from './components/IdeesView';
import DocumentsView from './components/DocumentsView';
import PollsView from './components/PollsView';
import EventsView from './components/EventsView';
import MoodView from './components/MoodView';
import CelebrationsView from './components/CelebrationsView';
import NewsletterView from './components/NewsletterView';
import BienEtreView from './components/BienEtreView';
import JeuxView from './components/JeuxView';
import BoutiqueView from './components/BoutiqueView';
import Settings from './components/Settings';
import NotificationCenter from './components/NotificationCenter';
import EventCreatorModal from './components/EventCreatorModal';
import EngagementView from './components/EngagementView';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [orgEntities, setOrgEntities] = useState<OrgEntity[]>([]);
  const [orgServices, setOrgServices] = useState<OrgService[]>([]);
  const [orgContacts, setOrgContacts] = useState<OrgContact[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<CompanyEvent[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [wellnessContents, setWellnessContents] = useState<WellnessContent[]>([]);
  const [wellnessChallenges, setWellnessChallenges] = useState<WellnessChallenge[]>([]);
  const [games, setGames] = useState<CompanyGame[]>([]);
  const [gameCompletions, setGameCompletions] = useState<GameCompletion[]>([]);
  const [predictions, setPredictions] = useState<GamePrediction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [engagementAnimations, setEngagementAnimations] = useState<EngagementAnimation[]>([]);
  const [adventOpenings, setAdventOpenings] = useState<AdventOpening[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [publicGamificationStats, setPublicGamificationStats] = useState<Record<string, { earned: number; purchases: number; gains: number }>>({});

  const [view, setView] = useState<ViewType>('accueil');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wishingBirthdayForId, setWishingBirthdayForId] = useState<string | undefined>(undefined);

  // Protection contre les rafraîchissements simultanés et les rafales Realtime.
  const dataFetchInFlightRef = useRef<Promise<void> | null>(null);
  const lastFullFetchAtRef = useRef(0);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
  const currentUserRef = useRef<User | null>(null);
  const currentViewRef = useRef<ViewType>('accueil');
  const loadedViewsRef = useRef<Set<ViewType>>(new Set());
  const viewFetchesRef = useRef<Map<ViewType, Promise<void>>>(new Map());

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    currentViewRef.current = view;
  }, [view]);

  // Administration > Boutique : charge toutes les commandes boutique.
  // 'admin' n'appartient pas au ViewType de fetchViewData, on le traite donc séparément.
  useEffect(() => {
    if (view !== 'admin' || !supabase || !currentUserRef.current) return;

    let cancelled = false;

    const loadAdminShopData = async () => {
      try {
        const cachedProfiles = getCachedProfiles();
        if (cachedProfiles?.length && !cancelled) {
          setUsers(cachedProfiles);
        }

        void fetchProfilesWithRetry(2);

        const [rewardsResult, ordersResult] = await Promise.all([
          supabase
            .from('rewards')
            .select('*')
            .order('cost', { ascending: true })
            .limit(100),
          callAdminUsers('list_orders', {})
        ]);

        if (cancelled) return;

        if (rewardsResult.data) {
          setRewards(rewardsResult.data as any);
        }

        if (Array.isArray(ordersResult?.orders)) {
          setTransactions(
            ordersResult.orders.map((t: any) => ({
              ...t,
              userId: t.user_id,
              date: t.date,
              orderStatus: t.order_status || 'pending',
              distributedAt: t.distributed_at || null
            }))
          );
        }
      } catch (error) {
        console.error('Erreur chargement commandes boutique admin :', error);
      }
    };

    void loadAdminShopData();

    return () => {
      cancelled = true;
    };
  }, [view]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
    try {
      const cachedProfiles = localStorage.getItem('star_community_profiles_cache');
      if (cachedProfiles) {
        const parsedCache = JSON.parse(cachedProfiles);
        const parsedProfiles = Array.isArray(parsedCache) ? parsedCache : parsedCache?.data;
        if (Array.isArray(parsedProfiles)) setUsers(parsedProfiles);
      }
    } catch {
      localStorage.removeItem('star_community_profiles_cache');
    }

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const manualUserId = localStorage.getItem('star_community_user_id');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else if (manualUserId) {
        fetchUserProfile(manualUserId);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else if (!manualUserId) {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return;

    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;
    const profileId = authUser?.user_metadata?.profile_id as string | undefined;
    const authEmail = authUser?.email;

    let profile: any = null;

    const { data: byId } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    profile = byId;

    if (!profile && profileId && profileId !== userId) {
      const { data: byProfileId } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();
      profile = byProfileId;
    }

    if (!profile && authEmail) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', authEmail)
        .maybeSingle();
      profile = byEmail;
    }

    if (profile) {
      localStorage.setItem('star_community_user_id', profile.id);
      setCurrentUser({
        ...profile,
        notification_settings: profile.notification_settings || {
          inApp: true,
          email: true,
          desktop: true,
          mobile: true,
          posts: true,
          events: true,
          messages: true,
          birthdays: true,
          polls: true,
          newsletters: true,
          celebrations: true,
          highlights: true,
          points: true
        }
      } as User);
    }

    setIsLoading(false);
  };

  const cacheProfiles = (profiles: User[]) => {
    setUsers(profiles);

    try {
      localStorage.setItem(
        'star_community_profiles_cache',
        JSON.stringify({ data: profiles, cachedAt: Date.now() })
      );
    } catch {
      // Le cache local reste facultatif.
    }
  };

  const getCachedProfiles = (): User[] | null => {
    try {
      const cached = localStorage.getItem('star_community_profiles_cache');
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const profiles = Array.isArray(parsed) ? parsed : parsed?.data;
      return Array.isArray(profiles) ? profiles as User[] : null;
    } catch {
      localStorage.removeItem('star_community_profiles_cache');
      return null;
    }
  };

  const fetchProfilesWithRetry = async (attempts = 3): Promise<User[] | null> => {
    if (!supabase) return getCachedProfiles();

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,name,role,avatar,department,company,birthday,points,phone,job_function,job_description,personal_note,notification_settings')
        .order('name', { ascending: true });

      if (!error && data) {
        const profiles = data as User[];
        cacheProfiles(profiles);
        return profiles;
      }

      console.warn(`Chargement des profils échoué (tentative ${attempt}/${attempts})`, error);
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, 350 * attempt));
      }
    }

    return getCachedProfiles();
  };


  const mapComments = (rows: any[] | null | undefined) =>
    (rows || []).map((c: any) => ({
      ...c,
      userId: c.user_id,
      userName: c.user_name,
      userAvatar: c.user_avatar,
      createdAt: c.created_at
    }));

  const mapPosts = (rows: any[] | null | undefined, commentRows: any[] | null | undefined) =>
    (rows || []).map((p: any) => ({
      ...p,
      userId: p.user_id,
      userName: p.user_name,
      userAvatar: p.user_avatar,
      createdAt: p.created_at,
      comments: mapComments(commentRows).filter((c: any) => c.post_id === p.id)
    }));

  const mapIdeas = (rows: any[] | null | undefined, commentRows: any[] | null | undefined) =>
    (rows || []).map((i: any) => ({
      ...i,
      userId: i.user_id,
      userName: i.user_name,
      userAvatar: i.user_avatar,
      createdAt: i.created_at,
      comments: mapComments(commentRows).filter((c: any) => c.idea_id === i.id)
    }));

  const mapGames = (rows: any[] | null | undefined) =>
    (rows || []).map((g: any) => ({
      ...g,
      rewardPoints: g.reward_points,
      questions: g.questions,
      memoryItems: g.memory_items,
      timelineItems: g.timeline_items,
      hiddenObjects: g.hidden_objects,
      hiddenObjectsImage: g.hidden_objects_image,
      sportEvents: g.sport_events || [],
      sportName: g.sport_name || 'Football',
      exactScorePoints: g.exact_score_points || g.reward_points || 10,
      outcomePoints: g.outcome_points ?? 5,
      matchDate: g.match_date,
      isProcessed: g.is_processed,
      learningPath:
        g.learning_path?.trim() ||
        ((Number(g.level_number || 1) > 1 || g.level_title) ? 'Parcours Star ComUnity' : undefined),
      levelNumber: Number(g.level_number || 1),
      levelTitle: g.level_title || undefined,
      passingScore: Number(g.passing_score || 0),
      createdAt: g.created_at,
      createdBy: g.created_by
    }));

  const mapGameCompletions = (rows: any[] | null | undefined): GameCompletion[] =>
    (rows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      gameId: row.game_id,
      bestScore: Number(row.best_score || 0),
      passed: Boolean(row.passed),
      completedAt: row.completed_at || null,
      lastPlayedAt: row.last_played_at
    }));

  const mapPredictions = (rows: any[] | null | undefined) =>
    (rows || []).map((p: any) => {
      let parsed: any = {};
      try {
        parsed = typeof p.choice === 'string' ? JSON.parse(p.choice) : (p.choice || {});
      } catch {
        parsed = { choice: p.choice };
      }

      return {
        id: p.id,
        userId: p.user_id,
        gameId: p.game_id,
        eventId: parsed.eventId,
        homeScore: parsed.homeScore,
        awayScore: parsed.awayScore,
        choice: parsed.choice,
        pointsAwarded: parsed.pointsAwarded || 0,
        awarded: !!parsed.awarded,
        submittedAt: p.submitted_at
      } as GamePrediction;
    });

  const mapCelebrations = (rows: any[] | null | undefined) =>
    (rows || []).map((c: any) => {
      const rawType = String(c.type || '').trim().toLowerCase();
      const normalizedType = ['birthday', 'anniversaire'].includes(rawType)
        ? 'anniversary'
        : rawType;

      return {
        ...c,
        type: normalizedType,
        userIds: c.user_ids || [],
        userName: c.user_name || 'Collaborateur',
        userAvatar: c.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`,
        createdBy: c.created_by,
        likes: Array.isArray(c.likes) ? c.likes : []
      };
    });

  const mapEngagementAnimations = (rows: any[] | null | undefined) =>
    (rows || []).map((a: any) => ({
      ...a,
      startDate: a.start_date,
      endDate: a.end_date,
      imageUrl: a.image_url,
      pointsCost: a.points_cost || 0,
      rewardLabel: a.reward_label,
      rewardPoints: a.reward_points || 0,
      createdBy: a.created_by,
      participants: a.participants || [],
      winnerIds: a.winner_ids || [],
      createdAt: a.created_at
    }));

  const mapAdventOpenings = (rows: any[] | null | undefined): AdventOpening[] =>
    (rows || []).map((opening: any) => ({
      id: opening.id,
      animationId: opening.animation_id,
      userId: opening.user_id,
      dayNumber: opening.day_number,
      outcome: opening.outcome || {},
      pointsAwarded: opening.points_awarded || 0,
      openedAt: opening.opened_at
    }));


  const mapNotifications = (rows: any[] | null | undefined): AppNotification[] =>
    (rows || []).map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      kind: item.kind || 'system',
      title: item.title,
      message: item.message,
      linkView: item.link_view || undefined,
      entityId: item.entity_id || undefined,
      isRead: Boolean(item.is_read),
      readAt: item.read_at || null,
      createdAt: item.created_at
    }));

  const purgeExpiredReadNotifications = useCallback(async () => {
    if (!supabase || !currentUserRef.current) return;

    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', currentUserRef.current.id)
      .eq('is_read', true)
      .lt('read_at', threshold);

    if (error) {
      console.error('Erreur nettoyage notifications expirées :', error);
    }
  }, []);

  const fetchCoreData = useCallback(async (force = false) => {
    if (!supabase || (!session && !currentUserRef.current)) return;

    const now = Date.now();
    if (!force && loadedViewsRef.current.has('accueil') && now - lastFullFetchAtRef.current < 60_000) return;

    const cachedProfiles = getCachedProfiles();
    if (cachedProfiles?.length) {
      setUsers(cachedProfiles);
    }

    // Nettoyage réel en base : les notifications lues depuis plus de 7 jours
    // sont supprimées automatiquement au prochain chargement de l'application.
    await purgeExpiredReadNotifications();

    // Les profils ne bloquent plus l'accueil : mise à jour en arrière-plan.
    void fetchProfilesWithRetry(2);

    const [configResult, postsResult, commentsResult, eventsResult, celebrationsResult, engagementResult, notificationsResult] =
      await Promise.all([
        supabase.from('app_config').select('*').maybeSingle(),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(120),
        supabase.from('events').select('*').order('date', { ascending: true }).limit(30),
        supabase.from('celebrations').select('*').order('date', { ascending: false }).limit(60),
        supabase.from('engagement_animations').select('*').order('created_at', { ascending: false }).limit(30),
        supabase.from('notifications').select('*').eq('user_id', currentUserRef.current!.id).order('created_at', { ascending: false }).limit(100)
      ]);

    if (configResult.data) {
      const config = configResult.data;
      setAppConfig({
        ...INITIAL_CONFIG,
        appName: config.app_name ?? INITIAL_CONFIG.appName,
        appSlogan: config.app_slogan ?? INITIAL_CONFIG.appSlogan,
        logoUrl: config.logo_url ?? INITIAL_CONFIG.logoUrl,
        welcomeTitle: config.welcome_title ?? INITIAL_CONFIG.welcomeTitle,
        welcomeSubtitle: config.welcome_subtitle ?? INITIAL_CONFIG.welcomeSubtitle,
        documentCategories: config.document_categories ?? INITIAL_CONFIG.documentCategories,
        gameCategories: config.game_categories ?? INITIAL_CONFIG.gameCategories,
      });
    }

    if (postsResult.data) setPosts(mapPosts(postsResult.data, commentsResult.data));
    if (eventsResult.data) setEvents(eventsResult.data.map((e: any) => ({ ...e, startTime: e.start_time, endTime: e.end_time, createdBy: e.created_by, audienceCompanies: e.audience_companies || ['Star Fruits'] })));
    if (celebrationsResult.data) setCelebrations(mapCelebrations(celebrationsResult.data));
    if (engagementResult.data) setEngagementAnimations(mapEngagementAnimations(engagementResult.data));
    if (notificationsResult.data) setNotifications(mapNotifications(notificationsResult.data));

    loadedViewsRef.current.add('accueil');
    lastFullFetchAtRef.current = Date.now();
  }, [session, purgeExpiredReadNotifications]);

  const fetchOrganization = useCallback(async () => {
    if (!supabase) return;
    const [entitiesResult, servicesResult, contactsResult] = await Promise.all([
      supabase.from('org_entities').select('*').eq('active', true).order('sort_order'),
      supabase.from('org_services').select('*').eq('active', true).order('sort_order'),
      supabase.from('org_contacts').select('*').order('sort_order')
    ]);
    if (!entitiesResult.error && entitiesResult.data) setOrgEntities(entitiesResult.data.map((e:any)=>({ id:e.id, name:e.name, entityType:e.entity_type, parentId:e.parent_id, logoUrl:e.logo_url, sortOrder:Number(e.sort_order||0), active:e.active!==false })));
    if (!servicesResult.error && servicesResult.data) setOrgServices(servicesResult.data.map((x:any)=>({ id:x.id, entityId:x.entity_id, name:x.name, sortOrder:Number(x.sort_order||0), active:x.active!==false })));
    if (!contactsResult.error && contactsResult.data) setOrgContacts(contactsResult.data.map((x:any)=>({ id:x.id, entityId:x.entity_id, name:x.name, email:x.email, phone:x.phone, jobTitle:x.job_title, avatarUrl:x.avatar_url, about:x.about, sortOrder:Number(x.sort_order||0) })));
  }, []);

  const fetchViewData = useCallback(async (targetView: ViewType, force = false) => {
    if (!supabase || (!session && !currentUserRef.current)) return;

    if (targetView === 'accueil') {
      await fetchCoreData(force);
      return;
    }

    if (targetView === 'admin') {
      await fetchAllData(true);

      try {
        const ordersResult = await callAdminUsers('list_orders', {});
        if (Array.isArray(ordersResult?.orders)) {
          setTransactions(
            ordersResult.orders.map((t: any) => ({
              ...t,
              userId: t.user_id,
              date: t.date,
              orderStatus: t.order_status || 'pending',
              distributedAt: t.distributed_at || null
            }))
          );
        }
      } catch (error) {
        console.error('Erreur rechargement commandes admin :', error);
      }

      loadedViewsRef.current.add(targetView);
      return;
    }

    if (!force && loadedViewsRef.current.has(targetView)) return;

    const existing = viewFetchesRef.current.get(targetView);
    if (existing) {
      await existing;
      return;
    }

    const request = (async () => {
      try {
        switch (targetView) {
          case 'social': {
            const [postsResult, commentsResult] = await Promise.all([
              supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(60),
              supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(400)
            ]);
            if (postsResult.data) setPosts(mapPosts(postsResult.data, commentsResult.data));
            break;
          }

          case 'evenements': {
            void fetchOrganization();
            const { data } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(100);
            if (data) setEvents(data.map((e: any) => ({ ...e, startTime: e.start_time, endTime: e.end_time, createdBy: e.created_by, audienceCompanies: e.audience_companies || ['Star Fruits'] })));
            break;
          }

          case 'equipe': {
            void fetchOrganization();
            const cachedProfiles = getCachedProfiles();
            if (cachedProfiles?.length) {
              setUsers(cachedProfiles);
            }

            // Actualisation profils en arrière-plan.
            void fetchProfilesWithRetry(2);

            // On charge uniquement les champs nécessaires aux badges publics.
            // Aucun historique détaillé, motif ou date n'est exposé dans l'annuaire.
            const { data: publicTransactions, error: publicTransactionsError } = await supabase
              .from('transactions')
              .select('user_id,amount,type,reason')
              .limit(2000);

            if (!publicTransactionsError && publicTransactions) {
              const stats = publicTransactions.reduce((acc: Record<string, { earned: number; purchases: number; gains: number }>, row: any) => {
                const userId = String(row.user_id || '');
                if (!userId) return acc;

                if (!acc[userId]) {
                  acc[userId] = { earned: 0, purchases: 0, gains: 0 };
                }

                if (row.type === 'earn') {
                  acc[userId].earned += Math.abs(Number(row.amount || 0));
                  acc[userId].gains += 1;
                }

                if (row.type === 'spend' && /^Achat\s*:/i.test(String(row.reason || ''))) {
                  acc[userId].purchases += 1;
                }

                return acc;
              }, {});

              setPublicGamificationStats(stats);
            }

            break;
          }

          case 'messages': {
            const cachedProfiles = getCachedProfiles();
            if (cachedProfiles?.length) setUsers(cachedProfiles);
            void fetchProfilesWithRetry(2);

            const messagesResult = await supabase
              .from('messages')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(250);

            if (messagesResult.data) {
              setMessages([...messagesResult.data].reverse().map((m: any) => ({
                ...m,
                senderId: m.sender_id,
                receiverId: m.receiver_id,
                createdAt: m.created_at
              })));
            }
            break;
          }

          case 'idees': {
            const [ideasResult, commentsResult] = await Promise.all([
              supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(400)
            ]);
            if (ideasResult.data) setIdeas(mapIdeas(ideasResult.data, commentsResult.data));
            break;
          }

          case 'documents': {
            void fetchOrganization();
            const { data } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false }).limit(100);
            if (data) setDocuments(data.map((d: any) => ({
              ...d,
              uploadedBy: d.uploaded_by,
              uploadedByName: d.uploaded_by_name,
              uploadedAt: d.uploaded_at || d.created_at || new Date().toISOString(),
              audienceCompanies: d.audience_companies || ['Star Fruits']
            })) as any);
            break;
          }

          case 'sondages': {
            void fetchOrganization();
            const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false }).limit(100);
            if (data) setPolls(data.map((p: any) => ({
              ...p,
              endDate: p.end_date,
              createdBy: p.created_by,
              createdByName: p.created_by_name,
              createdAt: p.created_at,
              targetDepartments: p.target_departments,
              audienceCompanies: p.audience_companies || ['Star Fruits']
            })));
            break;
          }

          case 'humeur': {
            const { data } = await supabase.from('moods').select('*').order('created_at', { ascending: false }).limit(120);
            if (data) setMoods(data.map((m: any) => ({ ...m, userId: m.user_id, createdAt: m.created_at })));
            break;
          }

          case 'celebrations': {
            const cachedProfiles = getCachedProfiles();
            if (cachedProfiles?.length) setUsers(cachedProfiles);
            void fetchProfilesWithRetry(2);

            const celebrationsResult = await supabase
              .from('celebrations')
              .select('*')
              .order('date', { ascending: false })
              .limit(150);

            if (celebrationsResult.data) setCelebrations(mapCelebrations(celebrationsResult.data));
            break;
          }

          case 'newsletter': {
            const { data } = await supabase.from('newsletters').select('*').order('published_at', { ascending: false }).limit(30);
            if (data) setNewsletters(data.map((n: any) => ({
              ...n,
              coverImage: n.cover_image,
              publishedAt: n.published_at,
              authorName: n.author_name,
              readCount: n.read_count,
              articles: n.articles
            })));
            break;
          }

          case 'bienetre': {
            const [contentsResult, challengesResult] = await Promise.all([
              supabase.from('wellness_contents').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('wellness_challenges').select('*').order('created_at', { ascending: false }).limit(100)
            ]);
            if (contentsResult.data) setWellnessContents(contentsResult.data.map((c: any) => ({ ...c, mediaUrl: c.media_url, createdAt: c.created_at })));
            if (challengesResult.data) setWellnessChallenges(challengesResult.data.map((c: any) => ({ ...c, isActive: c.is_active })));
            break;
          }

          case 'notifications': {
            await purgeExpiredReadNotifications();

            const { data, error } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', currentUserRef.current!.id)
              .order('created_at', { ascending: false })
              .limit(100);
            if (!error && data) setNotifications(mapNotifications(data));
            break;
          }

          case 'jeux': {
            const [gamesResult, completionsResult] = await Promise.all([
              supabase
                .from('games')
                .select('*')
                .neq('type', 'Pari')
                .order('learning_path', { ascending: true, nullsFirst: false })
                .order('level_number', { ascending: true })
                .order('created_at', { ascending: false })
                .limit(150),
              supabase
                .from('game_completions')
                .select('*')
                .eq('user_id', currentUserRef.current!.id)
                .order('last_played_at', { ascending: false })
                .limit(300)
            ]);

            if (!gamesResult.error && gamesResult.data) setGames(mapGames(gamesResult.data));
            if (!completionsResult.error && completionsResult.data) {
              setGameCompletions(mapGameCompletions(completionsResult.data));
            }
            break;
          }

          case 'boutique': {
            const [rewardsResult, transactionsResult] = await Promise.all([
              supabase.from('rewards').select('*').order('cost', { ascending: true }).limit(100),
              supabase
                .from('transactions')
                .select('*')
                .eq('user_id', currentUserRef.current!.id)
                .order('date', { ascending: false })
                .limit(250)
            ]);
            if (rewardsResult.data) setRewards(rewardsResult.data as any);
            if (transactionsResult.data) setTransactions(transactionsResult.data.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
            break;
          }


          case 'engagement': {
            const [profiles, transactionsResult, postsResult, commentsResult, ideasResult, pollsResult] = await Promise.all([
              fetchProfilesWithRetry(),
              supabase.from('transactions').select('*').order('date', { ascending: false }).limit(400),
              supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(400),
              supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('polls').select('*').order('created_at', { ascending: false }).limit(100)
            ]);
            if (profiles) setUsers(profiles);
            if (transactionsResult.data) setTransactions(transactionsResult.data.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
            if (postsResult.data) setPosts(mapPosts(postsResult.data, commentsResult.data));
            if (ideasResult.data) setIdeas(mapIdeas(ideasResult.data, commentsResult.data));
            if (pollsResult.data) setPolls(pollsResult.data.map((p: any) => ({
              ...p,
              endDate: p.end_date,
              createdBy: p.created_by,
              createdByName: p.created_by_name,
              createdAt: p.created_at,
              targetDepartments: p.target_departments
            })));
            break;
          }

          case 'tempsforts': {
            const [engagementResult, gamesResult, predictionsResult, transactionsResult, openingsResult] = await Promise.all([
              supabase.from('engagement_animations').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('game_predictions').select('*').order('submitted_at', { ascending: false }).limit(500),
              supabase.from('transactions').select('*').order('date', { ascending: false }).limit(400),
              supabase.from('advent_openings').select('*').eq('user_id', currentUserRef.current!.id).order('opened_at', { ascending: false }).limit(100)
            ]);
            if (engagementResult.data) setEngagementAnimations(mapEngagementAnimations(engagementResult.data));
            if (gamesResult.data) setGames(mapGames(gamesResult.data));
            if (predictionsResult.data) setPredictions(mapPredictions(predictionsResult.data));
            if (transactionsResult.data) setTransactions(transactionsResult.data.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
            if (openingsResult.data) setAdventOpenings(mapAdventOpenings(openingsResult.data));
            break;
          }

          default:
            break;
        }

        loadedViewsRef.current.add(targetView);
      } catch (error) {
        console.error(`Erreur de chargement de la rubrique ${targetView}:`, error);
      }
    })();

    viewFetchesRef.current.set(targetView, request);

    try {
      await request;
    } finally {
      viewFetchesRef.current.delete(targetView);
    }
  }, [session, fetchCoreData]);

  const fetchAllData = useCallback(async (force = false) => {
    if (!supabase || (!session && !currentUserRef.current)) return;

    const now = Date.now();

    // Évite de relancer exactement le même chargement plusieurs fois en quelques secondes.
    if (!force && now - lastFullFetchAtRef.current < 15_000) return;

    // Une seule vague de requêtes à la fois.
    if (dataFetchInFlightRef.current) {
      await dataFetchInFlightRef.current;
      return;
    }

    const request = (async () => {
      try {
      // Les profils sont chargés séparément avec retry. Une requête annexe lente ou
      // temporairement en erreur ne doit jamais vider/masquer la liste utilisateurs.
      const profilesPromise = fetchProfilesWithRetry();

      const [
        { data: config },
        { data: postsData },
        { data: eventsData },
        { data: ideasData },
        { data: docsData },
        { data: rewardsData },
        { data: newsData },
        { data: commentsData },
        { data: moodsData },
        { data: wellContentsData },
        { data: challengesData },
        { data: messagesData },
        { data: transData },
        { data: gamesData },
        { data: predictionsData },
        { data: pollsData },
        { data: celebrationsData },
        { data: engagementData }
      ] = await Promise.all([
        supabase.from('app_config').select('*').maybeSingle(),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(60),
        supabase.from('events').select('*').order('date', { ascending: true }).limit(100),
        supabase.from('ideas').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('documents').select('*').order('uploaded_at', { ascending: false }).limit(100),
        supabase.from('rewards').select('*').order('cost', { ascending: true }).limit(100),
        supabase.from('newsletters').select('*').order('published_at', { ascending: false }).limit(30),
        supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(400),
        supabase.from('moods').select('*').order('created_at', { ascending: false }).limit(120),
        supabase.from('wellness_contents').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('wellness_challenges').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(250),
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(400),
        supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('game_predictions').select('*').order('submitted_at', { ascending: false }).limit(500),
        supabase.from('polls').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('celebrations').select('*').order('date', { ascending: false }).limit(150),
        supabase.from('engagement_animations').select('*').order('created_at', { ascending: false }).limit(100)
      ]);

      const profiles = await profilesPromise;

      // ✅ FIX: on repart d’INITIAL_CONFIG pour ne jamais “perdre” des clés de config
      if (config) {
        setAppConfig({
          ...INITIAL_CONFIG,
          appName: config.app_name ?? INITIAL_CONFIG.appName,
          appSlogan: config.app_slogan ?? INITIAL_CONFIG.appSlogan,
          logoUrl: config.logo_url ?? INITIAL_CONFIG.logoUrl,
          welcomeTitle: config.welcome_title ?? INITIAL_CONFIG.welcomeTitle,
          welcomeSubtitle: config.welcome_subtitle ?? INITIAL_CONFIG.welcomeSubtitle,
          documentCategories: config.document_categories ?? INITIAL_CONFIG.documentCategories,
        gameCategories: config.game_categories ?? INITIAL_CONFIG.gameCategories,
        });
      }

      if (postsData) {
        setPosts(postsData.map((p: any) => ({
          ...p,
          userId: p.user_id,
          userName: p.user_name,
          userAvatar: p.user_avatar,
          createdAt: p.created_at,
          comments: commentsData
            ? commentsData
                .filter((c: any) => c.post_id === p.id)
                .map((c: any) => ({
                  ...c,
                  userId: c.user_id,
                  userName: c.user_name,
                  userAvatar: c.user_avatar,
                  createdAt: c.created_at
                }))
            : []
        })));
      }

      if (profiles !== null) {
        setUsers(profiles);
        try {
          localStorage.setItem('star_community_profiles_cache', JSON.stringify({ data: profiles, cachedAt: Date.now() }));
        } catch {
          // Le cache local est facultatif.
        }
      } else {
        console.error('Impossible de rafraîchir les profils après plusieurs tentatives : conservation de la liste déjà affichée.');
      }
      if (eventsData) setEvents(eventsData.map((e: any) => ({ ...e, startTime: e.start_time, endTime: e.end_time, createdBy: e.created_by })));
      if (ideasData) setIdeas(ideasData.map((i: any) => ({
        ...i,
        userId: i.user_id,
        userName: i.user_name,
        userAvatar: i.user_avatar,
        createdAt: i.created_at,
        comments: commentsData
          ? commentsData
              .filter((c: any) => c.idea_id === i.id)
              .map((c: any) => ({ ...c, userId: c.user_id, userName: c.user_name, userAvatar: c.user_avatar, createdAt: c.created_at }))
          : []
      })));
      if (docsData) setDocuments(docsData.map((d: any) => ({
        ...d,
        uploadedBy: d.uploaded_by,
        uploadedByName: d.uploaded_by_name,
        uploadedAt: d.uploaded_at || d.created_at || new Date().toISOString()
      })) as any);
      if (rewardsData) setRewards(rewardsData as any);
      if (newsData) setNewsletters(newsData.map((n: any) => ({ ...n, coverImage: n.cover_image, publishedAt: n.published_at, authorName: n.author_name, readCount: n.read_count, articles: n.articles })));
      if (moodsData) setMoods(moodsData.map((m: any) => ({ ...m, userId: m.user_id, createdAt: m.created_at })));
      if (wellContentsData) setWellnessContents(wellContentsData.map((c: any) => ({ ...c, mediaUrl: c.media_url, createdAt: c.created_at })));
      if (challengesData) setWellnessChallenges(challengesData.map((c: any) => ({ ...c, isActive: c.is_active })));
      if (messagesData) setMessages(
        [...messagesData]
          .reverse()
          .map((m: any) => ({ ...m, senderId: m.sender_id, receiverId: m.receiver_id, createdAt: m.created_at }))
      );
      // En Administration, les commandes sont chargées par l'API sécurisée list_orders.
      // Ne jamais les écraser avec la requête navigateur sur transactions (soumise à la RLS).
      if (transData && currentViewRef.current !== 'admin') {
        setTransactions(
          transData.map((t: any) => ({
            ...t,
            userId: t.user_id,
            date: t.date
          }))
        );
      }
      if (gamesData) setGames(gamesData.map((g: any) => ({
        ...g,
        rewardPoints: g.reward_points,
        questions: g.questions,
        memoryItems: g.memory_items,
        timelineItems: g.timeline_items,
        hiddenObjects: g.hidden_objects,
        hiddenObjectsImage: g.hidden_objects_image,
        sportEvents: g.sport_events || [],
        sportName: g.sport_name || 'Football',
        exactScorePoints: g.exact_score_points || g.reward_points || 10,
        outcomePoints: g.outcome_points ?? 5,
        matchDate: g.match_date,
        isProcessed: g.is_processed,
        createdAt: g.created_at,
        createdBy: g.created_by
      })));
      if (predictionsData) setPredictions(predictionsData.map((p: any) => {
        let parsed: any = {};
        try { parsed = typeof p.choice === 'string' ? JSON.parse(p.choice) : (p.choice || {}); } catch { parsed = { choice: p.choice }; }
        return {
          id: p.id,
          userId: p.user_id,
          gameId: p.game_id,
          eventId: parsed.eventId,
          homeScore: parsed.homeScore,
          awayScore: parsed.awayScore,
          choice: parsed.choice,
          pointsAwarded: parsed.pointsAwarded || 0,
          awarded: !!parsed.awarded,
          submittedAt: p.submitted_at
        } as GamePrediction;
      }));
      if (pollsData) setPolls(pollsData.map((p: any) => ({
        ...p,
        endDate: p.end_date,
        createdBy: p.created_by,
        createdByName: p.created_by_name,
        createdAt: p.created_at,
        targetDepartments: p.target_departments
      })));
      if (celebrationsData) setCelebrations(celebrationsData.map((c: any) => {
        const rawType = String(c.type || '').trim().toLowerCase();
        const normalizedType = ['birthday', 'anniversaire'].includes(rawType)
          ? 'anniversary'
          : rawType;

        return {
          ...c,
          type: normalizedType,
          userIds: c.user_ids || [],
          userName: c.user_name || 'Collaborateur',
          userAvatar: c.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`,
          createdBy: c.created_by,
          likes: Array.isArray(c.likes) ? c.likes : []
        };
      }));
      if (engagementData) setEngagementAnimations(engagementData.map((a: any) => ({
        ...a,
        startDate: a.start_date,
        endDate: a.end_date,
        imageUrl: a.image_url,
        pointsCost: a.points_cost || 0,
        rewardLabel: a.reward_label,
        rewardPoints: a.reward_points || 0,
        createdBy: a.created_by,
        participants: a.participants || [],
        winnerIds: a.winner_ids || [],
        createdAt: a.created_at
      })));
      lastFullFetchAtRef.current = Date.now();
      } catch (err) {
        console.error("Erreur chargement données:", err);
      }
    })();

    dataFetchInFlightRef.current = request;

    try {
      await request;
    } finally {
      dataFetchInFlightRef.current = null;
    }
  }, [session]);

  const realtimeViewsByTable: Record<string, ViewType[]> = {
    posts: ['accueil', 'social', 'engagement', 'admin'],
    comments: ['accueil', 'social', 'idees', 'engagement', 'admin'],
    events: ['accueil', 'evenements', 'admin'],
    ideas: ['idees', 'engagement', 'admin'],
    profiles: ['equipe', 'messages', 'celebrations', 'engagement', 'admin'],
    moods: ['humeur', 'admin'],
    documents: ['documents', 'admin'],
    wellness_challenges: ['bienetre', 'admin'],
    wellness_contents: ['bienetre', 'admin'],
    messages: ['messages'],
    rewards: ['boutique', 'admin'],
    transactions: ['boutique', 'engagement', 'tempsforts', 'admin'],
    games: ['jeux', 'tempsforts', 'admin'],
    engagement_animations: ['accueil', 'tempsforts', 'admin'],
    advent_openings: ['tempsforts'],
    newsletters: ['newsletter', 'admin'],
    polls: ['sondages', 'engagement', 'admin'],
    celebrations: ['accueil', 'celebrations', 'admin']
  };

  const scheduleRealtimeRefresh = useCallback((table?: string) => {
    const activeView = currentViewRef.current;
    const affectedViews = table ? realtimeViewsByTable[table] || [] : [activeView];

    // Invalide les vues concernées pour leur prochaine ouverture.
    affectedViews.forEach(viewName => loadedViewsRef.current.delete(viewName));

    // Si la vue affichée n'est pas concernée, aucune requête immédiate.
    if (table && !affectedViews.includes(activeView)) return;

    if (realtimeRefreshTimerRef.current) {
      window.clearTimeout(realtimeRefreshTimerRef.current);
    }

    realtimeRefreshTimerRef.current = window.setTimeout(() => {
      realtimeRefreshTimerRef.current = null;
      void fetchViewData(activeView, true);
    }, 700);
  }, [fetchViewData]);

  useEffect(() => {
    if (session || currentUser) {
      void fetchCoreData(true);

      const dataChannel = supabase.channel('global-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload: any) => {
          if (currentUser && payload.new.user_id !== currentUser.id && currentUser.notification_settings?.posts) {
            addToast(`Nouveau post sur le mur social de ${payload.new.user_name} !`, "info");
          }
          scheduleRealtimeRefresh('posts');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => scheduleRealtimeRefresh('ideas'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => scheduleRealtimeRefresh('profiles'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => scheduleRealtimeRefresh('comments'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'moods' }, () => scheduleRealtimeRefresh('moods'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && currentUser.notification_settings?.events) {
            addToast(`Un nouvel événement a été ajouté à l'agenda : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh('events');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => scheduleRealtimeRefresh('documents'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_challenges' }, () => scheduleRealtimeRefresh('wellness_challenges'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_contents' }, () => scheduleRealtimeRefresh('wellness_contents'))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
          if (currentUser && payload.new.receiver_id === currentUser.id && currentUser.notification_settings?.messages) {
            addToast("Vous avez reçu un nouveau message !", "info");
          }
          scheduleRealtimeRefresh('messages');
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => scheduleRealtimeRefresh('rewards'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => scheduleRealtimeRefresh('transactions'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => scheduleRealtimeRefresh('games'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'engagement_animations' }, () => scheduleRealtimeRefresh('engagement_animations'))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'advent_openings' }, () => scheduleRealtimeRefresh('advent_openings'))
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser?.id}`
        }, (payload: any) => {
          const item = mapNotifications([payload.new])[0];
          if (item) {
            setNotifications(previous => [
              item,
              ...previous.filter(existing => existing.id !== item.id)
            ].slice(0, 100));
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'newsletters' }, (payload: any) => {
          if (currentUser && currentUser.notification_settings?.posts) {
            addToast(`La nouvelle édition de la newsletter est parue : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh('newsletters');
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'polls' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && currentUser.notification_settings?.polls) {
            addToast(`Nouveau sondage disponible : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh('polls');
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'celebrations' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && (currentUser.notification_settings?.posts || currentUser.notification_settings?.birthdays)) {
            addToast(`Une nouvelle célébration a été publiée : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh('celebrations');
        })
        .subscribe();

      return () => {
        supabase.removeChannel(dataChannel);
        if (realtimeRefreshTimerRef.current) {
          window.clearTimeout(realtimeRefreshTimerRef.current);
          realtimeRefreshTimerRef.current = null;
        }
      };
    }
  }, [session, currentUser?.id, scheduleRealtimeRefresh, fetchCoreData]);

  useEffect(() => {
    if (!session && !currentUser) return;
    void fetchViewData(view);
  }, [view, session, currentUser?.id, fetchViewData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setLoginError("Supabase non configuré.");
      return;
    }

    setLoginError('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: email.split('@')[0],
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
            }
          }
        });

        if (error) {
          console.error(error);
          setLoginError(error.message);
          return;
        }

        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email,
              name: email.split('@')[0],
              role: 'USER',
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              department: '',
              company: 'Star Fruits',
              points: 0,
              notification_settings: {
          inApp: true,
          email: true,
          desktop: true,
          mobile: true,
          posts: true,
          events: true,
          messages: true,
          birthdays: true,
          polls: true,
          newsletters: true,
          celebrations: true,
          highlights: true,
          points: true
        }
            });

          if (profileError) {
            console.error(profileError);
            setLoginError("Compte créé, mais profil utilisateur impossible à créer.");
            return;
          }
        }

        addToast("Compte créé !");
        setIsSignUp(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        console.error(error);
        setLoginError(error?.message || "Identifiants incorrects.");
        return;
      }

      const profileId = data.user.user_metadata?.profile_id as string | undefined;

      let profileData: any = null;

      const { data: profileByAuthId } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      profileData = profileByAuthId;

      if (!profileData && profileId) {
        const { data: profileByMetadata } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();
        profileData = profileByMetadata;
      }

      if (!profileData) {
        const { data: profileByEmail } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', data.user.email || email)
          .maybeSingle();
        profileData = profileByEmail;
      }

      if (!profileData) {
        setLoginError("Profil utilisateur introuvable.");
        return;
      }

      localStorage.setItem('star_community_user_id', profileData.id);

      setCurrentUser({
        ...profileData,
        notification_settings: profileData.notification_settings || {
          inApp: true,
          email: true,
          desktop: true,
          mobile: true,
          posts: true,
          events: true,
          messages: true,
          birthdays: true,
          polls: true,
          newsletters: true,
          celebrations: true,
          highlights: true,
          points: true
        }
      } as User);

      addToast("Connexion réussie !");
    } catch (err) {
      console.error(err);
      setLoginError("Erreur de connexion.");
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    localStorage.removeItem('star_community_user_id');
    setCurrentUser(null);
    setSession(null);
  };

  const handleCreatePost = async (p: any) => {
    if (!currentUser || !supabase) return;
    const { error } = await supabase.from('posts').insert({
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      role: currentUser.role,
      title: p.title,
      content: p.content,
      category: p.category,
      attachments: p.attachments || []
    });
    if (error) addToast("Erreur", "error");
    else { addToast("Posté !"); void fetchViewData(currentViewRef.current, true); }
  };

  const sanitizeUserForAdminApi = (user: User) => ({
    id: String(user.id || '').slice(0, 160),
    email: String(user.email || '').trim().toLowerCase().slice(0, 320),
    name: String(user.name || '').trim().slice(0, 160),
    password: user.password ? String(user.password).slice(0, 128) : undefined,
    role: user.role,
    avatar:
      typeof user.avatar === 'string' &&
      !user.avatar.startsWith('data:') &&
      user.avatar.length <= 2048
        ? user.avatar
        : undefined,
    department: String(user.department || '').slice(0, 160),
    company: String(user.company || 'Star Fruits').slice(0, 160),
    birthday: user.birthday ? String(user.birthday).slice(0, 20) : null,
    points: Number(user.points || 0),
    phone: user.phone ? String(user.phone).slice(0, 80) : null,
    job_function: user.job_function ? String(user.job_function).slice(0, 160) : null,
    job_description: user.job_description ? String(user.job_description).slice(0, 4000) : null,
    personal_note: user.personal_note ? String(user.personal_note).slice(0, 2000) : null
  });

  const callAdminUsers = async (
    action: 'create' | 'update' | 'delete' | 'adjust_points' | 'list_orders' | 'mark_order_distributed' | 'delete_order',
    payload: Record<string, any>
  ) => {
    if (!supabase) throw new Error('Supabase non configuré.');

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      throw new Error('Session administrateur introuvable.');
    }

    const requestPayload =
      action === 'delete'
        ? { action, userId: String(payload.userId || '').slice(0, 160) }
        : action === 'adjust_points'
          ? {
              action,
              userId: String(payload.userId || '').slice(0, 160),
              delta: Number(payload.delta || 0)
            }
          : action === 'list_orders'
            ? { action }
            : action === 'mark_order_distributed' || action === 'delete_order'
              ? {
                  action,
                  orderId: String(payload.orderId || '').slice(0, 160)
                }
              : { action, user: sanitizeUserForAdminApi(payload.user as User) };

    const requestBody = JSON.stringify(requestPayload);

    // Cette requête doit rester minuscule. Si ce garde-fou se déclenche,
    // aucune donnée lourde ne part vers Vercel.
    if (new Blob([requestBody]).size > 50_000) {
      throw new Error('La fiche utilisateur contient encore une donnée anormalement volumineuse.');
    }

    const response = await fetch('/api/admin-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: requestBody
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.error) {
      throw new Error(data?.error || 'Erreur du service utilisateurs.');
    }

    return data;
  };

  const refreshUsersAfterAdminAction = async () => {
    loadedViewsRef.current.delete('admin');
    loadedViewsRef.current.delete('equipe');
    localStorage.removeItem('star_community_profiles_cache');
    await fetchViewData('admin', true);
  };

  const handleAddUser = async (user: User) => {
    try {
      await callAdminUsers('create', { user });
      await refreshUsersAfterAdminAction();
      addToast("Utilisateur créé : connexion et profil synchronisés.");
    } catch (error: any) {
      console.error("Erreur création utilisateur :", error);
      addToast(error?.message || "Erreur lors de la création de l'utilisateur.", "error");
      throw error;
    }
  };

  const handleUpdateProfile = async (user: User) => {
    try {
      await callAdminUsers('update', { user });
      await refreshUsersAfterAdminAction();

      if (currentUser?.id === user.id) {
        await fetchUserProfile(user.id);
      }

      addToast("Utilisateur mis à jour.");
    } catch (error: any) {
      console.error("Erreur mise à jour utilisateur :", error);
      addToast(error?.message || "Erreur lors de la mise à jour.", "error");
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await callAdminUsers('delete', { userId });
      await refreshUsersAfterAdminAction();
      addToast("Utilisateur supprimé.");
    } catch (error: any) {
      console.error("Erreur suppression utilisateur :", error);
      addToast(error?.message || "Erreur lors de la suppression.", "error");
    }
  };

  const handleSelfUpdateProfile = async (user: User) => {
    if (!supabase || !currentUser) return;

    try {
      const password = user.password?.trim();

      if (password) {
        if (password.length < 6) {
          throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères.');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password
        });

        if (passwordError) throw passwordError;
      }

      const avatar =
        typeof user.avatar === 'string' && !user.avatar.startsWith('data:')
          ? user.avatar
          : currentUser.avatar;

      const profilePayload = {
        name: user.name,
        email: user.email,
        avatar,
        department: user.department,
        company: user.company,
        birthday: user.birthday || null,
        phone: user.phone || null,
        job_function: user.job_function || null,
        job_description: user.job_description || null,
        personal_note: user.personal_note || null,
        notification_settings: user.notification_settings || null
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', currentUser.id)
        .select('*')
        .single();

      if (error) throw error;

      const updatedUser = {
        ...currentUser,
        ...data,
        password: undefined
      } as User;

      setCurrentUser(updatedUser);
      localStorage.setItem('star_community_user_id', updatedUser.id);
      localStorage.removeItem('star_community_profiles_cache');
      loadedViewsRef.current.delete('equipe');
      loadedViewsRef.current.delete('admin');

      setUsers(previous =>
        previous.map(item => item.id === updatedUser.id ? updatedUser : item)
      );

      addToast('Profil mis à jour.');
    } catch (error: any) {
      console.error('Erreur mise à jour du profil personnel :', error);
      addToast(error?.message || 'Impossible de mettre à jour le profil.', 'error');
      throw error;
    }
  };

  const handleAdjustUserPoints = async (userId: string, delta: number) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      addToast('Action réservée aux administrateurs.', 'error');
      throw new Error('Action réservée aux administrateurs.');
    }

    try {
      const result = await callAdminUsers('adjust_points', { userId, delta });

      setUsers(previous =>
        previous.map(user =>
          user.id === userId
            ? { ...user, points: Number(result.points ?? user.points) }
            : user
        )
      );

      if (currentUser.id === userId) {
        setCurrentUser(previous =>
          previous
            ? { ...previous, points: Number(result.points ?? previous.points) }
            : previous
        );
      }

      localStorage.removeItem('star_community_profiles_cache');
      loadedViewsRef.current.delete('equipe');
      loadedViewsRef.current.delete('engagement');
      loadedViewsRef.current.delete('boutique');

      addToast(
        Number(result.delta || 0) >= 0
          ? `+${Math.abs(Number(result.delta || 0))} points ajoutés.`
          : `${Math.abs(Number(result.delta || 0))} points retirés.`
      );
    } catch (error: any) {
      console.error('Erreur ajustement points :', error);
      addToast(error?.message || 'Impossible de modifier les points.', 'error');
      throw error;
    }
  };

  const handleToggleOrderStatus = async (orderId: string) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      addToast('Action réservée aux administrateurs.', 'error');
      throw new Error('Action réservée aux administrateurs.');
    }

    try {
      const result = await callAdminUsers('mark_order_distributed', { orderId });

      setTransactions(previous =>
        previous.map(transaction =>
          transaction.id === orderId
            ? {
                ...transaction,
                orderStatus: result.orderStatus,
                distributedAt: result.distributedAt || null
              }
            : transaction
        )
      );

      addToast(
        result.orderStatus === 'distributed'
          ? 'Commande marquée comme distribuée.'
          : 'Commande repassée en attente.'
      );
    } catch (error: any) {
      console.error('Erreur statut commande :', error);
      addToast(error?.message || 'Impossible de modifier le statut de la commande.', 'error');
      throw error;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      addToast('Action réservée aux administrateurs.', 'error');
      throw new Error('Action réservée aux administrateurs.');
    }

    try {
      await callAdminUsers('delete_order', { orderId });

      setTransactions(previous =>
        previous.filter(transaction => transaction.id !== orderId)
      );

      addToast('Commande supprimée de l’historique.');
    } catch (error: any) {
      console.error('Erreur suppression commande :', error);
      addToast(error?.message || 'Impossible de supprimer la commande.', 'error');
      throw error;
    }
  };

  const handleUpdateUserRole = async (userId: string, role: UserRole) => {
    const user = users.find(item => item.id === userId);
    if (!user) return;
    await handleUpdateProfile({ ...user, role, password: undefined });
  };

  const renderDashboard = () => {
    const today = new Date();
    const monthlyBirthdays = users.filter(u => u.birthday?.startsWith((today.getMonth() + 1).toString().padStart(2, '0')));
    const welcomeTitle = (appConfig.welcomeTitle || INITIAL_CONFIG.welcomeTitle).replace('{name}', currentUser?.name ? currentUser.name.split(' ')[0] : '');
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0))).slice(0, 2);
    const now = Date.now();
    const publishedHighlights = engagementAnimations.filter(animation => {
      if (animation.status !== 'active') return false;
      const endTime = animation.endDate ? new Date(animation.endDate).getTime() : Number.POSITIVE_INFINITY;
      return Number.isNaN(endTime) || endTime >= now;
    });
    const highlightPriority: Record<string, number> = { advent: 0, raffle: 1, contest: 2, mission: 3, countdown: 4, season: 5 };
    const currentlyActiveHighlights = publishedHighlights.filter(animation => {
      if (!animation.startDate) return true;
      const startTime = new Date(animation.startDate).getTime();
      return Number.isNaN(startTime) || startTime <= now;
    });
    const upcomingHighlights = publishedHighlights
      .filter(animation => {
        if (!animation.startDate) return false;
        const startTime = new Date(animation.startDate).getTime();
        return !Number.isNaN(startTime) && startTime > now;
      })
      .sort((a, b) => new Date(a.startDate || 0).getTime() - new Date(b.startDate || 0).getTime());
    const featuredHighlight = [...currentlyActiveHighlights]
      .sort((a, b) => (highlightPriority[a.type] ?? 99) - (highlightPriority[b.type] ?? 99))[0]
      || upcomingHighlights[0];
    const featuredIsUpcoming = !!featuredHighlight?.startDate && new Date(featuredHighlight.startDate).getTime() > now;
    const highlightLabels: Record<string, string> = { advent: "Calendrier de l’Avent", raffle: 'Tirage au sort', contest: 'Jeu concours', mission: 'Mission ponctuelle', countdown: 'Compte à rebours', season: 'Saison' };
    const highlightIcons: Record<string, string> = { advent: '🎄', raffle: '🎟️', contest: '🏁', mission: '🎯', countdown: '⏳', season: '🏆' };

    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-100 flex-shrink-0 animate-pulse">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">{welcomeTitle}</h1>
            <p className="text-slate-500 md:text-lg font-medium mt-1">{appConfig.welcomeSubtitle || INITIAL_CONFIG.welcomeSubtitle}</p>
          </div>
          {currentUser && (
            <div className="bg-green-600 px-8 py-6 rounded-[32px] text-white shadow-xl flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-green-200">Mes Points</span>
              <span className="text-3xl font-black">{currentUser.points}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Actions rapides</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Messages', color: 'bg-blue-50 text-blue-600', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2-0 01-2-2V6a2 2-0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', action: () => setView('messages') },
                  { label: 'Sondages', color: 'bg-purple-50 text-purple-600', icon: 'M9 12h6m-6 4h6m2 5H7a2 2-0 01-2-2V5a2 2-0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', action: () => setView('sondages') },
                  { label: 'Boutique', color: 'bg-emerald-50 text-emerald-600', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', action: () => setView('boutique') },
                  { label: 'Social', color: 'bg-pink-50 text-pink-600', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', action: () => setView('social') },
                  { label: 'Boîte à idées', color: 'bg-amber-50 text-amber-600', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', action: () => setView('idees') },
                  { label: 'Bien-être', color: 'bg-indigo-50 text-indigo-600', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', action: () => setView('bienetre') }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col items-center justify-center gap-3 hover:border-slate-300 hover:shadow-xl transition-all group active:scale-95"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d={item.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs font-black text-slate-700 text-center uppercase tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {featuredHighlight && (
              <section className="rounded-[32px] overflow-hidden border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-green-50 shadow-sm">
                {featuredHighlight.imageUrl && <img src={featuredHighlight.imageUrl} alt="" className="w-full h-44 object-cover" />}
                <div className="p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-600">{featuredIsUpcoming ? 'Prochainement' : 'En ce moment'}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-3xl">{highlightIcons[featuredHighlight.type] || '✨'}</span>
                        <div>
                          <p className="text-xs font-black text-green-700 uppercase">{highlightLabels[featuredHighlight.type] || 'Temps fort'}</p>
                          <h2 className="text-2xl font-black text-slate-900">{featuredHighlight.title}</h2>
                        </div>
                      </div>
                    </div>
                  </div>
                  {featuredHighlight.description && <p className="text-slate-600 mt-4 line-clamp-2">{featuredHighlight.description}</p>}
                  {featuredIsUpcoming && featuredHighlight.startDate && (
                    <p className="mt-3 text-sm font-bold text-purple-700">
                      Disponible le {new Date(featuredHighlight.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                  <button onClick={() => setView('tempsforts')} className="mt-6 w-full sm:w-auto px-6 py-3 rounded-xl bg-purple-600 text-white font-black hover:bg-purple-700 transition-colors">
                    {featuredIsUpcoming ? 'Voir les temps forts' : featuredHighlight.type === 'advent' ? 'Ouvrir le calendrier' : featuredHighlight.type === 'raffle' ? 'Participer' : 'Découvrir'}
                  </button>
                </div>
              </section>
            )}

            <section className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-800">Activité récente</h2>
                <button onClick={() => setView('social')} className="text-xs font-bold text-green-700 hover:underline">Tout voir</button>
              </div>
              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.slice(0, 3).map(post => (
                    <div key={post.id} className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                      <img src={post.userAvatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm flex-shrink-0" alt="" />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-slate-800 font-bold text-sm leading-snug">
                          {post.userName} <span className="font-normal text-slate-500">dans</span> <span className="text-green-600">#{post.category}</span>
                        </p>
                        <h4 className="text-slate-900 font-black text-base mt-1 line-clamp-1">{post.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-slate-300 italic">Aucune activité récente.</div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm overflow-hidden">
              <h3 className="font-black text-slate-800 mb-6 text-sm uppercase tracking-widest flex items-center gap-2">Agenda</h3>
              {upcomingEvents.length > 0 ? upcomingEvents.map(event => {
                const eventDate = new Date(event.date);
                return (
                  <div
                    key={event.id}
                    className="flex gap-4 items-center group cursor-pointer mb-4 last:mb-0"
                    onClick={() => setView('evenements')}
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 flex-shrink-0 group-hover:bg-green-50 transition-all">
                      <span className="text-[9px] font-black text-slate-400 uppercase leading-none">
                        {eventDate.toLocaleString('fr-FR', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black text-slate-800 font-bold leading-tight">{event.date.split('-')[2]}</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-black text-slate-900 truncate leading-tight group-hover:text-green-700 transition-colors">{event.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate uppercase">{event.startTime} • {event.location}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-center text-slate-300 text-xs py-4 italic">Aucun événement à venir.</p>}
              <button onClick={() => setView('evenements')} className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-all">Tout l'agenda</button>
            </section>

            <section className="bg-[#14532d] rounded-[32px] p-6 shadow-xl text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 text-7xl opacity-10 rotate-12">🎂</div>
              <h3 className="font-black text-white mb-6 text-sm uppercase tracking-widest flex items-center gap-2">Anniversaires</h3>
              <div className="space-y-4">
                {monthlyBirthdays.slice(0, 3).map(user => (
                  <div key={user.id} className="flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-lg" alt="" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-black truncate">{user.name}</p>
                        <p className="text-[10px] text-green-200 font-bold uppercase">{user.birthday?.split('-').reverse().join('/')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setWishingBirthdayForId(user.id); setView('celebrations'); }}
                      className="px-2 py-1 bg-white/10 hover:bg-white text-[9px] font-black uppercase text-white hover:text-green-900 rounded-lg transition-all"
                    >
                      Souhaiter
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setView('celebrations')} className="w-full mt-6 py-3 text-[10px] font-black uppercase tracking-widest text-[#14532d] bg-white hover:bg-green-50 rounded-xl transition-all">Voir tout le mois</button>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!currentUser || !supabase) return null;

    switch (view) {
      case 'admin':
        if (orgEntities.length === 0) void fetchOrganization();
        return (
          <AdminPanel
            users={users}
            // ✅ FIX: Added missing 'games' prop to AdminPanel
            games={games}
            newsletters={newsletters}
            onCreateNewsletter={async (n) => {
              const { error } = await supabase.from('newsletters').insert({
                title: n.title,
                summary: n.summary,
                cover_image: n.coverImage,
                author_name: n.authorName,
                articles: n.articles,
                published_at: new Date().toISOString()
              });
              if (error) { console.error("Erreur insertion newsletter:", error); addToast("Erreur lors de la publication.", "error"); }
              else { addToast("Newsletter publiée."); void fetchViewData(currentViewRef.current, true); }
            }}
            onDeleteNewsletter={async (id) => { await supabase.from('newsletters').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            onUpdateRole={handleUpdateUserRole}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateProfile}
            onAdjustPoints={handleAdjustUserPoints}
            onToggleOrderStatus={handleToggleOrderStatus}
            onDeleteOrder={handleDeleteOrder}
            onDeleteUser={handleDeleteUser}
            posts={posts}
            onDeletePost={async (id) => { await supabase.from('posts').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            ideas={ideas}
            onUpdateIdeaStatus={async (id, s) => { await supabase.from('ideas').update({ status: s }).eq('id', id); addToast("Statut mis à jour."); void fetchViewData(currentViewRef.current, true); }}
            moods={moods}
            wellnessContents={wellnessContents}
            onAddWellnessContent={async (c) => { await supabase.from('wellness_contents').insert({ type: c.type, title: c.title, summary: c.summary, content: c.content, category: c.category, author: c.author, duration: c.duration, media_url: c.mediaUrl }); addToast("Contenu publié."); void fetchViewData(currentViewRef.current, true); }}
            onDeleteWellnessContent={async (id) => { await supabase.from('wellness_contents').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            wellnessChallenges={wellnessChallenges}
            onAddWellnessChallenge={async (c) => { await supabase.from('wellness_challenges').insert({ title: c.title, description: c.description, points: c.points, is_active: false }); addToast("Défi créé."); void fetchViewData(currentViewRef.current, true); }}
            onDeleteWellnessChallenge={async (id) => { await supabase.from('wellness_challenges').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            onToggleWellnessChallenge={async (id) => { const c = wellnessChallenges.find(x => x.id === id); if (c) { await supabase.from('wellness_challenges').update({ is_active: !c.isActive }).eq('id', id); void fetchViewData(currentViewRef.current, true); } }}
            onAddGame={async (g) => {
              const expectedPath = g.learningPath?.trim() || null;
              const expectedLevel = Math.max(1, Number(g.levelNumber || 1));
              const expectedTitle = g.levelTitle?.trim() || null;
              const expectedPassingScore = Math.max(0, Math.min(100, Number(g.passingScore || 0)));

              const { data: createdRows, error: createGameError } = await supabase
                .from('games')
                .insert({
                  title: g.title,
                  description: g.description,
                  type: g.type,
                  category: g.category,
                  difficulty: g.difficulty,
                  duration: g.duration,
                  status: g.status,
                  created_by: g.createdBy,
                  thumbnail: g.thumbnail,
                  reward_points: g.rewardPoints,
                  questions: g.questions,
                  memory_items: g.memoryItems,
                  timeline_items: g.timelineItems,
                  hidden_objects: g.hiddenObjects,
                  hidden_objects_image: g.hiddenObjectsImage,
                  sport_events: g.sportEvents || [],
                  sport_name: g.sportName || 'Football',
                  exact_score_points: g.exactScorePoints || g.rewardPoints || 10,
                  outcome_points: g.outcomePoints ?? 5,
                  learning_path: expectedPath,
                  level_number: expectedLevel,
                  level_title: expectedTitle,
                  passing_score: expectedPassingScore
                })
                .select('id,learning_path,level_number,level_title,passing_score')
                .limit(1);

              if (createGameError) {
                console.error('Erreur création jeu :', createGameError);
                addToast(`Jeu non enregistré : ${createGameError.message}`, 'error');
                throw createGameError;
              }

              const created = createdRows?.[0];
              const savedPath = created?.learning_path?.trim() || null;
              const savedLevel = Number(created?.level_number || 1);
              const savedTitle = created?.level_title?.trim() || null;

              if (
                savedPath !== expectedPath ||
                savedLevel !== expectedLevel ||
                savedTitle !== expectedTitle
              ) {
                console.error('Progression jeu non persistée correctement', {
                  expected: { expectedPath, expectedLevel, expectedTitle, expectedPassingScore },
                  saved: created
                });
                addToast("Le jeu a été créé mais sa progression n'a pas été enregistrée correctement. Vérifiez la migration Supabase.", 'error');
              } else {
                addToast(`Jeu ajouté · Niveau ${savedLevel}${savedTitle ? ` — ${savedTitle}` : ''}`);
              }

              await fetchViewData(currentViewRef.current, true);
            }}
            onUpdateGameProgression={async (id, progression) => {
              const path = progression.learningPath?.trim() || null;
              const level = Math.max(1, Number(progression.levelNumber || 1));
              const title = progression.levelTitle?.trim() || null;
              const passingScore = Math.max(0, Math.min(100, Number(progression.passingScore || 0)));

              const { error } = await supabase
                .from('games')
                .update({
                  learning_path: path,
                  level_number: level,
                  level_title: title,
                  passing_score: passingScore
                })
                .eq('id', id);

              if (error) {
                addToast(`Progression non modifiée : ${error.message}`, 'error');
                throw error;
              }

              addToast('Progression du jeu mise à jour.');
              await fetchViewData(currentViewRef.current, true);
            }}
            onDeleteGame={async (id) => { await supabase.from('games').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            onToggleGameStatus={async (id) => { const g = games.find(x => x.id === id); if (g) { await supabase.from('games').update({ status: g.status === 'Actif' ? 'Inactif' : 'Actif' }).eq('id', id); void fetchViewData(currentViewRef.current, true); } }}
            onSetGameResult={async (id, r) => { await supabase.from('games').update({ result: r, is_processed: true }).eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            onUpdateSportResult={async (gameId, fixtureId, homeScore, awayScore) => {
              const game = games.find(g => g.id === gameId);
              if (!game) return;
              const updatedEvents = (game.sportEvents || []).map(f => f.id === fixtureId ? { ...f, homeScore, awayScore, isFinished: true } : f);
              const { error: gameError } = await supabase.from('games').update({ sport_events: updatedEvents }).eq('id', gameId);
              if (gameError) { addToast('Erreur lors de l’enregistrement du résultat.', 'error'); return; }

              const fixturePredictions = predictions.filter(p => p.gameId === gameId && p.eventId === fixtureId && !p.awarded);
              const outcome = (a: number, b: number) => a === b ? 'Nul' : a > b ? 'A' : 'B';
              for (const prediction of fixturePredictions) {
                if (prediction.homeScore === undefined || prediction.awayScore === undefined || !prediction.id) continue;
                const exact = prediction.homeScore === homeScore && prediction.awayScore === awayScore;
                const correctOutcome = outcome(prediction.homeScore, prediction.awayScore) === outcome(homeScore, awayScore);
                const points = exact ? (game.exactScorePoints || game.rewardPoints || 10) : correctOutcome ? (game.outcomePoints ?? 5) : 0;
                const payload = JSON.stringify({ eventId: fixtureId, homeScore: prediction.homeScore, awayScore: prediction.awayScore, awarded: true, pointsAwarded: points });
                await supabase.from('game_predictions').update({ choice: payload }).eq('id', prediction.id);
                if (points > 0) {
                  const { data: profile } = await supabase.from('profiles').select('points').eq('id', prediction.userId).single();
                  const newPoints = (profile?.points || 0) + points;
                  await supabase.from('profiles').update({ points: newPoints }).eq('id', prediction.userId);
                  await supabase.from('transactions').insert({ user_id: prediction.userId, amount: points, reason: `Pronostic ${exact ? 'score exact' : 'bon résultat'} : ${updatedEvents.find(f => f.id === fixtureId)?.homeTeam} - ${updatedEvents.find(f => f.id === fixtureId)?.awayTeam}`, type: 'earn', date: new Date().toISOString() });
                }
              }
              addToast('Résultat validé et points calculés.');
              void fetchViewData(currentViewRef.current, true);
            }}
            predictions={predictions}
            rewards={rewards}
            onAddReward={async (r) => { await supabase.from('rewards').insert(r); addToast("Récompense ajoutée !"); void fetchViewData(currentViewRef.current, true); }}
            onDeleteReward={async (id) => { await supabase.from('rewards').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            currentUser={currentUser}
            appConfig={appConfig}
            onUpdateConfig={async (cfg) => {
              await supabase.from('app_config').update({
                app_name: cfg.appName,
                app_slogan: cfg.appSlogan,
                logo_url: cfg.logoUrl,
                welcome_title: cfg.welcomeTitle,
                welcome_subtitle: cfg.welcomeSubtitle,
                document_categories: cfg.documentCategories,
                game_categories: cfg.gameCategories
              }).eq('id', 1);
              setAppConfig(cfg);
              addToast("Configuration mise à jour.");
            }}
            onRenameGameCategory={async (oldCategory, newCategory) => {
              const clean = newCategory.trim();
              if (!clean || clean === oldCategory) return;
              const { error: gamesError } = await supabase.from('games').update({ category: clean }).eq('category', oldCategory);
              if (gamesError) throw gamesError;
              const nextCategories = (appConfig.gameCategories || INITIAL_CONFIG.gameCategories).map(category => category === oldCategory ? clean : category);
              const uniqueCategories = [...new Set(nextCategories)];
              const { error: configError } = await supabase.from('app_config').update({ game_categories: uniqueCategories }).eq('id', 1);
              if (configError) throw configError;
              setAppConfig(previous => ({ ...previous, gameCategories: uniqueCategories }));
              setGames(previous => previous.map(game => game.category === oldCategory ? { ...game, category: clean } : game));
              addToast(`Catégorie renommée : ${clean}`);
            }}
            onDeleteGameCategory={async (category, replacementCategory) => {
              const { error: gamesError } = await supabase.from('games').update({ category: replacementCategory }).eq('category', category);
              if (gamesError) throw gamesError;
              const nextCategories = (appConfig.gameCategories || INITIAL_CONFIG.gameCategories).filter(item => item !== category);
              const { error: configError } = await supabase.from('app_config').update({ game_categories: nextCategories }).eq('id', 1);
              if (configError) throw configError;
              setAppConfig(previous => ({ ...previous, gameCategories: nextCategories }));
              setGames(previous => previous.map(game => game.category === category ? { ...game, category: replacementCategory } : game));
              addToast(`Catégorie supprimée. Les jeux concernés ont été reclassés « ${replacementCategory} ».`);
            }}
            engagementAnimations={engagementAnimations}
            onCreateEngagementAnimation={async (animation) => {
              const { error } = await supabase.from('engagement_animations').insert({
                type: animation.type,
                title: animation.title,
                description: animation.description,
                start_date: animation.startDate || null,
                end_date: animation.endDate || null,
                image_url: animation.imageUrl || null,
                points_cost: animation.pointsCost || 0,
                reward_label: animation.rewardLabel || null,
                reward_points: animation.rewardPoints || 0,
                status: animation.status,
                created_by: animation.createdBy,
                config: animation.config || {},
                participants: [],
                winner_ids: []
              });
              if (error) addToast(`Erreur : ${error.message}`, 'error');
              else { addToast('Animation publiée.'); void fetchViewData(currentViewRef.current, true); }
            }}
            onDeleteEngagementAnimation={async (id) => {
              const { error } = await supabase.from('engagement_animations').delete().eq('id', id);
              if (error) addToast(`Erreur : ${error.message}`, 'error');
              else { addToast('Animation supprimée.'); void fetchViewData(currentViewRef.current, true); }
            }}
            onDrawEngagementWinner={async (animation) => {
              const participants = animation.participants || [];
              if (!participants.length) { addToast('Aucun participant.', 'error'); return; }
              const winnerCount = Math.max(1, Number(animation.config?.winnerCount || 1));
              const shuffled = [...participants].sort(() => Math.random() - 0.5);
              const winnerIds = shuffled.slice(0, Math.min(winnerCount, shuffled.length));
              const { error } = await supabase.from('engagement_animations').update({ winner_ids: winnerIds, status: 'closed' }).eq('id', animation.id);
              if (error) addToast(`Erreur : ${error.message}`, 'error');
              else { addToast(`${winnerIds.length} gagnant(s) tiré(s) au sort.`); void fetchViewData(currentViewRef.current, true); }
            }}
            orgEntities={orgEntities}
            orgServices={orgServices}
            orgContacts={orgContacts}
            onAddOrgEntity={async (entity) => { const { error } = await supabase.from('org_entities').insert({ name: entity.name, entity_type: entity.entityType, parent_id: entity.parentId || null, logo_url: entity.logoUrl || null, sort_order: entity.sortOrder, active: entity.active }); if(error){addToast(error.message,'error');throw error;} await fetchOrganization(); }}
            onUpdateOrgEntity={async (id, changes) => { const payload:any={}; if(changes.name!==undefined)payload.name=changes.name;if(changes.entityType!==undefined)payload.entity_type=changes.entityType;if(changes.parentId!==undefined)payload.parent_id=changes.parentId;if(changes.logoUrl!==undefined)payload.logo_url=changes.logoUrl;if(changes.sortOrder!==undefined)payload.sort_order=changes.sortOrder;if(changes.active!==undefined)payload.active=changes.active; const { error }=await supabase.from('org_entities').update(payload).eq('id',id); if(error){addToast(error.message,'error');throw error;} await fetchOrganization(); }}
            onDeleteOrgEntity={async (id) => { const { error }=await supabase.from('org_entities').delete().eq('id',id); if(error){addToast(error.message,'error');throw error;} await fetchOrganization(); }}
            onAddOrgService={async (service) => { const { error }=await supabase.from('org_services').insert({ entity_id:service.entityId,name:service.name,sort_order:service.sortOrder,active:service.active });if(error){addToast(error.message,'error');throw error;}await fetchOrganization(); }}
            onUpdateOrgService={async (id, changes) => { const payload:any={};if(changes.name!==undefined)payload.name=changes.name;if(changes.sortOrder!==undefined)payload.sort_order=changes.sortOrder;if(changes.active!==undefined)payload.active=changes.active;const {error}=await supabase.from('org_services').update(payload).eq('id',id);if(error){addToast(error.message,'error');throw error;}await fetchOrganization(); }}
            onDeleteOrgService={async (id) => { const {error}=await supabase.from('org_services').delete().eq('id',id);if(error){addToast(error.message,'error');throw error;}await fetchOrganization(); }}
            onAddOrgContact={async (contact) => { const {error}=await supabase.from('org_contacts').insert({entity_id:contact.entityId,name:contact.name,email:contact.email,phone:contact.phone,job_title:contact.jobTitle,avatar_url:contact.avatarUrl,about:contact.about,sort_order:contact.sortOrder});if(error){addToast(error.message,'error');throw error;}await fetchOrganization(); }}
            onUpdateOrgContact={async (id, changes) => { const payload:any={};if(changes.name!==undefined)payload.name=changes.name;if(changes.email!==undefined)payload.email=changes.email;if(changes.phone!==undefined)payload.phone=changes.phone;if(changes.jobTitle!==undefined)payload.job_title=changes.jobTitle;if(changes.avatarUrl!==undefined)payload.avatar_url=changes.avatarUrl;if(changes.about!==undefined)payload.about=changes.about;if(changes.sortOrder!==undefined)payload.sort_order=changes.sortOrder;const {error}=await supabase.from('org_contacts').update(payload).eq('id',id);if(error){addToast(error.message,'error');throw error;}await fetchOrganization(); }}
            onDeleteOrgContact={async (id) => { const {error}=await supabase.from('org_contacts').delete().eq('id',id);if(error){addToast(error.message,'error');throw error;}await fetchOrganization(); }}
            transactions={transactions}
          />
        );

      case 'notifications':
        return (
          <NotificationCenter
            notifications={notifications}
            onMarkRead={async (id) => {
              const readAt = new Date().toISOString();
              const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: readAt })
                .eq('id', id)
                .eq('user_id', currentUser.id);

              if (!error) {
                setNotifications(previous =>
                  previous.map(item =>
                    item.id === id ? { ...item, isRead: true, readAt } : item
                  )
                );
              }
            }}
            onMarkAllRead={async () => {
              const readAt = new Date().toISOString();
              const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, read_at: readAt })
                .eq('user_id', currentUser.id)
                .eq('is_read', false);

              if (!error) {
                setNotifications(previous =>
                  previous.map(item =>
                    item.isRead ? item : { ...item, isRead: true, readAt }
                  )
                );
              }
            }}
            onOpen={(notification) => {
              if (notification.linkView) setView(notification.linkView as ViewType);
            }}
          />
        );

      case 'equipe':
        return (
          <TeamView
            users={users}
            entities={orgEntities}
            services={orgServices}
            contacts={orgContacts}
            gamificationStats={publicGamificationStats}
          />
        );

      case 'messages':
        return (
          <MessagesView
            currentUser={currentUser}
            users={users}
            messages={messages}
            onSendMessage={async (rid, text, att) => {
              await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: rid, text, attachments: att || [] });
              void fetchViewData(currentViewRef.current, true);
            }}
          />
        );

      case 'idees':
        return (
          <IdeesView
            currentUser={currentUser}
            ideas={ideas}
            onAddIdea={async (t, d, c) => {
              const { error } = await supabase.from('ideas').insert({
                user_id: currentUser.id,
                user_name: currentUser.name,
                user_avatar: currentUser.avatar,
                title: t,
                description: d,
                category: c,
                votes: [currentUser.id]
              });
              if (error) addToast("Erreur", "error");
              else { addToast("Idée soumise !"); void fetchViewData(currentViewRef.current, true); }
            }}
            onToggleVote={async (id) => {
              const idea = ideas.find(i => i.id === id);
              if (!idea || !supabase) return;
              const nextVotes = idea.votes.includes(currentUser.id) ? idea.votes.filter(v => v !== currentUser.id) : [...idea.votes, currentUser.id];
              await supabase.from('ideas').update({ votes: nextVotes }).eq('id', id);
              void fetchViewData(currentViewRef.current, true);
            }}
            onUpdateStatus={async (id, s) => { if (supabase) await supabase.from('ideas').update({ status: s }).eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            onAddComment={async (id, text) => { if (supabase) await supabase.from('comments').insert({ idea_id: id, user_id: currentUser.id, user_name: currentUser.name, user_avatar: currentUser.avatar, text }); void fetchViewData(currentViewRef.current, true); }}
          />
        );

      case 'documents':
        return (
          <DocumentsView
            currentUser={currentUser}
            documents={documents}
            categories={appConfig.documentCategories || []}
            entities={orgEntities}
            onUpload={async (n, t, size, c, d, audienceCompanies) => {
              if (supabase) await supabase.from('documents').insert({ name: n, type: t, size, category: c, uploaded_by: currentUser.id, uploaded_by_name: currentUser.name, uploaded_at: new Date().toISOString(), data: d, audience_companies: audienceCompanies });
              void fetchViewData(currentViewRef.current, true);
            }}
            onDelete={async (id) => { if (supabase) await supabase.from('documents').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
          />
        );

      case 'sondages':
        return (
          <PollsView
            currentUser={currentUser}
            polls={polls}
            entities={orgEntities}
            onCreatePoll={async (poll) => {
              if (supabase) {
                const { error } = await supabase.from('polls').insert({
                  title: poll.title,
                  description: poll.description,
                  questions: poll.questions,
                  settings: poll.settings,
                  end_date: poll.endDate,
                  created_by: currentUser.id,
                  created_by_name: currentUser.name,
                  target_departments: poll.targetDepartments || [],
                  audience_companies: poll.audienceCompanies || ['ALL'],
                  responses: []
                });
                if (error) { console.error("Erreur insertion poll:", error.message || error); addToast(`Erreur lors de la création : ${error.message || ''}`, "error"); }
                else { addToast("Sondage publié !"); void fetchViewData(currentViewRef.current, true); }
              }
            }}
            onVote={async (pollId, response) => {
              if (supabase) {
                const poll = polls.find(p => p.id === pollId);
                if (poll) {
                  const nextResponses = [...poll.responses, response];
                  const { error } = await supabase.from('polls').update({ responses: nextResponses }).eq('id', pollId);
                  if (error) addToast("Erreur lors du vote", "error");
                  else void fetchViewData(currentViewRef.current, true);
                }
              }
            }}
            onDeletePoll={async (id) => { if (supabase) { await supabase.from('polls').delete().eq('id', id); addToast("Sondage supprimé."); void fetchViewData(currentViewRef.current, true); } }}
          />
        );

      case 'evenements':
        return (
          <EventsView
            currentUser={currentUser}
            events={events}
            onToggleParticipation={async (id) => {
              const ev = events.find(e => e.id === id);
              if (!ev || !supabase) return;
              const next = ev.attendees.includes(currentUser.id) ? ev.attendees.filter(a => a !== currentUser.id) : [...ev.attendees, currentUser.id];
              await supabase.from('events').update({ attendees: next }).eq('id', id);
              void fetchViewData(currentViewRef.current, true);
            }}
            onDeleteEvent={async (id) => { if (supabase) await supabase.from('events').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            onOpenCreateModal={() => setIsEventModalOpen(true)}
          />
        );

      case 'humeur':
        return (
          <MoodView
            currentUser={currentUser}
            moods={moods}
            onAddMood={async (v, c) => { if (supabase) { await supabase.from('moods').insert({ user_id: currentUser.id, value: v, comment: c, department: currentUser.department }); void fetchViewData(currentViewRef.current, true); } }}
          />
        );

      case 'bienetre': return <BienEtreView contents={wellnessContents} challenges={wellnessChallenges} />;

      case 'jeux':
        return (
          <JeuxView
            games={games}
            currentUser={currentUser}
            users={users}
            predictions={predictions}
            completions={gameCompletions}
            categories={appConfig.gameCategories || INITIAL_CONFIG.gameCategories}
            onAddPrediction={async (gameId, eventId, homeScore, awayScore) => {
              const { error } = await supabase.rpc('submit_game_prediction', { p_game_id: gameId, p_event_id: eventId, p_home_score: homeScore, p_away_score: awayScore });
              if (error) { addToast(`Pronostic refusé : ${error.message}`, 'error'); return; }
              addToast('Pronostic enregistré !');
              void fetchViewData(currentViewRef.current, true);
            }}
            onEarnPoints={async (uid, amount, reason, gameId, scorePercent = 100) => {
              if (uid !== currentUser.id) return false;

              const { data, error } = await supabase.rpc('complete_game', {
                p_game_id: gameId,
                p_score_percent: Math.max(0, Math.min(100, Math.round(scorePercent))),
                p_amount: Math.max(0, Math.round(amount)),
                p_reason: reason
              });

              if (error) {
                addToast(`Résultat non enregistré : ${error.message}`, 'error');
                return false;
              }

              const result = typeof data === 'object' && data ? data : {};
              const passed = result.passed === true;
              const awarded = result.awarded === true;

              if (!passed) {
                const required = Number(result.passingScore || 0);
                addToast(`Niveau non validé : ${Math.round(scorePercent)} % obtenu${required ? `, ${required} % requis` : ''}.`, 'info');
              } else if (awarded && amount > 0) {
                addToast(`Niveau validé · +${amount} points !`);
              } else {
                addToast('Niveau validé. Récompense déjà obtenue lors d’une précédente réussite.');
              }

              await Promise.all([
                fetchUserProfile(uid),
                fetchViewData('jeux', true)
              ]);

              return awarded;
            }}
          />
        );

      case 'tempsforts':
      case 'engagement':
        return <EngagementView
          users={users}
          currentUser={currentUser}
          transactions={transactions}
          posts={posts}
          ideas={ideas}
          polls={polls}
          animations={engagementAnimations}
          adventOpenings={adventOpenings}
          games={games}
          predictions={predictions}
          section={view === 'tempsforts' ? 'highlights' : 'rankings'}
          onAddPrediction={async (gameId, eventId, homeScore, awayScore) => {
            const { error } = await supabase.rpc('submit_game_prediction', { p_game_id: gameId, p_event_id: eventId, p_home_score: homeScore, p_away_score: awayScore });
            if (error) { addToast(`Pronostic refusé : ${error.message}`, 'error'); return; }
            addToast('Pronostic enregistré !');
            void fetchViewData(currentViewRef.current, true);
          }}
          onEarnPoints={async (uid, amount, reason) => {
            const { data } = await supabase.from('profiles').select('points').eq('id', uid).single();
            await supabase.from('profiles').update({ points: (data?.points || 0) + amount }).eq('id', uid);
            await supabase.from('transactions').insert({ user_id: uid, amount, reason, type: 'earn', date: new Date().toISOString() });
            fetchUserProfile(uid); void fetchViewData(currentViewRef.current, true);
          }}
          onJoinAnimation={async (animation) => {
            if ((animation.participants || []).includes(currentUser.id)) return;
            const cost = animation.type === 'raffle' ? (animation.pointsCost || 0) : 0;
            if (cost > currentUser.points) { addToast('Vous n’avez pas assez de points.', 'error'); return; }
            const nextParticipants = [...(animation.participants || []), currentUser.id];
            const { error } = await supabase.from('engagement_animations').update({ participants: nextParticipants }).eq('id', animation.id);
            if (error) { addToast(`Erreur : ${error.message}`, 'error'); return; }
            if (cost > 0) {
              const newPoints = currentUser.points - cost;
              await supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id);
              await supabase.from('transactions').insert({ user_id: currentUser.id, amount: cost, reason: `Ticket : ${animation.title}`, type: 'spend' });
              await fetchUserProfile(currentUser.id);
            }
            addToast('Participation enregistrée.'); void fetchViewData(currentViewRef.current, true);
          }}
          onOpenAdventDay={async (animation, dayNumber, outcome = {}) => {
            const day = (animation.config?.days || []).find(
              (item: any) => Number(item.day) === Number(dayNumber)
            );

            if (!day) {
              addToast('Cette case est introuvable dans le calendrier.', 'error');
              return null;
            }

            const buildOpening = (result: any): AdventOpening => ({
              id: result.opening_id || result.id,
              animationId: animation.id,
              userId: currentUser.id,
              dayNumber: Number(dayNumber),
              outcome: result.outcome || {},
              pointsAwarded: Number(result.points_awarded ?? result.pointsAwarded ?? 0),
              openedAt: result.opened_at || result.openedAt || new Date().toISOString()
            });

            const registerOpeningLocally = async (): Promise<AdventOpening | null> => {
              const dayType = day.type || 'gift';
              const receivedAnswer = String(outcome.answer || '').trim();
              const expectedAnswer = String(day.correctAnswer || '').trim();

              let calculatedOutcome: Record<string, any> = { opened: true };
              let pointsAwarded = Math.max(Number(day.rewardPoints || 0), 0);

              if (dayType === 'quiz' || dayType === 'mystery') {
                const isCorrect =
                  expectedAnswer.length > 0 &&
                  expectedAnswer.localeCompare(receivedAnswer, undefined, { sensitivity: 'accent' }) === 0;

                calculatedOutcome = { isCorrect, answer: receivedAnswer };
                if (!isCorrect) pointsAwarded = 0;
              }

              if (dayType === 'instant') {
                const probability = Math.min(Math.max(Number(day.winProbability || 0), 0), 100);
                const instantWin = Math.random() * 100 < probability;
                calculatedOutcome = { instantWin };
                if (!instantWin) pointsAwarded = 0;
              }

              const openingPayload = {
                animation_id: animation.id,
                user_id: currentUser.id,
                day_number: Number(dayNumber),
                outcome: calculatedOutcome,
                points_awarded: pointsAwarded
              };

              const { data: insertedOpening, error: insertError } = await supabase
                .from('advent_openings')
                .insert(openingPayload)
                .select('*')
                .single();

              if (insertError) {
                const duplicate =
                  insertError.code === '23505' ||
                  insertError.message?.toLowerCase().includes('duplicate') ||
                  insertError.message?.toLowerCase().includes('unique');

                if (duplicate) {
                  addToast('Cette case a déjà été ouverte avec votre compte.', 'info');
                } else {
                  addToast(`Impossible d’ouvrir la case : ${insertError.message}`, 'error');
                }
                return null;
              }

              if (pointsAwarded > 0) {
                const newPoints = Number(currentUser.points || 0) + pointsAwarded;

                const [{ error: profileError }, { error: transactionError }] = await Promise.all([
                  supabase.from('profiles').update({ points: newPoints }).eq('id', currentUser.id),
                  supabase.from('transactions').insert({
                    user_id: currentUser.id,
                    amount: pointsAwarded,
                    reason: `Calendrier de l’Avent · jour ${dayNumber} : ${animation.title}`,
                    type: 'earn',
                    date: new Date().toISOString()
                  })
                ]);

                if (profileError) console.error('Mise à jour des points impossible :', profileError);
                if (transactionError) console.error('Historique des points impossible :', transactionError);
              }

              return buildOpening(insertedOpening);
            };

            let opening: AdventOpening | null = null;

            try {
              const { data, error } = await supabase.rpc('open_advent_day', {
                p_animation_id: animation.id,
                p_user_id: currentUser.id,
                p_day_number: Number(dayNumber),
                p_answer: outcome.answer || null
              });

              if (!error) {
                const result = Array.isArray(data) ? data[0] : data;
                if (result) opening = buildOpening(result);
              } else {
                const duplicate =
                  error.code === '23505' ||
                  error.message?.toLowerCase().includes('déjà') ||
                  error.message?.toLowerCase().includes('duplicate');

                if (duplicate) {
                  addToast('Cette case a déjà été ouverte avec votre compte.', 'info');
                  return null;
                }

                // Certaines anciennes bases n'ont pas encore la bonne signature RPC.
                // Le fallback direct conserve alors l'ouverture unique grâce à la contrainte SQL.
                console.warn('RPC open_advent_day indisponible, fallback direct :', error);
                opening = await registerOpeningLocally();
              }
            } catch (rpcException) {
              console.warn('Erreur réseau RPC, fallback direct :', rpcException);
              opening = await registerOpeningLocally();
            }

            if (!opening) {
              addToast('La case n’a pas pu être ouverte. Vérifiez la migration Supabase.', 'error');
              return null;
            }

            setAdventOpenings(previous => [
              opening,
              ...previous.filter(item =>
                !(item.animationId === opening!.animationId && item.dayNumber === opening!.dayNumber)
              )
            ]);

            if (opening.pointsAwarded > 0) {
              addToast(`Case ouverte : +${opening.pointsAwarded} points !`);
              await fetchUserProfile(currentUser.id);
            } else if (opening.outcome?.instantWin === false) {
              addToast('Pas gagné cette fois, mais la case est validée.', 'info');
            } else if (opening.outcome?.isCorrect === false) {
              addToast('Réponse enregistrée. La case est maintenant validée.', 'info');
            } else {
              addToast('Case ouverte !');
            }

            loadedViewsRef.current.delete('tempsforts');
            return opening;
          }}
        />;

      case 'boutique':
        return (
          <BoutiqueView
            currentUser={currentUser}
            rewards={rewards}
            onClaimReward={async (rid) => {
              const rew = rewards.find(r => r.id === rid);

              if (!rew || !supabase) return;

              if (currentUser.points < rew.cost) {
                addToast("Vous n'avez pas assez de points.", "error");
                return;
              }

              if (rew.stock <= 0) {
                addToast("Cette récompense n'est plus disponible.", "error");
                return;
              }

              const orderDate = new Date().toISOString();
              const newPts = currentUser.points - rew.cost;
              const newStock = Math.max(0, rew.stock - 1);

              // 1. Enregistrer d'abord la commande.
              // La colonne `date` est obligatoire dans la table transactions.
              const { data: orderRows, error: orderError } = await supabase
                .from('transactions')
                .insert({
                  user_id: currentUser.id,
                  amount: rew.cost,
                  reason: `Achat : ${rew.title}`,
                  type: 'spend',
                  date: orderDate
                })
                .select('id')
                .limit(1);

              if (orderError) {
                console.error('Erreur enregistrement commande boutique :', orderError);
                addToast(
                  orderError.message || "La commande n'a pas pu être enregistrée.",
                  "error"
                );
                return;
              }

              const createdOrderId = orderRows?.[0]?.id;

              // 2. Décompter les points.
              const { error: pointsError } = await supabase
                .from('profiles')
                .update({ points: newPts })
                .eq('id', currentUser.id);

              if (pointsError) {
                console.error('Erreur décompte points boutique :', pointsError);

                // On supprime la commande créée puisque le débit n'a pas abouti.
                if (createdOrderId) {
                  await supabase.from('transactions').delete().eq('id', createdOrderId);
                }

                addToast(
                  pointsError.message || "Impossible de débiter les points.",
                  "error"
                );
                return;
              }

              // 3. Décompter le stock.
              const { error: stockError } = await supabase
                .from('rewards')
                .update({ stock: newStock })
                .eq('id', rid);

              if (stockError) {
                console.error('Erreur décompte stock boutique :', stockError);

                // Rollback au mieux : restituer les points et retirer la commande.
                await supabase
                  .from('profiles')
                  .update({ points: currentUser.points })
                  .eq('id', currentUser.id);

                if (createdOrderId) {
                  await supabase.from('transactions').delete().eq('id', createdOrderId);
                }

                addToast(
                  stockError.message || "Impossible de mettre à jour le stock.",
                  "error"
                );
                return;
              }

              // Mise à jour locale immédiate.
              setCurrentUser(previous =>
                previous ? { ...previous, points: newPts } : previous
              );
              setRewards(previous =>
                previous.map(item =>
                  item.id === rid ? { ...item, stock: newStock } : item
                )
              );

              addToast(`Commande enregistrée : ${rew.title}`);

              // L'admin devra relire les commandes via l'API sécurisée.
              loadedViewsRef.current.delete('admin');
              loadedViewsRef.current.delete('boutique');

              await fetchUserProfile(currentUser.id);
              void fetchViewData(currentViewRef.current, true);
            }}
            transactions={transactions}
          />
        );

      case 'celebrations':
        return (
          <CelebrationsView
            currentUser={currentUser}
            users={users}
            celebrations={celebrations}
            onAddCelebration={async (c) => {
              if (supabase) {
                const { error } = await supabase.from('celebrations').insert({
                  type: c.type,
                  title: c.title,
                  description: c.description,
                  date: c.date,
                  user_ids: c.userIds,
                  user_name: c.userName,
                  user_avatar: c.userAvatar,
                  created_by: currentUser.id,
                  likes: []
                });
                if (error) { console.error("Erreur insertion célébration:", error); addToast("Erreur lors de la publication.", "error"); }
                else { addToast("Célébration publiée !"); void fetchViewData(currentViewRef.current, true); }
              }
            }}
            onLikeCelebration={async (id) => {
              const cel = celebrations.find(x => x.id === id);
              if (!cel || !supabase) return;
              const next = (cel.likes || []).includes(currentUser.id) ? (cel.likes || []).filter(v => v !== currentUser.id) : [...(cel.likes || []), currentUser.id];
              await supabase.from('celebrations').update({ likes: next }).eq('id', id);
              void fetchViewData(currentViewRef.current, true);
            }}
            onDeleteCelebration={async (id) => { if (supabase) await supabase.from('celebrations').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
            preSelectedUserId={wishingBirthdayForId}
          />
        );

      case 'newsletter': return <NewsletterView currentUser={currentUser} newsletters={newsletters} />;

      case 'social':
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-8">Social</h1>
            <PostCreator currentUser={currentUser} onPostCreated={handleCreatePost} />
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={currentUser.id}
                  currentUserRole={currentUser.role}
                  onDelete={async (id) => { if (supabase) await supabase.from('posts').delete().eq('id', id); void fetchViewData(currentViewRef.current, true); }}
                  onLike={async (id) => {
                    const p = posts.find(x => x.id === id);
                    if (supabase) { await supabase.from('posts').update({ likes: (p?.likes || 0) + 1 }).eq('id', id); void fetchViewData(currentViewRef.current, true); }
                  }}
                  onAddComment={async (id, text) => { if (supabase) { await supabase.from('comments').insert({ post_id: id, user_id: currentUser.id, user_name: currentUser.name, user_avatar: currentUser.avatar, text }); void fetchViewData(currentViewRef.current, true); } }}
                />
              ))}
            </div>
          </div>
        );

      case 'parametres': return <Settings user={currentUser} onSave={handleSelfUpdateProfile} />;

      case 'accueil':
      default:
        return renderDashboard();
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Configuraton Supabase requise</h1>
          <p className="text-slate-400">Configurez vos clés API dans le fichier supabaseClient.ts.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
              t.type === 'success' ? 'bg-green-600 text-white border-green-500'
              : t.type === 'info' ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            <p className="text-sm font-bold">{t.message}</p>
          </div>
        ))}
      </div>

      {!currentUser ? (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8 bg-[#14532d] text-white text-center">
              <h1 className="text-2xl font-bold">{appConfig.appName}</h1>
            </div>

            <form onSubmit={handleAuth} className="p-8 space-y-4">
              <input
                type="email"
                placeholder="E-mail"
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Mot de passe"
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {loginError && <p className="text-red-500 text-xs font-bold text-center">{loginError}</p>}

              <button type="submit" className="w-full bg-[#14532d] text-white py-3 rounded-xl font-bold hover:bg-green-900 transition-all">
                {isSignUp ? "S'inscrire" : "Se connecter"}
              </button>
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="w-full text-green-700 font-bold hover:underline text-sm">
                {isSignUp ? "Se connecter" : "Créer un compte"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
            <span className="font-bold text-slate-800">{appConfig.appName}</span>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          <Sidebar
            currentView={view}
            userRole={currentUser.role}
            setView={setView}
            onLogout={handleLogout}
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
            appConfig={appConfig}
            unreadNotifications={notifications.filter(item => !item.isRead).length}
          />

          <main className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-full overflow-x-hidden">
            {renderContent()}
          </main>

          {isEventModalOpen && (
            <EventCreatorModal
              onClose={() => setIsEventModalOpen(false)}
              onSave={async (e) => {
                if (supabase) {
                  const { error } = await supabase.from('events').insert({
                    type: e.type,
                    title: e.title,
                    description: e.description,
                    location: e.location,
                    date: e.date,
                    start_time: e.startTime,
                    end_time: e.endTime,
                    participants: e.participants,
                    created_by: currentUser.id,
                    attendees: [currentUser.id],
                    audience_companies: e.audienceCompanies || ['ALL']
                  });

                  if (error) {
                    console.error("Erreur création event:", error);
                    addToast("Erreur lors de la création de l'événement.", "error");
                  } else {
                    setIsEventModalOpen(false);
                    addToast("Événement créé avec succès !");
                    void fetchViewData(currentViewRef.current, true);
                  }
                }
              }}
              currentUser={currentUser}
              entities={orgEntities}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
