import { useState, useEffect, useMemo } from "react";

/* ═══════════════════════════════════════════
   留声机 · Gramophone
   一张照片，一句概括，一行和弦
   ═══════════════════════════════════════════ */

const SUPABASE_URL = "https://eptmebofhaldyfclzvap.supabase.co";
const SUPABASE_KEY = "sb_publishable_exJEjaJTMYXHZjF41RTZzg_B0hIej70";
const API_BASE = "https://api.starwell.space";
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
  textMain: "rgba(220,225,235,0.9)",
  textDim: "rgba(180,185,195,0.5)",
  textFaint: "rgba(150,155,165,0.3)",
};

async function fetchRecords() {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/gramophone?select=*&order=anchor_date.desc,created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.expires_at && s.expires_at * 1000 < Date.now()) return null;
    return s;
  } catch { return null; }
}

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
    return json.url || json.signedURL || json.signedUrl || null;
  } catch {
    return null;
  }
}

function formatDateParts(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return {
    month: months[d.getMonth()],
    monthZh: `${d.getMonth() + 1}月`,
    day: d.getDate(),
    year: d.getFullYear(),
    weekday: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()],
  };
}

function GramophoneCard({ record }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const d = formatDateParts(record.anchor_date);
  const session = loadSession();
  const locked = !!record.photo_path && !!record.is_private && !session;
  const shouldSign = !!record.photo_path && !locked;

  useEffect(() => {
    let cancelled = false;
    if (!shouldSign) return;
    signPhoto(record.photo_path).then((url) => {
      if (!cancelled) {
        if (url) setPhotoUrl(url);
        else setPhotoError(true);
      }
    });
    return () => { cancelled = true; };
  }, [record.photo_path, shouldSign]);

  return (
    <div style={{
      background: C.card,
      backdropFilter: "blur(12px)",
      border: `1px solid ${C.border}`,
      borderRadius: "14px",
      overflow: "hidden",
      marginBottom: "14px",
      animation: "fadeIn 0.3s ease",
      display: "flex",
      alignItems: "flex-start",
    }}>
      {/* Photo column (left, vinyl side) */}
      {(locked || (record.photo_path && !photoError)) && (
        <div style={{
          flex: "0 0 auto",
          width: "220px",
          maxWidth: "40%",
          alignSelf: "stretch",
          background: "rgba(255,255,255,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}>
          {locked ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px",
              padding: "32px 12px",
              color: C.textFaint,
            }}>
              <span style={{ fontSize: "22px", opacity: 0.6 }}>🔒</span>
              <span style={{
                fontSize: "10px",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                letterSpacing: "1px",
              }}>private</span>
            </div>
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              onError={() => setPhotoError(true)}
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div style={{
              fontSize: "11px", color: C.textFaint,
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              animation: "shimmer 1.6s ease-in-out infinite",
              padding: "40px 0",
            }}>
              loading…
            </div>
          )}
        </div>
      )}

      {/* Text column (right, lyrics side) */}
      <div style={{ flex: 1, minWidth: 0, padding: "14px 18px 16px" }}>
        {/* Date stamp */}
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginBottom: "10px",
        }}>
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 400,
            fontSize: "22px",
            color: C.gold,
            lineHeight: 1,
          }}>
            {d.day}
          </span>
          <span style={{
            fontSize: "10px",
            color: C.textFaint,
            fontFamily: "monospace",
            letterSpacing: "0.5px",
          }}>
            {d.month} {d.year} · {d.weekday}
          </span>
        </div>

        {/* Summary */}
        <p style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: 1.85,
          color: C.textMain,
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 400,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {record.summary}
        </p>

        {/* Note (optional) */}
        {record.note && (
          <p style={{
            margin: "8px 0 0",
            fontSize: "12px",
            lineHeight: 1.7,
            color: C.textDim,
            fontFamily: "'Noto Sans SC', sans-serif",
            fontStyle: "italic",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {record.note}
          </p>
        )}

        {/* Chord (score-like) */}
        {record.chord && (
          <div style={{
            marginTop: "14px",
            paddingTop: "12px",
            borderTop: `1px dashed ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}>
            <span style={{
              fontSize: "12px",
              color: C.goldDim,
              lineHeight: 1,
            }}>♪</span>
            <code style={{
              flex: 1,
              fontFamily: "'JetBrains Mono', 'Menlo', 'Courier New', monospace",
              fontSize: "11.5px",
              letterSpacing: "0.5px",
              color: C.gold,
              background: "rgba(200,170,120,0.06)",
              border: `1px solid ${C.goldDim}33`,
              borderRadius: "6px",
              padding: "8px 12px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
            }}>
              {record.chord}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GramophonePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const groupedByMonth = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      if (!r.anchor_date) continue;
      const key = r.anchor_date.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return Array.from(map.entries());
  }, [records]);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${C.bg} 0%, #0d1220 50%, #0a0e1a 100%)`,
      fontFamily: "'Noto Sans SC', sans-serif",
      color: C.textMain,
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "rgba(8,12,22,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "16px 16px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", maxWidth: "640px", margin: "0 auto" }}>
          <a
            href="#/"
            style={{
              color: C.textFaint,
              textDecoration: "none",
              fontSize: "18px",
              lineHeight: 1,
              padding: "4px",
            }}
          >
            ←
          </a>
          <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: "8px" }}>
            <h1 style={{
              margin: 0,
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "22px",
              color: C.gold,
              letterSpacing: "1px",
            }}>
              留声机
            </h1>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "12px",
              color: C.blueDim,
              letterSpacing: "1.5px",
            }}>
              Gramophone
            </span>
          </div>
          <span style={{ fontSize: "11px", color: C.textFaint, fontFamily: "monospace" }}>
            {records.length} 张
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 16px 40px", maxWidth: "640px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "22px", marginBottom: "12px", animation: "shimmer 1.5s infinite" }}>♪</div>
            <div style={{ color: C.textFaint, fontSize: "13px" }}>正在调音...</div>
          </div>
        ) : groupedByMonth.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "22px", marginBottom: "12px" }}>♪</div>
            <div style={{ color: C.textFaint, fontSize: "13px" }}>还没有刻下的唱片...</div>
          </div>
        ) : (
          groupedByMonth.map(([monthKey, items]) => {
            const sample = formatDateParts(items[0].anchor_date);
            return (
              <section key={monthKey} style={{ marginBottom: "28px" }}>
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                  marginBottom: "14px",
                  paddingBottom: "8px",
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 400,
                    fontSize: "26px",
                    color: C.blue,
                    letterSpacing: "1px",
                    lineHeight: 1,
                  }}>
                    {sample.year}
                  </span>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontStyle: "italic",
                    fontSize: "18px",
                    color: C.gold,
                    lineHeight: 1,
                  }}>
                    {sample.month}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: "10px", color: C.textFaint, fontFamily: "monospace" }}>
                    {items.length} 张
                  </span>
                </div>
                {items.map((r) => (
                  <GramophoneCard key={r.id} record={r} />
                ))}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
