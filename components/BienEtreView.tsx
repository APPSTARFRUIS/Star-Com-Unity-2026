
import React, { useState, useMemo, useEffect } from 'react';
import { WellnessContent, WellnessCategory, WellnessChallenge } from '../types';

interface BienEtreViewProps {
  contents: WellnessContent[];
  challenges: WellnessChallenge[];
}

const CATEGORIES: WellnessCategory[] = ['Mental', 'Physique', 'Nutrition', 'Sommeil', 'Travail'];

const BienEtreView: React.FC<BienEtreViewProps> = ({ contents, challenges }) => {
  const [activeTab, setActiveTab] = useState<WellnessCategory | 'Tous'>('Tous');
  const [readingContent, setReadingContent] = useState<WellnessContent | null>(null);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Exhale' | 'Hold'>('Inhale');
  const [acceptedChallengeId, setAcceptedChallengeId] = useState<string | null>(null);

  // Animation de respiration (Cohm)
  useEffect(() => {
    let interval: any;
    if (isBreathing) {
      let step = 0;
      interval = setInterval(() => {
        step = (step + 1) % 3;
        if (step === 0) setBreathPhase('Inhale');
        else if (step === 1) setBreathPhase('Hold');
        else setBreathPhase('Exhale');
      }, 4000);
    } else {
      setBreathPhase('Inhale');
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  const filteredContents = useMemo(() => {
    return contents.filter(c => activeTab === 'Tous' || c.category === activeTab);
  }, [contents, activeTab]);

  const activeChallenge = challenges.find(c => c.isActive);

  // Helper pour détecter si c'est un lien d'intégration (iframe) ou un fichier brut (balise video)
  const isEmbedLink = (url: string) => {
    if (!url) return false;
    return url.includes('youtube.com/embed') || url.includes('vimeo.com') || url.includes('player.vimeo.com');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Bien-être</h1>
          <p className="text-slate-500 font-medium mt-1">Prenez soin de vous au quotidien.</p>
        </div>
        
        {/* Breathing Quick Tool */}
        <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
             <svg className={`w-6 h-6 ${isBreathing ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Micro-pause</p>
            <button 
              onClick={() => setIsBreathing(!isBreathing)}
              className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isBreathing ? 'Arrêter la séance' : 'Démarrer 1 min de respiration'}
            </button>
          </div>
        </div>
      </div>

      {isBreathing && (
        <div className="bg-blue-600 rounded-[40px] p-12 flex flex-col items-center justify-center text-center text-white space-y-8 animate-in zoom-in duration-500 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-[0.2em]">{breathPhase === 'Inhale' ? 'Inspirez...' : breathPhase === 'Hold' ? 'Maintenez...' : 'Expirez...'}</h2>
          <div className={`w-48 h-48 rounded-full border-8 border-white/20 flex items-center justify-center transition-all duration-[4000ms] transform ${breathPhase === 'Inhale' ? 'scale-150 bg-white/10' : breathPhase === 'Hold' ? 'scale-150 bg-white/20' : 'scale-100 bg-transparent'}`}>
             <div className="w-4 h-4 bg-white rounded-full" />
          </div>
          <button onClick={() => setIsBreathing(false)} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all">Quitter</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('Tous')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all border ${activeTab === 'Tous' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200'}`}
            >
              Tous les contenus
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${activeTab === cat ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredContents.map(content => (
              <div 
                key={content.id}
                onClick={() => setReadingContent(content)}
                className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="h-56 bg-slate-100 relative overflow-hidden">
                  {content.mediaUrl && !content.mediaUrl.startsWith('data:video') && (
                    <img src={content.mediaUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  )}
                  {content.mediaUrl && content.mediaUrl.startsWith('data:video') && (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                       <svg className="w-12 h-12 text-white opacity-50" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                    </div>
                  )}
                  {content.type === 'video' && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                       <div className="w-16 h-16 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 shadow-xl">
                          <svg className="w-8 h-8 translate-x-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                       </div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-800 rounded-full shadow-sm">{content.category}</span>
                  </div>
                </div>
                <div className="p-6">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{content.duration || 'Lecture libre'}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase">{content.type === 'video' ? 'Vidéo' : 'Article'}</span>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 group-hover:text-green-600 transition-colors leading-tight mb-3 line-clamp-2">{content.title}</h3>
                   <p className="text-slate-500 text-sm line-clamp-3 mb-6 italic">"{content.summary}"</p>
                   <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="text-[10px] font-bold text-slate-400">Par {content.author}</span>
                      <svg className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                   </div>
                </div>
              </div>
            ))}
            {filteredContents.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium italic">Aucun contenu disponible dans cette catégorie.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
           {activeChallenge && (
             <div className="bg-[#14532d] rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] text-8xl opacity-10 rotate-12">🎯</div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-green-300 mb-6">Défi du moment</h3>
                <div className="space-y-4">
                   <h4 className="text-2xl font-black leading-tight">{activeChallenge.title}</h4>
                   <p className="text-green-100 text-sm leading-relaxed">{activeChallenge.description}</p>
                   
                   {acceptedChallengeId === activeChallenge.id ? (
                      <div className="w-full mt-4 py-4 bg-white/10 border border-white/20 text-white rounded-2xl flex items-center justify-center gap-2 animate-in zoom-in duration-300">
                         <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                         <span className="text-xs font-black uppercase tracking-widest">Défi relevé ! 🍀</span>
                      </div>
                   ) : (
                     <button 
                       onClick={() => setAcceptedChallengeId(activeChallenge.id)}
                       className="w-full mt-4 py-4 bg-white text-green-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-50 transition-all shadow-lg active:scale-95"
                     >
                       Relever le défi
                     </button>
                   )}
                </div>
             </div>
           )}

           <div className="bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Le saviez-vous ?</h3>
              <div className="space-y-6">
                 <p className="text-slate-600 text-sm leading-relaxed italic">
                    "Prendre 5 minutes de pause toutes les 90 minutes permet d'augmenter la concentration de 30% en fin de journée."
                 </p>
                 <div className="h-px bg-slate-50 w-full" />
                 <p className="text-slate-600 text-sm leading-relaxed italic">
                    "La couleur bleue réduit le stress. Une courte marche en extérieur ou regarder le ciel apaise le système nerveux."
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Reader Modal */}
      {readingContent && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl h-full md:h-[90vh] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative">
            <div className="bg-white px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full">{readingContent.category}</span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{readingContent.duration || 'Temps libre'}</p>
               </div>
               <button onClick={() => setReadingContent(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <div className="w-full aspect-video bg-black relative flex items-center justify-center">
                  {readingContent.type === 'video' ? (
                     isEmbedLink(readingContent.mediaUrl || '') ? (
                       <iframe 
                         src={readingContent.mediaUrl} 
                         className="w-full h-full" 
                         title={readingContent.title}
                         frameBorder="0" 
                         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                         allowFullScreen 
                       />
                     ) : (
                       <video 
                         controls 
                         src={readingContent.mediaUrl} 
                         className="w-full h-full max-h-full object-contain" 
                         autoPlay
                       />
                     )
                  ) : (
                    <img src={readingContent.mediaUrl} className="w-full h-full object-cover" alt="" />
                  )}
               </div>
               <div className="max-w-3xl mx-auto py-12 px-8 space-y-8">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">{readingContent.title}</h2>
                  <div className="p-8 bg-slate-50 rounded-[32px] border-l-[12px] border-green-600 italic text-xl text-slate-600 leading-relaxed shadow-inner">
                    "{readingContent.summary}"
                  </div>
                  {readingContent.content && (
                    <div className="text-lg text-slate-700 leading-relaxed whitespace-pre-wrap space-y-6 prose prose-slate">
                       {readingContent.content}
                    </div>
                  )}
                  <div className="pt-12 border-t border-slate-100 flex items-center justify-between text-slate-400 italic text-sm">
                     <span>Source : Programme Bien-être Star Fruits</span>
                     <span>Mis en ligne le {new Date(readingContent.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BienEtreView;
