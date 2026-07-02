// Cliente HTTP centralizado para hablar con el backend NestJS.
//
// - Lee la URL base desde import.meta.env.VITE_API_URL (definida en .env.local).
// - Adjunta automáticamente el JWT guardado en sessionStorage al header Authorization.
// - Normaliza los errores del backend ({ statusCode, message }) en un ApiError tipado.
// - Expone funciones tipadas agrupadas por recurso (auth, products, cart, orders, reports).
//
// Nota sobre tipos: los campos numéricos que en el backend son columnas `numeric` de
// PostgreSQL (price, total, revenue, avgOrderValue...) pueden llegar serializados como
// string en el JSON. Se tipan como number aquí (coinciden con las entidades del backend),
// pero cada consumidor debe hacer Number(...) donde vaya a operar aritméticamente.

const API_URL = import.meta.env.VITE_API_URL;

const TOKEN_KEY = 'fukusuke_token';

// ── Manejo del token JWT en sessionStorage ─────────────────
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// ── Error tipado del backend ───────────────────────────────
export class ApiError extends Error {
  readonly statusCode: number;
  /** El backend puede devolver `message` como string o como string[] (errores de validación). */
  readonly messages: string[];

  constructor(statusCode: number, message: string | string[]) {
    const messages = Array.isArray(message) ? message : [message];
    super(messages.join(' · '));
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.messages = messages;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content u otras respuestas sin cuerpo.
  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const statusCode: number = data?.statusCode ?? response.status;
    const message: string | string[] = data?.message ?? response.statusText;
    throw new ApiError(statusCode, message);
  }

  return data as T;
}

// ── Tipos de la API (forma real del backend) ───────────────
export type ApiRole = 'cliente' | 'admin' | 'cajero' | 'despachador' | 'dueno';
export type ApiGender = 'M' | 'F' | 'OTRO';
export type ApiOrderStatus =
  | 'pendiente'
  | 'pagado'
  | 'preparando'
  | 'en_camino'
  | 'entregado'
  | 'anulado';

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  featured: boolean;
  imageUrl: string | null;
  category: ApiCategory;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  available?: boolean;
  featured?: boolean;
  imageUrl?: string;
  categoryId: string;
}

export interface ApiUser {
  id: string;
  email: string;
  role: ApiRole;
  run: string;
  fullName: string;
  phone: string;
  address: string;
  commune: string;
  province: string;
  region: string;
  birthDate: string | null;
  gender: ApiGender | null;
  createdAt: string;
}

export interface AuthResponse {
  user: ApiUser;
  token: string;
}

export interface RegisterPayload {
  run: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  commune: string;
  province: string;
  region: string;
  birthDate?: string;
  gender?: ApiGender;
  role?: ApiRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiUserProfile {
  id: string;
  run: string;
  fullName: string;
  phone: string;
  address: string;
  commune: string;
  province: string;
  region: string;
  birthDate: string | null;
  gender: ApiGender | null;
  createdAt: string;
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  phone?: string;
  address?: string;
  commune?: string;
  province?: string;
  region?: string;
  birthDate?: string;
  gender?: ApiGender;
}

export interface ApiCredential {
  id: string;
  email: string;
  role: ApiRole;
  active: boolean;
  userId: string;
  createdAt: string;
}

export interface AdminUpdateCredentialPayload {
  email?: string;
  role?: ApiRole;
  active?: boolean;
  password?: string;
}

export interface ApiSavedAddress {
  id: string;
  userId: string;
  label: string;
  address: string;
  commune: string;
  createdAt: string;
}

export interface AddAddressPayload {
  label: string;
  address: string;
  commune: string;
}

export interface ApiCartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ApiCart {
  id: string;
  userId: string;
  items: ApiCartItem[];
  updatedAt: string;
}

export interface AddItemPayload {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface ApiOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ApiOrder {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: ApiOrderStatus;
  total: number;
  deliveryAddress: string;
  paymentMethod: string;
  cancelReason: string | null;
  items: ApiOrderItem[];
  createdAt: string;
}

export interface InlinePayment {
  methodType: 'tarjeta' | 'servipag' | 'transferencia';
  cardNumber?: string;
  expiryDate?: string;
  bankName?: string;
  accountNumber?: string;
}

export interface CreateOrderPayload {
  deliveryAddress: string;
  paymentMethod: string;
  items: AddItemPayload[];
  total: number;
  paymentData?: InlinePayment;
}

export interface UpdateStatusPayload {
  status: ApiOrderStatus;
  cancelReason?: string;
}

export interface ApiDailySales {
  id: string;
  date: string;
  revenue: number;
  orderCount: number;
  avgOrderValue: number;
}

export interface ApiWeeklyReport {
  id: string;
  weekId: string;
  totalRevenue: number;
  totalOrders: number;
  dailySales: ApiDailySales[];
  generatedAt: string;
  updatedAt: string;
}

// ── Funciones tipadas por recurso ──────────────────────────
export const api = {
  auth: {
    register: (payload: RegisterPayload) =>
      request<AuthResponse>('/auth/register', { method: 'POST', body: payload }),
    login: (payload: LoginPayload) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: payload }),
    getProfile: () => request<ApiUser>('/auth/profile'),
    // Admin/dueno: gestión de credenciales de otros usuarios (panel de administración)
    listCredentials: () => request<ApiCredential[]>('/auth/users'),
    updateCredential: (userId: string, payload: AdminUpdateCredentialPayload) =>
      request<ApiCredential>(`/auth/users/${userId}`, { method: 'PUT', body: payload }),
  },

  users: {
    getAddresses: () => request<ApiSavedAddress[]>('/users/addresses'),
    addAddress: (payload: AddAddressPayload) =>
      request<ApiSavedAddress>('/users/addresses', { method: 'POST', body: payload }),
    removeAddress: (id: string) =>
      request<void>(`/users/addresses/${id}`, { method: 'DELETE' }),
    // Admin/dueno: listado y edición de perfiles de otros usuarios
    list: () => request<ApiUserProfile[]>('/users'),
    adminUpdate: (id: string, payload: UpdateUserProfilePayload) =>
      request<ApiUserProfile>(`/users/${id}`, { method: 'PUT', body: payload }),
  },

  products: {
    list: (categorySlug?: string) =>
      request<ApiProduct[]>(
        categorySlug ? `/products?category=${encodeURIComponent(categorySlug)}` : '/products',
      ),
    getById: (id: string) => request<ApiProduct>(`/products/${id}`),
    create: (payload: CreateProductPayload) =>
      request<ApiProduct>('/products', { method: 'POST', body: payload }),
    update: (id: string, payload: Partial<CreateProductPayload>) =>
      request<ApiProduct>(`/products/${id}`, { method: 'PUT', body: payload }),
    setAvailability: (id: string, available: boolean) =>
      request<ApiProduct>(`/products/${id}/availability`, { method: 'PATCH', body: { available } }),
  },

  cart: {
    // El backend responde { cart, total } (CartWithTotal) — se desenvuelve
    // aquí para que el resto de la app trabaje con el ApiCart plano.
    get: () => request<{ cart: ApiCart; total: number }>('/cart').then((r) => r.cart),
    addItem: (item: AddItemPayload) =>
      request<{ cart: ApiCart; total: number }>('/cart/items', { method: 'POST', body: item }).then((r) => r.cart),
    updateItem: (productId: string, quantity: number) =>
      request<{ cart: ApiCart; total: number }>(`/cart/items/${productId}`, { method: 'PUT', body: { quantity } }).then((r) => r.cart),
    removeItem: (productId: string) =>
      request<{ cart: ApiCart; total: number }>(`/cart/items/${productId}`, { method: 'DELETE' }).then((r) => r.cart),
    clear: () => request<{ cart: ApiCart; total: number }>('/cart', { method: 'DELETE' }).then((r) => r.cart),
  },

  orders: {
    create: (payload: CreateOrderPayload) =>
      request<ApiOrder>('/orders', { method: 'POST', body: payload }),
    getMy: () => request<ApiOrder[]>('/orders/my'),
    getById: (id: string) => request<ApiOrder>(`/orders/${id}`),
    getAll: () => request<ApiOrder[]>('/orders'),
    updateStatus: (id: string, payload: UpdateStatusPayload) =>
      request<ApiOrder>(`/orders/${id}/status`, { method: 'PATCH', body: payload }),
  },

  reports: {
    getCurrent: () => request<ApiWeeklyReport>('/reports/current'),
    getRecent: (n = 4) => request<ApiWeeklyReport[]>(`/reports/recent?n=${n}`),
    getByWeekId: (weekId: string) =>
      request<ApiWeeklyReport>(`/reports/${encodeURIComponent(weekId)}`),
  },
};
