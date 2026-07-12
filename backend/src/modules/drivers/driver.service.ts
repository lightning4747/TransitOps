import { Driver, DriverStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateDriverInput, UpdateDriverInput } from "./driver.schema";
import { AppError } from "../../middleware/errorHandler";
import { isDriverDispatchEligible } from "../../lib/eligibility";

export interface DriverFilters {
  status?: DriverStatus;
  /**
   * When true, return only drivers that are currently eligible for dispatch.
   * Eligibility = status === AVAILABLE AND licenseExpiry > today.
   *
   * IMPORTANT: licenseExpiry is a raw date field — NOT a stored "expired" status.
   * The check is performed in the service layer (application code) rather than as a
   * DB WHERE clause, because a stale "expired" enum in the DB would require a
   * scheduled job to stay accurate. Filtering in application code avoids that drift.
   * See db-design.md §Computed values #1 and backend.md §Computed eligibility.
   */
  dispatchable?: boolean;
}

export const getDrivers = async (filters: DriverFilters): Promise<Driver[]> => {
  const { status, dispatchable } = filters;
  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (dispatchable) {
    // For dispatchable=true we must also include drivers whose licenseExpiry > today.
    // We pre-filter on status=AVAILABLE in the DB query to narrow the result set,
    // then apply isDriverDispatchEligible() in memory to additionally enforce the
    // expiry check (which cannot be reliably done as a stored DB column value).
    where.status = DriverStatus.AVAILABLE;
  }

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (dispatchable) {
    // Secondary in-memory filter: drop any AVAILABLE drivers whose license has expired.
    // isDriverDispatchEligible() re-checks both status and licenseExpiry > new Date().
    return drivers.filter(isDriverDispatchEligible);
  }

  return drivers;
};

export const createDriver = async (input: CreateDriverInput): Promise<Driver> => {
  // Enforce unique license number
  const existing = await prisma.driver.findUnique({
    where: { licenseNumber: input.licenseNumber },
  });

  if (existing) {
    throw new AppError(409, "DUPLICATE_LICENSE", "A driver with this license number already exists");
  }

  return await prisma.driver.create({
    data: {
      name: input.name,
      licenseNumber: input.licenseNumber,
      licenseCategory: input.licenseCategory,
      // Convert the raw ISO date string to a Date object for Prisma (@db.Date).
      // The stored value is the raw date — eligibility is computed at query time.
      licenseExpiry: new Date(input.licenseExpiry),
      contactNumber: input.contactNumber,
      safetyScore: input.safetyScore ?? 100,
      // status defaults to AVAILABLE per schema — never set it here; it is system-managed.
      userId: input.userId ?? null,
    },
  });
};

export const getDriverById = async (id: string): Promise<Driver> => {
  const driver = await prisma.driver.findUnique({
    where: { id },
  });

  if (!driver) {
    throw new AppError(404, "DRIVER_NOT_FOUND", "Driver not found");
  }

  return driver;
};

export const updateDriver = async (id: string, input: UpdateDriverInput): Promise<Driver> => {
  // Ensure driver exists
  await getDriverById(id);

  // Enforce unique license number if it is being changed
  if (input.licenseNumber) {
    const existing = await prisma.driver.findUnique({
      where: { licenseNumber: input.licenseNumber },
    });

    if (existing && existing.id !== id) {
      throw new AppError(409, "DUPLICATE_LICENSE", "Another driver with this license number already exists");
    }
  }

  return await prisma.driver.update({
    where: { id },
    data: {
      ...input,
      // Convert the raw date string to a Date object when provided.
      // licenseExpiry remains a raw date field — never a computed "expired" status.
      licenseExpiry: input.licenseExpiry ? new Date(input.licenseExpiry) : undefined,
      userId: input.userId === undefined ? undefined : (input.userId ?? null),
    },
  });
};
