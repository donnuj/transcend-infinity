import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const hasSession =
    req.cookies.has("ti_session") || req.cookies.has("ti_offline");

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/game/:path*"],
};
