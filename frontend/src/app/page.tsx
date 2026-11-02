"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Moon,
  Mic,
  BarChart3,
  Lock,
  Sparkles,
  ChevronRight,
  User as UserIcon,
  Plus,
  Clock,
  Feather,
  Compass,
  Shield,
  Eye,
  Menu,
  X,
  Layers,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const FEATURES = [
  {
    icon: Mic,
    title: "Capture in seconds",
    desc: "Type or speak your dream the moment you wake up. Instant voice-to-text catches fleeting details before they float away.",
    badgeBg: "#5bb8ff",
    cardTint: "#183363",
  },
  {
    icon: BarChart3,
    title: "Notice quiet patterns",
    desc: "Gentle insights surface recurring places, symbols, mood shifts, and how your rest connects to waking life.",
    badgeBg: "#64dfd0",
    cardTint: "#173561",
  },
  {
    icon: Lock,
    title: "Private & yours alone",
    desc: "Your subconscious isn't a social feed. Entries are encrypted and tucked away safely so only you can read them.",
    badgeBg: "#94adff",
    cardTint: "#193164",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    icon: Feather,
    badgeColor: "#5bb8ff",
    title: "Record upon waking",
    desc: "Open a cozy, glare-free blue pad and speak or type fragments while your dream is still vivid.",
  },
  {
    step: "02",
    icon: Layers,
    badgeColor: "#64dfd0",
    title: "Organize effortlessly",
    desc: "Stick playful tags for emotions, lucidity levels, and key themes without rigid templates.",
  },
  {
    step: "03",
    icon: Compass,
    badgeColor: "#94adff",
    title: "Reflect over time",
    desc: "Watch your personal storybook reveal recurring motifs and emotional rhythms across months.",
  },
];

// Deterministic cartoon stars to avoid SSR hydration mismatches
const STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: ((i * 29.3 + 9) % 94) + 3,
  y: ((i * 37.7 + 6) % 88) + 4,
  size: i % 5 === 0 ? 16 : i % 3 === 0 ? 12 : 6,
  isSparkle: i % 3 !== 1,
  color: i % 6 === 0 ? "#ffe082" : i % 2 === 0 ? "#8fd0ff" : "#b8e3ff",
  duration: 3 + (i % 4),
  delay: (i % 5) * 0.7,
}));

// Deterministic bouncy waveform heights for the UI preview
const WAVEFORM_BARS = [40, 75, 50, 90, 60, 95, 45, 80, 65, 35, 85, 55, 90, 50, 70, 45];

/** Illustrated Cartoon Puffy Cloud SVG */
function CartoonCloud({
  className = "",
  fill = "#1b386b",
}: {
  className?: string;
  fill?: string;
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
      {/* Subtle cartoon top highlight */}
      <path
        d="M135 22C141 14 149 11 158 11C170 11 181 18 186 29"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Illustrated 4-Point Cartoon Star SVG */
function CartoonSparkle({ size = 14, color = "#8fd0ff", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAuthLoaded(true);
      return;
    }

    supabase.auth
      .getSession()
      .then((res: { data: { session: { user: User } | null } }) => {
        setUser(res.data.session?.user ?? null);
        setAuthLoaded(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      const s = session as { user: User } | null;
      setUser(s?.user ?? null);
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Dreamer";

  return (
    <div
      className="relative min-h-screen bg-gradient-to-b from-[#0b1933] via-[#122850] to-[#0e2042] text-[#eef6ff] selection:bg-[#5bb8ff]/35 selection:text-white overflow-x-hidden scroll-smooth"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <style>{`
        @keyframes cartoonTwinkle {
          0%, 100% { transform: scale(0.85) rotate(0deg); opacity: 0.45; }
          50% { transform: scale(1.12) rotate(8deg); opacity: 0.95; }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .cartoon-card {
          border: 2.5px solid #081326;
          box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
        }
        .cartoon-card-lift {
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease;
        }
        .cartoon-card-lift:hover {
          transform: translateY(-4px) scale(1.008);
          box-shadow: 0 10px 0 0 #081326, 0 0 20px rgba(91, 184, 255, 0.15), inset 0 2px 0 0 rgba(255, 255, 255, 0.22);
        }
        .cartoon-btn-primary {
          background-color: #5bb8ff;
          color: #081326;
          border: 2.5px solid #081326;
          box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, background-color 0.18s ease;
        }
        .cartoon-btn-primary:hover {
          background-color: #77c6ff;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 0 0 #081326, 0 0 16px rgba(91, 184, 255, 0.35), inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
        }
        .cartoon-btn-primary:active {
          transform: translateY(2px) scale(0.98);
          box-shadow: 0 1px 0 0 #081326;
        }
        .cartoon-btn-secondary {
          background-color: #1c396e;
          color: #eef6ff;
          border: 2.5px solid #081326;
          box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
          transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, background-color 0.18s ease;
        }
        .cartoon-btn-secondary:hover {
          background-color: #254887;
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.2);
        }
        .cartoon-btn-secondary:active {
          transform: translateY(2px) scale(0.98);
          box-shadow: 0 1px 0 0 #081326;
        }
      `}</style>

      {/* Storybook Night-Sky Background Scenery */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft Moonlit Sky Glows */}
        <div
          className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[480px] rounded-full blur-[120px]"
          style={{
            background: "radial-gradient(circle, rgba(91, 184, 255, 0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-[42%] -left-32 w-[520px] h-[520px] rounded-full blur-[130px]"
          style={{
            background: "radial-gradient(circle, rgba(100, 223, 208, 0.10) 0%, transparent 70%)",
          }}
        />

        {/* Twinkling Cartoon Stars */}
        {STARS.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x.toFixed(2)}%`,
              top: `${s.y.toFixed(2)}%`,
              animation: `cartoonTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            }}
          >
            {s.isSparkle ? (
              <CartoonSparkle size={s.size} color={s.color} />
            ) : (
              <div
                className="rounded-full border border-[#081326]"
                style={{
                  width: `${s.size}px`,
                  height: `${s.size}px`,
                  backgroundColor: s.color,
                }}
              />
            )}
          </div>
        ))}

        {/* Floating Illustrated Background Clouds */}
        <div
          className="hidden sm:block absolute top-28 -left-12 w-56 opacity-65"
          style={{ animation: "floatSlow 8s ease-in-out infinite" }}
        >
          <CartoonCloud fill="#162f5c" />
        </div>
        <div
          className="hidden sm:block absolute top-44 -right-10 w-64 opacity-70"
          style={{ animation: "floatSlow 10s ease-in-out 1.5s infinite" }}
        >
          <CartoonCloud fill="#193566" />
        </div>
        <div
          className="hidden lg:block absolute bottom-32 left-10 w-48 opacity-50"
          style={{ animation: "floatSlow 9s ease-in-out 0.8s infinite" }}
        >
          <CartoonCloud fill="#152d57" />
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Floating Cartoon Pill Navbar */}
        <header className="sticky top-3 z-40 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <nav className="flex items-center justify-between px-4 sm:px-6 h-16 rounded-2xl bg-[#132952]/95 backdrop-blur-md cartoon-card">
              {/* Brand */}
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#5bb8ff] border-[2.5px] border-[#081326] shadow-[0_3px_0_0_#081326] group-hover:-rotate-6 transition-transform overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="Stardrift logo"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain p-1"
                    priority
                  />
                </div>
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#f4f9ff]">
                  Star<span className="text-[#6bc2ff]">drift</span>
                </span>
              </Link>

              {/* Center Links (Desktop) */}
              <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#b4cff2]">
                <a href="#features" className="hover:text-[#6bc2ff] transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="hover:text-[#6bc2ff] transition-colors">
                  How it works
                </a>
                <a href="#privacy" className="hover:text-[#6bc2ff] transition-colors">
                  Privacy
                </a>
              </div>

              {/* Auth Actions (Desktop) */}
              <div className="hidden md:flex items-center gap-3">
                {!authLoaded ? (
                  <div className="h-9 w-32 rounded-xl bg-[#1e3c73] border-2 border-[#081326] animate-pulse" />
                ) : user ? (
                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0e2040] border-2 border-[#081326] text-xs font-semibold text-[#b4cff2]">
                      <UserIcon size={13} className="text-[#6bc2ff]" />
                      <span>
                        Hi, <strong className="font-bold text-white">{userName}</strong>
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl cartoon-btn-primary"
                    >
                      Dashboard <ChevronRight size={16} strokeWidth={2.5} />
                    </Link>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="text-sm font-bold text-[#d5e6ff] hover:text-white px-3.5 py-2 rounded-xl hover:bg-white/[0.06] transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/sign-up"
                      className="text-sm font-bold px-4 py-2 rounded-xl cartoon-btn-primary"
                    >
                      Get started
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="md:hidden p-2 rounded-xl bg-[#1c396e] border-2 border-[#081326] text-[#eef6ff] shadow-[0_2px_0_0_#081326] active:translate-y-0.5"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </nav>

            {/* Mobile Menu Drawer */}
            {mobileMenuOpen && (
              <div className="md:hidden mt-2 rounded-2xl bg-[#132952] cartoon-card px-6 py-5 space-y-4">
                <div className="flex flex-col space-y-3 text-sm font-bold text-[#c5dcfa]">
                  <a
                    href="#features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1 hover:text-[#6bc2ff] transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1 hover:text-[#6bc2ff] transition-colors"
                  >
                    How it works
                  </a>
                  <a
                    href="#privacy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-1 hover:text-[#6bc2ff] transition-colors"
                  >
                    Privacy
                  </a>
                </div>

                <div className="pt-3 border-t-2 border-[#081326]/60 flex flex-col gap-3">
                  {authLoaded && user ? (
                    <>
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#b4cff2] pb-1">
                        <UserIcon size={14} className="text-[#6bc2ff]" />
                        <span>
                          Signed in as <strong className="text-white">{userName}</strong>
                        </span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl cartoon-btn-primary"
                      >
                        Open Dashboard <ChevronRight size={16} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/sign-in"
                        className="w-full text-center text-sm font-bold py-2.5 rounded-xl cartoon-btn-secondary"
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/sign-up"
                        className="w-full text-center text-sm font-bold py-2.5 rounded-xl cartoon-btn-primary"
                      >
                        Get started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="px-6 pt-14 pb-20 md:pt-20 md:pb-24 max-w-5xl mx-auto text-center">
            {/* Cartoon Pill Sticker */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-8 bg-[#1b386b] border-2 border-[#081326] shadow-[0_3px_0_0_#081326] text-[#9ad4ff]">
              <Sparkles size={14} className="text-[#ffe082]" />
              <span>A cozy blue sanctuary for your subconscious</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-[1.15] [text-shadow:0_4px_0_#081326]">
              <span className="text-[#f4f9ff]">Understand the stories</span>
              <br />
              <span className="relative inline-block text-[#72c6ff] mt-1">
                your mind tells at night.
                {/* Hand-drawn Cartoon Squiggle Underline */}
                <svg
                  viewBox="0 0 320 16"
                  fill="none"
                  className="w-full h-3.5 mt-1"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10C58 3 114 14 168 8C220 2 272 13 316 7"
                    stroke="#ffe082"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg font-medium text-[#b4cff2] max-w-2xl mx-auto mb-10 leading-relaxed">
              Capture fleeting dreams in seconds by speaking or typing into a gentle, storybook-blue
              pad. Uncover recurring symbols, mood shifts, and personal patterns over time.
            </p>

            {/* Primary Cartoon Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {authLoaded && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold px-7 py-3.5 rounded-2xl cartoon-btn-primary"
                  >
                    Open Dashboard <ChevronRight size={18} strokeWidth={2.5} />
                  </Link>
                  <Link
                    href="/journal/new"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold px-7 py-3.5 rounded-2xl cartoon-btn-secondary"
                  >
                    <Mic size={18} className="text-[#6bc2ff]" strokeWidth={2.5} />
                    Record tonight&apos;s dream
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-up"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-base font-bold px-7 py-3.5 rounded-2xl cartoon-btn-primary"
                  >
                    Start journaling — it&apos;s free <ChevronRight size={18} strokeWidth={2.5} />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="w-full sm:w-auto inline-flex items-center justify-center text-base font-bold px-7 py-3.5 rounded-2xl cartoon-btn-secondary"
                  >
                    I have an account
                  </Link>
                </>
              )}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-[#8cb2e0]">
              <span className="inline-flex items-center gap-1.5">
                <Lock size={13} className="text-[#64dfd0]" /> Encrypted &amp; private
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye size={13} className="text-[#6bc2ff]" /> Sleep-friendly blue palette
              </span>
            </div>

            {/* Cartoon Dream Pad Interface Preview */}
            <div className="relative mt-16 max-w-3xl mx-auto text-left">
              {/* Decorative peeking clouds behind the card */}
              <CartoonCloud
                fill="#214480"
                className="hidden sm:block absolute -left-14 -bottom-6 w-40 z-0 pointer-events-none"
              />
              <CartoonCloud
                fill="#214480"
                className="hidden sm:block absolute -right-12 -top-8 w-36 z-0 pointer-events-none"
              />

              <div className="relative z-10 rounded-3xl bg-[#162e59] cartoon-card overflow-hidden">
                {/* Cartoon Window Top Bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b-[2.5px] border-[#081326] bg-[#102347]">
                  <div className="flex items-center gap-3">
                    {/* Playful Window Dots */}
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ff859d] border-2 border-[#081326]" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#ffe082] border-2 border-[#081326]" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#64dfd0] border-2 border-[#081326]" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#9bc0ed] pl-1">
                      <Clock size={13} className="text-[#6bc2ff]" />
                      <span>Morning Entry · 06:42 AM</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#193869] border-2 border-[#081326] text-[11px] font-bold text-[#64dfd0]">
                    <Lock size={11} />
                    <span>Private</span>
                  </div>
                </div>

                {/* Dream Pad Body */}
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-2xl bg-[#234785] border-2 border-[#081326] shadow-[0_3px_0_0_#081326] items-center justify-center">
                      <Moon size={22} className="text-[#ffe082] fill-[#ffe082]" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                        Glass conservatory above the tide
                      </h3>
                      <p className="text-sm font-medium text-[#bed6f5] leading-relaxed">
                        Walking through a quiet greenhouse floating over calm cobalt water. Every
                        plant hummed a soft chord when touched, and warm rain drifted upward into a
                        starry blue sky instead of falling...
                      </p>
                    </div>
                  </div>

                  {/* Cartoon Voice Note Player */}
                  <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-[#0f2040] border-2 border-[#081326] shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#5bb8ff] border-2 border-[#081326] shadow-[0_2px_0_0_#081326] flex items-center justify-center">
                        <Mic size={16} className="text-[#081326]" strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-bold text-[#cfe3fc]">
                        Voice note transcribed · 0:38
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 h-6" aria-hidden="true">
                      {WAVEFORM_BARS.map((height, idx) => (
                        <span
                          key={idx}
                          className="w-1.5 rounded-full bg-[#6bc2ff] border border-[#081326]"
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Die-Cut Sticker Pattern Tags */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#5bb8ff] text-[#081326] border-2 border-[#081326] shadow-[0_2px_0_0_#081326] hover:-rotate-2 transition-transform">
                      <Feather size={13} strokeWidth={2.5} /> Mood: Serene
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#64dfd0] text-[#081326] border-2 border-[#081326] shadow-[0_2px_0_0_#081326] hover:rotate-2 transition-transform">
                      <Compass size={13} strokeWidth={2.5} /> Motif: Ocean Water
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-[#ffe082] text-[#081326] border-2 border-[#081326] shadow-[0_2px_0_0_#081326] hover:-rotate-2 transition-transform">
                      <Sparkles size={13} strokeWidth={2.5} /> Semi-lucid
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 [text-shadow:0_3px_0_#081326]">
                Designed for sleepy mornings
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#a9c7ec]">
                Playful, cozy tools that stay out of your way while helping you remember more.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-7">
              {FEATURES.map(({ icon: Icon, title, desc, badgeBg, cardTint }) => (
                <div
                  key={title}
                  className="rounded-3xl p-7 cartoon-card cartoon-card-lift flex flex-col gap-4"
                  style={{ backgroundColor: cardTint }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border-[2.5px] border-[#081326] shadow-[0_3px_0_0_#081326]"
                    style={{ backgroundColor: badgeBg }}
                  >
                    <Icon size={22} className="text-[#081326]" strokeWidth={2.4} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="text-sm font-medium text-[#bdd6f7] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="px-6 py-20 max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 [text-shadow:0_3px_0_#081326]">
                A simple nightly ritual
              </h2>
              <p className="text-sm sm:text-base font-medium text-[#a9c7ec]">
                Build consistent dream recall without turning your morning into homework.
              </p>
            </div>

            <div className="relative grid md:grid-cols-3 gap-8">
              {/* Dashed Storybook Trail (Desktop) */}
              <div
                className="hidden md:block absolute top-1/2 left-12 right-12 -translate-y-1/2 border-t-[3px] border-dashed border-[#345d9e] z-0"
                aria-hidden="true"
              />

              {WORKFLOW_STEPS.map(({ step, icon: Icon, badgeColor, title, desc }) => (
                <div
                  key={step}
                  className="relative z-10 rounded-3xl p-7 pt-9 bg-[#152c57] cartoon-card cartoon-card-lift flex flex-col gap-3"
                >
                  {/* Floating Sticker Step Number */}
                  <div
                    className="absolute -top-4 left-6 px-3.5 py-1 rounded-full border-2 border-[#081326] shadow-[0_3px_0_0_#081326] text-xs font-extrabold tracking-wider text-[#081326]"
                    style={{ backgroundColor: badgeColor }}
                  >
                    STEP {step}
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <div className="w-9 h-9 rounded-xl bg-[#0e2040] border-2 border-[#081326] flex items-center justify-center">
                      <Icon size={17} className="text-[#7ac7ff]" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[#b8d2f4] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy & CTA Section */}
          <section id="privacy" className="px-6 pt-10 pb-24 max-w-4xl mx-auto">
            <div className="relative rounded-3xl p-8 sm:p-12 bg-gradient-to-b from-[#1e3f78] to-[#152d59] cartoon-card overflow-hidden text-center">
              {/* Illustrated Corner Clouds */}
              <CartoonCloud
                fill="#264d8f"
                className="hidden sm:block absolute -bottom-6 -left-10 w-48 opacity-80 pointer-events-none"
              />
              <CartoonCloud
                fill="#264d8f"
                className="hidden sm:block absolute -bottom-6 -right-10 w-48 opacity-80 pointer-events-none"
              />

              <div className="relative z-10 max-w-xl mx-auto">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-5 bg-[#64dfd0] border-[2.5px] border-[#081326] shadow-[0_4px_0_0_#081326] flex items-center justify-center">
                  <Shield size={26} className="text-[#081326]" strokeWidth={2.4} />
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 [text-shadow:0_3px_0_#081326]">
                  Start your personal dream storybook
                </h2>

                <p className="text-sm sm:text-base font-medium text-[#c2daf8] mb-8 leading-relaxed">
                  Your entries remain strictly private, ad-free, and gentle on sleepy eyes. Record
                  your first dream tonight and see what adventures your mind is illustrating.
                </p>

                <Link
                  href={user ? "/dashboard" : "/sign-up"}
                  className="inline-flex items-center gap-2 text-base font-bold px-8 py-4 rounded-2xl cartoon-btn-primary"
                >
                  {user ? "Go to Dashboard" : "Begin tonight"}
                  <ChevronRight size={18} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* Cartoon Styled Footer */}
        <footer className="border-t-[3px] border-[#081326] bg-[#09152b]">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b-2 border-[#162d57]">
              {/* Brand Column */}
              <div className="md:col-span-6 space-y-4">
                <Link href="/" className="inline-flex items-center gap-2.5 group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#5bb8ff] border-2 border-[#081326] shadow-[0_2px_0_0_#081326] overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Stardrift logo"
                      width={36}
                      height={36}
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>
                  <span className="text-lg font-bold text-white">
                    Star<span className="text-[#6bc2ff]">drift</span>
                  </span>
                </Link>
                <p className="text-sm font-medium text-[#8fb2de] max-w-sm leading-relaxed">
                  A cozy, private dream journal built to help you catch fleeting nighttime stories
                  and notice meaningful inner patterns over time.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#6bc2ff] pt-1">
                  <Eye size={14} className="text-[#64dfd0]" />
                  <span>Crafted with a sleep-friendly storybook blue palette</span>
                </div>
              </div>

              {/* Navigation Column */}
              <div className="md:col-span-3 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#cfe3fc]">
                  Explore
                </h4>
                <ul className="space-y-2.5 text-sm font-semibold text-[#8fb2de]">
                  <li>
                    <a href="#features" className="hover:text-[#6bc2ff] transition-colors">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="hover:text-[#6bc2ff] transition-colors">
                      How it works
                    </a>
                  </li>
                  <li>
                    <a href="#privacy" className="hover:text-[#6bc2ff] transition-colors">
                      Privacy commitment
                    </a>
                  </li>
                </ul>
              </div>

              {/* Account Column */}
              <div className="md:col-span-3 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#cfe3fc]">
                  Journal
                </h4>
                <ul className="space-y-2.5 text-sm font-semibold text-[#8fb2de]">
                  {user ? (
                    <>
                      <li>
                        <Link href="/dashboard" className="hover:text-[#6bc2ff] transition-colors">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/journal/new"
                          className="hover:text-[#6bc2ff] transition-colors"
                        >
                          New dream entry
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link href="/sign-in" className="hover:text-[#6bc2ff] transition-colors">
                          Sign in
                        </Link>
                      </li>
                      <li>
                        <Link href="/sign-up" className="hover:text-[#6bc2ff] transition-colors">
                          Create account
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Bottom Copyright Bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#6e92c2]">
              <p>© {new Date().getFullYear()} Stardrift. All rights reserved.</p>
              <div className="inline-flex items-center gap-1.5">
                <Lock size={13} className="text-[#64dfd0]" />
                <span>Private &amp; encrypted by design</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}