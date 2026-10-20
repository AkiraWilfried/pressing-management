import { Package, Calendar, Tag, Layers } from 'lucide-react';
import type { Commande } from '../lib/types';
import { badgeCls } from '../lib/statut';

export default function OrderCard({
  order,
  onSelect,
}: {
  order: Commande;
  onSelect?: (o: Commande) => void;
}) {
  const badge = badgeCls(order.statut);
  const totalItems = order.items?.reduce((s, i) => s + i.quantite, 0) ?? 0;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div
      className={`order-card${onSelect ? ' order-card--clickable' : ''}`}
      onClick={onSelect ? () => onSelect(order) : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(order);
              }
            }
          : undefined
      }
    >
      {/* TOP */}
      <div className="order-card-top">
        <div className="order-card-id">
          <Package size={14} />
          <span>CMD-{order.id.slice(0, 8)}</span>
        </div>
        <span className={`badge ${badge}`}>{order.statut}</span>
      </div>

      {/* TOTAL */}
      <div className="order-card-total">
        {order.total.toLocaleString('fr-FR')} FCFA
      </div>

      {/* META */}
      <div className="order-card-meta">
        <span className="order-card-meta-item">
          <Calendar size={13} />
          Dépôt : {fmt(order.date_depot)}
        </span>
        <span className="order-card-meta-item">
          <Calendar size={13} />
          Retrait : {fmt(order.date_retrait)}
        </span>
        {totalItems > 0 && (
          <span className="order-card-meta-item">
            <Layers size={13} />
            {totalItems} vêtement{totalItems > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ARTICLES (liste compacte) */}
      {order.items && order.items.length > 0 && (
        <div className="order-card-items">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="order-card-item">
              <Tag size={11} />
              <span>{item.nom}</span>
              <span className="order-card-item-service">{item.service}</span>
              <span className="order-card-item-qty">×{item.quantite}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="order-card-more">
              +{order.items.length - 3} article{order.items.length - 3 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
