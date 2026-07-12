import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auth } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";
import vehicleRoutes from "./modules/vehicles/vehicle.routes";
import driverRoutes from "./modules/drivers/driver.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";
import tripRoutes from "./modules/trips/trip.routes";
import prisma from "./lib/prisma";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Global auth middleware (protects all routes except login)
app.use(auth);

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/maintenance-logs", maintenanceRoutes);
app.use("/api/trips", tripRoutes);

// Simple health check / test route (protected)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "TransitOps API is running",
    user: req.user,
  });
});

// Error handling middleware
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(async () => {
    console.log("HTTP server closed");
    await prisma.$disconnect();
    process.exit(0);
  });
});
