"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CollectionSection } from "@/components/CollectionSection";
import { NeedConnection } from "@/components/NeedConnection";
import { PageHeader, Segmented } from "@/components/ui";
import { useConnection } from "@/lib/connection";
import { itemKey, text } from "@/lib/format";

export default function NatPage() {
  const router = useRouter();
  const family = useSearchParams().get("family") === "ipv6" ? "ipv6" : "ipv4";
  const { connection, ready } = useConnection();
  if (ready && !connection) {
    return (
      <div className="stack">
        <PageHeader title="NAT" subtitle="How traffic is translated." />
        <NeedConnection />
      </div>
    );
  }
  const path = `/nat/rules/${family}`;
  return (
    <div className="stack">
      <PageHeader title="NAT" subtitle="Outbound masquerade is the change most networks need." />
      <Segmented label="IP family" value={family} onChange={(value) => router.push(value === "ipv6" ? "/nat?family=ipv6" : "/nat")} options={[{ value: "ipv4", label: "IPv4" }, { value: "ipv6", label: "IPv6" }]} />
      <CollectionSection
        title={`${family.toUpperCase()} NAT rules`}
        path={path}
        createHref={`/nat/edit?family=${family}`}
        itemHref={(item) => `/nat/edit?family=${family}&id=${encodeURIComponent(itemKey(item))}`}
        meta={(item) => (item.enabled === false ? "Off" : text(item.description) || "Enabled")}
      />
    </div>
  );
}
