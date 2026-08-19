import { User, UserRole } from './types';

export const AUDIENCE_ALL = 'ALL';

export const normalizeAudienceValue = (value?: string | null) =>
  (value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR');

export const normalizeAudience = (audience?: string[] | null, fallback = 'Star Fruits') => {
  const values = (audience || []).map(v => v?.trim()).filter(Boolean) as string[];
  return values.length ? values : [fallback];
};

export const canViewAudience = (currentUser: User, audience?: string[] | null) => {
  if (currentUser.role === UserRole.ADMIN) return true;

  const values = normalizeAudience(audience);
  if (values.includes(AUDIENCE_ALL)) return true;

  const company = normalizeAudienceValue(currentUser.company);
  return values.some(value => normalizeAudienceValue(value) === company);
};

export const audienceLabel = (audience?: string[] | null) => {
  const values = normalizeAudience(audience);
  if (values.includes(AUDIENCE_ALL)) return 'Commun à tous';
  return values.join(', ');
};
