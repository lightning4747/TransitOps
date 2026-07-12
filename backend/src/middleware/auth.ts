import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { AppError } from "./errorHandler";

export interface TokenPayload {
  userId: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  // Skip auth for login route
  if (req.path === "/api/auth/login" || req.path === "/api/auth/login/") {
    return next();
  }

  const authHeader = req.headers.authorization;
  // For browser-initiated downloads (window.open), the token is passed as a query param
  // because browsers cannot set custom headers on navigation requests.
  const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;

  if (!authHeader && !queryToken) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header");
  }

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : queryToken;

  if (!token) {
    throw new AppError(401, "UNAUTHORIZED", "Missing or invalid authorization header");
  }

  try {
    const secret = process.env.JWT_SECRET || "your_super_secret_hackathon_key_here";
    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    throw new AppError(401, "UNAUTHORIZED", "Access token is invalid or expired");
  }
};
