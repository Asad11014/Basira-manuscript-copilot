import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from '@basira/shared';
import { apiFetch } from './client.js';

export const authApi = {
  register: (body: RegisterRequest) =>
    apiFetch<AuthResponse>('/auth/register', { method: 'POST', body }),

  login: (body: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', { method: 'POST', body }),

  logout: () => apiFetch<void>('/auth/logout', { method: 'POST' }),

  me: () => apiFetch<MeResponse>('/auth/me'),
};
