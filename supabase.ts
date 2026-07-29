import { createClient } from "@supabase/supabase-js";

// These are the PUBLIC anon key + URL — safe to expose to the browser.
// Row Level Security policies in supabase/schema.sql control what the
// anon key can actually do (read all leads, update status/notes only).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);

export type Lead = {
  id: number;
  source: string;
  external_id: string;
  title: string;
  description: string | null;
  url: string;
  category: "trading" | "web" | "other";
  matched_keywords: string[];
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  author: string | null;
  posted_at: string | null;
  discovered_at: string;
  status: "new" | "contacted" | "quoted" | "won" | "lost" | "ignored";
  notes: string | null;
};
