# TransitOps

A fleet operations management platform for logistics companies.

---

## The Problem

Transport and logistics operators typically manage their fleets through spreadsheets, physical logbooks, and disconnected tools. This creates tangible operational problems:

- Vehicles are dispatched without checking whether they are already on a trip or in the workshop, leading to scheduling conflicts and double-booking.
- Drivers with expired licenses or suspensions are not systematically excluded from trip assignments.
- Maintenance schedules are tracked manually, so vehicles return from service before work is complete, or sit idle without anyone knowing they are cleared.
- Fuel fill-ups and miscellaneous expenses are recorded inconsistently, making it impossible to produce accurate per-vehicle cost reports or calculate ROI against acquisition cost.
- There is no single view of fleet utilization, so managers cannot tell at a glance how many vehicles are active, in the shop, or sitting idle.

---

## The Solution

TransitOps is a centralized platform that covers the full transport operations lifecycle and enforces business rules at the API layer, not in spreadsheet formulas.

**Vehicle registry** — Each vehicle carries its registration number, type, region, maximum load capacity, and acquisition cost. Status (`AVAILABLE`, `ON_TRIP`, `IN_SHOP`, `RETIRED`) is system-managed and cannot be set directly via the API; it transitions automatically as a result of trip and maintenance actions.

**Driver management** — Drivers carry license category, expiry date, contact details, and a safety score. The dispatch system automatically excludes any driver whose license has expired or who is currently on a trip.

**Trip lifecycle** — Trips move through `DRAFT → DISPATCHED → COMPLETED / CANCELLED`. Dispatching a trip atomically marks the vehicle and driver as `ON_TRIP` and validates cargo weight against the vehicle's maximum load. Completing or cancelling a trip restores both to `AVAILABLE`.

**Maintenance tracking** — Opening a maintenance log moves the vehicle to `IN_SHOP` and removes it from the dispatchable pool. Closing the log restores the vehicle to `AVAILABLE`.

**Fuel and expense logging** — Fuel fill-ups and operational expenses (tolls, fines, parking, etc.) are recorded per vehicle with date and cost. These feed directly into the reporting layer.

**Reports and analytics** — The platform produces fleet-wide fuel efficiency (km/L), utilization rate (vehicles on trip ÷ active fleet), operational cost breakdown (fuel, maintenance, miscellaneous), and ROI against acquisition cost. All reports are exportable as CSV.

**Role-based access control** — Four roles (Fleet Manager, Driver, Safety Officer, Financial Analyst) with server-side enforcement. Unauthorized actions return `403`; unauthenticated requests return `401`.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State / Data | TanStack Query (React Query) |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Auth | JWT (RS256 via jsonwebtoken) |
| Containerization | Docker, Docker Compose |

---

## Running the Application

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

That is the only hard requirement. The database, backend, and frontend all run as containers.

### Start

```bash
git clone https://github.com/lightning4747/TransitOps.git
cd TransitOps
docker compose up
```

This will:
1. Start a PostgreSQL 16 database on port `5433`
2. Run Prisma migrations and seed the database with demo accounts
3. Start the API server on port `4000`
4. Start the Vite dev server on port `5173`

Open **http://localhost:5173** in your browser.

### Demo Accounts

All accounts use the password `password123`.

| Email | Role |
|---|---|
| `fleet@transitops.dev` | Fleet Manager |
| `driver@transitops.dev` | Driver |
| `safety@transitops.dev` | Safety Officer |
| `analyst@transitops.dev` | Financial Analyst |

### Running Without Docker

Requires Node.js 20+ and a PostgreSQL instance.

```bash
# 1. Set environment variables
# backend/.env
DATABASE_URL="postgresql://user:password@localhost:5432/transitops"
JWT_SECRET="your-secret"

# 2. Backend
cd backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev          # runs on :4000

# 3. Frontend (separate terminal)
cd frontend
npm install
npm run dev          # runs on :5173
```

---

## Project Structure

```
TransitOps/
├── backend/
│   ├── src/
│   │   ├── modules/        # auth, vehicles, drivers, trips, maintenance, fuel, expenses, reports, dashboard
│   │   ├── middleware/     # auth (JWT), RBAC, validation, error handling
│   │   └── lib/            # Prisma client
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.ts
├── frontend/
│   └── src/
│       ├── api/            # Axios API clients per module
│       ├── hooks/          # TanStack Query hooks
│       ├── pages/          # Route-level components
│       ├── components/     # Shared and feature components
│       ├── store/          # Zustand auth store
│       └── types/          # Shared TypeScript interfaces
└── docs/
    └── spec/               # Functional specification and task breakdown
```

---

## API Reference

Base URL: `http://localhost:4000/api`

All endpoints except `POST /auth/login` require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate and receive a JWT |
| `GET` | `/vehicles` | List vehicles (`?dispatchable=true` to filter) |
| `POST` | `/vehicles` | Register a vehicle |
| `PATCH` | `/vehicles/:id` | Update vehicle fields (status excluded) |
| `GET` | `/drivers` | List drivers (`?dispatchable=true` to filter) |
| `POST` | `/drivers` | Register a driver |
| `GET` | `/trips` | List trips |
| `POST` | `/trips` | Create a DRAFT trip |
| `POST` | `/trips/:id/dispatch` | Dispatch a trip |
| `POST` | `/trips/:id/complete` | Complete a trip |
| `POST` | `/trips/:id/cancel` | Cancel a trip |
| `GET` | `/maintenance-logs` | List maintenance logs |
| `POST` | `/maintenance-logs` | Open a maintenance log |
| `POST` | `/maintenance-logs/:id/close` | Close a maintenance log |
| `GET` | `/fuel-logs` | List fuel logs |
| `POST` | `/fuel-logs` | Create a fuel log |
| `GET` | `/expenses` | List expenses |
| `POST` | `/expenses` | Create an expense |
| `GET` | `/dashboard` | Fleet KPIs |
| `GET` | `/reports/fuel-efficiency` | Fuel efficiency report |
| `GET` | `/reports/utilization` | Fleet utilization |
| `GET` | `/reports/operational-cost` | Cost breakdown |
| `GET` | `/reports/roi` | ROI analysis |
| `GET` | `/reports/export.csv` | Full fleet CSV export |