"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { groups } from "@/lib/catalog";

export default function ExplorePage() {
  return (
    <div className="stack">
      <PageHeader title="Everything" subtitle="Every collection in the SFOS 23 configuration API. Rules, hosts, and NAT have simpler screens of their own." />
      {groups().map((group) => (
        <Link key={group.id} href={`/explore/${group.id}`} className="list-card">
          <div className="bar" />
          <div className="body">
            <h3>{group.label}</h3>
            <p>{group.count} collections</p>
          </div>
          <div className="side" />
        </Link>
      ))}
    </div>
  );
}
