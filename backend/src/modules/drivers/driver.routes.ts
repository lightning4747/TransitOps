import { Router } from "express";
import { Role, DriverStatus } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createDriverSchema, updateDriverSchema } from "./driver.schema";
import * as driverService from "./driver.service";
import { AppError } from "../../middleware/errorHandler";

const router = Router();

/**
 * GET /api/drivers
 * Supports filters: status, dispatchable
 * - dispatchable=true returns only drivers eligible for dispatch
 *   (status=AVAILABLE AND licenseExpiry > today), computed via isDriverDispatchEligible().
 *   Used by the Trip creation form driver dropdown.
 * All roles may list drivers (read-only for most; FLEET_MANAGER/SAFETY_OFFICER can edit).
 */
router.get("/", async (req, res, next) => {
  try {
    const { status, dispatchable } = req.query;
    const filters: driverService.DriverFilters = {
      status: status ? (String(status) as DriverStatus) : undefined,
      dispatchable: dispatchable === "true",
    };

    const drivers = await driverService.getDrivers(filters);
    res.status(200).json(drivers);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/drivers
 * FLEET_MANAGER only. Creates a driver with status=AVAILABLE (system default).
 * status is not accepted in the request body — it is system-managed.
 */
router.post(
  "/",
  requireRole(Role.FLEET_MANAGER),
  validate(createDriverSchema),
  async (req, res, next) => {
    try {
      const driver = await driverService.createDriver(req.body);
      res.status(201).json(driver);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/drivers/:id
 * All roles may read a single driver record.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const driver = await driverService.getDriverById(req.params.id as string);
    res.status(200).json(driver);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/drivers/:id
 * FLEET_MANAGER and SAFETY_OFFICER (compliance fields only) may update driver profiles.
 *
 * IMPORTANT: The `status` field is explicitly rejected here.
 * Driver status is ONLY ever mutated by the trip transactional service functions
 * (dispatchTrip → ON_TRIP, completeTrip/cancelTrip → AVAILABLE) and never via
 * a generic PATCH. This mirrors the same protection on PATCH /api/vehicles/:id.
 *
 * licenseExpiry is stored as a raw date field and may be updated here (e.g., after
 * a license renewal). It is NOT a computed "expired" status — eligibility is
 * computed at dispatch time via isDriverDispatchEligible().
 */
router.patch(
  "/:id",
  requireRole(Role.FLEET_MANAGER, Role.SAFETY_OFFICER),
  (req, res, next) => {
    if (req.body && "status" in req.body) {
      throw new AppError(400, "BAD_REQUEST", "Driver status cannot be updated directly");
    }
    next();
  },
  validate(updateDriverSchema),
  async (req, res, next) => {
    try {
      const driver = await driverService.updateDriver(req.params.id as string, req.body);
      res.status(200).json(driver);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
