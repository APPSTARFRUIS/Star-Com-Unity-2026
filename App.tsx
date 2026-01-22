
import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { CATEGORIES, DEPARTMENTS, INITIAL_CONFIG } from './constants';
import {
  User, Post, UserRole, Comment, CompanyEvent, Message, Attachment, Idea, IdeaStatus,
  DocumentFile, Poll, PollResponse, MoodEntry, MoodValue, Celebration, Newsletter, AppConfig,
  WellnessContent, WellnessChallenge, CompanyGame, GamePrediction, Reward, PointsTransaction
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

  const [view, setView] = useState<ViewType>('accueil');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wishingBirthdayForId, setWishingBirthdayForId] = useState<string | undefined>(undefined);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
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

  const fetchAllData = async () => {
    if (!supabase || (!session && !currentUser)) return;

    try {
      const [
        { data: config },
        { data: postsData },
        { data: profiles },
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
        { data: pollsData },
        { data: celebrationsData }
      ] = await Promise.all([
        supabase.from('app_config').select('*').maybeSingle(),
        supabase.from('posts').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('name', { ascending: true }),
        supabase.from('events').select('*').order('date', { ascending: true }),
        supabase.from('ideas').select('*').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').order('uploaded_at', { ascending: false }),
        supabase.from('rewards').select('*').order('cost', { ascending: true }),
        supabase.from('newsletters').select('*').order('published_at', { ascending: false }),
        supabase.from('comments').select('*'),
        supabase.from('moods').select('*').order('created_at', { ascending: false }),
        supabase.from('wellness_contents').select('*').order('created_at', { ascending: false }),
        supabase.from('wellness_challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('games').select('*').order('created_at', { ascending: false }),
        supabase.from('polls').select('*').order('created_at', { ascending: false }),
        supabase.from('celebrations').select('*').order('date', { ascending: false })
      ]);

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

      if (profiles) setUsers(profiles as any);
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
      if (docsData) setDocuments(docsData as any);
      if (rewardsData) setRewards(rewardsData as any);
      if (newsData) setNewsletters(newsData.map((n: any) => ({ ...n, coverImage: n.cover_image, publishedAt: n.published_at, authorName: n.author_name, readCount: n.read_count, articles: n.articles })));
      if (moodsData) setMoods(moodsData.map((m: any) => ({ ...m, userId: m.user_id, createdAt: m.created_at })));
      if (wellContentsData) setWellnessContents(wellContentsData.map((c: any) => ({ ...c, mediaUrl: c.media_url, createdAt: c.created_at })));
      if (challengesData) setWellnessChallenges(challengesData.map((c: any) => ({ ...c, isActive: c.is_active })));
      if (messagesData) setMessages(messagesData.map((m: any) => ({ ...m, senderId: m.sender_id, receiverId: m.receiver_id, createdAt: m.created_at })));
      if (transData) setTransactions(transData.map((t: any) => ({ ...t, userId: t.user_id, date: t.date })));
      if (gamesData) setGames(gamesData.map((g: any) => ({
        ...g,
        rewardPoints: g.reward_points,
        questions: g.questions,
        memoryItems: g.memory_items,
        timelineItems: g.timeline_items,
        hiddenObjects: g.hidden_objects,
        hiddenObjectsImage: g.hidden_objects_image,
        matchDate: g.match_date,
        isProcessed: g.is_processed,
        createdAt: g.created_at,
        createdBy: g.created_by
      })));
      if (pollsData) setPolls(pollsData.map((p: any) => ({
        ...p,
        endDate: p.end_date,
        createdBy: p.created_by,
        createdByName: p.created_by_name,
        createdAt: p.created_at,
        targetDepartments: p.target_departments
      })));
      if (celebrationsData) setCelebrations(celebrationsData.map((c: any) => ({
        ...c,
        userIds: c.user_ids || [],
        userName: c.user_name || 'Collaborateur',
        userAvatar: c.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.id}`,
        createdBy: c.created_by,
        likes: Array.isArray(c.likes) ? c.likes : []
      })));
    } catch (err) {
      console.error("Erreur chargement données:", err);
    }
  };

  useEffect(() => {
    if (session || currentUser) {
      fetchAllData();

      const dataChannel = supabase.channel('global-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, (payload: any) => {
          if (currentUser && payload.new.user_id !== currentUser.id && currentUser.notification_settings?.posts) {
            addToast(`Nouveau post sur le mur social de ${payload.new.user_name} !`, "info");
          }
          fetchAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'moods' }, () => fetchAllData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && currentUser.notification_settings?.events) {
            addToast(`Un nouvel événement a été ajouté à l'agenda : ${payload.new.title}`, "info");
          }
          fetchAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_challenges' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wellness_contents' }, () => fetchAllData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
          if (currentUser && payload.new.receiver_id === currentUser.id && currentUser.notification_settings?.messages) {
            addToast("Vous avez reçu un nouveau message !", "info");
          }
          fetchAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rewards' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => fetchAllData())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'newsletters' }, (payload: any) => {
          if (currentUser && currentUser.notification_settings?.posts) {
            addToast(`La nouvelle édition de la newsletter est parue : ${payload.new.title}`, "info");
          }
          fetchAllData();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'polls' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && currentUser.notification_settings?.polls) {
            addToast(`Nouveau sondage disponible : ${payload.new.title}`, "info");
          }
          fetchAllData();
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'celebrations' }, (payload: any) => {
          if (currentUser && payload.new.created_by !== currentUser.id && (currentUser.notification_settings?.posts || currentUser.notification_settings?.birthdays)) {
            addToast(`Une nouvelle célébration a été publiée : ${payload.new.title}`, "info");
          }
          fetchAllData();
        })
        .subscribe();

      return () => { supabase.removeChannel(dataChannel); };
    }
  }, [session, currentUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    setLoginError('');

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: email.split('@')[0], avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` } }
      });
      if (error) setLoginError(error.message);
      else addToast("Compte créé !");
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (!authError) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .maybeSingle();

      if (profileData) {
        localStorage.setItem('star_community_user_id', profileData.id);
        setCurrentUser({
          ...profileData,
          notification_settings: profileData.notification_settings || {
            email: true, desktop: true, mobile: true, posts: true, events: true, messages: true, birthdays: true, polls: true
          }
        } as User);
        addToast("Connexion réussie !");
      } else {
        setLoginError("Identifiants incorrects.");
      }
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
    else { addToast("Posté !"); fetchAllData(); }
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
    else { addToast("Utilisateur ajouté à l'annuaire !"); fetchAllData(); }
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

    if (!error) { addToast("Profil mis à jour."); fetchAllData(); fetchUserProfile(u.id); }
    else { console.error("Erreur update profil:", error); addToast("Erreur mise à jour.", "error"); }
  };

  const renderDashboard = () => {
    const today = new Date();
    const monthlyBirthdays = users.filter(u => u.birthday?.startsWith((today.getMonth() + 1).toString().padStart(2, '0')));
    const welcomeTitle = (appConfig.welcomeTitle || INITIAL_CONFIG.welcomeTitle).replace('{name}', currentUser?.name ? currentUser.name.split(' ')[0] : '');
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0))).slice(0, 2);

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
              else { addToast("Newsletter publiée."); fetchAllData(); }
            }}
            onDeleteNewsletter={async (id) => { await supabase.from('newsletters').delete().eq('id', id); fetchAllData(); }}
            onUpdateRole={async (uid, r) => { await supabase.from('profiles').update({ role: r }).eq('id', uid); fetchAllData(); }}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateProfile}
            onDeleteUser={async (uid) => { await supabase.from('profiles').delete().eq('id', uid); fetchAllData(); }}
            posts={posts}
            onDeletePost={async (id) => { await supabase.from('posts').delete().eq('id', id); fetchAllData(); }}
            ideas={ideas}
            onUpdateIdeaStatus={async (id, s) => { await supabase.from('ideas').update({ status: s }).eq('id', id); addToast("Statut mis à jour."); fetchAllData(); }}
            moods={moods}
            wellnessContents={wellnessContents}
            onAddWellnessContent={async (c) => { await supabase.from('wellness_contents').insert({ type: c.type, title: c.title, summary: c.summary, content: c.content, category: c.category, author: c.author, duration: c.duration, media_url: c.mediaUrl }); addToast("Contenu publié."); fetchAllData(); }}
            onDeleteWellnessContent={async (id) => { await supabase.from('wellness_contents').delete().eq('id', id); fetchAllData(); }}
            wellnessChallenges={wellnessChallenges}
            onAddWellnessChallenge={async (c) => { await supabase.from('wellness_challenges').insert({ title: c.title, description: c.description, points: c.points, is_active: false }); addToast("Défi créé."); fetchAllData(); }}
            onDeleteWellnessChallenge={async (id) => { await supabase.from('wellness_challenges').delete().eq('id', id); fetchAllData(); }}
            onToggleWellnessChallenge={async (id) => { const c = wellnessChallenges.find(x => x.id === id); if (c) { await supabase.from('wellness_challenges').update({ is_active: !c.isActive }).eq('id', id); fetchAllData(); } }}
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
                hidden_objects_image: g.hiddenObjectsImage
              });
              addToast("Jeu ajouté !");
              fetchAllData();
            }}
            onDeleteGame={async (id) => { await supabase.from('games').delete().eq('id', id); fetchAllData(); }}
            onToggleGameStatus={async (id) => { const g = games.find(x => x.id === id); if (g) { await supabase.from('games').update({ status: g.status === 'Actif' ? 'Inactif' : 'Actif' }).eq('id', id); fetchAllData(); } }}
            onSetGameResult={async (id, r) => { await supabase.from('games').update({ result: r, is_processed: true }).eq('id', id); fetchAllData(); }}
            predictions={predictions}
            rewards={rewards}
            onAddReward={async (r) => { await supabase.from('rewards').insert(r); addToast("Récompense ajoutée !"); fetchAllData(); }}
            onDeleteReward={async (id) => { await supabase.from('rewards').delete().eq('id', id); fetchAllData(); }}
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
              fetchAllData();
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
              else { addToast("Idée soumise !"); fetchAllData(); }
            }}
            onToggleVote={async (id) => {
              const idea = ideas.find(i => i.id === id);
              if (!idea || !supabase) return;
              const nextVotes = idea.votes.includes(currentUser.id) ? idea.votes.filter(v => v !== currentUser.id) : [...idea.votes, currentUser.id];
              await supabase.from('ideas').update({ votes: nextVotes }).eq('id', id);
              fetchAllData();
            }}
            onUpdateStatus={async (id, s) => { if (supabase) await supabase.from('ideas').update({ status: s }).eq('id', id); fetchAllData(); }}
            onAddComment={async (id, text) => { if (supabase) await supabase.from('comments').insert({ idea_id: id, user_id: currentUser.id, user_name: currentUser.name, user_avatar: currentUser.avatar, text }); fetchAllData(); }}
          />
        );

      case 'documents':
        return (
          <DocumentsView
            currentUser={currentUser}
            documents={documents}
            categories={appConfig.documentCategories || []}
            onUpload={async (n, t, s, c, d) => {
              if (supabase) await supabase.from('documents').insert({ name: n, type: t, size: s, category: c, uploaded_by: currentUser.id, uploaded_by_name: currentUser.name, data: d });
              fetchAllData();
            }}
            onDelete={async (id) => { if (supabase) await supabase.from('documents').delete().eq('id', id); fetchAllData(); }}
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
                  target_departments: poll.targetDepartments,
                  responses: []
                });
                if (error) { console.error("Erreur insertion poll:", error.message || error); addToast(`Erreur lors de la création : ${error.message || ''}`, "error"); }
                else { addToast("Sondage publié !"); fetchAllData(); }
              }
            }}
            onVote={async (pollId, response) => {
              if (supabase) {
                const poll = polls.find(p => p.id === pollId);
                if (poll) {
                  const nextResponses = [...poll.responses, response];
                  const { error } = await supabase.from('polls').update({ responses: nextResponses }).eq('id', pollId);
                  if (error) addToast("Erreur lors du vote", "error");
                  else fetchAllData();
                }
              }
            }}
            onDeletePoll={async (id) => { if (supabase) { await supabase.from('polls').delete().eq('id', id); addToast("Sondage supprimé."); fetchAllData(); } }}
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
              fetchAllData();
            }}
            onDeleteEvent={async (id) => { if (supabase) await supabase.from('events').delete().eq('id', id); fetchAllData(); }}
            onOpenCreateModal={() => setIsEventModalOpen(true)}
          />
        );

      case 'humeur':
        return (
          <MoodView
            currentUser={currentUser}
            moods={moods}
            onAddMood={async (v, c) => { if (supabase) { await supabase.from('moods').insert({ user_id: currentUser.id, value: v, comment: c, department: currentUser.department }); fetchAllData(); } }}
          />
        );

      case 'bienetre': return <BienEtreView contents={wellnessContents} challenges={wellnessChallenges} />;

      case 'jeux':
        return (
          <JeuxView
            games={games}
            currentUser={currentUser}
            predictions={predictions}
            onAddPrediction={() => {}}
            onEarnPoints={async (uid, a, r) => {
              const { data } = await supabase.from('profiles').select('points').eq('id', uid).single();
              const newPts = (data?.points || 0) + a;
              await supabase.from('profiles').update({ points: newPts }).eq('id', uid);
              await supabase.from('transactions').insert({ user_id: uid, amount: a, reason: r, type: 'earn' });
              fetchUserProfile(uid);
              fetchAllData();
            }}
          />
        );

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
                fetchAllData();
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
                else { addToast("Célébration publiée !"); fetchAllData(); }
              }
            }}
            onLikeCelebration={async (id) => {
              const cel = celebrations.find(x => x.id === id);
              if (!cel || !supabase) return;
              const next = (cel.likes || []).includes(currentUser.id) ? (cel.likes || []).filter(v => v !== currentUser.id) : [...(cel.likes || []), currentUser.id];
              await supabase.from('celebrations').update({ likes: next }).eq('id', id);
              fetchAllData();
            }}
            onDeleteCelebration={async (id) => { if (supabase) await supabase.from('celebrations').delete().eq('id', id); fetchAllData(); }}
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
                  onDelete={async (id) => { if (supabase) await supabase.from('posts').delete().eq('id', id); fetchAllData(); }}
                  onLike={async (id) => {
                    const p = posts.find(x => x.id === id);
                    if (supabase) { await supabase.from('posts').update({ likes: (p?.likes || 0) + 1 }).eq('id', id); fetchAllData(); }
                  }}
                  onAddComment={async (id, text) => { if (supabase) { await supabase.from('comments').insert({ post_id: id, user_id: currentUser.id, user_name: currentUser.name, user_avatar: currentUser.avatar, text }); fetchAllData(); } }}
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
                    fetchAllData();
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
