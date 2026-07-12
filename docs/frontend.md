# Frontend

## Stack

| Dependency | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Dev server and bundler |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first styling |
| React Router v6 | Client-side routing |
| TanStack Query (React Query) v5 | Server state management, caching, background refetch |
| React Hook Form + Zod | Form state and validation |
| Recharts | Data visualisation (charts) |
| Axios | HTTP client with JWT interceptor |
| Zustand | Auth state (token + user) |
| Sonner | Toast notifications |

---

## Folder Structure

```
frontend/src/
  main.tsx
  App.tsx                     # React Router route definitions + QueryClientProvider
  api/
    client.ts                 # Axios instance; attaches Bearer token from authStore on every request
    auth.ts
    vehicles.ts
    drivers.ts
    trips.ts
    maintenance.ts
    fuel.ts
    expenses.ts
    reports.ts                # also handles CSV export via window.open + ?token=
    dashboard.ts
  types/
    index.ts                  # TypeScript interfaces matching the database schema
  store/
    authStore.ts              # Zustand store: token, user, login(), logout()
  hooks/
    useVehicles.ts
    useDrivers.ts
    useTrips.ts
    useMaintenance.ts
    useFuelExpenses.ts        # covers both fuel logs and expenses
    useReports.ts
    useDashboard.ts
  components/
    common/
      DataTable.tsx           # Generic sortable table component
      Modal.tsx
      PageHeader.tsx
      StatusBadge.tsx         # Colour-coded pill for Vehicle/Driver/Trip/Maintenance statuses
      ConfirmDialog.tsx
    layout/
      AppShell.tsx            # Sidebar + main content area shell
      Sidebar.tsx             # Navigation links, filtered by authenticated user's role
      RoleGuard.tsx           # Redirects to /login if no valid token is present
    dashboard/
      KpiCard.tsx
      FleetStatusChart.tsx    # Recharts PieChart; derives counts from DashboardStats
      FilterBar.tsx           # vehicleType / status / region dropdowns
    vehicles/
      VehicleForm.tsx
    drivers/
      DriverForm.tsx
      LicenseExpiryBadge.tsx
    trips/
      TripCreateForm.tsx
      TripDetailDrawer.tsx
    maintenance/
      MaintenanceLogForm.tsx
    reports/
      ReportCard.tsx
      RoiTable.tsx
  pages/
    LoginPage.tsx
    DashboardPage.tsx
    VehiclesPage.tsx
    DriversPage.tsx
    TripsPage.tsx
    MaintenancePage.tsx
    FuelExpensesPage.tsx
    ReportsPage.tsx
  mocks/
    data.ts                   # Static mock data used when VITE_USE_MOCK=true
  lib/
    utils.ts                  # formatCurrency, formatDate helpers
    form.ts                   # zr() helper: wraps zodResolver for react-hook-form
```

---

## Routes

| Path | Component | Access |
|---|---|---|
| `/login` | `LoginPage` | Public |
| `/` | `DashboardPage` | Authenticated |
| `/vehicles` | `VehiclesPage` | Authenticated |
| `/drivers` | `DriversPage` | Authenticated |
| `/trips` | `TripsPage` | Authenticated |
| `/maintenance` | `MaintenancePage` | Authenticated |
| `/fuel-expenses` | `FuelExpensesPage` | Authenticated |
| `/reports` | `ReportsPage` | `FLEET_MANAGER`, `SAFETY_OFFICER`, `FINANCIAL_ANALYST` |

`RoleGuard` wraps every protected route. Unauthenticated users are redirected to `/login`. Users without the required role for `/reports` see a 403 screen rather than the page content.

---

## API Client

`api/client.ts` exports an Axios instance configured with the backend base URL. A request interceptor reads the current token from `authStore` and injects it as `Authorization: Bearer <token>` on every outgoing request. A response interceptor clears the auth store and redirects to `/login` on any `401` response.

Each module in `api/` (e.g. `vehicles.ts`, `trips.ts`) exports typed functions that call the Axios instance and return the typed response data.

---

## Auth Store (`store/authStore.ts`)

Zustand store with the following shape:

```ts
interface AuthState {
  token: string | null;
  user: { id: string; name: string; email: string; role: Role } | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}
```

State is persisted to `localStorage` so the session survives page refresh.

---

## Data Hooks

Each hook in `hooks/` wraps a TanStack Query `useQuery` or `useMutation` call, encapsulating the cache key, fetch function, and mutation side effects (cache invalidation). Consumers get typed, loading-aware data without managing fetch state themselves.

---

## Key Implementation Details

### Decimal serialisation
Prisma serialises `Decimal` database columns as **strings** over JSON. All frontend code that performs arithmetic on fields such as `cost`, `amount`, `liters`, `cargoWeight`, `maxLoadKg`, and `acquisitionCost` wraps those values in `Number()` before operating — e.g. `Number(vehicle.maxLoadKg)`. This applies to cost totals, per-litre calculations, and ROI computations.

### Dispatchable filtering
The trip creation form populates its vehicle and driver dropdowns using `GET /vehicles?dispatchable=true` and `GET /drivers?dispatchable=true` respectively. The server performs the eligibility filtering (checking status and licence expiry), so the dropdowns only ever present valid options.

### CSV export
The reports page triggers CSV export with `window.open(\`/api/reports/export.csv?token=${token}\`)`. Because browser navigation requests cannot carry custom `Authorization` headers, the token is passed as a query parameter. The backend auth middleware accepts this fallback specifically for this use case.

### Mock mode
Set `VITE_USE_MOCK=true` in the frontend `.env` to replace all API calls with the static data defined in `src/mocks/data.ts`. This allows UI development and testing without a running backend.

### Status badges
`StatusBadge` maps each enum value to a specific colour class. The colour scheme is consistent across all entity types: green for active/available states, amber for in-progress states, red for error/suspended/retired states, and grey for terminal states (cancelled, closed).

### Form validation
`lib/form.ts` exports a `zr()` helper that passes a Zod schema to `zodResolver` from `@hookform/resolvers/zod`. All forms use this helper to keep the `useForm` call concise and keep validation logic colocated with the Zod schema definition.

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