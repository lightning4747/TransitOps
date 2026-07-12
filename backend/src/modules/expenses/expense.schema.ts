import { z } from "zod";

export const createExpenseSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID format"),
  type: z.string().min(1, "Expense type is required"),
  amount: z.number().nonnegative("Amount cannot be negative"),
  date: z.coerce.date({ message: "Invalid date format" }),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
