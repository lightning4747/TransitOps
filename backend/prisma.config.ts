import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Load .env before Prisma reads process.env — required in Prisma 7
// because prisma.config.ts is evaluated before the CLI's own .env loader runs.
dotenv.config();

export default defineConfig({
  schema: "./src/prisma/schema.prisma",
  migrations: {
    seed: "tsx src/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
