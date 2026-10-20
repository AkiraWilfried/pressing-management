import { Edit2, Eye, FileText, Trash2, Package } from 'lucide-react';
import type { Commande, Client, StatutCommande } from '../lib/types';
import { generateFacturePDF } from '../lib/facture';
import { STATUTS_COMMANDE as STATUTS, badgeCls } from '../lib/statut';

type Props = {
  data: Commande[];
  clients: Client[];
  onView: (c: Commande) => void;
  onEdit: (c: Commande) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, statut: StatutCommande) => void;
};

export default function CommandeTable({ data, clients, onView, onEdit, onDelete, onStatusChange }: Props) {
  const getClient = (id: string) => clients.find((c) => c.id === id);

  if (data.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">
            <Package size={28} />
          </div>
          <p className="empty-state-title">Aucune commande</p>
          <p className="empty-state-text">
            Aucune commande ne correspond à vos filtres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card commandes-table-card">
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Date dépôt</th>
              <th>Date retrait</th>
              <th>Statut</th>
              <th>Total FCFA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cmd) => {
              const client = getClient(cmd.client_id);
              return (
                <tr key={cmd.id}>
                  {/* ID */}
                  <td>
                    <span className="commandes-id">#{cmd.id.slice(0, 8)}</span>
                  </td>

                  {/* CLIENT */}
                  <td>
                    <span className="commandes-client-name">
                      {client?.nom ?? 'Inconnu'}
                    </span>
                    {client?.telephone && (
                      <span className="commandes-client-tel">
                        {client.telephone}
                      </span>
                    )}
                  </td>

                  {/* DATE DÉPÔT */}
                  <td>
                    {new Date(cmd.date_depot).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* DATE RETRAIT */}
                  <td>
                    {new Date(cmd.date_retrait).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* STATUT — changement rapide en ligne */}
                  <td>
                    <select
                      className={`status-select ${badgeCls(cmd.statut)}`}
                      value={cmd.statut}
                      onChange={(e) => onStatusChange(cmd.id, e.target.value as StatutCommande)}
                      aria-label={`Statut de la commande ${cmd.id.slice(0, 8)}`}
                    >
                      {STATUTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  {/* TOTAL */}
                  <td>
                    <span className="commandes-total">
                      {cmd.total.toLocaleString('fr-FR')} FCFA
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td>
                    <div className="commandes-actions">
                      <button
                        className="btn-icon view"
                        title="Voir le détail"
                        aria-label={`Voir le détail de la commande #${cmd.id.slice(0, 8)}`}
                        onClick={() => onView(cmd)}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        className="btn-icon pdf"
                        title="Générer la facture PDF"
                        aria-label="Générer la facture PDF"
                        onClick={() => {
                          if (client) generateFacturePDF(client, cmd);
                        }}
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        className="btn-icon edit"
                        title="Modifier"
                        aria-label="Modifier cette commande"
                        onClick={() => onEdit(cmd)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn-icon delete"
                        title="Supprimer"
                        aria-label="Supprimer cette commande"
                        onClick={() => onDelete(cmd.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
