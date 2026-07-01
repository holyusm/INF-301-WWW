import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderStatus } from '../types';
import './Dispatcher.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente:  '⏳ Pendiente',
  pagado:     '✅ Pagado',
  preparando: '👨‍🍳 Preparando',
  en_camino:  '🏍️ En camino',
  entregado:  '📦 Entregado',
  anulado:    '❌ Anulado',
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  pendiente:  'text-bg-warning',
  pagado:     'text-bg-success',
  preparando: 'text-bg-primary',
  en_camino:  'text-bg-secondary',
  entregado:  'text-bg-dark',
  anulado:    'text-bg-danger',
};

function activeOrders(orders: Order[]): Order[] {
  return orders.filter(
    (o) => o.status === 'preparando' || o.status === 'en_camino'
  );
}

export default function Dispatcher() {
  const { orders, updateOrderStatus } = useOrders();
  const { users } = useAuth();

  const pendingDispatch = activeOrders(orders);
  const history = orders.filter(
    (o) => o.status === 'entregado' || o.status === 'anulado'
  );

  const getUserName = (userId: number) => {
    const u = users.find((u) => u.id === String(userId));
    return u ? u.fullName : `Usuario #${userId}`;
  };

  return (
    <main className="dispatcher-page container">
      <h1 className="page-title">Panel de despacho</h1>
      <p className="page-subtitle">
        Gestiona las órdenes listas para despachar y marca su estado de entrega.
      </p>

      {/* ── Órdenes activas ── */}
      <section className="dispatch-section">
        <h2 className="dispatch-section__title">
          Órdenes activas
          {pendingDispatch.length > 0 && (
            <span className="badge text-bg-primary ms-2">{pendingDispatch.length}</span>
          )}
        </h2>

        {pendingDispatch.length === 0 ? (
          <div className="dispatch-empty card border-0 shadow-sm">
            <span>🏍️</span>
            <p>No hay órdenes pendientes de despacho en este momento.</p>
          </div>
        ) : (
          <div className="dispatch-grid">
            {pendingDispatch.map((order) => (
              <div key={order.id} className={`dispatch-card card border-0 shadow-sm dispatch-card--${order.status}`}>
                <div className="dispatch-card__header">
                  <div>
                    <h3>Pedido #{String(order.id).slice(-6)}</h3>
                    <p className="dispatch-card__date">
                      {new Date(order.createdAt).toLocaleString('es-CL', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="dispatch-card__body">
                  <p><strong>Cliente:</strong> {getUserName(order.userId)}</p>
                  <p><strong>📍 Dirección:</strong> {order.address}</p>
                  <p><strong>Total:</strong> ${order.total.toLocaleString('es-CL')}</p>
                  {order.items.length > 0 && (
                    <div className="dispatch-card__items">
                      <strong>Productos:</strong>
                      <ul>
                        {order.items.map(({ product, quantity }) => (
                          <li key={product.id}>
                            {product.name} × {quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="dispatch-card__actions">
                  {order.status === 'preparando' && (
                    <button
                      className="btn btn-warning w-100"
                      onClick={() => updateOrderStatus(order.id, 'en_camino')}
                    >
                      🏍️ Salir a despacho
                    </button>
                  )}
                  {order.status === 'en_camino' && (
                    <button
                      className="btn btn-success w-100"
                      onClick={() => updateOrderStatus(order.id, 'entregado')}
                    >
                      ✅ Marcar como entregado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Historial ── */}
      {history.length > 0 && (
        <section className="dispatch-section">
          <h2 className="dispatch-section__title">Historial reciente</h2>
          <div className="admin-table-wrap card border-0 shadow-sm">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Dirección</th>
                  <th>Total</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 20).map((o) => (
                  <tr key={o.id}>
                    <td>#{String(o.id).slice(-6)}</td>
                    <td>{getUserName(o.userId)}</td>
                    <td>{o.address}</td>
                    <td>${o.total.toLocaleString('es-CL')}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
