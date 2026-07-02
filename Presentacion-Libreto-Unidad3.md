# Libreto de Presentación — Unidad 3
### Integración del sistema: Software, Taiga.io, Figma y Diagrama de Clases del Backend

> **Para el presentador:** este documento es la guía completa del video. Cada bloque indica qué mostrar en pantalla (**[PANTALLA]**) y qué decir (**[DICE]**). No lo leas literal frente a cámara — apóyate en él, dilo con tus palabras. Duración objetivo: **10-12 minutos**. Todos los integrantes deben participar (la rúbrica lo exige explícitamente).
>
> **Nota sobre la herramienta de diseño:** el equipo diseñó en **Figma**, tal como pide la rúbrica en C5/C7. Revisé el proyecto real (`Fukusuke Sushi Delivery – Rediseño Bootstrap 5`, sistema de diseño "The Editorial Omakese") y confirmé algo importante para el video: **el color primario (`#c0392b`) y la tipografía Poppins para títulos definidos en Figma ya están aplicados en el CSS real del proyecto** (`src/index.css` y `index.html`). Esto es evidencia concreta y verificable de coherencia C5, no hay que inventar nada.
>
> Figma tiene **4 pantallas diseñadas**: Home, Menú, Iniciar Sesión y Crear Cuenta. Checkout, carrito, cajero, despachador y admin **no tienen mockup individual en Figma** — se construyeron directamente en código reutilizando el mismo sistema de diseño (colores, tipografía, forma de los componentes). Esto no es una debilidad si lo explican bien en el video: es una decisión de alcance razonable, y así la planteamos en la Parte 6.
>
> **Quedan 3 bloques marcados con 🟡**, todos sobre Taiga — no tengo acceso a esa herramienta, así que no puedo escribir el contenido específico de sus historias. Todo lo demás (Figma, arquitectura, demo del software, reportería) ya está escrito con el estado real y verificado del sistema.

---

## ANTES DE GRABAR — Checklist

- [ ] Backend corriendo (`cd backend && npm run start:dev`) y base de datos con datos limpios (ver `backend/README.md`, sección "Resetear la base de datos a un estado limpio").
- [ ] Frontend corriendo (`npm run dev`), con `VITE_API_URL` apuntando al backend.
- [ ] Los 5 usuarios demo creados y probados (ver tabla de credenciales al final de este documento).
- [ ] Taiga.io actualizado: historias de esta unidad con criterios de aceptación, tablero reflejando qué está "Terminado".
- [ ] Proyecto de Figma abierto y accesible (`Fukusuke Sushi Delivery – Rediseño Bootstrap 5`), con las 4 pantallas visibles: Home, Menú, Iniciar Sesión, Crear Cuenta.
- [ ] Pestañas del navegador abiertas y listas: Taiga, Figma, `BackEnd-Arquitectura.md` (en GitHub o VS Code con preview), la app corriendo en `localhost:5173`.
- [ ] Decidido quién presenta cada bloque (sugerencia de reparto al final).
- [ ] Volumen de micrófono y tamaño de fuente de pantalla/terminal probados.

---

## PARTE 1 — Portada y Contexto (Criterio C1 — 10%)
**Tiempo sugerido: 1 minuto**

### [PANTALLA]
Portada con nombre del proyecto "Fukusuke", integrantes del grupo, "Unidad 3 — Integración del sistema".

### [DICE]
> "Hola, somos el equipo de Fukusuke. Fukusuke es una plataforma de pedidos de sushi a domicilio: un cliente arma su pedido desde el catálogo, lo paga en línea, un cajero confirma la venta, un despachador lo entrega, y el administrador supervisa todo el negocio con reportería en tiempo real.
>
> El problema que resolvemos no es solo 'vender sushi por internet' — es coordinar **cuatro roles distintos que operan sobre el mismo pedido en momentos distintos**: el cliente lo crea y lo paga, el cajero lo confirma y lo envía a cocina, el despachador lo entrega, y el administrador necesita visibilidad de todo esto para tomar decisiones de negocio. Esa coordinación entre roles, en tiempo real y sin que un módulo dependa rígidamente de otro, es el eje de nuestra arquitectura."

---

## PARTE 2 — Propuesta técnica y metodológica (Criterio C2 — 10%)
**Tiempo sugerido: 1.5 minutos**

### [PANTALLA] — Arquitectura
Abrir `BackEnd-Arquitectura.md` → sección **1.1 Microservicios Identificados** (tabla de 8 servicios) y **1.2 Vista General de la Arquitectura** (diagrama).

### [DICE]
> "Construimos el backend como 8 microservicios en NestJS con PostgreSQL: `auth`, `users`, `products`, `cart`, `orders`, `payments`, `notifications` y `reports`. Cada uno tiene una responsabilidad única y su propia tabla — ningún servicio importa entidades de otro.
>
> La comunicación es de dos tipos: **síncrona**, solo entre `orders` y `payments` cuando el cliente paga al momento de crear el pedido; y **asíncrona por eventos**, cuando `orders` avisa que un pedido cambió de estado y `notifications`/`reports` reaccionan sin que `orders` sepa que existen. El frontend es React + TypeScript + Vite, conectado a esta API real — no hay datos simulados en ningún flujo."

### 🟡 [PANTALLA] — Taiga.io (completar con su tablero real)
> **Aquí ustedes muestran:** el tablero de Taiga.io de esta unidad — épicas, historias de usuario, criterios de aceptación, y las iteraciones/sprints que usaron para organizar el trabajo.

### [DICE] (adaptar a lo que muestren)
> "En Taiga organizamos el trabajo en [N] épicas: por ejemplo, 'Checkout y pagos', 'Panel de administración', 'Reportería'. Cada historia tiene criterios de aceptación concretos — por ejemplo, la historia 'Como cliente quiero pagar mi pedido con tarjeta' tiene como criterio que el pago se valide contra el backend real y el pedido cambie de estado automáticamente."

### [PANTALLA] — Diseño en Figma
Abrir el proyecto de Figma **"Fukusuke Sushi Delivery – Rediseño Bootstrap 5"**. Mostrar el sistema de diseño (paleta de colores, tipografía) y recorrer rápido las 4 pantallas: **Home**, **Nuestro Menú**, **Iniciar Sesión**, **Crear Cuenta**.

### [DICE]
> "Antes de programar, diseñamos en Figma un sistema de diseño al que llamamos 'The Editorial Omakese' — buscábamos alejarnos de la estética típica de 'delivery rápido' y acercarnos a algo más premium, como una revista editorial: rojo imperial como color principal, tipografía Poppins para los títulos, mucho espacio en blanco. Prototipamos 4 pantallas clave: Home, Menú, Login y Crear Cuenta.
>
> Esto no se quedó en el papel: el color primario `#c0392b` y la tipografía Poppins para encabezados están literalmente en el CSS del proyecto real — no los volvimos a elegir en el código, los trajimos directo del sistema de diseño de Figma."

---

## PARTE 3 — Demostración del software funcionando (Criterio C3 — 15%)
**Tiempo sugerido: 3-4 minutos — el flujo debe ser continuo, de punta a punta, sin cortes entre backend y frontend.**

### [PANTALLA] → [DICE], en este orden:

**1. Login como cliente**
Ir a `/login`, entrar con `cliente@fukusuke.cl` / `Fukusuke2026`.
> "Empezamos como cliente. El login es real: el backend valida la contraseña con bcrypt y devuelve un JWT — no hay sesión simulada."

**2. Menú**
Ir a `/menu`. Mostrar que hay productos reales, filtrar por categoría.
> "Este menú no es un array hardcodeado en el frontend: viene de `GET /api/products` contra la base de datos real. Los 17 productos y 5 categorías están sembrados en el backend."

**3. Carrito**
Agregar 2-3 productos, abrir el drawer del carrito.
> "Cada vez que agrego un producto, se llama a `POST /api/cart/items` — el carrito vive en el backend, asociado a mi usuario. Si cierro sesión y vuelvo a entrar, sigue ahí."

**4. Checkout — pago real**
Ir a `/checkout`, completar dirección (comuna **Maipú** — tiene cobertura), elegir "Tarjeta", click en **"Perfil de éxito"**, pagar.
> "Acá está el corazón del flujo: al pagar, el frontend manda los datos de la tarjeta al backend en el mismo request que crea el pedido. El backend usa un patrón Strategy para procesar el pago — vamos a volver a esto en la sección de trazabilidad. El pedido pasa a estado 'pagado' automáticamente, sin que nosotros lo forcemos desde el frontend."

**5. (Opcional, si el tiempo lo permite) Perfil de fracaso**
Repetir el checkout con "Perfil de fracaso".
> "Si el pago falla, no es una animación de mentira: el backend realmente rechaza el pago porque faltan datos válidos de la tarjeta, y el pedido queda pendiente en vez de pagado."

**6. Mis pedidos**
Ir a `/orders`. Mostrar el pedido recién creado.

**7. Cambiar de rol — Cajero**
Cerrar sesión, entrar con `cajero@fukusuke.cl` / `Fukusuke2026`, ir a `/cashier`.
> "El cajero ve los pedidos pagados y los envía a preparación. Este botón llama a `PATCH /api/orders/:id/status` — el backend valida que la transición 'pagado → preparando' sea válida según la máquina de estados, y que el rol cajero tenga permiso para hacerla."

**8. Cambiar de rol — Despachador**
Entrar con `despachador@fukusuke.cl` / `Fukusuke2026`, ir a `/dispatcher`.
> "El despachador mueve el pedido de 'preparando' a 'en camino' y luego a 'entregado'. Cada rol solo puede hacer las transiciones que le corresponden — esto está validado en el backend, no es solo una restricción visual del frontend."

**9. Cambiar de rol — Admin**
Entrar con `admin@fukusuke.cl` / `Fukusuke2026`, ir a `/admin`. Recorrer brevemente las pestañas: Productos, Usuarios, Pedidos.
> "El panel de administración tiene CRUD real de productos, gestión de usuarios — crear cuentas, cambiar roles, activar o desactivar — y una vista de todos los pedidos del sistema."

---

## PARTE 4 — Cumplimiento de Taiga.io (Criterio C4 — 10%)
**Se puede narrar junto con la Parte 3, sin cortar la demo — ver nota abajo.**

### 🟡 [PANTALLA] (completar)
> **Aquí ustedes muestran:** el mismo tablero de Taiga, ahora con el foco en el estado de las tarjetas — cuáles están "Terminado" y corresponden exactamente a lo que acaban de demostrar.

### [DICE]
> "Todo lo que acabamos de mostrar — checkout con pago real, cajero, despachador, panel de admin — corresponde a historias que están marcadas como 'Terminado' en Taiga. [Señalar 2-3 historias específicas y decir en qué parte de la demo se vieron]."

---

## PARTE 5 — Reportería con Chart.js (Criterio C8 — 15%)
**Tiempo sugerido: 1.5 minutos**

### [PANTALLA]
Seguir en `/admin` con el usuario admin, ir a la pestaña **Reportes**.

### [DICE]
> "Este gráfico de barras usa Chart.js, y consume datos reales del endpoint `GET /api/reports/current` — no hay números de ejemplo. Cada vez que un pedido se paga, `order-service` emite un evento `order.paid`, y `report-service` lo escucha y actualiza automáticamente las ventas del día correspondiente, sin que `orders` sepa que `reports` existe.
>
> [Si alcanzan a repetir un pago en vivo antes de esta parte:] Recién pagamos un pedido — si refrescamos este gráfico, la venta ya aparece reflejada en el día de hoy. Eso es lo que pide la rúbrica: reportería que apoye la toma de decisiones sobre datos reales, no ilustrativos."

---

## PARTE 6 — Trazabilidad e integración global (Criterio C7 — 20%, el de mayor peso)
**Tiempo sugerido: 3 minutos. Esta es la parte más importante del video — vale el doble que cualquier otro criterio individual.**

La rúbrica pide tomar **al menos una historia** y seguirla por los 4 artefactos. Usamos **"Crear cuenta"**, porque es la que tiene mockup propio en Figma y una decisión de arquitectura bien documentada detrás — no hay que inventar ni forzar nada.

### 🟡 [PANTALLA] — Taiga (completar)
> Mostrar la historia "Como visitante quiero crear una cuenta para poder comprar" (o el nombre que le hayan dado) con su criterio de aceptación en Taiga.

### [PANTALLA] — Figma (ya verificado, pantalla real)
Abrir la pantalla **"Crear Cuenta - Fukusuke"** en el proyecto de Figma.

### [PANTALLA] — Backend (referencias reales)
Abrir `BackEnd-Arquitectura.md` → sección **Decisión 2 — Separar auth-service de user-service**.

### [DICE]
> "En Figma diseñamos la pantalla de registro con el mismo sistema 'Editorial Omakese'. Al implementarla, surgió una decisión de arquitectura que no se ve en el mockup pero sí en el diagrama de clases: cuando alguien crea una cuenta, en realidad se están creando **dos registros en dos microservicios distintos** — la credencial (email, contraseña, rol) en `auth-service`, y el perfil (nombre, RUN, dirección) en `user-service`.
>
> La pregunta de diseño fue: ¿debería `auth-service` crear el perfil directamente, importando la entidad `UserProfile`? Lo descartamos — eso rompería la regla de que ningún microservicio accede a las tablas de otro. La solución fue que `auth-service` **delegue** la creación del perfil llamando a un método de `UsersService` (`createProfile`), sin importar jamás la entidad. Eso está documentado en la Decisión 2 de nuestro backend, y es exactamente lo que se ejecuta cuando alguien completa este formulario."

### [PANTALLA] — Software (demo en vivo)
Ir a `/register`, completar el formulario y crear una cuenta nueva en vivo.
> "Esto es lo que acabamos de explicar, funcionando: un solo formulario, un solo click, y por debajo dos microservicios coordinándose sin acoplarse."

### [DICE] — Nota sobre las pantallas sin mockup propio (justificación de decisión, no debilidad)
> "Vale aclarar algo: en Figma diseñamos 4 pantallas — Home, Menú, Login y Crear Cuenta. Checkout, el panel de cajero, despachador y administración **no tienen un mockup individual**. La decisión fue priorizar el tiempo de diseño en las pantallas de primer contacto con el usuario, y para el resto extender directamente en código el mismo sistema de diseño — mismo color primario, misma tipografía, mismos componentes de Bootstrap ya estilados. No es que esas pantallas queden 'sin diseño': heredan el mismo lenguaje visual, solo que no pasaron por un mockup separado antes de programarse."

### [DICE] — Cierre de la trazabilidad
> "Entonces: la historia nace en Taiga, se diseña en Figma, se implementa respetando el límite entre microservicios documentado en el diagrama de clases, y funciona en vivo en el software — los cuatro artefactos cuentan la misma historia."

---

## PARTE 7 — Amenazas, limitaciones y proyección
**Tiempo sugerido: 1 minuto**

### [DICE]
> "Algunas cosas quedaron fuera del alcance de esta unidad: no implementamos un módulo de ayuda en línea ni manuales de usuario estructurados. El envío de boletas usa EmailJS como proveedor de correo, que es suficiente para la demo pero no para producción.
>
> Un supuesto importante: en este proyecto académico, el registro permite auto-asignarse cualquier rol — cliente, cajero, despachador o admin — para poder demostrar los cuatro flujos sin depender de un administrador que invite manualmente a cada usuario. En un sistema productivo, la creación de cuentas de staff requeriría que un administrador ya existente las cree, tal como permite hoy nuestro panel de administración.
>
> Como siguientes pasos: desplegar a Railway y Vercel para tener una URL pública, y agregar tests automatizados de frontend — hoy la cobertura de tests está solo en el backend, con 113 tests unitarios pasando."

---

## Cierre

### [DICE]
> "Eso fue Fukusuke: un sistema donde Taiga, Figma, la arquitectura de microservicios y el software funcionando cuentan la misma historia, con reportería real apoyando la toma de decisiones. Gracias."

---

## Sugerencia de reparto (ajustar al tamaño real del equipo)

| Bloque | Duración | Quién |
|---|---|---|
| Portada + Contexto (Parte 1) | 1 min | Integrante 1 |
| Propuesta técnica + Taiga (Parte 2) | 1.5 min | Integrante 2 |
| Demo software (Parte 3) | 3-4 min | Integrante 3 (idealmente quien más maneja la app) |
| Cumplimiento Taiga (Parte 4) | integrado en Parte 3 | Integrante 2 o 3 |
| Reportería (Parte 5) | 1.5 min | Integrante 4 |
| Trazabilidad (Parte 6) — la más importante | 3 min | Todo el equipo puede intervenir aquí: uno muestra Taiga, otro Figma, otro el backend, otro el software |
| Limitaciones + cierre (Parte 7) | 1 min | Integrante 1 |

Si el equipo es de menos personas, combinen bloques — lo importante es que **todos hablen en algún momento**, tal como exige la rúbrica.

---

## Referencia rápida — credenciales demo

Contraseña para los 5: **`Fukusuke2026`**

| Rol | Email | Para mostrar |
|---|---|---|
| Cliente | `cliente@fukusuke.cl` | Menú, carrito, checkout, mis pedidos |
| Cajero | `cajero@fukusuke.cl` | `/cashier` — procesar venta pagada → preparando |
| Despachador | `despachador@fukusuke.cl` | `/dispatcher` — preparando → en camino → entregado |
| Admin | `admin@fukusuke.cl` | `/admin` — productos, usuarios, pedidos, reportes |
| Dueño | `dueno@fukusuke.cl` | Mismos permisos que admin |

Antes de grabar, revisen `backend/README.md` → sección "Resetear la base de datos a un estado limpio" para partir con datos frescos y no mostrar pedidos de pruebas viejas.
