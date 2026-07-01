import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Product } from '../types';
import { api } from '../api/client';
import { mapLineItem } from '../api/mappers';
import { useAuth } from './AuthContext';

// ── Context ─────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  /** Estado visual del drawer lateral */
  isCartOpen: boolean;
  openCart:   () => void;
  closeCart:  () => void;
  addItem:          (product: Product) => Promise<void>;
  removeItem:       (productId: string) => Promise<void>;
  updateQuantity:   (productId: string, quantity: number) => Promise<void>;
  clearCart:        () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems]         = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    const cart = await api.cart.get();
    setItems(cart.items.map(mapLineItem));
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isCartOpen,
        openCart:  () => setCartOpen(true),
        closeCart: () => setCartOpen(false),
        addItem: async (product) => {
          const cart = await api.cart.addItem({
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity: 1,
          });
          setItems(cart.items.map(mapLineItem));
          setCartOpen(true);
        },
        removeItem: async (productId) => {
          const cart = await api.cart.removeItem(productId);
          setItems(cart.items.map(mapLineItem));
        },
        updateQuantity: async (productId, quantity) => {
          const cart = await api.cart.updateItem(productId, Math.max(1, quantity));
          setItems(cart.items.map(mapLineItem));
        },
        clearCart: async () => {
          const cart = await api.cart.clear();
          setItems(cart.items.map(mapLineItem));
        },
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
