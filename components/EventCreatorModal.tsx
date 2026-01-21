
import React, { useState } from 'react';
import { CompanyEvent, EventType, User } from '../types';
import { DEPARTMENTS } from '../constants';
import EventCalendar from './EventCalendar';

interface EventCreatorModalProps {
  onClose: () => void;
  onSave: (event: Omit<CompanyEvent, 'id' | 'createdBy' | 'attendees'>) => void;
  currentUser: User;
}

const EventCreatorModal: React.FC<EventCreatorModalProps> = ({ onClose, onSave, currentUser }) => {
  const [type, setType] = useState<EventType>('Réunion');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('2026-01-13');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [participants, setParticipants] = useState<string[]>(['Toute l\'équipe']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (participants.length === 0) {
      alert('Veuillez sélectionner au moins un participant ou service.');
      return;
    }
    onSave({
      type,
      title,
      description,
      location,
      date,
      startTime,
      endTime,
      participants
    });
  };

  const toggleParticipant = (dept: string) => {
    if (dept === "Toute l'équipe") {
      // Si on sélectionne "Toute l'équipe", on remplace tout le reste
      setParticipants(["Toute l'équipe"]);
    } else {
      // Si on sélectionne un département spécifique
      setParticipants(prev => {
        // On retire "Toute l'équipe" si elle était présente
        const filtered = prev.filter(p => p !== "Toute l'équipe");
        
        if (filtered.includes(dept)) {
          // Si déjà présent, on le retire
          const next = filtered.filter(p => p !== dept);
          // Si on a tout retiré, on remet par défaut "Toute l'équipe" ou on laisse vide
          return next.length === 0 ? ["Toute l'équipe"] : next;
        } else {
          // Sinon on l'ajoute
          return [...filtered, dept];
        }
      });
    }
  };

  // Liste combinée pour la modale uniquement
  const allParticipantOptions = ["Toute l'équipe", ...DEPARTMENTS];

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
          <h2 className="text-xl font-medium text-slate-800">Créer un nouvel événement</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type d'événement</label>
            <div className="relative">
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all appearance-none outline-none"
              >
                <option value="Réunion">Réunion</option>
                <option value="Formation">Formation</option>
                <option value="Événement social">Événement social</option>
                <option value="Autre">Autre</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Titre</label>
            <input 
              required
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lieu</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date : {date}</label>
              <EventCalendar events={[]} selectedDate={date} onSelectDate={setDate} />
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Heure de début</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Heure de fin</label>
                <div className="relative">
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Participants</label>
                <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                  <div className="max-h-[180px] overflow-y-auto p-2 space-y-1">
                    {allParticipantOptions.map(dept => {
                      const isSelected = participants.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => toggleParticipant(dept)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isSelected 
                              ? 'bg-white text-green-700 shadow-sm border border-green-100' 
                              : 'text-slate-600 hover:bg-white hover:text-slate-900'
                          }`}
                        >
                          <span className="truncate">{dept}</span>
                          {isSelected && (
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium px-2 italic">
                  {participants.includes("Toute l'équipe") 
                    ? "Tous les salariés recevront une invitation." 
                    : `${participants.length} service(s) sélectionné(s).`}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-4 sticky bottom-0 bg-white z-20">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-md shadow-green-200 transition-all active:scale-95"
            >
              Créer l'événement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCreatorModal;
