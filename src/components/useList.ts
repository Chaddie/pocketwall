"use client";

import { useCallback, useEffect, useState } from "react";
import { sophosList } from "@/lib/api";
import { useConnection } from "@/lib/connection";
import { errorMessage, type JsonRecord } from "@/lib/format";

export function useList(path: string | null) {
  const { connection, ready } = useConnection();
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!ready) return;
    if (!connection || !path) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setItems(await sophosList(path));
    } catch (reason) {
      setItems([]);
      setError(errorMessage(reason));
    } finally {
      setLoading(false);
    }
  }, [connection, path, ready]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, setItems, loading, error, reload, connected: Boolean(connection), demo: connection?.mode === "demo" };
}
