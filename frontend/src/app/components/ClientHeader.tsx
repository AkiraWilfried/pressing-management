import { Phone, MapPin, Calendar, Package, Banknote, Clock } from 'lucide-react';
import type { Client, Commande } from '../lib/types';

type Props = {
  client: Client;
  orders: Commande[];
};

/** Hash simple pour attribuer une couleur à partir du nom */
function nameToColor(name: string): string {
  const colors = [
    '#2563eb', '#059669', '#d97706', '#dc2626',
    '#7c3aed', '#0891b2', '#be185d', '#ea580c',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ClientHeader({ client, orders }: Props) {
  const total = orders.reduce((s, o) => s + o.total, 0);
  const commandesActives = orders.filter((o) => o.statut !== 'Retiré').length;
  const initials = client.nom
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const color = nameToColor(client.nom);

  return (
    <div className="co-client-card">
      {/* Identité */}
      <div className="co-client-identity">
        <div
          className="co-client-avatar"
          style={{ background: color }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="co-client-info">
          <h2 className="co-client-name">{client.nom}</h2>
          <div className="co-client-meta">
            <span className="co-client-meta-item">
              <Phone size={13} />
              {client.telephone}
            </span>
            <span className="co-client-meta-item">
              <MapPin size={13} />
              {client.adresse}
            </span>
            <span className="co-client-meta-item">
              <Calendar size={13} />
              Client depuis {new Date(client.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="co-client-stats">
        <div className="co-client-stat">
          <Package size={18} className="co-stat-icon blue" />
          <div>
            <strong>{orders.length}</strong>
            <span>Commandes</span>
          </div>
        </div>
        <div className="co-client-stat">
          <Clock size={18} className="co-stat-icon orange" />
          <div>
            <strong>{commandesActives}</strong>
            <span>En cours</span>
          </div>
        </div>
        <div className="co-client-stat">
          <Banknote size={18} className="co-stat-icon green" />
          <div>
            <strong>{total.toLocaleString('fr-FR')}</strong>
            <span>FCFA dépensé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
