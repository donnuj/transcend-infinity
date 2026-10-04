"use client";

import { useState, useRef, CSSProperties, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PulseGlow, FloatingIcon } from "../effects/FloatingIcon";
import { ParticleEffect } from "../effects/ParticleEffect";
import { SpellEffect } from "../effects/SpellEffect";

export type GachaRarity = "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário" | "Mítico" | "Divino";

const RARITY_CONFIG: Record<GachaRarity, {
  border: string; glow: string; shimmer: string;
  particleEffect?: "magic" | "star" | "fire" | "slash";
  breathing: boolean;
}> = {
  Comum:    { border: "rgba(180,180,210,0.25)", glow: "transparent",              shimmer: "transparent",           breathing: false },
  Incomum:  { border: "rgba(100,210,130,0.30)", glow: "rgba(100,210,130,0.08)",   shimmer: "rgba(100,210,130,0.15)", breathing: false },
  Raro:     { border: "rgba(90,150,255,0.35)",  glow: "rgba(90,150,255,0.10)",    shimmer: "rgba(90,150,255,0.18)",  breathing: false },
  Épico:    { border: "rgba(180,110,255,0.45)", glow: "rgba(180,110,255,0.15)",   shimmer: "rgba(180,110,255,0.22)", breathing: true, particleEffect: "magic"  },
  Lendário: { border: "rgba(200,155,60,0.55)",  glow: "rgba(200,155,60,0.20)",    shimmer: "rgba(200,155,60,0.28)",  breathing: true, particleEffect: "star"   },
  Mítico:   { border: "rgba(255,80,80,0.60)",   glow: "rgba(255,80,80,0.22)",     shimmer: "rgba(255,100,80,0.30)",  breathing: true, particleEffect: "fire"   },
  Divino:   { border: "rgba(255,255,200,0.70)", glow: "rgba(255,255,200,0.25)",   shimmer: "rgba(255,255,200,0.35)", breathing: true, particleEffect: "star"   },
};

interface Props {
  heroId: string;
  heroName: string;
  rarity: GachaRarity;
  level?: number;
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
  style?: CSSProperties;
  badge?: ReactNode;
  showParticles?: boolean;
}

export function AnimatedHeroCard({
  heroId,
  heroName,
  rarity,
  level,
  selected,
  onSelect,
  className,
  style,
  badge,
  showParticles = false,
}: Props) {
  const [imgErr, setImgErr] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const [tapEffect, setTapEffect] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cfg = RARITY_CONFIG[rarity];

  function handleTap() {
    onSelect?.();
    if (cfg.particleEffect) {
      clearTimeout(tapTimer.current);
      setTapEffect(true);
      tapTimer.current = setTimeout(() => setTapEffect(false), 700);
    }
    setShowEffect(true);
    setTimeout(() => setShowEffect(false), 800);
  }

  const isHighRarity = rarity === "Lendário" || rarity === "Mítico" || rarity === "Divino" || rarity === "Épico";

  const cardInner = (
    <motion.div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 14,
        border: `1.5px solid ${selected ? cfg.border.replace("0.", "0.9") : cfg.border}`,
        background: `linear-gradient(160deg, rgba(10,10,22,0.95) 0%, rgba(15,12,28,0.98) 100%)`,
        boxShadow: selected
          ? `0 0 20px ${cfg.glow}, 0 0 40px ${cfg.glow}, inset 0 1px 0 ${cfg.shimmer}`
          : `0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 ${cfg.shimmer}`,
        cursor: onSelect ? "pointer" : "default",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
        ...style,
      }}
      whileTap={onSelect ? { scale: 0.95 } : undefined}
      animate={cfg.breathing ? { boxShadow: selected
        ? [`0 0 20px ${cfg.glow}, 0 0 40px ${cfg.glow}`, `0 0 28px ${cfg.glow}, 0 0 55px ${cfg.glow}`, `0 0 20px ${cfg.glow}, 0 0 40px ${cfg.glow}`]
        : [`0 2px 12px rgba(0,0,0,0.5)`, `0 2px 20px rgba(0,0,0,0.5), 0 0 12px ${cfg.glow}`, `0 2px 12px rgba(0,0,0,0.5)`]
      } : undefined}
      transition={cfg.breathing ? { duration: 2.2, ease: "easeInOut", repeat: Infinity } : undefined}
      onClick={handleTap}
    >
      {/* hero image */}
      {!imgErr ? (
        <img
          src={`/heroes/${heroId}.png`}
          alt={heroName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 20%",
            maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, opacity: 0.4,
          background: `radial-gradient(circle at 50% 40%, ${cfg.glow}, transparent 70%)`,
        }}>⚔</div>
      )}

      {/* rarity shimmer sweep */}
      {isHighRarity && (
        <motion.div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(105deg, transparent 40%, ${cfg.shimmer} 50%, transparent 60%)`,
            pointerEvents: "none",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.8, ease: "linear", repeat: Infinity, repeatDelay: 3.5 }}
        />
      )}

      {/* selection indicator */}
      <AnimatePresence>
        {selected && (
          <motion.div
            style={{ position: "absolute", inset: 0, borderRadius: 13, border: `2px solid ${cfg.border.replace("0.", "0.9")}`, pointerEvents: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* particles on tap */}
      {cfg.particleEffect && tapEffect && (
        <ParticleEffect
          type={cfg.particleEffect}
          x="50%" y="40%"
          style={{ transform: "translate(-50%, -50%)" }}
        />
      )}

      {/* spell effect on tap */}
      {showEffect && isHighRarity && (
        <SpellEffect
          type={rarity === "Mítico" ? "fire" : rarity === "Divino" ? "holy" : rarity === "Lendário" ? "holy" : "magic"}
          show={showEffect}
          size={50}
        />
      )}

      {/* badge slot */}
      {badge && (
        <div style={{ position: "absolute", top: 6, right: 6 }}>{badge}</div>
      )}

      {/* level badge */}
      {level !== undefined && (
        <div style={{
          position: "absolute", bottom: 6, left: 6,
          background: "rgba(6,7,15,0.88)",
          border: `1px solid ${cfg.border}`,
          borderRadius: 6, padding: "2px 6px",
          fontSize: 10, fontWeight: 700, color: "rgba(200,190,230,0.9)",
        }}>
          Lv.{level}
        </div>
      )}
    </motion.div>
  );

  if (isHighRarity && showParticles) {
    return (
      <FloatingIcon amplitude={isHighRarity ? 3 : 0} period={3}>
        <PulseGlow color={cfg.glow} scale={1.04} duration={2.2}>
          {cardInner}
        </PulseGlow>
      </FloatingIcon>
    );
  }

  return cardInner;
}
