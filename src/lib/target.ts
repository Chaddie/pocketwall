function ipVersion(value: string): 0 | 4 | 6 {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return 4;
  if (value.includes(":") && /^[0-9a-fA-F:.]+$/.test(value)) return 6;
  return 0;
}

export function parseEndpoint(hostInput: string, portInput: string): { host: string; port: string } {
  let host = hostInput.trim();
  let port = portInput.trim();
  if (!host) throw new Error("Enter the firewall hostname or IP address.");

  if (host.includes("://")) {
    let url: URL;
    try {
      url = new URL(host);
    } catch {
      throw new Error("That firewall address is not a valid URL.");
    }
    if (url.protocol !== "https:") throw new Error("Pocketwall only connects over HTTPS.");
    if (url.username || url.password) throw new Error("Put the API key in the key field, not in the URL.");
    host = url.hostname;
    if (!port && url.port) port = url.port;
  }

  host = host.replace(/^\[|\]$/g, "").replace(/\/.*$/, "");
  if (!port) port = "4444";
  if (!/^\d{1,5}$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    throw new Error("The admin port must be a number from 1 to 65535.");
  }
  if (!isAcceptableHost(host)) throw new Error("Enter a hostname or IP address, without a path.");
  return { host, port };
}

export function isAcceptableHost(host: string): boolean {
  if (!host || host.length > 253 || /\s/.test(host)) return false;
  if (ipVersion(host) !== 0) return true;
  return /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(host);
}

export function blockedAddressReason(ip: string, allowPrivate: boolean): string | null {
  const normalized = ip.toLowerCase();
  if (normalized.startsWith("::ffff:")) return blockedAddressReason(normalized.slice(7), allowPrivate);

  if (ipVersion(normalized) === 4) {
    const parts = normalized.split(".").map((part) => Number(part));
    if (parts.some((part) => Number.isNaN(part) || part > 255)) return "That address is not a valid IPv4 address.";
    const [a, b] = parts;
    if (a === 0 || a === 127) return "Loopback addresses are blocked.";
    if (a === 169 && b === 254) return "Link-local and metadata addresses are blocked.";
    if (a === 255 || a >= 224) return "Broadcast and multicast addresses are blocked.";
    const carrier = a === 100 && b >= 64 && b <= 127;
    const priv = a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || carrier;
    if (priv && !allowPrivate) {
      return "This Pocketwall server cannot reach private firewall addresses. Use the firewall's public admin hostname, or run Pocketwall on your own network.";
    }
    return null;
  }

  if (normalized === "::1" || normalized === "::") return "Loopback addresses are blocked.";
  if (/^fe[89ab]/.test(normalized)) return "Link-local addresses are blocked.";
  if (/^f[cd]/.test(normalized) && !allowPrivate) {
    return "This Pocketwall server cannot reach private firewall addresses. Use the firewall's public admin hostname, or run Pocketwall on your own network.";
  }
  return null;
}

export function looksPrivateHost(host: string): boolean {
  return blockedAddressReason(host, false) !== null;
}
