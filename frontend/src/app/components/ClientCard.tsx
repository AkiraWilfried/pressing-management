import { useState } from 'react';
import { Eye, Edit2, Trash2, Phone, MapPin, ShoppingBag, Banknote } from 'lucide-react';
import type { Client } from '../lib/types';
import ConfirmDialog from './ConfirmDialog';

type Props = {
  client: Client;
  commandesCount: number;
  totalDepense: number;
  onEdit: () => void;
  onDelete: () => void;
  onView?: () => void;
};

// ── Génère une couleur stable à partir du nom (hash) ──────────────────────
function getAvatarColor(name: string): { bg: string; text: string } {
  const palette = [
    { bg: '#dbeafe', text: '#1d4ed8' }, // blue
    { bg: '#dcfce7', text: '#15803d' }, // green
    { bg: '#fef9c3', text: '#a16207' }, // yellow
    { bg: '#fce7f3', text: '#be185d' }, // pink
    { bg: '#ede9fe', text: '#6d28d9' }, // purple
    { bg: '#ffedd5', text: '#c2410c' }, // orange
    { bg: '#cffafe', text: '#0e7490' }, // cyan
    { bg: '#fee2e2', text: '#b91c1c' }, // red
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ── Initiales depuis le nom ────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function ClientCard({
  client,
  commandesCount,
  totalDepense,
  onEdit,
  onDelete,
  onView,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const avatarColor = getAvatarColor(client.nom);
  const initials = getInitials(client.nom);

  const handleDeleteClick = () => {
    setConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    setConfirmDelete(false);
    onDelete();
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  return (
    <div className="client-card">
      {/* Bandeau couleur haut */}
      <div className="client-card-accent" />

      {/* ── En-tête : avatar + nom + actions ── */}
      <div className="client-card-header">
        <div className="client-card-identity">
          <div
            className="client-avatar"
            style={{ background: avatarColor.bg, color: avatarColor.text }}
          >
            {initials}
          </div>
          <div className="client-identity-info">
            <h3 className="client-name">{client.nom}</h3>
            <span className="client-since">
              Depuis le {new Date(client.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>

      {/* ── Infos contact ── */}
      <div className="client-contact">
        <div className="client-contact-row">
          <Phone size={14} className="client-contact-icon" />
          <span>{client.telephone}</span>
        </div>
        <div className="client-contact-row">
          <MapPin size={14} className="client-contact-icon" />
          <span>{client.adresse}</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="client-stats-row">
        <div className="client-stat">
          <div className="client-stat-icon-wrap">
            <ShoppingBag size={14} />
          </div>
          <div>
            <span className="client-stat-label">Commandes</span>
            <strong className="client-stat-value">{commandesCount}</strong>
          </div>
        </div>
        <div className="client-stat">
          <div className="client-stat-icon-wrap">
            <Banknote size={14} />
          </div>
          <div>
            <span className="client-stat-label">Total dépensé</span>
            <strong className="client-stat-value">
              {totalDepense.toLocaleString('fr-FR')} FCFA
            </strong>
          </div>
        </div>
      </div>

      {/* ── Confirmation suppression ── */}
      {confirmDelete && (
        <ConfirmDialog
          message={`Supprimer le client « ${client.nom} » ?`}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* ── Boutons d'action ── */}
      <div className="client-card-actions">
        {onView && (
          <button className="btn btn-secondary client-btn-view" onClick={onView}>
            <Eye size={15} />
            Voir
          </button>
        )}
        <button className="btn btn-secondary client-btn-edit" onClick={onEdit}>
          <Edit2 size={15} />
          Modifier
        </button>
        <button className="btn btn-danger client-btn-delete" onClick={handleDeleteClick}>
          <Trash2 size={15} />
          Supprimer
        </button>
      </div>
    </div>
  );
}
