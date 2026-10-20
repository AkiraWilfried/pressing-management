import { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { useData } from '../contexts/DataContext';
import type { Commande } from '../lib/types';

import '../style/notifications.css';

/* ─────────────────── Types ─────────────────── */

type NotifType = 'ready' | 'overdue' | 'slow';
type TabId     = 'all' | 'unread' | 'urgent';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  date: string;      // ISO — date de référence pour le calcul relatif
  isRead: boolean;
  commande: Commande;
}

/* ─────────────────── Helpers ─────────────────── */

/** Retourne "il y a X heures" ou "il y a X jours" */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days  = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (hours < 1)   return "à l'instant";
  if (hours < 24)  return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

/** Icône + couleur selon le type */
function notifMeta(type: NotifType) {
  switch (type) {
    case 'ready':
      return {
        icon: <CheckCircle2 size={20} />,
        colorClass: 'notif-icon--green',
        badgeClass: 'badge-success',
      };
    case 'overdue':
      return {
        icon: <AlertTriangle size={20} />,
        colorClass: 'notif-icon--red',
        badgeClass: 'badge-danger',
      };
    case 'slow':
      return {
        icon: <Clock size={20} />,
        colorClass: 'notif-icon--orange',
        badgeClass: 'badge-warning',
      };
  }
}

/* ─────────────────── Build notifications ─────────────────── */

function buildNotifications(
  commandes: Commande[],
  clients: { id: string; nom: string }[],
  now: Date
): Notification[] {
  const notifs: Notification[] = [];

  for (const commande of commandes) {
    const client  = clients.find((c) => c.id === commande.client_id);
    const clientNom = client?.nom ?? 'Client inconnu';

    /* 1. Commandes "Prêt" → à récupérer */
    if (commande.statut === 'Prêt') {
      notifs.push({
        id: `ready-${commande.id}`,
        type: 'ready',
        title: 'Commande prête à récupérer',
        description: `La commande de ${clientNom} est prête. En attente de retrait.`,
        date: commande.date_retrait ?? commande.date_depot,
        isRead: false,
        commande,
      });
    }

    /* 2. Commandes en retard (date_retrait dépassée & statut !== 'Retiré') */
    if (
      commande.statut !== 'Retiré' &&
      commande.date_retrait &&
      new Date(commande.date_retrait) < now
    ) {
      notifs.push({
        id: `overdue-${commande.id}`,
        type: 'overdue',
        title: 'Commande en retard',
        description: `La commande de ${clientNom} aurait dû être retirée le ${new Date(
          commande.date_retrait
        ).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}.`,
        date: commande.date_retrait,
        isRead: false,
        commande,
      });
    }

    /* 3. Commandes "En cours" depuis plus de 48h */
    if (commande.statut === 'En cours') {
      const heuresDepot =
        (now.getTime() - new Date(commande.date_depot).getTime()) / (1000 * 60 * 60);

      if (heuresDepot > 48) {
        notifs.push({
          id: `slow-${commande.id}`,
          type: 'slow',
          title: 'Traitement long en cours',
          description: `La commande de ${clientNom} est en traitement depuis plus de ${Math.floor(
            heuresDepot / 24
          )} jour${Math.floor(heuresDepot / 24) > 1 ? 's' : ''}.`,
          date: commande.date_depot,
          isRead: false,
          commande,
        });
      }
    }
  }

  /* Trier par date décroissante */
  return notifs.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/* ─────────────────── Component ─────────────────── */

export default function Notifications() {
  const { data } = useData();
  const [readIds,  setReadIds]  = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const now = new Date();

  /* calcul notifications */
  const allNotifs = useMemo(
    () => buildNotifications(data.commandes, data.clients, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  /* appliquer l'état lu */
  const notifs = useMemo(
    () => allNotifs.map((n) => ({ ...n, isRead: readIds.has(n.id) })),
    [allNotifs, readIds]
  );

  /* filtres par onglet */
  const filteredNotifs = useMemo(() => {
    switch (activeTab) {
      case 'unread':  return notifs.filter((n) => !n.isRead);
      case 'urgent':  return notifs.filter((n) => n.type === 'overdue');
      default:        return notifs;
    }
  }, [notifs, activeTab]);

  /* compteurs pour les badges */
  const counts = useMemo(() => ({
    all:    notifs.length,
    unread: notifs.filter((n) => !n.isRead).length,
    urgent: notifs.filter((n) => n.type === 'overdue').length,
  }), [notifs]);

  /* marquer tout comme lu */
  const markAllRead = () => {
    setReadIds(new Set(notifs.map((n) => n.id)));
  };

  /* marquer une notification comme lue */
  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="notifications-page">

      {/* ══════════════ HEADER ══════════════ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {counts.unread > 0
              ? `${counts.unread} notification${counts.unread > 1 ? 's' : ''} non lue${counts.unread > 1 ? 's' : ''}`
              : 'Tout est à jour'}
          </p>
        </div>
        {counts.unread > 0 && (
          <button className="btn btn-secondary" onClick={markAllRead}>
            <CheckCheck size={18} />
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* ══════════════ ONGLETS ══════════════ */}
      <div className="notif-tabs">
        {(
          [
            { id: 'all'    as TabId, label: 'Toutes',   count: counts.all },
            { id: 'unread' as TabId, label: 'Non lues', count: counts.unread },
            { id: 'urgent' as TabId, label: 'Urgentes', count: counts.urgent },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            className={`notif-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`notif-tab-badge ${
                  tab.id === 'urgent'
                    ? 'badge-danger'
                    : tab.id === 'unread'
                    ? 'badge-info'
                    : 'badge-neutral'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════ LISTE ══════════════ */}
      <div className="notif-list">
        {filteredNotifs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={28} />
            </div>
            <p className="empty-state-title">Aucune notification</p>
            <p className="empty-state-text">
              {activeTab === 'unread'
                ? 'Toutes les notifications ont été lues.'
                : activeTab === 'urgent'
                ? 'Aucune commande en retard pour le moment.'
                : 'Aucune notification à afficher.'}
            </p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const meta = notifMeta(notif.type);
            return (
              <div
                key={notif.id}
                className={`notif-item ${notif.isRead ? 'is-read' : 'is-unread'}`}
                onClick={() => markRead(notif.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && markRead(notif.id)}
              >
                {/* Indicateur non lu */}
                {!notif.isRead && <span className="notif-unread-dot" />}

                {/* Icône */}
                <div className={`notif-icon ${meta.colorClass}`}>
                  {meta.icon}
                </div>

                {/* Contenu */}
                <div className="notif-content">
                  <div className="notif-content-top">
                    <p className="notif-title">{notif.title}</p>
                    <time className="notif-time">{relativeTime(notif.date)}</time>
                  </div>
                  <p className="notif-desc">{notif.description}</p>

                  {/* Badges contextuels */}
                  <div className="notif-badges">
                    <span className={`badge ${meta.badgeClass}`}>
                      {notif.type === 'ready'   && 'À récupérer'}
                      {notif.type === 'overdue' && 'En retard'}
                      {notif.type === 'slow'    && 'Traitement long'}
                    </span>
                    <span className="badge badge-neutral">
                      <Package size={11} />
                      Commande #{notif.commande.id}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
