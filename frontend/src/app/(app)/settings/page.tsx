"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  Hash,
  Info,
  Loader2,
  LogOut,
  Mic,
  PenTool,
  RotateCcw,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { dreamsApi, profileApi } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import type { Dream, DreamType } from "@/types";

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type SettingsSectionId =
  | "capture"
  | "reminders"
  | "insights"
  | "regional"
  | "privacy"
  | "data"
  | "account";

type LogMode = "text" | "voice";
type DateFormat = "locale" | "mdy" | "dmy" | "iso";
type TimeFormat = "12h" | "24h";
type WeekStart = "monday" | "sunday";
type AiStyle = "symbolic" | "psychological" | "concise";
type PermissionState = NotificationPermission | "unsupported";
type Feedback = { type: "success" | "error" | "info"; message: string };

interface SettingsState {
  defaultLogMode: LogMode;
  defaultDreamType: DreamType;
  defaultSleepQuality: number;
  voiceLanguage: string;
  autoSaveDrafts: boolean;
  autoSuggestTags: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: string[];
  lucidCheckEnabled: boolean;
  lucidCheckInterval: string;
  aiInsightsEnabled: boolean;
  aiStyle: AiStyle;
  defaultPatternDays: number;
  includeNightmaresInAi: boolean;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  weekStart: WeekStart;
  blurPreviews: boolean;
  pinLockEnabled: boolean;
  pinCode: string;
  autoLockMinutes: number;
}

const FONT = "'Quicksand', ui-rounded, 'Nunito', sans-serif";
const STORAGE_KEY = "stardrift_app_settings_v2";

const DEFAULT_SETTINGS: SettingsState = {
  defaultLogMode: "voice",
  defaultDreamType: "normal",
  defaultSleepQuality: 0,
  voiceLanguage: "en-US",
  autoSaveDrafts: true,
  autoSuggestTags: true,
  reminderEnabled: false,
  reminderTime: "07:30",
  reminderDays: ["mon", "tue", "wed", "thu", "fri"],
  lucidCheckEnabled: false,
  lucidCheckInterval: "3h",
  aiInsightsEnabled: true,
  aiStyle: "symbolic",
  defaultPatternDays: 90,
  includeNightmaresInAi: true,
  timezone: "UTC",
  dateFormat: "locale",
  timeFormat: "12h",
  weekStart: "monday",
  blurPreviews: false,
  pinLockEnabled: false,
  pinCode: "",
  autoLockMinutes: 15,
};

const DAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
] as const;

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const SETTINGS_NAV: {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
}[] = [
  { id: "capture", label: "Journal & Capture", description: "Writing, voice, drafts", icon: BookOpen, accent: "#5bb8ff" },
  { id: "reminders", label: "Reminders", description: "Recall and lucid cues", icon: Bell, accent: "#ffe082" },
  { id: "insights", label: "AI & Patterns", description: "Analysis preferences", icon: Sparkles, accent: "#94adff" },
  { id: "regional", label: "Date & Time", description: "Timezone and calendar", icon: Globe, accent: "#64dfd0" },
  { id: "privacy", label: "Privacy & Vault", description: "On-device privacy", icon: ShieldCheck, accent: "#5bb8ff" },
  { id: "data", label: "Backup & Export", description: "Take your archive", icon: Download, accent: "#ffe082" },
  { id: "account", label: "Account", description: "Session and deletion", icon: LogOut, accent: "#ff859d" },
];

const DREAM_TYPE_OPTIONS: { value: DreamType; label: string }[] = [
  { value: "normal", label: "Normal dream" },
  { value: "lucid", label: "Lucid dream" },
  { value: "recurring", label: "Recurring dream" },
  { value: "fragmented", label: "Fragmented dream" },
  { value: "nightmare", label: "Nightmare" },
  { value: "nap", label: "Daytime nap" },
];

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

function SettingsStyles() {
  return (
    <style>{`
      .settings-card {
        border: 2.5px solid #081326;
        box-shadow: 0 5px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,0.12);
      }
      .settings-button {
        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
        border: 2.5px solid #081326; border-radius: .9rem; font-weight: 800;
        transition: transform .15s ease, box-shadow .15s ease, background-color .15s ease;
      }
      .settings-button:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 0 #081326; }
      .settings-button:disabled { cursor: not-allowed; opacity: .6; }
      .settings-button-sky { color: #081326; background: #5bb8ff; box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.45); }
      .settings-button-sky:hover:not(:disabled) { background: #77c6ff; transform: translateY(-2px); box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.55); }
      .settings-button-navy { color: #eef6ff; background: #1c396e; box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.12); }
      .settings-button-navy:hover:not(:disabled) { background: #254887; transform: translateY(-2px); box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.18); }
      .settings-button-gold { color: #081326; background: #ffe082; box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.45); }
      .settings-button-gold:hover:not(:disabled) { background: #ffeb9b; transform: translateY(-2px); box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.55); }
      .settings-button-danger { color: #081326; background: #ff859d; box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.4); }
      .settings-button-danger:hover:not(:disabled) { background: #ff9cb3; transform: translateY(-2px); box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.5); }
      .settings-field {
        width: 100%; min-height: 44px; border: 2.5px solid #081326; border-radius: .8rem;
        background: #0d1f3f; color: #eef6ff; font-size: .875rem; font-weight: 700;
        padding: .65rem .8rem; outline: none; transition: border-color .15s ease, box-shadow .15s ease;
      }
      .settings-field:focus { border-color: #5bb8ff; box-shadow: 0 0 0 3px rgba(91,184,255,.2); }
      .settings-field::placeholder { color: #6d8eb8; }
      .settings-nav-button { transition: background-color .15s ease, transform .15s ease; }
      .settings-nav-button:hover { background: #1c396e; transform: translateX(2px); }
      .settings-scroll { scrollbar-width: thin; scrollbar-color: #2a4a7d transparent; }
      .settings-scroll::-webkit-scrollbar { width: 8px; }
      .settings-scroll::-webkit-scrollbar-thumb { background: #2a4a7d; border-radius: 999px; }
      @keyframes panelIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .settings-panel-enter { animation: panelIn .2s ease-out; }
      @keyframes toastPop {
        0% { opacity: 0; transform: translateY(-12px) scale(0.95); }
        60% { transform: translateY(2px) scale(1.02); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .settings-toast-enter { animation: toastPop .25s cubic-bezier(0.34, 1.35, 0.64, 1); }
      @media (prefers-reduced-motion: reduce) {
        .settings-button, .settings-nav-button, .settings-panel-enter, .settings-toast-enter { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Cartoon form controls                                               */
/* ------------------------------------------------------------------ */

function CartoonSelect<T extends string | number>({
  value,
  onChange,
  options,
  disabled = false,
  className = "sm:w-56",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="settings-field flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="truncate">{selected?.label ?? "Select…"}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.6}
          className={`shrink-0 text-[#6bc2ff] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border-[2.5px] border-[#081326] bg-[#0d1f3f] py-1 shadow-[0_4px_0_0_#081326]">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-extrabold ${
                  active ? "bg-[#1d3b70] text-white" : "text-[#cfe3fc] hover:bg-[#173260]"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check size={13} strokeWidth={3} className="shrink-0 text-[#64dfd0]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CartoonTimePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [hour = "07", minute = "30"] = value.split(":");
  const nearestMinute = MINUTES.includes(minute) ? minute : MINUTES.reduce((best, m) =>
    Math.abs(Number(m) - Number(minute)) < Math.abs(Number(best) - Number(minute)) ? m : best
  );

  return (
    <div className="flex items-center gap-2">
      <CartoonSelect
        value={hour}
        onChange={(h) => onChange(`${h}:${nearestMinute}`)}
        options={HOURS.map((h) => ({ value: h, label: h }))}
        className="w-[4.5rem]"
      />
      <span className="text-sm font-extrabold text-[#6bc2ff]">:</span>
      <CartoonSelect
        value={nearestMinute}
        onChange={(m) => onChange(`${hour}:${m}`)}
        options={MINUTES.map((m) => ({ value: m, label: m }))}
        className="w-[4.5rem]"
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
  label,
  accent = "#64dfd0",
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  accent?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative h-7 w-12 shrink-0 rounded-full border-2 border-[#081326] shadow-[0_2px_0_0_#081326] transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
      style={{ backgroundColor: checked ? accent : "#2a4267" }}
    >
      <span
        className="absolute left-[3px] top-[3px] h-[17px] w-[17px] rounded-full border-2 border-[#081326] bg-white transition-transform"
        style={{ transform: checked ? "translateX(19px)" : "translateX(0)" }}
      />
    </button>
  );
}

function PanelHeader({
  icon: Icon,
  accent,
  title,
  description,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  description: string;
}) {
  return (
    <header className="flex shrink-0 items-start gap-3 border-b-2 border-[#081326]/50 px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
        style={{ backgroundColor: accent }}
      >
        <Icon size={20} className="text-[#081326]" strokeWidth={2.5} />
      </span>
      <div>
        <h2 className="text-lg font-extrabold text-white">{title}</h2>
        <p className="mt-0.5 text-xs font-semibold leading-relaxed text-[#91b0d8]">{description}</p>
      </div>
    </header>
  );
}

function SettingRow({
  title,
  description,
  children,
  border = true,
}: {
  title: string;
  description: string;
  children: ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
        border ? "border-b border-[#274873]" : ""
      }`}
    >
      <div className="max-w-md">
        <p className="text-sm font-extrabold text-white">{title}</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-[#91b0d8]">{description}</p>
      </div>
      <div className="w-full shrink-0 sm:w-auto">{children}</div>
    </div>
  );
}

function SettingToggleRow({
  title,
  description,
  checked,
  onChange,
  accent,
  disabled = false,
  border = true,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  accent?: string;
  disabled?: boolean;
  border?: boolean;
}) {
  return (
    <SettingRow title={title} description={description} border={border}>
      <div className="flex justify-end">
        <Toggle checked={checked} onChange={onChange} accent={accent} disabled={disabled} label={title} />
      </div>
    </SettingRow>
  );
}

function Notice({
  type = "info",
  children,
}: {
  type?: "info" | "success" | "warning";
  children: ReactNode;
}) {
  const styles = {
    info: { bg: "bg-gradient-to-r from-[#142e5c] to-[#0f2347]", icon: "bg-[#5bb8ff]", text: "text-[#d8e8fc]" },
    success: { bg: "bg-gradient-to-r from-[#133b52] to-[#10264c]", icon: "bg-[#64dfd0]", text: "text-[#d4f9f2]" },
    warning: { bg: "bg-gradient-to-r from-[#3a1d38] to-[#221636]", icon: "bg-[#ff859d]", text: "text-[#fed9e2]" },
  };
  const current = styles[type];

  return (
    <div className={`settings-card flex items-start gap-3 rounded-2xl p-4 ${current.bg}`}>
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] text-[#081326] shadow-[0_2px_0_0_#081326] ${current.icon}`}
      >
        {type === "warning" ? (
          <AlertTriangle size={15} strokeWidth={2.6} />
        ) : type === "success" ? (
          <Check size={15} strokeWidth={3} />
        ) : (
          <Info size={15} strokeWidth={2.6} />
        )}
      </span>
      <div className={`min-w-0 flex-1 pt-0.5 text-xs font-medium leading-relaxed ${current.text}`}>
        {children}
      </div>
    </div>
  );
}

function FeedbackToast({
  feedback,
  onDismiss,
}: {
  feedback: Feedback;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, feedback.type === "error" ? 6000 : 4200);
    return () => clearTimeout(timer);
  }, [feedback, onDismiss]);

  const config = {
    success: {
      gradient: "from-[#133d52] via-[#153460] to-[#0f2448]",
      badgeBg: "bg-[#64dfd0]",
      badgeIcon: Check,
      tag: "Saved",
      tagColor: "text-[#64dfd0]",
      textColor: "text-[#eef6ff]",
    },
    error: {
      gradient: "from-[#3e1a33] via-[#2a1738] to-[#16122e]",
      badgeBg: "bg-[#ff859d]",
      badgeIcon: AlertTriangle,
      tag: "Attention",
      tagColor: "text-[#ff859d]",
      textColor: "text-[#ffe3ea]",
    },
    info: {
      gradient: "from-[#163868] via-[#142d5a] to-[#0f2144]",
      badgeBg: "bg-[#5bb8ff]",
      badgeIcon: Sparkles,
      tag: "Notice",
      tagColor: "text-[#5bb8ff]",
      textColor: "text-[#eaf2ff]",
    },
  }[feedback.type];

  const Icon = config.badgeIcon;

  return (
    <div
      role="status"
      aria-live="polite"
      className="settings-toast-enter fixed inset-x-4 top-4 z-50 sm:inset-x-auto sm:right-6 sm:top-6 sm:max-w-md"
    >
      <div
        className={`settings-card flex items-center gap-3.5 rounded-2xl bg-gradient-to-r ${config.gradient} p-3.5 pr-3 shadow-[0_6px_0_0_#081326,0_16px_32px_-6px_rgba(8,19,38,0.6)]`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] ${config.badgeBg} text-[#081326] shadow-[0_2px_0_0_#081326]`}
        >
          <Icon size={17} strokeWidth={2.8} />
        </span>
        <div className="min-w-0 flex-1">
          <span className={`text-[10px] font-extrabold uppercase tracking-widest ${config.tagColor}`}>
            {config.tag}
          </span>
          <p className={`text-xs font-bold leading-snug sm:text-sm ${config.textColor}`}>
            {feedback.message}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#0c1b36]/70 text-[#8fb2de] hover:bg-[#1a3769] hover:text-white"
          aria-label="Dismiss message"
        >
          <X size={14} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  );
}

function ChoiceButtons<T extends string>({
  value,
  options,
  onChange,
  activeColor,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  activeColor: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-xl border-2 border-[#081326] px-3 py-2.5 text-xs font-extrabold ${
              active ? "text-[#081326] shadow-[0_2px_0_0_#081326]" : "bg-[#0d1f3f] text-[#9bc0ed]"
            }`}
            style={active ? { backgroundColor: activeColor } : undefined}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Export helpers                                                      */
/* ------------------------------------------------------------------ */

async function fetchAllDreams(): Promise<Dream[]> {
  const dreams: Dream[] = [];
  let page = 1;
  while (page <= 500) {
    const response = await dreamsApi.list({ page });
    dreams.push(...(response.results || []));
    if (!response.next || response.results.length === 0) break;
    page += 1;
  }
  return dreams;
}

function csvCell(value: unknown): string {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadFile(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function SettingsPage() {
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<SettingsSectionId>("capture");
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(DEFAULT_SETTINGS));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<PermissionState>("default");
  const [exporting, setExporting] = useState<"json" | "csv" | "markdown" | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function updateSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      let initial = { ...DEFAULT_SETTINGS };
      try {
        initial.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) initial = { ...initial, ...(JSON.parse(saved) as Partial<SettingsState>) };
        const legacyLogMode = window.localStorage.getItem("stardrift_default_log_mode");
        if (legacyLogMode === "text" || legacyLogMode === "voice") initial.defaultLogMode = legacyLogMode;
      } catch {
        // Keep defaults
      }

      try {
        const profile = await profileApi.get();
        if (profile) {
          if (profile.timezone) initial.timezone = profile.timezone;
          if (profile.default_log_mode) initial.defaultLogMode = profile.default_log_mode;
          if (profile.default_dream_type) initial.defaultDreamType = profile.default_dream_type;
          if (typeof profile.default_sleep_quality === "number") initial.defaultSleepQuality = profile.default_sleep_quality;
          if (profile.voice_language) initial.voiceLanguage = profile.voice_language;
          if (typeof profile.auto_save_drafts === "boolean") initial.autoSaveDrafts = profile.auto_save_drafts;
          if (typeof profile.auto_suggest_tags === "boolean") initial.autoSuggestTags = profile.auto_suggest_tags;
          if (typeof profile.reminder_enabled === "boolean") initial.reminderEnabled = profile.reminder_enabled;
          if (profile.reminder_time) initial.reminderTime = profile.reminder_time;
          if (Array.isArray(profile.reminder_days) && profile.reminder_days.length > 0) {
            initial.reminderDays = profile.reminder_days;
          }
          if (typeof profile.lucid_check_enabled === "boolean") initial.lucidCheckEnabled = profile.lucid_check_enabled;
          if (profile.lucid_check_interval) initial.lucidCheckInterval = profile.lucid_check_interval;
          if (typeof profile.ai_insights_enabled === "boolean") initial.aiInsightsEnabled = profile.ai_insights_enabled;
          if (profile.ai_style) initial.aiStyle = profile.ai_style;
          if (typeof profile.default_pattern_days === "number") initial.defaultPatternDays = profile.default_pattern_days;
          if (typeof profile.include_nightmares_in_ai === "boolean") initial.includeNightmaresInAi = profile.include_nightmares_in_ai;
          if (profile.date_format) initial.dateFormat = profile.date_format;
          if (profile.time_format) initial.timeFormat = profile.time_format;
          if (profile.week_start) initial.weekStart = profile.week_start;
          if (typeof profile.blur_previews === "boolean") initial.blurPreviews = profile.blur_previews;
          if (typeof profile.pin_lock_enabled === "boolean") initial.pinLockEnabled = profile.pin_lock_enabled;
          if (typeof profile.pin_code === "string") initial.pinCode = profile.pin_code;
          if (typeof profile.auto_lock_minutes === "number") initial.autoLockMinutes = profile.auto_lock_minutes;
        }
      } catch {
        // Fallback to local
      }

      if (!mounted) return;
      setSettings(initial);
      setSavedSnapshot(JSON.stringify(initial));
      setLoaded(true);
      setNotificationPermission("Notification" in window ? window.Notification.permission : "unsupported");
    }

    void loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!deleteOpen) return;
    const previousOverflow = document.body.style.overflow;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !deleting) closeDeleteModal();
    }
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteOpen, deleting]);

  const isDirty = useMemo(
    () => loaded && JSON.stringify(settings) !== savedSnapshot,
    [loaded, savedSnapshot, settings]
  );

  const timezoneOptions = useMemo(
    () => Array.from(new Set([settings.timezone, ...TIMEZONES])),
    [settings.timezone]
  );

  const activeNav = SETTINGS_NAV.find((s) => s.id === activeSection)!;

  function closeDeleteModal() {
    setDeleteOpen(false);
    setDeletePhrase("");
    setDeleteError(null);
  }

  async function saveSettings() {
    setSaving(true);
    setFeedback(null);
    try {
      // 1. Persist all settings directly to the database via API
      const updatedProfile = await profileApi.update({
        timezone: settings.timezone,
        default_log_mode: settings.defaultLogMode,
        default_dream_type: settings.defaultDreamType,
        default_sleep_quality: settings.defaultSleepQuality,
        voice_language: settings.voiceLanguage,
        auto_save_drafts: settings.autoSaveDrafts,
        auto_suggest_tags: settings.autoSuggestTags,
        reminder_enabled: settings.reminderEnabled,
        reminder_time: settings.reminderTime,
        reminder_days: settings.reminderDays,
        lucid_check_enabled: settings.lucidCheckEnabled,
        lucid_check_interval: settings.lucidCheckInterval,
        ai_insights_enabled: settings.aiInsightsEnabled,
        ai_style: settings.aiStyle,
        default_pattern_days: settings.defaultPatternDays,
        include_nightmares_in_ai: settings.includeNightmaresInAi,
        date_format: settings.dateFormat,
        time_format: settings.timeFormat,
        week_start: settings.weekStart,
        blur_previews: settings.blurPreviews,
        pin_lock_enabled: settings.pinLockEnabled,
        pin_code: settings.pinCode,
        auto_lock_minutes: settings.autoLockMinutes,
      });

      // 2. Also keep localStorage in sync for instant offline fallbacks
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      window.localStorage.setItem("stardrift_default_log_mode", settings.defaultLogMode);
      window.localStorage.setItem("stardrift_autosave_drafts", String(settings.autoSaveDrafts));
      window.localStorage.setItem("stardrift_reminder_enabled", String(settings.reminderEnabled));
      window.localStorage.setItem("stardrift_reminder_time", settings.reminderTime);
      window.localStorage.setItem("stardrift_blur_previews", String(settings.blurPreviews));
      window.localStorage.setItem("stardrift_pin_lock_enabled", String(settings.pinLockEnabled));
      window.localStorage.setItem("stardrift_pin_code", settings.pinCode);

      // 3. Dispatch an app-wide event so journal list, forms, and navigation update reactively
      window.dispatchEvent(
        new CustomEvent("settings-updated", { detail: { settings, profile: updatedProfile } })
      );

      setSavedSnapshot(JSON.stringify(settings));
      setFeedback({ type: "success", message: "Your settings have been saved to your account." });
    } catch {
      setFeedback({
        type: "error",
        message: "Some settings could not be saved to your account. Please check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  function resetSettings() {
    setSettings({
      ...DEFAULT_SETTINGS,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });
    setFeedback({ type: "info", message: "Defaults restored. Save settings to apply them." });
  }

  function toggleReminderDay(dayId: string) {
    setSettings((current) => ({
      ...current,
      reminderDays: current.reminderDays.includes(dayId)
        ? current.reminderDays.filter((day) => day !== dayId)
        : [...current.reminderDays, dayId],
    }));
  }

  async function requestNotificationPermission() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setFeedback({ type: "error", message: "This browser does not support notifications." });
      return;
    }
    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        updateSetting("reminderEnabled", true);
        setFeedback({
          type: "success",
          message: "Notifications are enabled. Save settings to keep your reminder schedule.",
        });
      } else {
        setFeedback({
          type: "info",
          message: "Notification permission was not granted. You can change this later in browser settings.",
        });
      }
    } catch {
      setFeedback({ type: "error", message: "Could not request notification permission." });
    }
  }

  function sendTestNotification() {
    if (!("Notification" in window)) {
      setFeedback({ type: "error", message: "This browser does not support notifications." });
      return;
    }
    if (window.Notification.permission !== "granted") {
      void requestNotificationPermission();
      return;
    }
    try {
      new window.Notification("Morning Dream Recall", {
        body: "Good morning. Take one quiet minute to capture what you remember from last night.",
      });
      setFeedback({ type: "success", message: "A test notification was sent to your browser." });
    } catch {
      setFeedback({
        type: "info",
        message: "Notification permission is enabled, but this browser did not display the test alert.",
      });
    }
  }

  async function exportDreams(format: "json" | "csv" | "markdown") {
    setExporting(format);
    setFeedback(null);
    try {
      const dreams = await fetchAllDreams();
      const date = new Date().toISOString().slice(0, 10);

      if (format === "json") {
        downloadFile(
          JSON.stringify(
            { app: "Stardrift", exportedAt: new Date().toISOString(), timezone: settings.timezone, totalDreams: dreams.length, dreams },
            null,
            2
          ),
          `stardrift-backup-${date}.json`,
          "application/json;charset=utf-8"
        );
      }

      if (format === "csv") {
        const headers = [
          "ID", "Dream Date", "Title", "Dream Type", "Mood", "Lucid",
          "Recurring", "Sleep Quality", "Input Method", "Tags", "Dream Text",
        ];
        const rows = dreams.map((dream) => [
          dream.id,
          dream.dream_date,
          dream.title || "",
          dream.dream_type,
          dream.mood,
          dream.is_lucid ? "Yes" : "No",
          dream.is_recurring ? "Yes" : "No",
          dream.sleep_quality ? `${dream.sleep_quality}/5` : "",
          dream.input_method || "text",
          (dream.tags_detail || []).map((tag) => tag.name).join(", "),
          dream.body || "",
        ]);
        const csv = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\r\n");
        downloadFile(`\uFEFF${csv}`, `stardrift-journal-${date}.csv`, "text/csv;charset=utf-8");
      }

      if (format === "markdown") {
        const markdown = [
          "# My Dream Storybook",
          "",
          `Exported: ${date}`,
          `Entries: ${dreams.length}`,
          "",
          ...dreams.flatMap((dream) => [
            "---",
            "",
            `## ${dream.title || "Untitled Dream"}`,
            "",
            `**Date:** ${dream.dream_date}`,
            `**Type:** ${dream.dream_type}`,
            `**Mood:** ${dream.mood}`,
            `**Lucid:** ${dream.is_lucid ? "Yes" : "No"}`,
            `**Recurring:** ${dream.is_recurring ? "Yes" : "No"}`,
            dream.tags_detail?.length
              ? `**Tags:** ${dream.tags_detail.map((tag) => `#${tag.name}`).join(" ")}`
              : "",
            "",
            dream.body || "_No dream text recorded._",
            "",
          ]),
        ].join("\n");
        downloadFile(markdown, `stardrift-storybook-${date}.md`, "text/markdown;charset=utf-8");
      }

      setFeedback({
        type: "success",
        message: `${dreams.length} ${dreams.length === 1 ? "dream" : "dreams"} exported successfully.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Could not export your journal.",
      });
    } finally {
      setExporting(null);
    }
  }

  function clearLocalDrafts() {
    try {
      window.localStorage.removeItem("stardrift_dream_draft");
      window.localStorage.removeItem("stardrift_draft");
      window.sessionStorage?.removeItem("stardrift_dream_draft");
      window.sessionStorage?.removeItem("stardrift_draft");
      window.dispatchEvent(new CustomEvent("draft-cleared"));
      setFeedback({ type: "success", message: "Local unfinished dream drafts were cleared." });
    } catch {
      setFeedback({ type: "error", message: "Could not clear local draft storage." });
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setSigningOut(false);
      setFeedback({ type: "error", message: "Could not sign out. Please try again." });
    }
  }

  async function deleteAccount() {
    if (deletePhrase !== "DELETE") return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await profileApi.delete();
      const supabase = getSupabaseClient();
      if (supabase) await supabase.auth.signOut().catch(() => undefined);
      try {
        window.localStorage.clear();
      } catch {
        // Ignore
      }
      window.location.href = "/";
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Could not delete this account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <main
      className="flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-4 text-[#eef6ff]"
      style={{ fontFamily: FONT }}
    >
      <SettingsStyles />

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#132952] shadow-[0_2px_0_0_#081326]">
            <Settings2 size={16} className="text-[#7ac8ff]" strokeWidth={2.5} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">Settings</h1>
              <span
                className={`h-2.5 w-2.5 rounded-full border border-[#081326] ${isDirty ? "bg-[#ffe082]" : "bg-[#64dfd0]"}`}
                title={isDirty ? "Unsaved changes" : "All saved"}
              />
            </div>
            <p className="text-xs font-semibold text-[#8fb2de]">
              Tune your journal, reminders, privacy, and backups.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={resetSettings}
            disabled={saving || !loaded}
            className="settings-button settings-button-navy px-4 py-2.5 text-xs"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving || !loaded || !isDirty}
            className="settings-button settings-button-sky px-4 py-2.5 text-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      {feedback && <FeedbackToast feedback={feedback} onDismiss={() => setFeedback(null)} />}

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col lg:rounded-[26px] lg:border-[2.5px] lg:border-[#081326] lg:bg-gradient-to-b lg:from-[#1a3769] lg:to-[#0f2245] lg:p-3 lg:shadow-[0_5px_0_0_#081326]">
          <p className="mb-2 hidden px-2 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-[#7ea4d4] lg:block">
            Categories
          </p>

          <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  aria-current={active ? "page" : undefined}
                  className={`settings-nav-button flex min-w-max items-center gap-2.5 rounded-2xl border-2 border-[#081326] px-3 py-2.5 text-left lg:w-full ${
                    active ? "bg-[#1d3b70] shadow-[0_3px_0_0_#081326]" : "bg-[#12264a]"
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326]"
                    style={{ backgroundColor: item.accent }}
                  >
                    <Icon size={15} className="text-[#081326]" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold text-white">{item.label}</span>
                    <span className="mt-0.5 block text-[10px] font-semibold text-[#91b0d8]">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto hidden pt-4 lg:block">
            <div className="flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0e2040]/80 p-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]">
                <ShieldCheck size={14} strokeWidth={2.5} />
              </span>
              <p className="text-[11px] font-medium leading-relaxed text-[#a9c7ec]">
                Settings never change your saved dream entries.
              </p>
            </div>
          </div>
        </aside>

        <section
          key={activeSection}
          className="settings-card settings-panel-enter flex min-h-0 flex-col overflow-hidden rounded-[26px] bg-[#152d58]"
        >
          <PanelHeader
            icon={activeNav.icon}
            accent={activeNav.accent}
            title={
              {
                capture: "Journal & Capture",
                reminders: "Recall & Reminders",
                insights: "AI & Pattern Analysis",
                regional: "Date & Time",
                privacy: "Privacy & Vault",
                data: "Backup & Export",
                account: "Account & Session",
              }[activeSection]
            }
            description={
              {
                capture: "Set defaults for how a fresh dream entry begins.",
                reminders: "Set gentle cues for recording dreams and practicing lucidity.",
                insights: "Choose how dream insights are generated and what they include.",
                regional: "Align journal dates, weekly views, and reminders with your local routine.",
                privacy: "Control how dream content appears on this device.",
                data: "Take a personal copy of your journal in the format you need.",
                account: "Manage your active session and permanent account controls.",
              }[activeSection]
            }
          />

          <div className="settings-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-7">
            {activeSection === "capture" && (
              <>
                <SettingRow title="Default recording method" description="Choose the capture screen you want to see first.">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "voice" as const, label: "Voice", icon: Mic, color: "#ffe082" },
                      { value: "text" as const, label: "Write", icon: PenTool, color: "#5bb8ff" },
                    ].map((option) => {
                      const Icon = option.icon;
                      const selected = settings.defaultLogMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateSetting("defaultLogMode", option.value)}
                          className={`flex items-center justify-center gap-2 rounded-xl border-2 border-[#081326] px-3 py-2.5 text-xs font-extrabold ${
                            selected ? "bg-[#1d3b70] text-white shadow-[0_2px_0_0_#081326]" : "bg-[#0d1f3f] text-[#9bc0ed]"
                          }`}
                        >
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#081326]"
                            style={{ backgroundColor: option.color }}
                          >
                            <Icon size={13} className="text-[#081326]" strokeWidth={2.7} />
                          </span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </SettingRow>

                <SettingRow title="Default dream type" description="Preselect a category for a new dream entry.">
                  <CartoonSelect
                    value={settings.defaultDreamType}
                    onChange={(v) => updateSetting("defaultDreamType", v)}
                    options={DREAM_TYPE_OPTIONS}
                  />
                </SettingRow>

                <SettingRow title="Default sleep rating" description="Choose a value to prefill, or ask every time.">
                  <CartoonSelect
                    value={settings.defaultSleepQuality}
                    onChange={(v) => updateSetting("defaultSleepQuality", v)}
                    options={[
                      { value: 0, label: "Ask every time" },
                      { value: 5, label: "5 / 5 stars" },
                      { value: 4, label: "4 / 5 stars" },
                      { value: 3, label: "3 / 5 stars" },
                      { value: 2, label: "2 / 5 stars" },
                      { value: 1, label: "1 / 5 stars" },
                    ]}
                  />
                </SettingRow>

                <SettingRow title="Voice dictation language" description="Used when speech capture is available in your browser.">
                  <CartoonSelect
                    value={settings.voiceLanguage}
                    onChange={(v) => updateSetting("voiceLanguage", v)}
                    options={[
                      { value: "en-US", label: "English (United States)" },
                      { value: "en-GB", label: "English (United Kingdom)" },
                      { value: "en-AU", label: "English (Australia)" },
                      { value: "es-ES", label: "Spanish" },
                      { value: "fr-FR", label: "French" },
                      { value: "de-DE", label: "German" },
                      { value: "hi-IN", label: "Hindi" },
                      { value: "ja-JP", label: "Japanese" },
                    ]}
                  />
                </SettingRow>

                <SettingToggleRow
                  title="Save unfinished drafts"
                  description="Keep a local copy if you leave an entry before saving it."
                  checked={settings.autoSaveDrafts}
                  onChange={(v) => updateSetting("autoSaveDrafts", v)}
                  accent="#64dfd0"
                />

                <SettingToggleRow
                  title="Smart tag suggestions"
                  description="Suggest tags from words like water, flying, chase, or school."
                  checked={settings.autoSuggestTags}
                  onChange={(v) => updateSetting("autoSuggestTags", v)}
                  accent="#5bb8ff"
                  border={false}
                />
              </>
            )}

            {activeSection === "reminders" && (
              <>
                <SettingToggleRow
                  title="Morning dream recall reminder"
                  description="Save a reminder schedule for your preferred wake-up routine."
                  checked={settings.reminderEnabled}
                  onChange={(v) => updateSetting("reminderEnabled", v)}
                  accent="#ffe082"
                />

                {settings.reminderEnabled && (
                  <div className="grid gap-5 border-b border-[#274873] py-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]">
                        Reminder time
                      </label>
                      <CartoonTimePicker
                        value={settings.reminderTime}
                        onChange={(v) => updateSetting("reminderTime", v)}
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]">
                          Reminder days
                        </label>
                        <button
                          type="button"
                          onClick={() => updateSetting("reminderDays", DAYS.map((d) => d.id))}
                          className="text-[11px] font-extrabold text-[#7ac8ff] hover:text-white"
                        >
                          Every day
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS.map((day) => {
                          const active = settings.reminderDays.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              aria-pressed={active}
                              onClick={() => toggleReminderDay(day.id)}
                              className={`h-9 min-w-10 rounded-xl border-2 border-[#081326] px-2 text-[11px] font-extrabold ${
                                active
                                  ? "bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]"
                                  : "bg-[#173260] text-[#9bc0ed]"
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <SettingToggleRow
                  title="Lucid reality-check nudges"
                  description="Occasional daytime reminders to ask yourself whether you are dreaming."
                  checked={settings.lucidCheckEnabled}
                  onChange={(v) => updateSetting("lucidCheckEnabled", v)}
                  accent="#94adff"
                />

                {settings.lucidCheckEnabled && (
                  <SettingRow title="Reality-check frequency" description="How often these cues should be scheduled.">
                    <CartoonSelect
                      value={settings.lucidCheckInterval}
                      onChange={(v) => updateSetting("lucidCheckInterval", v)}
                      options={[
                        { value: "2h", label: "Every 2 hours" },
                        { value: "3h", label: "Every 3 hours" },
                        { value: "4h", label: "Every 4 hours" },
                        { value: "daily", label: "Once at midday" },
                      ]}
                    />
                  </SettingRow>
                )}

                <div className="pt-4">
                  <Notice type="info">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <strong className="block text-white">Browser notifications</strong>
                        <span className="mt-1 block">
                          {notificationPermission === "granted"
                            ? "Notifications are allowed in this browser."
                            : notificationPermission === "denied"
                              ? "Notifications are blocked in browser settings."
                              : notificationPermission === "unsupported"
                                ? "Notifications are not supported in this browser."
                                : "Notification permission has not been requested yet."}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {notificationPermission === "default" && (
                          <button
                            type="button"
                            onClick={requestNotificationPermission}
                            className="settings-button settings-button-gold px-3 py-2 text-xs"
                          >
                            <Bell size={13} />
                            Enable
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={sendTestNotification}
                          className="settings-button settings-button-navy px-3 py-2 text-xs"
                        >
                          <Send size={13} />
                          Test
                        </button>
                      </div>
                    </div>
                  </Notice>
                </div>
              </>
            )}

            {activeSection === "insights" && (
              <>
                <SettingToggleRow
                  title="Enable AI narrative insights"
                  description="Allow pattern summaries in the dashboard and pattern explorer."
                  checked={settings.aiInsightsEnabled}
                  onChange={(v) => updateSetting("aiInsightsEnabled", v)}
                  accent="#94adff"
                />

                <div className={settings.aiInsightsEnabled ? "" : "pointer-events-none opacity-50"}>
                  <SettingRow title="Interpretation style" description="Choose the general tone used for AI-generated reflections.">
                    <CartoonSelect
                      value={settings.aiStyle}
                      onChange={(v) => updateSetting("aiStyle", v)}
                      disabled={!settings.aiInsightsEnabled}
                      options={[
                        { value: "symbolic", label: "Symbolic & archetypal" },
                        { value: "psychological", label: "Emotional & reflective" },
                        { value: "concise", label: "Concise & grounded" },
                      ]}
                    />
                  </SettingRow>

                  <SettingRow title="Default pattern window" description="The time range selected when opening pattern analysis.">
                    <CartoonSelect
                      value={settings.defaultPatternDays}
                      onChange={(v) => updateSetting("defaultPatternDays", v)}
                      disabled={!settings.aiInsightsEnabled}
                      options={[
                        { value: 30, label: "Last 30 nights" },
                        { value: 90, label: "Last 90 nights" },
                        { value: 365, label: "Last year" },
                      ]}
                    />
                  </SettingRow>

                  <SettingToggleRow
                    title="Include nightmares in summaries"
                    description="Include difficult or anxious dreams when finding recurring themes."
                    checked={settings.includeNightmaresInAi}
                    onChange={(v) => updateSetting("includeNightmaresInAi", v)}
                    accent="#64dfd0"
                    border={false}
                  />
                </div>
              </>
            )}

            {activeSection === "regional" && (
              <>
                <SettingRow title="Timezone" description="Used to interpret dream dates and your reminder time.">
                  <div className="flex gap-2">
                    <CartoonSelect
                      value={settings.timezone}
                      onChange={(v) => updateSetting("timezone", v)}
                      options={timezoneOptions.map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }))}
                      className="min-w-0 flex-1 sm:w-64"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateSetting("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")
                      }
                      className="settings-button settings-button-navy shrink-0 px-3 text-xs"
                    >
                      Detect
                    </button>
                  </div>
                </SettingRow>

                <SettingRow title="Date format" description="Choose how dates appear in your journal.">
                  <CartoonSelect
                    value={settings.dateFormat}
                    onChange={(v) => updateSetting("dateFormat", v)}
                    options={[
                      { value: "locale", label: "Use device default" },
                      { value: "mdy", label: "MM / DD / YYYY" },
                      { value: "dmy", label: "DD / MM / YYYY" },
                      { value: "iso", label: "YYYY-MM-DD" },
                    ]}
                  />
                </SettingRow>

                <SettingRow title="Time format" description="Choose whether time is displayed in 12-hour or 24-hour format.">
                  <ChoiceButtons
                    value={settings.timeFormat}
                    onChange={(v) => updateSetting("timeFormat", v)}
                    activeColor="#5bb8ff"
                    options={[
                      { value: "12h", label: "12-hour" },
                      { value: "24h", label: "24-hour" },
                    ]}
                  />
                </SettingRow>

                <SettingRow title="Week starts on" description="Controls the first day shown in calendar-like views." border={false}>
                  <ChoiceButtons
                    value={settings.weekStart}
                    onChange={(v) => updateSetting("weekStart", v)}
                    activeColor="#64dfd0"
                    options={[
                      { value: "monday", label: "Monday" },
                      { value: "sunday", label: "Sunday" },
                    ]}
                  />
                </SettingRow>
              </>
            )}

            {activeSection === "privacy" && (
              <>
                <SettingToggleRow
                  title="Blur dream previews"
                  description="Hide dream excerpts in journal cards until you interact with them."
                  checked={settings.blurPreviews}
                  onChange={(v) => updateSetting("blurPreviews", v)}
                  accent="#5bb8ff"
                />

                <SettingToggleRow
                  title="Screen lock on launch"
                  description="Require a device-level journal PIN when reopening the app."
                  checked={settings.pinLockEnabled}
                  onChange={(v) => updateSetting("pinLockEnabled", v)}
                  accent="#ffe082"
                />

                {settings.pinLockEnabled && (
                  <div className="grid gap-5 border-b border-[#274873] py-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#ffe082]">
                        4-digit PIN
                      </label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={settings.pinCode}
                        onChange={(e) => updateSetting("pinCode", e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="••••"
                        className="settings-field tracking-[0.35em]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-[#8cb2e0]">
                        Auto-lock after
                      </label>
                      <CartoonSelect
                        value={settings.autoLockMinutes}
                        onChange={(v) => updateSetting("autoLockMinutes", v)}
                        options={[
                          { value: 5, label: "5 minutes" },
                          { value: 15, label: "15 minutes" },
                          { value: 30, label: "30 minutes" },
                          { value: 60, label: "1 hour" },
                        ]}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <Notice type="info">
                    <strong className="block text-white">Privacy controls are preferences.</strong>
                    <span className="mt-1 block">
                      Blur and screen-lock settings need to be enforced by your journal UI and lock screen
                      implementation. Do not treat a local browser PIN as account-level security.
                    </span>
                  </Notice>
                </div>
              </>
            )}

            {activeSection === "data" && (
              <>
                <div className="grid gap-3 pt-4 sm:grid-cols-3">
                  {[
                    { format: "json" as const, icon: FileText, color: "#5bb8ff", title: "JSON Backup", description: "Complete structured journal archive." },
                    { format: "csv" as const, icon: FileSpreadsheet, color: "#64dfd0", title: "CSV Spreadsheet", description: "For Excel, Numbers, or Sheets." },
                    { format: "markdown" as const, icon: Hash, color: "#ffe082", title: "Markdown Storybook", description: "Readable entries for notes or printing." },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isExporting = exporting === option.format;
                    return (
                      <div
                        key={option.format}
                        className="flex flex-col rounded-2xl border-2 border-[#081326] bg-[#0d1f3f] p-4 shadow-[0_3px_0_0_#081326]"
                      >
                        <span
                          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
                          style={{ backgroundColor: option.color }}
                        >
                          <Icon size={18} className="text-[#081326]" strokeWidth={2.5} />
                        </span>
                        <h3 className="text-sm font-extrabold text-white">{option.title}</h3>
                        <p className="mt-1 flex-1 text-xs font-medium leading-relaxed text-[#91b0d8]">
                          {option.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => exportDreams(option.format)}
                          disabled={exporting !== null}
                          className="settings-button settings-button-navy mt-4 w-full px-3 py-2.5 text-xs"
                        >
                          {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          {isExporting ? "Exporting…" : "Export"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-[#274873]">
                  <SettingRow
                    title="Clear local unfinished drafts"
                    description="Remove unsaved dream drafts from this browser without affecting saved entries."
                    border={false}
                  >
                    <button
                      type="button"
                      onClick={clearLocalDrafts}
                      className="settings-button settings-button-navy px-4 py-2.5 text-xs"
                    >
                      Clear drafts
                    </button>
                  </SettingRow>
                </div>
              </>
            )}

            {activeSection === "account" && (
              <>
                <SettingRow
                  title="Sign out of this device"
                  description="End your active session here. You can sign back in whenever you need."
                >
                  <button
                    type="button"
                    onClick={signOut}
                    disabled={signingOut}
                    className="settings-button settings-button-navy px-4 py-2.5 text-xs"
                  >
                    {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    {signingOut ? "Signing out…" : "Sign out"}
                  </button>
                </SettingRow>

                <div className="mt-4 rounded-2xl border-2 border-[#081326] bg-[#241b35] p-4 shadow-[0_3px_0_0_#081326]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-extrabold text-[#ffb1c1]">Delete account permanently</p>
                      <p className="mt-1 max-w-md text-xs font-medium leading-relaxed text-[#d6a9b8]">
                        This removes your account and associated dream journal data. It cannot be undone.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletePhrase("");
                        setDeleteError(null);
                        setDeleteOpen(true);
                      }}
                      className="settings-button settings-button-danger shrink-0 px-4 py-2.5 text-xs"
                    >
                      <Trash2 size={14} />
                      Delete account
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t-2 border-[#081326]/50 bg-[#11264c] px-5 py-3.5 sm:px-7">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full border border-[#081326] ${
                  isDirty ? "animate-pulse bg-[#ffe082]" : "bg-[#64dfd0]"
                }`}
              />
              <p className="text-xs font-bold text-[#cfe3fc]">
                {isDirty ? "You have unsaved changes." : "All settings are up to date."}
              </p>
            </div>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving || !loaded || !isDirty}
              className="settings-button settings-button-sky px-5 py-2.5 text-xs"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </footer>
        </section>
      </div>

      {isDirty && (
        <div className="fixed inset-x-4 bottom-4 z-30 lg:hidden">
          <div className="settings-card flex items-center justify-between gap-3 rounded-2xl bg-[#16305d] p-3">
            <p className="text-xs font-extrabold text-[#d8e9ff]">Unsaved changes</p>
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving}
              className="settings-button settings-button-sky px-4 py-2 text-xs"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </button>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050b18]/80 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deleting) closeDeleteModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="settings-card w-full max-w-md rounded-[26px] bg-[#182a4b] p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#081326] bg-[#ff859d] text-[#081326] shadow-[0_3px_0_0_#081326]">
                <AlertTriangle size={23} strokeWidth={2.5} />
              </span>
              <button
                type="button"
                onClick={() => !deleting && closeDeleteModal()}
                disabled={deleting}
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#102244] text-[#cfe3fc] hover:bg-[#1c396e]"
                aria-label="Close delete dialog"
              >
                <X size={17} />
              </button>
            </div>

            <h2 id="delete-account-title" className="text-xl font-extrabold text-white">
              Delete your account?
            </h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#b6cce9]">
              This permanently removes your account, dream journal, and stored pattern data. Type{" "}
              <strong className="text-[#ffb1c1]">DELETE</strong> to continue.
            </p>

            <label htmlFor="delete-confirmation" className="mb-2 mt-5 block text-xs font-extrabold text-[#d8e9ff]">
              Confirmation
            </label>
            <input
              id="delete-confirmation"
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              className="settings-field"
              placeholder="DELETE"
              autoComplete="off"
              disabled={deleting}
            />

            {deleteError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border-2 border-[#ff859d]/40 bg-[#ff859d]/10 px-3 py-2.5 text-xs font-bold text-[#ffd2db]"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="settings-button settings-button-navy px-4 py-3 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deleteAccount}
                disabled={deleting || deletePhrase !== "DELETE"}
                className="settings-button settings-button-danger px-5 py-3 text-sm"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}