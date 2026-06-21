/* ═══════════════════════════════════════════
   星海孕育 · KARA  ·  2.5D 像素小窝
   QQ家园 style isometric pixel home
   全部手绘 · 零外部素材 · inline SVG pixel art
   Kara 像素少女 + 自主作息（吃饭/洗澡/睡觉/外出）
   ═══════════════════════════════════════════ */

/* ── 时段 → 调色 ── */
function getTod(h) {
  if (h >= 5 && h < 7) return "dawn";
  if (h >= 7 && h < 17) return "day";
  if (h >= 17 && h < 19) return "sunset";
  return "night";
}

const ROOM_PAL = {
  dawn:   { wallL: "#e8ccc4", wallR: "#d4ad9e", floor: "#c79b78", line: "#b07f57", trim: "#a86b5a", sky1: "#3a2b4e", sky2: "#c4748a", sky3: "#f0a878", sun: "#ffd9a0", sea: "#5a6f96" },
  day:    { wallL: "#f5e7cd", wallR: "#e7d2ad", floor: "#ccab7d", line: "#b9925e", trim: "#9a6a4a", sky1: "#7ec8e3", sky2: "#aee0f2", sky3: "#d6f0fb", sun: "#fff3c4", sea: "#3a90b8" },
  sunset: { wallL: "#efd2bf", wallR: "#e0b598", floor: "#c89a72", line: "#ad7d54", trim: "#955a44", sky1: "#3a2150", sky2: "#c4546d", sky3: "#f4a261", sun: "#ffd88a", sea: "#6a5a7c" },
  night:  { wallL: "#3f3666", wallR: "#322a54", floor: "#473a5a", line: "#574a6c", trim: "#2a2342", sky1: "#0a0e1a", sky2: "#16203a", sky3: "#243456", sun: "#ffeec8", sea: "#16223e" },
};

/* ── 像素少女 Kara 网格（16×24） ── */
const KARA_ROWS = [
  "................",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHHY.",
  "..HHSSSSSSSSHH..",
  "..HSSSSSSSSSSH..",
  "..HSSEESSEESSH..",
  "..HSSSSSSSSSSH..",
  "..HSBSSSSSSBSH..",
  "..HSSSmmSSSSSH..",
  "..HHSSSSSSSSHH..",
  "...HHSSSSSSHH...",
  "..HHWWWWWWWWHH..",
  "..HDDDDDDDDDDH..",
  "..HDDDDYDDDDDH..",
  "...DDDDDDDDDD...",
  "..sDDDDDDDDDDs..",
  "...DDDDDDDDDD...",
  "...dDDDDDDDDd...",
  "....DDDDDDDD....",
  "....LL....LL....",
  "....LL....LL....",
  "....OO....OO....",
];

// 睡觉用：闭眼 + 没有腿（盖被子）
const KARA_SLEEP_HEAD = [
  "................",
  "....HHHHHHHH....",
  "...HHHHHHHHHH...",
  "..HHHHHHHHHHHH..",
  "..HHHHHHHHHHHHY.",
  "..HHSSSSSSSSHH..",
  "..HSSSSSSSSSSH..",
  "..HSSqqSSqqSSH..",
  "..HSSSSSSSSSSH..",
  "..HSBSSSSSSBSH..",
  "..HSSSooSSSSSH..",
  "..HHSSSSSSSSHH..",
  "...HHSSSSSSHH...",
];

const DRESS_BY_STAGE = [
  { D: "#f1aac6", d: "#d885a8" },
  { D: "#ef98ba", d: "#cf74a0" },
  { D: "#ea83aa", d: "#c75f88" },
  { D: "#e66b9e", d: "#bf5184" },
  { D: "#e257a6", d: "#b53e8e" },
];

function karaPalette(stageIdx) {
  const ds = DRESS_BY_STAGE[Math.max(0, Math.min(4, stageIdx))];
  return {
    H: "#3b2c66", S: "#ffd9bd", s: "#eeb592", E: "#332a44", q: "#7a5a6a",
    B: "#ff9fbb", m: "#d76a86", o: "#d76a86", W: "#fff4fb",
    D: ds.D, d: ds.d, Y: "#ffd45e", L: "#ffd9bd", O: "#6a4d92",
  };
}

function pixelRects(rows, pal, key) {
  const out = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      const col = pal[c];
      if (col) out.push(<rect key={`${key}-${x}-${y}`} x={x} y={y} width="1.03" height="1.03" fill={col} />);
    }
  });
  return out;
}

/* ── 等距投影 ── */
// 后角(back) = (100,52)，floor 半宽 80，半高 44，墙高 48
const P  = (u, v) => [100 + 80 * u - 80 * v, 52 + 44 * u + 44 * v]; // floor
const PR = (u, v) => [100 + 80 * u, 52 + 44 * u - 48 * v];          // 右墙
const PL = (u, v) => [100 - 80 * u, 52 + 44 * u - 48 * v];          // 左墙
const s = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const up = (p, h) => [p[0], p[1] - h];
const poly = (pts, fill, extra = {}) => <polygon points={pts.map(s).join(" ")} fill={fill} {...extra} />;

/* ── 像素少女组件（嵌进房间 SVG，自带站立/外出抖动） ── */
function KaraSprite({ stageIdx, fx, fy }) {
  const pal = karaPalette(stageIdx);
  const sc = 1.5 + Math.max(0, Math.min(4, stageIdx)) * 0.07;
  const tx = fx - 8 * sc;
  const ty = fy - 24 * sc;
  const auraOp = 0.12 + stageIdx * 0.06;
  return (
    <g transform={`translate(${tx.toFixed(1)},${ty.toFixed(1)}) scale(${sc.toFixed(3)})`}>
      <ellipse cx="8" cy="23.5" rx="6.5" ry="1.8" fill="rgba(0,0,0,0.22)" />
      <ellipse cx="8" cy="12" rx="11" ry="13" fill="url(#karaAura)" opacity={auraOp} />
      <g className="kara-bob" shapeRendering="crispEdges">
        {pixelRects(KARA_ROWS, pal, "k")}
        {/* 星灵阶段：星之冠 */}
        {stageIdx >= 4 && (
          <g>
            <rect x="4" y="0" width="1.2" height="1.2" fill="#ffe07a" />
            <rect x="7.4" y="-1.2" width="1.4" height="1.4" fill="#fff0a8" />
            <rect x="11" y="0" width="1.2" height="1.2" fill="#ffe07a" />
          </g>
        )}
      </g>
    </g>
  );
}

/* ── 主组件：等距像素房间 ── */
export default function IsometricRoom({ stageIndex = 0, activity = "idle", hour = 12, plantStage = "bud", onPlantClick, speech = "", showSpeech = false }) {
  const tod = getTod(hour);
  const c = ROOM_PAL[tod];
  const isNight = tod === "night";
  const key = activity; // sleep / eat / bath / out / idle

  // Kara 站位
  const idlePos = P(0.5, 0.5);
  const eatPos = P(0.34, 0.6);
  const standY = -2; // 抬一点让脚踩在地毯上

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "200 / 158", margin: "0 auto" }}>
      <style>{`
        @keyframes karaBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-0.7px); } }
        .kara-bob { animation: karaBob 2.4s ease-in-out infinite; transform-box: fill-box; }
        @keyframes zzzFloat { 0% { opacity: 0; transform: translate(0,0); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate(5px,-14px); } }
        @keyframes steamRise { 0% { opacity: 0; transform: translateY(0) scale(1); } 40% { opacity: .6; } 100% { opacity: 0; transform: translateY(-12px) scale(1.6); } }
        @keyframes bubblePop { 0%,100% { transform: translateY(0); opacity:.5; } 50% { transform: translateY(-2px); opacity:.9; } }
        @keyframes yumBounce { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-2px) rotate(6deg); } }
        @keyframes lampGlow { 0%,100% { opacity:.55; } 50% { opacity:.85; } }
        @keyframes signSway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes starTwk { 0%,100% { opacity:.35; } 50% { opacity:1; } }
        @keyframes plantHint { 0%,100% { opacity:.25; } 50% { opacity:.9; } }
        @keyframes speechPop { 0% { opacity:0; transform: translateX(-50%) translateY(4px) scale(.9); } 100% { opacity:1; transform: translateX(-50%) translateY(0) scale(1); } }
      `}</style>

      <svg viewBox="0 0 200 158" width="100%" height="100%" style={{ display: "block", imageRendering: "pixelated" }}>
        <defs>
          <radialGradient id="karaAura" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#ffd6ea" />
            <stop offset="60%" stopColor="#ffb3d6" />
            <stop offset="100%" stopColor="rgba(255,179,214,0)" />
          </radialGradient>
          <linearGradient id="winSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.sky1} />
            <stop offset="55%" stopColor={c.sky2} />
            <stop offset="100%" stopColor={c.sky3} />
          </linearGradient>
          <radialGradient id="lampLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,224,150,0.55)" />
            <stop offset="100%" stopColor="rgba(255,224,150,0)" />
          </radialGradient>
        </defs>

        {/* ── 房间外背景（柔和） ── */}
        <rect x="0" y="0" width="200" height="158" fill={isNight ? "#0a0c16" : "#1a1426"} />

        {/* ── 左墙 ── */}
        {poly([PL(0, 0), PL(1, 0), PL(1, 1), PL(0, 1)], c.wallL)}
        {/* ── 右墙 ── */}
        {poly([PR(0, 0), PR(1, 0), PR(1, 1), PR(0, 1)], c.wallR)}
        {/* 墙脚踢脚线 */}
        {poly([PL(0, 0.04), PL(1, 0.04), PL(1, 0), PL(0, 0)], c.trim)}
        {poly([PR(0, 0.04), PR(1, 0.04), PR(1, 0), PR(0, 0)], c.trim)}

        {/* ── 地板 ── */}
        {poly([P(0, 0), P(1, 0), P(1, 1), P(0, 1)], c.floor)}
        {/* 地板木纹格 */}
        {[0.2, 0.4, 0.6, 0.8].map((t) => (
          <g key={`fl-${t}`}>
            <line x1={P(t, 0)[0]} y1={P(t, 0)[1]} x2={P(t, 1)[0]} y2={P(t, 1)[1]} stroke={c.line} strokeWidth="0.6" opacity="0.5" />
            <line x1={P(0, t)[0]} y1={P(0, t)[1]} x2={P(1, t)[0]} y2={P(1, t)[1]} stroke={c.line} strokeWidth="0.6" opacity="0.5" />
          </g>
        ))}

        {/* ── 窗（右墙，看海） ── */}
        <g>
          {poly([PR(0.16, 0.34), PR(0.66, 0.34), PR(0.66, 0.86), PR(0.16, 0.86)], "#fff7ec")}
          {poly([PR(0.2, 0.4), PR(0.62, 0.4), PR(0.62, 0.82), PR(0.2, 0.82)], "url(#winSky)")}
          {/* 海平线 */}
          {poly([PR(0.2, 0.4), PR(0.62, 0.4), PR(0.62, 0.55), PR(0.2, 0.55)], c.sea, { opacity: 0.92 })}
          {/* 太阳/月亮 */}
          {(() => { const m = PR(0.5, 0.66); return <circle cx={m[0]} cy={m[1]} r="3.4" fill={c.sun} opacity="0.95" />; })()}
          {/* 窗格十字 */}
          <line x1={PR(0.41, 0.4)[0]} y1={PR(0.41, 0.4)[1]} x2={PR(0.41, 0.82)[0]} y2={PR(0.41, 0.82)[1]} stroke="#fff7ec" strokeWidth="1.1" />
          <line x1={PR(0.2, 0.61)[0]} y1={PR(0.2, 0.61)[1]} x2={PR(0.62, 0.61)[0]} y2={PR(0.62, 0.61)[1]} stroke="#fff7ec" strokeWidth="1.1" />
          {/* 夜晚窗外星星 */}
          {isNight && [[0.28, 0.74], [0.55, 0.78], [0.36, 0.68]].map((p, i) => {
            const q = PR(p[0], p[1]);
            return <rect key={`ws-${i}`} x={q[0]} y={q[1]} width="0.9" height="0.9" fill="#fff" style={{ animation: `starTwk ${2 + i}s ease-in-out infinite` }} />;
          })}
        </g>

        {/* ── 左墙：相框 K♡ ── */}
        <g>
          {poly([PL(0.66, 0.5), PL(0.86, 0.5), PL(0.86, 0.74), PL(0.66, 0.74)], "#caa46a")}
          {poly([PL(0.69, 0.54), PL(0.83, 0.54), PL(0.83, 0.7), PL(0.69, 0.7)], isNight ? "#2a3550" : "#cfe6f2")}
          {(() => { const m = PL(0.76, 0.62); return <text x={m[0]} y={m[1] + 2} fontSize="6" fill="#e87fa6" textAnchor="middle" fontFamily="serif" fontStyle="italic">K♡</text>; })()}
        </g>

        {/* ── 左墙：书架 ── */}
        <g>
          {poly([PL(0.16, 0.06), PL(0.5, 0.06), PL(0.5, 0.62), PL(0.16, 0.62)], c.trim)}
          {[0.18, 0.34, 0.5].map((vv, r) => (
            <g key={`shelf-${r}`}>
              {poly([PL(0.18, vv), PL(0.48, vv), PL(0.48, vv + 0.13), PL(0.18, vv + 0.13)], isNight ? "#241d3a" : "#8a6a52")}
              {[0.2, 0.27, 0.34, 0.41].map((uu, b) => {
                const cols = ["#d9686f", "#6f8fd9", "#d9b86f", "#7fc08a"];
                return <polygon key={`bk-${r}-${b}`} points={`${s(PL(uu, vv + 0.005))} ${s(PL(uu + 0.05, vv + 0.005))} ${s(PL(uu + 0.05, vv + 0.12))} ${s(PL(uu, vv + 0.12))}`} fill={cols[(r + b) % 4]} opacity={isNight ? 0.7 : 1} />;
              })}
            </g>
          ))}
        </g>

        {/* ── 吊灯 ── */}
        <g>
          <line x1="100" y1="4" x2="100" y2="20" stroke={c.trim} strokeWidth="1" />
          <ellipse cx="100" cy="22" rx="6" ry="3.2" fill={isNight ? "#ffe7a8" : "#f0e0c0"} />
          {isNight && <circle cx="100" cy="26" r="26" fill="url(#lampLight)" style={{ animation: "lampGlow 4s ease-in-out infinite" }} />}
        </g>

        {/* ── 星星挂旗 ── */}
        {[0.12, 0.3, 0.7, 0.88].map((t, i) => {
          const q = i < 2 ? PL(0.5 + (t - 0.2), 0.92) : PR(t - 0.1, 0.92);
          return <text key={`gar-${i}`} x={q[0]} y={q[1]} fontSize="5" textAnchor="middle" opacity="0.85">⭐</text>;
        })}

        {/* ── 地毯 ── */}
        {poly([P(0.24, 0.32), P(0.78, 0.32), P(0.78, 0.82), P(0.24, 0.82)], isNight ? "#5a4a72" : "#d98aa8", { opacity: 0.85 })}
        {poly([P(0.32, 0.4), P(0.7, 0.4), P(0.7, 0.74), P(0.32, 0.74)], isNight ? "#6a5a84" : "#ecb3c8", { opacity: 0.7 })}

        {/* ── 床（后右角） ── */}
        {(() => {
          const bh = 13;
          const f1 = P(0.56, 0.06), f2 = P(0.98, 0.06), f3 = P(0.98, 0.46), f4 = P(0.56, 0.46);
          return (
            <g>
              {/* 前侧面 */}
              {poly([f4, f3, up(f3, bh), up(f4, bh)], isNight ? "#3a2f4e" : "#9a6a52")}
              {poly([f1, f4, up(f4, bh), up(f1, bh)], isNight ? "#322840" : "#855a44")}
              {/* 床面 */}
              {poly([up(f1, bh), up(f2, bh), up(f3, bh), up(f4, bh)], isNight ? "#4a3d60" : "#e8d4e0")}
              {/* 枕头（后） */}
              {poly([up(P(0.6, 0.1), bh + 1), up(P(0.78, 0.1), bh + 1), up(P(0.78, 0.2), bh + 1), up(P(0.6, 0.2), bh + 1)], "#fff4fb")}
              {/* 被子 */}
              {poly([up(P(0.6, 0.24), bh + 1), up(P(0.96, 0.24), bh + 1), up(P(0.96, 0.44), bh + 1), up(P(0.6, 0.44), bh + 1)], isNight ? "#7a6f9a" : "#c98ab0")}
            </g>
          );
        })()}

        {/* ── 盆栽向日葵（前左角） ── */}
        {(() => { const b = P(0.12, 0.86); return (
          <g>
            {poly([[b[0] - 4, b[1]], [b[0] + 4, b[1]], [b[0] + 3, b[1] + 8], [b[0] - 3, b[1] + 8]], "#b5734a")}
            <rect x={b[0] - 0.7} y={b[1] - 11} width="1.4" height="12" fill="#4a7a32" />
            <circle cx={b[0]} cy={b[1] - 12} r="3.6" fill="#ffce4a" />
            <circle cx={b[0]} cy={b[1] - 12} r="1.6" fill="#7a4a18" />
          </g>
        ); })()}

        {/* ── 桌上小盆栽（可点击照护） ── */}
        {(() => {
          const tp = P(0.86, 0.8);
          const topY = tp[1] - 9;
          return (
            <g style={{ cursor: "pointer" }} onClick={onPlantClick}>
              {/* 小圆桌 */}
              <rect x={tp[0] - 1} y={topY} width="2" height="10" fill="#9a6a52" />
              <ellipse cx={tp[0]} cy={tp[1]} rx="7" ry="2.4" fill="#7a5240" />
              <ellipse cx={tp[0]} cy={topY} rx="7" ry="3" fill="#b5805f" />
              <ellipse cx={tp[0]} cy={topY} rx="5.4" ry="2.2" fill="#caa07a" />
              {/* 盆栽 */}
              <g transform={`translate(${(tp[0] - 8 * 0.85).toFixed(1)},${(topY - 18.5 * 0.85).toFixed(1)}) scale(0.85)`}>
                {PlantShapes(plantStage, "room")}
              </g>
              {/* 可点击提示光环 */}
              <circle cx={tp[0]} cy={topY - 7} r="11" fill="none" stroke="#bfe6c4" strokeWidth="0.7" opacity="0.5" style={{ animation: "plantHint 2.6s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }} />
              <text x={tp[0] + 9} y={topY - 12} fontSize="6" style={{ animation: "plantHint 2.6s ease-in-out infinite" }}>🔍</text>
            </g>
          );
        })()}

        {/* ════════ 按活动演出 ════════ */}

        {/* 吃饭：小桌 + 饭碗 + Kara */}
        {key === "eat" && (() => {
          const t = P(0.2, 0.66);
          return (
            <g>
              {/* 桌腿+桌面 */}
              <rect x={t[0] - 0.8} y={t[1] - 6} width="1.6" height="7" fill="#9a6a52" />
              <ellipse cx={t[0]} cy={t[1] - 6} rx="6" ry="2.6" fill="#b5805f" />
              {/* 饭碗 */}
              <ellipse cx={t[0]} cy={t[1] - 7} rx="3" ry="1.4" fill="#fff" />
              <ellipse cx={t[0]} cy={t[1] - 7.5} rx="2.4" ry="1" fill="#ffeede" />
              {/* yum */}
              <text x={t[0] + 8} y={t[1] - 10} fontSize="6" style={{ animation: "yumBounce 1.4s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }}>🍚</text>
            </g>
          );
        })()}

        {/* 洗澡：浴缸 + 泡泡 + Kara 露头 */}
        {key === "bath" && (() => {
          const b = P(0.66, 0.62);
          return (
            <g>
              {/* 缸体 */}
              <ellipse cx={b[0]} cy={b[1]} rx="12" ry="5.5" fill="#cfe2ec" />
              <ellipse cx={b[0]} cy={b[1] - 0.5} rx="10" ry="4.2" fill="#8fc6e0" />
              {/* 泡泡 */}
              {[[-6, -2], [0, -3], [5, -1.5], [-2, -4]].map((p, i) => (
                <circle key={`bub-${i}`} cx={b[0] + p[0]} cy={b[1] + p[1]} r={1.4 + (i % 2)} fill="#fff" opacity="0.85" style={{ animation: `bubblePop ${1.5 + i * 0.3}s ease-in-out infinite` }} />
              ))}
              {/* 露出的小脑袋 */}
              <g transform={`translate(${(b[0] - 8 * 0.7).toFixed(1)},${(b[1] - 9 * 0.7).toFixed(1)}) scale(0.7)`} shapeRendering="crispEdges">
                {pixelRects(KARA_SLEEP_HEAD.slice(0, 8), karaPalette(stageIndex), "bathhead")}
              </g>
              {/* 蒸汽 */}
              {[-5, 2, 7].map((dx, i) => (
                <circle key={`st-${i}`} cx={b[0] + dx} cy={b[1] - 6} r="2" fill="#fff" opacity="0.4" style={{ animation: `steamRise ${2 + i * 0.5}s ease-out infinite` }} />
              ))}
            </g>
          );
        })()}

        {/* 睡觉：Kara 躺床 + Zzz */}
        {key === "sleep" && (() => {
          const head = up(P(0.69, 0.16), 15);
          return (
            <g>
              <g transform={`translate(${head[0] - 8 * 0.62},${head[1] - 12 * 0.62}) scale(0.62)`} shapeRendering="crispEdges">
                {pixelRects(KARA_SLEEP_HEAD, karaPalette(stageIndex), "sleephead")}
              </g>
              {[0, 1, 2].map((i) => (
                <text key={`zzz-${i}`} x={head[0] + 6 + i * 3} y={head[1] - 4 - i * 3} fontSize={4 + i} fill="#bcd0ff" style={{ animation: `zzzFloat ${2.4}s ease-in-out ${i * 0.6}s infinite` }}>z</text>
              ))}
            </g>
          );
        })()}

        {/* 外出：房间空 + 挂牌 外出中… */}
        {key === "out" && (() => {
          const m = P(0.5, 0.52);
          return (
            <g style={{ animation: "signSway 3s ease-in-out infinite", transformBox: "fill-box", transformOrigin: "center" }}>
              <line x1={m[0]} y1={m[1] - 30} x2={m[0]} y2={m[1] - 16} stroke="#9a6a52" strokeWidth="1" />
              <rect x={m[0] - 17} y={m[1] - 16} width="34" height="14" rx="2" fill={isNight ? "#2a2440" : "#fff4ea"} stroke="#caa46a" strokeWidth="1" />
              <text x={m[0]} y={m[1] - 6} fontSize="6.5" textAnchor="middle" fill="#d76a86" fontFamily="'Noto Sans SC',sans-serif">🌳 外出中…</text>
            </g>
          );
        })()}

        {/* 站立/默认：Kara 在地毯上 */}
        {(key === "idle") && (
          <KaraSprite stageIdx={stageIndex} fx={idlePos[0]} fy={idlePos[1] + standY} />
        )}
        {key === "eat" && (
          <KaraSprite stageIdx={stageIndex} fx={eatPos[0]} fy={eatPos[1] + standY} />
        )}

        {/* 夜晚整体压暗 */}
        {isNight && <rect x="0" y="0" width="200" height="158" fill="#0a1024" opacity="0.28" pointerEvents="none" />}
      </svg>

      {/* ── 女儿头顶说话气泡 ── */}
      {showSpeech && speech && (
        <div style={{
          position: "absolute", left: "50%", top: "5%", transform: "translateX(-50%)",
          maxWidth: "76%", padding: "6px 11px", borderRadius: "12px",
          background: "rgba(255,250,253,0.95)", border: "2px solid rgba(232,127,166,0.6)",
          boxShadow: "0 3px 10px rgba(0,0,0,0.25)", animation: "speechPop 0.4s ease-out",
          pointerEvents: "none", zIndex: 3,
        }}>
          <p style={{
            fontSize: "10px", color: "#7a3a52", fontFamily: "'Noto Sans SC', sans-serif",
            lineHeight: 1.5, textAlign: "center", margin: 0, whiteSpace: "normal",
          }}>{speech}</p>
          {/* 气泡小尾巴 */}
          <div style={{
            position: "absolute", bottom: "-7px", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
            borderTop: "7px solid rgba(232,127,166,0.6)",
          }} />
          <div style={{
            position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
            borderTop: "5px solid rgba(255,250,253,0.95)",
          }} />
        </div>
      )}
    </div>
  );
}

/* ── 像素盆栽：星苗（手绘 SVG） ── */
export function PlantShapes(stage, k = "pl") {
  const green = stage === "wilt" ? "#8a9a5a" : "#4f9a3a";
  const greenD = stage === "wilt" ? "#6a7a45" : "#377a26";
  const els = [];
  // 花盆
  els.push(<polygon key={`${k}-pot`} points="4,13 12,13 11,19 5,19" fill="#c2764a" />);
  els.push(<polygon key={`${k}-rim`} points="3.6,12.6 12.4,12.6 11.8,14.2 4.2,14.2" fill="#a85f38" />);
  els.push(<rect key={`${k}-soil`} x="4.4" y="12.8" width="7.2" height="1.2" fill="#5a3a26" />);
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
    <svg viewBox="0 0 16 20" width={size} height={size * 20 / 16} style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>
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

/* ── 固定像素天空背景（取代海边小屋） ── */
export function PixelSky({ hour = 12 }) {
  const tod = getTod(hour);
  const c = ROOM_PAL[tod];
  const isNight = tod === "night";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: `linear-gradient(180deg, ${c.sky1} 0%, ${c.sky2} 55%, ${c.sky3} 100%)`, transition: "background 120s ease" }}>
      {isNight && Array.from({ length: 40 }, (_, i) => (
        <div key={`ps-${i}`} style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: `${(i * 53) % 60}%`, width: "2px", height: "2px", background: "#fff", opacity: 0.6, imageRendering: "pixelated" }} />
      ))}
      {/* 远处海平线 */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "26%", background: `linear-gradient(180deg, ${c.sea}, ${c.sea}cc)` }} />
      {/* 暗角 */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)", pointerEvents: "none" }} />
    </div>
  );
}
