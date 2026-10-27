import { asList, isRecord, type JsonRecord } from "@/lib/format";

type DemoDb = {
  lists: Record<string, JsonRecord[]>;
  singles: Record<string, JsonRecord>;
};

const STORAGE_KEY = "pocketwall.demo";

function seed(): DemoDb {
  return {
    singles: {
      "/administration/system-settings": {
        hostname: "hq-firewall",
        loginDisclaimer: false,
      },
      "/ipsec-vpn/remote-access/settings": {
        enabled: true,
      },
    },
    lists: {
      "/firewall/rules/ipv4": [
        rule("11111111-1111-4111-8111-111111111111", "Allow LAN to WAN", "accept", true, "LAN", "WAN", true, ["HTTP", "HTTPS"]),
        rule("22222222-2222-4222-8222-222222222222", "Block legacy VPN", "drop", true, "WAN", "LAN", true, ["PPTP"]),
        rule("33333333-3333-4333-8333-333333333333", "Guest web only", "accept", true, "WiFi", "WAN", true, ["HTTPS"]),
        rule("44444444-4444-4444-8444-444444444444", "Lab maintenance", "accept", false, "LAN", "DMZ", false, []),
      ],
      "/firewall/rules/ipv6": [],
      "/nat/rules/ipv4": [
        {
          id: "55555555-5555-4555-8555-555555555555",
          name: "LAN outbound masquerade",
          description: "Hide LAN clients behind the WAN address.",
          enabled: true,
          originalSourceNetworks: { ipv4Addresses: [{ name: "LAN subnet" }] },
          originalDestinationNetworks: { any: true },
          originalServicesOrGroups: { any: true },
          translatedSource: { masq: true },
          inboundInterfaces: { any: true },
          outboundInterfaces: { interfaces: [{ name: "Port2" }] },
        },
      ],
      "/nat/rules/ipv6": [],
      "/network/addresses/ipv4": [
        { id: "a1", name: "LAN subnet", description: "Office network", type: "ipv4Network", ipv4NetworkAddress: "192.168.10.0", cidr: 24 },
        { id: "a2", name: "Web server", description: "Public site", type: "ipv4Address", ipv4Address: "203.0.113.10" },
        { id: "a3", name: "Printers", description: "Office printers", type: "ipv4Range", ipv4AddressStart: "192.168.10.20", ipv4AddressEnd: "192.168.10.29" },
      ],
      "/network/addresses/ipv6": [
        { id: "a6", name: "Mail server", type: "ipv6Address", ipv6Address: "2001:db8::25" },
      ],
      "/network/addresses/fqdn": [
        { id: "f1", name: "Updates", fqdn: "updates.example.com", description: "Vendor updates" },
      ],
      "/network/services": [
        service("s1", "HTTPS", "tcp", 443),
        service("s2", "HTTP", "tcp", 80),
        service("s3", "DNS", "udp", 53),
        service("s4", "PPTP", "tcp", 1723),
      ],
      "/network/zones": [
        { id: "z1", name: "LAN", type: "lan", description: "Office" },
        { id: "z2", name: "WAN", type: "wan", description: "Internet" },
        { id: "z3", name: "DMZ", type: "dmz", description: "Published servers" },
        { id: "z4", name: "WiFi", type: "lan", description: "Wireless" },
      ],
      "/network/interfaces/network-interfaces": [
        { id: "i1", name: "Port1", type: "physical", zone: { name: "LAN" }, ipv4: { assignmentType: "static", ipv4Address: "192.168.10.1", cidr: 24 } },
        { id: "i2", name: "Port2", type: "physical", zone: { name: "WAN" }, ipv4: { assignmentType: "dhcp" } },
        { id: "i3", name: "Port2.20", type: "vlan", zone: { name: "WiFi" }, ipv4: { assignmentType: "static", ipv4Address: "192.168.20.1", cidr: 24 } },
      ],
      "/authentication/users/network-users": [
        { id: "u1", name: "alex", displayName: "Alex Morgan", active: true, emailAddresses: ["alex@example.com"], group: { name: "Staff" } },
      ],
      "/authentication/user-groups": [
        { id: "g1", name: "Staff", description: "Employees" },
        { id: "g2", name: "Guests", description: "Temporary access" },
      ],
      "/authentication/live-users": [
        { liveUserId: 42, name: "alex", ipAddress: "192.168.10.45", group: "Staff" },
      ],
      "/web/policies": [
        { id: "w1", name: "Default web policy", description: "Block malware and adult categories", enabled: true },
      ],
      "/web/exceptions": [],
      "/web/url-groups": [{ id: "ug1", name: "Company sites", description: "Always allow" }],
      "/ipsec-vpn/site-to-site/connections/policy-based/ipv4": [
        { id: "v1", name: "Branch office", description: "Policy-based tunnel", enabled: true },
      ],
      "/ipsec-vpn/site-to-site/connections/route-based/ipv4": [],
      "/ssl-vpn/remote-access/policies": [
        { id: "sv1", name: "Remote staff", description: "Full tunnel for staff" },
      ],
    },
  };
}

function rule(
  id: string,
  name: string,
  action: string,
  enabled: boolean,
  source: string,
  destination: string,
  anyNetwork: boolean,
  services: string[]
): JsonRecord {
  return {
    id,
    name,
    ruleType: "firewall",
    enabled,
    action,
    logTraffic: true,
    sourceZones: { zones: [{ name: source }] },
    destinationZones: { zones: [{ name: destination }] },
    sourceNetworks: anyNetwork ? { any: true } : { ipv4Addresses: [{ name: "LAN subnet" }] },
    destinationNetworks: { any: true },
    servicesOrGroups: services.length ? { services: services.map((name) => ({ name })) } : { any: true },
  };
}

function service(id: string, name: string, protocol: string, port: number): JsonRecord {
  return {
    id,
    name,
    type: "tcpOrUdp",
    services: [{ protocol, sourcePort: { from: 1, to: 65535 }, destinationPort: { from: port, to: port } }],
  };
}

function load(): DemoDb {
  if (typeof sessionStorage === "undefined") return seed();
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = seed();
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && isRecord(parsed.lists) && isRecord(parsed.singles)) {
      return parsed as unknown as DemoDb;
    }
  } catch {
    /* replace a corrupt preview */
  }
  const initial = seed();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function save(db: DemoDb) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function resetDemo() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function collectionOf(pathname: string, db: DemoDb): { key: string; rest: string } | null {
  const keys = Object.keys(db.lists).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (pathname === key) return { key, rest: "" };
    if (pathname.startsWith(`${key}/`)) return { key, rest: decodeURIComponent(pathname.slice(key.length + 1)) };
  }
  return null;
}

export function demoRequest(path: string, method: string, body?: unknown): unknown {
  const db = load();
  const pathname = path.split("?")[0].replace(/\/$/, "") || "/";
  if (db.singles[pathname] && method === "GET") return structuredClone(db.singles[pathname]);
  if (db.singles[pathname] && method === "PATCH" && isRecord(body)) {
    db.singles[pathname] = { ...db.singles[pathname], ...body };
    save(db);
    return structuredClone(db.singles[pathname]);
  }

  if (pathname === "/authentication/live-users/disconnect" && method === "POST") {
    const id = isRecord(body) ? body.liveUserId : undefined;
    db.lists["/authentication/live-users"] = db.lists["/authentication/live-users"].filter((item) => item.liveUserId !== id);
    save(db);
    return { status: "disconnected" };
  }

  const match = collectionOf(pathname, db);
  if (!match) {
    if (method === "GET") return { items: [], pages: { current: 1, size: 0, maxSize: 200, total: 0 } };
    throw new Error("Sample mode does not include that endpoint. Connect to the firewall to use it.");
  }

  const list = db.lists[match.key];
  if (!match.rest && method === "GET") {
    return { items: structuredClone(list), pages: { current: 1, size: list.length, maxSize: 200, total: 1, items: list.length } };
  }
  if (!match.rest && method === "POST") {
    const created = isRecord(body) ? { id: crypto.randomUUID(), ...body } : { id: crypto.randomUUID() };
    list.unshift(created);
    save(db);
    return structuredClone(created);
  }
  if (match.rest === "move" && method === "POST" && isRecord(body)) {
    const name = String(body.name ?? "");
    const position = String(body.position ?? "bottom");
    const reference = isRecord(body.referenceItem) ? String(body.referenceItem.name ?? "") : "";
    const index = list.findIndex((item) => item.name === name);
    if (index < 0) throw new Error("That rule is not in the sample list.");
    const [item] = list.splice(index, 1);
    if (position === "top") list.unshift(item);
    else if (position === "bottom") list.push(item);
    else {
      const ref = list.findIndex((entry) => entry.name === reference);
      const insert = ref < 0 ? list.length : position === "before" ? ref : ref + 1;
      list.splice(insert, 0, item);
    }
    save(db);
    return { name, position };
  }

  const id = match.rest;
  const index = list.findIndex((item) => item.id === id || item.name === id || String(item.liveUserId ?? "") === id);
  if (index < 0) throw new Error("That object was not found.");
  if (method === "GET") return structuredClone(list[index]);
  if (method === "DELETE") {
    const [removed] = list.splice(index, 1);
    save(db);
    return structuredClone(removed);
  }
  if (method === "PATCH" && isRecord(body)) {
    list[index] = { ...list[index], ...body };
    save(db);
    return structuredClone(list[index]);
  }
  throw new Error("That change is not available in sample mode.");
}

export function demoList(path: string): JsonRecord[] {
  return asList(demoRequest(path, "GET")).items;
}
