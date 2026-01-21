import React, { useState, useMemo, useEffect } from 'react';
import { User, Celebration, UserRole } from '../types';

interface CelebrationsViewProps {
  currentUser: User;
  users: User[];
  celebrations: Celebration[];
  onAddCelebration: (c: Omit<Celebration, 'id' | 'likes' | 'createdBy'>) => void;
  onLikeCelebration: (id: string) => void;
  onDeleteCelebration: (id: string) => void;
  preSelectedUserId?: string; // Nouvelle prop pour pré-remplissage
}

type CelebrationType = 'success' | 'welcome' | 'anniversary';

const CelebrationsView: React.FC<CelebrationsViewProps> = ({ 
  currentUser, 
  users, 
  celebrations, 
  onAddCelebration, 
  onLikeCelebration,
  onDeleteCelebration,
  preSelectedUserId
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<CelebrationType>('success');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState('');

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR;

  const currentMonth = new Date().getMonth() + 1;
  const currentDay = new Date().getDate();

  const birthdays = useMemo(() => {
    return users
      .filter(u => u.birthday)
      .map(u => {
        const [m, d] = u.birthday!.split('-').map(Number);
        let isToday = m === currentMonth && d === currentDay;
        return { ...u, birthMonth: m, birthDay: d, isToday };
      })
      .filter(u => u.birthMonth === currentMonth)
      .sort((a, b) => a.birthDay - b.birthDay);
  }, [users, currentMonth, currentDay]);

  // Gérer le pré-remplissage si on vient du dashboard ou d'un bouton direct
  const openWishModal = (user: User) => {
    setNewType('anniversary');
    setSelectedUserId(user.id);
    setNewTitle(`Joyeux anniversaire ${user.name.split(' ')[0]} ! 🎂`);
    setNewDesc(`Toute l'équipe te souhaite une excellente journée pour ton anniversaire !`);
    setShowModal(true);
  };

  useEffect(() => {
    if (preSelectedUserId) {
      const user = users.find(u => u.id === preSelectedUserId);
      if (user) openWishModal(user);
    }
  }, [preSelectedUserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.id === selectedUserId);
    onAddCelebration({
      type: newType,
      title: newTitle,
      description: newDesc,
      date: newDate,
      userName: user?.name,
      userAvatar: user?.avatar,
      userIds: selectedUserId ? [selectedUserId] : []
    });
    setShowModal(false);
    setNewTitle('');
    setNewDesc('');
    setSelectedUserId('');
    setNewType('success');
    setNewDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Célébrations</h1>
          <p className="text-slate-500">Célébrez les anniversaires et les réussites de l'équipe.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#14532d] text-white rounded-2xl font-bold hover:bg-green-800 shadow-md transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle célébration
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Colonne Anniversaires Automatiques */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" strokeWidth="2" /></svg>
             </div>
             Anniversaires du mois
          </h2>
          
          <div className="space-y-4">
            {birthdays.length > 0 ? birthdays.map(user => (
              <div key={user.id} className={`p-4 rounded-3xl border transition-all group ${user.isToday ? 'bg-gradient-to-br from-pink-50 to-orange-50 border-pink-100 shadow-sm ring-2 ring-pink-200 ring-offset-2' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                    {user.isToday && <span className="absolute -top-2 -right-2 text-xl animate-bounce">🎂</span>}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {user.isToday ? "C'est aujourd'hui !" : `${user.birthDay} ${new Date(2024, user.birthMonth - 1).toLocaleString('fr-FR', { month: 'long' })}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => openWishModal(user)}
                  className="w-full mt-4 py-2 bg-pink-100 text-pink-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-200 transition-all opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0"
                >
                  Lui souhaiter ✨
                </button>
              </div>
            )) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl py-12 text-center">
                <p className="text-slate-400 italic text-sm">Aucun anniversaire ce mois-ci.</p>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Fil des réussites & Anniversaires manuels */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
             <div className="p-2 bg-yellow-50 text-yellow-500 rounded-xl">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeWidth="2" /></svg>
             </div>
             Fil des célébrations
          </h2>

          <div className="space-y-6">
            {celebrations.length > 0 ? celebrations.map(c => (
              <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-4">
                      {c.userAvatar ? (
                        <img src={c.userAvatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                      ) : (
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          c.type === 'success' ? 'bg-yellow-50 text-yellow-600' : 
                          c.type === 'anniversary' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {c.type === 'success' ? <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeWidth="2" /> :
                             c.type === 'anniversary' ? <path d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" strokeWidth="2" /> :
                             <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" />}
                          </svg>
                        </div>
                      )}
                      <div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                          c.type === 'success' ? 'text-yellow-600' : 
                          c.type === 'anniversary' ? 'text-pink-600' : 'text-blue-600'
                        }`}>
                          {c.type === 'success' ? 'Réussite' : c.type === 'anniversary' ? 'Anniversaire' : 'Bienvenue'}
                        </span>
                        <h3 className="text-xl font-black text-slate-800 leading-tight">{c.title}</h3>
                        <p className="text-xs text-slate-400 mt-1 font-medium">{new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    {canManage && (
                      <button onClick={() => onDeleteCelebration(c.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                      </button>
                    )}
                  </div>
                  <p className="text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100 italic">
                    "{c.description}"
                  </p>
                </div>
                <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-50 flex items-center justify-between">
                   <button 
                     onClick={() => onLikeCelebration(c.id)}
                     className={`flex items-center gap-2 text-sm font-bold transition-all ${c.likes.includes(currentUser.id) ? 'text-green-600 scale-105' : 'text-slate-400 hover:text-green-500'}`}
                   >
                     <svg className="w-5 h-5" fill={c.likes.includes(currentUser.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeWidth="2" /></svg>
                     {c.likes.length > 0 ? `${c.likes.length} félicitations` : 'Féliciter'}
                   </button>
                   <div className="flex -space-x-2">
                      {c.likes.slice(0, 3).map((lId, idx) => {
                        const u = users.find(usr => usr.id === lId);
                        return <img key={idx} src={u?.avatar} className="w-6 h-6 rounded-full border-2 border-white" title={u?.name} />;
                      })}
                   </div>
                </div>
              </div>
            )) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeWidth="2" /></svg>
                </div>
                <p className="text-slate-400 font-medium italic">Aucune célébration publiée récemment.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Célébrer un événement</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</label>
                  <div className="flex gap-3">
                     {[
                       { id: 'success', label: 'Réussite', icon: '🏆' },
                       { id: 'welcome', label: 'Bienvenue', icon: '👋' },
                       { id: 'anniversary', label: 'Anniversaire', icon: '🎂' }
                     ].map((t) => (
                        <button 
                          key={t.id}
                          type="button" 
                          onClick={() => setNewType(t.id as any)}
                          className={`flex-1 py-3 px-2 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 text-sm ${
                            newType === t.id 
                              ? 'bg-green-50 border-green-500 text-green-700' 
                              : 'bg-[#f8fafc] border-transparent text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          <span className="text-base">{t.icon}</span>
                          {t.label}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collaborateur concerné</label>
                  <select 
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none appearance-none font-bold text-slate-700"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1em' }}
                  >
                    <option value="">Sélectionner un collègue...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Date de l'événement</label>
                  <input 
                    required
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none font-medium"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Titre</label>
                  <input 
                    required
                    type="text" 
                    placeholder={newType === 'success' ? "Ex: Fin de période d'essai validée !" : newType === 'anniversary' ? "Joyeux anniversaire !" : "Bienvenue dans l'équipe !"}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none font-bold placeholder:text-slate-300"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description / Message</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Dites-en plus pour que l'équipe puisse féliciter..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none placeholder:text-slate-300"
                  />
               </div>

               <button type="submit" className="w-full py-5 bg-[#14532d] text-white rounded-2xl font-bold shadow-xl shadow-green-900/20 hover:bg-green-800 transition-all active:scale-[0.98] mt-4">
                 Publier la célébration
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelebrationsView;