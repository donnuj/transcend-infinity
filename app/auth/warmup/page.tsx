"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function WarmupContent() {
  const params = useSearchParams();
  const next = params.get("next") ?? "";
  const [dots, setDots] = useState(".");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!next) { window.close(); return; }

    let cancelled = false;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);

    const deadline = Date.now() + 40_000;

    async function poll() {
      while (!cancelled && Date.now() < deadline) {
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || "https://api.transcendinfinity.com.br/api/v1";
          const res = await fetch(`${base}/health`, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            clearInterval(interval);
            window.location.href = next;
            return;
          }
        } catch {
          // service still waking up — retry
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) setError(true);
      clearInterval(interval);
    }

    void poll();
    return () => { cancelled = true; clearInterval(interval); };
  }, [next]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      {error ? (
        <>
          <p className="text-[12px] tracking-[0.15em] text-red-400/80">
            Servidor não respondeu. Tente novamente.
          </p>
          <button
            onClick={() => window.close()}
            className="text-[10px] tracking-widest text-violet/50 hover:text-violet/80"
          >
            FECHAR
          </button>
        </>
      ) : (
        <p
          className="w-40 text-[12px] tracking-[0.2em] uppercase"
          style={{ color: "rgba(200,155,60,0.7)" }}
        >
          Servidor acordando{dots}
        </p>
      )}
    </div>
  );
}

export default function AuthWarmupPage() {
  return (
    <Suspense>
      <WarmupContent />
    </Suspense>
  );
}
