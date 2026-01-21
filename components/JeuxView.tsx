
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CompanyGame, GameCategory, GamePrediction, User, TimelineItem, HiddenObject, QuizQuestion } from '../types';

interface JeuxViewProps {
  games: CompanyGame[];
  currentUser: User;
  predictions: GamePrediction[];
  onAddPrediction: (gameId: string, choice: 'A' | 'Nul' | 'B') => void;
  onEarnPoints: (userId: string, amount: number, reason: string) => void;
}

interface MemoryCard {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const TRIVIAL_CATEGORIES = [
  { name: 'Géographie', color: 'bg-blue-500', hex: '#3b82f6', icon: '🌍' },
  { name: 'Histoire', color: 'bg-yellow-400', hex: '#facc15', icon: '⏳' },
  { name: 'Art & Littérature', color: 'bg-purple-600', hex: '#9333ea', icon: '🎨' },
  { name: 'Sport & Loisirs', color: 'bg-orange-500', hex: '#f97316', icon: '⚽' },
  { name: 'Sciences & Nature', color: 'bg-green-600', hex: '#16a34a', icon: '🔬' },
  { name: 'Divertissement', color: 'bg-red-600', hex: '#dc2626', icon: '🎬' }
];

const JeuxView: React.FC<JeuxViewProps> = ({ games, currentUser, predictions, onAddPrediction, onEarnPoints }) => {
  const [activeCategory, setActiveCategory] = useState<GameCategory | 'Tous'>('Tous');
  const [playingGame, setPlayingGame] = useState<CompanyGame | null>(null);

  // Quiz game state
  const [quizStep, setQuizStep] = useState<'intro' | 'play' | 'finished'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userSelections, setUserSelections] = useState<Record<number, number[]>>({});
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0, points: 0 });

  // Trivial Pursuit state
  const [trivialStep, setTrivialStep] = useState<'intro' | 'board' | 'question' | 'finished'>('intro');
  const [earnedWedges, setEarnedWedges] = useState<string[]>([]);
  const [activeTrivialCat, setActiveTrivialCat] = useState<string | null>(null);
  const [currentTrivialQuestion, setCurrentTrivialQuestion] = useState<QuizQuestion | null>(null);
  const [trivialSelection, setTrivialSelection] = useState<number[]>([]);
  
  // Memory game state
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryStep, setMemoryStep] = useState<'intro' | 'play' | 'finished'>('intro');
  const [moves, setMoves] = useState(0);
  
  // Objets Cachés game state
  const [foundObjectIds, setFoundObjectIds] = useState<string[]>([]);
  const [hiddenStep, setHiddenStep] = useState<'intro' | 'play' | 'finished'>('intro');

  // Timeline game state
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineStep, setTimelineStep] = useState<'intro' | 'play' | 'finished'>('intro');
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);

  // Chronomètre global
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  const [isProcessingPoints, setIsProcessingPoints] = useState(false);

  useEffect(() => {
    const isPlaying = memoryStep === 'play' || timelineStep === 'play' || hiddenStep === 'play' || quizStep === 'play' || (trivialStep === 'board' || trivialStep === 'question');
    if (isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [memoryStep, timelineStep, hiddenStep, quizStep, trivialStep]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredGames = useMemo(() => {
    return games.filter(g => (g.status === 'Actif' || g.status === 'Terminé') && (activeCategory === 'Tous' || g.category === activeCategory));
  }, [games, activeCategory]);

  const handleStartGame = (game: CompanyGame) => {
    setPlayingGame(game);
    setIsProcessingPoints(false);
    setSeconds(0);
    
    if (game.type === 'Quiz') {
      setQuizStep('intro');
      setCurrentQuestionIdx(0);
      setUserSelections({});
      setQuizScore({ correct: 0, total: 0, points: 0 });
    } else if (game.type === 'Trivial') {
      setTrivialStep('intro');
      setEarnedWedges([]);
      setActiveTrivialCat(null);
      setCurrentTrivialQuestion(null);
      setTrivialSelection([]);
    } else if (game.type === 'Memory') {
      setMemoryStep('intro');
      setMoves(0);
      setFlippedIndices([]);
      initMemory(game);
    } else if (game.type === 'Chronologie') {
      setTimelineStep('intro');
      initTimeline(game);
    } else if (game.type === 'Objets Cachés') {
      setHiddenStep('intro');
      setFoundObjectIds([]);
    }
  };

  // --- LOGIQUE TRIVIAL ---
  const handleSelectTrivialCategory = (catName: string) => {
    if (earnedWedges.includes(catName)) return;
    
    const possibleQuestions = playingGame?.questions?.filter(q => q.trivialCategory === catName) || [];
    if (possibleQuestions.length === 0) {
      alert("Aucune question disponible pour cette catégorie !");
      return;
    }
    
    const randomQ = possibleQuestions[Math.floor(Math.random() * possibleQuestions.length)];
    setCurrentTrivialQuestion(randomQ);
    setActiveTrivialCat(catName);
    setTrivialSelection([]);
    setTrivialStep('question');
  };

  const handleTrivialOptionClick = (idx: number) => {
    if (!currentTrivialQuestion) return;
    setTrivialSelection([idx]);
    
    // Auto-validation après un court délai
    setTimeout(() => {
      const isCorrect = currentTrivialQuestion.correctIndices.includes(idx);
      if (isCorrect) {
        const nextWedges = [...earnedWedges, activeTrivialCat!];
        setEarnedWedges(nextWedges);
        if (nextWedges.length === 6) {
          setTrivialStep('finished');
          if (!isProcessingPoints) {
            setIsProcessingPoints(true);
            onEarnPoints(currentUser.id, playingGame?.rewardPoints || 100, `Grand Chelem Trivial en ${formatTime(seconds)}`);
          }
        } else {
          setTrivialStep('board');
          setActiveTrivialCat(null);
          setCurrentTrivialQuestion(null);
        }
      } else {
        alert("Mauvaise réponse ! Essayez une autre catégorie ou retentez votre chance.");
        setTrivialStep('board');
        setActiveTrivialCat(null);
        setCurrentTrivialQuestion(null);
      }
    }, 600);
  };

  // Logique Memory
  const initMemory = (game: CompanyGame) => {
    const items = game.memoryItems && game.memoryItems.length > 0 
      ? game.memoryItems 
      : ['🍎', '🍌', '🍒', '🍓', '🥑', '🍍', '🍇', '🥝'];
    
    const deck = [...items, ...items]
      .sort(() => Math.random() - 0.5)
      .map((content, idx) => ({ 
        id: idx, 
        content, 
        isFlipped: false, 
        isMatched: false 
      }));
    setMemoryCards(deck);
  };

  const handleMemoryCardClick = (idx: number) => {
    if (flippedIndices.length === 2 || memoryCards[idx].isFlipped || memoryCards[idx].isMatched) return;

    // Retourner la carte
    const newCards = [...memoryCards];
    newCards[idx].isFlipped = true;
    setMemoryCards(newCards);

    const nextFlipped = [...flippedIndices, idx];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = nextFlipped;

      if (newCards[first].content === newCards[second].content) {
        // Paire trouvée
        setTimeout(() => {
          const matchedCards = [...newCards];
          matchedCards[first].isMatched = true;
          matchedCards[second].isMatched = true;
          setMemoryCards(matchedCards);
          setFlippedIndices([]);
          
          if (matchedCards.every(c => c.isMatched)) {
            setMemoryStep('finished');
            if (!isProcessingPoints) {
              setIsProcessingPoints(true);
              onEarnPoints(currentUser.id, playingGame?.rewardPoints || 50, `Mémoire réussie en ${formatTime(seconds)}`);
            }
          }
        }, 500);
      } else {
        // Pas une paire
        setTimeout(() => {
          const res = [...newCards];
          res[first].isFlipped = false;
          res[second].isFlipped = false;
          setMemoryCards(res);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  // Logique Objets Cachés
  const handleHiddenImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playingGame?.hiddenObjects) return;
    
    // Identifier l'objet actuel à trouver (le premier non trouvé)
    const currentObjToFind = playingGame.hiddenObjects.find(o => !foundObjectIds.includes(o.id));
    if (!currentObjToFind) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Vérifier si le clic est sur l'objet attendu
    const dist = Math.sqrt(Math.pow(x - currentObjToFind.x, 2) + Math.pow(y - currentObjToFind.y, 2));
    const isFound = dist <= (currentObjToFind.radius + 2);

    if (isFound) {
      const nextFound = [...foundObjectIds, currentObjToFind.id];
      setFoundObjectIds(nextFound);
      if (nextFound.length === playingGame.hiddenObjects.length) {
        setTimeout(() => {
          setHiddenStep('finished');
          if (!isProcessingPoints) {
            setIsProcessingPoints(true);
            onEarnPoints(currentUser.id, playingGame.rewardPoints, `Tous les objets trouvés en ${formatTime(seconds)}`);
          }
        }, 600);
      }
    } else {
      // Feedback visuel d'erreur éphémère (optionnel)
    }
  };

  // Logique Timeline
  const initTimeline = (game: CompanyGame) => { setTimelineItems([...(game.timelineItems || [])].sort(() => Math.random() - 0.5)); };
  const handleTimelineDragStart = (idx: number) => setDraggedItemIdx(idx);
  const handleTimelineDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault(); if (draggedItemIdx === null || draggedItemIdx === idx) return;
    const newItems = [...timelineItems]; const item = newItems.splice(draggedItemIdx, 1)[0]; newItems.splice(idx, 0, item); setTimelineItems(newItems); setDraggedItemIdx(idx);
  };
  const validateTimeline = () => {
    if (timelineItems.every((item, idx) => idx === 0 || item.year >= timelineItems[idx-1].year)) {
      setTimelineStep('finished');
      if (!isProcessingPoints) { setIsProcessingPoints(true); onEarnPoints(currentUser.id, playingGame?.rewardPoints || 50, `Chronologie réussie en ${formatTime(seconds)}`); }
    } else alert("La chronologie n'est pas encore correcte !");
  };

  // Logique Quiz
  const handleToggleQuizOption = (optionIdx: number) => {
    if (!playingGame?.questions) return;
    const q = playingGame.questions[currentQuestionIdx];
    
    if (q.type === 'QCU' || q.type === 'Vrai/Faux') {
      const next = { ...userSelections, [currentQuestionIdx]: [optionIdx] };
      setUserSelections(next);
      setTimeout(() => {
        if (currentQuestionIdx < playingGame.questions!.length - 1) {
          setCurrentQuestionIdx(currentQuestionIdx + 1);
        } else {
          finishQuiz(next);
        }
      }, 400);
    } else {
      const cur = userSelections[currentQuestionIdx] || [];
      const next = cur.includes(optionIdx) ? cur.filter(i => i !== optionIdx) : [...cur, optionIdx];
      setUserSelections({ ...userSelections, [currentQuestionIdx]: next });
    }
  };

  const handleNextQuizQuestion = () => {
    if (!playingGame?.questions) return;
    if (currentQuestionIdx < playingGame.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      finishQuiz(userSelections);
    }
  };

  const finishQuiz = (allSelections: Record<number, number[]>) => {
    if (!playingGame?.questions) return;
    
    let correctCount = 0;
    playingGame.questions.forEach((q, idx) => {
      const sel = allSelections[idx] || [];
      const isCorrect = sel.length === q.correctIndices.length && sel.every(s => q.correctIndices.includes(s));
      if (isCorrect) correctCount++;
    });

    const totalPoints = playingGame.rewardPoints;
    const earnedPoints = Math.round((correctCount / playingGame.questions.length) * totalPoints);

    setQuizScore({
      correct: correctCount,
      total: playingGame.questions.length,
      points: earnedPoints
    });
    setQuizStep('finished');

    if (earnedPoints > 0 && !isProcessingPoints) {
      setIsProcessingPoints(true);
      onEarnPoints(currentUser.id, earnedPoints, `Score au quiz : ${correctCount}/${playingGame.questions.length}`);
    }
  };

  const closeGame = () => { 
    setPlayingGame(null); 
    setQuizStep('intro'); 
    setMemoryStep('intro'); 
    setTimelineStep('intro'); 
    setHiddenStep('intro'); 
    setTrivialStep('intro');
    setSeconds(0); 
    setIsProcessingPoints(false);
  };

  const currentObjToFind = playingGame?.hiddenObjects?.find(o => !foundObjectIds.includes(o.id));

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m-7-4h12M5 15a3 3 0 110-6h14a3 3 0 110 6H5z" /></svg>
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Jeux</h1>
            <p className="text-slate-500 font-medium mt-1">Divertissez-vous et gagnez des points !</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['Tous', 'Histoire', 'Produits', 'Valeurs', 'Processus', 'Pari Sportif'].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border shrink-0 ${activeCategory === cat ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGames.map(game => (
          <div key={game.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
            <div className="h-48 bg-slate-100 relative overflow-hidden">
              {game.thumbnail || game.hiddenObjectsImage ? <img src={game.thumbnail || game.hiddenObjectsImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" /> : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100`}><span className="text-6xl">{game.type === 'Objets Cachés' ? '🕵️‍♂️' : game.type === 'Memory' ? '🧠' : game.type === 'Trivial' ? '🎓' : '⏳'}</span></div>
              )}
              <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">+{game.rewardPoints} pts</span></div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{game.type}</span></div>
              <h3 className="text-xl font-black text-slate-800 truncate">{game.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 italic">"{game.description}"</p>
              <button onClick={() => handleStartGame(game)} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95">Jouer maintenant</button>
            </div>
          </div>
        ))}
      </div>

      {playingGame && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl rounded-[48px] shadow-2xl overflow-hidden flex flex-col relative min-h-[80vh]">
              <div className="bg-white px-8 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600`}>
                      <span className="text-xl">{playingGame.type === 'Objets Cachés' ? '🕵️‍♂️' : playingGame.type === 'Trivial' ? '🎓' : '🎮'}</span>
                   </div>
                   <div className="text-left">
                     <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{playingGame.title}</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{playingGame.type}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="3" /></svg>
                      <span className="text-sm font-black text-slate-700 font-mono">{formatTime(seconds)}</span>
                   </div>
                   <button onClick={closeGame} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
                </div>
              </div>

              <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center p-8 overflow-y-auto custom-scrollbar">
                 {/* --- JEUX TERNARY CHAIN --- */}
                 {playingGame.type === 'Trivial' ? (
                    <div className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-center animate-in fade-in duration-700 text-center">
                       {trivialStep === 'intro' && (
                         <div className="space-y-8 animate-in zoom-in duration-500">
                            <div className="text-7xl">🎓</div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">{playingGame.title}</h2>
                            <p className="text-slate-400 max-w-md mx-auto">Collectez les 6 camemberts de couleur en répondant aux questions de chaque catégorie pour gagner le défi !</p>
                            <button onClick={() => setTrivialStep('board')} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl">C'est parti !</button>
                         </div>
                       )}

                       {trivialStep === 'board' && (
                         <div className="space-y-12 animate-in fade-in duration-500 w-full">
                            <h3 className="text-2xl font-black text-white uppercase tracking-widest">Choisissez une catégorie</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                               {TRIVIAL_CATEGORIES.map((cat) => {
                                 const isEarned = earnedWedges.includes(cat.name);
                                 return (
                                   <button 
                                      key={cat.name} 
                                      onClick={() => handleSelectTrivialCategory(cat.name)}
                                      className={`group p-8 rounded-[40px] border-2 transition-all flex flex-col items-center gap-4 ${isEarned ? `${cat.color} border-transparent shadow-[0_0_30px_${cat.hex}66]` : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                                   >
                                      <span className="text-4xl group-hover:scale-110 transition-transform">{isEarned ? '✅' : cat.icon}</span>
                                      <div className="text-center">
                                         <p className={`text-[10px] font-black uppercase tracking-widest ${isEarned ? 'text-white' : 'text-slate-500'}`}>{cat.name}</p>
                                         {isEarned && <p className="text-[10px] font-bold text-white/70 uppercase">Acquis</p>}
                                      </div>
                                   </button>
                                 );
                               })}
                            </div>
                            <div className="pt-8 flex flex-col items-center">
                               <div className="flex gap-2 mb-4">
                                  {[...Array(6)].map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-full ${earnedWedges.length > i ? 'bg-green-500 shadow-[0_0_10px_green]' : 'bg-white/10'}`} />
                                  ))}
                               </div>
                               <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{earnedWedges.length} / 6 Catégories</p>
                            </div>
                         </div>
                       )}

                       {trivialStep === 'question' && currentTrivialQuestion && (
                         <div className="space-y-10 w-full max-w-3xl animate-in slide-in-from-bottom-8 duration-500">
                            <div className="flex items-center justify-center gap-4">
                               <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white ${TRIVIAL_CATEGORIES.find(c=>c.name===activeTrivialCat)?.color}`}>
                                 {activeTrivialCat}
                               </span>
                            </div>
                            
                            <h3 className="text-3xl font-black text-white leading-tight">{currentTrivialQuestion.question}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {currentTrivialQuestion.options.map((opt, oIdx) => {
                                 const isSelected = trivialSelection.includes(oIdx);
                                 return (
                                   <button 
                                     key={oIdx} 
                                     onClick={() => handleTrivialOptionClick(oIdx)}
                                     className={`group p-6 border-2 transition-all flex items-center gap-4 rounded-[32px] ${isSelected ? 'bg-green-600/20 border-green-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                   >
                                      <div className={`w-10 h-10 flex items-center justify-center text-xs font-black rounded-2xl ${isSelected ? 'bg-green-600 text-white' : 'bg-white/10 text-white'}`}>{String.fromCharCode(65 + oIdx)}</div>
                                      <span className="font-bold text-lg text-left text-slate-200 group-hover:text-white">{opt}</span>
                                   </button>
                                 );
                               })}
                            </div>
                         </div>
                       )}

                       {trivialStep === 'finished' && (
                         <div className="space-y-8 animate-in zoom-in duration-500 text-center max-w-md mx-auto">
                            <div className="text-8xl">👑</div>
                            <h2 className="text-5xl font-black text-white uppercase tracking-[0.2em]">GRAND CHELEM</h2>
                            <p className="text-slate-400">Impressionnant ! Vous maîtrisez toutes les catégories.</p>
                            
                            <div className="bg-green-500/10 border border-green-500/20 rounded-[40px] p-8 space-y-4 shadow-2xl">
                               <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Récompense obtenue</p>
                               <p className="text-5xl font-black text-white">+{playingGame.rewardPoints} pts</p>
                            </div>

                            <button onClick={closeGame} className="px-16 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase text-sm tracking-widest hover:scale-105 transition-all">Quitter le jeu</button>
                         </div>
                       )}
                    </div>
                 ) : playingGame.type === 'Quiz' && playingGame.questions ? (
                    <div className="relative z-10 w-full max-w-3xl h-full flex flex-col justify-center animate-in fade-in duration-700 text-center">
                      {quizStep === 'intro' && (
                        <div className="space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">❓</div>
                           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">{playingGame.title}</h2>
                           <p className="text-slate-400 max-w-md mx-auto">{playingGame.description}</p>
                           <button onClick={() => setQuizStep('play')} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-2xl active:scale-95">Commencer le défi</button>
                        </div>
                      )}
                      {quizStep === 'play' && (
                        <div className="space-y-8 h-full flex flex-col justify-center">
                           <div className="w-full flex items-center gap-4">
                              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${((currentQuestionIdx + 1) / playingGame.questions!.length) * 100}%` }} />
                              </div>
                              <span className="text-white font-black text-xs uppercase tracking-widest">{currentQuestionIdx + 1} / {playingGame.questions!.length}</span>
                           </div>
                           
                           <div className="space-y-8 flex-1 flex flex-col justify-center">
                              <h3 className="text-3xl font-black text-white leading-tight">{playingGame.questions![currentQuestionIdx].question}</h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {playingGame.questions![currentQuestionIdx].options.map((opt, oIdx) => {
                                   const isSelected = (userSelections[currentQuestionIdx] || []).includes(oIdx);
                                   return (
                                     <button key={oIdx} onClick={() => handleToggleQuizOption(oIdx)} className={`group p-6 border-2 transition-all flex items-center gap-4 rounded-[32px] ${isSelected ? 'bg-green-600/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                                        <div className={`w-10 h-10 flex items-center justify-center text-xs font-black transition-all uppercase rounded-2xl ${isSelected ? 'bg-green-600 text-white scale-110' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>{String.fromCharCode(65 + oIdx)}</div>
                                        <span className={`font-bold text-lg text-left transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{opt}</span>
                                     </button>
                                   );
                                 })}
                              </div>

                              {playingGame.questions![currentQuestionIdx].type === 'QCM' && (
                                <div className="pt-8 animate-in fade-in duration-500">
                                   <button 
                                     onClick={handleNextQuizQuestion}
                                     disabled={!userSelections[currentQuestionIdx] || userSelections[currentQuestionIdx].length === 0}
                                     className="px-16 py-5 bg-green-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-green-900/40 hover:bg-green-500 disabled:opacity-30 transition-all active:scale-95"
                                   >
                                     {currentQuestionIdx === playingGame.questions!.length - 1 ? 'Terminer le Quiz' : 'Valider & Suivant'}
                                   </button>
                                   <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Choix multiples possible</p>
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                      {quizStep === 'finished' && (
                        <div className="space-y-8 animate-in zoom-in duration-500 text-center max-w-md mx-auto">
                           <div className="text-8xl">
                             {quizScore.correct === quizScore.total ? '🏆' : quizScore.correct >= quizScore.total / 2 ? '👏' : '🤔'}
                           </div>
                           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Quiz terminé</h2>
                           
                           <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 shadow-2xl">
                              <div className="flex justify-around items-center">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                                    <p className="text-4xl font-black text-white">{quizScore.correct} / {quizScore.total}</p>
                                 </div>
                                 <div className="h-12 w-px bg-white/10"></div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Points gagnés</p>
                                    <p className="text-4xl font-black text-green-500">+{quizScore.points}</p>
                                 </div>
                              </div>
                              <p className="text-sm text-slate-400 italic">
                                {quizScore.correct === quizScore.total 
                                  ? "Un sans-faute incroyable ! Tu connais l'entreprise sur le bout des doigts." 
                                  : quizScore.correct >= quizScore.total / 2 
                                    ? "Bien joué ! Tu as une très bonne base, continue comme ça." 
                                    : "Oups, il y a encore quelques lacunes. Retente ta chance la prochaine fois !"}
                              </p>
                           </div>

                           <button onClick={closeGame} className="px-16 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase text-sm tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl">Quitter le jeu</button>
                        </div>
                      )}
                    </div>
                 ) : playingGame.type === 'Objets Cachés' ? (
                   <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                      {hiddenStep === 'intro' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">🕵️‍♂️</div>
                           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Quiz Visuel</h2>
                           <p className="text-slate-400 max-w-md mx-auto">Résolvez les énigmes en cliquant sur les bons objets dans l'image !</p>
                           <button onClick={() => setHiddenStep('play')} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all">Démarrer le quiz</button>
                        </div>
                      )}

                      {hiddenStep === 'play' && (
                        <div className="w-full h-full flex flex-col lg:flex-row gap-8 items-center lg:items-start justify-center">
                           <div className="flex-1 flex flex-col items-center gap-6">
                              <div className="w-full bg-white/10 border border-white/20 p-6 rounded-[32px] text-center animate-pulse">
                                 <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">Question actuelle</p>
                                 <h3 className="text-2xl font-black text-white leading-tight">
                                    {currentObjToFind?.question}
                                 </h3>
                              </div>

                              <div 
                                className="relative inline-block cursor-crosshair group rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl bg-black" 
                                onClick={handleHiddenImageClick}
                              >
                                <img 
                                  src={playingGame.hiddenObjectsImage} 
                                  className="block w-auto h-auto max-w-full max-h-[60vh] object-contain select-none" 
                                  alt="Chercher ici" 
                                  draggable={false}
                                />
                                {playingGame.hiddenObjects?.map(obj => foundObjectIds.includes(obj.id) && (
                                  <div key={obj.id} className="absolute border-4 border-green-500 rounded-full bg-green-500/20 animate-in zoom-in duration-300 shadow-[0_0_20px_rgba(34,197,94,0.6)]" style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.radius * 2}%`, height: `${obj.radius * 2}%`, transform: 'translate(-50%, -50%)' }}>
                                     <div className="absolute top-[-35px] left-1/2 -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap shadow-xl">✓ {obj.label}</div>
                                  </div>
                                ))}
                              </div>
                           </div>
                           
                           <div className="w-full lg:w-72 space-y-4 shrink-0">
                              <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4">
                                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">Progression ({foundObjectIds.length}/{playingGame.hiddenObjects?.length})</h3>
                                 <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                                    {playingGame.hiddenObjects?.map((obj, idx) => {
                                      const isFound = foundObjectIds.includes(obj.id);
                                      const isCurrent = currentObjToFind?.id === obj.id;
                                      return (
                                        <div key={obj.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-3 text-left ${isFound ? 'bg-green-600/20 border-green-500 text-green-400' : isCurrent ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                                           <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isFound ? 'bg-green-500 shadow-[0_0_10px_green]' : isCurrent ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`}></div>
                                           <div className="overflow-hidden">
                                              <p className={`text-[9px] font-black uppercase ${isFound ? 'text-green-500' : 'text-slate-500'}`}>Étape 0{idx + 1}</p>
                                              <span className={`text-sm font-bold truncate block ${isFound ? 'line-through opacity-50' : isCurrent ? 'text-white' : ''}`}>
                                                {isFound ? obj.label : isCurrent ? 'En cours...' : '???'}
                                              </span>
                                           </div>
                                        </div>
                                      );
                                    })}
                                 </div>
                              </div>
                           </div>
                        </div>
                      )}

                      {hiddenStep === 'finished' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">🏆</div>
                           <h2 className="text-5xl font-black text-white">CHAMPION !</h2>
                           <p className="text-slate-400">Toutes les énigmes visuelles ont été résolues en <span className="text-white font-bold">{formatTime(seconds)}</span>.</p>
                           <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-[40px] max-w-md mx-auto">
                              <p className="text-green-500 font-black uppercase text-xs mb-2 tracking-[0.2em]">🎁 Gain obtenu</p>
                              <p className="text-white text-3xl font-black">+{playingGame.rewardPoints} points</p>
                           </div>
                           <button onClick={closeGame} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase text-sm active:scale-95 transition-transform">Quitter</button>
                        </div>
                      )}
                   </div>
                 ) : playingGame.type === 'Memory' ? (
                   <div className="w-full flex flex-col items-center">
                      {memoryStep === 'intro' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">🧠</div>
                           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Memory</h2>
                           <p className="text-slate-400 max-w-md mx-auto">Retrouvez toutes les paires le plus vite possible !</p>
                           <button onClick={() => setMemoryStep('play')} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all shadow-xl active:scale-95">Lancer la partie</button>
                        </div>
                      )}
                      {memoryStep === 'play' && (
                        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto py-8">
                           {memoryCards.map((card, idx) => (
                             <button 
                               key={idx} 
                               onClick={() => handleMemoryCardClick(idx)} 
                               className={`aspect-square relative w-24 h-24 md:w-32 md:h-32 transition-all duration-500 [transform-style:preserve-3d] ${card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''}`}
                             >
                                <div className="absolute inset-0 [backface-visibility:hidden] rounded-[24px] border-4 border-white/10 bg-slate-800 flex items-center justify-center text-4xl font-black text-slate-500 shadow-xl">
                                  ?
                                </div>
                                <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-[24px] border-4 flex items-center justify-center shadow-xl overflow-hidden ${card.isMatched ? 'bg-green-600/20 border-green-500' : 'bg-white border-white'}`}>
                                   {card.content.startsWith('data:image') || card.content.startsWith('http') ? (
                                      <img src={card.content} className="w-full h-full object-cover" alt="" />
                                   ) : (
                                      <span className="text-4xl md:text-5xl">{card.content}</span>
                                   )}
                                </div>
                             </button>
                           ))}
                        </div>
                      )}
                      {memoryStep === 'finished' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">👑</div>
                           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">Victoire !</h2>
                           <p className="text-slate-400">Temps : <span className="text-white font-bold">{formatTime(seconds)}</span> • Coups : <span className="text-white font-bold">{moves}</span></p>
                           <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-[40px] max-w-md mx-auto shadow-2xl">
                              <p className="text-green-500 font-black uppercase text-[10px] tracking-widest mb-2">🎁 Récompense débloquée</p>
                              <p className="text-white text-3xl font-black">+{playingGame?.rewardPoints} points</p>
                           </div>
                           <button onClick={closeGame} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase text-sm shadow-xl active:scale-95 transition-transform">Quitter le jeu</button>
                        </div>
                      )}
                   </div>
                 ) : playingGame.type === 'Chronologie' ? (
                   <div className="w-full max-w-4xl flex flex-col items-center justify-center py-8">
                      {timelineStep === 'intro' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">⏳</div>
                           <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em]">{playingGame.title}</h2>
                           <p className="text-emerald-300 font-bold uppercase text-sm">Remettez les événements dans l'ordre</p>
                           <button onClick={() => setTimelineStep('play')} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:scale-105 transition-all">Lancer le défi</button>
                        </div>
                      )}
                      {timelineStep === 'play' && (
                        <div className="w-full space-y-8 animate-in fade-in duration-500">
                           <div className="space-y-3 max-w-2xl mx-auto">
                              {timelineItems.map((item, idx) => (
                                <div 
                                  key={item.id}
                                  draggable
                                  onDragStart={() => handleTimelineDragStart(idx)}
                                  onDragOver={(e) => handleTimelineDragOver(e, idx)}
                                  className={`p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-6 cursor-grab active:cursor-grabbing transition-all hover:bg-white/10 group ${draggedItemIdx === idx ? 'opacity-20 scale-95' : 'opacity-100'}`}
                                >
                                   <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black shrink-0 shadow-lg">{idx + 1}</div>
                                   <div className="flex-1 text-left"><p className="text-white font-bold text-lg leading-tight">{item.text}</p></div>
                                   <div className="text-white/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16" strokeWidth="3" /></svg></div>
                                </div>
                              ))}
                           </div>
                           <button onClick={validateTimeline} className="px-12 py-5 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm hover:bg-emerald-500 transition-all shadow-2xl active:scale-95">Valider ma frise</button>
                        </div>
                      )}
                      {timelineStep === 'finished' && (
                        <div className="text-center space-y-8 animate-in zoom-in duration-500">
                           <div className="text-7xl">✨</div>
                           <h2 className="text-5xl font-black text-white">PARFAIT !</h2>
                           <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-[40px] max-w-md mx-auto">
                              <p className="text-white text-2xl font-black">+{playingGame?.rewardPoints} points</p>
                           </div>
                           <button onClick={closeGame} className="px-12 py-5 bg-white text-slate-900 rounded-[24px] font-black uppercase text-sm hover:bg-green-50 transition-all shadow-2xl active:scale-95">Fermer le jeu</button>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="text-white font-bold animate-pulse">Chargement de la partie...</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default JeuxView;
