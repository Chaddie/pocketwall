export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function text(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function displayName(item: JsonRecord): string {
  return (
    text(item.name) ||
    text(item.displayName) ||
    text(item.fqdn) ||
    text(item.hostname) ||
    text(item.username) ||
    text(item.id) ||
    "Untitled"
  );
}

export function itemKey(item: JsonRecord): string {
  return text(item.id) || text(item.name) || text(item.fqdn) || text(item.liveUserId);
}

export function asList(data: unknown): { items: JsonRecord[]; pages?: JsonRecord; single?: JsonRecord } {
  if (Array.isArray(data)) return { items: data.filter(isRecord) };
  if (!isRecord(data)) return { items: [] };
  if (Array.isArray(data.items)) {
    return {
      items: data.items.filter(isRecord),
      pages: isRecord(data.pages) ? data.pages : undefined,
    };
  }
  return { items: [], single: data };
}

export function namesOf(value: unknown): string[] {
  if (!isRecord(value)) return [];
  if (value.any === true) return [];
  const names: string[] = [];
  for (const entry of Object.values(value)) {
    if (!Array.isArray(entry)) continue;
    for (const item of entry) {
      if (isRecord(item) && text(item.name)) names.push(text(item.name));
    }
  }
  return names;
}

export function matchLabel(value: unknown, empty = "Any"): string {
  if (!isRecord(value) || value.any === true) return empty;
  const names = namesOf(value);
  if (names.length === 0) return "Selected";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
}

export function zoneLabel(value: unknown): string {
  return matchLabel(value, "Any zone");
}

export function actionTone(action: unknown, enabled: unknown): "accept" | "drop" | "reject" | "off" {
  if (enabled === false) return "off";
  if (action === "drop") return "drop";
  if (action === "reject") return "reject";
  return "accept";
}

export function hostSummary(item: JsonRecord): string {
  const type = text(item.type);
  if (type === "ipv4Address") return text(item.ipv4Address) || "Single address";
  if (type === "ipv4Network") return `${text(item.ipv4NetworkAddress)}/${text(item.cidr)}`.replace(/\/$/, "");
  if (type === "ipv4Range") return `${text(item.ipv4AddressStart)} – ${text(item.ipv4AddressEnd)}`;
  if (type === "ipv4List" && Array.isArray(item.ipv4Addresses)) return `${item.ipv4Addresses.length} addresses`;
  if (type === "ipv6Address") return text(item.ipv6Address) || "Single address";
  if (item.fqdn) return text(item.fqdn);
  return type || text(item.description);
}

export function serviceSummary(item: JsonRecord): string {
  if (!Array.isArray(item.services)) return text(item.type) || text(item.description);
  return item.services
    .filter(isRecord)
    .map((service) => {
      const dest = isRecord(service.destinationPort) ? text(service.destinationPort.from) : "";
      const destTo = isRecord(service.destinationPort) ? text(service.destinationPort.to) : "";
      const port = dest && destTo && dest !== destTo ? `${dest}-${destTo}` : dest;
      return `${text(service.protocol).toUpperCase()} ${port}`.trim();
    })
    .filter(Boolean)
    .join(" · ");
}

export function interfaceSummary(item: JsonRecord): string {
  const zone = isRecord(item.zone) ? text(item.zone.name) : "";
  const ipv4 = isRecord(item.ipv4) ? item.ipv4 : null;
  const address = ipv4 ? text(ipv4.ipv4Address) || text(ipv4.assignmentType) : "";
  const cidr = ipv4 && text(ipv4.cidr) ? `/${text(ipv4.cidr)}` : "";
  return [text(item.type), zone, address ? `${address}${cidr}` : ""].filter(Boolean).join(" · ");
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong.";
}

export function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function stripReadOnly(value: JsonRecord): JsonRecord {
  const next: JsonRecord = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === "id" || key === "createdAt" || key === "updatedAt") continue;
    next[key] = entry;
  }
  return next;
}

export function parseJsonObject(source: string): JsonRecord {
  const parsed: unknown = JSON.parse(source);
  if (!isRecord(parsed)) throw new Error("The JSON must be an object.");
  return parsed;
}
