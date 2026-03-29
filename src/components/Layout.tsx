import { Outlet } from 'react-router-dom';
import Navbar           from './Navbar';
import Footer           from './Footer';
import CartSidebar      from './CartSidebar';
import ToastContainer   from './ToastContainer';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import './Layout.css';

export default function Layout() {
  useSessionTimeout();

  return (
    <div className="layout">
      <Navbar />
      <div className="layout__content">
        <Outlet />
      </div>
      <Footer />
      {/* Drawer del carrito — disponible en todas las páginas */}
      <CartSidebar />
      <ToastContainer />
    </div>
  );
}
