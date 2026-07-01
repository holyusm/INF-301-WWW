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

  const isAdmin      = user?.role === 'admin' || user?.role === 'dueno';
  const isCajero     = user?.role === 'cajero'      || isAdmin;
  const isDespachador= user?.role === 'despachador' || isAdmin;
  const isCliente    = user?.role === 'cliente';

  return (
    <header className="navbar navbar-expand-lg navbar-dark site-navbar sticky-top py-0">
      <div className="container-fluid navbar__inner px-4">
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
          {/* Centro: solo links principales y gestión */}
          <nav className="navbar-nav navbar__nav-center mb-3 mb-lg-0 align-items-lg-center gap-lg-1">
            <NavLink to="/" end className={navLinkClassName} onClick={close}>Inicio</NavLink>
            <NavLink to="/menu" className={navLinkClassName} onClick={close}>Menú</NavLink>
            <NavLink to="/ayuda" className={navLinkClassName} onClick={close}>Ayuda</NavLink>

            {/* Links de rol en el centro (excepto cliente) */}
            {isCajero && (
              <NavLink to="/cashier" className={navLinkClassName} onClick={close}>
                Caja
              </NavLink>
            )}
            {isDespachador && (
              <NavLink to="/dispatcher" className={navLinkClassName} onClick={close}>
                Despacho
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClassName} onClick={close}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Derecha: usuario → Mis Pedidos (solo cliente) → cerrar sesión → carrito */}
          <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2 ms-lg-auto navbar__auth">
            {isAuthenticated ? (
              <>
                {/* 1. Info usuario */}
                <span className="navbar__user-name me-lg-3">
                  <span className="badge text-bg-secondary mb-1" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>
                    {user?.role}
                  </span>
                  <span>Hola, {user?.fullName.split(' ')[0]}</span>
                </span>

                {/* 2. Mis Pedidos (solo cliente) */}
                {isCliente && (
                  <NavLink to="/orders" className={navLinkClassName} onClick={close}>
                    Mis Pedidos
                  </NavLink>
                )}

                {/* 3. Cerrar sesión con estilo nav-link */}
                <button className="nav-link px-lg-3 navbar__logout" onClick={handleLogout}>
                  Cerrar sesión
                </button>

                {/* 4. Carrito */}
                {isCliente && (
                  <button
                    className="btn btn-link position-relative p-0 text-white d-flex align-items-center justify-content-center btn-cart"
                    onClick={() => { close(); openCart(); }}
                    aria-label="Carrito de compras"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-cart3" viewBox="0 0 16 16">
                      <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l.84 4.479 9.144-.459L13.89 4zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2"/>
                    </svg>
                    {totalItems > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>
                        {totalItems}
                        <span className="visually-hidden">productos en el carrito</span>
                      </span>
                    )}
                  </button>
                )}
              </>
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
