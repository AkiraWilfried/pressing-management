import { useMemo } from 'react';

import {
  PackageCheck,
  Clock3,
  TriangleAlert,
  Banknote,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

import { useData } from '../contexts/DataContext';
import { badgeCls } from '../lib/statut';

import StatCard from '../components/StatCard';
import RecentOrdersTable from '../components/RecentOrdersTable';

import '../style/Dashboard.css';

// ─── Tooltip personnalisé pour le graphique ──────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">
          {payload[0].value.toLocaleString('fr-FR')} FCFA
        </p>
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { data } = useData();

  // ── Stats du jour ────────────────────────────────────────────────────────
  const dashboardStats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');

    const commandesToday = data.commandes.filter(
      (c) => c.date_depot.split('T')[0] === todayStr
    );

    const revenusToday = data.paiements
      .filter((p) => p.date.split('T')[0] === todayStr)
      .reduce((sum, p) => sum + p.montant, 0);

    const commandesPretes = data.commandes.filter(
      (c) => c.statut?.trim().toLowerCase() === 'prêt'
    );

    const commandesRetard = data.commandes.filter(
      (c) =>
        c.statut?.trim().toLowerCase() !== 'retiré' &&
        new Date(c.date_retrait) < today
    );

    return { commandesToday, revenusToday, commandesPretes, commandesRetard };
  }, [data]);

  // ── Revenus 7 derniers jours ─────────────────────────────────────────────
  const revenus7Jours = useMemo(() => {
    const labelsFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = date.toLocaleDateString('en-CA');

      const total = data.paiements
        .filter((p) => p.date.split('T')[0] === dateStr)
        .reduce((sum, p) => sum + p.montant, 0);

      return { day: labelsFr[date.getDay()], total };
    });
  }, [data.paiements]);

  // ── Activité récente (6 dernières commandes) ─────────────────────────────
  const recentActivity = useMemo(() => {
    return [...data.commandes].reverse().slice(0, 6);
  }, [data.commandes]);

  // ── Date du jour en français ─────────────────────────────────────────────
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getBadgeClass = (statut: string) => `badge ${badgeCls(statut)}`;

  return (
    <div className="dashboard-page">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Gestion et suivi du pressing</p>
        </div>
        <div className="dashboard-date-badge">
          {dateAujourdhui}
        </div>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────── */}
      <div className="stats-grid grid-4">
        <StatCard
          title="Commandes du jour"
          value={dashboardStats.commandesToday.length}
          icon={<PackageCheck size={24} />}
          color="green"
        />
        <StatCard
          title="Revenus du jour"
          value={`${dashboardStats.revenusToday.toLocaleString('fr-FR')} FCFA`}
          icon={<Banknote size={24} />}
          color="blue"
        />
        <StatCard
          title="Commandes prêtes"
          value={dashboardStats.commandesPretes.length}
          icon={<Clock3 size={24} />}
          color="orange"
        />
        <StatCard
          title="Retards"
          value={dashboardStats.commandesRetard.length}
          icon={<TriangleAlert size={24} />}
          color="red"
        />
      </div>

      {/* ── GRAPHIQUE + ACTIVITÉ ─────────────────────────────────────── */}
      <div className="dashboard-grid">

        {/* Graphique Revenus 7 jours */}
        <div className="card dashboard-chart-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Revenus de la semaine</h2>
              <p className="card-subtitle">Évolution des revenus sur 7 jours</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart
              data={revenus7Jours}
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradientRevenu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-success)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : '0'}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-success)"
                strokeWidth={2.5}
                fill="url(#gradientRevenu)"
                dot={{ r: 4, fill: 'var(--color-success)', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Activité récente */}
        <div className="card dashboard-activity-card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Activité récente</h2>
              <p className="card-subtitle">6 dernières commandes</p>
            </div>
          </div>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">Aucune commande pour le moment</p>
              </div>
            ) : (
              recentActivity.map((commande) => {
                const client = data.clients.find((c) => c.id === commande.client_id);
                return (
                  <div className="activity-item" key={commande.id}>
                    <div className="activity-item-left">
                      <div className="activity-avatar">
                        {(client?.nom ?? 'C').charAt(0).toUpperCase()}
                      </div>
                      <div className="activity-info">
                        <strong className="activity-client">{client?.nom ?? 'Client inconnu'}</strong>
                        <span className={getBadgeClass(commande.statut)}>
                          {commande.statut}
                        </span>
                      </div>
                    </div>
                    <p className="activity-amount">
                      {commande.total.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ── TABLE COMMANDES RÉCENTES ─────────────────────────────────── */}
      <RecentOrdersTable data={data} />

    </div>
  );
}
