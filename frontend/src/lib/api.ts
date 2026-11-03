/**
 * API client for the Stardrift Django backend.
 * All calls go to NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:8000).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

import { getSupabaseClient } from "./supabase";

async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        return data.session.access_token;
      }
    }
    // Fallback search in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      if (key.includes("auth-token") || key.includes("supabase")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          const token = parsed?.access_token || parsed?.session?.access_token;
          if (token) return token;
        }
      }
    }
  } catch {
    // ignore
  }
  return null;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const rawText = await res.text();
    let message = `API ${res.status}`;
    let code: string | undefined;
    try {
      const parsed = JSON.parse(rawText);
      if (parsed?.error) message = parsed.error;
      if (parsed?.code) code = parsed.code;
    } catch {
      if (rawText) message = rawText;
    }
    const err = new Error(message) as Error & { code?: string; status?: number };
    err.code = code;
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Dreams ──────────────────────────────────────────────────────────────────

export type DreamsFilter = {
  type?: string;
  mood?: string;
  q?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
};

export const dreamsApi = {
  list: (filters: DreamsFilter = {}) => {
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.mood) params.set("mood", filters.mood);
    if (filters.q) params.set("q", filters.q);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    if (filters.page) params.set("page", String(filters.page));
    const qs = params.toString();
    return apiFetch<{ count: number; results: import("@/types").Dream[]; next: string | null; previous: string | null }>(
      `/dreams/${qs ? `?${qs}` : ""}`
    );
  },

  get: (id: string) => apiFetch<import("@/types").Dream>(`/dreams/${id}/`),

  create: (data: import("@/types").DreamFormData) =>
    apiFetch<import("@/types").Dream>("/dreams/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<import("@/types").DreamFormData>) =>
    apiFetch<import("@/types").Dream>(`/dreams/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<void>(`/dreams/${id}/`, { method: "DELETE" }),
};

// ── Dashboard & Patterns ─────────────────────────────────────────────────────

export const dashboardApi = {
  summary: () => apiFetch<import("@/types").DashboardSummary>("/dashboard/summary/"),
};

export const patternsApi = {
  overview: (days?: number) =>
    apiFetch<import("@/types").PatternsOverview>(
      `/patterns/overview/${days ? `?days=${days}` : ""}`
    ),
  generateInsight: () =>
    apiFetch<import("@/types").Insight>("/patterns/insight/", { method: "POST" }),
};

// ── Auth sync ────────────────────────────────────────────────────────────────

export const authApi = {
  sync: (user: { id: string; email: string; user_metadata?: Record<string, unknown> }) =>
    apiFetch<import("@/types").UserProfile>("/auth/sync/", {
      method: "POST",
      body: JSON.stringify(user),
    }),
};

// ── Settings / Profile ───────────────────────────────────────────────────────

export const profileApi = {
  get: () => apiFetch<import("@/types").UserProfile>("/settings/profile/"),
  update: (data: Partial<import("@/types").UserProfile>) =>
    apiFetch<import("@/types").UserProfile>("/settings/profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: () => apiFetch<void>("/settings/profile/", { method: "DELETE" }),
};

// ── File Import ─────────────────────────────────────────────────────────────

export const importApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetch<import("@/types").ImportPreviewResponse>("/import/", {
      method: "POST",
      body: formData,
    });
  },
};

export default apiFetch;
