// ── Producto del menú ──────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'rolls' | 'nigiris' | 'temakis' | 'combos' | 'bebidas';
  image: string;
  available: boolean;
  featured?: boolean;
}

// ── Ítem dentro del carrito ────────────────────────────────
export interface CartItem {
  product: Product;
  quantity: number;
}

// ── Dirección guardada ─────────────────────────────────────
export interface SavedAddress {
  id?: string;        // id del backend (undefined en direcciones aún no persistidas)
  label: string;      // e.g. "Casa", "Trabajo"
  address: string;
  commune: string;
}

// ── Usuario / Cliente ──────────────────────────────────────
export interface User {
  id: string;
  run: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  commune: string;
  province: string;
  region: string;
  birthDate: string;
  gender: 'M' | 'F' | 'OTRO';
  role: 'cliente' | 'admin' | 'cajero' | 'despachador' | 'dueno';
  savedAddresses?: SavedAddress[];
}

// ── Pedido ─────────────────────────────────────────────────
export type OrderStatus =
  | 'pendiente'
  | 'pagado'
  | 'preparando'
  | 'en_camino'
  | 'entregado'
  | 'anulado';

export interface Order {
  id: number;
  userId: number;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  address: string;
  paymentMethod?: string;
  cancelReason?: string;
}

// ── Formulario de registro ─────────────────────────────────
export interface RegisterForm {
  run: string;
  fullName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  phone: string;
  address: string;
  commune: string;
  province: string;
  region: string;
  birthDate: string;
  gender: 'M' | 'F' | 'OTRO';
}

// ── Formulario de login ────────────────────────────────────
export interface LoginForm {
  email: string;
  password: string;
}
