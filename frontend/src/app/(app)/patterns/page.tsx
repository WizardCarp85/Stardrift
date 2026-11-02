"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CloudRain,
  Compass,
  Feather,
  Hash,
  HelpCircle,
  Loader2,
  Moon,
  Plus,
  Mic,
  Quote,
  RefreshCw,
  Repeat,
  Smile,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { patternsApi, profileApi } from "@/lib/api";
import type { PatternsOverview } from "@/types";
import DreamLoader from "@/components/DreamLoader";
import { DREAM_TYPE_LABELS, MOOD_LABELS } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  normal: "#5bb8ff",
  lucid: "#94adff",
  nightmare: "#ff859d",
  recurring: "#ffe082",
  fragmented: "#64dfd0",
  nap: "#a9c7ec",
};

const MOOD_COLORS: Record<string, string> = {
  peaceful: "#64dfd0",
  anxious: "#ffb3c6",
  joyful: "#ffe082",
  confusing: "#8ec5ff",
  scary: "#ff859d",
  neutral: "#94adff",
};

const TAG_COLORS = ["#5bb8ff", "#64dfd0", "#ffe082", "#94adff", "#ffb3c6", "#8ec5ff"];

const TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "#132952",
  border: "2.5px solid #081326",
  borderRadius: "14px",
  boxShadow: "0 4px 0 0 #081326",
  color: "#eef6ff",
  fontSize: "12px",
  fontWeight: 700,
};

const LABEL_STYLE: CSSProperties = {
  color: "#8fd0ff",
  fontWeight: 800,
  marginBottom: "4px",
};

const RANGE_OPTIONS = [
  { label: "30D", longLabel: "Last 30 nights", value: 30 },
  { label: "60D", longLabel: "Last 60 nights", value: 60 },
  { label: "90D", longLabel: "Last 90 nights", value: 90 },
  { label: "180D", longLabel: "Last 6 months", value: 180 },
  { label: "1Y", longLabel: "Last year", value: 365 },
];

function getDreamTypeLabel(type: string) {
  return (DREAM_TYPE_LABELS as Record<string, string>)[type] || type.replaceAll("_", " ");
}

function getMoodLabel(mood: string) {
  return (MOOD_LABELS as Record<string, string>)[mood] || mood.replaceAll("_", " ");
}

function getMoodIcon(mood: string): ElementType {
  const key = mood.toLowerCase();
  if (key.includes("peace") || key.includes("calm")) return Feather;
  if (key.includes("joy") || key.includes("happy")) return Smile;
  if (key.includes("anx")) return Zap;
  if (key.includes("scary") || key.includes("fear")) return CloudRain;
  if (key.includes("confus")) return HelpCircle;
  return Sparkles;
}

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

function PatternsStyles() {
  return (
    <style>{`
      .pattern-card {
        border: 2.5px solid #081326;
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
      }
      .pattern-lift { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s ease; }
      .pattern-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.22);
      }
      .pattern-btn-primary,
      .pattern-btn-secondary {
        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
        border: 2.5px solid #081326; font-weight: 800;
        transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease;
      }
      .pattern-btn-primary {
        background: #5bb8ff; color: #081326;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.45);
      }
      .pattern-btn-primary:hover:not(:disabled) {
        background: #77c6ff; transform: translateY(-2px);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.55);
      }
      .pattern-btn-secondary {
        background: #162f5c; color: #eef6ff;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.14);
      }
      .pattern-btn-secondary:hover:not(:disabled) {
        background: #1f417d; transform: translateY(-2px);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.22);
      }
      .pattern-btn-primary:active:not(:disabled),
      .pattern-btn-secondary:active:not(:disabled) {
        transform: translateY(2px); box-shadow: 0 1px 0 0 #081326;
      }
      .pattern-btn-primary:disabled,
      .pattern-btn-secondary:disabled { cursor: not-allowed; opacity: .6; }
      .pattern-btn-primary:focus-visible,
      .pattern-btn-secondary:focus-visible,
      .pattern-period:focus-visible { outline: 3px solid #ffe082; outline-offset: 2px; }
      .pattern-period {
        border: 2px solid transparent;
        transition: background-color .15s ease, border-color .15s ease, color .15s ease, transform .15s ease;
      }
      .pattern-period:hover:not(:disabled) { color: #ffffff; transform: translateY(-1px); }
      .pattern-period.is-active {
        border-color: #081326; background: #5bb8ff; color: #081326;
        box-shadow: 0 2px 0 0 #081326;
      }
      @keyframes patternFloat {
        0%, 100% { transform: translateY(0) rotate(-2deg); }
        50% { transform: translateY(-8px) rotate(2deg); }
      }
      @keyframes patternTwinkle {
        0%, 100% { opacity: .45; transform: scale(.88); }
        50% { opacity: 1; transform: scale(1.12); }
      }
      @keyframes patternPop {
        from { opacity: 0; transform: translateY(8px) scale(.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .pattern-float { animation: patternFloat 6s ease-in-out infinite; }
      .pattern-twinkle { animation: patternTwinkle 3s ease-in-out infinite; }
      .pattern-pop { animation: patternPop .25s ease-out; }
      .pattern-chart .recharts-surface { overflow: visible; }
      .pattern-chart .recharts-layer:focus,
      .pattern-chart .recharts-sector:focus { outline: none; }
      @media (prefers-reduced-motion: reduce) {
        .pattern-lift, .pattern-btn-primary, .pattern-btn-secondary,
        .pattern-period, .pattern-float, .pattern-twinkle, .pattern-pop {
          animation: none !important; transition: none !important;
        }
      }
    `}</style>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  accent = "#5bb8ff",
  className = "",
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: ElementType;
  accent?: string;
  className?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={`pattern-card flex flex-col rounded-3xl bg-[#152d58] p-6 sm:p-7 ${className}`}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] shadow-[0_3px_0_0_#081326]"
            style={{ backgroundColor: accent }}
          >
            <Icon size={20} className="text-[#081326]" strokeWidth={2.5} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold leading-tight text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-xs font-semibold text-[#8fb2de]">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  color,
  surface,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  note: string;
  color: string;
  surface: string;
}) {
  return (
    <div
      className="pattern-card pattern-lift relative min-w-0 overflow-hidden rounded-3xl p-5"
      style={{ backgroundColor: surface }}
    >
      <Icon
        size={76}
        className="pointer-events-none absolute -bottom-4 -right-4 -rotate-12 text-white/[0.04]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] shadow-[0_3px_0_0_#081326]"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} className="text-[#081326]" strokeWidth={2.5} />
        </span>
        <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#9bc0ed]">
          {label}
        </span>
      </div>
      <div className="relative z-10 mt-5">
        <p className="truncate text-2xl font-extrabold tracking-tight text-white [text-shadow:0_2px_0_#081326] sm:text-3xl">
          {value}
        </p>
        <p className="mt-1 text-xs font-bold text-[#9bc0ed]">{note}</p>
      </div>
    </div>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-56 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#2b4c81] bg-[#0e2040] p-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#1c396e] text-[#8fd0ff]">
        <Moon size={21} fill="#ffe082" strokeWidth={2.4} />
      </span>
      <p className="max-w-xs text-sm font-bold text-[#8fb2de]">{message}</p>
    </div>
  );
}

function LoadingPage() {
  return (
    <div
      className="flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-5 text-[#eef6ff]"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <PatternsStyles />
      <DreamLoader variant="full" message="Tuning into the cosmos…" />
    </div>
  );
}

export default function PatternsPage() {
  const [data, setData] = useState<PatternsOverview | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [insightLoading, setInsightLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightError, setInsightError] = useState<string | null>(null);

  const [days, setDays] = useState(90);
  const requestIdRef = useRef(0);

  const loadData = useCallback(async (period: number, isInitialRequest = false) => {
    const requestId = ++requestIdRef.current;

    if (isInitialRequest) setInitialLoading(true);
    else setRefreshing(true);

    setError(null);

    try {
      const result = await patternsApi.overview(period);
      if (requestId === requestIdRef.current) setData(result);
    } catch {
      if (requestId === requestIdRef.current) {
        setError("Could not load your pattern map. Check that the backend is running and try again.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    async function init() {
      let initialPeriod = 90;
      try {
        const pr = await profileApi.get();
        const configuredDays = pr?.default_pattern_days ?? pr?.defaultPatternDays;
        if (typeof configuredDays === "number" && configuredDays > 0) {
          initialPeriod = configuredDays;
          setDays(configuredDays);
        }
      } catch {
        // fallback
      }
      void loadData(initialPeriod, true);
    }
    void init();
  }, [loadData]);

  async function generateInsight() {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const insight = await patternsApi.generateInsight();
      setInsightText(insight.summary_text);
    } catch {
      setInsightError(
        "The insight could not be generated. Make sure the backend and your AI configuration are available."
      );
    } finally {
      setInsightLoading(false);
    }
  }

  function changeRange(value: number) {
    if (refreshing || value === days) return;
    setDays(value);
    void loadData(value);
  }

  const typeChartData = useMemo(() => {
    if (!data?.type_distribution) return [];
    return data.type_distribution
      .map((item) => ({
        name: getDreamTypeLabel(item.dream_type),
        value: item.count,
        type: item.dream_type,
        color: TYPE_COLORS[item.dream_type] || "#5bb8ff",
      }))
      .sort((a, b) => b.value - a.value);
  }, [data?.type_distribution]);

  const periodDreamCount = useMemo(
    () => typeChartData.reduce((sum, item) => sum + item.value, 0),
    [typeChartData]
  );

  const sleepMoodData = useMemo(() => {
    if (!data?.sleep_mood_correlation) return [];
    return data.sleep_mood_correlation.map((item) => ({
      mood: item.mood,
      label: getMoodLabel(item.mood),
      average: item.avg_sleep ? Number(Number(item.avg_sleep).toFixed(1)) : 0,
      color: MOOD_COLORS[item.mood] || "#5bb8ff",
    }));
  }, [data?.sleep_mood_correlation]);

  const moodAnalysis = useMemo(() => {
    if (!data?.mood_over_time) {
      return {
        timeline: [] as Array<Record<string, string | number>>,
        dominantMoods: [] as string[],
        topMood: null as string | null,
      };
    }

    const dateMap: Record<string, Record<string, number>> = {};
    const moodTotals: Record<string, number> = {};

    for (const item of data.mood_over_time) {
      if (!dateMap[item.dream_date]) dateMap[item.dream_date] = {};
      dateMap[item.dream_date][item.mood] = (dateMap[item.dream_date][item.mood] || 0) + item.count;
      moodTotals[item.mood] = (moodTotals[item.mood] || 0) + item.count;
    }

    const dominantMoods = Object.entries(moodTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([mood]) => mood);

    const timeline = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, moods]) => {
        const row: Record<string, string | number> = { date, label: date.slice(5) };
        for (const mood of dominantMoods) row[mood] = moods[mood] || 0;
        return row;
      });

    return { timeline, dominantMoods, topMood: dominantMoods[0] || null };
  }, [data?.mood_over_time]);

  const topType = typeChartData[0] || null;
  const topTag = data?.top_tags?.[0] || null;

  const totalDreams = data?.all_time_stats.total ?? 0;
  const lucidDreams = data?.all_time_stats.lucid ?? 0;
  const recurringDreams = data?.all_time_stats.recurring ?? 0;

  const averageSleepValue = Number(data?.all_time_stats.avg_sleep_quality ?? 0);
  const averageSleep =
    Number.isFinite(averageSleepValue) && averageSleepValue > 0
      ? `${averageSleepValue.toFixed(1)} / 5`
      : "—";

  const lucidRate = Math.max(0, Math.min(100, Number(data?.lucidity_rate ?? 0)));
  const lucidRateLabel = Number.isInteger(lucidRate) ? `${lucidRate}%` : `${lucidRate.toFixed(1)}%`;

  const selectedRange = RANGE_OPTIONS.find((option) => option.value === days) ?? RANGE_OPTIONS[1];

  if (initialLoading) {
    return <LoadingPage />;
  }

  const noData = Boolean(data && data.all_time_stats.total === 0);

  return (
    <div
      className="flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-5 text-[#eef6ff]"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <PatternsStyles />

      {/* ── Observatory hero ─────────────────────────────────────────── */}
      <section className="pattern-card relative w-full shrink-0 overflow-hidden rounded-[30px] bg-gradient-to-br from-[#1d407a] via-[#162f5e] to-[#0e2040] p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full blur-[70px]"
          style={{ background: "radial-gradient(circle, rgba(91,184,255,0.32) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <CartoonCloud fill="#214685" className="pointer-events-none absolute -bottom-7 -right-8 hidden w-64 opacity-85 sm:block" />
        <CartoonCloud fill="#1a3769" className="pointer-events-none absolute -top-9 right-52 hidden w-40 opacity-60 lg:block" />
        <CartoonSparkle size={17} color="#ffe082" className="pattern-twinkle pointer-events-none absolute right-10 top-8" />
        <CartoonSparkle size={12} color="#64dfd0" className="pattern-twinkle pointer-events-none absolute right-36 top-16 hidden sm:block" />

        <div className="relative z-10 grid items-center gap-6 xl:grid-cols-[1fr_360px]">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3.5 py-1.5 text-xs font-extrabold text-[#8fd0ff] shadow-[0_2px_0_0_#081326]">
              <Compass size={14} className="text-[#64dfd0]" />
              Dream Pattern Observatory
            </span>

            <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white [text-shadow:0_3px_0_#081326] sm:text-5xl">
              Your dream constellation
            </h1>

            <p className="max-w-2xl text-sm font-semibold leading-relaxed text-[#bad4f7] sm:text-base">
              Explore the moods, symbols, sleep rhythms, and dream styles appearing across your private
              nightbook.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/journal/new" className="pattern-btn-primary rounded-2xl px-5 py-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#ffe082]">
                  <Mic size={14} strokeWidth={2.8} />
                </span>
                Record a dream
              </Link>

              <Link href="/journal" className="pattern-btn-secondary rounded-2xl px-5 py-3 text-sm">
                Browse journal
                <ChevronRight size={16} strokeWidth={2.7} className="text-[#64dfd0]" />
              </Link>
            </div>
          </div>

          {/* Current lens panel */}
          <div className="pattern-card relative overflow-hidden rounded-3xl bg-[#0e2040]/90 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7ea4d4]">
                  Current lens
                </p>
                <p className="mt-1 text-sm font-extrabold text-white">{selectedRange.longLabel}</p>
              </div>
              <span className="pattern-float flex h-12 w-12 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#94adff] shadow-[0_3px_0_0_#081326]">
                <Moon size={23} className="text-[#081326]" fill="#ffe082" strokeWidth={2.4} />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-[#081326] bg-[#162f5c] p-3">
                <p className="text-2xl font-extrabold text-white">{periodDreamCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8fb2de]">Dreams analyzed</p>
              </div>
              <div className="rounded-2xl border-2 border-[#081326] bg-[#162f5c] p-3">
                <p className="truncate text-sm font-extrabold text-[#ffe082]">
                  {topTag ? `#${topTag.tag}` : "Quiet sky"}
                </p>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#8fb2de]">Top symbol</p>
              </div>
            </div>

            {(topType || moodAnalysis.topMood) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topType && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1 text-[11px] font-extrabold text-[#081326]"
                    style={{ backgroundColor: topType.color }}
                  >
                    <Moon size={11} strokeWidth={2.7} />
                    {topType.name}
                  </span>
                )}
                {moodAnalysis.topMood && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1 text-[11px] font-extrabold text-[#081326]"
                    style={{ backgroundColor: MOOD_COLORS[moodAnalysis.topMood] || "#94adff" }}
                  >
                    {(() => {
                      const MoodIcon = getMoodIcon(moodAnalysis.topMood);
                      return <MoodIcon size={11} strokeWidth={2.7} />;
                    })()}
                    {getMoodLabel(moodAnalysis.topMood)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Time controls */}
        <div className="relative z-10 mt-7 flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#081326]/50 pt-5">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[#64dfd0]" />
            <span className="text-xs font-extrabold text-[#9bc0ed]">Analysis period</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-1 shadow-[0_2px_0_0_#081326]">
              {RANGE_OPTIONS.map((option) => {
                const active = days === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => changeRange(option.value)}
                    disabled={refreshing}
                    aria-pressed={active}
                    className={`pattern-period rounded-xl px-3.5 py-2 text-xs font-extrabold text-[#8fb2de] ${
                      active ? "is-active" : ""
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void loadData(days)}
              disabled={refreshing}
              className="pattern-btn-secondary h-11 w-11 rounded-2xl"
              aria-label="Refresh pattern data"
              title="Refresh pattern data"
            >
              <RefreshCw size={16} strokeWidth={2.6} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </section>

      {/* API error */}
      {error && (
        <div
          role="alert"
          className="pattern-card flex w-full shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#352541] px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_2px_0_0_#081326]">
              <AlertTriangle size={18} strokeWidth={2.6} />
            </span>
            <p className="text-sm font-bold text-[#ffe9a8]">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData(days)}
            className="pattern-btn-secondary rounded-xl px-4 py-2.5 text-xs"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      )}

      {/* ── Full failure / empty state ───────────────────────────────── */}
      {!data && error ? (
        <section className="pattern-card relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#162e59] p-10 text-center">
          <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-8 -left-10 w-52 opacity-60" />
          <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-8 -right-10 w-52 opacity-60" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-3xl border-[2.5px] border-[#081326] bg-[#ffb3c6] shadow-[0_4px_0_0_#081326]">
              <AlertTriangle size={28} className="text-[#081326]" strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-white">The observatory is offline</h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-[#9bc0ed]">
                Your dream data could not be reached. Check the backend connection and try opening the
                observatory again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadData(days)}
              className="pattern-btn-primary rounded-2xl px-5 py-3 text-sm"
            >
              <RefreshCw size={16} />
              Reopen observatory
            </button>
          </div>
        </section>
      ) : noData ? (
        <section className="pattern-card relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#162e59] px-6 py-14 text-center sm:px-10">
          <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-7 -left-10 w-56 opacity-65" />
          <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-7 -right-10 w-56 opacity-65" />
          <CartoonSparkle size={15} color="#ffe082" className="pattern-twinkle pointer-events-none absolute right-[24%] top-10" />

          <div className="relative z-10 flex flex-col items-center gap-4">
            <span className="pattern-float flex h-20 w-20 items-center justify-center rounded-3xl border-[3px] border-[#081326] bg-[#5bb8ff] shadow-[0_5px_0_0_#081326]">
              <BookOpen size={34} className="text-[#081326]" strokeWidth={2.4} />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">
                Your constellation needs its first star
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-relaxed text-[#9bc0ed]">
                As you record dreams, this page will reveal recurring symbols, emotional rhythms, dream
                styles, and sleep connections.
              </p>
            </div>
            <Link href="/journal/new" className="pattern-btn-primary rounded-2xl px-5 py-3 text-sm">
              <Mic size={16} strokeWidth={2.8} />
              Record your first dream
            </Link>
          </div>
        </section>
      ) : data ? (
        <div
          className={`flex min-h-0 w-full flex-1 flex-col gap-5 transition-opacity ${
            refreshing ? "opacity-70" : "opacity-100"
          }`}
        >
          {/* All-time bento statistics */}
          <section className="w-full shrink-0">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-white">Nightbook at a glance</h2>
                <p className="text-xs font-bold text-[#8fb2de]">All-time collection totals</p>
              </div>
              <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#64dfd0]">
                Archive totals
              </span>
            </div>

            <div className="grid w-full grid-cols-2 gap-4 xl:grid-cols-4">
              <StatCard icon={BookOpen} label="Archive" value={totalDreams} note="Dreams safely recorded" color="#5bb8ff" surface="#173261" />
              <StatCard icon={Sparkles} label="Lucid" value={lucidDreams} note={`${lucidRateLabel} of your collection`} color="#94adff" surface="#1a3062" />
              <StatCard icon={Repeat} label="Recurring" value={recurringDreams} note="Dreams that returned" color="#64dfd0" surface="#163460" />
              <StatCard icon={Star} label="Rest" value={averageSleep} note="Average sleep quality" color="#ffe082" surface="#193362" />
            </div>
          </section>

          {/* AI narrative spotlight */}
          <section className="pattern-card relative w-full shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-[#203d78] via-[#192f63] to-[#1c285c] p-6 sm:p-7">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(148,173,255,0.25), transparent 70%)" }}
              aria-hidden="true"
            />
            <CartoonSparkle size={16} color="#ffe082" className="pattern-twinkle pointer-events-none absolute right-8 top-7" />
            <CartoonSparkle size={11} color="#64dfd0" className="pattern-twinkle pointer-events-none absolute right-20 top-14" />

            <div className="relative z-10 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#94adff] shadow-[0_3px_0_0_#081326]">
                    <Sparkles size={22} className="text-[#081326]" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Subconscious story reading</h2>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#b8c8ff]">
                      AI narrative insight
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040]/95 p-4">
                  <Quote size={20} className="mb-2 text-[#ffe082]" strokeWidth={2.5} />
                  <p aria-live="polite" className="text-sm font-semibold leading-relaxed text-[#d5e6ff]">
                    {insightText ||
                      "Generate a reflective summary to explore recurring themes, emotional shifts, and patterns appearing across your recent dream archive."}
                  </p>
                </div>

                {insightError && (
                  <p
                    role="alert"
                    className="mt-3 rounded-xl border-2 border-[#ff859d]/40 bg-[#ff859d]/10 px-4 py-3 text-xs font-bold text-[#ffd2db]"
                  >
                    {insightError}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void generateInsight()}
                disabled={insightLoading}
                className="pattern-btn-primary rounded-2xl px-5 py-3 text-sm lg:self-end"
              >
                {insightLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Reading patterns…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} strokeWidth={2.6} />
                    {insightText ? "Refresh reading" : "Generate reading"}
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Chart grid — three charts: 2-up, then full-width timeline */}
          <div className="grid w-full gap-5 xl:grid-cols-2">
            {/* Dream type donut */}
            <SectionCard
              title="Dream styles in orbit"
              subtitle={`Distribution across ${selectedRange.longLabel.toLowerCase()}`}
              icon={Moon}
              accent="#94adff"
            >
              {typeChartData.length > 0 ? (
                <div className="grid flex-1 items-center gap-5 sm:grid-cols-[1fr_0.9fr]">
                  <div className="pattern-chart relative mx-auto h-[240px] w-full max-w-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={88}
                          paddingAngle={3}
                          stroke="#081326"
                          strokeWidth={2}
                        >
                          {typeChartData.map((item) => (
                            <Cell key={item.type} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          labelStyle={LABEL_STYLE}
                          itemStyle={{ color: "#eef6ff" }}
                          formatter={(value, name) => [
                            `${Number(value)} ${Number(value) === 1 ? "dream" : "dreams"}`,
                            String(name),
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-white">{periodDreamCount}</span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8fb2de]">
                        Dreams
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    {typeChartData.map((item) => {
                      const percentage =
                        periodDreamCount > 0 ? Math.round((item.value / periodDreamCount) * 100) : 0;
                      return (
                        <div
                          key={item.type}
                          className="flex items-center gap-3 rounded-xl border-2 border-[#081326] bg-[#0e2040] px-3 py-2"
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-md border-2 border-[#081326]"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-extrabold text-white">{item.name}</p>
                            <p className="text-[10px] font-bold text-[#7899c2]">{item.value} logged</p>
                          </div>
                          <span className="text-xs font-extrabold text-[#8fd0ff]">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <ChartEmptyState message="No dream-type data appears in this period yet." />
              )}
            </SectionCard>

            {/* Sleep vs mood */}
            <SectionCard
              title="Rest and emotion"
              subtitle="Average sleep quality connected to each mood"
              icon={TrendingUp}
              accent="#64dfd0"
            >
              {sleepMoodData.length > 0 ? (
                <div className="pattern-chart flex-1 rounded-2xl border-2 border-[#081326] bg-[#0e2040] px-2 pb-2 pt-4">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sleepMoodData} margin={{ top: 8, right: 8, left: -20, bottom: 5 }}>
                      <CartesianGrid vertical={false} stroke="rgba(155,192,237,0.12)" strokeDasharray="4 4" />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={{ fill: "#8fb2de", fontSize: 10, fontWeight: 700 }}
                        tickFormatter={(value) =>
                          String(value).length > 8 ? `${String(value).slice(0, 7)}…` : String(value)
                        }
                      />
                      <YAxis
                        domain={[0, 5]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#7899c2", fontSize: 10, fontWeight: 700 }}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        labelStyle={LABEL_STYLE}
                        cursor={{ fill: "rgba(91,184,255,0.08)" }}
                        formatter={(value) => [`${Number(value).toFixed(1)} / 5`, "Average sleep"]}
                      />
                      <Bar dataKey="average" radius={[9, 9, 3, 3]} stroke="#081326" strokeWidth={2}>
                        {sleepMoodData.map((item) => (
                          <Cell key={item.mood} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState message="Add sleep ratings and moods to reveal this connection." />
              )}
            </SectionCard>
          </div>

          {/* Mood timeline — full width so it breathes */}
          <SectionCard
            title="Mood constellation over time"
            subtitle="How emotional tones rise, settle, and return"
            icon={Activity}
            accent="#5bb8ff"
            action={
              moodAnalysis.dominantMoods.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {moodAnalysis.dominantMoods.map((mood) => {
                    const MoodIcon = getMoodIcon(mood);
                    return (
                      <span
                        key={mood}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] px-2.5 py-1 text-[10px] font-extrabold text-[#081326]"
                        style={{ backgroundColor: MOOD_COLORS[mood] || "#94adff" }}
                      >
                        <MoodIcon size={10} strokeWidth={2.8} />
                        {getMoodLabel(mood)}
                      </span>
                    );
                  })}
                </div>
              ) : null
            }
          >
            {moodAnalysis.timeline.length > 0 ? (
              <div className="pattern-chart flex-1 rounded-2xl border-2 border-[#081326] bg-[#0e2040] px-2 pb-2 pt-4">
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={moodAnalysis.timeline} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid vertical={false} stroke="rgba(155,192,237,0.12)" strokeDasharray="4 4" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      minTickGap={24}
                      tick={{ fill: "#7899c2", fontSize: 10, fontWeight: 700 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#7899c2", fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelStyle={LABEL_STYLE}
                      cursor={{ stroke: "#ffe082", strokeWidth: 2, strokeDasharray: "4 4" }}
                    />
                    {moodAnalysis.dominantMoods.map((mood) => (
                      <Line
                        key={mood}
                        type="monotone"
                        dataKey={mood}
                        name={getMoodLabel(mood)}
                        stroke={MOOD_COLORS[mood] || "#5bb8ff"}
                        strokeWidth={3}
                        connectNulls
                        dot={false}
                        activeDot={{
                          r: 6,
                          fill: MOOD_COLORS[mood] || "#5bb8ff",
                          stroke: "#081326",
                          strokeWidth: 2.5,
                        }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="Mood changes will appear here as your journal grows." />
            )}
          </SectionCard>

          {/* Tags and lucidity */}
          <div className="grid w-full gap-5 xl:grid-cols-2">
            {/* Tag cloud */}
            <SectionCard
              title="Recurring symbols"
              subtitle="The places, objects, and ideas returning most often"
              icon={Tag}
              accent="#ffe082"
            >
              {data.top_tags.length > 0 ? (
                <div className="flex flex-1 flex-col">
                  <div className="flex flex-wrap gap-2.5">
                    {data.top_tags.map(({ tag, count }, index) => {
                      const color = TAG_COLORS[index % TAG_COLORS.length];
                      return (
                        <span
                          key={tag}
                          className="pattern-lift inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1.5 font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]"
                          style={{
                            backgroundColor: color,
                            fontSize: `${Math.min(0.75 + count * 0.025, 1)}rem`,
                          }}
                        >
                          <Hash size={12} strokeWidth={3} />
                          {tag}
                          <span className="rounded-full border border-[#081326]/50 bg-white/25 px-1.5 py-0.5 text-[9px]">
                            {count}
                          </span>
                        </span>
                      );
                    })}
                  </div>

                  <div className="mt-auto rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4 pt-4 [margin-top:1.25rem]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] shadow-[0_2px_0_0_#081326]">
                        <Compass size={18} className="text-[#081326]" strokeWidth={2.6} />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-white">Strongest recurring symbol</p>
                        <p className="mt-0.5 text-sm font-extrabold text-[#ffe082]">
                          #{data.top_tags[0].tag}
                          <span className="ml-2 text-xs font-bold text-[#8fb2de]">
                            {data.top_tags[0].count} appearances
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <ChartEmptyState message="Tags from your dream entries will gather here." />
              )}
            </SectionCard>

            {/* Lucidity portal */}
            <SectionCard
              title="Lucidity portal"
              subtitle="How often awareness appears inside your dreams"
              icon={Sparkles}
              accent="#94adff"
            >
              <div className="flex flex-1 flex-col items-center gap-5 sm:flex-row">
                <div
                  className="relative flex h-44 w-44 shrink-0 items-center justify-center rounded-full border-[3px] border-[#081326] shadow-[0_5px_0_0_#081326]"
                  style={{
                    background: `conic-gradient(#94adff 0% ${lucidRate}%, #0e2040 ${lucidRate}% 100%)`,
                  }}
                  role="progressbar"
                  aria-label="Lucidity rate"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(lucidRate)}
                >
                  <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-[3px] border-[#081326] bg-[#152d58]">
                    <Moon size={24} className="mb-1 text-[#ffe082]" fill="#ffe082" strokeWidth={2.4} />
                    <span className="text-3xl font-extrabold text-white">{lucidRateLabel}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8fb2de]">
                      Lucid rate
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3">
                  <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                    <p className="text-2xl font-extrabold text-[#94adff]">{lucidDreams}</p>
                    <p className="text-xs font-bold text-[#9bc0ed]">Lucid dreams recorded</p>
                  </div>

                  <p className="text-xs font-semibold leading-relaxed text-[#8fb2de]">
                    A lucid dream is an entry where you recognized that you were dreaming while the dream
                    was still happening.
                  </p>

                  <Link
                    href="/journal"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#64dfd0] hover:text-white"
                  >
                    Revisit your journal
                    <ChevronRight size={14} strokeWidth={2.8} />
                  </Link>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Bottom guidance — pinned to page bottom */}
          <section className="pattern-card relative mt-auto w-full shrink-0 overflow-hidden rounded-3xl bg-[#132952] p-5 sm:p-6">
            <CartoonSparkle size={13} color="#ffe082" className="pointer-events-none absolute right-6 top-5" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#64dfd0] shadow-[0_3px_0_0_#081326]">
                  <BarChart3 size={20} className="text-[#081326]" strokeWidth={2.6} />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-white">
                    Patterns become clearer with consistency
                  </h2>
                  <p className="mt-1 text-xs font-semibold text-[#8fb2de]">
                    Add dream type, mood, sleep quality, and tags to make future analysis more useful.
                  </p>
                </div>
              </div>

              <Link href="/journal/new" className="pattern-btn-secondary rounded-2xl px-4 py-2.5 text-xs">
                Add another entry
                <ChevronRight size={14} className="text-[#64dfd0]" strokeWidth={2.8} />
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}