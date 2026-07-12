import { MaintenanceLog, MaintenanceStatus, VehicleStatus } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateMaintenanceLogInput } from "./maintenance.schema";
import { AppError } from "../../middleware/errorHandler";

export interface MaintenanceLogFilters {
  vehicleId?: string;
  status?: MaintenanceStatus;
}

export const getMaintenanceLogs = async (filters: MaintenanceLogFilters): Promise<MaintenanceLog[]> => {
  const { vehicleId, status } = filters;
  const where: any = {};

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (status) {
    where.status = status;
  }

  return await prisma.maintenanceLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: true, // helpful to include vehicle information in logs
    },
  });
};

export const createMaintenanceLog = async (input: CreateMaintenanceLogInput): Promise<MaintenanceLog> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new AppError(409, "VEHICLE_ON_TRIP", "Cannot service a vehicle currently on trip");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create Maintenance Log (ACTIVE)
    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId: input.vehicleId,
        description: input.description,
        cost: input.cost ?? 0,
        status: MaintenanceStatus.ACTIVE,
      },
    });

    // 2. Set vehicle status to IN_SHOP
    await tx.vehicle.update({
      where: { id: input.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    });

    return log;
  });
};

export const closeMaintenanceLog = async (logId: string): Promise<MaintenanceLog> => {
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: logId },
  });

  if (!log) {
    throw new AppError(404, "MAINTENANCE_LOG_NOT_FOUND", "Maintenance log not found");
  }

  if (log.status === MaintenanceStatus.CLOSED) {
    throw new AppError(409, "MAINTENANCE_LOG_CLOSED", "Maintenance log is already closed");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update log status to CLOSED and set closedAt
    const updatedLog = await tx.maintenanceLog.update({
      where: { id: logId },
      data: {
        status: MaintenanceStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    // 2. Get vehicle status
    const vehicle = await tx.vehicle.findUnique({
      where: { id: log.vehicleId },
    });

    // 3. Set vehicle status back to AVAILABLE unless it is RETIRED
    if (vehicle && vehicle.status !== VehicleStatus.RETIRED) {
      await tx.vehicle.update({
        where: { id: log.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      });
    }

    return updatedLog;
  });
};
