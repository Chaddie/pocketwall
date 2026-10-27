"use client";

import { useState } from "react";
import { CollectionSection } from "@/components/CollectionSection";
import { NeedConnection } from "@/components/NeedConnection";
import { PageHeader, Segmented } from "@/components/ui";
import { useConnection } from "@/lib/connection";
import { hostSummary, itemKey, serviceSummary } from "@/lib/format";

export default function ObjectsPage() {
  const { connection, ready } = useConnection();
  const [tab, setTab] = useState("hosts");
  if (ready && !connection) {
    return (
      <div className="stack">
        <PageHeader title="Objects" subtitle="Hosts, domains, and services used by rules." />
        <NeedConnection />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title="Objects" subtitle="The building blocks a rule can match." />
      <Segmented
        label="Show"
        value={tab}
        onChange={setTab}
        options={[
          { value: "hosts", label: "Hosts" },
          { value: "fqdn", label: "FQDN" },
          { value: "services", label: "Services" },
        ]}
      />
      {tab === "hosts" ? (
        <>
          <CollectionSection title="IPv4 hosts" path="/network/addresses/ipv4" createHref="/objects/edit?kind=host" itemHref={(item) => `/objects/edit?kind=host&id=${encodeURIComponent(itemKey(item))}`} meta={hostSummary} />
          <CollectionSection title="IPv6 hosts" path="/network/addresses/ipv6" createHref="/objects/edit?kind=host6" itemHref={(item) => `/objects/edit?kind=host6&id=${encodeURIComponent(itemKey(item))}`} meta={hostSummary} />
        </>
      ) : null}
      {tab === "fqdn" ? (
        <CollectionSection title="FQDN hosts" path="/network/addresses/fqdn" createHref="/objects/edit?kind=fqdn" itemHref={(item) => `/objects/edit?kind=fqdn&id=${encodeURIComponent(itemKey(item))}`} meta={(item) => String(item.fqdn ?? "")} />
      ) : null}
      {tab === "services" ? (
        <CollectionSection title="Services" path="/network/services" createHref="/objects/edit?kind=service" itemHref={(item) => `/objects/edit?kind=service&id=${encodeURIComponent(itemKey(item))}`} meta={serviceSummary} />
      ) : null}
    </div>
  );
}
