"use client";

import type { ReactNode } from "react";

export default function AppTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="fade-in-scale h-full w-full flex-1 min-w-0">
      {children}
    </div>
  );
}

