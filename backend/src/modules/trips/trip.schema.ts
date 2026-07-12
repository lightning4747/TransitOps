import { z } from "zod";

/**
 * Schema for creating a new trip (status=DRAFT, no side-effects on vehicle/driver).
 * `status` is intentionally absent — it is system-managed via lifecycle actions only.
 */
export const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().uuid("vehicleId must be a valid UUID"),
  driverId: z.string().uuid("driverId must be a valid UUID"),
  cargoWeight: z.number().positive("Cargo weight must be greater than 0"),
  plannedDistance: z.number().positive("Planned distance must be greater than 0"),
});

/**
 * Schema for completing a dispatched trip.
 * Captures the final odometer reading and fuel consumed (liters).
 * FuelLog is NOT auto-created here — a separate fuel log entry is required.
 */
export const completeTripSchema = z.object({
  endOdometer: z.number().positive("End odometer must be greater than 0"),
  fuelConsumed: z.number().positive("Fuel consumed must be greater than 0"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;