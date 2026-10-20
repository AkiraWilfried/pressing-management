import { NavLink, Outlet, useNavigate } from 'react-router';
import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Shirt,
  CreditCard,
  Bell,
  LogOut,
  Menu,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import GlobalSearch from './GlobalSearch';
import '../style/Layout.css';

const navItems = [
  { to: '/',             label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/clients',      label: 'Clients',          icon: Users           },
  { to: '/commandes',    label: 'Commandes',        icon: Package         },
  { to: '/services',     label: 'Services',         icon: Shirt           },
  { to: '/paiements',    label: 'Paiements',        icon: CreditCard      },
];

/** Compte le nombre de notifications urgentes (prêtes + en retard + traitement long) */
function countNotifications(commandes: { statut: string; date_retrait: string; date_depot: string }[]): number {
  const now = new Date();
  let count = 0;
  for (const c of commandes) {
    if (c.statut === 'Prêt') count++;
    if (c.statut !== 'Retiré' && c.date_retrait && new Date(c.date_retrait) < now) count++;
    if (c.statut === 'En cours') {
      const heures = (now.getTime() - new Date(c.date_depot).getTime()) / (1000 * 60 * 60);
      if (heures > 48) count++;
    }
  }
  return count;
}

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data, loading, error, refresh } = useData();
  const notifCount = useMemo(() => countNotifications(data.commandes), [data.commandes]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  /** Génère les initiales de l'avatar à partir du nom */
  const getInitials = (nom?: string): string => {
    if (!nom) return 'U';
    return nom
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="app-layout">

      {/* ── OVERLAY MOBILE ─────────────────────── */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── SIDEBAR ────────────────────────────── */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} aria-label="Navigation principale">

        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo-wrapper">
            <div className="sidebar-logo">
              <Shirt className="sidebar-logo-icon" aria-hidden="true" />
            </div>
            <div className="sidebar-logo-text">
              <h1 className="sidebar-title">Pressing</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Menu principal">
          <ul role="list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `sidebar-link${isActive ? ' active' : ''}`
                  }
                  onClick={closeSidebar}
                >
                  <item.icon className="sidebar-link-icon" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer utilisateur */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar" aria-hidden="true">
              {getInitials(user?.nom)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.nom || 'Utilisateur'}</div>
              <div className="sidebar-user-email">{user?.email || ''}</div>
            </div>
            <button
              onClick={handleLogout}
              className="sidebar-logout"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="sidebar-logout-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN WRAPPER ───────────────────────── */}
      <div className="main-wrapper">

        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-content">

            {/* Hamburger (visible sur mobile) */}
            <button
              className="topbar-menu-btn"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen
                ? <X style={{ width: 22, height: 22 }} aria-hidden="true" />
                : <Menu style={{ width: 22, height: 22 }} aria-hidden="true" />
              }
            </button>

            {/* Barre de recherche globale */}
            <GlobalSearch />

            {/* Actions */}
            <div className="topbar-actions">
              <button
                className="topbar-notification-btn"
                aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} non lues)` : ''}`}
                title="Notifications"
                onClick={() => navigate('/notifications')}
              >
                <Bell style={{ width: 20, height: 20 }} aria-hidden="true" />
                {notifCount > 0 && (
                  <span className="topbar-notification-badge" aria-label={`${notifCount} notifications`}>
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
            </div>

          </div>
        </header>

        {/* Contenu de la page */}
        <main className="main-content">
          {error && (
            <div className="page-alert" role="alert">
              <AlertTriangle className="page-alert-icon" aria-hidden="true" />
              <span className="page-alert-text">
                Impossible de charger les données ({error}).
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
                Réessayer
              </button>
            </div>
          )}
          {loading ? (
            <div className="page-loading" aria-label="Chargement des données">
              <Loader2 className="page-loading-spinner" aria-hidden="true" />
              <span>Chargement…</span>
            </div>
          ) : (
            <Outlet />
          )}
        </main>

      </div>
    </div>
  );
}
