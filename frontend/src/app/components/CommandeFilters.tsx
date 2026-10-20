import { Search } from 'lucide-react';
import type { StatutCommande } from '../lib/types';

type Props = {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatut: StatutCommande | 'Tous';
  setFilterStatut: (v: StatutCommande | 'Tous') => void;
};

const STATUTS: (StatutCommande | 'Tous')[] = [
  'Tous',
  'En cours',
  'Lavé',
  'Repassé',
  'Prêt',
  'Retiré',
  'En retard',
];

export default function CommandeFilters({
  searchTerm,
  setSearchTerm,
  filterStatut,
  setFilterStatut,
}: Props) {
  return (
    <div className="commandes-filters">
      {/* SEARCH */}
      <div className="commandes-search">
        <Search size={16} className="commandes-search-icon" />
        <input
          className="commandes-search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par client ou ID..."
        />
      </div>

      {/* STATUT TABS */}
      <div className="commandes-tabs" role="tablist">
        {STATUTS.map((statut) => (
          <button
            key={statut}
            role="tab"
            aria-selected={filterStatut === statut}
            className={`commandes-tab${filterStatut === statut ? ' commandes-tab--active' : ''}`}
            onClick={() => setFilterStatut(statut)}
          >
            {statut}
          </button>
        ))}
      </div>
    </div>
  );
}
