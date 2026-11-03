"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Plus, X, BookOpen, Mic, Repeat,
  Sparkles, ChevronRight, Moon, Loader2, Hash,
} from "lucide-react";
import { dreamsApi, profileApi } from "@/lib/api";
import type { DateFormat, Dream } from "@/types";
import {
  DREAM_TYPES, MOOD_TYPES, DREAM_TYPE_LABELS, DREAM_TYPE_ICONS,
  MOOD_LABELS, formatRelativeDate,
} from "@/lib/utils";
import {
  CartoonCloud, CartoonSparkle, JournalStyles, JOURNAL_FONT, getMoodStickerStyle,
} from "@/components/JournalTheme";
import DreamLoader from "@/components/DreamLoader";

function DreamSkeleton() {
  return (
    <div className="jr-card animate-pulse rounded-3xl bg-[#152c57] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="h-9 w-9 rounded-xl bg-white/10" />
        <div className="h-5 w-20 rounded-full bg-white/10" />
      </div>
      <div className="mb-3 h-5 w-3/4 rounded-lg bg-white/15" />
      <div className="mb-2 h-3 w-full rounded bg-white/10" />
      <div className="mb-4 h-3 w-5/6 rounded bg-white/10" />
      <div className="flex gap-2">
        <div className="h-6 w-24 rounded-full bg-white/10" />
        <div className="h-6 w-20 rounded-full bg-white/10" />
      </div>
    </div>
  );
}

function DreamStoryCard({
  dream,
  blurPreviews = false,
  dateFormat,
  index = 0,
}: {
  dream: Dream;
  blurPreviews?: boolean;
  dateFormat?: DateFormat;
  index?: number;
}) {
  const TypeIcon = DREAM_TYPE_ICONS[dream.dream_type];
  const { icon: MoodIcon, bg: moodBg } = getMoodStickerStyle(dream.mood);
  const preview = (dream as unknown as { excerpt?: string }).excerpt || dream.body || "";

  return (
    <Link
      href={`/journal/${dream.id}`}
      className="jr-card jr-lift group relative flex h-full flex-col gap-3 overflow-hidden rounded-3xl bg-[#162e59] p-5 fade-in-scale"
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <CartoonCloud fill="#1d3d75" className="pointer-events-none absolute -bottom-7 -right-8 w-32 opacity-40 transition-opacity duration-300 group-hover:opacity-75" />

      <div className="relative z-10 flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326] transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
          {TypeIcon ? <TypeIcon size={18} className="text-[#081326]" strokeWidth={2.5} />
            : <Moon size={18} className="text-[#081326]" fill="#ffe082" strokeWidth={2.4} />}
        </span>
        <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-[11px] font-extrabold text-[#9bc0ed] transition-colors group-hover:border-[#5bb8ff]/50">
          {formatRelativeDate(dream.dream_date, dateFormat)}
        </span>
      </div>

      <div className="relative z-10">
        <h3 className="line-clamp-1 text-base font-extrabold text-white transition-colors duration-150 group-hover:text-[#badcff]">{dream.title || "Untitled Dream"}</h3>
        <p
          className={`mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed text-[#b8d2f4] transition-all duration-200 ${
            blurPreviews ? "blur-[5px] select-none group-hover:blur-none" : ""
          }`}
          title={blurPreviews ? "Hover to reveal preview" : undefined}
        >
          {preview || "No description recorded for this entry yet."}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#94adff] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326] transition-transform duration-200 group-hover:scale-105">
          {TypeIcon && <TypeIcon size={11} strokeWidth={2.6} />}
          {DREAM_TYPE_LABELS[dream.dream_type]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326] transition-transform duration-200 group-hover:scale-105" style={{ backgroundColor: moodBg }}>
          <MoodIcon size={11} strokeWidth={2.6} />
          {MOOD_LABELS[dream.mood]}
        </span>
        {dream.is_lucid && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#ffe082] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
            <Sparkles size={11} strokeWidth={2.6} /> Lucid
          </span>
        )}
        {dream.is_recurring && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#64dfd0] px-2.5 py-0.5 text-[11px] font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
            <Repeat size={11} strokeWidth={2.6} /> Recurring
          </span>
        )}
        {dream.input_method === "voice" && (
          <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#0e2040] px-2.5 py-0.5 text-[11px] font-extrabold text-[#7ac8ff]">
            <Mic size={11} strokeWidth={2.6} /> Voice
          </span>
        )}
      </div>

      {dream.tags_detail?.length > 0 && (
        <div className="relative z-10 flex flex-wrap items-center gap-1.5">
          {dream.tags_detail.slice(0, 3).map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-0.5 rounded-lg border-2 border-[#081326] bg-[#1c396e] px-2 py-0.5 text-[11px] font-bold text-[#cfe3fc] transition-colors duration-150 group-hover:bg-[#254b8c] group-hover:text-white">
              <Hash size={9} strokeWidth={3} />{tag.name}
            </span>
          ))}
          {dream.tags_detail.length > 3 && (
            <span className="text-[11px] font-extrabold text-[#8cb2e0]">+{dream.tags_detail.length - 3} more</span>
          )}
        </div>
      )}

      <span className="relative z-10 mt-auto inline-flex items-center gap-1 pt-2 text-[11px] font-extrabold text-[#6bc2ff]">
        Read entry
        <ChevronRight size={13} strokeWidth={3} className="transition-transform duration-200 group-hover:translate-x-1.5" />
      </span>
    </Link>
  );
}

export default function JournalPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [moodFilter, setMoodFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async (p = 1) => {
    if (p === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await dreamsApi.list({
        q: debouncedQ || undefined,
        type: typeFilter || undefined,
        mood: moodFilter || undefined,
        page: p,
      });
      setDreams((prev) => (p === 1 ? res.results : [...prev, ...res.results]));
      setTotal(res.count);
      setHasNext(!!res.next);
      setPage(p);
    } catch {
      if (p === 1) setDreams([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedQ, typeFilter, moodFilter]);

  const [blurPreviews, setBlurPreviews] = useState(false);
  const [dateFormat, setDateFormat] = useState<DateFormat>("locale");

  useEffect(() => {
    async function checkPreferences() {
      try {
        const pr = await profileApi.get();
        if (typeof pr?.blur_previews === "boolean") setBlurPreviews(pr.blur_previews);
        else if (typeof pr?.blurPreviews === "boolean") setBlurPreviews(pr.blurPreviews);
        else setBlurPreviews(window.localStorage.getItem("stardrift_blur_previews") === "true");

        const df = (pr?.date_format || pr?.dateFormat) as DateFormat | undefined;
        if (df) setDateFormat(df);
      } catch {
        setBlurPreviews(window.localStorage.getItem("stardrift_blur_previews") === "true");
      }
    }
    void checkPreferences();

    function onSettingsUpdate(e: Event) {
      const customEvent = e as CustomEvent;
      if (typeof customEvent.detail?.settings?.blurPreviews === "boolean") {
        setBlurPreviews(customEvent.detail.settings.blurPreviews);
      }
    }
    window.addEventListener("settings-updated", onSettingsUpdate);
    return () => window.removeEventListener("settings-updated", onSettingsUpdate);
  }, []);

  useEffect(() => { load(1); }, [load]);

  const hasFilters = !!(q || typeFilter || moodFilter);
  const activeFilterCount = useMemo(
    () => [q, typeFilter, moodFilter].filter(Boolean).length,
    [q, typeFilter, moodFilter]
  );

  const clearFilters = () => { setQ(""); setTypeFilter(""); setMoodFilter(""); };

  if (loading && dreams.length === 0) {
    return <DreamLoader variant="full" message="Gathering your dreams…" />;
  }

  return (
    <div
      className="fade-in-scale flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-4 text-[#eef6ff]"
      style={{ fontFamily: JOURNAL_FONT }}
    >
      <JournalStyles />

      {/* Hero */}
      <section className="jr-card fade-in-scale stagger-1 relative w-full shrink-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] via-[#152d59] to-[#0f2245] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(91,184,255,0.28) 0%, transparent 70%)" }} aria-hidden="true" />
        <CartoonCloud fill="#214685" className="pointer-events-none absolute -bottom-6 -right-8 hidden w-56 opacity-80 sm:block" />
        <CartoonSparkle size={15} color="#ffe082" className="pointer-events-none absolute right-10 top-7 opacity-90" />
        <CartoonSparkle size={11} color="#64dfd0" className="pointer-events-none absolute right-28 top-16 hidden opacity-75 sm:block" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#7ac8ff] shadow-[0_2px_0_0_#081326]">
              <BookOpen size={13} className="text-[#ffe082]" /> Your Nightbook
            </span>
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white [text-shadow:0_3px_0_#081326] sm:text-3xl">
              Dream Storybook
            </h1>
            <p className="text-sm font-semibold leading-relaxed text-[#bad4f7]">
              {total > 0
                ? `${total} ${total === 1 ? "dream" : "dreams"} safely tucked into your archive. Search, filter, and revisit any night.`
                : "Every entry you save becomes a page in your personal storybook."}
            </p>
          </div>
          <Link href="/journal/new" className="jr-btn-primary px-5 py-3 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#ffe082]">
              <Mic size={14} strokeWidth={2.8} className="text-[#081326]" />
            </span>
            Record a Dream
          </Link>
        </div>
      </section>

      {/* Search + filters */}
      <section className="fade-in-scale stagger-2 flex w-full shrink-0 flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={18} strokeWidth={2.4} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6bc2ff]" aria-hidden="true" />
          <input
            id="journal-search" type="text" value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your dreams…"
            className="jr-input jr-input-search"
            style={{ paddingLeft: "3rem", paddingRight: "2.75rem" }}
            aria-label="Search dreams"
          />
          {q && (
            <button type="button" onClick={() => setQ("")}
              className="absolute right-2.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8fb2de] hover:bg-white/10 hover:text-white"
              aria-label="Clear search">
              <X size={16} strokeWidth={2.6} />
            </button>
          )}
        </div>

        <button type="button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}
          className={`jr-btn-secondary h-12 px-4 text-sm ${showFilters ? "!bg-[#5bb8ff] !text-[#081326]" : ""}`}>
          <SlidersHorizontal size={16} strokeWidth={2.6} /> Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#081326] bg-[#ffe082] px-1 text-[10px] font-extrabold text-[#081326]">
              {activeFilterCount}
            </span>
          )}
        </button>

        {hasFilters && (
          <button type="button" onClick={clearFilters} className="jr-btn-secondary h-12 px-4 text-sm" aria-label="Clear all filters">
            <X size={15} strokeWidth={2.6} /> Clear
          </button>
        )}
      </section>

      {showFilters && (
        <section className="jr-card jr-pop w-full shrink-0 space-y-5 rounded-3xl bg-[#152c57] p-5">
          <div>
            <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-[#7ea4d4]">Dream Type</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="jr-chip" data-active={typeFilter === ""}
                style={typeFilter === "" ? { backgroundColor: "#5bb8ff" } : undefined}
                onClick={() => setTypeFilter("")}>All types</button>
              {DREAM_TYPES.map((t) => {
                const Icon = DREAM_TYPE_ICONS[t];
                const active = typeFilter === t;
                return (
                  <button key={t} type="button" className="jr-chip" data-active={active}
                    style={active ? { backgroundColor: "#94adff" } : undefined}
                    onClick={() => setTypeFilter(active ? "" : t)}>
                    {Icon && <Icon size={12} strokeWidth={2.6} />}{DREAM_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-widest text-[#7ea4d4]">Mood</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="jr-chip" data-active={moodFilter === ""}
                style={moodFilter === "" ? { backgroundColor: "#5bb8ff" } : undefined}
                onClick={() => setMoodFilter("")}>All moods</button>
              {MOOD_TYPES.map((m) => {
                const { icon: MoodIcon, bg } = getMoodStickerStyle(m);
                const active = moodFilter === m;
                return (
                  <button key={m} type="button" className="jr-chip" data-active={active}
                    style={active ? { backgroundColor: bg } : undefined}
                    onClick={() => setMoodFilter(active ? "" : m)}>
                    <MoodIcon size={12} strokeWidth={2.6} />{MOOD_LABELS[m]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Results fill remaining space */}
      <div className="fade-in-scale stagger-3 flex min-h-0 w-full flex-1 flex-col">
        {loading && dreams.length === 0 ? (
          <DreamLoader variant="section" message="Gathering your dreams…" />
        ) : dreams.length === 0 ? (
          <section className="jr-card relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#162e59] p-10 text-center">
            <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-8 -left-10 w-52 opacity-60" />
            <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-8 -right-10 w-52 opacity-60" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-[2.5px] border-[#081326] bg-[#5bb8ff] shadow-[0_4px_0_0_#081326]"
                style={{ animation: "jrFloat 6s ease-in-out infinite" }}>
                <BookOpen size={28} className="text-[#081326]" strokeWidth={2.4} />
              </div>
              <h2 className="text-xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">
                {hasFilters ? "No dreams match those filters" : "Your journal is waiting"}
              </h2>
              <p className="max-w-sm text-sm font-semibold leading-relaxed text-[#b8d2f4]">
                {hasFilters
                  ? "Try a different search term, type, or mood to find the night you're looking for."
                  : "No dreams yet — even a single image or feeling counts. Write tonight's story first thing when you wake."}
              </p>
              {hasFilters ? (
                <button type="button" onClick={clearFilters} className="jr-btn-secondary px-5 py-3 text-sm">
                  <X size={15} strokeWidth={2.6} /> Clear filters
                </button>
              ) : (
                <Link href="/journal/new" className="jr-btn-primary px-5 py-3 text-sm">
                  <Mic size={16} strokeWidth={2.8} /> Record your first dream
                </Link>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3">
              {dreams.map((d, idx) => (
                <DreamStoryCard key={d.id} dream={d} blurPreviews={blurPreviews} dateFormat={dateFormat} index={idx} />
              ))}
              {loadingMore && [...Array(3)].map((_, i) => <DreamSkeleton key={`s-${i}`} />)}
            </div>

            <div className="mt-auto flex flex-col items-center gap-2 pt-5">
              {hasNext ? (
                <button type="button" onClick={() => load(page + 1)} disabled={loadingMore} className="jr-btn-secondary px-6 py-3 text-sm">
                  {loadingMore ? <><Loader2 size={16} className="animate-spin" /> Loading more…</>
                    : <>Load more dreams <ChevronRight size={15} strokeWidth={2.8} className="text-[#6bc2ff]" /></>}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#0e2040] px-4 py-1.5 text-[11px] font-extrabold text-[#8cb2e0]">
                  <Moon size={12} className="text-[#ffe082]" fill="#ffe082" />
                  You&apos;ve reached the end of your storybook
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}