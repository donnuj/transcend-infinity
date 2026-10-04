"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { DamageNumber } from "../effects/DamageNumber";

type Variant = "dungeon" | "tower" | "boss";

interface Props {
  variant?: Variant;
  heroCount?: number;
  heroColor?: string;
  enemyName?: string;
  progressPct?: number;
  timeLabel?: string;
  diffColor?: string;
}

type DmgEntry = { id: number; value: number; side: "hero" | "enemy"; type: "physical" | "critical" | "magic" | "fire" };

// ── Slash VFX ─────────────────────────────────────────────────────────────────

function SlashVFX({ color, flipped = false }: { color: string; flipped?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, rotate: flipped ? 30 : -30 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.2, 1, 0.6], rotate: flipped ? [30, -20, -40] : [-30, 20, 40] }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{ position: "absolute", inset: -20, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute",
          width: 50 + i * 14,
          height: 3 - i * 0.5,
          borderRadius: 4,
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          transform: `rotate(${-30 + i * 30}deg)`,
          opacity: 1 - i * 0.25,
          boxShadow: `0 0 8px ${color}`,
        }} />
      ))}
    </motion.div>
  );
}

// ── Hero figure ────────────────────────────────────────────────────────────────

function Hero({ color, index = 0, attacking, hit }: { color: string; index?: number; attacking: boolean; hit: boolean }) {
  return (
    <motion.div
      style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
      animate={
        attacking ? { x: [0, 38, 0], transition: { duration: 0.32, times: [0, 0.4, 1], ease: "easeOut" } }
        : hit     ? { x: [0, -18, 0], filter: ["brightness(1)", "brightness(4) saturate(0)", "brightness(1)"], transition: { duration: 0.28 } }
        : {}
      }
    >
      {/* glow under feet */}
      <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 44, height: 8, borderRadius: "50%", background: `radial-gradient(ellipse, ${color}40, transparent 70%)`, filter: "blur(3px)" }} />

      {/* head */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 28, height: 28, borderRadius: "50%", zIndex: 1,
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), ${color})`,
          boxShadow: `0 0 18px ${color}, 0 0 6px rgba(255,255,255,0.5)`,
        }}
      />
      {/* neck */}
      <div style={{ width: 10, height: 6, background: `${color}dd`, marginTop: -2 }} />
      {/* torso */}
      <motion.div
        animate={{ scaleX: attacking ? [1, 1.15, 1] : 1 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        style={{
          width: 26, height: 32,
          background: `linear-gradient(160deg, rgba(255,255,255,0.15) 0%, ${color}ee 40%, ${color}99 100%)`,
          borderRadius: "5px 5px 3px 3px",
          boxShadow: `0 0 16px ${color}80, inset 0 1px 0 rgba(255,255,255,0.2)`,
          border: `1px solid ${color}`,
        }}
      />
      {/* legs */}
      <div style={{ display: "flex", gap: 5, marginTop: 2 }}>
        {[0, 1].map(i => (
          <motion.div key={i}
            animate={{ rotate: attacking ? [0, i === 0 ? -25 : 25, 0] : [i === 0 ? -10 : 10, i === 0 ? 10 : -10, i === 0 ? -10 : 10] }}
            transition={{ duration: attacking ? 0.32 : 0.55 + index * 0.08, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
            style={{ width: 9, height: 20, background: `linear-gradient(180deg, ${color}dd, ${color}88)`, borderRadius: 4, transformOrigin: "top center", boxShadow: `0 0 6px ${color}60` }}
          />
        ))}
      </div>
      {/* sword arm */}
      <motion.div
        animate={attacking
          ? { rotate: [40, -70, 40], x: [0, 14, 0], transition: { duration: 0.32, ease: "easeOut" } }
          : { rotate: [40, 52, 40], transition: { duration: 1.8 + index * 0.2, repeat: Infinity, ease: "easeInOut" } }
        }
        style={{ position: "absolute", right: -14, top: 30, transformOrigin: "top center" }}
      >
        {/* arm */}
        <div style={{ width: 8, height: 16, background: `${color}cc`, borderRadius: 3 }} />
        {/* sword blade */}
        <div style={{
          width: 5, height: 36, marginTop: -2, marginLeft: 1.5,
          background: `linear-gradient(180deg, rgba(255,255,255,0.95), ${color}cc)`,
          borderRadius: "2px 2px 0 0",
          boxShadow: `0 0 10px rgba(255,255,255,0.7), 0 0 20px ${color}`,
        }} />
      </motion.div>

      {/* attack slash */}
      {attacking && <SlashVFX color={color} />}
    </motion.div>
  );
}

// ── Enemy figure ───────────────────────────────────────────────────────────────

function Enemy({ variant, attacking, hit }: { variant: Variant; attacking: boolean; hit: boolean }) {
  const isBoss = variant === "boss";
  const color = isBoss ? "rgb(255,60,60)" : variant === "tower" ? "rgb(160,100,255)" : "rgb(180,80,220)";
  const scale = isBoss ? 1.55 : 1;

  return (
    <motion.div
      style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${scale})`, transformOrigin: "bottom center" }}
      animate={
        attacking ? { x: [0, -40, 0], transition: { duration: 0.36, times: [0, 0.4, 1], ease: "easeOut" } }
        : hit     ? { x: [0, 22, 0], filter: ["brightness(1)", "brightness(4) saturate(0)", "brightness(1)"], transition: { duration: 0.28 } }
        : {}
      }
    >
      {/* glow under feet */}
      <div style={{ position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)", width: 50, height: 8, borderRadius: "50%", background: `radial-gradient(ellipse, ${color}50, transparent 70%)`, filter: "blur(4px)" }} />

      {/* boss horns */}
      {isBoss && (
        <div style={{ display: "flex", gap: 14, marginBottom: -4, zIndex: 2 }}>
          {[-1, 1].map(d => (
            <div key={d} style={{
              width: 0, height: 0,
              borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
              borderBottom: `18px solid ${color}`,
              transform: `rotate(${d * 18}deg)`,
              filter: `drop-shadow(0 0 6px ${color})`,
            }} />
          ))}
        </div>
      )}

      {/* head */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: isBoss ? 36 : 26, height: isBoss ? 36 : 26,
          borderRadius: isBoss ? "28%" : "50%", zIndex: 1,
          background: `radial-gradient(circle at 60% 30%, rgba(255,150,150,0.7), ${color} 50%, rgb(20,5,5))`,
          boxShadow: `0 0 20px ${color}, 0 0 6px rgba(255,100,100,0.5)`,
        }}
      />
      {/* neck */}
      <div style={{ width: isBoss ? 14 : 10, height: 6, background: `${color}dd`, marginTop: -2 }} />
      {/* torso */}
      <div style={{
        width: isBoss ? 36 : 24, height: isBoss ? 42 : 30,
        background: `linear-gradient(160deg, rgba(255,100,100,0.15) 0%, ${color}cc 40%, rgb(30,5,5) 100%)`,
        borderRadius: "4px 4px 2px 2px",
        boxShadow: `0 0 20px ${color}70, inset 0 1px 0 rgba(255,100,100,0.2)`,
        border: `1px solid ${color}aa`,
        position: "relative",
      }}>
        {/* boss left claw */}
        {isBoss && (
          <motion.div
            animate={attacking ? { x: [-38, 0, -38], rotate: [0, -50, 0] } : { x: [-38, -34, -38], rotate: [0, 8, 0] }}
            transition={{ duration: attacking ? 0.36 : 1.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", left: -30, top: 10, display: "flex", alignItems: "center", transformOrigin: "right center" }}
          >
            <div style={{ width: 30, height: 5, background: `linear-gradient(90deg, transparent, ${color})`, borderRadius: 3 }} />
            {[0, 1, 2].map(i => (
              <div key={i} style={{ position: "absolute", right: -3 - i * 4, top: -4 + i * 2, width: 3, height: 8, background: color, borderRadius: "0 0 2px 2px", transform: `rotate(${-10 + i * 15}deg)` }} />
            ))}
          </motion.div>
        )}
      </div>
      {/* legs */}
      <div style={{ display: "flex", gap: isBoss ? 8 : 5, marginTop: 2 }}>
        {[0, 1].map(i => (
          <motion.div key={i}
            animate={{ rotate: [i === 0 ? -12 : 12, i === 0 ? 12 : -12, i === 0 ? -12 : 12] }}
            transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
            style={{ width: isBoss ? 13 : 9, height: isBoss ? 24 : 18, background: `linear-gradient(180deg, ${color}cc, ${color}66)`, borderRadius: 4, transformOrigin: "top center", boxShadow: `0 0 8px ${color}60` }}
          />
        ))}
      </div>

      {/* boss aura */}
      {isBoss && (
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", inset: -16, borderRadius: "50%", background: `radial-gradient(circle, ${color}28 0%, transparent 65%)`, pointerEvents: "none" }}
        />
      )}

      {/* attack slash (mirrored) */}
      {attacking && <SlashVFX color={color} flipped />}
    </motion.div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function BattleScene({
  variant = "dungeon", heroCount = 1, heroColor = "rgb(90,150,255)",
  enemyName = "Inimigo", progressPct = 0.4, timeLabel, diffColor = "rgb(200,155,60)",
}: Props) {
  const [dmgNums, setDmgNums] = useState<DmgEntry[]>([]);
  const [heroAtk, setHeroAtk] = useState(false);
  const [enemyAtk, setEnemyAtk] = useState(false);
  const [heroHit, setHeroHit] = useState(false);
  const [enemyHit, setEnemyHit] = useState(false);

  const spawnDmg = useCallback((side: "hero" | "enemy") => {
    const id = Date.now() + Math.random();
    const type = variant === "boss" && side === "hero" ? "fire" : Math.random() < 0.18 ? "critical" : "physical";
    const value = Math.round(Math.random() * (variant === "boss" ? 900 : 350) + 60);
    setDmgNums(p => [...p, { id, value, side, type }]);
    setTimeout(() => setDmgNums(p => p.filter(d => d.id !== id)), 900);
  }, [variant]);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setHeroAtk(true);
      setTimeout(() => { setHeroAtk(false); setEnemyHit(true); spawnDmg("enemy"); setTimeout(() => setEnemyHit(false), 300); }, 280);
    }, 2400);
    const enemyTimer = setTimeout(() => {
      const enemyInterval = setInterval(() => {
        setEnemyAtk(true);
        setTimeout(() => { setEnemyAtk(false); setHeroHit(true); spawnDmg("hero"); setTimeout(() => setHeroHit(false), 300); }, 340);
      }, 2400);
      return () => clearInterval(enemyInterval);
    }, 1200);
    return () => { clearInterval(heroInterval); clearTimeout(enemyTimer); };
  }, [spawnDmg]);

  const clampedPct = Math.min(1, Math.max(0, progressPct));

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(160deg, rgba(6,7,18,0.99) 0%, rgba(14,6,28,0.98) 100%)",
      border: `1px solid ${diffColor}30`,
      padding: "14px 16px 12px",
      boxShadow: `0 4px 32px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.03)`,
    }}>
      {/* bg glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "12%", top: "5%", width: 100, height: 100, borderRadius: "50%", background: `radial-gradient(circle, ${heroColor}20, transparent 70%)` }} />
        <div style={{ position: "absolute", right: "12%", top: "5%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,60,0.15), transparent 70%)" }} />
        {/* ground */}
        <div style={{ position: "absolute", bottom: 54, left: "4%", right: "4%", height: 1, background: `linear-gradient(90deg, transparent, ${diffColor}25, transparent)` }} />
      </div>

      {/* Arena */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 10, minHeight: 130, position: "relative" }}>

        {/* Heroes */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, position: "relative" }}>
          {Array.from({ length: Math.min(heroCount, 3) }).map((_, i) => (
            <Hero key={i} color={heroColor} index={i} attacking={heroAtk} hit={heroHit} />
          ))}
          {/* hero dmg numbers */}
          {dmgNums.filter(d => d.side === "hero").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={8} y={-20} onDone={() => {}} />
          ))}
        </div>

        {/* VS */}
        <motion.div
          animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.93, 1.07, 0.93] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.2em", color: `${diffColor}90`, fontFamily: "var(--font-cinzel, serif)", flexShrink: 0, paddingBottom: 8 }}
        >
          VS
        </motion.div>

        {/* Enemy */}
        <div style={{ position: "relative" }}>
          <Enemy variant={variant} attacking={enemyAtk} hit={enemyHit} />
          {/* enemy dmg numbers */}
          {dmgNums.filter(d => d.side === "enemy").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={0} y={-30} onDone={() => {}} />
          ))}
          {/* enemy name */}
          <p style={{ position: "absolute", bottom: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: "rgba(255,100,100,0.65)", whiteSpace: "nowrap", letterSpacing: "0.08em" }}>
            {enemyName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(180,160,220,0.45)" }}>BATALHA EM CURSO</span>
          {timeLabel && (
            <motion.span
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.1, repeat: Infinity }}
              style={{ fontSize: 13, fontWeight: 900, color: diffColor, fontFamily: "var(--font-cinzel, serif)" }}
            >
              {timeLabel}
            </motion.span>
          )}
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(122,111,160,0.1)", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${clampedPct * 100}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${diffColor}80, ${diffColor})`, boxShadow: `0 0 8px ${diffColor}80` }}
          />
        </div>
      </div>
    </div>
  );
}
