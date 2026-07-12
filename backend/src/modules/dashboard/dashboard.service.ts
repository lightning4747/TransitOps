import { VehicleStatus, TripStatus, DriverStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface DashboardStats {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

export interface DashboardFilters {
  vehicleType?: string;
  status?: VehicleStatus;
  region?: string;
}

export const getDashboardStats = async (filters: DashboardFilters): Promise<DashboardStats> => {
  const { vehicleType, status, region } = filters;

  // Base vehicle where filter
  const vehicleWhere: any = {};
  if (vehicleType) {
    vehicleWhere.type = {
      equals: vehicleType,
      mode: "insensitive",
    };
  }
  if (status) {
    vehicleWhere.status = status;
  }
  if (region) {
    vehicleWhere.region = {
      equals: region,
      mode: "insensitive",
    };
  }

  // 1. activeVehicles (status != RETIRED)
  const activeVehiclesWhere = {
    ...vehicleWhere,
    status: status
      ? status !== VehicleStatus.RETIRED
        ? status
        : "IMPOSSIBLE_STATUS" // if they specifically filter for RETIRED, active (non-retired) vehicles is 0
      : { not: VehicleStatus.RETIRED },
  };

  // 2. availableVehicles (status == AVAILABLE)
  const availableVehiclesWhere = {
    ...vehicleWhere,
    status: status
      ? status === VehicleStatus.AVAILABLE
        ? VehicleStatus.AVAILABLE
        : "IMPOSSIBLE_STATUS"
      : VehicleStatus.AVAILABLE,
  };

  // 3. vehiclesInMaintenance (status == IN_SHOP)
  const vehiclesInMaintenanceWhere = {
    ...vehicleWhere,
    status: status
      ? status === VehicleStatus.IN_SHOP
        ? VehicleStatus.IN_SHOP
        : "IMPOSSIBLE_STATUS"
      : VehicleStatus.IN_SHOP,
  };

  // 4. activeTrips (status == DISPATCHED) - filtered by vehicle criteria
  const activeTripsWhere = {
    status: TripStatus.DISPATCHED,
    vehicle: vehicleWhere,
  };

  // 5. pendingTrips (status == DRAFT) - filtered by vehicle criteria
  const pendingTripsWhere = {
    status: TripStatus.DRAFT,
    vehicle: vehicleWhere,
  };

  // 6. driversOnDuty (status == ON_TRIP) - filtered by vehicle criteria on active trips
  const driversOnDutyWhere = {
    status: DriverStatus.ON_TRIP,
    trips: {
      some: {
        status: TripStatus.DISPATCHED,
        vehicle: vehicleWhere,
      },
    },
  };

  // 7. fleetUtilization (%) = COUNT(vehicles status = ON_TRIP) / COUNT(vehicles status != RETIRED) * 100
  const utilizationOnTripWhere = {
    ...vehicleWhere,
    status: status
      ? status === VehicleStatus.ON_TRIP
        ? VehicleStatus.ON_TRIP
        : "IMPOSSIBLE_STATUS"
      : VehicleStatus.ON_TRIP,
  };

  const utilizationTotalWhere = {
    ...vehicleWhere,
    status: status
      ? status !== VehicleStatus.RETIRED
        ? status
        : "IMPOSSIBLE_STATUS"
      : { not: VehicleStatus.RETIRED },
  };

  // Execute queries in parallel
  const [
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    onTripCount,
    totalActiveVehiclesCount,
  ] = await Promise.all([
    prisma.vehicle.count({ where: activeVehiclesWhere }),
    prisma.vehicle.count({ where: availableVehiclesWhere }),
    prisma.vehicle.count({ where: vehiclesInMaintenanceWhere }),
    prisma.trip.count({ where: activeTripsWhere }),
    prisma.trip.count({ where: pendingTripsWhere }),
    prisma.driver.count({ where: driversOnDutyWhere }),
    prisma.vehicle.count({ where: utilizationOnTripWhere }),
    prisma.vehicle.count({ where: utilizationTotalWhere }),
  ]);

  const fleetUtilization =
    totalActiveVehiclesCount > 0
      ? Math.round((onTripCount / totalActiveVehiclesCount) * 100 * 100) / 100
      : 0;

  return {
    activeVehicles,
    availableVehicles,
    vehiclesInMaintenance,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    fleetUtilization,
  };
};
