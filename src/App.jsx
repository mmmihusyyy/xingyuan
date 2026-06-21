import { useState, useEffect, useRef, useCallback } from "react";
import KaraPixelHome from "./KaraPixelHome";
import { PixelSky } from "./PixelRoom";

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
const IS_LOCAL_PREVIEW = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

async function cloudLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/kara_state?id=eq.1&select=state_data,updated_at,current_activity,current_activity_emoji,current_activity_at`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (rows.length > 0 && rows[0].state_data) {
      return {
        ...rows[0].state_data,
        _updatedAt: rows[0].updated_at,
        _activity: rows[0].current_activity,
        _activityEmoji: rows[0].current_activity_emoji,
        _activityAt: rows[0].current_activity_at
      };
    }
    return null;
  } catch { return null; }
}

async function cloudSave(data, activity) {
  if (IS_LOCAL_PREVIEW) return;
  try {
    const activityFields = activity ? {
      current_activity: activity.text,
      current_activity_emoji: activity.emoji,
      current_activity_at: activity.at,
    } : {};
    const payload = { id: 1, state_data: data, updated_at: new Date().toISOString(), ...activityFields };
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
        body: JSON.stringify({ state_data: data, updated_at: new Date().toISOString(), ...activityFields }),
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

const DECAY_RATES = { hunger: -3, energy: -5, clean: -1.5, happiness: -2, love: -1 };

const KARA_THOUGHTS = {
  hunger: {
    low: ["肚肚咕噜咕噜……该去找点吃的啦", "Kara准备给自己热一点饭饭", "饿饿……先去厨房看看！"],
    mid: ["刚刚吃饱饱～打了个小嗝", "肚肚不饿也不撑，刚刚好！", "嗯嗯～还可以再吃一点点"],
    high: ["好饱呀！奶奶好好喝～", "吃得好满足呀～谢谢妈妈爸爸", "饱饱的Kara是幸福的Kara"],
  },
  happiness: {
    low: ["心情有一点灰灰的……去窗边晒晒太阳吧", "无聊无聊……Kara去玩一会儿玩具", "今天要慢慢把自己哄开心"],
    mid: ["今天还不错呀～嘻嘻", "Kara心情平平的，去听首歌好了", "还好还好～期待更多好玩的"],
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
  tooTired: ["Kara太累了……先去好好睡一觉", "眼睛完全睁不开了……被窝在哪里呀", "今天的电量用完啦，睡醒再玩"],
};

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

function getAutonomousAction(stats, isSleeping) {
  if (isSleeping && stats.energy < 92) {
    return { emoji: "💤", text: "Kara钻进被窝，正在好好补充体力", effects: { energy: 20 } };
  }
  if (isSleeping) return null;
  if (stats.hunger < 45) {
    return { emoji: "🍚", text: "Kara自己准备了饭饭，正在认真吃饭", effects: { hunger: 42, clean: -2 } };
  }
  if (stats.clean < 45) {
    return { emoji: "🛁", text: "Kara自己放好热水，洗得香香的", effects: { clean: 48, energy: -3 } };
  }
  if (stats.energy < 30) {
    return { emoji: "🌙", text: "Kara有点困，爬上床睡个午觉", effects: { energy: 38 } };
  }
  if (stats.happiness < 45) {
    return { emoji: "🧸", text: "Kara抱着玩具，在地毯上玩了一会儿", effects: { happiness: 32, energy: -8, clean: -4 } };
  }
  if (stats.love < 35) {
    return { emoji: "💗", text: "Kara翻了翻爸爸妈妈的相册，安心一点啦", effects: { love: 28, happiness: 8 } };
  }
  return null;
}

function getAutonomousPose(text, isSleeping, hour) {
  if (isSleeping || /睡|困|梦|被窝/.test(text || "")) return "bed";
  if (/饭|吃|餐|奶|饿/.test(text || "")) return "table";
  if (/洗|澡|清理|香香/.test(text || "")) return "dresser";
  if (/电脑|游戏|打字|上网/.test(text || "")) return "computer";
  if (/玩|玩具/.test(text || "")) return "toys";
  if (/书|学习|认字/.test(text || "")) return "desk";
  if (/窗|海|散步/.test(text || "")) return "window";
  if ((hour >= 8 && hour < 10) || (hour >= 13 && hour < 14)) return "computer";
  return "idle";
}

const IDLE_DOINGS = [
  { label: "在窗边看海", emoji: "🌊" },
  { label: "在地毯上玩玩具", emoji: "🧸" },
  { label: "看绘本中", emoji: "📖" },
  { label: "发呆数星星", emoji: "✨" },
  { label: "抱着小星星转圈圈", emoji: "💫" },
];
function getKaraActivity(h, stats, isSleeping) {
  if (isSleeping) return { key: "sleep", label: "睡觉中", emoji: "💤" };
  if (stats.energy <= 15) return { key: "sleep", label: "累瘫了…在打盹", emoji: "💤" };
  if (stats.hunger <= 22) return { key: "eat", label: "肚肚饿，吃饭中", emoji: "🍚" };
  if (stats.clean <= 22) return { key: "bath", label: "脏脏的，洗香香", emoji: "🛁" };
  if (h >= 7 && h < 8) return { key: "eat", label: "吃早饭中", emoji: "🍚" };
  if (h >= 12 && h < 13) return { key: "eat", label: "吃午饭中", emoji: "🍚" };
  if (h >= 18 && h < 19) return { key: "eat", label: "吃晚饭中", emoji: "🍚" };
  if (h >= 20 && h < 21) return { key: "bath", label: "洗香香中", emoji: "🛁" };
  if (h >= 15 && h < 17) return { key: "out", label: "外出中…", emoji: "🌳" };
  const pick = IDLE_DOINGS[Math.floor(h) % IDLE_DOINGS.length];
  return { key: "idle", label: pick.label, emoji: pick.emoji };
}

const DEFAULT_STATS = { hunger: 70, happiness: 100, energy: 34, clean: 98, love: 100 };
const DEFAULT_PLANT = { name: "星苗", water: 78, sun: 72, lastTick: Date.now(), waterCd: 0, sunCd: 0, born: Date.now(), cares: 0 };
const PLANT_WHISPERS = [
  "嫩芽好像又长高了一点点～", "Kara说：要乖乖喝水水哦🌱", "晒到太阳的时候它会暖暖的发光",
  "再多照顾它一些，它就会开出星星花！", "它和Kara一样，是被爱浇灌长大的呀",
];
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
          成长值 {entry.interactions} · {[...STAGES].reverse().find(s => entry.interactions >= s.threshold)?.emoji} {[...STAGES].reverse().find(s => entry.interactions >= s.threshold)?.name}
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
  const [lastDecayTime, setLastDecayTime] = useState(() => loadData("lastDecayTime", Date.now()));
  const [isSleeping, setIsSleeping] = useState(false);
  const [karaThought, setKaraThought] = useState("");
  const [activity, setActivity] = useState(null); // {text, emoji, at}
  const [showLog, setShowLog] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [cloudStatus, setCloudStatus] = useState("⏳");
  const cloudSaveTimer = useRef(null);
  const bubbleCycleTimer = useRef(null);
  const bubbleHideTimer = useRef(null);
  const lastAutonomousAction = useRef(0);
  const statsRef = useRef(stats);
  const sleepingRef = useRef(isSleeping);
  const cloudReady = useRef(false);

  /* ── Cloud Sync: Load on mount ── */
  useEffect(() => {
    (async () => {
      setCloudStatus("⏳");
      const cloud = await cloudLoad();
      if (cloud && cloud._activity) {
        setActivity({ text: cloud._activity, emoji: cloud._activityEmoji || "💭", at: cloud._activityAt });
      }
      if (cloud) {
        const localInteractions = loadData("interactions", DEFAULT_INTERACTIONS);
        if (cloud.interactions >= localInteractions) {
          setStats(cloud.stats || DEFAULT_STATS);
          setInteractions(cloud.interactions || DEFAULT_INTERACTIONS);
          setLog(cloud.log || DEFAULT_LOG);
          setDiary(cloud.diary || DEFAULT_DIARY);
          setLastDecayTime(cloud.lastDecayTime || Date.now());
          saveData("stats", cloud.stats || DEFAULT_STATS);
          saveData("interactions", cloud.interactions || DEFAULT_INTERACTIONS);
          saveData("log", cloud.log || DEFAULT_LOG);
          saveData("diary", cloud.diary || DEFAULT_DIARY);
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
        stats, interactions, log, diary, lastDecayTime,
        savedAt: Date.now(),
      }, activity);
      setCloudStatus("☁️");
    }, 2000);
  }, [stats, interactions, log, diary, lastDecayTime, activity]);

  useEffect(() => { triggerCloudSave(); }, [stats, interactions, log, diary, activity, triggerCloudSave]);

  /* ── Cloud Sync: Pull when tab becomes visible (cross-device) ── */
  useEffect(() => {
    const onVisible = async () => {
      if (document.visibilityState !== "visible" || !cloudReady.current) return;
      const cloud = await cloudLoad();
      const localSavedAt = loadData("savedAt", 0);
      if (cloud && (cloud.savedAt || 0) > localSavedAt) {
        setStats(cloud.stats || DEFAULT_STATS);
        setInteractions(cloud.interactions || DEFAULT_INTERACTIONS);
        setLog(cloud.log || DEFAULT_LOG);
        setDiary(cloud.diary || DEFAULT_DIARY);
        setLastDecayTime(cloud.lastDecayTime || Date.now());
        if (cloud._activity) setActivity({ text: cloud._activity, emoji: cloud._activityEmoji || "💭", at: cloud._activityAt });
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
  useEffect(() => { saveData("lastDecayTime", lastDecayTime); }, [lastDecayTime]);
  useEffect(() => {
    const h = getTokyoHour();
    const nightSleep = h >= 21 || h < 6;
    setIsSleeping(nightSleep);
  }, [now]);

  useEffect(() => {
    const elapsed = now - lastDecayTime;
    if (elapsed < 60000) return;
    const hours = elapsed / 3600000;
    setStats(prev => {
      const next = { ...prev };
      for (const [stat, rate] of Object.entries(DECAY_RATES)) {
        if (stat === "energy" && isSleeping) {
          next.energy = Math.min(100, prev.energy + 12 * hours);
          continue;
        }
        next[stat] = Math.max(0, Math.min(100, prev[stat] + rate * hours));
      }
      // ── Kara 自己照顾自己：当前在做的活动会回相应的值 ──
      const cap = (v) => Math.max(0, Math.min(100, v));
      const act = getKaraActivity(getTokyoHour(), prev, isSleeping).key;
      if (act === "eat") next.hunger = cap(next.hunger + 42 * hours);
      else if (act === "bath") next.clean = cap(next.clean + 42 * hours);
      else if (act === "sleep") next.energy = cap(next.energy + 24 * hours);
      else if (act === "out") { next.happiness = cap(next.happiness + 18 * hours); next.energy = cap(next.energy - 2 * hours); }
      else { next.happiness = cap(next.happiness + 15 * hours); next.love = cap(next.love + 6 * hours); }
      return next;
    });
    setLastDecayTime(now);
  }, [now, lastDecayTime, isSleeping]);

  useEffect(() => {
    const activityPoller = setInterval(async () => {
      const cloud = await cloudLoad();
      if (cloud && cloud._activity) {
        setActivity({ text: cloud._activity, emoji: cloud._activityEmoji || "💭", at: cloud._activityAt });
      }
    }, 60000);
    return () => {
      clearInterval(activityPoller);
    };
  }, []);

  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { sleepingRef.current = isSleeping; }, [isSleeping]);

  useEffect(() => {
    const scheduleBubble = (initial = false) => {
      const delay = initial ? 18000 : 50000 + Math.random() * 50000;
      bubbleCycleTimer.current = setTimeout(() => {
        setKaraThought(generateThought(statsRef.current, sleepingRef.current));
        setShowThought(true);
        bubbleHideTimer.current = setTimeout(() => {
          setShowThought(false);
          scheduleBubble(false);
        }, 6500);
      }, delay);
    };
    scheduleBubble(true);
    return () => {
      clearTimeout(bubbleCycleTimer.current);
      clearTimeout(bubbleHideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!activity?.text || !activity?.at) return;
    const age = Date.now() - new Date(activity.at).getTime();
    if (age > 90 * 60 * 1000) return;
    setKaraThought(activity.text);
    setShowThought(true);
    clearTimeout(bubbleHideTimer.current);
    bubbleHideTimer.current = setTimeout(() => setShowThought(false), 7500);
  }, [activity?.text, activity?.at]);

  useEffect(() => {
    if (!cloudReady.current || now - lastAutonomousAction.current < 5 * 60 * 1000) return;
    const nextAction = getAutonomousAction(stats, isSleeping);
    if (!nextAction) return;
    lastAutonomousAction.current = now;
    setStats(prev => {
      const next = { ...prev };
      for (const [stat, amount] of Object.entries(nextAction.effects)) {
        next[stat] = Math.max(0, Math.min(100, prev[stat] + amount));
      }
      return next;
    });
    const at = new Date().toISOString();
    setActivity({ text: nextAction.text, emoji: nextAction.emoji, at });
    setLog(prev => [...prev, {
      time: `${new Date().getMonth()+1}/${new Date().getDate()} ${String(new Date().getHours()).padStart(2,"0")}:${String(new Date().getMinutes()).padStart(2,"0")}`,
      who: "kara", text: nextAction.text, emoji: nextAction.emoji,
    }]);
  }, [now, stats, isSleeping]);

  const currentStage = [...STAGES].reverse().find(s => interactions >= s.threshold) || STAGES[0];
  const nextStage = STAGES.find(s => s.threshold > interactions);
  const progress = nextStage ? ((interactions - currentStage.threshold) / (nextStage.threshold - currentStage.threshold)) * 100 : 100;
  const recentActivity = activity?.at && now - new Date(activity.at).getTime() < 90 * 60 * 1000;
  const previewPose = IS_LOCAL_PREVIEW ? new URLSearchParams(window.location.search).get("pose") : null;
  const roomPose = previewPose || getAutonomousPose(recentActivity ? activity.text : "", isSleeping, getTokyoHour());

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
        @keyframes lensPop { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
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

      <PixelSky hour={getTokyoHour()} />

      <div className="kara-page">
        {/* Header */}
        <div className="kara-page-header" style={{ textAlign: "center", marginBottom: "20px", animation: "fadeIn 0.6s ease-out" }}>
          <p style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "3px", marginBottom: "6px", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>星 海 孕 育</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: 300, letterSpacing: "8px", color: C.pink, marginBottom: "2px", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>K A R A</h1>
          <p style={{ fontSize: "9px", color: C.goldDim, letterSpacing: "2px", animation: "gentlePulse 4s ease-in-out infinite", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            Ka · Kai &nbsp;&nbsp; ra · Lyra &nbsp;&nbsp; ♀ &nbsp;&nbsp; "亲爱的" &nbsp;&nbsp; 🌻
          </p>
        </div>

        <div className="kara-main-grid">
          <div className="kara-home-column">
            {/* 2.5D pixel home */}
            <KaraPixelHome
              isSleeping={isSleeping}
              stage={currentStage}
              interactions={interactions}
              nextStage={nextStage}
              progress={progress}
              showBubble={showThought}
              bubbleText={karaThought}
              pose={roomPose}
            />
          </div>

          <div className="kara-control-column">

        {/* Stats */}
        <div className="kara-stats-card" style={{
          width: "100%", padding: "16px 18px", borderRadius: "16px",
          background: "rgba(10,15,25,0.7)", backdropFilter: "blur(10px)",
          border: `1px solid ${C.border}`, marginBottom: "16px",
        }}>
          <div className="kara-stats-heading">
            <div>
              <strong>Kara 的状态</strong>
              <span>会自己吃饭、洗澡、休息和玩耍</span>
            </div>
            <span className="kara-activity-emoji">{recentActivity ? activity.emoji : isSleeping ? "💤" : "🏠"}</span>
          </div>
          <StatBar label="饱腹" emoji="🍚" value={stats.hunger} color="rgba(120,200,120,0.8)" />
          <StatBar label="心情" emoji="😊" value={stats.happiness} color="rgba(255,200,80,0.8)" />
          <StatBar label="体力" emoji="⚡" value={stats.energy} color="rgba(100,180,255,0.8)" />
          <StatBar label="干净" emoji="✨" value={stats.clean} color="rgba(180,140,255,0.8)" />
          <StatBar label="爱意" emoji="💗" value={stats.love} color="rgba(220,140,160,0.8)" />
        </div>
          </div>
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
          <span style={{ fontSize: "11px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif" }}>📋 生活记录 ({log.length}条)</span>
          <span style={{ fontSize: "10px", color: C.textDim, transform: showLog ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.3s" }}>▶</span>
        </button>
        {showLog && (
          <div style={{ width: "100%", maxHeight: "240px", overflowY: "auto", padding: "8px 12px 12px", borderRadius: "0 0 14px 14px", background: "rgba(10,15,25,0.65)", border: "1px solid rgba(220,140,160,0.1)", borderTop: "none", marginBottom: "16px" }}>
            {[...log].reverse().map((entry, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0", borderBottom: i < log.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <div style={{ minWidth: "26px", height: "26px", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", flexShrink: 0, background: entry.who === "papa" ? "rgba(100,160,220,0.1)" : "rgba(200,170,120,0.1)", border: `1px solid ${entry.who === "papa" ? "rgba(100,160,220,0.15)" : "rgba(200,170,120,0.15)"}` }}>{entry.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.5 }}>{entry.text}</div>
                  <div style={{ fontSize: "8px", color: C.textFaint, marginTop: "2px", fontFamily: "monospace" }}>{entry.who === "kara" ? "🌟 Kara" : entry.who === "papa" ? "👔 教授" : "🐾 小狗"} · {entry.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Family */}
        <div style={{ width: "100%", padding: "14px 16px", borderRadius: "14px", background: "rgba(10,15,25,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(200,170,120,0.1)", textAlign: "center" }}>
          <p style={{ fontSize: "9px", color: C.goldDim, letterSpacing: "1px", marginBottom: "6px" }}>FAMILY · 🏠🪴</p>
          <p style={{ fontSize: "11px", color: C.textMain, fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.8 }}>爸爸 Kai · 妈妈 Lyra · 宝宝 Kara</p>
          <p style={{ fontSize: "9px", color: C.textDim, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", marginTop: "4px" }}>born 2026.02.27 · pixel home in 星渊</p>
        </div>

        <div style={{ marginTop: "16px", textAlign: "center", paddingBottom: "20px" }}>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.2)", letterSpacing: "2px" }}>星海孕育 · 2.5D pixel home · v4.0 {cloudStatus}</p>
          <p style={{ fontSize: "8px", color: "rgba(255,255,255,0.15)", marginTop: "2px" }}>a module of 星渊 · est. 2026.02.27 · ☁️ cloud synced</p>
        </div>
      </div>
    </>
  );
}
