"use client";

import { CollectionSection } from "@/components/CollectionSection";
import { NeedConnection } from "@/components/NeedConnection";
import { Banner, PageHeader } from "@/components/ui";
import { useList } from "@/components/useList";
import { sophos } from "@/lib/api";
import { useConnection } from "@/lib/connection";
import { displayName, errorMessage, itemKey, text, type JsonRecord } from "@/lib/format";
import { useState } from "react";

export default function PeoplePage() {
  const { connection, ready } = useConnection();
  const live = useList(connection ? "/authentication/live-users" : null);
  const [notice, setNotice] = useState("");
  if (ready && !connection) {
    return (
      <div className="stack">
        <PageHeader title="People" subtitle="Network users and who is signed in." />
        <NeedConnection />
      </div>
    );
  }
  return (
    <div className="stack">
      <PageHeader title="People" subtitle="Users, groups, and sessions that are signed in now." onRefresh={() => void live.reload()} />
      {notice ? <Banner tone="bad">{notice}</Banner> : null}
      <section className="stack">
        <h2 style={{ margin: 0, fontSize: 20 }}>Live sessions</h2>
        {live.error ? <Banner tone="bad">{live.error}</Banner> : null}
        {!live.loading && live.items.length === 0 ? <p className="small muted">Nobody is signed in.</p> : null}
        {live.items.map((item) => (
          <article className="list-card" key={itemKey(item) || displayName(item)}>
            <div className="bar" />
            <div className="body">
              <h3>{displayName(item)}</h3>
              <p>{text(item.ipAddress) || text(item.clientIp) || text(item.group)}</p>
            </div>
            <div className="side">
              <button className="btn danger" type="button" onClick={() => void disconnect(item, live.reload, setNotice)}>End</button>
            </div>
          </article>
        ))}
      </section>
      <CollectionSection title="Network users" path="/authentication/users/network-users" createHref="/people/edit" itemHref={(item) => `/people/edit?id=${encodeURIComponent(itemKey(item))}`} meta={(item) => (item.active === false ? "Inactive" : text(item.displayName))} />
      <CollectionSection title="Groups" path="/authentication/user-groups" createHref="/edit?collection=%2Fauthentication%2Fuser-groups" itemHref={(item) => `/edit?collection=${encodeURIComponent("/authentication/user-groups")}&id=${encodeURIComponent(itemKey(item))}`} meta={(item) => text(item.description)} />
    </div>
  );
}

async function disconnect(item: JsonRecord, reload: () => Promise<void>, setNotice: (value: string) => void) {
  const liveUserId = Number(item.liveUserId ?? item.id);
  if (!Number.isFinite(liveUserId)) {
    setNotice("This session did not include a live user id, so it cannot be ended from here.");
    return;
  }
  if (!window.confirm(`End the session for ${displayName(item)}?`)) return;
  try {
    await sophos("/authentication/live-users/disconnect", {
      method: "POST",
      body: { liveUserId, message: "Your session was ended from Pocketwall." },
    });
    setNotice("");
    await reload();
  } catch (reason) {
    setNotice(errorMessage(reason));
  }
}
