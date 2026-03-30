import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './CartSidebar.css';

export default function CartSidebar() {
  const {
    items, totalItems, totalPrice,
    isCartOpen, closeCart,
    removeItem, updateQuantity, clearCart,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Bloquear scroll del body mientras el drawer está abierto
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  // No mostrar el drawer en /cart ni en /checkout (ya tienen su propio layout)
  const hiddenPaths = ['/cart', '/checkout'];
  if (hiddenPaths.includes(location.pathname)) return null;


  const handleCheckout = () => {
    closeCart();
    navigate(isAuthenticated ? '/checkout' : '/login');
  };

  return (
    <>
      {/* ── Fondo oscuro ── */}
      <div
        className={`cart-backdrop ${isCartOpen ? 'cart-backdrop--visible' : ''}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <aside
        className={`cart-sidebar ${isCartOpen ? 'cart-sidebar--open' : ''}`}
        aria-label="Carrito de compras"
      >
        {/* Cabecera */}
        <div className="cart-sidebar__header">
          <div className="cart-sidebar__title">
            <span>🛒</span>
            <h2>Tu carrito</h2>
            {totalItems > 0 && (
              <span className="cart-sidebar__badge">{totalItems}</span>
            )}
          </div>
          <button
            className="cart-sidebar__close"
            onClick={closeCart}
            aria-label="Cerrar carrito"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        {items.length === 0 ? (
          <div className="cart-sidebar__empty">
            <span>🍣</span>
            <p>Tu carrito está vacío</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { closeCart(); navigate('/menu'); }}
            >
              Ver menú
            </button>
          </div>
        ) : (
          <>
            {/* Lista de productos */}
            <div className="cart-sidebar__items">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="cart-sidebar__item">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="cart-sidebar__item-img"
                  />

                  <div className="cart-sidebar__item-info">
                    <p className="cart-sidebar__item-name">{product.name}</p>
                    <p className="cart-sidebar__item-price">
                      ${product.price.toLocaleString('es-CL')} c/u
                    </p>

                    {/* Controles de cantidad */}
                    <div className="cart-sidebar__qty">
                      <button
                        className="cart-sidebar__qty-btn"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label="Disminuir cantidad"
                      >−</button>
                      <span className="cart-sidebar__qty-num">{quantity}</span>
                      <button
                        className="cart-sidebar__qty-btn"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        aria-label="Aumentar cantidad"
                      >+</button>
                    </div>
                  </div>

                  <div className="cart-sidebar__item-right">
                    <p className="cart-sidebar__item-subtotal">
                      ${(product.price * quantity).toLocaleString('es-CL')}
                    </p>
                    <button
                      className="cart-sidebar__remove"
                      onClick={() => removeItem(product.id)}
                      aria-label={`Eliminar ${product.name}`}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pie del drawer */}
            <div className="cart-sidebar__footer">
              <div className="cart-sidebar__shipping">
                <span>🏍️ Despacho</span>
                <span className="cart-sidebar__free">Gratis</span>
              </div>

              <div className="cart-sidebar__total">
                <span>Total</span>
                <strong>${totalPrice.toLocaleString('es-CL')}</strong>
              </div>

              <button
                className="btn btn-primary cart-sidebar__cta"
                onClick={handleCheckout}
              >
                {isAuthenticated ? 'Proceder al pago →' : 'Inicia sesión para pagar'}
              </button>

              <Link
                to="/cart"
                className="btn btn-outline-primary cart-sidebar__cta-secondary"
                onClick={closeCart}
              >
                Ver carrito completo
              </Link>

              <button
                className="cart-sidebar__clear"
                onClick={clearCart}
              >
                Vaciar carrito
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
