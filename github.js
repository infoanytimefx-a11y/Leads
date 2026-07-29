import { matchKeywords } from "../lib/keywords.js";
import { extractContact } from "../lib/extract.js";

// GitHub's public Search API. Works unauthenticated (60 req/hr) but we pass
// GITHUB_TOKEN when available (Actions provides this automatically) to get
// 30 req/min instead. Catches "hiring a dev for a MQL5 EA" style issues on
// job-board repos and freelance-request issues.
const QUERIES = [
  "\"looking for a developer\" in:body",
  "\"need a pine script developer\" in:title,body",
  "\"need an ea\" in:title,body trading",
  "\"hire a freelancer\" website in:body",
];

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

export async function fetchGithubLeads() {
  const leads = [];
  const cutoff = new Date(Date.now() - TWO_MONTHS_MS).toISOString().slice(0, 10);
  const token = process.env.GITHUB_TOKEN;

  const headers = {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  for (const q of QUERIES) {
    try {
      const query = `${q} created:>${cutoff}`;
      const res = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&sort=created&order=desc&per_page=30`,
        { headers }
      );
      if (!res.ok) {
        console.warn(`[github] query "${q}" returned ${res.status}`);
        continue;
      }
      const json = await res.json();
      const items = json?.items || [];

      for (const item of items) {
        const text = `${item.title}\n${item.body || ""}`;
        const { isMatch, category, matched } = matchKeywords(text);
        if (!isMatch) continue;

        const { email, phone } = extractContact(text);

        leads.push({
          source: "github",
          external_id: String(item.id),
          title: item.title.slice(0, 500),
          description: (item.body || "").slice(0, 3000),
          url: item.html_url,
          category,
          matched_keywords: matched,
          contact_name: item.user?.login ? `${item.user.login} (GitHub)` : null,
          contact_email: email,
          contact_phone: phone,
          author: item.user?.login,
          posted_at: item.created_at,
        });
      }
    } catch (err) {
      console.warn(`[github] query "${q}" failed:`, err.message);
    }
  }

  return leads;
}
