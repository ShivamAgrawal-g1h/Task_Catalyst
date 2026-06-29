import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Pencil, Check, Pin, Shuffle, Sparkles, BookOpen, ChevronDown,
} from 'lucide-react';
import {
  getCustomQuotes, addCustomQuote, removeCustomQuote, editCustomQuote,
  getQuoteMode, setQuoteMode, getPinnedQuote, setPinnedQuote,
  FALLBACK_QUOTES,
} from '../lib/quotes.js';

/* ─── Mode meta ────────────────────────────────────────────── */
const MODES = [
  {
    id: 'mixed',
    icon: <Shuffle size={14} />,
    label: 'Mixed',
    desc: 'AI + your quotes rotate together (5 % chance of a built-in classic even when AI works)',
    color: 'var(--amber-400)',
  },
  {
    id: 'ai',
    icon: <Sparkles size={14} />,
    label: 'AI Only',
    desc: 'Gemini generates every quote; classics sneak in at 5 % to stay alive',
    color: 'var(--cyan-400)',
  },
  {
    id: 'custom',
    icon: <BookOpen size={14} />,
    label: 'My Quotes Only',
    desc: 'Only your personal quotes rotate (falls back to built-ins if your list is empty)',
    color: '#818CF8',
  },
  {
    id: 'pinned',
    icon: <Pin size={14} />,
    label: 'Pinned Quote',
    desc: 'Display one fixed quote every time — pick it below',
    color: 'var(--emerald-400)',
  },
];

/* ─── Component ────────────────────────────────────────────── */
export default function CustomQuotesModal({ onClose, onSettingsChanged }) {
  const [quotes, setQuotes]       = useState([]);
  const [mode, setMode_]          = useState('mixed');
  const [pinned, setPinned_]      = useState('');
  const [draft, setDraft]         = useState('');
  const [editIdx, setEditIdx]     = useState(null);
  const [editText, setEditText]   = useState('');
  const [pinnedDraft, setPinnedDraft] = useState('');
  const [showFallback, setShowFallback] = useState(false);

  // Load persisted state
  useEffect(() => {
    setQuotes(getCustomQuotes());
    const m = getQuoteMode();
    setMode_(m);
    const p = getPinnedQuote();
    setPinned_(p);
    setPinnedDraft(p);
  }, []);

  /* ── Helpers ─────────────────────────────── */

  function changeMode(m) {
    setMode_(m);
    setQuoteMode(m);
    onSettingsChanged?.();
  }

  function handleAdd() {
    if (!draft.trim()) return;
    const updated = addCustomQuote(draft);
    setQuotes(updated);
    setDraft('');
    onSettingsChanged?.();
  }

  function handleRemove(i) {
    const updated = removeCustomQuote(i);
    setQuotes(updated);
    onSettingsChanged?.();
  }

  function startEdit(i) {
    setEditIdx(i);
    setEditText(quotes[i]);
  }

  function confirmEdit() {
    const updated = editCustomQuote(editIdx, editText);
    setQuotes(updated);
    setEditIdx(null);
    onSettingsChanged?.();
  }

  function savePinned() {
    setPinnedQuote(pinnedDraft);
    setPinned_(pinnedDraft);
    onSettingsChanged?.();
  }

  function useFallbackAsPinned(q) {
    setPinnedDraft(q);
  }

  /* ── Render ──────────────────────────────── */
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} color="var(--amber-400)" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Custom Quotes</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Manage your quote pool &amp; display mode</p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: 6 }}><X size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── Mode selector ── */}
          <section>
            <Label>Quote Display Mode</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => changeMode(m.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${mode === m.id ? m.color : 'var(--border)'}`,
                    background: mode === m.id ? `${m.color}14` : 'var(--surface-2)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <span style={{ color: m.color, marginTop: 2 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: mode === m.id ? m.color : 'var(--text-primary)' }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{m.desc}</div>
                  </div>
                  {mode === m.id && (
                    <span style={{ marginLeft: 'auto', color: m.color, flexShrink: 0, marginTop: 2 }}><Check size={14} /></span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Pinned quote editor (only shown in pinned mode) ── */}
          {mode === 'pinned' && (
            <section style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
              <Label>Your Pinned Quote</Label>
              <textarea
                className="input"
                rows={3}
                placeholder="Type the quote you want displayed every time…"
                value={pinnedDraft}
                onChange={e => setPinnedDraft(e.target.value)}
                style={{ marginTop: 8, resize: 'vertical', fontSize: 13 }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={savePinned} disabled={!pinnedDraft.trim()}>
                  <Pin size={13} /> Pin this quote
                </button>
                {pinned && <span style={{ fontSize: 12, color: 'var(--emerald-400)' }}>Currently pinned ✓</span>}
              </div>

              {/* Pick from fallback library */}
              <button
                onClick={() => setShowFallback(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                <ChevronDown size={13} style={{ transform: showFallback ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                Or pick from built-in classics ({FALLBACK_QUOTES.length})
              </button>
              {showFallback && (
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {FALLBACK_QUOTES.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => useFallbackAsPinned(q)}
                      style={{
                        textAlign: 'left', background: pinnedDraft === q ? 'rgba(245,158,11,0.1)' : 'var(--surface-2)',
                        border: `1px solid ${pinnedDraft === q ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                        borderRadius: 6, padding: '7px 10px', fontSize: 12, color: 'var(--text-secondary)',
                        cursor: 'pointer', lineHeight: 1.5, transition: 'all 0.15s',
                      }}
                    >
                      {q.length > 90 ? q.slice(0, 87) + '…' : q}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── My quotes list ── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Label>My Custom Quotes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({quotes.length})</span></Label>
            </div>

            {/* Add new */}
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                className="input"
                rows={2}
                placeholder="Write a quote that fires you up…"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAdd(); }}
                style={{ resize: 'none', fontSize: 13, flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleAdd} disabled={!draft.trim()} style={{ padding: '10px 14px', alignSelf: 'stretch' }}>
                <Plus size={16} />
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Ctrl+Enter to add</div>

            {quotes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                No custom quotes yet — add your first one above!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {quotes.map((q, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}
                >
                  {editIdx === i ? (
                    <>
                      <textarea
                        className="input"
                        rows={2}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        style={{ flex: 1, resize: 'none', fontSize: 13 }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <button className="btn btn-primary" style={{ padding: '6px 10px' }} onClick={confirmEdit}><Check size={13} /></button>
                        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => setEditIdx(null)}><X size={13} /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q}</p>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {mode === 'pinned' && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '4px 8px' }}
                            title="Use as pinned quote"
                            onClick={() => { setPinnedDraft(q); setPinnedQuote(q); setPinned_(q); onSettingsChanged?.(); }}
                          >
                            <Pin size={13} color={pinned === q ? 'var(--emerald-400)' : undefined} />
                          </button>
                        )}
                        <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => startEdit(i)}><Pencil size={13} /></button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleRemove(i)}><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Built-in classics preview (collapsed by default) ── */}
          {mode !== 'pinned' && (
            <section>
              <button
                onClick={() => setShowFallback(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: 0 }}
              >
                <ChevronDown size={13} style={{ transform: showFallback ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                View built-in classics ({FALLBACK_QUOTES.length} quotes · always kept at a 5 % chance)
              </button>
              {showFallback && (
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 10, border: '1px solid var(--border)' }}>
                  {FALLBACK_QUOTES.map((q, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '5px 0', borderBottom: i < FALLBACK_QUOTES.length - 1 ? '1px solid var(--border)' : 'none', lineHeight: 1.5 }}>
                      {q}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</div>;
}
