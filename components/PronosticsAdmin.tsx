import React, { useMemo, useRef, useState } from 'react';
import { CompanyGame, GamePrediction, SportFixture, User } from '../types';
import { uploadMediaToStorage } from '../storageUtils';

interface PronosticsAdminProps {
  games: CompanyGame[];
  predictions: GamePrediction[];
  currentUser: User;
  onAddGame: (game: Omit<CompanyGame, 'id' | 'createdAt'>) => void | Promise<void>;
  onDeleteGame: (id: string) => void | Promise<void>;
  onToggleGameStatus: (id: string) => void | Promise<void>;
  onUpdateSportResult: (gameId: string, fixtureId: string, homeScore: number, awayScore: number) => void | Promise<void>;
  onBack: () => void;
}

const emptyFixture = () => ({ homeTeam: '', awayTeam: '', roundLabel: '', venue: '', eventDate: '', closingDate: '' });

const PronosticsAdmin: React.FC<PronosticsAdminProps> = ({
  games, predictions, currentUser, onAddGame, onDeleteGame, onToggleGameStatus, onUpdateSportResult, onBack
}) => {
  const sportGames = useMemo(() => games.filter(game => game.type === 'Pari'), [games]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sportName, setSportName] = useState('Football');
  const [thumbnail, setThumbnail] = useState('');
  const [exactScorePoints, setExactScorePoints] = useState(10);
  const [outcomePoints, setOutcomePoints] = useState(5);
  const [fixtures, setFixtures] = useState<SportFixture[]>([]);
  const [fixtureDraft, setFixtureDraft] = useState(emptyFixture());
  const [resultDrafts, setResultDrafts] = useState<Record<string, { home: string; away: string }>>({});
  const imageRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle(''); setDescription(''); setSportName('Football'); setThumbnail('');
    setExactScorePoints(10); setOutcomePoints(5); setFixtures([]); setFixtureDraft(emptyFixture());
  };

  const addFixture = () => {
    if (!fixtureDraft.homeTeam.trim() || !fixtureDraft.awayTeam.trim() || !fixtureDraft.eventDate || !fixtureDraft.closingDate) {
      alert('Renseignez les deux équipes ou joueurs, la date de l’événement et la clôture des pronostics.');
      return;
    }
    setFixtures(prev => [...prev, {
      id: crypto.randomUUID(),
      homeTeam: fixtureDraft.homeTeam.trim(), awayTeam: fixtureDraft.awayTeam.trim(),
      roundLabel: fixtureDraft.roundLabel.trim() || undefined, venue: fixtureDraft.venue.trim() || undefined,
      eventDate: fixtureDraft.eventDate, closingDate: fixtureDraft.closingDate, isFinished: false
    }]);
    setFixtureDraft(emptyFixture());
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { alert('Le titre de la compétition est obligatoire.'); return; }
    if (!fixtures.length) { alert('Ajoutez au moins une rencontre.'); return; }
    await onAddGame({
      title: title.trim(), description: description.trim(), type: 'Pari', category: 'Pari Sportif',
      difficulty: 'Moyen', duration: 'Pendant la compétition', status: 'Actif', createdBy: currentUser.id,
      thumbnail: thumbnail || undefined, rewardPoints: exactScorePoints, sportName,
      exactScorePoints, outcomePoints, sportEvents: fixtures,
      questions: [], memoryItems: [], timelineItems: [], hiddenObjects: [], hiddenObjectsImage: ''
    });
    reset(); setShowCreate(false);
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    try { setThumbnail(await uploadMediaToStorage(file, 'engagement/pronostics')); }
    catch (error: any) { alert(error?.message || 'Impossible de charger le visuel.'); }
  };

  if (showCreate) return <form onSubmit={submit} className="space-y-7 pb-12">
    <div className="flex items-start gap-4"><button type="button" onClick={() => setShowCreate(false)} className="w-12 h-12 rounded-2xl bg-slate-100">←</button><div><div className="text-2xl">⚽</div><h2 className="text-3xl font-black">Créer : Pronostics</h2><p className="text-slate-500">Configurez une compétition, ses rencontres et son barème.</p></div></div>
    <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="md:col-span-2"><label className="text-xs font-black uppercase tracking-widest text-slate-400">Titre</label><input required value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full bg-slate-50 border rounded-2xl px-5 py-4 font-bold" placeholder="Ex. Coupe du Monde 2026" /></div>
        <div className="md:col-span-2"><label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-2 w-full h-28 bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Principe, lots, règles…" /></div>
        <div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Discipline</label><select value={sportName} onChange={e => setSportName(e.target.value)} className="mt-2 w-full bg-slate-50 border rounded-2xl px-5 py-4 font-bold"><option>Football</option><option>Rugby</option><option>Tennis</option><option>Basketball</option><option>Handball</option><option>Jeux olympiques</option><option>Autre</option></select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Score exact</label><input type="number" min="0" value={exactScorePoints} onChange={e => setExactScorePoints(Number(e.target.value))} className="mt-2 w-full bg-slate-50 border rounded-2xl px-5 py-4" /></div><div><label className="text-xs font-black uppercase tracking-widest text-slate-400">Bon résultat</label><input type="number" min="0" value={outcomePoints} onChange={e => setOutcomePoints(Number(e.target.value))} className="mt-2 w-full bg-slate-50 border rounded-2xl px-5 py-4" /></div></div>
      </div>
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={e => { uploadImage(e.target.files?.[0]); e.target.value = ''; }} />
      <button type="button" onClick={() => imageRef.current?.click()} className="w-full h-40 border-2 border-dashed rounded-2xl overflow-hidden bg-slate-50">{thumbnail ? <img src={thumbnail} alt="" className="w-full h-full object-cover" /> : 'Charger un visuel local'}</button>
      <div className="border-t pt-6 space-y-4"><div className="flex justify-between items-center"><h3 className="font-black text-xl">Rencontres ({fixtures.length})</h3></div>
        <div className="grid md:grid-cols-2 gap-3"><input value={fixtureDraft.homeTeam} onChange={e => setFixtureDraft({ ...fixtureDraft, homeTeam: e.target.value })} className="bg-slate-50 border rounded-2xl px-4 py-3" placeholder="Équipe / joueur A" /><input value={fixtureDraft.awayTeam} onChange={e => setFixtureDraft({ ...fixtureDraft, awayTeam: e.target.value })} className="bg-slate-50 border rounded-2xl px-4 py-3" placeholder="Équipe / joueur B" /><input value={fixtureDraft.roundLabel} onChange={e => setFixtureDraft({ ...fixtureDraft, roundLabel: e.target.value })} className="bg-slate-50 border rounded-2xl px-4 py-3" placeholder="Phase / tour" /><input value={fixtureDraft.venue} onChange={e => setFixtureDraft({ ...fixtureDraft, venue: e.target.value })} className="bg-slate-50 border rounded-2xl px-4 py-3" placeholder="Lieu (facultatif)" /><div><label className="text-xs font-bold text-slate-500">Date de l’événement</label><input type="datetime-local" value={fixtureDraft.eventDate} onChange={e => setFixtureDraft({ ...fixtureDraft, eventDate: e.target.value })} className="mt-1 w-full bg-slate-50 border rounded-2xl px-4 py-3" /></div><div><label className="text-xs font-bold text-slate-500">Clôture des pronostics</label><input type="datetime-local" value={fixtureDraft.closingDate} onChange={e => setFixtureDraft({ ...fixtureDraft, closingDate: e.target.value })} className="mt-1 w-full bg-slate-50 border rounded-2xl px-4 py-3" /></div></div>
        <button type="button" onClick={addFixture} className="px-5 py-3 rounded-xl bg-purple-600 text-white font-black">+ Ajouter la rencontre</button>
        <div className="space-y-2">{fixtures.map(f => <div key={f.id} className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4"><div className="flex-1"><p className="font-black">{f.homeTeam} — {f.awayTeam}</p><p className="text-xs text-slate-500">{f.roundLabel || 'Rencontre'} · {new Date(f.eventDate).toLocaleString('fr-FR')}</p></div><button type="button" onClick={() => setFixtures(prev => prev.filter(item => item.id !== f.id))} className="text-red-600 font-bold">Supprimer</button></div>)}</div>
      </div>
    </div>
    <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowCreate(false)} className="px-6 py-4 rounded-2xl bg-slate-100 font-black">Annuler</button><button className="px-8 py-4 rounded-2xl bg-purple-600 text-white font-black">Publier les pronostics</button></div>
  </form>;

  return <div className="space-y-7 pb-12">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-start gap-4"><button type="button" onClick={onBack} className="w-12 h-12 rounded-2xl bg-slate-100">←</button><div><p className="text-xs font-black uppercase tracking-[0.25em] text-purple-600">Temps forts</p><h2 className="text-3xl font-black">Pronostics</h2><p className="text-slate-500">Compétitions temporaires, rencontres, résultats et classement.</p></div></div><button onClick={() => setShowCreate(true)} className="px-5 py-3 bg-purple-600 text-white rounded-2xl font-black">+ Nouvelle compétition</button></div>
    {sportGames.length === 0 && <div className="bg-white rounded-3xl border p-12 text-center text-slate-400">Aucune compétition de pronostics.</div>}
    <div className="space-y-5">{sportGames.map(game => <div key={game.id} className="bg-white border rounded-3xl p-6 space-y-5"><div className="flex flex-col md:flex-row gap-4 justify-between"><div><p className="text-xs font-black uppercase text-purple-600">{game.sportName || 'Sport'} · {game.status}</p><h3 className="text-2xl font-black">{game.title}</h3><p className="text-slate-500 mt-1">{game.description}</p><p className="text-sm font-bold text-green-700 mt-2">{game.exactScorePoints || 10} pts score exact · {game.outcomePoints ?? 5} pts bon résultat</p></div><div className="flex gap-2"><button onClick={() => onToggleGameStatus(game.id)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">{game.status === 'Actif' ? 'Désactiver' : 'Activer'}</button><button onClick={() => onDeleteGame(game.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold">Supprimer</button></div></div>
      <div className="space-y-3">{(game.sportEvents || []).map(fixture => { const draft = resultDrafts[fixture.id] || { home: '', away: '' }; const count = predictions.filter(p => p.gameId === game.id && p.eventId === fixture.id).length; return <div key={fixture.id} className="bg-slate-50 rounded-2xl p-4"><div className="flex flex-col lg:flex-row lg:items-center gap-4"><div className="flex-1"><p className="font-black">{fixture.homeTeam} — {fixture.awayTeam}</p><p className="text-xs text-slate-500">{fixture.roundLabel || 'Rencontre'} · {count} pronostic(s)</p>{fixture.isFinished && <p className="mt-1 font-black text-green-700">Résultat : {fixture.homeScore} — {fixture.awayScore}</p>}</div>{!fixture.isFinished && <div className="flex items-center gap-2"><input type="number" min="0" value={draft.home} onChange={e => setResultDrafts(prev => ({ ...prev, [fixture.id]: { ...draft, home: e.target.value } }))} className="w-16 border rounded-lg px-2 py-2 text-center" /><span>—</span><input type="number" min="0" value={draft.away} onChange={e => setResultDrafts(prev => ({ ...prev, [fixture.id]: { ...draft, away: e.target.value } }))} className="w-16 border rounded-lg px-2 py-2 text-center" /><button onClick={() => { if (draft.home === '' || draft.away === '') return; onUpdateSportResult(game.id, fixture.id, Number(draft.home), Number(draft.away)); }} className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold">Valider</button></div>}</div></div>; })}</div>
    </div>)}</div>
  </div>;
};

export default PronosticsAdmin;
