"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/game/data/achievements";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type Category = "todas" | AchievementDef["category"];

const CATEGORY_LABELS: Record<Category, string> = {
  todas: "TODAS",
  combate: "COMBATE",
  invocacao: "INVOCAR",
  progressao: "PROGRESSO",
  exploracao: "EXPLORAR",
  colecao: "COLEÇÃO",
};

export default function AchievementsModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<Category>("todas");
  const [newUnlocks, setNewUnlocks] = useState<string[]>([]);
  const { save, checkAchievements } = useGameStore();

  useEffect(() => {
    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      setNewUnlocks(unlocked);
      scheduleSave();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlockedIds = save.achievements.unlockedIds;
  const filtered = ACHIEVEMENTS.filter((a) => category === "todas" || a.category === category);
  const unlockedCount = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).length;
  const pct = Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← Fechar
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">CONQUISTAS</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">{unlockedCount}/{ACHIEVEMENTS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="mb-1 flex justify-between">
          <span className="text-[9px] text-violet/40">Progresso total</span>
          <span className="text-[9px] font-bold text-amber-400">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/10">
          <motion.div
            className="h-full rounded-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            style={{ boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-violet/10 px-4 pb-2">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
          <motion.button
            key={cat}
            onClick={() => setCategory(cat)}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="flex-shrink-0 rounded-lg px-2.5 py-1 text-[8px] font-bold tracking-wider"
            style={{
              background: category === cat ? "rgba(200,155,60,0.1)" : "transparent",
              color: category === cat ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
              border: `1px solid ${category === cat ? "rgba(200,155,60,0.3)" : "transparent"}`,
            }}
          >
            {CATEGORY_LABELS[cat]}
          </motion.button>
        ))}
      </div>

      {/* New unlock toast */}
      <AnimatePresence>
        {newUnlocks.length > 0 && (
          <motion.div
            className="mx-4 mt-2 rounded-xl border border-amber/30 bg-amber/8 px-4 py-2.5"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-[9px] font-bold text-amber-400">
              {newUnlocks.length} nova{newUnlocks.length > 1 ? "s" : ""} conquista{newUnlocks.length > 1 ? "s" : ""} desbloqueada{newUnlocks.length > 1 ? "s" : ""}!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
        <div className="flex flex-col gap-2">
          {filtered.map((ach) => {
            const unlocked = unlockedIds.includes(ach.id);
            const isNew = newUnlocks.includes(ach.id);
            return (
              <motion.div
                key={ach.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3"
                style={{
                  borderColor: isNew ? "rgba(200,155,60,0.5)" : unlocked ? "rgba(100,220,140,0.2)" : "rgba(122,111,160,0.1)",
                  background: isNew ? "rgba(200,155,60,0.08)" : unlocked ? "rgba(100,220,140,0.04)" : "rgba(122,111,160,0.03)",
                }}
                initial={isNew ? { scale: 0.97 } : false}
                animate={isNew ? { scale: 1 } : {}}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-lg"
                  style={{
                    background: unlocked ? "rgba(100,220,140,0.1)" : "rgba(122,111,160,0.06)",
                    border: `1px solid ${unlocked ? "rgba(100,220,140,0.2)" : "rgba(122,111,160,0.1)"}`,
                    opacity: unlocked ? 1 : 0.35,
                  }}
                >
                  {ach.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold" style={{ color: unlocked ? "rgba(255,255,255,0.85)" : "rgba(122,111,160,0.5)" }}>
                    {ach.title}
                    {isNew && <span className="ml-1.5 text-[8px] font-black text-amber-400">NOVO</span>}
                  </p>
                  <p className="text-[9px]" style={{ color: unlocked ? "rgba(122,111,160,0.6)" : "rgba(122,111,160,0.3)" }}>
                    {ach.description}
                  </p>
                </div>
                <span className="text-[14px]" style={{ opacity: unlocked ? 1 : 0.15 }}>
                  {unlocked ? "✓" : "○"}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
