import { z } from "zod";

export const createVehicleSchema = z.object({
  regNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Vehicle name is required"),
  type: z.string().min(1, "Vehicle type is required"),
  maxLoadKg: z.number().positive("Maximum load capacity must be greater than 0"),
  acquisitionCost: z.number().nonnegative("Acquisition cost cannot be negative"),
  region: z.string().optional().nullable(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
