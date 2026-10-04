"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { DamageNumber } from "../effects/DamageNumber";
import { ParticleEffect } from "../effects/ParticleEffect";

type Variant = "dungeon" | "tower" | "boss";

interface Props {
  variant?: Variant;
  heroCount?: number;
  heroColor?: string;
  enemyName?: string;
  progressPct?: number;   // 0–1, how far through the fight
  timeLabel?: string;
  diffColor?: string;
}

type DmgEntry = { id: number; value: number; side: "hero" | "enemy"; type: "physical" | "critical" | "magic" | "fire" };
type HitEntry  = { id: number; side: "hero" | "enemy" };
type PfxEntry  = { id: number; side: "hero" | "enemy" };

// ── Silhouette shapes ──────────────────────────────────────────────────────────

function HeroFigure({ color, index = 0, attacking, hit }: { color: string; index?: number; attacking: boolean; hit: boolean }) {
  return (
    <motion.div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, position: "relative" }}
      animate={attacking ? { x: [0, 22, 0], transition: { duration: 0.35, times: [0, 0.4, 1], ease: "easeOut" } }
        : hit ? { x: [0, -12, 0], filter: ["brightness(1)", "brightness(3) saturate(0)", "brightness(1)"], transition: { duration: 0.3 } }
        : { x: 0 }}
    >
      {/* head */}
      <motion.div
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 2.2 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 14, height: 14, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, ${color}, ${color}88)`,
          boxShadow: `0 0 8px ${color}90`,
        }}
      />
      {/* body */}
      <div style={{
        width: 10, height: 18,
        background: `linear-gradient(180deg, ${color}cc, ${color}66)`,
        borderRadius: "3px 3px 1px 1px",
        boxShadow: `0 0 6px ${color}60`,
      }} />
      {/* legs */}
      <div style={{ display: "flex", gap: 3 }}>
        {[0, 1].map(i => (
          <motion.div key={i}
            animate={{ rotate: attacking ? [0, i === 0 ? -18 : 18, 0] : [i === 0 ? -6 : 6, i === 0 ? 6 : -6, i === 0 ? -6 : 6] }}
            transition={{ duration: attacking ? 0.35 : 0.6 + index * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
            style={{ width: 5, height: 12, background: `${color}88`, borderRadius: 2, transformOrigin: "top center" }}
          />
        ))}
      </div>
      {/* sword */}
      <motion.div
        animate={attacking
          ? { rotate: [30, -60, 30], x: [0, 8, 0], transition: { duration: 0.35, ease: "easeOut" } }
          : { rotate: [30, 40, 30], transition: { duration: 1.8 + index * 0.2, repeat: Infinity, ease: "easeInOut" } }
        }
        style={{
          position: "absolute", right: -8, top: 12,
          width: 3, height: 20,
          background: `linear-gradient(180deg, #e8d9a0, ${color}cc)`,
          borderRadius: 2,
          boxShadow: `0 0 6px ${color}80`,
          transformOrigin: "top center",
        }}
      />
    </motion.div>
  );
}

function EnemyFigure({ variant, attacking, hit }: { variant: Variant; attacking: boolean; hit: boolean }) {
  const isBoss = variant === "boss";
  const color = isBoss ? "rgb(255,60,60)" : variant === "tower" ? "rgb(170,100,255)" : "rgb(150,80,200)";
  const sz = isBoss ? 1.5 : 1;

  return (
    <motion.div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative", transform: `scale(${sz})`, transformOrigin: "bottom center" }}
      animate={attacking ? { x: [0, -24, 0], transition: { duration: 0.4, times: [0, 0.4, 1], ease: "easeOut" } }
        : hit ? { x: [0, 18, 0], filter: ["brightness(1)", "brightness(3) saturate(0)", "brightness(1)"], transition: { duration: 0.3 } }
        : { x: 0 }}
    >
      {/* horns */}
      {isBoss && (
        <div style={{ display: "flex", gap: 8, marginBottom: -2 }}>
          {[-1, 1].map(d => (
            <div key={d} style={{
              width: 0, height: 0,
              borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
              borderBottom: `12px solid ${color}cc`,
              transform: `rotate(${d * 15}deg)`,
            }} />
          ))}
        </div>
      )}
      {/* head */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: isBoss ? 20 : 14, height: isBoss ? 20 : 14,
          borderRadius: isBoss ? "30%" : "50%",
          background: `radial-gradient(circle at 60% 35%, ${color}, rgb(40,10,10))`,
          boxShadow: `0 0 12px ${color}80`,
        }}
      />
      {/* body */}
      <div style={{
        width: isBoss ? 22 : 12, height: isBoss ? 26 : 18,
        background: `linear-gradient(180deg, ${color}bb, ${color}44)`,
        borderRadius: isBoss ? "4px 4px 2px 2px" : "3px 3px 1px 1px",
        boxShadow: `0 0 10px ${color}50`,
        position: "relative",
      }}>
        {/* claws */}
        {isBoss && (
          <motion.div
            animate={attacking ? { x: [-30, 0, -30], rotate: [0, -40, 0] } : { x: [-30, -28, -30] }}
            transition={{ duration: attacking ? 0.4 : 1.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", left: -18, top: 8, width: 16, height: 3, background: `${color}cc`, borderRadius: 2, transformOrigin: "right center" }}
          />
        )}
      </div>
      {/* legs */}
      <div style={{ display: "flex", gap: isBoss ? 5 : 3 }}>
        {[0, 1].map(i => (
          <motion.div key={i}
            animate={{ rotate: [i === 0 ? -8 : 8, i === 0 ? 8 : -8, i === 0 ? -8 : 8] }}
            transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
            style={{ width: isBoss ? 7 : 5, height: isBoss ? 16 : 12, background: `${color}88`, borderRadius: 2, transformOrigin: "top center" }}
          />
        ))}
      </div>
      {/* glow aura for boss */}
      {isBoss && (
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: -8,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BattleScene({ variant = "dungeon", heroCount = 1, heroColor = "rgb(90,150,255)", enemyName = "Inimigo", progressPct = 0.4, timeLabel, diffColor = "rgb(200,155,60)" }: Props) {
  const [dmgNums, setDmgNums] = useState<DmgEntry[]>([]);
  const [hits, setHits] = useState<HitEntry[]>([]);
  const [pfx, setPfx] = useState<PfxEntry[]>([]);
  const [heroAtk, setHeroAtk] = useState(false);
  const [enemyAtk, setEnemyAtk] = useState(false);
  const [heroHit, setHeroHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);
  const [tick, setTick] = useState(0);

  const spawnHit = useCallback((side: "hero" | "enemy") => {
    const id = Date.now() + Math.random();
    const isEnemy = side === "enemy";
    const dmgType = variant === "boss" && isEnemy ? "magic" : Math.random() < 0.15 ? "critical" : "physical";
    const value = Math.round(Math.random() * (variant === "boss" ? 800 : 300) + 50);
    setDmgNums(p => [...p, { id, value, side, type: dmgType }]);
    setPfx(p => [...p, { id, side }]);
    setTimeout(() => {
      setDmgNums(p => p.filter(d => d.id !== id));
      setPfx(p => p.filter(d => d.id !== id));
    }, 900);
  }, [variant]);

  useEffect(() => {
    // Hero attacks every ~2.4s, enemy attacks ~1.8s after hero
    const heroInterval = setInterval(() => {
      setHeroAtk(true);
      setTimeout(() => { setHeroAtk(false); setEnemyHit(true); spawnHit("enemy"); setTimeout(() => setEnemyHit(false), 300); }, 280);
    }, 2400);

    const enemyInterval = setInterval(() => {
      setEnemyAtk(true);
      setTimeout(() => { setEnemyAtk(false); setHeroHit(true); spawnHit("hero"); setTimeout(() => setHeroHit(false), 300); }, 340);
    }, 2400);

    const enemyOffset = setTimeout(() => {
      enemyInterval;
    }, 1200);

    setTick(t => t + 1);

    return () => {
      clearInterval(heroInterval);
      clearInterval(enemyInterval);
      clearTimeout(enemyOffset);
    };
  }, [spawnHit]);

  const clampedPct = Math.min(1, Math.max(0, progressPct));

  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
      background: "linear-gradient(160deg, rgba(6,7,15,0.98) 0%, rgba(15,8,28,0.97) 100%)",
      border: `1px solid ${diffColor}28`,
      padding: "16px 12px 14px",
      boxShadow: `0 4px 32px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.03)`,
    }}>
      {/* background glow blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "15%", top: "10%", width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${heroColor}18, transparent 70%)` }} />
        <div style={{ position: "absolute", right: "15%", top: "10%", width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,60,0.12), transparent 70%)" }} />
        {/* ground line */}
        <div style={{ position: "absolute", bottom: 56, left: "5%", right: "5%", height: 1, background: `linear-gradient(90deg, transparent, ${diffColor}30, transparent)` }} />
      </div>

      {/* Battle arena */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 12, minHeight: 100, position: "relative" }}>

        {/* Heroes side */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, position: "relative" }}>
          {Array.from({ length: Math.min(heroCount, 3) }).map((_, i) => (
            <div key={i} style={{ position: "relative" }}>
              <HeroFigure color={heroColor} index={i} attacking={heroAtk} hit={heroHit} />
              {/* hero pfx */}
              {pfx.filter(p => p.side === "hero").map(p => (
                <ParticleEffect key={p.id} type="slash" style={{ position: "absolute", left: "50%", top: "30%", transform: "translate(-50%,-50%)" }} />
              ))}
            </div>
          ))}
          {/* hero damage numbers */}
          {dmgNums.filter(d => d.side === "hero").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={10} y={-20} onDone={() => {}} />
          ))}
        </div>

        {/* VS */}
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.2em", color: `${diffColor}80`, fontFamily: "var(--font-cinzel, serif)" }}
        >
          VS
        </motion.div>

        {/* Enemy side */}
        <div style={{ position: "relative" }}>
          <EnemyFigure variant={variant} attacking={enemyAtk} hit={enemyHit} />
          {/* enemy pfx */}
          {pfx.filter(p => p.side === "enemy").map(p => (
            <ParticleEffect key={p.id} type={variant === "boss" ? "fire" : "magic"} style={{ position: "absolute", left: "50%", top: "20%", transform: "translate(-50%,-50%)" }} />
          ))}
          {/* enemy damage numbers */}
          {dmgNums.filter(d => d.side === "enemy").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={0} y={-30} onDone={() => {}} />
          ))}
          {/* enemy name */}
          <p style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: "rgba(255,100,100,0.7)", whiteSpace: "nowrap", letterSpacing: "0.1em" }}>
            {enemyName}
          </p>
        </div>
      </div>

      {/* Time + progress */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(180,160,220,0.5)" }}>BATALHA EM CURSO</span>
          {timeLabel && (
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{ fontSize: 12, fontWeight: 900, color: diffColor, fontFamily: "var(--font-cinzel, serif)" }}
            >
              {timeLabel}
            </motion.span>
          )}
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(122,111,160,0.12)", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${clampedPct * 100}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${diffColor}88, ${diffColor})`, boxShadow: `0 0 6px ${diffColor}80` }}
          />
        </div>
      </div>
    </div>
  );
}
