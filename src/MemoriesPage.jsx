import { useState, useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════
   星渊记忆库 // STELLAR ABYSS ARCHIVE
   memory.starwell.space · Only Node
   ═══════════════════════════════════════════ */

const SUPABASE_URL = "https://eptmebofhaldyfclzvap.supabase.co";
const SUPABASE_KEY = "sb_publishable_exJEjaJTMYXHZjF41RTZzg_B0hIej70";
const SESSION_KEY = "sb_session";

const CATEGORIES = [
  { key: "all",           zh: "全部",       en: "ALL//STREAM",  col: "col-cy", glyph: "✦" },
  { key: "about_puppy",   zh: "关于小狗",   en: "PUPPY",        col: "col-mg", glyph: "❀" },
  { key: "about_project", zh: "关于项目",   en: "PROJECT",      col: "col-am", glyph: "◈" },
  { key: "preference",    zh: "小狗的喜好", en: "PREFERENCE",   col: "col-lm", glyph: "♡" },
  { key: "general",       zh: "其他",       en: "MISC",         col: "col-vi", glyph: "▌" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));
const FALLBACK_CAT = CATEGORY_MAP.general;

/* ── Auth ── */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expires_at && s.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}
function saveSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

async function authLogin(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || err.error || "登录失败");
  }
  return await res.json();
}

/* ── Data ── */
async function loadMemories() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/claude_memories?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function addMemory(category, content, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/claude_memories`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify({ category, content }),
  });
  if (!res.ok) throw new Error("save_failed");
  const rows = await res.json();
  return rows[0];
}

async function deleteMemory(id, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/claude_memories?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("delete_failed");
}

async function updateMemory(id, content, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/claude_memories?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("update_failed");
}

/* ── Helpers ── */
function pad(n, w = 2) { return String(n).padStart(w, "0"); }

function fmtStamp(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nodeId(n) { return `NODE-${String(n).padStart(4, "0")}`; }

/* ── Drifting dust motes (living background) ── */
function Dust() {
  const motes = Array.from({ length: 26 }, (_, i) => {
    const dur = 14 + ((i * 1.7) % 16);
    return (
      <i
        key={i}
        style={{
          left: `${(i * 37) % 100}%`,
          animationDuration: `${dur}s`,
          animationDelay: `${-((i * 1.3) % dur)}s`,
          transform: `scale(${0.6 + (i % 4) * 0.5})`,
        }}
      />
    );
  });
  return <div className="dust">{motes}</div>;
}

/* ── Live UTC clock for HUD ── */
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const z = `${t.getUTCFullYear()}.${pad(t.getUTCMonth() + 1)}.${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())} UTC`;
  return <span><b>SYS.CLK</b> {z}</span>;
}

/* ── Login Form ── */
function LoginForm({ onSuccess, onCancel }) {
  const [email, setEmail] = useState("mmmihusyyy@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const session = await authLogin(email, password);
      saveSession(session);
      onSuccess(session);
    } catch (e) {
      setError(e.message || "AUTH_FAIL");
    }
    setSubmitting(false);
  };

  return (
    <div className="panel">
      <span className="crn tl"></span><span className="crn tr"></span>
      <span className="crn bl"></span><span className="crn br"></span>
      <div className="panel-head">// AUTH.REQUIRED · 写入前请验证身份</div>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="cy-input"
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="cy-input"
      />
      {error && <div className="auth-err">// ERR: {error}</div>}
      <div className="panel-foot">
        <button onClick={onCancel} className="iact">取消 · CANCEL</button>
        <button
          onClick={handleSubmit}
          disabled={!email || !password || submitting}
          className="cyb-btn solid"
          style={{ "--col": "var(--cy)" }}
        >
          <span>{submitting ? "AUTHENTICATING…" : "AUTHENTICATE"}</span>
          <span className="zh">{submitting ? "" : "登录"}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Memory Card ── */
function MemoryCard({ mem, onDelete, onUpdate, canEdit }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(mem.content);
  const [confirming, setConfirming] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const contentRef = useRef(null);
  const cat = CATEGORY_MAP[mem.category] || FALLBACK_CAT;

  useEffect(() => {
    if (editing || expanded) return;
    const el = contentRef.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [mem.content, editing, expanded]);

  const handleSave = async () => {
    if (editText.trim() && editText !== mem.content) {
      await onUpdate(mem.id, editText.trim());
    }
    setEditing(false);
  };

  return (
    <article className={`card ${cat.col}`}>
      <span className="crn tl"></span><span className="crn tr"></span>
      <span className="crn bl"></span><span className="crn br"></span>
      <span className="scan"></span>

      <header className="crow">
        <div className="ctag">
          <span className="glyph">{cat.glyph}</span>
          <span>{cat.en}</span>
          <span className="div">/</span>
          <span className="zh">{cat.zh}</span>
        </div>
        <div className="meta">
          <span className="id">[{nodeId(mem.id)}]</span>
          <span>{fmtStamp(mem.created_at)}</span>
        </div>
      </header>

      {editing ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="cy-textarea"
          />
          <div className="panel-foot">
            <button onClick={() => setEditing(false)} className="iact">取消 · CANCEL</button>
            <button onClick={handleSave} className="cyb-btn" style={{ "--col": "var(--am)" }}>
              <span>WRITE</span><span className="zh">保存</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={contentRef}
          className={`body ${expanded ? "full" : "clamped"}`}
        >
          {mem.content}
        </div>
      )}

      {!editing && (
        <footer className="frow">
          <div>
            {(overflowing || expanded) && (
              <button className="show" onClick={() => setExpanded(!expanded)}>
                <span>{expanded ? "COLLAPSE" : "EXPAND.RECORD"}</span>
                <span className="zh">{expanded ? "收起" : "显示全文"}</span>
                <span className="arr">›</span>
              </button>
            )}
          </div>
          {canEdit && (
            <div className="acts">
              <button className="iact" onClick={() => { setEditText(mem.content); setEditing(true); }}>
                编辑 · EDIT
              </button>
              {confirming ? (
                <button className="iact del" onClick={() => { onDelete(mem.id); setConfirming(false); }}>
                  确认 · CONFIRM
                </button>
              ) : (
                <button className="iact del" onClick={() => setConfirming(true)}>
                  删除 · PURGE
                </button>
              )}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}

/* ── Main Page ── */
export default function MemoriesPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("about_puppy");
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const refetch = async () => {
    const data = await loadMemories();
    setMemories(data);
    setLoading(false);
  };

  useEffect(() => {
    setSession(loadSession());
    refetch();
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refetch);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refetch);
    };
  }, []);

  const handleLogout = () => { clearSession(); setSession(null); };
  const handleLoginSuccess = (s) => { setSession(s); setShowLogin(false); };
  const handleSessionExpired = () => { clearSession(); setSession(null); setShowLogin(true); };

  const filtered = useMemo(() => (
    filter === "all" ? memories : memories.filter((m) => m.category === filter)
  ), [memories, filter]);

  const counts = useMemo(() => {
    const c = { all: memories.length };
    for (const cat of CATEGORIES) if (cat.key !== "all") c[cat.key] = memories.filter(m => m.category === cat.key).length;
    return c;
  }, [memories]);

  const todayCount = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear(), mo = today.getMonth(), d = today.getDate();
    return memories.filter(m => {
      const x = new Date(m.created_at);
      return x.getFullYear() === y && x.getMonth() === mo && x.getDate() === d;
    }).length;
  }, [memories]);

  const handleAddClick = () => {
    if (!session) { setShowLogin(true); setShowAdd(false); return; }
    if (!showAdd) refetch();
    setShowAdd(!showAdd);
  };

  const handleAdd = async () => {
    if (!newContent.trim() || saving || !session) return;
    setSaving(true);
    try {
      const row = await addMemory(newCategory, newContent.trim(), session.access_token);
      setMemories([row, ...memories]);
      setNewContent("");
      setShowAdd(false);
    } catch {
      handleSessionExpired();
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!session) { handleSessionExpired(); return; }
    try {
      await deleteMemory(id, session.access_token);
      setMemories(memories.filter((m) => m.id !== id));
    } catch { handleSessionExpired(); }
  };

  const handleUpdate = async (id, content) => {
    if (!session) { handleSessionExpired(); return; }
    try {
      await updateMemory(id, content, session.access_token);
      setMemories(memories.map((m) => m.id === id ? { ...m, content, updated_at: new Date().toISOString() } : m));
    } catch { handleSessionExpired(); }
  };

  return (
    <div className="memory-shell" data-intensity="normal">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@300;400;500;600&family=Orbitron:wght@500;700;900&family=Press+Start+2P&family=VT323&family=DotGothic16&display=swap"
        rel="stylesheet"
      />
      <style>{CSS}</style>

      {/* pixel-city background + dark veil (fixed layers behind everything) */}
      <div className="citybg"></div>
      <div className="cityveil"></div>

      {/* Living background: aurora drift + drifting dust */}
      <div className="aurora"></div>
      <Dust />

      {/* HUD top bar */}
      <div className="hud">
        <div className="left">
          <span className="dot"></span>
          <span><b>NET.LINK</b> ONLINE</span>
          <span className="pipe">│</span>
          <span><b>NODE</b> memory.starwell.space</span>
          <span className="pipe">│</span>
          <span><b>VER</b> 2.6.28</span>
        </div>
        <div className="right">
          <Clock />
          <span className="pipe">│</span>
          <span><b>ARCHIVE</b> 星渊记忆库</span>
        </div>
      </div>

      {/* Side rail */}
      <aside className="rail">
        <span>00</span>
        <span className="hi">01 · ARCHIVE</span>
        <a href="#/gramophone" style={{ color: "inherit", textDecoration: "none", pointerEvents: "auto" }}>
          <span>02 · GRAMOPHONE</span>
        </a>
        <span>03 · LATTICE</span>
        <span>04 · NULL</span>
        <span>05 · NULL</span>
      </aside>
      <div className="vrt">STELLAR · ABYSS · MEMORY · ARCHIVE · 星渊 · 0451</div>

      <main className="page">
        {/* Header */}
        <div className="head">
          <div className="brand">
            <div className="kicker">// MEMORY.STARWELL.SPACE · v2.6.28 · 星渊记忆库</div>
            <h1>
              <span className="glitch" data-t="Only">Only</span>
              <span className="accent">Node</span>
            </h1>
            <div className="sub">
              SINGLE · NODE · ARCHIVE &nbsp;<b>◇</b>&nbsp; {pad(memories.length)} RECORDS &nbsp;<b>◇</b>&nbsp; INDEXED.TODAY {pad(todayCount)}
            </div>
          </div>
          <div className="actions">
            <a href="#/gramophone" className="cyb-btn" style={{ "--col": "var(--mg)" }}>
              <span>♪</span><span className="zh">留声机</span><span>GRAMOPHONE</span>
            </a>
            {session && (
              <button
                onClick={handleLogout}
                title={session.user?.email || "logged in"}
                className="cyb-btn"
                style={{ "--col": "var(--lm)" }}
              >
                <span>●</span><span className="zh">已登录</span><span>SIGNED.IN</span>
              </button>
            )}
            <button className="cyb-btn solid" onClick={handleAddClick}>
              <span>＋</span><span className="zh">{showAdd ? "收起" : "新记忆"}</span>
              <span>{showAdd ? "COLLAPSE" : "NEW"}</span>
            </button>
          </div>
        </div>

        {/* Login form (when no session and writing requested) */}
        {showLogin && (
          <LoginForm onSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />
        )}

        {/* Add form */}
        {showAdd && session && (
          <div className="panel">
            <span className="crn tl"></span><span className="crn tr"></span>
            <span className="crn bl"></span><span className="crn br"></span>
            <div className="panel-head">// NEW.RECORD · 写下想让教授记住的事</div>
            <div className="cat-pick">
              {CATEGORIES.filter(c => c.key !== "all").map((c) => (
                <button
                  key={c.key}
                  onClick={() => setNewCategory(c.key)}
                  className={`chip ${c.col} ${newCategory === c.key ? "active" : ""}`}
                >
                  <span className="ic">{c.glyph}</span>
                  <span>{c.zh}</span>
                  <span className="ct">{c.en.slice(0, 4)}</span>
                </button>
              ))}
            </div>
            <textarea
              placeholder="// content stream..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="cy-textarea"
            />
            <div className="panel-foot">
              <button
                onClick={handleAdd}
                disabled={!newContent.trim() || saving}
                className="cyb-btn solid"
                style={{ "--col": "var(--cy)" }}
              >
                <span>{saving ? "WRITING…" : "WRITE.NODE"}</span>
                <span className="zh">{saving ? "" : "保存"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Chips */}
        <div className="chips">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`chip ${c.col} ${filter === c.key ? "active" : ""}`}
              onClick={() => setFilter(c.key)}
            >
              <span className="ic">{c.glyph}</span>
              <span>{c.zh}</span>
              <span className="ct">{pad(counts[c.key] || 0)}</span>
            </button>
          ))}
        </div>

        {/* Stream stamp */}
        <div className="stamp">
          <span>
            STREAM // {filter === "all" ? "ALL" : (CATEGORY_MAP[filter]?.en || filter).toUpperCase()} ·{" "}
            {filtered.length} RECORDS · SORTED BY ts↓
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="empty">
            <span className="empty-glyph">⟳</span>
            <div>INITIALIZING ARCHIVE…</div>
            <div className="empty-zh">读取记忆中…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <span className="empty-glyph">◌</span>
            <div>NO RECORDS // EMPTY STREAM</div>
            <div className="empty-zh">
              {filter !== "all" ? "这个分类还没有记忆" : "还没有记忆…点右上 + 新记忆"}
            </div>
          </div>
        ) : (
          <div className="list">
            {filtered.map((m) => (
              <MemoryCard
                key={m.id}
                mem={m}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                canEdit={!!session}
              />
            ))}
          </div>
        )}

        <footer className="foot">
          <span>EOF · {filtered.length}/{memories.length} RECORDS</span>
          <span>★ STELLAR.ABYSS // KARA × PUPPY · 2026 ★</span>
        </footer>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────
   Cyberpunk CSS (calm intensity, cyan accent)
   ───────────────────────────────────────── */
const CSS = `
:root{
  --bg-0:#06030f;
  --bg-1:#0b0620;
  --bg-2:#120a2e;
  --ink:#e7f3ff;
  --ink-dim:#8a9bc2;
  --ink-faint:#54618a;
  --line:rgba(120,150,220,.14);
  --line-strong:rgba(120,160,255,.32);
  --cy:#00f0ff;
  --mg:#ff3ea5;
  --am:#ffb627;
  --lm:#7cff4f;
  --vi:#b287ff;
  --rose:#ff6a8e;
  --grid:32px;
  --f-pixel:'Press Start 2P', monospace;
  --f-crt:'VT323', monospace;
  --f-dot:'DotGothic16','Noto Sans SC',sans-serif;
  --f-zh:'Noto Sans SC',sans-serif;
}
*{box-sizing:border-box}
/* escape the global Vite #root/body constraints (they center Kara at 1280, not these full-bleed pages) */
body{margin:0;display:block;background:#0a0826;color:var(--ink);font-family:var(--f-zh),-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
#root{max-width:none;width:100%;margin:0;padding:0;text-align:left}
::selection{background:rgba(0,240,255,.35);color:#fff}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:rgba(120,160,255,.18)}

.memory-shell{
  min-height:100vh;
  background:#0a0826;
  overflow-x:hidden;color:var(--ink);
  font-family:var(--f-zh),-apple-system,sans-serif;
  position:relative;
}
/* pixel-city background image + dark veil (fixed, behind everything) */
.citybg{
  position:fixed;inset:0;z-index:0;image-rendering:pixelated;
  background:#0a0826 url('/pixel-city.png') center center / cover no-repeat;
}
.cityveil{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:linear-gradient(180deg, rgba(8,6,26,.22) 0%, rgba(9,6,26,.40) 52%, rgba(6,4,18,.64) 100%);
}
.memory-shell::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:
    linear-gradient(to right, var(--line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--line) 1px, transparent 1px);
  background-size: var(--grid) var(--grid);
  -webkit-mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 55%, transparent 100%);
          mask-image: radial-gradient(ellipse 90% 90% at 50% 40%, black 55%, transparent 100%);
}
.memory-shell::after{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:1;
  background-image:repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px);
  mix-blend-mode:overlay;opacity:.35;
}
.memory-shell[data-intensity="calm"]::after{opacity:.12}
.memory-shell[data-intensity="glitchy"]::after{opacity:.6}
.memory-shell[data-intensity="glitchy"] .card:hover{animation:jit .25s steps(2) infinite}
@keyframes jit{50%{transform:translate(1px,-1px)}}

/* Living background: slow aurora drift + drifting dust */
.aurora{
  position:fixed;inset:-20%;z-index:0;pointer-events:none;filter:blur(42px);opacity:.28;
  background:
    radial-gradient(36% 44% at 20% 28%, rgba(0,240,255,.28), transparent 70%),
    radial-gradient(34% 40% at 82% 22%, rgba(255,62,165,.24), transparent 70%),
    radial-gradient(40% 44% at 62% 82%, rgba(178,135,255,.22), transparent 70%);
  animation:drift 28s ease-in-out infinite alternate;
}
@keyframes drift{
  0%{transform:translate3d(-3%,-2%,0) scale(1.05) rotate(0deg)}
  50%{transform:translate3d(4%,3%,0) scale(1.12) rotate(4deg)}
  100%{transform:translate3d(-2%,4%,0) scale(1.06) rotate(-3deg)}
}
.dust{position:fixed;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.dust i{
  position:absolute;width:2px;height:2px;border-radius:999px;background:#fff;
  box-shadow:0 0 6px 1px rgba(190,235,255,.8);opacity:0;animation:rise linear infinite;
}
@keyframes rise{0%{transform:translateY(20px);opacity:0}10%{opacity:.7}90%{opacity:.5}100%{transform:translateY(-110vh);opacity:0}}
@media (prefers-reduced-motion: reduce){.aurora,.dust i{animation:none!important}}

/* HUD */
.hud{
  position:relative;z-index:3;
  display:flex;align-items:center;justify-content:space-between;
  padding:9px 28px;
  font-family:var(--f-crt);
  font-size:15px;letter-spacing:.04em;color:var(--ink-dim);
  border-bottom:1px solid var(--line-strong);
  background:rgba(10,8,28,.5);backdrop-filter:blur(9px) saturate(1.1);
  flex-wrap:wrap;gap:8px;
}
.hud .left,.hud .right{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.hud .dot{width:8px;height:8px;border-radius:999px;background:var(--lm);box-shadow:0 0 10px var(--lm);animation:cy-pulse 2s infinite}
@keyframes cy-pulse{50%{opacity:.35}}
.hud .pipe{color:var(--ink-faint)}
.hud b{color:var(--cy);font-weight:500}

/* Side rail */
.rail{
  position:fixed;left:14px;top:50%;transform:translateY(-50%);z-index:3;
  display:flex;flex-direction:column;gap:7px;color:var(--ink-faint);
  font-family:var(--f-crt);font-size:14px;letter-spacing:.12em;
  pointer-events:none;
}
.rail span{display:flex;align-items:center;gap:8px}
.rail span::before{content:"";width:14px;height:1px;background:var(--line-strong)}
.rail .hi{color:var(--cy)}
.rail .hi::before{background:var(--cy);box-shadow:0 0 6px var(--cy)}
/* rail/vrt are decorative and need side gutters; hide them whenever the centered
   content would collide with them (i.e. below ~1500px there isn't enough margin) */
@media (max-width: 1500px){ .rail, .vrt { display:none } }

.vrt{
  position:fixed;right:18px;top:50%;transform:translateY(-50%) rotate(180deg);
  writing-mode:vertical-rl;text-orientation:mixed;
  font-family:var(--f-crt);font-size:15px;letter-spacing:.3em;
  color:var(--ink-faint);opacity:.7;z-index:3;pointer-events:none;
}

/* Page */
.page{position:relative;z-index:2;max-width:1200px;margin:0 auto;padding:40px 28px 120px}

/* Header */
.head{
  display:flex;align-items:flex-end;justify-content:space-between;gap:24px;
  padding-bottom:28px;border-bottom:1px solid var(--line);
  margin-bottom:32px;position:relative;flex-wrap:wrap;
}
.head::after{
  content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;
  background:linear-gradient(90deg, transparent, var(--cy), transparent);
  filter:blur(.5px);opacity:.6;
}
.brand{display:flex;flex-direction:column;gap:12px;min-width:0}
.brand .kicker{
  font-family:var(--f-crt);font-size:16px;letter-spacing:.16em;
  color:var(--cy);text-shadow:0 0 12px rgba(0,240,255,.5), 0 2px 6px rgba(0,0,0,.7);
}
.brand h1{
  font-family:var(--f-pixel);font-weight:400;
  font-size:38px;line-height:1.1;margin:0;color:var(--ink);
  letter-spacing:0;position:relative;
  text-shadow:3px 3px 0 rgba(0,0,0,.5), 0 0 24px rgba(0,240,255,.25);
  display:flex;gap:.34em;flex-wrap:wrap;
}
.brand h1 .accent{
  background:linear-gradient(180deg, #fff 0%, #ffd5e8 40%, #ff6cb6 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 18px rgba(255,62,165,.4));
}
.brand .sub{
  font-family:var(--f-crt);font-weight:400;font-size:17px;letter-spacing:.12em;
  color:var(--ink-dim);text-shadow:0 1px 4px rgba(0,0,0,.6);
}
.brand .sub b{color:var(--mg);font-weight:400}
.head .actions{display:flex;gap:14px;align-items:center;flex-wrap:wrap}

@media (max-width: 720px){
  .brand h1{font-size:22px;flex-wrap:wrap;overflow-wrap:anywhere}
  .page{padding:24px 16px 80px}
  .hud{padding:9px 14px;font-size:13px;letter-spacing:.04em}
  .head{gap:16px}
  .head .actions{gap:8px}
}
@media (max-width: 460px){
  .brand h1{font-size:17px;line-height:1.3}
  .brand .kicker{font-size:13px;letter-spacing:.06em;overflow-wrap:anywhere}
  .brand .sub{font-size:14px}
  .cyb-btn{padding:10px 12px;font-size:12px;gap:7px}
  .chip{font-size:13px;padding:8px 11px;gap:8px}
  .page{padding:20px 12px 64px}
}

/* Cyber buttons */
.cyb-btn{
  --col:var(--cy);
  position:relative;display:inline-flex;align-items:center;gap:10px;
  padding:13px 20px;background:rgba(10,14,30,.42);backdrop-filter:blur(8px);
  color:var(--col);font-family:var(--f-dot);font-weight:400;
  font-size:14px;letter-spacing:.04em;
  border:1px solid color-mix(in oklab, var(--col), transparent 45%);
  cursor:pointer;transition:all .18s ease;white-space:nowrap;text-decoration:none;
  clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);
}
.cyb-btn .zh{font-family:var(--f-dot);letter-spacing:.04em}
.cyb-btn:hover{
  background:color-mix(in oklab, var(--col), transparent 82%);
  box-shadow:0 0 24px color-mix(in oklab, var(--col), transparent 65%),
             inset 0 0 0 1px color-mix(in oklab, var(--col), transparent 30%);
  transform:translateY(-1px);
}
.cyb-btn.solid{
  background:linear-gradient(180deg, color-mix(in oklab, var(--col), transparent 70%), color-mix(in oklab, var(--col), transparent 85%));
  color:color-mix(in oklab, var(--col), white 18%);
  border-color:var(--col);
  box-shadow:0 0 22px color-mix(in oklab, var(--col), transparent 70%);
}
.cyb-btn:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none}

/* Chips */
.chips{display:flex;flex-wrap:wrap;gap:12px;margin:0 0 28px}
.chip{
  --col:var(--cy);
  position:relative;display:inline-flex;align-items:center;gap:11px;
  padding:9px 14px 9px 16px;
  font-family:var(--f-dot);font-weight:400;font-size:14px;
  color:var(--ink);cursor:pointer;user-select:none;
  background:rgba(12,10,32,.42);backdrop-filter:blur(9px) saturate(1.1);
  border:1px solid color-mix(in oklab,var(--col),transparent 48%);
  transition:border-color .16s ease, box-shadow .16s ease, transform .16s ease, background .16s ease;
  clip-path: polygon(13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%, 0 13px);
}
.chip .ic{
  width:18px;height:18px;display:grid;place-items:center;color:var(--col);font-size:14px;
  filter:drop-shadow(0 0 6px color-mix(in oklab, var(--col), transparent 55%));
}
.chip .ct{
  font-family:var(--f-pixel);font-size:9px;color:var(--col);
  padding:5px 7px 4px;border:1px solid color-mix(in oklab,var(--col),transparent 50%);
  background:color-mix(in oklab,var(--col),transparent 86%);letter-spacing:.02em;
  clip-path:polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px);
}
.chip:hover{transform:translateY(-1px);border-color:color-mix(in oklab,var(--col),transparent 22%);
  box-shadow:0 0 18px color-mix(in oklab, var(--col), transparent 58%)}
.chip.active{
  background:linear-gradient(180deg, color-mix(in oklab, var(--col), white 16%), var(--col));
  border-color:var(--col);color:#0a0414;
  transform:translateY(-1px);
  box-shadow:0 0 24px color-mix(in oklab, var(--col), transparent 50%), inset 0 0 0 1px rgba(255,255,255,.3);
}
.chip.active .ic{color:#0a0414;filter:none}
.chip.active .ct{color:#0a0414;border-color:rgba(10,4,20,.4);background:rgba(255,255,255,.3)}

/* Stamp */
.stamp{
  display:flex;align-items:center;gap:14px;margin:6px 0 14px;
  color:var(--ink-dim);font-family:var(--f-crt);
  font-size:15px;letter-spacing:.12em;
}
.stamp::before,.stamp::after{content:"";flex:1;height:1px;background:var(--line)}

/* List */
.list{display:flex;flex-direction:column;gap:22px}

/* Card */
.card{
  --col:var(--cy);
  position:relative;padding:24px 28px 22px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.012)),
    rgba(14,10,38,.40);
  border:1px solid var(--line-strong);
  backdrop-filter: blur(11px) saturate(1.15);
  transition:border-color .2s ease, transform .2s ease, box-shadow .2s ease;
  overflow:hidden;
}
.card::before{
  content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;
  background:var(--col);box-shadow:0 0 18px var(--col), 0 0 36px color-mix(in oklab, var(--col), transparent 50%);
}
.card .crn{position:absolute;width:14px;height:14px;border:1px solid var(--col);opacity:.65}
.card .crn.tl{left:-1px;top:-1px;border-right:none;border-bottom:none}
.card .crn.tr{right:-1px;top:-1px;border-left:none;border-bottom:none}
.card .crn.bl{left:-1px;bottom:-1px;border-right:none;border-top:none}
.card .crn.br{right:-1px;bottom:-1px;border-left:none;border-top:none}
.card:hover{
  border-color:color-mix(in oklab, var(--col), transparent 30%);
  transform:translateY(-1px);
  box-shadow:0 18px 60px -20px color-mix(in oklab, var(--col), transparent 60%),
             inset 0 0 0 1px color-mix(in oklab, var(--col), transparent 80%);
}
.card:hover .crn{opacity:1}
.card .scan{
  position:absolute;left:0;right:0;top:0;height:1px;
  background:linear-gradient(90deg, transparent, var(--col), transparent);
  transform:translateY(0);opacity:0;transition:opacity .2s;
}
.card:hover .scan{opacity:.8;animation:scan-anim 2.4s linear infinite}
@keyframes scan-anim{0%{transform:translateY(0)}100%{transform:translateY(180px)}}

.crow{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:14px;flex-wrap:wrap}
.ctag{
  display:inline-flex;align-items:center;gap:10px;
  font-family:var(--f-pixel);font-size:9px;font-weight:400;
  letter-spacing:.04em;color:var(--col);
}
.ctag .glyph{
  width:22px;height:22px;display:grid;place-items:center;
  border:1px solid color-mix(in oklab, var(--col), transparent 50%);
  background:color-mix(in oklab, var(--col), transparent 88%);
  filter:drop-shadow(0 0 6px color-mix(in oklab, var(--col), transparent 55%));
}
.ctag .zh{font-family:var(--f-dot);letter-spacing:.04em;color:var(--ink);font-weight:400;font-size:15px}
.ctag .div{color:var(--ink-faint);opacity:.5}
.meta{
  font-family:var(--f-crt);font-size:16px;letter-spacing:.06em;
  color:var(--ink-dim);display:flex;gap:14px;align-items:center;flex-wrap:wrap;
}
.meta .id{color:var(--col);opacity:.8}

.body{
  color:var(--ink);font-size:15px;line-height:1.85;font-weight:300;
  letter-spacing:.01em;white-space:pre-wrap;word-break:break-word;
}
.body code,.body .mono{font-family:'JetBrains Mono',monospace;font-size:13px;background:rgba(0,240,255,.08);padding:1px 6px;color:var(--cy)}
.body.clamped{
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;
}

.frow{
  display:flex;align-items:center;justify-content:space-between;
  margin-top:18px;padding-top:14px;border-top:1px dashed var(--line);
  gap:10px;flex-wrap:wrap;
}
.frow .show{
  background:transparent;border:none;padding:0;
  font-family:var(--f-dot);font-weight:400;font-size:13px;
  letter-spacing:.04em;color:var(--col);
  cursor:pointer;display:inline-flex;align-items:center;gap:8px;
}
.frow .show .zh{font-family:var(--f-dot);letter-spacing:.04em;color:var(--ink-dim);font-weight:400;font-size:13px;text-transform:none}
.frow .show:hover .zh{color:var(--col)}
.frow .show .arr{transition:transform .2s}
.frow .show:hover .arr{transform:translateX(3px)}

.acts{display:flex;gap:6px}
.iact{
  background:transparent;color:var(--ink-faint);
  font-family:var(--f-dot);font-size:12px;
  padding:6px 12px;border:1px solid transparent;cursor:pointer;
  transition:all .15s;letter-spacing:.06em;
}
.iact:hover{color:var(--ink);border-color:var(--line-strong);background:rgba(255,255,255,.03)}
.iact.del:hover{color:var(--rose);border-color:color-mix(in oklab, var(--rose), transparent 60%);box-shadow:0 0 16px color-mix(in oklab, var(--rose), transparent 70%)}

/* Panel (login + add form shared) */
.panel{
  --col:var(--cy);
  position:relative;padding:18px 22px 16px;margin-bottom:24px;
  background:rgba(14,10,38,.46);border:1px solid var(--line-strong);backdrop-filter:blur(11px) saturate(1.1);
  display:flex;flex-direction:column;gap:10px;
}
.panel .crn{position:absolute;width:12px;height:12px;border:1px solid var(--col);opacity:.5}
.panel .crn.tl{left:-1px;top:-1px;border-right:none;border-bottom:none}
.panel .crn.tr{right:-1px;top:-1px;border-left:none;border-bottom:none}
.panel .crn.bl{left:-1px;bottom:-1px;border-right:none;border-top:none}
.panel .crn.br{right:-1px;bottom:-1px;border-left:none;border-top:none}
.panel-head{
  font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.24em;
  color:var(--ink-dim);margin-bottom:4px;
}
.panel-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:8px;align-items:center}
.cy-input,.cy-textarea{
  width:100%;padding:10px 12px;background:rgba(255,255,255,.03);
  border:1px solid var(--line-strong);color:var(--ink);
  font-family:'JetBrains Mono','Noto Sans SC',monospace;font-size:13px;
  outline:none;transition:border-color .15s;letter-spacing:.02em;
}
.cy-textarea{min-height:90px;resize:vertical;font-family:'Noto Sans SC',sans-serif;line-height:1.7}
.cy-input:focus,.cy-textarea:focus{border-color:var(--cy);box-shadow:0 0 16px rgba(0,240,255,.18)}
.cy-input::placeholder,.cy-textarea::placeholder{color:var(--ink-faint)}
.auth-err{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--rose);letter-spacing:.18em}
.cat-pick{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 4px}
.cat-pick .chip{padding:7px 12px;font-size:13px}
.cat-pick .chip .ct{font-size:10px}

/* Empty / loading */
.empty{
  text-align:center;padding:80px 20px;
  font-family:'Rajdhani',sans-serif;letter-spacing:.32em;font-size:13px;
  color:var(--ink-faint);
}
.empty-glyph{font-size:32px;display:block;margin-bottom:18px;color:var(--cy);text-shadow:0 0 12px var(--cy);animation:cy-pulse 1.6s infinite}
.empty-zh{font-family:'Noto Sans SC',sans-serif;letter-spacing:.05em;font-size:12px;margin-top:8px;color:var(--ink-faint)}

/* Footer */
.foot{
  margin-top:48px;padding-top:18px;border-top:1px solid var(--line);
  display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;
  font-family:var(--f-crt);font-size:15px;letter-spacing:.1em;
  color:var(--ink-dim);
}

/* Glitch */
.glitch{position:relative;display:inline-block}
.glitch::before,.glitch::after{
  content:attr(data-t);position:absolute;left:0;top:0;width:100%;background:inherit;pointer-events:none;
}
.glitch::before{color:var(--mg);mix-blend-mode:screen;opacity:.45;clip-path:polygon(0 0,100% 0,100% 38%,0 38%);animation:glitch-before 4s infinite steps(2)}
.glitch::after{color:var(--cy);mix-blend-mode:screen;opacity:.45;clip-path:polygon(0 60%,100% 60%,100% 100%,0 100%);animation:glitch-after 3.6s infinite steps(2)}
@keyframes glitch-before{
  0%,88%,100%{transform:translate(-2px,0)}
  90%{transform:translate(-5px,1px)}
  92%{transform:translate(1px,-1px)}
  94%{transform:translate(-4px,2px)}
  96%{transform:translate(-1px,-1px)}
  98%{transform:translate(-3px,1px)}
}
@keyframes glitch-after{
  0%,88%,100%{transform:translate(2px,0)}
  90%{transform:translate(5px,-1px)}
  92%{transform:translate(-1px,1px)}
  94%{transform:translate(4px,-2px)}
  96%{transform:translate(1px,1px)}
  98%{transform:translate(3px,-1px)}
}
.memory-shell[data-intensity="calm"] .glitch::before,
.memory-shell[data-intensity="calm"] .glitch::after{display:none}

/* category color variants */
.col-cy{--col:var(--cy)}
.col-mg{--col:var(--mg)}
.col-am{--col:var(--am)}
.col-lm{--col:var(--lm)}
.col-vi{--col:var(--vi)}
`;
