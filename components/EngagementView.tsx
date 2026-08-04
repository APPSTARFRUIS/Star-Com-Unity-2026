import React, { useMemo, useState } from 'react';
import { CompanyGame, EngagementAnimation, EngagementType, GamePrediction, Idea, PointsTransaction, Poll, Post, User } from '../types';
import JeuxView from './JeuxView';

interface AdventOutcome {
  answer?: string;
  instantWin?: boolean;
}

interface EngagementViewProps {
  users: User[];
  currentUser: User;
  transactions: PointsTransaction[];
  posts: Post[];
  ideas: Idea[];
  polls: Poll[];
  animations: EngagementAnimation[];
  onJoinAnimation: (animation: EngagementAnimation) => Promise<void>;
  onOpenAdventDay: (animation: EngagementAnimation, dayNumber: number, outcome?: AdventOutcome) => Promise<void>;
  section?: 'rankings' | 'highlights';
  games: CompanyGame[];
  predictions: GamePrediction[];
  onAddPrediction: (gameId: string, eventId: string, homeScore: number, awayScore: number) => void;
  onEarnPoints: (userId: string, amount: number, reason: string) => void;
}

type Tab = 'general' | 'month' | 'contributors' | 'animations';

const typeLabels: Record<EngagementType, string> = {
  countdown: 'Compte à rebours', raffle: 'Tirage au sort', contest: 'Jeu concours', advent: "Calendrier de l'Avent", mission: 'Mission ponctuelle', season: 'Saison'
};
const typeIcons: Record<EngagementType, string> = { countdown: '⏳', raffle: '🎟️', contest: '🏁', advent: '🎄', mission: '🎯', season: '🏆' };
const adventIcons: Record<string, string> = { gift: '🎁', quiz: '❓', video: '🎥', document: '📄', mission: '🎯', coupon: '🎫', instant: '🎲', game: '🧩', mystery: '📸', fact: '💡', jackpot: '🎉' };

const EngagementView: React.FC<EngagementViewProps> = ({
  users, currentUser, transactions, posts, ideas, polls, animations, onJoinAnimation, onOpenAdventDay, section = 'rankings',
  games, predictions, onAddPrediction, onEarnPoints
}) => {
  const [tab, setTab] = useState<Exclude<Tab, 'animations'>>('general');
  const [openedAdvent, setOpenedAdvent] = useState<EngagementAnimation | null>(null);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const generalRanking = useMemo(() => [...users].sort((a, b) => (b.points || 0) - (a.points || 0)), [users]);
  const monthRanking = useMemo(() => {
    const scores = new Map<string, number>(); users.forEach(u => scores.set(u.id, 0));
    transactions.forEach(t => { if (new Date(t.date) >= monthStart) { const sign = t.type === 'spend' ? -1 : 1; scores.set(t.userId, (scores.get(t.userId) || 0) + sign * Math.abs(t.amount)); } });
    return users.map(u => ({ ...u, points: scores.get(u.id) || 0 })).sort((a, b) => b.points - a.points);
  }, [users, transactions]);
  const visibleAnimations = useMemo(() => animations.filter(animation => animation.status === 'active'), [animations]);

  const contributors = useMemo(() => users.map(user => {
    const userPosts = posts.filter(p => p.userId === user.id).length;
    const postComments = posts.reduce((sum, p) => sum + (p.comments || []).filter(c => c.userId === user.id).length, 0);
    const userIdeas = ideas.filter(i => i.userId === user.id).length;
    const ideaComments = ideas.reduce((sum, i) => sum + (i.comments || []).filter(c => c.userId === user.id).length, 0);
    const pollAnswers = polls.reduce((sum, p) => sum + (p.responses || []).filter(r => r.userId === user.id).length, 0);
    return { user, score: userPosts * 5 + (postComments + ideaComments) * 2 + userIdeas * 4 + pollAnswers * 2, userPosts, comments: postComments + ideaComments, userIdeas, pollAnswers };
  }).sort((a, b) => b.score - a.score), [users, posts, ideas, polls]);

  const countdown = (date?: string) => {
    if (!date) return '';
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return 'Terminé';
    const days = Math.floor(diff / 86400000); const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `J-${days}` : `${hours} h restantes`;
  };

  const renderRanking = (ranking: User[]) => <div className="space-y-3">{ranking.map((user, index) => {
    const own = user.id === currentUser.id;
    return <div key={user.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${own ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white'}`}><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>{index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}</div><img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100" /><div className="min-w-0 flex-1"><p className="font-black text-slate-900 truncate">{user.name}{own ? ' · Moi' : ''}</p><p className="text-xs text-slate-500 truncate">{user.department || user.company}</p></div><div className="text-right"><p className="text-xl font-black text-green-700">{user.points || 0}</p><p className="text-[10px] uppercase font-bold text-slate-400">points</p></div></div>;
  })}</div>;

  const getAvailableDay = (animation: EngagementAnimation) => {
    const start = animation.startDate ? new Date(animation.startDate) : new Date(new Date().getFullYear(), 11, 1);
    const now = new Date();
    if (now < start) return 0;
    const elapsed = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()) / 86400000) + 1;
    return Math.max(0, Math.min(24, elapsed));
  };

  const openDay = (animation: EngagementAnimation, day: any) => {
    if (day.day > getAvailableDay(animation)) return;
    setOpenedAdvent(animation); setSelectedDay(day); setAnswer('');
  };

  const submitDay = async () => {
    if (!openedAdvent || !selectedDay) return;
    setIsSubmitting(true);
    try {
      let outcome: AdventOutcome = {};
      if (selectedDay.type === 'quiz' || selectedDay.type === 'mystery') outcome.answer = answer.trim();
      if (selectedDay.type === 'instant') outcome.instantWin = Math.random() * 100 < Number(selectedDay.winProbability || 0);
      await onOpenAdventDay(openedAdvent, selectedDay.day, outcome);
      setSelectedDay({ ...selectedDay, openedBy: [...(selectedDay.openedBy || []), currentUser.id], winnerIds: outcome.instantWin ? [...(selectedDay.winnerIds || []), currentUser.id] : (selectedDay.winnerIds || []) });
    } finally { setIsSubmitting(false); }
  };

  return <div className="max-w-6xl mx-auto pb-16">
    <div className="mb-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Engagement</p>
      <h1 className="text-3xl md:text-4xl font-black text-slate-900">{section === 'rankings' ? 'Classements' : 'Temps forts'}</h1>
      <p className="text-slate-500 mt-2">{section === 'rankings' ? 'Podiums, progression mensuelle et contributions.' : 'Calendriers, tirages au sort, concours, missions et saisons en cours.'}</p>
    </div>
    {section === 'rankings' && <>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">{[['general','Classement général'],['month','Ce mois'],['contributors','Top contributeurs']].map(([id,label]) => <button key={id} onClick={() => setTab(id as Exclude<Tab, 'animations'>)} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-black ${tab === id ? 'bg-[#14532d] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>)}</div>
      {tab === 'general' && renderRanking(generalRanking)}
      {tab === 'month' && renderRanking(monthRanking)}
      {tab === 'contributors' && <div className="space-y-3"><div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-4 text-sm">Score automatique : publication 5 pts, idée 4 pts, commentaire 2 pts, réponse à un sondage 2 pts.</div>{contributors.map((entry, index) => <div key={entry.user.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 ${entry.user.id === currentUser.id ? 'border-green-500' : 'border-slate-100'}`}><div className="w-9 text-center font-black text-slate-400">#{index + 1}</div><img src={entry.user.avatar} alt="" className="w-11 h-11 rounded-full" /><div className="flex-1 min-w-0"><p className="font-black truncate">{entry.user.name}</p><p className="text-xs text-slate-500">{entry.userPosts} publications · {entry.comments} commentaires · {entry.userIdeas} idées · {entry.pollAnswers} sondages</p></div><div className="font-black text-xl text-blue-700">{entry.score}</div></div>)}</div>}
    </>}
    {section === 'highlights' && <>
      <div className="mb-10"><JeuxView games={games} currentUser={currentUser} users={users} predictions={predictions} onAddPrediction={onAddPrediction} onEarnPoints={onEarnPoints} mode="predictions" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{visibleAnimations.length === 0 && <div className="md:col-span-2 bg-white rounded-2xl p-12 text-center text-slate-400">Aucun temps fort actif pour le moment.</div>}{visibleAnimations.map(animation => {
      const joined = (animation.participants || []).includes(currentUser.id); const winners = users.filter(u => (animation.winnerIds || []).includes(u.id));
      const adventDays = animation.type === 'advent' ? (animation.config?.days || []) : [];
      const openedCount = adventDays.filter((day: any) => (day.openedBy || []).includes(currentUser.id)).length;
      return <article key={animation.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">{animation.imageUrl && <img src={animation.imageUrl} alt="" className="w-full h-44 object-cover" />}<div className="p-6"><div className="flex justify-between gap-3"><span className="text-2xl">{typeIcons[animation.type] || '✨'}</span><span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-black">{typeLabels[animation.type] || animation.type}</span></div><h3 className="text-xl font-black text-slate-900 mt-3">{animation.title}</h3><p className="text-slate-500 mt-2">{animation.description}</p>{animation.endDate && <div className="mt-4 text-3xl font-black text-[#14532d]">{countdown(animation.endDate)}</div>}{animation.type === 'advent' && <div className="mt-5"><div className="flex justify-between text-sm font-black"><span>{openedCount} / 24 cases ouvertes</span><span>{Math.round((openedCount / 24) * 100)}%</span></div><div className="h-3 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(openedCount / 24) * 100}%` }} /></div><button onClick={() => setOpenedAdvent(animation)} className="mt-4 w-full px-4 py-3 bg-purple-600 text-white rounded-xl font-black">Ouvrir le calendrier</button></div>}{animation.rewardLabel && <p className="mt-3 text-sm font-bold text-amber-700">À gagner : {animation.rewardLabel}</p>}{winners.length > 0 && <p className="mt-3 font-black text-purple-700">Gagnant{winners.length > 1 ? 's' : ''} : {winners.map(w => w.name).join(', ')}</p>}<div className="mt-5 flex flex-wrap gap-2">{animation.type !== 'advent' && !joined && animation.status === 'active' && animation.type !== 'countdown' && <button onClick={() => onJoinAnimation(animation)} className="px-4 py-2.5 bg-[#14532d] text-white rounded-xl font-black">{animation.type === 'raffle' ? `Prendre un ticket${animation.pointsCost ? ` · ${animation.pointsCost} pts` : ''}` : 'Participer'}</button>}{animation.type !== 'advent' && joined && <span className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-black">Participation enregistrée</span>}</div></div></article>;
    })}</div></>}

    {openedAdvent && <div className="fixed inset-0 z-[300] bg-slate-950/70 backdrop-blur-sm overflow-y-auto p-3 md:p-8"><div className="max-w-5xl mx-auto bg-white rounded-3xl overflow-hidden min-h-[80vh]"><div className="p-5 md:p-7 bg-gradient-to-r from-purple-700 to-pink-600 text-white flex justify-between items-start"><div><p className="text-sm font-black uppercase tracking-widest">Calendrier de l’Avent</p><h2 className="text-2xl md:text-4xl font-black mt-1">{openedAdvent.title}</h2><p className="text-white/80 mt-2">{openedAdvent.description}</p></div><button onClick={() => { setOpenedAdvent(null); setSelectedDay(null); }} className="w-10 h-10 rounded-full bg-white/15 text-2xl">×</button></div><div className="p-5 md:p-8"><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">{(openedAdvent.config?.days || []).map((day: any) => {
      const available = day.day <= getAvailableDay(openedAdvent); const opened = (day.openedBy || []).includes(currentUser.id);
      return <button key={day.day} disabled={!available} onClick={() => openDay(openedAdvent, day)} className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${opened ? 'bg-green-50 border-green-400 text-green-700' : available ? 'bg-white border-purple-200 hover:border-purple-500 text-purple-800' : 'bg-slate-100 border-slate-100 text-slate-300'}`}><span className="text-xl">{opened ? '✓' : available ? adventIcons[day.type] || '🎁' : '🔒'}</span><span className="font-black mt-1">{day.day}</span></button>;
    })}</div></div></div></div>}

    {selectedDay && openedAdvent && <div className="fixed inset-0 z-[320] bg-slate-950/70 flex items-center justify-center p-4"><div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6 md:p-8"><div className="flex justify-between"><div className="text-5xl">{adventIcons[selectedDay.type] || '🎁'}</div><button onClick={() => setSelectedDay(null)} className="text-2xl">×</button></div>{selectedDay.imageUrl && <img src={selectedDay.imageUrl} className="w-full h-56 object-cover rounded-2xl mt-5" alt="" />}<p className="text-xs uppercase tracking-widest font-black text-purple-600 mt-5">Case du {selectedDay.day} décembre</p><h3 className="text-2xl font-black mt-2">{selectedDay.title || 'Surprise du jour'}</h3><p className="text-slate-600 mt-3 whitespace-pre-line">{selectedDay.description}</p>
      {(selectedDay.type === 'quiz' || selectedDay.type === 'mystery') && !(selectedDay.openedBy || []).includes(currentUser.id) && <div className="mt-5 space-y-3"><p className="font-black">{selectedDay.question}</p>{selectedDay.type === 'quiz' ? (selectedDay.options || []).filter(Boolean).map((option: string) => <label key={option} className={`block border rounded-xl p-3 cursor-pointer ${answer === option ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}`}><input type="radio" className="mr-3" checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>) : <input value={answer} onChange={e => setAnswer(e.target.value)} className="w-full border rounded-xl px-4 py-3" placeholder="Votre réponse" />}</div>}
      {selectedDay.type === 'coupon' && selectedDay.couponCode && <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center"><p className="text-xs uppercase font-black text-amber-700">Votre coupon</p><p className="text-2xl font-black mt-2">{selectedDay.couponCode}</p></div>}
      {(selectedDay.openedBy || []).includes(currentUser.id) && <div className="mt-5 p-4 rounded-2xl bg-green-50 text-green-800 font-black">Cette case a déjà été ouverte.</div>}
      {selectedDay.rewardLabel && <p className="mt-4 font-black text-amber-700">Récompense : {selectedDay.rewardLabel}</p>}{selectedDay.linkUrl && <a href={selectedDay.linkUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex px-4 py-3 rounded-xl bg-blue-600 text-white font-black">{selectedDay.buttonLabel || 'Découvrir le contenu'}</a>}
      {!(selectedDay.openedBy || []).includes(currentUser.id) && <button onClick={submitDay} disabled={isSubmitting || ((selectedDay.type === 'quiz' || selectedDay.type === 'mystery') && !answer.trim())} className="mt-6 w-full py-4 rounded-xl bg-purple-600 text-white font-black disabled:opacity-50">{isSubmitting ? 'Validation…' : selectedDay.type === 'instant' ? 'Tenter ma chance' : 'Ouvrir la case'}</button>}
    </div></div></div>}
  </div>;
};

export default EngagementView;
