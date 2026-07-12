import { VehicleStatus, TripStatus } from "@prisma/client";
import prisma from "../../lib/prisma";

export interface FuelEfficiencyReport {
  vehicleId: string | null;
  totalDistance: number;
  totalLiters: number;
  fuelEfficiency: number; // distance / liters
}

export interface OperationalCostReport {
  vehicleId: string | null;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
}

export interface ROIReport {
  vehicleId: string | null;
  revenueTracked: boolean;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  acquisitionCost: number;
  roi: number | null; // percentage
}

export const getFuelEfficiency = async (vehicleId?: string): Promise<FuelEfficiencyReport> => {
  const completedTrips = await prisma.trip.findMany({
    where: {
      status: TripStatus.COMPLETED,
      ...(vehicleId ? { vehicleId } : {}),
    },
    select: { plannedDistance: true },
  });

  const fuelLogs = await prisma.fuelLog.findMany({
    where: vehicleId ? { vehicleId } : {},
    select: { liters: true },
  });

  const totalDistance = completedTrips.reduce((sum, t) => sum + Number(t.plannedDistance), 0);
  const totalLiters = fuelLogs.reduce((sum, f) => sum + Number(f.liters), 0);
  const fuelEfficiency = totalLiters > 0 ? Math.round((totalDistance / totalLiters) * 100) / 100 : 0;

  return {
    vehicleId: vehicleId || null,
    totalDistance,
    totalLiters,
    fuelEfficiency,
  };
};

export const getFleetUtilization = async (region?: string, type?: string): Promise<{ utilization: number }> => {
  const vehicleWhere: any = {};
  if (region) {
    vehicleWhere.region = { equals: region, mode: "insensitive" };
  }
  if (type) {
    vehicleWhere.type = { equals: type, mode: "insensitive" };
  }

  const [onTripCount, totalActiveCount] = await Promise.all([
    prisma.vehicle.count({
      where: {
        ...vehicleWhere,
        status: VehicleStatus.ON_TRIP,
      },
    }),
    prisma.vehicle.count({
      where: {
        ...vehicleWhere,
        status: { not: VehicleStatus.RETIRED },
      },
    }),
  ]);

  const utilization = totalActiveCount > 0 ? Math.round((onTripCount / totalActiveCount) * 100 * 100) / 100 : 0;

  return { utilization };
};

export const getOperationalCost = async (vehicleId?: string): Promise<OperationalCostReport> => {
  const [fuelLogs, maintenanceLogs, expenses] = await Promise.all([
    prisma.fuelLog.findMany({
      where: vehicleId ? { vehicleId } : {},
      select: { cost: true },
    }),
    prisma.maintenanceLog.findMany({
      where: vehicleId ? { vehicleId } : {},
      select: { cost: true },
    }),
    prisma.expense.findMany({
      where: vehicleId ? { vehicleId } : {},
      select: { amount: true },
    }),
  ]);

  const fuelCost = fuelLogs.reduce((sum, f) => sum + Number(f.cost), 0);
  const maintenanceCost = maintenanceLogs.reduce((sum, m) => sum + Number(m.cost), 0);
  const expenseCost = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalCost = fuelCost + maintenanceCost + expenseCost;

  return {
    vehicleId: vehicleId || null,
    fuelCost,
    maintenanceCost,
    expenseCost,
    totalCost,
  };
};

export const getROI = async (vehicleId?: string): Promise<ROIReport> => {
  // Check if revenue is tracked (i.e. are there any expenses labeled as 'Revenue'?)
  const globalRevenueCount = await prisma.expense.count({
    where: {
      type: { equals: "Revenue", mode: "insensitive" },
    },
  });

  const revenueTracked = globalRevenueCount > 0;

  const [revenueExpenses, opCosts, vehicles] = await Promise.all([
    prisma.expense.findMany({
      where: {
        type: { equals: "Revenue", mode: "insensitive" },
        ...(vehicleId ? { vehicleId } : {}),
      },
      select: { amount: true },
    }),
    getOperationalCost(vehicleId),
    prisma.vehicle.findMany({
      where: vehicleId ? { id: vehicleId } : { status: { not: VehicleStatus.RETIRED } },
      select: { acquisitionCost: true },
    }),
  ]);

  const revenue = revenueExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const acquisitionCost = vehicles.reduce((sum, v) => sum + Number(v.acquisitionCost), 0);

  let roi: number | null = null;
  if (revenueTracked) {
    roi =
      acquisitionCost > 0
        ? Math.round(((revenue - opCosts.totalCost) / acquisitionCost) * 100 * 100) / 100
        : 0;
  }

  return {
    vehicleId: vehicleId || null,
    revenueTracked,
    revenue,
    fuelCost: opCosts.fuelCost,
    maintenanceCost: opCosts.maintenanceCost,
    acquisitionCost,
    roi,
  };
};

export const generateExportCSV = async (): Promise<string> => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { regNumber: "asc" },
  });

  const headers = [
    "Vehicle ID",
    "Registration Number",
    "Name",
    "Type",
    "Status",
    "Fuel Efficiency (km/L)",
    "Operational Cost",
    "Acquisition Cost",
    "Revenue",
    "ROI (%)",
  ];

  const rows = [headers.join(",")];

  for (const v of vehicles) {
    const [efficiency, costReport, roiReport] = await Promise.all([
      getFuelEfficiency(v.id),
      getOperationalCost(v.id),
      getROI(v.id),
    ]);

    const row = [
      v.id,
      `"${v.regNumber.replace(/"/g, '""')}"`,
      `"${v.name.replace(/"/g, '""')}"`,
      v.type,
      v.status,
      efficiency.fuelEfficiency,
      costReport.totalCost,
      Number(v.acquisitionCost),
      roiReport.revenue,
      roiReport.roi === null ? "N/A" : `${roiReport.roi}%`,
    ];

    rows.push(row.join(","));
  }

  return rows.join("\n");
};
