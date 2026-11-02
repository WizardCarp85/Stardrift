"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, MobileTabBar, MobileHeader } from "@/components/Navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import DreamLoader from "@/components/DreamLoader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    async function initAuth() {
      // If returning with an email confirmation / magic link code in URL, exchange it first
      const search = typeof window !== "undefined" ? window.location.search : "";
      const code = new URLSearchParams(search).get("code");
      if (code && supabase) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
        } catch (err) {
          console.warn("Could not exchange code:", err);
        }
      }

      const res = await supabase.auth.getSession();
      if (!res.data.session) {
        router.push("/sign-in");
      } else {
        setLoading(false);
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      if (!session) {
        router.push("/sign-in");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading && isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <DreamLoader variant="full" message="Loading journal…" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <main
          className="app-content flex-1 fade-up"
          style={{ marginLeft: 0 }}
        >
          {children}
        </main>
      </div>
      <MobileTabBar />
      <style>{`
        .app-content {
          margin-left: 0 !important;
        }
      `}</style>
    </div>
  );
}
