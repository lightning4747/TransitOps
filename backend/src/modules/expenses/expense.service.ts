import { Expense } from "@prisma/client";
import prisma from "../../lib/prisma";
import { CreateExpenseInput } from "./expense.schema";
import { AppError } from "../../middleware/errorHandler";

export interface ExpenseFilters {
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
}

export const getExpenses = async (filters: ExpenseFilters): Promise<Expense[]> => {
  const { vehicleId, startDate, endDate } = filters;
  const where: any = {};

  if (vehicleId) {
    where.vehicleId = vehicleId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = startDate;
    }
    if (endDate) {
      where.date.lte = endDate;
    }
  }

  return await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
    include: { vehicle: true },
  });
};

export const createExpense = async (input: CreateExpenseInput): Promise<Expense> => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
  });

  if (!vehicle) {
    throw new AppError(404, "VEHICLE_NOT_FOUND", "Vehicle not found");
  }

  return await prisma.expense.create({
    data: {
      vehicleId: input.vehicleId,
      type: input.type,
      amount: input.amount,
      date: input.date,
    },
  });
};
