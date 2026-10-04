"use client";

import { motion } from "framer-motion";

type DamageType = "physical" | "magic" | "heal" | "critical" | "miss" | "poison" | "fire" | "ice";

const TYPE_STYLE: Record<DamageType, { color: string; scale: number; shadow: string }> = {
  physical: { color: "rgb(255,230,180)",  scale: 1.0, shadow: "0 2px 8px rgba(0,0,0,0.8)"    },
  magic:    { color: "rgb(170,130,255)",  scale: 1.0, shadow: "0 0 12px rgba(170,130,255,0.6)" },
  heal:     { color: "rgb(100,220,140)",  scale: 1.0, shadow: "0 0 10px rgba(100,220,140,0.5)" },
  critical: { color: "rgb(255,200,40)",   scale: 1.4, shadow: "0 0 16px rgba(255,200,40,0.7)"  },
  miss:     { color: "rgba(200,200,220,0.6)", scale: 0.85, shadow: "none"                       },
  poison:   { color: "rgb(140,230,100)",  scale: 0.9, shadow: "0 0 8px rgba(140,230,100,0.5)"  },
  fire:     { color: "rgb(255,140,50)",   scale: 1.1, shadow: "0 0 12px rgba(255,100,30,0.6)"  },
  ice:      { color: "rgb(140,220,255)",  scale: 1.0, shadow: "0 0 10px rgba(140,200,255,0.5)" },
};

interface Props {
  value: number | string;
  type?: DamageType;
  x?: number;
  y?: number;
  onDone?: () => void;
}

export function DamageNumber({ value, type = "physical", x = 0, y = 0, onDone }: Props) {
  const { color, scale: baseScale, shadow } = TYPE_STYLE[type];
  const isCrit = type === "critical";
  const isMiss = type === "miss";
  const label = isMiss ? "MISS" : (typeof value === "number" ? value.toLocaleString("pt-BR") : value);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 200,
        userSelect: "none",
        color,
        textShadow: shadow,
        fontWeight: isCrit ? 900 : 700,
        fontSize: isCrit ? 22 : isMiss ? 13 : 16,
        fontFamily: "var(--font-cinzel, serif)",
        letterSpacing: isCrit ? "0.05em" : "0.02em",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
      initial={{ opacity: 1, y: 0, scale: baseScale * 0.7, x: "-50%" }}
      animate={{
        opacity: [1, 1, 0],
        y: isMiss ? [-4, -12, -20] : [-8, -32, -48],
        scale: [baseScale * 0.7, baseScale * 1.1, baseScale * 0.9],
        x: ["-50%", "-50%", "-50%"],
      }}
      transition={{ duration: isCrit ? 1.0 : 0.75, ease: [0.23, 1, 0.32, 1] }}
      onAnimationComplete={onDone}
    >
      {isCrit && (
        <span style={{ fontSize: 11, display: "block", textAlign: "center", marginBottom: 1, letterSpacing: "0.2em", opacity: 0.85 }}>
          CRÍTICO
        </span>
      )}
      {label}
    </motion.div>
  );
}
