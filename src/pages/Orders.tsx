import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useToast } from '../context/ToastContext';
import type { OrderStatus } from '../types';
import './Orders.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: '⏳ Pendiente',
  pagado: '✅ Pagado',
  preparando: '👨‍🍳 Preparando',
  en_camino: '🏍️ En camino',
  entregado: '📦 Entregado',
  anulado: '❌ Anulado',
};

const STATUS_BADGES: Record<OrderStatus, string> = {
  pendiente: 'text-bg-warning',
  pagado: 'text-bg-success',
  preparando: 'text-bg-primary',
  en_camino: 'text-bg-secondary',
  entregado: 'text-bg-success',
  anulado: 'text-bg-danger',
};

export default function Orders() {
  const { user }      = useAuth();
  const { orders, cancelOrder } = useOrders();
  const { showToast } = useToast();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const canCancel = (s: OrderStatus) =>
    s === 'pendiente' || s === 'pagado' || s === 'preparando' || s === 'entregado';

  const handleCancel = async (orderId: string) => {
    if (!cancelReason.trim()) return;
    await cancelOrder(orderId, cancelReason.trim());
    setCancelId(null);
    setCancelReason('');
    showToast('Pedido anulado correctamente.', 'success');
  };

  return (
    <main className="orders-page container">
      <h1 className="page-title">Mis pedidos</h1>
      <p className="page-subtitle">Hola, {user?.fullName}. Aquí están tus órdenes.</p>

      {orders.length === 0 ? (
        <div className="orders-empty card border-0 shadow-sm">
          <span>📋</span>
          <p>Aún no tienes pedidos.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card card border-0 shadow-sm">
              <div className="order-card__header">
                <div>
                  <h3>Pedido #FKS-{order.id.slice(-6).toUpperCase()}</h3>
                  <p className="order-card__date">
                    {new Date(order.createdAt).toLocaleDateString('es-CL', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={`order-card__status badge rounded-pill ${STATUS_BADGES[order.status]}`}
                >
                  {STATUS_LABELS[order.status]}
                </span>
              </div>

              <div className="order-card__body">
                <p>📍 {order.address}</p>
                {order.items.length > 0 && (
                  <p>
                    🍱 {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(', ')}
                  </p>
                )}
                <p className="order-card__total">
                  Total: <strong>${order.total.toLocaleString('es-CL')}</strong>
                </p>
                {order.cancelReason && <p>📝 Motivo anulación: {order.cancelReason}</p>}
              </div>

              {canCancel(order.status) && (
                <div className="order-card__actions">
                  {cancelId === order.id ? (
                    <div className="cancel-form">
                      <input
                        className="form-control"
                        placeholder="Motivo de anulación…"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                      <button
                        className="btn btn-primary"
                        disabled={!cancelReason}
                        onClick={() => handleCancel(order.id)}
                      >
                        Confirmar anulación
                      </button>
                      <button className="btn btn-outline-primary" onClick={() => setCancelId(null)}>
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setCancelId(order.id)}
                    >
                      Anular pedido
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
