
import React, { useState, useMemo } from 'react';
import { CompanyEvent, User, UserRole } from '../types';
import EventCalendar from './EventCalendar';

interface EventsViewProps {
  currentUser: User;
  events: CompanyEvent[];
  onToggleParticipation: (eventId: string) => void;
  onOpenCreateModal: () => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventsView: React.FC<EventsViewProps> = ({ 
  currentUser, 
  events, 
  onToggleParticipation, 
  onOpenCreateModal,
  onDeleteEvent
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR;

  const filteredEvents = useMemo(() => {
    return events.filter(e => e.date === selectedDate);
  }, [events, selectedDate]);

  const sortedAllEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Agenda de l'entreprise</h1>
          <p className="text-slate-500">Consultez les événements à venir et gérez votre participation.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-[#14532d] text-white rounded-2xl font-bold hover:bg-green-800 shadow-md transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Créer un événement
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche : Calendrier */}
        <div className="space-y-6">
          <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <EventCalendar 
              events={events} 
              selectedDate={selectedDate} 
              onSelectDate={setSelectedDate} 
            />
          </div>
          
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
            <h3 className="font-bold text-green-800 mb-2">Aujourd'hui</h3>
            <p className="text-sm text-green-700 leading-relaxed">
              Sélectionnez une date sur le calendrier pour voir les événements programmés ce jour-là.
            </p>
          </div>
        </div>

        {/* Colonne Droite : Liste des événements */}
        <div className="lg:col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Événements du {new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>

            <div className="space-y-4">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          event.type === 'Réunion' ? 'bg-blue-50 text-blue-600' :
                          event.type === 'Formation' ? 'bg-purple-50 text-purple-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {event.type === 'Réunion' ? <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" /> :
                             event.type === 'Formation' ? <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" strokeWidth="2" /> :
                             <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" />}
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.type}</span>
                          <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" /></svg>
                              {event.startTime} - {event.endTime}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2" /></svg>
                              {event.location}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-2 text-sm leading-relaxed">{event.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-3">
                         {isAdmin && (
                           <button onClick={() => onDeleteEvent(event.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                           </button>
                         )}
                         <button 
                           onClick={() => onToggleParticipation(event.id)}
                           className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                             event.attendees.includes(currentUser.id)
                               ? 'bg-green-600 text-white hover:bg-green-700'
                               : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                           }`}
                         >
                           {event.attendees.includes(currentUser.id) ? 'Je participe' : 'Participer'}
                         </button>
                         <span className="text-[10px] font-bold text-slate-400 uppercase">{event.attendees.length} participants</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl py-12 text-center">
                  <p className="text-slate-400 italic">Aucun événement prévu pour cette date.</p>
                </div>
              )}
            </div>
          </section>

          <section className="pt-4">
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                Tous les événements à venir
             </h2>
             <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Événement</th>
                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lieu</th>
                         <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {sortedAllEvents.filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0))).map(event => (
                        <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 text-sm font-bold text-slate-700">
                              {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                           </td>
                           <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-900">{event.title}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{event.type}</p>
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-500">
                              {event.location}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => setSelectedDate(event.date)}
                                className="text-green-600 font-bold text-xs hover:underline"
                              >
                                Détails
                              </button>
                           </td>
                        </tr>
                      ))}
                      {sortedAllEvents.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic text-sm">Aucun événement enregistré.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EventsView;
