import type { AppData, Client, Service, Commande, Paiement } from './types';

const STORAGE_KEY = 'pressing_app_data';

// ======================
// DONNÉES DE DÉPART — état vide (première utilisation)
// ======================
const initialData: AppData = {
  clients: [],
  services: [],
  commandes: [],
  paiements: [],
};

// ======================
// LOAD SAFE DATA
// ======================
export function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return initialData;

    const parsed = JSON.parse(stored);

    return {
      clients: parsed.clients ?? [],
      services: parsed.services ?? [],
      commandes: parsed.commandes ?? [],
      paiements: parsed.paiements ?? [],
    };
  } catch (error) {
    console.error('Erreur loadData:', error);
    return initialData;
  }
}

// ======================
// SAVE DATA
// ======================
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erreur saveData:', error);
  }
}

// ======================
// GENERATE ID
// ======================
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ======================
// HELPERS
// ======================
function getStore(): AppData {
  return loadData();
}

// ======================
// CLIENTS
// ======================
export function addClient(client: Omit<Client, 'id' | 'created_at'>): Client {
  const data = getStore();

  const newClient: Client = {
    ...client,
    id: generateId(),
    created_at: new Date().toISOString(),
  };

  data.clients.push(newClient);
  saveData(data);

  return newClient;
}

export function updateClient(id: string, updates: Partial<Client>) {
  const data = getStore();

  data.clients = data.clients.map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );

  saveData(data);
}

export function deleteClient(id: string) {
  const data = getStore();
  data.clients = data.clients.filter((c) => c.id !== id);
  saveData(data);
}

// ======================
// SERVICES
// ======================
export function addService(service: Omit<Service, 'id'>): Service {
  const data = getStore();

  const newService: Service = {
    ...service,
    id: generateId(),
  };

  data.services.push(newService);
  saveData(data);

  return newService;
}

export function updateService(id: string, updates: Partial<Service>) {
  const data = getStore();

  data.services = data.services.map((s) =>
    s.id === id ? { ...s, ...updates } : s
  );

  saveData(data);
}

export function deleteService(id: string) {
  const data = getStore();
  data.services = data.services.filter((s) => s.id !== id);
  saveData(data);
}

// ======================
// COMMANDES
// ======================
export function addCommande(commande: Omit<Commande, 'id'>): Commande {
  const data = getStore();

  const newCommande: Commande = {
    ...commande,
    id: generateId(),
  };

  data.commandes.push(newCommande);
  saveData(data);

  return newCommande;
}

export function updateCommande(id: string, updates: Partial<Commande>) {
  const data = getStore();

  data.commandes = data.commandes.map((c) =>
    c.id === id ? { ...c, ...updates } : c
  );

  saveData(data);
}

export function deleteCommande(id: string) {
  const data = getStore();
  data.commandes = data.commandes.filter((c) => c.id !== id);
  saveData(data);
}

// ======================
// PAIEMENTS
// ======================
export function addPaiement(paiement: Omit<Paiement, 'id'>): Paiement {
  const data = getStore();

  const newPaiement: Paiement = {
    ...paiement,
    id: generateId(),
  };

  data.paiements.push(newPaiement);
  saveData(data);

  return newPaiement;
}

export function deletePaiement(id: string) {
  const data = getStore();
  data.paiements = data.paiements.filter((p) => p.id !== id);
  saveData(data);
}