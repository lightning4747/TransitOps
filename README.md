# TransitOps

Smart Transport Operations Platform — built for an 8-hour hackathon.

Digitizes vehicle, driver, dispatch, maintenance, and expense management for logistics fleets, replacing spreadsheets and manual logbooks.

## Problem

Transport operators manage fleets manually, leading to scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, and poor cost visibility.

## Solution

A centralized platform covering the full transport operations lifecycle: vehicle registry, driver management, trip dispatch, maintenance tracking, fuel/expense logging, and reporting — with business rules enforced server-side (e.g. vehicles in maintenance are never dispatchable, drivers with expired licenses can't be assigned).

## Stack

- Frontend: React, TypeScript, Tailwind, shadcn/ui, TanStack Query
- Backend: Node.js, Express, TypeScript, Prisma
- Database: PostgreSQL
- Auth: JWT with role-based access control

## Roles

- **Fleet Manager** — vehicles, drivers, maintenance, trip dispatch
- **Driver** — creates and manages trips
- **Safety Officer** — driver compliance, license validity, safety scores
- **Financial Analyst** — expense, fuel, and profitability reports

## Documentation

- [`db-design.md`](./db-design.md) — schema, entities, computed values
- [`backend-design.md`](./backend-design.md) — API endpoints, business rule enforcement, RBAC
- [`frontend-design.md`](./frontend-design.md) — routes, components, forms

## Setup

```bash
# backend
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# frontend
cd frontend
npm install
npm run dev
```

Environment variables required: `DATABASE_URL`, `JWT_SECRET`.

## Status

In development.