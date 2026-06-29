// ─────────────────────────────────────────────────────────────
//  dashboardPrefs.js  —  Single source of truth for dashboard widget config
//
//  To add a new widget:
//    1. Add one entry to WIDGET_DEFS
//    2. Add one toggle row in Settings.jsx  (reads WIDGET_DEFS automatically)
//    3. Gate the section in Dashboard.jsx with prefs.<key>
//  Nothing else changes.
// ─────────────────────────────────────────────────────────────

export const DEFAULT_PREFS = {
  quote:             true,
  agentBriefing:     true,
  focusTimer:        true,
  aiRecommendation:  true,
  deadlineCards:     true,
};

export const WIDGET_DEFS = [
  { key: 'quote',            label: 'Daily Motivation Quote',  desc: 'AI / custom / classic quote card at the top of Dashboard' },
  { key: 'agentBriefing',   label: 'Agent Briefing',          desc: 'Proactive AI observations with one-click actions' },
  { key: 'focusTimer',      label: 'Focus Timer',             desc: 'Pomodoro-style timer alongside deadline cards' },
  { key: 'aiRecommendation',label: 'AI Recommendation',       desc: 'Task-prioritisation advice from Gemini' },
  { key: 'deadlineCards',   label: 'Due Today / Tomorrow',    desc: 'Quick-glance cards for imminent deadlines' },
];

/** Merges stored prefs with defaults — new keys always default to true */
export function resolvePrefs(stored) {
  return { ...DEFAULT_PREFS, ...(stored || {}) };
}
