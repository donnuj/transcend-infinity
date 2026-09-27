"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { SKILL_MAP } from "@/lib/game/data/skills";
import { deriveStats, getStatsAtLevel } from "@/lib/game/calc";
import type { GachaRarity, HeroDef, SaveData } from "@/lib/game/types";

const ease = [0.23, 1, 0.32, 1] as const;

const RARITY_STYLE: Record<GachaRarity, { color: string; glow: string; border: string }> = {
  Comum:    { color: "rgb(180,180,210)", glow: "rgba(180,180,210,0.08)", border: "rgba(180,180,210,0.2)"  },
  Incomum:  { color: "rgb(100,210,130)", glow: "rgba(100,210,130,0.08)", border: "rgba(100,210,130,0.25)" },
  Raro:     { color: "rgb(90,150,255)",  glow: "rgba(90,150,255,0.1)",   border: "rgba(90,150,255,0.3)"   },
  Épico:    { color: "rgb(180,110,255)", glow: "rgba(180,110,255,0.12)", border: "rgba(180,110,255,0.35)" },
  Lendário: { color: "rgb(200,155,60)",  glow: "rgba(200,155,60,0.12)",  border: "rgba(200,155,60,0.45)"  },
  Mítico:   { color: "rgb(255,80,80)",   glow: "rgba(255,80,80,0.12)",   border: "rgba(255,80,80,0.5)"    },
  Divino:   { color: "rgb(255,255,200)", glow: "rgba(255,255,200,0.15)", border: "rgba(255,255,200,0.6)"  },
};

const ELEMENT_LABEL: Record<string, string> = {
  None: "—", Fire: "Fogo", Wind: "Vento", Earth: "Terra",
  Water: "Água", Lightning: "Raio", Light: "Luz", Dark: "Sombra",
};

const ELEMENT_ICON: Record<string, string> = {
  None: "◈", Fire: "🔥", Wind: "🌀", Earth: "⛰",
  Water: "💧", Lightning: "⚡", Light: "✦", Dark: "◈",
};

const ROLE_COLOR: Record<string, string> = {
  DPS: "rgb(255,100,100)", Tank: "rgb(100,170,255)", Healer: "rgb(100,220,140)",
  Support: "rgb(200,155,60)", Utility: "rgb(170,130,255)",
};

const RANK_ORDER: GachaRarity[] = ["Divino","Mítico","Lendário","Épico","Raro","Incomum","Comum"];
type FilterRarity = "TODOS" | GachaRarity;
const FILTERS: FilterRarity[] = ["TODOS","Lendário","Épico","Raro","Incomum","Comum"];

type HeroEntry = { hero: HeroDef; copies: number };

export default function CartasTab() {
  const { save, getHeroProgression, getHeroLevel, getHeroSkills } = useGameStore();
  const [filter, setFilter] = useState<FilterRarity>("TODOS");
  const [selected, setSelected] = useState<HeroDef | null>(null);
  const [detailTab, setDetailTab] = useState<"stats"|"skills"|"prog">("stats");

  const collected = useMemo<HeroEntry[]>(() => {
    const counts = new Map<string, number>();
    for (const key of save.collectedHeroIds) {
      const heroId = key.split("|")[1];
      counts.set(heroId, (counts.get(heroId) ?? 0) + 1);
    }
    const entries: HeroEntry[] = [];
    for (const [heroId, copies] of counts) {
      const hero = HERO_MAP[heroId];
      if (hero) entries.push({ hero, copies });
    }
    entries.sort((a, b) => {
      const ra = RANK_ORDER.indexOf(a.hero.rarity);
      const rb = RANK_ORDER.indexOf(b.hero.rarity);
      return ra - rb || a.hero.name.localeCompare(b.hero.name);
    });
    return entries;
  }, [save.collectedHeroIds]);

  const visible = filter === "TODOS"
    ? collected
    : collected.filter((e) => e.hero.rarity === filter);

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
          const s = f !== "TODOS" ? RARITY_STYLE[f as GachaRarity] : null;
          return (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex-shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-bold tracking-[0.15em] transition-colors duration-150"
              style={{
                borderColor: active ? (s ? s.border : "rgba(200,155,60,0.5)") : "rgba(122,111,160,0.2)",
                color:       active ? (s ? s.color  : "rgb(200,155,60)")      : "rgba(122,111,160,0.5)",
                background:  active ? (s ? s.glow   : "rgba(200,155,60,0.08)") : "transparent",
              }}
            >
              {f}
            </motion.button>
          );
        })}
      </div>

      {/* Count */}
      <p className="px-4 pb-2 text-[9px] text-violet/40">
        {visible.length} herói{visible.length !== 1 ? "s" : ""} coletado{visible.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {visible.map(({ hero, copies }, i) => {
              const s = RARITY_STYLE[hero.rarity];
              const prog = getHeroProgression(hero.heroId);
              return (
                <motion.button
                  key={hero.heroId}
                  onClick={() => { setSelected(hero); setDetailTab("stats"); }}
                  whileTap={{ scale: 0.94 }}
                  className="flex flex-col items-center overflow-hidden rounded-xl border pb-2.5 pt-3 text-center"
                  style={{
                    borderColor: s.border,
                    background: `linear-gradient(160deg, ${s.glow} 0%, rgba(10,10,22,0.95) 100%)`,
                    boxShadow: `0 0 12px ${s.glow}`,
                  }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: i * 0.025 }}
                >
                  <span className="mb-1.5 text-2xl">{hero.portrait}</span>
                  <p className="px-1.5 text-[8.5px] font-bold leading-tight text-cream/80">
                    {hero.name.split(",")[0]}
                  </p>
                  <span className="mt-1 text-[8px] font-bold tracking-wide" style={{ color: s.color }}>
                    {hero.rarity.toUpperCase()}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[8px]">{ELEMENT_ICON[hero.element]}</span>
                    {prog.stars > 1 && (
                      <span className="text-[7px] text-amber-400">{"★".repeat(prog.stars)}</span>
                    )}
                  </div>
                  {copies > 1 && (
                    <span className="mt-0.5 text-[8px] text-violet/40">×{copies}</span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hero detail sheet */}
      <AnimatePresence>
        {selected && (
          <HeroDetail
            hero={selected}
            copies={collected.find((e) => e.hero.heroId === selected.heroId)?.copies ?? 1}
            progression={getHeroProgression(selected.heroId)}
            levelData={getHeroLevel(selected.heroId)}
            skillData={getHeroSkills(selected.heroId)}
            detailTab={detailTab}
            onTabChange={setDetailTab}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Hero Detail Sheet ──────────────────────────────────────────────────────────

type DetailTab = "stats" | "skills" | "prog";

type DetailProps = {
  hero: HeroDef;
  copies: number;
  progression: SaveData["heroProgression"][0];
  levelData: SaveData["heroLevels"][0];
  skillData: SaveData["heroSkills"][0];
  detailTab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onClose: () => void;
};

function HeroDetail({ hero, copies, progression, levelData, skillData, detailTab, onTabChange, onClose }: DetailProps) {
  const s = RARITY_STYLE[hero.rarity];
  const rank = (["F","E","D","C","B","A","S","SS","SSS"] as const)[progression.rank] ?? "F";
  const stars = Math.max(1, Math.min(5, progression.stars)) as 1|2|3|4|5;
  const level = levelData.level;
  const currentStats = getStatsAtLevel(hero.baseStats, hero.growthPerLevel, level);
  const secondary = deriveStats(currentStats, rank, stars, level);
  const xpPct = Math.min(100, (levelData.xp / (100 + level * 50)) * 100);

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-void/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 flex max-h-[85%] flex-col rounded-t-2xl border-t px-5 pb-6 pt-5"
        style={{ borderColor: s.border, backgroundColor: "rgba(10,10,22,0.98)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border text-2xl"
            style={{ borderColor: s.border, background: s.glow, boxShadow: `0 0 18px ${s.glow}` }}
          >
            {hero.portrait}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black tracking-wide text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
              {hero.name}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-[10px] font-bold" style={{ color: s.color }}>{hero.rarity}</span>
              <span className="text-[10px] text-violet/50">{hero.heroClass}</span>
              <span className="text-[10px] font-semibold" style={{ color: ROLE_COLOR[hero.role] ?? "rgb(200,155,60)" }}>
                {hero.role}
              </span>
              <span className="text-[10px] text-violet/50">{ELEMENT_ICON[hero.element]} {ELEMENT_LABEL[hero.element]}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold text-amber-400">Nível {level}</span>
            <span className="text-[10px] text-violet/50">Rank {rank}</span>
            <span className="text-[9px] text-amber-400">{"★".repeat(stars)}</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between">
            <span className="text-[8px] text-violet/40">XP</span>
            <span className="text-[8px] text-violet/40">{levelData.xp} / {100 + level * 50}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-violet/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: s.color }}
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 rounded-xl bg-violet/5 p-1">
          {(["stats","skills","prog"] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => onTabChange(t)}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex-1 rounded-lg py-1.5 text-[8px] font-bold tracking-widest transition-colors duration-150"
              style={{
                background: detailTab === t ? s.glow : "transparent",
                color:      detailTab === t ? s.color : "rgba(122,111,160,0.5)",
                border:     detailTab === t ? `1px solid ${s.border}` : "1px solid transparent",
              }}
            >
              {t === "stats" ? "ATRIBUTOS" : t === "skills" ? "HABILIDADES" : "PROGRESSÃO"}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {detailTab === "stats" ? (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.15, ease }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <StatRow label="HP" value={Math.round(secondary.hp)} color="rgb(100,220,140)" />
                  <StatRow label="Mana" value={Math.round(secondary.mana)} color="rgb(90,150,255)" />
                  <StatRow label="ATQ Fís." value={Math.round(secondary.physAtk)} color="rgb(255,120,80)" />
                  <StatRow label="ATQ Mag." value={Math.round(secondary.magAtk)} color="rgb(180,110,255)" />
                  <StatRow label="DEF Fís." value={Math.round(secondary.physDef)} color="rgb(200,155,60)" />
                  <StatRow label="Res. Mag." value={Math.round(secondary.magRes)} color="rgb(170,130,255)" />
                  <StatRow label="Crít %" value={`${(secondary.critChance * 100).toFixed(1)}%`} color="rgb(255,200,50)" />
                  <StatRow label="Vel. Atq" value={secondary.atkSpeed.toFixed(2)} color="rgb(100,210,130)" />
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1.5">
                  {(Object.entries(currentStats) as [string, number][]).map(([k, v]) => (
                    <div key={k} className="flex flex-col items-center rounded-lg border border-violet/10 py-1.5" style={{ background: "rgba(122,111,160,0.04)" }}>
                      <span className="text-[11px] font-black text-cream/80">{Math.round(v)}</span>
                      <span className="text-[8px] font-bold tracking-widest text-violet/40">{k}</span>
                    </div>
                  ))}
                </div>
                {copies > 1 && (
                  <p className="mt-3 text-center text-[9px] text-violet/40">
                    {copies - 1} fragmento{copies - 1 !== 1 ? "s" : ""} de memória acumulado{copies - 1 !== 1 ? "s" : ""}
                  </p>
                )}
              </motion.div>
            ) : detailTab === "skills" ? (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15, ease }}
                className="flex flex-col gap-2"
              >
                {hero.skillIds.map((sid) => {
                  const skill = SKILL_MAP[sid];
                  if (!skill) return null;
                  const userLevel = skillData.skillLevels.find((sl: { skillId: string; level: number }) => sl.skillId === sid)?.level ?? 1;
                  const ouro = useGameStore.getState().save.wallet.ouro;
                  const upgradeCost = 100 * userLevel;
                  const canUpgrade = userLevel < 5 && ouro >= upgradeCost;
                  return (
                    <div
                      key={sid}
                      className="rounded-xl border border-violet/10 px-3 py-2.5"
                      style={{ background: "rgba(122,111,160,0.04)" }}
                    >
                      <div className="mb-0.5 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-cream/85">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-violet/40">{skill.type}</span>
                          <span className="rounded bg-violet/10 px-1 py-0.5 text-[7px] font-bold text-violet/60">
                            Nv.{userLevel}/5
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] leading-relaxed text-violet/50">{skill.description}</p>
                      {skill.manaCost > 0 && (
                        <div className="mt-1 flex gap-3">
                          <span className="text-[8px] text-blue-400/60">Mana: {skill.manaCost}</span>
                          {skill.cooldown > 0 && <span className="text-[8px] text-violet/40">CD: {skill.cooldown}t</span>}
                        </div>
                      )}
                      {userLevel < 5 && (
                        <UpgradeButton
                          label={`Evoluir — ${upgradeCost.toLocaleString("pt-BR")} ouro`}
                          enabled={canUpgrade}
                          color={s.color}
                          glow={s.glow}
                          border={s.border}
                          onPress={() => {
                            useGameStore.getState().upgradeHeroSkill(hero.heroId, sid);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <ProgressionTab hero={hero} progression={progression} s={s} />
            )}
          </AnimatePresence>
        </div>

        {/* Close */}
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="mt-4 w-full rounded-xl border border-violet/20 py-3 text-[11px] font-bold tracking-wider text-violet/60 transition-colors duration-150 hover:border-violet/40 hover:text-violet/80"
        >
          FECHAR
        </motion.button>
      </motion.div>
    </>
  );
}

// ── Progression Tab ────────────────────────────────────────────────────────────

const RANK_LABELS = ["F","E","D","C","B","A","S","SS","SSS"] as const;
const RANK_FRAG_COST = [10,20,30,40,50,60];
const AWAKEN_FRAG_COST = [20,40,60,80,100];
const AWAKEN_BONUS = ["–","Vel. Atq +5%","Crít +3%","HP +10%","Todos stats +5%","Forma Lendária"];
const STAR_FRAG_COST = [5,10,15,20];

function ProgressionTab({ hero, progression, s }: {
  hero: HeroDef;
  progression: SaveData["heroProgression"][0];
  s: { color: string; glow: string; border: string };
}) {
  const { rankUpHero, upgradeHeroStars, awakenHero, getFragmentos } = useGameStore();
  const frags = getFragmentos(hero.heroId);
  const rank = progression.rank;
  const stars = progression.stars;
  const awaken = progression.awakenLevel;
  const rankLabel = RANK_LABELS[rank] ?? "F";
  const nextRankLabel = rank < 6 ? RANK_LABELS[rank + 1] : null;
  const rankCost = rank < 6 ? RANK_FRAG_COST[rank] : null;
  const starCost = stars < 5 ? STAR_FRAG_COST[stars - 1] : null;
  const awakenCost = awaken < 5 ? AWAKEN_FRAG_COST[awaken] : null;

  return (
    <motion.div
      key="prog"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15, ease }}
      className="flex flex-col gap-3"
    >
      {/* Fragment count */}
      <div className="flex items-center justify-between rounded-xl border border-violet/10 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
        <span className="text-[10px] text-violet/60">Fragmentos de Memória</span>
        <span className="text-base font-black" style={{ color: s.color }}>{frags}</span>
      </div>

      {/* Rank */}
      <ProgSection title="Rank" current={`Rank ${rankLabel}`} next={nextRankLabel ? `→ Rank ${nextRankLabel}` : "MAX"} s={s}>
        <div className="mb-2 flex gap-1">
          {RANK_LABELS.slice(0,7).map((r, i) => (
            <div
              key={r}
              className="flex-1 rounded py-1 text-center text-[7px] font-bold"
              style={{
                background: i <= rank ? s.glow : "rgba(122,111,160,0.04)",
                color:      i <= rank ? s.color : "rgba(122,111,160,0.3)",
                border:     `1px solid ${i <= rank ? s.border : "rgba(122,111,160,0.1)"}`,
              }}
            >
              {r}
            </div>
          ))}
        </div>
        {rankCost !== null && (
          <UpgradeButton
            label={`Evoluir Rank — ${rankCost} fragmentos`}
            enabled={frags >= rankCost}
            color={s.color} glow={s.glow} border={s.border}
            onPress={() => { rankUpHero(hero.heroId); }}
          />
        )}
      </ProgSection>

      {/* Stars */}
      <ProgSection title="Estrelas" current={"★".repeat(stars) + "☆".repeat(5 - stars)} next={starCost !== null ? `→ ${"★".repeat(stars + 1)}` : "MAX"} s={s}>
        <div className="mb-2 text-center text-xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: i < stars ? "rgb(250,190,50)" : "rgba(122,111,160,0.2)" }}>★</span>
          ))}
        </div>
        {starCost !== null && (
          <UpgradeButton
            label={`Subir Estrela — ${starCost} fragmentos`}
            enabled={frags >= starCost}
            color={s.color} glow={s.glow} border={s.border}
            onPress={() => { upgradeHeroStars(hero.heroId); }}
          />
        )}
      </ProgSection>

      {/* Despertar de Memória */}
      <ProgSection title="Despertar de Memória" current={`Nível ${awaken}/5`} next={awakenCost !== null ? AWAKEN_BONUS[awaken + 1] : "COMPLETO"} s={s}>
        <div className="mb-2 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded py-1.5 text-center text-[8px] font-bold"
              style={{
                background: i < awaken ? s.glow : "rgba(122,111,160,0.04)",
                color:      i < awaken ? s.color : "rgba(122,111,160,0.3)",
                border:     `1px solid ${i < awaken ? s.border : "rgba(122,111,160,0.1)"}`,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {awaken < 5 && <p className="mb-2 text-center text-[9px] text-violet/40">Próximo: {AWAKEN_BONUS[awaken + 1]}</p>}
        {awakenCost !== null && (
          <UpgradeButton
            label={`Despertar — ${awakenCost} fragmentos`}
            enabled={frags >= awakenCost}
            color={s.color} glow={s.glow} border={s.border}
            onPress={() => { awakenHero(hero.heroId); }}
          />
        )}
      </ProgSection>
    </motion.div>
  );
}

function ProgSection({ title, current, next, s, children }: {
  title: string; current: string; next: string;
  s: { color: string; glow: string; border: string };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-violet/10 px-3 py-2.5" style={{ background: "rgba(122,111,160,0.04)" }}>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[9px] font-bold tracking-widest text-violet/50">{title.toUpperCase()}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold" style={{ color: s.color }}>{current}</span>
          <span className="text-[8px] text-violet/30">{next}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function UpgradeButton({ label, enabled, color, glow, border, onPress }: {
  label: string; enabled: boolean;
  color: string; glow: string; border: string;
  onPress: () => void;
}) {
  return (
    <motion.button
      onClick={enabled ? onPress : undefined}
      whileTap={enabled ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="mt-1 w-full rounded-lg py-2 text-[9px] font-bold tracking-wider transition-all duration-150"
      style={{
        background: enabled ? glow : "transparent",
        color:      enabled ? color : "rgba(122,111,160,0.3)",
        border:     `1px solid ${enabled ? border : "rgba(122,111,160,0.1)"}`,
        cursor:     enabled ? "pointer" : "default",
      }}
    >
      {label}
    </motion.button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatRow({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-violet/8 px-3 py-2" style={{ background: "rgba(122,111,160,0.04)" }}>
      <span className="text-[9px] text-violet/50">{label}</span>
      <span className="text-[11px] font-black" style={{ color }}>{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</span>
    </div>
  );
}

function EmptyState({ filter }: { filter: FilterRarity }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2">
      <span className="text-3xl opacity-20">◈</span>
      <p className="text-[10px] text-violet/30">
        {filter === "TODOS"
          ? "Nenhum herói coletado ainda. Vá à aba Invocar!"
          : `Nenhum herói ${filter} coletado.`}
      </p>
    </div>
  );
}
