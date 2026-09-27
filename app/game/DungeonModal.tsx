"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { DUNGEONS } from "@/lib/game/data/world";
import { scheduleSave } from "@/lib/game/save";
import {
  buildHeroCombatant, buildEnemyWave, simulateBattle,
  type CombatantSnapshot, type BattleResult,
} from "@/lib/game/combat";
import type { DungeonDef } from "@/lib/game/types";

const ease = [0.23, 1, 0.32, 1] as const;

const RANK_COLOR: Record<string, string> = {
  SS: "rgb(255,255,200)", S: "rgb(255,200,50)", A: "rgb(200,155,60)",
  B: "rgb(90,150,255)", C: "rgb(100,210,130)", D: "rgb(180,180,210)", "": "rgba(122,111,160,0.4)"
};

type Screen = "list" | "team" | "battle" | "result";

export default function DungeonModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("list");
  const [dungeon, setDungeon] = useState<DungeonDef | null>(null);
  const [team, setTeam] = useState<string[]>([]);
  const [result, setResult] = useState<BattleResult | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  function selectDungeon(d: DungeonDef) {
    setDungeon(d);
    setTeam([]);
    setScreen("team");
  }

  function startBattle() {
    if (!dungeon || team.length === 0) return;
    const store = useGameStore.getState();
    const heroes = team.map((heroId) => {
      const hero = HERO_MAP[heroId];
      if (!hero) return null;
      const prog = store.getHeroProgression(heroId);
      const lvl = store.getHeroLevel(heroId);
      return buildHeroCombatant(hero, prog.rank, Math.max(1, Math.min(5, prog.stars)) as 1|2|3|4|5, lvl.level);
    }).filter((h): h is CombatantSnapshot => h !== null);

    const enemies = buildEnemyWave(dungeon, 1);
    const r = simulateBattle(heroes, enemies);
    setResult(r);

    const log: string[] = [];
    for (const ev of r.events.slice(0, 12)) {
      const actor = heroes.find((h) => h.id === ev.actorId) ?? { name: "Inimigo", portrait: "👹" };
      const target = enemies.find((e) => e.id === ev.targetId) ?? heroes.find((h) => h.id === ev.targetId) ?? { name: "?", portrait: "?" };
      if (ev.type === "miss") {
        log.push(`${actor.name} errou o ataque!`);
      } else {
        log.push(`${actor.name} causou ${ev.value.toLocaleString("pt-BR")} de dano${ev.isCrit ? " (CRÍTICO!)" : ""}${ev.killedTarget ? ` — ${target.name} derrotado!` : ""}`);
      }
    }
    setBattleLog(log);
    setScreen("battle");

    setTimeout(() => {
      applyRewards(r, dungeon);
      setScreen("result");
    }, 2500);
  }

  function applyRewards(r: BattleResult, d: DungeonDef) {
    const store = useGameStore.getState();
    if (r.won) {
      store.updateDungeonProgress(d.dungeonId, r.rank, r.ticksElapsed);
      store.addCurrency("ouro", r.ouroReward);
      store.addPlayerXp(r.xpReward);
      for (const drop of r.itemDrops) store.addItem(drop.itemId, drop.qty);
      store.incrementDailyProgress("dungeons_today");
    }
    scheduleSave();
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
            onClick={screen === "list" ? onClose : () => setScreen(screen === "battle" ? "team" : screen === "team" ? "list" : "list")}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "list" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">
            {screen === "list" ? "MASMORRAS" : screen === "team" ? dungeon?.name.toUpperCase() : "BATALHA"}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {screen === "list" && <DungeonList key="list" onSelect={selectDungeon} />}
        {screen === "team" && dungeon && <TeamPicker key="team" dungeon={dungeon} team={team} onTeamChange={setTeam} onStart={startBattle} />}
        {screen === "battle" && dungeon && team.length > 0 && (
          <BattleScreen key="battle" dungeon={dungeon} team={team} log={battleLog} />
        )}
        {screen === "result" && result && dungeon && (
          <ResultScreen key="result" result={result} dungeon={dungeon} onClose={onClose} onRetry={() => { setResult(null); setScreen("team"); }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Dungeon List ────────────────────────────────────────────────────────────────

function DungeonList({ onSelect }: { onSelect: (d: DungeonDef) => void }) {
  const { save } = useGameStore();
  return (
    <motion.div
      className="flex-1 overflow-y-auto px-4 pb-6 pt-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.18, ease }}
    >
      <p className="mb-4 text-[9px] uppercase tracking-[0.25em] text-violet/40">
        Escolha uma masmorra para entrar
      </p>
      <div className="flex flex-col gap-3">
        {DUNGEONS.map((d, i) => {
          const prog = save.dungeon.find((dp) => dp.dungeonId === d.dungeonId);
          const cleared = !!prog?.bestRank;
          return (
            <motion.button
              key={d.dungeonId}
              onClick={() => onSelect(d)}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center justify-between rounded-xl border px-4 py-4 text-left"
              style={{
                borderColor: cleared ? "rgba(200,155,60,0.3)" : "rgba(122,111,160,0.15)",
                background: cleared ? "rgba(200,155,60,0.05)" : "rgba(122,111,160,0.04)",
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              // @ts-expect-error framer-motion transition on motion.button
              transition={{ duration: 0.2, delay: i * 0.04, ease }}
            >
              <div>
                <p className="text-[13px] font-bold text-cream/85">{d.name}</p>
                <p className="mt-0.5 text-[9px] text-violet/45">
                  Nv.{d.recommendedLevel} · {d.stages} andares · {prog?.totalRuns ?? 0} tentativas
                </p>
                {d.description && <p className="mt-1 text-[9px] text-violet/40 line-clamp-1">{d.description}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                {!!prog?.bestRank ? (
                  <span className="text-[13px] font-black" style={{ color: RANK_COLOR[prog.bestRank] ?? "rgba(122,111,160,0.4)" }}>
                    {prog.bestRank}
                  </span>
                ) : (
                  <span className="text-[9px] text-violet/30">Novo</span>
                )}
                <span className="text-[8px] text-violet/30">→</span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Team Picker ─────────────────────────────────────────────────────────────────

function TeamPicker({ dungeon, team, onTeamChange, onStart }: {
  dungeon: DungeonDef;
  team: string[];
  onTeamChange: (t: string[]) => void;
  onStart: () => void;
}) {
  const { save } = useGameStore();
  const MAX_TEAM = 3;

  const heroes = useMemo(() => {
    const ids = new Set(save.collectedHeroIds.map((k) => k.split("|")[1]));
    return Array.from(ids).map((id) => HERO_MAP[id]).filter(Boolean);
  }, [save.collectedHeroIds]);

  function toggle(heroId: string) {
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
        <p className="mb-1 text-[9px] uppercase tracking-[0.2em] text-violet/40">
          Selecione até {MAX_TEAM} heróis ({team.length}/{MAX_TEAM})
        </p>
        {/* Team slots */}
        <div className="mb-3 flex gap-2">
          {Array.from({ length: MAX_TEAM }).map((_, i) => {
            const heroId = team[i];
            const hero = heroId ? HERO_MAP[heroId] : null;
            return (
              <div
                key={i}
                className="flex h-12 w-12 items-center justify-center rounded-xl border text-xl"
                style={{
                  borderColor: hero ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                  background: hero ? "rgba(200,155,60,0.08)" : "rgba(122,111,160,0.04)",
                }}
              >
                {hero ? hero.portrait : <span className="text-[10px] text-violet/20">+</span>}
              </div>
            );
          })}
        </div>
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
              return (
                <motion.button
                  key={hero.heroId}
                  onClick={() => toggle(hero.heroId)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                  style={{
                    borderColor: selected ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                    background: selected ? "rgba(200,155,60,0.1)" : "rgba(122,111,160,0.04)",
                  }}
                >
                  <span className="mb-1 text-2xl">{hero.portrait}</span>
                  <p className="text-[8px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                  {selected && <span className="mt-0.5 text-[7px] text-amber-400">✓ Selecionado</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-violet/10 px-4 py-3">
        <motion.button
          onClick={team.length > 0 ? onStart : undefined}
          whileTap={team.length > 0 ? { scale: 0.97 } : undefined}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest transition-all duration-150"
          style={{
            borderColor: team.length > 0 ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.1)",
            background: team.length > 0 ? "rgba(200,155,60,0.1)" : "transparent",
            color: team.length > 0 ? "rgb(200,155,60)" : "rgba(122,111,160,0.3)",
            cursor: team.length > 0 ? "pointer" : "default",
          }}
        >
          {team.length > 0 ? "ENTRAR NA MASMORRA" : "SELECIONE HERÓIS"}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Battle Screen ──────────────────────────────────────────────────────────────

function BattleScreen({ dungeon, team, log }: { dungeon: DungeonDef; team: string[]; log: string[] }) {
  const store = useGameStore.getState();
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex gap-3">
        {team.map((heroId) => {
          const hero = HERO_MAP[heroId];
          return hero ? (
            <motion.div
              key={heroId}
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-amber/30 text-2xl"
              style={{ background: "rgba(200,155,60,0.08)" }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: team.indexOf(heroId) * 0.2 }}
            >
              {hero.portrait}
            </motion.div>
          ) : null;
        })}
      </div>
      <div className="flex gap-2 text-2xl">
        {["⚔", "⚡", "⚔"].map((s, i) => (
          <motion.span key={i} animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity }}>
            {s}
          </motion.span>
        ))}
      </div>
      <p className="text-[11px] font-bold text-cream/60">Batalha em andamento...</p>
      <div className="w-full rounded-xl border border-violet/10 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
        {log.slice(-4).map((line, i) => (
          <p key={i} className="text-[9px] text-violet/50 leading-relaxed">{line}</p>
        ))}
      </div>
    </motion.div>
  );
}

// ── Result Screen ──────────────────────────────────────────────────────────────

function ResultScreen({ result, dungeon, onClose, onRetry }: {
  result: BattleResult;
  dungeon: DungeonDef;
  onClose: () => void;
  onRetry: () => void;
}) {
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
        {result.won ? "🏆" : "💀"}
      </motion.div>

      <div className="text-center">
        <p className="mb-1 text-2xl font-black tracking-[0.2em] text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
          {result.won ? "VITÓRIA" : "DERROTA"}
        </p>
        <p className="text-[11px] text-violet/50">{dungeon.name}</p>
      </div>

      {result.won && result.rank && (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-xl border text-3xl font-black"
          style={{ borderColor: RANK_COLOR[result.rank], color: RANK_COLOR[result.rank], background: `${RANK_COLOR[result.rank]}15` }}
        >
          {result.rank}
        </div>
      )}

      <div className="w-full rounded-xl border border-violet/12 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-3 text-[9px] uppercase tracking-[0.2em] text-violet/40">Recompensas</p>
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-amber-400">{result.ouroReward}</span>
            <span className="text-[8px] text-violet/40">Ouro</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-cream/70">{result.xpReward}</span>
            <span className="text-[8px] text-violet/40">XP</span>
          </div>
          {result.itemDrops.map((drop) => (
            <div key={drop.itemId} className="flex flex-col items-center">
              <span className="text-xl font-black text-blue-400">×{drop.qty}</span>
              <span className="text-[8px] text-violet/40">Item</span>
            </div>
          ))}
        </div>
      </div>

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
          className="flex-1 rounded-xl border border-amber/30 bg-amber/10 py-3.5 text-[11px] font-bold tracking-wider text-amber-400"
        >
          SAIR
        </motion.button>
      </div>
    </motion.div>
  );
}
