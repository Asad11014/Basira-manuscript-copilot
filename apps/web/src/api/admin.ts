import type {
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AuditLog,
  SeatUsage,
  User,
} from '@basira/shared';
import { apiFetch } from './client.js';

export const adminApi = {
  listUsers: () => apiFetch<User[]>('/admin/users'),
  createUser: (body: AdminCreateUserRequest) =>
    apiFetch<User>('/admin/users', { method: 'POST', body }),
  updateUser: (id: string, body: AdminUpdateUserRequest) =>
    apiFetch<User>(`/admin/users/${id}`, { method: 'PATCH', body }),
  seats: () => apiFetch<SeatUsage>('/admin/seats'),
  audit: () => apiFetch<AuditLog[]>('/admin/audit', { query: { limit: 50 } }),
};
