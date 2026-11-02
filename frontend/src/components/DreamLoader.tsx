"use client";

/**
 * DreamLoader — Themed loading component for Stardrift.
 *
 * Variants:
 *  - "full"    → Full-page dreamscape with floating moon, stars, clouds, and message
 *  - "section" → Card-sized loader for inline content areas
 *  - "inline"  → Tiny spinner for buttons (replaces Loader2 animate-spin)
 */

import { JOURNAL_FONT } from "./JournalTheme";

/* ---------- Tiny inline spinner (button-level) ---------- */
function InlineSpinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`dream-inline-spinner ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

/* ---------- Floating star SVG ---------- */
function Star({
  size,
  color,
  delay,
  x,
  y,
  duration,
}: {
  size: number;
  color: string;
  delay: number;
  x: string;
  y: string;
  duration: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="dream-float-star"
      style={{
        position: "absolute",
        left: x,
        top: y,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
      aria-hidden="true"
    >
      <path
        d="M12 2C12.7 7.6 16.4 11.3 22 12C16.4 12.7 12.7 16.4 12 22C11.3 16.4 7.6 12.7 2 12C7.6 11.3 11.3 7.6 12 2Z"
        fill={color}
        stroke="#081326"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- Crescent Moon SVG ---------- */
function CrescentMoon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g transform="translate(8, 8) scale(3.5)">
        {/* Full crescent silhouette with dark cartoon outline */}
        <path
          d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          fill="#ffe082"
          stroke="#081326"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cartoon glossy highlight on outer rim */}
        <path
          d="M5.5 10 A 7 7 0 0 0 12 18.5"
          stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

/* ---------- Drifting cloud SVG ---------- */
function DriftCloud({
  delay,
  y,
  size,
  opacity,
  direction,
}: {
  delay: number;
  y: string;
  size: number;
  opacity: number;
  direction: "left" | "right";
}) {
  return (
    <svg
      viewBox="0 0 220 90"
      fill="none"
      className={`dream-drift-cloud dream-drift-${direction}`}
      style={{
        position: "absolute",
        top: y,
        width: size,
        opacity,
        animationDelay: `${delay}s`,
      }}
      aria-hidden="true"
    >
      <path
        d="M28 82H190C203.255 82 214 71.2548 214 58C214 45.792 204.88 35.7145 193.079 34.2016C189.261 18.0273 174.725 6 157.4 6C143.829 6 131.954 13.386 125.605 24.3374C119.994 19.7544 112.833 17 105 17C88.2355 17 74.4776 29.6691 72.6977 45.9597C68.8312 43.4557 64.2227 42 59.2727 42C45.315 42 34 53.315 34 67.2727C34 68.1986 34.0497 69.1128 34.1466 70.0131C23.5499 70.7222 15 74.5 15 78.5C15 80.9853 20.8203 82 28 82Z"
        fill="#1c3c73"
        stroke="#081326"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M135 22C141 14 149 11 158 11C170 11 181 18 186 29"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Dot constellation ---------- */
function Constellation() {
  const dots = [
    { x: "18%", y: "22%", size: 3, delay: 0 },
    { x: "22%", y: "30%", size: 2, delay: 0.3 },
    { x: "26%", y: "18%", size: 2, delay: 0.6 },
    { x: "72%", y: "28%", size: 3, delay: 0.2 },
    { x: "76%", y: "20%", size: 2.5, delay: 0.5 },
    { x: "78%", y: "35%", size: 2, delay: 0.8 },
    { x: "45%", y: "15%", size: 2, delay: 0.4 },
    { x: "55%", y: "12%", size: 2.5, delay: 0.7 },
    { x: "12%", y: "60%", size: 2, delay: 1.0 },
    { x: "85%", y: "55%", size: 2, delay: 0.9 },
  ];

  return (
    <>
      {dots.map((dot, i) => (
        <span
          key={i}
          className="dream-constellation-dot"
          style={{
            position: "absolute",
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            animationDelay: `${dot.delay}s`,
          }}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/* ---------- Loading messages ---------- */
const LOADING_MESSAGES = [
  "Drifting into your dreams…",
  "Opening your nightbook…",
  "Gathering stardust…",
  "Weaving dream threads…",
  "Tuning into the cosmos…",
];

function getLoadingMessage(): string {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

/* ---------- Section loader ---------- */
function SectionLoader({ message }: { message?: string }) {
  return (
    <div className="dream-section-loader" style={{ fontFamily: JOURNAL_FONT }}>
      <DreamLoaderStyles />
      <div className="dream-section-inner">
        <CrescentMoon className="dream-section-moon" />
        <div className="dream-section-sparkles">
          <Star size={12} color="#ffe082" delay={0} x="0%" y="30%" duration={3} />
          <Star size={9} color="#8fd0ff" delay={0.5} x="80%" y="10%" duration={3.5} />
          <Star size={10} color="#64dfd0" delay={1} x="60%" y="70%" duration={4} />
        </div>
        <p className="dream-section-text">{message || getLoadingMessage()}</p>
      </div>
    </div>
  );
}

/* ---------- Full-page loader ---------- */
function FullPageLoader({ message }: { message?: string }) {
  return (
    <div className="dream-full-loader" style={{ fontFamily: JOURNAL_FONT }}>
      <DreamLoaderStyles />

      {/* Background gradient */}
      <div className="dream-full-bg" aria-hidden="true" />

      {/* Constellation dots */}
      <Constellation />

      {/* Drifting clouds */}
      <DriftCloud delay={0} y="62%" size={180} opacity={0.5} direction="right" />
      <DriftCloud delay={4} y="72%" size={140} opacity={0.35} direction="left" />
      <DriftCloud delay={8} y="80%" size={200} opacity={0.45} direction="right" />

      {/* Central focus */}
      <div className="dream-full-center">
        {/* Glow ring */}
        <div className="dream-glow-ring" aria-hidden="true" />

        {/* Moon */}
        <div className="dream-moon-wrap">
          <CrescentMoon className="dream-full-moon" />
        </div>

        {/* Orbiting stars */}
        <div className="dream-orbit">
          <Star size={14} color="#ffe082" delay={0} x="0" y="0" duration={3} />
        </div>
        <div className="dream-orbit dream-orbit-2">
          <Star size={10} color="#8fd0ff" delay={0.8} x="0" y="0" duration={3.5} />
        </div>
        <div className="dream-orbit dream-orbit-3">
          <Star size={11} color="#64dfd0" delay={1.5} x="0" y="0" duration={4} />
        </div>

        {/* Scattered sparkles */}
        <Star size={16} color="#ffe082" delay={0.2} x="15%" y="25%" duration={4.2} />
        <Star size={11} color="#94adff" delay={0.7} x="78%" y="20%" duration={3.3} />
        <Star size={13} color="#ff859d" delay={1.2} x="82%" y="65%" duration={3.8} />
        <Star size={9} color="#64dfd0" delay={0.4} x="20%" y="70%" duration={4.5} />
        <Star size={10} color="#ffe082" delay={1.8} x="65%" y="80%" duration={3.6} />

        {/* Text */}
        <p className="dream-full-text">{message || getLoadingMessage()}</p>
      </div>
    </div>
  );
}

/* ============================================================
   Styles (injected once per render — CSR safe)
   ============================================================ */
function DreamLoaderStyles() {
  return (
    <style>{`
      /* ---- Inline spinner (button-level) ---- */
      .dream-inline-spinner {
        display: inline-block;
        border: 2.5px solid rgba(91, 184, 255, 0.25);
        border-top-color: #5bb8ff;
        border-radius: 50%;
        animation: dreamSpin 0.65s linear infinite;
      }

      @keyframes dreamSpin {
        to { transform: rotate(360deg); }
      }

      /* ---- Constellation dots ---- */
      .dream-constellation-dot {
        border-radius: 50%;
        background: #94adff;
        animation: dreamPulse 2.4s ease-in-out infinite;
      }

      @keyframes dreamPulse {
        0%, 100% { opacity: 0.25; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.6); }
      }

      /* ---- Floating stars ---- */
      .dream-float-star {
        animation: dreamStarFloat 3s ease-in-out infinite;
      }

      @keyframes dreamStarFloat {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
        50% { transform: translateY(-8px) scale(1.15); opacity: 1; }
      }

      /* ---- Drifting clouds ---- */
      .dream-drift-cloud {
        animation: dreamDriftRight 18s linear infinite;
      }
      .dream-drift-left {
        animation-name: dreamDriftLeft;
      }

      @keyframes dreamDriftRight {
        0% { left: -220px; }
        100% { left: calc(100% + 20px); }
      }

      @keyframes dreamDriftLeft {
        0% { right: -220px; left: auto; }
        100% { right: calc(100% + 20px); left: auto; }
      }

      /* ---- Full page loader ---- */
      .dream-full-loader {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100dvh - 5.5rem);
        width: 100%;
        overflow: hidden;
      }

      .dream-full-bg {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse at 50% 40%,
          rgba(21, 44, 87, 0.6) 0%,
          transparent 70%
        );
      }

      .dream-full-center {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        z-index: 10;
      }

      /* Glow behind moon */
      .dream-glow-ring {
        position: absolute;
        top: -10px;
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(255, 224, 130, 0.18) 0%,
          rgba(91, 184, 255, 0.08) 50%,
          transparent 70%
        );
        animation: dreamGlow 4s ease-in-out infinite;
      }

      @keyframes dreamGlow {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.15); opacity: 1; }
      }

      /* Moon */
      .dream-moon-wrap {
        width: 80px;
        height: 80px;
        animation: dreamMoonBob 5s ease-in-out infinite;
        filter: drop-shadow(0 4px 20px rgba(255, 224, 130, 0.35));
      }

      .dream-full-moon {
        width: 100%;
        height: 100%;
      }

      @keyframes dreamMoonBob {
        0%, 100% { transform: translateY(0) rotate(-3deg); }
        50% { transform: translateY(-10px) rotate(3deg); }
      }

      /* Orbiting stars */
      .dream-orbit {
        position: absolute;
        top: 0;
        width: 120px;
        height: 120px;
        animation: dreamOrbit 6s linear infinite;
        pointer-events: none;
      }
      .dream-orbit svg {
        position: absolute;
        top: -7px;
        left: 50%;
        transform: translateX(-50%);
      }
      .dream-orbit-2 {
        width: 150px;
        height: 150px;
        animation-duration: 9s;
        animation-direction: reverse;
      }
      .dream-orbit-3 {
        width: 100px;
        height: 100px;
        animation-duration: 7s;
      }

      @keyframes dreamOrbit {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Text */
      .dream-full-text {
        font-size: 0.95rem;
        font-weight: 700;
        color: #8fb2de;
        letter-spacing: 0.02em;
        animation: dreamTextPulse 3s ease-in-out infinite;
        text-align: center;
      }

      @keyframes dreamTextPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      /* ---- Section loader ---- */
      .dream-section-loader {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        min-height: 200px;
        padding: 2rem;
      }

      .dream-section-inner {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .dream-section-moon {
        width: 48px;
        height: 48px;
        filter: drop-shadow(0 3px 12px rgba(255, 224, 130, 0.3));
        animation: dreamMoonBob 5s ease-in-out infinite;
      }

      .dream-section-sparkles {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .dream-section-text {
        font-size: 0.85rem;
        font-weight: 700;
        color: #7899c2;
        animation: dreamTextPulse 3s ease-in-out infinite;
      }

      /* ---- Reduced motion ---- */
      @media (prefers-reduced-motion: reduce) {
        .dream-inline-spinner,
        .dream-constellation-dot,
        .dream-float-star,
        .dream-drift-cloud,
        .dream-glow-ring,
        .dream-moon-wrap,
        .dream-orbit,
        .dream-full-text,
        .dream-section-text,
        .dream-section-moon {
          animation: none !important;
        }
        .dream-constellation-dot { opacity: 0.5; }
        .dream-float-star { opacity: 0.8; }
        .dream-full-text,
        .dream-section-text { opacity: 0.8; }
      }
    `}</style>
  );
}

/* ============================================================
   Main export
   ============================================================ */
export type DreamLoaderVariant = "full" | "section" | "inline";

export default function DreamLoader({
  variant = "full",
  message,
  size,
  className = "",
}: {
  variant?: DreamLoaderVariant;
  message?: string;
  size?: number;
  className?: string;
}) {
  if (variant === "inline") {
    return <InlineSpinner size={size || 18} className={className} />;
  }

  if (variant === "section") {
    return <SectionLoader message={message} />;
  }

  return <FullPageLoader message={message} />;
}

