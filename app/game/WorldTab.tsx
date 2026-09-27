"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sword, CastleTurret, Skull, Sparkle, ShoppingCart,
  Backpack, Trophy, MapTrifold, ChatCircleText, Coins, Compass,
  ListChecks, Lightning, MapPin, Hourglass, Check,
} from "@phosphor-icons/react";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { DUNGEONS } from "@/lib/game/data/world";
import type { Profile } from "./page";

type PhosphorIcon = React.ComponentType<{ weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; size?: number; color?: string }>;

const ease = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 500, damping: 26 } as const;

const LOGIN_REWARDS = [
  { day: 1, label: "100 Ouro",    icon: "◆", amount: 100, type: "ouro"             },
  { day: 2, label: "1 Selo",       icon: "✦", amount: 1,   type: "selosDeInvocacao" },
  { day: 3, label: "200 Ouro",    icon: "◆", amount: 200, type: "ouro"             },
  { day: 4, label: "50 Cristais", icon: "◈", amount: 50,  type: "cristaisAstra"    },
  { day: 5, label: "500 Ouro",    icon: "◆", amount: 500, type: "ouro"             },
  { day: 6, label: "2 Selos",     icon: "✦", amount: 2,   type: "selosDeInvocacao" },
  { day: 7, label: "Selo Livre",  icon: "★", amount: 1,   type: "selosLivres"      },
];

const RANK_COLORS: Record<string, string> = {
  SS: "rgb(255,220,80)", S: "rgb(255,160,40)", A: "rgb(180,110,255)",
  B: "rgb(90,160,255)", C: "rgb(80,200,120)", D: "rgb(160,160,200)", "–": "rgba(122,111,160,0.3)",
};

export default function WorldTab({
  profile,
  onInvocar, onDungeon, onArena, onMercado,
  onBattlePass, onTorre, onDailyChallenges,
  onBossHunt, onWorldMap, onNpcDialogue, onCaravana,
}: {
  profile: Profile | null;
  onInvocar: () => void; onDungeon: () => void; onArena: () => void;
  onMercado: () => void; onBattlePass: () => void; onTorre: () => void;
  onDailyChallenges: () => void; onBossHunt: () => void; onWorldMap: () => void;
  onNpcDialogue: () => void; onCaravana: () => void;
}) {
  const { save, addCurrency, processLogin, collectOfflineRewards, incrementDailyProgress } = useGameStore();
  const [offlineReward, setOfflineReward] = useState<{ ouro: number; xp: number } | null>(null);

  useEffect(() => {
    const reward = collectOfflineRewards();
    if (reward) { setOfflineReward(reward); scheduleSave(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playerLevel = save.playerLevel;
  const loginBonus = save.loginBonus;
  const wallet = save.wallet;
  const name = profile?.characterName ?? "Invocador";
  const initial = name[0].toUpperCase();

  const xpPct = Math.min(100, (playerLevel.xp / (200 * playerLevel.level)) * 100);
  const today = new Date().toISOString().split("T")[0];
  const canClaimLogin = !loginBonus.claimedToday || loginBonus.lastClaimDate !== today;
  const currentReward = LOGIN_REWARDS[(loginBonus.dayInCycle - 1) % LOGIN_REWARDS.length];
  const clearedDungeons = save.dungeon.filter((d) => d.bestRank !== "").length;
  const now = Date.now();
  const towerReady = !!save.pendingTower && new Date(save.pendingTower.endTime).getTime() <= now;
  const dungeonReady = save.pendingDungeons.some((r) => new Date(r.endTime).getTime() <= now);
  const hasPendingTower = !!save.pendingTower;
  const hasPendingDungeon = save.pendingDungeons.length > 0;

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
    incrementDailyProgress("login_claimed");
    scheduleSave();
  }

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto pb-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease }}
    >
      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div
        className="relative pb-5 pt-5"
        style={{
          background: "linear-gradient(180deg, rgba(90,50,160,0.12) 0%, rgba(6,7,15,0) 100%)",
        }}
      >
        <div className="relative mx-auto flex w-full max-w-5xl items-start gap-4 px-4 md:px-8 lg:px-12">
          {/* Avatar — outer shell + inner core */}
          <div className="relative shrink-0">
            <div
              style={{
                background: "linear-gradient(135deg, rgba(200,155,60,0.2) 0%, rgba(90,50,160,0.14) 100%)",
                border: "1px solid rgba(200,155,60,0.22)",
                borderRadius: "1.125rem",
                padding: "3px",
                boxShadow: "0 4px 24px rgba(200,155,60,0.1)",
              }}
            >
              <div
                className="flex h-14 w-14 items-center justify-center text-2xl font-black"
                style={{
                  background: "linear-gradient(145deg, rgba(14,12,28,0.97) 0%, rgba(6,7,15,0.99) 100%)",
                  borderRadius: "calc(1.125rem - 3px)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
                  fontFamily: "var(--font-cinzel)",
                  color: "rgb(200,155,60)",
                }}
              >
                {initial}
              </div>
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-black"
              style={{
                background: "linear-gradient(135deg, rgb(200,155,60) 0%, rgb(160,120,40) 100%)",
                color: "rgb(6,7,15)",
                boxShadow: "0 2px 8px rgba(200,155,60,0.4)",
              }}
            >
              {playerLevel.level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-0.5">
            <h2
              className="text-[18px] font-black leading-none text-cream"
              style={{ fontFamily: "var(--font-cinzel)", textShadow: "0 0 20px rgba(200,155,60,0.22)" }}
            >
              {name}
            </h2>

            {/* XP bar */}
            <div className="mt-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-bold tracking-wider text-violet/55">
                  {playerLevel.xp.toLocaleString("pt-BR")} / {(200 * playerLevel.level).toLocaleString("pt-BR")} XP
                </span>
                <span className="text-[9px] font-bold text-amber/75">{Math.round(xpPct)}%</span>
              </div>
              <div className="relative h-[5px] overflow-hidden rounded-full" style={{ background: "rgba(122,111,160,0.1)" }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, rgb(160,110,30) 0%, rgb(200,155,60) 55%, rgb(232,195,80) 100%)",
                    boxShadow: "0 0 8px rgba(200,155,60,0.55)",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.9, ease, delay: 0.15 }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-2.5 flex gap-3">
              <MiniStat Icon={CastleTurret} value={`${clearedDungeons}/${DUNGEONS.length}`} label="Masmorras" color="rgb(90,150,255)" />
              <MiniStat Icon={Lightning} value={`${wallet.loginStreak}d`} label="Streak" color="rgb(200,155,60)" />
              <MiniStat Icon={MapPin} value={`${save.worldMap.discoveredRegions.length}`} label="Regiões" color="rgb(80,200,180)" />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 max-w-5xl mx-auto w-full">
        {/* ── Offline Reward ────────────────────────────────────────────── */}
        <AnimatePresence>
          {offlineReward && (
            <motion.div
              className="mb-4 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(200,155,60,0.12) 0%, rgba(160,100,20,0.05) 100%)",
                border: "1px solid rgba(200,155,60,0.18)",
                borderRadius: "1rem",
                padding: "3px",
                boxShadow: "0 4px 20px rgba(200,155,60,0.06)",
              }}
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ ...spring }}
            >
              <div
                className="px-4 py-3.5"
                style={{
                  background: "linear-gradient(145deg, rgba(14,12,28,0.96) 0%, rgba(6,7,15,0.98) 100%)",
                  borderRadius: "calc(1rem - 3px)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04)",
                }}
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <Hourglass weight="light" size={14} color="rgb(200,155,60)" />
                  <p className="text-[9px] font-black tracking-[0.2em] text-amber/80">RENDA PASSIVA</p>
                </div>
                <div className="flex gap-2">
                  <div
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-amber/80"
                    style={{ background: "rgba(200,155,60,0.09)", border: "1px solid rgba(200,155,60,0.16)" }}
                  >
                    <span>◆</span><span>+{offlineReward.ouro.toLocaleString("pt-BR")}</span>
                  </div>
                  <div
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold text-violet/60"
                    style={{ background: "rgba(122,111,160,0.07)", border: "1px solid rgba(122,111,160,0.13)" }}
                  >
                    <span className="text-[10px]">XP</span><span>+{offlineReward.xp}</span>
                  </div>
                  <motion.button
                    onClick={() => setOfflineReward(null)}
                    whileTap={{ scale: 0.93 }}
                    transition={spring}
                    className="flex items-center justify-center rounded-lg px-4 text-[11px] font-black tracking-wider text-amber/85"
                    style={{ background: "rgba(200,155,60,0.13)", border: "1px solid rgba(200,155,60,0.22)" }}
                  >
                    OK
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Login Bonus ───────────────────────────────────────────────── */}
        {canClaimLogin && <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease, delay: 0.08 }}
          style={{
            background: "rgba(122,111,160,0.04)",
            border: "1px solid rgba(122,111,160,0.09)",
            borderRadius: "1rem",
          }}
        >
          <div className="px-4 py-3.5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet/45">
                Login Diário · Dia {loginBonus.dayInCycle}
              </p>
              <motion.button
                onClick={claimLoginBonus}
                whileTap={{ scale: 0.92 }}
                transition={spring}
                className="rounded-lg px-3 py-1.5 text-[9px] font-black tracking-wider text-void"
                style={{
                  background: "linear-gradient(135deg, rgb(200,155,60) 0%, rgb(175,128,35) 100%)",
                  boxShadow: "0 2px 10px rgba(200,155,60,0.3)",
                }}
              >
                {currentReward.icon} RESGATAR
              </motion.button>
            </div>
            <div className="flex gap-1.5">
              {LOGIN_REWARDS.map((r, i) => {
                const dayIdx = loginBonus.dayInCycle - 1;
                const isCurrent = i === dayIdx % LOGIN_REWARDS.length;
                const isPast = i < dayIdx % LOGIN_REWARDS.length;
                return (
                  <div
                    key={r.day}
                    className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2"
                    style={{
                      background: isCurrent
                        ? "linear-gradient(135deg, rgba(200,155,60,0.15) 0%, rgba(200,155,60,0.05) 100%)"
                        : isPast ? "rgba(100,220,120,0.05)" : "rgba(122,111,160,0.04)",
                      border: `1px solid ${isCurrent ? "rgba(200,155,60,0.3)" : isPast ? "rgba(100,220,120,0.13)" : "rgba(122,111,160,0.07)"}`,
                      boxShadow: isCurrent ? "0 0 10px rgba(200,155,60,0.08)" : "none",
                    }}
                  >
                    {isPast
                      ? <Check weight="bold" size={10} color="rgb(100,220,120)" />
                      : <span className="text-[10px]" style={{ color: isCurrent ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)" }}>{r.icon}</span>
                    }
                    <span className="text-[7px] font-bold" style={{ color: isCurrent ? "rgb(200,155,60)" : isPast ? "rgb(100,220,120)" : "rgba(122,111,160,0.3)" }}>{r.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>}

        {/* ── Section: Batalha ─────────────────────────────────────────── */}
        <SectionLabel Icon={Sword} label="Batalha" />
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {([
            { Icon: CastleTurret, title: "Masmorra", sub: hasPendingDungeon ? (dungeonReady ? "Recolher!" : "Em missão...") : `${clearedDungeons}/${DUNGEONS.length} claras`, color: "rgb(90,150,255)", onClick: onDungeon, badge: dungeonReady ? "!" : hasPendingDungeon ? "►" : undefined },
            { Icon: Sword, title: "Arena", sub: `Rating ${save.arena.rating}`, color: "rgb(255,100,80)", onClick: onArena },
            { Icon: CastleTurret, title: "Torre", sub: hasPendingTower ? (towerReady ? "Recolher!" : "Escalando...") : (save.tower.bestFloor > 0 ? `${save.tower.bestFloor}F` : "Não iniciada"), color: "rgb(170,130,255)", onClick: onTorre, badge: towerReady ? "!" : hasPendingTower ? "►" : undefined },
            { Icon: Skull, title: "Boss Hunt", sub: "Chefões semanais", color: "rgb(255,80,80)", onClick: onBossHunt, badge: save.bossHunt.weeklyDefeated.length > 0 ? undefined : "!" },
          ] as const).map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.3, ease, delay: i * 0.055 }}
            >
              <GameCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* ── Section: Economia ────────────────────────────────────────── */}
        <SectionLabel Icon={Coins} label="Economia" />
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {([
            { Icon: Sparkle, title: "Invocar", sub: `${wallet.selosDeInvocacao} selos`, color: "rgb(200,155,60)", onClick: onInvocar },
            { Icon: ShoppingCart, title: "Mercado", sub: `${wallet.ouro.toLocaleString("pt-BR")} ouro`, color: "rgb(255,160,60)", onClick: onMercado },
            { Icon: Backpack, title: "Caravana", sub: save.caravan.inTransit ? "Em trânsito..." : "Livre", color: "rgb(200,155,60)", onClick: onCaravana, badge: save.caravan.inTransit ? "►" : undefined },
            { Icon: Trophy, title: "Battle Pass", sub: `Nível ${save.battlePass.level}/40`, color: "rgb(200,155,60)", onClick: onBattlePass },
          ] as const).map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.3, ease, delay: i * 0.055 }}
            >
              <GameCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* ── Section: Exploração ──────────────────────────────────────── */}
        <SectionLabel Icon={Compass} label="Exploração" />
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {([
            { Icon: MapTrifold, title: "Mapa Mundial", sub: `${save.worldMap.discoveredRegions.length} regiões`, color: "rgb(80,200,180)", onClick: onWorldMap },
            { Icon: ChatCircleText, title: "NPCs", sub: "Diálogos & histórias", color: "rgb(100,210,180)", onClick: onNpcDialogue },
          ] as const).map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10px" }}
              transition={{ duration: 0.3, ease, delay: i * 0.055 }}
            >
              <GameCard {...card} />
            </motion.div>
          ))}
        </div>

        {/* ── Dungeon Progress ─────────────────────────────────────────── */}
        <SectionLabel Icon={CastleTurret} label="Masmorras Recentes" />
        <div className="mb-4 flex flex-col gap-2">
          {DUNGEONS.slice(0, 4).map((d, i) => {
            const prog = save.dungeon.find((dp) => dp.dungeonId === d.dungeonId);
            const rank = prog?.bestRank ?? "–";
            const runs = prog?.totalRuns ?? 0;
            const rankColor = RANK_COLORS[rank] ?? RANK_COLORS["–"];
            return (
              <motion.button
                key={d.dungeonId}
                onClick={onDungeon}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left"
                style={{
                  background: rank !== "–" ? "rgba(122,111,160,0.06)" : "rgba(122,111,160,0.03)",
                  border: `1px solid ${rank !== "–" ? "rgba(122,111,160,0.11)" : "rgba(122,111,160,0.06)"}`,
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                // @ts-expect-error motion custom prop
                transition={{ duration: 0.25, ease, delay: i * 0.04 }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: rank !== "–" ? `${rankColor}12` : "rgba(122,111,160,0.06)",
                    border: `1px solid ${rank !== "–" ? `${rankColor}20` : "rgba(122,111,160,0.07)"}`,
                  }}
                >
                  <CastleTurret weight="light" size={18} color={rank !== "–" ? rankColor : "rgba(122,111,160,0.4)"} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-cream/85">{d.name}</p>
                  <p className="text-[9px] text-violet/38">Nv.{d.recommendedLevel} · {runs > 0 ? `${runs} run${runs > 1 ? "s" : ""}` : "Nunca explorada"}</p>
                </div>
                {rank !== "–" ? (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-black"
                    style={{
                      background: `${rankColor}12`,
                      border: `1px solid ${rankColor}30`,
                      color: rankColor,
                      boxShadow: `0 0 8px ${rankColor}18`,
                    }}
                  >
                    {rank}
                  </div>
                ) : (
                  <span className="text-[12px] text-violet/25">›</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* ── Daily Missions ────────────────────────────────────────────── */}
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel Icon={ListChecks} label="Missões Diárias" inline />
          <motion.button
            onClick={onDailyChallenges}
            whileTap={{ scale: 0.93 }}
            transition={spring}
            className="text-[9px] font-bold tracking-wider text-amber/60"
          >
            Ver todas ›
          </motion.button>
        </div>
        <div className="mb-2 flex flex-col gap-2">
          {[
            { id: "login",   label: "Fazer login hoje",       done: true,  xp: 20  },
            { id: "invocar", label: "Realizar 1 invocação",   done: false, xp: 30  },
            { id: "dungeon", label: "Completar 1 masmorra",   done: false, xp: 50  },
          ].map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: m.done ? "rgba(100,220,120,0.04)" : "rgba(122,111,160,0.04)",
                border: `1px solid ${m.done ? "rgba(100,220,120,0.1)" : "rgba(122,111,160,0.07)"}`,
              }}
            >
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: m.done ? "rgba(100,220,120,0.14)" : "transparent",
                  border: `1px solid ${m.done ? "rgba(100,220,120,0.35)" : "rgba(122,111,160,0.18)"}`,
                }}
              >
                {m.done && <Check weight="bold" size={9} color="rgb(100,220,120)" />}
              </div>
              <span className="flex-1 text-[11px]" style={{ color: m.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.78)" }}>
                {m.label}
              </span>
              <span className="text-[9px] font-bold" style={{ color: m.done ? "rgba(122,111,160,0.28)" : "rgb(200,155,60)" }}>
                +{m.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function MiniStat({ Icon, value, label, color }: { Icon: PhosphorIcon; value: string; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon weight="light" size={13} color={color} />
      <div>
        <p className="text-[10px] font-bold leading-none text-cream/72">{value}</p>
        <p className="text-[7px] text-violet/38">{label}</p>
      </div>
    </div>
  );
}

function SectionLabel({ Icon, label, inline }: { Icon: PhosphorIcon; label: string; inline?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${inline ? "" : "mb-2.5"}`}>
      <Icon weight="light" size={12} color="rgba(122,111,160,0.5)" />
      <span className="text-[8.5px] font-black uppercase tracking-[0.22em] text-violet/45">{label}</span>
      {!inline && <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(122,111,160,0.12) 0%, transparent 100%)" }} />}
    </div>
  );
}

function GameCard({
  Icon, title, sub, color, onClick, badge,
}: {
  Icon: PhosphorIcon; title: string; sub: string; color: string;
  onClick: () => void; badge?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      transition={spring}
      className="relative w-full text-left"
      style={{
        background: `linear-gradient(145deg, ${color}16 0%, ${color}06 100%)`,
        border: `1px solid ${color}1e`,
        borderRadius: "1.125rem",
        padding: "3px",
        boxShadow: `0 2px 16px ${color}06`,
      }}
    >
      {badge && (
        <div
          className="absolute right-2.5 top-2.5 z-10 flex h-4 w-4 items-center justify-center rounded-full text-[7.5px] font-black"
          style={{ background: "rgb(255,80,80)", color: "white", boxShadow: "0 0 8px rgba(255,80,80,0.45)" }}
        >
          {badge}
        </div>
      )}
      {/* Inner core */}
      <div
        className="flex flex-col items-start px-3.5 py-3.5"
        style={{
          background: "linear-gradient(160deg, rgba(13,12,26,0.98) 0%, rgba(6,7,15,0.99) 100%)",
          borderRadius: "calc(1.125rem - 3px)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.02)",
        }}
      >
        <div
          className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}1e`,
            boxShadow: `0 1px 8px ${color}08`,
          }}
        >
          <Icon weight="light" size={22} color={color} />
        </div>
        <span className="text-[12px] font-bold leading-tight text-cream/88">{title}</span>
        <span className="mt-0.5 text-[9px] leading-tight font-medium" style={{ color: `${color}88` }}>{sub}</span>
      </div>
    </motion.button>
  );
}
