"use client";

import { Mic, Feather, Tag, Upload, LucideIcon } from "lucide-react";

interface TipItem {
  icon: LucideIcon;
  bg: string;
  title: string;
  desc: string;
  badge?: string;
}

export const NEW_DREAM_TIPS: TipItem[] = [
  {
    icon: Mic,
    bg: "#ffe082",
    title: "Speak it out",
    desc: "Speak while still half-awake — voice dictation captures fleeting details instantly.",
  },
  {
    icon: Upload,
    bg: "#b89eff",
    title: "Import a file",
    desc: "Upload a .txt, .docx, or .pdf to auto-extract your dream title, date, and body notes.",
    badge: "New",
  },
  {
    icon: Feather,
    bg: "#5bb8ff",
    title: "Edit freely",
    desc: "Touch up words, add a title, or polish fragments anytime.",
  },
  {
    icon: Tag,
    bg: "#64dfd0",
    title: "Tag the mood",
    desc: "Moods and themes power your subconscious pattern map.",
  },
];

export function NewDreamTips() {
  function handleCardClick(title: string) {
    if (title === "Import a file") {
      const dropzone = document.querySelector('[aria-label="File import area"]') as HTMLElement | null;
      if (dropzone) {
        dropzone.scrollIntoView({ behavior: "smooth", block: "center" });
        dropzone.click();
      }
    }
  }

  return (
    <section className="grid w-full shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {NEW_DREAM_TIPS.map(({ icon: Icon, bg, title, desc, badge }, idx) => {
        const isImport = title === "Import a file";
        return (
          <div
            key={title}
            onClick={() => handleCardClick(title)}
            role={isImport ? "button" : undefined}
            tabIndex={isImport ? 0 : undefined}
            aria-label={isImport ? "Go to file import" : undefined}
            onKeyDown={(e) => {
              if (isImport && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleCardClick(title);
              }
            }}
            className={`jr-card jr-lift fade-in-scale relative flex flex-col gap-2 rounded-2xl bg-[#152c57] p-4 stagger-${idx + 1} ${
              isImport ? "cursor-pointer hover:border-[#b89eff]/60 transition-all duration-200" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#081326] shadow-[0_2px_0_0_#081326]"
                style={{ backgroundColor: bg }}
              >
                <Icon size={18} className="text-[#081326]" strokeWidth={2.5} />
              </span>
              {badge && (
                <span className="rounded-full border border-[#081326] bg-[#64dfd0] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#081326] shadow-[0_1.5px_0_0_#081326]">
                  {badge}
                </span>
              )}
            </div>
            <h2 className="text-sm font-extrabold text-white">{title}</h2>
            <p className="text-xs font-semibold leading-relaxed text-[#9bc0ed]">{desc}</p>
          </div>
        );
      })}
    </section>
  );
}
