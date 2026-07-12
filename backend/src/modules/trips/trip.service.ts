import { Trip, TripStatus, VehicleStatus, DriverStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateTripInput, CompleteTripInput } from "./trip.schema";
import { isDriverDispatchEligible, isVehicleDispatchEligible } from "../../lib/eligibility";
import { AppError } from "../../middleware/errorHandler";

export interface TripFilters {
  status?: TripStatus;
  driverId?: string;
  vehicleId?: string;
}

export const getTrips = async (filters: TripFilters): Promise<Trip[]> => {
  const { status, driverId, vehicleId } = filters;
  const where: any = {};

  if (status) {
    where.status = status;
  }
  if (driverId) {
    where.driverId = driverId;
  }
  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  return await prisma.trip.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: true,
      driver: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

export const createTrip = async (input: CreateTripInput, createdBy: string): Promise<Trip> => {
  // Validate that vehicle and driver exist
  const [vehicle, driver] = await Promise.all([
    prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
    prisma.driver.findUnique({ where: { id: input.driverId } }),
  ]);

  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }

  if (!driver) {
    throw new AppError(404, "DRIVER_NOT_FOUND", "Driver not found");
  }

  return await prisma.trip.create({
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

export const dispatchTrip = async (tripId: string): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true, driver: true },
  });

  if (!trip) {
    throw new AppError(404, "TRIP_NOT_FOUND", "Trip not found");
  }

  if (trip.status !== TripStatus.DRAFT) {
    throw new AppError(409, "INVALID_TRIP_STATUS", "Only DRAFT trips can be dispatched");
  }

  if (!isVehicleDispatchEligible(trip.vehicle)) {
    throw new AppError(409, "VEHICLE_NOT_AVAILABLE", "Vehicle is not available for dispatch");
  }

  if (!isDriverDispatchEligible(trip.driver)) {
    throw new AppError(
      409,
      "DRIVER_NOT_ELIGIBLE",
      "Driver is not eligible (license expired, suspended, or unavailable)"
    );
  }

  if (Number(trip.cargoWeight) > Number(trip.vehicle.maxLoadKg)) {
    throw new AppError(400, "CARGO_EXCEEDS_CAPACITY", "Cargo weight exceeds vehicle capacity");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update vehicle status to ON_TRIP
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.ON_TRIP },
    });

    // 2. Update driver status to ON_TRIP
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.ON_TRIP },
    });

    // 3. Update trip status to DISPATCHED, record dispatchedAt and starting odometer
    return await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.DISPATCHED,
        dispatchedAt: new Date(),
        startOdometer: trip.vehicle.odometer,
      },
    });
  });
};

export const completeTrip = async (tripId: string, input: CompleteTripInput): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { vehicle: true },
  });

  if (!trip) {
    throw new AppError(404, "TRIP_NOT_FOUND", "Trip not found");
  }

  if (trip.status !== TripStatus.DISPATCHED) {
    throw new AppError(409, "INVALID_TRIP_STATUS", "Only DISPATCHED trips can be completed");
  }

  if (trip.startOdometer && Number(input.endOdometer) < Number(trip.startOdometer)) {
    throw new AppError(
      400,
      "INVALID_ODOMETER",
      "End odometer cannot be less than start odometer"
    );
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update vehicle status to AVAILABLE and update odometer
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: {
        status: VehicleStatus.AVAILABLE,
        odometer: input.endOdometer,
      },
    });

    // 2. Update driver status to AVAILABLE
    await tx.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE },
    });

    // 3. Update trip status to COMPLETED, recording endOdometer, fuelConsumed, completedAt
    return await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.COMPLETED,
        endOdometer: input.endOdometer,
        fuelConsumed: input.fuelConsumed,
        completedAt: new Date(),
      },
    });
  });
};

export const cancelTrip = async (tripId: string): Promise<Trip> => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });

  if (!trip) {
    throw new AppError(404, "TRIP_NOT_FOUND", "Trip not found");
  }

  if (trip.status !== TripStatus.DISPATCHED && trip.status !== TripStatus.DRAFT) {
    throw new AppError(
      409,
      "INVALID_TRIP_STATUS",
      "Only DRAFT or DISPATCHED trips can be cancelled"
    );
  }

  const wasDispatched = trip.status === TripStatus.DISPATCHED;

  return await prisma.$transaction(async (tx) => {
    if (wasDispatched) {
      // Restore vehicle status to AVAILABLE
      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });

      // Restore driver status to AVAILABLE
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      });
    }

    // Set trip status to CANCELLED and record cancelledAt
    return await tx.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  });
};
