"use client";

import { useSearchParams } from "next/navigation";
import { NatEditor } from "@/components/SimpleEditors";

export default function NatEditPage() {
  const params = useSearchParams();
  const family = params.get("family") === "ipv6" ? "ipv6" : "ipv4";
  const id = params.get("id") || undefined;
  return <NatEditor family={family} id={id} />;
}
