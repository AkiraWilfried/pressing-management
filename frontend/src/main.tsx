import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { App } from './App';
import { AuthProvider } from '../src/app/contexts/AuthContext';
import './app/style/design-system.css';

function Main() {
  return (
    <AuthProvider>
      <RouterProvider router={App} />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>,
);