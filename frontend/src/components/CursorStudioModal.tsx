"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Wand2, X, RotateCcw } from "lucide-react";
import {
  DEFAULT_CURSOR_SETTINGS,
  type CursorSettings,
  type CursorVariant,
} from "@/context/CursorContext";

const CURSOR_VARIANTS: {
  id: CursorVariant;
  name: string;
  icon: string;
  desc: string;
}[] = [
  {
    id: "starlight-pointer",
    name: "Starlight Pointer",
    icon: "✦",
    desc: "Warm gold neo-brutalist pointer with ink outline & starlight halo ring.",
  },
  {
    id: "astral-dot",
    name: "Astral Dot & Star",
    icon: "✧",
    desc: "Quiet star dot that blossoms into a diamond star on hover.",
  },
  {
    id: "crescent-moon",
    name: "Crescent Moon",
    icon: "☾",
    desc: "Tilted nocturnal crescent moon with a starlight tip hotspot.",
  },
];

export const CursorStudioModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: CursorSettings;
  onChange: (next: CursorSettings) => void;
}> = ({ isOpen, onClose, settings, onChange }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-y-0 right-0 left-0 md:left-[var(--app-sidebar-width,256px)] z-40 flex items-center justify-center p-3 sm:p-5 bg-[#040814]/75 backdrop-blur-md animate-pop-in transition-[left] duration-200 select-none"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="cursor-settings-title"
        className="cartoon-form-card relative w-full max-w-xl rounded-[26px] border-[2.5px] border-[#081326] bg-[#162d58] p-5 sm:p-6 text-[#eef6ff] shadow-[0_16px_48px_rgba(0,0,0,0.7),0_6px_0_0_#081326]"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-[#081326]/50 pb-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_3px_0_0_#081326]">
              <Wand2 size={20} strokeWidth={2.6} />
            </span>
            <div>
              <h2
                id="cursor-settings-title"
                className="text-lg font-extrabold text-white sm:text-xl"
              >
                Cursor Settings
              </h2>
              <p className="text-xs font-semibold text-[#a5c6f3]">
                Personalize your nocturnal pointer style and effects
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#0c1a36] text-[#cfe3fc] transition-all duration-200 hover:bg-[#183466] hover:rotate-90 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Close cursor settings"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-4">
          {/* Variant Cards */}
          <div>
            <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]">
              Pointer Variant
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {CURSOR_VARIANTS.map((opt) => {
                const selected = settings.variant === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange({ ...settings, variant: opt.id })}
                    data-cursor-accent="gold"
                    className={`group relative flex flex-col items-start rounded-2xl border-2 p-3 text-left transition-all duration-150 cursor-pointer ${
                      selected
                        ? "border-[#ffe082] bg-[#1d3c73] shadow-[0_3px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.14)]"
                        : "border-[#081326] bg-[#0f2040] shadow-[0_2px_0_0_#081326] hover:bg-[#152e59]"
                    }`}
                  >
                    <div className="mb-1.5 flex w-full items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                        <span className="text-sm text-[#ffe082]">{opt.icon}</span>
                        {opt.name}
                      </span>
                      {selected && (
                        <span className="rounded-full border border-[#081326] bg-[#ffe082] px-1.5 py-0.5 text-[9px] font-black text-[#081326] shadow-[0_1px_0_0_#081326]">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold leading-relaxed text-[#b8d5fa]">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Feature Toggles */}
          <div className="rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3.5 shadow-[0_2px_0_0_#081326] space-y-3">
            {/* Trailing Aura Ring */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-white">Trailing Aura Ring</p>
                <p className="text-[11px] font-semibold text-[#b8d5fa]">
                  Smooth floating halo that follows the cursor
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showTrailRing}
                onClick={() =>
                  onChange({ ...settings, showTrailRing: !settings.showTrailRing })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-[#081326] p-0.5 transition-colors duration-200 shadow-[0_2px_0_0_#081326] ${
                  settings.showTrailRing ? "bg-[#5bb8ff]" : "bg-[#0c1a36]"
                }`}
                aria-label="Toggle trailing aura ring"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full border-[1.5px] border-[#081326] bg-white shadow transition-transform duration-200 ${
                    settings.showTrailRing ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-[1px] w-full bg-[#081326]/40" />

            {/* Click Star Sparkles */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-white">Click Star Sparkles</p>
                <p className="text-[11px] font-semibold text-[#b8d5fa]">
                  Playful 4-point diamond starlight burst when clicking
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.clickSparkles}
                onClick={() =>
                  onChange({ ...settings, clickSparkles: !settings.clickSparkles })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-[#081326] p-0.5 transition-colors duration-200 shadow-[0_2px_0_0_#081326] ${
                  settings.clickSparkles ? "bg-[#ffe082]" : "bg-[#0c1a36]"
                }`}
                aria-label="Toggle click star sparkles"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full border-[1.5px] border-[#081326] bg-white shadow transition-transform duration-200 ${
                    settings.clickSparkles ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-[1px] w-full bg-[#081326]/40" />

            {/* Magnetic Snapping */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-white">Magnetic Icon Pull</p>
                <p className="text-[11px] font-semibold text-[#b8d5fa]">
                  Gentle spring snap towards interactive controls
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.magneticSnap}
                onClick={() =>
                  onChange({ ...settings, magneticSnap: !settings.magneticSnap })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-[#081326] p-0.5 transition-colors duration-200 shadow-[0_2px_0_0_#081326] ${
                  settings.magneticSnap ? "bg-[#64dfd0]" : "bg-[#0c1a36]"
                }`}
                aria-label="Toggle magnetic icon pull"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full border-[1.5px] border-[#081326] bg-white shadow transition-transform duration-200 ${
                    settings.magneticSnap ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Interactive Preview Strip */}
          <div className="rounded-2xl border-2 border-[#081326] bg-[#0c1a36] p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7ea4d4]">
                Interactive Preview
              </span>
              <span className="text-[10px] font-bold text-[#8fb1dc]">
                Hover &amp; test below
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-cursor-accent="gold"
                className="cartoon-form-btn-primary px-3 py-1.5 text-xs font-extrabold rounded-xl border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_2px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.4)] hover:bg-[#fff0a8] active:translate-y-0.5 transition-all cursor-pointer"
              >
                ✦ Gold Hover
              </button>
              <button
                type="button"
                data-cursor-accent="sky"
                className="cartoon-form-btn-secondary px-3 py-1.5 text-xs font-extrabold rounded-xl border-2 border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_2px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.4)] hover:bg-[#77c6ff] active:translate-y-0.5 transition-all cursor-pointer"
              >
                ☾ Sky Hover
              </button>
              <button
                type="button"
                data-cursor-accent="mint"
                className="px-3 py-1.5 text-xs font-extrabold rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.4)] hover:bg-[#85e9dd] active:translate-y-0.5 transition-all cursor-pointer"
              >
                ↗ Mint Hover
              </button>
              <input
                type="text"
                placeholder="Test star caret..."
                className="rounded-xl border-2 border-[#081326] bg-[#162d58] px-3 py-1.5 text-xs font-bold text-white placeholder-[#7ea4d4] focus:border-[#5bb8ff] focus:outline-none shadow-[inset_0_2px_2px_rgba(0,0,0,0.3)] flex-1 min-w-[130px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-[#081326]/50 pt-3.5">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_CURSOR_SETTINGS)}
            className="cartoon-form-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border-2 border-[#081326] bg-[#0f2040] text-[#a5c6f3] shadow-[0_2px_0_0_#081326] hover:bg-[#18335f] hover:text-white active:translate-y-0.5 transition-all cursor-pointer"
          >
            <RotateCcw size={13} strokeWidth={2.4} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="cartoon-form-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_3px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.45)] hover:bg-[#77c6ff] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
};
