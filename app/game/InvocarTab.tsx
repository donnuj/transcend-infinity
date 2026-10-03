"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { BANNERS, BANNER_MAP } from "@/lib/game/data/banners";
import { HERO_MAP } from "@/lib/game/data/heroes";
import type { BannerDef, GachaRarity, HeroDef } from "@/lib/game/types";
import { sfx } from "@/lib/game/sfx";
import { RARITY_CARD } from "@/lib/game/animation";

const ease = [0.23, 1, 0.32, 1] as const;

const RARITY_STYLE: Record<GachaRarity, { color: string; glow: string; border: string; label: string }> = {
  Comum:    { color: "rgb(180,180,210)",  glow: "rgba(180,180,210,0.12)", border: "rgba(180,180,210,0.25)", label: "Comum"    },
  Incomum:  { color: "rgb(100,210,130)",  glow: "rgba(100,210,130,0.12)", border: "rgba(100,210,130,0.3)",  label: "Incomum"  },
  Raro:     { color: "rgb(90,150,255)",   glow: "rgba(90,150,255,0.18)",  border: "rgba(90,150,255,0.4)",   label: "Raro"     },
  Épico:    { color: "rgb(180,110,255)",  glow: "rgba(180,110,255,0.2)",  border: "rgba(180,110,255,0.45)", label: "Épico"    },
  Lendário: { color: "rgb(200,155,60)",   glow: "rgba(200,155,60,0.3)",   border: "rgba(200,155,60,0.6)",   label: "Lendário" },
  Mítico:   { color: "rgb(255,80,80)",    glow: "rgba(255,80,80,0.25)",   border: "rgba(255,80,80,0.55)",   label: "Mítico"   },
  Divino:   { color: "rgb(255,255,200)",  glow: "rgba(255,255,200,0.35)", border: "rgba(255,255,200,0.7)",  label: "Divino"   },
};

type PullResult = {
  hero: HeroDef;
  rarity: GachaRarity;
  isNew: boolean;
  wasPity: boolean;
  fragmentsAwarded: number;
};

// ── Gacha engine pura ─────────────────────────────────────────────────────────

function rollBanner(banner: BannerDef, pityCount: number): { heroId: string; rarity: GachaRarity; wasPity: boolean } {
  const forcedPity = pityCount >= banner.pityThreshold;

  // Soft pity: multiplicador crescente a partir de softPityStart
  const softMult = pityCount >= banner.softPityStart
    ? 1 + (pityCount - banner.softPityStart) * 0.05
    : 1;

  if (forcedPity) {
    const legendPool = banner.pool.filter(
      (e) => e.rarity === "Lendário" || e.rarity === "Mítico" || e.rarity === "Divino"
    );
    if (legendPool.length) {
      const picked = legendPool[Math.floor(Math.random() * legendPool.length)];
      return { heroId: picked.heroId, rarity: picked.rarity, wasPity: true };
    }
  }

  let totalWeight = 0;
  for (const e of banner.pool) {
    const isLegend = e.rarity === "Lendário" || e.rarity === "Mítico" || e.rarity === "Divino";
    totalWeight += isLegend ? e.weight * softMult : e.weight;
  }

  let roll = Math.random() * totalWeight;
  for (const e of banner.pool) {
    const isLegend = e.rarity === "Lendário" || e.rarity === "Mítico" || e.rarity === "Divino";
    const w = isLegend ? e.weight * softMult : e.weight;
    roll -= w;
    if (roll <= 0) return { heroId: e.heroId, rarity: e.rarity, wasPity: false };
  }
  const last = banner.pool[banner.pool.length - 1];
  return { heroId: last.heroId, rarity: last.rarity, wasPity: false };
}

const RANK_ORDER: GachaRarity[] = ["Comum", "Incomum", "Raro", "Épico", "Lendário", "Mítico", "Divino"];

// ── Componente principal ──────────────────────────────────────────────────────

export default function InvocarTab() {
  const store = useGameStore();
  const [activeBannerId, setActiveBannerId] = useState(BANNERS[0].bannerId);
  const [results, setResults] = useState<PullResult[] | null>(null);
  const [pulling, setPulling] = useState(false);

  const wallet = store.save.wallet;
  const selos = wallet.selosDeInvocacao + wallet.selosLivres;
  const invocador = store.save.invocador;
  const banner = BANNER_MAP[activeBannerId];
  const pity = store.getPity(activeBannerId);

  function executePull(count: 1 | 10) {
    if (selos < count) return;
    sfx.click();
    setPulling(true);

    setTimeout(() => {
      const pullResults: PullResult[] = [];
      let currentPity = pity;

      for (let i = 0; i < count; i++) {
        const { heroId, rarity, wasPity } = rollBanner(banner, currentPity);
        const hero = HERO_MAP[heroId];
        if (!hero) continue;

        const isLegend = rarity === "Lendário" || rarity === "Mítico" || rarity === "Divino";
        const isNew = !store.hasHero(activeBannerId, heroId);

        // Atualizar pity
        if (isLegend) currentPity = 0;
        else currentPity++;

        // Fragmentos em duplicatas
        const fragments = isNew ? 0 : 1;

        pullResults.push({ hero, rarity, isNew, wasPity, fragmentsAwarded: fragments });

        // Atualizar store
        store.addCollectedHero(activeBannerId, heroId);
        if (!isNew) store.addFragmento(heroId, 1);
        store.registerPull();

        // Gastar selo (Livres primeiro)
        if (wallet.selosLivres > 0) store.spendCurrency("selosLivres", 1);
        else store.spendCurrency("selosDeInvocacao", 1);
      }

      store.setPity(activeBannerId, currentPity);
      store.incrementDailyProgress("pulls_today", count);
      scheduleSave();

      sfx.victory();
      setResults(pullResults);
      setPulling(false);
    }, 400);
  }

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      <AnimatePresence mode="wait">
        {results ? (
          <ResultScreen
            key="result"
            results={results}
            onClose={() => setResults(null)}
          />
        ) : (
          <BannerScreen
            key="banner"
            banner={banner}
            selos={selos}
            pity={pity}
            invocador={invocador}
            pulling={pulling}
            banners={BANNERS}
            activeBannerId={activeBannerId}
            onSelectBanner={setActiveBannerId}
            onPull={executePull}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Banner screen ─────────────────────────────────────────────────────────────

function BannerScreen({
  banner, selos, pity, invocador, pulling, banners, activeBannerId, onSelectBanner, onPull,
}: {
  banner: BannerDef;
  selos: number;
  pity: number;
  invocador: { level: number; totalPulls: number };
  pulling: boolean;
  banners: BannerDef[];
  activeBannerId: string;
  onSelectBanner: (id: string) => void;
  onPull: (n: 1 | 10) => void;
}) {
  // Calcular taxas por raridade a partir do pool
  const rates = calcRates(banner.pool);

  return (
    <motion.div
      key="banner"
      className="flex flex-col overflow-y-auto px-4 pb-6 pt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {/* Banner selector */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {banners.map((b) => (
          <motion.button
            key={b.bannerId}
            onClick={() => onSelectBanner(b.bannerId)}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="flex-shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold tracking-wider"
            style={{
              borderColor: b.bannerId === activeBannerId ? "rgba(200,155,60,0.6)" : "rgba(122,111,160,0.2)",
              color: b.bannerId === activeBannerId ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
              background: b.bannerId === activeBannerId ? "rgba(200,155,60,0.08)" : "transparent",
            }}
          >
            {b.isLimited && "⚡ "}{b.name.toUpperCase()}
          </motion.button>
        ))}
      </div>

      {/* Banner art */}
      <div
        className="relative mb-4 overflow-hidden rounded-2xl"
        style={{
          height: 190,
          background: "linear-gradient(160deg, rgba(50,30,5,0.98) 0%, rgba(8,8,20,1) 50%, rgba(35,10,60,0.98) 100%)",
          border: "1px solid rgba(200,155,60,0.18)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 60px rgba(200,155,60,0.05) inset",
        }}
      >
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 70% at 50% 20%, rgba(200,155,60,0.13) 0%, transparent 70%)" }} />
        {/* Corner shine */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(200,155,60,0.2) 0%, transparent 70%)" }} />
        {/* Decorative stars */}
        <div className="pointer-events-none absolute right-6 top-8 text-[10px] text-amber/20 animate-pulse-glow">✦</div>
        <div className="pointer-events-none absolute right-16 top-5 text-[5px] text-amber/15 animate-pulse-glow" style={{ animationDelay: "0.8s" }}>✦</div>
        <div className="pointer-events-none absolute left-6 top-12 text-[6px] text-violet/20 animate-pulse-glow" style={{ animationDelay: "1.3s" }}>✦</div>

        {banner.isLimited && (
          <div
            className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-black tracking-wider"
            style={{
              background: "linear-gradient(135deg, rgba(200,155,60,0.3) 0%, rgba(200,155,60,0.1) 100%)",
              border: "1px solid rgba(200,155,60,0.4)",
              color: "rgb(200,155,60)",
            }}
          >
            ⚡ LIMITADO
          </div>
        )}

        {/* Big decorative portrait */}
        <div
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-15"
          style={{ filter: "blur(1px)" }}
        >
          ✦
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p className="mb-1 text-[10px] font-black tracking-[0.4em] text-amber/40 uppercase">Invocação</p>
          <h3
            className="text-[20px] font-black leading-tight text-cream"
            style={{ fontFamily: "var(--font-cinzel)", textShadow: "0 0 30px rgba(200,155,60,0.6), 0 2px 4px rgba(0,0,0,0.8)" }}
          >
            {banner.name}
          </h3>
          <p className="mt-1 text-[11px] text-violet/65">{banner.lore}</p>
        </div>
      </div>

      {/* Taxas */}
      <div className="mb-4 flex gap-1.5 flex-wrap">
        {(Object.entries(rates) as [GachaRarity, number][])
          .filter(([, v]) => v > 0)
          .sort((a, b) => RANK_ORDER.indexOf(b[0]) - RANK_ORDER.indexOf(a[0]))
          .map(([rarity, rate]) => {
            const s = RARITY_STYLE[rarity];
            return (
              <div key={rarity} className="flex items-center gap-1 rounded-lg border px-2 py-1.5" style={{ borderColor: s.border, background: s.glow }}>
                <span className="text-[10px] font-black" style={{ color: s.color }}>{rate.toFixed(1)}%</span>
                <span className="text-[10px] font-bold" style={{ color: s.color, opacity: 0.7 }}>{s.label}</span>
              </div>
            );
          })}
      </div>

      {/* Pity tracker */}
      <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold tracking-wider text-violet/50">PITY</span>
          <span className="text-[10px] font-bold text-cream/60">{pity} / {banner.pityThreshold}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/12">
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${(pity / banner.pityThreshold) * 100}%`,
              background: pity >= banner.softPityStart ? "rgb(200,155,60)" : "rgb(122,111,160)",
              boxShadow: pity >= banner.softPityStart ? "0 0 8px rgba(200,155,60,0.5)" : "none",
            }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        {pity >= banner.softPityStart && (
          <p className="mt-1 text-[10px] text-amber/60 font-bold">✦ Soft pity ativo — chance aumentada!</p>
        )}
      </div>

      {/* Invocador */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-violet/12 px-4 py-2.5" style={{ background: "rgba(122,111,160,0.04)" }}>
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-violet/60 uppercase">Invocador Nível</p>
          <p className="text-[16px] font-black text-cream">{invocador.level}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold tracking-[0.2em] text-violet/60 uppercase">Total Invocações</p>
          <p className="text-[16px] font-black text-cream">{invocador.totalPulls.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      {/* Pull buttons */}
      <div className="flex flex-col gap-3">
        <PullBtn label="Invocar ×1"  cost={1}  selos={selos} loading={pulling} onClick={() => onPull(1)} />
        <PullBtn label="Invocar ×10" cost={10} selos={selos} loading={pulling} onClick={() => onPull(10)} highlight />
      </div>

      <p className="mt-3 text-center text-[10px] text-violet/35">
        Selos disponíveis: {selos} &nbsp;·&nbsp; 1 Selo = 1 Invocação
      </p>
    </motion.div>
  );
}

function PullBtn({ label, cost, selos, loading, onClick, highlight }: {
  label: string; cost: number; selos: number; loading: boolean;
  onClick: () => void; highlight?: boolean;
}) {
  const canAfford = selos >= cost;
  return (
    <motion.button
      onClick={canAfford && !loading ? onClick : undefined}
      whileTap={canAfford && !loading ? { scale: 0.96 } : undefined}
      transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
      disabled={!canAfford || loading}
      className="relative flex items-center justify-between overflow-hidden rounded-2xl px-5 py-4"
      style={highlight ? {
        background: canAfford
          ? "linear-gradient(135deg, rgba(200,155,60,0.22) 0%, rgba(160,100,20,0.12) 100%)"
          : "rgba(200,155,60,0.04)",
        border: `1px solid ${canAfford ? "rgba(200,155,60,0.45)" : "rgba(200,155,60,0.12)"}`,
        boxShadow: canAfford ? "0 4px 20px rgba(200,155,60,0.12), 0 1px 0 rgba(200,155,60,0.15) inset" : "none",
        opacity: canAfford ? 1 : 0.5,
        cursor: canAfford && !loading ? "pointer" : "default",
      } : {
        background: canAfford ? "rgba(122,111,160,0.07)" : "rgba(122,111,160,0.03)",
        border: `1px solid ${canAfford ? "rgba(122,111,160,0.2)" : "rgba(122,111,160,0.08)"}`,
        opacity: canAfford ? 1 : 0.45,
        cursor: canAfford && !loading ? "pointer" : "default",
      }}
    >
      {highlight && canAfford && (
        <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(200,155,60,0.04) 50%, transparent 100%)" }} />
      )}
      <div>
        <p className="text-[13px] font-black tracking-wide" style={{ color: highlight ? "rgb(232,217,160)" : "rgba(200,210,230,0.7)" }}>
          {label}
        </p>
        {highlight && canAfford && (
          <p className="text-[10px] font-bold tracking-wider" style={{ color: "rgba(200,155,60,0.6)" }}>
            MELHOR VALOR
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {loading ? (
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber/30 border-t-amber inline-block" />
            <span className="text-[10px] text-violet/60">Invocando...</span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold"
            style={highlight ? {
              background: canAfford ? "rgba(200,155,60,0.2)" : "rgba(200,155,60,0.06)",
              color: canAfford ? "rgb(200,155,60)" : "rgba(200,155,60,0.4)",
              border: "1px solid rgba(200,155,60,0.2)",
            } : {
              background: "rgba(122,111,160,0.1)",
              color: "rgba(122,111,160,0.7)",
              border: "1px solid rgba(122,111,160,0.15)",
            }}
          >
            <span>✦</span>
            <span>{cost} {cost > 1 ? "Selos" : "Selo"}</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ── Result screen ──────────────────────────────────────────────────────────────

const RESULT_SCREEN_GLOW: Partial<Record<string, string>> = {
  Divino:   "radial-gradient(ellipse 100% 55% at 50% 0%, rgba(255,255,200,0.09) 0%, transparent 100%)",
  Mítico:   "radial-gradient(ellipse 100% 50% at 50% 0%, rgba(255,60,60,0.07) 0%, transparent 100%)",
  Lendário: "radial-gradient(ellipse 100% 45% at 50% 0%, rgba(200,155,60,0.07) 0%, transparent 100%)",
};

function ResultScreen({ results, onClose }: { results: PullResult[]; onClose: () => void }) {
  const best = results.reduce((a, b) =>
    RANK_ORDER.indexOf(b.rarity) > RANK_ORDER.indexOf(a.rarity) ? b : a
  );
  const bestStyle = RARITY_STYLE[best.rarity];
  const single = results.length === 1;
  const screenGlow = RESULT_SCREEN_GLOW[best.rarity] ?? null;

  return (
    <motion.div
      key="result"
      className="relative flex flex-col items-center overflow-y-auto px-4 pb-6 pt-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={screenGlow ? { background: screenGlow } : undefined}
    >
      <p className="mb-4 text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: bestStyle.color }}>
        {single ? "Invocação" : `${results.length}× Invocações`}
      </p>

      {/* Cards */}
      <div className={`mb-5 w-full ${single ? "flex justify-center" : "grid grid-cols-5 gap-2"}`}>
        {results.map((r, i) => (
          <PullCard key={i} result={r} index={i} single={single} />
        ))}
      </div>

      {/* Summary para multi-pull */}
      {!single && (
        <div className="mb-5 flex w-full flex-wrap justify-center gap-2">
          {countByRarity(results).map(({ rarity, count }) => {
            const s = RARITY_STYLE[rarity];
            return (
              <div key={rarity} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5" style={{ borderColor: s.border, background: s.glow }}>
                <span className="text-[11px] font-black" style={{ color: s.color }}>×{count}</span>
                <span className="text-[11px] font-bold" style={{ color: s.color, opacity: 0.8 }}>{s.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <motion.button
        onClick={onClose}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-xs rounded-xl border border-amber/30 py-3.5 text-[12px] font-bold tracking-[0.2em] text-cream/75 transition-colors duration-150 hover:border-amber/60 hover:bg-amber/8"
      >
        CONTINUAR
      </motion.button>
    </motion.div>
  );
}

function PullCard({ result, index, single }: { result: PullResult; index: number; single: boolean }) {
  const s = RARITY_STYLE[result.rarity];
  const v = RARITY_CARD[result.rarity];
  const delay = index * 0.06;

  return (
    <div className={`relative ${single ? "w-44" : ""}`}>
      <motion.div
        className="flex flex-col items-center overflow-hidden rounded-xl border"
        style={{
          borderColor: s.border,
          background: `linear-gradient(160deg, ${s.glow} 0%, rgba(10,10,22,0.96) 100%)`,
          boxShadow: v.hasGlow ? "none" : `0 0 20px ${s.glow}`,
          padding: single ? "24px 16px 20px" : "10px 8px 8px",
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initial={v.initial as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        animate={v.animate as any}
        transition={{ duration: v.duration, ease, delay }}
      >
        <HeroPortrait heroId={result.hero.heroId} emoji={result.hero.portrait} single={single} />
        {single && (
          <p className="mb-1.5 px-2 text-center text-[13px] font-black tracking-wide" style={{ color: s.color, fontFamily: "var(--font-cinzel)" }}>
            {result.hero.name.split(",")[0]}
          </p>
        )}
        <span className={`font-bold tracking-wider ${single ? "text-[10px]" : "text-[7px]"}`} style={{ color: s.color }}>
          {result.wasPity ? "★ PITY — " : ""}{s.label.toUpperCase()}
        </span>
        {!single && (
          <p className="mt-0.5 px-1 text-center text-[7px] leading-tight text-cream/45">
            {result.hero.name.split(",")[0]}
          </p>
        )}
        {result.fragmentsAwarded > 0 && (
          <span className={`mt-1 rounded-full border border-violet/20 px-1.5 font-bold text-violet/60 ${single ? "text-[11px]" : "text-[6px]"}`}>
            +{result.fragmentsAwarded} fragmento
          </span>
        )}
        {result.isNew && (
          <span className={`mt-0.5 font-bold text-green-400/70 ${single ? "text-[11px]" : "text-[6px]"}`}>
            NOVO
          </span>
        )}
      </motion.div>
      {v.hasGlow && v.glowColor && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-xl animate-rarity-glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + v.duration + 0.05, duration: 0.35 }}
          style={{
            boxShadow: `0 0 28px ${v.glowColor}, 0 0 56px ${v.glowColor.replace(/[\d.]+\)$/, "0.12)")}`,
            border: `1px solid ${s.color}40`,
          }}
        />
      )}
    </div>
  );
}

function HeroPortrait({ heroId, emoji, single }: { heroId: string; emoji: string; single: boolean }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <span className={single ? "mb-3 text-4xl" : "mb-1 text-xl"}>{emoji}</span>
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/heroes/${heroId}.png`}
      alt=""
      width={single ? 88 : 44}
      height={single ? 88 : 44}
      className={single ? "mb-3 rounded-xl" : "mb-1 rounded-lg"}
      style={{ objectFit: "cover", objectPosition: "top center" }}
      onError={() => setErr(true)}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcRates(pool: BannerDef["pool"]): Partial<Record<GachaRarity, number>> {
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  const rates: Partial<Record<GachaRarity, number>> = {};
  for (const e of pool) {
    rates[e.rarity] = (rates[e.rarity] ?? 0) + (e.weight / totalWeight) * 100;
  }
  return rates;
}

function countByRarity(results: PullResult[]): { rarity: GachaRarity; count: number }[] {
  const map: Partial<Record<GachaRarity, number>> = {};
  for (const r of results) map[r.rarity] = (map[r.rarity] ?? 0) + 1;
  return (Object.entries(map) as [GachaRarity, number][])
    .sort((a, b) => RANK_ORDER.indexOf(b[0]) - RANK_ORDER.indexOf(a[0]))
    .map(([rarity, count]) => ({ rarity, count }));
}
