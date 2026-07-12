import { z } from "zod";

export const createMaintenanceLogSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  description: z.string().min(1, "Description is required"),
  cost: z.number().nonnegative("Cost cannot be negative").optional(),
});

export type CreateMaintenanceLogInput = z.infer<typeof createMaintenanceLogSchema>;
