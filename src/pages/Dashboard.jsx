import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { generateMotivationalQuote, generateTaskRecommendation } from '../lib/gemini.js';
import { resolveQuote } from '../lib/quotes.js';
import { getPriorityLabel, getDeadlineStatus } from '../lib/priority.js';
import AddTaskModal from '../components/AddTaskModal.jsx';
import CustomQuotesModal from '../components/CustomQuotesModal.jsx';
import {
  Plus, CheckCircle2, Clock, AlertTriangle, TrendingUp,
  RefreshCw, Sparkles, ChevronRight, Target, Brain, BookOpen,
} from 'lucide-react';
import { formatDistanceToNow, isToday, isTomorrow, format } from 'date-fns';
import toast from 'react-hot-toast';

/* ── Source badge config ─────────────────────────────────── */
const SOURCE_META = {
  ai:       { label: 'Gemini AI',    color: 'var(--cyan-400)',    icon: <Sparkles size={10} /> },
  custom:   { label: 'My Quote',     color: '#818CF8',             icon: <BookOpen size={10} /> },
  fallback: { label: 'Classic',      color: 'var(--amber-400)',    icon: <Sparkles size={10} /> },
};

export default function Dashboard({ session }) {
  const [tasks, setTasks]         = useState([]);
  const [profile, setProfile]     = useState(null);
  const [quoteObj, setQuoteObj]   = useState({ text: '', source: 'ai' }); // { text, source }
  const [quoteLoading, setQL]     = useState(false);
  const [recommendation, setRec]  = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();
  const userId = session.user.id;

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: td }, { data: pd }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId).order('priority_score', { ascending: false }),
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    setTasks(td || []);
    setProfile(pd);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!loading) fetchAI(tasks, profile); }, [loading]); // eslint-disable-line

  async function fetchAI(t, p) {
    const key = p?.gemini_api_key || '';
    const pending = t.filter(x => x.status === 'pending' || x.status === 'in_progress');
    const done    = t.filter(x => x.status === 'completed');
    setQL(true);
    const ctx = `${pending.length} pending tasks, ${done.length} completed, type: ${p?.productivity_type || 'developing'}, CS student`;
    const [aiText, rec] = await Promise.all([
      generateMotivationalQuote(ctx, key),
      generateTaskRecommendation(t, p, key),
    ]);
    setQuoteObj(resolveQuote(aiText));
    setRec(rec || '');
    setQL(false);
  }

  async function refreshQuote() {
    setQL(true);
    try{
      const key = profile?.gemini_api_key || '';
      const ctx = `student with ${tasks.filter(t => t.status === 'pending').length} pending tasks, needs fresh motivation`;

      const aiText = await generateMotivationalQuote(ctx, key);

      setQuoteObj(resolveQuote(aiText));
    }
    finally {
      setQL(false);
    }
  }

  // Called by CustomQuotesModal when mode/quotes change — re-roll with current AI result
  function handleQuoteSettingsChanged() {
    setQuoteObj(prev => {
      // Re-resolve with the same AI text if it was AI-sourced, else null
      const aiText = prev.source === 'ai' ? prev : null;
      return resolveQuote(aiText);
    });
  }

  async function addTask(data) {
    const { error } = await supabase.from('tasks').insert({ ...data, user_id: userId });
    if (error) { toast.error(error.message); return; }
    toast.success('Task added!');
    setShowAdd(false);
    load();
  }

  async function quickComplete(id) {
    await supabase.from('tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id);
    toast.success('Task completed!');
    load();
  }

  const pending   = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completed = tasks.filter(t => t.status === 'completed');
  const overdue   = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed');
  const todayT    = pending.filter(t => t.deadline && isToday(new Date(t.deadline)));
  const tomorrowT = pending.filter(t => t.deadline && isTomorrow(new Date(t.deadline)));
  const topTasks  = pending.slice(0, 5);
  const rate      = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name      = profile?.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'there';
  const srcMeta   = SOURCE_META[quoteObj.source] || SOURCE_META.ai;

  if (loading) return <Skeleton />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          {greeting}, <span style={{ color: 'var(--amber-400)' }}>{name}</span> 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
          {overdue.length > 0 && (
            <span style={{ color: 'var(--rose-400)', marginLeft: 8, fontWeight: 500 }}>• {overdue.length} overdue</span>
          )}
        </p>
      </div>

      {/* ── Quote card ─────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(245,158,11,0.12),rgba(6,182,212,0.08))',
        border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-lg)',
        padding: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative glow */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.15),transparent)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* icon */}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={18} color="var(--amber-400)" />
          </div>

          <div style={{ flex: 1 }}>
            {/* label row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-400)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Daily Motivation
              </span>
              {/* source badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, color: srcMeta.color,
                background: `${srcMeta.color}18`, border: `1px solid ${srcMeta.color}40`,
                borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                {srcMeta.icon} {srcMeta.label}
              </span>
            </div>

            {/* quote text */}
            {quoteLoading ? (
              <>
                <div className="skeleton" style={{ height: 16, width: '90%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 16, width: '65%' }} />
              </>
            ) : (
              <p style={{ fontSize: 15, lineHeight: 1.7, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                "{quoteObj.text}"
              </p>
            )}
          </div>

          {/* action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <button
              className="btn btn-ghost"
              onClick={refreshQuote}
              disabled={quoteLoading}
              title="Refresh quote"
              style={{ padding: 6 }}
            >
              <RefreshCw size={15} className={quoteLoading ? 'spin' : ''} />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setShowQuotes(true)}
              title="Manage custom quotes"
              style={{ padding: 6 }}
            >
              <BookOpen size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14 }}>
        <Stat icon={<Clock size={18} color="var(--cyan-400)" />}       label="Pending"  value={pending.length}   />
        <Stat icon={<CheckCircle2 size={18} color="var(--emerald-400)" />} label="Done" value={completed.length} />
        <Stat icon={<AlertTriangle size={18} color="var(--rose-400)" />}   label="Overdue" value={overdue.length} alert={overdue.length > 0} />
        <Stat icon={<TrendingUp size={18} color="var(--amber-400)" />}    label="Rate"   value={`${rate}%`}       />
      </div>

      {/* ── Today / Tomorrow ───────────────────────────────── */}
      {(todayT.length > 0 || tomorrowT.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {todayT.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Due Today</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{todayT.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>tasks need attention</div>
            </div>
          )}
          {tomorrowT.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Due Tomorrow</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{tomorrowT.length}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>tasks coming up</div>
            </div>
          )}
        </div>
      )}

      {/* ── AI Recommendation ──────────────────────────────── */}
      {recommendation && (
        <div className="card" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Brain size={16} color="var(--cyan-400)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--cyan-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Recommendation</span>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{recommendation}</p>
        </div>
      )}

      {/* ── Top tasks ──────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={17} color="var(--amber-500)" />
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Top Priority Tasks</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ fontSize: 13, padding: '7px 12px' }} onClick={() => navigate('/tasks')}>
              View All <ChevronRight size={13} />
            </button>
            <button className="btn btn-primary" style={{ fontSize: 13, padding: '7px 12px' }} onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Task
            </button>
          </div>
        </div>

        {topTasks.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 48 }}>
            <CheckCircle2 size={40} color="var(--emerald-400)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>All caught up!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>No pending tasks. Add something to stay on track.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Task</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topTasks.map((task, i) => (
              <TaskRow key={task.id} task={task} index={i} onComplete={() => quickComplete(task.id)} />
            ))}
          </div>
        )}
      </div>

      {showAdd    && <AddTaskModal onClose={() => setShowAdd(false)} onSave={addTask} />}
      {showQuotes && (
        <CustomQuotesModal
          onClose={() => setShowQuotes(false)}
          onSettingsChanged={handleQuoteSettingsChanged}
        />
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function Stat({ icon, label, value, alert }) {
  return (
    <div className="stat-card" style={alert ? { borderColor: 'rgba(244,63,94,0.3)' } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: alert ? 'var(--rose-400)' : 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function TaskRow({ task, index, onComplete }) {
  const { label, color } = getPriorityLabel(task.priority_score);
  const ds = getDeadlineStatus(task.deadline);
  const [busy, setBusy] = useState(false);

  return (
    <div className="card card-hover fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', animationDelay: `${index * 0.06}s`, borderLeft: `3px solid ${color}` }}>
      <button
        onClick={async () => { setBusy(true); await onComplete(); }}
        disabled={busy}
        style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${color}`, background: 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {busy && <span className="spin" style={{ width: 12, height: 12, borderRadius: '50%', border: `1.5px solid ${color}`, borderTopColor: 'transparent', display: 'inline-block' }} />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
          {ds && <span style={{ fontSize: 11, color: ds.color, fontWeight: 500 }}>• {ds.label}</span>}
          {task.deadline && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</span>}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>~{task.time_estimate}h</span>
        </div>
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, background: `${color}18`, borderRadius: 6, padding: '3px 8px', flexShrink: 0 }}>{task.priority_score}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div><div className="skeleton" style={{ height: 30, width: 280, marginBottom: 8 }} /><div className="skeleton" style={{ height: 16, width: 180 }} /></div>
      <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:76,borderRadius:12}}/>)}</div>
      {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:60,borderRadius:12}}/>)}
    </div>
  );
}
