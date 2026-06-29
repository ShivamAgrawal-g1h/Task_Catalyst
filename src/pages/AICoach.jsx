import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { chatWithCoach, analyzeProductivityPersonality } from '../lib/gemini.js';
import { analyzeAndAct } from '../lib/agentEngine.js';
import { computePriorityScore } from '../lib/priority.js';
import { Bot, Send, Sparkles, Brain, RefreshCw, Key, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK = [
  "What should I work on right now?",
  "How do I stop procrastinating?",
  "Help me plan my study session",
  "Give me a 2-minute motivation boost",
  "I'm feeling overwhelmed, help me",
];

export default function AICoach({ session }) {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [tasks, setTasks]               = useState([]);
  const [profile, setProfile]           = useState(null);
  const [personality, setPersonality]   = useState(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [pendingActionDisplay, setPAD] = useState(null);

  // Async-safe action storage.
  // Ref is used by send() to avoid stale closures,
  // while pendingActionDisplay state controls the UI.
  // Holds the live pending action for async handlers.
  const pendingAction = useRef(null);

  // Keep display in sync whenever pendingAction ref changes
  // This unified setter keeps both the UI and the memory perfectly in sync
  // Mirrors React state so send() always sees the latest action.
  function setPendingAction(val) {
    pendingAction.current = val; // Updates the ref instantly for send()
    setPAD(val); // Triggers a re-render to update the UI banner
  }

  // Patch load() to use setPendingAction instead of direct ref mutation
  // (done inline below; the ref is still used in send() for sync reads)
  const tasksRef       = useRef([]);   // mirror of tasks for use inside async closures
  const profileRef     = useRef(null);
  const endRef = useRef(null);
  const navigate = useNavigate();
  const userId = session.user.id;

  useEffect(() => { load(); }, [userId]); // eslint-disable-line
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function load() {
    const [{ data: td }, { data: pd }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    const t = td || [];
    setTasks(t);
    tasksRef.current  = t;
    profileRef.current = pd;
    setProfile(pd);
    if (pd?.productivity_type && pd.productivity_type !== 'unknown') setPersonality({ type: pd.productivity_type });

    const name    = pd?.name?.split(' ')[0] || 'there';
    const pending = t.filter(x => x.status === 'pending' || x.status === 'in_progress').length;
    const overdue = t.filter(x => x.deadline && new Date(x.deadline) < new Date() && x.status !== 'completed').length;

    const interventions = await analyzeAndAct(t, pd, pd?.gemini_api_key || '');

    let greeting;
    if (!pd?.gemini_api_key) {
      greeting = `Hey ${name}! I'm your AI productivity coach.\n\nYou have **${pending} pending tasks**${overdue > 0 ? ` and **${overdue} overdue**` : ''}.\n\n⚠️ Add your Gemini API key in Settings to unlock full AI analysis and coaching.`;
    } else if (interventions.length > 0) {
      const top = interventions[0];
      // Store the action so send() can execute it on confirmation
      if (top.action) {
        setPendingAction({ ...top.action, headline: top.headline });
      }
      const actionPrompt = top.action
        ? `\n\nShould I **${top.action.label.toLowerCase()}**? Reply **yes** to confirm.`
        : `\n\nAsk me anything about this.`;
      greeting = `Hey ${name}! I've reviewed your tasks. Here's what I'm seeing:\n\n**${top.headline}**\n\n${top.reason}${actionPrompt}\n\nYou have **${pending} pending tasks**${overdue > 0 ? ` and **${overdue} overdue**` : ''}.`;
    } else {
      greeting = `Hey ${name}! I've reviewed your tasks — looking good overall.\n\nYou have **${pending} pending tasks**${overdue > 0 ? ` and **${overdue} overdue**` : ''}. How can I help you today?`;
    }
    setMessages([{ role: 'ai', content: greeting }]);
  }

  async function send(text) {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);

    const next = [...messages, { role: 'user', content: msg }];
    setMessages(next);

    // ── Check if user is confirming or refusing a pending action ──
    const action = pendingAction.current;
    const isYes = /^\s*(yes|y|yeah|yep|yup|ok|okay|sure|please|confirm|go ahead|go for it|do it|sounds good|works|works for me|proceed|execute|apply|absolutely|of course|fine)\s*[.!]?\s*$/i.test(msg);
    const isNo = /^\s*(no|n|nope|nah|skip|cancel|stop|dont|don't|never mind|nevermind|not now|not yet|no thanks|later|maybe later|leave it|ignore|pass)\s*[.!]?\s*$/i.test(msg);

    if (action && isYes) {
      // ── Execute the pending action ────────────────────────────
      setPendingAction(null);
      try {
        const confirmMsg = await executeAction(action, userId, tasksRef.current, profileRef.current);
        // Refresh tasks after execution
        const { data: td } = await supabase.from('tasks').select('*').eq('user_id', userId);
        const refreshed = td || [];
        setTasks(refreshed);
        tasksRef.current = refreshed;
        // Check if more interventions exist — surface next one
        const remaining = await analyzeAndAct(refreshed, profileRef.current, profileRef.current?.gemini_api_key || '');
        const next2 = remaining.find(iv => iv.action && iv.id !== action.id);
        let reply = confirmMsg;
        if (remaining.length === 0) {
          reply += `\n\nNice job! Your task list looks clean and manageable right now. Keep up this momentum!`;
        }
        if (next2) {
          setPendingAction({ ...next2.action, headline: next2.headline });
          reply += `\n\nAlso: **${next2.headline}** — should I **${next2.action.label.toLowerCase()}**? Reply **yes** to confirm.`;
        }
        setMessages(prev => [...prev, { role: 'ai', content: reply }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: 'ai', content: `Something went wrong: ${e.message}. Try again or check your connection.` }]);
      }
      setSending(false);
      return;
    }

    if (action && isNo) {
      // ── User declined — clear action, let Gemini respond ─────
      setPendingAction(null);
      const reply = await chatWithCoach(next, msg, tasksRef.current, profileRef.current?.gemini_api_key || '');
      setMessages(prev => [...prev, { role: 'ai', content: reply }]);
      setSending(false);
      return;
    }

    // ── Normal chat — no pending action or unrelated message ──
    const reply = await chatWithCoach(next, msg, tasksRef.current, profileRef.current?.gemini_api_key || '');

    // If the AI reply suggests an action we can detect, parse and store it
    // (handles mid-conversation suggestions like "should I split this for you?")
    const suggested = detectActionSuggestion(reply, tasksRef.current);
    if (suggested) setPendingAction(suggested);

    setMessages(prev => [...prev, { role: 'ai', content: reply }]);
    setSending(false);
  }

  // ── Action executors ────────────────────────────────────────
  async function executeAction(action, uid, currentTasks) {
    const { kind, payload } = action;

    if (kind === 'postpone_task') {
      const { task, newDeadline } = payload;
      const { error } = await supabase.from('tasks').update({
        deadline: newDeadline,
        postpone_count: (task.postpone_count || 0) + 1,
      }).eq('id', task.id).eq('user_id', uid);
      if (error) throw error;
      const newDate = new Date(newDeadline).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `Done! I've postponed **"${task.title}"** to **${newDate}**. That gives you breathing room to focus on your higher-priority items first.`;
    }

    if (kind === 'split_task') {
      const { task } = payload;
      const sub = [
        { title: `${task.title} — Part 1: Understand & plan`, time_estimate: 0.5 },
        { title: `${task.title} — Part 2: Core work`,         time_estimate: 0.75 },
        { title: `${task.title} — Part 3: Review & finish`,   time_estimate: 0.5 },
      ];
      const inserts = sub.map((s, i) => ({
        user_id: uid,
        title: s.title,
        description: `Split from: "${task.title}"`,
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
      await supabase.from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', task.id).eq('user_id', uid);
      return `Done! I've split **"${task.title}"** into 3 focused sub-tasks and added them to your list. The original task is marked complete. Start with Part 1 — it's only 30 minutes.`;
    }

    if (kind === 'add_tasks') {
      const { tasks: newTasks } = payload;
      const inserts = newTasks.map(t => ({ ...t, user_id: uid }));
      const { error } = await supabase.from('tasks').insert(inserts);
      if (error) throw error;
      return `Done! I've added **${newTasks.length} prep tasks** to your task list with staggered deadlines. Open the Tasks page to see them in priority order.`;
    }

    throw new Error(`Unknown action kind: ${kind}`);
  }

  /**
   * Lightweight intent detection.
   *
   * Regex is intentionally broad enough to recognise common Gemini
   * phrasings ("Should I...", "Want me to...", "I can...", etc.)
   * without introducing structured outputs yet.
   *
   * Once the agent supports many more actions (~10+),
   * this can be replaced with structured AI action metadata.
   */
  // Lightweight pattern-matching to detect if Gemini's reply is proposing an action
  // we can store so the user can confirm next turn.
  function detectActionSuggestion(reply, currentTasks) {
    const lower = reply.toLowerCase();

    // " /(should i|want me to|would you like me to|i can|i could|let me|i'll|i will).*(postpone|delay|push back|reschedule|move|defer)/i "
    // example : "should I postpone / split / break it down / add tasks"
    const postponePattern = /(should i|want me to|would you like me to|i can|i could|let me|i'll|i will).*(postpone|delay|push back|reschedule|move|defer)/i;
    if (postponePattern.test(lower)) {
      const overdue = currentTasks.filter(t =>
        t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
      ).sort((a, b) => a.importance - b.importance);
      if (overdue.length > 0) {
        const task = overdue[0];
        return {
          kind: 'postpone_task',
          label: `Postpone "${task.title}" by 2 days`,
          headline: `Postpone "${task.title}"`,
          payload: { task, newDeadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString() },
        };
      }
    }

    const splitPattern = /(should i|want me to|would you like me to|i can|i could|let me|i'll|i will).*(split|break(?:\s+it)?(?:\s+down)?|divide|chunk|separate)/i;
    if (splitPattern.test(lower)) {
      const chronic = currentTasks
        .filter(t => (t.postpone_count || 0) >= 2 && t.status !== 'completed')
        .sort((a, b) => (b.postpone_count || 0) - (a.postpone_count || 0));
      if (chronic.length > 0) {
        const task = chronic[0];
        return {
          kind: 'split_task',
          label: `Split "${task.title}" into 3 sub-tasks`,
          headline: `Split "${task.title}"`,
          payload: { task },
        };
      }
    }
    return null;
  }

  async function analyze() {
    setAnalyzing(true);
    const completed = tasks.filter(t => t.status === 'completed').length;
    const postponed = tasks.reduce((s, t) => s + (t.postpone_count || 0), 0);
    const onTime    = tasks.filter(t => t.status==='completed' && t.deadline && t.completed_at && new Date(t.completed_at) <= new Date(t.deadline)).length;
    const late      = tasks.filter(t => t.status==='completed' && t.deadline && t.completed_at && new Date(t.completed_at) > new Date(t.deadline)).length;
    const weeks     = Math.max(1, Math.round((Date.now() - new Date(session.user.created_at)) / (7*24*60*60*1000)));
    const result    = await analyzeProductivityPersonality({ completed, postponed, onTime, late, avgPerWeek: completed/weeks }, profile?.gemini_api_key || '');
    setPersonality(result);
    await supabase.from('user_profiles').update({ productivity_type: result.type }).eq('user_id', userId);
    setAnalyzing(false);
    toast.success('Personality analyzed!');
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18, height:'calc(100vh - 100px)' }} className="fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(245,158,11,0.15))',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <Bot size={20} color="var(--cyan-400)" />
          </div>
          <div>
            <h1 style={{ fontSize:22,fontWeight:800 }}>AI Coach</h1>
            <p style={{ color:'var(--text-secondary)',fontSize:13 }}>Powered by Google Gemini</p>
          </div>
        </div>
        {!profile?.gemini_api_key && (
          <button className="btn btn-secondary" onClick={() => navigate('/settings')}><Key size={13}/> Add API Key</button>
        )}
      </div>

      <div style={{ display:'flex', gap:18, flex:1, minHeight:0 }}>
        {/* Chat */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
          <div style={{ flex:1,overflowY:'auto',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:18,display:'flex',flexDirection:'column',gap:14 }}>
            {messages.map((m,i) => (
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:8 }}>
                {m.role==='ai' && (
                  <div style={{ width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(245,158,11,0.15))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
                    <Sparkles size={13} color="var(--cyan-400)"/>
                  </div>
                )}
                <div className={`chat-bubble ${m.role}`}>{fmt(m.content)}</div>
              </div>
            ))}
            {sending && (
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <div style={{ width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(245,158,11,0.15))',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <Sparkles size={13} color="var(--cyan-400)" className="spin"/>
                </div>
                <div className="chat-bubble ai" style={{ display:'flex',gap:5,alignItems:'center',padding:'14px 16px' }}>
                  {[0,150,300].map(d=><span key={d} style={{ width:6,height:6,borderRadius:'50%',background:'var(--surface-3)',display:'inline-block',animation:`shimmer 1s ${d}ms infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            {QUICK.map((p,i) => (
              <button key={i} className="btn btn-secondary" style={{ fontSize:12,padding:'5px 10px' }} onClick={() => send(p)} disabled={sending}>{p}</button>
            ))}
          </div>

          {/* Pending action chip */}
          {pendingActionDisplay && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 'var(--radius-sm)', padding: '7px 12px',
            }}>
              <Zap size={12} color="var(--amber-400)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--amber-400)', fontWeight: 600, flex: 1 }}>
                Pending: {pendingActionDisplay.label}
              </span>
              <button
                onClick={() => send('yes')}
                disabled={sending}
                style={{ fontSize: 11, fontWeight: 700, background: 'var(--amber-400)', color: '#0A0E1A', border: 'none', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}
              >
                Yes, do it
              </button>
              <button
                onClick={() => { setPendingAction(null); }}
                style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px' }}
              >
                Skip
              </button>
            </div>
          )}

          <div style={{ display:'flex',gap:10 }}>
            <textarea className="input" rows={2} style={{ flex:1,resize:'none' }} placeholder="Ask your AI coach... (Enter to send, Shift+Enter for new line)" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} disabled={sending}/>
            <button className="btn btn-primary" style={{ alignSelf:'flex-end',padding:'10px 16px' }} onClick={() => send()} disabled={sending||!input.trim()}><Send size={16}/></button>
          </div>
        </div>

        {/* Side panel */}
        <div className="coach-side-panel" style={{ width:250,display:'flex',flexDirection:'column',gap:14 }}>
          <div className="card">
            <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
              <Brain size={15} color="var(--amber-400)"/>
              <span style={{ fontWeight:700,fontSize:14 }}>Productivity Profile</span>
            </div>
            {personality ? <PersonCard p={personality}/> : (
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:12,lineHeight:1.6 }}>Analyze your task history to determine your productivity personality type.</p>
                {tasks.filter(t=>t.status==='completed').length < 3
                  ? <p style={{ fontSize:12,color:'var(--text-muted)' }}>Complete 3+ tasks to unlock analysis.</p>
                  : <button className="btn btn-primary" style={{ width:'100%',fontSize:13,padding:'8px' }} onClick={analyze} disabled={analyzing}>{analyzing?<span className="spin" style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#0A0E1A',display:'inline-block'}}/>:<><Sparkles size={13}/>Analyze</>}</button>
                }
              </div>
            )}
            {personality && <button className="btn btn-secondary" style={{ width:'100%',fontSize:12,padding:6,marginTop:10 }} onClick={analyze} disabled={analyzing}><RefreshCw size={12} className={analyzing?'spin':''}/> Re-analyze</button>}
          </div>

          <div className="card">
            <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Task Stats</div>
            {[
              ['Total',     tasks.length,                                          'var(--text-primary)'],
              ['Completed', tasks.filter(t=>t.status==='completed').length,        'var(--emerald-400)'],
              ['Pending',   tasks.filter(t=>t.status==='pending'||t.status==='in_progress').length, 'var(--cyan-400)'],
              ['Overdue',   tasks.filter(t=>t.deadline&&new Date(t.deadline)<new Date()&&t.status!=='completed').length, 'var(--rose-400)'],
              ['Postponed', tasks.reduce((s,t)=>s+(t.postpone_count||0),0),        'var(--orange-400)'],
            ].map(([l,v,c])=>(
              <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:12,color:'var(--text-muted)' }}>{l}</span>
                <span style={{ fontSize:13,fontWeight:700,color:c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonCard({ p }) {
  const COLORS = { 'Sprinter':{'color':'var(--orange-400)','bg':'rgba(251,146,60,0.12)'}, 'Consistent Worker':{'color':'var(--emerald-400)','bg':'rgba(52,211,153,0.12)'}, 'Perfectionist':{'color':'var(--cyan-400)','bg':'rgba(34,211,238,0.12)'}, 'Procrastinator':{'color':'var(--rose-400)','bg':'rgba(251,113,133,0.12)'} };
  const { color, bg } = COLORS[p.type] || { color:'var(--text-muted)',bg:'var(--surface-2)' };
  return (
    <div>
      <div style={{ display:'inline-flex',padding:'5px 12px',borderRadius:100,background:bg,marginBottom:8 }}>
        <span style={{ fontSize:13,fontWeight:700,color }}>{p.type}</span>
      </div>
      {p.description && <p style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:10,lineHeight:1.6 }}>{p.description}</p>}
      {p.strengths && <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10,fontWeight:700,color:'var(--emerald-400)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em' }}>Strengths</div>
        {p.strengths.map((s,i)=><div key={i} style={{ fontSize:12,color:'var(--text-secondary)',display:'flex',gap:5 }}><span style={{color:'var(--emerald-400)'}}>+</span>{s}</div>)}
      </div>}
      {p.tips && <div>
        <div style={{ fontSize:10,fontWeight:700,color:'var(--amber-400)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em' }}>Tips For You</div>
        {p.tips.map((t,i)=><div key={i} style={{ fontSize:12,color:'var(--text-secondary)',display:'flex',gap:5,lineHeight:1.5,marginBottom:3 }}><span style={{color:'var(--amber-400)',flexShrink:0}}>→</span>{t}</div>)}
      </div>}
    </div>
  );
}

function fmt(text) {
  return text.split(/(\*\*.*?\*\*)/g).map((p,i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : p
  );
}
/**
 * Overall verdict
| Version |  Rating       |     Recommendation                                      |
| ------- | :----------:  | ------------------------------------------------------- |
| (V1&V2) |  ⭐⭐⭐☆☆   | Basic Gemini chatbot                                    |
| (V3)    |  ⭐⭐⭐☆☆   | Nice UX, but promises functionality that doesn't exist. |
| (V4)    |  ⭐⭐⭐⭐☆  | Honest and safe, but less capable.                      |
| (**V5**)    |  ⭐⭐⭐⭐⭐ | This is the beginning of a true AI agent.               |

 * ============================================================================
 * AI Coach Evolution History
 * ============================================================================
 *
 * V1 / V2 ─ Basic AI Chat
 * --------------------------------
 * • Gemini-powered conversational productivity coach.
 * • Personality analysis based on task history.
 * • Static greeting and quick prompts.
 * • Chat could only advise; it never executed actions.
 *
 * ---------------------------------------------------------------------------
 *
 * V3 ─ Proactive AI
 * --------------------------------
 * • Greeting generated from analyzeAndAct().
 * • AI proactively surfaced the highest-priority intervention.
 * • UX issue:
 *     "Reply 'yes, do it'" implied actions would execute,
 *     but chatWithCoach() only generated text.
 *
 * ---------------------------------------------------------------------------
 *
 * V4 ─ Honest Proactive Coach
 * --------------------------------
 * • Removed the misleading execution promise.
 * • Greeting now directs users to Dashboard for actual actions.
 * • Architecture became truthful and predictable.
 *
 * ---------------------------------------------------------------------------
 *
 * V5 ─ Conversational AI Agent
 * --------------------------------
 * • Added pendingAction confirmation workflow.
 * • User can approve AI actions directly from chat.
 * • Added local action execution (no Gemini round-trip).
 * • Added Pending Action chip with Yes / Skip controls.
 * • Supports chained interventions after execution.
 * • Uses ref + state mirror:
 *      pendingAction (useRef)  -> async execution
 *      pendingActionDisplay    -> UI rendering
 * • Expanded confirmation vocabulary.
 * • Improved action suggestion detection with broader regex patterns.
 * • Coaching-oriented confirmations rather than repetitive statistics.
 *
 * Design Philosophy
 * --------------------------------
 * • Human always confirms before AI acts.
 * • Keep architecture simple while functionality evolves.
 * • Refactor into separate modules only after action system matures.
 *
 * Current Status:
 * Production-ready foundation for an AI Productivity Agent.
 * ============================================================================
 */











//-------------------------Previous Version(V1/V2)----------------------------//




// import { useEffect, useState, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { supabase } from '../lib/supabase.js';
// import { chatWithCoach, analyzeProductivityPersonality } from '../lib/gemini.js';
// import { Bot, Send, Sparkles, Brain, RefreshCw, Key } from 'lucide-react';
// import toast from 'react-hot-toast';

// const QUICK = [
//   "What should I work on right now?",
//   "How do I stop procrastinating?",
//   "Help me plan my study session",
//   "Give me a 2-minute motivation boost",
//   "I'm feeling overwhelmed, help me",
// ];

// export default function AICoach({ session }) {
//   const [messages, setMessages]         = useState([]);
//   const [input, setInput]               = useState('');
//   const [sending, setSending]           = useState(false);
//   const [tasks, setTasks]               = useState([]);
//   const [profile, setProfile]           = useState(null);
//   const [personality, setPersonality]   = useState(null);
//   const [analyzing, setAnalyzing]       = useState(false);
//   const endRef = useRef(null);
//   const navigate = useNavigate();
//   const userId = session.user.id;

//   useEffect(() => { load(); }, [userId]); // eslint-disable-line
//   useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

//   async function load() {
//     const [{ data: td }, { data: pd }] = await Promise.all([
//       supabase.from('tasks').select('*').eq('user_id', userId),
//       supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
//     ]);
//     const t = td || [];
//     setTasks(t);
//     setProfile(pd);
//     if (pd?.productivity_type && pd.productivity_type !== 'unknown') setPersonality({ type: pd.productivity_type });

//     const name    = pd?.name?.split(' ')[0] || 'there';
//     const pending = t.filter(x => x.status === 'pending' || x.status === 'in_progress').length;
//     const overdue = t.filter(x => x.deadline && new Date(x.deadline) < new Date() && x.status !== 'completed').length;
//     let greeting  = `Hey ${name}! I'm your AI productivity coach, powered by Google Gemini.\n\nYou have **${pending} pending tasks**${overdue > 0 ? ` and **${overdue} overdue**` : ''}. How can I help you today?`;
//     if (!pd?.gemini_api_key) greeting += `\n\n⚠️ Add your Gemini API key in Settings to unlock full AI coaching.`;
//     setMessages([{ role: 'ai', content: greeting }]);
//   }

//   async function send(text) {
//     const msg = text || input.trim();
//     if (!msg || sending) return;
//     setInput('');
//     setSending(true);
//     const next = [...messages, { role: 'user', content: msg }];
//     setMessages(next);
//     const reply = await chatWithCoach(next, msg, tasks, profile?.gemini_api_key || '');
//     setMessages(prev => [...prev, { role: 'ai', content: reply }]);
//     setSending(false);
//   }

//   async function analyze() {
//     setAnalyzing(true);
//     const completed = tasks.filter(t => t.status === 'completed').length;
//     const postponed = tasks.reduce((s, t) => s + (t.postpone_count || 0), 0);
//     const onTime    = tasks.filter(t => t.status==='completed' && t.deadline && t.completed_at && new Date(t.completed_at) <= new Date(t.deadline)).length;
//     const late      = tasks.filter(t => t.status==='completed' && t.deadline && t.completed_at && new Date(t.completed_at) > new Date(t.deadline)).length;
//     const weeks     = Math.max(1, Math.round((Date.now() - new Date(session.user.created_at)) / (7*24*60*60*1000)));
//     const result    = await analyzeProductivityPersonality({ completed, postponed, onTime, late, avgPerWeek: completed/weeks }, profile?.gemini_api_key || '');
//     setPersonality(result);
//     await supabase.from('user_profiles').update({ productivity_type: result.type }).eq('user_id', userId);
//     setAnalyzing(false);
//     toast.success('Personality analyzed!');
//   }

//   return (
//     <div style={{ display:'flex', flexDirection:'column', gap:18, height:'calc(100vh - 100px)' }} className="fade-in">
//       <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
//         <div style={{ display:'flex', alignItems:'center', gap:10 }}>
//           <div style={{ width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(245,158,11,0.15))',display:'flex',alignItems:'center',justifyContent:'center' }}>
//             <Bot size={20} color="var(--cyan-400)" />
//           </div>
//           <div>
//             <h1 style={{ fontSize:22,fontWeight:800 }}>AI Coach</h1>
//             <p style={{ color:'var(--text-secondary)',fontSize:13 }}>Powered by Google Gemini</p>
//           </div>
//         </div>
//         {!profile?.gemini_api_key && (
//           <button className="btn btn-secondary" onClick={() => navigate('/settings')}><Key size={13}/> Add API Key</button>
//         )}
//       </div>

//       <div style={{ display:'flex', gap:18, flex:1, minHeight:0 }}>
//         {/* Chat */}
//         <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10, minHeight:0 }}>
//           <div style={{ flex:1,overflowY:'auto',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',padding:18,display:'flex',flexDirection:'column',gap:14 }}>
//             {messages.map((m,i) => (
//               <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:8 }}>
//                 {m.role==='ai' && (
//                   <div style={{ width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(245,158,11,0.15))',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
//                     <Sparkles size={13} color="var(--cyan-400)"/>
//                   </div>
//                 )}
//                 <div className={`chat-bubble ${m.role}`}>{fmt(m.content)}</div>
//               </div>
//             ))}
//             {sending && (
//               <div style={{ display:'flex',gap:8,alignItems:'center' }}>
//                 <div style={{ width:26,height:26,borderRadius:7,background:'linear-gradient(135deg,rgba(6,182,212,0.25),rgba(245,158,11,0.15))',display:'flex',alignItems:'center',justifyContent:'center' }}>
//                   <Sparkles size={13} color="var(--cyan-400)" className="spin"/>
//                 </div>
//                 <div className="chat-bubble ai" style={{ display:'flex',gap:5,alignItems:'center',padding:'14px 16px' }}>
//                   {[0,150,300].map(d=><span key={d} style={{ width:6,height:6,borderRadius:'50%',background:'var(--surface-3)',display:'inline-block',animation:`shimmer 1s ${d}ms infinite` }}/>)}
//                 </div>
//               </div>
//             )}
//             <div ref={endRef}/>
//           </div>

//           <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
//             {QUICK.map((p,i) => (
//               <button key={i} className="btn btn-secondary" style={{ fontSize:12,padding:'5px 10px' }} onClick={() => send(p)} disabled={sending}>{p}</button>
//             ))}
//           </div>

//           <div style={{ display:'flex',gap:10 }}>
//             <textarea className="input" rows={2} style={{ flex:1,resize:'none' }} placeholder="Ask your AI coach... (Enter to send, Shift+Enter for new line)" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} disabled={sending}/>
//             <button className="btn btn-primary" style={{ alignSelf:'flex-end',padding:'10px 16px' }} onClick={() => send()} disabled={sending||!input.trim()}><Send size={16}/></button>
//           </div>
//         </div>

//         {/* Side panel */}
//         <div className="coach-side-panel" style={{ width:250,display:'flex',flexDirection:'column',gap:14 }}>
//           <div className="card">
//             <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
//               <Brain size={15} color="var(--amber-400)"/>
//               <span style={{ fontWeight:700,fontSize:14 }}>Productivity Profile</span>
//             </div>
//             {personality ? <PersonCard p={personality}/> : (
//               <div style={{ textAlign:'center' }}>
//                 <p style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:12,lineHeight:1.6 }}>Analyze your task history to determine your productivity personality type.</p>
//                 {tasks.filter(t=>t.status==='completed').length < 3
//                   ? <p style={{ fontSize:12,color:'var(--text-muted)' }}>Complete 3+ tasks to unlock analysis.</p>
//                   : <button className="btn btn-primary" style={{ width:'100%',fontSize:13,padding:'8px' }} onClick={analyze} disabled={analyzing}>{analyzing?<span className="spin" style={{width:16,height:16,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#0A0E1A',display:'inline-block'}}/>:<><Sparkles size={13}/>Analyze</>}</button>
//                 }
//               </div>
//             )}
//             {personality && <button className="btn btn-secondary" style={{ width:'100%',fontSize:12,padding:6,marginTop:10 }} onClick={analyze} disabled={analyzing}><RefreshCw size={12} className={analyzing?'spin':''}/> Re-analyze</button>}
//           </div>

//           <div className="card">
//             <div style={{ fontWeight:700,fontSize:14,marginBottom:12 }}>Task Stats</div>
//             {[
//               ['Total',     tasks.length,                                          'var(--text-primary)'],
//               ['Completed', tasks.filter(t=>t.status==='completed').length,        'var(--emerald-400)'],
//               ['Pending',   tasks.filter(t=>t.status==='pending'||t.status==='in_progress').length, 'var(--cyan-400)'],
//               ['Overdue',   tasks.filter(t=>t.deadline&&new Date(t.deadline)<new Date()&&t.status!=='completed').length, 'var(--rose-400)'],
//               ['Postponed', tasks.reduce((s,t)=>s+(t.postpone_count||0),0),        'var(--orange-400)'],
//             ].map(([l,v,c])=>(
//               <div key={l} style={{ display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--border)' }}>
//                 <span style={{ fontSize:12,color:'var(--text-muted)' }}>{l}</span>
//                 <span style={{ fontSize:13,fontWeight:700,color:c }}>{v}</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function PersonCard({ p }) {
//   const COLORS = { 'Sprinter':{'color':'var(--orange-400)','bg':'rgba(251,146,60,0.12)'}, 'Consistent Worker':{'color':'var(--emerald-400)','bg':'rgba(52,211,153,0.12)'}, 'Perfectionist':{'color':'var(--cyan-400)','bg':'rgba(34,211,238,0.12)'}, 'Procrastinator':{'color':'var(--rose-400)','bg':'rgba(251,113,133,0.12)'} };
//   const { color, bg } = COLORS[p.type] || { color:'var(--text-muted)',bg:'var(--surface-2)' };
//   return (
//     <div>
//       <div style={{ display:'inline-flex',padding:'5px 12px',borderRadius:100,background:bg,marginBottom:8 }}>
//         <span style={{ fontSize:13,fontWeight:700,color }}>{p.type}</span>
//       </div>
//       {p.description && <p style={{ fontSize:12,color:'var(--text-secondary)',marginBottom:10,lineHeight:1.6 }}>{p.description}</p>}
//       {p.strengths && <div style={{ marginBottom:8 }}>
//         <div style={{ fontSize:10,fontWeight:700,color:'var(--emerald-400)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em' }}>Strengths</div>
//         {p.strengths.map((s,i)=><div key={i} style={{ fontSize:12,color:'var(--text-secondary)',display:'flex',gap:5 }}><span style={{color:'var(--emerald-400)'}}>+</span>{s}</div>)}
//       </div>}
//       {p.tips && <div>
//         <div style={{ fontSize:10,fontWeight:700,color:'var(--amber-400)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.06em' }}>Tips For You</div>
//         {p.tips.map((t,i)=><div key={i} style={{ fontSize:12,color:'var(--text-secondary)',display:'flex',gap:5,lineHeight:1.5,marginBottom:3 }}><span style={{color:'var(--amber-400)',flexShrink:0}}>→</span>{t}</div>)}
//       </div>}
//     </div>
//   );
// }

// function fmt(text) {
//   return text.split(/(\*\*.*?\*\*)/g).map((p,i) =>
//     p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : p
//   );
// }
