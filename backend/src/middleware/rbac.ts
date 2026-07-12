import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AppError } from "./errorHandler";

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "UNAUTHORIZED", "User is not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(403, "FORBIDDEN", "Role not permitted");
    }

    next();
  };
};
