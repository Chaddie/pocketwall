"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { NeedConnection } from "@/components/NeedConnection";
import { Banner, PageHeader, Skeletons } from "@/components/ui";
import { useList } from "@/components/useList";
import { sophos } from "@/lib/api";
import { createExample } from "@/lib/catalog";
import { useConnection } from "@/lib/connection";
import { displayName, errorMessage, isRecord, itemKey, parseJsonObject, pretty, stripReadOnly, text } from "@/lib/format";

export default function EditPage() {
  const params = useSearchParams();
  const router = useRouter();
  const collection = params.get("collection") || "";
  const id = params.get("id") || "";
  const caution = params.get("caution") === "1";
  const { connection, ready } = useConnection();
  const list = useList(!id && collection ? collection : null);
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!collection || !connection) return;
    if (!id) {
      setTextValue(pretty(createExample(collection)));
      setLoaded(true);
      return;
    }
    let cancel = false;
    setLoaded(false);
    sophos(`${collection}/${encodeURIComponent(id)}`)
      .then((data) => {
        if (!cancel) setTextValue(pretty(isRecord(data) ? data : {}));
      })
      .catch((reason) => {
        if (!cancel) setError(errorMessage(reason));
      })
      .finally(() => {
        if (!cancel) setLoaded(true);
      });
    return () => {
      cancel = true;
    };
  }, [collection, connection, id]);

  if (!collection) return <Banner tone="bad">Choose a collection from Everything.</Banner>;
  if (ready && !connection) return <NeedConnection />;

  async function save() {
    setBusy(true);
    setError("");
    try {
      const body = stripReadOnly(parseJsonObject(textValue));
      if (id) await sophos(`${collection}/${encodeURIComponent(id)}`, { method: "PATCH", body });
      else await sophos(collection, { method: "POST", body });
      router.push(`/edit?collection=${encodeURIComponent(collection)}`);
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  if (!id) {
    return (
      <div className="stack">
        <PageHeader title={collection} subtitle="Tap an item to edit it, or create one from the example below." />
        {caution || collection.includes("interfaces") ? <Banner tone="warn">Interface changes can take the network offline.</Banner> : null}
        {list.error ? <Banner tone="bad">{list.error}</Banner> : null}
        {list.loading ? <Skeletons /> : null}
        {list.items.map((item) => (
          <Link key={itemKey(item) || displayName(item)} href={`/edit?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(itemKey(item))}`} className="list-card">
            <div className="bar" />
            <div className="body">
              <h3>{displayName(item)}</h3>
              <p>{text(item.description) || text(item.type)}</p>
            </div>
            <div className="side" />
          </Link>
        ))}
        <label className="field">
          <span>New object</span>
          <textarea value={textValue} spellCheck={false} onChange={(event) => setTextValue(event.target.value)} />
        </label>
        {error ? <Banner tone="bad">{error}</Banner> : null}
        <button className="btn" type="button" disabled={busy || !loaded} onClick={() => void save()}>{busy ? "Saving…" : "Create"}</button>
      </div>
    );
  }

  return (
    <div className="stack">
      <PageHeader title="Edit" subtitle={collection} />
      {caution || collection.includes("interfaces") ? <Banner tone="warn">Interface changes can take the network offline. Read the JSON before saving.</Banner> : null}
      {!loaded ? <Skeletons count={2} /> : (
        <label className="field">
          <span>JSON</span>
          <textarea value={textValue} spellCheck={false} onChange={(event) => setTextValue(event.target.value)} />
        </label>
      )}
      {error ? <Banner tone="bad">{error}</Banner> : null}
      <div className="btn-row">
        <button className="btn" type="button" disabled={busy || !loaded} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
        <button
          className="btn danger"
          type="button"
          disabled={busy}
          onClick={() => {
            if (!window.confirm("Delete this object?")) return;
            setBusy(true);
            void sophos(`${collection}/${encodeURIComponent(id)}`, { method: "DELETE" })
              .then(() => router.push(`/edit?collection=${encodeURIComponent(collection)}`))
              .catch((reason) => setError(errorMessage(reason)))
              .finally(() => setBusy(false));
          }}
        >
          Delete
        </button>
        <Link className="btn secondary" href={`/edit?collection=${encodeURIComponent(collection)}`} style={{ display: "inline-flex", alignItems: "center" }}>Back</Link>
      </div>
    </div>
  );
}
