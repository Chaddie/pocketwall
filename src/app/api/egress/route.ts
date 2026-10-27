import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const controllers = [
    "https://api.ipify.org?format=json",
    "https://ifconfig.me/ip",
  ];
  for (const url of controllers) {
    try {
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) continue;
      const text = (await response.text()).trim();
      const ip = text.startsWith("{") ? (JSON.parse(text) as { ip?: string }).ip : text;
      if (ip && /^[0-9a-fA-F:.]+$/.test(ip)) {
        return NextResponse.json({
          ip,
          vercel: process.env.VERCEL === "1",
          allowPrivate: process.env.POCKETWALL_ALLOW_PRIVATE === "1" || process.env.VERCEL !== "1",
        });
      }
    } catch {
      /* try the next lookup */
    }
  }
  return NextResponse.json({ message: "Pocketwall could not detect its public address." }, { status: 502 });
}
