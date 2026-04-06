import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, SavedAddress } from '../types';

const USERS_KEY   = 'fukusuke_users';
const SESSION_KEY = 'fukusuke_session';

// ── Tipo interno que incluye contraseña ────────────────────
interface StoredUser extends User {
  password: string;
}

// ── Usuarios demo precargados (uno por cada rol) ───────────
// RUNs con dígito verificador correcto (validados con módulo 11)
const DEMO_USERS: StoredUser[] = [
  {
    id: 1,
    run: '12.345.678-5',
    fullName: 'María González',
    email: 'maria@example.com',
    password: '123456',
    phone: '+56912345678',
    address: 'Av. Pajaritos 1234',
    commune: 'Maipú',
    province: 'Santiago',
    region: 'Región Metropolitana',
    birthDate: '1990-05-15',
    gender: 'F',
    role: 'cliente',
  },
  {
    id: 2,
    run: '11.111.111-1',
    fullName: 'Admin Fukusuke',
    email: 'admin@fukusuke.cl',
    password: '123456',
    phone: '+56922222222',
    address: 'Av. 5 de Abril 123',
    commune: 'Maipú',
    province: 'Santiago',
    region: 'Región Metropolitana',
    birthDate: '1985-01-01',
    gender: 'M',
    role: 'admin',
  },
  {
    id: 3,
    run: '22.222.222-2',
    fullName: 'Carlos Cajero',
    email: 'cajero@fukusuke.cl',
    password: '123456',
    phone: '+56933333333',
    address: 'Av. Américo Vespucio 456',
    commune: 'Maipú',
    province: 'Santiago',
    region: 'Región Metropolitana',
    birthDate: '1992-03-10',
    gender: 'M',
    role: 'cajero',
  },
  {
    id: 4,
    run: '33.333.333-3',
    fullName: 'Diego Despacho',
    email: 'despacho@fukusuke.cl',
    password: '123456',
    phone: '+56944444444',
    address: 'Calle Los Aromos 789',
    commune: 'Maipú',
    province: 'Santiago',
    region: 'Región Metropolitana',
    birthDate: '1995-06-20',
    gender: 'M',
    role: 'despachador',
  },
  {
    id: 5,
    run: '44.444.444-4',
    fullName: 'Roberto Fukusuke',
    email: 'dueno@fukusuke.cl',
    password: '123456',
    phone: '+56955555555',
    address: 'Av. Pajaritos 5678',
    commune: 'Maipú',
    province: 'Santiago',
    region: 'Región Metropolitana',
    birthDate: '1975-08-15',
    gender: 'M',
    role: 'dueño',
  },
];

function loadStoredUsers(): StoredUser[] {
  try {
    const saved = localStorage.getItem(USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as StoredUser[];
      if (parsed.length > 0) {
        // Siempre garantizar que los usuarios demo estén presentes
        const savedIds = new Set(parsed.map((u) => u.id));
        const missing  = DEMO_USERS.filter((d) => !savedIds.has(d.id));
        return [...missing, ...parsed];
      }
    }
  } catch {
    // fallback
  }
  const initial = [...DEMO_USERS];
  localStorage.setItem(USERS_KEY, JSON.stringify(initial));
  return initial;
}

// ── Interfaz pública del contexto ──────────────────────────
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** Lista de todos los usuarios (sin contraseñas) — para panel admin */
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    data: Omit<User, 'id' | 'role'> & { password: string }
  ) => Promise<boolean>;
  /** Admin: crear usuario con rol específico */
  addUser: (data: Omit<User, 'id'> & { password: string }) => void;
  /** Admin: editar usuario; si newPassword no está vacío, actualiza la contraseña */
  updateUser: (updated: User, newPassword?: string) => void;
  /** Admin: eliminar usuario (no permite eliminar al usuario actual) */
  deleteUser: (id: number) => void;
  /** Guardar una nueva dirección en el perfil del usuario actual */
  saveAddress: (addr: SavedAddress) => void;
  /** Eliminar una dirección guardada por índice */
  removeAddress: (index: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUsers, setStoredUsers] = useState<StoredUser[]>(loadStoredUsers);
  const [user, setUser] = useState<User | null>(null);

  // Restaurar sesión al recargar
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved) as User);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const persist = (updated: StoredUser[]) => {
    setStoredUsers(updated);
    localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  };

  // Usuarios sin contraseña (expuesto al admin)
  const users: User[] = storedUsers.map(({ password: _p, ...u }) => u);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise((r) => setTimeout(r, 600));
    const found = storedUsers.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password
    );
    if (found) {
      const { password: _p, ...publicUser } = found;
      setUser(publicUser);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const register = async (
    data: Omit<User, 'id' | 'role'> & { password: string }
  ): Promise<boolean> => {
    // Verificar email duplicado
    const exists = storedUsers.some(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (exists) return false;

    await new Promise((r) => setTimeout(r, 800));
    const newUser: StoredUser = { ...data, id: Date.now(), role: 'cliente' };
    persist([...storedUsers, newUser]);
    const { password: _p, ...publicUser } = newUser;
    setUser(publicUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(publicUser));
    return true;
  };

  const addUser = (data: Omit<User, 'id'> & { password: string }) => {
    const newUser: StoredUser = { ...data, id: Date.now() };
    persist([...storedUsers, newUser]);
  };

  const updateUser = (updated: User, newPassword?: string) => {
    persist(
      storedUsers.map((u) =>
        u.id === updated.id
          ? { ...u, ...updated, password: newPassword?.trim() || u.password }
          : u
      )
    );
    // Actualizar sesión si es el usuario actual
    if (user?.id === updated.id) {
      setUser(updated);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
  };

  const deleteUser = (id: number) => {
    // No permitir eliminar al usuario actualmente logueado
    if (user?.id === id) return;
    persist(storedUsers.filter((u) => u.id !== id));
  };

  const saveAddress = (addr: SavedAddress) => {
    if (!user) return;
    const updated: User = {
      ...user,
      savedAddresses: [...(user.savedAddresses ?? []), addr],
    };
    updateUser(updated);
  };

  const removeAddress = (index: number) => {
    if (!user) return;
    const updated: User = {
      ...user,
      savedAddresses: (user.savedAddresses ?? []).filter((_, i) => i !== index),
    };
    updateUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        users,
        login,
        logout,
        register,
        addUser,
        updateUser,
        deleteUser,
        saveAddress,
        removeAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
