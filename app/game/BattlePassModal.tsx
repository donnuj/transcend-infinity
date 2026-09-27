"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

const MAX_LEVEL = 40;
const XP_PER_LEVEL = 1000;

type Reward = { type: "ouro" | "cristaisAstra" | "selosDeInvocacao" | "selosLivres" | "item"; amount?: number; itemId?: string; label: string; icon: string };

const FREE_REWARDS: Record<number, Reward> = {
  1:  { type: "ouro",             amount: 200,  label: "200 Ouro",     icon: "◆" },
  3:  { type: "cristaisAstra",    amount: 100,  label: "100 Cristais", icon: "✦" },
  5:  { type: "selosDeInvocacao", amount: 1,    label: "1 Selo",       icon: "✦" },
  7:  { type: "ouro",             amount: 500,  label: "500 Ouro",     icon: "◆" },
  10: { type: "selosDeInvocacao", amount: 2,    label: "2 Selos",      icon: "✦" },
  15: { type: "cristaisAstra",    amount: 300,  label: "300 Cristais", icon: "✦" },
  20: { type: "selosLivres",      amount: 1,    label: "Selo Livre",   icon: "★" },
  25: { type: "selosDeInvocacao", amount: 3,    label: "3 Selos",      icon: "✦" },
  30: { type: "cristaisAstra",    amount: 500,  label: "500 Cristais", icon: "✦" },
  35: { type: "ouro",             amount: 2000, label: "2k Ouro",      icon: "◆" },
  40: { type: "selosLivres",      amount: 2,    label: "2 Selos Livres",icon: "★"},
};

const PREMIUM_REWARDS: Record<number, Reward> = {
  1:  { type: "cristaisAstra",    amount: 200,  label: "200 Cristais", icon: "✦" },
  2:  { type: "ouro",             amount: 500,  label: "500 Ouro",     icon: "◆" },
  5:  { type: "selosDeInvocacao", amount: 2,    label: "2 Selos",      icon: "✦" },
  8:  { type: "cristaisAstra",    amount: 300,  label: "300 Cristais", icon: "✦" },
  10: { type: "selosDeInvocacao", amount: 3,    label: "3 Selos",      icon: "✦" },
  12: { type: "ouro",             amount: 1000, label: "1k Ouro",      icon: "◆" },
  15: { type: "selosLivres",      amount: 1,    label: "Selo Livre",   icon: "★" },
  20: { type: "selosDeInvocacao", amount: 5,    label: "5 Selos",      icon: "✦" },
  25: { type: "cristaisAstra",    amount: 800,  label: "800 Cristais", icon: "✦" },
  30: { type: "selosLivres",      amount: 2,    label: "2 Selos Livres",icon: "★"},
  35: { type: "selosDeInvocacao", amount: 8,    label: "8 Selos",      icon: "✦" },
  40: { type: "cristaisAstra",    amount: 1600, label: "1600 Cristais",icon: "✦" },
};

export default function BattlePassModal({ onClose }: { onClose: () => void }) {
  const { save, addCurrency, addItem } = useGameStore();
  const bp = save.battlePass;
  const currentLevel = bp.level;
  const xpPct = Math.min(100, (bp.xp / XP_PER_LEVEL) * 100);

  function claimReward(level: number, isPremium: boolean) {
    const alreadyClaimed = isPremium ? bp.claimedPremium.includes(level) : bp.claimedFree.includes(level);
    if (alreadyClaimed || level > currentLevel) return;
    const reward = isPremium ? PREMIUM_REWARDS[level] : FREE_REWARDS[level];
    if (!reward) return;
    if (isPremium && !bp.isPremium) return;

    if (reward.type === "item" && reward.itemId) {
      addItem(reward.itemId, reward.amount ?? 1);
    } else if (reward.type !== "item") {
      addCurrency(reward.type, reward.amount ?? 0);
    }

    useGameStore.setState((s) => {
      if (isPremium) s.save.battlePass.claimedPremium.push(level);
      else s.save.battlePass.claimedFree.push(level);
    });
    scheduleSave();
  }

  function addBpXp(amount: number) {
    useGameStore.setState((s) => {
      const bp = s.save.battlePass;
      bp.xp += amount;
      while (bp.xp >= XP_PER_LEVEL && bp.level < MAX_LEVEL) {
        bp.xp -= XP_PER_LEVEL;
        bp.level++;
      }
    });
    scheduleSave();
  }

  const displayLevels = Array.from({ length: Math.min(MAX_LEVEL, currentLevel + 5) }, (_, i) => i + 1);

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
          <motion.button onClick={onClose} whileTap={{ scale: 0.94 }} transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }} className="text-[10px] font-bold tracking-widest text-violet/60">
            ← Fechar
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">BATTLE PASS</span>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-bold ${bp.isPremium ? "border-amber/40 text-amber-400" : "border-violet/20 text-violet/40"}`}>
          {bp.isPremium ? "PREMIUM" : "GRATUITO"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Level bar */}
        <div className="mb-5 pt-4">
          <div className="mb-1.5 flex justify-between">
            <span className="text-[11px] font-bold text-cream/70">Nível {currentLevel} / {MAX_LEVEL}</span>
            <span className="text-[10px] text-violet/50">{bp.xp} / {XP_PER_LEVEL} XP</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-violet/10">
            <motion.div
              className="h-full rounded-full bg-amber"
              style={{ width: `${xpPct}%`, boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
          <motion.button
            onClick={() => addBpXp(500)}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="mt-2 rounded-lg border border-violet/10 px-3 py-1.5 text-[8px] text-violet/40"
          >
            +500 XP (teste)
          </motion.button>
        </div>

        {/* Rewards grid */}
        <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Recompensas</p>
        <div className="flex flex-col gap-2">
          {displayLevels.map((lvl) => {
            const free = FREE_REWARDS[lvl];
            const prem = PREMIUM_REWARDS[lvl];
            if (!free && !prem) return null;
            const locked = lvl > currentLevel;
            const freeC = bp.claimedFree.includes(lvl);
            const premC = bp.claimedPremium.includes(lvl);
            return (
              <div key={lvl} className="flex items-center gap-2">
                {/* Level badge */}
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
                  style={{
                    background: locked ? "rgba(122,111,160,0.06)" : "rgba(200,155,60,0.1)",
                    color: locked ? "rgba(122,111,160,0.3)" : "rgb(200,155,60)",
                    border: `1px solid ${locked ? "rgba(122,111,160,0.1)" : "rgba(200,155,60,0.3)"}`,
                  }}
                >
                  {lvl}
                </div>
                {/* Free reward */}
                {free && (
                  <RewardCard
                    reward={free}
                    locked={locked}
                    claimed={freeC}
                    onClaim={() => claimReward(lvl, false)}
                    accentColor="rgba(200,155,60,0.8)"
                  />
                )}
                {/* Premium reward */}
                {prem && (
                  <RewardCard
                    reward={prem}
                    locked={locked || !bp.isPremium}
                    claimed={premC}
                    onClaim={() => claimReward(lvl, true)}
                    accentColor="rgba(170,130,255,0.8)"
                    isPremium
                  />
                )}
              </div>
            );
          })}
        </div>

        {!bp.isPremium && (
          <div className="mt-5 rounded-xl border border-violet/20 px-4 py-4" style={{ background: "rgba(170,130,255,0.05)" }}>
            <p className="text-[11px] font-bold text-cream/70">Upgrade para Premium</p>
            <p className="mt-0.5 text-[9px] text-violet/50">Desbloqueie recompensas extras e selos adicionais</p>
            <p className="mt-2 text-[9px] text-violet/30">Em breve — R$ 14,99</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RewardCard({ reward, locked, claimed, onClaim, accentColor, isPremium }: {
  reward: Reward; locked: boolean; claimed: boolean;
  onClaim: () => void; accentColor: string; isPremium?: boolean;
}) {
  const canClaim = !locked && !claimed;
  return (
    <motion.button
      onClick={canClaim ? onClaim : undefined}
      whileTap={canClaim ? { scale: 0.95 } : undefined}
      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2"
      style={{
        borderColor: claimed ? "rgba(100,220,140,0.3)" : locked ? "rgba(122,111,160,0.1)" : `${accentColor}40`,
        background: claimed ? "rgba(100,220,140,0.05)" : locked ? "rgba(122,111,160,0.03)" : `${accentColor}08`,
        cursor: canClaim ? "pointer" : "default",
        opacity: locked && !isPremium ? 0.4 : 1,
      }}
    >
      <span className="text-base">{reward.icon}</span>
      <span className="text-[9px] font-bold" style={{ color: claimed ? "rgb(100,220,140)" : locked ? "rgba(122,111,160,0.4)" : "rgba(255,255,255,0.8)" }}>
        {claimed ? "✓ " : locked ? "🔒 " : ""}{reward.label}
      </span>
      {isPremium && <span className="ml-auto text-[7px] text-violet/40">★</span>}
    </motion.button>
  );
}
