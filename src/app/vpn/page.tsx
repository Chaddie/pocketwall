"use client";

import { CollectionSection } from "@/components/CollectionSection";
import { NeedConnection } from "@/components/NeedConnection";
import { PageHeader } from "@/components/ui";
import { useConnection } from "@/lib/connection";
import { itemKey, text } from "@/lib/format";

function editHref(collection: string, id: string) {
  return `/edit?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(id)}`;
}

export default function VpnPage() {
  const { connection, ready } = useConnection();
  if (ready && !connection) {
    return (
      <div className="stack">
        <PageHeader title="VPN" subtitle="Site-to-site tunnels and remote access." />
        <NeedConnection />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title="VPN" subtitle="IPsec tunnels and SSL VPN remote access." />
      <CollectionSection title="Policy-based IPsec" path="/ipsec-vpn/site-to-site/connections/policy-based/ipv4" createHref={`/edit?collection=${encodeURIComponent("/ipsec-vpn/site-to-site/connections/policy-based/ipv4")}`} itemHref={(item) => editHref("/ipsec-vpn/site-to-site/connections/policy-based/ipv4", itemKey(item))} meta={(item) => text(item.description)} />
      <CollectionSection title="Route-based IPsec" path="/ipsec-vpn/site-to-site/connections/route-based/ipv4" createHref={`/edit?collection=${encodeURIComponent("/ipsec-vpn/site-to-site/connections/route-based/ipv4")}`} itemHref={(item) => editHref("/ipsec-vpn/site-to-site/connections/route-based/ipv4", itemKey(item))} meta={(item) => text(item.description)} />
      <CollectionSection title="SSL VPN remote access" path="/ssl-vpn/remote-access/policies" createHref={`/edit?collection=${encodeURIComponent("/ssl-vpn/remote-access/policies")}`} itemHref={(item) => editHref("/ssl-vpn/remote-access/policies", itemKey(item))} meta={(item) => text(item.description)} />
    </div>
  );
}
