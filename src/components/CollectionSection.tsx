"use client";

import Link from "next/link";
import { Banner, Skeletons } from "@/components/ui";
import { useList } from "@/components/useList";
import { displayName, itemKey, type JsonRecord } from "@/lib/format";

export function CollectionSection({
  title,
  path,
  createHref,
  itemHref,
  meta,
}: {
  title: string;
  path: string;
  createHref?: string;
  itemHref: (item: JsonRecord) => string;
  meta?: (item: JsonRecord) => string;
}) {
  const { items, loading, error, connected } = useList(connectedPath(path));
  if (!connected && !loading) return null;
  return (
    <section className="stack">
      <div className="spread">
        <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
        {createHref ? <Link href={createHref} className="btn ghost">Add</Link> : null}
      </div>
      {error ? <Banner tone="bad">{error}</Banner> : null}
      {loading ? <Skeletons count={2} /> : null}
      {!loading && items.length === 0 ? <p className="small muted">Nothing here yet.</p> : null}
      {items.map((item) => {
        const key = itemKey(item) || displayName(item);
        return (
          <Link key={key} href={itemHref(item)} className="list-card">
            <div className="bar" />
            <div className="body">
              <h3>{displayName(item)}</h3>
              <p>{meta ? meta(item) : ""}</p>
            </div>
            <div className="side" />
          </Link>
        );
      })}
    </section>
  );
}

function connectedPath(path: string) {
  return path;
}
