"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Flame,
  BookOpen,
  TrendingUp,
  Moon,
  Sun,
  Sparkles,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Plus,
  Mic,
  Compass,
  Feather,
  Calendar,
  Smile,
  CloudRain,
  Zap,
  Heart,
  Quote,
  type LucideIcon,
} from "lucide-react";
import { dashboardApi, profileApi } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { DashboardSummary, DateFormat } from "@/types";
import {
  DREAM_TYPE_LABELS,
  DREAM_TYPE_ICONS,
  MOOD_LABELS,
  formatRelativeDate,
} from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/** Illustrated 4-Point Cartoon Star */
function CartoonSparkle({
  size = 14,
  color = "#ffe082",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
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

/** Illustrated Cartoon Puffy Cloud */
function CartoonCloud({
  fill = "#1c3c73",
  className = "",
}: {
  fill?: string;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M28 82H190C203.255 82 214 71.2548 214 58C214 45.792 204.88 35.7145 193.079 34.2016C189.261 18.0273 174.725 6 157.4 6C143.829 6 131.954 13.386 125.605 24.3374C119.994 19.7544 112.833 17 105 17C88.2355 17 74.4776 29.6691 72.6977 45.9597C68.8312 43.4557 64.2227 42 59.2727 42C45.315 42 34 53.315 34 67.2727C34 68.1986 34.0497 69.1128 34.1466 70.0131C23.5499 70.7222 15 74.5 15 78.5C15 80.9853 20.8203 82 28 82Z"
        fill={fill}
        stroke="#081326"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M135 22C141 14 149 11 158 11C170 11 181 18 186 29" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/** Maps mood keys to clean Lucide icons & cartoon sticker colors */
function getMoodStickerStyle(mood: string): { icon: LucideIcon; bg: string } {
  const key = mood?.toLowerCase() || "";
  if (key.includes("calm") || key.includes("serene") || key.includes("peace")) {
    return { icon: Feather, bg: "#64dfd0" };
  }
  if (key.includes("happy") || key.includes("joy") || key.includes("excit")) {
    return { icon: Smile, bg: "#ffe082" };
  }
  if (key.includes("sad") || key.includes("melanchol") || key.includes("grief")) {
    return { icon: CloudRain, bg: "#8ec5ff" };
  }
  if (key.includes("anx") || key.includes("fear") || key.includes("scary") || key.includes("stress")) {
    return { icon: Zap, bg: "#ff9bb0" };
  }
  if (key.includes("love") || key.includes("warm")) {
    return { icon: Heart, bg: "#ffb3c6" };
  }
  return { icon: Sparkles, bg: "#94adff" };
}

function StatBentoCard({
  icon: Icon,
  label,
  value,
  sub,
  badgeBg,
  cardBg,
  footer,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  badgeBg: string;
  cardBg: string;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className="dash-cartoon-card dash-cartoon-lift relative flex h-full min-w-0 flex-col justify-between gap-3 overflow-hidden rounded-3xl p-5"
      style={{ backgroundColor: cardBg }}
    >
      <Icon
        size={72}
        className="pointer-events-none absolute -bottom-3 -right-3 -rotate-12 text-white/[0.04]"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] shadow-[0_3px_0_0_#081326]"
          style={{ backgroundColor: badgeBg }}
        >
          <Icon size={20} className="text-[#081326]" strokeWidth={2.5} />
        </div>
        <span className="rounded-full border-2 border-[#081326] bg-[#0e2040]/90 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#9bc0ed]">
          {label}
        </span>
      </div>

      <div className="relative z-10 mt-1">
        <div className="truncate text-2xl font-extrabold tracking-tight text-white [text-shadow:0_2px_0_#081326] sm:text-3xl">
          {value}
        </div>
        {sub && <div className="mt-1 text-xs font-bold text-[#a9c7ec]">{sub}</div>}
      </div>

      {footer && <div className="relative z-10 pt-1">{footer}</div>}
    </div>
  );
}

const PAGE_SHELL =
  "flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-5 text-[#eef6ff]";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [blurPreviews, setBlurPreviews] = useState(false);
  const [dateFormat, setDateFormat] = useState<DateFormat>("locale");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientHour, setClientHour] = useState<number>(21);
  const [todayLabel, setTodayLabel] = useState<string>("");

  const load = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const summary = await dashboardApi.summary();
      setData(summary);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("403") || msg.includes("401")) {
        setError("You are not signed in. Please sign in to access your dream journal.");
      } else {
        setError("Could not connect to the backend. Make sure Django is running on port 8000.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const now = new Date();
    setClientHour(now.getHours());
    setTodayLabel(
      now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    );

    load(false);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.auth
        .getSession()
        .then((res: { data: { session: { user: User } | null } }) => {
          const u = res.data.session?.user;
          const name = u?.user_metadata?.full_name || u?.email?.split("@")[0] || "";
          if (name) setUserName(name);
        });
    }

    profileApi
      .get()
      .then((p) => {
        if (p?.display_name) setUserName(p.display_name);
        if (typeof p?.blur_previews === "boolean") setBlurPreviews(p.blur_previews);
        else if (typeof p?.blurPreviews === "boolean") setBlurPreviews(p.blurPreviews);
        const df = (p?.date_format || p?.dateFormat) as DateFormat | undefined;
        if (df) setDateFormat(df);
      })
      .catch(() => {});

    function onSettingsUpdate(e: Event) {
      const customEvent = e as CustomEvent;
      if (typeof customEvent.detail?.settings?.blurPreviews === "boolean") {
        setBlurPreviews(customEvent.detail.settings.blurPreviews);
      }
    }
    window.addEventListener("settings-updated", onSettingsUpdate);
    return () => window.removeEventListener("settings-updated", onSettingsUpdate);
  }, [load]);

  // Build a continuous 14-day timeline + summary counts from mood_trend
  const { timelineData, recentDreamCount, activeNightCount, topMoods } = useMemo(() => {
    const dateCountMap: Record<string, number> = {};
    const moodCountMap: Record<string, number> = {};

    if (data?.mood_trend) {
      for (const item of data.mood_trend) {
        const dateKey = item.dream_date.slice(0, 10);
        dateCountMap[dateKey] = (dateCountMap[dateKey] || 0) + item.count;

        const maybeMood = (item as { mood?: string }).mood;
        if (maybeMood) {
          moodCountMap[maybeMood] = (moodCountMap[maybeMood] || 0) + item.count;
        }
      }
    }

    const days: { date: string; label: string; count: number }[] = [];
    const base = new Date();
    for (let offset = 13; offset >= 0; offset--) {
      const d = new Date(base);
      d.setDate(base.getDate() - offset);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const isoKey = `${yyyy}-${mm}-${dd}`;
      const shortLabel = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      days.push({ date: isoKey, label: shortLabel, count: dateCountMap[isoKey] || 0 });
    }

    const matchedTotal = days.reduce((sum, d) => sum + d.count, 0);
    const rawEntries = Object.entries(dateCountMap).sort(([a], [b]) => a.localeCompare(b));

    const finalTimeline =
      matchedTotal > 0 || rawEntries.length === 0
        ? days
        : rawEntries.slice(-14).map(([date, count]) => ({
            date,
            label: date.slice(5),
            count,
          }));

    const total14d = finalTimeline.reduce((sum, d) => sum + d.count, 0);
    const activeNights = finalTimeline.filter((d) => d.count > 0).length;

    const sortedMoods = Object.entries(moodCountMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return {
      timelineData: finalTimeline,
      recentDreamCount: total14d,
      activeNightCount: activeNights,
      topMoods: sortedMoods,
    };
  }, [data?.mood_trend]);

  const isDaytime = clientHour >= 6 && clientHour < 17;
  const timeGreeting =
    clientHour < 12 ? "Good morning" : clientHour < 17 ? "Good afternoon" : "Good evening";
  const editionBadge =
    clientHour < 12 ? "Morning Recall" : clientHour < 17 ? "Daydream Desk" : "Nightbook Sanctuary";
  const greetingTitle = `${timeGreeting}${userName ? `, ${userName}` : ""}`;

  const streak = data?.streak ?? 0;
  const totalDreams = data?.total_dreams ?? 0;
  const monthDreams = data?.this_month_count ?? 0;

  const heroSubtitle =
    streak > 0
      ? `You're on a ${streak}-day recall streak! Jot down fleeting fragments before they drift away.`
      : totalDreams > 0
      ? `Welcome back to your nightbook — ${totalDreams} ${
          totalDreams === 1 ? "dream" : "dreams"
        } safely tucked inside your archive.`
      : "Your dream storybook is open and ready for tonight's adventure.";

  const sharedStyles = (
    <style>{`
      .dash-cartoon-card {
        border: 2.5px solid #081326;
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
      }
      .dash-cartoon-lift {
        transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease;
      }
      .dash-cartoon-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.22);
      }
      .dash-btn-primary {
        background-color: #5bb8ff;
        color: #081326;
        border: 2.5px solid #081326;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
        transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .dash-btn-primary:hover:not(:disabled) {
        background-color: #77c6ff;
        transform: translateY(-2px);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
      }
      .dash-btn-primary:active:not(:disabled) {
        transform: translateY(2px);
        box-shadow: 0 1px 0 0 #081326;
      }
      .dash-btn-secondary {
        background-color: #162f5c;
        color: #eef6ff;
        border: 2.5px solid #081326;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
        transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
      }
      .dash-btn-secondary:hover:not(:disabled) {
        background-color: #1f417d;
        transform: translateY(-2px);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.22);
      }
      .dash-btn-secondary:active:not(:disabled) {
        transform: translateY(2px);
        box-shadow: 0 1px 0 0 #081326;
      }
      @keyframes dashFloat {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
    `}</style>
  );

  /* Cartoon Skeleton State */
  if (loading) {
    return (
      <div className={PAGE_SHELL} style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}>
        {sharedStyles}

        {/* Hero Skeleton */}
        <div className="dash-cartoon-card w-full shrink-0 animate-pulse rounded-[28px] bg-[#162e59] p-6 sm:p-8">
          <div className="mb-4 h-6 w-36 rounded-full bg-white/10" />
          <div className="mb-3 h-9 w-72 max-w-full rounded-xl bg-white/15" />
          <div className="mb-6 h-4 w-96 max-w-full rounded-lg bg-white/10" />
          <div className="flex gap-3">
            <div className="h-11 w-40 rounded-2xl bg-[#5bb8ff]/40" />
            <div className="h-11 w-32 rounded-2xl bg-white/10" />
          </div>
        </div>

        {/* Stat Bento Skeleton */}
        <div className="grid w-full shrink-0 grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="dash-cartoon-card h-40 animate-pulse rounded-3xl bg-[#152c57] p-5">
              <div className="mb-4 h-11 w-11 rounded-2xl bg-white/10" />
              <div className="mb-2 h-8 w-20 rounded-lg bg-white/15" />
              <div className="h-3.5 w-28 rounded bg-white/10" />
            </div>
          ))}
        </div>

        {/* Chart Skeleton — flexes to fill */}
        <div className="dash-cartoon-card w-full min-h-56 flex-1 animate-pulse rounded-3xl bg-[#152c57]" />

        {/* Bottom strip skeleton — pinned */}
        <div className="grid w-full shrink-0 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="dash-cartoon-card h-20 animate-pulse rounded-2xl bg-[#162f5c]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL} style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}>
      {sharedStyles}

      {/* 1. ILLUSTRATED NIGHTBOOK HERO BANNER */}
      <section className="dash-cartoon-card relative w-full shrink-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] via-[#152d59] to-[#0f2245] p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(91,184,255,0.28) 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <CartoonCloud fill="#214685" className="pointer-events-none absolute -bottom-6 -right-8 hidden w-56 opacity-85 sm:block" />
        <CartoonCloud fill="#1a3769" className="pointer-events-none absolute -top-7 right-40 hidden w-40 opacity-60 lg:block" />
        <CartoonSparkle size={16} color="#ffe082" className="pointer-events-none absolute right-12 top-8 opacity-90" />
        <CartoonSparkle size={12} color="#8fd0ff" className="pointer-events-none absolute right-36 top-16 hidden opacity-80 sm:block" />
        <CartoonSparkle size={11} color="#64dfd0" className="pointer-events-none absolute bottom-8 right-64 hidden opacity-75 md:block" />

        <div
          className="pointer-events-none absolute right-10 top-1/2 hidden h-24 w-24 -translate-y-1/2 items-center justify-center rounded-3xl border-[2.5px] border-[#081326] bg-[#102347]/90 shadow-[0_6px_0_0_#081326] md:flex"
          style={{ animation: "dashFloat 6s ease-in-out infinite" }}
          aria-hidden="true"
        >
          {isDaytime ? (
            <Sun size={44} className="text-[#ffe082]" fill="#ffe082" strokeWidth={2.2} />
          ) : (
            <Moon size={42} className="text-[#ffe082]" fill="#ffe082" strokeWidth={2.2} />
          )}
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#7ac8ff] shadow-[0_2px_0_0_#081326]">
              {isDaytime ? <Sun size={13} className="text-[#ffe082]" /> : <Moon size={13} className="text-[#ffe082]" fill="#ffe082" />}
              {editionBadge}
            </span>

            {todayLabel && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#193566] px-3 py-1 text-xs font-bold text-[#cfe3fc]">
                <Calendar size={12} className="text-[#64dfd0]" />
                {todayLabel}
              </span>
            )}
          </div>

          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white [text-shadow:0_3px_0_#081326] sm:text-4xl">
            {greetingTitle}
          </h1>

          <p className="mb-6 text-sm font-semibold leading-relaxed text-[#bad4f7] sm:text-base">
            {heroSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/journal/new" className="dash-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#ffe082]">
                <Mic size={14} strokeWidth={2.8} className="text-[#081326]" />
              </span>
              Record a Dream
            </Link>

            <Link href="/journal" className="dash-btn-secondary inline-flex items-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-extrabold">
              Browse Journal
              <ChevronRight size={16} strokeWidth={2.5} className="text-[#6bc2ff]" />
            </Link>

            <button
              type="button"
              onClick={() => load(true)}
              disabled={refreshing}
              className="dash-btn-secondary inline-flex h-12 w-12 items-center justify-center rounded-2xl"
              aria-label="Refresh dashboard"
              title="Refresh snapshot"
            >
              <RefreshCw size={17} strokeWidth={2.4} className={`text-[#9bc0ed] ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Error Alert Banner */}
      {error && (
        <div
          role="alert"
          className="dash-cartoon-card flex w-full shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#2a2442] px-5 py-4 text-sm font-bold text-[#ffe59e]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] text-[#081326]">
              <AlertTriangle size={18} strokeWidth={2.5} />
            </span>
            <span>{error}</span>
          </div>
          {error.toLowerCase().includes("sign in") ? (
            <Link href="/sign-in" className="dash-btn-primary rounded-xl px-4 py-2 text-xs font-extrabold">
              Sign In Now →
            </Link>
          ) : (
            <button type="button" onClick={() => load(true)} className="dash-btn-secondary rounded-xl px-4 py-2 text-xs font-extrabold">
              Try Again
            </button>
          )}
        </div>
      )}

      {/* 2. COLLECTIBLE CARTOON BENTO STAT CARDS */}
      <section aria-label="Dream journal statistics" className="grid w-full shrink-0 grid-cols-2 gap-4 xl:grid-cols-4">
        <StatBentoCard
          icon={Flame}
          label="Streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          sub={streak > 0 ? "Keep the magic rolling!" : "Log tonight to spark it"}
          badgeBg="#ffe082"
          cardBg="#193362"
          footer={
            <div className="flex items-center gap-1.5 pt-1" aria-label={`${Math.min(streak, 7)} of 7 weekly streak dots lit`}>
              {[...Array(7)].map((_, idx) => {
                const lit = idx < Math.min(streak, 7);
                return (
                  <span
                    key={idx}
                    className={`h-2.5 flex-1 rounded-full border-[1.5px] border-[#081326] transition-colors ${
                      lit ? "bg-[#ffe082] shadow-[0_1px_0_0_#081326]" : "bg-[#0d1d3a]"
                    }`}
                  />
                );
              })}
            </div>
          }
        />

        <StatBentoCard
          icon={BookOpen}
          label="Archive"
          value={totalDreams}
          sub="Total dreams saved"
          badgeBg="#5bb8ff"
          cardBg="#173261"
          footer={
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[#081326] bg-[#0e2040] px-2.5 py-1 text-[11px] font-extrabold text-[#7ac8ff]">
              +{monthDreams} this month
            </span>
          }
        />

        <StatBentoCard
          icon={(data?.most_common_type && DREAM_TYPE_ICONS[data.most_common_type]) || Moon}
          label="Top Style"
          value={data?.most_common_type ? DREAM_TYPE_LABELS[data.most_common_type] : "None yet"}
          sub="Most frequent this month"
          badgeBg="#94adff"
          cardBg="#183060"
          footer={
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[#081326] bg-[#0e2040] px-2.5 py-1 text-[11px] font-extrabold text-[#b8c8ff]">
              <Sparkles size={11} /> Monthly theme
            </span>
          }
        />

        <StatBentoCard
          icon={TrendingUp}
          label="14d Pulse"
          value={recentDreamCount > 0 ? `${recentDreamCount} logged` : "Quiet sky"}
          sub={
            activeNightCount > 0
              ? `Across ${activeNightCount} ${activeNightCount === 1 ? "night" : "nights"}`
              : "Last 14 nights"
          }
          badgeBg="#64dfd0"
          cardBg="#163460"
          footer={
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[#081326] bg-[#0e2040] px-2.5 py-1 text-[11px] font-extrabold text-[#64dfd0]">
              {activeNightCount > 0 ? "Recall active" : "Ready to track"}
            </span>
          }
        />
      </section>

      {/* 3. 14-DAY GLOWING RECALL WAVE CHART */}
      <section className="dash-cartoon-card w-full shrink-0 rounded-3xl bg-[#152d58] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] shadow-[0_3px_0_0_#081326]">
              <TrendingUp size={19} className="text-[#081326]" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold leading-tight text-white">14-Night Recall Wave</h2>
              <p className="text-xs font-bold text-[#9bc0ed]">
                Daily dream entries captured over the past two weeks
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {topMoods.length > 0 ? (
              topMoods.map(([moodKey, count]) => {
                const { icon: MoodIcon, bg } = getMoodStickerStyle(moodKey);
                const label = MOOD_LABELS[moodKey as keyof typeof MOOD_LABELS] || moodKey;
                return (
                  <span
                    key={moodKey}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]"
                    style={{ backgroundColor: bg }}
                  >
                    <MoodIcon size={12} strokeWidth={2.5} />
                    {label} · {count}
                  </span>
                );
              })
            ) : (
              <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#8fd0ff]">
                {recentDreamCount} {recentDreamCount === 1 ? "dream" : "dreams"} in 14d
              </span>
            )}
          </div>
        </div>

        <div className="relative h-44 rounded-2xl border-2 border-[#081326] bg-[#0d1e3d] p-3 sm:h-52 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="cartoonWaveFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5bb8ff" stopOpacity={0.55} />
                  <stop offset="65%" stopColor="#64dfd0" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#64dfd0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(155, 192, 237, 0.1)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                interval="preserveStartEnd"
                minTickGap={24}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#8cb2e0", fontSize: 11, fontWeight: 700 }}
              />
              <Tooltip
                cursor={{ stroke: "#ffe082", strokeWidth: 2, strokeDasharray: "4 4" }}
                contentStyle={{
                  backgroundColor: "#132952",
                  border: "2.5px solid #081326",
                  borderRadius: "14px",
                  boxShadow: "0 4px 0 0 #081326",
                  color: "#eef6ff",
                  fontSize: "12px",
                  fontWeight: 800,
                }}
                formatter={(val) => {
                  const num = Number(val) || 0;
                  return [`${num} ${num === 1 ? "dream" : "dreams"}`, "Logged"];
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#64dfd0"
                strokeWidth={3.5}
                fill="url(#cartoonWaveFill)"
                dot={{ r: 4, fill: "#ffe082", stroke: "#081326", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#ffe082", stroke: "#081326", strokeWidth: 2.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {recentDreamCount === 0 && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
              <div className="pointer-events-auto inline-flex items-center gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#162e59]/95 px-4 py-2.5 text-xs font-extrabold text-[#cfe3fc] shadow-[0_4px_0_0_#081326]">
                <Sparkles size={15} className="text-[#ffe082]" />
                <span>Log a dream tonight to light up your 14-day recall wave!</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. STORYBOOK TWO-COLUMN SPOTLIGHT — equal-height cards */}
      <section className="grid w-full gap-5 lg:grid-cols-2">
        {data?.last_dream ? (
          <div className="dash-cartoon-card dash-cartoon-lift relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl bg-[#162e59] p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326]">
                  <Moon size={17} className="text-[#081326]" fill="#ffe082" strokeWidth={2.4} />
                </span>
                <h2 className="text-lg font-extrabold text-white">Latest Dream Entry</h2>
              </div>

              <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#9bc0ed]">
                {formatRelativeDate(data.last_dream.dream_date, dateFormat)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const TypeIcon = DREAM_TYPE_ICONS[data.last_dream.dream_type];
                return (
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#94adff] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
                    {TypeIcon && <TypeIcon size={13} />}
                    <span>{DREAM_TYPE_LABELS[data.last_dream.dream_type]}</span>
                  </span>
                );
              })()}

              {(() => {
                const { icon: MoodIcon, bg } = getMoodStickerStyle(data.last_dream.mood);
                return (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]"
                    style={{ backgroundColor: bg }}
                  >
                    <MoodIcon size={13} strokeWidth={2.5} />
                    <span>{MOOD_LABELS[data.last_dream.mood]}</span>
                  </span>
                );
              })()}
            </div>

            <div className="group flex flex-1 flex-col justify-center rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
              <h3 className="text-base font-extrabold text-white line-clamp-1">{data.last_dream.title}</h3>
              <p
                className={`mt-1.5 line-clamp-4 text-xs font-medium leading-relaxed text-[#b8d2f4] sm:text-sm transition-all duration-200 ${
                  blurPreviews ? "blur-[5px] select-none hover:blur-none" : ""
                }`}
                title={blurPreviews ? "Hover to reveal preview" : undefined}
              >
                {data.last_dream.excerpt ||
                  "Open this entry to revisit the full story and details you captured."}
              </p>
            </div>

            <Link
              href={`/journal/${data.last_dream.id}`}
              className="dash-btn-secondary inline-flex items-center gap-1.5 self-start rounded-xl px-4 py-2.5 text-xs font-extrabold"
            >
              Read full dream
              <ChevronRight size={15} strokeWidth={2.6} className="text-[#6bc2ff]" />
            </Link>
          </div>
        ) : (
          <div className="dash-cartoon-card relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-[#162e59] p-6">
            <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-6 -right-10 w-44 opacity-70" />
            <div className="relative z-10 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#ffe082] shadow-[0_3px_0_0_#081326]">
                <Feather size={22} className="text-[#081326]" strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-extrabold text-white">Your First Page Awaits</h2>
              <p className="text-sm font-medium leading-relaxed text-[#b8d2f4]">
                Even a single image, color, or feeling counts! Capture your first dream upon waking to
                start building your personal nightbook.
              </p>
            </div>

            <Link
              href="/journal/new"
              className="dash-btn-primary relative z-10 inline-flex items-center gap-2 self-start rounded-xl px-4 py-2.5 text-xs font-extrabold"
            >
              <Mic size={15} strokeWidth={2.8} />
              Record your first entry
            </Link>
          </div>
        )}

        {/* Right Card: Celestial AI Pattern Spotlight */}
        <div className="dash-cartoon-card dash-cartoon-lift relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1d3972] via-[#172f5f] to-[#1e2d63] p-6">
          <CartoonSparkle size={15} color="#ffe082" className="pointer-events-none absolute right-6 top-6 opacity-90" />
          <CartoonSparkle size={11} color="#64dfd0" className="pointer-events-none absolute right-14 top-14 opacity-75" />

          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#94adff] shadow-[0_2px_0_0_#081326]">
              <Sparkles size={17} className="text-[#081326]" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold leading-tight text-white">Subconscious Spotlight</h2>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#b8c8ff]">
                AI Dream Pattern Reader
              </span>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col justify-center rounded-2xl border-2 border-[#081326] bg-[#0e2040]/95 p-4">
            <Quote size={20} className="mb-2 text-[#ffe082] opacity-85" strokeWidth={2.4} />
            <p className="text-sm font-semibold leading-relaxed text-[#d5e6ff]">
              {data?.ai_snippet ||
                "Keep logging your dreams! As your archive grows, recurring symbols, places, and emotional rhythms will appear right here."}
            </p>
          </div>

          <Link
            href="/patterns"
            className="dash-btn-secondary inline-flex items-center gap-1.5 self-start rounded-xl px-4 py-2.5 text-xs font-extrabold"
          >
            <Compass size={15} className="text-[#64dfd0]" strokeWidth={2.5} />
            Explore Pattern Map
            <ChevronRight size={15} strokeWidth={2.6} className="text-[#64dfd0]" />
          </Link>
        </div>
      </section>

      {/* 5. TACTILE QUICK-LAUNCH STRIP — pinned to page bottom */}
      <section aria-label="Quick actions" className="mt-auto grid w-full shrink-0 gap-4 sm:grid-cols-3">
        <Link
          href="/journal/new"
          className="dash-cartoon-card dash-cartoon-lift group flex items-center gap-3.5 rounded-2xl bg-[#162f5c] p-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] shadow-[0_3px_0_0_#081326] transition-transform group-hover:-rotate-6">
            <Mic size={20} className="text-[#081326]" strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-white">Record Tonight&apos;s Dream</span>
            <span className="block truncate text-xs font-bold text-[#9bc0ed]">Voice-first or write</span>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[#6bc2ff] transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/journal"
          className="dash-cartoon-card dash-cartoon-lift group flex items-center gap-3.5 rounded-2xl bg-[#162f5c] p-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] shadow-[0_3px_0_0_#081326] transition-transform group-hover:rotate-6">
            <BookOpen size={19} className="text-[#081326]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-white">Dream Storybook</span>
            <span className="block truncate text-xs font-bold text-[#9bc0ed]">Search &amp; revisit entries</span>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[#64dfd0] transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/patterns"
          className="dash-cartoon-card dash-cartoon-lift group flex items-center gap-3.5 rounded-2xl bg-[#162f5c] p-4"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] shadow-[0_3px_0_0_#081326] transition-transform group-hover:-rotate-6">
            <Sparkles size={19} className="text-[#081326]" strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-extrabold text-white">Decode Symbols</span>
            <span className="block truncate text-xs font-bold text-[#9bc0ed]">Moods, motifs &amp; lucidity</span>
          </div>
          <ChevronRight size={18} className="shrink-0 text-[#ffe082] transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  );
}