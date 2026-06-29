import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { computePriorityScore, getPriorityLabel, getDeadlineStatus } from '../lib/priority.js';
import AddTaskModal from '../components/AddTaskModal.jsx';
import { Plus, CheckCircle2, Clock, RotateCcw, Trash2, Edit2, Filter, ArrowUpDown, MoreVertical } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

const TABS = [
  { value: 'pending',     label: 'Pending',     color: 'var(--cyan-400)' },
  { value: 'in_progress', label: 'In Progress',  color: 'var(--amber-400)' },
  { value: 'completed',   label: 'Completed',   color: 'var(--emerald-400)' },
  { value: 'postponed',   label: 'Postponed',   color: 'var(--text-muted)' },
];

const SORTS = [
  { value: 'priority',   label: 'Priority Score' },
  { value: 'deadline',   label: 'Deadline' },
  { value: 'importance', label: 'Importance' },
  { value: 'created',    label: 'Date Added' },
];

const CATS = ['all','study','coding','health','personal','work','general'];
const CAT_COLORS = { study:'#818CF8', coding:'#34D399', health:'#F87171', personal:'#FB923C', work:'#60A5FA', general:'#94A3B8' };

export default function Tasks({ session }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('pending');
  const [sort, setSort]       = useState('priority');
  const [cat, setCat]         = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editTask, setEdit]   = useState(null);
  const [menu, setMenu]       = useState(null);
  const userId = session.user.id;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('tasks').select('*').eq('user_id', userId);
    setTasks(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function addTask(data) {
    const { error } = await supabase.from('tasks').insert({ ...data, user_id: userId });
    if (error) { toast.error(error.message); return; }
    toast.success('Task added!');
    setShowAdd(false);
    load();
  }

  async function updateTask(id, data) {
    const { error } = await supabase.from('tasks').update({ ...data, priority_score: computePriorityScore(data) }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Saved');
    setEdit(null);
    load();
  }

  async function setStatus(id, status) {
    const updates = { status };
    if (status === 'completed') updates.completed_at = new Date().toISOString();
    if (status === 'postponed') {
      const t = tasks.find(x => x.id === id);
      updates.postpone_count = (t?.postpone_count || 0) + 1;
    }
    await supabase.from('tasks').update(updates).eq('id', id);
    toast.success(status === 'completed' ? 'Great work!' : status === 'postponed' ? 'Postponed' : 'Updated');
    setMenu(null);
    load();
  }

  async function deleteTask(id) {
    if (!confirm('Delete this task permanently?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    toast.success('Deleted');
    setMenu(null);
    load();
  }

  const displayed = tasks
    .filter(t => t.status === tab && (cat === 'all' || t.category === cat))
    .sort((a, b) => {
      if (sort === 'priority')   return b.priority_score - a.priority_score;
      if (sort === 'importance') return b.importance - a.importance;
      if (sort === 'deadline') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1; if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const counts = Object.fromEntries(TABS.map(s => [s.value, tasks.filter(t => t.status === s.value).length]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }} className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{tasks.length} total · {counts.pending || 0} pending</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> New Task</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 5, border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} style={{ flex: 1, minWidth: 72, padding: '7px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: tab === t.value ? 'var(--surface-2)' : 'transparent', color: tab === t.value ? t.color : 'var(--text-muted)' }}>
            {t.label} <span style={{ marginLeft: 4, fontSize: 11, background: tab === t.value ? `${t.color}22` : 'transparent', color: tab === t.value ? t.color : 'var(--text-muted)', borderRadius: 10, padding: '1px 5px' }}>{counts[t.value] || 0}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} color="var(--text-muted)" />
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={cat} onChange={e => setCat(e.target.value)}>
            {CATS.map(c => <option key={c} value={c}>{c === 'all' ? 'All categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowUpDown size={13} color="var(--text-muted)" />
          <select className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }} value={sort} onChange={e => setSort(e.target.value)}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(5)].map((_,i) => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 12 }} />)}
        </div>
      ) : displayed.length === 0 ? (
        <Empty tab={tab} onAdd={() => setShowAdd(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {displayed.map((task, i) => (
            <TaskCard key={task.id} task={task} index={i}
              menuOpen={menu === task.id}
              onMenu={() => setMenu(menu === task.id ? null : task.id)}
              onEdit={() => { setEdit(task); setMenu(null); }}
              onStatus={setStatus} onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSave={addTask} />}
      {editTask && (
        <AddTaskModal
          initial={{ ...editTask, deadline: editTask.deadline ? editTask.deadline.slice(0,16) : '' }}
          onClose={() => setEdit(null)}
          onSave={d => updateTask(editTask.id, d)}
        />
      )}
    </div>
  );
}

function TaskCard({ task, index, menuOpen, onMenu, onEdit, onStatus, onDelete }) {
  const { label, color, bg } = getPriorityLabel(task.priority_score);
  const ds = getDeadlineStatus(task.deadline);
  const cc = CAT_COLORS[task.category] || '#94A3B8';

  const actions = [];
  if (task.status === 'pending')     { actions.push({ icon: Clock, label: 'Start', fn: () => onStatus(task.id,'in_progress'), c:'var(--amber-400)' }); actions.push({ icon: CheckCircle2, label: 'Complete', fn: () => onStatus(task.id,'completed'), c:'var(--emerald-400)' }); actions.push({ icon: RotateCcw, label: 'Postpone', fn: () => onStatus(task.id,'postponed'), c:'var(--orange-400)' }); }
  if (task.status === 'in_progress') { actions.push({ icon: CheckCircle2, label: 'Complete', fn: () => onStatus(task.id,'completed'), c:'var(--emerald-400)' }); actions.push({ icon: RotateCcw, label: 'Postpone', fn: () => onStatus(task.id,'postponed'), c:'var(--orange-400)' }); }
  if (task.status === 'completed' || task.status === 'postponed') actions.push({ icon: Clock, label: 'Reopen', fn: () => onStatus(task.id,'pending'), c:'var(--cyan-400)' });
  actions.push({ icon: Edit2,  label: 'Edit',   fn: onEdit,                 c:'var(--text-secondary)' });
  actions.push({ icon: Trash2, label: 'Delete', fn: () => onDelete(task.id), c:'var(--rose-400)' });

  return (
    // FIX IS HERE: We dynamically elevate the zIndex to 50 if the menu is open.
    <div className="card fade-in" style={{ animationDelay:`${index*0.05}s`, borderLeft:`3px solid ${color}`, position:'relative', zIndex: menuOpen ? 50 : 1 }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ width:42,height:42,borderRadius:'50%',background:bg,border:`2px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <span style={{ fontSize:12,fontWeight:800,color }}>{task.priority_score}</span>
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',gap:8,alignItems:'center',flexWrap:'wrap' }}>
            <h3 style={{ fontSize:15,fontWeight:600 }}>{task.title}</h3>
            {task.postpone_count > 0 && <span style={{ fontSize:11,color:'var(--orange-400)',fontWeight:600 }}>Postponed {task.postpone_count}×</span>}
          </div>
          {task.description && <p style={{ fontSize:13,color:'var(--text-secondary)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:480 }}>{task.description}</p>}
          <div style={{ display:'flex',gap:8,marginTop:7,flexWrap:'wrap',alignItems:'center' }}>
            <span style={{ fontSize:11,fontWeight:600,color:cc,background:`${cc}18`,borderRadius:100,padding:'2px 8px' }}>{task.category}</span>
            <span style={{ fontSize:11,fontWeight:600,color }}>{label}</span>
            <span style={{ fontSize:11,color:'var(--amber-400)' }}>{'★'.repeat(task.importance)}{'☆'.repeat(5-task.importance)}</span>
            <span style={{ fontSize:11,color:'var(--text-muted)' }}>~{task.time_estimate}h</span>
            {task.deadline && <span style={{ fontSize:11,color:ds?.color||'var(--text-muted)',fontWeight:ds?600:400 }}>{ds?`${ds.label} — `:''}{formatDistanceToNow(new Date(task.deadline),{addSuffix:true})}</span>}
            {task.completed_at && <span style={{ fontSize:11,color:'var(--emerald-400)' }}>Done {format(new Date(task.completed_at),'MMM d')}</span>}
          </div>
        </div>
        <div style={{ position:'relative',flexShrink:0 }}>
          <button className="btn btn-ghost" onClick={onMenu} style={{ padding:6 }}><MoreVertical size={16}/></button>
          {menuOpen && (
            <>
              <div style={{ position:'fixed',inset:0,zIndex:9 }} onClick={onMenu}/>
              <div style={{ position:'absolute',right:0,top:'100%',zIndex:10,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:6,minWidth:170,boxShadow:'0 8px 32px rgba(0,0,0,0.4)',animation:'fadeIn 0.15s ease' }}>
                {actions.map((a,i)=>(
                  <button key={i} className="nav-item" onClick={a.fn} style={{ color:a.c,fontSize:13,padding:'7px 10px' }}>
                    <a.icon size={13}/>{a.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Empty({ tab, onAdd }) {
  const m = { pending:{e:'✅',t:'No pending tasks',s:'Add a task to get started.'}, in_progress:{e:'⚡',t:'Nothing in progress',s:'Start a pending task.'}, completed:{e:'🏆',t:'No completed tasks yet',s:'Complete your first task!'}, postponed:{e:'📅',t:'No postponed tasks',s:"You haven't postponed anything — great!"} };
  const { e, t, s } = m[tab] || m.pending;
  return (
    <div className="card" style={{ textAlign:'center',padding:'48px 24px' }}>
      <div style={{ fontSize:40,marginBottom:12 }}>{e}</div>
      <h3 style={{ fontSize:18,fontWeight:700,marginBottom:6 }}>{t}</h3>
      <p style={{ color:'var(--text-secondary)',fontSize:14,marginBottom: tab==='pending'?18:0 }}>{s}</p>
      {tab==='pending' && <button className="btn btn-primary" onClick={onAdd}><Plus size={15}/>Add Task</button>}
    </div>
  );
}

/**
 *                     VERSION 2
 *
 * | Area                         | Version 1                                         | Version 2                                                  | Better        |
 * | ---------------------------- | ------------------------------------------------- | ---------------------------------------------------------- | ------------- |
 * | Dropdown layering            | Fixed card stacking order                         | Active card dynamically raised with `z-index`              | **Version 2** |
 * | Menu positioning             | Absolute dropdown inside normal card layer        | Same positioning, but parent card elevated                 | **Version 2** |
 * | Root cause handling          | Focused only on dropdown                          | Solves the actual stacking-context issue                   | **Version 2** |
 * | Implementation               | Static layout                                     | `zIndex: menuOpen ? 50 : 1`                                | **Version 2** |
 * | Additional state             | None                                              | None                                                       | Tie           |
 * | Additional hooks             | None                                              | None                                                       | Tie           |
 * | Code size                    | ~230 lines                                        | ~230 lines                                                 | Tie           |
 * | Performance                  | Normal                                            | Same (only one active card receives higher z-index)        | Tie           |
 * | Readability                  | Clean                                             | Equally clean with a single extra style property           | Tie           |
 * | Maintainability              | Good                                              | Better (minimal change with maximum effect)                | **Version 2** |
 *
 * Why this change?
 * ----------------
 * The dropdown itself was never the real problem.
 * The entire Task Card was being rendered beneath neighbouring cards,
 * causing the dropdown to appear hidden behind them.
 *
 * Instead of introducing portals, viewport calculations or fixed-position
 * menus, Version 2 simply raises the active Task Card above its siblings:
 *
 *      zIndex: menuOpen ? 50 : 1
 *
 * This preserves the existing component structure while correctly fixing
 * the stacking order with only a one-line change.
 *
 * Result:
 * ✓ No additional hooks
 * ✓ No extra state
 * ✓ No layout changes
 * ✓ Same file size
 * ✓ Cleaner and easier to maintain
 */