import { config } from "@dotenvx/dotenvx";
import { defineConfig } from "drizzle-kit";

config({ path: "../../.env", override: true });

export default defineConfig({
    schema: "./schema.ts",
    out: "./supabase/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.SUPABASE_URL!,
    },
});
