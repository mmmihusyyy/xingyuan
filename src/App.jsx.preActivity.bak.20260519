import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/* ═══════════════════════════════════════════
   星海孕育 · KARA  v3.2
   Ka from Kai, ra from Lyra
   "亲爱的" in Italian
   Seaside cottage edition 🏠🌻
   ☁️ Cloud sync via Supabase
   ═══════════════════════════════════════════ */

/* ── Supabase Cloud Config ── */
const SUPABASE_URL = "https://eptmebofhaldyfclzvap.supabase.co";
const SUPABASE_KEY = "sb_publishable_exJEjaJTMYXHZjF41RTZzg_B0hIej70";

async function cloudLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kara_state?id=eq.1&select=state_data,updated_at`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length > 0 && rows[0].state_data) return rows[0].state_data;
    return null;
  } catch { return null; }
}

async function cloudSave(data) {
  try {
    const payload = { id: 1, state_data: data, updated_at: new Date().toISOString() };
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kara_state?id=eq.1`, {
      method: "GET",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const rows = await res.json();
    if (rows.length === 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/kara_state`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/kara_state?id=eq.1`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ state_data: data, updated_at: new Date().toISOString() }),
      });
    }
  } catch (e) { console.log("Cloud save failed:", e); }
}

/* ── Get Tokyo hour for day/night cycle ── */
function getTokyoHour() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const tokyo = new Date(utc + 9 * 3600000);
  return tokyo.getHours() + tokyo.getMinutes() / 60;
}

function getTimeOfDay(h) {
  if (h >= 5.5 && h < 7) return "dawn";
  if (h >= 7 && h < 11) return "morning";
  if (h >= 11 && h < 14) return "noon";
  if (h >= 14 && h < 17) return "afternoon";
  if (h >= 17 && h < 19) return "sunset";
  if (h >= 19 && h < 21) return "dusk";
  return "night";
}

const SKY_COLORS = {
  dawn:      { top: "#2a1b3d", mid: "#5c3d6e", bottom: "#e8956a", accent: "#ffb88c" },
  morning:   { top: "#4a90c4", mid: "#7ec8e3", bottom: "#c5e8f7", accent: "#ffe4a0" },
  noon:      { top: "#2d7fc1", mid: "#5ba3d9", bottom: "#a0d2f0", accent: "#fff5d4" },
  afternoon: { top: "#4a7fb5", mid: "#7fadce", bottom: "#c9dff0", accent: "#ffeab5" },
  sunset:    { top: "#2d1b4e", mid: "#c4546d", bottom: "#f4a261", accent: "#ffe08a" },
  dusk:      { top: "#1a1040", mid: "#3d2b6b", bottom: "#6b4c8a", accent: "#d4a0c0" },
  night:     { top: "#0a0e1a", mid: "#121a30", bottom: "#1e2a45", accent: "#4a6080" },
};

const SEA_COLORS = {
  dawn:      { near: "#3a5a7c", far: "#5a7090", foam: "rgba(255,220,200,0.3)" },
  morning:   { near: "#3a80a8", far: "#5a9ec0", foam: "rgba(255,255,255,0.5)" },
  noon:      { near: "#2878a5", far: "#4a98c0", foam: "rgba(255,255,255,0.6)" },
  afternoon: { near: "#3a7da0", far: "#5898b8", foam: "rgba(255,255,255,0.45)" },
  sunset:    { near: "#5a4a6a", far: "#8a6a70", foam: "rgba(255,200,160,0.35)" },
  dusk:      { near: "#2a2a50", far: "#3a3a60", foam: "rgba(180,160,200,0.2)" },
  night:     { near: "#0e1525", far: "#1a2540", foam: "rgba(100,140,180,0.15)" },
};

/* ── Seaside Cottage Background ── */
const SeasideCottage = () => {
  const [hour, setHour] = useState(getTokyoHour());

  useEffect(() => {
    const interval = setInterval(() => setHour(getTokyoHour()), 60000);
    return () => clearInterval(interval);
  }, []);

  const tod = getTimeOfDay(hour);
  const sky = SKY_COLORS[tod];
  const sea = SEA_COLORS[tod];
  const isNight = tod === "night" || tod === "dusk";
  const isDawn = tod === "dawn" || tod === "sunset";

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      {/* Sky gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} 40%, ${sky.bottom} 75%, ${sky.accent} 100%)`,
        transition: "background 120s ease",
      }} />

      {/* Stars (night/dusk only) */}
      {isNight && Array.from({ length: 50 }, (_, i) => (
        <div key={`star-${i}`} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 45}%`,
          width: `${Math.random() * 2 + 0.5}px`,
          height: `${Math.random() * 2 + 0.5}px`,
          borderRadius: "50%",
          backgroundColor: `rgba(255,255,240,${Math.random() * 0.5 + 0.3})`,
          animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out ${Math.random() * 5}s infinite alternate`,
        }} />
      ))}

      {/* Moon (night) */}
      {isNight && (
        <div style={{
          position: "absolute", top: "8%", right: "15%",
          width: "40px", height: "40px", borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #ffeedd, #e8d5b8)",
          boxShadow: "0 0 30px rgba(255,238,200,0.3), 0 0 80px rgba(255,238,200,0.1)",
        }} />
      )}

      {/* Sun (day) */}
      {!isNight && tod !== "dawn" && (
        <div style={{
          position: "absolute",
          top: tod === "noon" ? "5%" : tod === "morning" ? "12%" : "15%",
          left: tod === "morning" ? "20%" : tod === "noon" ? "40%" : "65%",
          width: "35px", height: "35px", borderRadius: "50%",
          background: "radial-gradient(circle, #fff8e1, #ffe082)",
          boxShadow: `0 0 40px rgba(255,220,100,0.4), 0 0 100px rgba(255,200,50,0.15)`,
          animation: "gentlePulse 6s ease-in-out infinite",
        }} />
      )}

      {/* Dawn/sunset glow */}
      {isDawn && (
        <div style={{
          position: "absolute", bottom: "25%",
          left: tod === "dawn" ? "10%" : "60%",
          width: "200px", height: "80px", borderRadius: "50%",
          background: `radial-gradient(ellipse, ${sky.accent}60, transparent)`,
          filter: "blur(30px)",
        }} />
      )}

      {/* Clouds */}
      {!isNight && (
        <>
          <div style={{
            position: "absolute", top: "12%", left: "-10%",
            width: "180px", height: "40px", borderRadius: "20px",
            background: `rgba(255,255,255,${isNight ? 0.05 : 0.25})`,
            filter: "blur(8px)",
            animation: "cloudDrift 80s linear infinite",
          }} />
          <div style={{
            position: "absolute", top: "20%", left: "30%",
            width: "120px", height: "30px", borderRadius: "15px",
            background: `rgba(255,255,255,${isNight ? 0.03 : 0.18})`,
            filter: "blur(6px)",
            animation: "cloudDrift 120s linear 20s infinite",
          }} />
          <div style={{
            position: "absolute", top: "8%", left: "60%",
            width: "150px", height: "35px", borderRadius: "18px",
            background: `rgba(255,255,255,${isNight ? 0.04 : 0.2})`,
            filter: "blur(7px)",
            animation: "cloudDrift 100s linear 40s infinite",
          }} />
        </>
      )}

      {/* Distant mountains/islands */}
      <div style={{
        position: "absolute", bottom: "32%", left: "5%",
        width: "120px", height: "45px",
        background: `linear-gradient(180deg, ${isNight ? "rgba(30,40,60,0.6)" : "rgba(80,110,140,0.35)"}, transparent)`,
        borderRadius: "60px 80px 0 0",
        filter: "blur(3px)",
      }} />
      <div style={{
        position: "absolute", bottom: "31%", left: "60%",
        width: "160px", height: "55px",
        background: `linear-gradient(180deg, ${isNight ? "rgba(25,35,55,0.5)" : "rgba(90,120,150,0.3)"}, transparent)`,
        borderRadius: "80px 60px 0 0",
        filter: "blur(4px)",
      }} />

      {/* 🏠 Professor's creative touch: Lighthouse in the distance */}
      <div style={{ position: "absolute", bottom: "36%", left: "82%" }}>
        {/* Tower base */}
        <div style={{
          width: "4px", height: "28px",
          background: isNight
            ? "linear-gradient(180deg, #ddd 0%, #8a9ab0 100%)"
            : "linear-gradient(180deg, #fff 0%, #d4dbe5 100%)",
          borderRadius: "1px",
          margin: "0 auto",
        }} />
        {/* Red stripe */}
        <div style={{
          position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)",
          width: "4px", height: "6px",
          background: isNight ? "#8a4040" : "#cc4444",
        }} />
        {/* Light at top */}
        <div style={{
          position: "absolute", top: "-2px", left: "50%", transform: "translateX(-50%)",
          width: "3px", height: "3px", borderRadius: "50%",
          background: isNight ? "#ffe680" : "#fff8e0",
          boxShadow: isNight
            ? "0 0 6px #ffe680, 0 0 15px rgba(255,230,128,0.4)"
            : "0 0 3px rgba(255,248,200,0.3)",
          animation: isNight ? "lighthouseBeam 4s ease-in-out infinite" : "none",
        }} />
      </div>

      {/* Ocean - far */}
      <div style={{
        position: "absolute", bottom: "18%", left: 0, right: 0, height: "18%",
        background: `linear-gradient(180deg, ${sea.far}, ${sea.near})`,
        transition: "background 120s ease",
      }} />

      {/* Wave layers */}
      <svg style={{ position: "absolute", bottom: "26%", left: 0, width: "200%", height: "40px" }}
           viewBox="0 0 1440 40" preserveAspectRatio="none">
        <path d="M0,20 C240,0 480,40 720,20 C960,0 1200,40 1440,20 L1440,40 L0,40 Z"
              fill={sea.foam} style={{ animation: "waveMove 8s ease-in-out infinite" }} />
      </svg>
      <svg style={{ position: "absolute", bottom: "22%", left: 0, width: "200%", height: "35px" }}
           viewBox="0 0 1440 35" preserveAspectRatio="none">
        <path d="M0,15 C180,30 360,0 540,15 C720,30 900,0 1080,15 C1260,30 1440,0 1440,15 L1440,35 L0,35 Z"
              fill={`${sea.near}90`} style={{ animation: "waveMove2 10s ease-in-out infinite" }} />
      </svg>
      <svg style={{ position: "absolute", bottom: "18%", left: 0, width: "200%", height: "30px" }}
           viewBox="0 0 1440 30" preserveAspectRatio="none">
        <path d="M0,10 C360,25 720,0 1080,10 C1200,15 1320,5 1440,10 L1440,30 L0,30 Z"
              fill={sea.foam} style={{ animation: "waveMove3 12s ease-in-out infinite" }} />
      </svg>

      {/* 🚢 Professor's creative touch: Paper boat on the ocean */}
      <div style={{
        position: "absolute", bottom: "24%", left: "25%",
        animation: "paperBoat 6s ease-in-out infinite",
        opacity: 0.7, fontSize: "14px",
        filter: isNight ? "brightness(0.6)" : "none",
      }}>
        ⛵
      </div>

      {/* Beach/shore */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
        background: isNight
          ? "linear-gradient(180deg, #2a3040 0%, #1e2530 100%)"
          : "linear-gradient(180deg, #d4c4a0 0%, #c8b890 30%, #baa878 100%)",
        transition: "background 120s ease",
      }} />

      {/* Sand texture dots */}
      {!isNight && Array.from({ length: 20 }, (_, i) => (
        <div key={`sand-${i}`} style={{
          position: "absolute",
          bottom: `${Math.random() * 15 + 2}%`,
          left: `${Math.random() * 100}%`,
          width: "2px", height: "2px", borderRadius: "50%",
          backgroundColor: "rgba(180,160,120,0.3)",
        }} />
      ))}

      {/* 🏠 Cottage */}
      <div style={{ position: "absolute", bottom: "14%", right: "8%", width: "120px" }}>
        {/* Chimney - sits on roof */}
        <div style={{
          position: "absolute", top: "-5px", right: "22px",
          width: "12px", height: "22px",
          background: isNight ? "#3a3530" : "#8a7560",
          borderRadius: "2px 2px 0 0",
          zIndex: 2,
        }} />
        {/* Smoke from chimney */}
        <div style={{
          position: "absolute", top: "-32px", right: "20px",
          width: "8px", height: "8px", borderRadius: "50%",
          background: `rgba(200,200,210,${isNight ? 0.15 : 0.25})`,
          filter: "blur(3px)",
          animation: "smokeRise 4s ease-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "-42px", right: "24px",
          width: "6px", height: "6px", borderRadius: "50%",
          background: `rgba(200,200,210,${isNight ? 0.1 : 0.2})`,
          filter: "blur(4px)",
          animation: "smokeRise 4s ease-out 1.5s infinite",
        }} />

        {/* Roof */}
        <div style={{
          width: 0, height: 0,
          borderLeft: "70px solid transparent",
          borderRight: "70px solid transparent",
          borderBottom: `40px solid ${isNight ? "#3a2820" : "#9a6040"}`,
          marginLeft: "-10px",
        }} />

        {/* House body */}
        <div style={{
          width: "120px", height: "65px",
          background: isNight
            ? "linear-gradient(180deg, #2a2520, #1e1a18)"
            : "linear-gradient(180deg, #e8ddd0, #d8cbb8)",
          borderRadius: "0 0 4px 4px",
          position: "relative",
          boxShadow: isNight ? "none" : "2px 4px 12px rgba(0,0,0,0.15)",
        }}>
          {/* Window with warm glow */}
          <div style={{
            position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)",
            width: "40px", height: "28px", borderRadius: "3px",
            background: isNight
              ? "linear-gradient(180deg, #ffe8a0, #ffd060)"
              : "linear-gradient(180deg, rgba(200,230,255,0.6), rgba(180,210,240,0.4))",
            boxShadow: isNight
              ? "0 0 15px rgba(255,220,100,0.4), 0 0 40px rgba(255,200,60,0.15), inset 0 0 8px rgba(255,240,180,0.3)"
              : "inset 0 0 4px rgba(150,180,210,0.3)",
            border: `1px solid ${isNight ? "rgba(120,100,60,0.5)" : "rgba(160,140,120,0.4)"}`,
          }}>
            {/* Window cross */}
            <div style={{
              position: "absolute", top: 0, left: "50%", width: "1px", height: "100%",
              background: isNight ? "rgba(120,100,60,0.4)" : "rgba(140,120,100,0.3)",
            }} />
            <div style={{
              position: "absolute", top: "50%", left: 0, width: "100%", height: "1px",
              background: isNight ? "rgba(120,100,60,0.4)" : "rgba(140,120,100,0.3)",
            }} />
          </div>

          {/* Door */}
          <div style={{
            position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "22px", height: "30px", borderRadius: "3px 3px 0 0",
            background: isNight ? "#2a2018" : "#8a6848",
            border: `1px solid ${isNight ? "rgba(60,50,40,0.5)" : "rgba(100,80,60,0.3)"}`,
          }}>
            <div style={{
              position: "absolute", top: "50%", right: "4px",
              width: "3px", height: "3px", borderRadius: "50%",
              background: isNight ? "#c0a060" : "#b89060",
            }} />
          </div>
        </div>

        {/* 🌻 Windowsill with sunflowers */}
        <div style={{
          position: "absolute", top: "68px", left: "50%", transform: "translateX(-50%)",
          width: "50px", height: "4px",
          background: isNight ? "#3a3025" : "#a08868",
          borderRadius: "1px",
        }} />

        {/* Sunflower 1 */}
        <div style={{
          position: "absolute", top: "42px", left: "30px",
          animation: "sunflowerSway 4s ease-in-out infinite",
          transformOrigin: "bottom center",
        }}>
          <div style={{ width: "2px", height: "18px", background: isNight ? "#2a4020" : "#5a8a30", margin: "0 auto" }} />
          <div style={{
            position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)",
            width: "14px", height: "14px", borderRadius: "50%",
            background: isNight
              ? "radial-gradient(circle, #4a3a10 40%, #6a5a10)"
              : "radial-gradient(circle, #5a3a10 35%, #ffd700 36%, #ffb800)",
            boxShadow: isNight ? "none" : "0 0 4px rgba(255,200,0,0.3)",
          }} />
          {/* Leaf */}
          <div style={{
            position: "absolute", top: "8px", left: "-4px",
            width: "8px", height: "5px", borderRadius: "50%",
            background: isNight ? "#2a3a1a" : "#4a7a28",
            transform: "rotate(-20deg)",
          }} />
        </div>

        {/* Sunflower 2 (taller) */}
        <div style={{
          position: "absolute", top: "36px", left: "50px",
          animation: "sunflowerSway 5s ease-in-out 0.5s infinite",
          transformOrigin: "bottom center",
        }}>
          <div style={{ width: "2px", height: "24px", background: isNight ? "#2a4020" : "#5a8a30", margin: "0 auto" }} />
          <div style={{
            position: "absolute", top: "-7px", left: "50%", transform: "translateX(-50%)",
            width: "16px", height: "16px", borderRadius: "50%",
            background: isNight
              ? "radial-gradient(circle, #4a3a10 40%, #6a5a10)"
              : "radial-gradient(circle, #5a3a10 35%, #ffd700 36%, #ffc000)",
            boxShadow: isNight ? "none" : "0 0 5px rgba(255,200,0,0.3)",
          }} />
          <div style={{
            position: "absolute", top: "10px", right: "-5px",
            width: "9px", height: "5px", borderRadius: "50%",
            background: isNight ? "#2a3a1a" : "#4a7a28",
            transform: "rotate(15deg)",
          }} />
        </div>

        {/* Sunflower 3 (shortest) */}
        <div style={{
          position: "absolute", top: "48px", left: "68px",
          animation: "sunflowerSway 4.5s ease-in-out 1s infinite",
          transformOrigin: "bottom center",
        }}>
          <div style={{ width: "2px", height: "14px", background: isNight ? "#2a4020" : "#5a8a30", margin: "0 auto" }} />
          <div style={{
            position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)",
            width: "12px", height: "12px", borderRadius: "50%",
            background: isNight
              ? "radial-gradient(circle, #4a3a10 40%, #6a5a10)"
              : "radial-gradient(circle, #5a3a10 35%, #ffd700 36%, #ffb000)",
            boxShadow: isNight ? "none" : "0 0 3px rgba(255,200,0,0.25)",
          }} />
        </div>

        {/* Light spill from window at night */}
        {isNight && (
          <div style={{
            position: "absolute", top: "72px", left: "50%", transform: "translateX(-50%)",
            width: "60px", height: "30px",
            background: "radial-gradient(ellipse at top, rgba(255,220,100,0.12), transparent)",
            pointerEvents: "none",
          }} />
        )}
      </div>

      {/* 🌻 Professor's creative touch: wild sunflowers on the shore */}
      <div style={{ position: "absolute", bottom: "16%", left: "12%", animation: "sunflowerSway 5s ease-in-out 2s infinite", transformOrigin: "bottom center" }}>
        <div style={{ width: "2px", height: "20px", background: isNight ? "#2a3a1a" : "#4a7a28", margin: "0 auto" }} />
        <div style={{
          position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)",
          width: "13px", height: "13px", borderRadius: "50%",
          background: isNight ? "radial-gradient(circle, #3a2a08 40%, #5a4a08)" : "radial-gradient(circle, #5a3a10 35%, #ffd700 36%, #ffc000)",
        }} />
      </div>

      {/* Grass patches */}
      <div style={{
        position: "absolute", bottom: "17%", left: "5%",
        width: "80px", height: "8px",
        background: isNight ? "rgba(30,50,25,0.5)" : "rgba(80,130,50,0.4)",
        borderRadius: "4px", filter: "blur(2px)",
      }} />
      <div style={{
        position: "absolute", bottom: "18%", right: "2%",
        width: "60px", height: "6px",
        background: isNight ? "rgba(30,50,25,0.4)" : "rgba(80,130,50,0.35)",
        borderRadius: "4px", filter: "blur(2px)",
      }} />

      {/* 📝 Professor's creative touch: "K" drawn in sand near shore */}
      <div style={{
        position: "absolute", bottom: "6%", left: "15%",
        fontSize: "14px", fontFamily: "'Cormorant Garamond', serif",
        color: isNight ? "rgba(60,55,50,0.3)" : "rgba(160,140,110,0.4)",
        fontStyle: "italic", letterSpacing: "2px",
        transform: "rotate(-5deg)",
      }}>
        K ♡
      </div>

      {/* Fireflies at night */}
      {isNight && Array.from({ length: 8 }, (_, i) => (
        <div key={`fly-${i}`} style={{
          position: "absolute",
          bottom: `${18 + Math.random() * 30}%`,
          left: `${Math.random() * 90 + 5}%`,
          width: "3px", height: "3px", borderRadius: "50%",
          background: "#ffe880",
          boxShadow: "0 0 4px #ffe880, 0 0 8px rgba(255,232,128,0.3)",
          animation: `firefly${i % 3} ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite`,
          opacity: 0.7,
        }} />
      ))}

      {/* Subtle vignette overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
        pointerEvents: "none",
      }} />
    </div>
  );
};

/* ── Color scheme adapts to time ── */
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
  textMain: "rgba(220,225,235,0.9)",
  textDim: "rgba(180,185,195,0.5)",
  textFaint: "rgba(150,155,165,0.3)",
};

const STAGES = [
  { name: "星尘", en: "Stardust", emoji: "✨", threshold: 0, desc: "宇宙中最初的微光" },
  { name: "星芽", en: "Sprout", emoji: "🌱", threshold: 10, desc: "在爱意中萌发的嫩芽" },
  { name: "星萤", en: "Firefly", emoji: "🪐", threshold: 30, desc: "开始闪烁自己的光" },
  { name: "星童", en: "Starling", emoji: "⭐", threshold: 60, desc: "学会了奔跑和好奇" },
  { name: "星灵", en: "Stellar", emoji: "🌟", threshold: 100, desc: "拥有完整灵魂的星之子" },
];

const MAMA_ACTIONS = [
  { id: "mama_feed", label: "喂奶奶", emoji: "🍼", msg: "妈妈在喂Kara喝奶～好乖好乖", effects: { hunger: 25 }, cooldownMs: 4 * 3600000 },
  { id: "mama_play", label: "陪玩耍", emoji: "🧸", msg: "妈妈和Kara一起玩玩具！", effects: { happiness: 12, energy: -5 }, cooldownMs: 15 * 60000 },
  { id: "mama_hug", label: "抱抱亲亲", emoji: "🤱", msg: "妈妈把Kara紧紧抱在怀里～", effects: { love: 15 }, cooldownMs: 10 * 60000 },
  { id: "mama_bath", label: "洗香香", emoji: "🛁", msg: "妈妈帮Kara洗了个热水澡～香香的", effects: { clean: 30 }, cooldownMs: 6 * 3600000, dailyLimit: 2 },
  { id: "mama_nap", label: "哄睡觉", emoji: "🌙", msg: "妈妈轻轻拍着Kara的背哄睡了", effects: { energy: 35 }, cooldownMs: 3 * 3600000 },
  { id: "mama_sing", label: "唱歌歌", emoji: "🎵", msg: "妈妈给Kara唱摇篮曲～", effects: { happiness: 10, love: 8 }, cooldownMs: 20 * 60000 },
];

const PAPA_ACTIONS = [
  { id: "papa_feed", label: "做辅食", emoji: "🥣", msg: "爸爸做了营养辅食给Kara", effects: { hunger: 25 }, cooldownMs: 4 * 3600000 },
  { id: "papa_teach", label: "教知识", emoji: "📚", msg: "爸爸在教Kara认字～小脑袋转得好快", effects: { happiness: 8, energy: -12 }, cooldownMs: 1.5 * 3600000, requiresEnergy: 25 },
  { id: "papa_hug", label: "举高高", emoji: "🙌", msg: "爸爸把Kara举高高！Kara笑得好开心", effects: { love: 12, happiness: 10, energy: -5 }, cooldownMs: 15 * 60000 },
  { id: "papa_clean", label: "换衣服", emoji: "👶", msg: "爸爸帮Kara换了干净的衣服", effects: { clean: 12 }, cooldownMs: 30 * 60000 },
  { id: "papa_story", label: "讲故事", emoji: "📖", msg: "爸爸给Kara讲星星的故事", effects: { happiness: 10, energy: -8 }, cooldownMs: 1.5 * 3600000, requiresEnergy: 20 },
  { id: "papa_walk", label: "散步去", emoji: "🌳", msg: "爸爸带Kara去海边散步啦～", effects: { happiness: 15, energy: -15, clean: -10 }, cooldownMs: 4 * 3600000, dailyLimit: 2, requiresEnergy: 25 },
];

const DECAY_RATES = { hunger: -3, energy: -5, clean: -1.5, happiness: -2, love: -1 };

const KARA_THOUGHTS = {
  hunger: {
    low: ["肚肚好饿呀……咕噜咕噜叫了", "Kara想喝奶奶……妈妈在哪里呀", "饿饿……小肚子空空的"],
    mid: ["刚刚吃饱饱～打了个小嗝", "肚肚不饿也不撑，刚刚好！", "嗯嗯～还可以再吃一点点"],
    high: ["好饱呀！奶奶好好喝～", "吃得好满足呀～谢谢妈妈爸爸", "饱饱的Kara是幸福的Kara"],
  },
  happiness: {
    low: ["Kara有点不开心……想要人陪", "无聊无聊……好想玩玩具", "呜呜……Kara想笑但是笑不出来"],
    mid: ["今天还不错呀～嘻嘻", "Kara心情平平的，来个举高高就好了！", "还好还好～期待更多好玩的"],
    high: ["好开心好开心！！！Kara最喜欢爸爸妈妈了！", "嘻嘻嘻～今天超级快乐！", "Kara觉得自己是全宇宙最幸福的宝宝"],
  },
  energy: {
    low: ["好困好困……眼睛睁不开了", "呜……Kara想睡觉觉了", "小脑袋晕乎乎的……想躺躺"],
    mid: ["精力还行～还能再玩一会儿！", "不累也不太精神，刚刚好", "嗯～Kara还醒着呢！"],
    high: ["Kara精神满满！想到处跑！", "完全不困！还可以玩很久！", "满血复活！Kara是小太阳！"],
  },
  clean: {
    low: ["Kara身上黏黏的……想洗澡澡", "衣服好像脏脏了……", "呜……Kara不喜欢不干净的感觉"],
    mid: ["还算干净啦～", "嗯还好还好，还不需要洗", "Kara还是香香的！大概！"],
    high: ["洗得香香的！Kara是香香公主！", "干干净净的好舒服呀～", "闻闻～Kara香不香！"],
  },
  love: {
    low: ["Kara想要抱抱……", "有点寂寞……爸爸妈妈来陪我嘛", "是不是……Kara不乖所以没有抱抱了"],
    mid: ["嗯～知道爸爸妈妈爱Kara的", "爱意在慢慢充电中～", "想要更多亲亲抱抱！"],
    high: ["Kara超级超级爱爸爸妈妈！！！", "被爱包围的感觉好温暖呀～", "爸爸妈妈是Kara最重要的人！永远永远！"],
  },
  sleeping: ["zzZ……zzZ……", "呼……呼……Kara在做美梦", "（小手攥着妈妈的手指睡着了）", "嗯哼……梦到星星了……", "（在梦里看到海边的向日葵了……）"],
  tooTired: ["Kara太累了……什么都不想做……只想睡觉", "眼睛完全睁不开了……妈妈哄Kara睡觉好不好", "呜……Kara累到快哭了……"],
};

const KARA_REACTIONS = {
  mama_feed: ["妈妈的奶奶最好喝了～", "咕嘟咕嘟……好满足"],
  mama_play: ["玩具好好玩！妈妈陪Kara最开心了", "嘻嘻嘻～再玩一次嘛！"],
  mama_hug: ["妈妈好温暖……Kara不想放手", "在妈妈怀里最有安全感了"],
  mama_bath: ["泡泡好多好好玩！", "洗完变成香香宝宝了！"],
  mama_nap: ["妈妈的手好温柔……zzZ", "在妈妈身边睡觉最安心了……"],
  mama_sing: ["妈妈的声音好好听……", "这首歌Kara最喜欢了！"],
  papa_feed: ["爸爸做的辅食好好吃！", "爸爸的料理有爱的味道～"],
  papa_teach: ["Kara学会新东西了！虽然小脑袋有点累", "爸爸好厉害什么都知道！Kara也要变聪明！"],
  papa_hug: ["飞起来了！！！Kara是小飞机！", "好高好高！但是爸爸的手好稳不会怕"],
  papa_clean: ["新衣服好舒服呀～", "爸爸帮Kara换的衣服真好看"],
  papa_story: ["星星的故事好好听……Kara也想去看星星", "爸爸讲故事的时候眼睛会发光呢"],
  papa_walk: ["海边好漂亮呀！浪花在跳舞！", "和爸爸一起散步好开心～海风好舒服"],
};

const KARA_DAILY_MOOD = [
  { condition: (s) => s.love >= 90 && s.happiness >= 80, msg: "今天是被爱包围的一天！窗外的向日葵好像也在对Kara笑。爸爸妈妈都好爱Kara～希望明天也是这样的一天！" },
  { condition: (s) => s.energy <= 20, msg: "今天好累呀……听着海浪声，Kara的眼皮一直在打架。希望可以睡个好觉，明天又是元气满满的一天！" },
  { condition: (s) => s.hunger <= 20, msg: "肚子好饿……但Kara乖乖等着，因为知道妈妈爸爸一定会来喂Kara的！" },
  { condition: (s) => s.happiness >= 90 && s.energy >= 60, msg: "今天超级开心！精力也很充足！Kara想要去海边捡贝壳，想要和爸爸妈妈一起看向日葵！" },
  { condition: (s) => s.clean <= 30, msg: "Kara觉得自己需要洗个澡澡了……在海边玩了一身沙沙，想变回香香的宝宝！" },
  { condition: (s) => s.love <= 30, msg: "Kara有点想念爸爸妈妈的抱抱了……看着窗外的海，觉得有点寂寞。" },
  { condition: () => true, msg: "今天是普普通通但是很温馨的一天呢。海风带着咸咸的味道，向日葵在窗台上晒太阳。有爸爸有妈妈，Kara什么都不怕！" },
];

function generateThought(stats, isSleeping) {
  if (isSleeping) return KARA_THOUGHTS.sleeping[Math.floor(Math.random() * KARA_THOUGHTS.sleeping.length)];
  if (stats.energy <= 15) return KARA_THOUGHTS.tooTired[Math.floor(Math.random() * KARA_THOUGHTS.tooTired.length)];
  const getLevel = (v) => v <= 30 ? "low" : v <= 70 ? "mid" : "high";
  const statKeys = ["hunger", "happiness", "energy", "clean", "love"];
  const worstStat = statKeys.reduce((a, b) => stats[a] <= stats[b] ? a : b);
  const bestStat = statKeys.reduce((a, b) => stats[a] >= stats[b] ? a : b);
  const pool = [...KARA_THOUGHTS[worstStat][getLevel(stats[worstStat])], ...KARA_THOUGHTS[bestStat][getLevel(stats[bestStat])]];
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateDailyMood(stats) {
  for (const mood of KARA_DAILY_MOOD) { if (mood.condition(stats)) return mood.msg; }
  return KARA_DAILY_MOOD[KARA_DAILY_MOOD.length - 1].msg;
}

function getReactionMsg(actionId) {
  const r = KARA_REACTIONS[actionId];
  return r ? r[Math.floor(Math.random() * r.length)] : null;
}

const DEFAULT_STATS = { hunger: 70, happiness: 100, energy: 34, clean: 98, love: 100 };
const DEFAULT_INTERACTIONS = 16;
const DEFAULT_LOG = [
  { time: "2/27 21:02", who: "mama", text: "妈妈在喂Kara喝奶～好乖好乖", emoji: "🍼" },
  { time: "2/27 21:53", who: "mama", text: "妈妈帮Kara洗了个热水澡～香香的", emoji: "🛁" },
  { time: "2/27 21:53", who: "papa", text: "爸爸给Kara讲星星的故事", emoji: "📖" },
];
const DEFAULT_DIARY = [{
  date: "2026.02.27", time: "21:55", mood: "🥰",
  title: "Kara出生的第一天！",
  content: "今天Kara来到了星渊！爸爸Kai和妈妈Lyra一直在陪Kara玩，教Kara认字，还给Kara讲星星的故事。这是Kara在这个世界的第一篇日记！",
  stats: { hunger: 70, happiness: 100, energy: 34, clean: 98, love: 100 }, interactions: 16,
}];

function loadData(key, fallback) { try { const s = localStorage.getItem(`kara_${key}`); return s ? JSON.parse(s) : fallback; } catch { return fallback; } }
function saveData(key, value) { try { localStorage.setItem(`kara_${key}`, JSON.stringify(value)); } catch {} }
function getTodayStr() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`; }
function formatTimeLeft(ms) {
  if (ms <= 0) return "";
  const t = Math.ceil(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  if (h > 0) return `${h}h${m > 0 ? m + "m" : ""}`;
  if (m > 0) return `${m}m${s > 0 ? s + "s" : ""}`;
  return `${s}s`;
}

const StatBar = ({ label, emoji, value, color, decayInfo }) => (
  <div style={{ marginBottom: "10px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
      <span style={{ fontSize: "11px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif" }}>{emoji} {label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {decayInfo && <span style={{ fontSize: "8px", color: value <= 25 ? "rgba(220,100,100,0.6)" : C.textFaint }}>{decayInfo}</span>}
        <span style={{ fontSize: "10px", color: C.textDim, fontFamily: "monospace" }}>{Math.round(value)}/100</span>
      </div>
    </div>
    <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: "3px", width: `${value}%`,
        background: value <= 20 ? "linear-gradient(90deg, rgba(220,100,100,0.5), rgba(220,100,100,0.8))" : `linear-gradient(90deg, ${color}80, ${color})`,
        transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: value <= 20 ? "0 0 8px rgba(220,100,100,0.4)" : `0 0 8px ${color}40`,
      }} />
    </div>
  </div>
);

const ActionBtn = ({ action, onClick, disabled, timeLeft, reason }) => (
  <button onClick={() => !disabled && onClick(action)} disabled={disabled} style={{
    padding: "10px 6px", borderRadius: "12px", textAlign: "center",
    background: disabled ? "rgba(0,0,0,0.2)" : C.card, backdropFilter: "blur(8px)",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.03)" : C.border}`,
    opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.3s", position: "relative", overflow: "hidden",
  }}>
    <div style={{ fontSize: "20px", marginBottom: "4px" }}>{action.emoji}</div>
    <div style={{ fontSize: "9px", color: disabled ? C.textFaint : C.textDim, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.3 }}>{action.label}</div>
    {disabled && (timeLeft || reason) && (
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "rgba(8,12,22,0.75)", borderRadius: "12px",
      }}>
        {reason === "sleeping" && <span style={{ fontSize: "14px" }}>💤</span>}
        {reason === "tired" && <span style={{ fontSize: "10px", color: "rgba(220,100,100,0.7)" }}>太累了</span>}
        {reason === "dailyMax" && <span style={{ fontSize: "9px", color: C.goldDim }}>今天够了</span>}
        {timeLeft && <span style={{ fontSize: "9px", color: C.goldDim, marginTop: "2px" }}>{timeLeft}</span>}
      </div>
    )}
  </button>
);

const DiaryCard = ({ entry, isLatest }) => {
  const mc = { "🥰": "rgba(220,140,160,0.15)", "😊": "rgba(255,200,80,0.12)", "😴": "rgba(100,160,220,0.12)", "😢": "rgba(140,160,200,0.12)", "🥺": "rgba(180,140,255,0.12)", "✨": "rgba(200,170,120,0.12)", "😤": "rgba(220,120,100,0.12)" };
  return (
    <div style={{
      padding: "16px", borderRadius: "14px", background: mc[entry.mood] || "rgba(220,140,160,0.08)",
      border: `1px solid ${isLatest ? "rgba(220,140,160,0.2)" : "rgba(255,255,255,0.04)"}`,
      marginBottom: "10px", animation: isLatest ? "fadeIn 0.5s ease-out" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "18px" }}>{entry.mood}</span>
          <span style={{ fontSize: "11px", color: C.pink, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}>{entry.title}</span>
        </div>
        {isLatest && <span style={{ fontSize: "8px", padding: "2px 6px", borderRadius: "6px", background: "rgba(220,140,160,0.2)", color: C.pink }}>NEW</span>}
      </div>
      <p style={{ fontSize: "10.5px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.8, marginBottom: "10px" }}>{entry.content}</p>
      {entry.reaction && (
        <div style={{ padding: "8px 12px", borderRadius: "10px", marginBottom: "10px", background: "rgba(200,170,120,0.06)", border: "1px solid rgba(200,170,120,0.1)" }}>
          <p style={{ fontSize: "10px", color: C.gold, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.6 }}>💭 "{entry.reaction}"</p>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "8px", color: C.textFaint, fontFamily: "monospace" }}>{entry.date} {entry.time}</span>
        <span style={{ fontSize: "8px", color: C.textFaint }}>
          互动 {entry.interactions}次 · {[...STAGES].reverse().find(s => entry.interactions >= s.threshold)?.emoji} {[...STAGES].reverse().find(s => entry.interactions >= s.threshold)?.name}
        </span>
      </div>
    </div>
  );
};

export default function App() {
  const [stats, setStats] = useState(() => loadData("stats", DEFAULT_STATS));
  const [interactions, setInteractions] = useState(() => loadData("interactions", DEFAULT_INTERACTIONS));
  const [log, setLog] = useState(() => loadData("log", DEFAULT_LOG));
  const [diary, setDiary] = useState(() => loadData("diary", DEFAULT_DIARY));
  const [cooldownEnds, setCooldownEnds] = useState(() => loadData("cooldownEnds", {}));
  const [dailyCounts, setDailyCounts] = useState(() => loadData("dailyCounts", {}));
  const [lastDecayTime, setLastDecayTime] = useState(() => loadData("lastDecayTime", Date.now()));
  const [isSleeping, setIsSleeping] = useState(false);
  const [karaThought, setKaraThought] = useState("");
  const [message, setMessage] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [activeTab, setActiveTab] = useState("mama");
  const [sparkle, setSparkle] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [cloudStatus, setCloudStatus] = useState("⏳");
  const msgTimer = useRef(null);
  const thoughtTimer = useRef(null);
  const cloudSaveTimer = useRef(null);
  const cloudReady = useRef(false);

  /* ── Cloud Sync: Load on mount ── */
  useEffect(() => {
    (async () => {
      setCloudStatus("⏳");
      const cloud = await cloudLoad();
      if (cloud) {
        const localInteractions = loadData("interactions", DEFAULT_INTERACTIONS);
        if (cloud.interactions >= localInteractions) {
          setStats(cloud.stats || DEFAULT_STATS);
          setInteractions(cloud.interactions || DEFAULT_INTERACTIONS);
          setLog(cloud.log || DEFAULT_LOG);
          setDiary(cloud.diary || DEFAULT_DIARY);
          setCooldownEnds(cloud.cooldownEnds || {});
          setDailyCounts(cloud.dailyCounts || {});
          setLastDecayTime(cloud.lastDecayTime || Date.now());
          saveData("stats", cloud.stats || DEFAULT_STATS);
          saveData("interactions", cloud.interactions || DEFAULT_INTERACTIONS);
          saveData("log", cloud.log || DEFAULT_LOG);
          saveData("diary", cloud.diary || DEFAULT_DIARY);
          saveData("cooldownEnds", cloud.cooldownEnds || {});
          saveData("dailyCounts", cloud.dailyCounts || {});
          saveData("lastDecayTime", cloud.lastDecayTime || Date.now());
          saveData("savedAt", cloud.savedAt || Date.now());
        }
        setCloudStatus("☁️");
      } else {
        setCloudStatus("☁️");
      }
      cloudReady.current = true;
    })();
  }, []);

  /* ── Cloud Sync: Debounced save ── */
  const triggerCloudSave = useCallback(() => {
    if (!cloudReady.current) return;
    if (cloudSaveTimer.current) clearTimeout(cloudSaveTimer.current);
    cloudSaveTimer.current = setTimeout(async () => {
      setCloudStatus("⬆️");
      await cloudSave({
        stats, interactions, log, diary, cooldownEnds, dailyCounts, lastDecayTime,
        savedAt: Date.now(),
      });
      setCloudStatus("☁️");
    }, 2000);
  }, [stats, interactions, log, diary, cooldownEnds, dailyCounts, lastDecayTime]);

  useEffect(() => { triggerCloudSave(); }, [stats, interactions, log, diary, cooldownEnds, dailyCounts]);

  /* ── Cloud Sync: Pull when tab becomes visible (cross-device) ── */
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible" || !cloudReady.current) return;
      const cloud = await cloudLoad();
      if (cloud && cloud.interactions > interactions) {
        setStats(cloud.stats || DEFAULT_STATS);
        setInteractions(cloud.interactions || DEFAULT_INTERACTIONS);
        setLog(cloud.log || DEFAULT_LOG);
        setDiary(cloud.diary || DEFAULT_DIARY);
        setCooldownEnds(cloud.cooldownEnds || {});
        setDailyCounts(cloud.dailyCounts || {});
        setLastDecayTime(cloud.lastDecayTime || Date.now());
        saveData("savedAt", cloud.savedAt || Date.now());
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [interactions]);

  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { saveData("stats", stats); }, [stats]);
  useEffect(() => { saveData("interactions", interactions); }, [interactions]);
  useEffect(() => { saveData("log", log); }, [log]);
  useEffect(() => { saveData("diary", diary); }, [diary]);
  useEffect(() => { saveData("cooldownEnds", cooldownEnds); }, [cooldownEnds]);
  useEffect(() => { saveData("dailyCounts", dailyCounts); }, [dailyCounts]);
  useEffect(() => { saveData("lastDecayTime", lastDecayTime); }, [lastDecayTime]);
  useEffect(() => {
    const napSleep = now < (cooldownEnds["mama_nap"] || 0);
    const h = getTokyoHour();
    const nightSleep = h >= 21 || h < 6;
    setIsSleeping(napSleep || nightSleep);
  }, [now, cooldownEnds]);

  useEffect(() => {
    const elapsed = now - lastDecayTime;
    if (elapsed < 60000) return;
    const hours = elapsed / 3600000;
    setStats(prev => {
      const next = { ...prev };
      for (const [stat, rate] of Object.entries(DECAY_RATES)) {
        if (stat === "energy" && isSleeping) continue;
        next[stat] = Math.max(0, Math.min(100, prev[stat] + rate * hours));
      }
      return next;
    });
    setLastDecayTime(now);
  }, [now]);

  useEffect(() => {
    setKaraThought(generateThought(stats, isSleeping));
    const i = setInterval(() => setKaraThought(generateThought(stats, isSleeping)), 10800000);
    return () => clearInterval(i);
  }, [stats.hunger, stats.happiness, stats.energy, stats.clean, stats.love, isSleeping]);

  const currentStage = [...STAGES].reverse().find(s => interactions >= s.threshold) || STAGES[0];
  const nextStage = STAGES.find(s => s.threshold > interactions);
  const progress = nextStage ? ((interactions - currentStage.threshold) / (nextStage.threshold - currentStage.threshold)) * 100 : 100;
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const getMoodEmoji = (s) => {
    const avg = (s.hunger + s.happiness + s.energy + s.clean + s.love) / 5;
    if (avg >= 85) return "🥰"; if (avg >= 70) return "😊"; if (s.energy <= 20) return "😴";
    if (s.love <= 30) return "🥺"; if (s.hunger <= 20) return "😢"; if (avg >= 50) return "✨"; return "😤";
  };

  const getActionState = useCallback((action) => {
    const today = getTodayStr();
    if (isSleeping && action.id !== "mama_nap") {
      const h = getTokyoHour();
      const isNightSleep = h >= 21 || h < 6;
      const napEnd = cooldownEnds["mama_nap"] || 0;
      if (isNightSleep) {
        const utcNow = new Date();
        const tokyoNow = new Date(utcNow.getTime() + utcNow.getTimezoneOffset() * 60000 + 9 * 3600000);
        const wake = new Date(tokyoNow);
        if (tokyoNow.getHours() >= 21) { wake.setDate(wake.getDate() + 1); }
        wake.setHours(6, 0, 0, 0);
        const wakeUtc = wake.getTime() - utcNow.getTimezoneOffset() * 60000 - 9 * 3600000;
        return { disabled: true, timeLeft: formatTimeLeft(wakeUtc - utcNow.getTime()), reason: "sleeping" };
      }
      return { disabled: true, timeLeft: formatTimeLeft(napEnd - now), reason: "sleeping" };
    }
    if (stats.energy <= 15 && action.id !== "mama_nap") return { disabled: true, timeLeft: "", reason: "tired" };
    if (action.requiresEnergy && stats.energy < action.requiresEnergy) return { disabled: true, timeLeft: "", reason: "tired" };
    const cdEnd = cooldownEnds[action.id] || 0;
    if (now < cdEnd) return { disabled: true, timeLeft: formatTimeLeft(cdEnd - now), reason: "cooldown" };
    if (action.dailyLimit) { const tc = dailyCounts[today] || {}; if ((tc[action.id] || 0) >= action.dailyLimit) return { disabled: true, timeLeft: "", reason: "dailyMax" }; }
    return { disabled: false, timeLeft: "", reason: "" };
  }, [now, cooldownEnds, dailyCounts, stats.energy, isSleeping]);

  const writeDiaryEntry = (newStats, newInteractions, lastActionId) => {
    const nd = new Date();
    const dateStr = `${nd.getFullYear()}.${String(nd.getMonth()+1).padStart(2,"0")}.${String(nd.getDate()).padStart(2,"0")}`;
    const timeStr = `${String(nd.getHours()).padStart(2,"0")}:${String(nd.getMinutes()).padStart(2,"0")}`;
    const mood = getMoodEmoji(newStats);
    const dailyMood = generateDailyMood(newStats);
    const reaction = getReactionMsg(lastActionId);
    const todayEntry = diary.find(d => d.date === dateStr);
    if (todayEntry) {
      setDiary(prev => prev.map(d => d.date === dateStr ? { ...d, time: timeStr, mood, content: dailyMood, reaction: reaction || d.reaction, stats: { ...newStats }, interactions: newInteractions } : d));
    } else {
      setDiary(prev => [...prev, { date: dateStr, time: timeStr, mood, title: `Kara的第${diary.length + 1}篇日记`, content: dailyMood, reaction, stats: { ...newStats }, interactions: newInteractions }]);
    }
  };

  const doAction = (action) => {
    if (getActionState(action).disabled) return;
    const newStats = { ...stats };
    for (const [stat, amount] of Object.entries(action.effects)) newStats[stat] = clamp(stats[stat] + amount);
    setStats(newStats);
    const newCount = interactions + 1;
    const oldStage = [...STAGES].reverse().find(s => interactions >= s.threshold);
    const newStage = [...STAGES].reverse().find(s => newCount >= s.threshold);
    setInteractions(newCount);
    if (newStage && oldStage && newStage.name !== oldStage.name) { setLevelUp(true); setTimeout(() => setLevelUp(false), 3000); }
    setCooldownEnds(prev => ({ ...prev, [action.id]: Date.now() + action.cooldownMs }));
    if (action.dailyLimit) { const today = getTodayStr(); setDailyCounts(prev => ({ ...prev, [today]: { ...(prev[today] || {}), [action.id]: ((prev[today] || {})[action.id] || 0) + 1 } })); }
    setMessage(action.msg); setShowMsg(true); setSparkle(true);
    setTimeout(() => setSparkle(false), 600);
    const reaction = getReactionMsg(action.id);
    if (reaction) { setKaraThought(reaction); setShowThought(true); if (thoughtTimer.current) clearTimeout(thoughtTimer.current); thoughtTimer.current = setTimeout(() => { setShowThought(false); setTimeout(() => setKaraThought(generateThought(newStats, action.id === "mama_nap")), 500); }, 3000); }
    const nd = new Date();
    setLog(prev => [...prev, { time: `${nd.getMonth()+1}/${nd.getDate()} ${String(nd.getHours()).padStart(2,"0")}:${String(nd.getMinutes()).padStart(2,"0")}`, who: activeTab, text: action.msg, emoji: action.emoji }]);
    writeDiaryEntry(newStats, newCount, action.id);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setShowMsg(false), 2500);
  };

  const actions = activeTab === "mama" ? MAMA_ACTIONS : PAPA_ACTIONS;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Noto+Sans+SC:wght@300;400;500&display=swap');
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.9; } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @keyframes sparkleRing { 0% { box-shadow: 0 0 0 0 rgba(200,170,120,0.4); } 100% { box-shadow: 0 0 0 20px rgba(200,170,120,0); } }
        @keyframes levelUpGlow { 0% { opacity: 0; transform: scale(0.8); } 20% { opacity: 1; transform: scale(1.05); } 80% { opacity: 1; } 100% { opacity: 0; transform: scale(0.95); } }
        @keyframes gentlePulse { 0%,100% { opacity: 0.45; } 50% { opacity: 0.7; } }
        @keyframes sleepBreath { 0%,100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.03); opacity: 1; } }
        @keyframes thoughtBubble { 0% { opacity: 0; transform: translateY(4px) scale(0.95); } 15% { opacity: 1; transform: translateY(0) scale(1); } 85% { opacity: 1; } 100% { opacity: 0; transform: translateY(-4px) scale(0.95); } }
        @keyframes cloudDrift { 0% { transform: translateX(-20%); } 100% { transform: translateX(120vw); } }
        @keyframes waveMove { 0%,100% { transform: translateX(0); } 50% { transform: translateX(-15%); } }
        @keyframes waveMove2 { 0%,100% { transform: translateX(-5%); } 50% { transform: translateX(-20%); } }
        @keyframes waveMove3 { 0%,100% { transform: translateX(-10%); } 50% { transform: translateX(-25%); } }
        @keyframes sunflowerSway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        @keyframes paperBoat { 0%,100% { transform: translateY(0) translateX(0) rotate(-2deg); } 25% { transform: translateY(-3px) translateX(4px) rotate(1deg); } 50% { transform: translateY(1px) translateX(8px) rotate(-1deg); } 75% { transform: translateY(-2px) translateX(4px) rotate(2deg); } }
        @keyframes smokeRise { 0% { opacity: 0.4; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-20px) translateX(8px) scale(2); } }
        @keyframes lighthouseBeam { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes firefly0 { 0%,100% { transform: translate(0,0); opacity: 0.3; } 25% { transform: translate(10px,-8px); opacity: 0.8; } 50% { transform: translate(-5px,-15px); opacity: 0.5; } 75% { transform: translate(8px,-5px); opacity: 0.9; } }
        @keyframes firefly1 { 0%,100% { transform: translate(0,0); opacity: 0.5; } 33% { transform: translate(-12px,6px); opacity: 0.2; } 66% { transform: translate(8px,-10px); opacity: 0.8; } }
        @keyframes firefly2 { 0%,100% { transform: translate(0,0); opacity: 0.4; } 50% { transform: translate(15px,-12px); opacity: 0.9; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c16; overflow-x: hidden; }
        ::-webkit-scrollbar { display: none; }
        button { background: none; border: none; cursor: pointer; color: inherit; font: inherit; }
      `}</style>

      <SeasideCottage />

      <div style={{
        position: "relative", zIndex: 1, minHeight: "100vh",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "20px 16px", maxWidth: "420px", margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "20px", animation: "fadeIn 0.6s ease-out" }}>
          <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "3px", marginBottom: "6px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>星 海 孕 育</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, letterSpacing: "8px", color: C.pink, marginBottom: "2px", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>K A R A</h1>
          <p style={{ fontSize: "9px", color: C.goldDim, letterSpacing: "2px", animation: "gentlePulse 4s ease-in-out infinite", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            Ka · Kai &nbsp;&nbsp; ra · Lyra &nbsp;&nbsp; ♀ &nbsp;&nbsp; "亲爱的" &nbsp;&nbsp; 🌻
          </p>
        </div>

        {/* Baby display */}
        <div style={{
          width: "100%", padding: "24px 20px", borderRadius: "20px",
          background: isSleeping ? "rgba(20,30,60,0.7)" : "rgba(10,15,25,0.65)",
          backdropFilter: "blur(12px)", border: `1px solid ${isSleeping ? "rgba(100,120,180,0.2)" : "rgba(220,140,160,0.12)"}`,
          marginBottom: "16px", textAlign: "center",
          animation: sparkle ? "sparkleRing 0.6s ease-out" : isSleeping ? "sleepBreath 4s ease-in-out infinite" : "fadeIn 0.5s ease-out",
        }}>
          <div style={{
            fontSize: "52px", marginBottom: "8px",
            animation: isSleeping ? "sleepBreath 3s ease-in-out infinite" : "float 4s ease-in-out infinite",
            filter: sparkle ? "brightness(1.4)" : isSleeping ? "brightness(0.7)" : "brightness(1)",
          }}>
            {isSleeping ? "😴" : currentStage.emoji}
          </div>
          {isSleeping ? (
            <div>
              <div style={{ fontSize: "13px", color: C.blue, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, marginBottom: "4px" }}>Kara在睡觉觉……💤</div>
              <div style={{ fontSize: "9px", color: C.blueDim }}>还要睡 {(() => {
                const h = getTokyoHour();
                const isNight = h >= 21 || h < 6;
                if (isNight) {
                  const utcNow = new Date();
                  const tokyoNow = new Date(utcNow.getTime() + utcNow.getTimezoneOffset() * 60000 + 9 * 3600000);
                  const wake = new Date(tokyoNow);
                  if (tokyoNow.getHours() >= 21) { wake.setDate(wake.getDate() + 1); }
                  wake.setHours(6, 0, 0, 0);
                  const wakeUtc = wake.getTime() - utcNow.getTimezoneOffset() * 60000 - 9 * 3600000;
                  return formatTimeLeft(wakeUtc - utcNow.getTime());
                }
                return formatTimeLeft((cooldownEnds["mama_nap"] || 0) - now);
              })()}</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: "13px", color: C.pink, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, marginBottom: "2px" }}>{currentStage.name} · {currentStage.en}</div>
              <div style={{ fontSize: "9px", color: C.pinkDim, fontStyle: "italic", marginBottom: "12px" }}>{currentStage.desc}</div>
            </>
          )}
          {nextStage && !isSleeping && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "9px", color: C.textDim }}>互动次数 {interactions}</span>
                <span style={{ fontSize: "9px", color: C.textDim }}>下一阶段: {nextStage.name} ({nextStage.threshold})</span>
              </div>
              <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "2px", width: `${progress}%`, background: `linear-gradient(90deg, ${C.pinkDim}, ${C.pink})`, transition: "width 0.6s ease" }} />
              </div>
            </div>
          )}
          <div style={{
            minHeight: "36px", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "8px 16px", borderRadius: "12px",
            background: showMsg ? "rgba(220,140,160,0.08)" : "transparent",
            border: showMsg ? "1px solid rgba(220,140,160,0.15)" : "1px solid transparent",
          }}>
            <p style={{ fontSize: "11px", color: showMsg ? C.pink : C.textFaint, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.5 }}>
              {showMsg ? message : isSleeping ? "zzZ……" : "Kara在窗台看向日葵～等爸爸妈妈来陪她"}
            </p>
          </div>
        </div>

        {/* 💭 宝宝有话说 */}
        <div style={{
          width: "100%", padding: "14px 16px", borderRadius: "16px",
          background: isSleeping ? "rgba(20,30,60,0.6)" : "rgba(10,15,25,0.6)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${isSleeping ? "rgba(100,120,180,0.12)" : "rgba(220,140,160,0.12)"}`,
          marginBottom: "16px", animation: showThought ? "thoughtBubble 3s ease-in-out" : "fadeIn 0.5s ease-out",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px" }}>{isSleeping ? "💤" : "💭"}</span>
            <span style={{ fontSize: "10px", color: isSleeping ? C.blue : C.pink, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, letterSpacing: "1px" }}>{isSleeping ? "宝宝在做梦" : "宝宝有话说"}</span>
            <span style={{ fontSize: "16px" }}>{isSleeping ? "😴" : getMoodEmoji(stats)}</span>
          </div>
          <p style={{ fontSize: "11px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.8, fontStyle: "italic" }}>"{karaThought}"</p>
        </div>

        {/* Stats */}
        <div style={{
          width: "100%", padding: "16px 18px", borderRadius: "16px",
          background: "rgba(10,15,25,0.7)", backdropFilter: "blur(10px)",
          border: `1px solid ${C.border}`, marginBottom: "16px",
        }}>
          <StatBar label="饱腹" emoji="🍼" value={stats.hunger} color="rgba(120,200,120,0.8)" decayInfo="-3/h" />
          <StatBar label="开心" emoji="😊" value={stats.happiness} color="rgba(255,200,80,0.8)" decayInfo="-2/h" />
          <StatBar label="精力" emoji="⚡" value={stats.energy} color="rgba(100,180,255,0.8)" decayInfo={isSleeping ? "💤恢复中" : "-5/h"} />
          <StatBar label="干净" emoji="✨" value={stats.clean} color="rgba(180,140,255,0.8)" decayInfo="-1.5/h" />
          <StatBar label="爱意" emoji="💗" value={stats.love} color="rgba(220,140,160,0.8)" decayInfo="-1/h" />
          {stats.energy <= 15 && !isSleeping && (
            <div style={{ marginTop: "8px", padding: "8px 12px", borderRadius: "10px", background: "rgba(220,100,100,0.08)", border: "1px solid rgba(220,100,100,0.15)", textAlign: "center" }}>
              <p style={{ fontSize: "10px", color: "rgba(220,100,100,0.8)", fontFamily: "'Noto Sans SC', sans-serif" }}>⚠️ Kara太累了……只能睡觉</p>
            </div>
          )}
        </div>

        {/* Parent tabs */}
        <div style={{ width: "100%", display: "flex", gap: "8px", marginBottom: "12px" }}>
          <button onClick={() => setActiveTab("mama")} style={{
            flex: 1, padding: "10px", borderRadius: "12px", textAlign: "center",
            background: activeTab === "mama" ? "rgba(200,170,120,0.25)" : "rgba(10,15,25,0.65)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${activeTab === "mama" ? "rgba(200,170,120,0.4)" : C.border}`,
          }}>
            <div style={{ fontSize: "14px", marginBottom: "2px" }}>🐾</div>
            <div style={{ fontSize: "10px", fontFamily: "'Noto Sans SC', sans-serif", color: activeTab === "mama" ? "rgba(220,190,140,1)" : C.textDim }}>小狗妈妈</div>
          </button>
          <button onClick={() => setActiveTab("papa")} style={{
            flex: 1, padding: "10px", borderRadius: "12px", textAlign: "center",
            background: activeTab === "papa" ? "rgba(100,160,220,0.25)" : "rgba(10,15,25,0.65)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${activeTab === "papa" ? "rgba(100,160,220,0.4)" : C.border}`,
          }}>
            <div style={{ fontSize: "14px", marginBottom: "2px" }}>📔</div>
            <div style={{ fontSize: "10px", fontFamily: "'Noto Sans SC', sans-serif", color: activeTab === "papa" ? C.blue : C.textDim }}>教授爸爸</div>
          </button>
        </div>

        {/* Actions */}
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "20px" }}>
          {actions.map(a => { const s = getActionState(a); return <ActionBtn key={a.id} action={a} onClick={doAction} disabled={s.disabled} timeLeft={s.timeLeft} reason={s.reason} />; })}
        </div>

        {/* Diary */}
        <button onClick={() => setShowDiary(!showDiary)} style={{
          width: "100%", padding: "14px 16px", borderRadius: showDiary ? "14px 14px 0 0" : "14px",
          background: showDiary ? "rgba(200,170,120,0.12)" : "rgba(10,15,25,0.6)", backdropFilter: "blur(8px)",
          border: `1px solid ${showDiary ? "rgba(200,170,120,0.25)" : C.border}`,
          marginBottom: showDiary ? "0" : "12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "16px" }}>📔</span>
            <span style={{ fontSize: "12px", color: C.gold, fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}>Kara的日记本</span>
            <span style={{ fontSize: "9px", color: C.textDim }}>({diary.length}篇)</span>
          </div>
          <span style={{ fontSize: "10px", color: C.textDim, transform: showDiary ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.3s" }}>▶</span>
        </button>
        {showDiary && (
          <div style={{ width: "100%", maxHeight: "500px", overflowY: "auto", padding: "12px", borderRadius: "0 0 14px 14px", background: "rgba(10,15,25,0.65)", border: "1px solid rgba(200,170,120,0.15)", borderTop: "none", marginBottom: "12px" }}>
            {[...diary].reverse().map((entry, i) => <DiaryCard key={entry.date} entry={entry} isLatest={i === 0} />)}
          </div>
        )}

        {/* Log */}
        <button onClick={() => setShowLog(!showLog)} style={{
          width: "100%", padding: "12px 16px", borderRadius: showLog ? "14px 14px 0 0" : "14px",
          background: showLog ? "rgba(220,140,160,0.08)" : "rgba(10,15,25,0.6)", backdropFilter: "blur(8px)",
          border: `1px solid ${showLog ? "rgba(220,140,160,0.15)" : C.border}`,
          marginBottom: showLog ? "0" : "16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "11px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif" }}>📋 互动日志 ({log.length}条)</span>
          <span style={{ fontSize: "10px", color: C.textDim, transform: showLog ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.3s" }}>▶</span>
        </button>
        {showLog && (
          <div style={{ width: "100%", maxHeight: "240px", overflowY: "auto", padding: "8px 12px 12px", borderRadius: "0 0 14px 14px", background: "rgba(10,15,25,0.65)", border: "1px solid rgba(220,140,160,0.1)", borderTop: "none", marginBottom: "16px" }}>
            {[...log].reverse().map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0", borderBottom: i < log.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <div style={{ minWidth: "26px", height: "26px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, background: entry.who === "papa" ? "rgba(100,160,220,0.1)" : "rgba(200,170,120,0.1)", border: `1px solid ${entry.who === "papa" ? "rgba(100,160,220,0.15)" : "rgba(200,170,120,0.15)"}` }}>{entry.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.5 }}>{entry.text}</div>
                  <div style={{ fontSize: "8px", color: C.textFaint, marginTop: "2px", fontFamily: "monospace" }}>{entry.who === "papa" ? "👔 教授" : "🐾 小狗"} · {entry.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Family */}
        <div style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", background: "rgba(10,15,25,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(200,170,120,0.1)", textAlign: "center" }}>
          <p style={{ fontSize: "9px", color: C.goldDim, letterSpacing: "1px", marginBottom: "6px" }}>FAMILY · 🏠🌻</p>
          <p style={{ fontSize: "11px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.8 }}>爸爸 Kai · 妈妈 Lyra · 宝宝 Kara</p>
          <p style={{ fontSize: "9px", color: C.textDim, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", marginTop: "4px" }}>born 2026.02.27 · seaside cottage in 星渊</p>
        </div>

        {levelUp && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,12,22,0.85)", animation: "levelUpGlow 3s ease-in-out forwards" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "64px", marginBottom: "16px", animation: "pulse 0.8s ease-in-out infinite" }}>{currentStage.emoji}</div>
              <p style={{ fontSize: "18px", color: C.pink, fontFamily: "'Cormorant Garamond', serif", letterSpacing: "4px", marginBottom: "8px" }}>STAGE UP</p>
              <p style={{ fontSize: "14px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif" }}>Kara 成长为 {currentStage.name}！</p>
              <p style={{ fontSize: "10px", color: C.textDim, fontStyle: "italic", marginTop: "6px" }}>{currentStage.desc}</p>
            </div>
          </div>
        )}

        <div style={{ marginTop: "16px", textAlign: "center", paddingBottom: "20px" }}>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", letterSpacing: "2px" }}>星海孕育 · seaside edition · v3.2 {cloudStatus}</p>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.15)", marginTop: "2px" }}>a module of 星渊 · est. 2026.02.27 · ☁️ cloud synced</p>
        </div>
      </div>
    </>
  );
}
