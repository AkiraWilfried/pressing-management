import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppData } from '../lib/types';
import { USE_API } from '../lib/config';
import {
  createClient,
  createCommande,
  createPaiement,
  createService,
  deleteClient,
  deleteCommande,
  deletePaiement,
  deleteService,
  loadAll,
  updateClient,
  updateCommande,
  updateService,
} from '../lib/data';

const EMPTY_DATA: AppData = { clients: [], services: [], commandes: [], paiements: [] };

interface DataContextType {
  data: AppData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createClient: typeof createClient;
  updateClient: typeof updateClient;
  deleteClient: typeof deleteClient;
  createService: typeof createService;
  updateService: typeof updateService;
  deleteService: typeof deleteService;
  createCommande: typeof createCommande;
  updateCommande: typeof updateCommande;
  deleteCommande: typeof deleteCommande;
  createPaiement: typeof createPaiement;
  deletePaiement: typeof deletePaiement;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await loadAll());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Synchronisation inter-onglets : uniquement en mode offline (localStorage).
  useEffect(() => {
    if (USE_API) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === 'pressing_app_data') {
        loadAll().then(setData).catch(() => undefined);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const withRefresh = useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> =>
      fn().then((result) => refresh().then(() => result)),
    [refresh]
  );

  const value = useMemo<DataContextType>(
    () => ({
      data,
      loading,
      error,
      refresh,
      createClient: (input) => withRefresh(() => createClient(input)),
      updateClient: (id, updates) => withRefresh(() => updateClient(id, updates)),
      deleteClient: (id) => withRefresh(() => deleteClient(id)),
      createService: (input) => withRefresh(() => createService(input)),
      updateService: (id, updates) => withRefresh(() => updateService(id, updates)),
      deleteService: (id) => withRefresh(() => deleteService(id)),
      createCommande: (input) => withRefresh(() => createCommande(input)),
      updateCommande: (id, updates) => withRefresh(() => updateCommande(id, updates)),
      deleteCommande: (id) => withRefresh(() => deleteCommande(id)),
      createPaiement: (input) => withRefresh(() => createPaiement(input)),
      deletePaiement: (id) => withRefresh(() => deletePaiement(id)),
    }),
    [data, loading, error, refresh, withRefresh]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
