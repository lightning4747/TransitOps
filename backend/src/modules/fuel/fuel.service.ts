import { FuelLog } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateFuelLogInput } from "./fuel.schema";
import { AppError } from "../../middleware/errorHandler";

export interface FuelLogFilters {
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const getFuelLogs = async (filters: FuelLogFilters): Promise<FuelLog[]> => {
  const { vehicleId, startDate, endDate } = filters;
  const where: any = {};

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = startDate;
    }
    if (endDate) {
      where.date.lte = endDate;
    }
  }

  return await prisma.fuelLog.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: true },
  });
};

export const createFuelLog = async (input: CreateFuelLogInput): Promise<FuelLog> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }

  return await prisma.fuelLog.create({
    data: {
      vehicleId: input.vehicleId,
      liters: input.liters,
      cost: input.cost,
      date: input.date,
    },
  });
};
