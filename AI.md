# AI.md — Read This First (AI Agent Entry Point)

> **This is the first file you must read before touching any code.**
> Covers full project context so you can implement features safely without breaking existing architecture, APIs, or behavior.

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **Name** | `barber-app` (backend) + `barber-ui` (frontend, sibling repo) |
| **Purpose** | Barbershop booking platform: customers book appointments with barbers, barbers manage availability/services, admins manage everything |
| **Language** | Persian / RTL primary (`fa`), Vazirmatn font |
| **Backend** | NestJS 11 + TypeORM + SQLite (`better-sqlite3`) file `barber_db` at root |
| **Frontend** | Angular 22 + Ionic 9 standalone, sibling at `D:\projects\barber\barber-ui` (not inside this repo), builds to `www/` |
| **API Base** | `http://localhost:3000`, Swagger at `GET /api` |
| **DB Sync** | `synchronize: NODE_ENV !== 'production'` — auto-sync in dev, migrations not used |

```
D:\projects\barber\
├── barber-app/   ← THIS REPO (backend, you are here)
│   ├── src/
│   ├── public/ (3 jpgs)
│   ├── uploads/avatars/
│   ├── dist/ (compiled)
│   └── barber_db (sqlite file)
└── barber-ui/    ← separate repo (frontend)
    ├── src/app/
    └── www/ (build output)
```

---

## 2. Architecture

- **Monolithic NestJS** — modular by domain (`src/modules/*`), global `ValidationPipe`, `EventEmitter`, `ServeStatic /uploads`, `Swagger`, `CORS`, `Socket.IO`
- **No microservices**, no queue, no cache layer. `EventEmitter` for in-process booking events → notifications.
- **Auth**: JWT Bearer (1d access) + opaque refresh token (7d, sha256 hashed, rotation) + password-reset opaque token (1h, hash, no email — returned directly).
- **DB**: SQLite file, 13 entities, all `uuid` PK, `CASCADE` deletes, `simple-json` for schedules/arrays.
- **Frontend**: Angular standalone lazy `loadComponent`, no NgModules, signals + RxJS + localStorage, Ionic UI, Leaflet maps, RTL hardcoded.

---

## 3. Backend Structure

```
src/
├── main.ts                         # ValidationPipe, CORS, Swagger /api, listen 3000
├── app.module.ts                   # ServeStatic /uploads, EventEmitter, 13 modules, TypeORM
├── config/
│   ├── database.config.ts          # better-sqlite3, DB_DATABASE || 'barber_db', entities glob
│   └── .env                        # example only (DB_*, JWT_SECRET, PORT, CORS_ORIGIN)
├── common/
│   ├── decorators/ {public, roles, current-user}
│   ├── guards/ {auth (JwtAuthGuard), roles (RolesGuard)}
│   ├── filters/                    # exception filters
│   └── interceptors/
├── enums/
│   ├── role.ts      {user,customer,barber,admin,super_admin}
│   ├── appointment-status.ts {pending,confirmed,completed,cancelled,no_show}
│   ├── working-hours.ts  interface {mon..sun: {start,end HH:mm}}
│   └── notification-type.ts {booking_created,confirmed,cancelled,appointment_reminder}
└── modules/
    ├── auth/           # login/register/refresh/logout/forgot/reset/change-password
    ├── users/          # me, avatar, preferences, admin CRUD
    ├── barbershops/    # CRUD (admin)
    ├── barbers/        # CRUD, me, avatar, specialties/workingHours
    ├── barber-service/ # join barber ↔ service (price,duration)
    ├── services/       # CRUD (barber|admin)
    ├── appointments/   # booking core + available-slots
    ├── availability/   # standalone slot generation
    ├── locations/      # address/geo (barber xor user)
    ├── educational/    # video upload 100MB
    ├── certificates/   # barber certificates
    ├── notifications/  # gateway+dispatcher+listener+scheduler
    ├── uploads/        # generic upload
    └── admin/          # dashboard, users/barbers/services/appointments/reports/settings
seed/seed.ts            # wipes 12 tables, seeds 6 users/2 shops/2 barbers/5 services/6 appts
```

Absolute key files:
- `src/main.ts`, `src/app.module.ts`, `src/config/database.config.ts`
- `src/modules/auth/auth.service.ts`, `strategies/jwt.strategy.ts`
- `src/modules/appointments/appointments.service.ts`
- `src/modules/availability/availability.service.ts`
- `src/modules/notifications/notifications.gateway.ts`

---

## 4. Frontend Structure (`barber-ui`)

```
barber-ui/src/
├── main.ts                    # bootstrapApplication + provideRouter + provideIonicAngular + interceptors
├── index.html                 # <html lang="fa" dir="rtl">, Vazirmatn, color-scheme light dark
├── global.scss + theme/variables.scss  # --app-bg #0b101e, --accent #f59e0b, ion-palette-dark toggle
├── app/
│   ├── app.component.ts + app.routes.ts
│   ├── core/
│   │   ├── api/ (12 apis: admin, appointments, availability, barbers, barbershops, certificates, educational, locations, notifications, services, uploads, users + utils)
│   │   ├── services/ {api.service (facade), auth.service (signals+localStorage), theme.service, toast.service, view-role.service}
│   │   ├── guards/ {authGuard, guestGuard, adminGuard, barberGuard}
│   │   ├── interceptors/ {auth, error}, errors/global-error.handler
│   │   ├── i18n/fa.ts (full Persian dict)
│   │   └── models/index.ts
│   ├── layouts/ {app-layout, auth-layout}
│   ├── pages/ (20+): home, barbers, barbershops, services, booking, appointments, appointment/*, barber-detail/*, profile/*, admin, training, documents, addresses, notifications, auth/* (landing/login/register/forgot/reset)
│   ├── shared/components/ {app-sidebar, empty-state, theme-toggle} + shared/ui/ui.ts (7 CVA wrappers: UiInput/Password, UiTextarea, UiSelect, UiDatepicker, UiMultiSelect, UiNumber, UiButton)
│   └── tabs/ {tabs.page, tabs.routes}
└── environments/ {environment.ts, environment.prod.ts} apiUrl http://localhost:3000
```

**Routing** (`app.routes.ts` + `tabs.routes.ts`):
- `''→landing`, `AuthLayout: login|register|forgot|reset (guestGuard)`, `AppLayout: barbershops, barbers, barbers/:id, barber/:id/manage[authGuard], services, appointments[authGuard], notifications[authGuard], profile[authGuard], admin[adminGuard], training`, `tabs: home, appointment, appointment/new, appointment/:id, booking, profile/*, addresses, documents, turns→appointment, etc.`

---

## 5. Modules & Features

| Module | Prefix | Key Features |
|--------|--------|--------------|
| **Auth** | `/auth` | register, login, refresh (rotation), logout, logout-all, forgot-password (invalidate prior, return reset_token), reset-password, change-password, superadmin bootstrap `superadmin/SuperAdmin123!` |
| **Users** | `/users` | `GET/PATCH /me`, `POST /me/avatar` (5MB image → `uploads/avatars`), `GET/PATCH /me/preferences {themePreference}`, admin `GET/POST /users`, `GET /users/:id` |
| **Barbershops** | `/barbershops` | `POST/PATCH/DELETE :id` admin only, `GET /` + `GET /:id` public |
| **Barbers** | `/barbers` | `POST` barber\|admin, `GET /` public `?barbershopId&status&isActive`, `GET /me`, `PATCH /me`, `POST /me/avatar` + `POST /:id/avatar`, `GET /:id` public, `PATCH /:id` owner\|admin, `DELETE` admin |
| **Services** | `/services` | `POST` barber\|admin, `GET /` public `?barberId&barbershopId`, `GET /:id`, `PATCH/DELETE` owner\|admin |
| **Appointments** | `/appointments` | `GET /available-slots` public, `POST /` auth, `GET /` scoped, `GET/PATCH /:id`, `POST /:id/cancel`, `PATCH /:id/status` barber\|admin, `DELETE /:id` |
| **Availability** | `/availability` | `GET /` public `?barberId&date&serviceId` → slots `{time,startTime,endTime,status Available|Booked}`, respects workingDays/Hours/break/holidays |
| **Locations** | `/locations` | `POST` (exactly one `barberId xor userId` + ownership), `GET /` public `?barberId&userId`, `GET /mine|/me|/barber/:id|/user/:id|/:id`, `PATCH/DELETE` owner\|admin |
| **Educational** | `/educational` | `POST` multipart `file` video 100MB (`video/*`), `GET / ?barberId`, `GET /:id`, `PATCH /:id`, `POST /:id/video`, `DELETE` |
| **Certificates** | `/certificates` | `POST`, `GET / ?barberId`, `GET/PATCH/DELETE /:id` |
| **Uploads** | `/uploads` | `POST /` auth any role (`./uploads`, `Date.now()+ext`) |
| **Notifications** | `/notifications` | `GET / ?type&isRead&page&limit`, `GET /unread-count`, `PATCH /read-all`, `PATCH /:id/read`, `POST /reminders/run` admin, WebSocket `/notifications` |
| **Admin** | `/admin` | `GET /dashboard`, `GET/PATCH/DELETE /users/:id`, `GET /users|customers ?page&limit&q`, `GET/PATCH/DELETE /barbers/:id`, `GET /services/:id`, `POST/PATCH/DELETE /services`, `GET/PATCH/POST/DELETE /appointments*`, `GET /reports/summary|reports`, `GET/POST/PATCH/DELETE /settings/:key` — all `Roles(admin,super_admin)` |

---

## 6. Roles & Permissions

**Enums** (`src/enums/role.ts`): `user` < `customer` < `barber` < `admin` < `super_admin`

| Role | Access |
|------|--------|
| **user/customer** | default on register, can book, manage own appointments/profile/locations |
| **barber** | auto-upgraded via `barbers` syncServices or admin, manages own barber profile/services/availability/appointments, `POST /barbers`, `POST /services` |
| **admin** | full CRUD via `/admin/*`, manage barbershops/barbers/services/appointments, `RolesGuard` bypasses checks for `admin|super_admin` |
| **super_admin** | seeded `superadmin / SuperAdmin123! / 0000000000`, same as admin + bootstrap user |

**Guards**:
- `JwtAuthGuard extends AuthGuard('jwt')` — respects `@Public()`
- `RolesGuard` — respects `@Public()` and `@Roles()`, case-insensitive, admin/super_admin bypass any role check
- Frontend: `authGuard`, `guestGuard`, `adminGuard`, `barberGuard` → redirect to `/login` or `/tabs/home`

**Decorators**: `@Public()`, `@Roles(Role.*)`, `@CurrentUser()` returns `req.user`

---

## 7. Authentication & Authorization

- **Strategy**: `passport-jwt`, `ExtractJwt.fromAuthHeaderAsBearerToken()`, `secret = process.env.JWT_SECRET || 'barber_secret'`, `JwtModule expiresIn 1d`, payload `{sub: user.id, username, role}`
- **ValidationPipe global**: `whitelist, forbidNonWhitelisted, transform, enableImplicitConversion`
- **Password**: `bcrypt 10`, `select:false` on entity, sanitize strips password in responses
- **Register**: dedup `username` + `nationalCode unique`, `POST /auth/register @Public`
- **Login**: check `isActive`, `POST /auth/login @Public` → `{access_token, refresh_token, user}`
- **Refresh**: opaque `randomBytes(48).hex`, stored `sha256(token)` in `refresh_tokens`, `expiresAt 7d`, rotation (`revokedAt` + `replacedById`), `POST /auth/refresh @Public {refresh_token}` → new pair, `POST /auth/logout @Public {refresh_token}` revokes single, `POST /auth/logout-all JWT` revokes all `revokedAt IS NULL`
- **Password reset**: `POST /auth/forgot-password @Public {email?,username?}` invalidates prior `usedAt IS NULL`, creates hashed token `expiresAt 1h`, returns `{reset_token}` directly (no email), `POST /auth/reset-password @Public {token,newPassword}` checks `usedAt/expiresAt`, hashes new `bcrypt 10`, `logoutAll`
- **Change password**: `POST /auth/change-password JWT {currentPassword,newPassword}`
- **Seed credentials** (`src/seed/seed.ts`): `superadmin SuperAdmin123!` + `admin/barber1/barber2/customer1/customer2/user1` all `Password123!`

---

## 8. Database Entities & Relationships

All `uuid` PK, `CASCADE` deletes. `better-sqlite3` file `barber_db`.

```
users ─┬─< barbershops (ownerId)
       ├─< barbers (userId)
       ├─< appointments (userId)
       ├─< refresh_tokens
       ├─< password_reset_tokens
       ├─< locations (userId nullable)
       └─< notifications

barbershops ─< barbers ─┬─< barber_services >─ services
                        ├─< appointments >─ services (also barbershopId?)
                        ├─< locations (barberId unique)
                        ├─< educationals
                        └─< certificates

barbers fields: fullName, bio?, profileImage?, specialties string[], workingDays string[], workingHours json {mon..sun:{start,end HH:mm}}, breakTime json (global or per-day), holidays string[], status active|inactive, isAvailable, isActive
services: name, description?, price decimal 10,2, duration int, icon?, barberId FK, barbershopId? FK
appointments: date text, startTime text, endTime text, status pending|confirmed|completed|cancelled|no_show default pending, notes?, userId, barberId, serviceId
locations: address, label?, latitude decimal 10,8, longitude 11,8, mapMetadata json?, barberId unique nullable, userId nullable (xor)
notifications: userId, type, title, body, data json?, appointmentId?, isRead, readAt?, createdAt
settings: key unique, value?, description?
```

**Relations**:
- `User 1──N Barbershop`, `User 1──N Barber`, `User 1──N Appointment`
- `Barbershop 1──N Barber`, `Barbershop 1──N Service`
- `Barber N──N Service` via `barber_services` (extra `price, duration`), `Barber 1──N Appointment`, `Barber 1──1 Location` (unique)
- `Service 1──N Appointment`

---

## 9. API Structure & Conventions

- **Global**: `ValidationPipe`, `Swagger BearerAuth @ /api`, `ServeStatic /uploads → /uploads`, `CORS origin = CORS_ORIGIN?.split(',') ?? true`
- **DTOs**: `class-validator` + `class-transformer`, `ParseUUIDPipe` on `:id`
- **Controllers**: Swagger tags per controller, `@Public()` for open, `@Roles()` + `UseGuards(JwtAuthGuard, RolesGuard)` for protected
- **Pagination** (admin/lists): `?page&limit&q`, where used
- **Filtering**: `GET /barbers ?barbershopId&status&isActive`, `GET /services ?barberId&barbershopId`, `GET /appointments ?status&barberId&date`, `GET /locations ?barberId&userId`, `GET /notifications ?type&isRead&page&limit`
- **File uploads**: `multer` disk storage, avatars `uploads/avatars` 5MB image, educational `video/*` 100MB, uploads `./uploads Date.now()+ext`
- **Admin prefix**: `admin` module `Roles(admin,super_admin)` — dashboard, users, barbers, services, appointments, reports, settings

Full route table — see section 5; Swagger at `/api` is source of truth.

---

## 10. Business Logic — Booking & Appointment Workflow

### Creation (`POST /appointments`, `AppointmentsService.create`)
1. Validate `barber.isActive && status === 'active'`
2. Service belongs to barber (`service.barberId === barberId`)
3. `startTime < endTime`, `date` matches `start/end YMD`, not past (`Date.now() - 60s`)
4. `duration === service.duration` (exact)
5. Check barber availability: `workingDays` includes `date` weekday, not in `holidays`, `workingHours[day]` exists, slot inside `start-end`, not overlapping `breakTime` (per-day or global)
6. Overlap check transaction: `In [pending,confirmed]` same `date` where `start < existing.end && end > existing.start` → conflict
7. Create `status pending`, transaction, emit `booking.created` → notifications

### Slot Generation (`GET /appointments/available-slots` + `GET /availability ?barberId&date&serviceId`)
- `AvailabilityService.getAvailability`:
  - Past-date reject
  - Holiday / not_working_day / no_working_hours → `{slots:[], reason}`
  - `duration` from service or 30
  - Generate slots stepping `duration` from `workingStart` to `workingEnd`, skip if overlaps `breakTime`, skip if `Booked` (existing appointments pending/confirmed)
  - Returns `slots: {time, startTime, endTime, status Available|Booked}`

### Status Transitions
```
pending → confirmed, cancelled
confirmed → completed, cancelled, no_show
```
- `PATCH /appointments/:id/status` (barber|admin) enforces `ALLOWED_TRANSITIONS`
- `POST /appointments/:id/cancel` (owner|admin)
- Emits `booking.confirmed` / `booking.cancelled`

### Barber / Services / Availability
- `Barber.syncServices`: dedup `serviceIds`, replace `barber_services` delete+insert, role auto-upgrade `user → barber`
- `workingHours` `simple-json` `{mon:{start:"10:00",end:"21:00"},...}`, `breakTime` global or per-day `{start,end}`, `workingDays ["mon",...]`, `holidays ["2026-03-21"]`
- Seed example: `workingHours 10-21, break 14-15`, `workingDays mon-sat`

### Locations & Profile
- `Locations`: exactly one of `barberId xor userId`, `barberId` unique, ownership check (barber owner or admin), `findMine` branches on barber profile
- `Users`: `GET/PATCH /me`, avatar upload, `GET/PATCH /me/preferences {themePreference,smsReminder}`

---

## 11. Notifications & WebSocket

- **EventEmitter**: `booking.created` / `booking.confirmed` / `booking.cancelled` emitted from appointments
- **Listener**: `NotificationsListener` creates `notification` row + `dispatcher`
- **Dispatcher**: in-app channel + WebSocket push
- **Entity**: `notifications {userId, type booking_created|confirmed|cancelled|appointment_reminder, title, body, data json, appointmentId?, isRead, readAt, createdAt}`
- **HTTP**: `GET /notifications ?type&isRead&page&limit`, `GET /unread-count`, `PATCH /read-all`, `PATCH /:id/read`, `POST /reminders/run` (admin)
- **Reminder cron**: `NotificationsScheduler.sendDueReminders` — finds `pending|confirmed` within 24h, dedup 22h, `type appointment_reminder`
- **WebSocket Gateway**: `namespace /notifications`, `JWT via auth.token|header|query`, room `user:${id}`, emits `notification` event to room
- **Socket.IO**: `4.8`, `@nestjs/websockets`, `platform-socket.io`

---

## 12. Error Handling & API Response Conventions

- **ValidationPipe**: `whitelist + forbidNonWhitelisted + transform + enableImplicitConversion` → 400 on extra/invalid fields
- **Filters**: Common exception filters (see `src/common/filters`)
- **Guards**: 401 if JWT missing/invalid, 403 if `RolesGuard` fails
- **DTO validation**: `class-validator` errors → 400 with details
- **Business errors**: 404 not found, 409 conflict (overlap/duplicate), 400 past-date/invalid duration/transition
- **Swagger**: documents responses; Bearer `Authorization: Bearer <token>`
- **Frontend**: `error.interceptor` + `GlobalErrorHandler`, `ToastService` for user feedback

---

## 13. Frontend — Pages, Components, Services, Routing

**Pages (20+)**:
- `home` (landing/dashboard), `barbers` list, `barber-detail` + `barber-manage`, `barbershops`, `services`, `booking` (slot picker), `appointments` + `appointment/*` (create/detail), `profile` + `profile-edit` + `change-password`, `addresses` (locations), `training` (educational videos), `documents` (certificates), `notifications`, `admin` (dashboard), `auth: landing/login/register/forgot/reset`

**Shared Components**:
- `app-sidebar`, `empty-state.component`, `theme-toggle.component`, `ui.ts` wrappers (`UiInput` password toggle, `UiTextarea`, `UiSelect`, `UiDatepicker`, `UiMultiSelect`, `UiNumber`, `UiButton` loading spinner) — all `ControlValueAccessor`, Ionic primitives

**Services**:
- `ApiService` facade delegating to 12 `*Api` (`list/get/create/update/remove`, `slots`, `availability`, `upload`, `preferences`)
- `AuthService` `signal(user/token)`, `localStorage access_token/refresh_token/user`, `register/login/refresh/logout/logoutAll/forgot/reset/changePassword`, helpers `isLoggedIn()`, `isAdmin()`, `isBarber()`
- `ThemeService`, `ToastService`, `ViewRoleService`

**Routing**:
- Lazy `loadComponent`, `withPreloading(PreloadAllModules)`, `withComponentInputBinding()`
- Guards `authGuard`/`guestGuard`/`adminGuard`/`barberGuard` → `createUrlTree(/login or /tabs/home)`
- Layouts: `AuthLayout` (unauth), `AppLayout` (main), `TabsPage` (tabs nav)

**State & Data Flow**:
- `signals` (`user`, `token`, `isDark`) + `RxJS` + `localStorage` — no Redux/NgRx/Pinia
- `provideHttpClient(withInterceptors([authInterceptor,errorInterceptor]))` — `authInterceptor` attaches Bearer
- `apiUrl` from `environment.ts`

---

## 14. UI / Design System & RTL / Theme

- **UI Lib**: Ionic 9 + ionicons + `ionicons` `eyeOutline` etc, `Leaflet 1.9` maps, `SCSS` only, no Tailwind/Bootstrap
- **Design tokens** (`global.scss`):
  - `--app-bg #0b101e` (dark default), `--card-bg`, `--accent #f59e0b`, `--ion-background-color`, `--ion-color-primary #f59e0b`
  - Light override `html:not(.ion-palette-dark)` → `#f8fafc`, `#ffffff`
- **RTL/Persian**:
  - Hardcoded `index.html <html lang="fa" dir="rtl">`, `global.scss html{direction:rtl} html[dir="rtl"]{direction:rtl}`
  - Font `Vazirmatn` Google Fonts `--ion-font-family`
  - Dictionary `core/i18n/fa.ts` `{app,brand,nav,common,errors,toast,theme,auth,home,barbershops,barbers,services,turns,appointments,notifications,admin,barberDetail,barberManage,profile} as const`, `extract-i18n` builder configured, no `ngx-translate` dep
- **Theme**:
  - `ThemeService` `signal isDark`, `KEY='theme'`, `matchMedia('(prefers-color-scheme: dark)')` init, `classList.toggle('ion-palette-dark')`, `localStorage` persist, `GET/PATCH /users/me/preferences {themePreference:dark|light}`, `toggle()`/`apply()`
  - `variables.scss` Ionic theme vars, `theme-toggle.component` UI
  - `color-scheme light dark` in `index.html`

---

## 15. Important Dependencies & Configuration

**Backend `package.json`**:
- `@nestjs/*` common/config/core/event-emitter/jwt/passport/platform-express/platform-socket.io/serve-static/swagger/typeorm/websockets`, `bcrypt 6`, `better-sqlite3 12`, `class-transformer/validator`, `multer 2.2`, `passport(-jwt)`, `pg 8` + `sqlite3 6` installed but unused, `reflect-metadata`, `rxjs 7.8`, `socket.io 4.8`, `typeorm 1.0`

**Frontend `barber-ui/package.json`**: `@angular/* 22.0.1`, `@ionic/angular ^9`, `ionicons ^8.1`, `leaflet ^1.9`, `rxjs ~7.8`, `@angular/build 22`, `vitest ^4`

**Config**:
- `database.config.ts`: `type better-sqlite3`, `database process.env.DB_DATABASE || 'barber_db'`, `entities __dirname/../**/*.entity`, `synchronize !=production`, `logging true`
- `main.ts`: `ValidationPipe`, `enableCors {origin: CORS_ORIGIN?.split(',') ?? true}`, Swagger `/api` `addBearerAuth`, `port 3000` (`PORT` env)
- `.env` (gitignored, example `src/config/.env`): `DB_HOST/PORT/USERNAME/PASSWORD/DATABASE`, `JWT_SECRET`, `PORT=3000` — fallbacks `barber_secret` / `barber_db`
- `tsconfig.json`: `target ES2023`, `module nodenext`, `esModuleInterop`, `emitDecoratorMetadata`, `experimentalDecorators`
- `nest-cli.json`: `sourceRoot src`, swagger plugin
- `.prettierrc`: `singleQuote, trailingComma all`
- `uploads/avatars/` + `public/barber-*.jpg`, `.gitignore` ignores `/dist`, `.env`, `barber_db*`, `uploads/*.png|jpg`

---

## 16. Development / Build / Test Commands

```bash
# backend (barber-app)
npm install
npm run start:dev      # watch  :3000
npm run build          # nest build → dist/
npm run start:prod     # node dist/main
npm run seed           # ts-node src/seed/seed.ts (wipe + seed demo data)
npm run lint           # eslint --fix
npm run format         # prettier
npm run test           # jest (rootDir src, *.spec.ts)
npm run test:watch
npm run test:cov
npm run test:e2e       # jest --config test/jest-e2e.json

# frontend (barber-ui, sibling)
npm install
ng serve               # ionic serve (http://localhost:8100, apiUrl http://localhost:3000)
ng build               # → www/
ng test                # vitest + jsdom
ng lint
```

---

## 17. Coding Conventions

- **TypeScript strict**: `strictNullChecks true`, `noImplicitAny false`, decorators enabled
- **Lint/Format**: `eslint 9` + `eslint-config-prettier` + `prettier 3` (`singleQuote`, `trailingComma all`), `eslint --fix`
- **Nest conventions**: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `entities/*.entity.ts`, `dto/*.dto.ts` with `class-validator`, `ParseUUIDPipe` on `:id`
- **No comments** by default (project style), keep diffs minimal
- **Absolute paths**: `baseUrl ./`, `tsconfig-paths` for `ts-node/register` in seed/e2e
- **Commits**: concise, no secrets, `barber_db` and `.env` gitignored
- **Swagger**: tag per controller, `BearerAuth`

---

## 18. Rules for AI Agents When Modifying the Project

1. **Reuse > rebuild** — use existing guards/decorators/services/APIs/components. Grep before creating.
2. **No new dep** unless few lines can't do it and existing dep doesn't cover it — stdlib/native/DB constraint/CSS first.
3. **No unrequested abstractions** — no single-implementation interface/factory/config for static value.
4. **Shortest diff** — fewest files, one-liner if possible. Delete over add.
5. **Don't break existing** — keep routes, DTOs, entity fields, guard logic, `CASCADE`, Swagger tags. Extend, don't rename/remove.
6. **Validation at trust boundary** — DTO `class-validator` still required; error handling that avoids data loss stays.
7. **Security**: never log/commit secrets, `JWT_SECRET` env, bcrypt passwords, check `isActive`, enforce ownership/admin.
8. **Accessibility & RTL**: keep `dir="rtl"`, `Vazirmatn`, Ionic a11y; don't break theme toggle.
9. **Mark simplifications**: `ponytail:` comment naming ceiling + upgrade path when deliberately cutting scope.
10. **One runnable check** for non-trivial logic — assert self-check or small `*.spec.ts` (no framework needed for trivial).

---

## 19. "Before Changing Anything" Workflow

```
1. Read this AI.md fully
2. Grep existing code — find guards, decorators, services, entities, DTOs, pages, apis
3. Read the 2-3 files you'll touch + their imports and callers
4. Check DB entities/relations (section 8) and allowed transitions (section 10)
5. Check Swagger /api and frontend ApiService for existing endpoints to reuse
6. Check theme/RTL/i18n if touching UI (section 14)
7. Implement minimal diff — prefer editing over new files
8. Run lint + tests: npm run lint; npm run test  (and ng lint/test if touching barber-ui)
9. Verify not breaking: auth, booking overlap, availability, notifications WS, role guards
```

---

## 20. Do Not Break Existing Behavior — Checklist

- [ ] Auth still `Bearer JWT` 1d + refresh rotation 7d + forgot 1h, `barber_secret` fallback preserved
- [ ] `RolesGuard` admin/super_admin bypass kept case-insensitive
- [ ] Appointment creation validates barber active, service belongs barber, duration exact, not past, no overlap `pending|confirmed` transaction
- [ ] `workingDays/Hours/breakTime/holidays` scheduling unchanged
- [ ] `GET /available-slots` and `GET /availability` status semantics kept
- [ ] `barberId xor userId` locations + unique barber location
- [ ] `EventEmitter booking.*` → notifications → WS `user:${id}` `notification` event
- [ ] `ServeStatic /uploads`, `ValidationPipe whitelist forbids extra`, `CORS` env split, Swagger bearer
- [ ] Frontend `authInterceptor`/`errorInterceptor`, `signals+localStorage`, RTL `dir=rtl`, `ion-palette-dark` theme persist
- [ ] Seed still wipes + creates 6 users/2 shops/2 barbers/5 services/6 appts with `Password123!`

---

## 21. Project Feature Map & Dependency Overview

```
Features
├── Auth (register/login/refresh/logout/forgot/reset/change)
│   └── depends on Users + JWT + bcrypt + refresh_tokens/password_reset_tokens
├── Users & Profiles (me/avatar/preferences)
│   └── depends on Auth + Uploads
├── Barbershops (admin CRUD)
│   └── depends on Users (owner)
├── Barbers (CRUD + workingHours/specialties/holidays + avatar)
│   ├── depends on Users (role upgrade) + Barbershops + Locations
│   └── controls Services (via barber_services) + Availability + Appointments
├── Services (barber|admin CRUD)
│   └── depends on Barbers (+ Barbershops optional)
├── Booking (create/list/cancel/status)
│   ├── depends on Barbers + Services + Availability + Users
│   └── emits booking.* → Notifications
├── Availability (slot generation)
│   └── depends on Barbers (workingHours/break/holidays) + Appointments (booked)
├── Locations (address/geo, barber xor user)
│   └── depends on Barbers/Users
├── Educational (video 100MB) + Certificates
│   └── depends on Barbers
├── Notifications (in-app + WS + reminders)
│   ├── depends on Appointments (events) + Users
│   └── Gateway /notifications room user:${id}
└── Admin (dashboard/reports/settings/users/barbers/services/appointments)
    └── depends on all modules (read/write)

Dependencies (install sizes minimal)
├── @nestjs/* (core, jwt, passport, websockets, swagger, typeorm, serve-static)
├── typeorm + better-sqlite3 (pg/sqlite3 installed unused)
├── passport-jwt, bcrypt, multer, socket.io, class-validator/transformer
├── Frontend: @angular 22, @ionic/angular 9, leaflet 1.9, rxjs 7.8
└── Dev: eslint 9, prettier 3, jest 30/ts-jest, vitest 4 (barber-ui)

Build chain
├── barber-app: nest build → dist/main.js → node dist/main :3000 (+ /api swagger)
└── barber-ui: ng build → www/ (static) → serve + apiUrl http://localhost:3000
```

---

## 22. Quick Reference — Where To Look

| Need | File |
|------|------|
| Auth logic | `src/modules/auth/auth.service.ts`, `strategies/jwt.strategy.ts` |
| Guards/decorators | `src/common/guards/{auth,roles}.ts`, `decorators/{public,roles,current-user}.ts` |
| DB config/entities | `src/config/database.config.ts`, `src/modules/*/entities/*.entity.ts` |
| Booking/overlap | `src/modules/appointments/appointments.service.ts` |
| Slots/availability | `src/modules/availability/availability.service.ts` |
| Notifications/WS | `src/modules/notifications/{notifications.service,gateway,listener,scheduler}.ts` |
| Admin routes | `src/modules/admin/admin.controller.ts` |
| Seed/demo data | `src/seed/seed.ts` |
| Frontend routes | `barber-ui/src/app/app.routes.ts`, `tabs.routes.ts` |
| Frontend API | `barber-ui/src/app/core/api/*.ts`, `core/services/api.service.ts` |
| Theme/RTL | `barber-ui/src/app/core/services/theme.service.ts`, `src/global.scss`, `src/index.html`, `core/i18n/fa.ts` |
| Env example | `src/config/.env` |

> Rule: **Grep first, code second. Shortest working diff wins. Don't rebuild what exists.**
