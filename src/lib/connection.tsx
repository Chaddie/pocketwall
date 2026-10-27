"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { looksPrivateHost, parseEndpoint } from "@/lib/target";

export type Connection = {
  mode: "live" | "demo";
  host: string;
  port: string;
  apiKey: string;
  insecure: boolean;
};

type ConnectionContextValue = {
  ready: boolean;
  connection: Connection | null;
  connect: (input: { host: string; port: string; apiKey: string; insecure: boolean; remember: boolean }) => void;
  preview: () => void;
  disconnect: () => void;
};

const KEY = "pocketwall.connection";
const ConnectionContext = createContext<ConnectionContextValue | null>(null);

function readStored(): Connection | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Partial<Connection>;
    if (value.mode !== "live" && value.mode !== "demo") return null;
    return {
      mode: value.mode,
      host: value.host ?? "",
      port: value.port ?? "4444",
      apiKey: value.apiKey ?? "",
      insecure: value.insecure !== false,
    };
  } catch {
    return null;
  }
}

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);

  useEffect(() => {
    setConnection(readStored());
    setReady(true);
  }, []);

  const value = useMemo<ConnectionContextValue>(
    () => ({
      ready,
      connection,
      connect: ({ host, port, apiKey, insecure, remember }) => {
        const endpoint = parseEndpoint(host, port);
        const next: Connection = {
          mode: "live",
          host: endpoint.host,
          port: endpoint.port,
          apiKey: apiKey.trim(),
          insecure,
        };
        if (!next.apiKey) throw new Error("Paste the API key from Administration, API access.");
        setConnection(next);
        if (remember) localStorage.setItem(KEY, JSON.stringify(next));
        else localStorage.removeItem(KEY);
      },
      preview: () => {
        const next: Connection = { mode: "demo", host: "sample", port: "4444", apiKey: "", insecure: true };
        setConnection(next);
        localStorage.setItem(KEY, JSON.stringify(next));
      },
      disconnect: () => {
        setConnection(null);
        localStorage.removeItem(KEY);
      },
    }),
    [connection, ready]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const value = useContext(ConnectionContext);
  if (!value) throw new Error("ConnectionProvider is missing.");
  return value;
}

export function privateHostWarning(host: string): string | null {
  try {
    const endpoint = parseEndpoint(host, "4444");
    if (!looksPrivateHost(endpoint.host)) return null;
    return "A private address only works when Pocketwall itself is running on that network. The hosted site calls the firewall from the internet.";
  } catch {
    return null;
  }
}
