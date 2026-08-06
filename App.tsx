
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CATEGORIES, DEPARTMENTS, INITIAL_CONFIG } from './constants';
import {
  User, Post, UserRole, Comment, CompanyEvent, Message, Attachment, Idea, IdeaStatus,
  DocumentFile, Poll, PollResponse, MoodEntry, MoodValue, Celebration, Newsletter, AppConfig,
  WellnessContent, WellnessChallenge, CompanyGame, GamePrediction, Reward, PointsTransaction, EngagementAnimation
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
  const [predictions, setPredictions] = useState<GamePrediction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [engagementAnimations, setEngagementAnimations] = useState<EngagementAnimation[]>([]);

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

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
    try {
      const cachedProfiles = localStorage.getItem('star_community_profiles_cache');
      if (cachedProfiles) {
        const parsedProfiles = JSON.parse(cachedProfiles);
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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) {
      setCurrentUser({
        ...data,
        notification_settings: data.notification_settings || {
          email: true, desktop: true, mobile: true, posts: true, events: true, messages: true, birthdays: true, polls: true
        }
      } as User);
    }
    setIsLoading(false);
  };

  const fetchProfilesWithRetry = async (attempts = 3): Promise<User[] | null> => {
    if (!supabase) return null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) return data as User[];

      console.warn(`Chargement des profils échoué (tentative ${attempt}/${attempts})`, error);
      if (attempt < attempts) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    }

    return null;
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
      createdAt: g.created_at,
      createdBy: g.created_by
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

  const fetchCoreData = useCallback(async (force = false) => {
    if (!supabase || (!session && !currentUserRef.current)) return;

    const now = Date.now();
    if (!force && loadedViewsRef.current.has('accueil') && now - lastFullFetchAtRef.current < 60_000) return;

    const [profiles, configResult, postsResult, commentsResult, eventsResult, celebrationsResult, engagementResult] =
      await Promise.all([
        fetchProfilesWithRetry(),
        supabase.from('app_config').select('*').maybeSingle(),
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(12),
        supabase.from('comments').select('*').order('created_at', { ascending: false }).limit(120),
        supabase.from('events').select('*').order('date', { ascending: true }).limit(30),
        supabase.from('celebrations').select('*').order('date', { ascending: false }).limit(60),
        supabase.from('engagement_animations').select('*').order('created_at', { ascending: false }).limit(30)
      ]);

    if (profiles) {
      setUsers(profiles);
      try {
        localStorage.setItem('star_community_profiles_cache', JSON.stringify(profiles));
      } catch {
        // Cache facultatif.
      }
    }

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
      });
    }

    if (postsResult.data) setPosts(mapPosts(postsResult.data, commentsResult.data));
    if (eventsResult.data) setEvents(eventsResult.data.map((e: any) => ({ ...e, startTime: e.start_time, endTime: e.end_time, createdBy: e.created_by })));
    if (celebrationsResult.data) setCelebrations(mapCelebrations(celebrationsResult.data));
    if (engagementResult.data) setEngagementAnimations(mapEngagementAnimations(engagementResult.data));

    loadedViewsRef.current.add('accueil');
    lastFullFetchAtRef.current = Date.now();
  }, [session]);

  const fetchViewData = useCallback(async (targetView: ViewType, force = false) => {
    if (!supabase || (!session && !currentUserRef.current)) return;

    if (targetView === 'accueil') {
      await fetchCoreData(force);
      return;
    }

    if (targetView === 'admin') {
      await fetchAllData(true);
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
            const { data } = await supabase.from('events').select('*').order('date', { ascending: true }).limit(100);
            if (data) setEvents(data.map((e: any) => ({ ...e, startTime: e.start_time, endTime: e.end_time, createdBy: e.created_by })));
            break;
          }

          case 'equipe': {
            const profiles = await fetchProfilesWithRetry();
            if (profiles) setUsers(profiles);
            break;
          }

          case 'messages': {
            const [profiles, messagesResult] = await Promise.all([
              fetchProfilesWithRetry(),
              supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(250)
            ]);
            if (profiles) setUsers(profiles);
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
            const { data } = await supabase.from('documents').select('*').order('uploaded_at', { ascending: false }).limit(100);
            if (data) setDocuments(data.map((d: any) => ({
              ...d,
              uploadedBy: d.uploaded_by,
              uploadedByName: d.uploaded_by_name,
              uploadedAt: d.uploaded_at || d.created_at || new Date().toISOString()
            })) as any);
            break;
          }

          case 'sondages': {
            const { data } = await supabase.from('polls').select('*').order('created_at', { ascending: false }).limit(100);
            if (data) setPolls(data.map((p: any) => ({
              ...p,
              endDate: p.end_date,
              createdBy: p.created_by,
              createdByName: p.created_by_name,
              createdAt: p.created_at,
              targetDepartments: p.target_departments
            })));
            break;
          }

          case 'humeur': {
            const { data } = await supabase.from('moods').select('*').order('created_at', { ascending: false }).limit(120);
            if (data) setMoods(data.map((m: any) => ({ ...m, userId: m.user_id, createdAt: m.created_at })));
            break;
          }

          case 'celebrations': {
            const [profiles, celebrationsResult] = await Promise.all([
              fetchProfilesWithRetry(),
              supabase.from('celebrations').select('*').order('date', { ascending: false }).limit(150)
            ]);
            if (profiles) setUsers(profiles);
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

          case 'jeux': {
            const [gamesResult, predictionsResult] = await Promise.all([
              supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('game_predictions').select('*').order('submitted_at', { ascending: false }).limit(500)
            ]);
            if (gamesResult.data) setGames(mapGames(gamesResult.data));
            if (predictionsResult.data) setPredictions(mapPredictions(predictionsResult.data));
            break;
          }

          case 'boutique': {
            const [rewardsResult, transactionsResult] = await Promise.all([
              supabase.from('rewards').select('*').order('cost', { ascending: true }).limit(100),
              supabase.from('transactions').select('*').order('date', { ascending: false }).limit(400)
            ]);
            if (rewardsResult.data) setRewards(rewardsResult.data as any);
            if (transactionsResult.data) setTransactions(transactionsResult.data.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
            break;
          }

          case 'classements': {
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
            const [engagementResult, gamesResult, predictionsResult, transactionsResult] = await Promise.all([
              supabase.from('engagement_animations').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('games').select('*').order('created_at', { ascending: false }).limit(100),
              supabase.from('game_predictions').select('*').order('submitted_at', { ascending: false }).limit(500),
              supabase.from('transactions').select('*').order('date', { ascending: false }).limit(400)
            ]);
            if (engagementResult.data) setEngagementAnimations(mapEngagementAnimations(engagementResult.data));
            if (gamesResult.data) setGames(mapGames(gamesResult.data));
            if (predictionsResult.data) setPredictions(mapPredictions(predictionsResult.data));
            if (transactionsResult.data) setTransactions(transactionsResult.data.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
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
          localStorage.setItem('star_community_profiles_cache', JSON.stringify(profiles));
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
      if (transData) setTransactions(transData.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
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

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimerRef.current) {
      window.clearTimeout(realtimeRefreshTimerRef.current);
    }

    realtimeRefreshTimerRef.current = window.setTimeout(() => {
      realtimeRefreshTimerRef.current = null;
      const activeView = currentViewRef.current;
      loadedViewsRef.current.delete(activeView);
      void fetchViewData(activeView, true);

      // L'accueil reste léger et actualisé pour les compteurs et le temps fort.
      if (activeView !== 'accueil') {
        loadedViewsRef.current.delete('accueil');
      }
    }, 1200);
  }, [fetchViewData]);

  useEffect(() => {
    if (session || currentUser) {
      void fetchCoreData(true);

      const dataChannel = supabase.channel('global-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload: any) => {
          if (currentUser && payload.new.user_id !== currentUser.id && currentUser.notification_settings?.posts) {
            addToast(`Nouveau post sur le mur social de ${payload.new.user_name} !`, "info");
          }
          scheduleRealtimeRefresh();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'moods' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && currentUser.notification_settings?.events) {
            addToast(`Un nouvel événement a été ajouté à l'agenda : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_challenges' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_contents' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
          if (currentUser && payload.new.receiver_id === currentUser.id && currentUser.notification_settings?.messages) {
            addToast("Vous avez reçu un nouveau message !", "info");
          }
          scheduleRealtimeRefresh();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'engagement_animations' }, () => scheduleRealtimeRefresh())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'newsletters' }, (payload: any) => {
          if (currentUser && currentUser.notification_settings?.posts) {
            addToast(`La nouvelle édition de la newsletter est parue : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'polls' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && currentUser.notification_settings?.polls) {
            addToast(`Nouveau sondage disponible : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'celebrations' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && (currentUser.notification_settings?.posts || currentUser.notification_settings?.birthdays)) {
            addToast(`Une nouvelle célébration a été publiée : ${payload.new.title}`, "info");
          }
          scheduleRealtimeRefresh();
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
                email: true,
                desktop: true,
                mobile: true,
                posts: true,
                events: true,
                messages: true,
                birthdays: true,
                polls: true
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

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        console.error(profileError);
        setLoginError("Profil utilisateur introuvable.");
        return;
      }

      localStorage.setItem('star_community_user_id', profileData.id);

      setCurrentUser({
        ...profileData,
        notification_settings: profileData.notification_settings || {
          email: true,
          desktop: true,
          mobile: true,
          posts: true,
          events: true,
          messages: true,
          birthdays: true,
          polls: true
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

  const handleAddUser = async (user: User) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').insert([{
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      avatar: user.avatar,
      department: user.department,
      company: user.company,
      points: user.points || 0,
      phone: user.phone,
      job_function: user.job_function,
      notification_settings: user.notification_settings
    }]);
    if (error) { console.error("Erreur création profil:", error); addToast("Erreur lors de la création de l'utilisateur.", "error"); }
    else { addToast("Utilisateur ajouté à l'annuaire !"); void fetchViewData(currentViewRef.current, true); }
  };

  const handleUpdateProfile = async (u: User) => {
    if (!supabase) return;
    const { error } = await supabase.from('profiles').update({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      department: u.department,
      company: u.company,
      avatar: u.avatar,
      points: u.points,
      phone: u.phone,
      job_function: u.job_function,
      notification_settings: u.notification_settings
    }).eq('id', u.id);

    if (!error) { addToast("Profil mis à jour."); void fetchViewData(currentViewRef.current, true); fetchUserProfile(u.id); }
    else { console.error("Erreur update profil:", error); addToast("Erreur mise à jour.", "error"); }
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
            onUpdateRole={async (uid, r) => { await supabase.from('profiles').update({ role: r }).eq('id', uid); void fetchViewData(currentViewRef.current, true); }}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateProfile}
            onDeleteUser={async (uid) => { await supabase.from('profiles').delete().eq('id', uid); void fetchViewData(currentViewRef.current, true); }}
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
              await supabase.from('games').insert({
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
                outcome_points: g.outcomePoints ?? 5
              });
              addToast("Jeu ajouté !");
              void fetchViewData(currentViewRef.current, true);
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
                  await supabase.from('transactions').insert({ user_id: prediction.userId, amount: points, reason: `Pronostic ${exact ? 'score exact' : 'bon résultat'} : ${updatedEvents.find(f => f.id === fixtureId)?.homeTeam} - ${updatedEvents.find(f => f.id === fixtureId)?.awayTeam}`, type: 'earn' });
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
                document_categories: cfg.documentCategories
              }).eq('id', 1);
              setAppConfig(cfg);
              addToast("Configuration mise à jour.");
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
            transactions={transactions}
          />
        );

      case 'equipe': return <TeamView users={users} />;

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
            onUpload={async (n, t, s, c, d) => {
              if (supabase) await supabase.from('documents').insert({ name: n, type: t, size: s, category: c, uploaded_by: currentUser.id, uploaded_by_name: currentUser.name, uploaded_at: new Date().toISOString(), data: d });
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
            onAddPrediction={async (gameId, eventId, homeScore, awayScore) => {
              const existing = predictions.find(p => p.userId === currentUser.id && p.gameId === gameId && p.eventId === eventId);
              const payload = JSON.stringify({ eventId, homeScore, awayScore, awarded: false, pointsAwarded: 0 });
              if (existing?.id) {
                await supabase.from('game_predictions').update({ choice: payload, submitted_at: new Date().toISOString() }).eq('id', existing.id);
              } else {
                await supabase.from('game_predictions').insert({ user_id: currentUser.id, game_id: gameId, choice: payload });
              }
              addToast('Pronostic enregistré !');
              void fetchViewData(currentViewRef.current, true);
            }}
            onEarnPoints={async (uid, a, r) => {
              const { data } = await supabase.from('profiles').select('points').eq('id', uid).single();
              const newPts = (data?.points || 0) + a;
              await supabase.from('profiles').update({ points: newPts }).eq('id', uid);
              await supabase.from('transactions').insert({ user_id: uid, amount: a, reason: r, type: 'earn' });
              fetchUserProfile(uid);
              void fetchViewData(currentViewRef.current, true);
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
          games={games}
          predictions={predictions}
          section={view === 'tempsforts' ? 'highlights' : 'rankings'}
          onAddPrediction={async (gameId, eventId, homeScore, awayScore) => {
            const existing = predictions.find(p => p.userId === currentUser.id && p.gameId === gameId && p.eventId === eventId);
            const payload = JSON.stringify({ eventId, homeScore, awayScore, awarded: false, pointsAwarded: 0 });
            if (existing?.id) await supabase.from('game_predictions').update({ choice: payload, submitted_at: new Date().toISOString() }).eq('id', existing.id);
            else await supabase.from('game_predictions').insert({ user_id: currentUser.id, game_id: gameId, choice: payload });
            addToast('Pronostic enregistré !');
            void fetchViewData(currentViewRef.current, true);
          }}
          onEarnPoints={async (uid, amount, reason) => {
            const { data } = await supabase.from('profiles').select('points').eq('id', uid).single();
            await supabase.from('profiles').update({ points: (data?.points || 0) + amount }).eq('id', uid);
            await supabase.from('transactions').insert({ user_id: uid, amount, reason, type: 'earn' });
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
            const days = Array.isArray(animation.config?.days) ? animation.config.days : [];
            const day = days.find((item: any) => Number(item.day) === Number(dayNumber));
            if (!day) { addToast('Case introuvable.', 'error'); return; }
            if ((day.openedBy || []).includes(currentUser.id)) { addToast('Cette case a déjà été ouverte.', 'info'); return; }

            let isCorrect = true;
            if (day.type === 'quiz' || day.type === 'mystery') {
              const expected = String(day.correctAnswer || '').trim().toLocaleLowerCase('fr-FR');
              const received = String(outcome.answer || '').trim().toLocaleLowerCase('fr-FR');
              isCorrect = Boolean(expected) && expected === received;
            }

            const isInstantWinner = day.type === 'instant' ? Boolean(outcome.instantWin) : false;
            const openedBy = [...(day.openedBy || []), currentUser.id];
            const correctBy = isCorrect ? [...(day.correctBy || []), currentUser.id] : (day.correctBy || []);
            const winnerIds = isInstantWinner ? [...(day.winnerIds || []), currentUser.id] : (day.winnerIds || []);
            const updatedDays = days.map((item: any) => Number(item.day) === Number(dayNumber) ? { ...item, openedBy, correctBy, winnerIds } : item);
            const nextParticipants = (animation.participants || []).includes(currentUser.id) ? (animation.participants || []) : [...(animation.participants || []), currentUser.id];
            const nextConfig = { ...(animation.config || {}), days: updatedDays };
            const { error } = await supabase.from('engagement_animations').update({ config: nextConfig, participants: nextParticipants }).eq('id', animation.id);
            if (error) { addToast(`Erreur : ${error.message}`, 'error'); return; }

            let earned = 0;
            if (day.type === 'quiz' || day.type === 'mystery') earned = isCorrect ? Number(day.rewardPoints || 0) : 0;
            else if (day.type === 'instant') earned = isInstantWinner ? Number(day.rewardPoints || 0) : 0;
            else earned = Number(day.rewardPoints || 0);

            if (earned > 0) {
              const { data: profile } = await supabase.from('profiles').select('points').eq('id', currentUser.id).single();
              await supabase.from('profiles').update({ points: (profile?.points || 0) + earned }).eq('id', currentUser.id);
              await supabase.from('transactions').insert({ user_id: currentUser.id, amount: earned, reason: `Calendrier de l’Avent · jour ${dayNumber} : ${animation.title}`, type: 'earn' });
              await fetchUserProfile(currentUser.id);
            }

            if ((day.type === 'quiz' || day.type === 'mystery') && !isCorrect) addToast('Réponse enregistrée, mais ce n’est pas la bonne réponse.', 'info');
            else if (day.type === 'instant' && !isInstantWinner) addToast('Pas gagné cette fois, mais la case est validée.', 'info');
            else addToast(earned > 0 ? `Case ouverte : +${earned} points !` : 'Case ouverte !');
            void fetchViewData(currentViewRef.current, true);
          }}
        />;

      case 'boutique':
        return (
          <BoutiqueView
            currentUser={currentUser}
            rewards={rewards}
            onClaimReward={async (rid) => {
              const rew = rewards.find(r => r.id === rid);
              if (rew && currentUser.points >= rew.cost && supabase) {
                await supabase.from('transactions').insert({ user_id: currentUser.id, amount: rew.cost, reason: `Achat : ${rew.title}`, type: 'spend' });
                const newPts = currentUser.points - rew.cost;
                await supabase.from('profiles').update({ points: newPts }).eq('id', currentUser.id);
                await supabase.from('rewards').update({ stock: Math.max(0, rew.stock - 1) }).eq('id', rid);
                addToast("Récompense réclamée !");
                fetchUserProfile(currentUser.id);
                void fetchViewData(currentViewRef.current, true);
              }
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

      case 'parametres': return <Settings user={currentUser} onSave={handleUpdateProfile} />;

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
                    attendees: [currentUser.id]
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
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
