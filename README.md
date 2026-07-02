# Fukusuke Frontend

Aplicación frontend de e-commerce para sushi (proyecto académico INF-301-WWW), construida con React + TypeScript + Vite.

El proyecto implementa un flujo completo de compra (catálogo, carrito, checkout y pedidos) **conectado a un backend real** de microservicios en NestJS + PostgreSQL (ver [`/backend`](backend/README.md)). Menú, carrito, checkout con pago real, pedidos, paneles de cajero/despachador/administración y reportería con Chart.js consumen la API real — no hay datos mock ni simulados.

## Tabla de contenido

- [Resumen](#resumen)
- [Stack tecnológico](#stack-tecnologico)
- [Requisitos](#requisitos)
- [Requerimientos no funcionales](#requerimientos-no-funcionales)
- [Instalación y ejecución](#instalacion-y-ejecucion)
- [Scripts disponibles](#scripts-disponibles)
- [Flujo demo](#flujo-demo)
- [Autenticación demo](#autenticacion-demo)
- [Pago con tarjeta](#pago-con-tarjeta)
- [Rutas de la aplicación](#rutas-de-la-aplicacion)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Decisiones y alcance](#decisiones-y-alcance)
- [Troubleshooting](#troubleshooting)
- [Mejoras futuras](#mejoras-futuras)

## Resumen

Fukusuke Frontend implementa:

- Landing page y menú de productos (sembrados desde el backend).
- Registro e inicio de sesión reales, con JWT emitido por el backend.
- Carrito sincronizado con el backend por usuario autenticado.
- Checkout protegido por autenticación, con pago real por tarjeta (Strategy pattern en el backend) y servipag/transferencia simulados.
- Vista de "Mis pedidos", panel de cajero, panel de despachador y panel de administración (productos, pedidos, usuarios y reportería con Chart.js), todos contra datos reales.

## Stack tecnologico

- React 18
- TypeScript 5
- Vite 5
- React Router DOM 6
- Bootstrap 5 (con estilos de marca propios)
- Chart.js + react-chartjs-2 (reportería del panel admin)
- Backend: NestJS + TypeORM + PostgreSQL — ver [`/backend`](backend/README.md)

## Requisitos

- Node.js 18+ (recomendado)
- npm 9+

## Requerimientos no funcionales

- La solución debe ser **web** y con **arquitectura por capas**, separando interfaz, lógica y datos.
- La app final del ramo considera integración con **base de datos Oracle** y tecnologías orientadas a objetos como **.NET** o **J2EE**; en esta primera unidad solo se implementa el frontend.
- La integración entre sistemas debe contemplar **Web Services**.
- El envío de correos y validación de cuentas debe considerar una **API de correo**.
- Debe incluir **medidas de seguridad**: cifrado de claves y control de sesiones.
- Todas las entradas deben tener **validaciones** correspondientes.
- La interfaz debe ser **usable**, con mensajes de error informativos y orientados al usuario final.
- Debe existir un **módulo de ayuda en línea** y manuales de usuario estructurados.
- La aplicación debe tener diseño **responsive** para computador, tablet y móvil.
- El sistema debe aspirar a un tiempo de aprendizaje menor a 4 horas y a una tasa de error menor al 1%.
- Las interfaces deben estar **bien formadas** visualmente y ser coherentes en todo el sistema.

### Estado actual frente a los no funcionales

- **Cumplido**: backend real con arquitectura de microservicios (NestJS + PostgreSQL), autenticación JWT con contraseñas hasheadas (bcrypt), Web Services vía API REST — ver [`/backend`](backend/README.md).
- **Cumplido**: arquitectura separada en `pages`, `components`, `context`, `hooks`, `api` y `types` en el frontend, y por módulos/capas en el backend.
- **Cumplido parcialmente**: diseño responsive y validaciones de formularios (frontend) + DTOs con `class-validator` (backend).
- **Pendiente**: ayuda en línea/manuales de usuario estructurados, API de correo con proveedor productivo (hoy EmailJS opcional).

## Instalacion y ejecucion

Este frontend necesita el **backend corriendo** (ver [`backend/README.md`](backend/README.md) para levantar Postgres, sembrar productos y crear usuarios demo). Con el backend arriba en `http://localhost:3000/api`:

1. Clona o descarga este repositorio.
2. Abre una terminal en la carpeta raíz del proyecto.
3. Instala dependencias:

```bash
npm install
```

4. Configura la URL del backend en `.env.local` (no se commitea):

```bash
cp .env.example .env.local
```

Confirma que `.env.local` tenga: `VITE_API_URL=http://localhost:3000/api`

5. Levanta servidor de desarrollo:

```bash
npm run dev
```

6. Abre en navegador la URL que entrega Vite (normalmente `http://localhost:5173/`).

## Scripts disponibles

```bash
npm run dev      # servidor de desarrollo
npm run build    # compila TypeScript + build de producción
npm run preview  # previsualiza el build generado
```

## Flujo demo

1. Ir a `Menú` y agregar productos (vienen del backend real, sembrados con `npm run seed`).
2. Ir a `Carrito` para revisar totales (sincronizado con el backend por usuario).
3. Ir a `Checkout` (requiere sesión).
4. Elegir método de pago:
   - Tarjeta crédito/débito — **se procesa contra el backend real** (Strategy pattern), puede aprobarse o rechazarse según los datos ingresados.
   - Servipag / Transferencia bancaria — simulados (el pedido queda `pendiente`, sin cobro real).
5. Confirmar pedido y revisar en `Mis pedidos`.
6. Con un usuario `cajero` puedes procesar el pedido en `/cashier`; con `despachador`, completarlo en `/dispatcher`; con `admin`/`dueno`, ver el reporte de ventas en `/admin` (tab Reportes).

## Autenticacion demo

El login es real: crea contraseñas con bcrypt y emite JWT desde el backend (`POST /api/auth/login`). Usuarios demo disponibles después de seguir el setup del backend (ver [`backend/README.md`](backend/README.md#5-sembrar-datos-demo-productos--usuarios)):

| Rol | Email | Contraseña |
|---|---|---|
| Cliente | `cliente@fukusuke.cl` | `Fukusuke2026` |
| Cajero | `cajero@fukusuke.cl` | `Fukusuke2026` |
| Despachador | `despachador@fukusuke.cl` | `Fukusuke2026` |
| Admin | `admin@fukusuke.cl` | `Fukusuke2026` |
| Dueño | `dueno@fukusuke.cl` | `Fukusuke2026` |

El JWT se guarda en `sessionStorage` bajo la clave `fukusuke_token`.

## Pago con tarjeta

En Checkout existe un formulario de tarjeta con:

- Nombre titular
- Número de tarjeta
- Fecha de vencimiento
- CVV
- Detección visual de marca (Visa/Mastercard/Amex)

El pago se envía al backend (`POST /api/orders` con `paymentData`), que lo valida y procesa mediante el patrón Strategy (`CreditCardPayment`). Los botones "Perfil de éxito"/"Perfil de fracaso" en la UI completan (o dejan incompletos a propósito) los datos de la tarjeta para forzar una aprobación o un rechazo real del backend — no es una simulación puramente visual.

## Rutas de la aplicacion

Públicas:

- `/` Inicio
- `/menu` Menú
- `/login` Login
- `/register` Registro
- `/cart` Carrito

Protegidas (usuario autenticado):

- `/checkout`
- `/orders`

Protegidas por rol:

- `/admin` — `admin` o `dueno`
- `/cashier` — `cajero` o `admin`
- `/dispatcher` — `despachador` o `admin`

## Estructura del proyecto

```text
src/
  api/
    client.ts       ← cliente HTTP tipado contra el backend
    mappers.ts       ← Api* (backend) → tipos de dominio del frontend
  components/
    CartSidebar.tsx
    Footer.tsx
    Layout.tsx
    Navbar.tsx
    ProductCard.tsx
    ProtectedRoute.tsx
    Boleta.tsx
  context/
    AuthContext.tsx
    CartContext.tsx
    OrderContext.tsx
    ToastContext.tsx
  hooks/
    useProducts.ts
    useUsers.ts
    useSessionTimeout.ts
  pages/
    Home.tsx
    Menu.tsx
    Login.tsx
    Register.tsx
    Cart.tsx
    Checkout.tsx
    Orders.tsx
    Cashier.tsx
    Dispatcher.tsx
    Admin.tsx
  types/
    index.ts
  utils/
    isoWeek.ts
    emailService.ts
```

## Decisiones y alcance

- Frontend conectado a un backend real de microservicios (NestJS + PostgreSQL) — ver [`/backend`](backend/README.md).
- Productos, carrito, pedidos y usuarios se persisten en PostgreSQL, no en el navegador.
- Enfoque en UX/UI, navegación, estado, validaciones de formulario y consistencia con la arquitectura del backend.

## Troubleshooting

### Error EPERM al iniciar Vite

Si aparece un error como:

```text
Error: EPERM: operation not permitted, rmdir node_modules/.vite/deps
```

prueba:

1. Detener todos los procesos de Vite/Node en terminales abiertas.
2. Eliminar caché de Vite:

```powershell
Remove-Item node_modules/.vite -Recurse -Force
```

3. Volver a ejecutar:

```bash
npm run dev
```

### El editor marca errores pero `npm run build` compila

Puede ser caché del servidor TypeScript de VS Code. Solución típica:

- Reiniciar TS Server.
- Recargar ventana de VS Code.

## Mejoras futuras

- Módulo de ayuda en línea y manuales de usuario estructurados.
- Reemplazar EmailJS por un proveedor de correo transaccional productivo.
- Tests automatizados de frontend (hoy la cobertura de tests está solo en el backend).
- Deploy continuo a Vercel/Railway sincronizado con `main` (la configuración ya existe en el repo, ver `vercel.json` y `backend/railway.json`).

---

Proyecto académico para INF-301-WWW.
