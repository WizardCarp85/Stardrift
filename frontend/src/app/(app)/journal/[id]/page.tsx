"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2, ArrowLeft, Star, Sparkles, Repeat, Mic, Pencil, Quote,
  Hash, CalendarDays, Clock, Moon, AlertTriangle, Loader2, X,
} from "lucide-react";
import { dreamsApi, profileApi } from "@/lib/api";
import type { DateFormat, Dream } from "@/types";
import { DreamForm } from "@/components/DreamForm";
import { DREAM_TYPE_LABELS, DREAM_TYPE_ICONS, MOOD_LABELS, formatDate } from "@/lib/utils";
import DreamLoader from "@/components/DreamLoader";
import {
  CartoonCloud, CartoonSparkle, JournalStyles, JOURNAL_FONT, getMoodStickerStyle,
} from "@/components/JournalTheme";

const PAGE_SHELL = "flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-4";

export default function DreamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [dream, setDream] = useState<Dream | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [dateFormat, setDateFormat] = useState<DateFormat>("locale");

  useEffect(() => {
    profileApi.get().then((p) => {
      const df = (p?.date_format || p?.dateFormat) as DateFormat | undefined;
      if (df) setDateFormat(df);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    dreamsApi.get(id)
      .then((d) => { if (active) setDream(d); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !deleting) setConfirmOpen(false); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [confirmOpen, deleting]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await dreamsApi.delete(id);
      router.push("/journal");
    } catch {
      setDeleting(false);
      setDeleteError("Could not delete this dream. Please try again.");
    }
  }, [id, router]);

  const { wordCount, readMinutes } = useMemo(() => {
    const words = (dream?.body || "").trim().split(/\s+/).filter(Boolean).length;
    return { wordCount: words, readMinutes: Math.max(1, Math.ceil(words / 200)) };
  }, [dream?.body]);

  /* Loading */
  if (loading) {
    return <DreamLoader variant="full" message="Weaving dream threads…" />;
  }

  /* Not found */
  if (!dream) {
    return (
      <div className={PAGE_SHELL} style={{ fontFamily: JOURNAL_FONT }}>
        <JournalStyles />
        <section className="jr-card relative flex w-full flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#162e59] p-10 text-center">
          <CartoonCloud fill="#20427d" className="pointer-events-none absolute -bottom-8 -right-10 w-52 opacity-60" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border-[2.5px] border-[#081326] bg-[#ff9bb0] shadow-[0_4px_0_0_#081326]"
              style={{ animation: "jrFloat 6s ease-in-out infinite" }}>
              <Moon size={28} className="text-[#081326]" strokeWidth={2.4} />
            </div>
            <h2 className="text-xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">This dream drifted away</h2>
            <p className="max-w-sm text-sm font-semibold text-[#b8d2f4]">
              We couldn&apos;t find that entry. It may have been deleted or the link is incorrect.
            </p>
            <Link href="/journal" className="jr-btn-primary px-5 py-3 text-sm">
              <ArrowLeft size={16} strokeWidth={2.8} /> Back to journal
            </Link>
          </div>
        </section>
      </div>
    );
  }

  /* Edit mode */
  if (editMode) {
    return (
      <div className={PAGE_SHELL} style={{ fontFamily: JOURNAL_FONT }}>
        <JournalStyles />

        <section className="jr-card relative w-full shrink-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] to-[#0f2245] p-6">
          <CartoonSparkle size={14} color="#ffe082" className="pointer-events-none absolute right-8 top-6 opacity-90" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#ffe082] shadow-[0_3px_0_0_#081326]">
                <Pencil size={20} className="text-[#081326]" strokeWidth={2.5} />
              </span>
              <div>
                <h1 className="text-xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">Editing dream</h1>
                <p className="text-xs font-bold text-[#9bc0ed]">{dream.title || "Untitled Dream"}</p>
              </div>
            </div>
            <button type="button" onClick={() => setEditMode(false)} className="jr-btn-secondary px-4 py-2.5 text-sm">
              <X size={15} strokeWidth={2.8} /> Cancel editing
            </button>
          </div>
        </section>

        <div className="jr-form-scope flex w-full flex-1 flex-col">
          <DreamForm
            mode="edit"
            dreamId={id}
            initialData={{
              title: dream.title,
              body: dream.body,
              dream_date: dream.dream_date,
              dream_type: dream.dream_type,
              mood: dream.mood,
              sleep_quality: dream.sleep_quality,
              is_lucid: dream.is_lucid,
              is_recurring: dream.is_recurring,
              input_method: dream.input_method,
              tags: dream.tags_detail.map((t) => t.name),
            }}
          />
        </div>
      </div>
    );
  }

  const TypeIcon = DREAM_TYPE_ICONS[dream.dream_type];
  const { icon: MoodIcon, bg: moodBg } = getMoodStickerStyle(dream.mood);

  return (
    <div className={`${PAGE_SHELL} text-[#eef6ff]`} style={{ fontFamily: JOURNAL_FONT }}>
      <JournalStyles />

      {/* Top Header / Action Bar */}
      <header className="flex w-full shrink-0 flex-wrap items-center justify-between gap-3 fade-up">
        <Link
          href="/journal"
          className="jr-btn-secondary group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
          aria-label="Back to journal"
        >
          <ArrowLeft size={16} strokeWidth={2.8} className="transition-transform duration-200 group-hover:-translate-x-1" /> Back to journal
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="jr-btn-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
          >
            <Pencil size={15} strokeWidth={2.6} className="text-[#6bc2ff]" /> Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="jr-btn-danger inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold"
          >
            <Trash2 size={15} strokeWidth={2.6} /> Delete
          </button>
        </div>
      </header>

      {deleteError && (
        <div role="alert" className="jr-card flex w-full shrink-0 items-center gap-3 rounded-2xl bg-[#3a2340] px-5 py-3.5 text-sm font-bold text-[#ffd2db]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#ff859d] text-[#081326]">
            <AlertTriangle size={16} strokeWidth={2.6} />
          </span>
          {deleteError}
        </div>
      )}

      {/* Hero */}
      <section className="jr-card relative w-full shrink-0 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] via-[#152d59] to-[#0f2245] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(91,184,255,0.26) 0%, transparent 70%)" }} aria-hidden="true" />
        <CartoonCloud fill="#214685" className="pointer-events-none absolute -bottom-7 -right-8 hidden w-48 opacity-75 sm:block" />
        <CartoonSparkle size={14} color="#ffe082" className="pointer-events-none absolute right-10 top-7 opacity-90" />

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#5bb8ff] shadow-[0_3px_0_0_#081326]">
              {TypeIcon ? <TypeIcon size={22} className="text-[#081326]" strokeWidth={2.5} />
                : <Moon size={22} className="text-[#081326]" fill="#ffe082" strokeWidth={2.4} />}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#9bc0ed]">
              <CalendarDays size={12} className="text-[#64dfd0]" />
              {formatDate(dream.dream_date, dateFormat)}
            </span>
          </div>

          <h1 className="mb-4 text-2xl font-extrabold tracking-tight text-white [text-shadow:0_3px_0_#081326] sm:text-4xl">
            {dream.title || "Untitled Dream"}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#94adff] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
              {TypeIcon && <TypeIcon size={13} strokeWidth={2.6} />}{DREAM_TYPE_LABELS[dream.dream_type]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]" style={{ backgroundColor: moodBg }}>
              <MoodIcon size={13} strokeWidth={2.6} />{MOOD_LABELS[dream.mood]}
            </span>
            {dream.is_lucid && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#ffe082] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
                <Sparkles size={13} strokeWidth={2.6} /> Lucid
              </span>
            )}
            {dream.is_recurring && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#64dfd0] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
                <Repeat size={13} strokeWidth={2.6} /> Recurring
              </span>
            )}
            {dream.input_method === "voice" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#5bb8ff] px-3 py-1 text-xs font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]">
                <Mic size={13} strokeWidth={2.6} /> Voice note
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Story body — stretches to fill */}
      <section className="jr-card relative flex w-full flex-1 flex-col overflow-hidden rounded-3xl bg-[#162e59] p-6 sm:p-7">
        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#ffe082] shadow-[0_2px_0_0_#081326]">
              <Quote size={16} className="text-[#081326]" strokeWidth={2.6} />
            </span>
            <h2 className="text-lg font-extrabold text-white">The Dream</h2>
          </div>
          {wordCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full border-2 border-[#081326] bg-[#0e2040] px-2.5 py-1 text-[11px] font-extrabold text-[#8cb2e0]">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#0e2040] px-2.5 py-1 text-[11px] font-extrabold text-[#8cb2e0]">
                <Clock size={11} className="text-[#64dfd0]" />{readMinutes} min read
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-5 text-sm font-medium text-[#cfe3fc]"
          style={{ lineHeight: 1.85, whiteSpace: "pre-wrap" }}>
          {dream.body || (
            <span className="font-semibold italic text-[#7899c2]">No description recorded for this night.</span>
          )}
        </div>
      </section>

      {/* Sleep quality & Tags */}
      {(dream.sleep_quality || dream.tags_detail.length > 0) && (
        <section className="flex w-full shrink-0 flex-wrap gap-4">
          {dream.sleep_quality && (
            <div className="jr-card jr-lift flex-1 min-w-[240px] rounded-3xl bg-[#152c57] p-5">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-[#7ea4d4]">Sleep Quality</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const lit = i < (dream.sleep_quality ?? 0);
                    return (
                      <Star key={i} size={22} strokeWidth={2.4}
                        style={{ color: lit ? "#ffe082" : "#2c4a80", fill: lit ? "#ffe082" : "transparent" }} />
                    );
                  })}
                </div>
                <span className="ml-1 text-sm font-extrabold text-white">{dream.sleep_quality}/5</span>
              </div>
            </div>
          )}

          {dream.tags_detail.length > 0 && (
            <div className="jr-card rounded-3xl bg-[#152c57] p-5 flex-1 min-w-[240px]">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-[#7ea4d4]">Tags</p>
              <div className="flex flex-wrap gap-2">
                {dream.tags_detail.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#1c396e] px-3 py-1 text-xs font-extrabold text-[#cfe3fc] shadow-[0_2px_0_0_#081326]">
                    <Hash size={11} strokeWidth={3} className="text-[#64dfd0]" />{tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Delete modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b18]/80 p-5 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-labelledby="delete-dream-title"
          onClick={() => !deleting && setConfirmOpen(false)}>
          <div className="jr-card jr-pop w-full max-w-sm rounded-[26px] bg-[#162e59] p-6 text-center"
            style={{ fontFamily: JOURNAL_FONT }} onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#ff859d] shadow-[0_4px_0_0_#081326]">
              <Trash2 size={24} className="text-[#081326]" strokeWidth={2.5} />
            </div>
            <h3 id="delete-dream-title" className="mb-2 text-xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">
              Delete this dream?
            </h3>
            <p className="mb-6 text-sm font-semibold leading-relaxed text-[#b8d2f4]">
              <span className="font-extrabold text-white">“{dream.title || "Untitled Dream"}”</span>{" "}
              will be removed from your storybook permanently. This can&apos;t be undone.
            </p>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button type="button" onClick={() => setConfirmOpen(false)} disabled={deleting} className="jr-btn-secondary flex-1 px-4 py-3 text-sm">
                Keep it
              </button>
              <button type="button" onClick={handleDelete} disabled={deleting} className="jr-btn-danger flex-1 px-4 py-3 text-sm">
                {deleting ? <><Loader2 size={15} className="animate-spin" /> Deleting…</>
                  : <><Trash2 size={15} strokeWidth={2.6} /> Delete forever</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}