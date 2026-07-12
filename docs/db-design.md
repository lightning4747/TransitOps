# TransitOps — Database Design

PostgreSQL + Prisma. This doc is the source of truth for schema — field names here must match backend and frontend docs exactly.

## Enums

```
Role            = FLEET_MANAGER | DRIVER | SAFETY_OFFICER | FINANCIAL_ANALYST
VehicleStatus   = AVAILABLE | ON_TRIP | IN_SHOP | RETIRED
DriverStatus    = AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED
TripStatus      = DRAFT | DISPATCHED | COMPLETED | CANCELLED
MaintenanceStatus = ACTIVE | CLOSED
```

## Tables

### User
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| email | string | unique, not null |
| passwordHash | string | not null |
| name | string | not null |
| role | Role | not null |
| createdAt | timestamp | default now() |

### Vehicle
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| regNumber | string | unique, not null |
| name | string | not null |
| type | string | not null (e.g. Van, Truck, Bike) |
| maxLoadKg | decimal | not null, > 0 |
| odometer | decimal | not null, default 0 |
| acquisitionCost | decimal | not null |
| status | VehicleStatus | not null, default AVAILABLE |
| region | string | nullable — used for dashboard filter |
| createdAt | timestamp | default now() |
| updatedAt | timestamp | auto-update |

Notes:
- `status` is the **stored** field, updated only by the transactional service functions in the backend (dispatch/complete/cancel/maintenance). It is never edited directly via a generic PATCH.
- "Available for dispatch" is **not** the same as `status === AVAILABLE` — see Computed Availability section. The stored status still matters (IN_SHOP / RETIRED / ON_TRIP are stored and authoritative); only the *driver-side* expiry/suspension check is computed at query time, because that's a Driver-table condition, not a Vehicle one. So for Vehicle, status alone is authoritative.

### Driver
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| userId | uuid | FK → User.id, nullable (a Driver may or may not have login access) |
| name | string | not null |
| licenseNumber | string | unique, not null |
| licenseCategory | string | not null |
| licenseExpiry | date | not null |
| contactNumber | string | not null |
| safetyScore | decimal | not null, default 100, range 0–100 |
| status | DriverStatus | not null, default AVAILABLE |
| createdAt | timestamp | default now() |
| updatedAt | timestamp | auto-update |

Notes:
- `status` is stored and covers ON_TRIP / OFF_DUTY / SUSPENDED — all backend-managed.
- **License expiry is NOT stored as a status.** It's a raw date. "Is this driver eligible to be dispatched?" is computed at query/validation time as: `status === AVAILABLE AND licenseExpiry > today`. This avoids a stale "expired" status sitting in the DB if nothing runs a daily job to flip it. See backend doc §Computed Eligibility.

### Trip
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| source | string | not null |
| destination | string | not null |
| vehicleId | uuid | FK → Vehicle.id, not null |
| driverId | uuid | FK → Driver.id, not null |
| cargoWeight | decimal | not null, > 0 |
| plannedDistance | decimal | not null, > 0 |
| status | TripStatus | not null, default DRAFT |
| startOdometer | decimal | nullable, set on dispatch |
| endOdometer | decimal | nullable, set on complete |
| fuelConsumed | decimal | nullable, set on complete (liters) |
| createdBy | uuid | FK → User.id |
| dispatchedAt | timestamp | nullable |
| completedAt | timestamp | nullable |
| cancelledAt | timestamp | nullable |
| createdAt | timestamp | default now() |

Constraint (app-level, not DB): `cargoWeight <= vehicle.maxLoadKg`, checked at dispatch time in the service layer, not as a DB CHECK, since it's a cross-table rule.

### MaintenanceLog
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| vehicleId | uuid | FK → Vehicle.id, not null |
| description | string | not null |
| cost | decimal | not null, default 0 |
| status | MaintenanceStatus | not null, default ACTIVE |
| createdAt | timestamp | default now() |
| closedAt | timestamp | nullable |

### FuelLog
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| vehicleId | uuid | FK → Vehicle.id, not null |
| liters | decimal | not null, > 0 |
| cost | decimal | not null, >= 0 |
| date | date | not null |
| createdAt | timestamp | default now() |

### Expense
| Field | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| vehicleId | uuid | FK → Vehicle.id, not null |
| type | string | not null (e.g. Toll, Fine, Maintenance-linked) |
| amount | decimal | not null, >= 0 |
| date | date | not null |
| createdAt | timestamp | default now() |

## Relationships

- User 1—N Trip (createdBy)
- User 1—0/1 Driver (a driver may have a login)
- Vehicle 1—N Trip
- Vehicle 1—N MaintenanceLog
- Vehicle 1—N FuelLog
- Vehicle 1—N Expense
- Driver 1—N Trip

## Indexes

- `Vehicle.regNumber` unique index
- `Driver.licenseNumber` unique index
- `Trip.vehicleId`, `Trip.driverId`, `Trip.status` — composite/individual indexes for dispatch-pool queries
- `MaintenanceLog.vehicleId + status` — for "does this vehicle have an active maintenance log" lookups
- `FuelLog.vehicleId + date`, `Expense.vehicleId + date` — for cost rollup queries

## Computed values (NOT stored — derived at query time)

These live in backend query logic, not the DB, to avoid drift:

1. **Driver dispatch eligibility** = `driver.status === AVAILABLE AND driver.licenseExpiry > CURRENT_DATE`
2. **Vehicle dispatch eligibility** = `vehicle.status === AVAILABLE` (status is authoritative here — no additional derived check needed since IN_SHOP/RETIRED/ON_TRIP are always kept in sync by the transactional service functions)
3. **Fuel Efficiency** (per vehicle) = `SUM(trip.plannedDistance for completed trips) / SUM(fuelLog.liters)`
4. **Fleet Utilization (%)** = `COUNT(vehicles where status = ON_TRIP) / COUNT(vehicles where status != RETIRED) * 100`
5. **Operational Cost** (per vehicle) = `SUM(FuelLog.cost) + SUM(MaintenanceLog.cost) + SUM(Expense.amount)`
6. **Vehicle ROI** = `(Revenue - (Maintenance + Fuel)) / AcquisitionCost` — Revenue is out of scope for stored data (no revenue field defined in spec); treat Revenue as `SUM(Expense where type = 'Revenue')` if teams choose to log it, otherwise stub as 0 and flag in the report UI as "Revenue tracking not yet configured." **Decision needed from product owner before backend build** — flagging here so it isn't silently guessed at in two different ways by DB and frontend.

## Referential integrity / cascade rules

- Deleting a Vehicle or Driver is **not supported** in MVP (no hard delete) — use status RETIRED / SUSPENDED instead. This avoids orphaned Trip/MaintenanceLog/FuelLog rows.
- FK on Trip.vehicleId / Trip.driverId: `ON DELETE RESTRICT` (should never fire given no hard deletes, but protects against accidental cleanup scripts).

## Seed data requirements (for demo/testing)

- 1 user per role (4 users)
- 3–5 vehicles across statuses (mostly AVAILABLE, one IN_SHOP, one RETIRED)
- 3–5 drivers (mostly AVAILABLE, one with expired license, one SUSPENDED)
- 1–2 completed trips with fuel logs, to make Reports non-empty on first load