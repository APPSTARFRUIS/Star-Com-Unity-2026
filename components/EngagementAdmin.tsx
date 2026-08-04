import React, { useMemo, useRef, useState } from 'react';
import { CompanyGame, EngagementAnimation, EngagementType, GamePrediction, User } from '../types';
import { uploadMediaToStorage } from '../storageUtils';
import PronosticsAdmin from './PronosticsAdmin';

interface EngagementAdminProps {
  animations: EngagementAnimation[];
  users: User[];
  currentUser: User;
  onCreateAnimation: (animation: Omit<EngagementAnimation, 'id' | 'createdAt' | 'participants' | 'winnerIds'>) => Promise<void>;
  onDeleteAnimation: (id: string) => Promise<void>;
  onDrawWinner: (animation: EngagementAnimation) => Promise<void>;
  games: CompanyGame[];
  predictions: GamePrediction[];
  onAddGame: (game: Omit<CompanyGame, 'id' | 'createdAt'>) => void | Promise<void>;
  onDeleteGame: (id: string) => void | Promise<void>;
  onToggleGameStatus: (id: string) => void | Promise<void>;
  onUpdateSportResult: (gameId: string, fixtureId: string, homeScore: number, awayScore: number) => void | Promise<void>;
}

type EditorMode = 'list' | 'predictions' | EngagementType;
type AdventContentType = 'gift' | 'quiz' | 'video' | 'document' | 'mission' | 'coupon' | 'instant' | 'game' | 'mystery' | 'fact' | 'jackpot';

type AdventDay = {
  day: number;
  type: AdventContentType;
  title: string;
  description: string;
  rewardLabel: string;
  rewardPoints: number;
  linkUrl: string;
  buttonLabel: string;
  imageUrl: string;
  question: string;
  options: string[];
  correctAnswer: string;
  couponCode: string;
  winProbability: number;
  openedBy: string[];
  correctBy: string[];
  winnerIds: string[];
};

const typeMeta: Record<EngagementType, { label: string; icon: string; description: string }> = {
  countdown: { label: 'Compte à rebours', icon: '⏳', description: 'Mettre en avant une échéance ou un temps fort.' },
  raffle: { label: 'Tirage au sort', icon: '🎟️', description: 'Collecter des participations puis tirer un ou plusieurs gagnants.' },
  contest: { label: 'Jeu concours', icon: '🏁', description: 'Poser une question et récompenser les bonnes réponses.' },
  advent: { label: "Calendrier de l’Avent", icon: '🎄', description: 'Préparer 24 expériences différentes à ouvrir jour après jour.' },
  mission: { label: 'Mission ponctuelle', icon: '🎯', description: 'Créer une animation limitée dans le temps avec plusieurs objectifs.' },
  season: { label: 'Saison', icon: '🏆', description: 'Regrouper plusieurs modules autour d’un temps fort et d’un classement.' }
};

const adventTypeMeta: Record<AdventContentType, { label: string; icon: string; help: string }> = {
  gift: { label: 'Cadeau / surprise', icon: '🎁', help: 'Annonce d’un lot, d’un avantage ou d’une surprise.' },
  quiz: { label: 'Mini quiz', icon: '❓', help: 'Une question avec plusieurs réponses et des points à gagner.' },
  video: { label: 'Vidéo', icon: '🎥', help: 'Une vidéo hébergée ailleurs ou un lien vers un contenu vidéo.' },
  document: { label: 'Document', icon: '📄', help: 'Un document, une brochure ou un PDF à consulter.' },
  mission: { label: 'Mission', icon: '🎯', help: 'Une action ponctuelle à réaliser dans la journée.' },
  coupon: { label: 'Coupon', icon: '🎫', help: 'Un bon, un code ou un avantage à utiliser.' },
  instant: { label: 'Instant gagnant', icon: '🎲', help: 'Une chance immédiate de gagner lors de l’ouverture.' },
  game: { label: 'Jeu', icon: '🧩', help: 'Un lien vers un jeu Star Com’Unity ou une activité externe.' },
  mystery: { label: 'Photo mystère', icon: '📸', help: 'Une image à identifier avec réponse libre.' },
  fact: { label: 'Le saviez-vous ?', icon: '💡', help: 'Une anecdote ou une information sur l’entreprise.' },
  jackpot: { label: 'Jackpot final', icon: '🎉', help: 'Réservé idéalement au 24 décembre ou aux participants les plus assidus.' }
};

const createEmptyDay = (day: number): AdventDay => ({
  day,
  type: day === 24 ? 'jackpot' : 'gift',
  title: '',
  description: '',
  rewardLabel: '',
  rewardPoints: 0,
  linkUrl: '',
  buttonLabel: '',
  imageUrl: '',
  question: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  couponCode: '',
  winProbability: 20,
  openedBy: [],
  correctBy: [],
  winnerIds: []
});

const emptyAdventDays = (): AdventDay[] => Array.from({ length: 24 }, (_, index) => createEmptyDay(index + 1));

const EngagementAdmin: React.FC<EngagementAdminProps> = ({
  animations, users, currentUser, onCreateAnimation, onDeleteAnimation, onDrawWinner,
  games, predictions, onAddGame, onDeleteGame, onToggleGameStatus, onUpdateSportResult
}) => {
  const [mode, setMode] = useState<EditorMode>('list');
  const [isSaving, setIsSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const adventImageRef = useRef<HTMLInputElement>(null);
  const [activeAdventDay, setActiveAdventDay] = useState(1);

  const [common, setCommon] = useState({
    title: '', description: '', startDate: '', endDate: '', imageUrl: '', rewardLabel: '', rewardPoints: 0
  });
  const [countdown, setCountdown] = useState({ targetDate: '', showOnHome: true, buttonLabel: '', buttonUrl: '', color: '#14532d' });
  const [raffle, setRaffle] = useState({ winnerCount: 1, participationMode: 'free', pointsCost: 0, lots: '', conditions: '' });
  const [contest, setContest] = useState({ question: '', answerType: 'text', options: ['', '', '', ''], correctAnswer: '', participationPoints: 0 });
  const [adventDays, setAdventDays] = useState<AdventDay[]>(emptyAdventDays());
  const [missionObjectives, setMissionObjectives] = useState<string[]>(['']);
  const [season, setSeason] = useState({ modules: ['jeux'], color: '#14532d', archiveAutomatically: true });

  const activeAnimationCount = useMemo(() => animations.filter(a => a.status === 'active').length, [animations]);
  const totalParticipants = useMemo(() => animations.reduce((sum, a) => sum + (a.participants || []).length, 0), [animations]);
  const closedCount = useMemo(() => animations.filter(a => a.status === 'closed').length, [animations]);

  const resetForms = () => {
    setCommon({ title: '', description: '', startDate: '', endDate: '', imageUrl: '', rewardLabel: '', rewardPoints: 0 });
    setCountdown({ targetDate: '', showOnHome: true, buttonLabel: '', buttonUrl: '', color: '#14532d' });
    setRaffle({ winnerCount: 1, participationMode: 'free', pointsCost: 0, lots: '', conditions: '' });
    setContest({ question: '', answerType: 'text', options: ['', '', '', ''], correctAnswer: '', participationPoints: 0 });
    setAdventDays(emptyAdventDays());
    setMissionObjectives(['']);
    setSeason({ modules: ['jeux'], color: '#14532d', archiveAutomatically: true });
    setActiveAdventDay(1);
  };

  const uploadMainImage = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadMediaToStorage(file, 'engagement');
      setCommon(prev => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      alert(error?.message || 'Impossible de charger le visuel.');
    }
  };

  const uploadAdventImage = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadMediaToStorage(file, 'engagement/advent');
      setAdventDays(prev => prev.map(day => day.day === activeAdventDay ? { ...day, imageUrl: url } : day));
    } catch (error: any) {
      alert(error?.message || 'Impossible de charger le visuel.');
    }
  };

  const buildConfig = (type: EngagementType): Record<string, any> => {
    if (type === 'countdown') return countdown;
    if (type === 'raffle') return { ...raffle, pointsCost: raffle.participationMode === 'points' ? raffle.pointsCost : 0 };
    if (type === 'contest') return { ...contest, options: contest.answerType === 'choice' ? contest.options.filter(Boolean) : [] };
    if (type === 'advent') return { days: adventDays, completionJackpot: true };
    if (type === 'mission') return { objectives: missionObjectives.filter(item => item.trim()).map((label, index) => ({ id: `objective-${index + 1}`, label, completedBy: [] })) };
    return season;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'list') return;
    if (!common.title.trim()) { alert('Le titre est obligatoire.'); return; }
    if (mode === 'countdown' && !countdown.targetDate) { alert('La date cible est obligatoire.'); return; }
    if (mode === 'raffle' && !common.endDate) { alert('La date de fin du tirage est obligatoire.'); return; }
    if (mode === 'contest' && !contest.question.trim()) { alert('La question du concours est obligatoire.'); return; }
    if (mode === 'mission' && !missionObjectives.some(item => item.trim())) { alert('Ajoutez au moins un objectif.'); return; }
    if (mode === 'advent' && !common.startDate) { alert('Indiquez la date de début du calendrier.'); return; }

    setIsSaving(true);
    try {
      await onCreateAnimation({
        type: mode,
        title: common.title.trim(),
        description: common.description.trim(),
        startDate: common.startDate || undefined,
        endDate: mode === 'countdown' ? countdown.targetDate : (common.endDate || undefined),
        imageUrl: common.imageUrl || undefined,
        pointsCost: mode === 'raffle' && raffle.participationMode === 'points' ? raffle.pointsCost : 0,
        rewardLabel: common.rewardLabel || undefined,
        rewardPoints: common.rewardPoints || 0,
        status: 'active',
        createdBy: currentUser.id,
        config: buildConfig(mode)
      });
      resetForms();
      setMode('list');
    } finally {
      setIsSaving(false);
    }
  };

  const updateAdventDay = (patch: Partial<AdventDay>) => {
    setAdventDays(prev => prev.map(day => day.day === activeAdventDay ? { ...day, ...patch } : day));
  };

  const currentAdventDay = adventDays.find(day => day.day === activeAdventDay)!;

  const renderCommonFields = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="lg:col-span-2 space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Titre</label>
        <input required value={common.title} onChange={e => setCommon({ ...common, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-purple-500" placeholder="Nom de l’animation" />
      </div>
      <div className="lg:col-span-2 space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
        <textarea value={common.description} onChange={e => setCommon({ ...common, description: e.target.value })} className="w-full h-28 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Expliquez le principe en quelques lignes" />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Début</label>
        <input type="datetime-local" value={common.startDate} onChange={e => setCommon({ ...common, startDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4" />
      </div>
      {mode !== 'countdown' && <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Fin</label>
        <input type="datetime-local" value={common.endDate} onChange={e => setCommon({ ...common, endDate: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4" />
      </div>}
      <div className="lg:col-span-2 space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Visuel</label>
        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { uploadMainImage(e.target.files?.[0]); e.target.value = ''; }} />
        <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full min-h-32 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center text-slate-500 font-bold">
          {common.imageUrl ? <img src={common.imageUrl} alt="" className="w-full h-40 object-cover" /> : 'Charger une image locale'}
        </button>
      </div>
    </div>
  );

  if (mode === 'predictions') {
    return <PronosticsAdmin
      games={games}
      predictions={predictions}
      currentUser={currentUser}
      onAddGame={onAddGame}
      onDeleteGame={onDeleteGame}
      onToggleGameStatus={onToggleGameStatus}
      onUpdateSportResult={onUpdateSportResult}
      onBack={() => setMode('list')}
    />;
  }

  if (mode === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-purple-600">Pilotage</p><h2 className="text-3xl font-black text-slate-900">Animations & engagement</h2><p className="text-slate-500 mt-2">Créez les temps forts depuis l’administration, sans imposer un rythme quotidien.</p></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['Animations actives', activeAnimationCount], ['Participations', totalParticipants], ['Animations terminées', closedCount]].map(([label, value]) => <div key={String(label)} className="bg-white border border-slate-100 rounded-2xl p-5"><p className="text-xs uppercase font-black text-slate-400">{label}</p><p className="text-3xl font-black mt-2">{value}</p></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(Object.entries(typeMeta) as [EngagementType, typeof typeMeta[EngagementType]][]).map(([type, meta]) => <button key={type} onClick={() => setMode(type)} className="bg-white border border-slate-100 rounded-3xl p-6 text-left hover:border-purple-300 hover:shadow-lg transition-all"><div className="text-3xl">{meta.icon}</div><h3 className="font-black text-xl mt-4">{meta.label}</h3><p className="text-sm text-slate-500 mt-2">{meta.description}</p></button>)}
          <button onClick={() => setMode('predictions')} className="bg-white border border-slate-100 rounded-3xl p-6 text-left hover:border-purple-300 hover:shadow-lg transition-all"><div className="text-3xl">⚽</div><h3 className="font-black text-xl mt-4">Pronostics</h3><p className="text-sm text-slate-500 mt-2">Créer une compétition, ajouter les rencontres, saisir les résultats et calculer les points.</p></button>
        </div>
        <div className="space-y-3">
          {animations.map(animation => <div key={animation.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4"><div className="text-2xl">{typeMeta[animation.type]?.icon || '✨'}</div><div className="flex-1"><p className="font-black">{animation.title}</p><p className="text-xs text-slate-500">{typeMeta[animation.type]?.label} · {(animation.participants || []).length} participant(s)</p></div>{animation.type === 'raffle' && animation.status === 'active' && <button onClick={() => onDrawWinner(animation)} className="px-3 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm">Tirer</button>}<button onClick={() => onDeleteAnimation(animation.id)} className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-sm">Supprimer</button></div>)}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="flex items-start gap-4"><button type="button" onClick={() => { resetForms(); setMode('list'); }} className="w-12 h-12 rounded-2xl bg-slate-100">←</button><div><div className="text-2xl">{typeMeta[mode].icon}</div><h2 className="text-3xl font-black">Créer : {typeMeta[mode].label}</h2><p className="text-slate-500">{typeMeta[mode].description}</p></div></div>
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-8">
        {renderCommonFields()}

        {mode === 'countdown' && <div className="grid md:grid-cols-2 gap-5 border-t pt-8"><input type="datetime-local" required value={countdown.targetDate} onChange={e => setCountdown({ ...countdown, targetDate: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" /><input placeholder="Texte du bouton" value={countdown.buttonLabel} onChange={e => setCountdown({ ...countdown, buttonLabel: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" /><input placeholder="Lien du bouton" value={countdown.buttonUrl} onChange={e => setCountdown({ ...countdown, buttonUrl: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" /><input type="color" value={countdown.color} onChange={e => setCountdown({ ...countdown, color: e.target.value })} className="h-14 w-full" /></div>}
        {mode === 'raffle' && <div className="grid md:grid-cols-2 gap-5 border-t pt-8"><input type="number" min="1" value={raffle.winnerCount} onChange={e => setRaffle({ ...raffle, winnerCount: Number(e.target.value) })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Nombre de gagnants" /><select value={raffle.participationMode} onChange={e => setRaffle({ ...raffle, participationMode: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4"><option value="free">Participation gratuite</option><option value="points">Participation en points</option></select>{raffle.participationMode === 'points' && <input type="number" min="0" value={raffle.pointsCost} onChange={e => setRaffle({ ...raffle, pointsCost: Number(e.target.value) })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Coût du ticket" />}<textarea value={raffle.lots} onChange={e => setRaffle({ ...raffle, lots: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Lots" /></div>}
        {mode === 'contest' && <div className="space-y-5 border-t pt-8"><input value={contest.question} onChange={e => setContest({ ...contest, question: e.target.value })} className="w-full bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Question" /><select value={contest.answerType} onChange={e => setContest({ ...contest, answerType: e.target.value })} className="w-full bg-slate-50 border rounded-2xl px-5 py-4"><option value="text">Réponse libre</option><option value="number">Nombre</option><option value="choice">Choix multiple</option></select></div>}
        {mode === 'mission' && <div className="space-y-3 border-t pt-8">{missionObjectives.map((objective, index) => <input key={index} value={objective} onChange={e => setMissionObjectives(prev => prev.map((item, i) => i === index ? e.target.value : item))} className="w-full bg-slate-50 border rounded-2xl px-5 py-4" placeholder={`Objectif ${index + 1}`} />)}<button type="button" onClick={() => setMissionObjectives(prev => [...prev, ''])} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-black">+ Ajouter un objectif</button></div>}
        {mode === 'season' && <div className="grid md:grid-cols-2 gap-5 border-t pt-8"><input type="color" value={season.color} onChange={e => setSeason({ ...season, color: e.target.value })} className="h-14 w-full" /><label className="flex items-center gap-3"><input type="checkbox" checked={season.archiveAutomatically} onChange={e => setSeason({ ...season, archiveAutomatically: e.target.checked })} /> Archiver automatiquement</label></div>}

        {mode === 'advent' && <div className="border-t pt-8 space-y-7">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-sm text-purple-900"><strong>Chaque case peut être différente.</strong> Choisissez le jour, puis son type : cadeau, quiz, vidéo, document, mission, coupon, instant gagnant, jeu, photo mystère, anecdote ou jackpot.</div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">{adventDays.map(day => <button type="button" key={day.day} onClick={() => setActiveAdventDay(day.day)} className={`aspect-square rounded-xl font-black relative ${activeAdventDay === day.day ? 'bg-purple-600 text-white' : day.title ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}><span>{day.day}</span>{day.title && <span className="absolute bottom-1 right-1 text-[10px]">{adventTypeMeta[day.type].icon}</span>}</button>)}</div>
          <div className="bg-slate-50 rounded-3xl p-5 md:p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h3 className="font-black text-xl">Case du {activeAdventDay} décembre</h3><p className="text-sm text-slate-500">{adventTypeMeta[currentAdventDay.type].help}</p></div><select value={currentAdventDay.type} onChange={e => updateAdventDay({ type: e.target.value as AdventContentType })} className="bg-white border rounded-2xl px-4 py-3 font-bold">{(Object.entries(adventTypeMeta) as [AdventContentType, typeof adventTypeMeta[AdventContentType]][]).map(([type, meta]) => <option key={type} value={type}>{meta.icon} {meta.label}</option>)}</select></div>
            <div className="grid md:grid-cols-2 gap-4"><input value={currentAdventDay.title} onChange={e => updateAdventDay({ title: e.target.value })} className="bg-white border rounded-2xl px-4 py-4" placeholder="Titre de la surprise" /><input value={currentAdventDay.rewardLabel} onChange={e => updateAdventDay({ rewardLabel: e.target.value })} className="bg-white border rounded-2xl px-4 py-4" placeholder="Lot / récompense" /></div>
            <textarea value={currentAdventDay.description} onChange={e => updateAdventDay({ description: e.target.value })} className="w-full h-28 bg-white border rounded-2xl px-4 py-4" placeholder="Contenu de la case" />
            <div className="grid md:grid-cols-2 gap-4"><input value={currentAdventDay.linkUrl} onChange={e => updateAdventDay({ linkUrl: e.target.value })} className="bg-white border rounded-2xl px-4 py-4" placeholder="Lien facultatif" /><input value={currentAdventDay.buttonLabel} onChange={e => updateAdventDay({ buttonLabel: e.target.value })} className="bg-white border rounded-2xl px-4 py-4" placeholder="Texte du bouton" /><input type="number" min="0" value={currentAdventDay.rewardPoints} onChange={e => updateAdventDay({ rewardPoints: Number(e.target.value) })} className="bg-white border rounded-2xl px-4 py-4" placeholder="Points" /></div>

            {(currentAdventDay.type === 'quiz' || currentAdventDay.type === 'mystery') && <div className="border-t pt-5 space-y-4"><input value={currentAdventDay.question} onChange={e => updateAdventDay({ question: e.target.value })} className="w-full bg-white border rounded-2xl px-4 py-4" placeholder={currentAdventDay.type === 'quiz' ? 'Question du quiz' : 'Que faut-il deviner ?'} />{currentAdventDay.type === 'quiz' && <div className="grid md:grid-cols-2 gap-3">{currentAdventDay.options.map((option, index) => <input key={index} value={option} onChange={e => updateAdventDay({ options: currentAdventDay.options.map((item, i) => i === index ? e.target.value : item) })} className="bg-white border rounded-2xl px-4 py-3" placeholder={`Réponse ${index + 1}`} />)}</div>}<input value={currentAdventDay.correctAnswer} onChange={e => updateAdventDay({ correctAnswer: e.target.value })} className="w-full bg-white border rounded-2xl px-4 py-4" placeholder="Bonne réponse exacte" /></div>}
            {currentAdventDay.type === 'coupon' && <input value={currentAdventDay.couponCode} onChange={e => updateAdventDay({ couponCode: e.target.value })} className="w-full bg-white border rounded-2xl px-4 py-4" placeholder="Code ou texte du coupon" />}
            {currentAdventDay.type === 'instant' && <div className="space-y-2"><label className="text-sm font-bold">Probabilité de gain : {currentAdventDay.winProbability}%</label><input type="range" min="1" max="100" value={currentAdventDay.winProbability} onChange={e => updateAdventDay({ winProbability: Number(e.target.value) })} className="w-full" /></div>}

            <input ref={adventImageRef} type="file" accept="image/*" className="hidden" onChange={e => { uploadAdventImage(e.target.files?.[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => adventImageRef.current?.click()} className="w-full h-36 border-2 border-dashed rounded-2xl overflow-hidden bg-white">{currentAdventDay.imageUrl ? <img src={currentAdventDay.imageUrl} className="w-full h-full object-cover" alt="" /> : 'Ajouter une image à cette case'}</button>
          </div>
        </div>}
      </div>
      <div className="flex justify-end gap-3"><button type="button" onClick={() => { resetForms(); setMode('list'); }} className="px-6 py-4 rounded-2xl bg-slate-100 font-black">Annuler</button><button disabled={isSaving} className="px-8 py-4 rounded-2xl bg-purple-600 text-white font-black disabled:opacity-50">{isSaving ? 'Publication…' : 'Publier'}</button></div>
    </form>
  );
};

export default EngagementAdmin;
