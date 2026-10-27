"use client";

import { useSearchParams } from "next/navigation";
import { FqdnEditor, HostEditor, ServiceEditor } from "@/components/SimpleEditors";

export default function ObjectEditPage() {
  const params = useSearchParams();
  const kind = params.get("kind") || "host";
  const id = params.get("id") || undefined;
  if (kind === "fqdn") return <FqdnEditor id={id} />;
  if (kind === "service") return <ServiceEditor id={id} />;
  if (kind === "host6") return <HostEditor family="ipv6" id={id} />;
  return <HostEditor family="ipv4" id={id} />;
}
