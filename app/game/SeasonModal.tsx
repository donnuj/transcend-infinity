"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

const CURRENT_SEASON = {
  id: 1,
  name: "Era dos Arcontes",
  maxLevel: 50,
  xpPerLevel: 1000,
  endDate: "2025-12-31",
};

type SeasonReward = {
  level: number;
  type: "ouro" | "cristaisAstra" | "selosDeInvocacao" | "selosLivres";
  amount: number;
  label: string;
  icon: string;
};

const SEASON_REWARDS: SeasonReward[] = [
  { level: 1,  type: "ouro",             amount: 300,  label: "300 Ouro",     icon: "◆" },
  { level: 3,  type: "cristaisAstra",    amount: 100,  label: "100 Cristais", icon: "✦" },
  { level: 5,  type: "selosDeInvocacao", amount: 1,    label: "1 Selo",       icon: "✦" },
  { level: 8,  type: "ouro",             amount: 800,  label: "800 Ouro",     icon: "◆" },
  { level: 10, type: "cristaisAstra",    amount: 200,  label: "200 Cristais", icon: "✦" },
  { level: 12, type: "selosDeInvocacao", amount: 2,    label: "2 Selos",      icon: "✦" },
  { level: 15, type: "cristaisAstra",    amount: 350,  label: "350 Cristais", icon: "✦" },
  { level: 18, type: "ouro",             amount: 2000, label: "2k Ouro",      icon: "◆" },
  { level: 20, type: "selosLivres",      amount: 1,    label: "Selo Livre",   icon: "★" },
  { level: 25, type: "selosDeInvocacao", amount: 3,    label: "3 Selos",      icon: "✦" },
  { level: 30, type: "cristaisAstra",    amount: 600,  label: "600 Cristais", icon: "✦" },
  { level: 35, type: "selosDeInvocacao", amount: 5,    label: "5 Selos",      icon: "✦" },
  { level: 40, type: "selosLivres",      amount: 1,    label: "Selo Livre",   icon: "★" },
  { level: 45, type: "cristaisAstra",    amount: 800,  label: "800 Cristais", icon: "✦" },
  { level: 50, type: "selosLivres",      amount: 2,    label: "2 Selos Livres", icon: "★" },
];

const REWARD_MAP: Record<number, SeasonReward> = Object.fromEntries(SEASON_REWARDS.map((r) => [r.level, r]));

export default function SeasonModal({ onClose }: { onClose: () => void }) {
  const { save, addCurrency } = useGameStore();
  const season = save.season;

  const currentLevel = season.level;
  const xpPct = Math.min(100, (season.xp / CURRENT_SEASON.xpPerLevel) * 100);

  function claimReward(level: number) {
    if (season.claimedLevels.includes(level)) return;
    if (level > currentLevel) return;
    const reward = REWARD_MAP[level];
    if (!reward) return;

    addCurrency(reward.type, reward.amount);
    useGameStore.setState((s) => {
      s.save.season.claimedLevels.push(level);
    });
    scheduleSave();
  }

  function addSeasonXp(amount: number) {
    useGameStore.setState((s) => {
      const se = s.save.season;
      se.xp += amount;
      while (se.xp >= CURRENT_SEASON.xpPerLevel && se.level < CURRENT_SEASON.maxLevel) {
        se.xp -= CURRENT_SEASON.xpPerLevel;
        se.level++;
      }
    });
    scheduleSave();
  }

  const unclaimedAvailable = SEASON_REWARDS.filter(
    (r) => r.level <= currentLevel && !season.claimedLevels.includes(r.level)
  ).length;

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
          <span className="text-[11px] font-bold tracking-widest text-cream/70">TEMPORADA</span>
        </div>
        {unclaimedAvailable > 0 && (
          <span className="rounded-full border border-amber/30 bg-amber/10 px-2 py-0.5 text-[8px] font-bold text-amber-400">
            {unclaimedAvailable} pendente{unclaimedAvailable > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Season banner */}
        <div
          className="mb-5 mt-4 rounded-xl border border-amber/20 px-5 py-5"
          style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.1) 0%, rgba(10,10,22,0.95) 70%)" }}
        >
          <p className="text-[9px] uppercase tracking-[0.25em] text-violet/50">Temporada {CURRENT_SEASON.id}</p>
          <h2 className="mt-0.5 text-xl font-black tracking-[0.15em] text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
            {CURRENT_SEASON.name.toUpperCase()}
          </h2>
          <p className="mt-1 text-[9px] text-violet/40">Encerra em {CURRENT_SEASON.endDate}</p>
        </div>

        {/* Level progress */}
        <div className="mb-5">
          <div className="mb-1.5 flex justify-between">
            <span className="text-[11px] font-bold text-cream/70">Nível {currentLevel} / {CURRENT_SEASON.maxLevel}</span>
            <span className="text-[10px] text-violet/50">{season.xp} / {CURRENT_SEASON.xpPerLevel} XP</span>
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
            onClick={() => addSeasonXp(500)}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="mt-2 rounded-lg border border-violet/10 px-3 py-1.5 text-[8px] text-violet/40"
          >
            +500 XP (teste)
          </motion.button>
        </div>

        {/* Rewards */}
        <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Recompensas da Temporada</p>
        <div className="flex flex-col gap-2">
          {SEASON_REWARDS.map((reward) => {
            const locked = reward.level > currentLevel;
            const claimed = season.claimedLevels.includes(reward.level);
            const canClaim = !locked && !claimed;
            return (
              <div key={reward.level} className="flex items-center gap-2">
                {/* Level badge */}
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[9px] font-black"
                  style={{
                    background: locked ? "rgba(122,111,160,0.06)" : "rgba(200,155,60,0.1)",
                    color: locked ? "rgba(122,111,160,0.3)" : "rgb(200,155,60)",
                    border: `1px solid ${locked ? "rgba(122,111,160,0.1)" : "rgba(200,155,60,0.3)"}`,
                  }}
                >
                  {reward.level}
                </div>

                {/* Reward card */}
                <motion.button
                  onClick={canClaim ? () => claimReward(reward.level) : undefined}
                  whileTap={canClaim ? { scale: 0.95 } : undefined}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-1 items-center gap-2 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: claimed ? "rgba(100,220,140,0.3)" : canClaim ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.1)",
                    background: claimed ? "rgba(100,220,140,0.05)" : canClaim ? "rgba(200,155,60,0.08)" : "rgba(122,111,160,0.03)",
                    cursor: canClaim ? "pointer" : "default",
                    opacity: locked ? 0.4 : 1,
                  }}
                >
                  <span className="text-base">{reward.icon}</span>
                  <span
                    className="text-[9px] font-bold"
                    style={{ color: claimed ? "rgb(100,220,140)" : locked ? "rgba(122,111,160,0.4)" : "rgba(255,255,255,0.8)" }}
                  >
                    {claimed ? "✓ " : locked ? "🔒 " : "RESGATAR — "}{reward.label}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
