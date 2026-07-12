// ─── Enums ───────────────────────────────────────────────────────────────────

export type Role =
  | 'FLEET_MANAGER'
  | 'DRIVER'
  | 'SAFETY_OFFICER'
  | 'FINANCIAL_ANALYST';

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';

export type DriverStatus =
  | 'AVAILABLE'
  | 'ON_TRIP'
  | 'OFF_DUTY'
  | 'SUSPENDED';

export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export type MaintenanceStatus = 'ACTIVE' | 'CLOSED';

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Vehicle {
  id: string;
  regNumber: string;
  name: string;
  type: string;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId?: string | null;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date string
  contactNumber: string;
  safetyScore: number;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  vehicle?: Vehicle;
  driver?: Driver;
  cargoWeight: number;
  plannedDistance: number;
  status: TripStatus;
  startOdometer: number | null;
  endOdometer: number | null;
  fuelConsumed: number | null;
  createdBy: string;
  dispatchedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  createdAt: string;
  closedAt: string | null;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  liters: number;
  cost: number;
  date: string; // ISO date
  createdAt: string;
}

export interface Expense {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  type: string;
  amount: number;
  date: string; // ISO date
  createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilization: number;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface FuelEfficiencyReport {
  vehicleId: string | null;
  totalDistance: number;
  totalLiters: number;
  fuelEfficiency: number; // km/L
}

export interface UtilizationReport {
  utilization: number; // percentage
}

export interface OperationalCostReport {
  vehicleId: string | null;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalCost: number;
}

export interface RoiReport {
  vehicleId: string | null;
  revenueTracked: boolean;
  revenue: number;
  fuelCost: number;
  maintenanceCost: number;
  acquisitionCost: number;
  roi: number | null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── API generic response wrappers ───────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}
