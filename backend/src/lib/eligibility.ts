import { Driver, Vehicle } from "@prisma/client";

/**
 * A driver is eligible for dispatch only if:
 *  - their stored status is AVAILABLE (not ON_TRIP, OFF_DUTY, or SUSPENDED), AND
 *  - their license has not expired.
 *
 * License expiry is NOT stored as a status field — it is computed at query/validation
 * time against the raw date to avoid a stale "expired" status sitting in the DB.
 * See db-design.md §Computed values #1.
 */
export function isDriverDispatchEligible(driver: Driver): boolean {
  return driver.status === "AVAILABLE" && driver.licenseExpiry > new Date();
}

/**
 * A vehicle is eligible for dispatch if its stored status is AVAILABLE.
 * The stored status is always kept in sync by the transactional service functions
 * (dispatch / complete / cancel / maintenance), so it is fully authoritative here.
 * See db-design.md §Computed values #2.
 */
export function isVehicleDispatchEligible(vehicle: Vehicle): boolean {
  return vehicle.status === "AVAILABLE";
}
