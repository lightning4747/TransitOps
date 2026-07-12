import { Router } from "express";
import { Role, VehicleStatus } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createVehicleSchema, updateVehicleSchema } from "./vehicle.schema";
import * as vehicleService from "./vehicle.service";
import { AppError } from "../../middleware/errorHandler";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { type, status, region, dispatchable } = req.query;
    const filters: vehicleService.VehicleFilters = {
      type: type ? String(type) : undefined,
      status: status ? (String(status) as VehicleStatus) : undefined,
      region: region ? String(region) : undefined,
      dispatchable: dispatchable === "true",
    };

    const vehicles = await vehicleService.getVehicles(filters);
    res.status(200).json(vehicles);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole(Role.FLEET_MANAGER), validate(createVehicleSchema), async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    res.status(200).json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id",
  requireRole(Role.FLEET_MANAGER),
  (req, res, next) => {
    if (req.body && "status" in req.body) {
      throw new AppError(400, "BAD_REQUEST", "Vehicle status cannot be updated directly");
    }
    next();
  },
  validate(updateVehicleSchema),
  async (req, res, next) => {
    try {
      const vehicle = await vehicleService.updateVehicle(req.params.id as string, req.body);
      res.status(200).json(vehicle);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
