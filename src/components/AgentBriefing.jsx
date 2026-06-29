import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import {
  Zap, AlertTriangle, Lightbulb, Calendar, ChevronRight,
  Loader2, CheckCircle2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Type config ─────────────────────────────────────────────── */
const TYPE_META = {
  warning: { icon: AlertTriangle, color: 'var(--rose-400)',    bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.25)' },
  action:  { icon: Zap,           color: 'var(--amber-400)',   bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)' },
  plan:    { icon: Calendar,      color: '#818CF8',             bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.3)' },
  insight: { icon: Lightbulb,     color: 'var(--cyan-400)',    bg: 'rgba(6,182,212,0.08)',   border: 'rgba(6,182,212,0.25)' },
};

/* ── Main component ──────────────────────────────────────────── */
export default function AgentBriefing({ interventions, userId, onTasksAdded, onDismiss }) {
  if (!interventions || interventions.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
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
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>
          · {interventions.length} observation{interventions.length > 1 ? 's' : ''}
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
        toast.success(`"${iv.action.payload.task.title}" Task Postponed `);
      }
      setDone(true);
      onTasksAdded?.();
    } catch (e) {
      toast.error('Action failed — ' + e.message);
    }
    setExecuting(false);
  }

  return (
    <div
      style={{
        background: done ? 'rgba(52,211,153,0.06)' : meta.bg,
        border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : meta.border}`,
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        transition: 'all 0.25s',
      }}
    >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--emerald-400)' : 'var(--text-primary)', lineHeight: 1.4 }}>
              {done ? 'Done — ' : ''}{iv.headline}
            </span>
          </div>

          {/* Reason — toggled */}
          {expanded && (
            <p style={{
              fontSize: 12, color: 'var(--text-secondary)', marginTop: 6,
              lineHeight: 1.65, borderTop: `1px solid ${meta.border}`, paddingTop: 8,
            }}>
              {iv.reason}
            </p>
          )}

          {/* Prep plan preview */}
          {expanded && iv.action?.kind === 'add_tasks' && !done && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {iv.action.payload.tasks.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--text-secondary)',
                  background: 'rgba(129,140,248,0.06)', borderRadius: 5, padding: '4px 8px',
                }}>
                  <span style={{ color: '#818CF8', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  <span style={{ flex: 1 }}>{t.title}</span>
                  <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{t.time_estimate}h</span>
                </div>
              ))}
            </div>
          )}

          {/* Action row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {/* Expand toggle */}
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

            {/* Execute button */}
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
            {/* Post-action link */}
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
    deadline: newDeadline,
    postpone_count: (task.postpone_count || 0) + 1,
  }).eq('id', task.id).eq('user_id', userId);
  if (error) throw error;
}

async function executeSplitTask({ task }, userId) {
  const sub = [
    { title: `${task.title} — Part 1: Understand & plan`, time_estimate: 0.5 },
    { title: `${task.title} — Part 2: Core work`,          time_estimate: 0.75 },
    { title: `${task.title} — Part 3: Review & finish`,    time_estimate: 0.5 },
  ];

  const inserts = sub.map((s, i) => ({
    user_id: userId,
    title: s.title,
    description: `Split from task: "${task.title}"`,
    deadline: task.deadline
      ? new Date(new Date(task.deadline).getTime() - (2 - i) * 3 * 3600 * 1000).toISOString()
      : null,
    importance: task.importance || 3,
    time_estimate: s.time_estimate,
    category: task.category || 'general',
    status: 'pending',
    priority_score: task.priority_score || 50,
  }));

  const { error } = await supabase.from('tasks').insert(inserts);
  if (error) throw error;

  // Mark original as completed (it's been replaced)
  await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', task.id);
}

async function executeAddTasks({ tasks }, userId) {
  const inserts = tasks.map(t => ({ ...t, user_id: userId }));
  const { error } = await supabase.from('tasks').insert(inserts);
  if (error) throw error;
}
/**
 * AgentBriefing Evolution
| Area                                  | V1           | V2    | V3    |
| ------------------------------------- | ------------ | ----- | ----- |
| **Core Agent Briefing UI**            | ✅ Introduced | Same  | Same  |
| **Expandable "Why?" explanation**     | ✅            | ✅     | ✅     |
| **Split Task execution**              | ✅            | ✅     | ✅     |
| **Bulk Add Tasks execution**          | ✅            | ✅     | ✅     |
| **Supabase integration**              | ✅            | ✅     | ✅     |
| **Success/Error toasts**              | ✅            | ✅     | ✅     |
| **Done state**                        | ✅            | ✅     | ✅     |
| **Refresh callback (`onTasksAdded`)** | ✅            | ✅     | ✅     |
| **View in Tasks button**              | ❌            | ✅     | ✅     |
| **React Router navigation**           | ❌            | ✅     | ✅     |
| **Postpone Task execution**           | ❌            | ❌     | ✅     |
| **Tracks postpone count**             | ❌            | ❌     | ✅     |
| **Deadline update**                   | ❌            | ❌     | ✅     |
| **Number of executable actions**      | **2**         | **2**   | **3**  |

Feature Progression
| Version | Main Improvement                                 | Impact                                  |
| ------- | ------------------------------------------------ | ----------------------------------------|
| **V1**  | First executable Agent Briefing                  | ⭐⭐⭐⭐⭐ Major feature              |
| **V2**  | Added "View in Tasks" navigation after execution | ⭐⭐ Nice UX improvement               |
| **V3**  | Added `postpone_task` action and executor        | ⭐⭐⭐⭐ Major capability improvement |

Architecture Comparison
| Category             | V1              | V2              | V3                                |
| -------------------- | --------------- | --------------- | --------------------------------- |
| UI Architecture      | Excellent       | Excellent       | Excellent                         |
| Component Complexity | Low             | Low             | Medium                            |
| Navigation Support   | No              | Yes             | Yes                               |
| Agent Capability     | Medium          | Medium          | High                              |
| Extensibility        | Good            | Good            | Better                            |
| Database Operations  | Insert + Update | Insert + Update | Insert + Update + Deadline Update |

Agent Capability Timeline
V1
────────────────────────
✓ Split Task
✓ Add Prep Tasks

↓

V2
────────────────────────
✓ Split Task
✓ Add Prep Tasks
✓ View in Tasks

↓

V3
────────────────────────
✓ Split Task
✓ Add Prep Tasks
✓ Postpone Task
✓ View in Tasks
✓ Postpone Counter
 */