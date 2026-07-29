"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase, type Lead } from "@/lib/supabase";
import LeadCard from "@/components/LeadCard";

const REFRESH_MS = 60_000; // dashboard re-polls Supabase every 60s; the
// scraper itself writes new rows every ~15min via GitHub Actions.
const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

type CategoryFilter = "all" | "trading" | "web" | "other";
type StatusFilter = "all" | Lead["status"];

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState<string>("all");

  const load = useCallback(async () => {
    setError(null);
    const cutoff = new Date(Date.now() - TWO_MONTHS_MS).toISOString();
    const { data, error: err } = await supabase
      .from("leads")
      .select("*")
      .gte("posted_at", cutoff)
      .order("posted_at", { ascending: false })
      .limit(500);

    if (err) {
      setError(err.message);
    } else {
      setLeads(data as Lead[]);
      setLastSync(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  const handleStatusChange = async (id: number, newStatus: Lead["status"]) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    const { error: err } = await supabase.from("leads").update({ status: newStatus }).eq("id", id);
    if (err) setError(`Couldn't save status change: ${err.message}`);
  };

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))).sort(), [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (category !== "all" && l.category !== category) return false;
      if (status !== "all" && l.status !== status) return false;
      if (source !== "all" && l.source !== source) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${l.title} ${l.description ?? ""} ${l.matched_keywords?.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, category, status, source, search]);

  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = leads.filter((l) => l.posted_at && now - new Date(l.posted_at).getTime() < 86_400_000).length;
    const newCount = leads.filter((l) => l.status === "new").length;
    const withContact = leads.filter((l) => l.contact_email || l.contact_phone).length;
    return { total: leads.length, last24h, newCount, withContact };
  }, [leads]);

  return (
    <main className="min-h-screen">
      <header className="relative overflow-hidden border-b border-hairline bg-panel">
        <div className="absolute inset-0 bg-scan pointer-events-none" />
        <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-signal/10 to-transparent animate-sweep pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-signal animate-pulse2" />
              <span className="font-mono text-xs tracking-[0.2em] text-signal uppercase">Live scan</span>
            </div>
            <h1 className="text-2xl font-semibold mt-1 font-mono tracking-tight">Lead Hunter // Signal Board</h1>
            <p className="text-muted text-sm mt-1">
              {lastSync ? `Last synced ${lastSync.toLocaleTimeString()}` : "Syncing…"} · scanner runs every ~15 min
            </p>
          </div>
          <div className="flex gap-4 font-mono text-sm">
            <Stat label="TOTAL" value={stats.total} />
            <Stat label="NEW" value={stats.newCount} accent="text-amber" />
            <Stat label="LAST 24H" value={stats.last24h} accent="text-signal" />
            <Stat label="W/ CONTACT" value={stats.withContact} accent="text-wire" />
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap gap-3 items-center border-b border-hairline">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, keyword…"
          className="flex-1 min-w-[220px] bg-panel2 border border-hairline rounded px-3 py-2 text-sm focus-visible:outline-signal placeholder:text-muted"
        />
        <FilterSelect
          value={category}
          onChange={(v) => setCategory(v as CategoryFilter)}
          options={[
            ["all", "All categories"],
            ["trading", "Trading / EA / Pine"],
            ["web", "Web / websites"],
            ["other", "Other"],
          ]}
        />
        <FilterSelect
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
          options={[
            ["all", "All statuses"],
            ["new", "New"],
            ["contacted", "Contacted"],
            ["quoted", "Quoted"],
            ["won", "Won"],
            ["lost", "Lost"],
            ["ignored", "Ignored"],
          ]}
        />
        <FilterSelect
          value={source}
          onChange={(v) => setSource(v)}
          options={[["all", "All sources"], ...sources.map((s) => [s, s] as [string, string])]}
        />
      </section>

      <section className="max-w-6xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 border border-rose/40 bg-rose/10 text-rose text-sm rounded px-3 py-2 font-mono">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-muted font-mono text-sm">Scanning sources…</p>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-hairline rounded-lg p-10 text-center">
            <p className="text-fg font-medium">No leads match right now.</p>
            <p className="text-muted text-sm mt-1">
              {leads.length === 0
                ? "The scraper hasn't found or synced any matches yet — check the GitHub Actions run, or widen your filters."
                : "Try clearing a filter or search term."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((lead) => (
              <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="text-right">
      <div className={`text-lg leading-none tabular ${accent ?? "text-fg"}`}>{value}</div>
      <div className="text-[10px] text-muted tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-panel2 border border-hairline rounded px-3 py-2 text-sm font-mono focus-visible:outline-signal"
    >
      {options.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}
