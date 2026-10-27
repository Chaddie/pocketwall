"use client";

import { useSearchParams } from "next/navigation";
import { UserEditor } from "@/components/SimpleEditors";

export default function PersonEditPage() {
  const id = useSearchParams().get("id") || undefined;
  return <UserEditor id={id} />;
}
