"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { SKILL_MAP } from "@/lib/game/data/skills";
import { EQUIP_MAP } from "@/lib/game/data/items";
import { RUNE_MAP } from "@/lib/game/data/items";
import { HERO_IDENTITY, CLASS_ICON, ELEMENT_RA, RARITY_STARS } from "@/lib/game/data/heroIdentity";
import { deriveStats, getStatsAtLevel } from "@/lib/game/calc";
import type { GachaRarity, HeroDef, SaveData } from "@/lib/game/types";
import { ParticleEffect } from "@/src/components/game/effects/ParticleEffect";
import { IdleBreathing } from "@/src/components/game/ui/IdleBreathing";

const ease = [0.23, 1, 0.32, 1] as const;

function HeroImg({ heroId }: { heroId: string }) {
  const [err, setErr] = useState(false);
  if (err) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/heroes/${heroId}.png`}
      alt=""
      className="absolute inset-0 h-full w-full object-cover"
      style={{
        objectPosition: "center 20%",
        maskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 65%, transparent 100%)",
      }}
      onError={() => setErr(true)}
    />
  );
}

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
  const { save, getHeroProgression, getHeroLevel, getHeroSkills, getHeroEquipment, getHeroRunes } = useGameStore();
  const [filter, setFilter] = useState<FilterRarity>("TODOS");
  const [selected, setSelected] = useState<HeroDef | null>(null);
  const [detailTab, setDetailTab] = useState<"stats"|"skills"|"prog"|"equip">("stats");

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
      <div className="mx-auto w-full max-w-5xl flex gap-2 overflow-x-auto px-4 md:px-8 pb-3 pt-4 scrollbar-none">
        {FILTERS.map((f) => {
          const active = filter === f;
          const s = f !== "TODOS" ? RARITY_STYLE[f as GachaRarity] : null;
          return (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex-shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-[0.15em] transition-colors duration-150"
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
      <p className="mx-auto w-full max-w-5xl px-4 md:px-8 pb-2 text-[11px] text-violet/60">
        {visible.length} herói{visible.length !== 1 ? "s" : ""} coletado{visible.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-4 max-w-5xl mx-auto w-full">
        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {visible.map(({ hero, copies }, i) => {
              const prog = getHeroProgression(hero.heroId);
              return (
                <ArtDecoHeroCard
                  key={hero.heroId}
                  hero={hero}
                  copies={copies}
                  progression={prog}
                  index={i}
                  onClick={() => { setSelected(hero); setDetailTab("stats"); }}
                />
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
            equipData={getHeroEquipment(selected.heroId)}
            runeData={getHeroRunes(selected.heroId)}
            equipInventory={save.equipmentInventory}
            runeInventory={save.runeInventory}
            detailTab={detailTab}
            onTabChange={setDetailTab}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Art Deco Hero Card ─────────────────────────────────────────────────────────

function ArtDecoHeroCard({ hero, copies, progression, index, onClick }: {
  hero: HeroDef;
  copies: number;
  progression: SaveData["heroProgression"][0];
  index: number;
  onClick: () => void;
}) {
  const identity = HERO_IDENTITY[hero.heroId] ?? { accentColor: "#806090", bgTone: "rgba(128,96,144,0.14)", patternAngle: 0 };
  const s = RARITY_STYLE[hero.rarity];
  const classIcon = CLASS_ICON[hero.heroClass] ?? "ra-skull";
  const elementIcon = ELEMENT_RA[hero.element] ?? "ra-rune-stone";
  const stars = Math.max(1, progression.stars || RARITY_STARS[hero.rarity] || 1);
  const shortName = hero.name.split(",")[0].toUpperCase();
  const isHighRarity = hero.rarity === "Lendário" || hero.rarity === "Mítico" || hero.rarity === "Divino";
  const isEpicPlus = hero.rarity === "Épico" || isHighRarity;
  const frameColor = s.color;
  const [tapParticle, setTapParticle] = useState(false);
  const particleType = hero.rarity === "Mítico" ? "fire" as const : hero.rarity === "Divino" ? "star" as const : hero.rarity === "Lendário" ? "star" as const : "magic" as const;

  return (
    <motion.button
      onClick={() => {
        onClick();
        if (isEpicPlus) { setTapParticle(true); setTimeout(() => setTapParticle(false), 700); }
      }}
      whileTap={{ scale: 0.94, transition: { type: "spring", stiffness: 500, damping: 25 } }}
      className="relative w-full overflow-hidden"
      style={{
        aspectRatio: "2/3",
        background: "rgb(6,7,15)",
        border: `1px solid ${frameColor}40`,
        borderRadius: "0.875rem",
        boxShadow: `0 6px 28px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(0,0,0,0.5), 0 0 22px ${frameColor}05`,
      }}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: index * 0.04 }}
    >
      {/* Portrait area */}
      <IdleBreathing
        active={isEpicPlus}
        intensity={0.018}
        period={3.2}
        className="absolute inset-0"
        style={{
          bottom: "36%",
          background: `
            radial-gradient(ellipse at 50% 55%, ${identity.accentColor}22 0%, ${identity.accentColor}08 55%, transparent 100%),
            linear-gradient(${identity.patternAngle}deg, ${identity.bgTone} 0%, rgba(6,7,15,0.97) 100%)
          `,
        }}
      >
        {/* Subtle line texture — unique pattern direction per hero */}
        <div
          className="absolute inset-0"
          style={{
            background: `repeating-linear-gradient(${identity.patternAngle + 90}deg, ${identity.accentColor}06 0px, transparent 1px, transparent 14px)`,
          }}
        />
        {/* Class icon — fallback when no portrait image */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: "18%" }}>
          <i
            className={`ra ${classIcon}`}
            style={{
              fontSize: "3.8rem",
              color: identity.accentColor,
              filter: `drop-shadow(0 0 18px ${identity.accentColor}70) drop-shadow(0 2px 8px rgba(0,0,0,0.8))`,
            }}
          />
        </div>
        {/* Portrait image — covers icon when loaded */}
        <HeroImg heroId={hero.heroId} />
        {/* Fade to bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-12"
          style={{ background: "linear-gradient(to bottom, transparent, rgb(6,7,15))" }}
        />
      </IdleBreathing>

      {/* Art Deco frame corners */}
      <div className="absolute left-2 top-2 h-5 w-5" style={{ borderTop: `1.5px solid ${frameColor}60`, borderLeft: `1.5px solid ${frameColor}60` }} />
      <div className="absolute right-2 top-2 h-5 w-5" style={{ borderTop: `1.5px solid ${frameColor}60`, borderRight: `1.5px solid ${frameColor}60` }} />
      <div className="absolute bottom-2 left-2 h-5 w-5" style={{ borderBottom: `1.5px solid ${frameColor}60`, borderLeft: `1.5px solid ${frameColor}60` }} />
      <div className="absolute bottom-2 right-2 h-5 w-5" style={{ borderBottom: `1.5px solid ${frameColor}60`, borderRight: `1.5px solid ${frameColor}60` }} />

      {/* Top diamond ornament */}
      <div className="absolute left-1/2 top-1.5 z-10 -translate-x-1/2">
        <div
          className="h-3 w-3 rotate-45"
          style={{ background: frameColor, boxShadow: `0 0 6px ${frameColor}cc`, opacity: 0.9 }}
        />
      </div>

      {/* Separator line at portrait/info boundary */}
      <div
        className="absolute left-4 right-4"
        style={{
          bottom: "36%",
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${frameColor}50, ${frameColor}50, transparent)`,
        }}
      />

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center px-2 pb-3 pt-2">
        {/* Stars */}
        <div className="mb-1 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-[10px] leading-none" style={{ color: i < stars ? "rgb(250,190,50)" : "rgba(122,111,160,0.18)" }}>★</span>
          ))}
        </div>
        {/* Name with art deco chevrons */}
        <div className="flex w-full items-center justify-center gap-1">
          <span className="flex-shrink-0 text-[10px]" style={{ color: `${frameColor}70` }}>«</span>
          <span
            className="truncate text-[10px] font-black tracking-[0.07em] text-cream/88"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            {shortName}
          </span>
          <span className="flex-shrink-0 text-[10px]" style={{ color: `${frameColor}70` }}>»</span>
        </div>
        {/* Class + element */}
        <div className="mt-0.5 flex items-center gap-1">
          <i className={`ra ${elementIcon}`} style={{ fontSize: "7px", color: `${frameColor}80` }} />
          <span className="text-[6px] font-bold tracking-[0.15em]" style={{ color: `${frameColor}65` }}>
            {hero.heroClass.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Copies badge */}
      {copies > 1 && (
        <div
          className="absolute right-3 top-4 z-20 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[7px] font-black"
          style={{ background: `${frameColor}25`, color: frameColor, border: `1px solid ${frameColor}35` }}
        >
          ×{copies}
        </div>
      )}

      {/* Awaken badge */}
      {progression.awakenLevel > 0 && (
        <div
          className="absolute left-3 top-4 z-20 flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-black"
          style={{ background: "rgb(200,155,60)", color: "rgb(6,7,15)", boxShadow: "0 0 6px rgba(200,155,60,0.6)" }}
        >
          {progression.awakenLevel}
        </div>
      )}

      {/* Legendary radial glow */}
      {isHighRarity && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 25%, ${frameColor}10 0%, transparent 65%)` }}
        />
      )}

      {/* Shimmer sweep for high-rarity cards */}
      {isHighRarity && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(105deg, transparent 30%, ${s.color}30 48%, ${s.color}55 50%, ${s.color}30 52%, transparent 70%)`,
            borderRadius: "0.875rem",
          }}
          animate={{ x: ["-130%", "230%"] }}
          transition={{ duration: 2.2, ease: "linear", repeat: Infinity, repeatDelay: 3 + index * 0.25 }}
        />
      )}

      {/* Particle burst on tap */}
      {tapParticle && (
        <ParticleEffect
          type={particleType}
          style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%,-50%)" }}
          onDone={() => setTapParticle(false)}
        />
      )}
    </motion.button>
  );
}

// ── Hero Detail Sheet ──────────────────────────────────────────────────────────

type DetailTab = "stats" | "skills" | "prog" | "equip";

type DetailProps = {
  hero: HeroDef;
  copies: number;
  progression: SaveData["heroProgression"][0];
  levelData: SaveData["heroLevels"][0];
  skillData: SaveData["heroSkills"][0];
  equipData: SaveData["heroEquipment"][0];
  runeData: SaveData["heroRunes"][0];
  equipInventory: string[];
  runeInventory: string[];
  detailTab: DetailTab;
  onTabChange: (t: DetailTab) => void;
  onClose: () => void;
};

function HeroDetail({ hero, copies, progression, levelData, skillData, equipData, runeData, equipInventory, runeInventory, detailTab, onTabChange, onClose }: DetailProps) {
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
        className="absolute inset-0 z-50 bg-void/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-50 flex max-h-[85%] flex-col rounded-t-2xl border-t px-5 pb-6 pt-5"
        style={{ borderColor: s.border, backgroundColor: "rgba(10,10,22,0.98)" }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          {/* Art deco portrait thumbnail */}
          <div
            className="relative flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${HERO_IDENTITY[hero.heroId]?.bgTone ?? s.glow} 0%, rgba(6,7,15,0.95) 100%)`,
              border: `1px solid ${s.border}`,
              boxShadow: `0 0 18px ${s.glow}`,
            }}
          >
            <i
              className={`ra ${CLASS_ICON[hero.heroClass] ?? "ra-skull"}`}
              style={{
                fontSize: "1.9rem",
                color: HERO_IDENTITY[hero.heroId]?.accentColor ?? s.color,
                filter: `drop-shadow(0 0 8px ${HERO_IDENTITY[hero.heroId]?.accentColor ?? s.color}80)`,
              }}
            />
            {/* corner brackets */}
            <div className="absolute left-1 top-1 h-2.5 w-2.5" style={{ borderTop: `1px solid ${s.color}70`, borderLeft: `1px solid ${s.color}70` }} />
            <div className="absolute right-1 top-1 h-2.5 w-2.5" style={{ borderTop: `1px solid ${s.color}70`, borderRight: `1px solid ${s.color}70` }} />
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
            <span className="text-[11px] text-amber-400">{"★".repeat(stars)}</span>
          </div>
        </div>

        {/* XP bar */}
        <div className="mb-4">
          <div className="mb-1 flex justify-between">
            <span className="text-[10px] text-violet/60">XP</span>
            <span className="text-[10px] text-violet/60">{levelData.xp} / {100 + level * 50}</span>
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
        <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-violet/5 p-1">
          {(["stats","skills","prog","equip"] as const).map((t) => (
            <motion.button
              key={t}
              onClick={() => onTabChange(t)}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-lg py-1.5 text-[11px] font-bold tracking-wider transition-colors duration-150"
              style={{
                background: detailTab === t ? s.glow : "transparent",
                color:      detailTab === t ? s.color : "rgba(122,111,160,0.5)",
                border:     detailTab === t ? `1px solid ${s.border}` : "1px solid transparent",
              }}
            >
              {t === "stats" ? "ATRIBUTOS" : t === "skills" ? "SKILLS" : t === "prog" ? "PROGRESSO" : "EQUIP."}
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
                      <span className="text-[10px] font-bold tracking-widest text-violet/60">{k}</span>
                    </div>
                  ))}
                </div>
                {copies > 1 && (
                  <p className="mt-3 text-center text-[11px] text-violet/60">
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
                          <span className="text-[10px] text-violet/60">{skill.type}</span>
                          <span className="rounded bg-violet/10 px-1 py-0.5 text-[7px] font-bold text-violet/60">
                            Nv.{userLevel}/5
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed text-violet/50">{skill.description}</p>
                      {skill.manaCost > 0 && (
                        <div className="mt-1 flex gap-3">
                          <span className="text-[10px] text-blue-400/60">Mana: {skill.manaCost}</span>
                          {skill.cooldown > 0 && <span className="text-[10px] text-violet/60">CD: {skill.cooldown}t</span>}
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
            ) : detailTab === "prog" ? (
              <ProgressionTab hero={hero} progression={progression} levelData={levelData} s={s} />
            ) : (
              <EquipTab hero={hero} equipData={equipData} runeData={runeData} equipInventory={equipInventory} runeInventory={runeInventory} s={s} />
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

function ProgressionTab({ hero, progression, levelData, s }: {
  hero: HeroDef;
  progression: SaveData["heroProgression"][0];
  levelData: SaveData["heroLevels"][0];
  s: { color: string; glow: string; border: string };
}) {
  const { rankUpHero, upgradeHeroStars, awakenHero, getFragmentos, ascendHero, getItemQty } = useGameStore();
  const frags = getFragmentos(hero.heroId);
  const xpItems = getItemQty("cristal_evolucao");
  const pedras = getItemQty("pedra_ascensao");
  const TIER_MAX_LEVEL = [20, 30, 40, 50, 60, 70];
  const canAscend = levelData.tier < 5 && levelData.level >= TIER_MAX_LEVEL[levelData.tier] && pedras >= 1;
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
      {/* Level & Ascension */}
      <ProgSection title="Nível" current={`Nv. ${levelData.level} (Tier ${levelData.tier})`} next={levelData.tier < 5 ? `Cap: ${TIER_MAX_LEVEL[levelData.tier]}` : "MAX"} s={s}>
        <div className="mb-2">
          <div className="mb-1 flex justify-between">
            <span className="text-[10px] text-violet/60">XP</span>
            <span className="text-[10px] text-violet/60">{levelData.xp} / {100 + levelData.level * 50}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/10">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (levelData.xp / (100 + levelData.level * 50)) * 100)}%`, background: s.color }} />
          </div>
        </div>
        <div className="flex gap-2">
          <UpgradeButton
            label={`Usar Cristal de Evolução (${xpItems})`}
            enabled={xpItems > 0}
            color={s.color} glow={s.glow} border={s.border}
            onPress={() => { useGameStore.getState().useXpItem(hero.heroId); }}
          />
          <UpgradeButton
            label={`Ascender (${pedras} pedra${pedras !== 1 ? "s" : ""})`}
            enabled={canAscend}
            color="rgb(255,200,50)" glow="rgba(255,200,50,0.1)" border="rgba(255,200,50,0.4)"
            onPress={() => { ascendHero(hero.heroId); }}
          />
        </div>
      </ProgSection>

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
              className="flex-1 rounded py-1.5 text-center text-[10px] font-bold"
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
        {awaken < 5 && <p className="mb-2 text-center text-[11px] text-violet/60">Próximo: {AWAKEN_BONUS[awaken + 1]}</p>}
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

// ── Equipment Tab ──────────────────────────────────────────────────────────────

const EQUIP_SLOT_LABEL: Record<string, string> = {
  weaponId: "Arma", armorId: "Armadura", accessoryId: "Acessório", reliquiaId: "Relíquia"
};
const EQUIP_SLOTS = ["weaponId","armorId","accessoryId","reliquiaId"] as const;
const RUNE_SLOTS = ["slot0","slot1"] as const;

function EquipTab({ hero, equipData, runeData, equipInventory, runeInventory, s }: {
  hero: HeroDef;
  equipData: SaveData["heroEquipment"][0];
  runeData: SaveData["heroRunes"][0];
  equipInventory: string[];
  runeInventory: string[];
  s: { color: string; glow: string; border: string };
}) {
  const { equipItem, equipRune } = useGameStore();
  const [pickingSlot, setPickingSlot] = useState<string | null>(null);

  const availableEquip = (slot: typeof EQUIP_SLOTS[number]) => {
    const slotType = slot.replace("Id","") as "weapon"|"armor"|"accessory"|"reliquia";
    return equipInventory.map((id) => EQUIP_MAP[id]).filter((e) => e && e.slot === slotType);
  };
  const availableRunes = () => runeInventory.map((id) => RUNE_MAP[id]).filter(Boolean);

  const isRuneSlot = (s: string) => s === "slot0" || s === "slot1";

  const handleEquip = (slot: string, id: string) => {
    if (isRuneSlot(slot)) {
      equipRune(hero.heroId, slot as "slot0"|"slot1", id);
    } else {
      equipItem(hero.heroId, slot as typeof EQUIP_SLOTS[number], id);
    }
    setPickingSlot(null);
    scheduleSave();
  };

  return (
    <motion.div
      key="equip"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15, ease }}
      className="flex flex-col gap-2"
    >
      <p className="mb-1 text-[11px] font-bold tracking-widest text-violet/60">EQUIPAMENTOS</p>
      {EQUIP_SLOTS.map((slot) => {
        const currentId = (equipData as Record<string, string | undefined>)[slot];
        const current = currentId ? EQUIP_MAP[currentId] : null;
        const available = availableEquip(slot);
        const isPicking = pickingSlot === slot;
        return (
          <div key={slot}>
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors"
              style={{
                borderColor: current ? s.border : "rgba(122,111,160,0.1)",
                background: current ? s.glow : "rgba(122,111,160,0.04)",
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-violet/60">{EQUIP_SLOT_LABEL[slot]}</p>
                {current ? (
                  <p className="text-[10px] font-bold text-cream/80">{current.name}</p>
                ) : (
                  <p className="text-[10px] text-violet/30">— Vazio —</p>
                )}
                {current && (
                  <p className="text-[10px] text-violet/50">
                    {Object.entries(current.statBonus).map(([k,v]) => `+${v} ${k}`).join(" · ")}
                  </p>
                )}
              </div>
              {available.length > 0 && (
                <motion.button
                  onClick={() => setPickingSlot(isPicking ? null : slot)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-lg px-2 py-1.5 text-[10px] font-bold"
                  style={{ color: s.color, border: `1px solid ${s.border}`, background: s.glow }}
                >
                  {isPicking ? "✕" : "Equipar"}
                </motion.button>
              )}
            </div>
            <AnimatePresence>
              {isPicking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 flex flex-col gap-1 pl-2">
                    {available.map((eq) => eq && (
                      <motion.button
                        key={eq.equipId}
                        onClick={() => handleEquip(slot, eq.equipId)}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="flex items-center justify-between rounded-lg border border-violet/10 px-3 py-2 text-left"
                        style={{ background: "rgba(122,111,160,0.06)" }}
                      >
                        <div>
                          <p className="text-[11px] font-bold text-cream/80">{eq.name}</p>
                          <p className="text-[10px] text-violet/60">
                            {Object.entries(eq.statBonus).map(([k,v]) => `+${v} ${k}`).join(" · ")}
                          </p>
                        </div>
                        <span className="text-[10px]" style={{ color: s.color }}>+</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <p className="mt-2 text-[11px] font-bold tracking-widest text-violet/60">RUNAS</p>
      {RUNE_SLOTS.map((slot, i) => {
        const currentId = (runeData as Record<string, string | undefined>)[slot];
        const current = currentId ? RUNE_MAP[currentId] : null;
        const available = availableRunes();
        const isPicking = pickingSlot === slot;
        return (
          <div key={slot}>
            <div
              className="flex items-center gap-2 rounded-xl border px-3 py-2.5"
              style={{
                borderColor: current ? s.border : "rgba(122,111,160,0.1)",
                background: current ? s.glow : "rgba(122,111,160,0.04)",
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-violet/60">Runa {i + 1}</p>
                {current ? (
                  <p className="text-[10px] font-bold text-cream/80">{current.name}</p>
                ) : (
                  <p className="text-[10px] text-violet/30">— Vazio —</p>
                )}
                {current && <p className="text-[10px] text-violet/50">{current.description}</p>}
              </div>
              {available.length > 0 && (
                <motion.button
                  onClick={() => setPickingSlot(isPicking ? null : slot)}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="rounded-lg px-2 py-1.5 text-[10px] font-bold"
                  style={{ color: s.color, border: `1px solid ${s.border}`, background: s.glow }}
                >
                  {isPicking ? "✕" : "Equipar"}
                </motion.button>
              )}
            </div>
            <AnimatePresence>
              {isPicking && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-1 flex flex-col gap-1 pl-2">
                    {available.map((rune) => rune && (
                      <motion.button
                        key={rune.runeId}
                        onClick={() => handleEquip(slot, rune.runeId)}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="flex items-center justify-between rounded-lg border border-violet/10 px-3 py-2 text-left"
                        style={{ background: "rgba(122,111,160,0.06)" }}
                      >
                        <div>
                          <p className="text-[11px] font-bold text-cream/80">{rune.name}</p>
                          <p className="text-[10px] text-violet/60">{rune.description}</p>
                        </div>
                        <span className="text-[10px]" style={{ color: s.color }}>+</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
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
        <span className="text-[11px] font-bold tracking-widest text-violet/50">{title.toUpperCase()}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold" style={{ color: s.color }}>{current}</span>
          <span className="text-[10px] text-violet/30">{next}</span>
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
      className="mt-1 w-full rounded-lg py-2 text-[11px] font-bold tracking-wider transition-all duration-150"
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
      <span className="text-[11px] text-violet/50">{label}</span>
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
