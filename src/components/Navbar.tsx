import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `nav-link px-lg-3 ${isActive ? 'active fw-semibold' : ''}`;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);

  const isAdmin      = user?.role === 'admin' || user?.role === 'dueño';
  const isCajero     = user?.role === 'cajero'      || isAdmin;
  const isDespachador= user?.role === 'despachador' || isAdmin;
  const isCliente    = user?.role === 'cliente';

  return (
    <header className="navbar navbar-expand-lg navbar-dark site-navbar sticky-top py-0">
      <div className="container navbar__inner">
        <Link to="/" className="navbar-brand navbar__logo" onClick={close}>
          <span className="navbar__logo-mark">🍣</span>
          <span>Fukusuke</span>
        </Link>

        <button
          className="navbar-toggler border-0 shadow-none"
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Abrir menú"
          aria-controls="main-navbar"
          aria-expanded={menuOpen}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="main-navbar">
          <nav className="navbar-nav me-auto mb-3 mb-lg-0 align-items-lg-center gap-lg-1">
            <NavLink to="/" end className={navLinkClassName} onClick={close}>Inicio</NavLink>
            <NavLink to="/menu" className={navLinkClassName} onClick={close}>Menú</NavLink>
            <NavLink to="/ayuda" className={navLinkClassName} onClick={close}>Ayuda</NavLink>

            {/* Links exclusivos del cliente */}
            {isAuthenticated && (isCliente || isAdmin) && (
              <>
                <button
                  className="nav-link px-lg-3 border-0 bg-transparent"
                  onClick={() => { close(); openCart(); }}
                >
                  Carrito
                  {totalItems > 0 && (
                    <span className="badge badge-counter rounded-pill text-bg-danger ms-2">
                      {totalItems}
                    </span>
                  )}
                </button>
                <NavLink to="/orders" className={navLinkClassName} onClick={close}>
                  Mis Pedidos
                </NavLink>
              </>
            )}

            {/* Cajero virtual */}
            {isAuthenticated && isCajero && (
              <NavLink to="/cashier" className={navLinkClassName} onClick={close}>
                Caja
              </NavLink>
            )}

            {/* Despachador */}
            {isAuthenticated && isDespachador && (
              <NavLink to="/dispatcher" className={navLinkClassName} onClick={close}>
                Despacho
              </NavLink>
            )}

            {/* Admin / Dueño */}
            {isAuthenticated && isAdmin && (
              <NavLink to="/admin" className={navLinkClassName} onClick={close}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 navbar__auth">
            {isAuthenticated ? (
              <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 gap-lg-3 ms-lg-3">
                <span className="navbar__user-name">
                  Hola, {user?.fullName.split(' ')[0]}
                  <span className="badge text-bg-secondary ms-1" style={{ fontSize: '0.65rem' }}>
                    {user?.role}
                  </span>
                </span>
                <button className="btn btn-outline-light btn-sm px-3" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <>
                <Link to="/login"    className="btn btn-outline-light btn-sm px-3" onClick={close}>
                  Iniciar sesión
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm px-3"       onClick={close}>
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
