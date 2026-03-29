import './Help.css';

interface Section {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'inicio',
    title: 'Primeros pasos',
    icon: 'bi-rocket-takeoff',
    content: (
      <div>
        <p>Bienvenido al manual de ayuda de <strong>Fukusuke Sushi-Delivery</strong>. Aquí encontrarás todo lo que necesitas para usar la plataforma.</p>
        <ol>
          <li>Navega por el <strong>Menú</strong> para explorar nuestros productos.</li>
          <li>Agrega productos al carrito haciendo clic en <em>Agregar al carrito</em>.</li>
          <li>Cuando estés listo, ve al carrito y procede al pago.</li>
          <li>Seguí el estado de tu pedido en <strong>Mis pedidos</strong>.</li>
        </ol>
      </div>
    ),
  },
  {
    id: 'cuenta',
    title: 'Gestión de cuenta',
    icon: 'bi-person-circle',
    content: (
      <div>
        <h4>Registro</h4>
        <p>Para crear una cuenta necesitas:</p>
        <ul>
          <li><strong>RUN</strong> (cédula chilena) con formato XX.XXX.XXX-X</li>
          <li><strong>Correo electrónico</strong> válido</li>
          <li><strong>Contraseña</strong> de al menos 6 caracteres</li>
          <li><strong>Teléfono</strong> celular chileno (+56912345678)</li>
          <li><strong>Dirección</strong> de despacho completa</li>
          <li>Debes tener al menos <strong>13 años</strong> para registrarte</li>
        </ul>
        <h4 className="mt-3">Inicio de sesión</h4>
        <p>Usa tu correo y contraseña para ingresar. La sesión se cierra automáticamente después de <strong>30 minutos</strong> de inactividad por tu seguridad.</p>
      </div>
    ),
  },
  {
    id: 'carrito',
    title: 'Carrito de compras',
    icon: 'bi-cart3',
    content: (
      <div>
        <p>El carrito se despliega automáticamente al agregar un producto. Desde ahí puedes:</p>
        <ul>
          <li>Ver todos los productos agregados</li>
          <li>Modificar cantidades con los botones <strong>−</strong> y <strong>+</strong></li>
          <li>Eliminar un producto haciendo clic en <strong>×</strong></li>
          <li>Ver el subtotal actualizado en tiempo real</li>
          <li>Proceder al pago directamente</li>
        </ul>
        <p>También puedes ver el carrito completo haciendo clic en el ícono del carrito en la barra de navegación.</p>
      </div>
    ),
  },
  {
    id: 'pedido',
    title: 'Realizar un pedido',
    icon: 'bi-bag-check',
    content: (
      <div>
        <p>Para completar tu compra:</p>
        <ol>
          <li>Agrega los productos deseados al carrito.</li>
          <li>Ve a <strong>Checkout</strong> (Proceder al pago).</li>
          <li>Verifica tu dirección de despacho — debe estar en una <strong>comuna con cobertura</strong>.</li>
          <li>Selecciona tu método de pago (Tarjeta, Transferencia o Efectivo).</li>
          <li>Confirma el pedido.</li>
          <li>Se generará una <strong>boleta digital</strong> que puedes imprimir.</li>
        </ol>
        <div className="help-alert help-alert--info">
          <strong>Comunas con despacho:</strong> Santiago, Providencia, Ñuñoa, Las Condes, Vitacura, La Reina, San Miguel, Macul, La Florida, Puente Alto.
        </div>
      </div>
    ),
  },
  {
    id: 'seguimiento',
    title: 'Estado de mis pedidos',
    icon: 'bi-list-check',
    content: (
      <div>
        <p>En <strong>Mis pedidos</strong> puedes ver el historial y estado de cada orden:</p>
        <table className="help-table">
          <thead>
            <tr><th>Estado</th><th>Descripción</th></tr>
          </thead>
          <tbody>
            <tr><td>Pendiente</td><td>El pedido fue recibido y está en espera.</td></tr>
            <tr><td>Pagado</td><td>El pago fue confirmado por el cajero.</td></tr>
            <tr><td>Preparando</td><td>El equipo está preparando tu pedido.</td></tr>
            <tr><td>En camino</td><td>Tu pedido está siendo despachado.</td></tr>
            <tr><td>Entregado</td><td>El pedido fue entregado exitosamente.</td></tr>
            <tr><td>Anulado</td><td>El pedido fue cancelado.</td></tr>
          </tbody>
        </table>
        <p className="mt-3">Puedes <strong>anular un pedido</strong> mientras esté en estado Pendiente, Pagado o Preparando. Ingresa el motivo de anulación para confirmar.</p>
      </div>
    ),
  },
  {
    id: 'seguridad',
    title: 'Seguridad',
    icon: 'bi-shield-lock',
    content: (
      <div>
        <h4>Contraseña segura</h4>
        <p>Recomendamos usar una contraseña que incluya:</p>
        <ul>
          <li>Al menos <strong>8 caracteres</strong></li>
          <li>Letras <strong>mayúsculas y minúsculas</strong></li>
          <li>Al menos un <strong>número</strong></li>
          <li>Al menos un <strong>carácter especial</strong> (ej: @#$%)</li>
        </ul>
        <h4 className="mt-3">Cierre de sesión automático</h4>
        <p>Por seguridad, tu sesión se cierra automáticamente después de <strong>30 minutos</strong> sin actividad. Recibirás una advertencia 2 minutos antes.</p>
        <h4 className="mt-3">Privacidad</h4>
        <p>Tu información personal (RUN, dirección, teléfono) es confidencial y no se comparte con terceros.</p>
      </div>
    ),
  },
  {
    id: 'roles',
    title: 'Roles del sistema',
    icon: 'bi-people',
    content: (
      <div>
        <p>Fukusuke cuenta con diferentes roles de usuario:</p>
        <table className="help-table">
          <thead>
            <tr><th>Rol</th><th>Acceso</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Cliente</strong></td><td>Ver menú, hacer pedidos, ver historial propio.</td></tr>
            <tr><td><strong>Cajero</strong></td><td>Procesar pagos, emitir boletas, gestionar caja.</td></tr>
            <tr><td><strong>Despachador</strong></td><td>Gestionar estado de despacho de los pedidos.</td></tr>
            <tr><td><strong>Admin</strong></td><td>Gestión de productos, clientes, pedidos y reportes.</td></tr>
            <tr><td><strong>Dueño</strong></td><td>Acceso completo, igual que Admin.</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'soporte',
    title: 'Soporte y contacto',
    icon: 'bi-headset',
    content: (
      <div>
        <p>Si tienes problemas o consultas, contáctanos:</p>
        <ul>
          <li><strong>soporte@fukusuke.cl</strong></li>
          <li><strong>+56 2 2345 6789</strong> (Lun–Vie, 9:00–18:00)</li>
          <li>Formulario de contacto en nuestra página web</li>
        </ul>
        <div className="help-alert help-alert--warning">
          Para consultas sobre un pedido específico, ten a mano el número de pedido (ej: <strong>FKS-00001</strong>).
        </div>
      </div>
    ),
  },
];

export default function Help() {
  return (
    <main className="help-page container">
      <div className="help-header">
        <i className="bi bi-journal-text help-header__icon" aria-hidden="true" />
        <h1>Manual de ayuda</h1>
        <p>Todo lo que necesitas saber para usar Fukusuke Sushi-Delivery</p>
      </div>

      <div className="help-layout">
        <nav className="help-nav" aria-label="Secciones de ayuda">
          <p className="help-nav__title">Contenido</p>
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="help-nav__link">
                  <i className={`bi ${s.icon}`} aria-hidden="true" /> {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="help-content">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="help-section card border-0 shadow-sm">
              <h2 className="help-section__title">
                <i className={`bi ${s.icon}`} aria-hidden="true" /> {s.title}
              </h2>
              <div className="help-section__body">{s.content}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
