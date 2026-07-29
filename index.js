import { fetchRedditLeads } from "./sources/reddit.js";
import { fetchHackerNewsLeads } from "./sources/hackernews.js";
import { fetchGithubLeads } from "./sources/github.js";
import { fetchMql5Leads } from "./sources/mql5.js";
import { fetchForexFactoryLeads } from "./sources/forexfactory.js";
import { upsertLeads } from "./lib/supabase.js";

// Each connector runs independently and is wrapped so one broken source
// (e.g. a forum changed its RSS path) never stops the others from running.
const SOURCES = [
  { name: "reddit", fn: fetchRedditLeads },
  { name: "hackernews", fn: fetchHackerNewsLeads },
  { name: "github", fn: fetchGithubLeads },
  { name: "mql5", fn: fetchMql5Leads },
  { name: "forexfactory", fn: fetchForexFactoryLeads },
];

async function run() {
  const startedAt = Date.now();
  console.log(`Lead Hunter scraper starting — ${new Date().toISOString()}`);

  let totalFound = 0;
  let totalInserted = 0;
  let totalSkipped = 0;

  for (const { name, fn } of SOURCES) {
    try {
      const leads = await fn();
      totalFound += leads.length;

      if (leads.length) {
        const { inserted, skipped, error } = await upsertLeads(leads);
        if (!error) {
          totalInserted += inserted;
          totalSkipped += skipped;
        }
        console.log(
          `[${name}] found ${leads.length} matching posts -> ${inserted ?? 0} new, ${skipped ?? 0} already known`
        );
      } else {
        console.log(`[${name}] found 0 matching posts`);
      }
    } catch (err) {
      // A whole source failing (network, API shape change, etc.) should not
      // crash the run — log it and move on to the next source.
      console.error(`[${name}] source failed entirely:`, err.message);
    }
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(
    `Done in ${seconds}s — ${totalFound} matched across all sources, ${totalInserted} new leads added, ${totalSkipped} duplicates skipped.`
  );
}

run().catch((err) => {
  console.error("Fatal scraper error:", err);
  process.exit(1);
});
