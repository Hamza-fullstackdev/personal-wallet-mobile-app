import { useMutation, useQueryClient } from '@tanstack/react-query';

import { login } from '../lib/api/auth';
import { useAuthStore } from '../store/authStore';
import type { Credentials } from '../types';

/** POST /api/auth/login, then persists the session in the auth store. */
export function useLogin() {
  const signIn = useAuthStore((state) => state.signIn);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess: async ({ user, token }) => {
      queryClient.clear();
      await signIn(user, token);
    },
  });
}
