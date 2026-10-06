"use client";

import { motion } from "framer-motion";
import { useRef, CSSProperties } from "react";

type BarType = "hp" | "mp" | "xp" | "rage" | "shield";

const BAR_CONFIG: Record<BarType, { fill: string; glow: string; track: string; label: string }> = {
  hp:     { fill: "linear-gradient(90deg, rgb(80,200,120), rgb(50,230,100))",   glow: "rgba(80,220,120,0.5)",  track: "rgba(80,220,120,0.08)",  label: "HP"  },
  mp:     { fill: "linear-gradient(90deg, rgb(90,130,255), rgb(130,100,255))",  glow: "rgba(110,130,255,0.5)", track: "rgba(100,130,255,0.08)", label: "MP"  },
  xp:     { fill: "linear-gradient(90deg, rgb(200,155,60), rgb(240,190,80))",   glow: "rgba(210,170,60,0.5)",  track: "rgba(210,170,60,0.08)",  label: "XP"  },
  rage:   { fill: "linear-gradient(90deg, rgb(220,80,50), rgb(255,120,60))",    glow: "rgba(240,100,60,0.5)",  track: "rgba(240,100,60,0.08)",  label: "FÚRIA" },
  shield: { fill: "linear-gradient(90deg, rgb(140,210,255), rgb(100,180,255))", glow: "rgba(140,210,255,0.5)", track: "rgba(140,210,255,0.08)", label: "ESCUDO" },
};

interface Props {
  type?: BarType;
  value: number;
  max: number;
  showLabel?: boolean;
  showValue?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
  animated?: boolean;
}

export function StatusBar({
  type = "hp",
  value,
  max,
  showLabel = false,
  showValue = false,
  compact = false,
  className,
  style,
  animated = true,
}: Props) {
  const cfg = BAR_CONFIG[type];
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const h = compact ? 4 : 7;

  // flash red on damage — reading/writing ref during render is intentional (prev-value tracking)
  const prevValue = useRef(value);
  // eslint-disable-next-line react-hooks/refs
  const damaged = value < prevValue.current;
  // eslint-disable-next-line react-hooks/refs
  prevValue.current = value;

  return (
    <div className={className} style={style}>
      {(showLabel || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
          {showLabel && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(180,170,210,0.6)" }}>
              {cfg.label}
            </span>
          )}
          {showValue && (
            <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(200,190,230,0.7)", marginLeft: "auto" }}>
              {value.toLocaleString("pt-BR")}/{max.toLocaleString("pt-BR")}
            </span>
          )}
        </div>
      )}
      <div style={{
        width: "100%", height: h, borderRadius: h / 2,
        background: cfg.track,
        border: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
        position: "relative",
      }}>
        <motion.div
          style={{
            height: "100%",
            background: cfg.fill,
            borderRadius: h / 2,
            boxShadow: `0 0 ${compact ? 4 : 8}px ${cfg.glow}`,
            transformOrigin: "left center",
          }}
          initial={false}
          animate={{
            scaleX: pct,
            ...(damaged ? { filter: ["brightness(1)", "brightness(2)", "brightness(1)"] } : {}),
          }}
          transition={{
            scaleX: animated ? { duration: 0.4, ease: [0.23, 1, 0.32, 1] } : { duration: 0 },
            filter: { duration: 0.25 },
          }}
        />

        {/* shimmer */}
        {!compact && pct > 0.1 && (
          <motion.div
            style={{
              position: "absolute", top: 0, left: 0,
              width: "30%", height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
              borderRadius: h / 2,
            }}
            animate={{ x: ["-100%", `${pct * 100 / 0.3}%`] }}
            transition={{ duration: 1.6, ease: "linear", repeat: Infinity, repeatDelay: 2.5 }}
          />
        )}
      </div>
    </div>
  );
}
