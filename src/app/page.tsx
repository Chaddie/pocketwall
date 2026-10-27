"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConnectForm } from "@/components/ConnectForm";
import { Banner, PageHeader, Skeletons } from "@/components/ui";
import { sophos } from "@/lib/api";
import { useConnection } from "@/lib/connection";
import { asList, errorMessage, text } from "@/lib/format";

const tiles = [
  { href: "/rules", label: "Rules", path: "/firewall/rules/ipv4" },
  { href: "/nat", label: "NAT", path: "/nat/rules/ipv4" },
  { href: "/objects", label: "Hosts", path: "/network/addresses/ipv4" },
  { href: "/objects", label: "Services", path: "/network/services" },
  { href: "/network", label: "Zones", path: "/network/zones" },
  { href: "/network", label: "Interfaces", path: "/network/interfaces/network-interfaces" },
  { href: "/people", label: "Users", path: "/authentication/users/network-users" },
  { href: "/web", label: "Web policies", path: "/web/policies" },
];

export default function HomePage() {
  const { connection, ready, disconnect } = useConnection();
  const [hostname, setHostname] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready || !connection) return;
    let cancel = false;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const settings = await sophos("/administration/system-settings");
        if (!cancel && settings && typeof settings === "object" && "hostname" in settings) {
          setHostname(text((settings as { hostname?: unknown }).hostname));
        }
        const entries = await Promise.all(
          tiles.map(async (tile) => {
            const data = await sophos(tile.path, { query: { page: 1, pageSize: 1, pageTotal: true } });
            const parsed = asList(data);
            const count = Number(parsed.pages?.items ?? parsed.items.length);
            return [tile.path, Number.isFinite(count) ? count : parsed.items.length] as const;
          })
        );
        if (!cancel) setCounts(Object.fromEntries(entries));
      } catch (reason) {
        if (!cancel) setError(errorMessage(reason));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [connection, ready]);

  if (!ready) return <p className="muted">Opening Pocketwall…</p>;

  if (!connection) {
    return (
      <div className="stack">
        <section className="hero card brand-hero">
          <p className="kicker">Sophos Firewall</p>
          <h1>Pocketwall</h1>
          <p>See the policy, change a rule, and put the firewall back in your pocket. Built for SFOS 23 and its REST API.</p>
        </section>
        <ConnectForm />
        <section className="callout">
          <strong>Before the first connection</strong>
          <ol className="steps">
            <li>On the firewall, open Administration → API access and turn API access on.</li>
            <li>Add the allowed IP shown above. You can store up to 64 hosts, ranges, or networks.</li>
            <li>Under Administration → Device access, allow HTTPS admin from the zone the request arrives on.</li>
            <li>Sign in as a dedicated administrator, choose Add API key, and copy the key before closing the dialog. It is shown only once and lasts one year.</li>
          </ol>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader
        kicker={connection.mode === "demo" ? "Sample data" : hostname || connection.host}
        title="Pocketwall"
        subtitle={connection.mode === "demo" ? "This is a preview. Nothing here is your firewall." : `Connected to ${connection.host}:${connection.port}`}
      />
      {connection.mode === "demo" ? <Banner>You are looking at sample configuration so you can learn the screens. Connect a firewall from Settings when you are ready.</Banner> : null}
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {loading ? <Skeletons count={2} /> : (
        <div className="tiles">
          {tiles.map((tile) => (
            <Link key={tile.label} href={tile.href} className="tile">
              <b>{counts[tile.path] ?? "–"}</b>
              <span>{tile.label}</span>
            </Link>
          ))}
        </div>
      )}
      <div className="btn-row">
        <Link className="btn" href="/rules/edit" style={{ display: "inline-flex", alignItems: "center" }}>New rule</Link>
        <Link className="btn secondary" href="/objects/edit?kind=host" style={{ display: "inline-flex", alignItems: "center" }}>New host</Link>
        <button className="btn ghost" type="button" onClick={disconnect}>Disconnect</button>
      </div>
    </div>
  );
}
