import { matchKeywords } from "../lib/keywords.js";
import { extractContact } from "../lib/extract.js";

// HN Algolia search API — public, no key required.
// We search story + comment text for our phrases, and also scan the
// monthly "Who wants to be hired" / "Freelancer? Seeking freelancer?" threads.
const QUERIES = [
  "looking for a developer", "need a developer", "hire a developer",
  "trading bot", "expert advisor", "pine script", "need a website",
];

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

export async function fetchHackerNewsLeads() {
  const leads = [];
  const now = Date.now();

  for (const query of QUERIES) {
    try {
      const res = await fetch(
        `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(
          query
        )}&tags=(story,comment)&numericFilters=created_at_i>${Math.floor(
          (now - TWO_MONTHS_MS) / 1000
        )}`
      );
      if (!res.ok) {
        console.warn(`[hackernews] query "${query}" returned ${res.status}`);
        continue;
      }
      const json = await res.json();
      const hits = json?.hits || [];

      for (const hit of hits) {
        const text = `${hit.title || ""}\n${hit.comment_text || hit.story_text || ""}`;
        const { isMatch, category, matched } = matchKeywords(text);
        if (!isMatch) continue;

        const { email, phone } = extractContact(text);
        const id = hit.objectID;

        leads.push({
          source: "hackernews",
          external_id: id,
          title: (hit.title || text.slice(0, 120)).slice(0, 500),
          description: (hit.comment_text || hit.story_text || "").slice(0, 3000),
          url: hit.url || `https://news.ycombinator.com/item?id=${id}`,
          category,
          matched_keywords: matched,
          contact_name: hit.author ? `${hit.author} (HN)` : null,
          contact_email: email,
          contact_phone: phone,
          author: hit.author,
          posted_at: hit.created_at,
        });
      }
    } catch (err) {
      console.warn(`[hackernews] query "${query}" failed:`, err.message);
    }
  }

  return leads;
}
