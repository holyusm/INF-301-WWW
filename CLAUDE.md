# Reglas del Proyecto — Fukusuke

Este documento define las convenciones y reglas que se deben respetar al trabajar en este repositorio. Cualquier cambio debe alinearse con estas reglas.

---

## 1. Estructura del repositorio

```
/                  ← Frontend (React + Vite + TypeScript)
  src/             ← Código fuente del frontend
  public/          ← Assets estáticos
/backend           ← Backend (NestJS + TypeORM + PostgreSQL)
  src/             ← Microservicios organizados por módulo
BackEnd-Arquitectura.md  ← Documento de arquitectura (debe quedar alineado con el código)
BackEnd.md               ← Rúbrica de evaluación
```

El **frontend** (Vite + React) vive en la raíz. El **backend** (NestJS) vive en `/backend`. No mezclar archivos entre los dos.

---

## 2. Seguridad — qué NUNCA se commitea

- **Variables de entorno reales:** `.env`, `.env.local`, `.env.production`, ningún archivo `.env*` excepto `.env.example`.
- **Llaves y certificados:** `*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx`, `*.jks`.
- **Credenciales en JSON:** `secrets.json`, `credentials.json`, `service-account-*.json`, cualquier `*-credentials.*`.
- **Tokens, API keys o secrets** dentro de código fuente. Usar `process.env.X` y documentar la variable en `.env.example`.
- **Dumps de base de datos:** `*.sqlite`, `*.db`, `*.dump`, `dump.sql`.
- **Configuración de IDE personal:** `.vscode/`, `.idea/`, archivos `*.swp`.
- **Cachés y artefactos compilados:** `dist/`, `build/`, `*.tsbuildinfo`, `coverage/`, `vite.config.js` (generado desde `.ts`).
- **Configuración de asistentes IA locales:** `.claude/`, `.cursor/`, `.aider*`.

Si necesitas documentar variables nuevas:
- Variables del **backend** → `backend/.env.example`
- Variables del **frontend** → `.env.example` en la raíz

Nunca al `.env` real ni a ningún archivo `.env.local`.

---

## 3. Backend — reglas técnicas

### Antes de cualquier commit en `/backend`

```bash
cd backend
npm run build        # debe compilar sin errores TypeScript
npm test             # los 106 tests deben pasar
```

Si rompes algo, **no commitees** — investiga y arregla la causa raíz. No uses `--no-verify` ni cambios que solo silencian el problema.

### Arquitectura — invariantes que no se rompen

1. **Cada módulo es un microservicio lógico.** Ningún módulo importa entidades de otro. Los 8 módulos son: `auth`, `users`, `products`, `cart`, `orders`, `payments`, `notifications`, `reports`.

2. **Excepción documentada:** `auth` accede a `UserProfile` (de `users/`) y `Credential` (propia) directamente, porque el registro debe crear ambas en una transacción. Esta dependencia está justificada en `BackEnd-Arquitectura.md` Decisión 2.

3. **Comunicación entre módulos:**
   - **Síncrona (REST):** solo `orders → payments` cuando el cliente envía `paymentData` en `POST /api/orders`.
   - **Asíncrona (eventos):** `orders` emite `order.created`, `order.paid`, `order.status_changed`, `order.cancelled` vía `@nestjs/event-emitter`. `notifications` y `reports` reaccionan con `@OnEvent`.
   - Cualquier nueva comunicación entre módulos debe favorecer eventos asíncronos sobre llamadas directas.

4. **Roles de usuario:** usar `UserRole` desde `auth/entities/credential.entity.ts`. El enum `Role` en `auth/enums/role.enum.ts` es equivalente y se mantiene por compatibilidad con los `@Roles()` decorators existentes.

5. **Strategy Pattern en pagos:** agregar un nuevo método de pago = crear una subclase de `PaymentMethod`. **No** agregar `if/else` en `PaymentsService`.

6. **Máquina de estados de Order:** las transiciones válidas están en `VALID_TRANSITIONS` y los roles permitidos en `ROLE_ALLOWED_TARGETS` dentro de `orders.service.ts`. Cambios al flujo deben actualizar ambos mapas + agregar tests.

### Documento de arquitectura

`BackEnd-Arquitectura.md` debe quedar **siempre alineado** con el código real. Si cambias estructura de entidades, eventos, dependencias entre módulos, o agregas/eliminas endpoints relevantes, actualiza el documento en el mismo commit o uno inmediatamente posterior.

---

## 4. Convenciones de commit

Formato: `tipo(scope): descripción en español` — ej. `feat(backend): integra payment-service en order-service`.

Tipos usados en este repo:
- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `refactor`: cambio interno sin alterar comportamiento externo
- `docs`: solo documentación
- `chore`: tareas auxiliares (gitignore, deps, limpieza)
- `test`: solo tests

Mensaje en español. Cuerpo del commit puede listar cambios concretos con bullets.

---

## 5. Estilo de código

- **No agregar comentarios obvios.** El código bien nombrado se autodocumenta.
- **No introducir abstracciones especulativas.** Si hay una sola implementación, no inventes una interfaz para un futuro hipotético.
- **No agregar try/catch defensivos** en funciones internas. Validar solo en las fronteras (DTOs de entrada, llamadas externas).
- **Reusar primero, crear después.** Revisar si existe ya el helper antes de escribir uno nuevo.
- **Tests con repositorios mockeados** mediante `getRepositoryToken(Entity)` — no usar base de datos real en tests unitarios.

---

## 6. Frontend — reglas básicas

- Componentes en `src/components/`, páginas en `src/pages/`.
- Estilos con Bootstrap + clases custom; no agregar nuevos frameworks de CSS sin discutir.
- No hardcodear URLs del backend — usar variable de entorno `VITE_API_URL` (definir en `.env.local`, nunca commitear).
- Build de producción: `npm run build` en la raíz → genera `dist/` (ignorado en git).

---

## 7. Despliegue

### Backend → Railway
- Archivo de configuración: `backend/railway.json`
- Variables de entorno requeridas en el dashboard de Railway:
  - `DATABASE_URL` — generada automáticamente por el plugin PostgreSQL de Railway
  - `JWT_SECRET` — string largo y aleatorio
  - `JWT_EXPIRES_IN` — ej. `7d`
  - `NODE_ENV` — `production`
- Comando de inicio: `npm run start:prod`
- La BD se sincroniza automáticamente en el primer arranque (`synchronize` activo solo en producción si `NODE_ENV !== production`).

### Frontend → Vercel
- Archivo de configuración: `vercel.json` en la raíz
- Variables de entorno requeridas en el dashboard de Vercel:
  - `VITE_API_URL` — URL del backend en Railway, ej. `https://fukusuke-api.up.railway.app/api`
  - `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY` — si se usa EmailJS
  - `VITE_ABSTRACT_API_KEY` — si se usa validación de email
- Directorio de salida: `dist/`
- Framework: Vite

---

## 8. Antes de cerrar una tarea

- [ ] Tests pasan (`backend`: `npm test` → 106 ok)
- [ ] Build limpio: `backend/npm run build` (TypeScript) y `npm run build` en raíz (Vite)
- [ ] Sin archivos sensibles en el commit (revisar `git status` antes de `git add`)
- [ ] `BackEnd-Arquitectura.md` actualizado si tocaste arquitectura
- [ ] Mensaje de commit en formato `tipo(scope): descripción`
