import { NextRequest, NextResponse } from "next/server";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : "https://api.transcendinfinity.com.br";

const SENTRY_INGEST = "https://o4512166791217152.ingest.us.sentry.io";

const PROTECTED = ["/game", "/admin"];

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    `connect-src 'self' ${API_ORIGIN} ${SENTRY_INGEST}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
  ].join("; ");

  const isProtected = PROTECTED.some((p) => req.nextUrl.pathname.startsWith(p));
  const hasSession = req.cookies.has("ti_session") || req.cookies.has("ti_offline");

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
