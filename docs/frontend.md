# TransitOps — Frontend Design

React + TypeScript. Field names, enums, and endpoint paths match `db-design.md` and `backend-design.md` exactly.

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- TanStack Query (React Query) for all server state — no manual `useEffect` fetch/loading/error boilerplate
- React Hook Form + zod (same schemas conceptually as backend, mirrored client-side) for forms
- Recharts for charts
- Axios instance with JWT interceptor

## Folder structure

```
src/
  main.tsx
  App.tsx
  api/
    client.ts           # axios instance, attaches JWT from auth store
    vehicles.ts          # typed API calls
    drivers.ts
    trips.ts
    maintenance.ts
    fuel.ts
    expenses.ts
    reports.ts
    dashboard.ts
  types/
    index.ts             # shared TS types mirroring db-design.md entities/enums
  store/
    authStore.ts          # zustand or context — user, role, token
  hooks/
    useVehicles.ts         # React Query wrappers per resource
    useDrivers.ts
    useTrips.ts
    ...
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx           # nav items filtered by role
      RoleGuard.tsx          # wraps routes, redirects if role not permitted
    dashboard/
      KpiCard.tsx
      FleetUtilizationChart.tsx
      FilterBar.tsx
    vehicles/
      VehicleTable.tsx
      VehicleForm.tsx
      VehicleStatusBadge.tsx
    drivers/
      DriverTable.tsx
      DriverForm.tsx
      LicenseExpiryBadge.tsx   # red if expired, amber if <30 days
    trips/
      TripTable.tsx
      TripCreateForm.tsx        # vehicle/driver dropdowns use dispatchable=true filter
      TripDetailDrawer.tsx       # dispatch/complete/cancel actions
    maintenance/
      MaintenanceLogTable.tsx
      MaintenanceLogForm.tsx
    fuel/
      FuelLogForm.tsx
    expenses/
      ExpenseForm.tsx
    reports/
      ReportCard.tsx
      RoiTable.tsx               # renders "N/A" when revenueTracked=false
    common/
      DataTable.tsx               # generic sortable/filterable table
      StatusBadge.tsx
      ConfirmDialog.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    VehiclesPage.tsx
    DriversPage.tsx
    TripsPage.tsx
    MaintenancePage.tsx
    FuelExpensesPage.tsx
    ReportsPage.tsx
```

## Types (mirrors db-design.md)

```ts
type Role = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
type MaintenanceStatus = 'ACTIVE' | 'CLOSED';

interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string | null;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
}

interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelConsumed: number | null;
}
```
Keep these in `types/index.ts` as the single source of truth on the frontend — do not redeclare inline in components.

## Routing & role-based access

```
/login                       — public
/dashboard                   — all roles (content varies, see below)
/vehicles                    — FLEET_MANAGER (edit), SAFETY_OFFICER/FINANCIAL_ANALYST (read-only)
/drivers                     — FLEET_MANAGER, SAFETY_OFFICER (edit compliance fields)
/trips                        — FLEET_MANAGER, DRIVER (create/dispatch/complete/cancel)
/maintenance                  — FLEET_MANAGER
/fuel-expenses                 — FLEET_MANAGER, DRIVER
/reports                       — FINANCIAL_ANALYST (full), FLEET_MANAGER/SAFETY_OFFICER (read-only)
```

`RoleGuard` wraps each route element; on mismatch, redirect to `/dashboard` with a toast, not a blank/error page. **Note:** this is UI convenience only — the backend RBAC table in `backend-design.md` is the actual enforcement boundary. Never rely on hiding a button as the security control.

## Dashboard page

- KPI cards (from `GET /api/dashboard`): Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet Utilization %
- `FilterBar`: vehicle type, status, region — all passed as query params to `useDashboard(filters)`, refetches on change (React Query key includes filters)
- One chart: Fleet Utilization over time is out of scope for MVP (no time-series data modeled) — MVP chart is a simple status breakdown (pie/bar of vehicle counts by status)

## Trip creation flow (core demo path — build first)

1. `TripCreateForm`: source, destination, cargoWeight, plannedDistance — plus two dropdowns:
   - Vehicle dropdown: `useVehicles({ dispatchable: true })` → calls `GET /api/vehicles?dispatchable=true`
   - Driver dropdown: `useDrivers({ dispatchable: true })` → calls `GET /api/drivers?dispatchable=true`
   - Client-side check: disable submit if `cargoWeight > selectedVehicle.maxLoadKg`, show inline error immediately (don't wait for server round-trip) — but this is a UX nicety, server re-validates regardless.
2. On submit → `POST /api/trips` → creates DRAFT.
3. `TripDetailDrawer` shows action buttons based on current status:
   - DRAFT → "Dispatch" button → `POST /api/trips/:id/dispatch`
   - DISPATCHED → "Complete" (opens form for endOdometer + fuelConsumed) and "Cancel" buttons
   - COMPLETED/CANCELLED → read-only, no actions
4. On any 409 from the backend (e.g. vehicle became unavailable between page load and click), show the server's error message directly via toast — don't mask it with a generic "something went wrong."

## Forms — validation pattern

Every create/edit form: React Hook Form + zod resolver, schema shape mirrors the backend zod schema field-for-field. Example for Vehicle:

```ts
const vehicleSchema = z.object({
  regNumber: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  maxLoadKg: z.number().positive(),
  acquisitionCost: z.number().nonnegative(),
  region: z.string().optional(),
});
```
Do not include `status` as an editable field in `VehicleForm` or `DriverForm` — status is system-managed (matches backend rule that PATCH rejects a status field). Status is displayed via `VehicleStatusBadge` / driver equivalent, never as a form input.

## Tables

`DataTable` is a generic component (columns config + rows) reused across Vehicles/Drivers/Trips/Maintenance — avoids 4 near-duplicate table implementations. Supports client-side sort; filters are server-side (passed as query params) since lists may grow beyond a single page of demo data.

- `LicenseExpiryBadge`: red badge if `licenseExpiry < today`, amber if within 30 days, green otherwise. Purely a display computation on the client from the raw `licenseExpiry` date — no backend "expired" status to keep in sync with (consistent with the computed-eligibility approach in db-design.md/backend-design.md).

## Reports page

- Cards/tables for Fuel Efficiency, Fleet Utilization, Operational Cost, ROI — one `ReportCard` per metric, each independently fetched (separate React Query hooks) so a slow one doesn't block the others.
- ROI card: if API returns `revenueTracked: false`, render "N/A — revenue not configured" instead of a number. Never show a bare `0%` for this — it reads as "zero ROI" rather than "not tracked."
- "Export CSV" button → hits `GET /api/reports/export.csv`, triggers browser download (no need to build CSV client-side, backend streams it).

## Auth

- `LoginPage`: email + password → `POST /api/auth/login` → store JWT + role in `authStore` (persist to memory only; do not use localStorage per artifact constraints if this is prototyped as an artifact — for a real deployed app, httpOnly cookie is preferable to localStorage anyway).
- Axios interceptor attaches `Authorization: Bearer <token>` on every request; on 401, clear store and redirect to `/login`.

## Build priority (matches backend-design.md priority order)

1. Login + AppShell + RoleGuard
2. Vehicles + Drivers tables/forms
3. Trip creation + dispatch/complete/cancel flow (core demo path)
4. Maintenance flow
5. Fuel/Expense forms
6. Dashboard KPIs
7. Reports + CSV export
8. Dark mode / polish if time remains