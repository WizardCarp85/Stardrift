"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Compass,
  Edit3,
  Feather,
  Heart,
  Loader2,
  Lock,
  Mail,
  Moon,
  Pencil,
  Settings,
  ShieldCheck,
  Sparkles,
  Sunrise,
  UserRound,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { profileApi, dashboardApi } from "@/lib/api";
import DreamLoader from "@/components/DreamLoader";
import { getSupabaseClient } from "@/lib/supabase";
import type { DashboardSummary, UserProfile } from "@/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const BIO_MAX = 280;
const FONT = "'Quicksand', ui-rounded, 'Nunito', sans-serif";

const INTENTIONS: {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}[] = [
  { id: "recall",     label: "Dream recall",         desc: "Remember more after waking",       icon: Compass,  color: "#64dfd0" },
  { id: "lucid",      label: "Lucid dreaming",       desc: "Practise in-dream awareness",      icon: Zap,      color: "#ffe082" },
  { id: "creative",   label: "Creative inspiration", desc: "Gather imagery for art & writing", icon: Feather,  color: "#5bb8ff" },
  { id: "reflection", label: "Self-reflection",      desc: "Notice inner patterns & feelings", icon: Heart,    color: "#ff9bb0" },
  { id: "curiosity",  label: "Pure curiosity",       desc: "Explore the mystery for fun",      icon: Sparkles, color: "#94adff" },
];

const RITUALS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "wake",   label: "Within 5 minutes of waking", icon: Clock3  },
  { id: "bed",    label: "While still cozy in bed",     icon: Moon    },
  { id: "coffee", label: "With morning coffee or tea",  icon: Coffee  },
  { id: "later",  label: "When a vivid scene strikes",  icon: Sunrise },
];

const RANKS = [
  { min: 0,  title: "Dream Initiate",    tier: "I",   color: "#ff9bb0" },
  { min: 3,  title: "Night Wanderer",    tier: "II",  color: "#94adff" },
  { min: 10, title: "Starlight Voyager", tier: "III", color: "#5bb8ff" },
  { min: 25, title: "Lucid Architect",   tier: "IV",  color: "#64dfd0" },
  { min: 50, title: "Astral Master",     tier: "V",   color: "#ffe082" },
];

function CartoonCloud({ className = "", fill = "#214685" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 220 90" fill="none" className={className} aria-hidden="true">
      <path
        d="M28 82H190C203.255 82 214 71.2548 214 58C214 45.792 204.88 35.7145 193.079 34.2016C189.261 18.0273 174.725 6 157.4 6C143.829 6 131.954 13.386 125.605 24.3374C119.994 19.7544 112.833 17 105 17C88.2355 17 74.4776 29.6691 72.6977 45.9597C68.8312 43.4557 64.2227 42 59.2727 42C45.315 42 34 53.315 34 67.2727C34 68.1986 34.0497 69.1128 34.1466 70.0131C23.5499 70.7222 15 74.5 15 78.5C15 80.9853 20.8203 82 28 82Z"
        fill={fill} stroke="#081326" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M135 22C141 14 149 11 158 11C170 11 181 18 186 29" stroke="rgba(255,255,255,0.18)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

function CartoonStar({ size = 14, color = "#ffe082", className = "" }: { size?: number; color?: string; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2C12.7 7.6 16.4 11.3 22 12C16.4 12.7 12.7 16.4 12 22C11.3 16.4 7.6 12.7 2 12C7.6 11.3 11.3 7.6 12 2Z"
        fill={color} stroke="#081326" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function Styles() {
  return (
    <style>{`
      .pcard {
        border: 2.5px solid #081326;
        box-shadow: 0 5px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,0.12);
      }
      .pbtn {
        display: inline-flex; align-items: center; justify-content: center;
        gap: .5rem; border: 2.5px solid #081326; border-radius: 1rem; font-weight: 800;
        transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
      }
      .pbtn:active:not(:disabled){ transform: translateY(2px); box-shadow: 0 1px 0 0 #081326; }
      .pbtn:disabled{ cursor: not-allowed; opacity:.6; }
      .pbtn-sky {
        background: #5bb8ff; color: #081326;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.45);
      }
      .pbtn-sky:hover:not(:disabled){
        background: #77c6ff; transform: translateY(-2px);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.55);
      }
      .pbtn-navy {
        background: #1c396e; color: #eef6ff;
        box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.13);
      }
      .pbtn-navy:hover:not(:disabled){
        background: #254887; transform: translateY(-2px);
        box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255,255,255,.2);
      }
      .pinput {
        width: 100%; border: 2.5px solid #081326; border-radius: .9rem;
        background: #0c1c38; color: #eef6ff; font-weight: 700;
        padding: .7rem 1rem; outline: none;
        transition: border-color .15s ease, box-shadow .15s ease;
      }
      .pinput:focus { border-color: #5bb8ff; box-shadow: 0 0 0 3px rgba(91,184,255,.22); }
      .pinput::placeholder { color: #5a7aaa; }
      .pchoice {
        cursor: pointer;
        transition: transform .14s ease, background .14s ease, border-color .14s ease;
      }
      .pchoice:hover { transform: translateY(-2px); }
      @keyframes ptwinkle {
        0%,100%{ opacity:.4; transform: scale(.85); }
        50%{ opacity:1; transform: scale(1.15); }
      }
      .ptwinkle { animation: ptwinkle 3s ease-in-out infinite; }
      @media(prefers-reduced-motion:reduce){
        .pbtn,.pchoice,.ptwinkle{ transition:none!important; animation:none!important; }
      }
    `}</style>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    display_name: "",
    bio: "",
    dream_intention: "recall",
    recall_habit: "wake",
  });

  function d<K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) {
    setDraft((p) => ({ ...p, [key]: val }));
  }

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const sb = getSupabaseClient();
        const [pr, sm, au] = await Promise.all([
          profileApi.get().catch(() => null),
          dashboardApi.summary().catch(() => null),
          sb ? sb.auth.getUser().catch(() => null) : null,
        ]);
        if (dead) return;
        setProfile(pr);
        setSummary(sm);
        setAuthUser(au?.data?.user ?? null);

        const name =
          pr?.display_name ||
          au?.data?.user?.user_metadata?.full_name ||
          au?.data?.user?.email?.split("@")[0] ||
          "";

        setDraft({
          display_name: name,
          bio: pr?.bio ?? "",
          dream_intention: pr?.dream_intention || "recall",
          recall_habit: pr?.recall_habit || "wake",
        });
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    if (!saveOk) return;
    const t = setTimeout(() => setSaveOk(false), 2500);
    return () => clearTimeout(t);
  }, [saveOk]);

  const displayName =
    profile?.display_name ||
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split("@")[0] ||
    "Dreamer";

  const initial = String(displayName).charAt(0).toUpperCase();
  const email = profile?.email || authUser?.email || null;
  const bio = profile?.bio || "";
  const intention = profile?.dream_intention || draft.dream_intention;
  const ritual = profile?.recall_habit || draft.recall_habit;
  const totalDreams = summary?.total_dreams ?? 0;

  const joinedLabel = useMemo(() => {
    const raw = profile?.created_at || authUser?.created_at;
    if (!raw) return null;
    const dt = new Date(raw);
    return isNaN(dt.getTime())
      ? null
      : dt.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [profile, authUser]);

  const rank = useMemo(() => {
    let idx = 0;
    RANKS.forEach((r, i) => { if (totalDreams >= r.min) idx = i; });
    return RANKS[idx];
  }, [totalDreams]);

  const activeIntention = INTENTIONS.find((i) => i.id === intention) || INTENTIONS[0];
  const activeRitual = RITUALS.find((r) => r.id === ritual) || RITUALS[0];

  function startEdit() {
    setEditing(true);
    setSaveErr(null);
    setSaveOk(false);
    setDraft({
      display_name: String(displayName),
      bio,
      dream_intention: intention,
      recall_habit: ritual,
    });
  }

  function cancelEdit() {
    setEditing(false);
    setSaveErr(null);
  }

  async function save() {
    if (!draft.display_name.trim()) {
      setSaveErr("A display name is required.");
      return;
    }
    setSaving(true);
    setSaveErr(null);
    try {
      const res = await profileApi.update({
        display_name: draft.display_name.trim(),
        bio: draft.bio.trim(),
        dream_intention: draft.dream_intention,
        recall_habit: draft.recall_habit,
      });
      setProfile(res);
      setEditing(false);
      setSaveOk(true);
      window.dispatchEvent(
        new CustomEvent("profile-updated", { detail: { display_name: res.display_name, profile: res } })
      );
    } catch (e: any) {
      setSaveErr(e?.message || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-4" style={{ fontFamily: FONT }}>
        <Styles />
        <DreamLoader variant="full" message="Gathering stardust…" />
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-[calc(100dvh-5.5rem)] w-full flex-col gap-4 text-[#eef6ff]"
      style={{ fontFamily: FONT }}
    >
      <Styles />

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#132952] shadow-[0_2px_0_0_#081326]">
            <UserRound size={16} className="text-[#7ac8ff]" strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Your dreamer profile
            </h1>
            <p className="text-xs font-semibold text-[#8fb2de]">
              Your identity, bio, and dream practice.
            </p>
          </div>
        </div>

        <Link href="/settings" className="pbtn pbtn-navy px-4 py-2.5 text-sm">
          <Settings size={15} /> Settings
        </Link>
      </header>

      <div className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
        {/* LEFT — identity, stretches with the right column */}
        <aside className="flex min-h-0">
          <section className="pcard relative flex w-full flex-col overflow-hidden rounded-[26px] bg-gradient-to-b from-[#1d3f78] via-[#162f5e] to-[#0e2040] p-5 text-center sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#5bb8ff]/15 blur-2xl" aria-hidden="true" />
            <CartoonCloud fill="#1f4280" className="pointer-events-none absolute -bottom-8 -left-8 w-36 opacity-70" />
            <CartoonStar size={15} color="#ffe082" className="ptwinkle pointer-events-none absolute right-6 top-6" />
            <CartoonStar size={10} color="#64dfd0" className="ptwinkle pointer-events-none absolute left-7 top-16" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="relative mx-auto mb-4 w-fit">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-3xl border-[3px] border-[#081326] text-4xl font-extrabold text-[#081326] shadow-[0_5px_0_0_#081326]"
                  style={{ background: `linear-gradient(135deg, ${rank.color}, ${rank.color}99)` }}
                >
                  {initial}
                </div>
                <span
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl border-[2.5px] border-[#081326] shadow-[0_2px_0_0_#081326]"
                  style={{ backgroundColor: rank.color }}
                  title={rank.title}
                >
                  <Award size={15} className="text-[#081326]" strokeWidth={2.6} />
                </span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <h2 className="break-words text-xl font-extrabold tracking-tight text-white [text-shadow:0_2px_0_#081326]">
                  {displayName}
                </h2>
                {!editing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#1c396e] text-[#cfe3fc] shadow-[0_2px_0_0_#081326] hover:bg-[#254887] hover:text-white"
                    aria-label="Edit profile"
                  >
                    <Pencil size={12} />
                  </button>
                )}
              </div>

              <div className="mt-3 flex flex-col items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#081326] bg-[#0e2040] px-3 py-1 text-[11px] font-extrabold shadow-[0_2px_0_0_#081326]"
                  style={{ color: rank.color }}
                >
                  <Award size={12} /> {rank.title}
                </span>
                {joinedLabel && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8fb2de]">
                    <Calendar size={12} className="text-[#ffe082]" /> Member since {joinedLabel}
                  </span>
                )}
              </div>

              <div className="my-5 h-[2px] w-full rounded-full bg-[#081326]/50" />

              <dl className="flex flex-col gap-2 text-left">
                <div className="flex items-center gap-2.5 rounded-xl border-2 border-[#081326] bg-[#0e2040] px-3 py-2.5">
                  <Mail size={14} className="shrink-0 text-[#7ac8ff]" />
                  <div className="min-w-0">
                    <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#7899c2]">Email</dt>
                    <dd className="truncate text-xs font-extrabold text-white">{email || "—"}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-xl border-2 border-[#081326] bg-[#0e2040] px-3 py-2.5">
                  <Lock size={14} className="shrink-0 text-[#64dfd0]" />
                  <div className="min-w-0">
                    <dt className="text-[9px] font-extrabold uppercase tracking-wider text-[#7899c2]">Privacy</dt>
                    <dd className="truncate text-xs font-extrabold text-white">Private journal</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-auto flex flex-col gap-2.5 pt-5">
                <button type="button" onClick={startEdit} className="pbtn pbtn-sky w-full px-4 py-2.5 text-sm">
                  <Edit3 size={15} /> Edit profile
                </button>
                <Link href="/settings" className="pbtn pbtn-navy w-full px-4 py-2.5 text-sm">
                  <Settings size={15} /> Account settings
                </Link>

                <div className="mt-1 flex items-start gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#0e2040]/80 p-3 text-left">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#081326] bg-[#64dfd0] shadow-[0_2px_0_0_#081326]">
                    <ShieldCheck size={14} className="text-[#081326]" strokeWidth={2.5} />
                  </span>
                  <p className="text-[11px] font-medium leading-relaxed text-[#a9c7ec]">
                    Your bio, preferences, and dreams stay private to your account.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* RIGHT — fills remaining width and height */}
        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          {saveOk && (
            <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border-2 border-[#081326] bg-[#64dfd0]/15 px-4 py-3 text-sm font-extrabold text-[#64dfd0]">
              <Check size={16} strokeWidth={3} /> Your profile was updated.
            </div>
          )}

          {editing ? (
            <section className="pcard flex min-h-0 flex-1 flex-col overflow-auto rounded-3xl bg-[#152c57] p-5 sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326]">
                    <Edit3 size={18} className="text-[#081326]" strokeWidth={2.5} />
                  </span>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">Edit profile</h2>
                    <p className="text-xs font-semibold text-[#8fb2de]">Everything here is private to your account.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#1c396e] text-[#cfe3fc] shadow-[0_2px_0_0_#081326] hover:bg-[#254887]"
                  aria-label="Close editor"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="grid flex-1 content-start gap-5">
                <div>
                  <label htmlFor="ed-name" className="mb-2 block text-sm font-extrabold text-[#cfe3fc]">Display name</label>
                  <input
                    id="ed-name"
                    value={draft.display_name}
                    onChange={(e) => d("display_name", e.target.value)}
                    className="pinput min-h-12 text-sm"
                    placeholder="Your dreamer name"
                    maxLength={32}
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="ed-bio" className="text-sm font-extrabold text-[#cfe3fc]">About you</label>
                    <span className="text-xs font-bold text-[#6a8ec4]">{draft.bio.length}/{BIO_MAX}</span>
                  </div>
                  <textarea
                    id="ed-bio"
                    value={draft.bio}
                    onChange={(e) => d("bio", e.target.value.slice(0, BIO_MAX))}
                    className="pinput min-h-36 flex-1 resize-y p-4 text-sm leading-relaxed"
                    placeholder="A few words about your dream world, your favourite symbols, or what you hope to discover here…"
                    maxLength={BIO_MAX}
                  />
                </div>

                <fieldset>
                  <legend className="mb-2.5 text-sm font-extrabold text-[#cfe3fc]">Dream intention</legend>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {INTENTIONS.map(({ id, label, desc, icon: Icon, color }) => {
                      const on = draft.dream_intention === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => d("dream_intention", id)}
                          className={`pchoice flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${on ? "shadow-[0_3px_0_0_#081326]" : "border-[#081326] bg-[#0e2040]"}`}
                          style={on ? { borderColor: color, backgroundColor: "#1d3b70" } : undefined}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326]" style={{ backgroundColor: on ? color : "#132952" }}>
                            <Icon size={16} style={{ color: on ? "#081326" : color }} strokeWidth={2.6} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-extrabold text-white">{label}</span>
                            <span className="block text-[10px] font-semibold text-[#9bc0ed]">{desc}</span>
                          </span>
                          {on && <Check size={16} className="text-[#64dfd0]" strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-2.5 text-sm font-extrabold text-[#cfe3fc]">Morning recall ritual</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {RITUALS.map(({ id, label, icon: Icon }) => {
                      const on = draft.recall_habit === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => d("recall_habit", id)}
                          className={`pchoice flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left ${on ? "border-[#64dfd0] bg-[#163b62] shadow-[0_3px_0_0_#081326]" : "border-[#081326] bg-[#0e2040]"}`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] ${on ? "bg-[#64dfd0] text-[#081326]" : "bg-[#1c396e] text-[#8fd0ff]"}`}>
                            {on ? <Check size={14} strokeWidth={3} /> : <Icon size={14} strokeWidth={2.5} />}
                          </span>
                          <span className="text-xs font-extrabold text-white">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {saveErr && (
                  <p role="alert" className="rounded-xl border-2 border-[#ff859d]/40 bg-[#ff859d]/10 px-4 py-3 text-sm font-bold text-[#ffd2db]">{saveErr}</p>
                )}

                <div className="mt-auto flex flex-wrap gap-3 border-t-2 border-[#081326]/40 pt-5">
                  <button type="button" onClick={save} disabled={saving} className="pbtn pbtn-sky px-6 py-3 text-sm">
                    {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Check size={16} strokeWidth={2.8} /> Save profile</>}
                  </button>
                  <button type="button" onClick={cancelEdit} disabled={saving} className="pbtn pbtn-navy px-5 py-3 text-sm">Cancel</button>
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="pcard flex min-h-0 flex-1 flex-col rounded-3xl bg-[#152c57] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326]">
                      <UserRound size={18} className="text-[#081326]" strokeWidth={2.5} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-white sm:text-lg">About you</h2>
                      <p className="text-xs font-semibold text-[#8fb2de]">A short note for your future self</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#081326] bg-[#1c396e] px-3 py-2 text-xs font-extrabold text-[#cfe3fc] shadow-[0_2px_0_0_#081326] hover:bg-[#254887]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                </div>

                {bio ? (
                  <p className="flex-1 rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-5 text-sm font-medium leading-relaxed text-[#cfe3fc]">
                    {bio}
                  </p>
                ) : (
                  <div className="flex flex-1 flex-col justify-center rounded-2xl border-2 border-dashed border-[#365783] bg-[#0e2040] p-6">
                    <p className="text-sm font-extrabold text-white">Your profile has room for a story.</p>
                    <p className="mt-1 max-w-lg text-xs font-medium leading-relaxed text-[#9bc0ed]">
                      Add a short bio about your dream practice, your favourite dream symbols,
                      or what you want to discover here.
                    </p>
                    <button
                      type="button"
                      onClick={startEdit}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#7ac8ff] hover:text-white"
                    >
                      Write your bio <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </section>

              <section className="pcard shrink-0 rounded-3xl bg-[#152c57] p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] shadow-[0_2px_0_0_#081326]">
                      <Compass size={18} className="text-[#081326]" strokeWidth={2.5} />
                    </span>
                    <div>
                      <h2 className="text-base font-extrabold text-white sm:text-lg">Dream practice</h2>
                      <p className="text-xs font-semibold text-[#8fb2de]">Your personal focus and morning routine</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#081326] bg-[#1c396e] px-3 py-2 text-xs font-extrabold text-[#cfe3fc] shadow-[0_2px_0_0_#081326] hover:bg-[#254887]"
                  >
                    <Pencil size={13} /> Adjust
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7899c2]">Intention</p>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]" style={{ backgroundColor: activeIntention.color }}>
                        <activeIntention.icon size={19} className="text-[#081326]" strokeWidth={2.5} />
                      </span>
                      <div>
                        <p className="text-sm font-extrabold text-white">{activeIntention.label}</p>
                        <p className="mt-0.5 text-[11px] font-medium text-[#9bc0ed]">{activeIntention.desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border-2 border-[#081326] bg-[#0e2040] p-4">
                    <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-[#7899c2]">Morning ritual</p>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-[#081326] shadow-[0_2px_0_0_#081326]">
                        <activeRitual.icon size={19} strokeWidth={2.5} />
                      </span>
                      <p className="text-sm font-extrabold leading-snug text-white">{activeRitual.label}</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}