"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { collections, groupLabel } from "@/lib/catalog";

export default function ExploreGroupPage() {
  const params = useParams<{ group: string }>();
  const group = decodeURIComponent(params.group);
  const items = collections(group);
  return (
    <div className="stack">
      <PageHeader title={groupLabel(group)} subtitle="Open a collection to read it. Create and edit use the firewall's own fields." />
      {items.map((item) => (
        <Link key={item.path} href={`/edit?collection=${encodeURIComponent(item.path)}`} className="list-card">
          <div className="bar" />
          <div className="body">
            <h3>{item.title}</h3>
            <p>{item.path}</p>
          </div>
          <div className="side" />
        </Link>
      ))}
    </div>
  );
}
