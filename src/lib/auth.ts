import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "pocketwall_session";

export function passwordRequired() {
  return Boolean(process.env.POCKETWALL_PASSWORD);
}

function mac(value: string) {
  const secret = process.env.POCKETWALL_SECRET || process.env.POCKETWALL_PASSWORD || "pocketwall-dev";
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function sessionToken() {
  return mac("pocketwall-session-v1");
}

export function passwordMatches(input: string) {
  const expected = process.env.POCKETWALL_PASSWORD ?? "";
  const left = createHmac("sha256", "pocketwall-login").update(input).digest();
  const right = createHmac("sha256", "pocketwall-login").update(expected).digest();
  return timingSafeEqual(left, right);
}

export async function isAuthed() {
  if (!passwordRequired()) return true;
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value ?? "";
  const expected = sessionToken();
  if (value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}
