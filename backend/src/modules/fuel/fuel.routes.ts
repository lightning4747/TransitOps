import { Router } from "express";
import { Role } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createFuelLogSchema } from "./fuel.schema";
import * as fuelService from "./fuel.service";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    const filters: fuelService.FuelLogFilters = {
      vehicleId: vehicleId ? String(vehicleId) : undefined,
      startDate: startDate ? new Date(String(startDate)) : undefined,
      endDate: endDate ? new Date(String(endDate)) : undefined,
    };

    const logs = await fuelService.getFuelLogs(filters);
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole(Role.FLEET_MANAGER, Role.DRIVER), validate(createFuelLogSchema), async (req, res, next) => {
  try {
    const log = await fuelService.createFuelLog(req.body);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

export default router;
