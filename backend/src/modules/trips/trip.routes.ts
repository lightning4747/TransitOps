import { Router } from "express";
import { Role, TripStatus } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createTripSchema, completeTripSchema } from "./trip.schema";
import * as tripService from "./trip.service";
import { AppError } from "../../middleware/errorHandler";

const router = Router();

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

router.post("/", requireRole(Role.FLEET_MANAGER, Role.DRIVER), validate(createTripSchema), async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "User is not authenticated");
    }
    const trip = await tripService.createTrip(req.body, req.user.id);
    res.status(201).json(trip);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/dispatch", requireRole(Role.FLEET_MANAGER, Role.DRIVER), async (req, res, next) => {
  try {
    const trip = await tripService.dispatchTrip(req.params.id as string);
    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/complete", requireRole(Role.FLEET_MANAGER, Role.DRIVER), validate(completeTripSchema), async (req, res, next) => {
  try {
    const trip = await tripService.completeTrip(req.params.id as string, req.body);
    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", requireRole(Role.FLEET_MANAGER, Role.DRIVER), async (req, res, next) => {
  try {
    const trip = await tripService.cancelTrip(req.params.id as string);
    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
});

export default router;
