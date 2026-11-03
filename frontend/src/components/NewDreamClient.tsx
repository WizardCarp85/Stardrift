"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, Upload, ArrowRight, Check } from "lucide-react";
import { DreamForm } from "@/components/DreamForm";
import { NewDreamTips } from "@/components/NewDreamTips";
import { UploadModal } from "@/components/UploadModal";
import {
  CartoonCloud,
  CartoonSparkle,
  JournalStyles,
  JOURNAL_FONT,
} from "@/components/JournalTheme";
import type { DreamFormData } from "@/types";
import { getYesterdayDateString } from "@/lib/utils";
import { emitCaptureState } from "@/lib/captureState";

export function NewDreamClient() {
  const [openModal, setOpenModal] = useState<"none" | "form" | "upload">("none");
  const [hasDraft, setHasDraft] = useState(false);
  const [importedData, setImportedData] = useState<Partial<DreamFormData> | null>(null);
  const [importedSummary, setImportedSummary] = useState<{
    filename: string;
    warnings: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem("stardrift_dream_draft");
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && (parsed.title?.trim() || parsed.body?.trim())) {
          setHasDraft(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (openModal === "none") {
      emitCaptureState({ mode: "idle", isListening: false });
    } else if (openModal === "upload") {
      emitCaptureState({ mode: "upload", isListening: false });
    }
  }, [openModal]);

  useEffect(() => {
    emitCaptureState({ mode: "idle", isListening: false });

    function handleReset() {
      setOpenModal("none");
      emitCaptureState({ mode: "idle", isListening: false });
    }

    window.addEventListener("stardrift-new-dream-click", handleReset);
    return () => {
      window.removeEventListener("stardrift-new-dream-click", handleReset);
      emitCaptureState({ mode: "idle", isListening: false });
    };
  }, []);

  function handleUploadSuccess(data: {
    title: string;
    body: string;
    date: string | null;
    filename: string;
    warnings: string[];
  }) {
    setImportedData({
      title: data.title,
      body: data.body,
      dream_date: data.date || getYesterdayDateString(),
      input_method: "text",
    });
    setImportedSummary({
      filename: data.filename,
      warnings: data.warnings,
    });
    setOpenModal("form");
  }

  return (
    <div
      className="fade-in-scale flex w-full flex-col gap-5 text-[#eef6ff]"
      style={{ fontFamily: JOURNAL_FONT }}
    >
      <JournalStyles />

      {/* Illustrated banner */}
      <section className="jr-card relative flex w-full shrink-0 flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] via-[#152d59] to-[#0f2245] p-6 sm:p-8 animate-pop-in">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(91,184,255,0.28) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <CartoonCloud fill="#214685" className="pointer-events-none absolute -bottom-7 -right-8 hidden w-52 opacity-80 sm:block" />
        <CartoonSparkle size={15} color="#ffe082" className="pointer-events-none absolute right-56 top-7 opacity-90" />
        <CartoonSparkle size={11} color="#64dfd0" className="pointer-events-none absolute right-72 top-14 hidden opacity-75 sm:block" />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-xs font-extrabold text-[#7ac8ff] shadow-[0_2px_0_0_#081326]">
              <Mic size={13} className="text-[#ffe082]" />
              Voice-first log
            </span>
            <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-white [text-shadow:0_3px_0_#081326] sm:text-3xl">
              Record tonight&apos;s dream
            </h1>
            <p className="text-sm font-semibold leading-relaxed text-[#bad4f7]">
              Speak, type, or import an existing document while it&apos;s still fresh — details fade within minutes of waking. Tap the mic to record or import your notes anytime.
            </p>
          </div>

          <Link
            href="/journal"
            className="jr-btn-secondary inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm"
            aria-label="Back to journal"
          >
            <ArrowLeft size={16} strokeWidth={2.8} /> Back to journal
          </Link>
        </div>
      </section>

      {/* Recall & capture info tips */}
      <NewDreamTips />

      {/* Hero Option Selection Cards (Generous 2-Column Bento) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full shrink-0">
        {/* Option 1: Voice / Write */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpenModal("form")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenModal("form");
            }
          }}
          className="jr-card jr-lift group relative flex flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1b3a6e] via-[#162e5b] to-[#112347] p-6 text-left cursor-pointer transition-all focus-visible:outline-3 focus-visible:outline-[#ffe082]"
        >
          <CartoonCloud fill="#204588" className="pointer-events-none absolute -bottom-8 -right-8 w-44 opacity-40 transition-opacity duration-300 group-hover:opacity-75" />
          <CartoonSparkle size={13} color="#ffe082" className="pointer-events-none absolute right-8 top-6 opacity-75" />

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_3px_0_0_#081326] transition-transform duration-200 group-hover:scale-105">
                <Mic size={26} strokeWidth={2.6} />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {hasDraft && (
                  <span className="rounded-full border border-[#64dfd0]/60 bg-[#64dfd0]/20 px-2.5 py-1 text-[10px] font-extrabold text-[#64dfd0] shadow-[0_1.5px_0_0_#081326]">
                    Draft saved
                  </span>
                )}
                <span className="rounded-full border border-[#081326] bg-[#0c1a36] px-3 py-1 text-[10px] font-extrabold text-[#7ac8ff] shadow-[0_1.5px_0_0_#081326]">
                  Voice-First • Instant
                </span>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">
              Speak or Write Your Dream
            </h2>
            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#b5d3f8]">
              Open the full storybook editor to dictate using your microphone or type your memories. Tag feelings, lucidity, and sleep quality.
            </p>

            <ul className="mt-4 flex flex-col gap-2 text-xs font-semibold text-[#cfe2fa]">
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#64dfd0]/20 text-[#64dfd0]">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>Live speech-to-text dictation with mic tap</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#64dfd0]/20 text-[#64dfd0]">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>Custom mood tags, sleep quality, and lucidity</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#64dfd0]/20 text-[#64dfd0]">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>Continuous auto-save so nothing is ever lost</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-[#081326]/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenModal("form");
              }}
              className="jr-btn-primary w-full py-3 text-sm cursor-pointer"
            >
              <span>{hasDraft ? "Continue Saved Draft" : "Open Dream Editor"}</span>
              <ArrowRight size={16} strokeWidth={2.8} />
            </button>
          </div>
        </div>

        {/* Option 2: Upload from File */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpenModal("upload")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenModal("upload");
            }
          }}
          className="jr-card jr-lift group relative flex flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-br from-[#1c2e5b] via-[#16274e] to-[#101c3c] p-6 text-left cursor-pointer transition-all focus-visible:outline-3 focus-visible:outline-[#ffe082]"
        >
          <CartoonCloud fill="#23386b" className="pointer-events-none absolute -bottom-8 -right-8 w-44 opacity-40 transition-opacity duration-300 group-hover:opacity-75" />
          <CartoonSparkle size={13} color="#64dfd0" className="pointer-events-none absolute right-8 top-6 opacity-75" />

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#b89eff] text-[#081326] shadow-[0_3px_0_0_#081326] transition-transform duration-200 group-hover:scale-105">
                <Upload size={26} strokeWidth={2.6} />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#081326] bg-[#64dfd0] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#081326] shadow-[0_1.5px_0_0_#081326]">
                  NEW
                </span>
                <span className="rounded-full border border-[#081326] bg-[#0c1a36] px-3 py-1 text-[10px] font-extrabold text-[#cbb5ff] shadow-[0_1.5px_0_0_#081326]">
                  .TXT • .DOCX • .PDF
                </span>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white [text-shadow:0_2px_0_#081326]">
              Upload Dream from Document
            </h2>
            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-[#b5d3f8]">
              Import existing journal notes from Microsoft Word, text files, or exported PDFs. Title, date, and story text are extracted automatically.
            </p>

            <ul className="mt-4 flex flex-col gap-2 text-xs font-semibold text-[#cfe2fa]">
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#b89eff]/20 text-[#b89eff]">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>Automatic title &amp; date detection from first lines</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#b89eff]/20 text-[#b89eff]">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>Text-based PDFs supported up to 30 pages</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#b89eff]/20 text-[#b89eff]">
                  <Check size={11} strokeWidth={3} />
                </span>
                <span>100% private in-memory preview before saving</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-[#081326]/40">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenModal("upload");
              }}
              className="jr-btn-secondary w-full py-3 text-sm border-2 border-[#081326] cursor-pointer"
            >
              <Upload size={16} strokeWidth={2.6} />
              <span>Choose Document to Import</span>
            </button>
          </div>
        </div>
      </section>

      {/* Subtle privacy & autosave note */}
      <p className="flex shrink-0 items-center justify-center gap-2 py-2 pb-1 text-center text-[11px] font-bold text-[#7ea4d4]">
        <CartoonSparkle size={11} color="#ffe082" />
        Entries stay private to your account • Drafts auto-save continuously
        <CartoonSparkle size={11} color="#64dfd0" />
      </p>

      {/* Voice / Write Dream Modal */}
      {openModal === "form" && (
        <DreamForm
          mode="new"
          isModal={true}
          onClose={() => setOpenModal("none")}
          initialData={importedData || undefined}
          importedSummary={importedSummary}
          onClearImportedSummary={() => setImportedSummary(null)}
        />
      )}

      {/* Upload from File Modal */}
      {openModal === "upload" && (
        <UploadModal
          isOpen={true}
          onClose={() => setOpenModal("none")}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

