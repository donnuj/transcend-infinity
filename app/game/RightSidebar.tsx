"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, Users, TreasureChest } from "@phosphor-icons/react";
import { useGameStore } from "@/lib/game/store";
import { HEROES } from "@/lib/game/data/heroes";

const AMBER  = "rgb(200,155,60)";
const VIOLET = "rgb(122,111,160)";
const CREAM  = "rgb(232,217,160)";

const RARITY_COLOR: Record<string, string> = {
  Divino:   "rgb(255,210,80)",
  Mitico:   "rgb(255,80,80)",
  Lendario: "rgb(255,140,40)",
  Epico:    "rgb(180,110,255)",
  Raro:     "rgb(90,160,255)",
  Incomum:  "rgb(80,200,120)",
  Comum:    "rgb(140,140,160)",
};

function SectionHeader({ icon, label, open, onToggle }: {
  icon: React.ReactNode; label: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-3 py-2"
      style={{ borderBottom: "1px solid rgba(200,155,60,0.08)" }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: AMBER, opacity: 0.7 }}>{icon}</span>
        <span className="text-[11px] font-bold tracking-widest" style={{ color: CREAM, opacity: 0.75 }}>
          {label.toUpperCase()}
        </span>
      </div>
      <motion.span
        animate={{ rotate: open ? 0 : -90 }}
        transition={{ duration: 0.2 }}
        style={{ color: VIOLET, opacity: 0.5 }}
      >
        <CaretDown size={12} />
      </motion.span>
    </button>
  );
}

export default function RightSidebar({ onHerois }: { onHerois: () => void }) {
  const save        = useGameStore((s) => s.save);
  const [teamOpen,  setTeamOpen]  = useState(true);
  const [spoilOpen, setSpoilOpen] = useState(true);

  // Pega os primeiros 5 heróis coletados para mostrar na equipe
  const teamIds   = save.collectedHeroIds.slice(0, 5);
  const teamSlots = Array.from({ length: 5 }, (_, i) => teamIds[i] ?? null);

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 w-[240px] overflow-y-auto"
      style={{
        background: "rgba(8,8,18,0.97)",
        borderLeft: "1px solid rgba(200,155,60,0.1)",
      }}
    >
      {/* Equipe */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(200,155,60,0.08)" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: AMBER, opacity: 0.7 }}><Users size={13} /></span>
          <span className="text-[11px] font-bold tracking-widest" style={{ color: CREAM, opacity: 0.75 }}>EQUIPE</span>
        </div>
        <span className="text-[10px]" style={{ color: VIOLET, opacity: 0.45 }}>
          {teamIds.length}/5
        </span>
      </div>

      <div className="px-3 py-3 flex flex-col gap-2" style={{ borderBottom: "1px solid rgba(200,155,60,0.06)" }}>
        {teamSlots.map((heroId, i) => {
          if (!heroId) {
            return (
              <button
                key={i}
                onClick={onHerois}
                className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                style={{
                  borderColor: "rgba(122,111,160,0.15)",
                  borderStyle: "dashed",
                  background: "rgba(122,111,160,0.04)",
                }}
              >
                <div className="w-7 h-7 rounded flex items-center justify-center text-[14px]"
                  style={{ background: "rgba(122,111,160,0.1)" }}>
                  +
                </div>
                <span className="text-[10px]" style={{ color: VIOLET, opacity: 0.4 }}>
                  {i < 2 ? "Vazio" : "Bloqueado"}
                </span>
              </button>
            );
          }

          const hero = HEROES.find(h => h.heroId === heroId);
          if (!hero) return null;

          const rarColor = RARITY_COLOR[hero.rarity] ?? CREAM;
          const prog = save.heroProgression.find(p => p.heroId === heroId);
          const lvl  = save.heroLevels.find(l => l.heroId === heroId)?.level ?? 1;

          return (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
              style={{
                background: `linear-gradient(135deg, ${rarColor}0d 0%, rgba(8,8,18,0.8) 100%)`,
                border: `1px solid ${rarColor}22`,
              }}
            >
              {/* portrait */}
              <div
                className="w-8 h-8 rounded flex-shrink-0 overflow-hidden"
                style={{ border: `1px solid ${rarColor}30` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/heroes/${heroId}.png`}
                  alt={hero.name}
                  className="w-full h-full object-cover object-top"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate" style={{ color: CREAM, opacity: 0.9 }}>
                  {hero.name}
                </p>
                <p className="text-[9px]" style={{ color: rarColor, opacity: 0.7 }}>
                  {hero.rarity} · Nv. {lvl}
                </p>
              </div>
              <span className="text-[9px] font-black" style={{ color: AMBER, opacity: 0.7 }}>★</span>
            </div>
          );
        })}
      </div>

      {/* Espolios */}
      <SectionHeader
        icon={<TreasureChest size={13} />}
        label="Espolios"
        open={spoilOpen}
        onToggle={() => setSpoilOpen(v => !v)}
      />
      <AnimatePresence initial={false}>
        {spoilOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-4 flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: "rgba(200,155,60,0.1)", border: "1px solid rgba(200,155,60,0.15)" }}
              >
                🎁
              </div>
              <p className="text-[10px] font-bold" style={{ color: CREAM, opacity: 0.6 }}>
                Recompensas acumuladas
              </p>
              <p className="text-[9px]" style={{ color: VIOLET, opacity: 0.4 }}>
                Nenhum espolio pendente
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
