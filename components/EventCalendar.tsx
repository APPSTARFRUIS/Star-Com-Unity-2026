
import React, { useState } from 'react';
import { CompanyEvent } from '../types';

interface EventCalendarProps {
  events: CompanyEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ events, selectedDate, onSelectDate }) => {
  // On initialise sur le mois de la date sélectionnée ou Janvier 2026 par défaut pour le style
  const [viewDate, setViewDate] = useState(new Date(selectedDate || '2026-01-13'));

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (month: number, year: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Lundi = 0
  };

  const monthName = viewDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const numDays = daysInMonth(month, year);
  const startDay = startDayOfMonth(month, year);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setViewDate(new Date(year, month + 1, 1));
  };

  const days = [];
  // Jours vides du début de mois
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-10"></div>);
  }

  // Jours du mois
  for (let d = 1; d <= numDays; d++) {
    const currentIterDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    const isSelected = selectedDate === currentIterDate;
    const hasEvent = events.some(e => e.date === currentIterDate);
    
    // Pour le style de la capture, le 13 est mis en avant si c'est aujourd'hui (simulé)
    const isTodaySimulated = d === 13 && month === 0 && year === 2026;

    days.push(
      <button
        key={d}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectDate(currentIterDate);
        }}
        className={`h-10 w-full flex items-center justify-center rounded-lg text-sm transition-all relative group ${
          isSelected 
            ? 'bg-green-600 text-white font-bold shadow-sm' 
            : isTodaySimulated 
              ? 'text-green-600 font-bold hover:bg-green-50' 
              : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        {d}
        {hasEvent && !isSelected && (
          <div className="absolute bottom-1.5 w-1 h-1 bg-green-500 rounded-full"></div>
        )}
      </button>
    );
  }

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 w-full max-w-sm animate-in fade-in zoom-in duration-300"
      onClick={(e) => e.stopPropagation()} // Sécurité pour éviter de fermer la modale
    >
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-lg font-medium text-slate-800 capitalize">{monthName}</h2>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={handlePrevMonth}
            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            type="button" 
            onClick={handleNextMonth}
            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {['LU', 'MA', 'ME', 'JE', 'VE', 'SA', 'DI'].map(day => (
          <div key={day} className="text-[10px] font-bold text-slate-400 tracking-wider mb-2">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
};

export default EventCalendar;
