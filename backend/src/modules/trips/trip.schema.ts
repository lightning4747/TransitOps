import { z } from "zod";

export const createTripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  driverId: z.string().uuid("Invalid driver ID format"),
  cargoWeight: z.number().positive("Cargo weight must be greater than 0"),
  plannedDistance: z.number().positive("Planned distance must be greater than 0"),
});

export const completeTripSchema = z.object({
  endOdometer: z.number().nonnegative("End odometer reading must be non-negative"),
  fuelConsumed: z.number().nonnegative("Fuel consumed must be non-negative"),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type CompleteTripInput = z.infer<typeof completeTripSchema>;
