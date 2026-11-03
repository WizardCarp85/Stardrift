"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save,
  Mic,
  Type,
  Star,
  X,
  Plus,
  Sparkles,
  Repeat,
  Calendar,
  Hash,
  AlertTriangle,
  Loader2,
  Feather,
  Smile,
  CloudRain,
  Zap,
  Heart,
  Check,
  type LucideIcon,
} from "lucide-react";
import { dreamsApi, profileApi } from "@/lib/api";
import type { DreamType, Mood, DreamFormData } from "@/types";
import {
  DREAM_TYPE_LABELS,
  MOOD_LABELS,
  getYesterdayDateString,
} from "@/lib/utils";
import { VoiceRecorderButton } from "@/components/VoiceRecorder";
import { CartoonDatePicker } from "@/components/CartoonDatePicker";
import { CartoonDreamTypeSelect } from "@/components/CartoonDreamTypeSelect";
import { emitCaptureState } from "@/lib/captureState";

const MOOD_OPTIONS: Mood[] = [
  "peaceful",
  "joyful",
  "neutral",
  "confusing",
  "anxious",
  "scary",
];

const MOOD_CONFIG: Record<Mood, { icon: LucideIcon; bg: string }> = {
  peaceful: { icon: Feather, bg: "#64dfd0" },
  joyful: { icon: Smile, bg: "#ffe082" },
  neutral: { icon: Sparkles, bg: "#94adff" },
  confusing: { icon: CloudRain, bg: "#8ec5ff" },
  anxious: { icon: Zap, bg: "#ffb3c6" },
  scary: { icon: Zap, bg: "#ff859d" },
};

const KEYWORD_TAG_MAP: Record<string, string[]> = {
  flying: ["flying", "freedom"],
  falling: ["falling"],
  water: ["water", "ocean"],
  ocean: ["water", "ocean"],
  sea: ["water"],
  fire: ["fire"],
  chase: ["chase", "running"],
  running: ["chase", "running"],
  school: ["school", "exam"],
  teeth: ["teeth"],
  house: ["house"],
  family: ["family"],
  death: ["death", "loss"],
  dead: ["death"],
  monster: ["monster", "scary"],
};

function suggestTags(text: string): string[] {
  const lower = text.toLowerCase();
  const suggested = new Set<string>();
  for (const [kw, tags] of Object.entries(KEYWORD_TAG_MAP)) {
    if (lower.includes(kw)) tags.forEach((t) => suggested.add(t));
  }
  return Array.from(suggested);
}

interface DreamFormProps {
  initialData?: Partial<DreamFormData>;
  dreamId?: string;
  mode: "new" | "edit";
  isModal?: boolean;
  onClose?: () => void;
  importedSummary?: {
    filename: string;
    warnings: string[];
  } | null;
  onClearImportedSummary?: () => void;
}

export function DreamForm({
  initialData,
  dreamId,
  mode,
  isModal = false,
  onClose,
  importedSummary,
  onClearImportedSummary,
}: DreamFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [inputMode, setInputMode] = useState<"type" | "speak">(
    initialData?.input_method === "text" ? "type" : "speak"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [draftRestored, setDraftRestored] = useState(false);
  const initializedFromSettingsRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState<DreamFormData>(() => ({
    title: "",
    body: "",
    dream_date: getYesterdayDateString(),
    dream_type: "normal",
    mood: "neutral",
    sleep_quality: null,
    is_lucid: false,
    is_recurring: false,
    input_method: initialData?.input_method || "voice",
    tags: [],
    ...initialData,
  }));

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({
        ...prev,
        ...initialData,
      }));
      if (initialData.input_method === "text") {
        setInputMode("type");
      }
      if (initialData.body) {
        handleBodyChange(initialData.body);
      }
    }
  }, [initialData]);

  function update<K extends keyof DreamFormData>(key: K, value: DreamFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  useEffect(() => {
    emitCaptureState({ mode: inputMode, isListening: false });
    return () => {
      emitCaptureState({ mode: "idle", isListening: false });
    };
  }, [inputMode]);

  useEffect(() => {
    if (!isModal || !onClose) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        onClose?.();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModal, onClose, saving]);

  useEffect(() => {
    if (mode !== "new" || initializedFromSettingsRef.current) return;
    initializedFromSettingsRef.current = true;

    async function applyUserSettings() {
      try {
        const profile = await profileApi.get();
        if (!profile) return;

        // Apply default log mode
        const defaultMode = profile.default_log_mode || profile.defaultLogMode;
        if (!initialData?.input_method) {
          const isText = defaultMode === "text";
          setInputMode(isText ? "type" : "speak");
          update("input_method", isText ? "text" : "voice");
        }

        // Apply default dream type
        const defaultType = profile.default_dream_type || profile.defaultDreamType;
        if (!initialData?.dream_type && defaultType) {
          update("dream_type", defaultType);
        }

        // Apply default sleep quality
        const defaultSleep = profile.default_sleep_quality ?? profile.defaultSleepQuality;
        if (initialData?.sleep_quality === undefined && typeof defaultSleep === "number" && defaultSleep > 0) {
          update("sleep_quality", defaultSleep);
        }

        if (profile.auto_suggest_tags !== undefined) setAutoSuggestEnabled(profile.auto_suggest_tags);
        if (profile.auto_save_drafts !== undefined) setAutoSaveEnabled(profile.auto_save_drafts);
        if (profile.voice_language) setVoiceLanguage(profile.voice_language);
      } catch {
        // Fallback to localStorage if offline
        const localLogMode = window.localStorage.getItem("stardrift_default_log_mode");
        if (!initialData?.input_method) {
          const isText = localLogMode === "text";
          setInputMode(isText ? "type" : "speak");
          update("input_method", isText ? "text" : "voice");
        }
      }
    }

    void applyUserSettings();

    // Check for autosaved draft
    try {
      const rawDraft = window.localStorage.getItem("stardrift_dream_draft");
      if (rawDraft && !initialData?.title && !initialData?.body) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && (parsed.title || parsed.body)) {
          setForm((f) => ({ ...f, ...parsed }));
          setDraftRestored(true);
        }
      }
    } catch {
      // Ignore draft read errors
    }
  }, [mode, initialData]);

  useEffect(() => {
    function onDraftCleared() {
      setDraftRestored(false);
      if (mode === "new" && !initialData?.title && !initialData?.body) {
        setForm({
          title: "",
          body: "",
          dream_date: getYesterdayDateString(),
          dream_type: "normal",
          mood: "neutral",
          sleep_quality: null,
          is_lucid: false,
          is_recurring: false,
          input_method: "voice",
          tags: [],
        });
      }
    }
    window.addEventListener("draft-cleared", onDraftCleared);
    return () => window.removeEventListener("draft-cleared", onDraftCleared);
  }, [mode, initialData]);

  // Autosave draft if enabled
  useEffect(() => {
    if (mode !== "new" || !autoSaveEnabled) return;
    const timer = setTimeout(() => {
      try {
        if (form.title.trim() || form.body.trim()) {
          window.localStorage.setItem("stardrift_dream_draft", JSON.stringify(form));
        }
      } catch {
        // ignore
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [form, mode, autoSaveEnabled]);

  function handleBodyChange(text: string) {
    update("body", text);
    if (autoSuggestEnabled) {
      const suggestions = suggestTags(text).filter((t) => !form.tags.includes(t));
      setSuggestedTags(suggestions);
    } else {
      setSuggestedTags([]);
    }
  }

  function addTag(name: string) {
    name = name.trim().toLowerCase();
    if (name && !form.tags.includes(name)) {
      update("tags", [...form.tags, name]);
    }
    setSuggestedTags((s) => s.filter((t) => t !== name));
  }

  function removeTag(name: string) {
    update("tags", form.tags.filter((t) => t !== name));
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput("");
    }
  }

  function handleVoiceTranscript(text: string) {
    update("body", text);
    update("input_method", "voice");
    handleBodyChange(text);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (mode === "edit" && dreamId) {
        await dreamsApi.update(dreamId, form);
      } else {
        await dreamsApi.create(form);
        try {
          window.localStorage.removeItem("stardrift_dream_draft");
        } catch {
          // ignore
        }
      }
      router.push("/journal");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save dream. Make sure the backend is running."
      );
    } finally {
      setSaving(false);
    }
  }

  const formContent = (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4 text-[#eef6ff]"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <style>{`
        .cartoon-form-card {
          border: 2.5px solid #081326;
          box-shadow: 0 5px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.12);
        }
        .cartoon-form-input {
          width: 100%;
          border: 2.5px solid #081326;
          border-radius: 0.9rem;
          background: #0f2040;
          color: #eef6ff;
          font-weight: 600;
          padding: 0.65rem 0.9rem;
          outline: none;
          transition: border-color 0.18s ease, box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease;
        }
        .cartoon-form-input:focus {
          border-color: #5bb8ff;
          background: #102347;
          box-shadow: 0 0 0 3px rgba(91, 184, 255, 0.24), 0 0 16px rgba(91, 184, 255, 0.12);
        }
        .cartoon-form-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          background-color: #5bb8ff;
          color: #081326;
          border: 2.5px solid #081326;
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
        .cartoon-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(91, 184, 255, 0.4) transparent;
        }
        .cartoon-modal-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .cartoon-modal-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .cartoon-modal-scroll::-webkit-scrollbar-thumb {
          background: rgba(91, 184, 255, 0.35);
          border-radius: 999px;
        }
        .cartoon-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(91, 184, 255, 0.65);
        }
      `}</style>

      {/* Main Storybook Form Card */}
      <div className="cartoon-form-card rounded-[26px] bg-[#162e59] p-5 sm:p-6">
        {/* Modal Header (when rendered inside a popup) */}
        {isModal && (
          <div className="mb-4 flex items-center justify-between pb-3.5 border-b-2 border-[#081326]/50">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_2px_0_0_#081326]">
                <Mic size={18} strokeWidth={2.6} />
              </span>
              <div>
                <h2 id="dream-modal-title" className="text-lg font-extrabold text-white sm:text-xl">
                  {mode === "edit" ? "Edit Dream Entry" : "Record Tonight's Dream"}
                </h2>
                <p className="text-xs font-semibold text-[#8eb0dc]">
                  Voice dictation or manual typing
                </p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#0c1a36] text-[#cfe3fc] transition-all duration-200 hover:bg-[#183466] hover:rotate-90 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Imported file banner if pre-filled via file import */}
        {importedSummary && (
          <div className="mb-4 flex flex-col gap-2 rounded-2xl border-2 border-[#081326] bg-gradient-to-r from-[#173a6a] to-[#122a52] p-4 text-[#eef6ff] shadow-[0_3px_0_0_#081326] animate-pop-in">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]">
                  <Check size={16} strokeWidth={2.8} />
                </span>
                <div>
                  <p className="text-sm font-extrabold text-white">
                    Imported from <span className="text-[#64dfd0]">{importedSummary.filename}</span>
                  </p>
                  <p className="text-xs font-semibold text-[#b8d5fa]">
                    Check it and edit freely before saving.
                  </p>
                </div>
              </div>
              {onClearImportedSummary && (
                <button
                  type="button"
                  onClick={onClearImportedSummary}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#0c1a36] text-[#8bb4e8] transition-all duration-200 hover:bg-[#19325e] hover:text-white cursor-pointer"
                  aria-label="Dismiss import message"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {importedSummary.warnings && importedSummary.warnings.length > 0 && (
              <div className="mt-1 flex flex-col gap-1 border-t border-[#081326]/40 pt-2">
                {importedSummary.warnings.map((warn, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#ffe082]/15 px-2.5 py-1 text-xs font-bold text-[#ffe082]"
                  >
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input Mode Selector */}
        <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b-2 border-[#081326]/50">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#7ea4d4]">
              Recording Style
            </span>
            <span className="text-sm font-bold text-white">How do you want to record?</span>
          </div>

          <div
            role="tablist"
            aria-label="Recording mode"
            className="relative inline-flex items-center rounded-2xl border-[2.5px] border-[#081326] bg-[#0c1a36] p-1 shadow-[0_2px_0_0_#081326] select-none"
          >
            {/* Sliding Pill Indicator */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.45)]"
              style={{
                left: 4,
                transform: inputMode === "speak" ? "translateX(0%)" : "translateX(100%)",
                transition: "transform 0.24s cubic-bezier(0.34, 1.4, 0.64, 1)",
              }}
            />

            {(["speak", "type"] as const).map((m) => {
              const active = inputMode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setInputMode(m);
                    update("input_method", m === "speak" ? "voice" : "text");
                  }}
                  className="relative z-10 flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-colors duration-200 cursor-pointer"
                  style={{
                    color: active ? "#081326" : "#8cb2e0",
                  }}
                >
                  {m === "speak" ? (
                    <Mic
                      size={14}
                      strokeWidth={2.8}
                      className={`transition-transform duration-200 ${
                        active ? "scale-110 -rotate-3 text-[#081326]" : "text-[#6bc2ff]"
                      }`}
                    />
                  ) : (
                    <Type
                      size={14}
                      strokeWidth={2.8}
                      className={`transition-transform duration-200 ${
                        active ? "scale-110 text-[#081326]" : "text-[#6bc2ff]"
                      }`}
                    />
                  )}
                  <span>{m === "speak" ? "Record with Voice" : "Type it out"}</span>
                </button>
              );
            })}
          </div>
        </div>

        {draftRestored && (
          <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl border-2 border-[#081326] bg-[#64dfd0]/15 px-4 py-2.5 text-xs font-extrabold text-[#64dfd0] shadow-[0_2px_0_0_#081326]">
            <span className="flex items-center gap-2">
              <Sparkles size={15} /> Restored your unfinished dream draft
            </span>
            <button
              type="button"
              onClick={() => {
                setDraftRestored(false);
                try { window.localStorage.removeItem("stardrift_dream_draft"); } catch {}
                setForm((f) => ({ ...f, title: "", body: "", tags: [] }));
              }}
              className="rounded-lg border border-[#64dfd0]/40 px-2 py-1 text-[11px] font-bold text-[#eef6ff] hover:bg-[#64dfd0]/20"
            >
              Discard draft
            </button>
          </div>
        )}

        {/* Title Field */}
        <div className="mt-4">
          <label htmlFor="dream-title" className="block text-sm font-extrabold text-[#cfe3fc] mb-1.5">
            Dream Title <span className="text-[#ffe082]">*</span>
          </label>
          <input
            id="dream-title"
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="cartoon-form-input text-base"
            placeholder="Give this dream a memorable title…"
            required
          />
        </div>

        {/* Dream Body / Voice Panel */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor={inputMode === "speak" ? "dream-body-voice" : "dream-body"} className="block text-sm font-extrabold text-[#cfe3fc]">
              {inputMode === "speak" ? "Record your dream" : "What happened in the dream?"} <span className="text-[#ffe082]">*</span>
            </label>
            {inputMode === "speak" && (
              <span className="text-[11px] font-bold text-[#ffe082] flex items-center gap-1">
                <Sparkles size={12} /> Voice-First Mode
              </span>
            )}
          </div>

          <div key={inputMode} className="animate-fade-in-scale">
            {inputMode === "speak" ? (
              <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4 flex flex-col items-center gap-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                <VoiceRecorderButton onTranscript={handleVoiceTranscript} lang={voiceLanguage} />

                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7ea4d4]">
                      Live Transcript (Editable)
                    </span>
                    <span className="text-[10px] font-bold text-[#64dfd0]">
                      {form.body ? "Voice transcribed" : "Voice detected"}
                    </span>
                  </div>
                  <textarea
                    id="dream-body-voice"
                    value={form.body}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    className="cartoon-form-input text-sm leading-relaxed"
                    rows={5}
                    placeholder="Your words will transcribe here as you speak… or tap here to edit anytime."
                    style={{ resize: "vertical" }}
                    required
                  />
                </div>
              </div>
            ) : (
              <textarea
                id="dream-body"
                value={form.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                className="cartoon-form-input text-sm leading-relaxed"
                rows={6}
                placeholder="Describe your dream in as much detail as you recall: colors, people, feelings, floating moments…"
                style={{ resize: "vertical" }}
                required
              />
            )}
          </div>
        </div>

        {/* Date + Dream Type Row */}
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div>
            <label htmlFor="dream-date" className="block text-sm font-extrabold text-[#cfe3fc] mb-1.5">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={13} className="text-[#64dfd0]" /> Dream Date
              </span>
            </label>
            <CartoonDatePicker
              id="dream-date"
              value={form.dream_date}
              onChange={(dateStr) => update("dream_date", dateStr)}
            />
          </div>

          <div>
            <label htmlFor="dream-type" className="block text-sm font-extrabold text-[#cfe3fc] mb-1.5">
              Dream Type
            </label>
            <CartoonDreamTypeSelect
              id="dream-type"
              value={form.dream_type}
              onChange={(t) => update("dream_type", t)}
            />
          </div>
        </div>

        {/* Mood Picker */}
        <div className="mt-4">
          <label className="block text-sm font-extrabold text-[#cfe3fc] mb-2">
            How did the dream feel?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MOOD_OPTIONS.map((m) => {
              const cfg = MOOD_CONFIG[m];
              const Icon = cfg.icon;
              const active = form.mood === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => update("mood", m)}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] px-3 py-1.5 text-xs font-extrabold transition-transform ${
                    active
                      ? "scale-105 shadow-[0_3px_0_0_#081326] text-[#081326]"
                      : "bg-[#0e2040] text-[#cfe3fc] hover:scale-102"
                  }`}
                  style={{ backgroundColor: active ? cfg.bg : undefined }}
                >
                  <Icon size={12} strokeWidth={2.6} />
                  <span>{MOOD_LABELS[m]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-extrabold text-[#cfe3fc]">
              Sleep Quality (1 - 5)
            </label>
            <span className="text-xs font-extrabold text-[#ffe082]">
              {form.sleep_quality ? `${form.sleep_quality} / 5 Stars` : "Not rated"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((v) => {
              const activeVal = hoverRating ?? form.sleep_quality ?? 0;
              const isLit = activeVal >= v;
              return (
                <button
                  key={v}
                  type="button"
                  onMouseEnter={() => setHoverRating(v)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => update("sleep_quality", form.sleep_quality === v ? null : v)}
                  aria-label={`Rate sleep quality ${v} of 5`}
                  className="p-1 rounded-lg hover:scale-110 active:scale-95 transition-transform"
                >
                  <Star
                    size={26}
                    strokeWidth={2.4}
                    style={{
                      color: isLit ? "#ffe082" : "#244275",
                      fill: isLit ? "#ffe082" : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Cartoon Checkbox Toggles: Lucid & Recurring */}
        <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
          {/* Lucid Dream Toggle Card */}
          <label
            className={`group relative flex items-center justify-between p-3 rounded-2xl border-[2.5px] border-[#081326] cursor-pointer select-none transition-all duration-150 active:translate-y-0.5 ${
              form.is_lucid
                ? "bg-[#16315c] shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,224,130,0.25)]"
                : "bg-[#0e2040] shadow-[0_3px_0_0_#081326] hover:bg-[#13284f]"
            }`}
          >
            <input
              type="checkbox"
              checked={form.is_lucid}
              onChange={(e) => update("is_lucid", e.target.checked)}
              className="sr-only"
            />

            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326] transition-transform group-hover:scale-105 ${
                  form.is_lucid ? "bg-[#ffe082]" : "bg-[#183463]"
                }`}
              >
                <Sparkles
                  size={16}
                  strokeWidth={2.6}
                  style={{ color: form.is_lucid ? "#081326" : "#ffe082" }}
                />
              </span>

              <div className="min-w-0">
                <span className="block text-xs font-extrabold text-white leading-tight">
                  Lucid Dream
                </span>
                <span className="block truncate text-[10px] font-semibold text-[#8cb2e0]">
                  I was aware I was dreaming
                </span>
              </div>
            </div>

            {/* Custom Cartoon Checkbox Squircle */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] transition-all ml-2 ${
                form.is_lucid
                  ? "bg-[#ffe082] text-[#081326] shadow-[0_2px_0_0_#081326] scale-105"
                  : "bg-[#09152b] text-transparent"
              }`}
            >
              <Check size={12} strokeWidth={3.2} />
            </div>
          </label>

          {/* Recurring Dream Toggle Card */}
          <label
            className={`group relative flex items-center justify-between p-3 rounded-2xl border-[2.5px] border-[#081326] cursor-pointer select-none transition-all duration-150 active:translate-y-0.5 ${
              form.is_recurring
                ? "bg-[#16315c] shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(100,223,208,0.25)]"
                : "bg-[#0e2040] shadow-[0_3px_0_0_#081326] hover:bg-[#13284f]"
            }`}
          >
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) => update("is_recurring", e.target.checked)}
              className="sr-only"
            />

            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326] transition-transform group-hover:scale-105 ${
                  form.is_recurring ? "bg-[#64dfd0]" : "bg-[#183463]"
                }`}
              >
                <Repeat
                  size={16}
                  strokeWidth={2.6}
                  style={{ color: form.is_recurring ? "#081326" : "#64dfd0" }}
                />
              </span>

              <div className="min-w-0">
                <span className="block text-xs font-extrabold text-white leading-tight">
                  Recurring Dream
                </span>
                <span className="block truncate text-[10px] font-semibold text-[#8cb2e0]">
                  I&apos;ve experienced this before
                </span>
              </div>
            </div>

            {/* Custom Cartoon Checkbox Squircle */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] transition-all ml-2 ${
                form.is_recurring
                  ? "bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326] scale-105"
                  : "bg-[#09152b] text-transparent"
              }`}
            >
              <Check size={12} strokeWidth={3.2} />
            </div>
          </label>
        </div>

        {/* Tags Section */}
        <div className="mt-4">
          <label htmlFor="tag-input" className="block text-sm font-extrabold text-[#cfe3fc] mb-1.5">
            Sticker Tags
          </label>

          {/* Active Tags */}
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="animate-pop-in inline-flex items-center gap-1 rounded-full border-2 border-[#081326] bg-[#1c396e] pl-2.5 pr-1 py-0.5 text-xs font-extrabold text-[#cfe3fc] shadow-[0_2px_0_0_#081326]"
                >
                  <Hash size={10} strokeWidth={3} className="text-[#64dfd0]" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={`Remove tag ${tag}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/15 text-[#ff859d] transition-colors"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Tag Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                id="tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="cartoon-form-input h-11 text-sm"
                placeholder="Add tags like flying, water, maze (press Enter)"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                addTag(tagInput);
                setTagInput("");
              }}
              disabled={!tagInput.trim()}
              className="cartoon-form-btn-secondary shrink-0 h-11 px-3.5 rounded-xl text-xs font-extrabold disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap active:translate-y-0.5"
            >
              <Plus size={14} strokeWidth={2.8} className="text-[#64dfd0]" />
              <span>Add</span>
            </button>
          </div>

          {/* Suggested Tags Cloud */}
          {suggestedTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] font-bold text-[#8cb2e0]">Suggested:</span>
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="inline-flex items-center gap-1 rounded-full border-2 border-dashed border-[#5bb8ff]/60 bg-[#0e2040] px-2.5 py-0.5 text-[11px] font-bold text-[#5bb8ff] hover:bg-[#162e59] hover:scale-105 active:scale-95 transition-transform"
                >
                  <Plus size={10} strokeWidth={3} /> #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border-2 border-[#081326] bg-[#3a2340] px-3.5 py-2.5 text-sm font-bold text-[#ffd2db] mt-4"
          >
            <AlertTriangle size={15} className="shrink-0 text-[#ff859d]" strokeWidth={2.5} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center gap-2.5 pt-4 mt-4 border-t-2 border-[#081326]/50">
          <button
            type="submit"
            disabled={saving}
            className="cartoon-form-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-extrabold border-[2.5px] border-[#081326] bg-[#5bb8ff] text-[#081326] shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.45)] hover:bg-[#77c6ff] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] disabled:opacity-60 cursor-pointer transition-all"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving entry…
              </>
            ) : (
              <>
                <Save size={15} strokeWidth={2.6} />
                {mode === "edit" ? "Update Dream" : "Save to Storybook"}
              </>
            )}
          </button>

          {isModal && onClose ? (
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="cartoon-form-btn-secondary px-5 py-3 rounded-xl text-sm font-bold border-[2.5px] border-[#081326] bg-[#162f5c] text-white shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.14)] hover:bg-[#1f417d] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] cursor-pointer transition-all"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/journal"
              className="cartoon-form-btn-secondary px-5 py-3 rounded-xl text-sm font-bold border-[2.5px] border-[#081326] bg-[#162f5c] text-white shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.14)] hover:bg-[#1f417d] active:translate-y-0.5 active:shadow-[0_1px_0_0_#081326] transition-all"
            >
              Cancel
            </Link>
          )}
        </div>
      </div>
    </form>
  );

  if (isModal) {
    if (!mounted) return null;
    return createPortal(
      <div
        role="presentation"
        className="fixed inset-y-0 right-0 left-0 md:left-[var(--app-sidebar-width,256px)] z-40 flex items-center justify-center p-3 sm:p-5 bg-[#040814]/75 backdrop-blur-md animate-pop-in transition-[left] duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !saving) onClose?.();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dream-modal-title"
          className="relative w-full max-w-[760px] max-h-[90vh] overflow-y-auto rounded-[28px] cartoon-modal-scroll"
        >
          {formContent}
        </div>
      </div>,
      document.body
    );
  }

  return formContent;
}