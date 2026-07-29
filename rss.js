import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });

/**
 * Fetches and parses an RSS/Atom feed into a flat array of
 * { id, title, description, link, pubDate }.
 * Returns [] on any failure instead of throwing — a broken feed
 * shouldn't take down the whole scraper run.
 */
export async function fetchRss(url, sourceLabel = "rss") {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "lead-hunter-bot/1.0" },
    });
    if (!res.ok) {
      console.warn(`[${sourceLabel}] feed returned ${res.status}: ${url}`);
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml);

    const items =
      parsed?.rss?.channel?.item ||
      parsed?.feed?.entry ||
      [];
    const arr = Array.isArray(items) ? items : [items];

    return arr
      .filter(Boolean)
      .map((item) => ({
        id: item.guid?.["#text"] || item.guid || item.id || item.link,
        title: item.title?.["#text"] || item.title || "",
        description: item.description || item.summary?.["#text"] || item.summary || "",
        link: item.link?.["@_href"] || item.link || "",
        pubDate: item.pubDate || item.published || item.updated || null,
      }));
  } catch (err) {
    console.warn(`[${sourceLabel}] feed fetch failed: ${url} —`, err.message);
    return [];
  }
}
