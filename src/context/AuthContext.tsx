import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { User, SavedAddress } from '../types';
import {
  api,
  getToken,
  setToken,
  clearToken,
  ApiError,
  type ApiUser,
  type ApiSavedAddress,
} from '../api/client';

// ── Mapeo backend → tipos del frontend ─────────────────────
function mapUser(apiUser: ApiUser, addresses: SavedAddress[] = []): User {
  return {
    id: apiUser.id,
    run: apiUser.run,
    fullName: apiUser.fullName,
    email: apiUser.email,
    phone: apiUser.phone,
    address: apiUser.address,
    commune: apiUser.commune,
    province: apiUser.province,
    region: apiUser.region,
    birthDate: apiUser.birthDate ?? '',
    gender: apiUser.gender ?? 'OTRO',
    role: apiUser.role,
    savedAddresses: addresses,
  };
}

function mapAddress(a: ApiSavedAddress): SavedAddress {
  return { id: a.id, label: a.label, address: a.address, commune: a.commune };
}

// ── Interfaz pública del contexto ──────────────────────────
export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (
    data: Omit<User, 'id' | 'role'> & { password: string }
  ) => Promise<boolean>;
  /** Guardar una nueva dirección en el perfil del usuario actual. */
  saveAddress: (addr: SavedAddress) => void;
  /** Eliminar una dirección guardada por índice. */
  removeAddress: (index: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restaurar sesión al recargar: si hay JWT, pedir perfil + direcciones reales.
  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const [apiUser, addresses] = await Promise.all([
          api.auth.getProfile(),
          api.users.getAddresses(),
        ]);
        setUser(mapUser(apiUser, addresses.map(mapAddress)));
      } catch {
        clearToken();
        setUser(null);
      }
    })();
  }, []);

  const refreshAddresses = async () => {
    try {
      const addresses = await api.users.getAddresses();
      setUser((u) => (u ? { ...u, savedAddresses: addresses.map(mapAddress) } : u));
    } catch {
      // Si falla la recarga de direcciones, dejamos las actuales.
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: apiUser, token } = await api.auth.login({ email, password });
      setToken(token);
      const addresses = await api.users.getAddresses().catch(() => []);
      setUser(mapUser(apiUser, addresses.map(mapAddress)));
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const register = async (
    data: Omit<User, 'id' | 'role'> & { password: string }
  ): Promise<boolean> => {
    try {
      const { user: apiUser, token } = await api.auth.register({
        run: data.run,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        address: data.address,
        commune: data.commune,
        province: data.province,
        region: data.region,
        birthDate: data.birthDate || undefined,
        gender: data.gender,
      });
      setToken(token);
      setUser(mapUser(apiUser));
      return true;
    } catch (err) {
      if (err instanceof ApiError) return false;
      throw err;
    }
  };

  // ── Direcciones: respaldadas por /api/users/addresses ──
  const saveAddress = (addr: SavedAddress) => {
    if (!user) return;
    void api.users
      .addAddress({ label: addr.label, address: addr.address, commune: addr.commune })
      .then(refreshAddresses)
      .catch(() => {});
  };

  const removeAddress = (index: number) => {
    if (!user) return;
    const target = user.savedAddresses?.[index];
    if (!target?.id) return;
    void api.users.removeAddress(target.id).then(refreshAddresses).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        register,
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
