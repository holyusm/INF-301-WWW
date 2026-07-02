import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import type {
  ApiUserProfile,
  ApiCredential,
  RegisterPayload,
  UpdateUserProfilePayload,
  AdminUpdateCredentialPayload,
} from '../api/client';
import type { User } from '../types';

function joinUser(profile: ApiUserProfile, credential: ApiCredential | undefined): User {
  return {
    id: profile.id,
    run: profile.run,
    fullName: profile.fullName,
    email: credential?.email ?? '',
    phone: profile.phone,
    address: profile.address,
    commune: profile.commune,
    province: profile.province,
    region: profile.region,
    birthDate: profile.birthDate ?? '',
    gender: profile.gender ?? 'OTRO',
    role: credential?.role ?? 'cliente',
    active: credential?.active ?? true,
  };
}

/** Panel de administración: usuarios reales, unidos entre user-service (perfil) y auth-service (credencial). */
export function useUsers() {
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profiles, credentials] = await Promise.all([
        api.users.list(),
        api.auth.listCredentials(),
      ]);
      const credentialByUserId = new Map(credentials.map((c) => [c.userId, c]));
      setUsers(profiles.map((p) => joinUser(p, credentialByUserId.get(p.id))));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createUser = useCallback(async (payload: RegisterPayload) => {
    await api.auth.register(payload);
    await refetch();
  }, [refetch]);

  const updateUser = useCallback(async (
    id: string,
    profilePatch: UpdateUserProfilePayload,
    credentialPatch: AdminUpdateCredentialPayload,
  ) => {
    const requests: Promise<unknown>[] = [api.users.adminUpdate(id, profilePatch)];
    if (Object.keys(credentialPatch).length > 0) {
      requests.push(api.auth.updateCredential(id, credentialPatch));
    }
    await Promise.all(requests);
    await refetch();
  }, [refetch]);

  const setActive = useCallback(async (id: string, active: boolean) => {
    await api.auth.updateCredential(id, { active });
    await refetch();
  }, [refetch]);

  return { users, loading, error, refetch, createUser, updateUser, setActive };
}
