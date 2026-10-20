import type { AppData, Commande } from '../lib/types';
import { badgeCls } from '../lib/statut';

type Props = {
  data: AppData;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function RecentOrdersTable({ data }: Props) {
  const recentOrders: Commande[] = [...data.commandes].reverse().slice(0, 8);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2 className="card-title">Dernières commandes</h2>
          <p className="card-subtitle">Historique récent du pressing</p>
        </div>
      </div>

      <div className="table-wrapper">
        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-text">Aucune commande pour le moment.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Dépôt</th>
                <th>Retrait</th>
                <th>Statut</th>
                <th>Total FCFA</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((commande) => {
                const client = data.clients.find((c) => c.id === commande.client_id);
                const badgeClass = badgeCls(commande.statut);

                return (
                  <tr key={commande.id}>
                    <td>
                      <span className="font-medium">{client?.nom ?? 'Client inconnu'}</span>
                    </td>
                    <td>{formatDate(commande.date_depot)}</td>
                    <td>{formatDate(commande.date_retrait)}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {commande.statut}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium">
                        {commande.total.toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
