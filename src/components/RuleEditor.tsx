"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { JsonPanel } from "@/components/JsonPanel";
import { NeedConnection } from "@/components/NeedConnection";
import { Banner, NameList, PageHeader, Segmented, TextField, Toggle } from "@/components/ui";
import { sophos, sophosList } from "@/lib/api";
import { useConnection } from "@/lib/connection";
import { errorMessage, isRecord, text, type JsonRecord } from "@/lib/format";

type Family = "ipv4" | "ipv6";
type Action = "accept" | "drop" | "reject";

function namesFrom(value: unknown, key: string): { any: boolean; names: string[] } {
  if (!isRecord(value) || value.any === true) return { any: true, names: [] };
  const bucket = key === "zones" ? value.zones : value[key];
  if (!Array.isArray(bucket)) return { any: true, names: [] };
  const names = bucket.filter(isRecord).map((item) => text(item.name)).filter(Boolean);
  return { any: names.length === 0, names };
}

function named(any: boolean, names: string[], key: string): JsonRecord {
  if (any || names.length === 0) return { any: true };
  return { [key]: names.map((name) => ({ name })) };
}

export function RuleEditor({ id }: { id?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const family: Family = params.get("family") === "ipv6" ? "ipv6" : "ipv4";
  const { connection, ready } = useConnection();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState<Action>("accept");
  const [enabled, setEnabled] = useState(true);
  const [logTraffic, setLogTraffic] = useState(true);
  const [sourceZones, setSourceZones] = useState<string[]>([]);
  const [destZones, setDestZones] = useState<string[]>([]);
  const [sourceZoneAny, setSourceZoneAny] = useState(true);
  const [destZoneAny, setDestZoneAny] = useState(true);
  const [sourceAny, setSourceAny] = useState(true);
  const [destAny, setDestAny] = useState(true);
  const [sourceNets, setSourceNets] = useState<string[]>([]);
  const [destNets, setDestNets] = useState<string[]>([]);
  const [serviceAny, setServiceAny] = useState(true);
  const [services, setServices] = useState<string[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [hosts, setHosts] = useState<string[]>([]);
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const netKey = family === "ipv4" ? "ipv4Addresses" : "ipv6Addresses";
  const base = `/firewall/rules/${family}`;

  useEffect(() => {
    if (!ready || !connection) return;
    let cancel = false;
    void (async () => {
      try {
        const [zoneItems, hostItems, serviceItems] = await Promise.all([
          sophosList("/network/zones"),
          sophosList(family === "ipv4" ? "/network/addresses/ipv4" : "/network/addresses/ipv6"),
          sophosList("/network/services"),
        ]);
        if (cancel) return;
        setZones(zoneItems.map((item) => text(item.name)).filter(Boolean));
        setHosts(hostItems.map((item) => text(item.name)).filter(Boolean));
        setServiceNames(serviceItems.map((item) => text(item.name)).filter(Boolean));
        if (!id) return;
        const rule = await sophos(`${base}/${encodeURIComponent(id)}`);
        if (!isRecord(rule) || cancel) return;
        setName(text(rule.name));
        setDescription(text(rule.description));
        if (rule.action === "drop" || rule.action === "reject" || rule.action === "accept") setAction(rule.action);
        setEnabled(rule.enabled !== false);
        setLogTraffic(rule.logTraffic !== false);
        const sourceZone = namesFrom(rule.sourceZones, "zones");
        const destZone = namesFrom(rule.destinationZones, "zones");
        setSourceZoneAny(sourceZone.any);
        setDestZoneAny(destZone.any);
        setSourceZones(sourceZone.names);
        setDestZones(destZone.names);
        const source = namesFrom(rule.sourceNetworks, netKey);
        const dest = namesFrom(rule.destinationNetworks, netKey);
        setSourceAny(source.any);
        setDestAny(dest.any);
        setSourceNets(source.names);
        setDestNets(dest.names);
        const picked = namesFrom(rule.servicesOrGroups, "services");
        setServiceAny(picked.any);
        setServices(picked.names);
      } catch (reason) {
        if (!cancel) setError(errorMessage(reason));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [base, connection, family, id, netKey, ready]);

  function payload(): JsonRecord {
    if (override) return override;
    return {
      name: name.trim(),
      description: description.trim(),
      ruleType: "firewall",
      enabled,
      action,
      logTraffic,
      sourceZones: named(sourceZoneAny, sourceZones, "zones"),
      destinationZones: named(destZoneAny, destZones, "zones"),
      sourceNetworks: named(sourceAny, sourceNets, netKey),
      destinationNetworks: named(destAny, destNets, netKey),
      servicesOrGroups: named(serviceAny, services, "services"),
    };
  }

  function toggle(list: string[], nameToToggle: string, setList: (names: string[]) => void) {
    setOverride(null);
    setList(list.includes(nameToToggle) ? list.filter((item) => item !== nameToToggle) : [...list, nameToToggle]);
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = payload();
      if (!text(body.name)) throw new Error("Give the rule a name.");
      if (id) await sophos(`${base}/${encodeURIComponent(id)}`, { method: "PATCH", body });
      else await sophos(base, { method: "POST", body });
      router.push(`/rules?family=${family}`);
      router.refresh();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  if (ready && !connection) return <NeedConnection />;

  return (
    <div className="stack">
      <PageHeader kicker={family.toUpperCase()} title={id ? "Edit rule" : "New rule"} subtitle="First matching rule wins. Put specific rules above broad ones." />
      <TextField label="Name" value={name} onChange={(value) => { setOverride(null); setName(value); }} placeholder="Allow LAN to WAN" />
      <TextField label="Description" value={description} onChange={(value) => { setOverride(null); setDescription(value); }} placeholder="Optional" />
      <Segmented label="Action" value={action} onChange={(value) => { setOverride(null); setAction(value); }} options={[{ value: "accept", label: "Accept" }, { value: "drop", label: "Drop" }, { value: "reject", label: "Reject" }]} />
      <Toggle label="Enabled" checked={enabled} onChange={(value) => { setOverride(null); setEnabled(value); }} />
      <Toggle label="Log traffic" checked={logTraffic} onChange={(value) => { setOverride(null); setLogTraffic(value); }} />
      <NameList label="Source zones" names={zones} any={sourceZoneAny} selected={sourceZones} onAny={(any) => { setOverride(null); setSourceZoneAny(any); if (any) setSourceZones([]); }} onToggle={(item) => { setSourceZoneAny(false); toggle(sourceZones, item, setSourceZones); }} />
      <NameList label="Destination zones" names={zones} any={destZoneAny} selected={destZones} onAny={(any) => { setOverride(null); setDestZoneAny(any); if (any) setDestZones([]); }} onToggle={(item) => { setDestZoneAny(false); toggle(destZones, item, setDestZones); }} />
      <NameList label="Source networks" names={hosts} any={sourceAny} selected={sourceNets} onAny={(any) => { setOverride(null); setSourceAny(any); }} onToggle={(item) => { setSourceAny(false); toggle(sourceNets, item, setSourceNets); }} />
      <NameList label="Destination networks" names={hosts} any={destAny} selected={destNets} onAny={(any) => { setOverride(null); setDestAny(any); }} onToggle={(item) => { setDestAny(false); toggle(destNets, item, setDestNets); }} />
      <NameList label="Services" names={serviceNames} any={serviceAny} selected={services} onAny={(any) => { setOverride(null); setServiceAny(any); }} onToggle={(item) => { setServiceAny(false); toggle(services, item, setServices); }} />
      <JsonPanel value={payload()} onUse={setOverride} />
      {override ? <Banner>Advanced JSON will be sent instead of the form.</Banner> : null}
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="btn-row">
        <button className="btn" type="button" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : id ? "Save rule" : "Create rule"}</button>
        {id ? (
          <button
            className="btn danger"
            type="button"
            disabled={busy}
            onClick={() => {
              if (!window.confirm("Delete this rule?")) return;
              setBusy(true);
              void sophos(`${base}/${encodeURIComponent(id)}`, { method: "DELETE" })
                .then(() => router.push(`/rules?family=${family}`))
                .catch((reason) => setError(errorMessage(reason)))
                .finally(() => setBusy(false));
            }}
          >
            Delete
          </button>
        ) : null}
        <Link className="btn secondary" href={`/rules?family=${family}`} style={{ display: "inline-flex", alignItems: "center" }}>Cancel</Link>
      </div>
    </div>
  );
}
