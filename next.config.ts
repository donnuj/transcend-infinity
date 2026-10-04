import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// CSP is set dynamically (with per-request nonce) in middleware.ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "transcend-infinity",
  project: "transcend-infinity-web",
  silent: true,
  widenClientFileUpload: true,
});
