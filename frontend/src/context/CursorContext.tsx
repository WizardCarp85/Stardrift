"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { StardriftCursor } from "@/components/StardriftCursor";
import { CursorStudioModal } from "@/components/CursorStudioModal";

export type CursorVariant = "starlight-pointer" | "astral-dot" | "crescent-moon";
export type CursorAccent = "sky" | "gold" | "mint" | "lavender";

export interface CursorSettings {
  variant: CursorVariant;
  showTrailRing: boolean;
  clickSparkles: boolean;
  magneticSnap: boolean;
  ringSize: number;
}

export const DEFAULT_CURSOR_SETTINGS: CursorSettings = {
  variant: "starlight-pointer",
  showTrailRing: true,
  clickSparkles: true,
  magneticSnap: true,
  ringSize: 28,
};

const STORAGE_KEY = "stardrift_cursor_settings";

interface CursorContextType {
  settings: CursorSettings;
  updateSettings: (partial: Partial<CursorSettings>) => void;
  setSettings: (settings: CursorSettings) => void;
  isStudioOpen: boolean;
  openStudio: () => void;
  closeStudio: () => void;
}

const CursorContext = createContext<CursorContextType | undefined>(undefined);

export function CursorProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<CursorSettings>(DEFAULT_CURSOR_SETTINGS);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.variant === "css-native") {
          parsed.variant = "starlight-pointer";
        }
        setSettingsState((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setSettings = useCallback((next: CursorSettings) => {
    setSettingsState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const updateSettings = useCallback((partial: Partial<CursorSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const openStudio = useCallback(() => setIsStudioOpen(true), []);
  const closeStudio = useCallback(() => setIsStudioOpen(false), []);

  return (
    <CursorContext.Provider
      value={{
        settings,
        updateSettings,
        setSettings,
        isStudioOpen,
        openStudio,
        closeStudio,
      }}
    >
      {children}
      {mounted && <StardriftCursor settings={settings} />}
      {mounted && (
        <CursorStudioModal
          isOpen={isStudioOpen}
          onClose={closeStudio}
          settings={settings}
          onChange={setSettings}
        />
      )}
    </CursorContext.Provider>
  );
}

export function useCursor() {
  const ctx = useContext(CursorContext);
  if (!ctx) {
    throw new Error("useCursor must be used within a CursorProvider");
  }
  return ctx;
}

