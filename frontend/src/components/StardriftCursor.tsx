"use client";

import React, { useEffect, useRef, useState } from "react";
import type { CursorSettings, CursorAccent } from "@/context/CursorContext";

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  isStar: boolean;
}

const ACCENT_MAP: Record<
  CursorAccent,
  { border: string; fill: string; solid: string; glow: string }
> = {
  sky: {
    border: "rgba(100, 194, 255, 0.65)",
    fill: "rgba(100, 194, 255, 0.10)",
    solid: "#64C2FF",
    glow: "rgba(100, 194, 255, 0.28)",
  },
  gold: {
    border: "rgba(253, 224, 115, 0.75)",
    fill: "rgba(253, 224, 115, 0.12)",
    solid: "#FDE073",
    glow: "rgba(253, 224, 115, 0.32)",
  },
  mint: {
    border: "rgba(100, 223, 208, 0.75)",
    fill: "rgba(100, 223, 208, 0.12)",
    solid: "#64dfd0",
    glow: "rgba(100, 223, 208, 0.30)",
  },
  lavender: {
    border: "rgba(184, 158, 255, 0.75)",
    fill: "rgba(184, 158, 255, 0.12)",
    solid: "#b89eff",
    glow: "rgba(184, 158, 255, 0.30)",
  },
};

export const StardriftCursor: React.FC<{
  settings: CursorSettings;
}> = ({ settings }) => {
  const pointerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Use refs for real-time 60/120fps coordinates with zero React re-render lag
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const magneticTarget = useRef<{ x: number; y: number } | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [accent, setAccent] = useState<CursorAccent>("sky");
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
    }
  }, []);

  // Manage body cursor classes
  useEffect(() => {
    if (isTouchDevice) return;
    const body = document.body;
    body.classList.add("stardrift-cursor-active");
    return () => {
      body.classList.remove("stardrift-cursor-active");
    };
  }, [isTouchDevice]);

  // Pointer listeners & rAF loop
  useEffect(() => {
    if (isTouchDevice) return;

    let rafId: number;

    const handlePointerMove = (e: PointerEvent) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (!isVisible) {
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
        setIsVisible(true);
      }

      // Instant primary pointer transform (0ms latency)
      if (pointerRef.current) {
        pointerRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Inspect hovered element for interactive state & theme accent
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const textInputEl = target.closest(
        'input[type="text"], input[type="search"], input[type="email"], textarea, [contenteditable="true"]'
      );
      if (textInputEl) {
        setIsTextMode(true);
        setIsHovering(false);
        magneticTarget.current = null;
        return;
      } else {
        setIsTextMode(false);
      }

      const interactiveEl = target.closest(
        'button, a, [role="button"], [data-cursor="pointer"], input[type="range"], select'
      ) as HTMLElement | null;

      const customAccentEl = target.closest("[data-cursor-accent]") as HTMLElement | null;
      const detectedAccent =
        (customAccentEl?.getAttribute("data-cursor-accent") as CursorAccent) || null;

      if (interactiveEl) {
        setIsHovering(true);
        setAccent(detectedAccent || "gold");

        // Optional subtle magnetic pull toward small icon buttons
        if (settings.magneticSnap && interactiveEl.hasAttribute("data-cursor-magnetic")) {
          const rect = interactiveEl.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          magneticTarget.current = {
            x: e.clientX + (centerX - e.clientX) * 0.28,
            y: e.clientY + (centerY - e.clientY) * 0.28,
          };
        } else {
          magneticTarget.current = null;
        }
      } else {
        setIsHovering(false);
        setAccent(detectedAccent || "sky");
        magneticTarget.current = null;
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      setIsPressed(true);

      if (settings.clickSparkles) {
        const palette = ["#FDE073", "#64C2FF", "#64dfd0", "#b89eff"];
        const count = 4;
        const baseId = Date.now() + Math.random();
        const created: SparkleParticle[] = Array.from({ length: count }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.5 - 0.25);
          const dist = 16 + Math.random() * 12;
          return {
            id: baseId + i,
            x: e.clientX,
            y: e.clientY,
            vx: Math.cos(angle) * dist,
            vy: Math.sin(angle) * dist,
            size: i % 2 === 0 ? 10 : 6,
            color: palette[i % palette.length],
            rotation: Math.round(Math.random() * 60 - 30),
            isStar: i % 2 === 0,
          };
        });

        setSparkles((prev) => [...prev.slice(-12), ...created]);
        window.setTimeout(() => {
          setSparkles((prev) => prev.filter((p) => !created.some((c) => c.id === p.id)));
        }, 430);
      }
    };

    const handlePointerUp = () => {
      setIsPressed(false);
    };

    const handlePointerLeave = () => {
      setIsVisible(false);
    };

    const animateRing = () => {
      const destX = magneticTarget.current ? magneticTarget.current.x : mousePos.current.x;
      const destY = magneticTarget.current ? magneticTarget.current.y : mousePos.current.y;

      // Smooth spring-like interpolation for the trailing aura ring
      ringPos.current.x += (destX - ringPos.current.x) * 0.22;
      ringPos.current.y += (destY - ringPos.current.y) * 0.22;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId = requestAnimationFrame(animateRing);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    rafId = requestAnimationFrame(animateRing);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("mouseleave", handlePointerLeave);
      cancelAnimationFrame(rafId);
    };
  }, [isVisible, settings.variant, settings.clickSparkles, settings.magneticSnap, isTouchDevice]);

  if (isTouchDevice) {
    return null;
  }

  const currentAccent = ACCENT_MAP[accent];
  const baseRingSize = settings.ringSize;
  const computedRingSize = isPressed
    ? baseRingSize * 0.78
    : isHovering
    ? baseRingSize * 1.38
    : baseRingSize;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Click Starlight Sparkle Burst Particles */}
      {sparkles.map((sp) => (
        <SparkleBurstItem key={sp.id} particle={sp} />
      ))}

      {/* Smooth Trailing Nocturnal Aura Ring */}
      {settings.showTrailRing && (
        <div
          ref={ringRef}
          className="fixed top-0 left-0 will-change-transform"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        >
          <div
            className="relative flex items-center justify-center rounded-full transition-transform duration-150 ease-out"
            style={{
              width: isTextMode ? 12 : baseRingSize,
              height: isTextMode ? 26 : baseRingSize,
              marginLeft: isTextMode ? -6 : -baseRingSize / 2,
              marginTop: isTextMode ? -13 : -baseRingSize / 2,
              borderRadius: isTextMode ? "4px" : "9999px",
              border: `1.75px solid ${currentAccent.border}`,
              backgroundColor: currentAccent.fill,
              boxShadow: isHovering
                ? `0 0 14px ${currentAccent.glow}`
                : "none",
              transform: isPressed
                ? "scale(0.85)"
                : isHovering
                ? "scale(1.2)"
                : "scale(1)",
            }}
          >
            {/* Tiny orbiting starlight mote on the ring rim */}
            {!isTextMode && (
              <span
                className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-[#081326] transition-transform duration-150"
                style={{
                  backgroundColor: isHovering ? "#FDE073" : currentAccent.solid,
                  transform: isHovering ? "scale(1.2)" : "scale(0.9)",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Primary Zero-Latency Pointer */}
      <div
        ref={pointerRef}
        className="fixed top-0 left-0 will-change-transform"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 120ms ease",
        }}
      >
        <div
          className="relative transition-transform duration-100 ease-out"
          style={{
            transform: isPressed
              ? "translate(1.5px, 1.5px) scale(0.84)"
              : isHovering
              ? "scale(1.08)"
              : "scale(1)",
          }}
        >
          {isTextMode ? (
            /* Star-Tipped Nocturnal Caret for Text Inputs */
            <div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
                <path
                  d="M8 1L9.5 4.2L12.7 5.7L9.5 7.2L8 10.4L6.5 7.2L3.3 5.7L6.5 4.2L8 1Z"
                  fill="#FDE073"
                  stroke="#081326"
                  strokeWidth="1.5"
                />
                <rect
                  x="6.75"
                  y="9"
                  width="2.5"
                  height="12"
                  rx="1.25"
                  fill="#64C2FF"
                  stroke="#081326"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
          ) : settings.variant === "starlight-pointer" ? (
            /* Variant 1: Neo-Brutalist Starlight Pointer (Default — Matches Stardrift UI) */
            <div className="relative -left-[4px] -top-[3px]">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Hard dark-navy offset shadow matching button/card shadows */}
                <path
                  d="M5.5 3.8L22.2 11.4C23.5 12 23.4 13.9 22 14.3L14.8 16.4L11.6 23.2C11 24.5 9.1 24.3 8.7 22.9L4.1 5.4C3.8 4.2 4.4 3.3 5.5 3.8Z"
                  fill="#070C17"
                  transform="translate(1.6, 2.2)"
                />
                {/* Main Pointer Body */}
                <path
                  d="M5.5 3.8L22.2 11.4C23.5 12 23.4 13.9 22 14.3L14.8 16.4L11.6 23.2C11 24.5 9.1 24.3 8.7 22.9L4.1 5.4C3.8 4.2 4.4 3.3 5.5 3.8Z"
                  fill={isHovering ? "#64C2FF" : "#FDE073"}
                  stroke="#081326"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />
                {/* Subtle inner specular highlight line */}
                <path
                  d="M6.8 6.5L18.4 11.8"
                  stroke="rgba(255,255,255,0.55)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                {/* Accompanying 4-point star sparkle near pointer tail */}
                <path
                  d="M21.5 3.2L22.4 5.5L24.7 6.4L22.4 7.3L21.5 9.6L20.6 7.3L18.3 6.4L20.6 5.5L21.5 3.2Z"
                  fill={isHovering ? "#FDE073" : "#64C2FF"}
                  stroke="#081326"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : settings.variant === "astral-dot" ? (
            /* Variant 2: Minimalist Astral Star Dot */
            <div className="-translate-x-1/2 -translate-y-1/2">
              {isHovering ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path
                    d="M11 2L13.3 8.7L20 11L13.3 13.3L11 20L8.7 13.3L2 11L8.7 8.7L11 2Z"
                    fill="#070C17"
                    transform="translate(1, 1.5)"
                  />
                  <path
                    d="M11 2L13.3 8.7L20 11L13.3 13.3L11 20L8.7 13.3L2 11L8.7 8.7L11 2Z"
                    fill="#FDE073"
                    stroke="#081326"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <div
                  className="h-3.5 w-3.5 rounded-full border-2 border-[#081326] bg-[#FDE073]"
                  style={{
                    boxShadow: "0 2px 0 #070C17",
                  }}
                />
              )}
            </div>
          ) : (
            /* Variant 3: Crescent Nightbook Pointer */
            <div className="relative -left-[5px] -top-[4px]">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                {/* Hotspot Star Tip at top-left (5,5) */}
                <circle
                  cx="5.5"
                  cy="5.5"
                  r="3"
                  fill={isHovering ? "#64dfd0" : "#64C2FF"}
                  stroke="#081326"
                  strokeWidth="1.8"
                />
                {/* Neo-brutalist Crescent Moon body */}
                <path
                  d="M18.8 7.5C15.1 7.2 11.7 9.9 11.3 13.6C10.9 17.3 13.6 20.7 17.3 21.1C19.4 21.3 21.3 20.6 22.8 19.3C19.8 19.6 17.1 17.4 16.8 14.3C16.5 11.3 18.6 8.5 21.5 8.1C20.7 7.7 19.7 7.5 18.8 7.5Z"
                  fill="#070C17"
                  transform="translate(1.4, 1.8)"
                />
                <path
                  d="M18.8 7.5C15.1 7.2 11.7 9.9 11.3 13.6C10.9 17.3 13.6 20.7 17.3 21.1C19.4 21.3 21.3 20.6 22.8 19.3C19.8 19.6 17.1 17.4 16.8 14.3C16.5 11.3 18.6 8.5 21.5 8.1C20.7 7.7 19.7 7.5 18.8 7.5Z"
                  fill="#FDE073"
                  stroke="#081326"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SparkleBurstItem: React.FC<{ particle: SparkleParticle }> = ({ particle }) => {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLaunched(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none transition-all duration-400 ease-out"
      style={{
        transform: `translate3d(${particle.x + (launched ? particle.vx : 0)}px, ${
          particle.y + (launched ? particle.vy : 0)
        }px, 0) scale(${launched ? 0.15 : 1}) rotate(${
          launched ? particle.rotation + 45 : particle.rotation
        }deg)`,
        opacity: launched ? 0 : 1,
      }}
    >
      {particle.isStar ? (
        <svg
          width={particle.size + 4}
          height={particle.size + 4}
          viewBox="0 0 14 14"
          fill="none"
          className="-translate-x-1/2 -translate-y-1/2"
        >
          <path
            d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z"
            fill={particle.color}
            stroke="#081326"
            strokeWidth="1.2"
          />
        </svg>
      ) : (
        <div
          className="-translate-x-1/2 -translate-y-1/2 rounded-full border border-[#081326]"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
        />
      )}
    </div>
  );
};

