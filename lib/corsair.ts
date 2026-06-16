import "dotenv/config";
import { Pool } from "pg";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";

const globalForCorsair = globalThis as unknown as {
  corsairPool?: Pool;
};

export const corsairPool =
  globalForCorsair.corsairPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForCorsair.corsairPool = corsairPool;
}

if (!process.env.CORSAIR_KEK) {
  throw new Error("Missing CORSAIR_KEK");
}

export const corsair = createCorsair({
  plugins: [gmail(), googlecalendar()],
  database: corsairPool,
  kek: process.env.CORSAIR_KEK,
  multiTenancy: true,
});