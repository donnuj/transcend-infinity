"use client";

import { motion, AnimatePresence } from "framer-motion";

export type SpellType = "fire" | "ice" | "lightning" | "poison" | "holy" | "dark" | "levelup" | "buff" | "debuff" | "magic";

const SPELL_CONFIG: Record<SpellType, { rings: string[]; core: string; glow: string; label?: string }> = {
  fire:      { rings: ["rgba(255,160,60,0.7)",  "rgba(255,80,20,0.4)"],  core: "rgb(255,200,80)",  glow: "rgba(255,120,40,0.6)"  },
  ice:       { rings: ["rgba(140,220,255,0.7)", "rgba(80,180,240,0.4)"], core: "rgb(200,240,255)", glow: "rgba(100,200,255,0.6)" },
  lightning: { rings: ["rgba(255,240,80,0.8)",  "rgba(200,160,255,0.4)"], core: "rgb(255,255,150)", glow: "rgba(220,200,255,0.7)" },
  poison:    { rings: ["rgba(140,230,100,0.7)", "rgba(80,180,60,0.4)"],  core: "rgb(180,255,100)", glow: "rgba(100,200,60,0.6)"  },
  holy:      { rings: ["rgba(255,240,180,0.8)", "rgba(255,220,100,0.4)"], core: "rgb(255,250,220)", glow: "rgba(255,230,130,0.7)" },
  dark:      { rings: ["rgba(180,100,255,0.7)", "rgba(100,50,180,0.4)"], core: "rgb(220,160,255)", glow: "rgba(150,80,220,0.6)"  },
  magic:     { rings: ["rgba(170,130,255,0.7)", "rgba(120,80,220,0.4)"], core: "rgb(200,170,255)", glow: "rgba(160,110,255,0.6)" },
  levelup:   { rings: ["rgba(255,230,80,0.9)",  "rgba(200,255,180,0.5)", "rgba(255,180,255,0.3)"], core: "rgb(255,255,200)", glow: "rgba(255,230,100,0.8)", label: "LEVEL UP!" },
  buff:      { rings: ["rgba(100,230,140,0.7)", "rgba(80,200,255,0.4)"], core: "rgb(160,255,200)", glow: "rgba(80,200,140,0.6)"  },
  debuff:    { rings: ["rgba(255,100,100,0.7)", "rgba(180,60,60,0.4)"],  core: "rgb(255,180,180)", glow: "rgba(200,80,80,0.6)"   },
};

interface Props {
  type: SpellType;
  show: boolean;
  size?: number;
  onDone?: () => void;
}

export function SpellEffect({ type, show, size = 80, onDone }: Props) {
  const cfg = SPELL_CONFIG[type];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 100 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onAnimationComplete={(def) => { if (def === "exit") onDone?.(); }}
        >
          {cfg.rings.map((color, i) => (
            <motion.div
              key={i}
              style={{
                position: "absolute",
                width: size * (1 + i * 0.45),
                height: size * (1 + i * 0.45),
                borderRadius: "50%",
                border: `2px solid ${color}`,
                boxShadow: `0 0 ${12 + i * 8}px ${color}, inset 0 0 ${8 + i * 4}px ${color}`,
              }}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: [0, 0.9, 0] }}
              transition={{ duration: 0.6 + i * 0.1, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
            />
          ))}

          {/* core flash */}
          <motion.div
            style={{
              position: "absolute",
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${cfg.core} 0%, transparent 70%)`,
              boxShadow: `0 0 24px ${cfg.glow}, 0 0 48px ${cfg.glow}`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.4, 1.0, 0], opacity: [0, 1, 0.8, 0] }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          />

          {cfg.label && (
            <motion.span
              style={{
                position: "absolute",
                top: -size * 0.7,
                color: cfg.core,
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: "0.2em",
                textShadow: `0 0 16px ${cfg.glow}`,
                fontFamily: "var(--font-cinzel, serif)",
                whiteSpace: "nowrap",
              }}
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: [8, 0, -8, -20], scale: [0.8, 1.1, 1, 0.9] }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            >
              {cfg.label}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
