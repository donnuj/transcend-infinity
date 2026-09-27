"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.23, 1, 0.32, 1] as const;

type Rarity = "NORMAL" | "RARO" | "ÉPICO" | "LENDÁRIO";

const RARITY_STYLE: Record<Rarity, { color: string; glow: string; border: string }> = {
  NORMAL:   { color: "rgb(180,180,210)",  glow: "rgba(180,180,210,0.08)", border: "rgba(180,180,210,0.2)"  },
  RARO:     { color: "rgb(90,150,255)",   glow: "rgba(90,150,255,0.1)",   border: "rgba(90,150,255,0.3)"   },
  ÉPICO:    { color: "rgb(180,110,255)",  glow: "rgba(180,110,255,0.12)", border: "rgba(180,110,255,0.35)" },
  LENDÁRIO: { color: "rgb(200,155,60)",   glow: "rgba(200,155,60,0.12)",  border: "rgba(200,155,60,0.45)"  },
};

const ELEMENT_ICON: Record<string, string> = {
  Fogo: "🔥", Água: "💧", Terra: "⛰", Ar: "🌀", Luz: "✦", Sombra: "◈", Arcano: "◉",
};

type Card = { id: number; name: string; rarity: Rarity; element: string; atk: number; count: number };

const MY_CARDS: Card[] = [
  { id: 1,  name: "Arqueiro Celestial",    rarity: "LENDÁRIO", element: "Luz",    atk: 2400, count: 1 },
  { id: 2,  name: "Druida das Trevas",     rarity: "ÉPICO",    element: "Sombra", atk: 1800, count: 2 },
  { id: 3,  name: "Cavaleiro de Gelo",     rarity: "ÉPICO",    element: "Água",   atk: 1600, count: 1 },
  { id: 4,  name: "Golem de Obsidiana",    rarity: "RARO",     element: "Terra",  atk: 1400, count: 3 },
  { id: 5,  name: "Maga Lunar",            rarity: "RARO",     element: "Arcano", atk: 1350, count: 2 },
  { id: 6,  name: "Fênix Renascida",       rarity: "RARO",     element: "Fogo",   atk: 1300, count: 1 },
  { id: 7,  name: "Espírito do Vento",     rarity: "RARO",     element: "Ar",     atk: 1250, count: 2 },
  { id: 8,  name: "Goblin Feroz",          rarity: "NORMAL",   element: "Terra",  atk: 800,  count: 5 },
  { id: 9,  name: "Sereia Canção",         rarity: "NORMAL",   element: "Água",   atk: 750,  count: 4 },
  { id: 10, name: "Soldado de Fogo",       rarity: "NORMAL",   element: "Fogo",   atk: 720,  count: 6 },
  { id: 11, name: "Elfa Sombria",          rarity: "NORMAL",   element: "Sombra", atk: 700,  count: 3 },
  { id: 12, name: "Lobo Ártico",           rarity: "NORMAL",   element: "Ar",     atk: 680,  count: 4 },
];

type Filter = "TODOS" | Rarity;
const FILTERS: Filter[] = ["TODOS", "LENDÁRIO", "ÉPICO", "RARO", "NORMAL"];

export default function CartasTab() {
  const [filter, setFilter] = useState<Filter>("TODOS");
  const [selected, setSelected] = useState<Card | null>(null);

  const visible = filter === "TODOS" ? MY_CARDS : MY_CARDS.filter((c) => c.rarity === filter);

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 pt-4 scrollbar-none">
        {FILTERS.map((f) => {
          const active = filter === f;
          const s = f !== "TODOS" ? RARITY_STYLE[f] : null;
          return (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex-shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold tracking-[0.15em] transition-colors duration-150"
              style={{
                borderColor: active
                  ? s ? s.border : "rgba(200,155,60,0.5)"
                  : "rgba(122,111,160,0.2)",
                color: active
                  ? s ? s.color : "rgb(200,155,60)"
                  : "rgba(122,111,160,0.5)",
                background: active
                  ? s ? s.glow : "rgba(200,155,60,0.08)"
                  : "transparent",
              }}
            >
              {f}
            </motion.button>
          );
        })}
      </div>

      {/* Count */}
      <p className="px-4 pb-2 text-[9px] text-violet/40">
        {visible.length} carta{visible.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {visible.map((card, i) => {
            const s = RARITY_STYLE[card.rarity];
            return (
              <motion.button
                key={card.id}
                onClick={() => setSelected(card)}
                whileTap={{ scale: 0.94 }}
                className="flex flex-col items-center overflow-hidden rounded-xl border pb-2.5 pt-3 text-center"
                style={{
                  borderColor: s.border,
                  background: `linear-gradient(160deg, ${s.glow} 0%, rgba(10,10,22,0.95) 100%)`,
                  boxShadow: `0 0 12px ${s.glow}`,
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: i * 0.03 }}
              >
                <span className="mb-1.5 text-2xl">{ELEMENT_ICON[card.element] ?? "◈"}</span>
                <p className="px-1.5 text-[9px] font-bold leading-tight text-cream/75">
                  {card.name}
                </p>
                <span className="mt-1 text-[8px] font-bold" style={{ color: s.color }}>
                  {card.rarity === "LENDÁRIO" ? "★ LENDÁRIO" : card.rarity}
                </span>
                {card.count > 1 && (
                  <span className="mt-0.5 text-[8px] text-violet/40">×{card.count}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Card detail sheet */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="absolute inset-0 bg-void/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl border-t border-amber/15 px-6 pb-8 pt-6"
              style={{ backgroundColor: "rgba(10,10,22,0.98)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {(() => {
                const s = RARITY_STYLE[selected.rarity];
                return (
                  <>
                    <div className="mb-5 flex items-start gap-4">
                      <div
                        className="flex h-16 w-16 items-center justify-center rounded-xl border text-3xl"
                        style={{ borderColor: s.border, background: s.glow }}
                      >
                        {ELEMENT_ICON[selected.element] ?? "◈"}
                      </div>
                      <div>
                        <p
                          className="text-lg font-black tracking-wide text-cream"
                          style={{ fontFamily: "var(--font-cinzel)" }}
                        >
                          {selected.name}
                        </p>
                        <span className="text-[11px] font-bold" style={{ color: s.color }}>
                          {selected.rarity}
                        </span>
                        <span className="ml-2 text-[11px] text-violet/50">
                          {selected.element}
                        </span>
                      </div>
                    </div>
                    <div className="mb-5 flex gap-4">
                      <Stat label="ATK" value={selected.atk} />
                      <Stat label="CÓPIAS" value={selected.count} />
                    </div>
                    <motion.button
                      onClick={() => setSelected(null)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full rounded-xl border border-violet/20 py-3 text-[11px] font-bold tracking-wider text-violet/60 transition-colors duration-150 hover:border-violet/40 hover:text-violet/80"
                    >
                      FECHAR
                    </motion.button>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3" style={{ background: "rgba(122,111,160,0.05)" }}>
      <span className="text-xl font-black text-cream">{value.toLocaleString("pt-BR")}</span>
      <span className="text-[9px] font-bold tracking-widest text-violet/50">{label}</span>
    </div>
  );
}
