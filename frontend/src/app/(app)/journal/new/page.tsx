import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Mic, Sparkles } from "lucide-react";
import { DreamForm } from "@/components/DreamForm";
import { NewDreamTips } from "@/components/NewDreamTips";
import {
  CartoonCloud,
  CartoonSparkle,
  JournalStyles,
  JOURNAL_FONT,
} from "@/components/JournalTheme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Record Dream — Stardrift",
  description: "Record a new dream entry via voice, text, or file import in your private dream journal",
};

export default function NewDreamPage() {
  return (
    <div
      className="fade-in-scale flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-4 text-[#eef6ff]"
      style={{ fontFamily: JOURNAL_FONT }}
    >
      <JournalStyles />

      {/* Illustrated banner - w-full */}
      <section className="jr-card relative flex w-full shrink-0 flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1b3a70] via-[#152d59] to-[#0f2245] p-6 sm:p-8 animate-pop-in">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(91,184,255,0.28) 0%, transparent 70%)" }}
          aria-hidden="true"
        />
        <CartoonCloud fill="#214685" className="pointer-events-none absolute -bottom-7 -right-8 hidden w-52 opacity-80 sm:block" />
        <CartoonSparkle size={15} color="#ffe082" className="pointer-events-none absolute right-10 top-7 opacity-90" />
        <CartoonSparkle size={11} color="#64dfd0" className="pointer-events-none absolute right-28 top-16 hidden opacity-75 sm:block" />

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
              Speak, type, or import an existing document while it&apos;s still fresh — details fade within minutes of waking. Tap the mic, switch to typing, or drop a file anytime.
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

      {/* Recall & capture tips - w-full */}
      <NewDreamTips />

      {/* The form - fills remaining height/width */}
      <div className="fade-in-scale stagger-3 flex w-full flex-1 flex-col">
        <DreamForm mode="new" />
      </div>

      <p className="flex shrink-0 items-center justify-center gap-2 py-2 text-center text-[11px] font-bold text-[#7ea4d4]">
        <CartoonSparkle size={11} color="#ffe082" />
        Entries stay private to your account
        <CartoonSparkle size={11} color="#64dfd0" />
      </p>
    </div>
  );
}