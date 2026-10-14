import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '../types';
import { ViewType } from './Sidebar';

interface Props {
  currentUser: User;
  unreadNotifications: number;
  onNavigate: (view: ViewType) => void;
}

type CompletionRow = { game_id: string; best_score: number; passed: boolean; completed_at?: string | null };
type GameRow = { id: string; title: string; type: string; status: string; learning_path?: string | null; level_number?: number | null; sport_events?: any[] | null };
type PredictionRow = { game_id: string; choice: string; submitted_at: string };
type TransactionRow = { amount: number; type: string; reason: string; date: string };

const parsePrediction = (raw: string) => {
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
};

const MySpaceView: React.FC<Props> = ({ currentUser, unreadNotifications, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [games, setGames] = useState<GameRow[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      const [c, g, p, t] = await Promise.all([
        supabase.from('game_completions').select('game_id,best_score,passed,completed_at').eq('user_id', currentUser.id),
        supabase.from('games').select('id,title,type,status,learning_path,level_number,sport_events').in('status', ['Actif', 'Terminé']),
        supabase.from('game_predictions').select('game_id,choice,submitted_at').eq('user_id', currentUser.id).order('submitted_at', { ascending: false }),
        supabase.from('transactions').select('amount,type,reason,date').eq('user_id', currentUser.id).order('date', { ascending: false }).limit(100)
      ]);
      if (!alive) return;
      setCompletions((c.data || []) as CompletionRow[]);
      setGames((g.data || []) as GameRow[]);
      setPredictions((p.data || []) as PredictionRow[]);
      setTransactions((t.data || []) as TransactionRow[]);
      setLoading(false);
    };
    void load();
    return () => { alive = false; };
  }, [currentUser.id]);

  const stats = useMemo(() => {
    const learningGames = games.filter(g => !!g.learning_path);
    const passedIds = new Set(completions.filter(c => c.passed).map(c => c.game_id));
    const learningPassed = learningGames.filter(g => passedIds.has(g.id)).length;
    const learningProgress = learningGames.length ? Math.round((learningPassed / learningGames.length) * 100) : 0;
    const learningCompletionRows = completions.filter(c => learningGames.some(g => g.id === c.game_id));
    const learningSuccessRate = learningCompletionRows.length ? Math.round(learningCompletionRows.reduce((sum,c)=>sum+Number(c.best_score||0),0)/learningCompletionRows.length) : 0;
    const earned = transactions.filter(t => t.type === 'earn').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const spent = transactions.filter(t => t.type === 'spend').reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const exacts = predictions.filter(p => Number(parsePrediction(p.choice).pointsAwarded || 0) >= 3).length;
    const predictionPoints = predictions.reduce((sum, p) => sum + Number(parsePrediction(p.choice).pointsAwarded || 0), 0);

    const now = Date.now();
    const predictedKeys = new Set(predictions.map(p => {
      const parsed = parsePrediction(p.choice);
      return `${p.game_id}:${parsed.eventId || ''}`;
    }));
    let openPredictions = 0;
    games.filter(g => g.type === 'Pari' && g.status === 'Actif').forEach(g => {
      (g.sport_events || []).forEach((event: any) => {
        const closing = event?.closingDate ? new Date(event.closingDate).getTime() : 0;
        if (!event?.isFinished && closing > now && !predictedKeys.has(`${g.id}:${event.id || ''}`)) openPredictions++;
      });
    });
    const learningRemaining = learningGames.filter(g => g.status === 'Actif' && !passedIds.has(g.id)).length;
    return { learningGames: learningGames.length, learningPassed, learningProgress, learningSuccessRate, earned, spent, exacts, predictionPoints, openPredictions, learningRemaining };
  }, [games, completions, predictions, transactions]);

  const badges = useMemo(() => [
    { label: 'Premier pas', unlocked: stats.earned > 0 },
    { label: 'Ça pousse', unlocked: stats.earned >= 100 },
    { label: 'Contributeur', unlocked: stats.earned >= 250 },
    { label: 'Top contributeur', unlocked: stats.earned >= 500 },
    { label: 'Premier échange', unlocked: stats.spent > 0 }
  ], [stats.earned, stats.spent]);

  if (loading) return <div className="max-w-6xl mx-auto py-24 text-center text-slate-400 font-bold">Chargement de mon espace…</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-green-900 to-green-700 text-white rounded-[32px] p-7 md:p-9 shadow-xl overflow-hidden relative">
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/5" />
        <p className="text-xs font-black uppercase tracking-[0.25em] text-green-200">Mon Star Com'Unity</p>
        <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black">Bonjour {currentUser.name.split(' ')[0]}</h1>
            <p className="text-green-100 mt-2">Votre activité, votre progression et ce qu'il vous reste à découvrir.</p>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-2xl px-6 py-4 min-w-36">
            <p className="text-[10px] uppercase tracking-widest font-black text-green-200">Mes points</p>
            <p className="text-3xl font-black mt-1">{currentUser.points}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['E-learning', `${stats.learningProgress} %`, `${stats.learningPassed}/${stats.learningGames} validés · réussite ${stats.learningSuccessRate}%`],
          ['Pronostics', `${predictions.length}`, `${stats.predictionPoints} pts gagnés`],
          ['Badges', `${badges.filter(b => b.unlocked).length}/${badges.length}`, 'débloqués'],
          ['Notifications', `${unreadNotifications}`, unreadNotifications ? 'à consulter' : 'tout est lu']
        ].map(([label, value, sub]) => (
          <div key={label} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="text-3xl font-black text-slate-900 mt-2">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div><p className="text-xs font-black uppercase tracking-widest text-green-700">À faire</p><h2 className="text-xl font-black text-slate-900 mt-1">Mes prochaines actions</h2></div>
          </div>
          <div className="space-y-3">
            <button onClick={() => onNavigate('jeux')} className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-green-50 transition-colors flex justify-between items-center">
              <div><p className="font-black text-slate-800">Parcours e-learning</p><p className="text-sm text-slate-500">{stats.learningRemaining ? `${stats.learningRemaining} niveau(x) actif(s) à valider` : 'Vous êtes à jour'}</p></div><span className="text-green-700 font-black">→</span>
            </button>
            <button onClick={() => onNavigate('tempsforts')} className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-green-50 transition-colors flex justify-between items-center">
              <div><p className="font-black text-slate-800">Pronostics</p><p className="text-sm text-slate-500">{stats.openPredictions ? `${stats.openPredictions} pronostic(s) ouvert(s) non joué(s)` : 'Aucun pronostic en attente'}</p></div><span className="text-green-700 font-black">→</span>
            </button>
            <button onClick={() => onNavigate('notifications')} className="w-full text-left p-4 rounded-2xl bg-slate-50 hover:bg-green-50 transition-colors flex justify-between items-center">
              <div><p className="font-black text-slate-800">Notifications</p><p className="text-sm text-slate-500">{unreadNotifications ? `${unreadNotifications} non lue(s)` : 'Aucune notification en attente'}</p></div><span className="text-green-700 font-black">→</span>
            </button>
          </div>
        </section>

        <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-purple-700">Progression</p>
          <h2 className="text-xl font-black text-slate-900 mt-1">Mon parcours</h2>
          <div className="mt-5">
            <div className="flex justify-between text-sm font-bold"><span>E-learning</span><span>{stats.learningProgress} %</span></div>
            <div className="h-3 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${stats.learningProgress}%` }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {badges.map(badge => <div key={badge.label} className={`rounded-2xl border p-3 ${badge.unlocked ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-50'}`}><p className="text-xs font-black text-slate-800">{badge.unlocked ? '★ ' : '☆ '}{badge.label}</p></div>)}
          </div>
          <button onClick={() => onNavigate('boutique')} className="mt-5 text-sm font-black text-green-700 hover:underline">Voir ma progression et la boutique →</button>
        </section>
      </div>

      <section className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Mes pronostics</p><h2 className="text-xl font-black text-slate-900 mt-1">Mon suivi</h2></div>
          <button onClick={() => onNavigate('tempsforts')} className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-black">Voir les pronostics</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{predictions.length}</p><p className="text-xs text-slate-500">joués</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{stats.exacts}</p><p className="text-xs text-slate-500">exacts</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-black">{stats.predictionPoints}</p><p className="text-xs text-slate-500">points</p></div>
        </div>
      </section>
    </div>
  );
};

export default MySpaceView;
