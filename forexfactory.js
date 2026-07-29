import { fetchRss } from "../lib/rss.js";
import { matchKeywords } from "../lib/keywords.js";
import { extractContact } from "../lib/extract.js";

// ForexFactory forum RSS. Also best-effort — some forum sections gate RSS
// or change paths over time. If this returns nothing, check
// https://www.forexfactory.com/rss.php for current feed URLs and swap in
// the right forum ID(s) below.
const FEEDS = [
  "https://www.forexfactory.com/rss.php?do=newthreads",
];

const TWO_MONTHS_MS = 60 * 24 * 60 * 60 * 1000;

export async function fetchForexFactoryLeads() {
  const leads = [];
  const cutoff = Date.now() - TWO_MONTHS_MS;

  for (const feedUrl of FEEDS) {
    const items = await fetchRss(feedUrl, "forexfactory");

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
        source: "forexfactory",
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
