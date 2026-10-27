import Link from "next/link";

export function NeedConnection() {
  return (
    <section className="card" style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Connect first</h2>
      <p className="muted">Pocketwall needs the firewall address and an API key before it can show this.</p>
      <Link href="/" className="btn" style={{ display: "inline-flex", alignItems: "center" }}>Open Home</Link>
    </section>
  );
}
