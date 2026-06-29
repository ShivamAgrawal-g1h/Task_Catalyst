// ─────────────────────────────────────────────────────────────
//  quotes.js  –  Global quote store for Task Catalyst
//
//  Sections
//  1. FALLBACK_QUOTES  – built-in motivational pool
//  2. Custom quote CRUD  – persisted to localStorage
//  3. Quote-mode helpers  – 'ai', 'custom', 'mixed'
//  4. Smart quote picker  – the single function Dashboard calls
// ─────────────────────────────────────────────────────────────

// ── 1. Global Fallback (built-in classic) quotes ────────────────────────────

export const FALLBACK_QUOTES = [
  "Time & Patience can heal, but procrastination destroys.",
  "It is during our darkest moments that we must focus to see the light.",
  "Choice is yours.\nToday: Pain & Hard Work\nTomorrow: Pain & Regret",
  "Intelligence: Knowing.\nWisdom: Applying.\nEducate yourself with wisdom.",
  "Turn your wounds into wisdom. Kill the bloody procrastination.",
  "Music Therapy: Blast an aggressive, high-tempo playlist to jolt your mind out of a slump.",
  "The Cold Shock: Splash freezing cold water on your face for 15 seconds to stimulate the vagus nerve and reset your nervous system.",
  "The 5-Minute Walk: Step outside for a brisk walk in the fresh air to naturally flood your brain with dopamine.",
  "Knowing your negative point is a positive point.",
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
  "If you want to conquer the world, conquer yourself first.",
  "Whatever you do, do it with all your might.",
  "If you look at what you have in life, you'll always have more.",
  "With the new day comes new strength and new thoughts.",
  "Wake up with determination, go to bed with satisfaction.",
  "Do what you can, with what you have, where you are.",
  "Be the change that you wish to see in the world.",
  "Let your unique awesomeness and positive energy inspire confidence in others.",
  "The past is a place of reference, not a place of residence.",
  "Your passion is waiting for your courage to catch up.",
  "Do not wait; the time will never be 'just right'.",
  "Mastering others is strength. Mastering yourself is true power.",
  "Great minds have purposes, others have wishes.",
  "We generate fears while we sit. We overcome them by action.",
  "Write it on your heart that every day is the best day in the year.",
  "The only person you are destined to become is the person you decide to be.",
  "Happiness is not something ready made. It comes from your own actions.",
  "I will go anywhere provided it be forward.",
  "The secret of getting ahead is getting started. Every line of code you write today brings you closer to the engineer you're becoming.",
  "Your consistency compounds. Each solved problem is not just a solved problem—it's a stronger mind.",
  "Deadlines are not walls. They're starting guns. You already have what it takes to run.",
  "Progress, not perfection. Ship something, learn everything, then make it better tomorrow.",
  "Every expert was once a beginner who refused to quit. Your streak continues today.",
  "Small tasks completed is momentum built. Clear your list, clear your mind.",
  "You don't rise to the level of your goals. You fall to the level of your systems. Build good ones.",
];

// ── 2. Custom quote store (CRUD) (localStorage) ──────────────────────

const CUSTOM_KEY  = 'tc_custom_quotes';
const MODE_KEY    = 'tc_quote_mode';
const PINNED_KEY  = 'tc_pinned_quote';

/** Returns the array of user-created custom quotes (strings). */
export function getCustomQuotes() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]');
  } catch {
    return [];
  }
}

/** Saves (overwrites) the entire custom quotes array. */
export function saveCustomQuotes(quotes) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(quotes));
}

/** Adds one new custom quote. Returns updated array. */
// older version
// export function addCustomQuote(text) {
//   const trimmed = text.trim();
//   if (!trimmed) return getCustomQuotes();
//   const updated = [...getCustomQuotes(), trimmed];// ⚠️ Blindly appends
//   saveCustomQuotes(updated);
//   return updated;
// }
export function addCustomQuote(text) {
  const trimmed = text.trim();
  const quotes = getCustomQuotes();

  if (!trimmed) return quotes;
  if (quotes.includes(trimmed)) return quotes; // ⚠️ Prevents duplicates

  const updated = [...quotes, trimmed];
  saveCustomQuotes(updated);
  return updated;
}


/** Removes a custom quote by index. Returns updated array. */
export function removeCustomQuote(index) {
  const updated = getCustomQuotes().filter((_, i) => i !== index);
  saveCustomQuotes(updated);
  return updated;
}

/** Edits a custom quote by index. Returns updated array. */
export function editCustomQuote(index, newText) {
  const updated = getCustomQuotes().map((q, i) => (i === index ? newText.trim() : q));
  saveCustomQuotes(updated);
  return updated;
}

const LAST_QUOTE_KEY = 'tc_last_quote';

//** gets you the last returned quote */
function getLastQuote() {
  return localStorage.getItem(LAST_QUOTE_KEY) || '';
}

//** sets the new value of last returned quote */
function setLastQuote(text) {
  localStorage.setItem(LAST_QUOTE_KEY, text);
}

// ── 3. Quote-mode helpers ─────────────────────────────────────
//
//  Modes
//  ┌────────────┬─────────────────────────────────────────────────────────────────────────────────┐
//  │ 'ai'       │ Prefer AI; fallback quotes have a 5 % ghost-chance even when AI works            │
//  │ 'mixed'    │ (default) AI + custom + 5 % fallback ghost  [or custom + fallback if AI fails]   │
//  │ 'custom'   │ Always from user's custom pool (+ fallback if custom pool is empty)              │
//  │ 'pinned'   │ Always show the single pinned quote, never rotate                                 │
//  └────────────┴─────────────────────────────────────────────────────────────────────────────────┘

/** @returns {'ai'|'mixed'|'custom'|'pinned'} */
export function getQuoteMode() {
  return localStorage.getItem(MODE_KEY) || 'mixed';
}

export function setQuoteMode(mode) {
  localStorage.setItem(MODE_KEY, mode);
}

/** The one quote permanently displayed when mode === 'pinned'. */
export function getPinnedQuote() {
  return localStorage.getItem(PINNED_KEY) || '';
}

export function setPinnedQuote(text) {
  localStorage.setItem(PINNED_KEY, text.trim());
}

// ── 4. Smart quote picker ─────────────────────────────────────

/**
 * pick() returns a random item from an string array,
 * without immediately repeating the last string.
 * Falls back to fallback pool if the array is empty.
 */
function pick(pool) {
  if (!pool || pool.length === 0)
    return pickFallback();

  if (pool.length === 1) {
    setLastQuote(pool[0]);
    return pool[0];
}

  const last = getLastQuote();

  let choice;

  do {
    choice = pool[Math.floor(Math.random() * pool.length)];
  } while (choice === last);

  setLastQuote(choice);

  return choice;
}
/**
 * pickMixed() method to handle object arrays in
 * mixed AI pool mode wherein,
 * every object has a "text" field for string quote.
 */
function pickMixed(pool) {
  if (!pool || pool.length === 0)
    return { text: pickFallback(), source: 'fallback' };

  if (pool.length === 1) {
    setLastQuote(pool[0].text);
    return pool[0];
  }

  const last = getLastQuote();

  let choice;

  do {
    choice = pool[Math.floor(Math.random() * pool.length)];
  } while (choice.text === last);

  setLastQuote(choice.text);

  return choice;
}

export function pickFallback() {
  return pick(FALLBACK_QUOTES);
}

/**
 * Main entry — call this everywhere instead of the old getFallbackQuote().
 *
 * @param {string|null} aiQuote   – result from Gemini (null if AI failed / not configured)
 * @returns {{ text: string, source: 'ai'|'custom'|'fallback' }}
 */
export function resolveQuote(aiQuote) {
  const mode    = getQuoteMode();
  const custom  = getCustomQuotes();
  const hasAI   = !!aiQuote;
  const hasCust = custom.length > 0;

  // ── Pinned mode: always show the same quote ──────────────
  if (mode === 'pinned') {
    const pinned = getPinnedQuote();
    if (pinned){
      setLastQuote(pinned);
      return { text: pinned, source: 'custom' };
    }
    // nothing pinned yet — fall through to 'mixed'
  }

  // ── Custom-only mode ──────────────────────────────────────
  if (mode === 'custom') {
    if (hasCust) return { text: pick(custom), source: 'custom' };
    return { text: pickFallback(), source: 'fallback' };  // pool empty
  }

  // ── AI-only mode (still allows 5 % fallback ghost) ───────
  if (mode === 'ai') {
    if (hasAI && Math.random() > 0.05){
      setLastQuote(aiQuote.text);
      return aiQuote;
    }
    if (hasAI) return { text: pickFallback(), source: 'fallback' };   // 5 % ghost
    // AI failed
    if (hasCust) return { text: pick(custom), source: 'custom' };
    return { text: pickFallback(), source: 'fallback' };
  }

  // ── Mixed mode (default) ──────────────────────────────────
  // Pool = AI + custom.  5 % chance of pulling from fallbacks regardless.
  if (hasAI) {
    // 5 % chance: override everything with a fallback ghost
    if (Math.random() < 0.05) return { text: pickFallback(), source: 'fallback' };

    // Build weighted pool: AI quote repeated proportionally
    // AI is given a fixed relative weight.
    // More custom quotes naturally reduce the probability of selecting the AI quote.

    // example : ai pool = 3 & custom pool = 2, then
    // Weight: AI = 60 %, custom evenly split across remaining 40 %

    const pool = [];
    const AI_WEIGHT = 4; // relative weight for AI slot

    for (let i = 0; i < AI_WEIGHT; i++)
      pool.push({ text: aiQuote.text, source: 'ai' });
    custom.forEach(q => pool.push({ text: q, source: 'custom' }));

    return pickMixed(pool);
  }

  // AI unavailable — mix custom + fallback (80 % custom if available, else pure fallback)
  if (hasCust) {
    // Only one custom quote and it was shown last time
    if (custom.length === 1 && custom[0] === getLastQuote()) {
      return {
        text: pickFallback(),
        source: 'fallback'
      };
    }
    const roll = Math.random();
    if (roll < 0.80) return { text: pick(custom), source: 'custom' };
    return { text: pickFallback(), source: 'fallback' };
  }
  return { text: pickFallback(), source: 'fallback' };
}
