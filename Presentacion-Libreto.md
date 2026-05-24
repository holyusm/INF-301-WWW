# Libreto de Presentación — Segunda Entrega BackEnd Fukusuke
### Diseño de Microservicios

> **Para el presentador:** Este documento es tu guía completa. Cada sección indica qué mostrar en pantalla (`[PANTALLA]`) y qué decir (`[DICE]`). Lee el libreto con naturalidad, no como un texto. Tiempo total estimado: **20–25 minutos**.

---

## ANTES DE COMENZAR — Checklist

- [ ] Abrir el repositorio en GitHub: `github.com/matiasbarrazah/INF-301-WWW`
- [ ] Tener abierto VS Code con el proyecto backend
- [ ] Tener una terminal en la carpeta `/backend` lista
- [ ] Tener abierto el documento `BackEnd-Arquitectura.md` (en GitHub o VS Code con preview Markdown)
- [ ] Servidor levantado (`npm run start:dev`) si se va a hacer el demo de Swagger
- [ ] Aumentar el tamaño de fuente de la terminal antes de mostrar

---

## PARTE 1 — Introducción (2 minutos)

### Slide 1: Portada

**[PANTALLA]** Mostrar la portada: nombre del proyecto "Fukusuke", integrantes del grupo, "Segunda Entrega — Diseño de Microservicios Backend".

**[DICE]**
> "Buenas tardes. Vamos a presentar la segunda entrega de nuestro proyecto, que corresponde al diseño e implementación del backend de Fukusuke, una plataforma de pedidos de sushi en línea.
>
> En esta entrega nos enfocamos en el diseño arquitectónico del backend usando una arquitectura de microservicios. La implementación está hecha en NestJS con TypeORM y PostgreSQL, y lo que vamos a mostrar hoy no es solo el código, sino las decisiones que tomamos, las alternativas que consideramos y por qué elegimos cada una."

---

### Slide 2: ¿Qué es Fukusuke?

**[PANTALLA]** Mostrar un esquema simple: cliente web → backend → base de datos. O mostrar el README.md del proyecto.

**[DICE]**
> "Fukusuke es una tienda de sushi que tiene clientes que hacen pedidos en línea, cajeros que los procesan, despachadores que los envían y administradores que ven reportes. El backend tiene que manejar toda esta lógica.
>
> Para esta entrega diseñamos el backend completo dividido en **8 microservicios**, cada uno con una responsabilidad específica. Ahora vamos a recorrer cada criterio de la rúbrica."

---

## PARTE 2 — Criterio 1: Diagrama de Clases y Microservicios (3 minutos)
**(15 puntos)**

### Slide 3: Vista general de los 8 microservicios

**[PANTALLA]** Abrir `BackEnd-Arquitectura.md` en GitHub → sección **1.1 Microservicios Identificados** (la tabla de 8 servicios).

**[DICE]**
> "Identificamos 8 microservicios. Cada uno tiene una sola responsabilidad y fronteras claras:
>
> — `auth-service`: login, registro y emisión de tokens JWT.
> — `user-service`: perfil del usuario y sus direcciones de despacho.
> — `product-service`: catálogo de productos y categorías.
> — `cart-service`: el carrito de compras, que es un estado temporal por usuario.
> — `order-service`: el ciclo de vida completo del pedido.
> — `payment-service`: el procesamiento del cobro, independiente de los pedidos.
> — `notification-service`: registra notificaciones cuando ocurren eventos de pedidos.
> — `report-service`: acumula ventas y genera reportes semanales para el administrador.
>
> El criterio clave fue que **cada servicio cambia por razones distintas**. Si el equipo de marketing cambia cómo funciona el catálogo, no debería tocar nada del módulo de pagos."

---

### Slide 4: Diagrama de arquitectura general

**[PANTALLA]** Bajar en `BackEnd-Arquitectura.md` → sección **1.2 Vista General** — mostrar el diagrama Mermaid flowchart que se renderiza en GitHub.

**[DICE]**
> "Este diagrama muestra cómo se comunican los servicios. En azul está la comunicación síncrona REST — cuando el cliente crea un pedido y el resultado importa inmediatamente. En verde está la comunicación asíncrona por eventos — cuando `order-service` le avisa a `notification-service` y `report-service` que algo ocurrió, pero no espera respuesta.
>
> La base de datos es PostgreSQL compartida a nivel de conexión, pero cada servicio gestiona **solo sus propias tablas** — nunca consulta las tablas de otro módulo. Esto es lo que llamamos Database per Service como separación lógica."

---

### Slide 5: Diagrama de clases del dominio

**[PANTALLA]** Bajar en `BackEnd-Arquitectura.md` → sección **1.3 Diagrama de Clases del Dominio** — mostrar el classDiagram Mermaid.

**[DICE]**
> "Aquí están todas las entidades del sistema con sus atributos y relaciones. Pueden ver que separamos `Credential` de `UserProfile` — las credenciales de autenticación van en una tabla, y los datos del perfil del usuario en otra. Esto lo vamos a justificar en detalle más adelante cuando hablemos de las decisiones arquitectónicas."

---

## PARTE 3 — Criterio 2: Relaciones, Composición y Herencia (3 minutos)
**(10 puntos)**

### Slide 6: Composición

**[PANTALLA]** Sección **2.1 Composición** del documento.

**[DICE]**
> "Usamos **composición** — rombo relleno — cuando el hijo no tiene sentido sin el padre. Tres casos:
>
> Primero, `Order ◆── OrderItem`: un ítem de pedido es parte del pedido. Si borramos el pedido, los ítems desaparecen. Además el precio que guarda es el precio histórico de esa compra específica, no un dato reutilizable.
>
> Segundo, `Cart ◆── CartItem`: el ítem del carrito no existe fuera del carrito.
>
> Tercero, `WeeklyReport ◆── DailySales`: los datos diarios solo existen para construir el reporte semanal."

---

### Slide 7: Agregación

**[PANTALLA]** Sección **2.2 Agregación** del documento.

**[DICE]**
> "Usamos **agregación** — rombo vacío — para `UserProfile ◇── SavedAddress`. Las direcciones de despacho son entidades con vida propia: el usuario puede agregar y eliminar cada una por separado, puede tener cero o varias. No dependen del perfil para existir.
>
> Importante: en el código esta relación se implementa mediante el campo `userId` en `SavedAddress`, sin clave foránea TypeORM. Esto mantiene la independencia entre el módulo `users` y cualquier otro que eventualmente consulte direcciones."

---

### Slide 8: Herencia en PaymentMethod

**[PANTALLA]** Sección **1.10 Diagrama Interno — payment-service** del documento, que muestra la jerarquía de herencia.

**[DICE]**
> "La **herencia** la aplicamos en el patrón Strategy para los métodos de pago. `PaymentMethod` es una clase abstracta con los métodos `process()` y `validate()`. Tiene tres subclases concretas: `CreditCardPayment`, `ServipagPayment` y `BankTransferPayment`.
>
> La ventaja: si el día de mañana se agrega Webpay Plus, simplemente se crea una cuarta subclase. No se modifica nada del código existente. `PaymentService` solo llama `method.process(amount)` sin importarle qué tipo concreto es — eso es polimorfismo en acción."

---

### Slide 9: Relaciones descartadas

**[PANTALLA]** Sección **2.5 Relaciones descartadas** del documento.

**[DICE]**
> "Estas son las relaciones que **descartamos** y por qué. Por ejemplo, descartamos que `OrderItem` tuviera una referencia directa al `Product` actual. Si el precio del menú cambia mañana, los pedidos históricos mostrarían un precio distinto al que el cliente pagó realmente. Por eso `OrderItem` copia el nombre y precio en el momento de la compra."

---

## PARTE 4 — Criterio 3: Separación de Responsabilidades (2 minutos)
**(15 puntos)**

### Slide 10: Qué hace y qué NO hace cada servicio

**[PANTALLA]** Sección **3.1 Responsabilidades por microservicio** — mostrar la tabla.

**[DICE]**
> "La clave no es solo definir qué hace cada servicio, sino **qué no hace**. Por ejemplo:
>
> `auth-service` maneja tokens y contraseñas, pero **no gestiona el perfil del usuario** — eso es dominio distinto.
>
> `order-service` gestiona el ciclo de vida del pedido, pero **no procesa el pago** y **no envía notificaciones** — esas responsabilidades pertenecen a otros servicios.
>
> `cart-service` mantiene el estado temporal del carrito, pero **no crea pedidos** — su única función es guardar qué quiere el cliente antes de confirmar.
>
> Esta separación es lo que permite que un fallo en `notification-service` no derribe la creación de pedidos."

---

## PARTE 5 — Criterio 4: Estructura Interna de Microservicio (2 minutos)
**(10 puntos)**

### Slide 11: Las 4 capas

**[PANTALLA]** Sección **1.4 Estructura Interna — Patrón aplicado a todos los microservicios**, mostrando el diagrama de 4 capas.

**[DICE]**
> "Todos los microservicios siguen exactamente la misma estructura en cuatro capas:
>
> **Controller**: recibe el request HTTP, valida el token JWT, transforma el body en un DTO y delega al Service.
>
> **Service**: aplica las reglas del dominio — por ejemplo, la máquina de estados del pedido o las restricciones por rol.
>
> **Repository**: abstrae las consultas a la base de datos. El servicio llama `findOne()` o `save()` sin escribir SQL directamente.
>
> **Entity**: define la estructura de la tabla y los métodos de cálculo, como `getSubtotal()` en `OrderItem`.
>
> Esta separación permite, por ejemplo, cambiar el motor de base de datos sin tocar la lógica de negocio."

---

### Slide 12: Ejemplo concreto — order-service

**[PANTALLA]** Abrir en VS Code el archivo `backend/src/orders/orders.service.ts` — mostrar el constructor con las inyecciones y el método `updateStatus`.

**[DICE]**
> "En `order-service` podemos ver esto en concreto. El `OrderService` recibe inyectado el repositorio de TypeORM, el `EventEmitter2` para los eventos, y el `PaymentsService` para la orquestación síncrona. La lógica de la máquina de estados está aquí — verifica si la transición es válida, verifica si el rol del usuario lo permite, y si todo está OK guarda el cambio y emite el evento correspondiente."

---

## PARTE 6 — Criterio 5: Alta Cohesión (2 minutos)
**(10 puntos)**

### Slide 13: Cohesión por servicio

**[PANTALLA]** Sección **5.1 Análisis de cohesión** — mostrar la tabla.

**[DICE]**
> "La cohesión alta significa que todas las clases de un módulo giran en torno al mismo problema. El ejemplo más claro es `payment-service`: tiene el controller, el servicio, el repositorio, la entidad `Payment`, la clase abstracta `PaymentMethod` y sus tres subclases concretas. Todo sin excepción existe para resolver el problema del cobro.
>
> Lo que nos ayudó a mantener la cohesión fue preguntarnos: '¿Si moviera esta clase a otro servicio, dejaría de tener sentido aquí?' Si la respuesta era sí, la clase estaba en el lugar correcto."

---

### Slide 14: Clases movidas para mantener cohesión

**[PANTALLA]** Sección **5.2 Clases movidas** — mostrar la tabla.

**[DICE]**
> "Algunas clases empezaron en un lugar y las movimos. Por ejemplo, `SavedAddress` podría haber estado en `auth-service` junto al `User`, pero las direcciones de despacho son datos del perfil, no datos de autenticación. Las movimos a `user-service` para mantener la cohesión de auth, que solo debe preocuparse de tokens y contraseñas.
>
> Lo mismo con la lógica de reportes: podría haber vivido dentro de `order-service`, pero los reportes tienen un ciclo de actualización distinto y no deben afectar el rendimiento de las operaciones de pedidos."

---

## PARTE 7 — Criterio 6: Bajo Acoplamiento (3 minutos)
**(15 puntos)**

### Slide 15: Diagrama de dependencias

**[PANTALLA]** Sección **6.2 Diagrama de dependencias** — mostrar el flowchart LR con order, payment y el bus de eventos.

**[DICE]**
> "Aquí está el corazón del desacoplamiento. Solo hay **una dependencia síncrona directa** entre servicios: `order-service` llama a `payment-service` cuando el cliente paga en el mismo request, porque el resultado del pago determina si el pedido puede avanzar. No se puede hacer asíncrono porque el usuario necesita saber en el momento si su tarjeta fue aceptada.
>
> Todo lo demás es **asíncrono por eventos**. Cuando un pedido cambia de estado, `order-service` emite un evento — `order.created`, `order.paid`, `order.status_changed` o `order.cancelled` — y no sabe ni le importa quién escucha. `notification-service` y `report-service` reaccionan de forma independiente con decoradores `@OnEvent`. Si mañana se agrega un servicio de analytics, solo tiene que suscribirse al evento — `order-service` no cambia ni una línea."

---

### Slide 16: Ningún módulo importa entidades de otro

**[PANTALLA]** Abrir VS Code → mostrar `backend/src/orders/orders.service.ts` imports (líneas del principio). Luego mostrar `backend/src/notifications/notifications.service.ts` imports.

**[DICE]**
> "Una de las reglas más importantes que nos impusimos fue que **ningún módulo importa entidades de otro módulo**. Si `notification-service` necesita saber el ID del usuario, lo recibe en el payload del evento — no importa la clase `UserProfile`. Si `report-service` necesita saber el monto, lo recibe en el evento — no accede a la tabla `orders`.
>
> Esto significa que podríamos desplegar `notification-service` en un servidor completamente separado sin cambiar nada en su código."

---

## PARTE 8 — Criterio 7: Justificación de Decisiones (6 minutos)
**(25 puntos — el más importante)**

> **[NOTA PARA EL PRESENTADOR]** Este criterio vale el 25% de la nota. Tómense el tiempo necesario aquí. Si hay preguntas, probablemente vengan de esta sección.

---

### Slide 17: Presentación de las decisiones

**[PANTALLA]** Sección **7. Justificaciones Arquitectónicas** del documento — mostrar los títulos de las 8 decisiones.

**[DICE]**
> "Tomamos 8 decisiones arquitectónicas formales, cada una con alternativas consideradas, alternativas descartadas y justificación. Vamos a ver las más importantes."

---

### Slide 18: Decisión 1 — Microservicios vs. Monolito

**[PANTALLA]** Sección **Decisión 1** del documento.

**[DICE]**
> "La primera decisión fue la más fundamental: ¿monolito o microservicios?
>
> Descartamos el monolito porque aunque es más rápido de desarrollar al inicio, no permite escalar partes específicas. El catálogo de productos recibe muchas más consultas que el módulo de reportes — en un monolito ambos escalan juntos aunque uno no lo necesite. Además, un error en notificaciones podría derribar toda la aplicación.
>
> Seleccionamos microservicios porque permite escalar `product-service` de forma independiente, aislar fallos — si `notification-service` falla, los pedidos siguen funcionando — y cada módulo puede evolucionar y probarse de forma autónoma."

---

### Slide 19: Decisión 4 — Separar order-service de payment-service

**[PANTALLA]** Sección **Decisión 4** del documento.

**[DICE]**
> "¿Por qué `payment-service` es independiente de `order-service`?
>
> Descartamos meterlo dentro de `order-service` porque la lógica de pago es sensible y cambia con frecuencia — nuevos medios de pago, cambios regulatorios, integraciones con Transbank o Webpay. Si estuviera mezclado, agregar un nuevo método de pago requeriría tocar el flujo del pedido.
>
> Con la separación, agregar Webpay Plus es simplemente crear una nueva subclase de `PaymentMethod` sin modificar `order-service`. La única conexión entre ellos es una llamada REST en el momento del pago."

---

### Slide 20: Decisión 5 — Herencia en PaymentMethod

**[PANTALLA]** Sección **Decisión 5** del documento. Opcionalmente mostrar en VS Code el archivo `backend/src/payments/methods/`.

**[DICE]**
> "Dentro de `payment-service`, teníamos dos opciones para modelar los tres métodos de pago.
>
> La Alternativa A era un campo genérico con un `switch/case`: 'si es tarjeta haz esto, si es Servipag haz lo otro'. Se descarta porque concentra toda la lógica en un solo lugar — cada nuevo método requiere modificar ese `switch` existente, aumentando el riesgo de errores.
>
> La Alternativa B — la que elegimos — es la clase abstracta `PaymentMethod` con `process()` y `validate()` y tres subclases concretas. `PaymentService` llama `method.process(amount)` y no sabe qué tipo concreto es. Agregar un método nuevo es solo crear una subclase nueva. Este es el Principio Open/Closed: abierto para extensión, cerrado para modificación."

---

### Slide 21: Decisión 7 — Bus de eventos asíncrono

**[PANTALLA]** Sección **Decisión 7** del documento. Opcionalmente mostrar en VS Code `backend/src/notifications/notifications.service.ts` los decoradores `@OnEvent`.

**[DICE]**
> "¿Por qué usar eventos asíncronos para notificaciones y reportes en lugar de llamadas REST directas?
>
> Si `order-service` llamara directamente a `notification-service` antes de responder al cliente, un fallo o demora en el envío del correo haría fallar la creación del pedido. El cliente no pudo hacer su pedido porque el servidor de correo estaba lento — eso es inaceptable.
>
> Con el bus de eventos, `order-service` emite `order.created` y responde al cliente de inmediato. `notification-service` y `report-service` reaccionan de forma independiente con `@OnEvent`. Si `notification-service` está caído, el pedido igual se crea. Cuando vuelva a funcionar, los eventos pendientes se procesan. Además, `order-service` no sabe que esos servicios existen — no tiene import ni referencia a ellos en ninguna parte del código."

---

### Slide 22: Decisión 8 — Database per Service

**[PANTALLA]** Sección **Decisión 8** del documento.

**[DICE]**
> "La estrategia de base de datos fue también importante. En la implementación actual todos los módulos comparten una conexión PostgreSQL única — porque es un MVP académico — pero cada módulo gestiona **exclusivamente sus propias tablas** mediante `TypeOrmModule.forFeature([...])`. Ningún servicio consulta las tablas de otro.
>
> Esto nos da la separación lógica de Database per Service. Migrar a conexiones físicamente separadas en el futuro — por ejemplo, usar Redis para el carrito o una BD dedicada para reportes — solo requiere cambiar la configuración de conexión en `TypeOrmModule.forRootAsync`. No hay que cambiar la lógica de negocio."

---

## PARTE 9 — Demo en vivo (2 minutos)

> **[NOTA PARA EL PRESENTADOR]** Esta parte es opcional pero muy impactante. Si hay conexión a internet y el servidor está levantado, muéstrala. Si no, muestra la sección 8 del documento con la tabla de tests.

---

### Demo A: Tests pasando

**[PANTALLA]** Abrir terminal en `/backend`. Ejecutar:
```bash
npm test
```

**[DICE]**
> "Antes de cada commit verificamos que los tests pasen. Tenemos **106 tests unitarios** distribuidos en 8 suites — uno por módulo. Corren sin base de datos real, usando repositorios simulados. Cada suite respalda una afirmación arquitectónica concreta: por ejemplo, `orders.service.spec.ts` verifica que la máquina de estados rechaza transiciones inválidas y que el control de roles funciona correctamente."

---

### Demo B: Swagger

**[PANTALLA]** Abrir el navegador en `http://localhost:3000/docs`

**[DICE]**
> "El backend expone Swagger en `/docs`. Aquí pueden ver todos los endpoints organizados por módulo, los schemas de los DTOs y los códigos de respuesta. Esto permite que el frontend o cualquier cliente sepa exactamente qué esperar de la API."

---

## PARTE 10 — Cierre (1 minuto)

### Slide final: Resumen

**[PANTALLA]** Mostrar slide de cierre con la tabla de criterios y puntajes esperados, o volver al README del proyecto.

**[DICE]**
> "En resumen, implementamos 8 microservicios con responsabilidades claras y bien justificadas. Las decisiones más relevantes fueron la separación de auth y users en entidades distintas, el patrón Strategy para pagos, el bus de eventos asíncrono para desacoplar notificaciones y reportes, y la estrategia Database per Service a nivel lógico.
>
> Todo está documentado en `BackEnd-Arquitectura.md`, implementado en código y verificado con 106 tests unitarios.
>
> Quedamos abiertos a preguntas."

---

## POSIBLES PREGUNTAS DEL PROFESOR — Y CÓMO RESPONDERLAS

**P: ¿Por qué no usan un API Gateway real como Kong o Traefik?**
> "En la implementación actual el rol de gateway lo cumple el prefijo global `/api` de NestJS más el guard `JwtAuthGuard` aplicado por controlador. Un gateway dedicado es una evolución futura documentada en el documento de arquitectura — para un MVP académico agrega complejidad de despliegue sin valor adicional demostrable."

**P: ¿Por qué todos los microservicios están en el mismo proceso NestJS?**
> "Porque el objetivo de esta entrega es demostrar el diseño arquitectónico — separación de responsabilidades, bajo acoplamiento, alta cohesión — no el despliegue distribuido. La separación lógica está implementada correctamente: módulos independientes, sin imports cruzados de entidades, comunicación por contratos REST y eventos. Desplegar cada módulo en su propio proceso solo requiere extraerlos como apps NestJS separadas, sin cambiar la lógica de negocio."

**P: ¿Por qué `auth-service` accede a la tabla `user_profiles` que pertenece a `user-service`?**
> "Es la única excepción documentada y justificada. Al registrar un usuario hay que crear el perfil y las credenciales en la misma transacción. Si `auth` llamara a `user-service` por REST para crear el perfil, tendríamos un problema de consistencia si una de las dos operaciones falla a mitad. La solución fue que `auth` gestiona directamente ambas tablas en su módulo, lo cual está explicitamente documentado como una excepción justificada en la Decisión 2 del documento."

**P: ¿El patrón Repository en los diagramas existe en el código como clase separada?**
> "No como clase custom — TypeORM nos provee un `Repository<Entity>` genérico inyectado con `@InjectRepository(Entity)`. Los nombres `OrderRepository`, `ProductRepository` en los diagramas representan ese rol arquitectónico. Los diagramas internos reflejan la capa, no necesariamente una clase explícita en el código. Esto está aclarado en la sección 1.4 del documento."

**P: ¿Qué pasa si `payment-service` falla durante la creación del pedido?**
> "Si el pago falla, el pedido queda en estado `pendiente` y el cliente recibe el error. La transición a `pagado` solo ocurre si `PaymentsService.processPayment()` devuelve estado `aprobado`. El pedido siempre se persiste — nunca se deja en un estado inconsistente."

**P: ¿Por qué `SavedAddress` no tiene clave foránea a `user_profiles`?**
> "Porque la separación entre módulos opera a nivel lógico. Si `saved_addresses` tuviera una FK a `user_profiles`, cualquier cambio de esquema en `user_profiles` podría romper la tabla de direcciones por restricciones de integridad referencial. Al usar solo el UUID como campo suelto, ambos módulos pueden evolucionar su esquema independientemente."

---

## ORDEN SUGERIDO DE PANTALLAS

1. Slide portada (hecho en PowerPoint/Canva)
2. Slide estructura del proyecto
3. GitHub → `BackEnd-Arquitectura.md` → **Sección 1.1** (tabla de microservicios)
4. GitHub → `BackEnd-Arquitectura.md` → **Sección 1.2** (diagrama flowchart general)
5. GitHub → `BackEnd-Arquitectura.md` → **Sección 1.3** (diagrama de clases del dominio)
6. GitHub → `BackEnd-Arquitectura.md` → **Sección 2.1–2.5** (relaciones)
7. GitHub → `BackEnd-Arquitectura.md` → **Sección 3.1** (tabla responsabilidades)
8. GitHub → `BackEnd-Arquitectura.md` → **Sección 1.4** (diagrama 4 capas)
9. VS Code → `orders/orders.service.ts` (constructor + updateStatus)
10. GitHub → `BackEnd-Arquitectura.md` → **Sección 5.1** (cohesión)
11. GitHub → `BackEnd-Arquitectura.md` → **Sección 6.2** (diagrama dependencias)
12. VS Code → `orders/orders.service.ts` (imports — sin imports de otros módulos)
13. GitHub → `BackEnd-Arquitectura.md` → **Sección 7** (decisiones 1, 4, 5, 7, 8)
14. VS Code → `notifications/notifications.service.ts` (`@OnEvent` handlers)
15. Terminal → `npm test` (106 tests pasando)
16. Navegador → `http://localhost:3000/docs` (Swagger)
17. Slide cierre
