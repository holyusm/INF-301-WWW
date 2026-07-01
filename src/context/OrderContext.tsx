import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Order, OrderStatus } from '../types';
import { api } from '../api/client';
import type { InlinePayment } from '../api/client';
import { mapOrder } from '../api/mappers';
import { useAuth } from './AuthContext';

const STAFF_ROLES = ['admin', 'dueno', 'cajero', 'despachador'];

interface CreateOrderInput {
  items: CartItem[];
  total: number;
  address: string;
  paymentMethod: string;
  paymentData?: InlinePayment;
}

interface OrderContextValue {
  orders: Order[];
  refreshOrders: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  cancelOrder: (orderId: string, cancelReason: string) => Promise<void>;
  /** Actualiza el estado de un pedido (usado por cajero y despachador) */
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    const apiOrders = STAFF_ROLES.includes(user.role)
      ? await api.orders.getAll()
      : await api.orders.getMy();
    setOrders(apiOrders.map(mapOrder));
  }, [user]);

  useEffect(() => {
    void refreshOrders();
  }, [refreshOrders]);

  const value = useMemo<OrderContextValue>(
    () => ({
      orders,
      refreshOrders,

      createOrder: async ({ items, total, address, paymentMethod, paymentData }) => {
        const apiOrder = await api.orders.create({
          deliveryAddress: address,
          paymentMethod,
          total,
          items: items.map(({ productId, productName, unitPrice, quantity }) => ({
            productId, productName, unitPrice, quantity,
          })),
          paymentData,
        });
        const order = mapOrder(apiOrder);
        setOrders((current) => [order, ...current]);
        return order;
      },

      cancelOrder: async (orderId, cancelReason) => {
        const reason = cancelReason.trim();
        if (!reason) return;
        const apiOrder = await api.orders.updateStatus(orderId, { status: 'anulado', cancelReason: reason });
        const updated = mapOrder(apiOrder);
        setOrders((current) => current.map((o) => (o.id === orderId ? updated : o)));
      },

      updateOrderStatus: async (orderId, status) => {
        const apiOrder = await api.orders.updateStatus(orderId, { status });
        const updated = mapOrder(apiOrder);
        setOrders((current) => current.map((o) => (o.id === orderId ? updated : o)));
      },
    }),
    [orders, refreshOrders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders(): OrderContextValue {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used inside <OrderProvider>');
  return context;
}
