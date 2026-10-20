import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from '../src/app/components/Layout';
import { ProtectedRoute } from '../src/app/components/ProtectedRoute';
import { DataProvider } from '../src/app/contexts/DataContext';
import Dashboard from '../src/app/pages/Dashboard';
import Clients from '../src/app/pages/Clients';
import ClientOrders from '../src/app/pages/ClientOrders';
import Commandes from '../src/app/pages/Commandes';
import Services from '../src/app/pages/Services';
import Paiements from '../src/app/pages/Paiements';
import Notifications from '../src/app/pages/Notifications';
import Login from '../src/app/pages/Login';
import './app.css';

export const App = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DataProvider>
          <Layout />
        </DataProvider>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'clients', element: <Clients /> },
      { path: 'client/:id', element: <ClientOrders /> },
      { path: 'commandes', element: <Commandes /> },
      { path: 'services', element: <Services /> },
      { path: 'paiements', element: <Paiements /> },
      { path: 'notifications', element: <Notifications /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
