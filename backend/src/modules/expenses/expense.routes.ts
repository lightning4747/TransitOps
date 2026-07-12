import { Router } from "express";
import { Role } from "@prisma/client";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createExpenseSchema } from "./expense.schema";
import * as expenseService from "./expense.service";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { vehicleId, startDate, endDate } = req.query;
    const filters: expenseService.ExpenseFilters = {
      vehicleId: vehicleId ? String(vehicleId) : undefined,
      startDate: startDate ? new Date(String(startDate)) : undefined,
      endDate: endDate ? new Date(String(endDate)) : undefined,
    };

    const expenses = await expenseService.getExpenses(filters);
    res.status(200).json(expenses);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole(Role.FLEET_MANAGER, Role.DRIVER), validate(createExpenseSchema), async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

export default router;
