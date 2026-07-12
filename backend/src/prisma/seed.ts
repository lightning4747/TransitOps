import { PrismaClient, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { createHash } from "crypto";
import * as dotenv from "dotenv";

// Prisma 7: URL is no longer in schema.prisma, must be passed to PrismaClient.
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple deterministic password hash for seed data.
 * In production the auth service uses bcrypt — this keeps the seed dependency-free
 * so it runs without bcrypt being installed (bcrypt is a backend-sprint concern).
 * Password for all seed users is: "password123"
 */
function hashPassword(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  Seeding database…");

  // ── Users (one per role) ────────────────────────────────────────────────
  const [userFleet, userDriver, userSafety, userAnalyst] = await Promise.all([
    prisma.user.upsert({
      where: { email: "fleet@transitops.dev" },
      update: {},
      create: {
        email: "fleet@transitops.dev",
        passwordHash: hashPassword("password123"),
        name: "Rajan Kumar",
        role: Role.FLEET_MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: "driver@transitops.dev" },
      update: {},
      create: {
        email: "driver@transitops.dev",
        passwordHash: hashPassword("password123"),
        name: "Arun Selvam",
        role: Role.DRIVER,
      },
    }),
    prisma.user.upsert({
      where: { email: "safety@transitops.dev" },
      update: {},
      create: {
        email: "safety@transitops.dev",
        passwordHash: hashPassword("password123"),
        name: "Priya Nair",
        role: Role.SAFETY_OFFICER,
      },
    }),
    prisma.user.upsert({
      where: { email: "analyst@transitops.dev" },
      update: {},
      create: {
        email: "analyst@transitops.dev",
        passwordHash: hashPassword("password123"),
        name: "Kavitha Menon",
        role: Role.FINANCIAL_ANALYST,
      },
    }),
  ]);

  console.log("  ✓ Users");

  // ── Vehicles ────────────────────────────────────────────────────────────
  const [vehicleAvail1, vehicleAvail2, vehicleInShop, vehicleRetired] = await Promise.all([
    prisma.vehicle.upsert({
      where: { regNumber: "TN-01-AB-1234" },
      update: {},
      create: {
        regNumber: "TN-01-AB-1234",
        name: "Ashok Leyland Dost",
        type: "Van",
        maxLoadKg: 1500,
        odometer: 42300,
        acquisitionCost: 850000,
        status: VehicleStatus.AVAILABLE,
        region: "Chennai",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNumber: "TN-02-CD-5678" },
      update: {},
      create: {
        regNumber: "TN-02-CD-5678",
        name: "Tata Ace Gold",
        type: "Truck",
        maxLoadKg: 750,
        odometer: 18900,
        acquisitionCost: 520000,
        status: VehicleStatus.AVAILABLE,
        region: "Coimbatore",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNumber: "TN-03-EF-9012" },
      update: {},
      create: {
        regNumber: "TN-03-EF-9012",
        name: "Mahindra Bolero Pickup",
        type: "Truck",
        maxLoadKg: 1200,
        odometer: 67800,
        acquisitionCost: 720000,
        status: VehicleStatus.IN_SHOP,
        region: "Chennai",
      },
    }),
    prisma.vehicle.upsert({
      where: { regNumber: "TN-04-GH-3456" },
      update: {},
      create: {
        regNumber: "TN-04-GH-3456",
        name: "TVS King Deluxe",
        type: "Bike",
        maxLoadKg: 300,
        odometer: 120500,
        acquisitionCost: 180000,
        status: VehicleStatus.RETIRED,
        region: "Madurai",
      },
    }),
  ]);

  console.log("  ✓ Vehicles");

  // ── Drivers ─────────────────────────────────────────────────────────────
  // Driver linked to the DRIVER user account
  const [driverLinked, driverExpired, driverSuspended, driverOnTrip] = await Promise.all([
    // AVAILABLE + valid license (linked to driver user)
    prisma.driver.upsert({
      where: { licenseNumber: "TN-DL-001-2023" },
      update: {},
      create: {
        userId: userDriver.id,
        name: "Arun Selvam",
        licenseNumber: "TN-DL-001-2023",
        licenseCategory: "LMV",
        licenseExpiry: daysFromNow(365),   // valid for 1 year
        contactNumber: "+91-98400-11111",
        safetyScore: 95,
        status: DriverStatus.AVAILABLE,
      },
    }),
    // AVAILABLE + EXPIRED license — should be excluded from dispatch pool
    prisma.driver.upsert({
      where: { licenseNumber: "TN-DL-002-2019" },
      update: {},
      create: {
        name: "Murugan Pillai",
        licenseNumber: "TN-DL-002-2019",
        licenseCategory: "LMV-TR",
        licenseExpiry: daysFromNow(-30),   // expired 30 days ago
        contactNumber: "+91-98400-22222",
        safetyScore: 72,
        status: DriverStatus.AVAILABLE,
      },
    }),
    // SUSPENDED
    prisma.driver.upsert({
      where: { licenseNumber: "TN-DL-003-2021" },
      update: {},
      create: {
        name: "Senthil Raj",
        licenseNumber: "TN-DL-003-2021",
        licenseCategory: "HMV",
        licenseExpiry: daysFromNow(180),
        contactNumber: "+91-98400-33333",
        safetyScore: 45,
        status: DriverStatus.SUSPENDED,
      },
    }),
    // AVAILABLE (will be set ON_TRIP after trips are created — separate update below)
    prisma.driver.upsert({
      where: { licenseNumber: "TN-DL-004-2022" },
      update: {},
      create: {
        name: "Karthik Durai",
        licenseNumber: "TN-DL-004-2022",
        licenseCategory: "LMV",
        licenseExpiry: daysFromNow(200),
        contactNumber: "+91-98400-44444",
        safetyScore: 88,
        status: DriverStatus.AVAILABLE,
      },
    }),
  ]);

  console.log("  ✓ Drivers");

  // ── Completed Trips ─────────────────────────────────────────────────────
  // Use upsert via id — we fix the id so the seed is idempotent.
  const TRIP_1_ID = "00000000-0000-0000-0000-000000000001";
  const TRIP_2_ID = "00000000-0000-0000-0000-000000000002";

  const dispatchedAt1 = new Date("2026-06-01T08:00:00Z");
  const completedAt1  = new Date("2026-06-01T16:00:00Z");
  const dispatchedAt2 = new Date("2026-06-05T09:00:00Z");
  const completedAt2  = new Date("2026-06-05T17:30:00Z");

  await Promise.all([
    prisma.trip.upsert({
      where: { id: TRIP_1_ID },
      update: {},
      create: {
        id: TRIP_1_ID,
        source: "Chennai",
        destination: "Coimbatore",
        vehicleId: vehicleAvail1.id,
        driverId: driverLinked.id,
        cargoWeight: 800,
        plannedDistance: 510,
        status: TripStatus.COMPLETED,
        startOdometer: 41800,
        endOdometer: 42310,
        fuelConsumed: 51,
        dispatchedAt: dispatchedAt1,
        completedAt: completedAt1,
        createdBy: userFleet.id,
      },
    }),
    prisma.trip.upsert({
      where: { id: TRIP_2_ID },
      update: {},
      create: {
        id: TRIP_2_ID,
        source: "Coimbatore",
        destination: "Madurai",
        vehicleId: vehicleAvail2.id,
        driverId: driverOnTrip.id,
        cargoWeight: 400,
        plannedDistance: 215,
        status: TripStatus.COMPLETED,
        startOdometer: 18690,
        endOdometer: 18905,
        fuelConsumed: 22,
        dispatchedAt: dispatchedAt2,
        completedAt: completedAt2,
        createdBy: userFleet.id,
      },
    }),
  ]);

  console.log("  ✓ Trips (completed)");

  // ── Fuel Logs ───────────────────────────────────────────────────────────
  await Promise.all([
    prisma.fuelLog.upsert({
      where: { id: "00000000-0000-0000-0001-000000000001" },
      update: {},
      create: {
        id: "00000000-0000-0000-0001-000000000001",
        vehicleId: vehicleAvail1.id,
        liters: 51,
        cost: 4743,   // ~₹93/litre
        date: new Date("2026-06-01"),
      },
    }),
    prisma.fuelLog.upsert({
      where: { id: "00000000-0000-0000-0001-000000000002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0001-000000000002",
        vehicleId: vehicleAvail2.id,
        liters: 22,
        cost: 2046,
        date: new Date("2026-06-05"),
      },
    }),
  ]);

  console.log("  ✓ Fuel logs");

  // ── Maintenance Log (ACTIVE for the IN_SHOP vehicle) ────────────────────
  await prisma.maintenanceLog.upsert({
    where: { id: "00000000-0000-0000-0002-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0002-000000000001",
      vehicleId: vehicleInShop.id,
      description: "Engine oil leak — gasket replacement and brake pad inspection",
      cost: 12500,
      status: MaintenanceStatus.ACTIVE,
    },
  });

  console.log("  ✓ Maintenance log");

  // ── Expense (demo toll) ─────────────────────────────────────────────────
  await prisma.expense.upsert({
    where: { id: "00000000-0000-0000-0003-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0003-000000000001",
      vehicleId: vehicleAvail1.id,
      type: "Toll",
      amount: 380,
      date: new Date("2026-06-01"),
    },
  });

  console.log("  ✓ Expenses");
  console.log("\n✅  Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
