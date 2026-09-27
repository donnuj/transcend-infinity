"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { DUNGEONS, DUNGEON_MAP } from "@/lib/game/data/world";
import type { Profile } from "./page";

const ease = [0.23, 1, 0.32, 1] as const;

const LOGIN_REWARDS = [
  { day: 1, label: "100 Ouro",       icon: "◆", amount: 100, type: "ouro"               },
  { day: 2, label: "1 Selo",          icon: "✦", amount: 1,   type: "selosDeInvocacao"   },
  { day: 3, label: "200 Ouro",       icon: "◆", amount: 200, type: "ouro"               },
  { day: 4, label: "Cristal ×50",    icon: "◈", amount: 50,  type: "cristaisAstra"      },
  { day: 5, label: "500 Ouro",       icon: "◆", amount: 500, type: "ouro"               },
  { day: 6, label: "2 Selos",        icon: "✦", amount: 2,   type: "selosDeInvocacao"   },
  { day: 7, label: "Selo Livre",     icon: "★", amount: 1,   type: "selosLivres"        },
];

const DAILY_MISSIONS = [
  { id: "dm_login",   label: "Fazer login",        xp: 20,  done: true  },
  { id: "dm_pull",    label: "Realizar 1 invocação", xp: 30,  done: false },
  { id: "dm_dungeon", label: "Completar 1 dungeon",  xp: 50,  done: false },
];

export default function WorldTab({
  profile,
  onInvocar,
  onDungeon,
  onArena,
  onMercado,
  onBattlePass,
  onTorre,
  onDailyChallenges,
  onBossHunt,
}: {
  profile: Profile | null;
  onInvocar: () => void;
  onDungeon: () => void;
  onArena: () => void;
  onMercado: () => void;
  onBattlePass: () => void;
  onTorre: () => void;
  onDailyChallenges: () => void;
  onBossHunt: () => void;
}) {
  const { save, addCurrency, processLogin } = useGameStore();
  const playerLevel = save.playerLevel;
  const loginBonus = save.loginBonus;
  const wallet = save.wallet;
  const name = profile?.characterName ?? "Invocador";

  const xpPct = Math.min(100, (playerLevel.xp / (200 * playerLevel.level)) * 100);
  const today = new Date().toISOString().split("T")[0];
  const canClaimLogin = !loginBonus.claimedToday || loginBonus.lastClaimDate !== today;

  function claimLoginBonus() {
    if (!canClaimLogin) return;
    const reward = LOGIN_REWARDS[(loginBonus.dayInCycle - 1) % LOGIN_REWARDS.length];
    addCurrency(reward.type as keyof typeof wallet, reward.amount);
    useGameStore.setState((s) => {
      const lb = s.save.loginBonus;
      lb.claimedToday = true;
      lb.lastClaimDate = today;
      lb.dayInCycle = lb.dayInCycle >= LOGIN_REWARDS.length ? 1 : lb.dayInCycle + 1;
    });
    processLogin();
    useGameStore.setState((s) => {
      const entry = s.save.dailyChallenges.progress.find((p) => p.key === "login_claimed");
      if (entry) entry.value = 1;
      else s.save.dailyChallenges.progress.push({ key: "login_claimed", value: 1 });
    });
    scheduleSave();
  }

  const currentReward = LOGIN_REWARDS[(loginBonus.dayInCycle - 1) % LOGIN_REWARDS.length];
  const discoveredRegions = save.worldMap.discoveredRegions.length;
  const totalDungeons = DUNGEONS.length;
  const clearedDungeons = save.dungeon.filter((d) => d.bestRank !== "").length;

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Player banner */}
      <div
        className="mb-5 rounded-xl border border-amber/18 px-5 py-5"
        style={{
          background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(10,10,22,0.95) 60%)",
          boxShadow: "0 0 40px rgba(200,155,60,0.06) inset",
        }}
      >
        <p className="mb-1 text-[10px] uppercase tracking-[0.25em] text-violet/60">
          Bem-vindo de volta
        </p>
        <h2
          className="mb-4 text-xl font-black tracking-[0.15em] text-cream"
          style={{ fontFamily: "var(--font-cinzel)", textShadow: "0 0 24px rgba(200,155,60,0.35)" }}
        >
          {name.toUpperCase()}
        </h2>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-violet/70">
            NÍVEL {playerLevel.level}
          </span>
          <span className="text-[10px] text-violet/50">
            {playerLevel.xp} / {200 * playerLevel.level} EXP
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/15">
          <motion.div
            className="h-full rounded-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            style={{ boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
          />
        </div>
        <div className="mt-3 flex gap-4 text-[10px]">
          <span className="text-violet/50">Login consecutivo: <span className="font-bold text-amber-400">{wallet.loginStreak} dias</span></span>
          <span className="text-violet/50">Regiões: <span className="font-bold text-cream/70">{discoveredRegions}</span></span>
        </div>
      </div>

      {/* Login Bonus */}
      <div className="mb-5 rounded-xl border border-violet/15 px-4 py-3.5" style={{ background: "rgba(122,111,160,0.05)" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-violet/50">
            Bônus Diário — Dia {loginBonus.dayInCycle}
          </p>
          {canClaimLogin ? (
            <motion.button
              onClick={claimLoginBonus}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-1.5 text-[9px] font-bold text-amber-400 tracking-wider"
            >
              RESGATAR {currentReward.icon} {currentReward.label}
            </motion.button>
          ) : (
            <span className="text-[9px] text-violet/40">Resgatado hoje</span>
          )}
        </div>
        <div className="flex gap-1">
          {LOGIN_REWARDS.map((r, i) => {
            const dayIdx = loginBonus.dayInCycle - 1;
            const isCurrent = i === dayIdx % LOGIN_REWARDS.length;
            const isPast = i < dayIdx % LOGIN_REWARDS.length || (loginBonus.cycle > 1 && i < LOGIN_REWARDS.length);
            return (
              <div
                key={r.day}
                className="flex flex-1 flex-col items-center rounded-lg py-1.5"
                style={{
                  background: isCurrent ? "rgba(200,155,60,0.15)" : isPast ? "rgba(122,111,160,0.06)" : "transparent",
                  border: `1px solid ${isCurrent ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.1)"}`,
                }}
              >
                <span className="text-[10px]">{r.icon}</span>
                <span className="text-[7px] text-violet/40">{r.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.25em] text-violet/45">
        Ações Rápidas
      </p>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <ActionCard
          icon="✦"
          title="Invocar"
          sub={`${wallet.selosDeInvocacao} selos disponíveis`}
          accent="rgba(200,155,60,0.8)"
          onClick={onInvocar}
        />
        <ActionCard
          icon="⚔"
          title="Masmorra"
          sub={`${clearedDungeons}/${totalDungeons} completadas`}
          accent="rgba(100,160,255,0.7)"
          onClick={onDungeon}
        />
        <ActionCard
          icon="⚔"
          title="Arena"
          sub={`Rating: ${save.arena.rating}`}
          accent="rgba(100,160,255,0.7)"
          onClick={onArena}
        />
        <ActionCard
          icon="◆"
          title="Mercado"
          sub={`${wallet.ouro.toLocaleString("pt-BR")} ouro`}
          accent="rgba(255,140,80,0.7)"
          onClick={onMercado}
        />
        <ActionCard
          icon="★"
          title="Battle Pass"
          sub={`Nível ${save.battlePass.level} / 40`}
          accent="rgba(200,155,60,0.8)"
          onClick={onBattlePass}
        />
        <ActionCard
          icon="🏛"
          title="Torre"
          sub={`Melhor: ${save.tower.bestFloor}F`}
          accent="rgba(170,130,255,0.8)"
          onClick={onTorre}
        />
        <ActionCard
          icon="☠"
          title="Boss Hunt"
          sub="Chefões semanais"
          accent="rgba(255,100,60,0.8)"
          onClick={onBossHunt}
        />
      </div>

      {/* Dungeon preview */}
      <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.25em] text-violet/45">
        Masmorras
      </p>
      <div className="flex flex-col gap-2 mb-5">
        {DUNGEONS.slice(0, 4).map((d) => {
          const prog = save.dungeon.find((dp) => dp.dungeonId === d.dungeonId);
          const bestRank = prog?.bestRank ?? "–";
          const runs = prog?.totalRuns ?? 0;
          return (
            <div
              key={d.dungeonId}
              className="flex items-center justify-between rounded-xl border border-violet/10 px-4 py-3"
              style={{ background: "rgba(122,111,160,0.04)" }}
            >
              <div>
                <p className="text-[11px] font-bold text-cream/80">{d.name}</p>
                <p className="text-[9px] text-violet/40">Nv.{d.recommendedLevel} · {runs} tentativa{runs !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[11px] font-black" style={{ color: bestRank !== "–" ? "rgb(200,155,60)" : "rgba(122,111,160,0.3)" }}>
                  {bestRank !== "–" ? `Rank ${bestRank}` : "Não iniciado"}
                </span>
                <span className="text-[8px] text-violet/30">{d.stages} andares</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily missions */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-violet/45">Missões Diárias</p>
        <motion.button
          onClick={onDailyChallenges}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="text-[8px] font-bold tracking-wider text-amber-400/70"
        >
          Ver todas →
        </motion.button>
      </div>
      <div className="flex flex-col gap-2">
        {DAILY_MISSIONS.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-xl border border-violet/10 px-4 py-3"
            style={{ background: m.done ? "rgba(100,220,140,0.04)" : "rgba(122,111,160,0.04)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold"
                style={{
                  borderColor: m.done ? "rgba(100,220,140,0.5)" : "rgba(122,111,160,0.2)",
                  color: m.done ? "rgb(100,220,140)" : "rgba(122,111,160,0.4)",
                }}
              >
                {m.done ? "✓" : "○"}
              </div>
              <span className="text-[11px]" style={{ color: m.done ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)" }}>
                {m.label}
              </span>
            </div>
            <span className="text-[9px] font-bold" style={{ color: m.done ? "rgba(122,111,160,0.3)" : "rgb(200,155,60)" }}>
              +{m.xp} XP
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ActionCard({
  icon, title, sub, accent, onClick, disabled,
}: {
  icon: string; title: string; sub: string; accent: string;
  onClick?: () => void; disabled?: boolean;
}) {
  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-start rounded-xl border px-4 py-3.5 text-left"
      style={{
        borderColor: disabled ? "rgba(122,111,160,0.12)" : `${accent}30`,
        background: disabled ? "rgba(10,10,22,0.6)" : `linear-gradient(135deg, ${accent}10 0%, rgba(10,10,22,0.8) 100%)`,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <span className="mb-2 text-xl" style={{ color: disabled ? "rgba(122,111,160,0.4)" : accent }}>
        {icon}
      </span>
      <span className="text-[12px] font-bold tracking-wide text-cream/80">{title}</span>
      <span className="text-[10px] text-violet/50">{sub}</span>
    </motion.button>
  );
}
