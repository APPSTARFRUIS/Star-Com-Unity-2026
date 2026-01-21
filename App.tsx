
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
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
         console.warn("Profil erreur fetch:", error);
         setDbErrorDetail(`Impossible de lire votre profil (Erreur ${error.code}).`);
         return;
      }
      if (data) {
        setCurrentUser({ ...data } as User);
      } else if (session) {
        const { error: createError } = await supabase.from('profiles').insert({
          id: userId,
          email: session.user.email,
          name: session.user.email.split('@')[0],
          role: 'UTILISATEUR', 
          points: 100,
          company: 'Star fruits',
          department: 'Service Communication'
        });
        if (!createError) fetchUserProfile(userId);
      }
    } catch (e) {
      console.error("Erreur critique profil.");
    } finally {
      setIsLoading(false);
    }
  };

  const safeFetch = async (tableName: string, query: any) => {
    try {
      const { data, error } = await query;
      if (error) {
        console.warn(`Table [${tableName}] inaccessible: ${error.message}`);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  };

  const fetchAllData = async () => {
    if (!supabase || !currentUser) return;
    setDbErrorDetail(null);
    
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
      celebrationsData,
      wellContentsData,
      challengesData,
      transactionsData,
      rewardsData,
      messagesData
    ] = await Promise.all([
      supabase.from('app_config').select('*').maybeSingle(),
      safeFetch('posts', supabase.from('posts').select('*').order('created_at', { ascending: false })),
      safeFetch('profiles', supabase.from('profiles').select('*').order('name', { ascending: true })),
      safeFetch('events', supabase.from('events').select('*').order('date', { ascending: true })),
      safeFetch('ideas', supabase.from('ideas').select('*').order('created_at', { ascending: false })),
      safeFetch('documents', supabase.from('documents').select('*').order('uploaded_at', { ascending: false })),
      safeFetch('newsletters', supabase.from('newsletters').select('*').order('published_at', { ascending: false })),
      safeFetch('moods', supabase.from('moods').select('*').order('created_at', { ascending: false })),
      safeFetch('games', supabase.from('games').select('*').order('created_at', { ascending: false })),
      safeFetch('polls', supabase.from('polls').select('*').order('created_at', { ascending: false })),
      safeFetch('celebrations', supabase.from('celebrations').select('*').order('date', { ascending: false })),
      safeFetch('wellness_contents', supabase.from('wellness_contents').select('*').order('created_at', { ascending: false })),
      safeFetch('wellness_challenges', supabase.from('wellness_challenges').select('*')),
      safeFetch('transactions', supabase.from('transactions').select('*').order('date', { ascending: false })),
      safeFetch('rewards', supabase.from('rewards').select('*').order('cost', { ascending: true })),
      safeFetch('messages', supabase.from('messages').select('*').order('created_at', { ascending: true }))
    ]);

    if (configData?.data) setAppConfig({ ...INITIAL_CONFIG, ...configData.data });
    if (profilesData) setUsers(profilesData as User[]);
    if (postsData) setPosts(postsData.map((p: any) => ({ ...p, createdAt: p.created_at, userId: p.user_id, userName: p.user_name, userAvatar: p.user_avatar })));
    if (eventsData) setEvents(eventsData as CompanyEvent[]);
    if (ideasData) setIdeas(ideasData as Idea[]);
    if (docsData) setDocuments(docsData as DocumentFile[]);
    if (newsData) setNewsletters(newsData as Newsletter[]);
    if (moodsData) setMoods(moodsData as MoodEntry[]);
    if (gamesData) setGames(gamesData as CompanyGame[]);
    if (pollsData) setPolls(pollsData as Poll[]);
    if (celebrationsData) setCelebrations(celebrationsData.map((c: any) => ({ ...c, likes: Array.isArray(c.likes) ? c.likes : [] })));
    if (wellContentsData) setWellnessContents(wellContentsData as WellnessContent[]);
    if (challengesData) setWellnessChallenges(challengesData.map((c: any) => ({ ...c, isActive: c.is_active })));
    if (transactionsData) setTransactions(transactionsData as PointsTransaction[]);
    if (rewardsData) setRewards(rewardsData as Reward[]);
    if (messagesData) setMessages(messagesData.map((m: any) => ({ ...m, createdAt: m.created_at, senderId: m.sender_id, receiverId: m.receiver_id })));
  };

  useEffect(() => {
    if (session && currentUser) {
      fetchAllData();
    }
  }, [session, currentUser]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoginError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setLoginError("Accès refusé. Vérifiez vos identifiants.");
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // Handlers for child components
  const handlePostCreated = async (newPostData: any) => {
    if (!supabase || !currentUser) return;
    const post = {
      ...newPostData,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      role: currentUser.role,
      likes: 0,
      comments: [],
      created_at: new Date().toISOString()
    };
    const { error } = await supabase.from('posts').insert(post);
    if (!error) {
      fetchAllData();
      addToast("Publication partagée !");
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) fetchAllData();
  };

  const handleLikePost = async (id: string) => {
    if (!supabase) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    await supabase.from('posts').update({ likes: post.likes + 1 }).eq('id', id);
    fetchAllData();
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!supabase || !currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      createdAt: new Date().toISOString()
    };
    const updatedComments = [...post.comments, newComment];
    await supabase.from('posts').update({ comments: updatedComments }).eq('id', postId);
    fetchAllData();
  };

  const handleSendMessage = async (receiverId: string, text: string, attachments?: Attachment[]) => {
    if (!supabase || !currentUser) return;
    const msg = {
      sender_id: currentUser.id,
      receiver_id: receiverId,
      text,
      attachments,
      created_at: new Date().toISOString()
    };
    await supabase.from('messages').insert(msg);
    fetchAllData();
  };

  const handleAddIdea = async (title: string, description: string, category: string) => {
    if (!supabase || !currentUser) return;
    const idea = {
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.avatar,
      title,
      description,
      category,
      status: 'Suggestion',
      votes: [],
      comments: [],
      created_at: new Date().toISOString()
    };
    await supabase.from('ideas').insert(idea);
    fetchAllData();
    addToast("Idée suggérée, merci !");
  };

  const handleToggleVote = async (ideaId: string) => {
    if (!supabase || !currentUser) return;
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;
    const votes = Array.isArray(idea.votes) ? [...idea.votes] : [];
    const index = votes.indexOf(currentUser.id);
    if (index === -1) votes.push(currentUser.id);
    else votes.splice(index, 1);
    await supabase.from('ideas').update({ votes }).eq('id', ideaId);
    fetchAllData();
  };

  const handleUpdateIdeaStatus = async (id: string, status: IdeaStatus) => {
    if (!supabase) return;
    await supabase.from('ideas').update({ status }).eq('id', id);
    fetchAllData();
  };

  const handleUploadDocument = async (name: string, type: string, size: number, category: string, data: string) => {
    if (!supabase || !currentUser) return;
    const doc = {
      name, type, size, category, data,
      uploaded_by: currentUser.id,
      uploaded_by_name: currentUser.name,
      uploaded_at: new Date().toISOString()
    };
    await supabase.from('documents').insert(doc);
    fetchAllData();
    addToast("Document téléversé.");
  };

  const handleDeleteDocument = async (id: string) => {
    if (!supabase) return;
    await supabase.from('documents').delete().eq('id', id);
    fetchAllData();
  };

  const handleVotePoll = async (pollId: string, response: PollResponse) => {
    if (!supabase) return;
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    const updatedResponses = [...poll.responses, response];
    await supabase.from('polls').update({ responses: updatedResponses }).eq('id', pollId);
    fetchAllData();
    addToast("Sondage complété !");
  };

  const handleCreatePoll = async (pollData: any) => {
    if (!supabase || !currentUser) return;
    const poll = {
      ...pollData,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
      created_at: new Date().toISOString(),
      responses: []
    };
    await supabase.from('polls').insert(poll);
    fetchAllData();
    addToast("Nouveau sondage publié.");
  };

  const handleDeletePoll = async (id: string) => {
    if (!supabase) return;
    await supabase.from('polls').delete().eq('id', id);
    fetchAllData();
  };

  const handleToggleParticipation = async (eventId: string) => {
    if (!supabase || !currentUser) return;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    const attendees = Array.isArray(event.attendees) ? [...event.attendees] : [];
    const index = attendees.indexOf(currentUser.id);
    if (index === -1) attendees.push(currentUser.id);
    else attendees.splice(index, 1);
    await supabase.from('events').update({ attendees }).eq('id', eventId);
    fetchAllData();
  };

  const handleSaveEvent = async (eventData: any) => {
    if (!supabase || !currentUser) return;
    const event = {
      ...eventData,
      created_by: currentUser.id,
      attendees: [currentUser.id]
    };
    await supabase.from('events').insert(event);
    fetchAllData();
    setIsEventModalOpen(false);
    addToast("Événement ajouté à l'agenda.");
  };

  const handleDeleteEvent = async (id: string) => {
    if (!supabase) return;
    await supabase.from('events').delete().eq('id', id);
    fetchAllData();
  };

  const handleAddMood = async (value: MoodValue, comment?: string) => {
    if (!supabase || !currentUser) return;
    const mood = {
      user_id: currentUser.id,
      value,
      comment,
      department: currentUser.department,
      created_at: new Date().toISOString()
    };
    await supabase.from('moods').insert(mood);
    fetchAllData();
  };

  const handleAddCelebration = async (cData: any) => {
    if (!supabase || !currentUser) return;
    const celebration = {
      ...cData,
      created_by: currentUser.id,
      likes: []
    };
    await supabase.from('celebrations').insert(celebration);
    fetchAllData();
    addToast("Célébration publiée !");
  };

  const handleLikeCelebration = async (id: string) => {
    if (!supabase || !currentUser) return;
    const celebration = celebrations.find(c => c.id === id);
    if (!celebration) return;
    const likes = Array.isArray(celebration.likes) ? [...celebration.likes] : [];
    const idx = likes.indexOf(currentUser.id);
    if (idx === -1) likes.push(currentUser.id);
    else likes.splice(idx, 1);
    await supabase.from('celebrations').update({ likes }).eq('id', id);
    fetchAllData();
  };

  const handleDeleteCelebration = async (id: string) => {
    if (!supabase) return;
    await supabase.from('celebrations').delete().eq('id', id);
    fetchAllData();
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    if (!supabase) return;
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchAllData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!supabase) return;
    await supabase.from('profiles').delete().eq('id', userId);
    fetchAllData();
  };

  const handleAddUser = async (user: User) => {
    if (!supabase) return;
    await supabase.from('profiles').insert(user);
    fetchAllData();
  };

  const handleUpdateUser = async (user: User) => {
    if (!supabase) return;
    const { id, ...updates } = user;
    await supabase.from('profiles').update(updates).eq('id', id);
    fetchAllData();
  };

  const handleUpdateConfig = async (config: AppConfig) => {
    if (!supabase) return;
    await supabase.from('app_config').upsert({ id: 1, ...config });
    fetchAllData();
  };

  const handleEarnPoints = async (userId: string, amount: number, reason: string) => {
    if (!supabase) return;
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await supabase.from('profiles').update({ points: user.points + amount }).eq('id', userId);
    await supabase.from('transactions').insert({
      user_id: userId, amount, reason, type: 'earn', date: new Date().toISOString()
    });
    fetchAllData();
    if (userId === currentUser?.id) addToast(`Gagné ${amount} points : ${reason}`);
  };

  const handleClaimReward = async (rewardId: string) => {
    if (!supabase || !currentUser) return;
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || currentUser.points < reward.cost || reward.stock <= 0) return;

    await supabase.from('profiles').update({ points: currentUser.points - reward.cost }).eq('id', currentUser.id);
    await supabase.from('rewards').update({ stock: reward.stock - 1 }).eq('id', rewardId);
    await supabase.from('transactions').insert({
      user_id: currentUser.id, amount: reward.cost, reason: `Achat : ${reward.title}`, type: 'spend', date: new Date().toISOString()
    });
    fetchAllData();
    addToast(`Récompense "${reward.title}" obtenue !`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
         <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">Star ComUnity</h1>
              <p className="text-slate-500 font-medium">L'espace social de Star Fruits</p>
           </div>
           <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Identifiant</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-medium" placeholder="email@star-fruits.com" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Mot de passe</label>
                    <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-green-500/10 outline-none transition-all font-medium" placeholder="••••••••" />
                 </div>
              </div>
              {loginError && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl">{loginError}</p>}
              <button type="submit" className="w-full py-5 bg-[#14532d] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-green-900/20 hover:bg-green-800 transition-all active:scale-95">Se connecter</button>
           </form>
           <p className="text-center text-[10px] text-slate-400 font-medium uppercase tracking-widest">Accès réservé au personnel Star Fruits</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentView={view} 
        userRole={currentUser.role} 
        setView={setView} 
        onLogout={handleLogout} 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        appConfig={appConfig}
      />
      
      <main className="flex-1 md:ml-64 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-40 flex items-center justify-between px-4">
           <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
           <h1 className="font-bold text-slate-800">{appConfig.appName}</h1>
           <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200"><img src={currentUser.avatar} className="w-full h-full object-cover" alt="" /></div>
        </div>

        {dbErrorDetail && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-8 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
             <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             <div>
                <p className="font-bold">Erreur de connexion aux données</p>
                <p className="text-sm opacity-80">{dbErrorDetail}</p>
             </div>
          </div>
        )}

        {view === 'accueil' && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-10 text-left">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight">{appConfig.welcomeTitle.replace('{name}', currentUser.name.split(' ')[0])}</h1>
              <p className="text-slate-500 font-medium text-lg mt-2">{appConfig.welcomeSubtitle}</p>
            </div>
            <PostCreator currentUser={currentUser} onPostCreated={handlePostCreated} />
            <div className="space-y-6">
               {posts.map(post => (
                 <PostCard 
                   key={post.id} 
                   post={post} 
                   currentUserRole={currentUser.role} 
                   currentUserId={currentUser.id} 
                   onDelete={handleDeletePost} 
                   onLike={handleLikePost} 
                   onAddComment={handleAddComment} 
                 />
               ))}
               {posts.length === 0 && (
                 <div className="py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium italic">Aucun message partagé pour le moment.</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {view === 'equipe' && <TeamView users={users} />}
        {view === 'messages' && <MessagesView currentUser={currentUser} users={users} messages={messages} onSendMessage={handleSendMessage} />}
        {view === 'idees' && <IdeesView currentUser={currentUser} ideas={ideas} onAddIdea={handleAddIdea} onToggleVote={handleToggleVote} onUpdateStatus={handleUpdateIdeaStatus} onAddComment={handleAddComment} />}
        {view === 'documents' && <DocumentsView currentUser={currentUser} documents={documents} categories={appConfig.documentCategories} onUpload={handleUploadDocument} onDelete={handleDeleteDocument} />}
        {view === 'sondages' && <PollsView currentUser={currentUser} polls={polls} onCreatePoll={handleCreatePoll} onVote={handleVotePoll} onDeletePoll={handleDeletePoll} />}
        {view === 'evenements' && <EventsView currentUser={currentUser} events={events} onToggleParticipation={handleToggleParticipation} onOpenCreateModal={() => setIsEventModalOpen(true)} onDeleteEvent={handleDeleteEvent} />}
        {view === 'humeur' && <MoodView currentUser={currentUser} moods={moods} onAddMood={handleAddMood} />}
        {view === 'celebrations' && <CelebrationsView currentUser={currentUser} users={users} celebrations={celebrations} onAddCelebration={handleAddCelebration} onLikeCelebration={handleLikeCelebration} onDeleteCelebration={handleDeleteCelebration} preSelectedUserId={wishingBirthdayForId} />}
        {view === 'newsletter' && <NewsletterView currentUser={currentUser} newsletters={newsletters} />}
        {view === 'bienetre' && <BienEtreView contents={wellnessContents} challenges={wellnessChallenges} />}
        {view === 'jeux' && <JeuxView games={games} currentUser={currentUser} predictions={predictions} onAddPrediction={() => {}} onEarnPoints={handleEarnPoints} />}
        {view === 'boutique' && <BoutiqueView currentUser={currentUser} rewards={rewards} onClaimReward={handleClaimReward} transactions={transactions} />}
        {view === 'parametres' && <Settings user={currentUser} onSave={handleUpdateUser} />}
        {view === 'admin' && (
          <AdminPanel 
            users={users} onUpdateRole={handleUpdateRole} onDeleteUser={handleDeleteUser} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser}
            posts={posts} onDeletePost={handleDeletePost}
            ideas={ideas} onUpdateIdeaStatus={handleUpdateIdeaStatus}
            moods={moods}
            newsletters={newsletters} onCreateNewsletter={async (n) => { await supabase.from('newsletters').insert({ ...n, published_at: new Date().toISOString(), read_count: 0 }); fetchAllData(); }} onDeleteNewsletter={async (id) => { await supabase.from('newsletters').delete().eq('id', id); fetchAllData(); }}
            wellnessContents={wellnessContents} onAddWellnessContent={async (c) => { await supabase.from('wellness_contents').insert(c); fetchAllData(); }} onDeleteWellnessContent={async (id) => { await supabase.from('wellness_contents').delete().eq('id', id); fetchAllData(); }}
            wellnessChallenges={wellnessChallenges} onAddWellnessChallenge={async (c) => { await supabase.from('wellness_challenges').insert({ ...c, is_active: false }); fetchAllData(); }} onDeleteWellnessChallenge={async (id) => { await supabase.from('wellness_challenges').delete().eq('id', id); fetchAllData(); }} onToggleWellnessChallenge={async (id) => { const c = wellnessChallenges.find(x => x.id === id); await supabase.from('wellness_challenges').update({ is_active: !c?.isActive }).eq('id', id); fetchAllData(); }}
            games={games} onAddGame={async (g) => { await supabase.from('games').insert(g); fetchAllData(); }} onDeleteGame={async (id) => { await supabase.from('games').delete().eq('id', id); fetchAllData(); }} onToggleGameStatus={() => {}} onSetGameResult={() => {}}
            predictions={predictions}
            rewards={rewards} onAddReward={async (r) => { await supabase.from('rewards').insert(r); fetchAllData(); }} onDeleteReward={async (id) => { await supabase.from('rewards').delete().eq('id', id); fetchAllData(); }}
            currentUser={currentUser}
            appConfig={appConfig} onUpdateConfig={handleUpdateConfig}
            transactions={transactions}
          />
        )}
      </main>

      {isEventModalOpen && <EventCreatorModal onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} currentUser={currentUser} />}

      {/* Toast System */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3">
         {toasts.map(t => (
           <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-right-10 duration-500 ${
             t.type === 'error' ? 'bg-red-600 border-red-500 text-white' : 
             t.type === 'info' ? 'bg-blue-600 border-blue-500 text-white' : 
             'bg-slate-900 border-slate-800 text-white'
           }`}>
             <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             <span className="font-bold text-sm tracking-tight">{t.message}</span>
           </div>
         ))}
      </div>
    </div>
  );
};

export default App;
