import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginRequest, RegisterRequest, User } from '@basira/shared';
import { authApi } from '../api/auth.js';
import { ApiRequestError } from '../api/client.js';

const ME_KEY = ['auth', 'me'] as const;

/** Current session. `user` is undefined when logged out (401 is not an error here). */
export function useAuth(): { user: User | undefined; isLoading: boolean } {
  const query = useQuery({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return (await authApi.me()).user;
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });
  return { user: query.data ?? undefined, isLoading: query.isLoading };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (data) => qc.setQueryData(ME_KEY, data.user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: (data) => qc.setQueryData(ME_KEY, data.user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}
