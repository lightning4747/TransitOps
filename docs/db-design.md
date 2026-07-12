# Database Design

## Overview

TransitOps uses PostgreSQL as its database, managed through Prisma ORM. The schema models a fleet management domain: vehicles, drivers, trips, maintenance, fuel consumption, and operational expenses.

---

## Enumerations

### `Role`
Assigned to every `User`. Controls access to routes via RBAC middleware.

| Value | Description |
|---|---|
| `FLEET_MANAGER` | Full operational control — vehicles, drivers, trips, maintenance |
| `DRIVER` | Can create and advance trips; read-only on everything else |
| `SAFETY_OFFICER` | Can patch driver records and close maintenance logs; read reports |
| `FINANCIAL_ANALYST` | Read-only + access to cost/ROI reports |

### `VehicleStatus`

| Value | Description |
|---|---|
| `AVAILABLE` | Ready to be dispatched |
| `ON_TRIP` | Currently assigned to an active trip |
| `IN_SHOP` | Under maintenance — cannot be dispatched |
| `RETIRED` | Permanently decommissioned — excluded from utilisation metrics |

### `DriverStatus`

| Value | Description |
|---|---|
| `AVAILABLE` | Ready to be assigned |
| `ON_TRIP` | Currently driving an active trip |
| `OFF_DUTY` | Not available for dispatch |
| `SUSPENDED` | Cannot be assigned to any trip |

### `TripStatus`

| Value | Description |
|---|---|
| `DRAFT` | Created but not yet dispatched |
| `DISPATCHED` | Vehicle and driver committed; trip is active |
| `COMPLETED` | Trip finished; odometer and fuel readings recorded |
| `CANCELLED` | Trip aborted; vehicle and driver released |

### `MaintenanceStatus`

| Value | Description |
|---|---|
| `ACTIVE` | Vehicle is currently in the shop |
| `CLOSED` | Maintenance completed; vehicle returned to `AVAILABLE` |

---

## Tables

### `Vehicle`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `regNumber` | `String` | Unique registration number |
| `name` | `String` | Human-readable label |
| `type` | `String` | e.g. `Truck`, `Van`, `Bus` |
| `status` | `VehicleStatus` | System-managed — never set directly via PATCH |
| `odometer` | `Decimal` | Current odometer reading (km). Updated on trip completion |
| `maxLoadKg` | `Decimal` | Maximum cargo weight the vehicle can carry |
| `acquisitionCost` | `Decimal` | Purchase price — used in ROI calculations |
| `region` | `String?` | Optional geographic assignment |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

### `Driver`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `name` | `String` | Full name |
| `licenseNumber` | `String` | Unique licence identifier |
| `licenseCategory` | `String` | e.g. `Class A`, `Class C` |
| `licenseExpiry` | `DateTime` | Must be in the future for the driver to be dispatchable |
| `contactNumber` | `String` | Phone number |
| `safetyScore` | `Float?` | Optional safety rating |
| `status` | `DriverStatus` | System-managed — never set directly via PATCH |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

### `Trip`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `source` | `String` | Departure location |
| `destination` | `String` | Arrival location |
| `status` | `TripStatus` | Lifecycle state |
| `vehicleId` | `String` | FK → `Vehicle.id` |
| `driverId` | `String` | FK → `Driver.id` |
| `cargoWeight` | `Decimal` | Cargo weight for this trip (kg) |
| `plannedDistance` | `Float` | Expected distance in km |
| `endOdometer` | `Float?` | Set on completion |
| `fuelConsumed` | `Float?` | Litres consumed — set on completion |
| `createdById` | `String` | FK → `User.id` |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

### `MaintenanceLog`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `vehicleId` | `String` | FK → `Vehicle.id` |
| `description` | `String` | Description of the work being done |
| `cost` | `Decimal?` | Estimated or final cost |
| `status` | `MaintenanceStatus` | `ACTIVE` on creation; `CLOSED` when work completes |
| `createdAt` | `DateTime` | Record creation timestamp |
| `updatedAt` | `DateTime` | Last update timestamp |

### `FuelLog`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `vehicleId` | `String` | FK → `Vehicle.id` |
| `liters` | `Decimal` | Volume of fuel added |
| `cost` | `Decimal` | Total cost of the fuelling event |
| `date` | `DateTime` | Date of the fuelling event |
| `createdAt` | `DateTime` | Record creation timestamp |

### `Expense`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `vehicleId` | `String` | FK → `Vehicle.id` |
| `type` | `String` | Free-text category: `Toll`, `Parking`, `Fine`, `Cleaning`, `Other`, `Revenue` |
| `amount` | `Decimal` | Monetary value |
| `date` | `DateTime` | Date the expense was incurred |
| `createdAt` | `DateTime` | Record creation timestamp |

### `User`

| Column | Type | Notes |
|---|---|---|
| `id` | `String` (UUID) | Primary key |
| `name` | `String` | Display name |
| `email` | `String` | Unique — used for login |
| `password` | `String` | bcrypt hash |
| `role` | `Role` | Determines RBAC permissions |
| `createdAt` | `DateTime` | Record creation timestamp |

---

## Relationships

| Relationship | Cardinality |
|---|---|
| `Vehicle` → `Trip` | One-to-many |
| `Vehicle` → `MaintenanceLog` | One-to-many |
| `Vehicle` → `FuelLog` | One-to-many |
| `Vehicle` → `Expense` | One-to-many |
| `Driver` → `Trip` | One-to-many |
| `User` → `Trip` (`createdBy`) | One-to-many |

---

## Implementation Notes

### Status is system-managed
`Vehicle.status` and `Driver.status` are never set by API consumers directly. They are transitioned exclusively by trip lifecycle mutations (dispatch, complete, cancel) and maintenance log mutations (open, close). The `PATCH /vehicles/:id` handler explicitly rejects any payload that includes a `status` field.

### Decimal serialisation
Prisma serialises all `Decimal` columns as **strings** over JSON. This affects: `cost`, `amount`, `liters`, `cargoWeight`, `maxLoadKg`, `acquisitionCost`, and `odometer`. Any consumer performing arithmetic on these values must call `Number()` before operating — e.g. `Number(vehicle.maxLoadKg)`.

### Seed data
`prisma/seed.ts` populates the database with a representative set of vehicles, drivers, users (one per role), trips in various states, maintenance logs, fuel logs, and expenses — sufficient to exercise every dashboard metric and report endpoint.