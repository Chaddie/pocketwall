"use client";

import { demoRequest } from "@/lib/demo";
import { asList, isRecord, text, type JsonRecord } from "@/lib/format";

export type Connection = {
  mode: "live" | "demo";
  host: string;
  port: string;
  apiKey: string;
  insecure: boolean;
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

let current: Connection | null = null;

export function setApiConnection(connection: Connection | null) {
  current = connection;
}

function messageFrom(body: unknown, status: number): string {
  if (isRecord(body)) {
    const message = text(body.message) || text(body.error);
    if (message && message !== "badRequest" && message !== "notAuthorized" && message !== "forbidden") return message;
    if (message === "notAuthorized") return "The API key was rejected. Generate a new key and paste it again.";
    if (message === "forbidden") return "This API key does not have permission for that change.";
    if (text(body.message)) return text(body.message);
  }
  if (status === 401) return "Unlock Pocketwall, or check the API key.";
  return `The firewall returned status ${status}.`;
}

export async function sophos(path: string, init?: { method?: string; body?: unknown; query?: Record<string, string | number | boolean> }): Promise<unknown> {
  const connection = current;
  if (!connection) throw new ApiError("Connect to a firewall first.");
  const method = (init?.method ?? "GET").toUpperCase();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(init?.query ?? {})) query.set(key, String(value));
  const suffix = query.size ? `?${query.toString()}` : "";
  if (connection.mode === "demo") return demoRequest(`${path}${suffix}`, method, init?.body);

  const response = await fetch(`/api/sophos${path}${suffix}`, {
    method,
    headers: {
      "content-type": "application/json",
      "x-pocketwall-host": connection.host,
      "x-pocketwall-port": connection.port,
      "x-pocketwall-key": connection.apiKey,
      "x-pocketwall-insecure": connection.insecure ? "1" : "0",
    },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw.slice(0, 400) };
    }
  }
  if (!response.ok) throw new ApiError(messageFrom(parsed, response.status), response.status);
  return parsed;
}

export async function sophosList(path: string): Promise<JsonRecord[]> {
  const items: JsonRecord[] = [];
  for (let page = 1; page <= 8; page += 1) {
    const data = await sophos(path, { query: { page, pageSize: 100, pageTotal: true } });
    const parsed = asList(data);
    items.push(...parsed.items);
    const total = Number(parsed.pages?.total ?? 0);
    if (!total || page >= total || parsed.items.length === 0) break;
  }
  return items;
}

export async function probeConnection(connection: Connection): Promise<JsonRecord> {
  const previous = current;
  setApiConnection(connection);
  try {
    const data = await sophos("/administration/system-settings");
    return isRecord(data) ? data : {};
  } finally {
    setApiConnection(previous);
  }
}
