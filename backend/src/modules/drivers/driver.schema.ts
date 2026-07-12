import { z } from "zod";

export const createDriverSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  // licenseExpiry is stored as a raw date — NOT a computed status.
  // Dispatch eligibility is computed at query/validation time via isDriverDispatchEligible().
  licenseExpiry: z
    .string()
    .min(1, "License expiry date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "licenseExpiry must be a valid ISO date string (e.g. 2027-06-30)",
    }),
  contactNumber: z.string().min(1, "Contact number is required"),
  safetyScore: z
    .number()
    .min(0, "Safety score cannot be below 0")
    .max(100, "Safety score cannot exceed 100")
    .optional(),
  // status is intentionally omitted — it is system-managed and only mutated by
  // the trip/maintenance transactional service functions (see backend.md).
  userId: z.string().uuid("userId must be a valid UUID").optional().nullable(),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
