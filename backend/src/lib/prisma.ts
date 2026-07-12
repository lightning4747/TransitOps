import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// Prisma 7 requires a driver adapter — the built-in connection is removed.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Singleton PrismaClient — prevents connection pool exhaustion in hot-reload dev.
const prisma = new PrismaClient({ adapter });

export default prisma;
