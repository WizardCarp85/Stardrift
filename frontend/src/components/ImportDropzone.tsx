"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileCode,
  Sparkles,
  ArrowRight,
  Replace,
  CopyPlus,
  HelpCircle,
} from "lucide-react";
import { importApi } from "@/lib/api";
import { UploadRulesModal } from "@/components/UploadRulesModal";
import type { ImportPreviewResponse } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = [".txt", ".docx", ".pdf"];

interface ImportDropzoneProps {
  currentBody: string;
  onApplyImport: (data: {
    title: string;
    body: string;
    date: string | null;
    action: "replace" | "append";
    filename: string;
    warnings: string[];
  }) => void;
  disabled?: boolean;
}

export function ImportDropzone({
  currentBody,
  onApplyImport,
  disabled = false,
}: ImportDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingPreview, setPendingPreview] = useState<ImportPreviewResponse | null>(null);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    filename: string;
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleUploadClick() {
    if (disabled || isUploading) return;
    try {
      const skipRules = localStorage.getItem("stardrift_skip_upload_rules") === "true";
      if (skipRules) {
        fileInputRef.current?.click();
        return;
      }
    } catch {
      // ignore
    }
    setShowRulesModal(true);
  }

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
    if (disabled || isUploading) return;
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
        // No existing text; apply directly
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
    onApplyImport({
      title: preview.title,
      body: preview.body,
      date: preview.date,
      action,
      filename: preview.filename,
      warnings: preview.warnings || [],
    });

    setImportSummary({
      filename: preview.filename,
      warnings: preview.warnings || [],
    });
    setPendingPreview(null);
    setShowConflictModal(false);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      void handleFile(file);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      void handleFile(file);
    }
  }

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onInputChange}
        className="hidden"
        aria-label="Upload dream document (.txt, .docx, or .pdf)"
        disabled={disabled || isUploading}
      />

      {/* Persistent Success / Info Banner after successful import */}
      {importSummary && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border-2 border-[#081326] bg-gradient-to-r from-[#173a6a] to-[#122a52] p-4 text-[#eef6ff] shadow-[0_3px_0_0_#081326] animate-pop-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]">
                <CheckCircle2 size={16} strokeWidth={2.8} />
              </span>
              <div>
                <p className="text-sm font-extrabold text-white">
                  Imported from <span className="text-[#64dfd0]">{importSummary.filename}</span>
                </p>
                <p className="text-xs font-semibold text-[#b8d5fa]">
                  Check it and edit freely before saving.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setImportSummary(null)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#0c1a36] text-[#8bb4e8] transition-all duration-200 hover:bg-[#19325e] hover:text-white"
              aria-label="Dismiss import message"
            >
              <X size={14} />
            </button>
          </div>

          {/* Warnings (if truncated or page cap reached) */}
          {importSummary.warnings.length > 0 && (
            <div className="mt-1 flex flex-col gap-1 border-t border-[#081326]/40 pt-2">
              {importSummary.warnings.map((warn, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#ffe082]/15 px-2.5 py-1 text-xs font-bold text-[#ffe082]"
                >
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border-2 border-[#081326] bg-[#ff859d]/15 p-3.5 text-[#ff859d] shadow-[0_3px_0_0_#081326] animate-pop-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#ff859d]" />
            <div>
              <p className="text-xs font-extrabold text-white">Import issue</p>
              <p className="text-xs font-semibold text-[#ffd1dc]">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#ff859d]/40 text-[#ff859d] hover:bg-[#ff859d]/20"
            aria-label="Dismiss error"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Dropzone Container */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          handleUploadClick();
        }}
        role="region"
        aria-label="File import area"
        className={`relative overflow-hidden rounded-[22px] border-2 border-dashed transition-all duration-200 select-none cursor-pointer ${
          isDragging
            ? "border-[#5bb8ff] bg-[#1a3b73] shadow-[0_0_24px_rgba(91,184,255,0.4),inset_0_2px_0_0_rgba(255,255,255,0.2)] scale-[1.01]"
            : "border-[#21437c] bg-[#0d1d3a]/80 hover:border-[#3a69b5] hover:bg-[#112447]"
        } p-4 sm:p-5`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-left">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] transition-transform duration-200 ${
                isDragging
                  ? "bg-[#5bb8ff] text-[#081326] scale-110 shadow-[0_3px_0_0_#081326]"
                  : "bg-[#163261] text-[#7ac8ff] shadow-[0_3px_0_0_#081326]"
              }`}
            >
              {isUploading ? (
                <Loader2 size={22} className="animate-spin text-[#ffe082]" />
              ) : isDragging ? (
                <Sparkles size={22} className="animate-bounce" />
              ) : (
                <Upload size={20} strokeWidth={2.4} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-white">
                  {isUploading
                    ? "Reading document…"
                    : isDragging
                    ? "Drop your file here!"
                    : "Import dream from file"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowRulesModal(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-[#081326] bg-[#122850] px-2.5 py-0.5 text-[10px] font-extrabold text-[#7ac8ff] hover:bg-[#1a386e] hover:text-white transition-colors cursor-pointer"
                  title="View supported formats and file rules"
                  aria-label="View supported formats and file rules"
                >
                  <span>TXT • DOCX • PDF</span>
                  <HelpCircle size={11} className="text-[#ffe082]" />
                </button>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-[#8eb0dc]">
                {isUploading
                  ? "Extracting text, date, and title without saving…"
                  : "Drag and drop or browse to pre-fill a dream entry (1 dream per file, up to 5 MB)"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadClick}
            disabled={disabled || isUploading}
            aria-label="Choose file to import"
            className="cartoon-form-btn-secondary shrink-0 px-4 py-2 text-xs font-extrabold rounded-xl"
          >
            {isUploading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <FileText size={14} />
                <span>Choose file</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Conflict Resolution Modal (Replace or Append) */}
      {showConflictModal && pendingPreview && mounted && createPortal(
        <div
          role="presentation"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#040814]/80 p-4 backdrop-blur-md animate-pop-in"
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
            aria-labelledby="import-conflict-title"
            className="cartoon-form-card relative w-full max-w-md rounded-[26px] bg-[#172d54] p-6 text-[#eef6ff] shadow-[0_12px_36px_rgba(0,0,0,0.6),0_6px_0_0_#081326]"
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
                aria-label="Cancel import"
              >
                <X size={16} />
              </button>
            </div>

            <h3 id="import-conflict-title" className="text-xl font-extrabold text-white">
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
                className="cartoon-form-btn-secondary justify-start px-4 py-3 text-xs font-extrabold rounded-xl border-2 border-[#081326] hover:bg-[#20427c]"
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
                className="cartoon-form-btn-primary justify-start px-4 py-3 text-xs font-extrabold rounded-xl border-2 border-[#081326]"
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
        </div>,
        document.body
      )}

      {/* Rules and Formats Guide Modal */}
      <UploadRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        onProceedToUpload={() => fileInputRef.current?.click()}
      />
    </div>
  );
}

