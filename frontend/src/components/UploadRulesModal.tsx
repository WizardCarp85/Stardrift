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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040814]/80 p-4 backdrop-blur-md animate-pop-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-rules-title"
        className="cartoon-form-card relative w-full max-w-lg rounded-[26px] bg-[#172d54] p-5 sm:p-6 text-[#eef6ff] shadow-[0_12px_36px_rgba(0,0,0,0.6),0_6px_0_0_#081326] max-h-[85vh] overflow-y-auto"
        style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#b89eff] text-[#081326] shadow-[0_3px_0_0_#081326]">
              <FileText size={22} strokeWidth={2.6} />
            </span>
            <div>
              <h2 id="upload-rules-title" className="text-xl font-extrabold text-white">
                File Import Guide
              </h2>
              <p className="text-xs font-semibold text-[#a5c6f3]">
                Guidelines for uploading dream documents
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#0c1a36] text-[#cfe3fc] transition-all duration-200 hover:bg-[#183466] hover:rotate-90 hover:scale-105 active:scale-95"
            aria-label="Close import rules dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Rules List */}
        <div className="space-y-3 text-xs font-semibold">
          {/* Formats & Size */}
          <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3.5 shadow-[0_2px_0_0_#081326]">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#64dfd0]" />
            <div>
              <p className="font-extrabold text-white">Supported Formats & Size Limit</p>
              <p className="mt-0.5 text-[#b8d5fa] leading-relaxed">
                Accepts <strong className="text-white">.txt</strong>,{" "}
                <strong className="text-white">.docx</strong> (Word), and{" "}
                <strong className="text-white">.pdf</strong> documents up to <strong className="text-white">5 MB</strong>.
              </p>
            </div>
          </div>

          {/* Title & Date Detection */}
          <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3.5 shadow-[0_2px_0_0_#081326]">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-[#ffe082]" />
            <div>
              <p className="font-extrabold text-white">Automatic Title & Date Detection</p>
              <p className="mt-0.5 text-[#b8d5fa] leading-relaxed">
                The first line (under 80 chars, without an ending period) is used as your title. Dates in the first 3 lines are auto-detected.
              </p>
            </div>
          </div>

          {/* PDF Page Cap */}
          <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3.5 shadow-[0_2px_0_0_#081326]">
            <BookOpen size={18} className="mt-0.5 shrink-0 text-[#5bb8ff]" />
            <div>
              <p className="font-extrabold text-white">30-Page PDF Limit</p>
              <p className="mt-0.5 text-[#b8d5fa] leading-relaxed">
                To keep reading fast and responsive, PDFs are read up to the first 30 pages. Extra pages are skipped with a notice.
              </p>
            </div>
          </div>

          {/* Scanned & Password Protected PDFs */}
          <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3.5 shadow-[0_2px_0_0_#081326]">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#ffb3c6]" />
            <div>
              <p className="font-extrabold text-white">Digital Text Only (No Scans or Passwords)</p>
              <p className="mt-0.5 text-[#b8d5fa] leading-relaxed">
                Documents must contain selectable digital text. Image-based scanned PDFs (OCR) and password-locked files are not supported.
              </p>
            </div>
          </div>

          {/* Privacy & Zero-DB guarantee */}
          <div className="flex items-start gap-3 rounded-2xl border-2 border-[#081326] bg-[#0f2040] p-3.5 shadow-[0_2px_0_0_#081326]">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#64dfd0]" />
            <div>
              <p className="font-extrabold text-white">Preview Only &amp; 100% Private</p>
              <p className="mt-0.5 text-[#b8d5fa] leading-relaxed">
                Processed strictly in-memory and deleted immediately. Nothing is saved to your account until you review and click <strong>Save Dream</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer with Checkbox & Actions */}
        <div className="mt-5 flex flex-col gap-3 pt-4 border-t-2 border-[#081326]/50 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[#b8d5fa] hover:text-white">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-2 border-[#081326] bg-[#0c1a36] text-[#5bb8ff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Don&apos;t show this guide again</span>
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cartoon-form-btn-secondary px-3.5 py-2 text-xs font-extrabold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSelectFile}
              className="cartoon-form-btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl"
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
