import { lookup } from "node:dns/promises";
import https from "node:https";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { blockedAddressReason, parseEndpoint } from "@/lib/target";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY = 1_000_000;
const MAX_RESPONSE = 8_000_000;

async function forward(request: Request, path: string[]) {
  if (!(await isAuthed())) {
    return NextResponse.json({ message: "Unlock Pocketwall before it can reach the firewall." }, { status: 401 });
  }
  if (path.some((segment) => !segment || segment === "." || segment === "..")) {
    return NextResponse.json({ message: "That API path is not allowed." }, { status: 400 });
  }

  const hostHeader = request.headers.get("x-pocketwall-host") ?? "";
  const portHeader = request.headers.get("x-pocketwall-port") ?? "";
  const apiKey = request.headers.get("x-pocketwall-key") ?? "";
  const insecure = request.headers.get("x-pocketwall-insecure") === "1";
  if (!apiKey || apiKey.length > 4000 || /[\r\n]/.test(apiKey)) {
    return NextResponse.json({ message: "Add the firewall API key in Pocketwall." }, { status: 400 });
  }

  let endpoint: { host: string; port: string };
  try {
    endpoint = parseEndpoint(hostHeader, portHeader);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Invalid firewall address." }, { status: 400 });
  }

  const allowPrivate = process.env.POCKETWALL_ALLOW_PRIVATE === "1" || process.env.VERCEL !== "1";
  try {
    const addresses = await lookup(endpoint.host, { all: true, verbatim: true });
    if (addresses.length === 0) throw new Error("The firewall hostname did not resolve.");
    for (const address of addresses) {
      const reason = blockedAddressReason(address.address, allowPrivate);
      if (reason) return NextResponse.json({ message: reason }, { status: 400 });
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Could not resolve the firewall.";
    return NextResponse.json({ message: reason }, { status: 502 });
  }

  const apiPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const incoming = new URL(request.url);
  const hostForUrl = endpoint.host.includes(":") ? `[${endpoint.host}]` : endpoint.host;
  const target = `https://${hostForUrl}:${endpoint.port}/api/firewall-config/v1/${apiPath}${incoming.search}`;

  const chunks: Buffer[] = [];
  if (request.method !== "GET" && request.method !== "HEAD") {
    const raw = Buffer.from(await request.arrayBuffer());
    if (raw.length > MAX_BODY) return NextResponse.json({ message: "That change is too large." }, { status: 413 });
    chunks.push(raw);
  }

  try {
    const result = await firewallRequest(target, request.method, apiKey, insecure, Buffer.concat(chunks));
    return new NextResponse(new Uint8Array(result.body), {
      status: result.status,
      headers: {
        "content-type": result.contentType,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "";
    if (code.includes("CERT") || code.includes("TLS") || code === "DEPTH_ZERO_SELF_SIGNED_CERT" || code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "ERR_TLS_CERT_ALTNAME_INVALID") {
      return NextResponse.json(
        { message: "The firewall certificate was rejected. Turn on “Trust the appliance certificate” if this firewall uses the default Sophos certificate." },
        { status: 502 }
      );
    }
    if (code === "ECONNREFUSED" || code === "EHOSTUNREACH" || code === "ENOTFOUND" || code === "ETIMEDOUT" || code === "ECONNRESET") {
      return NextResponse.json(
        { message: "Pocketwall could not reach the firewall. Check the hostname, admin port, device access, and the allowed IP host." },
        { status: 502 }
      );
    }
    return NextResponse.json({ message: "The connection to the firewall failed." }, { status: 502 });
  }
}

function firewallRequest(url: string, method: string, apiKey: string, insecure: boolean, body: Buffer) {
  const target = new URL(url);
  return new Promise<{ status: number; contentType: string; body: Buffer }>((resolve, reject) => {
    const req = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        method,
        rejectUnauthorized: !insecure,
        servername: target.hostname,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${apiKey}`,
          ...(body.length ? { "content-type": "application/json", "content-length": body.length } : {}),
        },
        timeout: 50_000,
      },
      (res) => {
        const parts: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE) {
            req.destroy(new Error("response-too-large"));
            return;
          }
          parts.push(chunk);
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 502,
            contentType: res.headers["content-type"] || "application/json",
            body: Buffer.concat(parts),
          });
        });
      }
    );
    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    req.on("error", reject);
    if (body.length) req.write(body);
    req.end();
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
