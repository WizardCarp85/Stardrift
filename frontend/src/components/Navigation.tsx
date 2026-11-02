"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Plus,
  Mic,
  Sparkles,
  User as UserIcon,
  Settings,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase";
import { profileApi } from "@/lib/api";
import type { User } from "@supabase/supabase-js";

const BRAND = { first: "Star", second: "drift" };
const SIDEBAR_STORAGE_KEY = "dream-sidebar-collapsed";

interface NavItem {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  accent: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    icon: LayoutDashboard,
    accent: "#5bb8ff", // Sky Blue
  },
  {
    href: "/journal",
    label: "Dream Journal",
    shortLabel: "Journal",
    icon: BookOpen,
    accent: "#64dfd0", // Starlight Aqua
  },
  {
    href: "/patterns",
    label: "Patterns",
    shortLabel: "Patterns",
    icon: Sparkles,
    accent: "#94adff", // Periwinkle
  },
  {
    href: "/profile",
    label: "Profile",
    shortLabel: "Profile",
    icon: UserIcon,
    accent: "#ff9bb0", // Starlight Pink / Dreamer
  },
  {
    href: "/settings",
    label: "Settings",
    shortLabel: "Settings",
    icon: Settings,
    accent: "#ffe082", // Crescent Moon Gold
  },
];

function MiniSparkle({
  size = 11,
  color = "#ffe082",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 2C12.7 7.6 16.4 11.3 22 12C16.4 12.7 12.7 16.4 12 22C11.3 16.4 7.6 12.7 2 12C7.6 11.3 11.3 7.6 12 2Z"
        fill={color}
        stroke="#081326"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarCloud({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 74H194C206.15 74 216 64.1503 216 52C216 40.81 207.64 31.57 196.82 30.18C193.32 15.35 180 4 164.1 4C151.66 4 140.78 10.77 134.96 20.81C129.82 16.61 123.25 14 116 14C100.63 14 88.02 25.61 86.39 40.55C82.84 38.25 78.62 36.9 74.08 36.9C61.29 36.9 50.9 47.29 50.9 60.08C50.9 60.93 50.95 61.77 51.03 62.6C41.32 63.25 10 66.5 10 70.5C10 72.78 14.48 74 20 74Z"
        fill="#173260"
        stroke="#081326"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Restore user's collapsed preference after mount (hydration-safe)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === "true") setCollapsed(true);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  // Load current user for the profile dock
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth
      .getSession()
      .then((res: { data: { session: { user: User } | null } }) => {
        setUser(res.data.session?.user ?? null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      const s = session as { user: User } | null;
      setUser(s?.user ?? null);
    });

    profileApi
      .get()
      .then((p) => {
        if (p?.display_name) setProfileName(p.display_name);
      })
      .catch(() => {});

    function onProfileUpdated(event: Event) {
      const custom = event as CustomEvent<{ display_name?: string }>;
      if (custom.detail?.display_name) {
        setProfileName(custom.detail.display_name);
      }
    }

    window.addEventListener("profile-updated", onProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
  }

  async function handleSignOut() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.push("/sign-in");
      return;
    }
    setSigningOut(true);
    await supabase.auth.signOut();
    setSigningOut(false);
    router.push("/");
  }

  const isNewDreamPage = pathname === "/journal/new";

  const isRouteActive = (href: string) => {
    if (href === "/journal") {
      return (
        pathname === "/journal" ||
        (pathname?.startsWith("/journal/") && !isNewDreamPage)
      );
    }
    return pathname === href || Boolean(pathname?.startsWith(href + "/"));
  };

  const displayName =
    profileName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Dreamer";

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <aside
      className={`sidebar cartoon-sidebar hidden md:flex flex-col shrink-0 select-none ${
        collapsed ? "collapsed" : ""
      }`}
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <style>{`
        .sidebar.cartoon-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 256px;
          flex-shrink: 0;
          background: linear-gradient(180deg, #0d1d3a 0%, #132952 52%, #0c1b36 100%);
          border-right: 3px solid #081326;
          box-shadow: 4px 0 0 0 rgba(8, 19, 38, 0.35), inset -1px 0 0 0 rgba(255, 255, 255, 0.08);
          transition: width 0.24s cubic-bezier(0.34, 1.3, 0.64, 1);
          overflow: visible;
          z-index: 30;
        }

        .sidebar.cartoon-sidebar.collapsed {
          width: 84px;
        }

        @media (max-width: 767px) {
          .sidebar.cartoon-sidebar {
            display: none !important;
          }
        }

        .cartoon-cta-new {
          border: 2.5px solid #081326;
          box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.45);
          transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
        }

        .cartoon-cta-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.55);
        }

        .cartoon-cta-new:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 0 #081326;
        }

        .cartoon-nav-link {
          border: 2.5px solid transparent;
          transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .cartoon-nav-link:hover:not(.is-active) {
          background-color: rgba(27, 56, 107, 0.75);
          border-color: rgba(8, 19, 38, 0.65);
          transform: translateX(2px);
        }

        .cartoon-nav-link.is-active {
          background-color: #1c3b73;
          border-color: #081326;
          box-shadow: 0 4px 0 0 #081326, inset 0 2px 0 0 rgba(255, 255, 255, 0.18);
        }

        @media (prefers-reduced-motion: reduce) {
          .sidebar.cartoon-sidebar,
          .cartoon-cta-new,
          .cartoon-nav-link {
            transition: none !important;
          }
        }
      `}</style>

      {/* Floating Edge Collapse Toggle Badge */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="absolute -right-3.5 top-7 z-40 flex h-7 w-7 items-center justify-center rounded-full border-[2.5px] border-[#081326] bg-[#1e3d75] text-[#eef6ff] shadow-[0_3px_0_0_#081326] hover:bg-[#5bb8ff] hover:text-[#081326] active:translate-y-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={15} strokeWidth={2.8} />
        ) : (
          <ChevronLeft size={15} strokeWidth={2.8} />
        )}
      </button>

      {/* Top Ambient Night-Sky Header */}
      <div className="relative px-4 pt-5 pb-3 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-10 left-1/2 h-28 w-44 -translate-x-1/2 rounded-full blur-2xl"
          style={{
            background:
              "radial-gradient(circle, rgba(91,184,255,0.22) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        {!collapsed && (
          <>
            <MiniSparkle
              size={11}
              color="#ffe082"
              className="pointer-events-none absolute right-5 top-4 opacity-80"
            />
            <MiniSparkle
              size={9}
              color="#8fd0ff"
              className="pointer-events-none absolute right-12 top-11 opacity-65"
            />
          </>
        )}

        <Link
          href="/"
          className={`group relative z-10 flex items-center gap-3 rounded-2xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] bg-[#5bb8ff] shadow-[0_3px_0_0_#081326] group-hover:-rotate-6 transition-transform overflow-hidden">
            <Image
              src="/logo.png"
              alt="Stardrift logo"
              width={44}
              height={44}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <span className="block truncate text-lg font-extrabold tracking-tight text-white leading-tight">
                {BRAND.first}
                <span className="text-[#6bc2ff]">{BRAND.second}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8cb2e0]">
                Nightbook
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Primary Action: Record a Dream */}
      <div className="px-3.5 pt-2 pb-4">
        <Link
          href="/journal/new"
          aria-current={isNewDreamPage ? "page" : undefined}
          className={`group relative flex items-center rounded-2xl cartoon-cta-new focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082] ${
            isNewDreamPage
              ? "bg-[#ffe082] text-[#081326]"
              : "bg-[#5bb8ff] hover:bg-[#74c5ff] text-[#081326]"
          } ${collapsed ? "h-12 w-12 mx-auto justify-center" : "gap-3 px-3.5 py-2.5"}`}
        >
          <span
            className={`flex shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326] transition-transform group-hover:scale-105 ${
              isNewDreamPage ? "bg-white" : "bg-[#ffe082]"
            } ${collapsed ? "h-8 w-8 border-none shadow-none bg-transparent" : "h-9 w-9"}`}
          >
            <Mic size={19} className="text-[#081326]" strokeWidth={2.6} />
          </span>

          {!collapsed && (
            <div className="min-w-0 text-left">
              <span className="block text-sm font-extrabold leading-tight text-[#081326]">
                Record a Dream
              </span>
              <span className="block truncate text-[11px] font-bold text-[#081326]/75">
                {isNewDreamPage ? "Recording…" : "Voice first or write"}
              </span>
            </div>
          )}

          {/* Collapsed Hover Sticker Tooltip */}
          {collapsed && (
            <span
              role="tooltip"
              className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border-2 border-[#081326] bg-[#ffe082] px-3 py-1.5 text-xs font-extrabold text-[#081326] shadow-[0_3px_0_0_#081326] z-50"
            >
              Record a Dream
            </span>
          )}
        </Link>
      </div>

      {/* Section Divider / Label */}
      <div className="px-5 pb-2">
        {collapsed ? (
          <div className="h-[2px] w-full rounded-full bg-[#081326]/70" />
        ) : (
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#7ea4d4]">
            Explore
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <nav
        aria-label="Primary navigation"
        className="flex-1 px-3 py-1 flex flex-col gap-2"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = isRouteActive(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center rounded-2xl cartoon-nav-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082] ${
                active ? "is-active" : ""
              } ${collapsed ? "h-12 w-12 mx-auto justify-center" : "gap-3 px-2.5 py-2"}`}
            >
              {/* Color-Coded Icon Tile */}
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: active ? accent : "#0e2040",
                  boxShadow: active ? "0 2px 0 0 #081326" : "none",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={2.4}
                  style={{ color: active ? "#081326" : accent }}
                />
              </span>

              {!collapsed && (
                <>
                  <span
                    className={`flex-1 truncate text-sm ${
                      active
                        ? "font-extrabold text-white"
                        : "font-bold text-[#bed6f5] group-hover:text-white"
                    }`}
                  >
                    {label}
                  </span>

                  {active && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full border-[1.5px] border-[#081326]"
                      style={{ backgroundColor: accent }}
                      aria-hidden="true"
                    />
                  )}
                </>
              )}

              {/* Collapsed Hover Sticker Tooltip */}
              {collapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border-2 border-[#081326] bg-[#162e59] px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#081326] z-50"
                >
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Atmospheric Cloud + Dreamer Profile Pod */}
      <div className="relative mt-auto px-3 pb-4 pt-6">
        {!collapsed && (
          <SidebarCloud className="pointer-events-none absolute -top-3 left-2 right-2 w-[92%] opacity-60" />
        )}

        <div
          className={`group relative z-10 rounded-2xl border-[2.5px] border-[#081326] bg-[#0f2040] shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.08)] ${
            collapsed ? "p-2 flex flex-col items-center gap-2" : "p-3 flex items-center gap-2.5"
          }`}
        >
          {/* User Cartoon Badge & Profile Link */}
          {collapsed ? (
            <Link
              href="/profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-sm font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326] hover:scale-105 active:scale-95 transition-transform"
              title={`View Profile: ${displayName}`}
            >
              {userInitial}
            </Link>
          ) : (
            <Link
              href="/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
              title="Open Dreamer Profile"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#64dfd0] text-sm font-extrabold text-[#081326] shadow-[0_2px_0_0_#081326]"
              >
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-white">
                  {displayName}
                </p>
                <p className="truncate text-[11px] font-semibold text-[#8cb2e0]">
                  {user?.email ?? "Personal sanctuary"}
                </p>
              </div>
            </Link>
          )}

          {collapsed && (
            <span
              role="tooltip"
              className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-150 absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-xl border-2 border-[#081326] bg-[#162e59] px-3 py-1.5 text-xs font-extrabold text-white shadow-[0_3px_0_0_#081326] z-50"
            >
              {displayName}
            </span>
          )}

          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-transparent text-[#9bc0ed] hover:border-[#081326] hover:bg-[#1c396e] hover:text-[#ff9bb0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={15} strokeWidth={2.4} />
            </button>
          ) : (
            <Link
              href="/sign-in"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-transparent text-[#9bc0ed] hover:border-[#081326] hover:bg-[#1c396e] hover:text-[#6bc2ff] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
              aria-label="Sign in"
              title="Sign in"
            >
              <LogIn size={15} strokeWidth={2.4} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  const isNewDreamPage = pathname === "/journal/new";

  const isTabActive = (href: string) => {
    if (href === "/journal") {
      return (
        pathname === "/journal" ||
        (pathname?.startsWith("/journal/") && !isNewDreamPage)
      );
    }
    return pathname === href || Boolean(pathname?.startsWith(href + "/"));
  };

  const leftTabs = NAV_ITEMS.slice(0, 2);
  const rightTabs = NAV_ITEMS.slice(2, 4);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3 pt-2 pointer-events-none md:hidden"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif",
      }}
    >
      <nav
        aria-label="Mobile navigation"
        className="pointer-events-auto mx-auto max-w-md rounded-3xl border-[2.5px] border-[#081326] bg-[#132952]/95 backdrop-blur-md px-2 py-1.5 shadow-[0_6px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.16)] grid grid-cols-5 items-end"
      >
        {/* Left 2 Tabs: Home & Journal */}
        {leftTabs.map(({ href, shortLabel, icon: Icon, accent }) => {
          const active = isTabActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1 py-1 rounded-2xl active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
            >
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
                  active
                    ? "border-2 border-[#081326] shadow-[0_2px_0_0_#081326] -translate-y-0.5"
                    : "border-2 border-transparent"
                }`}
                style={{
                  backgroundColor: active ? accent : "transparent",
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={2.4}
                  style={{ color: active ? "#081326" : "#9bc0ed" }}
                />
              </span>
              <span
                className={`text-[11px] leading-none ${
                  active ? "font-extrabold text-white" : "font-bold text-[#9bc0ed]"
                }`}
              >
                {shortLabel}
              </span>
            </Link>
          );
        })}

        {/* Raised Center Cartoon Medallion: Voice Record Dream */}
        <div className="flex flex-col items-center justify-end">
          <Link
            href="/journal/new"
            aria-label="Record a new dream"
            aria-current={isNewDreamPage ? "page" : undefined}
            className="group flex flex-col items-center gap-1 focus-visible:outline-none"
          >
            <span
              className={`-mt-7 flex h-13 w-13 items-center justify-center rounded-2xl border-[2.5px] border-[#081326] shadow-[0_4px_0_0_#081326,inset_0_2px_0_0_rgba(255,255,255,0.45)] active:translate-y-1 active:shadow-[0_1px_0_0_#081326] transition-all ${
                isNewDreamPage
                  ? "bg-[#ffe082] text-[#081326]"
                  : "bg-[#5bb8ff] text-[#081326]"
              }`}
              style={{ width: "52px", height: "52px" }}
            >
              <Mic size={24} strokeWidth={2.6} />
            </span>
            <span
              className={`pb-1 text-[11px] leading-none ${
                isNewDreamPage
                  ? "font-extrabold text-[#ffe082]"
                  : "font-extrabold text-[#7ac8ff]"
              }`}
            >
              Record
            </span>
          </Link>
        </div>

        {/* Right 2 Tabs: Patterns & Settings */}
        {rightTabs.map(({ href, shortLabel, icon: Icon, accent }) => {
          const active = isTabActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-1 py-1 rounded-2xl active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffe082]"
            >
              <span
                className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
                  active
                    ? "border-2 border-[#081326] shadow-[0_2px_0_0_#081326] -translate-y-0.5"
                    : "border-2 border-transparent"
                }`}
                style={{
                  backgroundColor: active ? accent : "transparent",
                }}
              >
                <Icon
                  size={19}
                  strokeWidth={2.4}
                  style={{ color: active ? "#081326" : "#9bc0ed" }}
                />
              </span>
              <span
                className={`text-[11px] leading-none ${
                  active ? "font-extrabold text-white" : "font-bold text-[#9bc0ed]"
                }`}
              >
                {shortLabel}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    supabase.auth
      .getSession()
      .then((res: { data: { session: { user: User } | null } }) => {
        setUser(res.data.session?.user ?? null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      const s = session as { user: User } | null;
      setUser(s?.user ?? null);
    });

    profileApi
      .get()
      .then((p) => {
        if (p?.display_name) setProfileName(p.display_name);
      })
      .catch(() => {});

    function onProfileUpdated(event: Event) {
      const custom = event as CustomEvent<{ display_name?: string }>;
      if (custom.detail?.display_name) {
        setProfileName(custom.detail.display_name);
      }
    }

    window.addEventListener("profile-updated", onProfileUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("profile-updated", onProfileUpdated);
    };
  }, []);

  const displayName =
    profileName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Dreamer";

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 border-b-[2.5px] border-[#081326] bg-[#0d1d3a]/95 backdrop-blur-md shadow-[0_3px_0_0_#081326]"
      style={{ fontFamily: "'Quicksand', ui-rounded, 'Nunito', sans-serif" }}
    >
      <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#081326] bg-[#5bb8ff] shadow-[0_2px_0_0_#081326] overflow-hidden">
          <Image
            src="/logo.png"
            alt="Stardrift logo"
            width={36}
            height={36}
            className="h-full w-full object-contain p-0.5"
            priority
          />
        </div>
        <span className="text-base font-extrabold text-white">
          Star<span className="text-[#6bc2ff]">drift</span>
        </span>
      </Link>

      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-xl border-2 border-[#081326] bg-[#0f2040] px-2.5 py-1.5 shadow-[0_2px_0_0_#081326] active:translate-y-0.5 transition-transform"
        title={`Profile: ${displayName}`}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg border-[1.5px] border-[#081326] bg-[#64dfd0] text-xs font-black text-[#081326]">
          {userInitial}
        </div>
        <span className="max-w-[120px] truncate text-xs font-bold text-white">
          {displayName}
        </span>
      </Link>
    </header>
  );
}