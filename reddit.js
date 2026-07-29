import { matchKeywords } from "../lib/keywords.js";
import { extractContact } from "../lib/extract.js";

// Subreddits worth watching for these kinds of requests. Add/remove freely.
const SUBREDDITS = [
  "forhire", "slavelabour", "forex", "algotrading", "Daytrading",
  "Trading", "mql4", "mql5", "webdev", "web_design", "freelance",
  "smallbusiness", "shopify", "Wordpress", "Entrepreneur", "SaaS",
  "startups", "cryptocurrency",
];

const HEADERS = {
  "User-Agent": "lead-hunter-bot/1.0 (personal lead scanner)",
};

const TWO_MONTHS_SECONDS = 60 * 24 * 60 * 60;

export async function fetchRedditLeads() {
  const leads = [];
  const now = Math.floor(Date.now() / 1000);

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/new.json?limit=50`,
        { headers: HEADERS }
      );
      if (!res.ok) {
        console.warn(`[reddit] r/${sub} returned ${res.status}, skipping`);
        continue;
      }
      const json = await res.json();
      const posts = json?.data?.children || [];

      for (const { data: post } of posts) {
        if (now - post.created_utc > TWO_MONTHS_SECONDS) continue; // older than 2 months

        const text = `${post.title}\n${post.selftext || ""}`;
        const { isMatch, category, matched } = matchKeywords(text);
        if (!isMatch) continue;

        const { email, phone } = extractContact(text);

        leads.push({
          source: "reddit",
          external_id: post.id,
          title: post.title.slice(0, 500),
          description: (post.selftext || "").slice(0, 3000),
          url: `https://www.reddit.com${post.permalink}`,
          category,
          matched_keywords: matched,
          contact_name: post.author && post.author !== "[deleted]" ? `u/${post.author}` : null,
          contact_email: email,
          contact_phone: phone,
          author: post.author,
          posted_at: new Date(post.created_utc * 1000).toISOString(),
        });
      }
    } catch (err) {
      console.warn(`[reddit] r/${sub} failed:`, err.message);
    }
  }

  return leads;
}
