import { useMemo, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Package, ArrowUpDown } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Client, Commande } from '../lib/types';

import ClientHeader from '../components/ClientHeader';
import OrderCard from '../components/OrderCard';
import OrderDetailModal from '../components/OrderDetailModal';

import '../style/clientOrders.css';

type Props = {
  client?: Client;
  onBack?: () => void;
};

const FILTERS: { label: string; value: string }[] = [
  { label: 'Toutes',   value: 'ALL'       },
  { label: 'En cours', value: 'En cours'  },
  { label: 'Lavé',     value: 'Lavé'      },
  { label: 'Repassé',  value: 'Repassé'   },
  { label: 'Prêt',     value: 'Prêt'      },
  { label: 'Retiré',   value: 'Retiré'    },
  { label: 'En retard',value: 'En retard' },
];

const STATUT_ORDER = ['En cours', 'Lavé', 'Repassé', 'Prêt', 'Retiré', 'En retard'];

const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Dépôt (récent)',  value: 'depot_desc'   },
  { label: 'Dépôt (ancien)',  value: 'depot_asc'    },
  { label: 'Retrait (proche)',value: 'retrait_asc'  },
  { label: 'Retrait (loin)',  value: 'retrait_desc' },
  { label: 'Montant (↓)',     value: 'montant_desc' },
  { label: 'Montant (↑)',     value: 'montant_asc'  },
  { label: 'Statut',          value: 'statut'       },
];

export default function ClientOrders({ client: propClient, onBack }: Props = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useData();

  const client = propClient ?? (location.state?.client as Client | undefined);
  const highlightCommandeId = location.state?.highlightCommandeId as string | undefined;
  const handleBack = onBack ?? (() => navigate('/clients'));

  const orders = useMemo(() => {
    if (!client) return data.commandes;
    return data.commandes.filter((c: Commande) => c.client_id === client.id);
  }, [data, client]);

  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('depot_desc');
  const [detail, setDetail] = useState<Commande | null>(null);

  const filteredOrders = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((o) => o.statut === filter);
  }, [orders, filter]);

  const sortedOrders = useMemo(() => {
    const arr = [...filteredOrders];
    switch (sortBy) {
      case 'depot_asc':
        arr.sort((a, b) => +new Date(a.date_depot) - +new Date(b.date_depot));
        break;
      case 'retrait_asc':
        arr.sort((a, b) => +new Date(a.date_retrait) - +new Date(b.date_retrait));
        break;
      case 'retrait_desc':
        arr.sort((a, b) => +new Date(b.date_retrait) - +new Date(a.date_retrait));
        break;
      case 'montant_desc':
        arr.sort((a, b) => b.total - a.total);
        break;
      case 'montant_asc':
        arr.sort((a, b) => a.total - b.total);
        break;
      case 'statut':
        arr.sort((a, b) => STATUT_ORDER.indexOf(a.statut) - STATUT_ORDER.indexOf(b.statut));
        break;
      case 'depot_desc':
      default:
        arr.sort((a, b) => +new Date(b.date_depot) - +new Date(a.date_depot));
        break;
    }
    return arr;
  }, [filteredOrders, sortBy]);

  // Scroll vers la commande mise en évidence
  const highlightRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (highlightCommandeId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightCommandeId]);

  return (
    <div className="client-orders-page">

      {/* TOPBAR */}
      <div className="client-orders-topbar">
        <button className="btn btn-secondary co-back-btn" onClick={handleBack} aria-label="Retour">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="co-title">
            {client ? `Commandes de ${client.nom}` : 'Toutes les commandes'}
          </h1>
          <p className="co-subtitle">{orders.length} commande{orders.length > 1 ? 's' : ''} au total</p>
        </div>
      </div>

      {/* CLIENT HEADER */}
      {client && <ClientHeader client={client} orders={orders} />}

      {/* FILTRES + TRI */}
      <div className="co-filterbar">
        <div className="co-filters">
          {FILTERS.map((f) => {
            const count = f.value === 'ALL'
              ? orders.length
              : orders.filter((o) => o.statut === f.value).length;
            return (
              <button
                key={f.value}
                className={`co-filter-btn ${filter === f.value ? 'active' : ''}`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
                {count > 0 && (
                  <span className="co-filter-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="co-sort">
          <ArrowUpDown size={14} className="co-sort-icon" />
          <label className="co-sort-label" htmlFor="co-sort-select">Trier</label>
          <select
            id="co-sort-select"
            className="co-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTE */}
      {sortedOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package size={28} />
            </div>
            <p className="empty-state-title">Aucune commande</p>
            <p className="empty-state-text">
              {filter === 'ALL'
                ? 'Ce client n\'a pas encore de commandes.'
                : `Aucune commande avec le statut « ${filter} ».`}
            </p>
          </div>
        </div>
      ) : (
        <div className="co-orders-grid">
          {sortedOrders.map((order) => {
            const isHighlighted = highlightCommandeId === order.id;
            return (
              <div
                key={order.id}
                ref={isHighlighted ? highlightRef : null}
                className={isHighlighted ? 'co-order-highlighted' : undefined}
              >
                <OrderCard order={order} onSelect={setDetail} />
              </div>
            );
          })}
        </div>
      )}

      {/* MODALE DÉTAIL */}
      {detail && (
        <OrderDetailModal
          commande={detail}
          client={client ?? data.clients.find((c) => c.id === detail.client_id)}
          onClose={() => setDetail(null)}
        />
      )}

    </div>
  );
}
