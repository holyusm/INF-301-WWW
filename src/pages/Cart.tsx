import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import './Cart.css';

export default function Cart() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { products } = useProducts();
  const imageFor = (productId: string) => products.find((p) => p.id === productId)?.image ?? '';

  if (totalItems === 0) {
    return (
      <main className="cart-page container">
        <h1 className="page-title">Tu carrito</h1>
        <div className="cart-empty card border-0 shadow-sm">
          <span>🛒</span>
          <p>Tu carrito está vacío</p>
          <Link to="/menu" className="btn btn-primary">Ver menú</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page container">
      <h1 className="page-title">Tu carrito</h1>

      <div className="cart-layout">
        <section className="cart-items">
          {items.map(({ productId, productName, unitPrice, quantity }) => (
            <div key={productId} className="cart-item card border-0 shadow-sm">
              <img src={imageFor(productId)} alt={productName} />
              <div className="cart-item__info">
                <h3>{productName}</h3>
                <p className="cart-item__price">
                  ${unitPrice.toLocaleString('es-CL')} c/u
                </p>
              </div>
              <div className="cart-item__qty">
                <button
                  className="btn btn-outline-secondary btn-sm rounded-circle"
                  onClick={() => updateQuantity(productId, quantity - 1)}
                  disabled={quantity <= 1}
                >−</button>
                <span>{quantity}</span>
                <button className="btn btn-outline-secondary btn-sm rounded-circle" onClick={() => updateQuantity(productId, quantity + 1)}>+</button>
              </div>
              <p className="cart-item__subtotal">
                ${(unitPrice * quantity).toLocaleString('es-CL')}
              </p>
              <button
                className="cart-item__remove btn btn-link text-danger text-decoration-none"
                onClick={() => removeItem(productId)}
                aria-label="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}

          <button className="btn btn-outline-primary cart-clear" onClick={clearCart}>
            Vaciar carrito
          </button>
        </section>

        <aside className="cart-summary card border-0 shadow-sm">
          <h2>Resumen del pedido</h2>
          <hr className="divider" />

          {items.map(({ productId, productName, unitPrice, quantity }) => (
            <div key={productId} className="cart-summary__line">
              <span>{productName} × {quantity}</span>
              <span>${(unitPrice * quantity).toLocaleString('es-CL')}</span>
            </div>
          ))}

          <hr className="divider" />
          <div className="cart-summary__line cart-summary__line--total">
            <span>Total</span>
            <span>${totalPrice.toLocaleString('es-CL')}</span>
          </div>
          <div className="cart-summary__shipping">
            <span>🏍️ Despacho</span>
            <span className="tag">Gratis</span>
          </div>

          {isAuthenticated ? (
            <Link to="/checkout" className="btn btn-primary cart-summary__cta">
              Proceder al pago →
            </Link>
          ) : (
            <Link to="/login" className="btn btn-secondary cart-summary__cta">
              Inicia sesión para continuar
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
