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

const HERO_FILL   = "rgba(140,200,255,0.95)";
const HERO_GLOW   = "rgba(90,160,255,0.7)";

const ENEMY_THEME: Record<Variant, { fill: string; glow: string }> = {
  dungeon: { fill: "rgba(200,90,255,0.95)",  glow: "rgba(160,60,220,0.7)"  },
  tower:   { fill: "rgba(255,170,60,0.95)",  glow: "rgba(220,130,30,0.7)"  },
  boss:    { fill: "rgba(255,70,70,0.95)",   glow: "rgba(220,30,30,0.75)"  },
};

// ── Glowing humanoid silhouette ──────────────────────────────────────────────

function Warrior({
  fill, glow, flip = false, boss = false,
  attacking, hit, floatDelay = 0,
}: {
  fill: string; glow: string; flip?: boolean; boss?: boolean;
  attacking: boolean; hit: boolean; floatDelay?: number;
}) {
  const w = boss ? 52 : 42;
  const h = boss ? 72 : 60;

  return (
    <motion.div
      animate={
        attacking ? { x: [0, flip ? 48 : -48, 0],  transition: { duration: 0.3, times: [0, 0.38, 1], ease: "easeInOut" } }
        : hit      ? { x: [0, flip ? -14 : 14, 0], filter: ["brightness(1)", "brightness(5) saturate(0)", "brightness(1)"], transition: { duration: 0.22 } }
        : { y: [0, boss ? -5 : -4, 0], transition: { duration: boss ? 2.0 : 1.7, repeat: Infinity, ease: "easeInOut", delay: floatDelay } }
      }
      style={{ position: "relative", display: "inline-block", transform: flip ? "scaleX(-1)" : undefined }}
    >
      {boss && (
        <motion.div
          animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", inset: -20, borderRadius: "50%", background: `radial-gradient(circle, ${glow}, transparent 68%)`, filter: "blur(8px)", pointerEvents: "none" }}
        />
      )}
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", filter: `drop-shadow(0 0 5px ${glow}) drop-shadow(0 0 14px ${glow})` }}>
        {/* Head */}
        <circle cx={w / 2} cy={boss ? 11 : 9} r={boss ? 9 : 7} fill={fill} opacity="0.97" />
        {/* Neck */}
        <rect x={w/2 - (boss ? 3 : 2.5)} y={boss ? 19 : 15} width={boss ? 6 : 5} height={boss ? 4 : 3} rx="1" fill={fill} opacity="0.88" />
        {/* Body */}
        <rect x={w/2 - (boss ? 9 : 7)} y={boss ? 22 : 17} width={boss ? 18 : 14} height={boss ? 22 : 18} rx="3" fill={fill} opacity="0.92" />
        {/* Cape / back detail */}
        <rect x={w/2 - (boss ? 10 : 8)} y={boss ? 22 : 17} width={boss ? 4 : 3} height={boss ? 28 : 22} rx="2" fill={fill} opacity="0.4" />
        {/* Left arm */}
        <rect x={w/2 - (boss ? 17 : 13)} y={boss ? 24 : 19} width={boss ? 9 : 7} height={boss ? 4 : 3} rx="2" fill={fill} opacity="0.85" />
        {/* Right arm (sword arm) */}
        <rect x={w/2 + (boss ? 9 : 7)} y={boss ? 20 : 17} width={boss ? 12 : 9} height={boss ? 4 : 3} rx="2" fill={fill} opacity="0.88" />
        {/* Sword hilt */}
        <rect x={w/2 + (boss ? 18 : 13)} y={boss ? 18 : 15} width={boss ? 5 : 4} height={boss ? 4 : 3} rx="1" fill={fill} opacity="0.95" />
        {/* Sword blade */}
        <rect x={w/2 + (boss ? 20 : 14)} y={boss ? 9 : 7} width={boss ? 3 : 2.5} height={boss ? 22 : 17} rx="1.5" fill={fill} opacity={attacking ? 1 : 0.8} />
        {/* Left leg */}
        <rect x={w/2 - (boss ? 9 : 7)} y={boss ? 43 : 34} width={boss ? 7 : 5.5} height={boss ? 20 : 16} rx="2" fill={fill} opacity="0.87" />
        {/* Right leg */}
        <rect x={w/2 + (boss ? 2 : 2)} y={boss ? 43 : 34} width={boss ? 7 : 5.5} height={boss ? 20 : 16} rx="2" fill={fill} opacity="0.87" />
        {/* Ground shadow */}
        <ellipse cx={w / 2} cy={h - 1} rx={boss ? 20 : 15} ry="2.5" fill={glow} opacity="0.3" />
      </svg>
    </motion.div>
  );
}

// ── Shockwave on impact ──────────────────────────────────────────────────────

function Shockwave({ color, trigger }: { color: string; trigger: boolean }) {
  return (
    <motion.div
      key={String(trigger)}
      initial={{ scale: 0.1, opacity: 0.9 }}
      animate={trigger ? { scale: 2.2, opacity: 0 } : {}}
      transition={{ duration: 0.38, ease: "easeOut" }}
      style={{ position: "absolute", inset: -12, borderRadius: "50%", border: `2px solid ${color}`, boxShadow: `0 0 10px ${color}`, pointerEvents: "none" }}
    />
  );
}

// ── Slash arc ────────────────────────────────────────────────────────────────

function SlashArc({ color, active, flip }: { color: string; active: boolean; flip: boolean }) {
  return (
    <motion.div
      animate={active ? { opacity: [0, 1, 0], rotate: flip ? [-30, 30] : [30, -30], scale: [0.6, 1.1] } : { opacity: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{ position: "absolute", top: "10%", left: flip ? "-40%" : "20%", width: 40, height: 40, pointerEvents: "none" }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
        <path d="M4,36 Q20,2 36,4" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
        <path d="M4,30 Q18,8 34,10" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      </svg>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export function BattleScene({
  variant = "dungeon", heroCount = 1,
  enemyName = "Inimigo", progressPct = 0.4, timeLabel, diffColor = "rgb(200,155,60)",
}: Props) {
  const [dmgNums, setDmgNums] = useState<DmgEntry[]>([]);
  const [heroAtk,   setHeroAtk]   = useState(false);
  const [enemyAtk,  setEnemyAtk]  = useState(false);
  const [heroHit,   setHeroHit]   = useState(false);
  const [enemyHit,  setEnemyHit]  = useState(false);
  const [heroWave,  setHeroWave]  = useState(false);
  const [enemyWave, setEnemyWave] = useState(false);

  const isBoss  = variant === "boss";
  const enemy   = ENEMY_THEME[variant];
  const clampedPct = Math.min(1, Math.max(0, progressPct));

  const spawnDmg = useCallback((side: "hero" | "enemy") => {
    const id    = Date.now() + Math.random();
    const type  = isBoss && side === "hero" ? "fire" : Math.random() < 0.18 ? "critical" : "physical";
    const value = Math.round(Math.random() * (isBoss ? 900 : 350) + 60);
    setDmgNums(p => [...p, { id, value, side, type }]);
    setTimeout(() => setDmgNums(p => p.filter(d => d.id !== id)), 900);
  }, [isBoss]);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setHeroAtk(true);
      setTimeout(() => {
        setHeroAtk(false);
        setEnemyHit(true); setEnemyWave(true); spawnDmg("enemy");
        setTimeout(() => { setEnemyHit(false); setEnemyWave(false); }, 320);
      }, 300);
    }, 2400);

    const enemyTimer = setTimeout(() => {
      const enemyInterval = setInterval(() => {
        setEnemyAtk(true);
        setTimeout(() => {
          setEnemyAtk(false);
          setHeroHit(true); setHeroWave(true); spawnDmg("hero");
          setTimeout(() => { setHeroHit(false); setHeroWave(false); }, 320);
        }, 300);
      }, 2400);
      return () => clearInterval(enemyInterval);
    }, 1200);

    return () => { clearInterval(heroInterval); clearTimeout(enemyTimer); };
  }, [spawnDmg]);

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: isBoss
        ? "linear-gradient(160deg, rgba(10,2,4,1) 0%, rgba(22,4,6,1) 100%)"
        : "linear-gradient(160deg, rgba(4,5,16,1) 0%, rgba(8,6,22,1) 100%)",
      border: `1px solid ${diffColor}28`,
      padding: "12px 16px 10px",
      boxShadow: `0 4px 32px rgba(0,0,0,0.85)`,
      minHeight: 145,
    }}>

      {/* Ambient glows */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <motion.div animate={{ opacity: [0.2, 0.45, 0.2] }} transition={{ duration: 2.2, repeat: Infinity }}
          style={{ position: "absolute", left: "6%", top: "8%", width: 90, height: 90, borderRadius: "50%", background: `radial-gradient(circle, ${HERO_GLOW}, transparent 70%)`, filter: "blur(14px)" }} />
        <motion.div animate={{ opacity: isBoss ? [0.3, 0.65, 0.3] : [0.2, 0.45, 0.2] }} transition={{ duration: isBoss ? 1.6 : 2.4, repeat: Infinity }}
          style={{ position: "absolute", right: "6%", top: "8%", width: isBoss ? 110 : 90, height: isBoss ? 110 : 90, borderRadius: "50%", background: `radial-gradient(circle, ${enemy.glow}, transparent 70%)`, filter: "blur(14px)" }} />
        {/* Ground line */}
        <div style={{ position: "absolute", bottom: 46, left: "4%", right: "4%", height: 1, background: `linear-gradient(90deg, transparent, ${diffColor}25, transparent)` }} />
        {/* Center rune */}
        <motion.div animate={{ opacity: [0.04, 0.14, 0.04], rotate: [0, 180] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", width: 50, height: 50, border: `1px solid ${diffColor}50`, borderRadius: "50%" }} />
      </div>

      {/* Arena */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 10, minHeight: 120, position: "relative" }}>

        {/* Heroes */}
        <div style={{ display: "flex", alignItems: "flex-end", position: "relative", gap: 0 }}>
          {Array.from({ length: Math.min(heroCount, 3) }).map((_, i) => (
            <div key={i} style={{ position: "relative", marginRight: i < Math.min(heroCount, 3) - 1 ? -14 : 0, opacity: 1 - i * 0.12 }}>
              <Warrior fill={HERO_FILL} glow={HERO_GLOW} attacking={heroAtk} hit={heroHit} floatDelay={i * 0.28} />
              {i === 0 && <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)" }}><Shockwave color={HERO_GLOW} trigger={heroWave} /></div>}
              <SlashArc color={HERO_FILL} active={heroAtk && i === 0} flip={false} />
            </div>
          ))}
          {dmgNums.filter(d => d.side === "hero").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={10} y={-20} onDone={() => {}} />
          ))}
        </div>

        {/* VS */}
        <motion.div
          animate={{ opacity: [0.2, 0.65, 0.2], scale: [0.9, 1.08, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.25em", color: `${diffColor}90`, fontFamily: "var(--font-cinzel, serif)", paddingBottom: 14, flexShrink: 0 }}
        >
          VS
        </motion.div>

        {/* Enemy */}
        <div style={{ position: "relative" }}>
          <Warrior fill={enemy.fill} glow={enemy.glow} flip boss={isBoss} attacking={enemyAtk} hit={enemyHit} />
          <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)" }}>
            <Shockwave color={enemy.glow} trigger={enemyWave} />
          </div>
          <SlashArc color={enemy.fill} active={enemyAtk} flip />
          {dmgNums.filter(d => d.side === "enemy").map(d => (
            <DamageNumber key={d.id} value={d.value} type={d.type} x={0} y={-30} onDone={() => {}} />
          ))}
          <p style={{ position: "absolute", bottom: -15, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: `${enemy.fill}BB`, whiteSpace: "nowrap", letterSpacing: "0.08em" }}>
            {enemyName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(160,140,210,0.4)" }}>BATALHA EM CURSO</span>
          {timeLabel && (
            <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
              style={{ fontSize: 13, fontWeight: 900, color: diffColor, fontFamily: "var(--font-cinzel, serif)" }}>
              {timeLabel}
            </motion.span>
          )}
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(80,60,120,0.1)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${diffColor}80, ${diffColor})`, boxShadow: `0 0 8px ${diffColor}80` }} />
        </div>
      </div>
    </div>
  );
}
