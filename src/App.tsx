import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home       from './pages/Home';
import Menu       from './pages/Menu';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Cart       from './pages/Cart';
import Checkout   from './pages/Checkout';
import Orders     from './pages/Orders';
import Admin      from './pages/Admin';
import Cashier    from './pages/Cashier';
import Dispatcher from './pages/Dispatcher';
import Help        from './pages/Help';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Rutas públicas */}
          <Route index        element={<Home />}     />
          <Route path="menu"  element={<Menu />}     />
          <Route path="login" element={<Login />}    />
          <Route path="register" element={<Register />} />
          <Route path="cart"  element={<Cart />}     />

          {/* Rutas protegidas — cliente autenticado */}
          <Route path="checkout" element={
            <ProtectedRoute><Checkout /></ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />

          {/* Ruta protegida — admin / dueño */}
          <Route path="admin" element={
            <ProtectedRoute roles={['admin', 'dueno']}><Admin /></ProtectedRoute>
          } />

          {/* Ruta protegida — cajero virtual */}
          <Route path="cashier" element={
            <ProtectedRoute roles={['cajero', 'admin']}><Cashier /></ProtectedRoute>
          } />

          {/* Ruta protegida — encargado de despachos */}
          <Route path="dispatcher" element={
            <ProtectedRoute roles={['despachador', 'admin']}><Dispatcher /></ProtectedRoute>
          } />

          {/* Ayuda / manual (RNF-12, RNF-14) */}
          <Route path="ayuda" element={<Help />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
