/**
 * Cliente HTTP del CRM. Centraliza las llamadas a la API NestJS.
 * El token JWT se guarda en memoria + localStorage.
 */

export const API_URL =
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

/** Sube una imagen (banners de la tienda) — va a la propia app Next (Vercel Blob), no al backend NestJS. */
export async function uploadImage(file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `Error ${res.status}`);
  }
  const { url } = await res.json();
  return url;
}

/** Comprobante del sorteo: el comprador no tiene login, lo que habilita la subida es
 * el id de su compra recién creada. */
export async function uploadSorteoReceipt(file: File, sorteoOrderId: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('sorteoOrderId', sorteoOrderId);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.message || `Error ${res.status}`);
  }
  const { url } = await res.json();
  return url;
}

/** Sube un archivo grande (video del premio) directo del navegador a Vercel Blob,
 * sin pasar por la función serverless — ver src/app/api/blob-upload/route.ts. */
export async function uploadLargeFile(file: File, onProgress?: (pct: number) => void): Promise<string> {
  const { upload } = await import('@vercel/blob/client');
  const token = getToken();
  const blob = await upload(`sorteo/${file.name}`, file, {
    access: 'public',
    handleUploadUrl: '/api/blob-upload',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    onUploadProgress: onProgress ? (p) => onProgress(Math.round(p.percentage)) : undefined,
  });
  return blob.url;
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
  loginWithGoogle: (idToken: string) =>
    request<{ accessToken: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
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
  deleteSeller: (id: string) => request<any>(`/auth/users/${id}`, { method: 'DELETE' }),
  resetSellerPassword: (id: string, password: string) =>
    request<any>(`/auth/users/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) }),

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

  // MAON AI Sales · control IA/humano de la conversación
  takeOverConversation: (id: string) => request<any>(`/conversations/${id}/take-over`, { method: 'POST' }),
  returnToAI: (id: string) => request<any>(`/conversations/${id}/return-to-ai`, { method: 'POST' }),
  pauseAI: (id: string) => request<any>(`/conversations/${id}/pause-ai`, { method: 'POST' }),

  // MAON AI Sales · carrito de la conversación
  getCart: (conversationId: string) => request<any>(`/conversations/${conversationId}/cart`),
  confirmCart: (conversationId: string) => request<any>(`/conversations/${conversationId}/cart/confirm`, { method: 'POST' }),
  confirmPayment: (saleId: string) => request<any>(`/sales/${saleId}/payment/confirm`, { method: 'PATCH' }),

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
  bulkMargin: (marginPct: number, brand?: string, category?: string) =>
    request<{ updated: number }>('/products/margin/bulk', { method: 'PATCH', body: JSON.stringify({ marginPct, brand, category }) }),
  // Sincroniza el catálogo real (crea productos nuevos, actualiza precio/nombre/categoría
  // de los que ya existen) desde la lista de precios del proveedor. Va directo al backend
  // NestJS (no por /api/upload, que es solo para imágenes).
  importPrices: async (file: File, dryRun: boolean) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${API_URL}/products/import-prices?dryRun=${dryRun}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(detail.message || `Error ${res.status}`);
    }
    return res.json() as Promise<{
      dryRun: boolean; created: number; updated: number; changed: number; requested: number;
      sample: { sku: string; name: string; oldPrice: number; newPrice: number; pctChange: number }[];
      skippedNoSku: number; skippedBadPrice: number;
    }>;
  },

  // Ventas (pedido de la tienda pública -> Sale real en el backend, identifica por SKU)
  sales: () => request<any[]>('/sales'),
  salesStorefront: (dto: {
    customerName: string; customerPhone: string; sellerName?: string;
    items: { sku: string; quantity: number; unitPrice?: number; note?: string }[];
    wantsShipping?: boolean; shippingAddress?: string; availableSchedule?: string; envioGratis?: boolean;
    // Dark Store
    barrio?: string; vapeItems?: { vapeId: string; quantity: number }[];
    enforceStock?: boolean; issueTicket?: boolean;
  }) => request<{ ok: boolean; saleId?: string; comprobanteNumero?: string; reason?: string }>('/sales/storefront', { method: 'POST', body: JSON.stringify(dto) }),
  markSaleInvoiced: (id: string, comprobanteNumero: string) =>
    request<any>(`/sales/${id}/invoice`, { method: 'PATCH', body: JSON.stringify({ comprobanteNumero }) }),
  markSaleShipped: (id: string) =>
    request<{ ok: boolean; clientPhone?: string }>(`/sales/${id}/ship`, { method: 'PATCH' }),
  markSaleDelivered: (id: string) =>
    request<{ ok: boolean }>(`/sales/${id}/deliver`, { method: 'PATCH' }),
  setSaleStatus: (id: string, status: 'PENDIENTE' | 'ENVIADA' | 'ENTREGADA') =>
    request<{ ok: boolean; clientPhone?: string }>(`/sales/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  saleStatus: (id: string) => request<{ status: string }>(`/sales/${id}/status`),

  // Config de la tienda pública (banner, promos, productos ocultos, etc.) — GET es público.
  tiendaSettings: () => request<any>('/tienda-settings'),
  updateTiendaSettings: (dto: any) => request<any>('/tienda-settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Config de la landing de la estufa (segunda tienda de prueba) — GET es público.
  estufaSettings: () => request<any>('/estufa-settings'),
  updateEstufaSettings: (dto: any) => request<any>('/estufa-settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Config de /cotillon (FastCotillón, ex FastCombos, unificada acá) — GET es público.
  cotillonSettings: () => request<any>('/cotillon-settings'),
  updateCotillonSettings: (dto: any) => request<any>('/cotillon-settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Config de /dark-store (cuarta tienda, dark mode + delivery express) — GET es público.
  darkStoreSettings: () => request<any>('/dark-store-settings'),
  updateDarkStoreSettings: (dto: any) => request<any>('/dark-store-settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  // Vapeadores de Dark Store: catálogo manual (no viene del maestro del proveedor).
  darkStoreVapesPublic: () => request<any[]>('/dark-store-vapes/public'),
  darkStoreVapes: () => request<any[]>('/dark-store-vapes'),
  createDarkStoreVape: (dto: any) => request<any>('/dark-store-vapes', { method: 'POST', body: JSON.stringify(dto) }),
  updateDarkStoreVape: (id: string, dto: any) => request<any>(`/dark-store-vapes/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteDarkStoreVape: (id: string) => request<any>(`/dark-store-vapes/${id}`, { method: 'DELETE' }),

  // Módulo Supremas de Pollo — producción, costeo, stock y ventas propias, cliente
  // compartido con el resto del CRM (via /clients).
  supremasSettings: () => request<any>('/supremas-settings'),
  supremasSettingsPublic: () => request<{ priceConsumidorFinal: number; priceKiosco: number; priceMayorista: number; kioscoMinKg: number; mayoristaMinKg: number }>('/supremas-settings/public'),
  updateSupremasSettings: (dto: any) => request<any>('/supremas-settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  supremasIngredients: () => request<any[]>('/supremas-ingredients'),
  supremasCosteo: () => request<any>('/supremas-ingredients/costeo'),
  createSupremasIngredient: (dto: any) => request<any>('/supremas-ingredients', { method: 'POST', body: JSON.stringify(dto) }),
  updateSupremasIngredient: (id: string, dto: any) => request<any>(`/supremas-ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteSupremasIngredient: (id: string) => request<any>(`/supremas-ingredients/${id}`, { method: 'DELETE' }),

  supremasBatches: () => request<any[]>('/supremas-batches'),
  supremasStock: () => request<{ producidoKg: number; vendidoKg: number; stockKg: number }>('/supremas-batches/stock'),
  createSupremasBatch: (dto: any) => request<any>('/supremas-batches', { method: 'POST', body: JSON.stringify(dto) }),
  deleteSupremasBatch: (id: string) => request<any>(`/supremas-batches/${id}`, { method: 'DELETE' }),

  supremasSales: () => request<any[]>('/supremas-sales'),
  supremasSalesByClient: (clientId: string) => request<any[]>(`/supremas-sales/cliente/${clientId}`),
  createSupremasSale: (dto: any) => request<any>('/supremas-sales', { method: 'POST', body: JSON.stringify(dto) }),
  deleteSupremasSale: (id: string) => request<any>(`/supremas-sales/${id}`, { method: 'DELETE' }),
  // Tienda online de Supremas (sin login) — precio y tramo de cliente los calcula el backend.
  supremasSaleStorefront: (dto: {
    customerName: string; customerPhone: string; kg: number; paymentMethod: string;
    wantsShipping?: boolean; address?: string; availableSchedule?: string; observaciones?: string;
  }) => request<{ ok: boolean; saleId: string }>('/supremas-sales/storefront', { method: 'POST', body: JSON.stringify(dto) }),

  // Módulo UGARTE INSUMOS CARNICERIA — tienda de insumos para carnicerías.
  insumosSettingsPublic: () => request<any>('/insumos-settings/public'),
  insumosSettings: () => request<any>('/insumos-settings'),
  updateInsumosSettings: (dto: any) => request<any>('/insumos-settings', { method: 'PATCH', body: JSON.stringify(dto) }),

  insumosProductsPublic: () => request<any[]>('/insumos-products/public'),
  insumosProducts: () => request<any[]>('/insumos-products'),
  createInsumosProduct: (dto: any) => request<any>('/insumos-products', { method: 'POST', body: JSON.stringify(dto) }),
  updateInsumosProduct: (id: string, dto: any) => request<any>(`/insumos-products/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  deleteInsumosProduct: (id: string) => request<any>(`/insumos-products/${id}`, { method: 'DELETE' }),

  insumosOrders: (status?: string) => request<any[]>(`/insumos-orders${status ? `?status=${status}` : ''}`),
  insumosOrder: (id: string) => request<any>(`/insumos-orders/${id}`),
  insumosOrderPublic: (id: string) => request<any>(`/insumos-orders/${id}/public`),
  createInsumosOrder: (dto: any) => request<{ id: string; orderNumber: string }>('/insumos-orders', { method: 'POST', body: JSON.stringify(dto) }),
  approveInsumosOrder: (id: string) => request<any>(`/insumos-orders/${id}/approve`, { method: 'PATCH' }),
  setInsumosOrderStatus: (id: string, dto: { status: string; trackingNumber?: string; carrier?: string }) =>
    request<any>(`/insumos-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify(dto) }),

  // Modulo SORTEO — rifa por numeros con transferencia y aprobacion manual.
  sorteoPublic: () => request<any>('/sorteo/public'),
  sorteoLookup: (q: string) => request<any[]>(`/sorteo/lookup?q=${encodeURIComponent(q)}`),
  sorteoOrderPublic: (id: string) => request<any>(`/sorteo/orders/${id}/public`),
  createSorteoOrder: (dto: any) => request<any>('/sorteo/orders', { method: 'POST', body: JSON.stringify(dto) }),
  attachSorteoReceipt: (id: string, dto: { receiptUrl?: string; holderName?: string }) =>
    request<any>(`/sorteo/orders/${id}/receipt`, { method: 'POST', body: JSON.stringify(dto) }),

  sorteoSettings: () => request<any>('/sorteo/settings'),
  updateSorteoSettings: (dto: any) => request<any>('/sorteo/settings', { method: 'PATCH', body: JSON.stringify(dto) }),
  sorteoNextEdition: () => request<any>('/sorteo/settings/next-edition', { method: 'POST' }),
  sorteoPackages: () => request<any[]>('/sorteo/packages'),
  replaceSorteoPackages: (packages: { chances: number; price: number; isPopular?: boolean }[]) =>
    request<any[]>('/sorteo/packages', { method: 'PUT', body: JSON.stringify({ packages }) }),
  sorteoOrders: (status?: string, q?: string) => {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    if (q) qs.set('q', q);
    return request<any[]>(`/sorteo/orders${qs.toString() ? `?${qs}` : ''}`);
  },
  approveSorteoOrder: (id: string) => request<any>(`/sorteo/orders/${id}/approve`, { method: 'PATCH' }),
  rejectSorteoOrder: (id: string) => request<any>(`/sorteo/orders/${id}/reject`, { method: 'PATCH' }),
  sorteoNumberOwner: (n: number) => request<any>(`/sorteo/numbers/${n}`),
  createSorteoWinner: (dto: any) => request<any>('/sorteo/winners', { method: 'POST', body: JSON.stringify(dto) }),
  deleteSorteoWinner: (id: string) => request<any>(`/sorteo/winners/${id}`, { method: 'DELETE' }),

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
