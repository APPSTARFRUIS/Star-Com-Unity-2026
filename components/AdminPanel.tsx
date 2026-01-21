
import React, { useState, useMemo, useRef } from 'react';
import { User, UserRole, Newsletter, Post, Idea, MoodEntry, IdeaStatus, AppConfig, WellnessContent, WellnessCategory, WellnessChallenge, CompanyGame, GameType, GameCategory, Reward, GamePrediction, QuizQuestion, QuizType, TimelineItem, HiddenObject, NewsletterBlock, NewsletterArticle, NewsletterBlockType, PointsTransaction } from '../types';
import { DEPARTMENTS } from '../constants';

interface AdminPanelProps {
  users: User[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  posts: Post[];
  onDeletePost: (id: string) => void;
  ideas: Idea[];
  onUpdateIdeaStatus: (id: string, status: IdeaStatus) => void;
  moods: MoodEntry[];
  newsletters: Newsletter[];
  onCreateNewsletter: (n: Omit<Newsletter, 'id' | 'readCount' | 'publishedAt'>) => void;
  onDeleteNewsletter: (id: string) => void;
  wellnessContents: WellnessContent[];
  onAddWellnessContent: (c: Omit<WellnessContent, 'id' | 'createdAt'>) => void;
  onDeleteWellnessContent: (id: string) => void;
  wellnessChallenges: WellnessChallenge[];
  onAddWellnessChallenge: (c: Omit<WellnessChallenge, 'id' | 'isActive'>) => void;
  onDeleteWellnessChallenge: (id: string) => void;
  onToggleWellnessChallenge: (id: string) => void;
  games: CompanyGame[];
  onAddGame: (g: Omit<CompanyGame, 'id' | 'createdAt'>) => void;
  onDeleteGame: (id: string) => void;
  onToggleGameStatus: (id: string) => void;
  onSetGameResult: (gameId: string, result: 'A' | 'Nul' | 'B') => void;
  predictions: GamePrediction[];
  rewards: Reward[];
  onAddReward: (r: Omit<Reward, 'id'>) => void;
  onDeleteReward: (id: string) => void;
  currentUser: User;
  appConfig: AppConfig;
  onUpdateConfig: (config: AppConfig) => void;
  transactions: PointsTransaction[];
}

const TRIVIAL_CATEGORIES = [
  { name: 'Géographie', color: 'bg-blue-500', hex: '#3b82f6', icon: '🌍' },
  { name: 'Histoire', color: 'bg-yellow-400', hex: '#facc15', icon: '⏳' },
  { name: 'Art & Littérature', color: 'bg-purple-600', hex: '#9333ea', icon: '🎨' },
  { name: 'Sport & Loisirs', color: 'bg-orange-500', hex: '#f97316', icon: '⚽' },
  { name: 'Sciences & Nature', color: 'bg-green-600', hex: '#16a34a', icon: '🔬' },
  { name: 'Divertissement', color: 'bg-red-600', hex: '#dc2626', icon: '🎬' }
];

const COMPANIES = [
  'Star Group',
  'Star fruits',
  'Star Export',
  'AC Fruit',
  'Star PMP',
  'Eurostème',
  'Pep Toulemonde',
  'Pep Veauvy',
  'Pep Cros-Viguier',
  'Pep Val d\'Or'
];

const ADMIN_TABS = [
  { id: 'users', label: 'Utilisateurs', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'rewards', label: 'Boutique', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 'jeux', label: 'Jeux', icon: 'M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 110-6h14a3 3 0 110 6H5z' },
  { id: 'newsletter', label: 'Newsletter', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { id: 'moderation', label: 'Modération', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
  { id: 'wellness', label: 'Bien-être', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { id: 'ideas', label: 'Boîte à Idées', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { id: 'appearance', label: 'Apparence', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.856a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, onUpdateRole, onDeleteUser, onUpdateUser, onAddUser,
  posts, onDeletePost,
  ideas, onUpdateIdeaStatus,
  moods,
  newsletters, onCreateNewsletter, onDeleteNewsletter,
  wellnessContents, onAddWellnessContent, onDeleteWellnessContent,
  wellnessChallenges, onAddWellnessChallenge, onDeleteWellnessChallenge, onToggleWellnessChallenge,
  games, onAddGame, onDeleteGame, onToggleGameStatus, onSetGameResult,
  rewards, onAddReward, onDeleteReward,
  appConfig, onUpdateConfig, currentUser,
  transactions
}) => {
  const [activeTab, setActiveTab] = useState('users');
  const [rewardsSubTab, setRewardsSubTab] = useState<'products' | 'orders'>('products');
  const [newDocCategory, setNewDocCategory] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (data: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result as string);
    reader.readAsDataURL(file as Blob);
  };

  // --- UTILISATEURS STATE ---
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({});
  const userAvatarRef = useRef<HTMLInputElement>(null);

  const handleOpenUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ ...user });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        email: '',
        password: 'User123',
        department: DEPARTMENTS[0],
        company: COMPANIES[0],
        role: UserRole.USER,
        points: 0,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}`
      });
    }
    setShowUserModal(true);
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(userForm as User);
    } else {
      // Générer un UUID valide pour la base de données
      const newUser: User = {
        ...userForm,
        id: self.crypto.randomUUID()
      } as User;
      onAddUser(newUser);
    }
    setShowUserModal(false);
  };

  // --- JEUX STATE ---
  const [showGameModal, setShowGameModal] = useState(false);
  const [newGame, setNewGame] = useState<Omit<CompanyGame, 'id' | 'createdAt'>>({
    title: '', description: '', type: 'Quiz', category: 'Produits', difficulty: 'Moyen', duration: '5 min', status: 'Actif', createdBy: currentUser.id, rewardPoints: 100, thumbnail: '', 
    hiddenObjects: [], hiddenObjectsImage: '', questions: [], memoryItems: [], timelineItems: []
  });
  const [currentObjectName, setCurrentObjectName] = useState('');
  const [currentObjectQuestion, setCurrentObjectQuestion] = useState('');
  const gameThumbnailRef = useRef<HTMLInputElement>(null);
  const gameHiddenImgRef = useRef<HTMLInputElement>(null);

  // --- QUIZ EDITOR HELPERS ---
  const handleAddQuestion = () => {
    const q: QuizQuestion = { 
      id: Math.random().toString(36).substr(2, 9), 
      type: 'QCU', 
      question: 'Nouvelle question ?', 
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], 
      correctIndices: [0],
      trivialCategory: newGame.type === 'Trivial' ? TRIVIAL_CATEGORIES[0].name : undefined
    };
    setNewGame(prev => ({ ...prev, questions: [...(prev.questions || []), q] }));
  };

  const handleUpdateQuizQuestion = (qIdx: number, updates: Partial<QuizQuestion>) => {
    setNewGame(prev => {
      const updated = [...(prev.questions || [])];
      updated[qIdx] = { ...updated[qIdx], ...updates };
      if (updates.type === 'Vrai/Faux') {
        updated[qIdx].options = ['Vrai', 'Faux'];
        updated[qIdx].correctIndices = [0];
      }
      return { ...prev, questions: updated };
    });
  };

  const handleUpdateQuizOption = (qIdx: number, oIdx: number, optionText: string) => {
    setNewGame(prev => {
      const updated = [...(prev.questions || [])];
      updated[qIdx].options[oIdx] = optionText;
      return { ...prev, questions: updated };
    });
  };

  const handleToggleQuizCorrect = (qIdx: number, oIdx: number) => {
    setNewGame(prev => {
      const updated = [...(prev.questions || [])];
      const q = updated[qIdx];
      if (q.type === 'QCM') {
        if (q.correctIndices.includes(oIdx)) {
          if (q.correctIndices.length > 1) q.correctIndices = q.correctIndices.filter(i => i !== oIdx);
        } else {
          q.correctIndices = [...q.correctIndices, oIdx];
        }
      } else {
        q.correctIndices = [oIdx];
      }
      return { ...prev, questions: updated };
    });
  };

  const handleRemoveQuizQuestion = (qIdx: number) => {
    setNewGame(prev => {
      const updated = [...(prev.questions || [])];
      updated.splice(qIdx, 1);
      return { ...prev, questions: updated };
    });
  };

  const handleAddQuizOption = (qIdx: number) => {
    const updated = [...(newGame.questions || [])];
    if (updated[qIdx].type === 'Vrai/Faux') return;
    updated[qIdx].options.push(`Nouvelle Option`);
    setNewGame({ ...newGame, questions: updated });
  };

  const handleRemoveQuizOption = (qIdx: number, oIdx: number) => {
    const updated = [...(newGame.questions || [])];
    if (updated[qIdx].type === 'Vrai/Faux') return;
    if (updated[qIdx].options.length <= 2) return;
    updated[qIdx].options.splice(oIdx, 1);
    updated[qIdx].correctIndices = updated[qIdx].correctIndices
      .filter(i => i !== oIdx)
      .map(i => i > oIdx ? i - 1 : i);
    if (updated[qIdx].correctIndices.length === 0) updated[qIdx].correctIndices = [0];
    setNewGame({ ...newGame, questions: updated });
  };

  // --- MEMORY EDITOR ---
  const [memInput, setMemInput] = useState('');
  const memFileRef = useRef<HTMLInputElement>(null);
  const handleAddMemItem = (val: string) => {
    if (!val) return;
    setNewGame(prev => ({ ...prev, memoryItems: [...(prev.memoryItems || []), val] }));
    setMemInput('');
  };

  // --- TIMELINE EDITOR ---
  const [timeText, setTimeText] = useState('');
  const [timeYear, setTimeYear] = useState(2025);
  const handleAddTimeItem = () => {
    if (!timeText) return;
    const item: TimelineItem = { id: Math.random().toString(36).substr(2, 9), text: timeText, year: timeYear };
    setNewGame(prev => ({ ...prev, timelineItems: [...(prev.timelineItems || []), item] }));
    setTimeText('');
  };

  // --- HIDDEN OBJECTS SELECTION ---
  const handleHiddenAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!newGame.hiddenObjectsImage) { alert("Chargez d'abord l'image du décor !"); return; }
    if (!currentObjectName.trim()) { alert("Entrez un nom pour l'objet avant de cliquer sur l'image !"); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const obj: HiddenObject = { 
      id: Math.random().toString(36).substr(2, 9), 
      label: currentObjectName, 
      question: currentObjectQuestion.trim() || `Où se trouve : ${currentObjectName} ?`,
      x: Math.round(x * 100) / 100, 
      y: Math.round(y * 100) / 100, 
      radius: 5 
    };
    setNewGame(prev => ({ ...prev, hiddenObjects: [...(prev.hiddenObjects || []), obj] }));
    setCurrentObjectName('');
    setCurrentObjectQuestion('');
  };

  const handleAddGameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGame.type === 'Quiz' && (!newGame.questions || newGame.questions.length === 0)) { alert("Ajoutez au moins une question au Quiz !"); return; }
    if (newGame.type === 'Trivial' && (!newGame.questions || newGame.questions.length === 0)) { alert("Ajoutez au moins une question au Trivial !"); return; }
    if (newGame.type === 'Memory' && (!newGame.memoryItems || newGame.memoryItems.length < 2)) { alert("Ajoutez au moins 2 paires au Memory !"); return; }
    if (newGame.type === 'Chronologie' && (!newGame.timelineItems || newGame.timelineItems.length < 2)) { alert("Ajoutez au moins 2 dates à la Chronologie !"); return; }
    if (newGame.type === 'Objets Cachés' && (!newGame.hiddenObjects || newGame.hiddenObjects.length === 0)) { alert("Placez au moins un objet caché !"); return; }
    
    onAddGame(newGame);
    setShowGameModal(false);
    setNewGame({ 
      title: '', description: '', type: 'Quiz', category: 'Produits', difficulty: 'Moyen', duration: '5 min', status: 'Actif', createdBy: currentUser.id, rewardPoints: 100, thumbnail: '', 
      hiddenObjects: [], hiddenObjectsImage: '', questions: [], memoryItems: [], timelineItems: [] 
    });
  };

  // --- NEWSLETTER ---
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsCover, setNewsCover] = useState('');
  const [newsArticles, setNewsArticles] = useState<NewsletterArticle[]>([]);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  
  const newsCoverRef = useRef<HTMLInputElement>(null);

  const handleAddNewsArticle = () => {
    const art: NewsletterArticle = { 
      id: Math.random().toString(36).substr(2, 9), 
      title: 'Nouvel article', 
      summary: '', 
      category: '', 
      blocks: [{ id: Math.random().toString(36).substr(2, 9), type: 'text', content: 'Contenu...' }] 
    };
    setNewsArticles([...newsArticles, art]);
    setEditingArticleId(art.id);
  };

  const handleUpdateArticle = (id: string, updates: Partial<NewsletterArticle>) => {
    setNewsArticles(newsArticles.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const handleAddBlock = (artId: string, type: NewsletterBlockType) => {
    const newBlock: NewsletterBlock = { id: Math.random().toString(36).substr(2, 9), type, content: type === 'text' ? 'Nouveau paragraphe...' : '' };
    setNewsArticles(newsArticles.map(a => a.id === artId ? { ...a, blocks: [...a.blocks, newBlock] } : a));
  };

  const handleUpdateBlock = (artId: string, blockId: string, content: string, images?: string[]) => {
    setNewsArticles(newsArticles.map(a => a.id === artId ? {
      ...a,
      blocks: a.blocks.map(b => b.id === blockId ? { ...b, content, images: images || b.images } : b)
    } : a));
  };

  const handleRemoveBlock = (artId: string, blockId: string) => {
    setNewsArticles(newsArticles.map(a => a.id === artId ? { ...a, blocks: a.blocks.filter(b => b.id !== blockId) } : a));
  };

  const handleCreateNewsletterSubmit = () => {
    if (!newsTitle || newsArticles.length === 0) { alert("Titre et articles requis."); return; }
    onCreateNewsletter({ title: newsTitle, summary: newsSummary, coverImage: newsCover, authorName: currentUser.name, articles: newsArticles });
    setShowNewsModal(false);
    setNewsArticles([]); setNewsTitle(''); setNewsCover(''); setEditingArticleId(null);
  };

  // --- WELLNESS ---
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [newWellness, setNewWellness] = useState<Omit<WellnessContent, 'id' | 'createdAt'>>({ type: 'article', title: '', summary: '', content: '', category: 'Mental', author: currentUser.name, duration: '5 min', mediaUrl: '' });
  const [newChallenge, setNewChallenge] = useState<Omit<WellnessChallenge, 'id' | 'isActive'>>({ title: '', description: '', points: 50 });
  
  const wellnessMediaRef = useRef<HTMLInputElement>(null);
  
  const handleAddWellnessSubmit = (e: React.FormEvent) => {
    e.preventDefault(); onAddWellnessContent(newWellness); setShowWellnessModal(false);
    setNewWellness({ type: 'article', title: '', summary: '', content: '', category: 'Mental', author: currentUser.name, duration: '5 min', mediaUrl: '' });
  };

  const handleAddChallengeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddWellnessChallenge(newChallenge);
    setShowChallengeModal(false);
    setNewChallenge({ title: '', description: '', points: 50 });
  };

  // --- BOUTIQUE ---
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [newReward, setNewReward] = useState<Omit<Reward, 'id'>>({ title: '', description: '', cost: 100, stock: 5, category: 'Goodies', image: '' });
  const rewardImgRef = useRef<HTMLInputElement>(null);
  const handleAddRewardSubmit = (e: React.FormEvent) => {
    e.preventDefault(); onAddReward(newReward); setShowRewardModal(false);
    setNewReward({ title: '', description: '', cost: 100, stock: 5, category: 'Goodies', image: '' });
  };

  const orders = useMemo(() => {
    return transactions.filter(t => t.type === 'spend').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const logoRef = useRef<HTMLInputElement>(null);

  const editingArticle = newsArticles.find(a => a.id === editingArticleId);

  const handleAddDocCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocCategory.trim() || appConfig.documentCategories.includes(newDocCategory.trim())) return;
    onUpdateConfig({
      ...appConfig,
      documentCategories: [...appConfig.documentCategories, newDocCategory.trim()]
    });
    setNewDocCategory('');
  };

  const handleRemoveDocCategory = (cat: string) => {
    onUpdateConfig({
      ...appConfig,
      documentCategories: appConfig.documentCategories.filter(c => c !== cat)
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 text-left">
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm sticky top-0 z-30">
        {ADMIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              activeTab === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {/* ✅ FIX: Fixed SVG path 'd' attribute */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} /></svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- UTILISATEURS --- */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">Gestion des Utilisateurs</h2>
              <button 
                onClick={() => handleOpenUserModal()} 
                className="px-6 py-2.5 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 shadow-lg transition-all active:scale-95"
              >
                Ajouter un utilisateur
              </button>
           </div>
           <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Employé</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">ID (Email)</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Points</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Rôle</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <img src={u.avatar} className="w-10 h-10 rounded-full border border-slate-100 object-cover" alt="" />
                              <div>
                                <p className="font-bold text-slate-800">{u.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{u.company}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <span className="font-black text-green-600">{u.points} pts</span>
                              <div className="flex gap-1">
                                 <button onClick={() => onUpdateUser({...u, points: u.points + 50})} className="w-6 h-6 bg-green-50 text-green-600 rounded flex items-center justify-center text-xs font-bold hover:bg-green-100 transition-colors">+</button>
                                 <button onClick={() => onUpdateUser({...u, points: Math.max(0, u.points - 50)})} className="w-6 h-6 bg-red-50 text-red-600 rounded flex items-center justify-center text-xs font-bold hover:bg-red-100 transition-colors">-</button>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <select 
                             value={u.role} 
                             onChange={(e) => onUpdateRole(u.id, e.target.value as UserRole)}
                             className="bg-slate-100 border-none rounded-lg text-xs font-bold py-1 px-2 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                           >
                              {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleOpenUserModal(u)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2.5" /></svg>
                             </button>
                             <button onClick={() => onDeleteUser(u.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg>
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* User Modal (Add/Edit) */}
           {showUserModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
               <div className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl p-8 animate-in zoom-in overflow-y-auto max-h-[90vh] custom-scrollbar">
                  <h3 className="text-xl font-black text-slate-800 mb-6">{editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</h3>
                  <form onSubmit={handleSubmitUser} className="space-y-4">
                     <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                          <img src={userForm.avatar} className="w-24 h-24 rounded-[32px] border-4 border-slate-100 object-cover shadow-md" alt="" />
                          <input 
                            type="file" 
                            ref={userAvatarRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, (data) => setUserForm({ ...userForm, avatar: data }))} 
                          />
                          <button 
                            type="button" 
                            onClick={() => userAvatarRef.current?.click()}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px] flex items-center justify-center text-white"
                          >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2.5" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2.5" /></svg>
                          </button>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setUserForm({ ...userForm, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random().toString(36).substring(7)}` })}
                          className="mt-2 text-[10px] font-black uppercase text-blue-600 hover:underline"
                        >
                          Générer aléatoire
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nom complet</label>
                           <input 
                             required 
                             placeholder="Nom de l'employé" 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                             value={userForm.name || ''} 
                             onChange={e => setUserForm({ ...userForm, name: e.target.value })} 
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ID (Email)</label>
                           <input 
                             required 
                             type="email" 
                             placeholder="email@star-fruits.com" 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                             value={userForm.email || ''} 
                             onChange={e => setUserForm({ ...userForm, email: e.target.value })} 
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Mot de passe</label>
                           <input 
                             required 
                             type="text" 
                             placeholder="Mot de passe" 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                             value={userForm.password || ''} 
                             onChange={e => setUserForm({ ...userForm, password: e.target.value })} 
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rôle</label>
                           <select 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none" 
                             value={userForm.role || UserRole.USER} 
                             onChange={e => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                           >
                              {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Entreprise</label>
                           <select 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none" 
                             value={userForm.company || ''} 
                             onChange={e => setUserForm({ ...userForm, company: e.target.value })}
                           >
                              {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Service</label>
                           <select 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none" 
                             value={userForm.department || ''} 
                             onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                           >
                              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Points actuels</label>
                           <input 
                             type="number" 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-green-600 focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
                             value={userForm.points || 0} 
                             onChange={e => setUserForm({ ...userForm, points: parseInt(e.target.value) || 0 })} 
                           />
                        </div>
                     </div>

                     <div className="flex gap-4 pt-6 border-t border-slate-100">
                        <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-all">Annuler</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-purple-700 transition-all active:scale-95">
                           {editingUser ? "Enregistrer" : "Créer l'utilisateur"}
                        </button>
                     </div>
                  </form>
               </div>
             </div>
           )}
        </div>
      )}

      {/* --- RÉCOMPENSES --- */}
      {activeTab === 'rewards' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">Gestion Boutique</h2>
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                 <button onClick={() => setRewardsSubTab('products')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${rewardsSubTab === 'products' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500'}`}>Produits</button>
                 <button onClick={() => setRewardsSubTab('orders')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${rewardsSubTab === 'orders' ? 'bg-white shadow-sm text-green-700' : 'text-slate-500'}`}>Commandes ({orders.length})</button>
              </div>
              <button onClick={() => setShowRewardModal(true)} className="px-6 py-2.5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg">Ajouter une récompense</button>
           </div>

           {rewardsSubTab === 'products' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rewards.map(r => (
                  <div key={r.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group shadow-sm">
                     <div className="flex items-center gap-4">
                        <img src={r.image} className="w-16 h-16 rounded-2xl object-cover bg-slate-50" alt="" />
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{r.category}</span>
                             <p className="font-bold text-slate-800">{r.title}</p>
                          </div>
                          <p className="text-xs text-green-600 font-black">{r.cost} points • {r.stock} en stock</p>
                        </div>
                     </div>
                     <button onClick={() => onDeleteReward(r.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg></button>
                  </div>
                ))}
             </div>
           ) : (
             <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Date</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Utilisateur</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Détails</th>
                         <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Points</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {orders.map(o => {
                        const user = users.find(u => u.id === o.userId);
                        return (
                          <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-4 text-xs font-bold text-slate-400">{new Date(o.date).toLocaleDateString('fr-FR')}</td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                   <img src={user?.avatar} className="w-8 h-8 rounded-full border" alt="" />
                                   <span className="font-bold text-slate-800 text-sm">{user?.name || 'Inconnu'}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-sm font-medium text-slate-600">{o.reason}</td>
                             <td className="px-6 py-4 text-right font-black text-red-600">-{o.amount} pts</td>
                          </tr>
                        );
                      })}
                      {orders.length === 0 && (
                        <tr><td colSpan={4} className="p-12 text-center text-slate-300 italic">Aucune commande pour le moment.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
           )}

           {showRewardModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in">
                   <h3 className="text-xl font-black text-slate-800 mb-6">Nouvelle récompense</h3>
                   <form onSubmit={handleAddRewardSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Titre</label>
                          <input required placeholder="Nom de la récompense" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Catégorie</label>
                          <select required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none appearance-none" value={newReward.category} onChange={e => setNewReward({...newReward, category: e.target.value as any})}>
                             <option value="Badge">Badge</option>
                             <option value="Goodies">Goodies</option>
                             <option value="Avantage">Avantage</option>
                             <option value="Expérience">Expérience</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                        <textarea required placeholder="Expliquez ce que c'est..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 h-24 outline-none resize-none" value={newReward.description} onChange={e => setNewReward({...newReward, description: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Coût (Points)</label>
                          <input type="number" placeholder="Coût" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-green-600 outline-none" value={newReward.cost} onChange={e => setNewReward({...newReward, cost: parseInt(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Stock disponible</label>
                          <input type="number" placeholder="Stock" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold outline-none" value={newReward.stock} onChange={e => setNewReward({...newReward, stock: parseInt(e.target.value)})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Photo du produit</label>
                        <input type="file" className="hidden" ref={rewardImgRef} accept="image/*" onChange={e => handleFileUpload(e, (data) => setNewReward({...newReward, image: data}))} />
                        <div onClick={() => rewardImgRef.current?.click()} className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-sm">
                           {newReward.image ? <img src={newReward.image} className="w-full h-full object-cover" alt="" /> : <><svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.856a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg><span className="text-xs text-slate-400 font-bold mt-2">Cliquez pour charger</span></>}
                        </div>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setShowRewardModal(false)} className="flex-1 py-3 font-bold text-slate-500">Annuler</button>
                        <button type="submit" className="flex-2 px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95">Ajouter la récompense</button>
                      </div>
                   </form>
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- JEUX --- */}
      {activeTab === 'jeux' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">Gestion des Jeux</h2>
              <button onClick={() => setShowGameModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg">Nouveau Jeu</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map(g => (
                <div key={g.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group shadow-sm transition-all hover:shadow-md">
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                         {g.thumbnail || g.hiddenObjectsImage ? <img src={g.thumbnail || g.hiddenObjectsImage} className="w-full h-full object-cover rounded-2xl" /> : <span className="text-2xl">🎮</span>}
                      </div>
                      <div className="overflow-hidden">
                         <p className="font-bold text-slate-800 truncate">{g.title}</p>
                         <p className="text-xs text-indigo-600 font-black uppercase tracking-widest">{g.type} • {g.status}</p>
                      </div>
                   </div>
                   <button onClick={() => onDeleteGame(g.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg></button>
                </div>
              ))}
           </div>
           {showGameModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl p-8 animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                   <h3 className="text-xl font-black text-slate-800 mb-8">Créer un nouveau jeu</h3>
                   <form onSubmit={handleAddGameSubmit} className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Type de jeu</label>
                           <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={newGame.type} onChange={e => setNewGame({...newGame, type: e.target.value as any})}>
                              <option value="Quiz">Quiz</option>
                              <option value="Trivial">Trivial Pursuit</option>
                              <option value="Memory">Memory</option>
                              <option value="Chronologie">Chronologie</option>
                              <option value="Objets Cachés">Objets Cachés</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Catégorie</label>
                           <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none" value={newGame.category} onChange={e => setNewGame({...newGame, category: e.target.value as any})}>
                              <option value="Produits">Produits</option>
                              <option value="Histoire">Histoire</option>
                              <option value="Valeurs">Valeurs</option>
                           </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre de l'expérience</label>
                         <input required placeholder="Titre du jeu..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-xl" value={newGame.title} onChange={e => setNewGame({...newGame, title: e.target.value})} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Récompense finale</label>
                           <input type="number" placeholder="Points à gagner" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-green-600 outline-none text-xl" value={newGame.rewardPoints} onChange={e => setNewGame({...newGame, rewardPoints: parseInt(e.target.value)})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Vignette (Local)</label>
                           <input type="file" className="hidden" ref={gameThumbnailRef} accept="image/*" onChange={e => handleFileUpload(e, (data) => setNewGame({...newGame, thumbnail: data}))} />
                           <button type="button" onClick={() => gameThumbnailRef.current?.click()} className="w-full h-[60px] bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold text-slate-500 hover:bg-slate-100 truncate transition-all flex items-center justify-center">
                              {newGame.thumbnail ? "Vignette chargée ✅" : "Charger image locale"}
                           </button>
                        </div>
                      </div>

                      {/* --- ÉDITEUR DE QUIZ / TRIVIAL --- */}
                      {(newGame.type === 'Quiz' || newGame.type === 'Trivial') && (
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 space-y-6">
                           <div className="flex items-center justify-between px-2">
                              <h4 className="text-xs font-black uppercase text-indigo-700 tracking-[0.3em]">ÉDITEUR DE QUESTIONS ({newGame.questions?.length})</h4>
                              <button type="button" onClick={handleAddQuestion} className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-200">+ AJOUTER UNE QUESTION</button>
                           </div>
                           <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 scrollbar-hide">
                              {newGame.questions?.map((q, qIdx) => (
                                <div key={q.id} className="p-8 bg-white rounded-[32px] border border-slate-200 space-y-6 relative group/q shadow-sm animate-in slide-in-from-top-4 duration-500">
                                   <button type="button" onClick={() => handleRemoveQuizQuestion(qIdx)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth="3"/></svg></button>
                                   
                                   <div className="flex flex-col md:flex-row gap-6">
                                      <div className="flex-1 space-y-2">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">QUESTION 0{qIdx + 1}</label>
                                         <input 
                                           value={q.question} 
                                           onChange={e => handleUpdateQuizQuestion(qIdx, { question: e.target.value })} 
                                           className="w-full font-black text-slate-800 outline-none border-b-2 border-slate-100 focus:border-indigo-500 transition-all pb-2 text-xl"
                                           placeholder="Votre question..."
                                         />
                                      </div>
                                      <div className="w-full md:w-48 space-y-2">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{newGame.type === 'Trivial' ? 'Catégorie Trivial' : 'Modèle'}</label>
                                         {newGame.type === 'Trivial' ? (
                                           <select 
                                              value={q.trivialCategory} 
                                              onChange={e => handleUpdateQuizQuestion(qIdx, { trivialCategory: e.target.value })}
                                              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none appearance-none"
                                           >
                                              {TRIVIAL_CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                                           </select>
                                         ) : (
                                           <select 
                                             value={q.type} 
                                             onChange={e => handleUpdateQuizQuestion(qIdx, { type: e.target.value as any })}
                                             className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold outline-none appearance-none"
                                           >
                                              <option value="QCU">Choix Unique (QCU)</option>
                                              <option value="QCM">Choix Multiples (QCM)</option>
                                              <option value="Vrai/Faux">Vrai / Faux</option>
                                           </select>
                                         )}
                                      </div>
                                   </div>

                                   <div className="space-y-4">
                                      <div className="flex items-center justify-between px-1">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">RÉPONSES POSSIBLES (COCHEZ LA BONNE)</label>
                                         {q.type !== 'Vrai/Faux' && <button type="button" onClick={() => handleAddQuizOption(qIdx)} className="text-[10px] font-black text-indigo-600 hover:underline">+ Ajouter option</button>}
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         {q.options.map((opt, oIdx) => (
                                           <div key={oIdx} className={`flex items-center gap-4 p-5 rounded-[24px] border-2 transition-all group/opt ${q.correctIndices.includes(oIdx) ? 'bg-green-50 border-green-200 ring-2 ring-green-100 shadow-md' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                              <button 
                                                 type="button"
                                                 onClick={() => handleToggleQuizCorrect(qIdx, oIdx)}
                                                 className={`w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-black transition-all shadow-sm ${q.correctIndices.includes(oIdx) ? 'bg-green-600 text-white scale-110' : 'bg-white text-slate-300 border border-slate-200 hover:border-slate-300'}`}
                                              >
                                                 {q.correctIndices.includes(oIdx) ? '✔' : String.fromCharCode(65 + oIdx)}
                                              </button>
                                              <input 
                                                 value={opt} 
                                                 readOnly={q.type === 'Vrai/Faux'}
                                                 onChange={e => handleUpdateQuizOption(qIdx, oIdx, e.target.value)} 
                                                 className={`flex-1 bg-transparent text-base font-bold outline-none transition-colors ${q.correctIndices.includes(oIdx) ? 'text-green-800' : 'text-slate-700'}`}
                                                 placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                              />
                                              {q.options.length > 2 && q.type !== 'Vrai/Faux' && (
                                                <button type="button" onClick={() => handleRemoveQuizOption(qIdx, oIdx)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-opacity p-2">
                                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="4"/></svg>
                                                </button>
                                              )}
                                           </div>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                              ))}
                              {(!newGame.questions || newGame.questions.length === 0) && (
                                <div className="py-16 text-center border-4 border-dashed border-slate-200 rounded-[48px] text-slate-400 italic text-sm">Prêt à créer votre jeu ? Cliquez sur "+ Ajouter une question" ci-dessus.</div>
                              )}
                           </div>
                        </div>
                      )}

                      {/* --- MÉMOIRE --- */}
                      {newGame.type === 'Memory' && (
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 space-y-6">
                           <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Paires du Memory ({newGame.memoryItems?.length})</h4>
                           <div className="flex gap-4">
                              <input placeholder="Emoji ou texte..." className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500" value={memInput} onChange={e => setMemInput(e.target.value)} />
                              <input type="file" className="hidden" ref={memFileRef} accept="image/*" onChange={e => handleFileUpload(e, handleAddMemItem)} />
                              <button type="button" onClick={() => handleAddMemItem(memInput)} className="px-8 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Ajouter</button>
                              <button type="button" onClick={() => memFileRef.current?.click()} className="px-8 py-4 bg-indigo-100 text-indigo-700 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-200 transition-all">Image locale</button>
                           </div>
                           <div className="flex flex-wrap gap-4 pt-4">
                              {newGame.memoryItems?.map((m, i) => (
                                <div key={i} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 overflow-hidden text-2xl relative group shadow-sm transition-transform hover:scale-105">
                                   {m.startsWith('data:') ? <img src={m} className="w-full h-full object-cover" /> : m}
                                   <button type="button" onClick={() => setNewGame(prev => ({...prev, memoryItems: prev.memoryItems?.filter((_, idx) => idx !== i)}))} className="absolute inset-0 bg-red-500 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-black transition-opacity">X</button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* --- CHRONOLOGIE --- */}
                      {newGame.type === 'Chronologie' && (
                        <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-200 space-y-6">
                           <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Événements temporels ({newGame.timelineItems?.length})</h4>
                           <div className="grid grid-cols-12 gap-4">
                              <input className="col-span-8 bg-white border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 font-bold" placeholder="Fait marquant..." value={timeText} onChange={e => setTimeText(e.target.value)} />
                              <input type="number" className="col-span-3 bg-white border border-slate-200 rounded-2xl px-4 py-4 outline-none font-black text-center text-lg" value={timeYear} onChange={e => setTimeYear(parseInt(e.target.value))} />
                              <button type="button" onClick={handleAddTimeItem} className="col-span-1 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">+</button>
                           </div>
                           <div className="space-y-3 pt-4">
                              {newGame.timelineItems?.sort((a,b)=>a.year-b.year).map(t => (
                                <div key={t.id} className="flex justify-between items-center p-4 bg-white rounded-2xl text-sm font-bold border border-slate-100 shadow-sm transition-all hover:bg-slate-50 group">
                                   <div className="flex items-center gap-4"><span className="w-16 text-indigo-600 font-black tracking-widest">{t.year}</span><span className="text-slate-700">{t.text}</span></div>
                                   <button type="button" onClick={() => setNewGame(prev => ({...prev, timelineItems: prev.timelineItems?.filter(ti => ti.id !== t.id)}))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="4"/></svg></button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* --- OBJETS CACHÉS --- */}
                      {newGame.type === 'Objets Cachés' && (
                        <div className="p-8 bg-indigo-50 rounded-[40px] space-y-8 border border-indigo-100">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-[0.2em]">Configuration Objets ({newGame.hiddenObjects?.length})</h4>
                              <input type="file" className="hidden" ref={gameHiddenImgRef} accept="image/*" onChange={e => handleFileUpload(e, (data) => setNewGame(prev => ({...prev, hiddenObjectsImage: data})))} />
                              <button type="button" onClick={() => gameHiddenImgRef.current?.click()} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/10">Charger Décor Local</button>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input placeholder="Réponse (ex: Pénétromètre)..." className="flex-1 bg-white border border-indigo-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={currentObjectName} onChange={e => setCurrentObjectName(e.target.value)} />
                              <input placeholder="Question (ex: Quel outil sert à...)..." className="flex-1 bg-white border border-indigo-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={currentObjectQuestion} onChange={e => setCurrentObjectQuestion(e.target.value)} />
                           </div>
                           <div className="bg-indigo-100 text-indigo-700 px-6 py-4 rounded-2xl text-[10px] font-black flex items-center justify-center italic tracking-widest uppercase">CLIQUEZ SUR L'IMAGE POUR PLACER L'OBJET RÉPONSE</div>
                           <div className="relative w-full aspect-video bg-white border-4 border-indigo-200 rounded-[40px] flex items-center justify-center cursor-crosshair overflow-hidden shadow-inner group" onClick={handleHiddenAreaClick}>
                              {newGame.hiddenObjectsImage ? (
                                <>
                                   <img src={newGame.hiddenObjectsImage} className="w-full h-full object-contain pointer-events-none select-none" />
                                   {newGame.hiddenObjects?.map(obj => (
                                     <div key={obj.id} className="absolute border-4 border-red-500 bg-red-500/30 rounded-full flex items-center justify-center group/marker shadow-[0_0_15px_rgba(239,68,68,0.5)]" style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: '40px', height: '40px', transform: 'translate(-50%, -50%)' }}>
                                        <button type="button" onClick={(e) => { e.stopPropagation(); setNewGame(prev => ({...prev, hiddenObjects: prev.hiddenObjects?.filter(o=>o.id!==obj.id)})); }} className="absolute -top-10 bg-red-600 text-white rounded-full p-2 opacity-0 group-hover/marker:opacity-100 transition-all shadow-xl"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="4"/></svg></button>
                                        <div className="absolute -bottom-10 whitespace-nowrap bg-black/70 text-white px-2 py-1 rounded text-[10px] font-bold shadow-lg">
                                           {obj.label}
                                        </div>
                                     </div>
                                   ))}
                                </>
                              ) : <span className="text-sm font-bold text-indigo-300 italic opacity-50">Aucune image chargée. Chargez un décor pour commencer à placer vos objets secrets.</span>}
                           </div>
                        </div>
                      )}

                      <div className="flex gap-4 pt-8 border-t border-slate-100">
                        <button type="button" onClick={() => setShowGameModal(false)} className="flex-1 py-5 font-bold text-slate-500 hover:text-slate-700 transition-all">Annuler</button>
                        <button type="submit" className="flex-2 px-16 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.3em] shadow-2xl hover:bg-indigo-700 transition-all active:scale-[0.98]">Publier l'Expérience</button>
                      </div>
                   </form>
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- NEWSLETTER TAB --- */}
      {activeTab === 'newsletter' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">Édition Newsletter</h2>
              <button onClick={() => { 
                setShowNewsModal(true); 
                setEditingArticleId(null);
                setNewsTitle('');
                setNewsSummary('');
                setNewsCover('');
                setNewsArticles([]);
              }} className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg">Nouvelle édition</button>
           </div>
           <div className="space-y-4">
              {newsletters.map(n => (
                <div key={n.id} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between group shadow-sm transition-all hover:shadow-md">
                   <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                         {n.coverImage ? <img src={n.coverImage} className="w-full h-full object-cover rounded-2xl" /> : <span className="text-2xl">📰</span>}
                      </div>
                      <div className="overflow-hidden">
                         <h3 className="font-black text-slate-800 truncate">{n.title}</h3>
                         <p className="text-xs text-slate-400">Publié le {new Date(n.publishedAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                   </div>
                   <button onClick={() => onDeleteNewsletter(n.id)} className="text-slate-300 hover:text-red-500 p-2 shrink-0 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth="2.5" /></svg></button>
                </div>
              ))}
              {newsletters.length === 0 && <div className="py-20 text-center text-slate-300 italic">Aucune newsletter archivée.</div>}
           </div>
        </div>
      )}

      {/* MODALE NEWSLETTER DESIGN */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
              <div className="p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                 <div className="flex items-center gap-4">
                    {editingArticleId && (
                      <button onClick={() => setEditingArticleId(null)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" /></svg>
                      </button>
                    )}
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      {editingArticleId ? "Édition de l'article" : "Conception Newsletter"}
                    </h2>
                 </div>
                 <button onClick={() => setShowNewsModal(false)} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 custom-scrollbar">
                {!editingArticleId ? (
                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-7 space-y-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Titre de l'édition</label>
                            <input value={newsTitle} onChange={e => setNewsTitle(e.target.value)} className="w-full bg-white border border-slate-200 rounded-[24px] px-8 py-6 font-black text-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" placeholder="Ex: L'Écho de Star Fruits - Janvier 2026" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Résumé de couverture</label>
                            <textarea value={newsSummary} onChange={e => setNewsSummary(e.target.value)} className="w-full bg-white border border-slate-200 rounded-[24px] px-8 py-6 text-lg italic outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm h-32 resize-none" placeholder="Un mot de la direction pour introduire cette édition..." />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Image de couverture (Local)</label>
                            <input type="file" className="hidden" ref={newsCoverRef} accept="image/*" onChange={e => handleFileUpload(e, setNewsCover)} />
                            <div onClick={() => newsCoverRef.current?.click()} className="w-full aspect-[21/9] bg-white border-2 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center cursor-pointer overflow-hidden shadow-inner group transition-all hover:border-blue-400">
                               {newsCover ? <img src={newsCover} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="text-center space-y-2"><svg className="w-10 h-10 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.856a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choisir un visuel</span></div>}
                            </div>
                         </div>
                      </div>
                      <div className="lg:col-span-5 space-y-6">
                         <div className="flex items-center justify-between ml-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Articles ({newsArticles.length})</label>
                            <button onClick={handleAddNewsArticle} className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">+ Ajouter un article</button>
                         </div>
                         <div className="space-y-4">
                            {newsArticles.map((art, idx) => (
                              <div key={art.id} onClick={() => setEditingArticleId(art.id)} className="p-6 bg-white rounded-[24px] border border-slate-200 flex items-center justify-between group shadow-sm transition-all hover:shadow-md cursor-pointer animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                                 <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-black">0{idx + 1}</div>
                                    <span className="text-base font-black text-slate-800">{art.title}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); setNewsArticles(newsArticles.filter(a => a.id !== art.id)); }} className="text-slate-300 hover:text-red-500 transition-colors p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" strokeWidth="2.5"/></svg></button>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
                      <div className="space-y-6 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Titre de l'article</label>
                               <input value={editingArticle!.title} onChange={e => handleUpdateArticle(editingArticle!.id, { title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Catégorie</label>
                               <select value={editingArticle!.category} onChange={e => handleUpdateArticle(editingArticle!.id, { category: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold outline-none focus:ring-2 focus:ring-blue-500">
                                  <option value="">Sélectionner une catégorie</option>
                                  <option value="Général">Général</option>
                                  <option value="RH">RH</option>
                                  <option value="Événements">Événements</option>
                                  <option value="Social">Social</option>
                                  <option value="Tech">Tech</option>
                                  <option value="Globe-Trotter">Globe-Trotter</option>
                                  <option value="R&D">R&D</option>
                                  <option value="Innovation">Innovation</option>
                               </select>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Résumé introductif</label>
                            <textarea value={editingArticle!.summary} onChange={e => handleUpdateArticle(editingArticle!.id, { summary: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm italic outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="Accroche de l'article..." />
                         </div>
                         <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Image principale (Local)</label>
                            <input type="file" className="hidden" id="art-img" accept="image/*" onChange={e => handleFileUpload(e, (data) => handleUpdateArticle(editingArticle!.id, { image: data }))} />
                            <div onClick={() => document.getElementById('art-img')?.click()} className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden group">
                               {editingArticle!.image ? <img src={editingArticle!.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <span className="text-xs font-bold text-slate-300">Cliquer pour charger une image</span>}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-700">Contenu de l'article</h3>
                            <div className="flex gap-2">
                               {[
                                 { type: 'text', icon: 'T', label: 'Texte' },
                                 { type: 'image', icon: '🖼️', label: 'Image' },
                                 { type: 'video', icon: '🎥', label: 'Vidéo' },
                                 { type: 'gallery', icon: '🎴', label: 'Galerie' }
                               ].map(b => (
                                 <button key={b.type} onClick={() => handleAddBlock(editingArticle!.id, b.type as any)} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                                   + {b.label}
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-6">
                            {editingArticle!.blocks.map((block, bIdx) => (
                              <div key={block.id} className="relative group/block animate-in slide-in-from-top-4 duration-500">
                                 <button onClick={() => handleRemoveBlock(editingArticle!.id, block.id)} className="absolute -right-4 -top-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-block:hover:opacity-100 transition-opacity z-10 shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="4"/></svg></button>
                                 <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                                    {block.type === 'text' && (
                                      <textarea value={block.content} onChange={e => handleUpdateBlock(editingArticle!.id, block.id, e.target.value)} className="w-full text-lg leading-relaxed text-slate-700 outline-none min-h-[100px] border-none focus:ring-0" placeholder="Écrire ici..." />
                                    )}
                                    {block.type === 'image' && (
                                      <div className="space-y-4">
                                         <input type="file" className="hidden" id={`block-img-${block.id}`} accept="image/*" onChange={e => handleFileUpload(e, (data) => handleUpdateBlock(editingArticle!.id, block.id, data))} />
                                         <div onClick={() => document.getElementById(`block-img-${block.id}`)?.click()} className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                                            {block.content ? <img src={block.content} className="w-full h-full object-contain" /> : <span className="text-xs font-bold text-slate-300">Charger image locale</span>}
                                         </div>
                                      </div>
                                    )}
                                    {block.type === 'video' && (
                                      <div className="space-y-4">
                                         <input type="file" className="hidden" id={`block-vid-${block.id}`} accept="video/*" onChange={e => handleFileUpload(e, (data) => handleUpdateBlock(editingArticle!.id, block.id, data))} />
                                         <div onClick={() => document.getElementById(`block-vid-${block.id}`)?.click()} className="w-full aspect-video bg-black rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                                            {block.content ? <video src={block.content} className="w-full h-full" /> : <span className="text-xs font-bold text-slate-500">Charger vidéo locale</span>}
                                         </div>
                                      </div>
                                    )}
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                )}
              </div>
              
              <div className="p-10 border-t border-slate-100 bg-white flex justify-end gap-6 shrink-0">
                 {!editingArticleId ? (
                   <button onClick={handleCreateNewsletterSubmit} className="px-16 py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-700 shadow-2xl transition-all active:scale-95">PUBLIER L'ÉDITION</button>
                 ) : (
                   <button onClick={() => setEditingArticleId(null)} className="px-16 py-5 bg-slate-900 text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95">ENREGISTRER L'ARTICLE</button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* --- MODÉRATION --- */}
      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
           <h2 className="text-2xl font-black text-slate-800">Modération du mur social</h2>
           <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Auteur</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Publication</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {posts.map(p => (
                      <tr key={p.id}>
                         <td className="px-6 py-4 text-sm font-bold text-slate-700">{p.userName}</td>
                         <td className="px-6 py-4"><p className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</p></td>
                         <td className="px-6 py-4 text-right">
                            <button onClick={() => onDeletePost(p.id)} className="text-red-500 font-bold text-xs hover:underline bg-red-50 px-3 py-1 rounded-lg transition-all">Supprimer</button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* --- BIEN-ÊTRE --- */}
      {activeTab === 'wellness' && (
        <div className="space-y-8 animate-in slide-in-from-top-4 duration-500 text-left">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">Contenus Bien-être</h2>
              <div className="flex gap-4">
                 <button onClick={() => setShowChallengeModal(true)} className="px-6 py-2.5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 shadow-lg transition-all">Ajouter un défi</button>
                 <button onClick={() => setShowWellnessModal(true)} className="px-6 py-2.5 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 shadow-lg transition-all">Ajouter un contenu</button>
              </div>
           </div>
           
           <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm">
              <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-6 px-2">Gestion des Défis</h3>
              <div className="space-y-4">
                 {wellnessChallenges.map(c => (
                   <div key={c.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-slate-100 transition-all hover:bg-slate-100">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-slate-800">{c.title}</p>
                          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{c.points} pts</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{c.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => onToggleWellnessChallenge(c.id)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${c.isActive ? 'bg-green-600 text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>{c.isActive ? 'ACTIF' : 'ACTIVER'}</button>
                        <button onClick={() => onDeleteWellnessChallenge(c.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg></button>
                      </div>
                   </div>
                 ))}
                 {wellnessChallenges.length === 0 && <p className="text-center py-10 text-slate-300 italic">Aucun défi créé.</p>}
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wellnessContents.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-[32px] border border-slate-200 flex items-center justify-between group shadow-sm transition-all hover:shadow-md">
                   <div className="overflow-hidden">
                      <span className="text-[9px] font-black uppercase text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full mb-1 inline-block tracking-widest">{c.category}</span>
                      <h4 className="font-bold text-slate-800 truncate">{c.title}</h4>
                   </div>
                   <button onClick={() => onDeleteWellnessContent(c.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2.5" /></svg></button>
                </div>
              ))}
           </div>

           {/* Modal Création Défi */}
           {showChallengeModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in">
                   <h3 className="text-xl font-black text-slate-800 mb-6">Nouveau défi bien-être</h3>
                   <form onSubmit={handleAddChallengeSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Titre du défi</label>
                        <input required placeholder="Ex: 10 000 pas par jour" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-green-500" value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</label>
                        <textarea required placeholder="Expliquez les règles du défi..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 h-24 outline-none focus:ring-2 focus:ring-green-500 resize-none" value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Récompense (Points)</label>
                        <input type="number" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-black text-green-600 outline-none" value={newChallenge.points} onChange={e => setNewChallenge({...newChallenge, points: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowChallengeModal(false)} className="flex-1 py-4 font-bold text-slate-500">Annuler</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">CRÉER LE DÉFI</button>
                      </div>
                   </form>
                </div>
             </div>
           )}

           {showWellnessModal && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                   <h3 className="text-xl font-black text-slate-800 mb-6">Nouveau contenu bien-être</h3>
                   <form onSubmit={handleAddWellnessSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Type de contenu</label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none appearance-none" value={newWellness.type} onChange={e => setNewWellness({...newWellness, type: e.target.value as any})}>
                            <option value="article">Article</option>
                            <option value="video">Vidéo Locale</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Catégorie</label>
                          <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none appearance-none" value={newWellness.category} onChange={e => setNewWellness({...newWellness, category: e.target.value as any})}>
                            <option value="Mental">Mental</option>
                            <option value="Physique">Physique</option>
                            <option value="Nutrition">Nutrition</option>
                            <option value="Sommeil">Sommeil</option>
                            <option value="Travail">Travail</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Titre de l'article</label>
                        <input required placeholder="Titre accrocheur..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-pink-500" value={newWellness.title} onChange={e => setNewWellness({...newWellness, title: e.target.value})} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Résumé court</label>
                        <textarea required placeholder="Une phrase pour donner envie de lire..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm italic outline-none focus:ring-2 focus:ring-pink-500 h-20 resize-none" value={newWellness.summary} onChange={e => setNewWellness({...newWellness, summary: e.target.value})} />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contenu complet (Texte)</label>
                        <textarea required placeholder="Écrivez votre article ici..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text base outline-none focus:ring-2 focus:ring-pink-500 h-48 resize-none" value={newWellness.content} onChange={e => setNewWellness({...newWellness, content: e.target.value})} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Visuel principal (Image ou Vidéo)</label>
                        <input type="file" className="hidden" ref={wellnessMediaRef} accept={newWellness.type === 'video' ? "video/*" : "image/*"} onChange={(e) => handleFileUpload(e, (data) => setNewWellness({...newWellness, mediaUrl: data}))} />
                        <div onClick={() => wellnessMediaRef.current?.click()} className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner">
                           {newWellness.mediaUrl ? (newWellness.type === 'video' ? <video src={newWellness.mediaUrl} className="w-full h-full object-cover" /> : <img src={newWellness.mediaUrl} className="w-full h-full object-cover" />) : <><svg className="w-10 h-10 text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.856a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2"/></svg><span className="text-xs text-slate-400 font-bold">Charger média local</span></>}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowWellnessModal(false)} className="flex-1 py-4 font-bold text-slate-500">Annuler</button>
                        <button type="submit" className="flex-2 px-10 py-4 bg-pink-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">PUBLIER SUR LE BIEN-ÊTRE</button>
                      </div>
                   </form>
                </div>
             </div>
           )}
        </div>
      )}

      {/* --- BOÎTE À IDÉES --- */}
      {activeTab === 'ideas' && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 text-left">
           <h2 className="text-2xl font-black text-slate-800">Gestion des suggestions</h2>
           <div className="grid grid-cols-1 gap-4">
              {ideas.map(i => (
                <div key={i.id} className="bg-white p-6 rounded-[32px] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm transition-all hover:shadow-md">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                         <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full tracking-widest">{i.category}</span>
                         <span className="text-xs text-slate-400 font-bold">Par {i.userName}</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-lg">{i.title}</h4>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2 italic">"{i.description}"</p>
                   </div>
                   <div className="flex items-center gap-6 shrink-0">
                      <select value={i.status} onChange={(e) => onUpdateIdeaStatus(i.id, e.target.value as IdeaStatus)} className="bg-slate-50 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest py-3 px-5 focus:ring-2 focus:ring-amber-500 transition-all outline-none appearance-none cursor-pointer">
                         <option value="Suggestion">Suggestion</option>
                         <option value="À l'étude">À l'étude</option>
                         <option value="Planifiée">Planifiée</option>
                         <option value="Réalisée">Réalisée</option>
                         <option value="Refusée">Refusée</option>
                      </select>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* --- APPARENCE --- */}
      {activeTab === 'appearance' && (
        <div className="max-w-2xl space-y-8 animate-in slide-in-from-top-4 duration-500 text-left">
           <h2 className="text-2xl font-black text-slate-800">Identité visuelle & Paramètres</h2>
           <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-10">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Nom de l'application</label>
                 <input value={appConfig.appName} onChange={e => onUpdateConfig({...appConfig, appName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 font-black text-xl outline-none focus:ring-4 focus:ring-purple-500/10 transition-all" />
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Slogan public</label>
                 <input value={appConfig.appSlogan} onChange={e => onUpdateConfig({...appConfig, appSlogan: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 font-medium outline-none focus:ring-4 focus:ring-purple-500/10 transition-all" />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] ml-2">Logo principal (Local)</label>
                 <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (data) => onUpdateConfig({...appConfig, logoUrl: data}))} />
                 <div onClick={() => logoRef.current?.click()} className="w-40 h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden mx-auto shadow-inner group">
                    {appConfig.logoUrl ? <img src={appConfig.logoUrl} className="w-full h-full object-contain p-6 transition-transform group-hover:scale-110" alt="Logo" /> : <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5"/></svg>}
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Catégories de documents</h3>
                 <form onSubmit={handleAddDocCategory} className="flex gap-2">
                    <input 
                      value={newDocCategory} 
                      onChange={e => setNewDocCategory(e.target.value)} 
                      placeholder="Nouvelle catégorie..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500" 
                    />
                    <button type="submit" className="px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all">Ajouter</button>
                 </form>
                 <div className="flex flex-wrap gap-2">
                    {appConfig.documentCategories.map(cat => (
                      <div key={cat} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 group hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer" onClick={() => handleRemoveDocCategory(cat)}>
                         {cat}
                         <svg className="w-4 h-4 opacity-0 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100 space-y-6">
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Textes de bienvenue</h3>
                 <input value={appConfig.welcomeTitle} onChange={e => onUpdateConfig({...appConfig, welcomeTitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none" placeholder="Titre d'accueil..." />
                 <input value={appConfig.welcomeSubtitle} onChange={e => onUpdateConfig({...appConfig, welcomeSubtitle: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-medium outline-none" placeholder="Sous-titre d'accueil..." />
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
