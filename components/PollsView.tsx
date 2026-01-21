import React, { useState, useRef, useMemo } from 'react';
import { User, Poll, Question, QuestionType, UserRole, PollResponse, Attachment } from '../types';

interface PollsViewProps {
  currentUser: User;
  polls: Poll[];
  onCreatePoll: (poll: Omit<Poll, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'responses'>) => void;
  onVote: (pollId: string, response: PollResponse) => void;
  onDeletePoll: (id: string) => void;
}

const FileIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "w-6 h-6" }) => {
  if (type.startsWith('image/')) return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.856a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" /></svg>;
  if (type.startsWith('video/')) return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" strokeWidth="2" /></svg>;
  if (type.includes('pdf')) return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeWidth="2" /></svg>;
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" /></svg>;
};

const InlineCalendar: React.FC<{ 
  selectedDate: string; 
  onSelect: (date: string) => void 
}> = ({ selectedDate, onSelect }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate || new Date()));
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (month: number, year: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const monthName = viewDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const days = [];
  for (let i = 0; i < startDayOfMonth(month, year); i++) days.push(<div key={`empty-${i}`} className="h-8"></div>);
  for (let d = 1; d <= daysInMonth(month, year); d++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    days.push(<button key={d} type="button" onClick={() => onSelect(dateStr)} className={`h-8 w-8 flex items-center justify-center rounded-full text-xs transition-all ${selectedDate === dateStr ? 'bg-green-700 text-white font-bold' : 'text-slate-700 hover:bg-green-50'}`}>{d}</button>);
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 w-full max-w-[280px] shadow-sm">
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm font-bold text-slate-800 capitalize">{monthName}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2" /></svg></button>
          <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-slate-100 rounded text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2" /></svg></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (<div key={d} className="text-[10px] font-bold text-slate-300 uppercase">{d}</div>))}
        {days}
      </div>
    </div>
  );
};

const StarRating: React.FC<{ max: number, value: number, onChange: (val: number) => void }> = ({ max, value, onChange }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(max)].map((_, i) => {
        const starValue = i + 1;
        const isActive = (hover || value) >= starValue;
        return (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(starValue)}
            className="p-1 transition-all active:scale-90 transform"
          >
            <svg 
              className={`w-12 h-12 transition-all duration-200 ${ 
                isActive 
                  ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' 
                  : 'text-slate-200 fill-none' 
              }`} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.07 6.36h6.704c.969 0 1.371 1.24.588 1.81l-5.396 3.94 2.07 6.36c.3.921-.755 1.688-1.54 1.118l-5.396-3.94-5.396 3.94c-.784.57-1.838-.197-1.539-1.118l2.07-6.36-5.396-3.94c-.783-.57-.38-1.81.588-1.81h6.704l2.07-6.36z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

const Switch: React.FC<{ checked: boolean, onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <button 
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const QUESTION_TYPES_CONFIG = [
  { type: QuestionType.SINGLE_CHOICE, label: 'Choix unique' },
  { type: QuestionType.CHECKBOX, label: 'Cases à cocher' },
  { type: QuestionType.DROPDOWN, label: 'Liste déroulante' },
  { type: QuestionType.SHORT_TEXT, label: 'Réponse courte' },
  { type: QuestionType.PARAGRAPH, label: 'Paragraphe' },
  { type: QuestionType.NUMBER, label: 'Nombre' },
  { type: QuestionType.EMAIL, label: 'Email' },
  { type: QuestionType.PHONE, label: 'Téléphone' },
  { type: QuestionType.URL, label: 'URL' },
  { type: QuestionType.DATE, label: 'Date' },
  { type: QuestionType.TIME, label: 'Heure' },
  { type: QuestionType.LINEAR_SCALE, label: 'Échelle linéaire (1-5, 1-10)' },
  { type: QuestionType.RATING, label: 'Note (Étoiles)' },
  { type: QuestionType.RANKING, label: 'Classement' },
  { type: QuestionType.GRID, label: 'Grille' },
  { type: QuestionType.FILE, label: 'Fichier' },
  { type: QuestionType.SECTION, label: 'Section (Séparateur)' },
];

const PollsView: React.FC<PollsViewProps> = ({ currentUser, polls, onCreatePoll, onVote, onDeletePoll }) => {
  const [activeTab, setActiveTab] = useState<'liste' | 'create' | 'vote'>('liste');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [formTitle, setFormTitle] = useState('Formulaire sans titre');
  const [formDesc, setFormDesc] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState({
    collectEmail: false,
    limitOneResponse: true,
    shuffleQuestions: false,
    showResults: true,
    showProgressBar: true,
    confirmationMessage: 'Votre réponse a bien été enregistrée.'
  });
  const [createSubTab, setCreateSubTab] = useState<'questions' | 'settings' | 'results'>('questions');
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const canManage = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR;

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      type: QuestionType.SINGLE_CHOICE,
      label: '',
      required: false,
      options: ['Option 1'],
      minValue: 1,
      maxValue: 5,
      minLabel: '',
      maxLabel: ''
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const next = { ...q, ...updates };
        if (updates.type === QuestionType.GRID && (!next.gridRows || !next.gridCols)) {
          next.gridRows = ['Ligne 1'];
          next.gridCols = ['Colonne 1', 'Colonne 2'];
        }
        if (updates.type === QuestionType.RATING && !next.maxValue) {
            next.maxValue = 5;
        }
        if (updates.type === QuestionType.LINEAR_SCALE && !next.maxValue) {
            next.maxValue = 5;
            next.minValue = 1;
        }
        return next;
      }
      return q;
    }));
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const newQuestions = [...questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIdx]] = [newQuestions[targetIdx], newQuestions[index]];
    setQuestions(newQuestions);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    
    const newQuestions = [...questions];
    const item = newQuestions.splice(draggedIdx, 1)[0];
    newQuestions.splice(idx, 0, item);
    setQuestions(newQuestions);
    setDraggedIdx(idx);
  };

  const handleSaveForm = () => {
    if (!formTitle.trim() || questions.length === 0) {
      alert("Veuillez donner un titre et au moins une question.");
      return;
    }
    onCreatePoll({ title: formTitle, description: formDesc, questions, settings, endDate: new Date(Date.now() + 86400000 * 30).toISOString(), targetDepartments: ['Tous'] });
    setQuestions([]);
    setFormTitle('Formulaire sans titre');
    setFormDesc('');
    setSettings({
      collectEmail: false,
      limitOneResponse: true,
      shuffleQuestions: false,
      showResults: true,
      showProgressBar: true,
      confirmationMessage: 'Votre réponse a bien été enregistrée.'
    });
    setActiveTab('liste');
  };

  const handleQuestionAttachment = (questionId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      handleUpdateQuestion(questionId, { attachment: { name: file.name, type: file.type, data: reader.result as string } });
    };
    reader.readAsDataURL(file);
  };

  const ResultsSummary = ({ poll }: { poll: Poll }) => {
    const totalResponses = poll.responses.length;

    const handleExportCSV = () => {
      if (poll.responses.length === 0) return;

      const questions = poll.questions.filter(q => q.type !== QuestionType.SECTION);
      const headers = ['Date', 'Email de l\'utilisateur', ...questions.map(q => q.label || q.id)];
      
      const rows = poll.responses.map(response => {
        const rowData = [
          new Date(response.submittedAt).toLocaleString('fr-FR'),
          response.userEmail,
          ...questions.map(q => {
            const answer = response.answers[q.id];
            if (answer === undefined) return '';
            if (Array.isArray(answer)) return answer.join('; ');
            if (typeof answer === 'object') {
              if (answer.name) return answer.name; // Fichier
              return Object.entries(answer).map(([k, v]) => `${k}:${v}`).join(' | '); // Grille
            }
            return answer;
          })
        ];
        return rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `resultats_${poll.title.replace(/\s+/g, '_').toLowerCase()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const renderQuestionResult = (q: Question) => {
      if (q.type === QuestionType.SECTION) return null;

      const responses = poll.responses.map(r => r.answers[q.id]).filter(v => v !== undefined);
      
      return (
        <div key={q.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">{q.label}</h4>
          <p className="text-xs text-slate-400 mb-6 uppercase tracking-wider">{responses.length} réponse{responses.length > 1 ? 's' : ''}</p>

          {[QuestionType.SINGLE_CHOICE, QuestionType.CHECKBOX, QuestionType.DROPDOWN].includes(q.type) && (
            <div className="space-y-4">
              {q.options?.map(opt => {
                const count = responses.filter(r => Array.isArray(r) ? r.includes(opt) : r === opt).length;
                const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                return (
                  <div key={opt} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 font-medium">{opt}</span>
                      <span className="text-slate-400">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {[QuestionType.RATING, QuestionType.LINEAR_SCALE].includes(q.type) && (
            <div className="flex items-center gap-8">
               <div className="text-center">
                 <div className="text-4xl font-black text-slate-800">
                   {(responses.reduce((a, b) => a + (Number(b) || 0), 0) / (responses.length || 1)).toFixed(1)}
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase">Moyenne</div>
               </div>
               <div className="flex-1 space-y-1">
                 {[...Array(q.maxValue || 5)].map((_, i) => {
                   const val = i + 1;
                   const count = responses.filter(r => Number(r) === val).length;
                   const percentage = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
                   return (
                     <div key={val} className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-slate-400 w-4">{val}</span>
                       <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-yellow-400" style={{ width: `${percentage}%` }}></div>
                       </div>
                       <span className="text-[10px] text-slate-300 w-6 text-right">{count}</span>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}

          {[QuestionType.SHORT_TEXT, QuestionType.PARAGRAPH, QuestionType.EMAIL, QuestionType.URL].includes(q.type) && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
              {responses.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100 italic">
                  "{r}"
                </div>
              ))}
              {responses.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Aucune réponse pour le moment.</p>}
            </div>
          )}

          {q.type === QuestionType.DATE && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {responses.map((r, i) => (
                <div key={i} className="p-2 bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" /></svg>
                  {new Date(r).toLocaleDateString('fr-FR')}
                </div>
              ))}
            </div>
          )}

          {q.type === QuestionType.GRID && (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-separate border-spacing-1">
                <thead>
                  <tr>
                    <th></th>
                    {q.gridCols?.map(col => <th key={col} className="p-1 font-bold text-slate-400 uppercase truncate max-w-[80px]">{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {q.gridRows?.map(row => (
                    <tr key={row}>
                      <td className="p-1 font-bold text-slate-700 truncate max-w-[100px]">{row}</td>
                      {q.gridCols?.map(col => {
                        const count = responses.filter(r => r && r[row] === col).length;
                        const opacity = responses.length > 0 ? (count / responses.length) : 0;
                        return (
                          <td key={col} className="p-2 rounded-md text-center transition-all" style={{ backgroundColor: `rgba(59, 130, 246, ${Math.max(0.05, opacity)})`, color: opacity > 0.5 ? 'white' : '#1e293b' }}>
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-slate-800">{totalResponses}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Réponses</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
               <div className="text-3xl font-black text-green-600">{Math.round((totalResponses / (totalResponses || 1)) * 100)}%</div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Taux de participation</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
               <div className="text-3xl font-black text-blue-600">{poll.questions.length}</div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Questions</div>
            </div>
          </div>
          
          {totalResponses > 0 && (
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-8 py-4 bg-green-700 text-white rounded-2xl font-black text-sm hover:bg-green-800 shadow-xl transition-all active:scale-95 group shrink-0"
            >
              <svg className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              EXPORTER EXCEL (CSV)
            </button>
          )}
        </div>

        <div className="space-y-6">
          {poll.questions.map(renderQuestionResult)}
        </div>

        {totalResponses > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800">Détails des répondants</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-6 py-3 font-bold text-slate-400 uppercase">Utilisateur</th>
                      <th className="px-6 py-3 font-bold text-slate-400 uppercase">Soumis le</th>
                      <th className="px-6 py-3 font-bold text-slate-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poll.responses.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-medium text-slate-700">{r.userEmail}</td>
                        <td className="px-6 py-3 text-slate-400">{new Date(r.submittedAt).toLocaleString('fr-FR')}</td>
                        <td className="px-6 py-3"><span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full font-bold">Complet</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto min-h-screen pb-20 animate-in fade-in duration-500">
      
      {activeTab === 'create' ? (
        <div className="bg-white border-b border-slate-200 fixed top-0 left-64 right-0 z-30 px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="text-blue-600"><svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></div>
             <input value={selectedPoll ? selectedPoll.title : formTitle} onChange={(e) => selectedPoll ? null : setFormTitle(e.target.value)} disabled={!!selectedPoll} className="text-lg font-medium text-slate-800 focus:outline-none focus:border-b border-blue-600 transition-all w-64 disabled:bg-transparent" placeholder="Titre du formulaire" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex border-b-2 border-transparent">
              <button onClick={() => setCreateSubTab('questions')} className={`px-6 py-2 text-sm font-bold transition-all relative ${createSubTab === 'questions' ? 'text-blue-600 after:content-[""] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-1 after:bg-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Questions</button>
              <button onClick={() => setCreateSubTab('results')} className={`px-6 py-2 text-sm font-bold transition-all relative ${createSubTab === 'results' ? 'text-blue-600 after:content-[""] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-1 after:bg-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Réponses</button>
              {!selectedPoll && (
                <button onClick={() => setCreateSubTab('settings')} className={`px-6 py-2 text-sm font-bold transition-all relative ${createSubTab === 'settings' ? 'text-blue-600 after:content-[""] after:absolute after:bottom-[-13px] after:left-0 after:right-0 after:h-1 after:bg-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Paramètres</button>
              )}
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => { setActiveTab('liste'); setSelectedPoll(null); }} className="text-slate-400 p-2 hover:bg-slate-100 rounded-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" /></svg></button>
               {!selectedPoll && <button onClick={handleSaveForm} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow-sm transition-all">Enregistrer</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-8">
          <div><h1 className="text-3xl font-bold text-slate-800 tracking-tight">Sondages & Formulaires</h1><p className="text-slate-500">Recueillez les avis de l'équipe.</p></div>
          {canManage && (<button onClick={() => { setActiveTab('create'); setCreateSubTab('questions'); setFormTitle('Formulaire sans titre'); setQuestions([]); }} className="flex items-center gap-2 px-6 py-3 bg-[#14532d] text-white rounded-2xl font-bold hover:bg-green-800 shadow-md transition-all active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>Nouveau formulaire</button>)}
        </div>
      )}

      <div className={activeTab === 'create' ? 'mt-24' : ''}>
        {activeTab === 'liste' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {polls.map(poll => (
              <div key={poll.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${new Date(poll.endDate) > new Date() ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-500'}`}>{new Date(poll.endDate) > new Date() ? 'Actif' : 'Terminé'}</span>
                  {canManage && <button onClick={() => onDeletePoll(poll.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg></button>}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-1">{poll.title}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{poll.description || "Aucune description."}</p>
                <div className="flex items-center gap-2 mt-auto">
                  <button onClick={() => { setSelectedPoll(poll); setActiveTab('vote'); setIsSubmitted(false); setAnswers({}); }} className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors border border-slate-100">Participer</button>
                  {canManage && (
                    <button onClick={() => { setSelectedPoll(poll); setActiveTab('create'); setCreateSubTab('results'); }} className="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100" title="Voir les résultats">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto space-y-4">
            {createSubTab === 'results' && selectedPoll ? (
              <ResultsSummary poll={selectedPoll} />
            ) : createSubTab === 'settings' ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-8">
                  <h3 className="text-xl font-bold text-slate-800">Paramètres du formulaire</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-700">Collecter les adresses e-mail</h4>
                        <p className="text-sm text-slate-400">Les répondants devront être connectés pour soumettre une réponse.</p>
                      </div>
                      <Switch 
                        checked={settings.collectEmail} 
                        onChange={(val) => setSettings({...settings, collectEmail: val})} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-700">Limiter à une seule réponse</h4>
                        <p className="text-sm text-slate-400">Chaque utilisateur ne pourra soumettre le formulaire qu'une seule fois.</p>
                      </div>
                      <Switch 
                        checked={settings.limitOneResponse} 
                        onChange={(val) => setSettings({...settings, limitOneResponse: val})} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-700">Afficher les résultats aux participants</h4>
                        <p className="text-sm text-slate-400">Permet aux utilisateurs de voir le résumé des réponses après avoir voté.</p>
                      </div>
                      <Switch 
                        checked={settings.showResults} 
                        onChange={(val) => setSettings({...settings, showResults: val})} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-700">Afficher la barre de progression</h4>
                        <p className="text-sm text-slate-400">Indique aux utilisateurs où ils en sont dans le formulaire.</p>
                      </div>
                      <Switch 
                        checked={settings.showProgressBar} 
                        onChange={(val) => setSettings({...settings, showProgressBar: val})} 
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-700">Mélanger l'ordre des questions</h4>
                        <p className="text-sm text-slate-400">L'ordre d'affichage des questions sera aléatoire pour chaque répondant.</p>
                      </div>
                      <Switch 
                        checked={settings.shuffleQuestions} 
                        onChange={(val) => setSettings({...settings, shuffleQuestions: val})} 
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Message de confirmation</label>
                    <textarea 
                      value={settings.confirmationMessage}
                      onChange={(e) => setSettings({...settings, confirmationMessage: e.target.value})}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none transition-all"
                      placeholder="Message affiché après la soumission..."
                    />
                  </div>
                </div>
              </div>
            ) : createSubTab === 'questions' ? (
              <>
                <div className="bg-white rounded-xl border-t-8 border-t-blue-600 border border-slate-200 p-6 shadow-sm mb-6">
                  <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full text-3xl font-bold text-slate-900 border-b border-transparent focus:border-slate-200 focus:outline-none mb-4 pb-2" placeholder="Titre du formulaire" />
                  <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full text-sm text-slate-500 border-b border-transparent focus:border-slate-200 focus:outline-none" placeholder="Description du formulaire" />
                </div>
                <div className="space-y-4">
                  {(selectedPoll ? selectedPoll.questions : questions).map((q, idx) => (
                    <div 
                      key={q.id} 
                      draggable={!selectedPoll}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      className={`bg-white rounded-xl border border-slate-200 shadow-sm border-l-4 transition-all group/q ${q.type === QuestionType.SECTION ? 'border-l-slate-400 bg-slate-50/30' : 'border-l-transparent hover:border-l-blue-600'} ${draggedIdx === idx ? 'opacity-40 scale-95' : 'opacity-100'}`}
                    >
                      {/* Drag Handle & Reorder Buttons */}
                      {!selectedPoll && (
                        <div className="h-6 flex items-center justify-center border-b border-slate-50/50 cursor-grab active:cursor-grabbing group-hover/q:bg-slate-50/30 transition-colors">
                           <div className="flex gap-0.5">
                              {[...Array(6)].map((_, i) => <div key={i} className="w-1 h-1 bg-slate-200 rounded-full" />)}
                           </div>
                        </div>
                      )}

                      <div className="p-6 relative">
                        {/* Side controls for reordering */}
                        {!selectedPoll && (
                          <div className="absolute left-[-48px] top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                             <button onClick={() => handleMoveQuestion(idx, 'up')} disabled={idx === 0} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-20 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7" strokeWidth="2.5" /></svg></button>
                             <button onClick={() => handleMoveQuestion(idx, 'down')} disabled={idx === questions.length - 1} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-20 shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="2.5" /></svg></button>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                          <div className="flex-1 space-y-2">
                            <input 
                              value={q.label} 
                              onChange={(e) => handleUpdateQuestion(q.id, { label: e.target.value })} 
                              disabled={!!selectedPoll}
                              className={`w-full font-bold focus:outline-none focus:bg-slate-50 p-1 rounded transition-all disabled:bg-transparent ${q.type === QuestionType.SECTION ? 'text-xl text-slate-800' : 'text-slate-800'}`} 
                              placeholder={q.type === QuestionType.SECTION ? "Titre de la section" : "Question sans titre"} 
                            />
                            <input value={q.description || ''} onChange={(e) => handleUpdateQuestion(q.id, { description: e.target.value })} disabled={!!selectedPoll} className="w-full text-xs text-slate-400 focus:outline-none p-1 rounded disabled:bg-transparent" placeholder="Description (facultatif)" />
                          </div>
                          <select value={q.type} onChange={(e) => handleUpdateQuestion(q.id, { type: e.target.value as QuestionType })} disabled={!!selectedPoll} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none h-fit disabled:opacity-50">
                            {QUESTION_TYPES_CONFIG.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
                          </select>
                        </div>

                        {q.attachment && (
                          <div className="relative w-full mb-6 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center min-h-[100px] p-4">
                            {q.attachment.type.startsWith('image/') ? (
                              <img src={q.attachment.data} className="max-h-[300px] object-contain" alt="Pièce jointe" />
                            ) : (
                              <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm border border-slate-200 w-full">
                                <FileIcon type={q.attachment.type} className="w-8 h-8 text-blue-600" />
                                <span className="text-sm font-bold text-slate-700 truncate">{q.attachment.name}</span>
                              </div>
                            )}
                            {!selectedPoll && <button onClick={() => handleUpdateQuestion(q.id, { attachment: undefined })} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" /></svg></button>}
                          </div>
                        )}

                        {[QuestionType.RATING, QuestionType.LINEAR_SCALE].includes(q.type) && (
                          <div className="pl-8 space-y-4 mb-6 bg-yellow-50/30 p-6 rounded-2xl border border-yellow-100 animate-in fade-in slide-in-from-left-2">
                            <div className="flex items-center gap-6">
                                <div className="w-40">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Nombre {q.type === QuestionType.RATING ? 'd\'étoiles' : 'd\'unités'}</label>
                                  <select 
                                    value={q.maxValue || 5} 
                                    onChange={(e) => handleUpdateQuestion(q.id, { maxValue: parseInt(e.target.value) })} 
                                    disabled={!!selectedPoll}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-50"
                                  >
                                    {[3, 5, 10].map(v => <option key={v} value={v}>{v} {q.type === QuestionType.RATING ? 'étoiles' : ''}</option>)}
                                  </select>
                                </div>
                                <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Aperçu</label>
                                  <StarRating max={q.maxValue || 5} value={3} onChange={() => {}} />
                                </div>
                            </div>
                          </div>
                        )}

                        {[QuestionType.SINGLE_CHOICE, QuestionType.CHECKBOX, QuestionType.DROPDOWN, QuestionType.RANKING].includes(q.type) && (
                          <div className="pl-8 space-y-3 mb-6">
                            {q.options?.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-3">
                                <input value={opt} onChange={(e) => { const next = [...(q.options || [])]; next[oIdx] = e.target.value; handleUpdateQuestion(q.id, { options: next }); }} disabled={!!selectedPoll} className="text-sm text-slate-600 focus:outline-none focus:border-b border-slate-100 flex-1 py-1 disabled:bg-transparent" placeholder={`Option ${oIdx + 1}`} />
                              </div>
                            ))}
                            {!selectedPoll && <button onClick={() => handleUpdateQuestion(q.id, { options: [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`] })} className="text-xs font-bold text-blue-600 hover:underline">+ Ajouter une option</button>}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-6 pt-6 border-t border-slate-100">
                          {!selectedPoll && q.type !== QuestionType.SECTION && (
                            <label className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors" title="Ajouter une pièce jointe">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" strokeWidth="2" /></svg>
                              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && handleQuestionAttachment(q.id, e.target.files[0])} />
                            </label>
                          )}
                          {!selectedPoll && <button onClick={() => handleRemoveQuestion(q.id)} className="text-slate-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg></button>}
                          {q.type !== QuestionType.SECTION && (
                            <div className="flex items-center gap-2"><input type="checkbox" checked={q.required} onChange={(e) => handleUpdateQuestion(q.id, { required: e.target.checked })} disabled={!!selectedPoll} className="w-4 h-4 text-blue-600 rounded" /><label className="text-sm font-medium text-slate-700">Obligatoire</label></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!selectedPoll && <div className="flex justify-center mt-8"><button onClick={handleAddQuestion} className="flex items-center gap-3 px-8 py-4 bg-white border border-dashed border-slate-300 text-slate-400 rounded-2xl hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm group font-bold">Ajouter une question</button></div>}
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'vote' && selectedPoll && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">{selectedPoll.title}</h2>
              <p className="text-slate-500 mb-8">{selectedPoll.description}</p>
              
              {isSubmitted ? (
                <div className="py-12 text-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedPoll.settings.confirmationMessage}</h3>
                  <button onClick={() => setActiveTab('liste')} className="mt-8 text-green-700 font-bold hover:underline">Retour</button>
                </div>
              ) : (
                <div className="space-y-12">
                  {selectedPoll.questions.map((q) => (
                    <div key={q.id} className="space-y-4">
                      
                      {q.type === QuestionType.SECTION ? (
                        <div className="pt-10 pb-4 border-b-2 border-slate-100">
                          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{q.label}</h3>
                          {q.description && <p className="text-sm text-slate-400 mt-1 italic">{q.description}</p>}
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start gap-2"><h4 className="text-lg font-bold text-slate-800">{q.label || "Question sans titre"}</h4>{q.required && <span className="text-red-500">*</span>}</div>
                          {q.description && <p className="text-sm text-slate-400 italic">{q.description}</p>}
                          
                          {q.type === QuestionType.RATING && (
                            <div className="py-4 flex flex-col items-center sm:items-start gap-3">
                              <StarRating max={q.maxValue || 5} value={answers[q.id] || 0} onChange={(val) => setAnswers({...answers, [q.id]: val})} />
                              {answers[q.id] > 0 && <p className="text-xs font-bold text-green-600 animate-in fade-in duration-300">Note sélectionnée : {answers[q.id]} / {q.maxValue || 5}</p>}
                            </div>
                          )}

                          {q.type === QuestionType.LINEAR_SCALE && (
                            <div className="py-6 space-y-4 px-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-6 justify-center sm:justify-start">
                                {q.minLabel && <span className="text-[10px] font-bold text-slate-400 w-24 text-right uppercase tracking-wider">{q.minLabel}</span>}
                                <div className="flex flex-wrap gap-3 justify-center">
                                   {[...Array((q.maxValue || 5))].map((_, i) => {
                                      const val = i + 1;
                                      return (
                                        <button 
                                          key={val} 
                                          type="button" 
                                          onClick={() => setAnswers({...answers, [q.id]: val})}
                                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base border-2 transition-all ${answers[q.id] === val ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-110' : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600'}`}
                                        >
                                          {val}
                                        </button>
                                      );
                                   })}
                                </div>
                                {q.maxLabel && <span className="text-[10px] font-bold text-slate-400 w-24 uppercase tracking-wider">{q.maxLabel}</span>}
                              </div>
                            </div>
                          )}

                          {[QuestionType.SINGLE_CHOICE, QuestionType.CHECKBOX].includes(q.type) && (
                            <div className="space-y-2">{q.options?.map(opt => (
                              <label key={opt} className={`flex items-center gap-3 p-3 border rounded-xl hover:bg-slate-50 cursor-pointer transition-all ${answers[q.id] === opt || (Array.isArray(answers[q.id]) && answers[q.id].includes(opt)) ? 'border-green-600 bg-green-50/50' : 'border-slate-200'}`}>
                                <input type={q.type === QuestionType.SINGLE_CHOICE ? "radio" : "checkbox"} name={q.id} onChange={(e) => {
                                  if (q.type === QuestionType.SINGLE_CHOICE) setAnswers({...answers, [q.id]: opt});
                                  else { const cur = answers[q.id] || []; const next = e.target.checked ? [...cur, opt] : cur.filter((v:any) => v !== opt); setAnswers({...answers, [q.id]: next}); }
                                }} className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium">{opt}</span>
                              </label>
                            ))}</div>
                          )}

                          {[QuestionType.SHORT_TEXT, QuestionType.PARAGRAPH, QuestionType.EMAIL, QuestionType.NUMBER].includes(q.type) && (
                            q.type === QuestionType.PARAGRAPH 
                            ? <textarea placeholder="Votre réponse..." rows={3} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} className="w-full border-b py-2 outline-none focus:border-green-600 transition-all resize-none" />
                            : <input type={q.type === QuestionType.NUMBER ? 'number' : 'text'} placeholder="Votre réponse..." onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} className="w-full border-b py-2 outline-none focus:border-green-600" />
                          )}

                          {q.type === QuestionType.DATE && <InlineCalendar selectedDate={answers[q.id] || ""} onSelect={(d) => setAnswers({...answers, [q.id]: d})} />}
                        </>
                      )}
                    </div>
                  ))}
                  <div className="pt-8 border-t border-slate-100 flex justify-end">
                    <button onClick={() => { onVote(selectedPoll.id, { userId: currentUser.id, userEmail: currentUser.email, answers, submittedAt: new Date().toISOString() }); setIsSubmitted(true); }} className="px-12 py-4 bg-green-700 text-white rounded-2xl font-bold shadow-lg hover:bg-green-800 transition-all active:scale-95">Envoyer le formulaire</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollsView;