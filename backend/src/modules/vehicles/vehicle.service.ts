import { Vehicle, VehicleStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateVehicleInput, UpdateVehicleInput } from "./vehicle.schema";
import { AppError } from "../../middleware/errorHandler";

export interface VehicleFilters {
  type?: string;
  status?: VehicleStatus;
  region?: string;
  dispatchable?: boolean;
}

export const getVehicles = async (filters: VehicleFilters): Promise<Vehicle[]> => {
  const { type, status, region, dispatchable } = filters;
  const where: any = {};

  if (type) {
    where.type = {
      equals: type,
      mode: "insensitive", // case-insensitive type filtering
    };
  }

  if (status) {
    where.status = status;
  }

  if (region) {
    where.region = {
      equals: region,
      mode: "insensitive", // case-insensitive region filtering
    };
  }

  if (dispatchable) {
    where.status = VehicleStatus.AVAILABLE;
  }

  return await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const createVehicle = async (input: CreateVehicleInput): Promise<Vehicle> => {
  const existing = await prisma.vehicle.findUnique({
    where: { regNumber: input.regNumber },
  });

  if (existing) {
    throw new AppError(409, "DUPLICATE_REGISTRATION", "Vehicle with this registration number already exists");
  }

  return await prisma.vehicle.create({
    data: {
      regNumber: input.regNumber,
      name: input.name,
      type: input.type,
      maxLoadKg: input.maxLoadKg,
      acquisitionCost: input.acquisitionCost,
      region: input.region || null,
      status: VehicleStatus.AVAILABLE,
    },
  });
};

export const getVehicleById = async (id: string): Promise<Vehicle> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }

  return vehicle;
};

export const updateVehicle = async (id: string, input: UpdateVehicleInput): Promise<Vehicle> => {
  // Check if vehicle exists
  await getVehicleById(id);

  // Check if updating regNumber and if it conflicts with another vehicle
  if (input.regNumber) {
    const existing = await prisma.vehicle.findUnique({
      where: { regNumber: input.regNumber },
    });

    if (existing && existing.id !== id) {
      throw new AppError(409, "DUPLICATE_REGISTRATION", "Another vehicle with this registration number already exists");
    }
  }

  return await prisma.vehicle.update({
    where: { id },
    data: {
      ...input,
      region: input.region === undefined ? undefined : (input.region || null),
    },
  });
};
