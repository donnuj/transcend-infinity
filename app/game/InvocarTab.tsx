"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.23, 1, 0.32, 1] as const;

type Rarity = "NORMAL" | "RARO" | "ÉPICO" | "LENDÁRIO";

type Card = { name: string; rarity: Rarity; element: string };

const RARITY_STYLE: Record<Rarity, { color: string; glow: string; border: string; label: string }> = {
  NORMAL:   { color: "rgb(180,180,210)",  glow: "rgba(180,180,210,0.15)", border: "rgba(180,180,210,0.25)", label: "Normal"   },
  RARO:     { color: "rgb(90,150,255)",   glow: "rgba(90,150,255,0.2)",   border: "rgba(90,150,255,0.4)",   label: "Raro"     },
  ÉPICO:    { color: "rgb(180,110,255)",  glow: "rgba(180,110,255,0.25)", border: "rgba(180,110,255,0.45)", label: "Épico"    },
  LENDÁRIO: { color: "rgb(200,155,60)",   glow: "rgba(200,155,60,0.35)",  border: "rgba(200,155,60,0.6)",   label: "Lendário" },
};

const ELEMENT_ICON: Record<string, string> = {
  Fogo: "🔥", Água: "💧", Terra: "⛰", Ar: "🌀", Luz: "✦", Sombra: "◈", Arcano: "◉",
};

const POOL: Card[] = [
  { name: "Arqueiro Celestial",    rarity: "LENDÁRIO", element: "Luz"    },
  { name: "Dragão Eterno",         rarity: "LENDÁRIO", element: "Fogo"   },
  { name: "Serafim Carmesim",      rarity: "LENDÁRIO", element: "Luz"    },
  { name: "Druida das Trevas",     rarity: "ÉPICO",    element: "Sombra" },
  { name: "Cavaleiro de Gelo",     rarity: "ÉPICO",    element: "Água"   },
  { name: "Titã Arcano",           rarity: "ÉPICO",    element: "Arcano" },
  { name: "Valquíria Dourada",     rarity: "ÉPICO",    element: "Luz"    },
  { name: "Golem de Obsidiana",    rarity: "RARO",     element: "Terra"  },
  { name: "Maga Lunar",            rarity: "RARO",     element: "Arcano" },
  { name: "Fênix Renascida",       rarity: "RARO",     element: "Fogo"   },
  { name: "Espírito do Vento",     rarity: "RARO",     element: "Ar"     },
  { name: "Sereia das Profundezas",rarity: "RARO",     element: "Água"   },
  { name: "Necromante",            rarity: "RARO",     element: "Sombra" },
  { name: "Goblin Feroz",          rarity: "NORMAL",   element: "Terra"  },
  { name: "Soldado de Fogo",       rarity: "NORMAL",   element: "Fogo"   },
  { name: "Elfa Sombria",          rarity: "NORMAL",   element: "Sombra" },
  { name: "Lobo Ártico",           rarity: "NORMAL",   element: "Ar"     },
  { name: "Sereia Canção",         rarity: "NORMAL",   element: "Água"   },
  { name: "Golem de Pedra",        rarity: "NORMAL",   element: "Terra"  },
  { name: "Arqueiro das Sombras",  rarity: "NORMAL",   element: "Sombra" },
  { name: "Fada da Floresta",      rarity: "NORMAL",   element: "Ar"     },
  { name: "Guardião da Luz",       rarity: "NORMAL",   element: "Luz"    },
];

function pullOne(): Card {
  const r = Math.random() * 100;
  const rarity: Rarity = r < 3 ? "LENDÁRIO" : r < 15 ? "ÉPICO" : r < 40 ? "RARO" : "NORMAL";
  const pool = POOL.filter((c) => c.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

const COST_1 = 10;
const COST_10 = 90;

export default function InvocarTab({
  gems,
  onGemsChange,
}: {
  gems: number;
  onGemsChange: (v: number) => void;
}) {
  const [results, setResults] = useState<Card[] | null>(null);
  const [pulling, setPulling] = useState(false);

  function doPull(count: 1 | 10) {
    const cost = count === 1 ? COST_1 : COST_10;
    if (gems < cost) return;
    setPulling(true);
    setTimeout(() => {
      setResults(Array.from({ length: count }, pullOne));
      onGemsChange(gems - cost);
      setPulling(false);
    }, 350);
  }

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      <AnimatePresence mode="wait">
        {results ? (
          <ResultScreen
            key="result"
            cards={results}
            onClose={() => setResults(null)}
          />
        ) : (
          <BannerScreen
            key="banner"
            gems={gems}
            pulling={pulling}
            onPull={doPull}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function BannerScreen({
  gems,
  pulling,
  onPull,
}: {
  gems: number;
  pulling: boolean;
  onPull: (n: 1 | 10) => void;
}) {
  return (
    <motion.div
      key="banner"
      className="flex flex-col px-4 pb-6 pt-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease }}
    >
      {/* Banner art */}
      <div
        className="relative mb-4 overflow-hidden rounded-2xl border border-amber/25"
        style={{
          height: 200,
          background:
            "linear-gradient(160deg, rgba(40,25,5,0.95) 0%, rgba(10,10,22,1) 55%, rgba(30,10,50,0.95) 100%)",
          boxShadow: "0 0 60px rgba(200,155,60,0.08) inset, 0 0 0 1px rgba(200,155,60,0.06)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(200,155,60,0.12) 0%, transparent 70%)",
          }}
        />
        {/* Rarity stars */}
        <div className="absolute top-4 right-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-[10px]" style={{ color: "rgba(200,155,60,0.6)" }}>
              ✦
            </span>
          ))}
        </div>
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="mb-0.5 text-[9px] font-bold tracking-[0.3em] text-amber/60 uppercase">
            Banner Atual
          </p>
          <h3
            className="text-lg font-black tracking-[0.12em] text-cream"
            style={{
              fontFamily: "var(--font-cinzel)",
              textShadow: "0 0 20px rgba(200,155,60,0.6)",
            }}
          >
            ASCENSÃO CELESTIAL
          </h3>
          <p className="text-[11px] text-violet/60">Taxa de Lendário: 3%</p>
        </div>
      </div>

      {/* Rates */}
      <div className="mb-5 flex gap-2">
        {(["LENDÁRIO", "ÉPICO", "RARO", "NORMAL"] as Rarity[]).map((r) => {
          const s = RARITY_STYLE[r];
          const rate = r === "LENDÁRIO" ? "3%" : r === "ÉPICO" ? "12%" : r === "RARO" ? "25%" : "60%";
          return (
            <div
              key={r}
              className="flex flex-1 flex-col items-center rounded-lg border py-2"
              style={{ borderColor: s.border, backgroundColor: s.glow }}
            >
              <span className="text-[10px] font-bold" style={{ color: s.color }}>
                {rate}
              </span>
              <span className="text-[8px] tracking-wide" style={{ color: s.color, opacity: 0.7 }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pull buttons */}
      <div className="flex flex-col gap-3">
        <PullButton
          label="Invocar ×1"
          cost={COST_1}
          gems={gems}
          loading={pulling}
          onClick={() => onPull(1)}
        />
        <PullButton
          label="Invocar ×10"
          cost={COST_10}
          gems={gems}
          loading={pulling}
          onClick={() => onPull(10)}
          highlight
        />
      </div>

      <p className="mt-4 text-center text-[10px] text-violet/35">
        Você tem {gems} ✦ Gemas
      </p>
    </motion.div>
  );
}

function PullButton({
  label,
  cost,
  gems,
  loading,
  onClick,
  highlight,
}: {
  label: string;
  cost: number;
  gems: number;
  loading: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  const canAfford = gems >= cost;
  return (
    <motion.button
      onClick={canAfford && !loading ? onClick : undefined}
      whileTap={canAfford && !loading ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
      disabled={!canAfford || loading}
      className="flex items-center justify-between rounded-xl border px-5 py-3.5"
      style={{
        borderColor: highlight
          ? canAfford ? "rgba(200,155,60,0.6)" : "rgba(200,155,60,0.2)"
          : canAfford ? "rgba(122,111,160,0.35)" : "rgba(122,111,160,0.15)",
        background: highlight
          ? canAfford ? "rgba(200,155,60,0.12)" : "rgba(200,155,60,0.04)"
          : "rgba(122,111,160,0.06)",
        opacity: canAfford ? 1 : 0.5,
        cursor: canAfford && !loading ? "pointer" : "default",
      }}
    >
      <span
        className="text-[13px] font-bold tracking-wider"
        style={{ color: highlight ? "rgb(232,217,160)" : "rgba(122,111,160,0.8)" }}
      >
        {label}
      </span>
      <span
        className="flex items-center gap-1 text-[12px] font-bold"
        style={{ color: highlight ? "rgb(200,155,60)" : "rgba(122,111,160,0.7)" }}
      >
        {loading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
        ) : (
          <>✦ {cost}</>
        )}
      </span>
    </motion.button>
  );
}

function ResultScreen({ cards, onClose }: { cards: Card[]; onClose: () => void }) {
  const best = cards.reduce((a, b) => {
    const order: Rarity[] = ["NORMAL", "RARO", "ÉPICO", "LENDÁRIO"];
    return order.indexOf(b.rarity) > order.indexOf(a.rarity) ? b : a;
  });
  const bestStyle = RARITY_STYLE[best.rarity];

  return (
    <motion.div
      key="result"
      className="flex flex-col items-center px-4 pb-6 pt-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease }}
    >
      <p
        className="mb-5 text-[10px] font-bold tracking-[0.3em] uppercase"
        style={{ color: bestStyle.color }}
      >
        {cards.length === 1 ? "Invocação" : `${cards.length}× Invocações`}
      </p>

      <div className={`mb-6 w-full ${cards.length === 1 ? "flex justify-center" : "grid grid-cols-5 gap-2"}`}>
        {cards.map((card, i) => (
          <PulledCardTile key={i} card={card} index={i} single={cards.length === 1} />
        ))}
      </div>

      <motion.button
        onClick={onClose}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-xs rounded-xl border border-amber/30 py-3.5 text-[12px] font-bold tracking-[0.2em] text-cream/80 transition-colors duration-150 hover:border-amber/60 hover:bg-amber/8"
      >
        CONTINUAR
      </motion.button>
    </motion.div>
  );
}

function PulledCardTile({ card, index, single }: { card: Card; index: number; single: boolean }) {
  const s = RARITY_STYLE[card.rarity];
  return (
    <motion.div
      className="flex flex-col items-center overflow-hidden rounded-xl border"
      style={{
        borderColor: s.border,
        boxShadow: `0 0 16px ${s.glow}`,
        background: `linear-gradient(160deg, ${s.glow} 0%, rgba(10,10,22,0.95) 100%)`,
        ...(single ? { width: 160, paddingTop: 24, paddingBottom: 20 } : { paddingTop: 10, paddingBottom: 8 }),
      }}
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: index * 0.07 }}
    >
      <span className={single ? "mb-3 text-4xl" : "mb-1 text-xl"}>
        {ELEMENT_ICON[card.element] ?? "◈"}
      </span>
      {single && (
        <p
          className="mb-1 text-[14px] font-black tracking-wide text-center px-3"
          style={{ color: s.color, fontFamily: "var(--font-cinzel)" }}
        >
          {card.name}
        </p>
      )}
      <span
        className={`font-bold tracking-wider ${single ? "text-[11px]" : "text-[8px]"}`}
        style={{ color: s.color }}
      >
        {s.label.toUpperCase()}
      </span>
      {!single && (
        <p className="mt-0.5 text-center text-[7px] text-cream/50 px-1 leading-tight">{card.name}</p>
      )}
    </motion.div>
  );
}
