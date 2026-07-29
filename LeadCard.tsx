"use client";

import type { Lead } from "@/lib/supabase";

const STATUS_OPTIONS: Lead["status"][] = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
  "ignored",
];

const SOURCE_LABEL: Record<string, string> = {
  reddit: "Reddit",
  hackernews: "Hacker News",
  github: "GitHub",
  mql5: "MQL5",
  forexfactory: "Forex Factory",
};

function timeAgo(iso: string | null) {
  if (!iso) return "unknown";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function LeadCard({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange: (id: number, status: Lead["status"]) => void;
}) {
  const ticker = lead.category === "trading" ? "TRD" : lead.category === "web" ? "WEB" : "OTH";
  const tickerColor =
    lead.category === "trading"
      ? "text-signal border-signal/40 bg-signal/10"
      : lead.category === "web"
      ? "text-wire border-wire/40 bg-wire/10"
      : "text-muted border-hairline bg-panel2";

  return (
    <article className="border border-hairline bg-panel rounded-lg p-4 flex flex-col gap-3 hover:border-signal/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-mono text-[11px] tracking-wider border rounded px-1.5 py-0.5 ${tickerColor}`}>
            {ticker}
          </span>
          <span className="font-mono text-[11px] text-muted uppercase tracking-wide">
            {SOURCE_LABEL[lead.source] ?? lead.source}
          </span>
          <span className="text-muted text-[11px]">·</span>
          <span className="font-mono text-[11px] text-muted tabular">{timeAgo(lead.posted_at)}</span>
        </div>
        <select
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value as Lead["status"])}
          className="bg-panel2 border border-hairline rounded px-2 py-1 text-xs font-mono text-fg focus-visible:outline-signal"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <a
        href={lead.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-semibold leading-snug hover:text-signal transition-colors"
      >
        {lead.title}
      </a>

      {lead.description && (
        <p className="text-sm text-muted line-clamp-3">{lead.description}</p>
      )}

      {lead.matched_keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {lead.matched_keywords.slice(0, 6).map((k) => (
            <span
              key={k}
              className="text-[10px] font-mono text-muted border border-hairline rounded px-1.5 py-0.5"
            >
              {k}
            </span>
          ))}
        </div>
      )}

      {(lead.contact_name || lead.contact_email || lead.contact_phone) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono border-t border-hairline pt-2">
          {lead.contact_name && <span className="text-fg">{lead.contact_name}</span>}
          {lead.contact_email && (
            <a href={`mailto:${lead.contact_email}`} className="text-signal hover:underline">
              {lead.contact_email}
            </a>
          )}
          {lead.contact_phone && (
            <a href={`tel:${lead.contact_phone}`} className="text-signal hover:underline">
              {lead.contact_phone}
            </a>
          )}
        </div>
      )}
    </article>
  );
}
