"use client";

import { useSearchParams } from "next/navigation";
import { ZoneEditor } from "@/components/SimpleEditors";

export default function ZonePage() {
  const id = useSearchParams().get("id") || undefined;
  return <ZoneEditor id={id} />;
}
