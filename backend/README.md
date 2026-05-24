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

```sql
CREATE DATABASE fukusuke_db;
```

> NestJS sincroniza el esquema automáticamente en modo desarrollo (`synchronize: true`).

### 4. Iniciar el servidor

```bash
npm run start:dev
```

El servidor corre en `http://localhost:3000/api`

## Ejecutar tests

```bash
# Todos los tests (106 tests, 8 suites)
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
POST /api/auth/register   → Registrar usuario
POST /api/auth/login      → Iniciar sesión (retorna JWT)
GET  /api/auth/profile    → Perfil (requiere JWT)
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
| `cajero` | Actualizar pedidos a PAGADO |
| `despachador` | Actualizar pedidos a EN_CAMINO / ENTREGADO |
| `admin` | CRUD productos, ver todos los pedidos, reportes |
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
