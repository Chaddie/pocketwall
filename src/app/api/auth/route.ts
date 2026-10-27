import { NextResponse } from "next/server";
import { isAuthed, passwordMatches, passwordRequired, SESSION_COOKIE, sessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ required: passwordRequired(), ok: await isAuthed() });
}

export async function POST(request: Request) {
  if (!passwordRequired()) return NextResponse.json({ ok: true, required: false });
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !passwordMatches(body.password)) {
    return NextResponse.json({ message: "That password does not match." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, required: true });
  response.cookies.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
