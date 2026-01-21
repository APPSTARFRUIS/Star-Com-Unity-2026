
import React, { useState, useMemo } from 'react';
import { User, MoodEntry, MoodValue } from '../types';

interface MoodViewProps {
  currentUser: User;
  moods: MoodEntry[];
  onAddMood: (value: MoodValue, comment?: string) => void;
}

const MOOD_CONFIG = [
  { value: 5, emoji: '🤩', label: 'Génial', color: 'bg-yellow-400', textColor: 'text-yellow-700' },
  { value: 4, emoji: '😊', label: 'Bien', color: 'bg-green-500', textColor: 'text-green-700' },
  { value: 3, emoji: '😐', label: 'Moyen', color: 'bg-slate-300', textColor: 'text-slate-700' },
  { value: 2, emoji: '😞', label: 'Pas top', color: 'bg-orange-400', textColor: 'text-orange-700' },
  { value: 1, emoji: '😡', label: 'Difficile', color: 'bg-red-500', textColor: 'text-red-700' },
];

const MoodView: React.FC<MoodViewProps> = ({ currentUser, moods, onAddMood }) => {
  const [selectedMood, setSelectedMood] = useState<MoodValue | null>(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Vérifier si l'utilisateur a déjà voté aujourd'hui
  const hasVotedToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return moods.some(m => m.userId === currentUser.id && m.createdAt.startsWith(today));
  }, [moods, currentUser.id]);

  const stats = useMemo(() => {
    const total = moods.length || 1;
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    moods.forEach(m => counts[m.value]++);
    
    return MOOD_CONFIG.map(m => ({
      ...m,
      count: counts[m.value as MoodValue],
      percent: Math.round((counts[m.value as MoodValue] / total) * 100)
    }));
  }, [moods]);

  const averageMood = useMemo(() => {
    if (moods.length === 0) return 0;
    const sum = moods.reduce((acc, m) => acc + m.value, 0);
    return (sum / moods.length).toFixed(1);
  }, [moods]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMood === null) return;
    onAddMood(selectedMood, comment);
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Humeur de l'équipe</h1>
          <p className="text-slate-500">Comment vous sentez-vous aujourd'hui ? C'est anonyme et ça nous aide à aller mieux ensemble.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche : Vote ou Confirmation */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            {hasVotedToday || submitted ? (
              <div className="py-10 text-center space-y-6 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Merci pour votre partage !</h3>
                  <p className="text-slate-500 mt-2">Votre humeur a été enregistrée. Revenez demain pour nous donner de vos nouvelles.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <h3 className="text-xl font-bold text-slate-800 text-center">Partagez votre météo intérieure</h3>
                
                <div className="flex justify-center gap-4 md:gap-6">
                  {MOOD_CONFIG.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setSelectedMood(mood.value as MoodValue)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border-2 group ${
                        selectedMood === mood.value 
                          ? `${mood.color} border-transparent scale-110 shadow-lg` 
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <span className="text-4xl md:text-5xl group-hover:scale-110 transition-transform">{mood.emoji}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedMood === mood.value ? 'text-white' : 'text-slate-400'}`}>
                        {mood.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Un petit mot pour l'équipe ? (Optionnel)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Qu'est-ce qui influence votre humeur aujourd'hui ?"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none resize-none transition-all"
                    rows={3}
                  />
                </div>

                <button
                  type="submit"
                  disabled={selectedMood === null}
                  className="w-full py-4 bg-[#14532d] text-white rounded-2xl font-bold shadow-lg hover:bg-green-800 transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
                >
                  Envoyer mon humeur
                </button>
              </form>
            )}
          </div>

          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
             <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" strokeWidth="2" /></svg>
                Derniers témoignages anonymes
             </h3>
             <div className="space-y-4">
                {moods.filter(m => m.comment).slice(0, 5).map(m => {
                  const cfg = MOOD_CONFIG.find(c => c.value === m.value);
                  return (
                    <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4 animate-in slide-in-from-left-2 transition-all hover:bg-white hover:shadow-sm">
                       <span className="text-3xl">{cfg?.emoji}</span>
                       <div className="flex-1">
                          <p className="text-slate-700 text-sm leading-relaxed italic">"{m.comment}"</p>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="text-[10px] font-bold text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded-full">{m.department}</span>
                             <span className="text-[10px] text-slate-400">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                       </div>
                    </div>
                  );
                })}
                {moods.filter(m => m.comment).length === 0 && (
                  <p className="text-center py-10 text-slate-400 italic text-sm">Aucun commentaire partagé pour le moment.</p>
                )}
             </div>
          </section>
        </div>

        {/* Colonne de droite : Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Indice de bonheur</h3>
            <div className="flex items-center justify-center py-4">
               <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * (Number(averageMood) / 5))}
                      className="text-green-500 transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-slate-800">{averageMood}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">/ 5.0</span>
                  </div>
               </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4 leading-relaxed px-4">
               Moyenne basée sur les <strong>{moods.length}</strong> derniers relevés de l'équipe.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
             <h3 className="font-bold text-slate-800">Répartition</h3>
             <div className="space-y-4">
                {stats.map(s => (
                  <div key={s.value} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-2">
                         <span className="text-lg">{s.emoji}</span> {s.label}
                      </span>
                      <span>{s.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div 
                         className={`h-full ${s.color} transition-all duration-1000`} 
                         style={{ width: `${s.percent}%` }}
                       />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
             <h4 className="font-bold text-green-800 text-sm mb-2">💡 Conseil d'équipe</h4>
             <p className="text-xs text-green-700 leading-relaxed">
               Un moral en baisse dans un service ? N'hésitez pas à organiser un café d'équipe pour libérer la parole. L'entraide est notre plus grande force !
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodView;
