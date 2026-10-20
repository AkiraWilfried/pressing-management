import { X, Phone, MapPin, Calendar, FileText, Layers } from 'lucide-react';
import type { Commande, Client } from '../lib/types';
import { generateFacturePDF } from '../lib/facture';
import { badgeCls } from '../lib/statut';
import Modal from './Modal';
import '../style/orderDetail.css';

type Props = {
  commande: Commande;
  client?: Client;
  onClose: () => void;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

export default function OrderDetailModal({ commande, client, onClose }: Props) {

  const badge = badgeCls(commande.statut);
  const totalItems = commande.items.reduce((s, i) => s + i.quantite, 0);
  const refs = commande.items.flatMap((i) => (i.references ?? []).filter(Boolean));

  return (
    <Modal
      onClose={onClose}
      title="Détail de la commande"
      className="order-detail-modal"
      header={
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Détail de la commande</h2>
            <span className="od-id">CMD-{commande.id.slice(0, 8)}</span>
          </div>
          <div className="od-header-right">
            <span className={`badge ${badge}`}>{commande.statut}</span>
            <button className="modal-close" onClick={onClose} aria-label="Fermer">
              <X size={20} />
            </button>
          </div>
        </div>
      }
    >
        {/* BODY */}
        <div className="modal-body">
          {/* CLIENT */}
          <div className="od-client">
            <div className="od-client-avatar">
              {(client?.nom ?? '?').charAt(0).toUpperCase()}
            </div>
            <div className="od-client-info">
              <strong className="od-client-name">{client?.nom ?? 'Client inconnu'}</strong>
              {client?.telephone && (
                <span className="od-client-line">
                  <Phone size={13} /> {client.telephone}
                </span>
              )}
              {client?.adresse && (
                <span className="od-client-line">
                  <MapPin size={13} /> {client.adresse}
                </span>
              )}
            </div>
          </div>

          {/* DATES */}
          <div className="od-dates">
            <div className="od-date">
              <span className="od-date-label">
                <Calendar size={13} /> Dépôt
              </span>
              <span className="od-date-value">{fmtDate(commande.date_depot)}</span>
            </div>
            <div className="od-date">
              <span className="od-date-label">
                <Calendar size={13} /> Retrait
              </span>
              <span className="od-date-value">{fmtDate(commande.date_retrait)}</span>
            </div>
          </div>

          {/* ARTICLES */}
          <div className="od-section">
            <div className="od-section-title">
              <Layers size={15} />
              Articles · {totalItems} vêtement{totalItems > 1 ? 's' : ''}
            </div>
            <div className="od-items">
              {commande.items.map((item) => {
                const itemRefs = (item.references ?? []).filter(Boolean);
                return (
                  <div key={item.id} className="od-item">
                    <div className="od-item-head">
                      <span className="od-item-name">{item.nom}</span>
                      <span className="od-item-service">{item.service}</span>
                    </div>
                    <div className="od-item-meta">
                      <span>×{item.quantite}</span>
                      <span>{item.prix.toLocaleString('fr-FR')} FCFA / u.</span>
                      <strong>{(item.prix * item.quantite).toLocaleString('fr-FR')} FCFA</strong>
                    </div>
                    {itemRefs.length > 0 && (
                      <div className="od-refs">
                        {itemRefs.map((r, ri) => (
                          <span key={ri} className="od-ref-chip">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {refs.length === 0 && (
            <p className="od-no-refs">Aucune référence sur cette commande.</p>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer od-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Fermer</button>
          {client && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => generateFacturePDF(client, commande)}
            >
              <FileText size={16} /> Facture PDF
            </button>
          )}
        </div>
    </Modal>
  );
}
