import type {
  Vehicle,
  Driver,
  Trip,
  MaintenanceLog,
  FuelLog,
  Expense,
  DashboardStats,
  FuelEfficiencyReport,
  UtilizationReport,
  OperationalCostReport,
  RoiReport,
  User,
} from '../types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const mockUsers: User[] = [
  { id: 'u1', email: 'fleet@transitops.com', name: 'Fleet Manager', role: 'FLEET_MANAGER' },
  { id: 'u2', email: 'driver@transitops.com', name: 'Alex Driver', role: 'DRIVER' },
  { id: 'u3', email: 'safety@transitops.com', name: 'Safety Officer', role: 'SAFETY_OFFICER' },
  { id: 'u4', email: 'finance@transitops.com', name: 'Finance Analyst', role: 'FINANCIAL_ANALYST' },
];

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const mockVehicles: Vehicle[] = [
  {
    id: 'v1', regNumber: 'TN-01-AB-1234', name: 'Van-01', type: 'Van',
    maxLoadKg: 800, odometer: 45230, acquisitionCost: 850000,
    status: 'AVAILABLE', region: 'North', createdAt: '2024-01-10T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'v2', regNumber: 'TN-02-CD-5678', name: 'Truck-01', type: 'Truck',
    maxLoadKg: 5000, odometer: 112400, acquisitionCost: 2400000,
    status: 'ON_TRIP', region: 'South', createdAt: '2023-05-15T00:00:00Z', updatedAt: '2024-07-10T00:00:00Z',
  },
  {
    id: 'v3', regNumber: 'TN-03-EF-9012', name: 'Bike-01', type: 'Bike',
    maxLoadKg: 100, odometer: 8900, acquisitionCost: 120000,
    status: 'IN_SHOP', region: 'East', createdAt: '2024-03-20T00:00:00Z', updatedAt: '2024-07-05T00:00:00Z',
  },
  {
    id: 'v4', regNumber: 'TN-04-GH-3456', name: 'Van-02', type: 'Van',
    maxLoadKg: 1000, odometer: 78900, acquisitionCost: 950000,
    status: 'AVAILABLE', region: 'West', createdAt: '2023-11-01T00:00:00Z', updatedAt: '2024-06-20T00:00:00Z',
  },
  {
    id: 'v5', regNumber: 'TN-05-IJ-7890', name: 'Truck-02', type: 'Truck',
    maxLoadKg: 8000, odometer: 204000, acquisitionCost: 3200000,
    status: 'RETIRED', region: 'North', createdAt: '2020-01-01T00:00:00Z', updatedAt: '2024-01-15T00:00:00Z',
  },
];

// ─── Drivers ─────────────────────────────────────────────────────────────────
export const mockDrivers: Driver[] = [
  {
    id: 'd1', name: 'Alex Kumar', licenseNumber: 'TN-DL-001234', licenseCategory: 'HGV',
    licenseExpiry: '2026-12-31', contactNumber: '+91-9876543210',
    safetyScore: 95, status: 'AVAILABLE', createdAt: '2024-01-15T00:00:00Z', updatedAt: '2024-06-01T00:00:00Z',
  },
  {
    id: 'd2', name: 'Priya Sharma', licenseNumber: 'TN-DL-005678', licenseCategory: 'LMV',
    licenseExpiry: '2026-08-15', contactNumber: '+91-9123456789',
    safetyScore: 88, status: 'ON_TRIP', createdAt: '2023-06-01T00:00:00Z', updatedAt: '2024-07-10T00:00:00Z',
  },
  {
    id: 'd3', name: 'Ravi Verma', licenseNumber: 'TN-DL-009012', licenseCategory: 'HGV',
    licenseExpiry: '2025-03-10', contactNumber: '+91-9988776655',
    safetyScore: 72, status: 'AVAILABLE', createdAt: '2023-03-10T00:00:00Z', updatedAt: '2024-03-10T00:00:00Z',
  },
  {
    id: 'd4', name: 'Sunita Rao', licenseNumber: 'TN-DL-003456', licenseCategory: 'LMV',
    licenseExpiry: '2024-01-20', contactNumber: '+91-9555444333',
    safetyScore: 65, status: 'OFF_DUTY', createdAt: '2022-01-20T00:00:00Z', updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: 'd5', name: 'Mohan Das', licenseNumber: 'TN-DL-007890', licenseCategory: 'HGV',
    licenseExpiry: '2027-06-30', contactNumber: '+91-9444333222',
    safetyScore: 45, status: 'SUSPENDED', createdAt: '2023-09-01T00:00:00Z', updatedAt: '2024-05-01T00:00:00Z',
  },
];

// ─── Trips ───────────────────────────────────────────────────────────────────
export const mockTrips: Trip[] = [
  {
    id: 't1', source: 'Chennai', destination: 'Bangalore', vehicleId: 'v2', driverId: 'd2',
    cargoWeight: 2500, plannedDistance: 346, status: 'DISPATCHED',
    startOdometer: 112054, endOdometer: null, fuelConsumed: null, createdBy: 'u1',
    dispatchedAt: '2024-07-10T08:00:00Z', completedAt: null, cancelledAt: null,
    createdAt: '2024-07-10T07:30:00Z',
    vehicle: mockVehicles[1], driver: mockDrivers[1],
  },
  {
    id: 't2', source: 'Coimbatore', destination: 'Madurai', vehicleId: 'v1', driverId: 'd1',
    cargoWeight: 600, plannedDistance: 210, status: 'COMPLETED',
    startOdometer: 44900, endOdometer: 45130, fuelConsumed: 38, createdBy: 'u1',
    dispatchedAt: '2024-07-08T09:00:00Z', completedAt: '2024-07-08T16:00:00Z', cancelledAt: null,
    createdAt: '2024-07-08T08:30:00Z',
    vehicle: mockVehicles[0], driver: mockDrivers[0],
  },
  {
    id: 't3', source: 'Chennai', destination: 'Vellore', vehicleId: 'v4', driverId: 'd1',
    cargoWeight: 400, plannedDistance: 138, status: 'DRAFT',
    startOdometer: null, endOdometer: null, fuelConsumed: null, createdBy: 'u2',
    dispatchedAt: null, completedAt: null, cancelledAt: null,
    createdAt: '2024-07-12T06:00:00Z',
    vehicle: mockVehicles[3], driver: mockDrivers[0],
  },
  {
    id: 't4', source: 'Salem', destination: 'Erode', vehicleId: 'v1', driverId: 'd3',
    cargoWeight: 300, plannedDistance: 60, status: 'CANCELLED',
    startOdometer: 44500, endOdometer: null, fuelConsumed: null, createdBy: 'u1',
    dispatchedAt: '2024-07-07T10:00:00Z', completedAt: null, cancelledAt: '2024-07-07T11:00:00Z',
    createdAt: '2024-07-07T09:30:00Z',
    vehicle: mockVehicles[0], driver: mockDrivers[2],
  },
];

// ─── Maintenance Logs ────────────────────────────────────────────────────────
export const mockMaintenanceLogs: MaintenanceLog[] = [
  {
    id: 'm1', vehicleId: 'v3', description: 'Engine overhaul and oil change', cost: 45000,
    status: 'ACTIVE', createdAt: '2024-07-05T10:00:00Z', closedAt: null,
    vehicle: mockVehicles[2],
  },
  {
    id: 'm2', vehicleId: 'v1', description: 'Tyre replacement — all four', cost: 18000,
    status: 'CLOSED', createdAt: '2024-06-20T09:00:00Z', closedAt: '2024-06-22T14:00:00Z',
    vehicle: mockVehicles[0],
  },
  {
    id: 'm3', vehicleId: 'v2', description: 'Brake pad replacement', cost: 8500,
    status: 'CLOSED', createdAt: '2024-05-15T10:00:00Z', closedAt: '2024-05-16T12:00:00Z',
    vehicle: mockVehicles[1],
  },
];

// ─── Fuel Logs ───────────────────────────────────────────────────────────────
export const mockFuelLogs: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', liters: 38, cost: 4560, date: '2024-07-08', createdAt: '2024-07-08T17:00:00Z', vehicle: mockVehicles[0] },
  { id: 'f2', vehicleId: 'v2', liters: 75, cost: 9000, date: '2024-07-09', createdAt: '2024-07-09T08:00:00Z', vehicle: mockVehicles[1] },
  { id: 'f3', vehicleId: 'v4', liters: 30, cost: 3600, date: '2024-07-06', createdAt: '2024-07-06T15:00:00Z', vehicle: mockVehicles[3] },
  { id: 'f4', vehicleId: 'v1', liters: 42, cost: 5040, date: '2024-06-28', createdAt: '2024-06-28T12:00:00Z', vehicle: mockVehicles[0] },
];

// ─── Expenses ────────────────────────────────────────────────────────────────
export const mockExpenses: Expense[] = [
  { id: 'e1', vehicleId: 'v1', type: 'Toll', amount: 450, date: '2024-07-08', createdAt: '2024-07-08T10:00:00Z', vehicle: mockVehicles[0] },
  { id: 'e2', vehicleId: 'v2', type: 'Toll', amount: 800, date: '2024-07-10', createdAt: '2024-07-10T09:00:00Z', vehicle: mockVehicles[1] },
  { id: 'e3', vehicleId: 'v4', type: 'Parking', amount: 200, date: '2024-07-06', createdAt: '2024-07-06T14:00:00Z', vehicle: mockVehicles[3] },
];

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const mockDashboardStats: DashboardStats = {
  activeVehicles: 4,
  availableVehicles: 2,
  vehiclesInMaintenance: 1,
  activeTrips: 1,
  pendingTrips: 1,
  driversOnDuty: 1,
  fleetUtilization: 25,
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const mockFuelEfficiency: FuelEfficiencyReport[] = [
  { vehicleId: 'v1', vehicleName: 'Van-01', regNumber: 'TN-01-AB-1234', totalDistance: 270, totalFuel: 80, efficiency: 3.38 },
  { vehicleId: 'v2', vehicleName: 'Truck-01', regNumber: 'TN-02-CD-5678', totalDistance: 346, totalFuel: 75, efficiency: 4.61 },
  { vehicleId: 'v4', vehicleName: 'Van-02', regNumber: 'TN-04-GH-3456', totalDistance: 0, totalFuel: 30, efficiency: 0 },
];

export const mockUtilization: UtilizationReport = {
  fleetUtilization: 25,
  onTrip: 1,
  available: 2,
  inShop: 1,
  retired: 1,
  total: 4,
};

export const mockOperationalCost: OperationalCostReport[] = [
  { vehicleId: 'v1', vehicleName: 'Van-01', regNumber: 'TN-01-AB-1234', fuelCost: 9600, maintenanceCost: 18000, expenseCost: 450, totalCost: 28050 },
  { vehicleId: 'v2', vehicleName: 'Truck-01', regNumber: 'TN-02-CD-5678', fuelCost: 9000, maintenanceCost: 8500, expenseCost: 800, totalCost: 18300 },
  { vehicleId: 'v3', vehicleName: 'Bike-01', regNumber: 'TN-03-EF-9012', fuelCost: 0, maintenanceCost: 45000, expenseCost: 0, totalCost: 45000 },
  { vehicleId: 'v4', vehicleName: 'Van-02', regNumber: 'TN-04-GH-3456', fuelCost: 3600, maintenanceCost: 0, expenseCost: 200, totalCost: 3800 },
];

export const mockRoi: RoiReport[] = [
  { vehicleId: 'v1', vehicleName: 'Van-01', regNumber: 'TN-01-AB-1234', acquisitionCost: 850000, revenue: 0, maintenanceCost: 18000, fuelCost: 9600, roi: null, revenueTracked: false },
  { vehicleId: 'v2', vehicleName: 'Truck-01', regNumber: 'TN-02-CD-5678', acquisitionCost: 2400000, revenue: 0, maintenanceCost: 8500, fuelCost: 9000, roi: null, revenueTracked: false },
  { vehicleId: 'v3', vehicleName: 'Bike-01', regNumber: 'TN-03-EF-9012', acquisitionCost: 120000, revenue: 0, maintenanceCost: 45000, fuelCost: 0, roi: null, revenueTracked: false },
  { vehicleId: 'v4', vehicleName: 'Van-02', regNumber: 'TN-04-GH-3456', acquisitionCost: 950000, revenue: 0, maintenanceCost: 0, fuelCost: 3600, roi: null, revenueTracked: false },
];
