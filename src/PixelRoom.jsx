/* ═══════════════════════════════════════════
   星海孕育 · KARA  ·  少女像素小窝 v2
   QQ家园 / 养成游戏风 · 亮粉暖调正面卧室
   紫发星之少女（Q版大眼睛）+ 自主作息 + 桌上盆栽 + 说话气泡
   全部手绘 inline SVG · 零外部素材
   ═══════════════════════════════════════════ */

function getTod(h) {
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 19) return "sunset";
  return "night";
}
const SKY = {
  dawn:   { a: "#f5c6a0", b: "#f7d9c0", c: "#fce8d8", sea: "#8fb4d6", sun: "#ffd9a0" },
  day:    { a: "#9ad6f0", b: "#bfe8fa", c: "#e2f5ff", sea: "#76c0e0", sun: "#fff3c4" },
  sunset: { a: "#e9a6b8", b: "#f3c2c0", c: "#f9ddc4", sea: "#9a86b4", sun: "#ffd88a" },
  night:  { a: "#2a2750", b: "#3a3568", c: "#4a4480", sea: "#2a3560", sun: "#fdf0c8" },
};

/* ── 调色 ── */
const OL = "#46324f";
const HAIR = "#b8a0e8", HAIRD = "#9a7fd2", HAIRH = "#e0d2f8";
const SKIN = "#ffe1c6";
const IRIS = "#7d5bcf", PUPIL = "#3c2a5c";
const BLUSH = "#ffadc6", MOUTH = "#d96a88";
const DRESS = "#f2ecff", DRESSD = "#ddd0f2";
const STAR = "#ffd45e", ORB = "#bdeaf7";
const TIGHTS = "#e9e0f8", SHOE = "#7e5cc6";
const ACC = ["#f7b8d0", "#f6a6c6", "#f48fbc", "#f078ad", "#ee63a6"];

/* 星形 */
const star = (cx, cy, r, fill, k, stroke) => (
  <polygon key={k} points={[[0, -1], [0.23, -0.31], [0.95, -0.31], [0.37, 0.12], [0.59, 0.81], [0, 0.38], [-0.59, 0.81], [-0.37, 0.12], [-0.95, -0.31], [-0.23, -0.31]].map(([px, py]) => `${(cx + px * r).toFixed(1)},${(cy + py * r).toFixed(1)}`).join(" ")} fill={fill} stroke={stroke || "none"} strokeWidth="0.4" />
);

/* ── 紫发星之少女（矢量 Q 版，本地 viewBox 40×56，脚在 (20,54)） ── */
function KaraSprite({ stageIdx = 0, fx, fy, scale = 0.9 }) {
  const st = Math.max(0, Math.min(4, stageIdx));
  const sc = scale * (1 + st * 0.03);
  const acc = ACC[st];
  return (
    <g transform={`translate(${(fx - 20 * sc).toFixed(1)},${(fy - 54 * sc).toFixed(1)}) scale(${sc.toFixed(3)})`}>
      <ellipse cx="20" cy="53.5" rx="11" ry="2.2" fill="rgba(140,110,150,0.22)" />
      <ellipse cx="20" cy="24" rx="17" ry="20" fill="url(#karaAura)" opacity={0.1 + st * 0.05} />
      <g className="kara-bob">
        {/* 后发 */}
        <path d="M20,6 C8,6 5,16 6,26 C6,34 8,43 11,47 L29,47 C32,43 34,34 34,26 C35,16 32,6 20,6 Z" fill={HAIR} stroke={OL} strokeWidth="1.1" />
        {/* 身体：袖子 / 裙子 / 手脚 */}
        <ellipse cx="10" cy="40" rx="3.6" ry="3.1" fill={DRESS} stroke={OL} strokeWidth="0.8" />
        <ellipse cx="30" cy="40" rx="3.6" ry="3.1" fill={DRESS} stroke={OL} strokeWidth="0.8" />
        <path d="M13,37 C13,35 27,35 27,37 L31,51 C20,54 9,51 9,51 Z" fill={DRESS} stroke={OL} strokeWidth="1" />
        <path d="M21,36 L22.5,51 L20,51 Z" fill={DRESSD} opacity="0.5" />
        <path d="M9,51 q2.7,2 5.5,0 q2.7,2 5.5,0 q2.7,2 5.5,0 q2.7,2 5,0" fill={DRESS} stroke={OL} strokeWidth="0.7" />
        <circle cx="8.6" cy="43" r="1.8" fill={SKIN} stroke={OL} strokeWidth="0.6" />
        <circle cx="31.4" cy="43" r="1.8" fill={SKIN} stroke={OL} strokeWidth="0.6" />
        <rect x="16.6" y="49.5" width="3" height="4.2" rx="1" fill={TIGHTS} stroke={OL} strokeWidth="0.6" />
        <rect x="20.4" y="49.5" width="3" height="4.2" rx="1" fill={TIGHTS} stroke={OL} strokeWidth="0.6" />
        <ellipse cx="18" cy="54" rx="2.3" ry="1.4" fill={SHOE} stroke={OL} strokeWidth="0.6" />
        <ellipse cx="22" cy="54" rx="2.3" ry="1.4" fill={SHOE} stroke={OL} strokeWidth="0.6" />
        {/* 领子 + 胸前蝴蝶结 + 星 */}
        <ellipse cx="20" cy="36" rx="5" ry="2" fill="#ffffff" stroke={OL} strokeWidth="0.8" />
        {star(20, 41, 2.4, STAR, "cs", OL)}
        <path d="M20,36 L16,34 L16,38 Z" fill={acc} stroke={OL} strokeWidth="0.5" />
        <path d="M20,36 L24,34 L24,38 Z" fill={acc} stroke={OL} strokeWidth="0.5" />
        <circle cx="20" cy="36" r="1" fill={acc} stroke={OL} strokeWidth="0.4" />
        {/* 脸 */}
        <ellipse cx="20" cy="22" rx="11" ry="11.5" fill={SKIN} stroke={OL} strokeWidth="1.1" />
        {/* 前侧发束 + 发饰星 */}
        <path d="M9,16 C7,24 8,34 10,40 C7.5,34 6.2,24 8,16 Z" fill={HAIR} stroke={OL} strokeWidth="0.9" />
        <path d="M31,16 C33,24 32,34 30,40 C32.5,34 33.8,24 32,16 Z" fill={HAIR} stroke={OL} strokeWidth="0.9" />
        {star(10, 30, 1.6, STAR, "hl", OL)}
        {star(30, 30, 1.6, STAR, "hr", OL)}
        {/* 刘海 */}
        <path d="M9,17 C9,9 13,6 20,6 C27,6 31,9 31,17 C28,13 24,12 20,16 C16,12 12,13 9,17 Z" fill={HAIR} stroke={OL} strokeWidth="1.1" />
        <ellipse cx="15" cy="12" rx="4" ry="2" fill={HAIRH} opacity="0.6" />
        {/* 眼睛（大） */}
        <path d="M12.3,20.4 Q15,19.2 17.7,20.4" stroke={OL} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <ellipse cx="15" cy="22.6" rx="2.7" ry="3.3" fill="#fff" stroke={OL} strokeWidth="0.8" />
        <circle cx="15" cy="23" r="2.3" fill={IRIS} />
        <circle cx="15" cy="23.4" r="1.1" fill={PUPIL} />
        <circle cx="16.1" cy="21.7" r="0.9" fill="#fff" />
        <circle cx="14" cy="24" r="0.5" fill="#fff" opacity="0.8" />
        <path d="M22.3,20.4 Q25,19.2 27.7,20.4" stroke={OL} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <ellipse cx="25" cy="22.6" rx="2.7" ry="3.3" fill="#fff" stroke={OL} strokeWidth="0.8" />
        <circle cx="25" cy="23" r="2.3" fill={IRIS} />
        <circle cx="25" cy="23.4" r="1.1" fill={PUPIL} />
        <circle cx="26.1" cy="21.7" r="0.9" fill="#fff" />
        <circle cx="24" cy="24" r="0.5" fill="#fff" opacity="0.8" />
        {/* 腮红 + 嘴 */}
        <ellipse cx="10.6" cy="25.6" rx="2" ry="1.3" fill={BLUSH} opacity="0.85" />
        <ellipse cx="29.4" cy="25.6" rx="2" ry="1.3" fill={BLUSH} opacity="0.85" />
        <path d="M18.6,28 Q20,29.8 21.4,28" stroke={MOUTH} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        {/* 头顶星球 */}
        <line x1="20" y1="7" x2="20" y2="3.5" stroke={OL} strokeWidth="0.8" />
        <circle cx="20" cy="3" r="4" fill={STAR} opacity="0.25" />
        <circle cx="20" cy="3" r="2.6" fill={ORB} stroke={OL} strokeWidth="0.8" />
        {star(20, 3, 1.5, STAR, "orbs", OL)}
        {st >= 4 && (<g>{star(13, 7, 1.4, STAR, "cr1", OL)}{star(27, 7, 1.4, STAR, "cr2", OL)}</g>)}
      </g>
    </g>
  );
}

/* ── 闭眼小脑袋（洗澡 / 睡觉用） ── */
function SleepHead({ cx, cy, scale = 1 }) {
  return (
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
      <circle cx="0" cy="-1" r="9" fill={HAIR} stroke={OL} strokeWidth="0.9" />
      <circle cx="0" cy="1" r="7.5" fill={SKIN} stroke={OL} strokeWidth="0.9" />
      <path d="M-7,-2 C-7,-8 7,-8 7,-2 C3,-5 -3,-5 -7,-2 Z" fill={HAIR} stroke={OL} strokeWidth="0.9" />
      <path d="M-5,2 Q-3.4,3.6 -1.8,2" stroke={OL} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M1.8,2 Q3.4,3.6 5,2" stroke={OL} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <ellipse cx="-5" cy="4" rx="1.7" ry="1.1" fill={BLUSH} opacity="0.85" />
      <ellipse cx="5" cy="4" rx="1.7" ry="1.1" fill={BLUSH} opacity="0.85" />
      <path d="M-1.4,5 Q0,6.4 1.4,5" stroke={MOUTH} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <line x1="0" y1="-9" x2="0" y2="-12" stroke={OL} strokeWidth="0.7" />
      <circle cx="0" cy="-12.6" r="2" fill={ORB} stroke={OL} strokeWidth="0.7" />
      {star(0, -12.6, 1.1, STAR, "shs", OL)}
    </g>
  );
}

/* 家具小工具 */
const bear = (cx, cy, col, k) => (
  <g key={k}>
    <circle cx={cx - 3} cy={cy - 3} r="2.1" fill={col} />
    <circle cx={cx + 3} cy={cy - 3} r="2.1" fill={col} />
    <circle cx={cx} cy={cy} r="4.6" fill={col} />
    <circle cx={cx} cy={cy + 0.6} r="2.2" fill="#fff3f8" />
    <circle cx={cx - 1.6} cy={cy - 0.8} r="0.6" fill="#5a3a4a" />
    <circle cx={cx + 1.6} cy={cy - 0.8} r="0.6" fill="#5a3a4a" />
    <circle cx={cx} cy={cy + 0.4} r="0.5" fill="#5a3a4a" />
  </g>
);
const frame = (x, y, w, h, k, inner) => (
  <g key={k}>
    <rect x={x} y={y} width={w} height={h} rx="1" fill="#f6e7cf" stroke="#e3b98f" strokeWidth="0.8" />
    <rect x={x + 1.4} y={y + 1.4} width={w - 2.8} height={h - 2.8} fill={inner || "#cfe7f2"} />
  </g>
);

/* ── 主组件：少女像素卧室 ── */
export default function IsometricRoom({ stageIndex = 0, activity = "idle", hour = 12, plantStage = "bud", onPlantClick, speech = "", showSpeech = false }) {
  const tod = getTod(hour);
  const sky = SKY[tod];
  const isNight = tod === "night";
  const key = activity;
  const standing = key === "idle" || key === "eat";

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "280 / 176", margin: "0 auto", borderRadius: "12px", overflow: "hidden" }}>
      <style>{`
        @keyframes karaBob { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-0.6px);} }
        .kara-bob { animation: karaBob 2.6s ease-in-out infinite; transform-box: fill-box; }
        @keyframes zzzF { 0%{opacity:0;transform:translate(0,0);} 30%{opacity:1;} 100%{opacity:0;transform:translate(5px,-14px);} }
        @keyframes steamR { 0%{opacity:0;transform:translateY(0) scale(1);} 40%{opacity:.6;} 100%{opacity:0;transform:translateY(-12px) scale(1.6);} }
        @keyframes bubP { 0%,100%{transform:translateY(0);opacity:.5;} 50%{transform:translateY(-2px);opacity:.9;} }
        @keyframes yumB { 0%,100%{transform:translateY(0) rotate(-6deg);} 50%{transform:translateY(-2px) rotate(6deg);} }
        @keyframes lampG { 0%,100%{opacity:.5;} 50%{opacity:.85;} }
        @keyframes signS { 0%,100%{transform:rotate(-2deg);} 50%{transform:rotate(2deg);} }
        @keyframes twk { 0%,100%{opacity:.35;} 50%{opacity:1;} }
        @keyframes hintP { 0%,100%{opacity:.25;} 50%{opacity:.9;} }
        @keyframes speechPop { 0%{opacity:0;transform:translateX(-50%) translateY(4px) scale(.9);} 100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1);} }
      `}</style>

      <svg viewBox="0 0 280 176" width="100%" height="100%" style={{ display: "block", imageRendering: "pixelated" }}>
        <defs>
          <radialGradient id="karaAura" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#fff0f7" />
            <stop offset="60%" stopColor="#ffc9e2" />
            <stop offset="100%" stopColor="rgba(255,201,226,0)" />
          </radialGradient>
          <linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky.a} />
            <stop offset="55%" stopColor={sky.b} />
            <stop offset="100%" stopColor={sky.c} />
          </linearGradient>
          <radialGradient id="lampLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,224,150,0.5)" />
            <stop offset="100%" stopColor="rgba(255,224,150,0)" />
          </radialGradient>
        </defs>

        {/* 墙 + 地板 */}
        <rect x="0" y="0" width="280" height="122" fill="#fdf4ef" />
        {Array.from({ length: 36 }, (_, i) => {
          const gx = (i % 9) * 32 + 14 + (Math.floor(i / 9) % 2) * 14;
          const gy = Math.floor(i / 9) * 26 + 12;
          return <g key={`fl-${i}`} opacity="0.5"><circle cx={gx} cy={gy} r="0.9" fill="#f3c6d8" /><circle cx={gx + 2} cy={gy + 2} r="0.6" fill="#f7d7a0" /></g>;
        })}
        <rect x="0" y="116" width="280" height="6" fill="#f0b9cd" />
        <rect x="0" y="122" width="280" height="54" fill="#f4e6d6" />
        {[122, 134, 148, 164].map((yy, i) => <line key={`fhz-${i}`} x1="0" y1={yy} x2="280" y2={yy} stroke="#e8cdb6" strokeWidth="0.7" opacity="0.6" />)}
        {Array.from({ length: 11 }, (_, i) => <line key={`fv-${i}`} x1={i * 28} y1="122" x2={i * 28 - 16} y2="176" stroke="#e8cdb6" strokeWidth="0.7" opacity="0.5" />)}

        {/* 窗（看海） */}
        <g>
          <rect x="8" y="12" width="46" height="44" rx="2" fill="#fff" stroke="#f0b9cd" strokeWidth="1.5" />
          <rect x="11" y="15" width="40" height="38" fill="url(#winSky)" />
          <rect x="11" y="40" width="40" height="13" fill={sky.sea} opacity="0.9" />
          <circle cx="40" cy="26" r="4" fill={sky.sun} opacity="0.95" />
          {isNight && [[18, 22], [30, 19], [44, 33]].map((p, i) => <rect key={`ws-${i}`} x={p[0]} y={p[1]} width="1" height="1" fill="#fff" style={{ animation: `twk ${2 + i}s ease-in-out infinite` }} />)}
          <line x1="31" y1="15" x2="31" y2="53" stroke="#fff" strokeWidth="1.4" />
          <line x1="11" y1="34" x2="51" y2="34" stroke="#fff" strokeWidth="1.4" />
          <path d="M6,10 q4,4 0,40 q-5,-20 0,-40" fill="#f7c2d6" />
          <path d="M56,10 q-4,4 0,40 q5,-20 0,-40" fill="#f7c2d6" />
          <rect x="22" y="50" width="6" height="5" fill="#e89a6a" /><circle cx="25" cy="48" r="3" fill="#7fc06a" />
        </g>

        {/* 墙面装饰 */}
        {star(120, 16, 7, "#f48fc0", "wstar", "#e070a8")}
        <g><circle cx="256" cy="14" r="7" fill="#ffe79e" /><circle cx="259" cy="12" r="6" fill="#fdf4ef" /></g>
        <g><circle cx="210" cy="18" r="6.5" fill="#fff" stroke="#f0b9cd" strokeWidth="1.2" /><line x1="210" y1="18" x2="210" y2="14" stroke="#7a5a6a" strokeWidth="0.9" /><line x1="210" y1="18" x2="213" y2="19" stroke="#7a5a6a" strokeWidth="0.9" /></g>
        {frame(70, 12, 14, 12, "fr1", "#cfe7f2")}<text x="77" y="22" fontSize="7" textAnchor="middle">🐟</text>
        {frame(90, 28, 12, 14, "fr2", "#fde2ec")}<text x="96" y="38" fontSize="6" textAnchor="middle">🐱</text>
        {frame(150, 10, 13, 11, "fr3", "#e7f2d8")}
        {frame(176, 12, 12, 12, "fr4", "#fdeccf")}<text x="182" y="22" fontSize="6" textAnchor="middle">🦒</text>
        {[60, 88, 116, 144].map((x, i) => star(x, 6 + (i % 2) * 3, 2.4, "#ffd45e", `g-${i}`))}
        <rect x="226" y="44" width="50" height="2.4" fill="#e8b98f" />
        {[232, 244, 256, 268].map((x, i) => <g key={`plnt-${i}`}><rect x={x - 2.5} y="38" width="5" height="6" fill={["#f4a8c4", "#bcd0ea", "#f7d7a0", "#a8d8b0"][i]} /><circle cx={x} cy="36" r="2.6" fill="#7fc06a" /></g>)}

        {/* 衣柜 + 吉他 + 书堆 */}
        <g>
          <rect x="6" y="48" width="48" height="68" rx="2" fill="#f2a4c0" stroke="#dd86a8" strokeWidth="1" />
          <rect x="6" y="48" width="48" height="6" fill="#ee93b4" />
          <line x1="30" y1="56" x2="30" y2="114" stroke="#dd86a8" strokeWidth="1" />
          <rect x="26" y="78" width="2" height="8" rx="1" fill="#fff3f8" /><rect x="32" y="78" width="2" height="8" rx="1" fill="#fff3f8" />
          <rect x="10" y="58" width="16" height="2" fill="#cfe7f2" />
          {[12, 16, 20].map((x, i) => <rect key={`cl-${i}`} x={x} y="60" width="3" height="7" fill={["#bcd0ea", "#f7d7a0", "#a8d8b0"][i]} />)}
        </g>
        <g transform="translate(2,72) rotate(-12 6 30)">
          <rect x="5" y="0" width="2" height="26" fill="#caa06a" />
          <ellipse cx="6" cy="30" rx="6.5" ry="8" fill="#e8b98f" stroke="#caa06a" strokeWidth="1" />
          <circle cx="6" cy="30" r="2.2" fill="#7a5240" />
        </g>
        {[0, 1, 2].map((i) => <rect key={`bks-${i}`} x={10 + i} y={150 - i * 3} width="18" height="3" fill={["#f4a8c4", "#bcd0ea", "#f7d7a0"][i]} />)}

        {/* 小床 + 小羊 */}
        <g>
          <rect x="60" y="98" width="72" height="22" rx="2" fill="#f6e4c8" stroke="#e3b98f" strokeWidth="1" />
          {[78, 100].map((x, i) => <rect key={`bd-${i}`} x={x} y="104" width="2" height="3" rx="1" fill="#caa06a" />)}
          <rect x="60" y="76" width="9" height="24" rx="2" fill="#f2a4c0" />
          <rect x="68" y="86" width="62" height="14" rx="2" fill="#fff6fb" />
          <rect x="84" y="88" width="46" height="13" rx="2" fill="#f6df9f" />
          <rect x="70" y="83" width="16" height="11" rx="3" fill="#fff" stroke="#f0d6e0" strokeWidth="0.6" />
          <g><ellipse cx="100" cy="83" rx="7" ry="5" fill="#fff" /><circle cx="106" cy="82" r="3" fill="#f0e8ee" /><circle cx="107" cy="81" r="0.5" fill="#5a3a4a" /><circle cx="98" cy="80" r="2.5" fill="#fff" /><circle cx="103" cy="79" r="2.5" fill="#fff" /></g>
        </g>
        {/* 小兔 + 礼物 */}
        <g><ellipse cx="138" cy="138" rx="5" ry="6" fill="#f7c2d6" /><ellipse cx="135" cy="129" rx="1.6" ry="4" fill="#f7c2d6" /><ellipse cx="141" cy="129" rx="1.6" ry="4" fill="#f7c2d6" /><circle cx="136.5" cy="137" r="0.6" fill="#5a3a4a" /><circle cx="139.5" cy="137" r="0.6" fill="#5a3a4a" /></g>
        <g><rect x="146" y="146" width="10" height="9" fill="#bcd0ea" /><rect x="150" y="146" width="2" height="9" fill="#fff" /><rect x="146" y="149" width="10" height="2" fill="#fff" /></g>

        {/* 书桌 + 笔记本 + 椅子 */}
        <g>
          <path d="M120,100 L168,100 L162,120 L126,120 Z" fill="#f7c8da" />
          <rect x="120" y="96" width="48" height="5" rx="1.5" fill="#fff0f6" stroke="#f0b9cd" strokeWidth="0.6" />
          <rect x="132" y="86" width="14" height="10" rx="1" fill="#cfd8e6" stroke="#9aa8c0" strokeWidth="0.6" />
          <rect x="133" y="87" width="12" height="7" fill={isNight ? "#3a4a6a" : "#bfe0f0"} />
          <rect x="150" y="88" width="5" height="7" fill="#e89a6a" /><circle cx="152.5" cy="86" r="2.6" fill="#7fc06a" />
          <rect x="150" y="104" width="10" height="3" rx="1" fill="#f2a4c0" /><rect x="158" y="100" width="2.5" height="14" fill="#f2a4c0" /><rect x="151" y="107" width="2" height="9" fill="#ee93b4" />
        </g>

        {/* 沙发 + 小熊 + 蓝抽屉柜 */}
        <g>
          <rect x="174" y="82" width="84" height="14" rx="3" fill="#f4b0cc" />
          {[188, 204, 220, 236, 250].map((x, i) => <path key={`ht-${i}`} d={`M${x},88 q1.5,-2 3,0 q-1.5,2.5 -1.5,2.5 q0,0 -1.5,-2.5`} fill="#fff3f8" opacity="0.8" />)}
          <rect x="172" y="94" width="88" height="16" rx="3" fill="#f2a4c0" />
          <rect x="170" y="92" width="6" height="20" rx="2" fill="#ee93b4" /><rect x="256" y="92" width="6" height="20" rx="2" fill="#ee93b4" />
          {bear(196, 96, "#f4a8c4", "bear1")}
          {bear(216, 96, "#bcd0ea", "bear2")}
          {bear(236, 96, "#f7c2d6", "bear3")}
        </g>
        <g>
          <rect x="244" y="58" width="30" height="34" rx="2" fill="#bcd0ea" stroke="#9ab0d0" strokeWidth="1" />
          {[66, 76, 86].map((y, i) => <g key={`drw-${i}`}><line x1="244" y1={y} x2="274" y2={y} stroke="#9ab0d0" strokeWidth="0.8" /><circle cx="259" cy={y + 4} r="1" fill="#fff" /></g>)}
          <g><circle cx="259" cy="52" r="4" fill="#d9a86a" /><circle cx="255" cy="50" r="1.6" fill="#d9a86a" /><circle cx="263" cy="50" r="1.6" fill="#d9a86a" /><circle cx="259" cy="53" r="2.2" fill="#f0d8b8" /><circle cx="257.5" cy="51.5" r="0.5" fill="#3a2a2a" /><circle cx="260.5" cy="51.5" r="0.5" fill="#3a2a2a" /></g>
        </g>

        {/* 地毯 + 足球 */}
        <ellipse cx="120" cy="150" rx="48" ry="13" fill="#bcdcea" opacity="0.85" />
        <ellipse cx="120" cy="150" rx="40" ry="10" fill="#d4ecf5" opacity="0.7" />
        <ellipse cx="222" cy="156" rx="34" ry="11" fill="#f6c8da" opacity="0.85" />
        <g><circle cx="256" cy="150" r="5" fill="#fff" stroke="#bbb" strokeWidth="0.5" /><polygon points="256,147 258,149 257,152 255,152 254,149" fill="#7a8a9a" /></g>

        {/* 圆桌 + 可点击盆栽 */}
        {(() => {
          const cx = 222, topY = 132;
          return (
            <g style={{ cursor: "pointer" }} onClick={onPlantClick}>
              <rect x={cx - 1.5} y={topY} width="3" height="16" fill="#ee93b4" />
              <ellipse cx={cx} cy={topY + 16} rx="9" ry="3" fill="#dd86a8" />
              <ellipse cx={cx} cy={topY} rx="15" ry="5" fill="#f7c8da" />
              <ellipse cx={cx} cy={topY - 0.5} rx="13" ry="4" fill="#fbdbe8" />
              <g transform={`translate(${(cx - 8 * 0.85).toFixed(1)},${(topY - 18.5 * 0.85).toFixed(1)}) scale(0.85)`}>{PlantShapes(plantStage, "room")}</g>
              <circle cx={cx} cy={topY - 7} r="12" fill="none" stroke="#bfe6c4" strokeWidth="0.7" style={{ animation: "hintP 2.6s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} />
              <text x={cx + 11} y={topY - 12} fontSize="6" style={{ animation: "hintP 2.6s ease-in-out infinite" }}>🔍</text>
            </g>
          );
        })()}

        {/* 吊灯 */}
        <g>
          <line x1="120" y1="0" x2="120" y2="8" stroke="#e3b98f" strokeWidth="1" />
          <path d="M112,8 L128,8 L125,15 L115,15 Z" fill={isNight ? "#ffe7a8" : "#fbe6c0"} stroke="#e3b98f" strokeWidth="0.6" />
          {isNight && <circle cx="120" cy="16" r="30" fill="url(#lampLight)" style={{ animation: "lampG 4s ease-in-out infinite" }} />}
        </g>

        {/* ════════ 活动演出 ════════ */}
        {key === "eat" && (() => { const fx = 120; return (
          <g>
            <ellipse cx={fx} cy="162" rx="9" ry="2.6" fill="#f0d6e0" />
            <ellipse cx={fx} cy="159" rx="5" ry="2" fill="#fff" /><ellipse cx={fx} cy="158.4" rx="4" ry="1.4" fill="#ffeede" />
            <text x={fx + 12} y="150" fontSize="7" style={{ animation: "yumB 1.4s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }}>🍚</text>
          </g>
        ); })()}

        {key === "bath" && (() => { const bx = 120, by = 150; return (
          <g>
            <ellipse cx={bx} cy={by} rx="18" ry="8" fill="#cfe9f2" />
            <ellipse cx={bx} cy={by - 1} rx="15" ry="6" fill="#9fd6ec" />
            {[[-9, -3], [0, -4], [8, -2], [-3, -5], [5, -4.5]].map((p, i) => <circle key={`bb-${i}`} cx={bx + p[0]} cy={by + p[1]} r={1.6 + (i % 2)} fill="#fff" opacity="0.85" style={{ animation: `bubP ${1.5 + i * 0.3}s ease-in-out infinite` }} />)}
            <SleepHead cx={bx} cy={by - 5} scale={0.62} />
            {[-7, 2, 9].map((dx, i) => <circle key={`sm-${i}`} cx={bx + dx} cy={by - 8} r="2.4" fill="#fff" opacity="0.4" style={{ animation: `steamR ${2 + i * 0.5}s ease-out infinite` }} />)}
          </g>
        ); })()}

        {key === "sleep" && (() => { const hx = 82, hy = 82; return (
          <g>
            <SleepHead cx={hx} cy={hy} scale={0.78} />
            {[0, 1, 2].map((i) => <text key={`z-${i}`} x={hx + 9 + i * 3.5} y={hy - 8 - i * 4} fontSize={4 + i} fill="#c0a6e0" style={{ animation: `zzzF 2.4s ease-in-out ${i * 0.6}s infinite` }}>z</text>)}
          </g>
        ); })()}

        {key === "out" && (() => { const mx = 120; return (
          <g style={{ animation: "signS 3s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }}>
            <line x1={mx} y1="100" x2={mx} y2="120" stroke="#caa06a" strokeWidth="1.2" />
            <rect x={mx - 24} y="120" width="48" height="18" rx="3" fill="#fff4ea" stroke="#f0b9cd" strokeWidth="1.4" />
            <text x={mx} y="132" fontSize="8" textAnchor="middle" fill="#e07090" fontFamily="'Noto Sans SC',sans-serif">🌳 外出中…</text>
          </g>
        ); })()}

        {standing && <KaraSprite stageIdx={stageIndex} fx={120} fy={155} scale={0.92} />}

        {isNight && <rect x="0" y="0" width="280" height="176" fill="#3a2f55" opacity="0.22" pointerEvents="none" />}
      </svg>

      {/* 头顶说话气泡 */}
      {showSpeech && speech && (
        <div style={{ position: "absolute", left: "50%", top: "4%", transform: "translateX(-50%)", maxWidth: "72%", padding: "6px 11px", borderRadius: "12px", background: "rgba(255,250,253,0.96)", border: "2px solid rgba(240,150,180,0.7)", boxShadow: "0 3px 10px rgba(150,100,130,0.25)", animation: "speechPop 0.4s ease-out", pointerEvents: "none", zIndex: 3 }}>
          <p style={{ fontSize: "10px", color: "#9a4a6a", fontFamily: "'Noto Sans SC', sans-serif", lineHeight: 1.5, textAlign: "center", margin: 0 }}>{speech}</p>
          <div style={{ position: "absolute", bottom: "-7px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "7px solid rgba(240,150,180,0.7)" }} />
          <div style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid rgba(255,250,253,0.96)" }} />
        </div>
      )}
    </div>
  );
}

/* ── 像素盆栽：星苗 ── */
export function PlantShapes(stage, k = "pl") {
  const green = stage === "wilt" ? "#8a9a5a" : "#4f9a3a";
  const greenD = stage === "wilt" ? "#6a7a45" : "#377a26";
  const els = [];
  els.push(<polygon key={`${k}-pot`} points="4,13 12,13 11,19 5,19" fill="#e88aa8" />);
  els.push(<polygon key={`${k}-rim`} points="3.6,12.6 12.4,12.6 11.8,14.2 4.2,14.2" fill="#d56f92" />);
  els.push(<rect key={`${k}-soil`} x="4.4" y="12.8" width="7.2" height="1.2" fill="#6a4a36" />);
  if (stage === "wilt") {
    els.push(<path key={`${k}-stem`} d="M8,12.5 q-3.5,-2.5 -4.5,1.5" stroke={greenD} strokeWidth="1.4" fill="none" />);
    els.push(<ellipse key={`${k}-l1`} cx="4.2" cy="11.5" rx="2" ry="1" fill={green} />);
    els.push(<ellipse key={`${k}-l2`} cx="9.6" cy="11.8" rx="1.7" ry="0.9" fill={greenD} />);
  } else {
    const stemTop = stage === "sprout" ? 7.5 : 4.5;
    els.push(<rect key={`${k}-stem`} x="7.3" y={stemTop} width="1.4" height={12.6 - stemTop} fill={greenD} />);
    els.push(<ellipse key={`${k}-l1`} cx="5.2" cy="9.6" rx="2.4" ry="1.2" fill={green} transform="rotate(-18 5.2 9.6)" />);
    els.push(<ellipse key={`${k}-l2`} cx="10.8" cy="8.6" rx="2.4" ry="1.2" fill={green} transform="rotate(18 10.8 8.6)" />);
    if (stage === "sprout") {
      els.push(<circle key={`${k}-tip`} cx="8" cy="6.6" r="1.3" fill="#7fc06a" />);
    } else if (stage === "bud") {
      els.push(<ellipse key={`${k}-bud`} cx="8" cy="4.2" rx="2" ry="2.7" fill="#e6a6c6" />);
      els.push(<ellipse key={`${k}-bud2`} cx="8" cy="3.6" rx="1.1" ry="1.6" fill="#f3c8de" />);
    } else {
      els.push(<circle key={`${k}-glow`} cx="8" cy="3.8" r="4.4" fill="#ffe07a" opacity="0.4" />);
      els.push(<polygon key={`${k}-star`} points="8,0.4 9.2,3 12,3 9.7,4.9 10.6,7.6 8,5.9 5.4,7.6 6.3,4.9 4,3 6.8,3" fill="#ffd23e" stroke="#ffb800" strokeWidth="0.3" />);
      els.push(<circle key={`${k}-c`} cx="8" cy="3.8" r="1" fill="#fff6cc" />);
    }
  }
  return els;
}
export function PixelPlant({ stage = "sprout", size = 80 }) {
  return (
    <svg viewBox="0 0 16 20" width={size} height={size * 20 / 16} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(150,100,130,0.3))" }}>
      {PlantShapes(stage, "pp")}
    </svg>
  );
}
export function plantStageFromHealth(water, sun) {
  const h = (water + sun) / 2;
  if (h < 28) return "wilt";
  if (h < 55) return "sprout";
  if (h < 80) return "bud";
  return "bloom";
}

/* ── 固定像素天空背景 ── */
export function PixelSky({ hour = 12 }) {
  const tod = getTod(hour);
  const s = SKY[tod];
  const isNight = tod === "night";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: `linear-gradient(180deg, ${s.a} 0%, ${s.b} 55%, ${s.c} 100%)`, transition: "background 120s ease" }}>
      {isNight && Array.from({ length: 40 }, (_, i) => (
        <div key={`ps-${i}`} style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, width: "2px", height: "2px", background: "#fff", opacity: 0.6, imageRendering: "pixelated" }} />
      ))}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "24%", background: `linear-gradient(180deg, ${s.sea}, ${s.sea}cc)` }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 58%, rgba(120,90,110,0.22) 100%)", pointerEvents: "none" }} />
    </div>
  );
}
