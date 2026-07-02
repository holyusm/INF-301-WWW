# Fukusuke Backend — Microservicios

Backend de la plataforma de sushi **Fukusuke**, construido con NestJS + TypeORM + PostgreSQL.

Documentación interactiva disponible en `http://localhost:3000/docs` (Swagger / OpenAPI) al iniciar el servidor.

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | ≥ 20 | Runtime |
| NestJS | 11 | Framework principal |
| TypeORM | 0.3 | ORM / acceso a datos |
| PostgreSQL | ≥ 14 | Base de datos |
| JWT + Passport | — | Autenticación |
| `@nestjs/event-emitter` | 3.x | Bus de eventos asíncrono |
| `@nestjs/swagger` | 11.x | Documentación OpenAPI |
| Jest | 30 | Tests unitarios |

## Microservicios implementados

| Módulo | Puerto lógico | Endpoints base | Descripción |
|---|---|---|---|
| `auth` | — | `/api/auth` | Registro, login, JWT |
| `users` | — | `/api/users` | Perfil y direcciones |
| `products` | — | `/api/products` | Catálogo de productos |
| `cart` | — | `/api/cart` | Carrito de compras |
| `orders` | — | `/api/orders` | Pedidos y estados |
| `payments` | — | `/api/payments` | Procesamiento de pagos |
| `notifications` | — | `/api/notifications` | Notificaciones |
| `reports` | — | `/api/reports` | Reportes semanales |

## Setup

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los datos de tu base de datos:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/fukusuke_db
JWT_SECRET=cualquier_string_secreto
```

### 3. Crear la base de datos

**Opción A — Postgres local ya instalado:**

```sql
CREATE DATABASE fukusuke_db;
```

**Opción B — Docker (recomendado si no tienes Postgres instalado):**

```bash
docker run --name fukusuke-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fukusuke_db \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Con esto, el `DATABASE_URL` de `.env.example` (`postgresql://postgres:password@localhost:5432/fukusuke_db`) funciona **sin editar nada** después de `cp .env.example .env`. Si el puerto 5432 ya está ocupado por otro Postgres local, cambia `-p 5432:5432` por, por ejemplo, `-p 5433:5432` y ajusta el puerto en `DATABASE_URL` dentro de tu `.env`.

Para volver a levantar el mismo contenedor en sesiones futuras (los datos persisten mientras no lo borres):

```bash
docker start fukusuke-postgres
```

> NestJS sincroniza el esquema automáticamente en modo desarrollo (`synchronize: true`) — no hace falta correr migraciones a mano.

### 4. Iniciar el servidor

```bash
npm run start:dev
```

El servidor corre en `http://localhost:3000/api`

### 5. Sembrar datos demo (productos + usuarios)

La base de datos arranca **vacía** — sin esto el menú no tiene productos ni hay con quién hacer login.

```bash
npm run seed
```

Esto crea las 5 categorías y los 17 productos del menú (solo la primera vez; si ya hay productos, el script no hace nada). El seed **no crea usuarios** — para eso, con el servidor corriendo (`npm run start:dev`), registra un usuario por rol contra el endpoint real:

```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{
  "run": "11111111-1", "fullName": "Cliente Demo", "email": "cliente@fukusuke.cl",
  "password": "Fukusuke2026", "phone": "+56911111111", "address": "Av. Pajaritos 1234",
  "commune": "Maipu", "province": "Santiago", "region": "Región Metropolitana",
  "birthDate": "1995-05-20", "gender": "otro", "role": "cliente"
}'
```

Repite cambiando `run`, `fullName`, `email` y `"role"` (`cliente`, `cajero`, `despachador`, `admin` o `dueno`) para cada rol que necesites probar. `POST /auth/register` acepta cualquier rol sin requerir estar autenticado — es intencional en este proyecto académico, para poder crear cuentas de demo de cada rol sin depender de un admin inicial ("problema del huevo y la gallina").

**Usuarios demo usados en las grabaciones/pruebas locales** (contraseña `Fukusuke2026` para los cinco):

| Rol | Email |
|---|---|
| Cliente | `cliente@fukusuke.cl` |
| Cajero | `cajero@fukusuke.cl` |
| Despachador | `despachador@fukusuke.cl` |
| Admin | `admin@fukusuke.cl` |
| Dueño | `dueno@fukusuke.cl` |

### 6. Resetear la base de datos a un estado limpio

Si la base quedó con datos de prueba (pedidos, usuarios de testing, etc.) y quieres empezar de cero antes de grabar una demo:

```bash
# Con el servidor detenido, borra y recrea el esquema:
docker exec fukusuke-postgres psql -U postgres -d fukusuke_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"

# Vuelve a levantar el servidor (recrea el esquema por synchronize:true)
npm run start:dev

# En otra terminal, siembra productos y vuelve a crear los usuarios demo
npm run seed
# (repite los curl de registro del paso 5)
```

## Ejecutar tests

```bash
# Todos los tests (113 tests, 8 suites)
npm test

# Con cobertura
npm run test:cov

# Watch mode
npm run test:watch
```

Los tests unitarios no requieren base de datos real. Cubren: máquina de estados de pedidos, emisión de eventos, orquestación síncrona de pagos, control de acceso por roles, y handlers `@OnEvent` en notifications y reports.

## Endpoints principales

### Auth
```
POST /api/auth/register        → Registrar usuario (cualquier rol)
POST /api/auth/login           → Iniciar sesión (retorna JWT)
GET  /api/auth/profile         → Perfil (requiere JWT)
GET  /api/auth/users           → Lista credenciales de todos los usuarios (admin/dueño)
PUT  /api/auth/users/:userId   → Edita rol/email/contraseña/estado activo (admin/dueño)
```

### Users
```
GET    /api/users/profile         → Perfil del usuario autenticado
PUT    /api/users/profile         → Actualiza el propio perfil
GET    /api/users/addresses       → Direcciones guardadas
POST   /api/users/addresses       → Agrega una dirección
DELETE /api/users/addresses/:id   → Elimina una dirección propia
GET    /api/users                 → Lista todos los perfiles (admin/dueño)
PUT    /api/users/:id             → Edita el perfil de cualquier usuario (admin/dueño)
```

### Products
```
GET  /api/products              → Listar productos
GET  /api/products?category=rolls → Filtrar por categoría
POST /api/products              → Crear (admin/dueño)
PATCH /api/products/:id/availability → Disponibilidad (admin/cajero)
```

### Cart
```
GET    /api/cart              → Ver carrito
POST   /api/cart/items        → Agregar ítem
PUT    /api/cart/items/:id    → Actualizar cantidad
DELETE /api/cart/items/:id    → Quitar ítem
DELETE /api/cart              → Vaciar carrito
```

### Orders
```
POST   /api/orders              → Crear pedido (acepta paymentData para pago inline)
GET    /api/orders/my           → Mis pedidos
GET    /api/orders              → Todos los pedidos (admin/cajero/dueño)
GET    /api/orders/:id          → Detalle pedido
PATCH  /api/orders/:id/status   → Actualizar estado (máquina de estados + roles)
DELETE /api/orders/:id          → Eliminar pedido en pendiente (admin)
```

### Payments
```
POST /api/payments/process         → Procesar pago (tarjeta/servipag/transferencia)
GET  /api/payments/order/:orderId  → Pago de un pedido
```

### Notifications
```
GET   /api/notifications          → Últimas 50 notificaciones del usuario
PATCH /api/notifications/read-all → Marcar todas como leídas
PATCH /api/notifications/:id/read → Marcar una como leída
```

### Reports (requieren JWT + admin/dueño)
```
GET  /api/reports/current       → Reporte semana actual
GET  /api/reports/recent?n=4    → Últimas n semanas
GET  /api/reports/:weekId       → Semana específica (ej: 2026-W21)
POST /api/reports/register-sale → Registrar venta manualmente
```

### Roles de usuario

| Rol | Permisos |
|---|---|
| `cliente` | Ver productos, gestionar carrito, crear pedidos |
| `cajero` | Actualizar pedidos a PAGADO / PREPARANDO |
| `despachador` | Actualizar pedidos a EN_CAMINO / ENTREGADO |
| `admin` | CRUD productos, gestión de usuarios, ver todos los pedidos, reportes |
| `dueno` | Igual que admin |

## Arquitectura

```
src/
├── auth/           ← Autenticación JWT
├── users/          ← Perfil + direcciones de despacho
├── products/       ← Catálogo (Product, Category)
├── cart/           ← Carrito efímero por usuario
├── orders/         ← Pedidos con máquina de estados
├── payments/       ← Pagos (Strategy: tarjeta/servipag/transferencia)
├── notifications/  ← Notificaciones por evento
└── reports/        ← Reportes semanales de ventas
```

Cada módulo sigue la estructura en 4 capas:
```
Controller → Service → Repository → Entity
```

### Comunicación entre módulos

- **Síncrona (REST):** `order-service` llama a `payment-service` cuando el cliente envía `paymentData` en la creación del pedido.
- **Asíncrona (eventos):** `order-service` emite `order.created`, `order.paid`, `order.status_changed`, `order.cancelled` mediante `@nestjs/event-emitter`. `notification-service` y `report-service` reaccionan con decoradores `@OnEvent` sin acoplamiento directo.

### Entidades por módulo

| Módulo | Tablas propias |
|---|---|
| auth | `credentials` |
| users | `user_profiles`, `saved_addresses` |
| products | `products`, `categories` |
| cart | `carts`, `cart_items` |
| orders | `orders`, `order_items` |
| payments | `payments` |
| notifications | `notifications` |
| reports | `weekly_reports`, `daily_sales` |
