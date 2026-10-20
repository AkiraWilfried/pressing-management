import type { AppData, Client, Commande, CommandeItem, Paiement, Service } from './types';
import { USE_API } from './config';
import { clientsApi, commandesApi, paiementsApi, servicesApi } from './api';
import * as store from './store';

// Façade asynchrone unique : route vers l'API backend (USE_API=true)
// ou vers le localStorage (mode offline). Les pages ne parlent qu'à ce module.

export type ClientInput = Omit<Client, 'id' | 'created_at'>;
export type ServiceInput = Omit<Service, 'id'>;
export type CommandeInput = Omit<Commande, 'id'>;
export type PaiementInput = Omit<Paiement, 'id'>;

function stripItemFields(items: CommandeItem[]) {
  return items.map(({ id: _id, commande_id: _cid, ...rest }) => rest);
}

export async function loadAll(): Promise<AppData> {
  if (USE_API) {
    const [clients, services, commandes, paiements] = await Promise.all([
      clientsApi.getAll(),
      servicesApi.getAll(),
      commandesApi.getAll(),
      paiementsApi.getAll(),
    ]);
    return { clients, services, commandes, paiements };
  }
  return store.loadData();
}

// ======================
// CLIENTS
// ======================
export async function createClient(input: ClientInput): Promise<Client> {
  if (USE_API) return clientsApi.create(input);
  return store.addClient(input);
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  if (USE_API) {
    await clientsApi.update(id, updates);
    return;
  }
  store.updateClient(id, updates);
}

export async function deleteClient(id: string): Promise<void> {
  if (USE_API) {
    await clientsApi.delete(id);
    return;
  }
  store.deleteClient(id);
}

// ======================
// SERVICES
// ======================
export async function createService(input: ServiceInput): Promise<Service> {
  if (USE_API) return servicesApi.create(input);
  return store.addService(input);
}

export async function updateService(id: string, updates: Partial<Service>): Promise<void> {
  if (USE_API) {
    await servicesApi.update(id, updates);
    return;
  }
  store.updateService(id, updates);
}

export async function deleteService(id: string): Promise<void> {
  if (USE_API) {
    await servicesApi.delete(id);
    return;
  }
  store.deleteService(id);
}

// ======================
// COMMANDES
// ======================
export async function createCommande(input: CommandeInput): Promise<Commande> {
  if (USE_API) {
    const { items = [], ...rest } = input;
    const payload = { ...rest, items: stripItemFields(items) };
    // Le format fil accepte les items sans id (générés côté serveur)
    return commandesApi.create(payload as unknown as CommandeInput);
  }
  return store.addCommande(input);
}

export async function updateCommande(id: string, updates: Partial<Commande>): Promise<void> {
  if (USE_API) {
    const { items, ...rest } = updates;
    const payload: Record<string, unknown> = { ...rest };
    if (items !== undefined) payload.items = stripItemFields(items);
    await commandesApi.update(id, payload as Partial<Commande>);
    return;
  }
  store.updateCommande(id, updates);
}

export async function deleteCommande(id: string): Promise<void> {
  if (USE_API) {
    await commandesApi.delete(id);
    return;
  }
  store.deleteCommande(id);
}

// ======================
// PAIEMENTS
// ======================
export async function createPaiement(input: PaiementInput): Promise<Paiement> {
  if (USE_API) return paiementsApi.create(input);
  return store.addPaiement(input);
}

export async function deletePaiement(id: string): Promise<void> {
  if (USE_API) {
    await paiementsApi.delete(id);
    return;
  }
  store.deletePaiement(id);
}
