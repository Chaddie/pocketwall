"use client";

import { useEffect, useState } from "react";
import { AppShell, BrandBar } from "@/components/AppShell";
import { setApiConnection } from "@/lib/api";
import { ConnectionProvider, useConnection } from "@/lib/connection";
import { Banner, TextField } from "@/components/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConnectionProvider>
      <ApiBridge>
        <LockGate>
          <AppShell>{children}</AppShell>
        </LockGate>
      </ApiBridge>
    </ConnectionProvider>
  );
}

function ApiBridge({ children }: { children: React.ReactNode }) {
  const { connection } = useConnection();
  setApiConnection(connection);
  return children;
}

function LockGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "open" | "locked">("loading");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    fetch("/api/auth")
      .then((response) => response.json())
      .then((data: { required?: boolean; ok?: boolean }) => {
        if (cancel) return;
        setState(data.required && !data.ok ? "locked" : "open");
      })
      .catch(() => {
        if (!cancel) setState("open");
      });
    return () => {
      cancel = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <>
        <BrandBar />
        <main className="app-main"><p className="muted">Opening Pocketwall…</p></main>
      </>
    );
  }
  if (state === "locked") {
    return (
      <>
      <BrandBar />
      <main className="app-main">
        <p className="kicker">Pocketwall</p>
        <h1 style={{ fontSize: 36 }}>Unlock</h1>
        <p className="muted">This site asks for the Pocketwall password before it will call the firewall.</p>
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            setError("");
            void fetch("/api/auth", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ password }),
            }).then(async (response) => {
              if (!response.ok) {
                const body = (await response.json().catch(() => null)) as { message?: string } | null;
                setError(body?.message || "Could not unlock.");
                return;
              }
              setState("open");
            });
          }}
        >
          <TextField label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
          {error ? <Banner tone="bad">{error}</Banner> : null}
          <button className="btn" type="submit">Unlock</button>
        </form>
      </main>
      </>
    );
  }
  return children;
}
