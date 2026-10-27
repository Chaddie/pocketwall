"use client";

import { Copy, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { probeConnection } from "@/lib/api";
import { privateHostWarning, useConnection } from "@/lib/connection";
import { errorMessage } from "@/lib/format";
import { parseEndpoint } from "@/lib/target";
import { Banner, TextField, Toggle } from "@/components/ui";

export function ConnectForm({ onConnected }: { onConnected?: () => void }) {
  const { connect, preview } = useConnection();
  const [host, setHost] = useState("");
  const [port, setPort] = useState("4444");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [insecure, setInsecure] = useState(true);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [egress, setEgress] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/api/egress")
      .then((response) => response.json())
      .then((data: { ip?: string }) => {
        if (!cancel && data.ip) setEgress(data.ip);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const endpoint = parseEndpoint(host, port);
      if (!apiKey.trim()) throw new Error("Paste the API key from Administration, API access.");
      await probeConnection({
        mode: "live",
        host: endpoint.host,
        port: endpoint.port,
        apiKey: apiKey.trim(),
        insecure,
      });
      connect({ host, port, apiKey, insecure, remember });
      onConnected?.();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  const warning = privateHostWarning(host);

  return (
    <div className="stack">
      <section className="callout">
        <strong>Allowed IP host</strong>
        <p className="small">Add this address under Administration → API access → Allowed IP hosts. It is the address the firewall sees when this Pocketwall server calls it.</p>
        <div className="spread" style={{ marginTop: 10 }}>
          <div className="ip">{egress || "Looking up…"}</div>
          <button
            className="icon-btn"
            type="button"
            aria-label="Copy allowed IP"
            disabled={!egress}
            onClick={() => {
              if (!egress) return;
              void navigator.clipboard.writeText(egress).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              });
            }}
          >
            <Copy size={18} />
          </button>
        </div>
        {copied ? <p className="small">Copied.</p> : null}
      </section>

      <TextField label="Firewall address" value={host} onChange={setHost} placeholder="firewall.example.com" autoComplete="off" />
      <TextField label="Admin port" value={port} onChange={setPort} placeholder="4444" inputMode="numeric" />
      <label className="field">
        <span>API key</span>
        <div className="row">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste the key shown once when it is created"
            onChange={(event) => setApiKey(event.target.value)}
          />
          <button className="icon-btn" type="button" aria-label={showKey ? "Hide API key" : "Show API key"} onClick={() => setShowKey((value) => !value)}>
            {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <Toggle label="Trust the appliance certificate" checked={insecure} onChange={setInsecure} />
      <p className="small faint">Leave this on when the firewall uses the default Sophos certificate. The key stays in this browser and is sent only to this Pocketwall server so it can reach the firewall.</p>
      <label className="check">
        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
        <span>Remember this firewall on this device</span>
      </label>
      {warning ? <Banner tone="warn">{warning}</Banner> : null}
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="btn-row">
        <button className="btn" type="button" disabled={busy} onClick={() => void submit()}>{busy ? "Connecting…" : "Connect"}</button>
        <button className="btn secondary" type="button" onClick={preview}>Preview sample data</button>
      </div>
    </div>
  );
}
