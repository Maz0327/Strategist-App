import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

const defaults = ["visual_intel", "cohort_builder"];

await Promise.all(
  defaults.map(
    (name) =>
      sql`insert into feature_flags (name, enabled)
        values (${name}, false)
        on conflict (name) do nothing`,
  ),
);

console.log("✅ Feature flags seeded/ensured.");
process.exit(0);
