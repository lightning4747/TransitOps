import { Router } from "express";
import { Role } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import * as reportService from "./report.service";

const router = Router();

// Exclude DRIVER role from accessing reports per RBAC specifications
const reportRoles = [Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST];

router.get("/fuel-efficiency", requireRole(...reportRoles), async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const report = await reportService.getFuelEfficiency(vehicleId ? String(vehicleId) : undefined);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.get("/utilization", requireRole(...reportRoles), async (req, res, next) => {
  try {
    const { region, type } = req.query;
    const report = await reportService.getFleetUtilization(
      region ? String(region) : undefined,
      type ? String(type) : undefined
    );
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.get("/operational-cost", requireRole(...reportRoles), async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const report = await reportService.getOperationalCost(vehicleId ? String(vehicleId) : undefined);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.get("/roi", requireRole(...reportRoles), async (req, res, next) => {
  try {
    const { vehicleId } = req.query;
    const report = await reportService.getROI(vehicleId ? String(vehicleId) : undefined);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
});

router.get("/export.csv", requireRole(...reportRoles), async (req, res, next) => {
  try {
    const csvContent = await reportService.generateExportCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=fleet_report.csv");
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
});

export default router;
