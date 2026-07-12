# Backend

## Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **ORM**: Prisma (PostgreSQL)
- **Auth**: JSON Web Tokens (jsonwebtoken) + bcrypt
- **Validation**: Zod
- **Environment**: `.env` — `DATABASE_URL`, `JWT_SECRET`, `PORT`

---

## Folder Structure

```
backend/src/
  index.ts                  # Express app bootstrap, route mounting, middleware registration
  lib/
    prisma.ts               # Singleton PrismaClient instance
    eligibility.ts          # Shared dispatchability checks (vehicle status, driver status + licence expiry)
  middleware/
    auth.ts                 # JWT verification; ?token= query param fallback for file downloads
    rbac.ts                 # requireRole(...roles) factory
    errorHandler.ts         # AppError class + global Express error handler
    validate.ts             # Zod schema middleware wrapper
  modules/
    auth/
      auth.routes.ts
      auth.service.ts
      auth.schema.ts
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
      trip.service.ts
      trip.schema.ts
    maintenance/
      maintenance.routes.ts
      maintenance.service.ts
      maintenance.schema.ts
    fuel/
      fuel.routes.ts
      fuel.service.ts
      fuel.schema.ts
    expenses/
      expense.routes.ts
      expense.service.ts
      expense.schema.ts
    reports/
      report.routes.ts
      report.service.ts
    dashboard/
      dashboard.routes.ts
      dashboard.service.ts
  prisma/
    schema.prisma
    seed.ts
    migrations/
```

---

## Middleware

### Auth (`middleware/auth.ts`)

Reads the `Authorization: Bearer <token>` header and verifies the JWT. If the header is absent, it falls back to the `?token=<token>` query parameter — this fallback exists because browsers cannot set `Authorization` headers on navigation requests (e.g. `window.open()` for CSV downloads). On success, attaches `req.user = { id, role }` and calls `next()`. On failure, forwards an `AppError` with status 401.

### RBAC (`middleware/rbac.ts`)

Exports `requireRole(...roles: Role[])`. Returns an Express middleware that checks `req.user.role` against the allowed set. Returns 403 if the role is not permitted.

### Error Handler (`middleware/errorHandler.ts`)

Defines the `AppError` class:
```ts
class AppError extends Error {
  statusCode: number;
  code: string;
}
```

The global error handler converts any `AppError` (or unexpected error) into a consistent JSON response:
```json
{ "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
```

### Validate (`middleware/validate.ts`)

Wraps a Zod schema into an Express middleware. Parses `req.body` against the schema and calls `next()` on success, or forwards a 400 `AppError` with Zod's formatted error messages on failure.

---

## RBAC Permissions

| Endpoint | FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST |
|---|:---:|:---:|:---:|:---:|
| `GET /vehicles`, `GET /vehicles/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /vehicles` | ✅ | ❌ | ❌ | ❌ |
| `PATCH /vehicles/:id` | ✅ | ❌ | ❌ | ❌ |
| `GET /drivers`, `GET /drivers/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /drivers` | ✅ | ❌ | ❌ | ❌ |
| `PATCH /drivers/:id` | ✅ | ❌ | ✅ | ❌ |
| `GET /trips`, `GET /trips/:id` | ✅ | ✅ | ✅ | ✅ |
| `POST /trips` | ✅ | ✅ | ❌ | ❌ |
| `POST /trips/:id/dispatch` | ✅ | ✅ | ❌ | ❌ |
| `POST /trips/:id/complete` | ✅ | ✅ | ❌ | ❌ |
| `POST /trips/:id/cancel` | ✅ | ✅ | ❌ | ❌ |
| `GET /maintenance-logs` | ✅ | ✅ | ✅ | ✅ |
| `POST /maintenance-logs` | ✅ | ❌ | ❌ | ❌ |
| `POST /maintenance-logs/:id/close` | ✅ | ❌ | ❌ | ❌ |
| `GET /fuel-logs` | ✅ | ✅ | ✅ | ✅ |
| `POST /fuel-logs` | ✅ | ✅ | ✅ | ✅ |
| `GET /expenses` | ✅ | ✅ | ✅ | ✅ |
| `POST /expenses` | ✅ | ✅ | ✅ | ✅ |
| `GET /dashboard` | ✅ | ✅ | ✅ | ✅ |
| `GET /reports/*` | ✅ | ❌ | ✅ | ✅ |

Report endpoints are guarded by `reportRoles = [FLEET_MANAGER, SAFETY_OFFICER, FINANCIAL_ANALYST]`.

---

## API Reference

All endpoints are prefixed with `/api`. All responses are `application/json` unless noted.

### Auth

#### `POST /api/auth/login`

**Request body:**
```json
{ "email": "string", "password": "string" }
```

**Response:**
```json
{
  "token": "string",
  "user": { "id": "string", "name": "string", "email": "string", "role": "Role" }
}
```

---

### Vehicles

#### `GET /api/vehicles`

**Query params:**
- `dispatchable=true` — returns only vehicles with status `AVAILABLE`
- `type=string` — filter by vehicle type
- `region=string` — filter by region

**Response:** `Vehicle[]`

#### `POST /api/vehicles`

**Request body:**
```json
{
  "regNumber": "string",
  "name": "string",
  "type": "string",
  "maxLoadKg": "number",
  "acquisitionCost": "number",
  "region": "string (optional)"
}
```

**Response:** `Vehicle` — created with `status = AVAILABLE`.

#### `GET /api/vehicles/:id`

**Response:** `Vehicle`

#### `PATCH /api/vehicles/:id`

**Request body (all fields optional):**
```json
{
  "name": "string",
  "type": "string",
  "maxLoadKg": "number",
  "acquisitionCost": "number",
  "region": "string"
}
```

The `status` field is explicitly stripped from the update payload. If the request body contains a `status` key, the handler returns `400 DIRECT_STATUS_UPDATE_FORBIDDEN`.

**Response:** Updated `Vehicle`.

---

### Drivers

#### `GET /api/drivers`

**Query params:**
- `dispatchable=true` — returns only drivers with status `AVAILABLE` and a non-expired licence

**Response:** `Driver[]`

#### `POST /api/drivers`

**Request body:**
```json
{
  "name": "string",
  "licenseNumber": "string",
  "licenseCategory": "string",
  "licenseExpiry": "ISO date string",
  "contactNumber": "string",
  "safetyScore": "number (optional)"
}
```

**Response:** `Driver` — created with `status = AVAILABLE`.

#### `GET /api/drivers/:id`

**Response:** `Driver`

#### `PATCH /api/drivers/:id`

**Request body (all fields optional):**
```json
{
  "name": "string",
  "contactNumber": "string",
  "safetyScore": "number",
  "licenseExpiry": "ISO date string",
  "licenseCategory": "string"
}
```

**Response:** Updated `Driver`.

---

### Trips

#### `GET /api/trips`

**Query params:**
- `status=TripStatus`
- `vehicleId=string`
- `driverId=string`

**Response:** `Trip[]`

#### `POST /api/trips`

**Request body:**
```json
{
  "source": "string",
  "destination": "string",
  "vehicleId": "string",
  "driverId": "string",
  "cargoWeight": "number",
  "plannedDistance": "number"
}
```

**Response:** `Trip` — created with `status = DRAFT`.

#### `GET /api/trips/:id`

**Response:** `Trip`

#### `POST /api/trips/:id/dispatch`

Transitions the trip from `DRAFT` to `DISPATCHED`. See [Dispatch Business Rules](#dispatch-business-rules) below.

**Response:** Updated `Trip` with `status = DISPATCHED`.

**Side effects:** `vehicle.status → ON_TRIP`, `driver.status → ON_TRIP`.

#### `POST /api/trips/:id/complete`

**Request body:**
```json
{ "endOdometer": "number", "fuelConsumed": "number" }
```

**Response:** Updated `Trip` with `status = COMPLETED`.

**Side effects:** `vehicle.status → AVAILABLE`, `driver.status → AVAILABLE`, `vehicle.odometer` updated to `endOdometer`.

#### `POST /api/trips/:id/cancel`

**Response:** Updated `Trip` with `status = CANCELLED`.

**Side effects:** `vehicle.status → AVAILABLE`, `driver.status → AVAILABLE`.

---

### Maintenance Logs

#### `GET /api/maintenance-logs`

**Query params:**
- `vehicleId=string`
- `status=MaintenanceStatus`

**Response:** `MaintenanceLog[]`

#### `POST /api/maintenance-logs`

**Request body:**
```json
{
  "vehicleId": "string",
  "description": "string",
  "cost": "number (optional)"
}
```

**Response:** `MaintenanceLog` — created with `status = ACTIVE`.

**Side effect:** `vehicle.status → IN_SHOP`.

#### `POST /api/maintenance-logs/:id/close`

**Response:** Updated `MaintenanceLog` with `status = CLOSED`.

**Side effect:** `vehicle.status → AVAILABLE`.

---

### Fuel Logs

#### `GET /api/fuel-logs`

**Query params:**
- `vehicleId=string`
- `startDate=ISO date string`
- `endDate=ISO date string`

**Response:** `FuelLog[]`

#### `POST /api/fuel-logs`

**Request body:**
```json
{ "vehicleId": "string", "liters": "number", "cost": "number", "date": "ISO date string" }
```

**Response:** `FuelLog`

---

### Expenses

#### `GET /api/expenses`

**Query params:**
- `vehicleId=string`
- `startDate=ISO date string`
- `endDate=ISO date string`

**Response:** `Expense[]`

#### `POST /api/expenses`

**Request body:**
```json
{ "vehicleId": "string", "type": "string", "amount": "number", "date": "ISO date string" }
```

`type` is a free-text string. Conventional values are: `Toll`, `Parking`, `Fine`, `Cleaning`, `Other`, `Revenue`.

**Response:** `Expense`

---

### Dashboard

#### `GET /api/dashboard`

**Query params:**
- `vehicleType=string`
- `status=VehicleStatus`
- `region=string`

**Response:**
```json
{
  "activeVehicles": "number",
  "availableVehicles": "number",
  "vehiclesInMaintenance": "number",
  "activeTrips": "number",
  "pendingTrips": "number",
  "driversOnDuty": "number",
  "fleetUtilization": "number"
}
```

---

### Reports

All report endpoints require `FLEET_MANAGER`, `SAFETY_OFFICER`, or `FINANCIAL_ANALYST` role.

#### `GET /api/reports/fuel-efficiency`

**Query params:** `vehicleId=string` (optional — omit for fleet-wide aggregate)

**Response:**
```json
{ "vehicleId": "string", "totalDistance": "number", "totalLiters": "number", "fuelEfficiency": "number" }
```

`fuelEfficiency` is km per litre.

#### `GET /api/reports/utilization`

**Query params:** `region=string`, `type=string` (both optional)

**Response:**
```json
{ "utilization": "number" }
```

Percentage of non-retired vehicles currently with status `ON_TRIP`.

#### `GET /api/reports/operational-cost`

**Query params:** `vehicleId=string` (optional)

**Response:**
```json
{
  "vehicleId": "string",
  "fuelCost": "number",
  "maintenanceCost": "number",
  "expenseCost": "number",
  "totalCost": "number"
}
```

#### `GET /api/reports/roi`

**Query params:** `vehicleId=string` (optional)

**Response:**
```json
{
  "vehicleId": "string",
  "revenueTracked": "boolean",
  "revenue": "number",
  "fuelCost": "number",
  "maintenanceCost": "number",
  "acquisitionCost": "number",
  "roi": "number"
}
```

Revenue is sourced from `Expense` records with `type = "Revenue"`. `roi` is expressed as a percentage.

#### `GET /api/reports/export.csv`

Returns a `text/csv` file attachment with one row per vehicle, containing key operational and cost metrics.

**Auth:** Accepts either `Authorization: Bearer <token>` header or `?token=<jwt>` query parameter. The query parameter form exists to support `window.open()` from the browser, which cannot set custom headers.

---

## Dispatch Business Rules

`POST /trips/:id/dispatch` enforces the following checks in order before committing any database writes:

1. **Trip must be in DRAFT status** — returns `409 TRIP_NOT_DRAFT` otherwise.
2. **Vehicle must be AVAILABLE** — returns `409 VEHICLE_NOT_AVAILABLE` otherwise.
3. **Driver must be AVAILABLE and have a non-expired licence** — returns `409 DRIVER_NOT_AVAILABLE` otherwise.
4. **Cargo weight must not exceed vehicle capacity** — `trip.cargoWeight <= vehicle.maxLoadKg` — returns `400 CARGO_OVERWEIGHT` otherwise.
5. **Atomic transaction** — all three records (`Trip`, `Vehicle`, `Driver`) are updated in a single `prisma.$transaction` call: `trip.status → DISPATCHED`, `vehicle.status → ON_TRIP`, `driver.status → ON_TRIP`.

---

## Error Response Shape

All errors — validation, auth, business rule violations, and unexpected exceptions — are returned in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Testing Credentials

Use the following seeded accounts to test the application:

* **Fleet Manager**:
  * Email: `fleet@transitops.dev`
  * Password: `password123`
* **Driver**:
  * Email: `driver@transitops.dev`
  * Password: `password123`
* **Safety Officer**:
  * Email: `safety@transitops.dev`
  * Password: `password123`
* **Financial Analyst**:
  * Email: `analyst@transitops.dev`
  * Password: `password123`