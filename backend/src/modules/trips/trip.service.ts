import { Trip, TripStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateTripInput, CompleteTripInput } from "./trip.schema";
import { AppError } from "../../middleware/errorHandler";
import { isVehicleDispatchEligible, isDriverDispatchEligible } from "../../lib/eligibility";

export interface TripFilters {
  status?: TripStatus;
  driverId?: string;
  vehicleId?: string;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getTrips = async (filters: TripFilters): Promise<Trip[]> => {
  const { status, driverId, vehicleId } = filters;
  const where: any = {};

  if (status) where.status = status;
  if (driverId) where.driverId = driverId;
  if (vehicleId) where.vehicleId = vehicleId;

  return prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const getTripById = async (id: string): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({ where: { id } });

  if (!trip) {
    throw new AppError(404, "TRIP_NOT_FOUND", "Trip not found");
  }

  return trip;
};

// ─── Create (DRAFT — no side-effects) ─────────────────────────────────────────

export const createTrip = async (
  input: CreateTripInput,
  createdBy: string
): Promise<Trip> => {
  // Validate FK targets exist before inserting — gives a clean 404 instead of
  // a raw Prisma FK constraint error.
  const vehicle = await prisma.vehicle.findUnique({ where: { id: input.vehicleId } });
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }

  const driver = await prisma.driver.findUnique({ where: { id: input.driverId } });
  if (!driver) {
    throw new AppError(404, "DRIVER_NOT_FOUND", "Driver not found");
  }

  // Create trip as DRAFT — no status transitions on Vehicle or Driver yet.
  return prisma.trip.create({
    data: {
      source: input.source,
      destination: input.destination,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      cargoWeight: input.cargoWeight,
      plannedDistance: input.plannedDistance,
      status: TripStatus.DRAFT,
      createdBy,
    },
  });
};

// ─── Dispatch ─────────────────────────────────────────────────────────────────

export const dispatchTrip = async (tripId: string): Promise<Trip> => {
  // Load all three entities we need to validate before touching anything.
  const trip = await getTripById(tripId);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle attached to this trip not found");
  }

  const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
  if (!driver) {
    throw new AppError(404, "DRIVER_NOT_FOUND", "Driver attached to this trip not found");
  }

  // ── Business rule guards ────────────────────────────────────────────────────

  if (trip.status !== TripStatus.DRAFT) {
    throw new AppError(409, "INVALID_TRIP_STATE", "Trip is not in DRAFT status");
  }

  if (!isVehicleDispatchEligible(vehicle)) {
    throw new AppError(409, "VEHICLE_NOT_AVAILABLE", "Vehicle not available for dispatch");
  }

  if (!isDriverDispatchEligible(driver)) {
    throw new AppError(
      409,
      "DRIVER_NOT_ELIGIBLE",
      "Driver not eligible (license expired, suspended, or unavailable)"
    );
  }

  // Prisma Decimal comparison — convert both sides to number for the check.
  if (Number(trip.cargoWeight) > Number(vehicle.maxLoadKg)) {
    throw new AppError(
      400,
      "CARGO_EXCEEDS_CAPACITY",
      "Cargo weight exceeds vehicle maximum load capacity"
    );
  }

  // ── Atomic transaction ──────────────────────────────────────────────────────
  // All three writes must succeed or none do — no partial state.
  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.DISPATCHED,
        dispatchedAt: new Date(),
        startOdometer: vehicle.odometer, // captured from vehicle at dispatch time
      },
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: "ON_TRIP" },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { status: "ON_TRIP" },
    }),
  ]);

  return updatedTrip;
};

// ─── Complete ─────────────────────────────────────────────────────────────────

export const completeTrip = async (
  tripId: string,
  input: CompleteTripInput
): Promise<Trip> => {
  const trip = await getTripById(tripId);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle attached to this trip not found");
  }

  const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
  if (!driver) {
    throw new AppError(404, "DRIVER_NOT_FOUND", "Driver attached to this trip not found");
  }

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (trip.status !== TripStatus.DISPATCHED) {
    throw new AppError(409, "INVALID_TRIP_STATE", "Trip is not in DISPATCHED status");
  }

  // Odometer can only move forward.
  if (input.endOdometer < Number(vehicle.odometer)) {
    throw new AppError(
      400,
      "INVALID_ODOMETER",
      "End odometer must be >= current vehicle odometer"
    );
  }

  // ── Atomic transaction ──────────────────────────────────────────────────────
  // FuelLog is NOT auto-created here — separate entry required (single-purpose).
  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.COMPLETED,
        completedAt: new Date(),
        endOdometer: input.endOdometer,
        fuelConsumed: input.fuelConsumed,
      },
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        status: "AVAILABLE",
        odometer: input.endOdometer, // advance vehicle odometer
      },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return updatedTrip;
};

// ─── Cancel ───────────────────────────────────────────────────────────────────

export const cancelTrip = async (tripId: string): Promise<Trip> => {
  const trip = await getTripById(tripId);

  if (trip.status === TripStatus.DRAFT) {
    // DRAFT cancel: no vehicle/driver were ever set ON_TRIP, so no side-effects needed.
    // Simple status flip — no transaction required.
    return prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  if (trip.status !== TripStatus.DISPATCHED) {
    throw new AppError(
      409,
      "INVALID_TRIP_STATE",
      "Only DRAFT or DISPATCHED trips can be cancelled"
    );
  }

  // DISPATCHED cancel: must restore vehicle and driver to AVAILABLE atomically.
  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle attached to this trip not found");
  }

  const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
  if (!driver) {
    throw new AppError(404, "DRIVER_NOT_FOUND", "Driver attached to this trip not found");
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: "AVAILABLE" },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { status: "AVAILABLE" },
    }),
  ]);

  return updatedTrip;
};
