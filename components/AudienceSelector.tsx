import React from 'react';
import { OrgEntity, User, UserRole } from '../types';
import { AUDIENCE_ALL } from '../audience';

interface Props {
  currentUser: User;
  entities: OrgEntity[];
  value: string;
  onChange: (value: string) => void;
  allowOwnCompanyOnly?: boolean;
  label?: string;
}

const AudienceSelector: React.FC<Props> = ({
  currentUser,
  entities,
  value,
  onChange,
  allowOwnCompanyOnly = false,
  label = 'Audience'
}) => {
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const activeEntities = entities.filter(entity => entity.active);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value={AUDIENCE_ALL}>Commun à tous</option>

        {!isAdmin && allowOwnCompanyOnly && currentUser.company && (
          <option value={currentUser.company}>Mon entreprise — {currentUser.company}</option>
        )}

        {isAdmin && activeEntities.map(entity => (
          <option key={entity.id} value={entity.name}>{entity.name} uniquement</option>
        ))}

        {!isAdmin && !allowOwnCompanyOnly && currentUser.company && (
          <option value={currentUser.company}>{currentUser.company} uniquement</option>
        )}
      </select>
      <p className="text-[11px] text-slate-400">
        {value === AUDIENCE_ALL
          ? 'Visible par tous les utilisateurs de Star ComUnity.'
          : `Visible uniquement par ${value}${isAdmin ? ' (et les administrateurs).' : '.'}`}
      </p>
    </div>
  );
};

export default AudienceSelector;
