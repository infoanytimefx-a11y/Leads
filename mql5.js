import { fetchRss } from "../lib/rss.js";
import { matchKeywords } from "../lib/keywords.js";
import { extractContact } from "../lib/extract.js";

// MQL5.com publishes RSS feeds for its forum sections. This is best-effort:
// forum software changes its feed URLs occasionally, so if this connector
// starts returning nothing, check https://www.mql5.com/en/forum for the
// current RSS link and update the URL below.
const FEEDS = [
  "https://www.mql5.com/en/forum/rss",
];

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

export async function fetchMql5Leads() {
  const leads = [];
  const cutoff = Date.now() - TWO_MONTHS_MS;

  for (const feedUrl of FEEDS) {
    const items = await fetchRss(feedUrl, "mql5");

    for (const item of items) {
      const posted = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
      if (posted < cutoff) continue;

      const text = `${item.title}\n${item.description}`;
      const { isMatch, category, matched } = matchKeywords(text);
      if (!isMatch) continue;

      const { email, phone } = extractContact(text);
      const id = String(item.id || item.link);
      if (!id) continue;

      leads.push({
        source: "mql5",
        external_id: id,
        title: String(item.title).slice(0, 500),
        description: String(item.description).slice(0, 3000),
        url: item.link,
        category,
        matched_keywords: matched,
        contact_name: null,
        contact_email: email,
        contact_phone: phone,
        author: null,
        posted_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      });
    }
  }

  return leads;
}
