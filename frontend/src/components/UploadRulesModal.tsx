"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  BookOpen,
  Upload,
} from "lucide-react";

interface UploadRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToUpload?: () => void;
}

export function UploadRulesModal({
  isOpen,
  onClose,
  onProceedToUpload,
}: UploadRulesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  function handleSelectFile() {
    if (dontShowAgain) {
      try {
        localStorage.setItem("stardrift_skip_upload_rules", "true");
      } catch {
        // ignore
      }
    }
    onClose();
    if (onProceedToUpload) {
      onProceedToUpload();
    }
  }

  const modalContent = (
    <div
      role="presentation"
      className="fixed inset-y-0 right-0 left-0 md:left-[var(--app-sidebar-width,256px)] z-40 flex items-center justify-center p-3 sm:p-5 bg-[#040814]/75 backdrop-blur-md animate-pop-in transition-[left] duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-rules-title"
        className="cartoon-form-card relative w-full max-w-2xl rounded-[26px] bg-[#162d58] p-5 sm:p-6 text-[#eef6ff] shadow-[0_16px_48px_rgba(0,0,0,0.7),0_6px_0_0_#081326]"
        style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#b89eff] text-[#081326] shadow-[0_3px_0_0_#081326]">
              <FileText size={20} strokeWidth={2.6} />
            </span>
            <div>
              <h2 id="upload-rules-title" className="text-lg font-extrabold text-white sm:text-xl">
                File Import Guide
              </h2>
              <p className="text-xs font-semibold text-[#a5c6f3]">
                Guidelines for uploading dream documents into Stardrift
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#0c1a36] text-[#cfe3fc] transition-all duration-200 hover:bg-[#183466] hover:rotate-90 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Close import rules dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Rules Grid (2-Column Layout on sm+ for a single-page view with no scrollbars) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-semibold">
          {/* Formats & Size */}
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3 shadow-[0_2px_0_0_#081326]">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#64dfd0]" />
            <div>
              <p className="text-xs font-extrabold text-white">Supported Formats & Size</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#b8d5fa] leading-relaxed">
                Accepts <strong className="text-white">.txt</strong>,{" "}
                <strong className="text-white">.docx</strong>, and{" "}
                <strong className="text-white">.pdf</strong> documents up to <strong className="text-white">5 MB</strong>.
              </p>
            </div>
          </div>

          {/* One Dream Per File */}
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3 shadow-[0_2px_0_0_#081326]">
            <FileText size={16} className="mt-0.5 shrink-0 text-[#b89eff]" />
            <div>
              <p className="text-xs font-extrabold text-white">One Dream per Document</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#b8d5fa] leading-relaxed">
                Each file is imported as a single dream entry. Multi-dream splitting is not supported yet.
              </p>
            </div>
          </div>

          {/* Title & Date Detection */}
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3 shadow-[0_2px_0_0_#081326]">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-[#ffe082]" />
            <div>
              <p className="text-xs font-extrabold text-white">Smart Title & Date Detection</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#b8d5fa] leading-relaxed">
                First line under 80 chars becomes the title; dates in the first 3 lines are auto-detected.
              </p>
            </div>
          </div>

          {/* PDF Page Cap */}
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3 shadow-[0_2px_0_0_#081326]">
            <BookOpen size={16} className="mt-0.5 shrink-0 text-[#5bb8ff]" />
            <div>
              <p className="text-xs font-extrabold text-white">30-Page PDF Cap</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#b8d5fa] leading-relaxed">
                PDFs are read up to the first 30 pages to keep processing snappy and prevent lag.
              </p>
            </div>
          </div>

          {/* Scanned & Password Protected PDFs */}
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3 shadow-[0_2px_0_0_#081326]">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ffb3c6]" />
            <div>
              <p className="text-xs font-extrabold text-white">Digital Text Only</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#b8d5fa] leading-relaxed">
                Must contain selectable text. Image scans (OCR) and password locks are not supported.
              </p>
            </div>
          </div>

          {/* Privacy & Zero-DB guarantee */}
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3 shadow-[0_2px_0_0_#081326]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#64dfd0]" />
            <div>
              <p className="text-xs font-extrabold text-white">Preview Only &amp; 100% Private</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#b8d5fa] leading-relaxed">
                Processed in-memory. Nothing is saved to your account until you click <strong>Save Dream</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Checkbox & Actions */}
        <div className="mt-4 flex flex-col gap-3 pt-3.5 border-t-2 border-[#081326]/50 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#b8d5fa] hover:text-white">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#081326] bg-[#0c1a36] text-[#5bb8ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Don&apos;t show this guide again</span>
          </label>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="cartoon-form-btn-secondary px-4 py-2 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#162f5c] text-white shadow-[0_3px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.14)] hover:bg-[#1f417d] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelectFile}
              className="cartoon-form-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_3px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.45)] hover:bg-[#77c6ff] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] transition-all cursor-pointer"
            >
              <Upload size={14} strokeWidth={2.4} />
              <span>Select File</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(modalContent, document.body);
}
