import { z } from "zod";

export const createFuelLogSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  liters: z.number().positive("Liters must be greater than 0"),
  cost: z.number().nonnegative("Cost cannot be negative"),
  date: z.coerce.date({ message: "Invalid date format" }),
});

export type CreateFuelLogInput = z.infer<typeof createFuelLogSchema>;
