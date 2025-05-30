import { config } from "@dotenvx/dotenvx";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({ path: ".env", override: true });

const client = postgres(process.env.SUPABASE_URL!, { prepare: false });
export const db = drizzle({ client });
