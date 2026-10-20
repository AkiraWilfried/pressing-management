import type { StatutCommande } from './types';

export const STATUTS_COMMANDE: StatutCommande[] = [
  'En cours',
  'Lavé',
  'Repassé',
  'Prêt',
  'Retiré',
  'En retard',
];

const BADGE_PAR_STATUT: Record<StatutCommande, string> = {
  'En cours': 'badge-info',
  'Lavé': 'badge-warning',
  'Repassé': 'badge-warning',
  'Prêt': 'badge-success',
  'Retiré': 'badge-neutral',
  'En retard': 'badge-danger',
};

export function badgeCls(statut: string): string {
  return BADGE_PAR_STATUT[statut as StatutCommande] ?? 'badge-neutral';
}
