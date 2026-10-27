"use client";

import { CollectionSection } from "@/components/CollectionSection";
import { NeedConnection } from "@/components/NeedConnection";
import { PageHeader } from "@/components/ui";
import { useConnection } from "@/lib/connection";
import { itemKey, text } from "@/lib/format";

function editHref(collection: string, id: string) {
  return `/edit?collection=${encodeURIComponent(collection)}&id=${encodeURIComponent(id)}`;
}

export default function WebPage() {
  const { connection, ready } = useConnection();
  if (ready && !connection) {
    return (
      <div className="stack">
        <PageHeader title="Web" subtitle="Policies that decide what sites are allowed." />
        <NeedConnection />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title="Web" subtitle="Policies, exceptions, and URL groups." />
      <CollectionSection title="Policies" path="/web/policies" createHref={`/edit?collection=${encodeURIComponent("/web/policies")}`} itemHref={(item) => editHref("/web/policies", itemKey(item))} meta={(item) => text(item.description)} />
      <CollectionSection title="Exceptions" path="/web/exceptions" createHref={`/edit?collection=${encodeURIComponent("/web/exceptions")}`} itemHref={(item) => editHref("/web/exceptions", itemKey(item))} meta={(item) => text(item.description)} />
      <CollectionSection title="URL groups" path="/web/url-groups" createHref={`/edit?collection=${encodeURIComponent("/web/url-groups")}`} itemHref={(item) => editHref("/web/url-groups", itemKey(item))} meta={(item) => text(item.description)} />
    </div>
  );
}
