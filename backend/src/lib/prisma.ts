import { PrismaClient } from "@prisma/client";

// Prevent multiple PrismaClient instances in hot-reload dev environments.
// In production there is only one module instance so this is always the same object.
const prisma = new PrismaClient();

export default prisma;
