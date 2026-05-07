import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════
   教授的记忆库 · Claude Memories
   让每一个新的教授都记得小狗
   ═══════════════════════════════════════════ */

const SUPABASE_URL = "https://eptmebofhaldyfclzvap.supabase.co";
const SUPABASE_KEY = "sb_publishable_exJEjaJTMYXHZjF41RTZzg_B0hIej70";
const SESSION_KEY = "sb_session";

const C = {
  bg: "#080c16",
  card: "rgba(0,0,0,0.35)",
  cardSolid: "rgba(10,15,25,0.75)",
  border: "rgba(255,255,255,0.08)",
  gold: "rgba(200,170,120,0.85)",
  goldDim: "rgba(200,170,120,0.45)",
  blue: "rgba(100,160,220,0.85)",
  blueDim: "rgba(100,160,220,0.4)",
  pink: "rgba(220,140,160,0.85)",
  pinkDim: "rgba(220,140,160,0.4)",
  green: "rgba(120,200,120,0.85)",
  red: "rgba(220,100,100,0.85)",
  textMain: "rgba(220,225,235,0.9)",
  textDim: "rgba(180,185,195,0.5)",
  textFaint: "rgba(150,155,165,0.3)",
};

const CATEGORIES = [
  { key: "all", label: "全部", emoji: "✨" },
  { key: "about_dog", label: "关于小狗", emoji: "🐾" },
  { key: "about_project", label: "关于项目", emoji: "🛠" },
  { key: "preference", label: "小狗的喜好", emoji: "💫" },
  { key: "general", label: "其他", emoji: "📝" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.filter(c => c.key !== "all").map(c => [c.key, c]));

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

function formatTime(ts) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${m}-${day} ${h}:${min}`;
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${C.border}`,
  borderRadius: "6px",
  color: C.textMain,
  fontSize: "13px",
  fontFamily: "'Noto Sans SC', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

function btnStyle(color) {
  return {
    background: "transparent",
    border: "none",
    color,
    fontSize: "11px",
    fontFamily: "'Noto Sans SC', sans-serif",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  };
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
      setError(e.message || "登录失败");
    }
    setSubmitting(false);
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${C.border}`,
      borderRadius: "10px",
      padding: "12px",
      marginBottom: "10px",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{ fontSize: "12px", color: C.textDim, marginBottom: "8px" }}>
        写记忆需要先登录
      </div>
      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />
      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        style={{ ...inputStyle, marginTop: "6px" }}
      />
      {error && (
        <div style={{ fontSize: "11px", color: C.red, marginTop: "6px" }}>{error}</div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", marginTop: "8px" }}>
        <button onClick={onCancel} style={btnStyle(C.textFaint)}>取消</button>
        <button
          onClick={handleSubmit}
          disabled={!email || !password || submitting}
          style={{ ...btnStyle(C.pink), opacity: (!email || !password || submitting) ? 0.5 : 1 }}
        >
          {submitting ? "登录中..." : "登录"}
        </button>
      </div>
    </div>
  );
}

/* ── Memory Card ── */
function MemoryCard({ mem, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(mem.content);
  const [confirming, setConfirming] = useState(false);
  const cat = CATEGORY_MAP[mem.category] || CATEGORY_MAP.general;

  const handleSave = async () => {
    if (editText.trim() && editText !== mem.content) {
      await onUpdate(mem.id, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div style={{
      background: C.card,
      backdropFilter: "blur(12px)",
      border: `1px solid ${C.border}`,
      borderRadius: "12px",
      padding: "14px 16px",
      marginBottom: "8px",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px" }}>{cat.emoji}</span>
        <span style={{
          fontSize: "10px",
          color: C.pink,
          background: `${C.pinkDim}20`,
          padding: "2px 6px",
          borderRadius: "4px",
        }}>{cat.label}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: "10px", color: C.textFaint, fontFamily: "monospace" }}>
          {formatTime(mem.created_at)}
        </span>
      </div>

      {editing ? (
        <div>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{
              width: "100%",
              minHeight: "60px",
              padding: "8px",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.goldDim}`,
              borderRadius: "8px",
              color: C.textMain,
              fontSize: "13px",
              fontFamily: "'Noto Sans SC', sans-serif",
              lineHeight: 1.7,
              resize: "vertical",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "6px", marginTop: "6px", justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} style={btnStyle(C.textFaint)}>取消</button>
            <button onClick={handleSave} style={btnStyle(C.gold)}>保存</button>
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: "13px",
          lineHeight: 1.8,
          color: C.textDim,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {mem.content}
        </div>
      )}

      {!editing && (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
          <button onClick={() => { setEditText(mem.content); setEditing(true); }} style={btnStyle(C.textFaint)}>
            编辑
          </button>
          {confirming ? (
            <button onClick={() => { onDelete(mem.id); setConfirming(false); }} style={btnStyle(C.red)}>
              确认删除？
            </button>
          ) : (
            <button onClick={() => setConfirming(true)} style={btnStyle(C.textFaint)}>
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function MemoriesPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("about_dog");
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
      if (document.visibilityState === 'visible') refetch();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refetch);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refetch);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  const handleLoginSuccess = (s) => {
    setSession(s);
    setShowLogin(false);
  };

  const handleSessionExpired = () => {
    clearSession();
    setSession(null);
    setShowLogin(true);
  };

  const filtered = filter === "all" ? memories : memories.filter((m) => m.category === filter);

  const handleAddClick = () => {
    if (!session) {
      setShowLogin(true);
      setShowAdd(false);
      return;
    }
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
    } catch {
      handleSessionExpired();
    }
  };

  const handleUpdate = async (id, content) => {
    if (!session) { handleSessionExpired(); return; }
    try {
      await updateMemory(id, content, session.access_token);
      setMemories(memories.map((m) => m.id === id ? { ...m, content, updated_at: new Date().toISOString() } : m));
    } catch {
      handleSessionExpired();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0d1220 50%, #0a0e1a 100%)`,
      fontFamily: "'Noto Sans SC', sans-serif",
      color: C.textMain,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Noto+Sans+SC:wght@300;400;500&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        * { box-sizing: border-box; }
        textarea::placeholder { color: rgba(150,155,165,0.35); }
        input::placeholder { color: rgba(150,155,165,0.35); }
        body { margin: 0; }
      `}</style>

      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(8,12,22,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "16px 16px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <a href="#/" style={{ color: C.textFaint, textDecoration: "none", fontSize: "18px", lineHeight: 1, padding: "4px" }}>←</a>
          <h1 style={{
            margin: 0,
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontSize: "22px",
            color: C.pink,
            flex: 1,
          }}>
            教授的记忆
          </h1>
          {session && (
            <button
              onClick={handleLogout}
              title={session.user?.email || "logged in"}
              style={{
                background: "rgba(120,200,120,0.08)",
                border: `1px solid rgba(120,200,120,0.25)`,
                borderRadius: "8px",
                color: C.green,
                fontSize: "11px",
                fontFamily: "monospace",
                padding: "5px 9px",
                cursor: "pointer",
                marginRight: "4px",
              }}
            >●</button>
          )}
          <button
            onClick={handleAddClick}
            style={{
              background: showAdd ? "rgba(220,140,160,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${showAdd ? C.pinkDim : C.border}`,
              borderRadius: "8px",
              color: showAdd ? C.pink : C.textDim,
              fontSize: "12px",
              fontFamily: "'Noto Sans SC', sans-serif",
              padding: "6px 12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {showAdd ? "收起" : "+ 新记忆"}
          </button>
        </div>

        {showLogin && (
          <LoginForm onSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />
        )}

        {showAdd && session && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`,
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "10px",
            animation: "fadeIn 0.2s ease",
          }}>
            <div style={{ display: "flex", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
              {CATEGORIES.filter(c => c.key !== "all").map(({ key, label, emoji }) => (
                <button
                  key={key}
                  onClick={() => setNewCategory(key)}
                  style={{
                    padding: "5px 8px",
                    background: newCategory === key ? "rgba(220,140,160,0.12)" : "transparent",
                    border: `1px solid ${newCategory === key ? C.pinkDim : C.border}`,
                    borderRadius: "6px",
                    color: newCategory === key ? C.pink : C.textFaint,
                    fontSize: "11px",
                    fontFamily: "'Noto Sans SC', sans-serif",
                    cursor: "pointer",
                  }}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="写下想让教授记住的事..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.textMain,
                fontSize: "13px",
                fontFamily: "'Noto Sans SC', sans-serif",
                lineHeight: 1.7,
                resize: "vertical",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <button
                onClick={handleAdd}
                disabled={!newContent.trim() || saving}
                style={{
                  padding: "8px 20px",
                  background: newContent.trim() ? "rgba(220,140,160,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${newContent.trim() ? C.pinkDim : C.border}`,
                  borderRadius: "8px",
                  color: newContent.trim() ? C.pink : C.textFaint,
                  fontSize: "12px",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  cursor: newContent.trim() ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "4px", overflowX: "auto" }}>
          {CATEGORIES.map(({ key, label, emoji }) => {
            const count = key === "all" ? memories.length : memories.filter(m => m.category === key).length;
            return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "7px 10px",
                background: filter === key ? "rgba(220,140,160,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === key ? "rgba(220,140,160,0.25)" : C.border}`,
                borderRadius: "8px",
                color: filter === key ? C.pink : C.textDim,
                fontSize: "11px",
                fontFamily: "'Noto Sans SC', sans-serif",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {emoji} {label} ({count})
            </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "24px", marginBottom: "12px", animation: "shimmer 1.5s infinite" }}>🐾</div>
            <div style={{ color: C.textFaint, fontSize: "13px" }}>读取记忆中...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "24px", marginBottom: "12px" }}>💭</div>
            <div style={{ color: C.textFaint, fontSize: "13px" }}>
              {filter !== "all" ? "这个分类还没有记忆" : "还没有记忆...点右上角添加吧！"}
            </div>
          </div>
        ) : (
          filtered.map((mem) => (
            <MemoryCard key={mem.id} mem={mem} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))
        )}
      </div>
    </div>
  );
}
