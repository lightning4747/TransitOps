import { Router } from "express";
import { Role, MaintenanceStatus } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createMaintenanceLogSchema } from "./maintenance.schema";
import * as maintenanceService from "./maintenance.service";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { vehicleId, status } = req.query;
    const filters: maintenanceService.MaintenanceLogFilters = {
      vehicleId: vehicleId ? String(vehicleId) : undefined,
      status: status ? (String(status) as MaintenanceStatus) : undefined,
    };

    const logs = await maintenanceService.getMaintenanceLogs(filters);
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole(Role.FLEET_MANAGER), validate(createMaintenanceLogSchema), async (req, res, next) => {
  try {
    const log = await maintenanceService.createMaintenanceLog(req.body);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/close", requireRole(Role.FLEET_MANAGER), async (req, res, next) => {
  try {
    const log = await maintenanceService.closeMaintenanceLog(req.params.id as string);
    res.status(200).json(log);
  } catch (error) {
    next(error);
  }
});

export default router;
