import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import Boleta from '../components/Boleta';
import type { Order } from '../types';
import './Checkout.css';

// ── Comunas con cobertura de despacho (~3 km desde Maipú) ───
import { sendOrderReceipt } from '../utils/emailService';

// ── Comunas con cobertura de despacho (~3 km desde Maipú) ───
const DELIVERY_COMMUNES = [
  'Maipú', 'Cerrillos', 'Pudahuel', 'Pedro Aguirre Cerda', 'Padre Hurtado',
];

const PAYMENT_METHODS = [
  { value: 'tarjeta',       label: '💳 Tarjeta crédito/débito' },
  { value: 'servipag',      label: '💳 Servipag' },
  { value: 'transferencia', label: '🏦 Transferencia bancaria' },
] as const;

type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];
type CardBrand     = 'visa' | 'mastercard' | 'amex' | 'unknown';

const detectCardBrand = (number: string): CardBrand => {
  const d = number.replace(/\D/g, '');
  if (/^4/.test(d)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(d)) return 'mastercard';
  if (/^3[47]/.test(d)) return 'amex';
  return 'unknown';
};

const formatCardNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatExpiry = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user }                         = useAuth();
  const { createOrder }                  = useOrders();
  const navigate                         = useNavigate();

  const [address,  setAddress]  = useState(user?.address ?? '');
  const [commune,  setCommune]  = useState(user?.commune ?? '');
  const [payment,  setPayment]  = useState<PaymentMethod>('tarjeta');
  const [card,     setCard]     = useState({ holder: '', number: '', expiry: '', cvv: '' });
  const [cardError, setCardError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showBoleta,   setShowBoleta]   = useState(false);

  const communeError = commune.trim() &&
    !DELIVERY_COMMUNES.some((c) => c.toLowerCase() === commune.trim().toLowerCase());

  const detectedBrand = detectCardBrand(card.number);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!address || !commune || !user || items.length === 0) return;
    if (communeError) return;

    if (payment === 'tarjeta') {
      const cardDigits = card.number.replace(/\D/g, '');
      const expOk      = /^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry);
      const cvvOk      = /^\d{3,4}$/.test(card.cvv);
      if (!card.holder || cardDigits.length < 15 || !expOk || !cvvOk) {
        setCardError('Completa correctamente los datos de la tarjeta.');
        return;
      }
    }

    setCardError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    const order = createOrder({
      userId: user.id,
      items,
      total: totalPrice,
      address: `${address}, ${commune}`,
      paymentMethod: payment,
    });

    setCreatedOrder(order);
    setLoading(false);
    setSuccess(true);
    clearCart();

    // Enviar el correo de forma asíncrona sin bloquear la UI
    sendOrderReceipt(order, { fullName: user.fullName || 'Cliente', email: user.email });
  };

  if (items.length === 0 && !success) {
    return (
      <main className="checkout-page container">
        <div className="checkout-success card border-0 shadow-sm">
          <span>🛒</span>
          <h2>No hay productos para pagar</h2>
          <p>Primero arma un pedido desde el menú.</p>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>
            Ir al menú
          </button>
        </div>
      </main>
    );
  }

  if (success && createdOrder) {
    return (
      <main className="checkout-page container">
        <div className="checkout-success card border-0 shadow-sm">
          <span>✅</span>
          <h2>¡Pedido #{String(createdOrder.id).slice(-6)} recibido!</h2>
          <p>
            El pago fue confirmado. Nuestro cajero virtual procesará tu orden
            y te enviará la boleta a <strong>{user?.email}</strong>.
          </p>
          <div className="d-flex gap-2 justify-content-center flex-wrap mt-2">
            <button className="btn btn-outline-primary" onClick={() => setShowBoleta(true)}>
              🧾 Ver boleta
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              Ver mis pedidos
            </button>
          </div>
        </div>

        {showBoleta && user && (
          <Boleta
            order={createdOrder}
            user={user}
            onClose={() => setShowBoleta(false)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="checkout-page container">
      <h1 className="page-title">Confirmar pedido</h1>

      <div className="checkout-layout">
        <form className="checkout-form card border-0 shadow-sm" onSubmit={handleSubmit}>
          <h2>Datos de entrega</h2>

          <div className="mb-3">
            <label className="form-label">Nombre del receptor</label>
            <input className="form-control" value={user?.fullName ?? ''} readOnly />
          </div>

          <div className="mb-3">
            <label className="form-label">Dirección de despacho *</label>
            <input
              className="form-control"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Pajaritos 1234, Dpto 5B"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">
              Comuna de despacho *
              <span className="text-muted" style={{ fontSize: '0.8rem', marginLeft: '0.4rem' }}>
                (radio 3 km desde Maipú)
              </span>
            </label>
            <select
              className={`form-select ${communeError ? 'is-invalid' : ''}`}
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              required
            >
              <option value="">Selecciona tu comuna…</option>
              {DELIVERY_COMMUNES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option disabled value="__other">─── Fuera del área de cobertura ───</option>
            </select>
            {communeError && (
              <div className="invalid-feedback">
                Lo sentimos, no llegamos a esa comuna. Cobertura: {DELIVERY_COMMUNES.join(', ')}.
              </div>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Correo electrónico (boleta)</label>
            <input className="form-control" value={user?.email ?? ''} readOnly />
          </div>

          <hr className="divider" />
          <h2>Método de pago</h2>

          <div className="checkout-payments">
            {PAYMENT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`payment-option form-check ${payment === m.value ? 'selected' : ''}`}
              >
                <input
                  className="form-check-input"
                  type="radio"
                  name="payment"
                  value={m.value}
                  checked={payment === m.value}
                  onChange={() => setPayment(m.value as PaymentMethod)}
                />
                <span className="form-check-label">{m.label}</span>
              </label>
            ))}
          </div>

          {payment === 'tarjeta' && (
            <div className="checkout-card-box">
              <div className="checkout-card-brands" aria-label="Marcas disponibles">
                <span className={`brand-pill ${detectedBrand === 'visa'       ? 'active' : ''}`}>VISA</span>
                <span className={`brand-pill ${detectedBrand === 'mastercard' ? 'active' : ''}`}>Mastercard</span>
                <span className={`brand-pill ${detectedBrand === 'amex'       ? 'active' : ''}`}>Amex</span>
              </div>

              <div className="mb-3">
                <label className="form-label">Nombre titular</label>
                <input
                  className="form-control"
                  placeholder="Como aparece en la tarjeta"
                  value={card.holder}
                  onChange={(e) => setCard((p) => ({ ...p, holder: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Número de tarjeta</label>
                <input
                  className="form-control"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={(e) => setCard((p) => ({ ...p, number: formatCardNumber(e.target.value) }))}
                />
              </div>
              <div className="row g-3">
                <div className="col-7">
                  <label className="form-label">Vencimiento</label>
                  <input
                    className="form-control"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard((p) => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                  />
                </div>
                <div className="col-5">
                  <label className="form-label">CVV</label>
                  <input
                    className="form-control"
                    inputMode="numeric"
                    placeholder="123"
                    value={card.cvv}
                    onChange={(e) => setCard((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                  />
                </div>
              </div>

              {cardError && <div className="alert alert-danger mt-3 mb-0">{cardError}</div>}
              <p className="checkout-card-note">
                Modo demo — datos no almacenados ni procesados.
              </p>
            </div>
          )}

          {payment === 'servipag' && (
            <div className="checkout-card-box">
              <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>
                Serás redirigido a Servipag para completar el pago de forma segura.
                (Simulado — no se procesa pago real.)
              </p>
            </div>
          )}

          {payment === 'transferencia' && (
            <div className="checkout-card-box">
              <p className="mb-1" style={{ fontSize: '0.9rem' }}><strong>Datos de transferencia:</strong></p>
              <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
                Banco: BancoEstado · Cuenta corriente: 00-123-45678-9<br />
                RUT: 76.543.210-0 · Fukusuke Sushi SpA<br />
                (Simulado — no se realiza transferencia real.)
              </p>
            </div>
          )}

          <button
            className="btn btn-primary checkout-submit w-100"
            type="submit"
            disabled={loading || !!communeError || !commune}
          >
            {loading ? 'Procesando pago…' : `Pagar $${totalPrice.toLocaleString('es-CL')}`}
          </button>
        </form>

        <aside className="checkout-summary card border-0 shadow-sm">
          <h2>Resumen</h2>
          <hr className="divider" />
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="checkout-summary__line">
              <span>{product.name} × {quantity}</span>
              <span>${(product.price * quantity).toLocaleString('es-CL')}</span>
            </div>
          ))}
          <hr className="divider" />
          <div className="checkout-summary__total">
            <span>Total a pagar</span>
            <span>${totalPrice.toLocaleString('es-CL')}</span>
          </div>
          <div className="checkout-summary__shipping">🏍️ Despacho gratuito (radio 3 km)</div>
        </aside>
      </div>
    </main>
  );
}
