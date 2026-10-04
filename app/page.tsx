"use client";

export const runtime = 'edge';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated() ? "/game" : "/login");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center bg-void">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
    </div>
  );
}
