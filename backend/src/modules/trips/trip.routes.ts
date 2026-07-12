import { Router } from "express";
import { Role, TripStatus } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createTripSchema, completeTripSchema } from "./trip.schema";
import * as tripService from "./trip.service";

const router = Router();

/**
 * GET /api/trips
 * All roles — filters: ?status=, ?driverId=, ?vehicleId=
 */
router.get("/", async (req, res, next) => {
  try {
    const { status, driverId, vehicleId } = req.query;
    const filters: tripService.TripFilters = {
      status: status ? (String(status) as TripStatus) : undefined,
      driverId: driverId ? String(driverId) : undefined,
      vehicleId: vehicleId ? String(vehicleId) : undefined,
    };

    const trips = await tripService.getTrips(filters);
    res.status(200).json(trips);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trips
 * FLEET_MANAGER, DRIVER — creates a trip in DRAFT status.
 * createdBy is taken from the authenticated JWT (req.user.id), never from the body.
 */
router.post(
  "/",
  requireRole(Role.FLEET_MANAGER, Role.DRIVER),
  validate(createTripSchema),
  async (req, res, next) => {
    try {
      const trip = await tripService.createTrip(req.body, req.user!.id);
      res.status(201).json(trip);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/trips/:id
 * All roles.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/trips/:id/dispatch
 * FLEET_MANAGER, DRIVER.
 * No request body — all validation is done against the persisted trip/vehicle/driver state.
 * 409 errors propagate unchanged so the frontend can surface the exact server message via toast.
 */
router.post(
  "/:id/dispatch",
  requireRole(Role.FLEET_MANAGER, Role.DRIVER),
  async (req, res, next) => {
    try {
      const trip = await tripService.dispatchTrip(req.params.id);
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/trips/:id/complete
 * FLEET_MANAGER, DRIVER.
 * Body: { endOdometer: number, fuelConsumed: number }
 */
router.post(
  "/:id/complete",
  requireRole(Role.FLEET_MANAGER, Role.DRIVER),
  validate(completeTripSchema),
  async (req, res, next) => {
    try {
      const trip = await tripService.completeTrip(req.params.id, req.body);
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/trips/:id/cancel
 * FLEET_MANAGER, DRIVER.
 * No request body — cancels DRAFT (simple flip) or DISPATCHED (atomic restore).
 */
router.post(
  "/:id/cancel",
  requireRole(Role.FLEET_MANAGER, Role.DRIVER),
  async (req, res, next) => {
    try {
      const trip = await tripService.cancelTrip(req.params.id);
      res.status(200).json(trip);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
