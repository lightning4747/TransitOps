# TransitOps — Backend Design

Node.js + Express + TypeScript + Prisma. Field/enum names match `db-design.md` exactly — do not rename.

## Folder structure

```
src/
  index.ts
  prisma/
    schema.prisma
    seed.ts
  middleware/
    auth.ts          # verifies JWT, attaches req.user
    rbac.ts           # requireRole(...roles)
    errorHandler.ts
    validate.ts        # zod schema wrapper
  modules/
    auth/
      auth.routes.ts
      auth.service.ts
      auth.schema.ts    # zod
    vehicles/
      vehicle.routes.ts
      vehicle.service.ts
      vehicle.schema.ts
    drivers/
      driver.routes.ts
      driver.service.ts
      driver.schema.ts
    trips/
      trip.routes.ts
      trip.service.ts     # dispatch/complete/cancel transactions live here
      trip.schema.ts
    maintenance/
      maintenance.routes.ts
      maintenance.service.ts
    fuel/
      fuel.routes.ts
      fuel.service.ts
    expenses/
      expense.routes.ts
      expense.service.ts
    reports/
      report.routes.ts
      report.service.ts   # all computed-value aggregations
    dashboard/
      dashboard.routes.ts
      dashboard.service.ts
  lib/
    prisma.ts          # singleton PrismaClient
    eligibility.ts      # shared computed-eligibility helpers
```

## Auth & RBAC

- `POST /api/auth/login` — email + password → JWT (contains `userId`, `role`). No self-registration endpoint; users are seeded/created by a Fleet Manager via `POST /api/users` (admin-only).
- `middleware/auth.ts` — verifies JWT on every route except `/auth/login`. Attaches `req.user = { id, role }`.
- `middleware/rbac.ts` — `requireRole('FLEET_MANAGER', 'SAFETY_OFFICER')` used per-route. Role → permitted actions:

| Action | FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST |
|---|---|---|---|---|
| Vehicle CRUD | ✅ | ❌ | read-only | read-only |
| Driver CRUD | ✅ | ❌ | ✅ (compliance fields) | read-only |
| Create/Dispatch/Complete/Cancel Trip | ✅ | ✅ | read-only | read-only |
| Maintenance Log CRUD | ✅ | ❌ | read-only | read-only |
| Fuel/Expense entry | ✅ | ✅ (own trips) | read-only | read-only |
| Reports/Analytics | read-only | ❌ | read-only | ✅ |
| Dashboard | ✅ | ✅ (limited) | ✅ | ✅ |

This table is authoritative — if frontend hides a button, backend must still enforce it server-side.

## Computed eligibility (matches db-design.md §Computed values)

`lib/eligibility.ts`:

```ts
function isDriverDispatchEligible(driver: Driver): boolean {
  return driver.status === 'AVAILABLE' && driver.licenseExpiry > new Date();
}

function isVehicleDispatchEligible(vehicle: Vehicle): boolean {
  return vehicle.status === 'AVAILABLE';
}
```

Used in:
- `GET /api/vehicles?dispatchable=true` and `GET /api/drivers?dispatchable=true` — pool endpoints for the Trip creation form dropdowns. Filtering happens in the query/service layer, not in the DB (expiry check can't be a stored WHERE against a stale column).
- `trip.service.ts::dispatchTrip()` — re-validated server-side even if the frontend only shows eligible options, since state may have changed between page load and submit (race condition guard).

## Business rule enforcement — Trip service (transactional)

All four functions below wrap Prisma operations in `prisma.$transaction(...)` so partial state updates never happen.

### `createTrip(input)`
- Validates cargoWeight > 0, plannedDistance > 0 (zod schema).
- Creates Trip with status = DRAFT. No status changes to Vehicle/Driver yet.

### `dispatchTrip(tripId)`
1. Load trip, vehicle, driver.
2. Validate: `trip.status === 'DRAFT'`.
3. Validate: `isVehicleDispatchEligible(vehicle)` → else 409 "Vehicle not available".
4. Validate: `isDriverDispatchEligible(driver)` → else 409 "Driver not eligible (license expired, suspended, or unavailable)".
5. Validate: `trip.cargoWeight <= vehicle.maxLoadKg` → else 400 "Cargo exceeds vehicle capacity".
6. Transaction: set `trip.status = DISPATCHED`, `trip.dispatchedAt = now`, `vehicle.status = ON_TRIP`, `driver.status = ON_TRIP`.

### `completeTrip(tripId, { endOdometer, fuelConsumed })`
1. Validate `trip.status === 'DISPATCHED'`.
2. Transaction: set `trip.status = COMPLETED`, `trip.completedAt = now`, `trip.endOdometer`, `trip.fuelConsumed`, `vehicle.status = AVAILABLE`, `vehicle.odometer = endOdometer`, `driver.status = AVAILABLE`.
3. Optionally auto-create a FuelLog row from `fuelConsumed` if a cost-per-liter default is provided — otherwise require a separate fuel log entry (decide in sprint planning; default: require separate entry to keep this function single-purpose).

### `cancelTrip(tripId)`
1. Validate `trip.status === 'DISPATCHED'` (cancelling a DRAFT trip is just a delete/status=CANCELLED with no side effects, since nothing was assigned).
2. Transaction: set `trip.status = CANCELLED`, `trip.cancelledAt = now`, `vehicle.status = AVAILABLE`, `driver.status = AVAILABLE`.

## Business rule enforcement — Maintenance service

### `createMaintenanceLog(vehicleId, input)`
1. Validate vehicle exists and `vehicle.status !== 'ON_TRIP'` → else 409 "Cannot service a vehicle currently on trip".
2. Transaction: create MaintenanceLog with status = ACTIVE, set `vehicle.status = IN_SHOP`.

### `closeMaintenanceLog(logId)`
1. Transaction: set `MaintenanceLog.status = CLOSED`, `closedAt = now`.
2. Set `vehicle.status = AVAILABLE` **unless** `vehicle.status === RETIRED` (retired vehicles never return to Available — explicit guard per spec rule).

## Validation layer

All request bodies validated with `zod` schemas per module before hitting the service layer. Reject with 400 + field-level error messages on failure. This is the single point where field name typos would surface — keeps route handlers thin.

## Reports & Analytics service (`report.service.ts`)

Implements the exact formulas from `db-design.md` §Computed values:

- `GET /api/reports/fuel-efficiency?vehicleId=` → per-vehicle or fleet-wide
- `GET /api/reports/utilization` → fleet-wide %, optionally filtered by region/type
- `GET /api/reports/operational-cost?vehicleId=`
- `GET /api/reports/roi?vehicleId=` — returns `null`/flag if Revenue isn't tracked, per the open decision noted in db-design.md. Do not silently default to 0 without a `revenueTracked: false` flag in the response, so frontend can render "N/A — revenue not configured" instead of a misleading 0%.
- `GET /api/reports/export.csv` — same data as above, streamed as CSV (use `csv-stringify` or similar)

## Dashboard service (`dashboard.service.ts`)

`GET /api/dashboard?vehicleType=&status=&region=`
Returns:
```ts
{
  activeVehicles: number,       // status != RETIRED
  availableVehicles: number,     // status == AVAILABLE
  vehiclesInMaintenance: number, // status == IN_SHOP
  activeTrips: number,           // status == DISPATCHED
  pendingTrips: number,          // status == DRAFT
  driversOnDuty: number,         // status == ON_TRIP
  fleetUtilization: number       // % per db-design formula
}
```
All filters applied as WHERE clauses before aggregation, not post-filtered in memory.

## Error handling convention

- 400 — validation failure (zod)
- 401 — missing/invalid JWT
- 403 — role not permitted
- 404 — resource not found
- 409 — business rule conflict (e.g. dispatch to unavailable vehicle)
- All errors return `{ error: { code, message, fields? } }` — consistent shape for frontend to parse.

## API endpoint summary

```
POST   /api/auth/login
GET    /api/dashboard

GET    /api/vehicles            (filters: type, status, region, dispatchable)
POST   /api/vehicles             (FLEET_MANAGER)
GET    /api/vehicles/:id
PATCH  /api/vehicles/:id         (FLEET_MANAGER — cannot directly set status; status only changes via trip/maintenance flows)

GET    /api/drivers              (filters: status, dispatchable)
POST   /api/drivers               (FLEET_MANAGER)
GET    /api/drivers/:id
PATCH  /api/drivers/:id           (FLEET_MANAGER, SAFETY_OFFICER — compliance fields only)

GET    /api/trips                (filters: status, driverId, vehicleId)
POST   /api/trips                 (create DRAFT)
POST   /api/trips/:id/dispatch
POST   /api/trips/:id/complete
POST   /api/trips/:id/cancel

GET    /api/maintenance-logs     (filters: vehicleId, status)
POST   /api/maintenance-logs
POST   /api/maintenance-logs/:id/close

GET    /api/fuel-logs            (filters: vehicleId, dateRange)
POST   /api/fuel-logs

GET    /api/expenses             (filters: vehicleId, dateRange)
POST   /api/expenses

GET    /api/reports/fuel-efficiency
GET    /api/reports/utilization
GET    /api/reports/operational-cost
GET    /api/reports/roi
GET    /api/reports/export.csv
```

**Important:** `PATCH /api/vehicles/:id` and `PATCH /api/drivers/:id` must explicitly reject a `status` field in the request body (strip it or 400 if present) — status is only ever mutated by the trip/maintenance service functions above. This is the most common conflict point between "generic CRUD" and "business rule enforcement" — call this out to whoever builds the vehicle/driver routes.