// Keyword sets pulled directly from the brief. Add/remove freely — the
// scraper re-reads this file on every run, no redeploy needed for edits.

export const TRADING_KEYWORDS = [
  "mql4", "mql5", "expert advisor", "ea development", "custom indicator",
  "pine script", "pinescript", "tradingview script", "tradingview indicator",
  "trading bot", "forex robot", "algo trading", "algorithmic trading",
  "automated trading system", "trading automation", "strategy automation",
  "signal indicator", "dashboard indicator", "market scanner",
  "multi-timeframe indicator", "risk management tool", "position size calculator",
  "trade manager", "copy trading", "broker integration", "backtesting tool",
  "trading journal", "trading calculator", "metatrader", "forex programmer",
  "need an mql5 developer", "need an mql4 programmer", "need a pine script developer",
  "looking for a tradingview developer", "looking for a forex programmer",
  "need a trading bot", "need an ea", "build my trading strategy",
  "convert indicator to ea", "convert pine script to mql5", "convert mql4 to mql5",
  "convert tradingview indicator", "fix my expert advisor", "fix my indicator",
  "optimise my ea", "optimize my ea", "add features to my bot"
];

export const WEB_KEYWORDS = [
  "website development", "business website", "company website", "landing page",
  "portfolio website", "ecommerce website", "e-commerce website", "shopify development",
  "woocommerce development", "wordpress website", "custom website", "booking website",
  "membership website", "client portal", "dashboard development", "web application",
  "saas platform", "website redesign", "website maintenance", "website speed",
  "seo fix", "mobile responsive website", "need a website", "need a web developer",
  "website designer wanted", "looking for a freelancer", "looking for a developer",
  "build an online store", "build a company website", "need a landing page",
  "custom software needed", "crm development", "automation software", "api integration"
];

const ALL_KEYWORDS = [
  ...TRADING_KEYWORDS.map((k) => ({ k, category: "trading" })),
  ...WEB_KEYWORDS.map((k) => ({ k, category: "web" })),
];

/**
 * Checks free text against the keyword lists.
 * Returns { isMatch, category, matched: string[] }
 */
export function matchKeywords(text) {
  if (!text) return { isMatch: false, category: "other", matched: [] };
  const lower = text.toLowerCase();
  const matched = [];
  let tradingHits = 0;
  let webHits = 0;

  for (const { k, category } of ALL_KEYWORDS) {
    if (lower.includes(k)) {
      matched.push(k);
      if (category === "trading") tradingHits++;
      else webHits++;
    }
  }

  if (matched.length === 0) return { isMatch: false, category: "other", matched: [] };

  const category = tradingHits >= webHits ? "trading" : "web";
  return { isMatch: true, category, matched };
}
