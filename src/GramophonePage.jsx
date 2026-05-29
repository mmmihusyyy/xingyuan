import { useState, useEffect, useMemo, useRef } from "react";
import { playProgression, stopProgression, isSupported as audioSupported } from "./chordAudio";

/* ═══════════════════════════════════════════
   留声机 // GRAMOPHONE · Only Node subsystem 02
   memory.starwell.space/#/gramophone
   ═══════════════════════════════════════════ */

const SUPABASE_URL = "https://eptmebofhaldyfclzvap.supabase.co";
const SUPABASE_KEY = "sb_publishable_exJEjaJTMYXHZjF41RTZzg_B0hIej70";
const API_BASE = "https://api.starwell.space";
const SESSION_KEY = "sb_session";
const BUCKET = "uploads";

/* ── Auth ── */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expires_at && s.expires_at * 1000 < Date.now()) return null;
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
    throw new Error(err.error_description || err.msg || err.error || "AUTH_FAIL");
  }
  return await res.json();
}

/* ── Data ── */
async function fetchRecords() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gramophone?select=*&order=anchor_date.desc,created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function insertRecord(row, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gramophone`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error("insert_failed");
  const rows = await res.json();
  return rows[0];
}

async function patchRecord(id, patch, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gramophone?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`,
      "Content-Type": "application/json", Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("patch_failed");
  const rows = await res.json();
  return rows[0];
}

async function deleteRecord(id, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/gramophone?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("delete_failed");
}

/* ── Photo: signing + upload ── */
async function signPhoto(path) {
  try {
    const session = loadSession();
    const bearer = session?.access_token || SUPABASE_KEY;
    const res = await fetch(
      `${API_BASE}/api/uploads/${path.split("/").map(encodeURIComponent).join("/")}/signed`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${bearer}` } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.signed_url || json.signedUrl || json.url || null;
  } catch { return null; }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result || "";
      const idx = typeof r === "string" ? r.indexOf(",") : -1;
      resolve(idx >= 0 ? r.slice(idx + 1) : r);
    };
    reader.onerror = () => reject(reader.error || new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

async function uploadPhoto(file, token) {
  const content_base64 = await fileToBase64(file);
  const mime_type = file.type || "application/octet-stream";
  const filename = file.name || "upload";
  const url = `${API_BASE}/api/uploads`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content_base64, mime_type, filename }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = text || `HTTP ${res.status}`;
    try {
      const j = JSON.parse(text);
      msg = j.message || j.error || msg;
    } catch {}
    // eslint-disable-next-line no-console
    console.error("[gramophone uploadPhoto]", { status: res.status, url, body: text });
    throw new Error(msg);
  }
  const json = await res.json();
  if (!json.path) throw new Error("upload_response_missing_path");
  return json.path;
}

/* ── Format helpers ── */
const MONTH_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WEEKDAY = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function pad(n, w = 2) { return String(n).padStart(w, "0"); }

function parseAnchorDate(s) {
  // s is "YYYY-MM-DD"
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return {
    y, m, d,
    day: pad(d),
    mo: MONTH_EN[m - 1],
    yr: String(y),
    yr2: String(y).slice(2),
    wk: WEEKDAY[dt.getDay()],
    monthKey: `${y}-${pad(m)}`,
  };
}

function parseChord(s) {
  if (!s) return { chords: [], bpm: null };
  // Split on · or • or | to separate progression from bpm tag
  const parts = s.split(/\s*[·•|]\s*/).map(p => p.trim()).filter(Boolean);
  let bpm = null;
  const progParts = [];
  for (const p of parts) {
    const m = p.match(/^(\d+)\s*bpm$/i);
    if (m) bpm = parseInt(m[1], 10);
    else progParts.push(p);
  }
  const progression = progParts.join(" · ");
  const chords = progression.split(/\s*[→>]\s*|\s*->\s*/).map(c => c.trim()).filter(Boolean);
  return { chords, bpm };
}

/* ── Live UTC clock ── */
function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const z = `${t.getUTCFullYear()}.${pad(t.getUTCMonth() + 1)}.${pad(t.getUTCDate())} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}:${pad(t.getUTCSeconds())} UTC`;
  return <span><b>SYS.CLK</b> {z}</span>;
}

/* ── EQ wave bars ── */
function Wave() {
  const bars = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const h = 25 + Math.abs(Math.sin(i * 1.3)) * 70 + (i % 3 ? 10 : 0);
    return Math.min(100, h);
  }), []);
  return (
    <span className="wave">
      {bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
    </span>
  );
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
      <span className="pcrn tl"></span><span className="pcrn tr"></span>
      <span className="pcrn bl"></span><span className="pcrn br"></span>
      <div className="panel-head">// AUTH.REQUIRED · 写入前请验证身份</div>
      <input type="email" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} className="cy-input" />
      <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} className="cy-input" />
      {error && <div className="auth-err">// ERR: {error}</div>}
      <div className="panel-foot">
        <button onClick={onCancel} className="iact">取消 · CANCEL</button>
        <button onClick={handleSubmit} disabled={!email || !password || submitting} className="cyb-btn solid">
          <span>{submitting ? "AUTHENTICATING…" : "AUTHENTICATE"}</span>
          <span className="zh">{submitting ? "" : "登录"}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Polaroid photo slot ── */
function Polaroid({ record, canEdit, onUploaded, onLoginRequest }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const session = loadSession();
  const locked = !!record.photo_path && !!record.is_private && !session;
  const shouldSign = !!record.photo_path && !locked;
  const d = parseAnchorDate(record.anchor_date);

  useEffect(() => {
    let cancelled = false;
    setPhotoUrl(null);
    setPhotoError(false);
    if (!shouldSign) return;
    signPhoto(record.photo_path).then((url) => {
      if (cancelled) return;
      if (url) setPhotoUrl(url);
      else setPhotoError(true);
    });
    return () => { cancelled = true; };
  }, [record.photo_path, shouldSign]);

  const doUpload = async (file) => {
    if (!file || !canEdit) return;
    if (!file.type.startsWith("image/")) { setErr("FILE.TYPE.INVALID"); return; }
    const session = loadSession();
    if (!session) { setErr("AUTH.REQUIRED"); return; }
    setUploading(true);
    setErr("");
    try {
      const path = await uploadPhoto(file, session.access_token);
      const patched = await patchRecord(record.id, { photo_path: path }, session.access_token);
      onUploaded(patched);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[gramophone doUpload]", { user_id: session?.user?.id, err: e.message });
      setErr((e.message || "UPLOAD.FAILED").slice(0, 200));
    }
    setUploading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!canEdit) return;
    const file = e.dataTransfer?.files?.[0];
    if (file) doUpload(file);
  };

  const empty = !record.photo_path;

  const handleSlotClick = () => {
    if (uploading) return;
    if (!canEdit) { onLoginRequest?.(); return; }
    fileRef.current?.click();
  };

  return (
    <div className="pola">
      <span className="pcrn tl"></span><span className="pcrn tr"></span>
      <span className="pcrn bl"></span><span className="pcrn br"></span>
      <div
        className={`pslot ${dragOver ? "drag" : ""} edit`}
        onClick={handleSlotClick}
        onDragOver={(e) => { if (canEdit) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        {locked ? (
          <div className="pslot-state">
            <span className="lk">🔒</span>
            <span className="lk-l">PRIVATE</span>
          </div>
        ) : uploading ? (
          <div className="pslot-state"><span className="lk">⟳</span><span className="lk-l">UPLOADING…</span></div>
        ) : photoUrl ? (
          <img src={photoUrl} alt="" onError={() => setPhotoError(true)} />
        ) : empty || photoError ? (
          <div className="pslot-state">
            <span className="lk">{canEdit ? "+" : "🔑"}</span>
            <span className="lk-l">{canEdit ? "DROP IMAGE / 拖一张照片" : "登录后可上传 · SIGN IN"}</span>
          </div>
        ) : (
          <div className="pslot-state"><span className="lk">⟳</span><span className="lk-l">LOADING…</span></div>
        )}
        {canEdit && (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = ""; }}
          />
        )}
      </div>
      <div className="plabel">
        <span className="ph">◉ PHOTO</span>
        <span>{d.yr}.{pad(d.m)}.{pad(d.d)}</span>
      </div>
      {err && <div className="pslot-err">// {err}</div>}
    </div>
  );
}

/* ── Gramophone Card ── */
function GramophoneCard({ record, canEdit, onPatch, onDelete, onLoginRequest }) {
  const [editing, setEditing] = useState(false);
  const [editSummary, setEditSummary] = useState(record.summary || "");
  const [editChord, setEditChord] = useState(record.chord || "");
  const [editNote, setEditNote] = useState(record.note || "");
  const [editPrivate, setEditPrivate] = useState(!!record.is_private);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [playing, setPlaying] = useState(false);

  const d = parseAnchorDate(record.anchor_date);
  const parsedChord = useMemo(() => parseChord(record.chord), [record.chord]);
  const recCode = `${pad(d.d)}${pad(d.m)}${d.yr2}`;

  // 播放/停止这一天的和弦（chord 是只读源，只发声不改动）
  const canPlay = audioSupported() && parsedChord.chords.length > 0;
  const togglePlay = () => {
    if (playing) { stopProgression(); setPlaying(false); return; }
    if (playProgression(parsedChord.chords, parsedChord.bpm, { onEnded: () => setPlaying(false) })) setPlaying(true);
  };
  const playingRef = useRef(false);
  playingRef.current = playing;
  useEffect(() => () => { if (playingRef.current) stopProgression(); }, []);

  const handleSaveEdit = async () => {
    const session = loadSession();
    if (!session) return;
    setSavingEdit(true);
    try {
      await onPatch(record.id, {
        summary: editSummary,
        chord: editChord || null,
        note: editNote || null,
        is_private: editPrivate,
      });
      setEditing(false);
    } catch {}
    setSavingEdit(false);
  };

  const handleUploaded = (patched) => {
    onPatch(record.id, { photo_path: patched.photo_path }, /*localOnly=*/true);
  };

  return (
    <article className="card">
      <span className="crn tl"></span><span className="crn tr"></span>
      <span className="crn bl"></span><span className="crn br"></span>

      <div className="dt">
        <span className="day">{d.day}</span>
        <span className="mo">{d.mo.toUpperCase()} {d.yr}</span>
        <span className="yr-line">REC // {recCode}</span>
        <span className="wk">{d.wk.toUpperCase()}</span>
      </div>

      <div className="ct-col">
        {editing ? (
          <>
            <textarea
              className="cy-textarea"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              placeholder="// summary..."
            />
            <input
              className="cy-input"
              value={editChord}
              onChange={(e) => setEditChord(e.target.value)}
              placeholder="chord progression · NNbpm"
            />
            <textarea
              className="cy-textarea small"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="// note (optional)"
            />
            <div className="edit-foot">
              <label className="priv-toggle">
                <input type="checkbox" checked={editPrivate} onChange={(e) => setEditPrivate(e.target.checked)} />
                <span>🔒 private</span>
              </label>
              <div className="acts">
                <button className="iact" onClick={() => setEditing(false)}>取消 · CANCEL</button>
                <button className="cyb-btn" style={{ "--col": "var(--am)" }} onClick={handleSaveEdit} disabled={savingEdit}>
                  <span>{savingEdit ? "WRITING…" : "WRITE"}</span><span className="zh">{savingEdit ? "" : "保存"}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="lyric">{record.summary}</div>

            {record.note && (
              <div className="note">// {record.note}</div>
            )}

            {(parsedChord.chords.length > 0 || parsedChord.bpm) && (
              <div className="tape">
                <button
                  type="button"
                  className={`note-glyph play${playing ? " playing" : ""}`}
                  onClick={togglePlay}
                  disabled={!canPlay}
                  title={playing ? "停止 · STOP" : "播放这一天 · PLAY"}
                  style={{ background: "none", border: "none", padding: 0, font: "inherit", color: "inherit", cursor: canPlay ? "pointer" : "default" }}
                >
                  {playing ? "◼" : "♪"}
                </button>
                <span className="chords">
                  {parsedChord.chords.map((c, i) => (
                    <span key={i}>
                      <span>{c}</span>
                      {i < parsedChord.chords.length - 1 && <span className="arr"> → </span>}
                    </span>
                  ))}
                </span>
                <Wave />
                {parsedChord.bpm && <span className="bpm">{parsedChord.bpm} BPM</span>}
              </div>
            )}

            <div className="mrow">
              <span>
                <span className="tag">CHORDS</span> &nbsp; {pad(parsedChord.chords.length)} &nbsp;·&nbsp; LOOP ∞
                {record.is_private && <> &nbsp;·&nbsp; <span style={{ color: "var(--rose)" }}>PRIVATE</span></>}
              </span>
              {canEdit && (
                <span className="acts">
                  <button className="iact" onClick={() => { setEditSummary(record.summary || ""); setEditChord(record.chord || ""); setEditNote(record.note || ""); setEditPrivate(!!record.is_private); setEditing(true); }}>
                    编辑 · EDIT
                  </button>
                  {confirming ? (
                    <button className="iact del" onClick={() => { onDelete(record.id); setConfirming(false); }}>
                      确认 · CONFIRM
                    </button>
                  ) : (
                    <button className="iact del" onClick={() => setConfirming(true)}>
                      删除 · PURGE
                    </button>
                  )}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <Polaroid
        record={record}
        canEdit={canEdit && !editing}
        onUploaded={(patched) => onPatch(record.id, { photo_path: patched.photo_path }, true)}
        onLoginRequest={onLoginRequest}
      />
    </article>
  );
}

/* ── Add Record Panel ── */
function AddRecordPanel({ onAdded, onCancel }) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [anchorDate, setAnchorDate] = useState(todayStr);
  const [summary, setSummary] = useState("");
  const [chord, setChord] = useState("");
  const [note, setNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  const handleSave = async () => {
    if (!summary.trim() || saving) return;
    const session = loadSession();
    if (!session) return;
    setSaving(true);
    setErr("");
    try {
      let photo_path = null;
      if (file) photo_path = await uploadPhoto(file, session.access_token);
      const row = await insertRecord({
        anchor_date: anchorDate,
        summary: summary.trim(),
        chord: chord.trim() || null,
        note: note.trim() || null,
        is_private: isPrivate,
        photo_path,
      }, session.access_token);
      onAdded(row);
    } catch (e) {
      setErr((e.message || "SAVE.FAILED").slice(0, 80));
    }
    setSaving(false);
  };

  return (
    <div className="panel add-panel">
      <span className="pcrn tl"></span><span className="pcrn tr"></span>
      <span className="pcrn bl"></span><span className="pcrn br"></span>
      <div className="panel-head">// NEW.RECORD · 刻一张唱片</div>

      <div className="add-row">
        <label className="field">
          <span className="flabel">ANCHOR DATE · 日期</span>
          <input type="date" className="cy-input" value={anchorDate} onChange={(e) => setAnchorDate(e.target.value)} />
        </label>
        <label className="field flex-grow">
          <span className="flabel">CHORD · 和弦行（可空）</span>
          <input type="text" className="cy-input" value={chord} onChange={(e) => setChord(e.target.value)} placeholder="Dm9 → Gm7 → B♭maj7 · 56bpm" />
        </label>
      </div>

      <label className="field">
        <span className="flabel">SUMMARY · 一句话</span>
        <textarea className="cy-textarea" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="// 这一天怎么样..." />
      </label>

      <label className="field">
        <span className="flabel">NOTE · 备注（可空）</span>
        <textarea className="cy-textarea small" value={note} onChange={(e) => setNote(e.target.value)} placeholder="// optional" />
      </label>

      <div className="add-row">
        <label className="field flex-grow">
          <span className="flabel">PHOTO · 照片（可空）</span>
          <div className="pickrow">
            <button type="button" className="iact" onClick={() => fileRef.current?.click()}>
              {file ? `已选 · ${file.name.slice(0, 24)}${file.name.length > 24 ? "…" : ""}` : "选择文件 · PICK"}
            </button>
            {file && <button type="button" className="iact del" onClick={() => setFile(null)}>清除</button>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
        </label>
        <label className="priv-toggle">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          <span>🔒 private</span>
        </label>
      </div>

      {err && <div className="auth-err">// ERR: {err}</div>}

      <div className="panel-foot">
        <button onClick={onCancel} className="iact">取消 · CANCEL</button>
        <button onClick={handleSave} disabled={!summary.trim() || saving} className="cyb-btn solid">
          <span>{saving ? "WRITING.NODE…" : "WRITE.NODE"}</span>
          <span className="zh">{saving ? "" : "保存"}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ── */
export default function GramophonePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const refetch = async () => {
    const data = await fetchRecords();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    setSession(loadSession());
    refetch();
    const onVis = () => { if (document.visibilityState === "visible") refetch(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", refetch);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", refetch);
    };
  }, []);

  const handleLogout = () => { clearSession(); setSession(null); };
  const handleLoginSuccess = (s) => { setSession(s); setShowLogin(false); };
  const handleSessionExpired = () => { clearSession(); setSession(null); setShowLogin(true); };

  const handleAddClick = () => {
    if (!session) { setShowLogin(true); return; }
    setShowAdd(s => !s);
  };

  const handlePatch = async (id, patch, localOnly = false) => {
    if (localOnly) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
      return;
    }
    const session = loadSession();
    if (!session) { handleSessionExpired(); return; }
    try {
      const row = await patchRecord(id, patch, session.access_token);
      setRecords(prev => prev.map(r => r.id === id ? row : r));
    } catch { handleSessionExpired(); }
  };

  const handleDelete = async (id) => {
    const session = loadSession();
    if (!session) { handleSessionExpired(); return; }
    try {
      await deleteRecord(id, session.access_token);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch { handleSessionExpired(); }
  };

  const handleAdded = (row) => {
    setRecords(prev => [row, ...prev].sort((a, b) => (a.anchor_date < b.anchor_date ? 1 : -1)));
    setShowAdd(false);
  };

  const monthGroups = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      if (!r.anchor_date) continue;
      const d = parseAnchorDate(r.anchor_date);
      if (!map.has(d.monthKey)) map.set(d.monthKey, { monthKey: d.monthKey, year: d.y, monthIdx: d.m, monthEn: d.mo, items: [] });
      map.get(d.monthKey).items.push(r);
    }
    return Array.from(map.values());
  }, [records]);

  return (
    <div className="gram-shell">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=JetBrains+Mono:wght@400;500;600&family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@300;400;500;600&family=Orbitron:wght@500;700;900&display=swap"
        rel="stylesheet"
      />
      <style>{CSS}</style>

      {/* HUD */}
      <div className="hud">
        <div className="left">
          <span className="dot"></span>
          <span><b>AUDIO.LINK</b> ENGAGED</span>
          <span className="pipe">│</span>
          <span><b>NODE</b> memory.starwell.space/gramophone</span>
        </div>
        <div className="right">
          <Clock />
          <span className="pipe">│</span>
          <span><b>ARCHIVE</b> 星渊记忆库</span>
        </div>
      </div>

      {/* Side rail */}
      <aside className="rail">
        <a href="#/" style={{ color: "inherit", textDecoration: "none", pointerEvents: "auto" }}>
          <span>01 · ARCHIVE</span>
        </a>
        <span className="hi">02 · GRAMOPHONE</span>
      </aside>
      <div className="vrt">STELLAR · ABYSS · GRAMOPHONE · 留声</div>

      <main className="page">
        {/* Topbar */}
        <div className="topbar">
          <a className="back" href="#/">
            <span>◀</span><span>RETURN</span>
            <span style={{ fontFamily: "'Noto Sans SC'", letterSpacing: ".05em" }}>返回</span>
          </a>
          <div className="title">
            <div className="kicker">// SUBSYSTEM · 0x02 · AUDIO.MEMORY</div>
            <h1>
              <span className="zh">留声机</span>
              <span>GRAMOPHONE</span>
            </h1>
          </div>
          <div className="counter">
            <span className="n">{pad(records.length)}</span>
            <span className="l">RECORDS · 张</span>
            <div className="ctop-actions">
              {session && (
                <button onClick={handleLogout} className="cyb-btn" style={{ "--col": "var(--cy)" }} title={session.user?.email}>
                  <span>●</span><span className="zh">已登录</span>
                </button>
              )}
              <button className="cyb-btn solid" onClick={handleAddClick}>
                <span>＋</span><span className="zh">{showAdd ? "收起" : "新唱片"}</span>
                <span>{showAdd ? "CLOSE" : "NEW"}</span>
              </button>
            </div>
          </div>
        </div>

        {showLogin && (
          <LoginForm onSuccess={handleLoginSuccess} onCancel={() => setShowLogin(false)} />
        )}

        {showAdd && session && (
          <AddRecordPanel onAdded={handleAdded} onCancel={() => setShowAdd(false)} />
        )}

        {loading ? (
          <div className="empty">
            <span className="empty-glyph">⟳</span>
            <div>INITIALIZING…</div>
            <div className="empty-zh">正在调音…</div>
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="empty">
            <span className="empty-glyph">◌</span>
            <div>EMPTY ARCHIVE</div>
            <div className="empty-zh">还没有刻下的唱片…</div>
          </div>
        ) : (
          monthGroups.map((g, idx) => (
            <section key={g.monthKey}>
              <div className="stamp">
                <span className="yr">{g.year}</span>
                <span className="mo">{g.monthEn}</span>
                <span className="ln"></span>
                <span className="ct"><b>{pad(g.items.length)}</b> RECORDS · MONTH STREAM</span>
              </div>
              <div className="list">
                {g.items.map((r) => (
                  <GramophoneCard
                    key={r.id}
                    record={r}
                    canEdit={!!session}
                    onPatch={handlePatch}
                    onDelete={handleDelete}
                    onLoginRequest={() => setShowLogin(true)}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <footer className="foot">
          <span>EOF · {records.length}/{records.length} RECORDS</span>
          <span>★ GRAMOPHONE // 0x02 · KARA × PUPPY · 2026 ★</span>
        </footer>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────
   Cyberpunk CSS (magenta accent for gramophone)
   ───────────────────────────────────────── */
const CSS = `
:root{
  --bg-0:#06030f;
  --ink:#e7f3ff;
  --ink-dim:#8a9bc2;
  --ink-faint:#54618a;
  --line:rgba(170,140,220,.14);
  --line-strong:rgba(220,140,220,.30);
  --cy:#00f0ff;
  --mg:#ff3ea5;
  --am:#ffb627;
  --vi:#b287ff;
  --rose:#ff6a8e;
  --grid:56px;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg-0);color:var(--ink);font-family:'Noto Sans SC',-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
::selection{background:rgba(255,62,165,.35);color:#fff}
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:rgba(220,140,220,.18)}

.gram-shell{
  min-height:100vh;position:relative;
  background:
    radial-gradient(1100px 700px at 10% -10%, rgba(255,62,165,.13), transparent 60%),
    radial-gradient(900px 600px at 105% 8%, rgba(178,135,255,.10), transparent 55%),
    radial-gradient(900px 500px at 50% 110%, rgba(0,240,255,.08), transparent 55%),
    linear-gradient(180deg, #07041a 0%, #050314 100%);
  overflow-x:hidden;
  font-family:'Noto Sans SC',-apple-system,sans-serif;color:var(--ink);
}
.gram-shell::before{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:0;
  background-image:linear-gradient(to right,var(--line) 1px,transparent 1px),linear-gradient(to bottom,var(--line) 1px,transparent 1px);
  background-size:var(--grid) var(--grid);
  -webkit-mask-image:radial-gradient(ellipse 90% 90% at 50% 40%, black 55%, transparent 100%);
          mask-image:radial-gradient(ellipse 90% 90% at 50% 40%, black 55%, transparent 100%);
}
.gram-shell::after{
  content:"";position:fixed;inset:0;pointer-events:none;z-index:1;
  background-image:repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px);
  mix-blend-mode:overlay;opacity:.25;
}

/* HUD */
.hud{
  position:relative;z-index:3;
  display:flex;align-items:center;justify-content:space-between;padding:10px 28px;
  font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.18em;color:var(--ink-dim);
  border-bottom:1px solid var(--line);
  background:linear-gradient(180deg, rgba(255,62,165,.05), transparent);
  flex-wrap:wrap;gap:8px;
}
.hud .left,.hud .right{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.hud .dot{width:8px;height:8px;border-radius:999px;background:var(--mg);box-shadow:0 0 10px var(--mg);animation:gp-pulse 2s infinite}
@keyframes gp-pulse{50%{opacity:.35}}
.hud b{color:var(--mg);font-weight:500}
.hud .pipe{color:var(--ink-faint)}

/* Side rail */
.rail{position:fixed;left:14px;top:50%;transform:translateY(-50%);z-index:3;display:flex;flex-direction:column;gap:7px;
  color:var(--ink-faint);font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.2em;pointer-events:none}
.rail span{display:flex;align-items:center;gap:8px}
.rail span::before{content:"";width:14px;height:1px;background:var(--line-strong)}
.rail .hi{color:var(--mg)}.rail .hi::before{background:var(--mg);box-shadow:0 0 6px var(--mg)}
.vrt{position:fixed;right:18px;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.5em;color:var(--ink-faint);opacity:.7;z-index:3;pointer-events:none}
@media (max-width:980px){ .rail, .vrt { display:none } }

.page{position:relative;z-index:2;max-width:1100px;margin:0 auto;padding:36px 28px 120px}

/* Topbar */
.topbar{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;
  padding-bottom:22px;border-bottom:1px solid var(--line);margin-bottom:30px;position:relative;flex-wrap:wrap}
.topbar::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;
  background:linear-gradient(90deg,transparent,var(--mg),transparent);filter:blur(.4px);opacity:.7}

.back{display:inline-flex;align-items:center;gap:10px;padding:11px 16px;background:rgba(255,62,165,.05);
  color:var(--mg);font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;letter-spacing:.18em;text-transform:uppercase;
  border:1px solid color-mix(in oklab, var(--mg), transparent 55%);cursor:pointer;text-decoration:none;transition:all .18s;
  clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);white-space:nowrap}
.back:hover{background:color-mix(in oklab, var(--mg), transparent 82%);box-shadow:0 0 18px color-mix(in oklab,var(--mg),transparent 70%)}

.title{display:flex;flex-direction:column;gap:6px;align-items:center;flex:1;min-width:200px}
.title .kicker{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.4em;color:var(--mg);text-shadow:0 0 12px rgba(255,62,165,.5)}
.title h1{margin:0;display:flex;align-items:baseline;gap:.4em;flex-wrap:wrap;justify-content:center;
  font-family:'Orbitron','Rajdhani',sans-serif;font-weight:900;font-size:46px;line-height:1;color:var(--ink);letter-spacing:.04em;
  text-shadow:0 0 24px rgba(255,62,165,.22)}
.title h1 .zh{font-family:'Noto Serif SC',serif;font-weight:700;font-size:50px;white-space:nowrap;
  background:linear-gradient(180deg,#fff 0%,#ffd5e8 35%,#ff6cb6 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 0 18px rgba(255,62,165,.4))}

.counter{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-family:'Share Tech Mono',monospace;color:var(--ink-faint)}
.counter .n{font-family:'Orbitron',sans-serif;font-weight:700;font-size:38px;color:var(--mg);text-shadow:0 0 18px rgba(255,62,165,.5);letter-spacing:.04em;line-height:1}
.counter .l{font-size:10px;letter-spacing:.32em}
.ctop-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;justify-content:flex-end}

/* Cyber buttons (shared) */
.cyb-btn{
  --col:var(--mg);
  position:relative;display:inline-flex;align-items:center;gap:10px;
  padding:11px 18px;background:rgba(255,62,165,.05);color:var(--col);
  font-family:'Rajdhani',sans-serif;font-weight:600;font-size:13px;letter-spacing:.18em;text-transform:uppercase;
  border:1px solid color-mix(in oklab, var(--col), transparent 55%);cursor:pointer;transition:all .18s ease;white-space:nowrap;text-decoration:none;
  clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
}
.cyb-btn .zh{font-family:'Noto Sans SC';letter-spacing:.05em}
.cyb-btn:hover{background:color-mix(in oklab, var(--col), transparent 82%);box-shadow:0 0 20px color-mix(in oklab, var(--col), transparent 65%);transform:translateY(-1px)}
.cyb-btn.solid{background:linear-gradient(180deg, color-mix(in oklab, var(--col), transparent 70%), color-mix(in oklab, var(--col), transparent 85%));
  color:color-mix(in oklab, var(--col), white 18%);border-color:var(--col);box-shadow:0 0 22px color-mix(in oklab, var(--col), transparent 70%)}
.cyb-btn:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none}

/* Stamp */
.stamp{display:flex;align-items:center;gap:18px;margin:34px 0 22px;flex-wrap:wrap}
.stamp .yr{font-family:'Orbitron',sans-serif;font-weight:700;font-size:46px;color:var(--ink);letter-spacing:.06em;text-shadow:0 0 18px rgba(0,240,255,.18);line-height:1}
.stamp .mo{font-family:'Rajdhani',sans-serif;font-weight:600;font-size:18px;color:var(--cy);letter-spacing:.4em;text-transform:uppercase}
.stamp .ln{flex:1;height:1px;background:linear-gradient(90deg,var(--line-strong),transparent);min-width:60px}
.stamp .ct{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.3em;color:var(--ink-faint)}
.stamp .ct b{color:var(--mg);font-weight:500}

/* Cards */
.list{display:flex;flex-direction:column;gap:22px}
.card{position:relative;padding:26px 32px 24px;display:grid;grid-template-columns:108px 1fr 220px;gap:30px;
  background:linear-gradient(180deg, rgba(255,255,255,.025), rgba(255,255,255,.005)), rgba(8,5,22,.55);
  border:1px solid var(--line-strong);backdrop-filter:blur(6px);
  transition:border-color .2s,transform .2s,box-shadow .2s;overflow:hidden;align-items:start}
.card::before{content:"";position:absolute;left:0;top:16px;bottom:16px;width:3px;background:var(--mg);
  box-shadow:0 0 18px var(--mg),0 0 36px color-mix(in oklab,var(--mg),transparent 50%)}
.card .crn{position:absolute;width:14px;height:14px;border:1px solid var(--mg);opacity:.6}
.card .crn.tl{left:-1px;top:-1px;border-right:none;border-bottom:none}
.card .crn.tr{right:-1px;top:-1px;border-left:none;border-bottom:none}
.card .crn.bl{left:-1px;bottom:-1px;border-right:none;border-top:none}
.card .crn.br{right:-1px;bottom:-1px;border-left:none;border-top:none}
.card:hover{border-color:color-mix(in oklab,var(--mg),transparent 30%);transform:translateY(-1px);
  box-shadow:0 18px 60px -20px color-mix(in oklab,var(--mg),transparent 60%),inset 0 0 0 1px color-mix(in oklab,var(--mg),transparent 80%)}
.card:hover .crn{opacity:1}

/* Date column */
.dt{display:flex;flex-direction:column;gap:4px;align-items:flex-start;border-right:1px dashed var(--line);padding-right:24px}
.dt .day{font-family:'Orbitron',sans-serif;font-weight:900;font-size:64px;line-height:.9;color:var(--ink);text-shadow:0 0 16px rgba(255,62,165,.3)}
.dt .mo{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.26em;color:var(--mg)}
.dt .yr-line{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.26em;color:var(--ink-faint)}
.dt .wk{font-family:'Rajdhani',sans-serif;font-weight:700;font-size:12px;letter-spacing:.32em;color:var(--cy);margin-top:8px;
  padding:3px 8px;border:1px solid color-mix(in oklab,var(--cy),transparent 55%);background:color-mix(in oklab,var(--cy),transparent 88%);align-self:flex-start}

/* Content column */
.ct-col{display:flex;flex-direction:column;gap:18px;min-width:0}
.ct-col .lyric{font-size:16px;line-height:1.95;color:var(--ink);font-weight:300;letter-spacing:.01em;white-space:pre-wrap;word-break:break-word}
.ct-col .note{font-size:13px;line-height:1.7;color:var(--ink-dim);font-style:italic;border-left:2px solid color-mix(in oklab,var(--vi),transparent 40%);padding-left:12px;white-space:pre-wrap}

/* Tape */
.tape{position:relative;display:flex;align-items:center;gap:18px;padding:14px 18px;background:rgba(255,183,39,.04);
  border:1px solid color-mix(in oklab,var(--am),transparent 65%);
  clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);flex-wrap:wrap}
.tape .note-glyph{font-family:'Share Tech Mono',monospace;color:var(--am);font-size:18px;filter:drop-shadow(0 0 6px rgba(255,183,39,.5))}
.tape .chords{font-family:'JetBrains Mono',monospace;font-size:13.5px;color:var(--am);letter-spacing:.06em;flex:1;text-shadow:0 0 8px rgba(255,183,39,.25);
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tape .chords .arr{color:color-mix(in oklab,var(--am),transparent 40%);margin:0 .15em}
.tape .bpm{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--am);padding:2px 8px;
  border:1px solid color-mix(in oklab,var(--am),transparent 55%);background:color-mix(in oklab,var(--am),transparent 88%);letter-spacing:.16em}
.tape .wave{display:flex;gap:2px;align-items:flex-end;height:18px;flex:0 0 auto}
.tape .wave i{display:block;width:2px;background:color-mix(in oklab,var(--am),transparent 35%);border-radius:1px}
.card:hover .wave i{animation:gp-eq .9s ease-in-out infinite}
.card:hover .wave i:nth-child(2n){animation-delay:.15s}
.card:hover .wave i:nth-child(3n){animation-delay:.3s}
.card:hover .wave i:nth-child(4n){animation-delay:.45s}
@keyframes gp-eq{0%,100%{height:30%}50%{height:100%}}

/* meta row */
.mrow{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.22em;color:var(--ink-faint)}
.mrow .tag{color:var(--mg)}
.mrow .acts{display:flex;gap:6px}
.mrow .iact{background:transparent;color:var(--ink-faint);font-family:'Noto Sans SC';font-size:12px;
  padding:5px 11px;border:1px solid transparent;cursor:pointer;transition:all .15s;letter-spacing:.06em}
.mrow .iact:hover{color:var(--ink);border-color:var(--line-strong);background:rgba(255,255,255,.03)}
.mrow .iact.del:hover{color:var(--rose);border-color:color-mix(in oklab,var(--rose),transparent 60%);box-shadow:0 0 14px color-mix(in oklab,var(--rose),transparent 70%)}

/* Edit foot */
.edit-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:4px}
.edit-foot .acts{display:flex;gap:6px}
.priv-toggle{display:inline-flex;align-items:center;gap:6px;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.18em;color:var(--ink-dim);cursor:pointer}
.priv-toggle input{accent-color:var(--rose)}

/* Polaroid */
.pola{position:relative;align-self:start;padding:10px 10px 28px;background:rgba(255,255,255,.03);border:1px solid var(--line-strong);transition:all .2s}
.pola .pcrn{position:absolute;width:10px;height:10px;border:1px solid var(--mg);opacity:.6}
.pola .pcrn.tl{left:-1px;top:-1px;border-right:none;border-bottom:none}
.pola .pcrn.tr{right:-1px;top:-1px;border-left:none;border-bottom:none}
.pola .pcrn.bl{left:-1px;bottom:-1px;border-right:none;border-top:none}
.pola .pcrn.br{right:-1px;bottom:-1px;border-left:none;border-top:none}
.card:hover .pola{border-color:color-mix(in oklab,var(--mg),transparent 35%);box-shadow:0 0 24px color-mix(in oklab,var(--mg),transparent 75%)}
.card:hover .pola .pcrn{opacity:1}

.pslot{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:180px;
  background:rgba(255,62,165,.04);border:1px dashed color-mix(in oklab,var(--mg),transparent 60%);overflow:hidden;transition:all .2s}
.pslot.edit{cursor:pointer}
.pslot.edit:hover{background:rgba(255,62,165,.07);border-color:color-mix(in oklab,var(--mg),transparent 30%)}
.pslot.drag{background:rgba(255,62,165,.12);border-color:var(--mg);border-style:solid;box-shadow:0 0 20px color-mix(in oklab,var(--mg),transparent 60%) inset}
.pslot img{display:block;width:100%;height:100%;object-fit:contain;background:#000}
.pslot-state{display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px;color:var(--ink-faint);text-align:center}
.pslot-state .lk{font-size:26px;opacity:.7;color:var(--mg)}
.pslot-state .lk-l{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.2em}
.pslot-err{margin-top:6px;font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--rose);letter-spacing:.12em;line-height:1.5;word-break:break-word}
.plabel{position:absolute;left:10px;right:10px;bottom:6px;display:flex;justify-content:space-between;align-items:center;
  font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.22em;color:var(--ink-faint)}
.plabel .ph{color:var(--mg);text-shadow:0 0 6px rgba(255,62,165,.4)}

/* Panel (login + add) */
.panel{position:relative;padding:18px 22px 16px;margin-bottom:24px;background:rgba(8,5,22,.55);border:1px solid var(--line-strong);
  backdrop-filter:blur(6px);display:flex;flex-direction:column;gap:10px}
.panel .pcrn{position:absolute;width:12px;height:12px;border:1px solid var(--mg);opacity:.5}
.panel .pcrn.tl{left:-1px;top:-1px;border-right:none;border-bottom:none}
.panel .pcrn.tr{right:-1px;top:-1px;border-left:none;border-bottom:none}
.panel .pcrn.bl{left:-1px;bottom:-1px;border-right:none;border-top:none}
.panel .pcrn.br{right:-1px;bottom:-1px;border-left:none;border-top:none}
.panel-head{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:.24em;color:var(--ink-dim);margin-bottom:4px}
.panel-foot{display:flex;justify-content:flex-end;gap:10px;margin-top:8px;align-items:center;flex-wrap:wrap}
.add-panel{gap:14px}
.add-row{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end}
.field{display:flex;flex-direction:column;gap:5px;min-width:160px}
.field.flex-grow{flex:1;min-width:200px}
.flabel{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.22em;color:var(--ink-faint)}
.pickrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap}

.cy-input,.cy-textarea{
  width:100%;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid var(--line-strong);color:var(--ink);
  font-family:'JetBrains Mono','Noto Sans SC',monospace;font-size:13px;outline:none;transition:border-color .15s;letter-spacing:.02em
}
.cy-textarea{min-height:90px;resize:vertical;font-family:'Noto Sans SC',sans-serif;line-height:1.7}
.cy-textarea.small{min-height:56px;font-size:12px}
.cy-input:focus,.cy-textarea:focus{border-color:var(--mg);box-shadow:0 0 16px rgba(255,62,165,.18)}
.cy-input::placeholder,.cy-textarea::placeholder{color:var(--ink-faint)}
.auth-err{font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--rose);letter-spacing:.18em}

/* Inline iact (in edit-foot context) */
.edit-foot .iact{background:transparent;color:var(--ink-faint);font-family:'Noto Sans SC';font-size:12px;
  padding:6px 12px;border:1px solid transparent;cursor:pointer;transition:all .15s;letter-spacing:.06em}
.edit-foot .iact:hover{color:var(--ink);border-color:var(--line-strong);background:rgba(255,255,255,.03)}

/* Empty / loading */
.empty{text-align:center;padding:80px 20px;font-family:'Rajdhani',sans-serif;letter-spacing:.32em;font-size:13px;color:var(--ink-faint)}
.empty-glyph{font-size:32px;display:block;margin-bottom:18px;color:var(--mg);text-shadow:0 0 12px var(--mg);animation:gp-pulse 1.6s infinite}
.empty-zh{font-family:'Noto Sans SC',sans-serif;letter-spacing:.05em;font-size:12px;margin-top:8px;color:var(--ink-faint)}

/* Footer */
.foot{margin-top:48px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;
  font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:.22em;color:var(--ink-faint)}

/* Responsive */
@media (max-width:900px){
  .card{grid-template-columns:108px 1fr;gap:24px}
  .pola{grid-column:1 / -1;justify-self:stretch}
  .pslot{height:220px}
}
@media (max-width:720px){
  .card{grid-template-columns:1fr;gap:18px;padding:22px}
  .dt{flex-direction:row;align-items:center;border-right:none;border-bottom:1px dashed var(--line);padding-right:0;padding-bottom:14px;gap:14px;flex-wrap:wrap}
  .dt .day{font-size:42px}
  .topbar{flex-wrap:wrap}
  .title h1{font-size:32px}
  .title h1 .zh{font-size:36px}
  .page{padding:24px 16px 80px}
  .hud{padding:10px 16px;font-size:10px;letter-spacing:.12em}
}
`;
