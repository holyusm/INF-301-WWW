import { useEffect } from 'react';
import type { Order, User } from '../types';
import './Boleta.css';

const PAYMENT_LABELS: Record<string, string> = {
  tarjeta:       'Tarjeta crédito/débito',
  servipag:      'Servipag',
  transferencia: 'Transferencia bancaria',
};

interface Props {
  order: Order;
  user: User;
  onClose: () => void;
}

export default function Boleta({ order, user, onClose }: Props) {
  // Agrega clase al body para que @media print oculte el resto de la página
  useEffect(() => {
    document.body.classList.add('boleta-print-active');
    return () => document.body.classList.remove('boleta-print-active');
  }, []);

  const boleataNum = String(order.id).slice(-8).padStart(8, '0');
  const fecha      = new Date(order.createdAt).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="boleta-overlay">
      <div className="boleta-modal">

        {/* ── Contenido imprimible ── */}
        <div className="boleta-printable" id="boleta-content">
          <div className="boleta-header">
            <p className="boleta-logo">🍣 Fukusuke Sushi-Delivery</p>
            <p className="boleta-address">Av. Pajaritos s/n, Maipú, Santiago</p>
            <p className="boleta-address">Tel: +56 2 2xxx xxxx | fukusuke@ejemplo.cl</p>
            <h2 className="boleta-title">BOLETA ELECTRÓNICA</h2>
            <p className="boleta-num">N° {boleataNum}</p>
          </div>

          <div className="boleta-info">
            <div className="boleta-info__row">
              <span>Fecha</span>
              <span>{fecha}</span>
            </div>
            <div className="boleta-info__row">
              <span>Cliente</span>
              <span>{user.fullName}</span>
            </div>
            <div className="boleta-info__row">
              <span>RUN</span>
              <span>{user.run}</span>
            </div>
            <div className="boleta-info__row">
              <span>Dirección despacho</span>
              <span>{order.address}</span>
            </div>
            <div className="boleta-info__row">
              <span>Método de pago</span>
              <span>{PAYMENT_LABELS[order.paymentMethod ?? ''] ?? order.paymentMethod ?? '—'}</span>
            </div>
          </div>

          <table className="boleta-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-center">Cant.</th>
                <th className="text-right">P. Unit.</th>
                <th className="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center">
                    (detalle no disponible para pedidos anteriores)
                  </td>
                </tr>
              ) : (
                order.items.map(({ product, quantity }) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td className="text-center">{quantity}</td>
                    <td className="text-right">${product.price.toLocaleString('es-CL')}</td>
                    <td className="text-right">
                      ${(product.price * quantity).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}><strong>TOTAL</strong></td>
                <td className="text-right">
                  <strong>${order.total.toLocaleString('es-CL')}</strong>
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="boleta-footer">
            <p>¡Gracias por su compra en Fukusuke!</p>
            <p>Despacho gratuito dentro del radio de 3 km</p>
            <p className="boleta-footer__legal">
              Documento tributario electrónico — Timbre SII N° 00000000 (simulado)
            </p>
          </div>
        </div>

        {/* ── Botones (no se imprimen) ── */}
        <div className="boleta-actions no-print">
          <button className="btn btn-primary" onClick={() => window.print()}>
            🖨️ Imprimir boleta
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
