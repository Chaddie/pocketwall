"use client";

import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { NeedConnection } from "@/components/NeedConnection";
import { useList } from "@/components/useList";
import { Banner, PageHeader, Segmented, Skeletons } from "@/components/ui";
import { sophos } from "@/lib/api";
import { actionTone, displayName, errorMessage, matchLabel, text, zoneLabel, type JsonRecord } from "@/lib/format";

type Family = "ipv4" | "ipv6";
type Filter = "all" | "accept" | "drop" | "reject" | "off";

export default function RulesPage() {
  const router = useRouter();
  const params = useSearchParams();
  const family: Family = params.get("family") === "ipv6" ? "ipv6" : "ipv4";
  const path = `/firewall/rules/${family}`;
  const { items, loading, error, reload, connected } = useList(path);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => {
    return items.filter((item) => {
      const tone = actionTone(item.action, item.enabled);
      if (filter === "off" && item.enabled !== false) return false;
      if (filter !== "all" && filter !== "off" && (tone !== filter || item.enabled === false)) return false;
      const haystack = `${displayName(item)} ${text(item.description)} ${zoneLabel(item.sourceZones)} ${zoneLabel(item.destinationZones)}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [filter, items, query]);

  if (!connected && !loading) return (
    <div className="stack">
      <PageHeader title="Rules" subtitle="Firewall policy, top to bottom." />
      <NeedConnection />
    </div>
  );

  async function toggle(item: JsonRecord) {
    const id = text(item.id) || text(item.name);
    setNotice("");
    try {
      await sophos(`${path}/${encodeURIComponent(id)}`, { method: "PATCH", body: { enabled: item.enabled === false } });
      await reload();
    } catch (reason) {
      setNotice(errorMessage(reason));
    }
  }

  async function move(item: JsonRecord, direction: "up" | "down") {
    const index = items.findIndex((entry) => entry.id === item.id);
    const neighbor = items[direction === "up" ? index - 1 : index + 1];
    if (!neighbor) return;
    setNotice("");
    try {
      await sophos(`${path}/move`, {
        method: "POST",
        body: {
          name: text(item.name),
          position: direction === "up" ? "before" : "after",
          referenceItem: { name: text(neighbor.name) },
        },
      });
      await reload();
    } catch (reason) {
      setNotice(errorMessage(reason));
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Rules" subtitle="The first match stops the search." onRefresh={() => void reload()} busy={loading} />
      <Segmented
        label="IP family"
        value={family}
        onChange={(value) => router.push(value === "ipv4" ? "/rules" : "/rules?family=ipv6")}
        options={[{ value: "ipv4", label: "IPv4" }, { value: "ipv6", label: "IPv6" }]}
      />
      <label className="field">
        <span>Search</span>
        <input value={query} placeholder="Name, zone, or description" onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div className="chips">
        {(["all", "accept", "drop", "reject", "off"] as Filter[]).map((value) => (
          <button key={value} className={filter === value ? "chip on" : "chip"} type="button" onClick={() => setFilter(value)}>
            {value === "all" ? "All" : value === "off" ? "Off" : value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {notice ? <Banner tone="bad">{notice}</Banner> : null}
      {loading ? <Skeletons /> : null}
      {!loading && visible.length === 0 ? <p className="muted">No rules match.</p> : null}
      {visible.map((item, index) => {
        const tone = actionTone(item.action, item.enabled);
        const id = text(item.id) || text(item.name);
        const absolute = items.findIndex((entry) => entry.id === item.id);
        return (
          <article className={`list-card ${tone}`} key={id || index}>
            <div className="bar" />
            <div className="body">
              <Link href={`/rules/edit/${encodeURIComponent(id)}?family=${family}`}>
                <h2>{index + 1}. {displayName(item)}</h2>
                <p>{zoneLabel(item.sourceZones)} → {zoneLabel(item.destinationZones)}</p>
                <p>{matchLabel(item.servicesOrGroups, "Any service")}</p>
              </Link>
            </div>
            <div className="side">
              <span className={`pill ${tone}`}>{item.enabled === false ? "Off" : text(item.action) || "accept"}</span>
              <button className={item.enabled === false ? "switch" : "switch on"} type="button" aria-label={`${item.enabled === false ? "Enable" : "Disable"} ${displayName(item)}`} onClick={() => void toggle(item)}><i /></button>
              <button className="icon-btn" type="button" aria-label="Move up" disabled={absolute <= 0} onClick={() => void move(item, "up")}><ChevronUp size={16} /></button>
              <button className="icon-btn" type="button" aria-label="Move down" disabled={absolute < 0 || absolute >= items.length - 1} onClick={() => void move(item, "down")}><ChevronDown size={16} /></button>
            </div>
          </article>
        );
      })}
      <Link href={`/rules/edit?family=${family}`} className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Plus size={18} /> New rule
      </Link>
    </div>
  );
}
