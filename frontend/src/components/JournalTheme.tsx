"use client";

import {
  CloudRain,
  Feather,
  Heart,
  Smile,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const JOURNAL_FONT = "'Quicksand', ui-rounded, 'Nunito', sans-serif";

/** Illustrated puffy cartoon cloud */
export function CartoonCloud({
  fill = "#1c3c73",
  className = "",
}: {
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 220 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-float-slow transition-transform duration-500 ${className}`}
      aria-hidden="true"
    >
      <path
        d="M28 82H190C203.255 82 214 71.2548 214 58C214 45.792 204.88 35.7145 193.079 34.2016C189.261 18.0273 174.725 6 157.4 6C143.829 6 131.954 13.386 125.605 24.3374C119.994 19.7544 112.833 17 105 17C88.2355 17 74.4776 29.6691 72.6977 45.9597C68.8312 43.4557 64.2227 42 59.2727 42C45.315 42 34 53.315 34 67.2727C34 68.1986 34.0497 69.1128 34.1466 70.0131C23.5499 70.7222 15 74.5 15 78.5C15 80.9853 20.8203 82 28 82Z"
        fill={fill}
        stroke="#081326"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M135 22C141 14 149 11 158 11C170 11 181 18 186 29"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Illustrated 4-point cartoon star */
export function CartoonSparkle({
  size = 14,
  color = "#ffe082",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-twinkle hover:scale-125 transition-transform duration-300 ${className}`}
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

/** Maps a mood key to a Lucide icon + cartoon sticker color (no emojis) */
export function getMoodStickerStyle(mood: string): {
  icon: LucideIcon;
  bg: string;
} {
  const key = (mood || "").toLowerCase();

  if (key.includes("calm") || key.includes("serene") || key.includes("peace")) {
    return { icon: Feather, bg: "#64dfd0" };
  }
  if (key.includes("happy") || key.includes("joy") || key.includes("excit")) {
    return { icon: Smile, bg: "#ffe082" };
  }
  if (key.includes("sad") || key.includes("melanchol") || key.includes("grief")) {
    return { icon: CloudRain, bg: "#8ec5ff" };
  }
  if (
    key.includes("anx") ||
    key.includes("fear") ||
    key.includes("scary") ||
    key.includes("night") ||
    key.includes("stress")
  ) {
    return { icon: Zap, bg: "#ff9bb0" };
  }
  if (key.includes("love") || key.includes("warm")) {
    return { icon: Heart, bg: "#ffb3c6" };
  }
  return { icon: Sparkles, bg: "#94adff" };
}

/**
 * Shared cartoon-blue styles.
 * `.jr-form-scope` re-skins the existing <DreamForm /> markup
 * (glass-card / input-glass / btn-* / tag-chip) without editing that component.
 */
export function JournalStyles() {
  return (
    <style>{`
      .jr-card {
        border: 2.5px solid #081326;
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
      }

      .jr-lift {
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease, border-color 0.2s ease;
      }

      .jr-lift:hover {
        transform: translateY(-4px) scale(1.008);
        box-shadow: 0 10px 0 0 #081326, 0 0 24px rgba(91, 184, 255, 0.15), inset 0 2px 0 0 rgba(255, 255, 255, 0.26);
      }

      .jr-btn-primary,
      .jr-btn-secondary,
      .jr-btn-danger {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: 2.5px solid #081326;
        border-radius: 1rem;
        font-weight: 800;
        transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, background-color 0.18s ease;
      }

      .jr-btn-primary {
        background-color: #5bb8ff;
        color: #081326;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
      }
      .jr-btn-primary:hover:not(:disabled) {
        background-color: #77c6ff;
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 0 0 #081326, 0 0 16px rgba(91, 184, 255, 0.35), inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
      }

      .jr-btn-secondary {
        background-color: #162f5c;
        color: #eef6ff;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
      }
      .jr-btn-secondary:hover:not(:disabled) {
        background-color: #1f417d;
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.22);
      }

      .jr-btn-danger {
        background-color: #ff859d;
        color: #081326;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.4);
      }
      .jr-btn-danger:hover:not(:disabled) {
        background-color: #ff9cb0;
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 6px 0 0 #081326, 0 0 16px rgba(255, 133, 157, 0.35), inset 0 2px 0 0 rgba(255, 255, 255, 0.5);
      }

      .jr-btn-primary:active:not(:disabled),
      .jr-btn-secondary:active:not(:disabled),
      .jr-btn-danger:active:not(:disabled) {
        transform: translateY(2px) scale(0.98);
        box-shadow: 0 1px 0 0 #081326;
      }

      .jr-btn-primary:disabled,
      .jr-btn-secondary:disabled,
      .jr-btn-danger:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .jr-btn-primary:focus-visible,
      .jr-btn-secondary:focus-visible,
      .jr-btn-danger:focus-visible,
      .jr-chip:focus-visible,
      .jr-input:focus-visible {
        outline: 3px solid #ffe082;
        outline-offset: 2px;
      }

      .jr-input {
        width: 100%;
        height: 3rem;
        padding: 0.75rem 1rem;
        border: 2.5px solid #081326;
        border-radius: 1rem;
        background: #0f2040;
        color: #eef6ff;
        font-size: 0.9rem;
        font-weight: 600;
        outline: none;
        transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      }
      .jr-input.jr-input-search {
        padding-left: 3rem !important;
        padding-right: 2.75rem !important;
      }
      .jr-input::placeholder { color: #7899c2; }
      .jr-input:focus {
        border-color: #5bb8ff;
        background: #102347;
        box-shadow: 0 0 0 3px rgba(91, 184, 255, 0.22);
      }

      .jr-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.8rem;
        border: 2px solid #081326;
        border-radius: 999px;
        background: #0e2040;
        color: #bed6f5;
        font-size: 0.75rem;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.14s ease, background-color 0.14s ease, color 0.14s ease;
      }
      .jr-chip:hover { background: #1c396e; color: #ffffff; transform: translateY(-1px); }
      .jr-chip[data-active="true"] {
        color: #081326;
        box-shadow: 0 2px 0 0 #081326;
      }

      @keyframes jrFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
      }
      @keyframes jrPopIn {
        0% { transform: scale(0.94) translateY(8px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }
      .jr-pop { animation: jrPopIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }

      /* ---- Re-skin the existing DreamForm markup ---- */
      .jr-form-scope .glass-card {
        background: #162e59 !important;
        border: 2.5px solid #081326 !important;
        border-radius: 26px !important;
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14) !important;
        backdrop-filter: none !important;
      }

      .jr-form-scope .input-glass,
      .jr-form-scope input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),
      .jr-form-scope textarea {
        background: #0f2040 !important;
        border: 2.5px solid #081326 !important;
        border-radius: 14px !important;
        color: #eef6ff !important;
        font-weight: 600 !important;
      }

      .jr-form-scope select {
        appearance: none !important;
        -webkit-appearance: none !important;
        -moz-appearance: none !important;
        background-color: #0f2040 !important;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%236bc2ff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
        background-repeat: no-repeat !important;
        background-position: right 1.15rem center !important;
        background-size: 18px 18px !important;
        padding-right: 2.85rem !important;
        border: 2.5px solid #081326 !important;
        border-radius: 14px !important;
        color: #eef6ff !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }

      .jr-form-scope select:hover {
        border-color: #5bb8ff !important;
      }

      .jr-form-scope select option {
        background-color: #0d1d3a !important;
        color: #eef6ff !important;
        padding: 0.6rem 1rem !important;
        font-weight: 600 !important;
      }

      .jr-form-scope .input-glass:focus,
      .jr-form-scope input:focus,
      .jr-form-scope textarea:focus,
      .jr-form-scope select:focus {
        border-color: #5bb8ff !important;
        box-shadow: 0 0 0 3px rgba(91, 184, 255, 0.22) !important;
        outline: none !important;
      }

      .jr-form-scope label,
      .jr-form-scope legend {
        color: #cfe3fc !important;
        font-weight: 700 !important;
      }

      .jr-form-scope h1,
      .jr-form-scope h2,
      .jr-form-scope h3 { color: #ffffff !important; }

      .jr-form-scope .btn-primary {
        background: #5bb8ff !important;
        color: #081326 !important;
        border: 2.5px solid #081326 !important;
        border-radius: 16px !important;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45) !important;
        font-weight: 800 !important;
      }
      .jr-form-scope .btn-secondary,
      .jr-form-scope .btn-ghost {
        background: #162f5c !important;
        color: #eef6ff !important;
        border: 2.5px solid #081326 !important;
        border-radius: 16px !important;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14) !important;
        font-weight: 800 !important;
      }
      .jr-form-scope .btn-danger {
        background: #ff859d !important;
        color: #081326 !important;
        border: 2.5px solid #081326 !important;
        border-radius: 16px !important;
        box-shadow: 0 4px 0 0 #081326 !important;
        font-weight: 800 !important;
      }
      .jr-form-scope .btn-primary:active,
      .jr-form-scope .btn-secondary:active,
      .jr-form-scope .btn-ghost:active,
      .jr-form-scope .btn-danger:active {
        transform: translateY(2px);
        box-shadow: 0 1px 0 0 #081326 !important;
      }

      .jr-form-scope .tag-chip {
        background: #1c396e !important;
        border: 2px solid #081326 !important;
        border-radius: 999px !important;
        color: #cfe3fc !important;
        font-weight: 700 !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .jr-lift,
        .jr-btn-primary,
        .jr-btn-secondary,
        .jr-btn-danger,
        .jr-chip,
        .jr-pop {
          transition: none !important;
          animation: none !important;
        }
      }
    `}</style>
  );
}