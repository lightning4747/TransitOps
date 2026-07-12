import { Router } from "express";
import { VehicleStatus } from "@prisma/client";
import * as dashboardService from "./dashboard.service";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { vehicleType, status, region } = req.query;
    const filters: dashboardService.DashboardFilters = {
      vehicleType: vehicleType ? String(vehicleType) : undefined,
      status: status ? (String(status) as VehicleStatus) : undefined,
      region: region ? String(region) : undefined,
    };

    const stats = await dashboardService.getDashboardStats(filters);
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
