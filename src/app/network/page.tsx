"use client";

import { CollectionSection } from "@/components/CollectionSection";
import { NeedConnection } from "@/components/NeedConnection";
import { Banner, PageHeader } from "@/components/ui";
import { useConnection } from "@/lib/connection";
import { interfaceSummary, itemKey, text } from "@/lib/format";

export default function NetworkPage() {
  const { connection, ready } = useConnection();
  if (ready && !connection) {
    return (
      <div className="stack">
        <PageHeader title="Network" subtitle="Interfaces and zones." />
        <NeedConnection />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title="Network" subtitle="Interfaces and the zones rules attach to." />
      <Banner tone="warn">Changing an interface address can disconnect you from the firewall. Open one only when you mean to edit it.</Banner>
      <CollectionSection
        title="Interfaces"
        path="/network/interfaces/network-interfaces"
        itemHref={(item) => `/edit?collection=${encodeURIComponent("/network/interfaces/network-interfaces")}&id=${encodeURIComponent(itemKey(item))}&caution=1`}
        meta={interfaceSummary}
      />
      <CollectionSection
        title="Zones"
        path="/network/zones"
        createHref="/network/zone"
        itemHref={(item) => `/network/zone?id=${encodeURIComponent(itemKey(item))}`}
        meta={(item) => text(item.type)}
      />
    </div>
  );
}
