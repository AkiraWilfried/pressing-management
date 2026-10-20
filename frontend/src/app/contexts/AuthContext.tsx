import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../lib/api';
import { USE_API } from '../lib/config';

// ======================
// TYPES
// ======================
interface User {
  id: string;
  email: string;
  nom: string;
  role: 'admin' | 'user';
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

// ======================
// CONTEXT
// ======================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ======================
// FALLBACK — utilisateurs hardcodés (mode offline)
// ======================
const defaultUsers = [
  {
    id: '1',
    email: 'admin@pressing.cm',
    password: 'admin123',
    nom: 'Administrateur',
    role: 'admin' as const,
  },
  {
    id: '2',
    email: 'user@pressing.cm',
    password: 'user123',
    nom: 'Utilisateur',
    role: 'user' as const,
  },
];

// ======================
// PROVIDER
// ======================
export function AuthProvider({ children }: { children: ReactNode }) {
  // Restaurer la session de façon synchrone (init paresseuse) : un rechargement
  // brutal ne doit pas traverser user=null, sinon ProtectedRoute renvoie /login.
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('pressing_user');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('pressing_user');
      return null;
    }
  });

  // ======================
  // LOGIN
  // ======================
  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (USE_API) {
      // --- Mode API réelle ---
      try {
        // 1. Obtenir le token JWT
        const { access_token } = await authApi.login(email, password);
        localStorage.setItem('pressing_token', access_token);

        // 2. Récupérer les infos de l'utilisateur connecté
        const me = await authApi.me();
        const loggedUser: User = {
          id: me.id,
          email: me.email,
          nom: me.nom,
          role: me.role,
        };

        setUser(loggedUser);
        localStorage.setItem('pressing_user', JSON.stringify(loggedUser));
        return { ok: true };
      } catch (error) {
        return { ok: false, error: (error as Error).message };
      }
    } else {
      // --- Mode offline (fallback hardcodé) ---
      const foundUser = defaultUsers.find(
        (u) => u.email === email && u.password === password
      );

      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        localStorage.setItem('pressing_user', JSON.stringify(userWithoutPassword));
        return { ok: true };
      }

      return { ok: false, error: 'Email ou mot de passe incorrect.' };
    }
  };

  // ======================
  // LOGOUT
  // ======================
  const logout = () => {
    setUser(null);
    localStorage.removeItem('pressing_token');
    localStorage.removeItem('pressing_user');

    if (USE_API) {
      // Notifier le serveur (best-effort, on n'attend pas la réponse)
      authApi.logout().catch(() => {
        // Ignorer les erreurs réseau lors du logout
      });
    }
  };

  // Token invalide/expiré détecté par la couche API → retour à la connexion
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('pressing_token');
      localStorage.removeItem('pressing_user');
    };
    window.addEventListener('pressing:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pressing:unauthorized', onUnauthorized);
  }, []);

  // Mode API : revalider la session restaurée en fond (sans bloquer le rendu)
  useEffect(() => {
    if (!USE_API || !localStorage.getItem('pressing_token')) return;
    authApi
      .me()
      .then((me) => {
        const fresh: User = { id: me.id, email: me.email, nom: me.nom, role: me.role };
        setUser(fresh);
        localStorage.setItem('pressing_user', JSON.stringify(fresh));
      })
      .catch(() => {
        // Le 401 déclenche déjà pressing:unauthorized ; les erreurs réseau sont ignorées
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ======================
// HOOK
// ======================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
