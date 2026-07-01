import { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import Boleta from '../components/Boleta';
import type { Order, OrderStatus } from '../types';
import './Cashier.css';

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

const PAYMENT_LABELS: Record<string, string> = {
  tarjeta:       '💳 Tarjeta',
  servipag:      '💳 Servipag',
  transferencia: '🏦 Transferencia',
};

export default function Cashier() {
  const { orders, updateOrderStatus } = useOrders();

  const [boletaOrder, setBoletaOrder] = useState<Order | null>(null);

  // Pedidos que esperan ser procesados por el cajero (status = 'pagado')
  const pendingOrders = orders.filter((o) => o.status === 'pagado');
  // Historial (ya procesados)
  const processedOrders = orders.filter(
    (o) => o.status !== 'pagado' && o.status !== 'pendiente'
  );

  const handleRealizarVenta = async (order: Order) => {
    // Realizar venta: confirma el pedido al área de cocina y genera boleta
    await updateOrderStatus(order.id, 'preparando');
    setBoletaOrder(order);
  };

  return (
    <main className="cashier-page container">
      <h1 className="page-title">Caja virtual</h1>
      <p className="page-subtitle">
        Procesa los pedidos pagados, genera boletas y envía las órdenes a cocina.
      </p>

      {/* ── Pedidos en espera ── */}
      <section className="cashier-section">
        <h2 className="cashier-section__title">
          Pedidos por procesar
          {pendingOrders.length > 0 && (
            <span className="badge text-bg-success ms-2">{pendingOrders.length}</span>
          )}
        </h2>

        {pendingOrders.length === 0 ? (
          <div className="cashier-empty card border-0 shadow-sm">
            <span>🧾</span>
            <p>No hay pedidos pendientes de procesamiento.</p>
          </div>
        ) : (
          <div className="cashier-grid">
            {pendingOrders.map((order) => (
              <div key={order.id} className="cashier-card card border-0 shadow-sm">
                <div className="cashier-card__header">
                  <div>
                    <h3>Pedido #{order.id.slice(-6).toUpperCase()}</h3>
                    <p className="cashier-card__date">
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

                <div className="cashier-card__body">
                  <p>
                    <strong>Cliente:</strong> {order.customerName}
                  </p>
                  <p>
                    <strong>Correo:</strong> {order.customerEmail}
                  </p>
                  <p>
                    <strong>📍 Dirección:</strong> {order.address}
                  </p>
                  <p>
                    <strong>Pago:</strong>{' '}
                    {PAYMENT_LABELS[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}
                  </p>

                  {order.items.length > 0 && (
                    <div className="cashier-card__items">
                      <strong>Detalle:</strong>
                      <table className="cashier-items-table">
                        <tbody>
                          {order.items.map(({ productId, productName, unitPrice, quantity }) => (
                            <tr key={productId}>
                              <td>{productName}</td>
                              <td className="text-center">× {quantity}</td>
                              <td className="text-end">
                                ${(unitPrice * quantity).toLocaleString('es-CL')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="cashier-card__total">
                    <strong>Total:</strong>{' '}
                    <strong>${order.total.toLocaleString('es-CL')}</strong>
                  </p>
                </div>

                <div className="cashier-card__actions">
                  <button
                    className="btn btn-primary w-100"
                    onClick={() => handleRealizarVenta(order)}
                  >
                    ✅ Realizar venta y generar boleta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Historial de ventas ── */}
      {processedOrders.length > 0 && (
        <section className="cashier-section">
          <h2 className="cashier-section__title">Historial de ventas procesadas</h2>
          <div className="card border-0 shadow-sm" style={{ overflowX: 'auto', borderRadius: 'var(--radius)' }}>
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.88rem' }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th className="text-end">Total</th>
                  <th>Boleta</th>
                </tr>
              </thead>
              <tbody>
                {processedOrders.slice(0, 30).map((o) => (
                  <tr key={o.id}>
                    <td>#{o.id.slice(-6).toUpperCase()}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString('es-CL')}</td>
                    <td>{o.customerName}</td>
                    <td>{PAYMENT_LABELS[o.paymentMethod ?? ''] ?? o.paymentMethod ?? '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="text-end">${o.total.toLocaleString('es-CL')}</td>
                    <td>
                      {o.status !== 'anulado' && (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setBoletaOrder(o)}
                        >
                          🖨️ Boleta
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Modal boleta ── */}
      {boletaOrder && (
        <Boleta
          order={boletaOrder}
          onClose={() => setBoletaOrder(null)}
        />
      )}
    </main>
  );
}
