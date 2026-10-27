"use client";

import { Boxes, House, Menu, Shield, Waypoints } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { Sheet } from "@/components/ui";

const more = [
  { href: "/nat", title: "NAT", detail: "Masquerade and translations" },
  { href: "/people", title: "People", detail: "Users, groups, live sessions" },
  { href: "/web", title: "Web", detail: "Policies and exceptions" },
  { href: "/vpn", title: "VPN", detail: "IPsec and SSL VPN" },
  { href: "/explore", title: "Everything", detail: "Every SFOS 23 API collection" },
  { href: "/settings", title: "Settings", detail: "Connection and allowed IP" },
];

export function BrandBar() {
  return (
    <header className="brandbar">
      <img src="/brand/sophos-logo-on-dark.svg" alt="Sophos" />
      <span className="brandbar-product">Pocketwall</span>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = more.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <>
      <BrandBar />
      <main className="app-main">
        <Suspense fallback={<p className="muted">Loading…</p>}>{children}</Suspense>
      </main>
      <nav className="tabbar" aria-label="Primary">
        <div className="tabbar-inner">
          <Tab href="/" label="Home" active={pathname === "/"} icon={<House />} />
          <Tab href="/rules" label="Rules" active={pathname.startsWith("/rules")} icon={<Shield />} />
          <Tab href="/objects" label="Objects" active={pathname.startsWith("/objects")} icon={<Boxes />} />
          <Tab href="/network" label="Network" active={pathname.startsWith("/network")} icon={<Waypoints />} />
          <button className={moreActive ? "tab active" : "tab"} type="button" onClick={() => setOpen(true)}>
            <Menu />
            More
          </button>
        </div>
      </nav>
      {open ? (
        <Sheet title="More" onClose={() => setOpen(false)}>
          {more.map((item) => (
            <Link key={item.href} href={item.href} className="menu-link" onClick={() => setOpen(false)}>
              {item.title}
              <span>{item.detail}</span>
            </Link>
          ))}
        </Sheet>
      ) : null}
    </>
  );
}

function Tab({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: React.ReactNode }) {
  return (
    <Link className={active ? "tab active" : "tab"} href={href}>
      {icon}
      {label}
    </Link>
  );
}
