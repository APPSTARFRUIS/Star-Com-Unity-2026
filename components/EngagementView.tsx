import React, { useMemo, useState } from 'react';
import { EngagementAnimation, EngagementType, Idea, PointsTransaction, Poll, Post, User } from '../types';

interface EngagementViewProps {
  users: User[];
  currentUser: User;
  transactions: PointsTransaction[];
  posts: Post[];
  ideas: Idea[];
  polls: Poll[];
  animations: EngagementAnimation[];
  onJoinAnimation: (animation: EngagementAnimation) => Promise<void>;
}

type Tab = 'general' | 'month' | 'contributors' | 'animations';

const typeLabels: Record<EngagementType, string> = {
  countdown: 'Compte à rebours',
  raffle: 'Tirage au sort',
  contest: 'Jeu concours',
  advent: "Calendrier de l'Avent",
  mission: 'Mission ponctuelle',
  season: 'Saison'
};

const typeIcons: Record<EngagementType, string> = {
  countdown: '⏳', raffle: '🎟️', contest: '🏁', advent: '🎄', mission: '🎯', season: '🏆'
};

const EngagementView: React.FC<EngagementViewProps> = ({
  users, currentUser, transactions, posts, ideas, polls, animations, onJoinAnimation
}) => {
  const [tab, setTab] = useState<Tab>('general');
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const generalRanking = useMemo(() => [...users].sort((a, b) => (b.points || 0) - (a.points || 0)), [users]);

  const monthRanking = useMemo(() => {
    const scores = new Map<string, number>();
    users.forEach(u => scores.set(u.id, 0));
    transactions.forEach(t => {
      if (new Date(t.date) >= monthStart) {
        const sign = t.type === 'spend' ? -1 : 1;
        scores.set(t.userId, (scores.get(t.userId) || 0) + sign * Math.abs(t.amount));
      }
    });
    return users.map(u => ({ ...u, points: scores.get(u.id) || 0 })).sort((a, b) => b.points - a.points);
  }, [users, transactions]);

  const contributors = useMemo(() => {
    return users.map(user => {
      const userPosts = posts.filter(p => p.userId === user.id).length;
      const postComments = posts.reduce((sum, p) => sum + (p.comments || []).filter(c => c.userId === user.id).length, 0);
      const userIdeas = ideas.filter(i => i.userId === user.id).length;
      const ideaComments = ideas.reduce((sum, i) => sum + (i.comments || []).filter(c => c.userId === user.id).length, 0);
      const pollAnswers = polls.reduce((sum, p) => sum + (p.responses || []).filter(r => r.userId === user.id).length, 0);
      const score = userPosts * 5 + (postComments + ideaComments) * 2 + userIdeas * 4 + pollAnswers * 2;
      return { user, score, userPosts, comments: postComments + ideaComments, userIdeas, pollAnswers };
    }).sort((a, b) => b.score - a.score);
  }, [users, posts, ideas, polls]);

  const countdown = (date?: string) => {
    if (!date) return '';
    const diff = new Date(date).getTime() - Date.now();
    if (diff <= 0) return 'Terminé';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `J-${days}` : `${hours} h restantes`;
  };

  const renderRanking = (ranking: User[]) => (
    <div className="space-y-3">
      {ranking.map((user, index) => {
        const own = user.id === currentUser.id;
        return (
          <div key={user.id} className={`flex items-center gap-4 rounded-2xl border p-4 ${own ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'}`}>
              {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
            </div>
            <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-100" />
            <div className="min-w-0 flex-1">
              <p className="font-black text-slate-900 truncate">{user.name}{own ? ' · Moi' : ''}</p>
              <p className="text-xs text-slate-500 truncate">{user.department || user.company}</p>
            </div>
            <div className="text-right"><p className="text-xl font-black text-green-700">{user.points || 0}</p><p className="text-[10px] uppercase font-bold text-slate-400">points</p></div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Engagement</p>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">Classements & temps forts</h1>
        <p className="text-slate-500 mt-2">Podiums, contributions et animations ponctuelles. La création se pilote désormais depuis l’administration.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {[['general','Classement général'],['month','Ce mois'],['contributors','Top contributeurs'],['animations','Animations']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id as Tab)} className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-black ${tab === id ? 'bg-[#14532d] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>
        ))}
      </div>

      {tab === 'general' && renderRanking(generalRanking)}
      {tab === 'month' && renderRanking(monthRanking)}

      {tab === 'contributors' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl p-4 text-sm">Score automatique : publication 5 pts, idée 4 pts, commentaire 2 pts, réponse à un sondage 2 pts. Aucun contenu quotidien à produire.</div>
          {contributors.map((entry, index) => (
            <div key={entry.user.id} className={`bg-white border rounded-2xl p-4 flex items-center gap-4 ${entry.user.id === currentUser.id ? 'border-green-500' : 'border-slate-100'}`}>
              <div className="w-9 text-center font-black text-slate-400">#{index + 1}</div>
              <img src={entry.user.avatar} alt="" className="w-11 h-11 rounded-full" />
              <div className="flex-1 min-w-0"><p className="font-black truncate">{entry.user.name}</p><p className="text-xs text-slate-500">{entry.userPosts} publications · {entry.comments} commentaires · {entry.userIdeas} idées · {entry.pollAnswers} sondages</p></div>
              <div className="font-black text-xl text-blue-700">{entry.score}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'animations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {animations.length === 0 && <div className="md:col-span-2 bg-white rounded-2xl p-12 text-center text-slate-400">Aucune animation active pour le moment.</div>}
          {animations.map(animation => {
            const joined = (animation.participants || []).includes(currentUser.id);
            const winners = users.filter(u => (animation.winnerIds || []).includes(u.id));
            return (
              <article key={animation.id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                {animation.imageUrl && <img src={animation.imageUrl} alt="" className="w-full h-44 object-cover" />}
                <div className="p-6">
                  <div className="flex justify-between gap-3"><span className="text-2xl">{typeIcons[animation.type] || '✨'}</span><span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-black">{typeLabels[animation.type] || animation.type}</span></div>
                  <h3 className="text-xl font-black text-slate-900 mt-3">{animation.title}</h3>
                  <p className="text-slate-500 mt-2">{animation.description}</p>
                  {animation.endDate && <div className="mt-4 text-3xl font-black text-[#14532d]">{countdown(animation.endDate)}</div>}
                  {animation.rewardLabel && <p className="mt-3 text-sm font-bold text-amber-700">À gagner : {animation.rewardLabel}</p>}
                  {winners.length > 0 && <p className="mt-3 font-black text-purple-700">Gagnant{winners.length > 1 ? 's' : ''} : {winners.map(w => w.name).join(', ')}</p>}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {!joined && animation.status === 'active' && animation.type !== 'countdown' && <button onClick={() => onJoinAnimation(animation)} className="px-4 py-2.5 bg-[#14532d] text-white rounded-xl font-black">{animation.type === 'raffle' ? `Prendre un ticket${animation.pointsCost ? ` · ${animation.pointsCost} pts` : ''}` : 'Participer'}</button>}
                    {joined && <span className="px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-black">Participation enregistrée</span>}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">{(animation.participants || []).length} participant(s)</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EngagementView;
