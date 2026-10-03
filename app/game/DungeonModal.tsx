"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { DUNGEONS } from "@/lib/game/data/world";
import { scheduleSave } from "@/lib/game/save";
import { DUNGEON_DURATIONS, DUNGEON_REWARDS, rollDungeonLoot } from "@/lib/game/data/towerData";
import type { DungeonDef, DungeonDifficulty, HeroLevelSave, PendingDungeonRun } from "@/lib/game/types";

const ease = [0.23, 1, 0.32, 1] as const;

const RANK_COLOR: Record<string, string> = {
  SS: "rgb(255,255,200)", S: "rgb(255,200,50)", A: "rgb(200,155,60)",
  B: "rgb(90,150,255)", C: "rgb(100,210,130)", D: "rgb(180,180,210)", "": "rgba(122,111,160,0.4)"
};

const DIFFICULTY_MULT: Record<DungeonDifficulty, number> = {
  easy: 0.5, normal: 1.0, hard: 1.5, epic: 2.0, legendary: 3.0,
};

const COUNT_MULT: Record<number, number> = { 1: 0.6, 2: 0.8, 3: 1.0 };

function calcSuccessChance(
  heroIds: string[],
  heroLevels: HeroLevelSave[],
  dungeon: DungeonDef,
  difficulty: DungeonDifficulty,
): number {
  if (heroIds.length === 0) return 0;
  const requiredLevel = dungeon.recommendedLevel * DIFFICULTY_MULT[difficulty];
  const avgLevel =
    heroIds.reduce((sum, id) => {
      const h = heroLevels.find((hl) => hl.heroId === id);
      return sum + (h?.level ?? 1);
    }, 0) / heroIds.length;
  const countMult = COUNT_MULT[heroIds.length] ?? 1.0;
  return Math.max(0.05, Math.min(1.0, (avgLevel / Math.max(1, requiredLevel)) * countMult));
}

const DIFFICULTY_LABELS: Record<DungeonDifficulty, string> = {
  easy: "Fácil", normal: "Normal", hard: "Difícil", epic: "Épico", legendary: "Lendário"
};

const DIFFICULTY_COLOR: Record<DungeonDifficulty, string> = {
  easy: "rgb(100,210,130)", normal: "rgb(90,150,255)", hard: "rgb(200,155,60)",
  epic: "rgb(170,130,255)", legendary: "rgb(255,140,60)"
};

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "Pronto!";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

type Screen = "list" | "difficulty" | "team" | "result";

export default function DungeonModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("list");
  const [dungeon, setDungeon] = useState<DungeonDef | null>(null);
  const [difficulty, setDifficulty] = useState<DungeonDifficulty>("normal");
  const [team, setTeam] = useState<string[]>([]);
  const [resolvedRun, setResolvedRun] = useState<PendingDungeonRun | null>(null);
  const [droppedItem, setDroppedItem] = useState<{ itemId: string; qty: number } | null>(null);
  const [runSuccess, setRunSuccess] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const {
    save,
    dispatchDungeonRun,
    resolveDungeonRun,
    cancelDungeonRun,
    getBusyHeroIds,
    addCurrency,
    addItem,
    updateDungeonProgress,
    incrementDailyProgress,
    getHousingBonuses,
  } = useGameStore();

  const busyIds = getBusyHeroIds();
  const pendingDungeons = save.pendingDungeons;

  useEffect(() => {
    if (pendingDungeons.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [pendingDungeons.length]);

  function selectDungeon(d: DungeonDef) {
    setDungeon(d);
    setTeam([]);
    setDifficulty("normal");
    setScreen("difficulty");
  }

  function handleDispatch() {
    if (!dungeon || team.length === 0) return;
    const chance = calcSuccessChance(team, save.heroLevels, dungeon, difficulty);
    const runId = dispatchDungeonRun(dungeon.dungeonId, team, difficulty, chance);
    if (runId) {
      setScreen("list");
      scheduleSave();
    }
  }

  function handleCollect(runId: string) {
    const run = pendingDungeons.find((r) => r.runId === runId);
    if (!run) return;
    const resolved = resolveDungeonRun(runId);
    if (!resolved) return;

    const chance = resolved.successChance ?? 1.0;
    const success = Math.random() < chance;

    if (success) {
      const rewards = DUNGEON_REWARDS[resolved.difficulty];
      const hb = getHousingBonuses();
      addCurrency("ouro", rewards.gold);
      addCurrency("cristaisAstra", rewards.crystals);
      const loot = rollDungeonLoot(resolved.difficulty, hb.dropMult);
      if (loot) addItem(loot.itemId, loot.qty, "dungeon");
      updateDungeonProgress(resolved.dungeonId, "A", DUNGEON_DURATIONS[resolved.difficulty]);
      incrementDailyProgress("dungeons_today");
      useGameStore.getState().addReputation("fac_ordem_imperial", 3);
      setDroppedItem(loot);
    } else {
      setDroppedItem(null);
    }

    scheduleSave();
    setRunSuccess(success);
    setResolvedRun(resolved);
    setScreen("result");
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
            onClick={() => {
              if (screen === "list") onClose();
              else if (screen === "difficulty") setScreen("list");
              else if (screen === "team") setScreen("difficulty");
              else setScreen("list");
            }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "list" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">
            {screen === "list" ? "MASMORRAS" : screen === "difficulty" ? dungeon?.name.toUpperCase() : screen === "team" ? "SELECIONAR TIME" : "MISSÃO CONCLUÍDA"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === "list" && (
          <DungeonList
            key="list"
            pendingDungeons={pendingDungeons}
            now={now}
            onSelect={selectDungeon}
            onCollect={handleCollect}
            onCancel={(runId) => { cancelDungeonRun(runId); scheduleSave(); }}
          />
        )}

        {screen === "difficulty" && dungeon && (
          <DifficultyPicker
            key="difficulty"
            dungeon={dungeon}
            selected={difficulty}
            onSelect={setDifficulty}
            onNext={() => setScreen("team")}
          />
        )}

        {screen === "team" && dungeon && (
          <TeamPicker
            key="team"
            dungeon={dungeon}
            difficulty={difficulty}
            team={team}
            busyIds={busyIds}
            onTeamChange={setTeam}
            onDispatch={handleDispatch}
          />
        )}

        {screen === "result" && resolvedRun && (
          <ResultScreen
            key="result"
            run={resolvedRun}
            dungeon={DUNGEONS.find((d) => d.dungeonId === resolvedRun.dungeonId)!}
            droppedItem={droppedItem}
            success={runSuccess}
            onClose={onClose}
            onRetry={() => {
              const d = DUNGEONS.find((d) => d.dungeonId === resolvedRun.dungeonId);
              if (d) { setDungeon(d); setTeam([]); setDifficulty("normal"); setScreen("difficulty"); }
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Dungeon List ────────────────────────────────────────────────────────────────

function DungeonList({ pendingDungeons, now, onSelect, onCollect, onCancel }: {
  pendingDungeons: PendingDungeonRun[];
  now: number;
  onSelect: (d: DungeonDef) => void;
  onCollect: (runId: string) => void;
  onCancel: (runId: string) => void;
}) {
  const { save } = useGameStore();
  return (
    <motion.div
      className="flex-1 overflow-y-auto px-4 pb-6 pt-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18, ease }}
    >
      {/* Active runs */}
      {pendingDungeons.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-violet/60">Missões Ativas</p>
          <div className="flex flex-col gap-2">
            {pendingDungeons.map((run) => {
              const remaining = Math.max(0, new Date(run.endTime).getTime() - now);
              const isReady = remaining === 0;
              const d = DUNGEONS.find((d) => d.dungeonId === run.dungeonId);
              const diffColor = DIFFICULTY_COLOR[run.difficulty];
              return (
                <div
                  key={run.runId}
                  className="rounded-xl border px-3 py-3"
                  style={{
                    borderColor: isReady ? "rgba(100,220,140,0.4)" : `${diffColor}30`,
                    background: isReady ? "rgba(100,220,140,0.06)" : `${diffColor}08`,
                  }}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-cream/80">{d?.name ?? run.dungeonId}</p>
                      <p className="text-[10px]" style={{ color: diffColor }}>{DIFFICULTY_LABELS[run.difficulty]}</p>
                    </div>
                    {!isReady && (
                      <p className="text-[15px] font-black text-amber-400" style={{ fontFamily: "var(--font-cinzel)" }}>
                        {fmtCountdown(remaining)}
                      </p>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-void/80">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: isReady ? "rgb(100,220,140)" : diffColor }}
                      animate={{ width: `${Math.min(1, 1 - remaining / (new Date(run.endTime).getTime() - new Date(run.startTime).getTime())) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  {isReady ? (
                    <motion.button
                      onClick={() => onCollect(run.runId)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full rounded-lg border py-2 text-[10px] font-bold tracking-widest"
                      style={{ borderColor: "rgba(100,220,140,0.4)", background: "rgba(100,220,140,0.1)", color: "rgb(100,220,140)" }}
                    >
                      RECOLHER
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => onCancel(run.runId)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full rounded-lg border border-red-500/20 py-1.5 text-[11px] font-bold tracking-wider text-red-400/50"
                    >
                      Cancelar
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-violet/60">Masmorras</p>
      <div className="flex flex-col gap-3">
        {DUNGEONS.map((d, i) => {
          const prog = save.dungeon.find((dp) => dp.dungeonId === d.dungeonId);
          const cleared = !!prog?.bestRank;
          return (
            <motion.button
              key={d.dungeonId}
              onClick={() => onSelect(d)}
              whileTap={{ scale: 0.97 }}
              className="flex items-center justify-between rounded-xl border px-4 py-4 text-left"
              style={{
                borderColor: cleared ? "rgba(200,155,60,0.3)" : "rgba(122,111,160,0.15)",
                background: cleared ? "rgba(200,155,60,0.05)" : "rgba(122,111,160,0.04)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04, ease }}
            >
              <div>
                <p className="text-[13px] font-bold text-cream/85">{d.name}</p>
                <p className="mt-0.5 text-[11px] text-violet/65">
                  Nv.{d.recommendedLevel} · {d.stages} andares · {prog?.totalRuns ?? 0} tentativas
                </p>
                {d.description && <p className="mt-1 text-[11px] text-violet/60 line-clamp-1">{d.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                {cleared ? (
                  <span className="text-[13px] font-black" style={{ color: RANK_COLOR[prog!.bestRank] ?? "rgba(122,111,160,0.4)" }}>
                    {prog!.bestRank}
                  </span>
                ) : (
                  <span className="text-[11px] text-violet/30">Novo</span>
                )}
                <span className="text-[10px] text-violet/30">→</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Difficulty Picker ───────────────────────────────────────────────────────────

function DifficultyPicker({ dungeon, selected, onSelect, onNext }: {
  dungeon: DungeonDef;
  selected: DungeonDifficulty;
  onSelect: (d: DungeonDifficulty) => void;
  onNext: () => void;
}) {
  const difficulties: DungeonDifficulty[] = ["easy", "normal", "hard", "epic", "legendary"];
  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18, ease }}
    >
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Dificuldade</p>
        <p className="mb-4 text-[11px] text-violet/60">{dungeon.description}</p>
        <div className="flex flex-col gap-2">
          {difficulties.map((diff) => {
            const rewards = DUNGEON_REWARDS[diff];
            const secs = DUNGEON_DURATIONS[diff];
            const color = DIFFICULTY_COLOR[diff];
            const sel = selected === diff;
            return (
              <motion.button
                key={diff}
                onClick={() => onSelect(diff)}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center justify-between rounded-xl border px-4 py-3 text-left"
                style={{
                  borderColor: sel ? `${color}60` : "rgba(122,111,160,0.15)",
                  background: sel ? `${color}12` : "rgba(122,111,160,0.04)",
                }}
              >
                <div>
                  <p className="text-[11px] font-bold" style={{ color: sel ? color : "rgba(232,217,160,0.7)" }}>
                    {DIFFICULTY_LABELS[diff]}
                  </p>
                  <p className="text-[10px] text-violet/60">
                    {rewards.xp.toLocaleString("pt-BR")} XP · {rewards.gold.toLocaleString("pt-BR")} ouro · {rewards.crystals} cristais
                  </p>
                  <p className="text-[10px]" style={{ color: `${color}80` }}>
                    {Math.round(rewards.itemChance * 100)}% chance de item {rewards.itemRarity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-bold" style={{ color: sel ? color : "rgba(122,111,160,0.6)" }}>
                    {fmtDuration(secs)}
                  </p>
                  <p className="text-[10px] text-violet/60">duração</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
      <div className="border-t border-violet/10 px-4 py-3">
        <motion.button
          onClick={onNext}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
          style={{ borderColor: `${DIFFICULTY_COLOR[selected]}40`, background: `${DIFFICULTY_COLOR[selected]}10`, color: DIFFICULTY_COLOR[selected] }}
        >
          SELECIONAR TIME
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Team Picker ─────────────────────────────────────────────────────────────────

function TeamPicker({ dungeon, difficulty, team, busyIds, onTeamChange, onDispatch }: {
  dungeon: DungeonDef;
  difficulty: DungeonDifficulty;
  team: string[];
  busyIds: string[];
  onTeamChange: (t: string[]) => void;
  onDispatch: () => void;
}) {
  const { save } = useGameStore();
  const MAX_TEAM = 3;
  const diffColor = DIFFICULTY_COLOR[difficulty];

  const successChance = team.length > 0
    ? calcSuccessChance(team, save.heroLevels, dungeon, difficulty)
    : 0;
  const chancePct = Math.round(successChance * 100);
  const chanceColor =
    chancePct >= 80 ? "rgb(100,220,140)"
    : chancePct >= 50 ? "rgb(200,155,60)"
    : chancePct >= 30 ? "rgb(255,140,60)"
    : "rgb(255,80,80)";

  const heroes = useMemo(() => {
    const ids = new Set(save.collectedHeroIds.map((k) => k.split("|")[1]));
    return Array.from(ids).map((id) => HERO_MAP[id]).filter(Boolean);
  }, [save.collectedHeroIds]);

  function toggle(heroId: string) {
    if (busyIds.includes(heroId)) return;
    if (team.includes(heroId)) {
      onTeamChange(team.filter((id) => id !== heroId));
    } else if (team.length < MAX_TEAM) {
      onTeamChange([...team, heroId]);
    }
  }

  return (
    <motion.div
      className="flex flex-1 flex-col overflow-hidden"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.18, ease }}
    >
      <div className="px-4 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-violet/60">
            Time ({team.length}/{MAX_TEAM})
          </p>
          <span className="text-[11px] font-bold" style={{ color: diffColor }}>
            {DIFFICULTY_LABELS[difficulty]} · {fmtDuration(DUNGEON_DURATIONS[difficulty])}
          </span>
        </div>
        <div className="mb-3 flex gap-2">
          {Array.from({ length: MAX_TEAM }).map((_, i) => {
            const heroId = team[i];
            const hero = heroId ? HERO_MAP[heroId] : null;
            return (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-xl border text-xl"
                style={{
                  borderColor: hero ? `${diffColor}60` : "rgba(122,111,160,0.15)",
                  background: hero ? `${diffColor}10` : "rgba(122,111,160,0.04)",
                }}
              >
                {hero ? hero.portrait : <span className="text-[10px] text-violet/20">+</span>}
              </div>
            );
          })}
        </div>

        {team.length > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em] text-violet/50">Chance de sucesso</span>
              <span className="text-[11px] font-black" style={{ color: chanceColor }}>{chancePct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-void/80">
              <motion.div
                className="h-full rounded-full"
                style={{ background: chanceColor }}
                animate={{ width: `${chancePct}%` }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
          </div>
        )}
      </div>

      {heroes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <span className="text-3xl opacity-20">◈</span>
          <p className="text-[10px] text-violet/30">Invoque heróis primeiro</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {heroes.map((hero) => {
              if (!hero) return null;
              const selected = team.includes(hero.heroId);
              const busy = busyIds.includes(hero.heroId);
              return (
                <motion.button
                  key={hero.heroId}
                  onClick={() => toggle(hero.heroId)}
                  whileTap={!busy ? { scale: 0.94 } : undefined}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                  style={{
                    borderColor: selected ? `${diffColor}60` : busy ? "rgba(255,80,80,0.15)" : "rgba(122,111,160,0.15)",
                    background: selected ? `${diffColor}12` : busy ? "rgba(255,80,80,0.04)" : "rgba(122,111,160,0.04)",
                    opacity: busy ? 0.45 : 1,
                  }}
                >
                  <span className="mb-1 text-2xl">{hero.portrait}</span>
                  <p className="text-[10px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                  {busy && <p className="text-[7px] text-red-400/70">ocupado</p>}
                  {selected && !busy && <p className="text-[7px]" style={{ color: diffColor }}>✓</p>}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-violet/10 px-4 py-3">
        <motion.button
          onClick={team.length > 0 ? onDispatch : undefined}
          whileTap={team.length > 0 ? { scale: 0.97 } : undefined}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
          style={{
            borderColor: team.length > 0 ? `${diffColor}40` : "rgba(122,111,160,0.1)",
            background: team.length > 0 ? `${diffColor}10` : "transparent",
            color: team.length > 0 ? diffColor : "rgba(122,111,160,0.3)",
          }}
        >
          {team.length > 0 ? "DESPACHAR MISSÃO" : "SELECIONE HERÓIS"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Result Screen ──────────────────────────────────────────────────────────────

function ResultScreen({ run, dungeon, droppedItem, success, onClose, onRetry }: {
  run: PendingDungeonRun;
  dungeon: DungeonDef;
  droppedItem: { itemId: string; qty: number } | null;
  success: boolean;
  onClose: () => void;
  onRetry: () => void;
}) {
  const rewards = DUNGEON_REWARDS[run.difficulty];
  const diffColor = DIFFICULTY_COLOR[run.difficulty];

  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-5 px-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease }}
    >
      <motion.div
        className="text-6xl"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        {success ? "🏆" : "💀"}
      </motion.div>

      <div className="text-center">
        <p
          className="mb-1 text-2xl font-black tracking-[0.2em]"
          style={{ fontFamily: "var(--font-cinzel)", color: success ? "rgb(232,217,160)" : "rgb(255,80,80)" }}
        >
          {success ? "VITÓRIA" : "DERROTA"}
        </p>
        <p className="text-[11px]" style={{ color: diffColor }}>{dungeon.name} — {DIFFICULTY_LABELS[run.difficulty]}</p>
        {!success && (
          <p className="mt-1 text-[10px] text-violet/50">Os heróis não estavam preparados para este desafio</p>
        )}
      </div>

      {success && (
        <div
          className="w-full rounded-xl border px-4 py-4"
          style={{ borderColor: `${diffColor}30`, background: `${diffColor}06` }}
        >
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Recompensas</p>
          <div className="flex flex-col gap-1.5">
            <RewardRow label="Ouro" value={`+${rewards.gold.toLocaleString("pt-BR")}`} color="rgb(200,155,60)" index={0} />
            <RewardRow label="Cristais Astra" value={`+${rewards.crystals}`} color="rgb(170,130,255)" index={1} />
            <RewardRow label="XP" value={`+${rewards.xp.toLocaleString("pt-BR")}`} color="rgb(100,220,140)" index={2} />
            <RewardRow
              label="Item"
              value={droppedItem ? `${droppedItem.itemId} ×${droppedItem.qty}` : "Nenhum"}
              color={droppedItem ? "rgb(232,217,160)" : "rgba(122,111,160,0.4)"}
              index={3}
            />
          </div>
        </div>
      )}

      {!success && (
        <div className="w-full rounded-xl border border-red-500/15 px-4 py-4" style={{ background: "rgba(255,80,80,0.04)" }}>
          <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-red-400/60">Missão falhou</p>
          <p className="text-[10px] text-violet/45">Nível insuficiente ou equipe reduzida. Fortaleça seus heróis e tente novamente.</p>
        </div>
      )}

      <div className="flex w-full gap-3">
        <motion.button
          onClick={onRetry}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1 rounded-xl border border-violet/20 py-3.5 text-[11px] font-bold tracking-wider text-violet/60"
        >
          REPETIR
        </motion.button>
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="flex-1 rounded-xl border py-3.5 text-[11px] font-bold tracking-wider"
          style={{
            borderColor: success ? `${diffColor}40` : "rgba(255,80,80,0.3)",
            background: success ? `${diffColor}10` : "rgba(255,80,80,0.06)",
            color: success ? diffColor : "rgb(255,100,100)",
          }}
        >
          SAIR
        </motion.button>
      </div>
    </motion.div>
  );
}

function RewardRow({ label, value, color, index = 0 }: { label: string; value: string; color: string; index?: number }) {
  return (
    <motion.div
      className="flex items-center justify-between"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1], delay: 0.35 + index * 0.055 }}
    >
      <span className="text-[10px] text-violet/50">{label}</span>
      <span className="text-[10px] font-bold" style={{ color }}>{value}</span>
    </motion.div>
  );
}
