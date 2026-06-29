// ─────────────────────────────────────────────────────────────
//  agentEngine.js  —  Agentic reasoning layer for Task Catalyst
//
//  This is NOT a chatbot wrapper.
//  It observes the full task state, reasons about risk/opportunity,
//  and returns structured INTERVENTIONS — each with:
//    • a headline the user sees
//    • an explanation of WHY
//    • an optional ACTION the agent can execute on their behalf
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from '@google/generative-ai';
import { computePriorityScore } from './priority.js';

// ── Gemini call ───────────────────────────────────────────────

async function callGemini(prompt, apiKey) {
  if (!apiKey) return null;
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model  = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────

function hoursUntil(deadline) {
  if (!deadline) return null;
  return (new Date(deadline) - Date.now()) / 36e5;
}

function daysUntil(deadline) {
  const h = hoursUntil(deadline);
  return h === null ? null : h / 24;
}

function shortDate(deadline) {
  if (!deadline) return '';
  return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Core reasoning function ───────────────────────────────────

/**
 * analyzeAndAct()
 *
 * Returns an array of up to 4 Intervention objects:
 * {
 *   id:       string           — unique key
 *   type:     'warning'|'action'|'insight'|'plan'
 *   headline: string           — one punchy line (shown bold)
 *   reason:   string           — 1–2 sentences of WHY the agent flagged this
 *   action:   object | null    — if not null, there's a button the user can click
 *     {
 *       label:   string        — button text
 *       kind:    'split_task' | 'add_tasks' | 'reorder_note'
 *       payload: any           — data the executor needs
 *     }
 * }
 */
export async function analyzeAndAct(tasks, profile, apiKey) {
  const pending  = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdue  = pending.filter(t => hoursUntil(t.deadline) !== null && hoursUntil(t.deadline) < 0);
  const dueIn72  = pending.filter(t => { const h = hoursUntil(t.deadline); return h !== null && h >= 0 && h <= 72; });
  const dueIn24  = dueIn72.filter(t => hoursUntil(t.deadline) <= 24);

  const interventions = [];

  // ── 1. Overdue storm ─────────────────────────────────────────
  if (overdue.length >= 2) {
    const sortedOverdue = [...overdue].sort((a, b) => a.importance - b.importance); // lowest importance first
    const weakest = sortedOverdue[0];
    const newDeadline = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
    interventions.push({
      id: 'overdue_storm',
      type: 'warning',
      headline: `${overdue.length} tasks are overdue — here's what to tackle first`,
      reason: `Your highest-risk overdue task is "${[...overdue].sort((a,b) => b.importance - a.importance)[0].title}". Leaving multiple overdue items compounds stress and hurts your completion rate.`,
      action: {
        label: `Postpone "${weakest.title}" by 2 days`,
        kind: 'postpone_task',
        payload: { task: weakest, newDeadline },
      },
    });
  }

  // ── 2. Deadline crunch (72 h window) ────────────────────────
  if (dueIn72.length >= 2) {
    const top      = [...dueIn72].sort((a, b) => b.priority_score - a.priority_score)[0];
    const soonest  = [...dueIn72].sort((a, b) => hoursUntil(a.deadline) - hoursUntil(b.deadline))[0];
    const minH     = Math.round(hoursUntil(soonest.deadline));
    const totalEst = dueIn72.reduce((s, t) => s + (t.time_estimate || 1), 0);

    // Build a human headline based on real urgency
    const nearestLabel = minH < 1
      ? 'in under an hour'
      : minH < 24
        ? `in ${minH}h`
        : `in ${Math.round(minH / 24)} day${Math.round(minH / 24) === 1 ? '' : 's'}`;

    interventions.push({
      id: 'deadline_crunch',
      type: 'warning',
      headline: `${dueIn72.length} tasks due soon — nearest ${nearestLabel} · ~${totalEst}h of work`,
      reason: `"${soonest.title}" is your most urgent (due ${nearestLabel}). Highest-priority overall is "${top.title}" (score ${top.priority_score}). You have ~${totalEst}h of work across these tasks — start now.`,
      action: null,
    });
  }

  // ── 3. Single critical deadline within 24 h ──────────────────
  if (dueIn24.length === 1 && dueIn72.length <= 2) {
    const t = dueIn24[0];
    const rawH = hoursUntil(t.deadline);
    // Build a human time label: use minutes when under 1h, hours otherwise
    const timeLabel = rawH < 1
      ? `${Math.max(1, Math.round(rawH * 60))} min`
      : `${Math.round(rawH)}h`;
    const startAdvice = rawH <= t.time_estimate
      ? 'immediately — you may already be cutting it close'
      : 'in the next hour';
    interventions.push({
      id: 'single_critical',
      type: 'warning',
      headline: `"${t.title}" is due in ${timeLabel}`,
      reason: `This is your most time-sensitive task right now. With ~${t.time_estimate}h estimated, start ${startAdvice}.`,
      action: null,
    });
  }

  // ── 4. Chronic postponer — split it ─────────────────────────
  const chronics = pending
    .filter(t => (t.postpone_count || 0) >= 2)
    .sort((a, b) => (b.postpone_count || 0) - (a.postpone_count || 0));

  if (chronics.length > 0) {
    const bad = chronics[0];
    interventions.push({
      id: `split_${bad.id}`,
      type: 'action',
      headline: `You've postponed "${bad.title}" ${bad.postpone_count}× — let me split it`,
      reason: `Tasks postponed 2+ times are almost always too large or too vague. Breaking it into 3 focused 20-minute sub-tasks removes the mental block and builds momentum.`,
      action: {
        label: 'Split into 3 sub-tasks',
        kind: 'split_task',
        payload: { task: bad },
      },
    });
  }

  // ── 5. AI-generated plan for interview / exam / project ──────
  //    Looks for high-importance tasks with a keyword suggesting preparation
  const prepKeywords = /interview|exam|test|presentation|demo|submission|project|assignment|viva|contest|hackathon/i;
  const prepTask = pending
    .filter(t => t.importance >= 4 && prepKeywords.test(t.title + ' ' + (t.description || '')))
    .sort((a, b) => b.priority_score - a.priority_score)[0];

  if (prepTask && daysUntil(prepTask.deadline) !== null && daysUntil(prepTask.deadline) <= 7) {
    const days = Math.round(daysUntil(prepTask.deadline));
    const planItems = await buildPrepPlan(prepTask, days, apiKey);
    if (planItems) {
      interventions.push({
        id: `prep_${prepTask.id}`,
        type: 'plan',
        headline: `${prepTask.title} in ${days} day${days === 1 ? '' : 's'} — I've drafted a prep plan`,
        reason: `High-stakes task detected. I've broken it into ${planItems.length} concrete steps you can add directly to your task list.`,
        action: {
          label: `Add ${planItems.length} prep tasks`,
          kind: 'add_tasks',
          payload: {
            tasks: planItems,
            sourceTaskId: prepTask.id,
          },
        },
      });
    }
  }

  // ── 6. Idle / no tasks — proactive suggestion ────────────────
  if (pending.length === 0) {
    interventions.push({
      id: 'all_clear',
      type: 'insight',
      headline: 'All clear — great time to plan ahead',
      reason: `No pending tasks. Use this window to add upcoming assignments or projects before the pressure builds.`,
      action: null,
    });
  }

  // ── 7. AI-written insight (fallback filler if < 2 items) ─────
  if (interventions.length < 2 && pending.length > 0 && apiKey) {
    const aiInsight = await buildAIInsight(pending, profile, apiKey);
    if (aiInsight) {
      interventions.push({
        id: 'ai_insight',
        type: 'insight',
        headline: aiInsight.headline,
        reason: aiInsight.reason,
        action: null,
      });
    }
  }

  return interventions.slice(0, 4); // cap at 4 to avoid overwhelming
}

// ── AI sub-calls ──────────────────────────────────────────────

async function buildPrepPlan(task, daysLeft, apiKey) {
  const raw = await callGemini(
    `A student has a task: "${task.title}" in ${daysLeft} days. Category: ${task.category || 'general'}.
Generate exactly 3-4 concrete preparation sub-tasks as a JSON array.
Each item: { "title": "...", "time_estimate": <hours as number>, "importance": <1-5>, "category": "${task.category || 'general'}" }
Make titles specific and actionable (not generic). Keep time_estimate realistic (0.5-2h each).
Respond ONLY with the JSON array, no markdown, no explanation.`,
    apiKey
  );
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const items = JSON.parse(cleaned);
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.map((item, i) => {
      const rawDeadline = task.deadline
        ? new Date(new Date(task.deadline).getTime() - (items.length - i) * 24 * 3600 * 1000)
        : null;
      // Clamp: never schedule a sub-task in the past
      const clampedDeadline = rawDeadline
        ? new Date(Math.max(rawDeadline.getTime(), Date.now() + 30 * 60 * 1000)).toISOString()
        : null;
      return {
        ...item,
        title: item.title,
        description: `Prep sub-task for: ${task.title}`,
        deadline: clampedDeadline,
        importance: item.importance || task.importance || 3,
        time_estimate: item.time_estimate || 1,
        category: item.category || task.category || 'general',
        status: 'pending',
        priority_score: computePriorityScore({ ...item, deadline: clampedDeadline }),
      };
    });
  } catch {
    return null;
  }
}

async function buildAIInsight(pending, profile, apiKey) {
  const taskSummary = pending
    .slice(0, 6)
    .map(t => `"${t.title}" (score:${t.priority_score}, est:${t.time_estimate}h${t.deadline ? `, due:${shortDate(t.deadline)}` : ''})`)
    .join('\n');

  const raw = await callGemini(
    `You are a productivity AI agent reviewing a student's tasks:
${taskSummary}
Productivity type: ${profile?.productivity_type || 'unknown'}.

Give ONE specific, non-obvious insight about their workload pattern or risk.
Respond ONLY as JSON: { "headline": "10 words max, punchy", "reason": "2 sentences max, specific and direct" }
No markdown, no wrapping.`,
    apiKey
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}
/**
 *            VERSION 4
 *
 * | Area                          | Version 3                                              | Version 4                                                       | Better        |
 * | ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------- | ------------- |
 * | Deadline crunch headline      | Fixed "72 h" wording                                   | Uses nearest actual deadline ("5h", "2 days", "under an hour")  | **Version 4** |
 * | Urgency reasoning             | Highest-priority task only                             | Separates most urgent task from highest-priority task           | **Version 4** |
 * | Single critical deadline      | Rounded hours only                                     | Shows minutes when <1h and avoids "0h" display                 | **Version 4** |
 * | Start recommendation          | Based on hour subtraction formula                      | Uses clearer human-readable advice ("start immediately")        | **Version 4** |
 * | Overdue intervention          | Smart postpone action                                  | Same                                                            | Same          |
 * | Chronic postpone handling     | Split into 3 focused 20-minute sub-tasks               | Same                                                            | Same          |
 * | AI prep-plan generation       | Dynamic AI-generated preparation tasks                 | Same                                                            | Same          |
 * | AI insight generation         | Same                                                   | Same                                                            | Same          |
 * | Deadline clamping             | Prevents AI-generated tasks from being scheduled past  | Same                                                            | Same          |
 * | Reliability                   | Stable                                                 | Stable                                                          | Same          |
 *
 *
 * Quality assessment:
 * UX: Improved
 * Agent reasoning: Improved
 * Features: Same
 * Reliability: Same
 * Performance: Same
 * Code quality: Slightly improved
 *
 * Version 4 focuses on improving how urgency is communicated rather than
 * changing the reasoning engine itself.
 *
 * The deadline-crunch intervention now reports the nearest real deadline
 * instead of always referring to a 72-hour window, distinguishes the most
 * urgent task from the highest-priority task, and provides more natural,
 * human-readable messaging for imminent deadlines (including minute-level
 * precision for single critical tasks).
 *
 * No changes were made to AI planning, intervention ordering, scoring,
 * or task-generation logic. This version is therefore a UX refinement
 * with no known behavioral regressions compared to Version 3.
 */