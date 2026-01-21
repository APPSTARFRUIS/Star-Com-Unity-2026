
import React, { useState, useMemo } from 'react';
import { User, Reward, PointsTransaction } from '../types';

interface BoutiqueViewProps {
  currentUser: User;
  rewards: Reward[];
  onClaimReward: (rewardId: string) => void;
  transactions: PointsTransaction[];
}

const BoutiqueView: React.FC<BoutiqueViewProps> = ({ currentUser, rewards, onClaimReward, transactions }) => {
  const [activeCategory, setActiveCategory] = useState<Reward['category'] | 'Tous'>('Tous');
  const [showHistory, setShowHistory] = useState(false);

  const categories: (Reward['category'] | 'Tous')[] = ['Tous', 'Badge', 'Goodies', 'Avantage', 'Expérience'];

  const filteredRewards = useMemo(() => {
    return rewards.filter(r => activeCategory === 'Tous' || r.category === activeCategory);
  }, [rewards, activeCategory]);

  const myTransactions = useMemo(() => {
    return transactions
      .filter(t => t.userId === currentUser.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, currentUser.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header avec solde */}
      <div className="bg-[#14532d] rounded-[48px] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-[-40px] right-[-40px] text-[150px] opacity-10 rotate-12">💎</div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Ma Boutique</h1>
              <p className="text-green-100 text-lg md:text-xl font-medium max-w-xl">
                 Cumulez des points en participant à la vie de l'entreprise et échangez-les contre des récompenses exclusives !
              </p>
           </div>
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[40px] text-center min-w-[240px] shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-green-300 mb-2">Mon Solde</p>
              <div className="flex items-center justify-center gap-3">
                 <span className="text-5xl font-black">{currentUser.points}</span>
                 <span className="text-2xl text-green-300">pts</span>
              </div>
              <button 
                onClick={() => setShowHistory(true)}
                className="mt-6 text-xs font-black uppercase tracking-widest text-green-100 hover:text-white transition-colors underline underline-offset-8"
              >
                Voir mon historique
              </button>
           </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border shrink-0 ${
                activeCategory === cat 
                  ? 'bg-slate-800 text-white border-slate-800 shadow-lg scale-105' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des récompenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredRewards.map(reward => {
          const canAfford = currentUser.points >= reward.cost;
          const outOfStock = reward.stock <= 0;

          return (
            <div key={reward.id} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                {reward.image && (
                  <img src={reward.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-800 rounded-full shadow-sm">{reward.category}</span>
                </div>
                {outOfStock && (
                   <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-white font-black uppercase text-xs tracking-widest border-2 border-white px-4 py-2 rotate-[-5deg]">Épuisé</span>
                   </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coût :</span>
                    <span className="text-xl font-black text-green-700">{reward.cost} pts</span>
                 </div>
                 <h3 className="text-xl font-black text-slate-800 mb-2">{reward.title}</h3>
                 <p className="text-slate-500 text-sm line-clamp-3 mb-6 italic flex-1">"{reward.description}"</p>
                 
                 <button 
                   disabled={!canAfford || outOfStock}
                   onClick={() => onClaimReward(reward.id)}
                   className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                     !canAfford 
                       ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                       : outOfStock 
                         ? 'bg-slate-50 text-slate-300' 
                         : 'bg-green-600 text-white hover:bg-green-700'
                   }`}
                 >
                   {outOfStock ? 'Plus de stock' : !canAfford ? `Il vous manque ${reward.cost - currentUser.points} pts` : 'Obtenir cette récompense'}
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Historique */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="bg-white px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Mon Historique de Points</h2>
                <button onClick={() => setShowHistory(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                 {myTransactions.length > 0 ? myTransactions.map(t => (
                   <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${t.type === 'earn' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type === 'earn' ? '+' : '-'}
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">{t.reason}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleString('fr-FR')}</p>
                         </div>
                      </div>
                      <span className={`text-lg font-black ${t.type === 'earn' ? 'text-green-600' : 'text-red-600'}`}>
                         {t.amount} pts
                      </span>
                   </div>
                 )) : (
                   <div className="py-20 text-center text-slate-300 italic">Aucune transaction enregistrée.</div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default BoutiqueView;
