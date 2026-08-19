import React, { useMemo, useState } from 'react';
import { AppNotification } from '../types';
import { ViewType } from './Sidebar';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onOpen: (notification: AppNotification) => void;
}

const ICONS: Record<string, string> = {
  message: '💬',
  post: '📣',
  event: '📅',
  poll: '📊',
  newsletter: '✉️',
  celebration: '🎉',
  game: '🎮',
  highlight: '⭐',
  points: '🏆',
  document: '📄',
  idea: '💡',
  system: '🔔',
};

const LABELS: Record<string, string> = {
  all: 'Toutes',
  unread: 'Non lues',
  message: 'Messages',
  post: 'Social',
  event: 'Événements',
  document: 'Documents',
  poll: 'Sondages',
  idea: 'Idées',
  newsletter: 'Newsletter',
  celebration: 'Célébrations',
  game: 'Jeux',
  highlight: 'Temps forts',
  points: 'Points',
  system: 'Système',
};

const FILTER_KEYS = [
  'all',
  'unread',
  'message',
  'post',
  'event',
  'document',
  'poll',
  'idea',
  'newsletter',
  'celebration',
  'game',
  'highlight',
  'points',
] as const;

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onOpen,
}) => {
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    if (filter === 'unread') return notifications.filter(item => !item.isRead);
    if (filter === 'all') return notifications;
    return notifications.filter(item => item.kind === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter(item => !item.isRead).length;

  const formatDate = (value: string) => {
    const date = new Date(value);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60_000) return 'À l’instant';
    if (diff < 3_600_000) return `Il y a ${Math.max(1, Math.floor(diff / 60_000))} min`;
    if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)} h`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700">Centre d’attention</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">Notifications</h1>
          <p className="text-slate-500 mt-2">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} à consulter`
              : 'Vous êtes à jour.'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void onMarkAllRead()}
            className="px-5 py-3 rounded-2xl bg-green-700 hover:bg-green-800 text-white font-bold shadow-sm"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {FILTER_KEYS.map(key => (
          <button
            type="button"
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
              filter === key
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
            }`}
          >
            {LABELS[key]}
            {key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-dashed border-slate-200 py-20 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h2 className="text-xl font-black text-slate-800">Rien à signaler</h2>
            <p className="text-slate-400 mt-2">Les nouvelles notifications apparaîtront ici.</p>
          </div>
        ) : (
          filtered.map(notification => (
            <article
              key={notification.id}
              className={`group relative rounded-[24px] border p-5 md:p-6 transition-all ${
                notification.isRead
                  ? 'bg-white border-slate-100'
                  : 'bg-green-50/70 border-green-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-2xl ${
                  notification.isRead ? 'bg-slate-100' : 'bg-white shadow-sm'
                }`}>
                  {ICONS[notification.kind] || ICONS.system}
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!notification.isRead) await onMarkRead(notification.id);
                    onOpen(notification);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-slate-900">{notification.title}</h2>
                    {!notification.isRead && (
                      <span className="px-2 py-1 rounded-full bg-green-600 text-white text-[9px] font-black uppercase tracking-wider">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-slate-600 mt-1 leading-relaxed">{notification.message}</p>
                  <p className="text-xs text-slate-400 mt-3 font-medium">{formatDate(notification.createdAt)}</p>
                </button>

              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
