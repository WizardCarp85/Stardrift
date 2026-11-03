"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  FileText,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Replace,
  CopyPlus,
} from "lucide-react";
import { importApi } from "@/lib/api";
import type { ImportPreviewResponse } from "@/types";
import { emitCaptureState } from "@/lib/captureState";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".txt", ".docx", ".pdf"];

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBody?: string;
  onSuccess: (data: {
    title: string;
    body: string;
    date: string | null;
    filename: string;
    warnings: string[];
    action: "replace" | "append";
  }) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  currentBody = "",
  onSuccess,
}: UploadModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<ImportPreviewResponse | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    emitCaptureState({ mode: "upload", isListening: false });
    return () => {
      emitCaptureState({ mode: "idle", isListening: false });
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isUploading, onClose]);

  if (!isOpen || !mounted) return null;

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
    if (!hasValidExt) {
      return "Unsupported file type. Please upload a .txt, .docx, or .pdf document.";
    }
    if (file.size === 0) {
      return "The selected file is empty.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds the 5 MB limit. Please select a smaller document.";
    }
    return null;
  }

  async function handleFile(file: File) {
    if (isUploading) return;
    setErrorMessage(null);

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsUploading(true);
    try {
      const preview = await importApi.upload(file);

      // Check if user already typed something in the body
      if (currentBody && currentBody.trim().length > 0) {
        setPendingPreview(preview);
        setShowConflictModal(true);
      } else {
        applyImportData(preview, "replace");
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Could not import file. Please check that it is not corrupted and try again.";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function applyImportData(
    preview: ImportPreviewResponse,
    action: "replace" | "append"
  ) {
    onSuccess({
      title: preview.title,
      body: preview.body,
      date: preview.date,
      filename: preview.filename,
      warnings: preview.warnings || [],
      action,
    });
    setPendingPreview(null);
    setShowConflictModal(false);
    onClose();
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (isUploading) return;
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFile(e.dataTransfer.files[0]);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      void handleFile(e.target.files[0]);
    }
  }

  const modalContent = (
    <div
      role="presentation"
      className="fixed inset-y-0 right-0 left-0 md:left-[var(--app-sidebar-width,256px)] z-40 flex items-center justify-center p-3 sm:p-5 bg-[#040814]/75 backdrop-blur-md animate-pop-in transition-[left] duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="cartoon-form-card relative w-full max-w-xl rounded-[28px] bg-gradient-to-b from-[#183668] to-[#12254c] p-5 sm:p-6 text-[#eef6ff] shadow-[0_16px_48px_rgba(0,0,0,0.7),0_6px_0_0_#081326]"
        style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
      >
        <style>{`
          .cartoon-form-card {
            border: 2.5px solid #081326;
            box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.12);
          }
          .cartoon-form-btn-primary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            background-color: #5bb8ff;
            color: #081326;
            border: 2.5px solid #081326;
            border-radius: 0.85rem;
            box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
            font-weight: 800;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, background-color 0.18s ease;
          }
          .cartoon-form-btn-primary:hover:not(:disabled) {
            background-color: #77c6ff;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 0 0 #081326, 0 0 16px rgba(91, 184, 255, 0.35), inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
          }
          .cartoon-form-btn-primary:active:not(:disabled) {
            transform: translateY(2px) scale(0.98);
            box-shadow: 0 1px 0 0 #081326;
          }
          .cartoon-form-btn-secondary {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            white-space: nowrap;
            background-color: #162f5c;
            color: #eef6ff;
            border: 2.5px solid #081326;
            border-radius: 0.85rem;
            box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.14);
            font-weight: 800;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease, background-color 0.18s ease;
          }
          .cartoon-form-btn-secondary:hover:not(:disabled) {
            background-color: #1f417d;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.22);
          }
          .cartoon-form-btn-secondary:active:not(:disabled) {
            transform: translateY(2px) scale(0.98);
            box-shadow: 0 1px 0 0 #081326;
          }
        `}</style>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onInputChange}
          className="hidden"
          aria-label="Upload dream document (.txt, .docx, or .pdf)"
          disabled={isUploading}
        />

        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#b89eff] text-[#081326] shadow-[0_3px_0_0_#081326]">
              <Upload size={20} strokeWidth={2.6} />
            </span>
            <div>
              <h2 id="upload-modal-title" className="text-lg font-extrabold text-white sm:text-xl [text-shadow:0_2px_0_#081326]">
                Upload Dream Document
              </h2>
              <p className="text-xs font-semibold text-[#a5c6f3]">
                Import a pre-written dream into your journal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#0c1a36] text-[#cfe3fc] transition-all duration-200 hover:bg-[#183466] hover:rotate-90 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Close upload dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-3.5 flex items-start justify-between gap-3 rounded-2xl border-2 border-[#081326] bg-[#ff859d]/15 p-3 text-[#ff859d] shadow-[0_2px_0_0_#081326] animate-pop-in">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#ff859d]" />
              <p className="text-xs font-semibold text-[#ffd1dc]">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[#ff859d]/40 text-[#ff859d] hover:bg-[#ff859d]/20"
              aria-label="Dismiss error"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Dropzone Area */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => {
            if (!isUploading) fileInputRef.current?.click();
          }}
          role="region"
          aria-label="File import dropzone"
          className={`relative overflow-hidden rounded-[22px] border-[2.5px] border-dashed p-6 text-center transition-all duration-200 cursor-pointer select-none ${
            isDragging
              ? "border-[#5bb8ff] bg-[#1a3b73] shadow-[0_0_24px_rgba(91,184,255,0.4),inset_0_2px_0_0_rgba(255,255,255,0.2)] scale-[1.01]"
              : "border-[#2d5494] bg-[#0c1a36] hover:border-[#5bb8ff] hover:bg-[#11244d]"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-3">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#081326] transition-transform duration-200 ${
                isDragging
                  ? "bg-[#5bb8ff] text-[#081326] scale-110 shadow-[0_3px_0_0_#081326]"
                  : "bg-[#183669] text-[#7ac8ff] shadow-[0_3px_0_0_#081326]"
              }`}
            >
              {isUploading ? (
                <Loader2 size={24} className="animate-spin text-[#ffe082]" />
              ) : isDragging ? (
                <Sparkles size={24} className="animate-bounce" />
              ) : (
                <Upload size={22} strokeWidth={2.4} />
              )}
            </span>

            <div>
              <p className="text-sm font-extrabold text-white sm:text-base">
                {isUploading
                  ? "Reading document…"
                  : isDragging
                  ? "Drop your file right here!"
                  : "Drag & drop your document here"}
              </p>
              <p className="mt-1 text-xs font-semibold text-[#8eb0dc]">
                {isUploading
                  ? "Extracting title, date, and dream notes without saving…"
                  : "or click anywhere to browse from your device"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#081326] bg-[#122850] px-2.5 py-0.5 text-[10px] font-extrabold text-[#7ac8ff] shadow-[0_1.5px_0_0_#081326]">
                TXT • DOCX • PDF
              </span>
              <span className="rounded-full border border-[#081326] bg-[#122850] px-2.5 py-0.5 text-[10px] font-extrabold text-[#ffe082] shadow-[0_1.5px_0_0_#081326]">
                Up to 5 MB
              </span>
            </div>
          </div>
        </div>

        {/* Quick Rules Bento (2x2 Compact Grid) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] font-semibold text-[#b8d5fa]">
          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#112347] p-3 shadow-[0_2.5px_0_0_#081326]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#b89eff] text-[#081326] shadow-[0_1.5px_0_0_#081326]">
              <FileText size={14} strokeWidth={2.6} />
            </span>
            <div>
              <strong className="block text-white text-xs">1 Dream per File</strong>
              <span className="text-[#9cbfe8]">Imports as a single dream entry into your journal.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#112347] p-3 shadow-[0_2.5px_0_0_#081326]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_1.5px_0_0_#081326]">
              <Sparkles size={14} strokeWidth={2.6} />
            </span>
            <div>
              <strong className="block text-white text-xs">Auto Title &amp; Date</strong>
              <span className="text-[#9cbfe8]">Line 1 becomes title; dates in first 3 lines auto-filled.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#112347] p-3 shadow-[0_2.5px_0_0_#081326]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_1.5px_0_0_#081326]">
              <BookOpen size={14} strokeWidth={2.6} />
            </span>
            <div>
              <strong className="block text-white text-xs">Digital Text Only</strong>
              <span className="text-[#9cbfe8]">PDFs up to 30 pages. Scanned/OCR files not supported.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#112347] p-3 shadow-[0_2.5px_0_0_#081326]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_1.5px_0_0_#081326]">
              <ShieldCheck size={14} strokeWidth={2.6} />
            </span>
            <div>
              <strong className="block text-white text-xs">100% In-Memory</strong>
              <span className="text-[#9cbfe8]">Processed strictly in memory. Never saved until you confirm.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3.5 border-t-2 border-[#081326]/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="cartoon-form-btn-secondary px-5 py-2.5 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#162f5c] text-white shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.14)] hover:bg-[#1f417d] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="cartoon-form-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.45)] hover:bg-[#77c6ff] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <FileText size={14} strokeWidth={2.4} />
                <span>Choose file</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Conflict Resolution Modal (Replace or Append) */}
      {showConflictModal && pendingPreview && (
        <div
          role="presentation"
          className="fixed inset-y-0 right-0 left-0 md:left-[var(--app-sidebar-width,256px)] z-[50] flex items-center justify-center p-3 sm:p-5 bg-[#040814]/80 backdrop-blur-md animate-pop-in transition-[left] duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConflictModal(false);
              setPendingPreview(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-conflict-title"
            className="cartoon-form-card relative w-full max-w-md rounded-[26px] bg-[#172d54] p-6 text-[#eef6ff] shadow-[0_16px_48px_rgba(0,0,0,0.7),0_6px_0_0_#081326]"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#ffe082] text-[#081326] shadow-[0_3px_0_0_#081326]">
                <FileText size={22} strokeWidth={2.6} />
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingPreview(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#0c1a36] text-[#cfe3fc] hover:bg-[#183466]"
                aria-label="Cancel conflict dialog"
              >
                <X size={16} />
              </button>
            </div>

            <h3 id="upload-conflict-title" className="text-xl font-extrabold text-white">
              Existing text detected
            </h3>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-[#b8d5fa]">
              You already have written notes in your dream entry. How would you like to handle the content imported from{" "}
              <strong className="text-white">{pendingPreview.filename}</strong>?
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => applyImportData(pendingPreview, "replace")}
                className="cartoon-form-btn-secondary justify-start px-4 py-3 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#162f5c] text-white shadow-[0_3px_0_0_#081326] hover:bg-[#20427c] cursor-pointer"
              >
                <Replace size={15} className="text-[#ffe082]" />
                <span className="flex-1 text-left">
                  <strong className="block text-white">Replace existing text</strong>
                  <span className="text-[11px] font-semibold text-[#8cb2e0]">
                    Overwrite dream notes with the imported content
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => applyImportData(pendingPreview, "append")}
                className="cartoon-form-btn-primary justify-start px-4 py-3 text-xs font-extrabold rounded-xl border-[2.5px] border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_3px_0_0_#081326] hover:bg-[#77c6ff] cursor-pointer"
              >
                <CopyPlus size={15} />
                <span className="flex-1 text-left">
                  <strong className="block text-[#081326]">Append to bottom</strong>
                  <span className="text-[11px] font-semibold text-[#183664]">
                    Add imported content below your current notes
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingPreview(null);
                }}
                className="mt-1 text-center text-xs font-bold text-[#8bb4e8] hover:text-white"
              >
                Cancel import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}

