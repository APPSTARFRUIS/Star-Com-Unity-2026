import React, { useState, useMemo } from 'react';
import { User, Idea, IdeaStatus, Comment, UserRole } from '../types';

interface IdeesViewProps {
  currentUser: User;
  ideas: Idea[];
  onAddIdea: (title: string, description: string, category: string) => void;
  onToggleVote: (ideaId: string) => void;
  onUpdateStatus: (ideaId: string, status: IdeaStatus) => void;
  onAddComment: (ideaId: string, text: string) => void;
}

const IDEA_CATEGORIES = ['Vie au bureau', 'Bien-être', 'Outils & Process', 'Innovation', 'Événements'];

const IdeesView: React.FC<IdeesViewProps> = ({ 
  currentUser, 
  ideas, 
  onAddIdea, 
  onToggleVote, 
  onUpdateStatus,
  onAddComment 
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState(IDEA_CATEGORIES[0]);
  const [filterStatus, setFilterStatus] = useState<IdeaStatus | 'Toutes'>('Toutes');
  const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const filteredIdeas = useMemo(() => {
    return ideas
      .filter(idea => filterStatus === 'Toutes' || idea.status === filterStatus)
      .sort((a, b) => b.votes.length - a.votes.length);
  }, [ideas, filterStatus]);

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    onAddIdea(newTitle, newDesc, newCat);
    setNewTitle('');
    setNewDesc('');
    setShowForm(false);
  };

  const handleAddCommentSubmit = (ideaId: string) => {
    if (!commentText.trim()) return;
    onAddComment(ideaId, commentText);
    setCommentText('');
  };

  const getStatusColor = (status: IdeaStatus) => {
    switch (status) {
      case 'Suggestion': return 'bg-slate-100 text-slate-600';
      case 'À l\'étude': return 'bg-blue-100 text-blue-600';
      case 'Planifiée': return 'bg-purple-100 text-purple-600';
      case 'Réalisée': return 'bg-green-100 text-green-600';
      case 'Refusée': return 'bg-red-100 text-red-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Boîte à idées</h1>
          <p className="text-slate-500 mt-1">Participez à l'évolution de l'entreprise en proposant vos idées.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-[#14532d] text-white rounded-2xl font-bold hover:bg-green-800 shadow-md transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Proposer une idée
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmitIdea} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Titre de l'idée</label>
              <input 
                required
                type="text" 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Installer une machine à café à grains"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</label>
              <select 
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none"
              >
                {IDEA_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description détaillée</label>
            <textarea 
              required
              rows={4}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Expliquez votre idée et ses avantages pour l'équipe..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700">Annuler</button>
            <button type="submit" className="px-8 py-2.5 bg-[#14532d] text-white rounded-xl font-bold shadow-md hover:bg-green-800 transition-all">Soumettre l'idée</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {['Toutes', 'Suggestion', 'À l\'étude', 'Planifiée', 'Réalisée', 'Refusée'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              filterStatus === status 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Ideas List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredIdeas.map(idea => {
          const hasVoted = idea.votes.includes(currentUser.id);
          const isExpanded = activeIdeaId === idea.id;

          return (
            <div key={idea.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 flex gap-6">
                {/* Vote Section */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <button 
                    onClick={() => onToggleVote(idea.id)}
                    className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                      hasVoted ? 'bg-green-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className={`text-lg font-bold ${hasVoted ? 'text-green-600' : 'text-slate-600'}`}>
                    {idea.votes.length}
                  </span>
                </div>

                {/* Content Section */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(idea.status)}`}>
                          {idea.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{idea.category}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{idea.title}</h3>
                    </div>
                  </div>

                  <p className={`text-slate-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {idea.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <img src={idea.userAvatar} className="w-6 h-6 rounded-full" alt="" />
                      <span className="text-xs font-medium text-slate-500">{idea.userName} • {new Date(idea.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <button 
                      onClick={() => setActiveIdeaId(isExpanded ? null : idea.id)}
                      className="text-xs font-bold text-green-700 hover:underline"
                    >
                      {isExpanded ? 'Réduire' : `${idea.comments.length} commentaires`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Comments Section */}
              {isExpanded && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    {idea.comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-slate-200 flex-shrink-0" alt="" />
                        <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-900">{comment.userName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.createdAt).toLocaleTimeString('fr-FR')}</span>
                          </div>
                          <p className="text-sm text-slate-700">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    {idea.comments.length === 0 && (
                      <p className="text-xs text-slate-400 text-center italic py-2">Aucun commentaire pour le moment.</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button 
                      onClick={() => handleAddCommentSubmit(idea.id)}
                      className="p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filteredIdeas.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-medium">Aucune idée trouvée pour ce filtre.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeesView;