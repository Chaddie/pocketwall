"use client";

import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { ConnectForm } from "@/components/ConnectForm";
import { Banner, PageHeader } from "@/components/ui";
import { useConnection } from "@/lib/connection";
import { resetDemo } from "@/lib/demo";

export default function SettingsPage() {
  const { connection, disconnect } = useConnection();
  const [egress, setEgress] = useState("");
  const [copied, setCopied] = useState(false);
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/egress").then((response) => response.json()).then((data: { ip?: string }) => {
      if (data.ip) setEgress(data.ip);
    }).catch(() => undefined);
    void fetch("/api/auth").then((response) => response.json()).then((data: { required?: boolean }) => {
      setLocked(Boolean(data.required));
    }).catch(() => setLocked(false));
  }, []);

  return (
    <div className="stack">
      <PageHeader title="Settings" subtitle="How this phone reaches the firewall." />
      <section className="callout">
        <strong>Allowed IP host</strong>
        <p className="small">Put this address in Administration → API access → Allowed IP hosts. It is the public address of this Pocketwall server, which is what the firewall sees.</p>
        <div className="spread" style={{ marginTop: 10 }}>
          <div className="ip">{egress || "Looking up…"}</div>
          <button className="icon-btn" type="button" aria-label="Copy IP" disabled={!egress} onClick={() => void navigator.clipboard.writeText(egress).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200); })}>
            <Copy size={18} />
          </button>
        </div>
        {copied ? <p className="small">Copied.</p> : null}
        <p className="small">Vercel’s outbound address can change. If Pocketwall suddenly cannot connect, come back here and update the firewall. A private LAN address such as 192.168.x.x only works when you run Pocketwall on that network.</p>
      </section>
      {connection ? (
        <section className="card" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>{connection.mode === "demo" ? "Sample data" : connection.host}</h2>
          <p className="muted">{connection.mode === "demo" ? "No firewall is connected." : `Port ${connection.port}. The API key stays in this browser.`}</p>
          <div className="btn-row">
            <button className="btn secondary" type="button" onClick={disconnect}>Disconnect</button>
            {connection.mode === "demo" ? <button className="btn secondary" type="button" onClick={() => { resetDemo(); window.location.reload(); }}>Reset sample data</button> : null}
          </div>
        </section>
      ) : <ConnectForm />}
      <section className="callout">
        <strong>What the firewall needs</strong>
        <ol className="steps">
          <li>SFOS 23, with Administration → API access turned on.</li>
          <li>The allowed IP host above, or the LAN address of a computer running Pocketwall yourself.</li>
          <li>HTTPS administration enabled for the zone the request comes from, under Administration → Device access.</li>
          <li>An API key from a dedicated administrator. The key is the bearer token, it inherits that administrator’s permissions, and it expires after one year.</li>
          <li>The firewall hostname or public IP, the admin port (usually 4444), and that key, entered above.</li>
        </ol>
      </section>
      {locked === false ? <Banner tone="warn">This site does not have a Pocketwall password yet. Set POCKETWALL_PASSWORD on the server before sharing the address. Anyone who can open the site can use the connection form, but they still need your API key.</Banner> : null}
      {locked ? <Banner>This site is locked with a Pocketwall password.</Banner> : null}
    </div>
  );
}
