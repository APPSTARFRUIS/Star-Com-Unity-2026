
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
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbErrorDetail, setDbErrorDetail] = useState<string | null>(null);

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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
         setDbErrorDetail("Profil introuvable. Avez-vous créé les tables SQL ?");
         return;
      }
      if (data) {
        setCurrentUser({ ...data } as User);
      } else {
        // Si session auth existe mais pas de profil public, on crée un profil par défaut (mode dev rapide)
        const { error: createError } = await supabase.from('profiles').insert({
          id: userId,
          email: session?.user?.email,
          name: session?.user?.email?.split('@')[0] || 'Nouvel Utilisateur',
          role: 'UTILISATEUR',
          points: 0
        });
        if (!createError) fetchUserProfile(userId);
      }
    } catch (e) {
      console.warn("Erreur profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const safeFetch = async (tableName: string, query: any) => {
    try {
      const { data, error } = await query;
      if (error) {
        console.warn(`Table [${tableName}] inaccessible: ${error.message}`);
        if (error.code === '42P01') { // Table does not exist
           setDbErrorDetail(`La table "${tableName}" est manquante. Exécutez le script SQL.`);
        }
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  };

  const fetchAllData = async () => {
    if (!supabase) return;
    setDbErrorDetail(null);
    
    // Chargement parallèle
    const [
      configData,
      postsData,
      profilesData,
      eventsData,
      ideasData,
      docsData,
      newsData,
      moodsData,
      gamesData,
      pollsData,
      celebrationsData
    ] = await Promise.all([
      supabase.from('app_config').select('*').maybeSingle(),
      safeFetch('posts', supabase.from('posts').select('*').order('created_at', { ascending: false })),
      safeFetch('profiles', supabase.from('profiles').select('*').order('name', { ascending: true })),
      safeFetch('events', supabase.from('events').select('*')),
      safeFetch('ideas', supabase.from('ideas').select('*')),
      safeFetch('documents', supabase.from('documents').select('*')),
      safeFetch('newsletters', supabase.from('newsletters').select('*')),
      safeFetch('moods', supabase.from('moods').select('*')),
      safeFetch('games', supabase.from('games').select('*')),
      safeFetch('polls', supabase.from('polls').select('*')),
      safeFetch('celebrations', supabase.from('celebrations').select('*'))
    ]);

    if (configData?.data) setAppConfig({ ...INITIAL_CONFIG, ...configData.data });
    if (profilesData) setUsers(profilesData as any);
    if (postsData) setPosts(postsData.map((p: any) => ({ ...p, comments: [] })));
    if (eventsData) setEvents(eventsData as any);
    if (ideasData) setIdeas(ideasData as any);
    if (docsData) setDocuments(docsData as any);
    if (newsData) setNewsletters(newsData as any);
    if (moodsData) setMoods(moodsData as any);
    if (gamesData) setGames(gamesData as any);
    if (pollsData) setPolls(pollsData as any);
    if (celebrationsData) setCelebrations(celebrationsData as any);
  };

  useEffect(() => {
    if (session || currentUser) {
      fetchAllData();
    }
  }, [session, currentUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoginError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setLoginError("Identifiants incorrects ou table SQL non configurée.");
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSession(null);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div></div>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {!currentUser ? (
        <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-8 bg-[#14532d] text-white text-center"><h1 className="text-2xl font-bold">{appConfig.appName}</h1></div>
            <form onSubmit={handleAuth} className="p-8 space-y-4">
              {dbErrorDetail && <div className="bg-red-50 p-3 rounded-lg text-red-600 text-[10px] font-bold uppercase leading-tight mb-4">Erreur Base de Données : {dbErrorDetail}</div>}
              <input type="email" placeholder="E-mail" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Mot de passe" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={password} onChange={(e) => setPassword(e.target.value)} />
              {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
              <button type="submit" className="w-full bg-[#14532d] text-white py-3 rounded-xl font-bold hover:bg-green-900 transition-all">Se connecter</button>
              <p className="text-[10px] text-slate-400 text-center mt-4">Si vous n'avez pas encore de compte, demandez à un administrateur ou créez un utilisateur dans Auth > Users sur Supabase.</p>
            </form>
          </div>
        </div>
      ) : (
        <>
          <Sidebar currentView={view} userRole={currentUser.role} setView={setView} onLogout={handleLogout} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} appConfig={appConfig} />
          <main className="flex-1 md:ml-64 p-4 md:p-8">
            {dbErrorDetail && (
              <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-amber-800">
                <p className="text-xs font-bold uppercase">Problème de table : {dbErrorDetail}</p>
                <button onClick={fetchAllData} className="px-4 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-black">Réactualiser</button>
              </div>
            )}
            {view === 'accueil' && (
               <div className="max-w-4xl mx-auto space-y-6 text-left">
                  <h1 className="text-3xl font-black text-slate-800">Bienvenue, {currentUser.name} !</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-4">Mes Points</h3>
                        <p className="text-4xl font-black text-green-600">{currentUser.points} pts</p>
                     </div>
                     <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="font-bold text-slate-400 uppercase text-[10px] tracking-widest mb-4">Service</h3>
                        <p className="text-xl font-bold text-slate-800">{currentUser.department || 'Non défini'}</p>
                     </div>
                  </div>
                  <div className="pt-8">
                     <h2 className="text-xl font-bold text-slate-800 mb-4">Dernières publications</h2>
                     <div className="space-y-6">
                        {posts.length > 0 ? posts.slice(0, 3).map(p => <PostCard key={p.id} post={p} currentUserId={currentUser.id} currentUserRole={currentUser.role} onDelete={() => {}} onLike={() => {}} onAddComment={() => {}} />) : <p className="text-slate-400 italic">Aucune publication.</p>}
                     </div>
                  </div>
               </div>
            )}
            {view === 'social' && (
               <div className="max-w-3xl mx-auto space-y-8">
                 <PostCreator currentUser={currentUser} onPostCreated={async (p) => { await supabase.from('posts').insert({...p, user_id: currentUser.id, user_name: currentUser.name, user_avatar: currentUser.avatar}); fetchAllData(); }} />
                 <div className="space-y-6">{posts.map(p => <PostCard key={p.id} post={p} currentUserId={currentUser.id} currentUserRole={currentUser.role} onDelete={() => {}} onLike={() => {}} onAddComment={() => {}} />)}</div>
               </div>
            )}
            {view === 'admin' && <AdminPanel users={users} posts={posts} ideas={ideas} moods={moods} newsletters={newsletters} wellnessContents={wellnessContents} wellnessChallenges={wellnessChallenges} games={games} predictions={predictions} rewards={rewards} currentUser={currentUser} appConfig={appConfig} onUpdateConfig={async (cfg) => { await supabase.from('app_config').update(cfg).eq('id', 1); setAppConfig(cfg); }} transactions={transactions} onUpdateRole={async (id, r) => { await supabase.from('profiles').update({role: r}).eq('id', id); fetchAllData(); }} onDeleteUser={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} onDeletePost={() => {}} onUpdateIdeaStatus={() => {}} onCreateNewsletter={() => {}} onDeleteNewsletter={() => {}} onAddWellnessContent={() => {}} onDeleteWellnessContent={() => {}} onAddWellnessChallenge={() => {}} onDeleteWellnessChallenge={() => {}} onToggleWellnessChallenge={() => {}} onAddGame={() => {}} onDeleteGame={() => {}} onToggleGameStatus={() => {}} onSetGameResult={() => {}} onAddReward={() => {}} onDeleteReward={() => {}} />}
            {view === 'equipe' && <TeamView users={users} />}
            {view === 'messages' && <MessagesView currentUser={currentUser} users={users} messages={messages} onSendMessage={async (rid, t, a) => { await supabase.from('messages').insert({sender_id: currentUser.id, receiver_id: rid, text: t, attachments: a || []}); fetchAllData(); }} />}
            {view === 'idees' && <IdeesView currentUser={currentUser} ideas={ideas} onAddIdea={async (t, d, c) => { await supabase.from('ideas').insert({user_id: currentUser.id, user_name: currentUser.name, user_avatar: currentUser.avatar, title: t, description: d, category: c, votes: []}); fetchAllData(); }} onToggleVote={() => {}} onUpdateStatus={() => {}} onAddComment={() => {}} />}
            {view === 'documents' && <DocumentsView currentUser={currentUser} documents={documents} categories={appConfig.documentCategories} onUpload={() => {}} onDelete={() => {}} />}
            {view === 'sondages' && <PollsView currentUser={currentUser} polls={polls} onCreatePoll={() => {}} onVote={() => {}} onDeletePoll={() => {}} />}
            {view === 'evenements' && <EventsView currentUser={currentUser} events={events} onToggleParticipation={() => {}} onOpenCreateModal={() => setIsEventModalOpen(true)} onDeleteEvent={() => {}} />}
            {view === 'humeur' && <MoodView currentUser={currentUser} moods={moods} onAddMood={async (v, c) => { await supabase.from('moods').insert({user_id: currentUser.id, value: v, comment: c, department: currentUser.department}); fetchAllData(); }} />}
            {view === 'celebrations' && <CelebrationsView currentUser={currentUser} users={users} celebrations={celebrations} onAddCelebration={async (c) => { await supabase.from('celebrations').insert({...c, created_by: currentUser.id}); fetchAllData(); }} onLikeCelebration={() => {}} onDeleteCelebration={() => {}} preSelectedUserId={wishingBirthdayForId} />}
            {view === 'newsletter' && <NewsletterView currentUser={currentUser} newsletters={newsletters} />}
            {view === 'bienetre' && <BienEtreView contents={wellnessContents} challenges={wellnessChallenges} />}
            {view === 'jeux' && <JeuxView games={games} currentUser={currentUser} predictions={predictions} onAddPrediction={() => {}} onEarnPoints={() => {}} />}
            {view === 'boutique' && <BoutiqueView currentUser={currentUser} rewards={rewards} onClaimReward={() => {}} transactions={transactions} />}
            {view === 'parametres' && <Settings user={currentUser} onSave={async (u) => { await supabase.from('profiles').update(u).eq('id', u.id); fetchAllData(); }} />}
          </main>
          {isEventModalOpen && <EventCreatorModal onClose={() => setIsEventModalOpen(false)} onSave={async (e) => { await supabase.from('events').insert({...e, created_by: currentUser.id, attendees: []}); setIsEventModalOpen(false); fetchAllData(); }} currentUser={currentUser} />}
        </>
      )}
    </div>
  );
};

export default App;
