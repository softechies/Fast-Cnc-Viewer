import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import "dotenv/config";
import * as schema from "../shared/schema";

const { Pool } = pg;
console.log(`Database URL: ${process.env.DATABASE_URL}`);
// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle database instance
export const db = drizzle(pool, { schema });