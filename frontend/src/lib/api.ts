/**
 * Cliente HTTP del CRM. Centraliza las llamadas a la API NestJS.
 * El token JWT se guarda en memoria + localStorage.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function setUser(user: AuthUser) {
  if (typeof window !== 'undefined') localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function logout() {
  clearToken();
  if (typeof window !== 'undefined') localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `Error ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (fullName: string, email: string, password: string, role?: string) =>
    request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, role }),
    }),
  me: () => request<any>('/auth/me'),
  createSeller: (fullName: string, email: string, password: string, role: 'VENDEDOR' | 'SUPERVISOR' = 'VENDEDOR') =>
    request<any>('/auth/users', { method: 'POST', body: JSON.stringify({ fullName, email, password, role }) }),
  sellers: () => request<any>('/auth/users'),
  toggleSeller: (id: string) => request<any>(`/auth/users/${id}/toggle`, { method: 'PATCH' }),

  // Dashboard
  overview: () => request<any>('/dashboard/overview'),
  followUps: () => request<any>('/dashboard/follow-ups'),

  // Clientes
  clients: (params = '') => request<any>(`/clients${params}`),
  client: (id: string) => request<any>(`/clients/${id}`),
  createClient: (dto: any) => request<any>('/clients', { method: 'POST', body: JSON.stringify(dto) }),
  updateClient: (id: string, dto: any) => request<any>(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteClient: (id: string) => request<any>(`/clients/${id}`, { method: 'DELETE' }),
  updateStage: (id: string, stage: string) =>
    request<any>(`/clients/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  addNote: (id: string, content: string) =>
    request<any>(`/clients/${id}/notes`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Conversaciones
  conversations: (params = '') => request<any>(`/conversations${params}`),
  messages: (id: string) => request<any>(`/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) =>
    request<any>(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // IA
  suggest: (clientId: string) =>
    request<any>(`/ai/clients/${clientId}/suggest`, { method: 'POST' }),
  analyze: (clientId: string) =>
    request<any>(`/ai/clients/${clientId}/analyze`, { method: 'POST' }),

  // IA · insights del negocio
  insights: () => request<any>('/ai/insights'),

  // Productos
  products: (params = '') => request<any>(`/products${params}`),
  createProduct: (dto: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(dto) }),
  updateProduct: (id: string, dto: any) => request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteProduct: (id: string) => request<any>(`/products/${id}`, { method: 'DELETE' }),

  // Comprobantes (facturas, remitos, notas de crédito)
  comprobantes: (params = '') => request<any>(`/comprobantes${params}`),
  createComprobante: (dto: any) => request<any>('/comprobantes', { method: 'POST', body: JSON.stringify(dto) }),

  // Campañas
  campaigns: () => request<any>('/campaigns'),
  previewSegment: (filters: any) =>
    request<any>('/campaigns/preview', { method: 'POST', body: JSON.stringify({ filters }) }),
  createCampaign: (dto: any) => request<any>('/campaigns', { method: 'POST', body: JSON.stringify(dto) }),
  sendCampaign: (id: string) =>
    request<any>(`/campaigns/${id}/send`, { method: 'POST' }),

  // Automatizaciones
  automations: () => request<any>('/automations'),
  createAutomation: (dto: any) => request<any>('/automations', { method: 'POST', body: JSON.stringify(dto) }),
  updateAutomation: (id: string, dto: any) => request<any>(`/automations/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  toggleAutomation: (id: string) => request<any>(`/automations/${id}/toggle`, { method: 'PATCH' }),
  deleteAutomation: (id: string) => request<any>(`/automations/${id}`, { method: 'DELETE' }),
};
