"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { DAILY_CHALLENGES } from "@/lib/game/data/challenges";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

export default function DailyChallengesModal({ onClose, embedded }: { onClose: () => void; embedded?: boolean }) {
  const { save, claimDailyReward, getDailyProgress, resetDailyChallengesIfNeeded } = useGameStore();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetDailyChallengesIfNeeded(); }, []);

  const dc = save.dailyChallenges;
  const completedCount = dc.completed.length;

  function handleClaim(id: string) {
    const ok = claimDailyReward(id);
    if (ok) scheduleSave();
  }

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
          <span className="text-[11px] font-bold tracking-widest text-cream/70">MISSÕES DIÁRIAS</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">{completedCount}/{DAILY_CHALLENGES.length}</span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/10">
          <motion.div
            className="h-full rounded-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / DAILY_CHALLENGES.length) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            style={{ boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
          />
        </div>
        <p className="mt-1.5 text-[11px] text-violet/60">Reset diário à meia-noite</p>
      </div>

      {/* Challenges list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
        <div className="flex flex-col gap-2">
          {DAILY_CHALLENGES.map((ch) => {
            const progress = getDailyProgress(ch.progressKey);
            const completed = dc.completed.includes(ch.id);
            const canClaim = !completed && progress >= ch.target;
            const pct = Math.min(100, (progress / ch.target) * 100);

            return (
              <div
                key={ch.id}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: completed ? "rgba(100,220,140,0.2)" : canClaim ? "rgba(200,155,60,0.3)" : "rgba(122,111,160,0.1)",
                  background: completed ? "rgba(100,220,140,0.04)" : canClaim ? "rgba(200,155,60,0.06)" : "rgba(122,111,160,0.03)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div
                      className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base"
                      style={{
                        background: completed ? "rgba(100,220,140,0.1)" : "rgba(122,111,160,0.08)",
                        border: `1px solid ${completed ? "rgba(100,220,140,0.2)" : "rgba(122,111,160,0.12)"}`,
                      }}
                    >
                      {ch.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold" style={{ color: completed ? "rgba(100,220,140,0.8)" : "rgba(255,255,255,0.8)" }}>
                        {ch.title}
                      </p>
                      <p className="text-[11px] text-violet/65">{ch.description}</p>
                    </div>
                  </div>

                  <motion.button
                    onClick={canClaim ? () => handleClaim(ch.id) : undefined}
                    whileTap={canClaim ? { scale: 0.94 } : undefined}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold"
                    style={{
                      borderColor: completed ? "rgba(100,220,140,0.2)" : canClaim ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.1)",
                      background: completed ? "rgba(100,220,140,0.06)" : canClaim ? "rgba(200,155,60,0.1)" : "transparent",
                      color: completed ? "rgb(100,220,140)" : canClaim ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                      cursor: canClaim ? "pointer" : "default",
                    }}
                  >
                    {completed ? "✓" : ch.rewardLabel}
                  </motion.button>
                </div>

                {/* Progress bar */}
                {!completed && (
                  <div className="mt-2.5">
                    <div className="mb-1 flex justify-between">
                      <span className="text-[10px] text-violet/35">Progresso</span>
                      <span className="text-[10px] font-bold text-violet/50">{Math.min(progress, ch.target)}/{ch.target}</span>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-violet/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: canClaim ? "rgb(200,155,60)" : "rgba(122,111,160,0.4)",
                          boxShadow: canClaim ? "0 0 6px rgba(200,155,60,0.4)" : "none",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
