import type { Metadata } from "next";
import { NewDreamClient } from "@/components/NewDreamClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Record Dream — Stardrift",
  description: "Record a new dream entry via voice, text, or file import in your private dream journal",
};

export default function NewDreamPage() {
  return <NewDreamClient />;
}
