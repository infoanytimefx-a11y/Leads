// Best-effort extraction of contact details FROM TEXT THE POSTER ALREADY
// MADE PUBLIC. This deliberately does not go looking for private profile
// data — only what's sitting in the post/comment body itself.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Loose international phone matcher: requires at least 7 digits so it
// doesn't false-positive on prices, dates, or issue numbers.
const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/g;

export function extractContact(text) {
  if (!text) return { email: null, phone: null };

  const emails = text.match(EMAIL_RE) || [];
  const email = emails.find((e) => !e.endsWith(".png") && !e.endsWith(".jpg")) || null;

  const phoneCandidates = (text.match(PHONE_RE) || []).filter((p) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  });
  const phone = phoneCandidates[0]?.trim() || null;

  return { email, phone };
}
