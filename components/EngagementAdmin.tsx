import React, { useMemo, useRef, useState } from 'react';
import { EngagementAnimation, EngagementType, User } from '../types';
import { uploadMediaToStorage } from '../storageUtils';

interface EngagementAdminProps {
  animations: EngagementAnimation[];
  users: User[];
  currentUser: User;
  onCreateAnimation: (animation: Omit<EngagementAnimation, 'id' | 'createdAt' | 'participants' | 'winnerIds'>) => Promise<void>;
  onDeleteAnimation: (id: string) => Promise<void>;
  onDrawWinner: (animation: EngagementAnimation) => Promise<void>;
}

type EditorMode = 'list' | EngagementType;

type AdventDay = {
  day: number;
  title: string;
  description: string;
  rewardLabel: string;
  rewardPoints: number;
  linkUrl: string;
  imageUrl: string;
};

const typeMeta: Record<EngagementType, { label: string; icon: string; description: string }> = {
  countdown: { label: 'Compte à rebours', icon: '⏳', description: 'Mettre en avant une échéance ou un temps fort.' },
  raffle: { label: 'Tirage au sort', icon: '🎟️', description: 'Collecter des participations puis tirer un ou plusieurs gagnants.' },
  contest: { label: 'Jeu concours', icon: '🏁', description: 'Poser une question et récompenser les bonnes réponses.' },
  advent: { label: "Calendrier de l’Avent", icon: '🎄', description: 'Préparer 24 cases indépendantes à ouvrir jour après jour.' },
  mission: { label: 'Mission ponctuelle', icon: '🎯', description: 'Créer une animation limitée dans le temps avec plusieurs objectifs.' },
  season: { label: 'Saison', icon: '🏆', description: 'Regrouper plusieurs modules autour d’un temps fort et d’un classement.' }
};

const emptyAdventDays = (): AdventDay[] => Array.from({ length: 24 }, (_, index) => ({
  day: index + 1,
  title: '',
  description: '',
  rewardLabel: '',
  rewardPoints: 0,
  linkUrl: '',
  imageUrl: ''
}));

const EngagementAdmin: React.FC<EngagementAdminProps> = ({
  animations, users, currentUser, onCreateAnimation, onDeleteAnimation, onDrawWinner
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
    if (type === 'advent') return { days: adventDays };
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

    setIsSaving(true);
    try {
      const config = buildConfig(mode);
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
        config
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

  const CommonFields = () => (
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

  if (mode === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div><p className="text-xs font-black uppercase tracking-[0.25em] text-purple-600">Pilotage</p><h2 className="text-3xl font-black text-slate-900">Animations & engagement</h2><p className="text-slate-500 mt-2">Chaque animation possède désormais son propre éditeur.</p></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[['Actives', activeAnimationCount, 'bg-green-50 text-green-700'], ['Participations', totalParticipants, 'bg-blue-50 text-blue-700'], ['Terminées', closedCount, 'bg-slate-100 text-slate-700']].map(([label, value, classes]) => (
            <div key={String(label)} className={`rounded-3xl p-6 ${classes}`}><p className="text-xs uppercase font-black tracking-widest opacity-70">{label}</p><p className="text-4xl font-black mt-2">{value}</p></div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(Object.keys(typeMeta) as EngagementType[]).map(type => (
            <button key={type} onClick={() => setMode(type)} className="text-left bg-white border border-slate-200 rounded-3xl p-6 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="text-3xl">{typeMeta[type].icon}</div>
              <h3 className="font-black text-lg mt-4">Nouveau {typeMeta[type].label.toLowerCase()}</h3>
              <p className="text-sm text-slate-500 mt-2">{typeMeta[type].description}</p>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-black text-slate-900">Animations existantes</h3>
          {animations.length === 0 && <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400">Aucune animation créée.</div>}
          {animations.map(animation => {
            const winners = users.filter(user => (animation.winnerIds || []).includes(user.id));
            return (
              <div key={animation.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">{typeMeta[animation.type]?.icon || '✨'}</div>
                <div className="flex-1 min-w-0"><div className="flex flex-wrap gap-2 items-center"><h4 className="font-black text-lg truncate">{animation.title}</h4><span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 rounded-full">{typeMeta[animation.type]?.label || animation.type}</span><span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${animation.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{animation.status}</span></div><p className="text-sm text-slate-500 mt-1">{(animation.participants || []).length} participation(s){winners.length ? ` · Gagnant : ${winners.map(w => w.name).join(', ')}` : ''}</p></div>
                <div className="flex flex-wrap gap-2">
                  {animation.type === 'raffle' && animation.status === 'active' && (animation.participants || []).length > 0 && <button onClick={() => onDrawWinner(animation)} className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-black">Tirer le gagnant</button>}
                  <button onClick={() => { if (confirm('Supprimer cette animation ?')) onDeleteAnimation(animation.id); }} className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl font-black">Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4"><button type="button" onClick={() => { resetForms(); setMode('list'); }} className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-600 font-black">←</button><div><p className="text-3xl">{typeMeta[mode].icon}</p><h2 className="text-3xl font-black text-slate-900">Créer : {typeMeta[mode].label}</h2><p className="text-slate-500 mt-1">{typeMeta[mode].description}</p></div></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 space-y-8">
        <CommonFields />

        {mode === 'countdown' && <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t pt-8">
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Date cible</label><input required type="datetime-local" value={countdown.targetDate} onChange={e => setCountdown({ ...countdown, targetDate: e.target.value })} className="w-full bg-slate-50 border rounded-2xl px-5 py-4" /></div>
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Couleur</label><input type="color" value={countdown.color} onChange={e => setCountdown({ ...countdown, color: e.target.value })} className="w-full h-14 bg-slate-50 border rounded-2xl px-3" /></div>
          <input value={countdown.buttonLabel} onChange={e => setCountdown({ ...countdown, buttonLabel: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Texte du bouton (facultatif)" />
          <input value={countdown.buttonUrl} onChange={e => setCountdown({ ...countdown, buttonUrl: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Lien du bouton" />
          <label className="md:col-span-2 flex items-center gap-3 font-bold"><input type="checkbox" checked={countdown.showOnHome} onChange={e => setCountdown({ ...countdown, showOnHome: e.target.checked })} /> Afficher sur l’accueil</label>
        </div>}

        {mode === 'raffle' && <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t pt-8">
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Nombre de gagnants</label><input type="number" min="1" value={raffle.winnerCount} onChange={e => setRaffle({ ...raffle, winnerCount: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-2xl px-5 py-4" /></div>
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Participation</label><select value={raffle.participationMode} onChange={e => setRaffle({ ...raffle, participationMode: e.target.value })} className="w-full bg-slate-50 border rounded-2xl px-5 py-4"><option value="free">Gratuite</option><option value="points">Payante en points</option></select></div>
          {raffle.participationMode === 'points' && <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Coût d’un ticket</label><input type="number" min="0" value={raffle.pointsCost} onChange={e => setRaffle({ ...raffle, pointsCost: Number(e.target.value) })} className="w-full bg-slate-50 border rounded-2xl px-5 py-4" /></div>}
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Lot(s)</label><input value={raffle.lots} onChange={e => { setRaffle({ ...raffle, lots: e.target.value }); setCommon({ ...common, rewardLabel: e.target.value }); }} className="w-full bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Panier gourmand, places…" /></div>
          <div className="md:col-span-2 space-y-2"><label className="text-xs font-black uppercase text-slate-400">Conditions</label><textarea value={raffle.conditions} onChange={e => setRaffle({ ...raffle, conditions: e.target.value })} className="w-full h-24 bg-slate-50 border rounded-2xl px-5 py-4" /></div>
        </div>}

        {mode === 'contest' && <div className="space-y-5 border-t pt-8">
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Question</label><textarea value={contest.question} onChange={e => setContest({ ...contest, question: e.target.value })} className="w-full h-24 bg-slate-50 border rounded-2xl px-5 py-4" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><select value={contest.answerType} onChange={e => setContest({ ...contest, answerType: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4"><option value="text">Réponse libre</option><option value="number">Nombre</option><option value="choice">Choix multiple</option></select><input value={contest.correctAnswer} onChange={e => setContest({ ...contest, correctAnswer: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Bonne réponse" /></div>
          {contest.answerType === 'choice' && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{contest.options.map((option, index) => <input key={index} value={option} onChange={e => setContest({ ...contest, options: contest.options.map((item, i) => i === index ? e.target.value : item) })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder={`Choix ${index + 1}`} />)}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><input value={common.rewardLabel} onChange={e => setCommon({ ...common, rewardLabel: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Lot / récompense" /><input type="number" min="0" value={contest.participationPoints} onChange={e => { setContest({ ...contest, participationPoints: Number(e.target.value) }); setCommon({ ...common, rewardPoints: Number(e.target.value) }); }} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Points attribués" /></div>
        </div>}

        {mode === 'advent' && <div className="border-t pt-8 space-y-6">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">{adventDays.map(day => <button type="button" key={day.day} onClick={() => setActiveAdventDay(day.day)} className={`aspect-square rounded-xl font-black ${activeAdventDay === day.day ? 'bg-purple-600 text-white' : day.title ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{day.day}</button>)}</div>
          <div className="bg-slate-50 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 font-black">Case du {activeAdventDay} décembre</div>
            <input value={currentAdventDay.title} onChange={e => updateAdventDay({ title: e.target.value })} className="bg-white border rounded-2xl px-5 py-4" placeholder="Titre de la surprise" />
            <input value={currentAdventDay.rewardLabel} onChange={e => updateAdventDay({ rewardLabel: e.target.value })} className="bg-white border rounded-2xl px-5 py-4" placeholder="Lot / récompense" />
            <textarea value={currentAdventDay.description} onChange={e => updateAdventDay({ description: e.target.value })} className="md:col-span-2 h-24 bg-white border rounded-2xl px-5 py-4" placeholder="Contenu de la case" />
            <input value={currentAdventDay.linkUrl} onChange={e => updateAdventDay({ linkUrl: e.target.value })} className="bg-white border rounded-2xl px-5 py-4" placeholder="Lien facultatif" />
            <input type="number" min="0" value={currentAdventDay.rewardPoints} onChange={e => updateAdventDay({ rewardPoints: Number(e.target.value) })} className="bg-white border rounded-2xl px-5 py-4" placeholder="Points" />
            <input ref={adventImageRef} type="file" accept="image/*" className="hidden" onChange={e => { uploadAdventImage(e.target.files?.[0]); e.target.value = ''; }} />
            <button type="button" onClick={() => adventImageRef.current?.click()} className="md:col-span-2 h-28 border-2 border-dashed rounded-2xl overflow-hidden">{currentAdventDay.imageUrl ? <img src={currentAdventDay.imageUrl} className="w-full h-full object-cover" alt="" /> : 'Ajouter une image à cette case'}</button>
          </div>
        </div>}

        {mode === 'mission' && <div className="border-t pt-8 space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-black">Objectifs de la mission</h3><button type="button" onClick={() => setMissionObjectives([...missionObjectives, ''])} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-black">+ Objectif</button></div>
          {missionObjectives.map((objective, index) => <div key={index} className="flex gap-2"><input value={objective} onChange={e => setMissionObjectives(missionObjectives.map((item, i) => i === index ? e.target.value : item))} className="flex-1 bg-slate-50 border rounded-2xl px-5 py-4" placeholder={`Objectif ${index + 1}`} /><button type="button" onClick={() => setMissionObjectives(missionObjectives.filter((_, i) => i !== index))} className="px-4 text-red-500 font-black">✕</button></div>)}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><input value={common.rewardLabel} onChange={e => setCommon({ ...common, rewardLabel: e.target.value })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Récompense" /><input type="number" min="0" value={common.rewardPoints} onChange={e => setCommon({ ...common, rewardPoints: Number(e.target.value) })} className="bg-slate-50 border rounded-2xl px-5 py-4" placeholder="Points" /></div>
        </div>}

        {mode === 'season' && <div className="border-t pt-8 space-y-5">
          <div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Modules inclus</label><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{['jeux','sondages','newsletter','pronostics','boutique','social','idees','bienetre'].map(module => <label key={module} className={`p-4 rounded-2xl border font-bold cursor-pointer ${season.modules.includes(module) ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200'}`}><input type="checkbox" className="hidden" checked={season.modules.includes(module)} onChange={() => setSeason({ ...season, modules: season.modules.includes(module) ? season.modules.filter(item => item !== module) : [...season.modules, module] })} />{module}</label>)}</div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5"><div className="space-y-2"><label className="text-xs font-black uppercase text-slate-400">Couleur</label><input type="color" value={season.color} onChange={e => setSeason({ ...season, color: e.target.value })} className="w-full h-14 border rounded-2xl" /></div><label className="flex items-center gap-3 font-bold"><input type="checkbox" checked={season.archiveAutomatically} onChange={e => setSeason({ ...season, archiveAutomatically: e.target.checked })} /> Archiver automatiquement à la fin</label></div>
        </div>}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-3"><button type="button" onClick={() => { resetForms(); setMode('list'); }} className="px-6 py-4 rounded-2xl bg-slate-100 font-black">Annuler</button><button disabled={isSaving} className="px-8 py-4 rounded-2xl bg-purple-600 text-white font-black disabled:opacity-50">{isSaving ? 'Publication…' : 'Publier'}</button></div>
    </form>
  );
};

export default EngagementAdmin;
