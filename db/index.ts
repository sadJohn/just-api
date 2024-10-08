import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { config } from "dotenv";
import * as schema from "./schema";

config({ path: ".env" });

export const db = drizzle(sql, { schema });
export type DB = typeof db;
