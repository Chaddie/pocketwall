"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JsonPanel } from "@/components/JsonPanel";
import { NeedConnection } from "@/components/NeedConnection";
import { Banner, PageHeader, Segmented, TextField, Toggle } from "@/components/ui";
import { sophos, sophosList } from "@/lib/api";
import { useConnection } from "@/lib/connection";
import { errorMessage, isRecord, stripReadOnly, text, type JsonRecord } from "@/lib/format";

function useLoaded(path: string | null, id?: string) {
  const { connection, ready } = useConnection();
  const [record, setRecord] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !connection || !path || !id) return;
    let cancel = false;
    sophos(`${path}/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!cancel && isRecord(data)) setRecord(data);
      })
      .catch((reason) => {
        if (!cancel) setError(errorMessage(reason));
      });
    return () => {
      cancel = true;
    };
  }, [connection, id, path, ready]);
  return { record, error, ready, connection };
}

export function HostEditor({ family, id }: { family: "ipv4" | "ipv6"; id?: string }) {
  const router = useRouter();
  const path = family === "ipv4" ? "/network/addresses/ipv4" : "/network/addresses/ipv6";
  const loaded = useLoaded(path, id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState(family === "ipv4" ? "ipv4Address" : "ipv6Address");
  const [address, setAddress] = useState("");
  const [cidr, setCidr] = useState("24");
  const [end, setEnd] = useState("");
  const [list, setList] = useState("");
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loaded.record) return;
    setName(text(loaded.record.name));
    setDescription(text(loaded.record.description));
    if (typeof loaded.record.type === "string") setKind(loaded.record.type);
    setAddress(text(loaded.record.ipv4Address) || text(loaded.record.ipv4NetworkAddress) || text(loaded.record.ipv4AddressStart) || text(loaded.record.ipv6Address));
    setEnd(text(loaded.record.ipv4AddressEnd));
    setCidr(text(loaded.record.cidr) || "24");
    if (Array.isArray(loaded.record.ipv4Addresses)) setList(loaded.record.ipv4Addresses.map(String).join(", "));
  }, [loaded.record]);

  function payload(): JsonRecord {
    if (override) return override;
    const body: JsonRecord = { name: name.trim(), description: description.trim(), type: kind };
    if (kind === "ipv4Address") body.ipv4Address = address.trim();
    if (kind === "ipv6Address") body.ipv6Address = address.trim();
    if (kind === "ipv4Network") {
      body.ipv4NetworkAddress = address.trim();
      body.cidr = Number(cidr);
    }
    if (kind === "ipv4Range") {
      body.ipv4AddressStart = address.trim();
      body.ipv4AddressEnd = end.trim();
    }
    if (kind === "ipv4List") body.ipv4Addresses = list.split(",").map((item) => item.trim()).filter(Boolean);
    return body;
  }

  if (loaded.ready && !loaded.connection) return <NeedConnection />;

  return (
    <EditorFrame
      title={id ? "Edit host" : "New host"}
      back="/objects"
      error={error || loaded.error}
      busy={busy}
      saveLabel={id ? "Save host" : "Create host"}
      onSave={() => saveRecord(path, id, payload, setBusy, setError, () => router.push("/objects"))}
      onDelete={id ? () => removeRecord(path, id, setBusy, setError, () => router.push("/objects")) : undefined}
      json={<JsonPanel value={payload()} onUse={setOverride} />}
    >
      <TextField label="Name" value={name} onChange={(value) => { setOverride(null); setName(value); }} />
      <TextField label="Description" value={description} onChange={(value) => { setOverride(null); setDescription(value); }} />
      {family === "ipv4" ? (
        <Segmented
          label="Type"
          value={kind}
          onChange={(value) => { setOverride(null); setKind(value); }}
          options={[
            { value: "ipv4Address", label: "IP" },
            { value: "ipv4Network", label: "Network" },
            { value: "ipv4Range", label: "Range" },
            { value: "ipv4List", label: "List" },
          ]}
        />
      ) : null}
      {kind !== "ipv4List" ? <TextField label={kind === "ipv4Range" ? "Start address" : kind === "ipv4Network" ? "Network address" : "Address"} value={address} onChange={(value) => { setOverride(null); setAddress(value); }} placeholder={family === "ipv4" ? "192.168.10.10" : "2001:db8::1"} /> : null}
      {kind === "ipv4Network" ? <TextField label="Prefix length" value={cidr} onChange={setCidr} inputMode="numeric" /> : null}
      {kind === "ipv4Range" ? <TextField label="End address" value={end} onChange={setEnd} /> : null}
      {kind === "ipv4List" ? <TextField label="Addresses, separated by commas" value={list} onChange={setList} /> : null}
    </EditorFrame>
  );
}

export function FqdnEditor({ id }: { id?: string }) {
  const router = useRouter();
  const path = "/network/addresses/fqdn";
  const loaded = useLoaded(path, id);
  const [name, setName] = useState("");
  const [fqdn, setFqdn] = useState("");
  const [description, setDescription] = useState("");
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loaded.record) return;
    setName(text(loaded.record.name));
    setFqdn(text(loaded.record.fqdn));
    setDescription(text(loaded.record.description));
  }, [loaded.record]);
  const payload = () => override ?? { name: name.trim(), fqdn: fqdn.trim(), description: description.trim() };
  if (loaded.ready && !loaded.connection) return <NeedConnection />;
  return (
    <EditorFrame title={id ? "Edit FQDN" : "New FQDN"} back="/objects" error={error || loaded.error} busy={busy} saveLabel={id ? "Save" : "Create"} onSave={() => saveRecord(path, id, payload, setBusy, setError, () => router.push("/objects"))} onDelete={id ? () => removeRecord(path, id, setBusy, setError, () => router.push("/objects")) : undefined} json={<JsonPanel value={payload()} onUse={setOverride} />}>
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Domain" value={fqdn} onChange={setFqdn} placeholder="updates.example.com" />
      <TextField label="Description" value={description} onChange={setDescription} />
    </EditorFrame>
  );
}

export function ServiceEditor({ id }: { id?: string }) {
  const router = useRouter();
  const path = "/network/services";
  const loaded = useLoaded(path, id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [protocol, setProtocol] = useState("tcp");
  const [port, setPort] = useState("443");
  const [portTo, setPortTo] = useState("");
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const first = loaded.record && Array.isArray(loaded.record.services) ? loaded.record.services.find(isRecord) : null;
    if (!loaded.record || !first) return;
    setName(text(loaded.record.name));
    setDescription(text(loaded.record.description));
    setProtocol(text(first.protocol) || "tcp");
    if (isRecord(first.destinationPort)) {
      setPort(text(first.destinationPort.from));
      setPortTo(text(first.destinationPort.to));
    }
  }, [loaded.record]);
  function payload(): JsonRecord {
    if (override) return override;
    const from = Number(port);
    const to = Number(portTo || port);
    const entry = { protocol, sourcePort: { from: 1, to: 65535 }, destinationPort: { from, to } };
    const services = protocol === "both"
      ? [{ ...entry, protocol: "tcp" }, { ...entry, protocol: "udp" }]
      : [entry];
    return { name: name.trim(), description: description.trim(), type: "tcpOrUdp", services };
  }
  if (loaded.ready && !loaded.connection) return <NeedConnection />;
  return (
    <EditorFrame title={id ? "Edit service" : "New service"} back="/objects" error={error || loaded.error} busy={busy} saveLabel={id ? "Save" : "Create"} onSave={() => saveRecord(path, id, payload, setBusy, setError, () => router.push("/objects"))} onDelete={id ? () => removeRecord(path, id, setBusy, setError, () => router.push("/objects")) : undefined} json={<JsonPanel value={payload()} onUse={setOverride} />}>
      <TextField label="Name" value={name} onChange={setName} placeholder="HTTPS" />
      <TextField label="Description" value={description} onChange={setDescription} />
      <Segmented label="Protocol" value={protocol} onChange={setProtocol} options={[{ value: "tcp", label: "TCP" }, { value: "udp", label: "UDP" }, { value: "both", label: "TCP and UDP" }]} />
      <TextField label="Destination port" value={port} onChange={setPort} inputMode="numeric" />
      <TextField label="Destination port end" value={portTo} onChange={setPortTo} placeholder="Same as start" inputMode="numeric" />
    </EditorFrame>
  );
}

export function ZoneEditor({ id }: { id?: string }) {
  const router = useRouter();
  const path = "/network/zones";
  const loaded = useLoaded(path, id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("lan");
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loaded.record) return;
    setName(text(loaded.record.name));
    setDescription(text(loaded.record.description));
    if (text(loaded.record.type)) setType(text(loaded.record.type));
  }, [loaded.record]);
  const payload = () => override ?? { name: name.trim(), description: description.trim(), type };
  if (loaded.ready && !loaded.connection) return <NeedConnection />;
  return (
    <EditorFrame title={id ? "Edit zone" : "New zone"} back="/network" error={error || loaded.error} busy={busy} saveLabel={id ? "Save zone" : "Create zone"} onSave={() => saveRecord(path, id, payload, setBusy, setError, () => router.push("/network"))} onDelete={id ? () => removeRecord(path, id, setBusy, setError, () => router.push("/network")) : undefined} json={<JsonPanel value={payload()} onUse={setOverride} />}>
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Description" value={description} onChange={setDescription} />
      <Segmented label="Type" value={type} onChange={setType} options={[{ value: "lan", label: "LAN" }, { value: "wan", label: "WAN" }, { value: "dmz", label: "DMZ" }, { value: "vpn", label: "VPN" }]} />
    </EditorFrame>
  );
}

export function NatEditor({ family, id }: { family: "ipv4" | "ipv6"; id?: string }) {
  const router = useRouter();
  const path = `/nat/rules/${family}`;
  const loaded = useLoaded(path, id);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [source, setSource] = useState("");
  const [masq, setMasq] = useState(true);
  const [outbound, setOutbound] = useState("");
  const [hosts, setHosts] = useState<string[]>([]);
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const addressKey = family === "ipv4" ? "ipv4Addresses" : "ipv6Addresses";

  useEffect(() => {
    if (!loaded.connection) return;
    void sophosList(family === "ipv4" ? "/network/addresses/ipv4" : "/network/addresses/ipv6")
      .then((items) => setHosts(items.map((item) => text(item.name)).filter(Boolean)))
      .catch(() => undefined);
  }, [family, loaded.connection]);

  useEffect(() => {
    if (!loaded.record) return;
    setName(text(loaded.record.name));
    setDescription(text(loaded.record.description));
    setEnabled(loaded.record.enabled !== false);
    const original = isRecord(loaded.record.originalSourceNetworks) ? loaded.record.originalSourceNetworks : {};
    const picked = Array.isArray(original[addressKey]) ? original[addressKey].find(isRecord) : null;
    setSource(picked ? text(picked.name) : "");
    setMasq(!(isRecord(loaded.record.translatedSource) && loaded.record.translatedSource.masq === false));
    const outboundValue = isRecord(loaded.record.outboundInterfaces) ? loaded.record.outboundInterfaces : {};
    const iface = Array.isArray(outboundValue.interfaces) ? outboundValue.interfaces.find(isRecord) : null;
    setOutbound(iface ? text(iface.name) : "");
  }, [addressKey, loaded.record]);

  function payload(): JsonRecord {
    if (override) return override;
    return {
      name: name.trim(),
      description: description.trim(),
      enabled,
      originalSourceNetworks: source ? { [addressKey]: [{ name: source }] } : { any: true },
      originalDestinationNetworks: { any: true },
      originalServicesOrGroups: { any: true },
      translatedSource: masq ? { masq: true } : { [addressKey]: [{ name: source }] },
      inboundInterfaces: { any: true },
      outboundInterfaces: outbound ? { interfaces: [{ name: outbound }] } : { any: true },
    };
  }
  if (loaded.ready && !loaded.connection) return <NeedConnection />;
  return (
    <EditorFrame title={id ? "Edit NAT rule" : "New NAT rule"} back="/nat" error={error || loaded.error} busy={busy} saveLabel={id ? "Save NAT rule" : "Create NAT rule"} onSave={() => saveRecord(path, id, payload, setBusy, setError, () => router.push("/nat"))} onDelete={id ? () => removeRecord(path, id, setBusy, setError, () => router.push("/nat")) : undefined} json={<JsonPanel value={payload()} onUse={setOverride} />}>
      <TextField label="Name" value={name} onChange={setName} placeholder="LAN outbound masquerade" />
      <TextField label="Description" value={description} onChange={setDescription} />
      <Toggle label="Enabled" checked={enabled} onChange={setEnabled} />
      <label className="field">
        <span>Original source</span>
        <select value={source} onChange={(event) => { setOverride(null); setSource(event.target.value); }}>
          <option value="">Any</option>
          {hosts.map((host) => <option key={host} value={host}>{host}</option>)}
        </select>
      </label>
      <Toggle label="Masquerade source" checked={masq} onChange={setMasq} />
      <TextField label="Outbound interface" value={outbound} onChange={setOutbound} placeholder="Port2, or leave blank for any" />
    </EditorFrame>
  );
}

export function UserEditor({ id }: { id?: string }) {
  const router = useRouter();
  const path = "/authentication/users/network-users";
  const loaded = useLoaded(path, id);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [override, setOverride] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loaded.connection) return;
    void sophosList("/authentication/user-groups").then((items) => setGroups(items.map((item) => text(item.name)).filter(Boolean))).catch(() => undefined);
  }, [loaded.connection]);
  useEffect(() => {
    if (!loaded.record) return;
    setName(text(loaded.record.name));
    setDisplayName(text(loaded.record.displayName));
    setActive(loaded.record.active !== false);
    const emails = Array.isArray(loaded.record.emailAddresses) ? loaded.record.emailAddresses.map(String) : [];
    setEmail(emails[0] ?? "");
    setGroup(isRecord(loaded.record.group) ? text(loaded.record.group.name) : "");
  }, [loaded.record]);
  function payload(): JsonRecord {
    if (override) return override;
    const body: JsonRecord = {
      name: name.trim(),
      displayName: displayName.trim() || name.trim(),
      active,
      emailAddresses: email.trim() ? [email.trim()] : [],
      group: group ? { name: group } : undefined,
    };
    if (password) body.password = password;
    return body;
  }
  if (loaded.ready && !loaded.connection) return <NeedConnection />;
  return (
    <EditorFrame title={id ? "Edit user" : "New user"} back="/people" error={error || loaded.error} busy={busy} saveLabel={id ? "Save user" : "Create user"} onSave={() => saveRecord(path, id, payload, setBusy, setError, () => router.push("/people"))} onDelete={id ? () => removeRecord(path, id, setBusy, setError, () => router.push("/people")) : undefined} json={<JsonPanel value={stripReadOnly(payload())} onUse={setOverride} />}>
      <TextField label="Username" value={name} onChange={setName} autoComplete="off" />
      <TextField label="Display name" value={displayName} onChange={setDisplayName} />
      <TextField label={id ? "New password" : "Password"} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
      <TextField label="Email" value={email} onChange={setEmail} />
      <label className="field">
        <span>Group</span>
        <select value={group} onChange={(event) => setGroup(event.target.value)}>
          <option value="">Choose a group</option>
          {groups.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <Toggle label="Active" checked={active} onChange={setActive} />
    </EditorFrame>
  );
}

function EditorFrame({
  title,
  back,
  children,
  json,
  error,
  busy,
  saveLabel,
  onSave,
  onDelete,
}: {
  title: string;
  back: string;
  children: React.ReactNode;
  json: React.ReactNode;
  error: string;
  busy: boolean;
  saveLabel: string;
  onSave: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="stack">
      <PageHeader title={title} />
      {children}
      {json}
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="btn-row">
        <button className="btn" type="button" disabled={busy} onClick={onSave}>{busy ? "Saving…" : saveLabel}</button>
        {onDelete ? <button className="btn danger" type="button" disabled={busy} onClick={() => { if (window.confirm("Delete this object?")) onDelete(); }}>Delete</button> : null}
        <Link className="btn secondary" href={back} style={{ display: "inline-flex", alignItems: "center" }}>Cancel</Link>
      </div>
    </div>
  );
}

function saveRecord(path: string, id: string | undefined, payload: () => JsonRecord, setBusy: (value: boolean) => void, setError: (value: string) => void, done: () => void) {
  setBusy(true);
  setError("");
  const body = stripReadOnly(payload());
  const request = id
    ? sophos(`${path}/${encodeURIComponent(id)}`, { method: "PATCH", body })
    : sophos(path, { method: "POST", body });
  void request.then(done).catch((reason) => setError(errorMessage(reason))).finally(() => setBusy(false));
}

function removeRecord(path: string, id: string, setBusy: (value: boolean) => void, setError: (value: string) => void, done: () => void) {
  setBusy(true);
  void sophos(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" })
    .then(done)
    .catch((reason) => setError(errorMessage(reason)))
    .finally(() => setBusy(false));
}
