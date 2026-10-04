"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { DamageNumber } from "../effects/DamageNumber";

type Variant = "dungeon" | "tower" | "boss";

interface Props {
  variant?: Variant;
  heroCount?: number;
  enemyName?: string;
  progressPct?: number;
  timeLabel?: string;
  diffColor?: string;
}

type DmgEntry = { id: number; value: number; side: "hero" | "enemy"; type: "physical" | "critical" | "magic" | "fire" };

// ── Sprite image component ────────────────────────────────────────────────────

function Sprite({
  src, size = 96, flip = false, style = {},
}: { src: string; size?: number; flip?: boolean; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : undefined,
        objectFit: "contain",
        display: "block",
        ...style,
      }}
      alt=""
      draggable={false}
    />
  );
}

// ── Hero (toon adventurer) ────────────────────────────────────────────────────

const HERO_ATTACK_FRAMES = [
  "/assets/game/characters/toon/male-adventurer/attack0.png",
  "/assets/game/characters/toon/male-adventurer/attack1.png",
  "/assets/game/characters/toon/male-adventurer/attack2.png",
];
const HERO_IDLE   = "/assets/game/characters/toon/male-adventurer/idle.png";
const HERO_HURT   = "/assets/game/characters/toon/male-adventurer/hurt.png";
const HERO_WALK   = [
  "/assets/game/characters/toon/male-adventurer/walk0.png",
  "/assets/game/characters/toon/male-adventurer/walk1.png",
];

function HeroSprite({ attacking, hit, index = 0 }: { attacking: boolean; hit: boolean; index?: number }) {
  const [frame, setFrame] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);

  // Walk idle animation
  useEffect(() => {
    if (attacking || hit) return;
    const t = setInterval(() => setWalkFrame(f => (f + 1) % 2), 500 + index * 80);
    return () => clearInterval(t);
  }, [attacking, hit, index]);

  // Attack animation — cycle through 3 frames
  useEffect(() => {
    if (!attacking) { setFrame(0); return; }
    setFrame(0);
    const t1 = setTimeout(() => setFrame(1), 110);
    const t2 = setTimeout(() => setFrame(2), 220);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [attacking]);

  const src = hit ? HERO_HURT : attacking ? HERO_ATTACK_FRAMES[frame] : HERO_WALK[walkFrame];

  return (
    <motion.div
      animate={
        attacking ? { x: [0, 42, 0], transition: { duration: 0.32, times: [0, 0.4, 1] } }
        : hit     ? { x: [0, -16, 0], filter: ["brightness(1)", "brightness(3) saturate(0)", "brightness(1)"], transition: { duration: 0.28 } }
        : { x: 0 }
      }
      style={{ position: "relative" }}
    >
      <Sprite src={src} size={88} />
      {/* glow under feet */}
      <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: 50, height: 8, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(90,150,255,0.35), transparent 70%)", filter: "blur(3px)" }} />
    </motion.div>
  );
}

// ── Enemy ─────────────────────────────────────────────────────────────────────

const ENEMY_SETS: Record<Variant, { attack: string[]; idle: string; hurt: string }> = {
  dungeon: {
    attack: [
      "/assets/game/characters/toon/zombie/attack0.png",
      "/assets/game/characters/toon/zombie/attack1.png",
      "/assets/game/characters/toon/zombie/attack2.png",
    ],
    idle:  "/assets/game/characters/toon/zombie/idle.png",
    hurt:  "/assets/game/characters/toon/zombie/hurt.png",
  },
  tower: {
    attack: [
      "/assets/game/characters/toon/zombie/attack0.png",
      "/assets/game/characters/toon/zombie/attack1.png",
      "/assets/game/characters/toon/zombie/attack2.png",
    ],
    idle:  "/assets/game/characters/toon/zombie/idle.png",
    hurt:  "/assets/game/characters/toon/zombie/hurt.png",
  },
  boss: {
    attack: [
      "/assets/game/characters/toon/robot/attack0.png",
      "/assets/game/characters/toon/robot/attack1.png",
      "/assets/game/characters/toon/robot/attack2.png",
    ],
    idle:  "/assets/game/characters/toon/robot/idle.png",
    hurt:  "/assets/game/characters/toon/robot/hurt.png",
  },
};

function EnemySprite({ variant, attacking, hit }: { variant: Variant; attacking: boolean; hit: boolean }) {
  const [frame, setFrame] = useState(0);
  const set = ENEMY_SETS[variant];
  const isBoss = variant === "boss";
  const glowColor = isBoss ? "rgba(255,60,60,0.4)" : "rgba(160,80,200,0.35)";

  useEffect(() => {
    if (!attacking) { setFrame(0); return; }
    setFrame(0);
    const t1 = setTimeout(() => setFrame(1), 120);
    const t2 = setTimeout(() => setFrame(2), 240);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [attacking]);

  const src = hit ? set.hurt : attacking ? set.attack[frame] : set.idle;
  const size = isBoss ? 120 : 96;

  return (
    <motion.div
      animate={
        attacking ? { x: [0, -44, 0], transition: { duration: 0.36, times: [0, 0.4, 1] } }
        : hit     ? { x: [0, 20, 0], filter: ["brightness(1)", "brightness(3) saturate(0)", "brightness(1)"], transition: { duration: 0.28 } }
        : {}
      }
      style={{ position: "relative" }}
    >
      {isBoss && (
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", inset: -12, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,60,60,0.2) 0%, transparent 70%)", pointerEvents: "none" }}
        />
      )}
      <Sprite src={src} size={size} flip />
      <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", width: isBoss ? 70 : 50, height: 8, borderRadius: "50%", background: `radial-gradient(ellipse, ${glowColor}, transparent 70%)`, filter: "blur(3px)" }} />
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function BattleScene({
  variant = "dungeon", heroCount = 1,
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
      setTimeout(() => { setHeroAtk(false); setEnemyHit(true); spawnDmg("enemy"); setTimeout(() => setEnemyHit(false), 300); }, 320);
    }, 2400);
    const enemyTimer = setTimeout(() => {
      const enemyInterval = setInterval(() => {
        setEnemyAtk(true);
        setTimeout(() => { setEnemyAtk(false); setHeroHit(true); spawnDmg("hero"); setTimeout(() => setHeroHit(false), 300); }, 360);
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
      border: `1px solid ${diffColor}28`,
      padding: "12px 16px 10px",
      boxShadow: `0 4px 32px rgba(0,0,0,0.7)`,
    }}>
      {/* bg glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: "8%", top: "15%", width: 90, height: 90, borderRadius: "50%", background: "radial-gradient(circle, rgba(90,150,255,0.12), transparent 70%)" }} />
        <div style={{ position: "absolute", right: "8%", top: "15%", width: 90, height: 90, borderRadius: "50%", background: `radial-gradient(circle, ${variant === "boss" ? "rgba(255,60,60,0.15)" : "rgba(160,80,200,0.12)"}, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: 52, left: "4%", right: "4%", height: 1, background: `linear-gradient(90deg, transparent, ${diffColor}20, transparent)` }} />
      </div>

      {/* Arena */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 8, minHeight: 120, position: "relative" }}>

        {/* Heroes */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, position: "relative" }}>
          {Array.from({ length: Math.min(heroCount, 3) }).map((_, i) => (
            <HeroSprite key={i} index={i} attacking={heroAtk} hit={heroHit} />
          ))}
          {dmgNums.filter(d => d.side === "hero").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={10} y={-20} onDone={() => {}} />
          ))}
        </div>

        {/* VS */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.92, 1.08, 0.92] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.2em", color: `${diffColor}80`, fontFamily: "var(--font-cinzel, serif)", paddingBottom: 12, flexShrink: 0 }}
        >
          VS
        </motion.div>

        {/* Enemy */}
        <div style={{ position: "relative" }}>
          <EnemySprite variant={variant} attacking={enemyAtk} hit={enemyHit} />
          {dmgNums.filter(d => d.side === "enemy").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={0} y={-30} onDone={() => {}} />
          ))}
          <p style={{ position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: "rgba(255,100,100,0.65)", whiteSpace: "nowrap", letterSpacing: "0.08em" }}>
            {enemyName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(180,160,220,0.45)" }}>BATALHA EM CURSO</span>
          {timeLabel && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
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
