import {
  createContext,
  useContext,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '../types';

// ── Estado ──────────────────────────────────────────────────
interface CartState {
  items: CartItem[];
}

// ── Acciones ────────────────────────────────────────────────
type CartAction =
  | { type: 'ADD';    product: Product }
  | { type: 'REMOVE'; productId: number }
  | { type: 'UPDATE'; productId: number; quantity: number }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product.id !== action.productId) };
    case 'UPDATE':
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId
            ? { ...i, quantity: Math.max(1, action.quantity) }
            : i
        ),
      };
    case 'CLEAR':
      return { items: [] };
    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  /** Estado visual del drawer lateral */
  isCartOpen: boolean;
  openCart:   () => void;
  closeCart:  () => void;
  addItem:          (product: Product) => void;
  removeItem:       (productId: number) => void;
  updateQuantity:   (productId: number, quantity: number) => void;
  clearCart:        () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state,      dispatch]     = useReducer(cartReducer, { items: [] });
  const [isCartOpen, setCartOpen]  = useState(false);

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice,
        isCartOpen,
        openCart:  ()  => setCartOpen(true),
        closeCart: ()  => setCartOpen(false),
        // Al agregar un producto se abre automáticamente el drawer
        addItem: (p) => {
          dispatch({ type: 'ADD', product: p });
          setCartOpen(true);
        },
        removeItem: (id)       => dispatch({ type: 'REMOVE', productId: id }),
        updateQuantity: (id, qty) =>
          dispatch({ type: 'UPDATE', productId: id, quantity: qty }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
