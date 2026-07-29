import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role = write access, keep secret

if (!url || !key) {
  throw new Error(
    "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. " +
    "Set them as GitHub Actions secrets (see README)."
  );
}

export const supabase = createClient(url, key);

/**
 * Insert leads, silently skipping any that already exist.
 * Dedup key is (source, external_id) — enforced by the DB unique
 * constraint, so this is safe even if two scraper runs overlap.
 */
export async function upsertLeads(leads) {
  if (!leads.length) return { inserted: 0, skipped: 0 };

  const { data, error } = await supabase
    .from("leads")
    .upsert(leads, {
      onConflict: "source,external_id",
      ignoreDuplicates: true, // <-- this is "never add the same lead twice"
    })
    .select("id");

  if (error) {
    console.error("Supabase upsert error:", error.message);
    return { inserted: 0, skipped: 0, error };
  }

  const inserted = data?.length ?? 0;
  return { inserted, skipped: leads.length - inserted };
}
