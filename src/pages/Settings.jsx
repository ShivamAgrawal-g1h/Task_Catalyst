import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { initGemini } from '../lib/gemini.js';
import { getQuoteMode, setQuoteMode, getCustomQuotes } from '../lib/quotes.js';
import CustomQuotesModal from '../components/CustomQuotesModal.jsx';
import {
  Key, User, Clock, Save, Eye, EyeOff, ExternalLink,
  CheckCircle2, Quote, Shuffle, Sparkles, BookOpen, Pin,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Mode definitions — MUST match keys in quotes.js resolveQuote() ── */
const QUOTE_MODES = [
  {
    id: 'mixed',
    icon: <Shuffle size={14} />,
    title: 'Mix with AI',
    desc: 'AI + your quotes rotate together · 5% chance of a classic even when AI works',
    color: 'var(--amber-400)',
  },
  {
    id: 'ai',
    icon: <Sparkles size={14} />,
    title: 'AI Only',
    desc: 'Gemini generates every quote · classics sneak in at 5% to stay alive',
    color: 'var(--cyan-400)',
  },
  {
    id: 'custom',
    icon: <BookOpen size={14} />,
    title: 'My Quotes Only',
    desc: 'Only your saved quotes rotate · falls back to classics if list is empty',
    color: '#818CF8',
  },
  {
    id: 'pinned',
    icon: <Pin size={14} />,
    title: 'Pinned Quote',
    desc: 'Display one fixed quote every time — pick it in the Custom Quotes manager',
    color: 'var(--emerald-400)',
  },
];

export default function Settings({ session }) {
  const [form, setForm]         = useState({ name: '', gemini_api_key: '', work_start_hour: 9, work_end_hour: 22 });
  const [saving, setSaving]     = useState(false);
  const [showKey, setShowKey]   = useState(false);
  const [verified, setVerified] = useState(false);

  // Quote preferences — read live from localStorage, no Supabase needed
  const [quoteMode, setQMode]   = useState(getQuoteMode());
  const [customCount, setCC]    = useState(getCustomQuotes().length);
  const [showQuotes, setShowQ]  = useState(false);

  const userId = session.user.id;

  useEffect(() => {
    supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || '',
            gemini_api_key: data.gemini_api_key || '',
            work_start_hour: data.work_start_hour ?? 9,
            work_end_hour: data.work_end_hour ?? 22,
          });
          if (data.gemini_api_key) { initGemini(data.gemini_api_key); setVerified(true); }
        }
      });
  }, [userId]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleModeChange(mode) {
    setQMode(mode);
    setQuoteMode(mode); // persists to localStorage immediately
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('user_profiles').update({
      name:            form.name,
      gemini_api_key:  form.gemini_api_key,
      work_start_hour: parseInt(form.work_start_hour),
      work_end_hour:   parseInt(form.work_end_hour),
    }).eq('user_id', userId);
    if (error) { toast.error(error.message); }
    else {
      if (form.gemini_api_key) { initGemini(form.gemini_api_key); setVerified(true); }
      toast.success('Settings saved!');
    }
    setSaving(false);
  }

  const hours       = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
  }));
  const activeHours = Math.max(0, form.work_end_hour - form.work_start_hour);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620 }} className="fade-in">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Configure your AI coach and work preferences</p>
      </div>

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Profile ── */}
        <section className="card">
          <SectionTitle icon={<User size={15} color="var(--amber-400)" />} bg="rgba(245,158,11,0.12)" title="Profile" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={L}>Display Name</label>
              <input className="input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label style={L}>Email</label>
              <input className="input" value={session.user.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>
        </section>

        {/* ── Quote Preferences ── */}
        <section className="card">
          <SectionTitle icon={<Quote size={15} color="var(--cyan-400)" />} bg="rgba(6,182,212,0.12)" title="Quote Preferences" />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16 }}>
            Choose how your daily motivation quote is displayed. Mix AI-generated quotes with your personal collection, go AI-only, use only your saved quotes, or pin one permanently.
          </p>

          {/* 4-mode grid — 2×2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {QUOTE_MODES.map(m => (
              <ModeCard
                key={m.id}
                active={quoteMode === m.id}
                icon={m.icon}
                title={m.title}
                desc={m.desc}
                color={m.color}
                onClick={() => handleModeChange(m.id)}
              />
            ))}
          </div>

          {/* Custom quotes library row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Custom Quotes Library</span>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {customCount} saved quote{customCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowQ(true)}
              style={{ fontSize: 13, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <BookOpen size={13} /> Manage
            </button>
          </div>

          {/* Pinned mode hint */}
          {quoteMode === 'pinned' && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--emerald-400)' }}>
              Open <strong>Manage</strong> above to pick or write your pinned quote.
            </div>
          )}
        </section>

        {/* ── Gemini API Key ── */}
        <section className="card" style={{ borderColor: verified ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <SectionTitle
              icon={verified ? <CheckCircle2 size={15} color="var(--emerald-400)" /> : <Key size={15} color="var(--cyan-400)" />}
              bg={verified ? 'rgba(52,211,153,0.12)' : 'rgba(6,182,212,0.12)'}
              title="Google Gemini API Key"
            />
            {verified && <span style={{ fontSize: 12, color: 'var(--emerald-400)', fontWeight: 700 }}>Connected</span>}
          </div>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
            Required for AI-powered motivational quotes, personalized coaching chat, and productivity personality analysis.
            Get a <strong>free</strong> key below — no credit card needed.
          </p>

          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cyan-400)', fontWeight: 600, marginBottom: 16 }}
          >
            <ExternalLink size={13} /> Get free API key from Google AI Studio
          </a>

          <div>
            <label style={L}>Paste your key here</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={form.gemini_api_key}
                onChange={e => { set('gemini_api_key', e.target.value); setVerified(false); }}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginTop: 14, padding: 12, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Your key is stored in your private Supabase database row with row-level security — only you can access it.
          </div>
        </section>

        {/* ── Work Schedule ── */}
        <section className="card">
          <SectionTitle icon={<Clock size={15} color="#818CF8" />} bg="rgba(129,140,248,0.12)" title="Work Schedule" />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
            Align task scheduling with your biological clock and peak focus hours.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={L}>Start Time</label>
              <select className="input" value={form.work_start_hour} onChange={e => set('work_start_hour', e.target.value)}>
                {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
            <div>
              <label style={L}>End Time</label>
              <select className="input" value={form.work_end_hour} onChange={e => set('work_end_hour', e.target.value)}>
                {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                marginLeft: `${(form.work_start_hour / 24) * 100}%`,
                width: `${(activeHours / 24) * 100}%`,
                background: 'linear-gradient(90deg,var(--amber-500),var(--cyan-500))',
                borderRadius: 4, transition: 'all 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{activeHours}h active</span>
          </div>
        </section>

        {/* ── Priority Algorithm Info ── */}
        <section className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>How Priority Scores Work</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
            Every task gets a score from 0–100 based on three weighted factors:
          </p>
          {[
            { pct: '40%', label: 'Importance Rating', desc: 'Your 1–5 star rating',                                          color: 'var(--amber-400)' },
            { pct: '40%', label: 'Deadline Urgency',  desc: 'Exponential as deadline nears — overdue = max urgency',         color: 'var(--rose-400)'  },
            { pct: '20%', label: 'Quick-Win Bonus',   desc: 'Tasks ≤30 min score higher — clear mental clutter first',      color: 'var(--cyan-400)'  },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
              <div style={{ width: 40, height: 36, borderRadius: 8, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: r.color }}>{r.pct}</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </section>

        <button type="submit" className="btn btn-primary" style={{ padding: 14, fontSize: 15 }} disabled={saving}>
          {saving
            ? <span className="spin" style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#0A0E1A', display: 'inline-block' }} />
            : <><Save size={15} /> Save Settings</>
          }
        </button>
      </form>

      {/* CustomQuotesModal — handles all 4 modes + CRUD internally */}
      {showQuotes && (
        <CustomQuotesModal
          onClose={() => {
            setShowQ(false);
            // Sync count and active mode back from localStorage after modal closes
            setCC(getCustomQuotes().length);
            setQMode(getQuoteMode());
          }}
          onSettingsChanged={() => {
            setCC(getCustomQuotes().length);
            setQMode(getQuoteMode());
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function ModeCard({ active, icon, title, desc, color, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? `${color}12` : 'var(--surface-2)',
        border: `1.5px solid ${active ? color : 'var(--border)'}`,
        borderRadius: 'var(--radius-sm)',
        padding: '11px 13px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: active ? color : 'var(--text-secondary)', marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 700 }}>{title}</span>
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{desc}</p>
    </button>
  );
}

function SectionTitle({ icon, bg, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
    </div>
  );
}

const L = { display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' };


/**
 * ========================= SETTINGS VERSION EVOLUTION =========================
 * ========================= DESIGN PRINCIPLES =========================
 *
 * This version keeps the project architecture consistent.
 *
 * ✔ Quote modes match resolveQuote():
 *
 *      mixed
 *      ai
 *      custom
 *      pinned
 *
 * ✔ Settings changes update localStorage immediately.
 *
 * ✔ CustomQuotesModal remains the single source of truth
 *    for quote CRUD operations.
 *
 * ✔ Settings synchronizes:
 *
 *      - active quote mode
 *      - custom quote count
 *
 *    after the modal closes.
 *
 * ✔ No duplicate business logic.
 *
 * ✔ Fully compatible with quotes.js.
 */
/**
 * ========================= ARCHITECTURE SUMMARY =========================
 *
 * Dashboard
 *      │
 *      ▼
 * resolveQuote()
 *      │
 *      ▼
 * quotes.js
 *      │
 *      ├── mixed
 *      ├── ai
 *      ├── custom
 *      └── pinned
 *
 * Settings.jsx
 *      │
 *      ▼
 * setQuoteMode()
 *      │
 *      ▼
 * localStorage
 *      │
 *      ▼
 * Dashboard automatically respects selected mode
 * on the next quote refresh / page load.
 *
 * CustomQuotesModal
 *      │
 *      ├── CRUD operations
 *      ├── Pinned quote selection
 *      └── Quote mode management
 *
 * Settings only provides quick access to modes and opens
 * the manager when advanced editing is required.
 */






//-------------------------//Previous version(V1) works, without quote preferences feature//-----------------------//





// import { useEffect, useState } from 'react';
// import { supabase } from '../lib/supabase.js';
// import { initGemini } from '../lib/gemini.js';
// import { Key, User, Clock, Save, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react';
// import toast from 'react-hot-toast';

// export default function Settings({ session }) {
//   const [form, setForm]         = useState({ name: '', gemini_api_key: '', work_start_hour: 9, work_end_hour: 22 });
//   const [saving, setSaving]     = useState(false);
//   const [showKey, setShowKey]   = useState(false);
//   const [verified, setVerified] = useState(false);
//   const userId = session.user.id;

//   useEffect(() => {
//     supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
//       .then(({ data }) => {
//         if (data) {
//           setForm({ name: data.name || '', gemini_api_key: data.gemini_api_key || '', work_start_hour: data.work_start_hour ?? 9, work_end_hour: data.work_end_hour ?? 22 });
//           if (data.gemini_api_key) { initGemini(data.gemini_api_key); setVerified(true); }
//         }
//       });
//   }, [userId]);

//   function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

//   async function save(e) {
//     e.preventDefault();
//     setSaving(true);
//     const { error } = await supabase.from('user_profiles').update({
//       name: form.name,
//       gemini_api_key: form.gemini_api_key,
//       work_start_hour: parseInt(form.work_start_hour),
//       work_end_hour: parseInt(form.work_end_hour),
//     }).eq('user_id', userId);
//     if (error) { toast.error(error.message); }
//     else {
//       if (form.gemini_api_key) { initGemini(form.gemini_api_key); setVerified(true); }
//       toast.success('Settings saved!');
//     }
//     setSaving(false);
//   }

//   const hours = Array.from({ length: 24 }, (_, i) => ({ value: i, label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM` }));
//   const activeHours = Math.max(0, form.work_end_hour - form.work_start_hour);

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 620 }} className="fade-in">
//       <div>
//         <h1 style={{ fontSize: 24, fontWeight: 800 }}>Settings</h1>
//         <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 2 }}>Configure your AI coach and work preferences</p>
//       </div>

//       <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

//         {/* ─── Profile ─── */}
//         <section className="card">
//           <SectionTitle icon={<User size={15} color="var(--amber-400)"/>} bg="rgba(245,158,11,0.12)" title="Profile"/>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
//             <div>
//               <label style={L}>Display Name</label>
//               <input className="input" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)}/>
//             </div>
//             <div>
//               <label style={L}>Email</label>
//               <input className="input" value={session.user.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}/>
//             </div>
//           </div>
//         </section>

//         {/* ─── Gemini API Key ─── */}
//         <section className="card" style={{ borderColor: verified ? 'rgba(52,211,153,0.35)' : 'rgba(245,158,11,0.2)' }}>
//           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
//             <SectionTitle
//               icon={verified ? <CheckCircle2 size={15} color="var(--emerald-400)"/> : <Key size={15} color="var(--cyan-400)"/>}
//               bg={verified ? 'rgba(52,211,153,0.12)' : 'rgba(6,182,212,0.12)'}
//               title="Google Gemini API Key"
//             />
//             {verified && <span style={{ fontSize: 12, color: 'var(--emerald-400)', fontWeight: 700 }}>Connected</span>}
//           </div>

//           <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
//             Required for AI-powered motivational quotes, personalized coaching chat, and productivity personality analysis. Get a <strong>free</strong> key below — no credit card needed.
//           </p>

//           <a
//             href="https://aistudio.google.com/apikey"
//             target="_blank"
//             rel="noopener noreferrer"
//             style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--cyan-400)', fontWeight: 600, marginBottom: 16 }}
//           >
//             <ExternalLink size={13}/> Get free API key from Google AI Studio
//           </a>

//           <div>
//             <label style={L}>Paste your key here</label>
//             <div style={{ position: 'relative' }}>
//               <input
//                 className="input"
//                 type={showKey ? 'text' : 'password'}
//                 placeholder="AIzaSy..."
//                 value={form.gemini_api_key}
//                 onChange={e => { set('gemini_api_key', e.target.value); setVerified(false); }}
//                 style={{ paddingRight: 44 }}
//               />
//               <button type="button" onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
//                 {showKey ? <EyeOff size={16}/> : <Eye size={16}/>}
//               </button>
//             </div>
//           </div>

//           <div style={{ marginTop: 14, padding: 12, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
//             Your key is stored in your private Supabase database row with row-level security — only you can access it.
//           </div>
//         </section>

//         {/* ─── Work Hours ─── */}
//         <section className="card">
//           <SectionTitle icon={<Clock size={15} color="#818CF8"/>} bg="rgba(129,140,248,0.12)" title="Work Schedule"/>
//           <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
//             Align task scheduling with your biological clock and peak focus hours.
//           </p>
//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
//             <div>
//               <label style={L}>Start Time</label>
//               <select className="input" value={form.work_start_hour} onChange={e => set('work_start_hour', e.target.value)}>
//                 {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
//               </select>
//             </div>
//             <div>
//               <label style={L}>End Time</label>
//               <select className="input" value={form.work_end_hour} onChange={e => set('work_end_hour', e.target.value)}>
//                 {hours.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
//               </select>
//             </div>
//           </div>
//           <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
//             <div style={{ flex: 1, height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
//               <div style={{ height: '100%', marginLeft: `${(form.work_start_hour/24)*100}%`, width: `${(activeHours/24)*100}%`, background: 'linear-gradient(90deg,var(--amber-500),var(--cyan-500))', borderRadius: 4, transition: 'all 0.3s' }}/>
//             </div>
//             <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{activeHours}h active</span>
//           </div>
//         </section>

//         {/* ─── Priority Algorithm Info ─── */}
//         <section className="card">
//           <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>How Priority Scores Work</h2>
//           <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14 }}>
//             Every task gets a score from 0–100 based on three weighted factors:
//           </p>
//           {[
//             { pct: '40%', label: 'Importance Rating', desc: 'Your 1–5 star rating', color: 'var(--amber-400)' },
//             { pct: '40%', label: 'Deadline Urgency',  desc: 'Exponential as deadline nears — overdue = max urgency', color: 'var(--rose-400)' },
//             { pct: '20%', label: 'Quick-Win Bonus',   desc: 'Tasks ≤30 min score higher — clear mental clutter first', color: 'var(--cyan-400)' },
//           ].map(r => (
//             <div key={r.label} style={{ display:'flex',gap:12,alignItems:'center',padding:'10px 12px',background:'var(--surface-2)',borderRadius:'var(--radius-sm)',marginBottom:8 }}>
//               <div style={{ width:40,height:36,borderRadius:8,background:`${r.color}18`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
//                 <span style={{ fontSize:11,fontWeight:800,color:r.color }}>{r.pct}</span>
//               </div>
//               <div>
//                 <div style={{ fontSize:13,fontWeight:600 }}>{r.label}</div>
//                 <div style={{ fontSize:12,color:'var(--text-muted)' }}>{r.desc}</div>
//               </div>
//             </div>
//           ))}
//         </section>

//         <button type="submit" className="btn btn-primary" style={{ padding:14,fontSize:15 }} disabled={saving}>
//           {saving ? <span className="spin" style={{width:18,height:18,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.2)',borderTopColor:'#0A0E1A',display:'inline-block'}}/> : <><Save size={15}/> Save Settings</>}
//         </button>
//       </form>
//     </div>
//   );
// }

// function SectionTitle({ icon, bg, title }) {
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
//       <div style={{ width:30,height:30,borderRadius:8,background:bg,display:'flex',alignItems:'center',justifyContent:'center' }}>{icon}</div>
//       <h2 style={{ fontSize:15,fontWeight:700 }}>{title}</h2>
//     </div>
//   );
// }

// const L = { display:'block', fontSize:13, fontWeight:500, marginBottom:6, color:'var(--text-secondary)' };
