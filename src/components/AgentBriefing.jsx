/**
 *                    VERSION 4
 *
 * | Area                                 | Previous Version                               | Version 4 (Claude + Final Tweaks)                          | Better          |
 * | ------------------------------------ | ---------------------------------------------- | ---------------------------------------------------------- | --------------- |
 * | **Agent Briefing header**            | Plain observation text                         | Count badge for observations                               | **Version 4**   |
 * | **Card visual hierarchy**            | Standard border                                | Left accent border by intervention type                    | **Version 4**   |
 * | **Prep task preview**                | Simple numbered list                           | Circular numbered steps with improved spacing              | **Version 4**   |
 * | **Split task preview**               | Not available                                  | Shows generated sub-task plan before execution             | **Version 4**   |
 * | **Split deadline logic**             | Fixed (-6h / -3h / deadline)                   | Dynamic proportional scheduling (42% / 70% / 100%)         | **Version 4**   |
 * | **Short deadline handling**          | Could bunch tasks near deadline                | Smart minimum gap (30min–4h depending on time available)   | **Version 4**   |
 * | **Sub-task importance**              | All inherit original importance                | Planning tasks reduced by one importance level             | **Version 4**   |
 * | **Priority calculation**             | Copied from original task                      | Recomputed using `computePriorityScore()`                  | **Version 4**   |
 * | **Original task update**             | Update result ignored                          | Throws if archive/update fails                             | **Version 4**   |
 * | **Loading state cleanup**            | Reset after try/catch                          | Uses `finally` for guaranteed cleanup                      | **Version 4**   |
 * | **Postpone success message**         | Generic success toast                          | Dynamic task-specific success message                      | **Version 4**   |
 * | **Documentation**                    | Basic comments                                 | Detailed algorithm explanation and maintenance notes       | **Version 4**   |
 *
 * Major Improvements
 * ---------------------------------------------------------------
 * • Split scheduling is now proportional to remaining time instead
 *   of fixed offsets, making it work naturally for short and long
 *   deadlines alike.
 *
 * • Newly created sub-tasks receive freshly computed priority scores
 *   instead of inheriting the original task's priority, producing
 *   better dashboard ordering.
 *
 * • Planning-oriented sub-tasks have slightly lower importance than
 *   the final completion step, creating more realistic prioritization.
 *
 * • Database consistency improved by validating both insert and
 *   archive operations instead of silently ignoring update failures.
 *
 * • UI received a polish pass with better visual hierarchy, count
 *   badge, intervention accent colors, and execution previews while
 *   preserving the original component architecture.
 *
 * Overall
 * ---------------------------------------------------------------
 * Version 4 is primarily an intelligence and reliability upgrade.
 * The UI becomes more polished, while the task-splitting algorithm,
 * priority calculation, deadline distribution, and error handling are
 * significantly improved without increasing component complexity.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { computePriorityScore } from '../lib/priority.js';
import {
  Zap, AlertTriangle, Lightbulb, Calendar, ChevronRight,
  Loader2, CheckCircle2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Type config — 4px left border accent makes type scannable ── */
const TYPE_META = {
  warning: { icon: AlertTriangle, color: 'var(--rose-400)',  bg: 'rgba(244,63,94,0.06)',   border: 'rgba(244,63,94,0.2)',  accent: 'var(--rose-400)'  },
  action:  { icon: Zap,           color: 'var(--amber-400)', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.25)', accent: 'var(--amber-400)' },
  plan:    { icon: Calendar,      color: '#818CF8',           bg: 'rgba(129,140,248,0.06)', border: 'rgba(129,140,248,0.25)', accent: '#818CF8'         },
  insight: { icon: Lightbulb,     color: 'var(--cyan-400)',  bg: 'rgba(6,182,212,0.06)',   border: 'rgba(6,182,212,0.2)',  accent: 'var(--cyan-400)'  },
};

/* ── Main component ──────────────────────────────────────────── */
export default function AgentBriefing({ interventions, userId, onTasksAdded, onDismiss }) {
  if (!interventions || interventions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header with count badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'rgba(245,158,11,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={13} color="var(--amber-400)" />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Agent Briefing
        </span>
        {/* Tight count badge */}
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--amber-400)',
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 20, padding: '1px 7px', lineHeight: 1.6,
        }}>
          {interventions.length} observation{interventions.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {interventions.map(iv => (
          <InterventionCard
            key={iv.id}
            iv={iv}
            userId={userId}
            onTasksAdded={onTasksAdded}
            onDismiss={() => onDismiss(iv.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Individual card ─────────────────────────────────────────── */
function InterventionCard({ iv, userId, onTasksAdded, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const meta = TYPE_META[iv.type] || TYPE_META.insight;
  const Icon = meta.icon;

  async function execute() {
    setExecuting(true);
    try {
      if (iv.action.kind === 'split_task') {
        await executeSplitTask(iv.action.payload, userId);
        toast.success('Task split into 3 sub-tasks!');
      } else if (iv.action.kind === 'add_tasks') {
        await executeAddTasks(iv.action.payload, userId);
        toast.success(`${iv.action.payload.tasks.length} prep tasks added!`);
      } else if (iv.action.kind === 'postpone_task') {
        await executePostponeTask(iv.action.payload, userId);
        toast.success(`"${iv.action.payload.task.title}" postponed successfully.`);
      }
      setDone(true);
      onTasksAdded?.();
    } catch (e) {
      toast.error('Action failed — ' + e.message);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div style={{
      background: done ? 'rgba(52,211,153,0.06)' : meta.bg,
      border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : meta.border}`,
      // 4px left accent border makes warning/action/plan/insight scannable at a glance
      borderLeft: `4px solid ${done ? 'var(--emerald-400)' : meta.accent}`,
      borderRadius: 'var(--radius-sm)',
      padding: '12px 14px',
      transition: 'all 0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0, marginTop: 1,
          background: `${meta.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {done
            ? <CheckCircle2 size={14} color="var(--emerald-400)" />
            : <Icon size={14} color={meta.color} />
          }
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--emerald-400)' : 'var(--text-primary)', lineHeight: 1.4 }}>
            {done ? 'Done — ' : ''}{iv.headline}
          </span>

          {/* Reason — toggled */}
          {expanded && (
            <p style={{
              fontSize: 12, color: 'var(--text-secondary)', marginTop: 6,
              lineHeight: 1.65, borderTop: `1px solid ${meta.border}`, paddingTop: 8,
            }}>
              {iv.reason}
            </p>
          )}

          {/* Prep plan preview — numbered with time */}
          {expanded && iv.action?.kind === 'add_tasks' && !done && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {iv.action.payload.tasks.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: 'var(--text-secondary)',
                  background: 'rgba(129,140,248,0.07)', borderRadius: 5, padding: '5px 10px',
                }}>
                  <span style={{
                    color: '#818CF8', fontWeight: 800, fontSize: 11,
                    background: 'rgba(129,140,248,0.15)', borderRadius: '50%',
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>{t.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{t.time_estimate}h</span>
                </div>
              ))}
            </div>
          )}

          {/* Split plan preview — numbered steps */}
          {expanded && iv.action?.kind === 'split_task' && !done && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { label: 'Understand & plan', time: '30 min' },
                { label: 'Core work',          time: '45 min' },
                { label: 'Review & finish',    time: '30 min' },
              ].map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 12, color: 'var(--text-secondary)',
                  background: 'rgba(245,158,11,0.06)', borderRadius: 5, padding: '5px 10px',
                }}>
                  <span style={{
                    color: 'var(--amber-400)', fontWeight: 800, fontSize: 11,
                    background: 'rgba(245,158,11,0.15)', borderRadius: '50%',
                    width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{i + 1}</span>
                  <span style={{ flex: 1 }}>{s.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{s.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              <ChevronRight size={11} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
              {expanded ? 'Less' : 'Why?'}
            </button>

            {iv.action && !done && (
              <button
                onClick={execute}
                disabled={executing}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: meta.color, color: '#0A0E1A',
                  border: 'none', borderRadius: 6, padding: '5px 12px',
                  fontSize: 12, fontWeight: 700, cursor: executing ? 'wait' : 'pointer',
                  opacity: executing ? 0.7 : 1, transition: 'opacity 0.2s',
                }}
              >
                {executing
                  ? <><Loader2 size={11} className="spin" /> Working…</>
                  : <><Zap size={11} /> {iv.action.label}</>
                }
              </button>
            )}

            {done && iv.action && (
              <button
                onClick={() => navigate('/tasks')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontSize: 11, color: 'var(--emerald-400)', display: 'flex', alignItems: 'center', gap: 3,
                  fontWeight: 600,
                }}
              >
                View in Tasks <ChevronRight size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', flexShrink: 0 }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Action executors ────────────────────────────────────────── */

async function executePostponeTask({ task, newDeadline }, userId) {
  const { error } = await supabase.from('tasks').update({
    deadline:       newDeadline,
    postpone_count: (task.postpone_count || 0) + 1,
  }).eq('id', task.id).eq('user_id', userId);
  if (error) throw error;
}

/**
 * executeSplitTask
 *
 * Deadline math: proportional to available time.
 *   Part 1 → 42% of available time from now
 *   Part 2 → 70% of available time from now
 *   Part 3 → original deadline (100%)
 *
 * Minimum gap: the smaller of (4 hours) or (15% of total available time),
 * so very short-deadline tasks don't get sub-tasks scheduled past their
 * own deadline. Always at least 30 minutes from now.
 *
 * Importance:
 *   Part 1 & 2 → max(1, originalImportance - 1)  (enablers)
 *   Part 3     → originalImportance               (completion)
 *
 * Original task: marked completed — stays visible in Completed tab.
 * If that update fails, we throw so the caller can surface the error.
 */
async function executeSplitTask({ task }, userId) {
  const now      = Date.now();
  const deadline = task.deadline ? new Date(task.deadline).getTime() : null;
  const totalMs  = deadline ? Math.max(deadline - now, 0) : null;

  // Smart minimum: 15% of available time, capped at 4h, floor at 30min
  const MIN_GAP_MS = totalMs
    ? Math.min(4 * 3600 * 1000, Math.max(30 * 60 * 1000, totalMs * 0.15))
    : 30 * 60 * 1000;

  function subDeadline(fraction) {
    if (!deadline) return null;
    const raw = now + totalMs * fraction;
    // Never past the original deadline, never before the minimum gap
    return new Date(Math.min(Math.max(raw, now + MIN_GAP_MS), deadline)).toISOString();
  }

  const origImp    = task.importance || 3;
  const enablerImp = Math.max(1, origImp - 1);

  const sub = [
    { title: `${task.title} — Part 1: Understand & plan`, time_estimate: 0.5,  importance: enablerImp, deadlineFraction: 0.42 },
    { title: `${task.title} — Part 2: Core work`,          time_estimate: 0.75, importance: enablerImp, deadlineFraction: 0.70 },
    { title: `${task.title} — Part 3: Review & finish`,    time_estimate: 0.5,  importance: origImp,    deadlineFraction: 1.00 },
  ];

  const inserts = sub.map(s => {
    const dl = subDeadline(s.deadlineFraction);
    return {
      user_id:        userId,
      title:          s.title,
      description:    `Split from : "${task.title}"`,
      deadline:       dl,
      importance:     s.importance,
      time_estimate:  s.time_estimate,
      category:       task.category || 'general',
      status:         'pending',
      priority_score: computePriorityScore({ deadline: dl, importance: s.importance, time_estimate: s.time_estimate }),
    };
  });

  const { error: insertError } = await supabase.from('tasks').insert(inserts);
  if (insertError) throw insertError;

  // Mark original as completed — throws on failure so the caller knows
  const { error: updateError } = await supabase.from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', task.id).eq('user_id', userId);
  if (updateError) throw new Error(`Sub-tasks created but original task not archived: ${updateError.message}`);
}

async function executeAddTasks({ tasks }, userId) {
  const inserts = tasks.map(t => ({ ...t, user_id: userId }));
  const { error } = await supabase.from('tasks').insert(inserts);
  if (error) throw error;
}
