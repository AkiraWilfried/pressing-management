import type { Client, Commande, Service, Paiement } from './types';
import { API_BASE_URL } from './config';

// ======================
// BASE CONFIGURATION
// ======================
const BASE_URL = API_BASE_URL;

// ======================
// CORE REQUEST FUNCTION
// ======================
async function apiRequest<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem('pressing_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      localStorage.removeItem('pressing_token');
      localStorage.removeItem('pressing_user');
      window.dispatchEvent(new Event('pressing:unauthorized'));
    }
    // Tenter de lire le message d'erreur du serveur
    let errorMessage = `Erreur ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail ?? errorData.message ?? errorMessage;
    } catch {
      // Ignorer si le corps n'est pas du JSON valide
    }
    throw new Error(errorMessage);
  }

  // Gérer les réponses sans corps (ex: 204 No Content)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ======================
// AUTH API
// ======================
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; token_type: string }>(
      'POST',
      '/auth/login',
      { email, password }
    ),
  me: () =>
    apiRequest<{ id: string; email: string; nom: string; role: 'admin' | 'user' }>(
      'GET',
      '/auth/me'
    ),
  logout: () => apiRequest<void>('POST', '/auth/logout'),
};

// ======================
// CLIENTS API
// ======================
export const clientsApi = {
  getAll: () => apiRequest<Client[]>('GET', '/clients'),
  getById: (id: string) => apiRequest<Client>('GET', `/clients/${id}`),
  create: (data: Omit<Client, 'id' | 'created_at'>) =>
    apiRequest<Client>('POST', '/clients', data),
  update: (id: string, data: Partial<Client>) =>
    apiRequest<Client>('PUT', `/clients/${id}`, data),
  delete: (id: string) => apiRequest<void>('DELETE', `/clients/${id}`),
};

// ======================
// COMMANDES API
// ======================
export const commandesApi = {
  getAll: () => apiRequest<Commande[]>('GET', '/commandes'),
  getById: (id: string) => apiRequest<Commande>('GET', `/commandes/${id}`),
  getByClient: (clientId: string) =>
    apiRequest<Commande[]>('GET', `/commandes?client_id=${clientId}`),
  create: (data: Omit<Commande, 'id'>) =>
    apiRequest<Commande>('POST', '/commandes', data),
  update: (id: string, data: Partial<Commande>) =>
    apiRequest<Commande>('PUT', `/commandes/${id}`, data),
  delete: (id: string) => apiRequest<void>('DELETE', `/commandes/${id}`),
};

// ======================
// SERVICES API
// ======================
export const servicesApi = {
  getAll: () => apiRequest<Service[]>('GET', '/services'),
  create: (data: Omit<Service, 'id'>) =>
    apiRequest<Service>('POST', '/services', data),
  update: (id: string, data: Partial<Service>) =>
    apiRequest<Service>('PUT', `/services/${id}`, data),
  delete: (id: string) => apiRequest<void>('DELETE', `/services/${id}`),
};

// ======================
// PAIEMENTS API
// ======================
export const paiementsApi = {
  getAll: () => apiRequest<Paiement[]>('GET', '/paiements'),
  create: (data: Omit<Paiement, 'id'>) =>
    apiRequest<Paiement>('POST', '/paiements', data),
  delete: (id: string) => apiRequest<void>('DELETE', `/paiements/${id}`),
};
