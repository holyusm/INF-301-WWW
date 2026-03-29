import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Order, OrderStatus } from '../types';

const STORAGE_KEY = 'fukusuke_orders';

// Pedidos demo iniciales (pedidos históricos)
const INITIAL_ORDERS: Order[] = [
  {
    id: 1,
    userId: 1,
    items: [],
    total: 14970,
    status: 'entregado',
    createdAt: '2026-03-10T18:32:00',
    address: 'Av. Pajaritos 1234, Maipú',
    paymentMethod: 'tarjeta',
  },
  {
    id: 2,
    userId: 1,
    items: [],
    total: 9490,
    status: 'preparando',
    createdAt: '2026-03-12T20:05:00',
    address: 'Av. Pajaritos 1234, Maipú',
    paymentMethod: 'servipag',
  },
];

interface CreateOrderInput {
  userId: number;
  items: CartItem[];
  total: number;
  address: string;
  paymentMethod: string;
}

interface OrderContextValue {
  orders: Order[];
  createOrder: (input: CreateOrderInput) => Order;
  cancelOrder: (orderId: number, cancelReason: string) => void;
  /** Actualiza el estado de un pedido (usado por cajero y despachador) */
  updateOrderStatus: (orderId: number, status: OrderStatus) => void;
}

const OrderContext = createContext<OrderContextValue | null>(null);

function cloneItems(items: CartItem[]): CartItem[] {
  return items.map((item) => ({ ...item }));
}

function canBeCancelled(status: Order['status']): boolean {
  return (
    status === 'pendiente' ||
    status === 'pagado'    ||
    status === 'preparando'||
    status === 'entregado'
  );
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_ORDERS;
    try {
      return JSON.parse(saved) as Order[];
    } catch {
      return INITIAL_ORDERS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const value = useMemo<OrderContextValue>(
    () => ({
      orders,

      createOrder: ({ userId, items, total, address, paymentMethod }) => {
        const newOrder: Order = {
          id: Date.now(),
          userId,
          items: cloneItems(items),
          total,
          address,
          paymentMethod,
          createdAt: new Date().toISOString(),
          // El pago online se confirma automáticamente vía pasarela simulada.
          // El cajero virtual verá este pedido y generará la boleta.
          status: 'pagado',
        };
        setOrders((current) => [newOrder, ...current]);
        return newOrder;
      },

      cancelOrder: (orderId, cancelReason) => {
        const reason = cancelReason.trim();
        if (!reason) return;
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId && canBeCancelled(order.status)
              ? { ...order, status: 'anulado', cancelReason: reason }
              : order
          )
        );
      },

      updateOrderStatus: (orderId, status) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === orderId ? { ...order, status } : order
          )
        );
      },
    }),
    [orders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used inside <OrderProvider>');
  return context;
}
