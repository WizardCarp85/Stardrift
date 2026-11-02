"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";

const STARS = Array.from({ length: 26 }, (_, i) => ({
  id: i,
  x: (i * 29.3 + 9) % 94,
  y: (i * 37.7 + 6) % 90,
  size: i % 5 === 0 ? 15 : i % 3 === 0 ? 11 : 7,
  sparkle: i % 3 !== 1,
  color: i % 6 === 0 ? "#ffe082" : i % 2 === 0 ? "#8fd0ff" : "#b8e3ff",
  duration: 3 + (i % 4),
  delay: (i % 5) * 0.7,
}));

function CartoonSparkle({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
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

function CartoonCloud({ fill }: { fill: string }) {
  return (
    <svg
      viewBox="0 0 220 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full"
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
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative isolate flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#0b1933] via-[#122850] to-[#0e2042] px-5 py-10 text-[#eef6ff]"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <style>{`
        @keyframes authTwinkle {
          0%, 100% { transform: scale(0.82) rotate(0deg); opacity: 0.42; }
          50% { transform: scale(1.12) rotate(8deg); opacity: 0.95; }
        }

        @keyframes authFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .auth-cloud {
          animation: authFloat 8s ease-in-out infinite;
        }

        .auth-cartoon-card {
          border: 2.5px solid #081326;
          box-shadow:
            0 7px 0 0 #081326,
            inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
        }

        .auth-cartoon-input {
          display: block;
          width: 100%;
          height: 3.25rem;
          padding: 0.8rem 1rem;
          border: 2.5px solid #081326;
          border-radius: 0.95rem;
          background: #0f2040;
          color: #eef6ff;
          font-size: 0.9rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
        }

        .auth-cartoon-input.has-leading-icon {
          padding-left: 2.85rem;
        }

        .auth-cartoon-input.has-trailing-icon {
          padding-right: 3rem;
        }

        .auth-cartoon-input::placeholder {
          color: #7899c2;
        }

        .auth-cartoon-input:focus {
          border-color: #5bb8ff;
          background: #102347;
          box-shadow: 0 0 0 3px rgba(91, 184, 255, 0.25), 0 0 16px rgba(91, 184, 255, 0.14);
        }

        .auth-cartoon-primary {
          border: 2.5px solid #081326;
          background: #5bb8ff;
          color: #081326;
          box-shadow:
            0 4px 0 0 #081326,
            inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, background 0.18s ease;
        }

        .auth-cartoon-primary:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
          background: #77c6ff;
          box-shadow:
            0 6px 0 0 #081326,
            0 0 16px rgba(91, 184, 255, 0.35),
            inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
        }

        .auth-cartoon-primary:active:not(:disabled) {
          transform: translateY(2px) scale(0.98);
          box-shadow: 0 1px 0 0 #081326;
        }

        .auth-cartoon-primary:focus-visible {
          outline: 3px solid #ffe082;
          outline-offset: 3px;
        }

        .auth-cartoon-primary:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-star,
          .auth-cloud {
            animation: none !important;
          }

          .auth-cartoon-primary {
            transition: none;
          }
        }
      `}</style>

      {/* Night-sky scenery */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 left-1/2 h-[480px] w-[850px] -translate-x-1/2 rounded-full blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, rgba(91,184,255,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-180px] right-[-140px] h-[500px] w-[600px] rounded-full blur-[130px]"
          style={{
            background:
              "radial-gradient(circle, rgba(100,223,208,0.11) 0%, transparent 70%)",
          }}
        />

        {STARS.map((star) => (
          <div
            key={star.id}
            className="auth-star absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animation: `authTwinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          >
            {star.sparkle ? (
              <CartoonSparkle size={star.size} color={star.color} />
            ) : (
              <div
                className="rounded-full border-2 border-[#081326]"
                style={{
                  width: star.size,
                  height: star.size,
                  backgroundColor: star.color,
                }}
              />
            )}
          </div>
        ))}

        <div className="auth-cloud absolute left-[-48px] top-24 hidden w-52 opacity-60 sm:block">
          <CartoonCloud fill="#193566" />
        </div>
        <div
          className="auth-cloud absolute right-[-58px] top-40 hidden w-60 opacity-65 sm:block"
          style={{ animationDelay: "1.3s" }}
        >
          <CartoonCloud fill="#1c3a70" />
        </div>
      </div>

      <main className="relative z-10 w-full max-w-md">
        <header className="mb-7 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#5bb8ff] shadow-[0_3px_0_0_#081326] overflow-hidden">
              <Image
                src="/logo.png"
                alt="Stardrift logo"
                width={48}
                height={48}
                className="h-full w-full object-contain p-1"
                priority
              />
            </span>
            <span className="text-left text-xl font-extrabold tracking-tight text-white">
              Star<span className="text-[#6bc2ff]">drift</span>
            </span>
          </Link>

          <div className="mt-4">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#081326] bg-[#1b386b] px-3.5 py-1.5 text-xs font-bold text-[#cfe3fc] shadow-[0_3px_0_0_#081326]">
              <Sparkles size={14} className="text-[#ffe082]" />
              A cozy corner for your dream journal
            </span>
          </div>
        </header>

        {children}

        <div className="mt-6 flex flex-col items-center gap-3 text-xs font-semibold text-[#8fb2de]">
          <div className="inline-flex items-center gap-2">
            <LockKeyhole size={14} className="text-[#64dfd0]" />
            <span>A personal space for your nighttime stories</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}