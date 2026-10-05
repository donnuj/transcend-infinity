"use client";

import { motion } from "framer-motion";

interface Props {
  itemName?: string;
  progressPct?: number;
  timeLabel?: string;
}

export function ForgeScene({ itemName, progressPct = 0.4, timeLabel }: Props) {
  const clampedPct = Math.min(1, Math.max(0, progressPct));

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, rgba(4,2,2,1) 0%, rgba(18,6,2,1) 100%)",
      border: "1px solid rgba(220,100,20,0.3)",
      padding: "12px 16px 10px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.8)",
      minHeight: 130,
    }}>

      {/* Deep forge glow — base */}
      <motion.div
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 220, height: 110, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,90,10,0.55) 0%, rgba(200,40,5,0.25) 45%, transparent 75%)", filter: "blur(10px)", pointerEvents: "none" }}
      />

      {/* Inner heat core */}
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 100, height: 60, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,220,80,0.8) 0%, rgba(255,120,10,0.5) 50%, transparent 80%)", filter: "blur(6px)", pointerEvents: "none" }}
      />

      {/* Flame tongues */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div key={i}
          animate={{
            scaleY: [0.6 + i * 0.1, 1.2 + i * 0.08, 0.6 + i * 0.1],
            opacity: [0.6, 1, 0.6],
            x: [0, (i % 2 === 0 ? 6 : -6), 0],
          }}
          transition={{ duration: 0.5 + i * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          style={{
            position: "absolute", bottom: 18,
            left: `calc(50% + ${(i - 2) * 16}px)`,
            transformOrigin: "bottom center",
            width: 14 + i * 2,
            height: 32 + i * 6,
            borderRadius: "50% 50% 20% 20%",
            background: i < 2
              ? "radial-gradient(ellipse at 50% 80%, rgba(255,240,100,0.95), rgba(255,140,10,0.7) 60%, transparent)"
              : i === 2
              ? "radial-gradient(ellipse at 50% 80%, rgba(255,200,50,0.9), rgba(255,80,5,0.5) 60%, transparent)"
              : "radial-gradient(ellipse at 50% 80%, rgba(255,120,20,0.7), rgba(180,40,5,0.3) 60%, transparent)",
            filter: "blur(1.5px)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Embers rising */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <motion.div key={i}
          animate={{
            y: [0, -(50 + i * 12)],
            x: [0, (i % 2 === 0 ? 1 : -1) * (8 + i * 4)],
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1, 0.8, 0.2],
          }}
          transition={{ duration: 1.2 + i * 0.2, repeat: Infinity, delay: i * 0.18, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: 30,
            left: `calc(50% + ${(i - 3) * 10}px)`,
            width: i % 3 === 0 ? 4 : 3,
            height: i % 3 === 0 ? 4 : 3,
            borderRadius: "50%",
            background: i % 3 === 0 ? "rgb(255,230,80)" : i % 3 === 1 ? "rgb(255,150,20)" : "rgb(255,80,10)",
            boxShadow: i % 3 === 0 ? "0 0 4px rgba(255,230,80,0.8)" : "0 0 3px rgba(255,120,20,0.6)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Glowing item being forged */}
      <motion.div
        animate={{ opacity: [0.7, 1, 0.7], scaleX: [0.92, 1.08, 0.92] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: 52,
          left: "50%",
          transform: "translateX(-50%)",
          width: 6,
          height: 30,
          borderRadius: 3,
          background: "linear-gradient(180deg, rgba(255,250,180,1) 0%, rgba(255,200,50,0.9) 50%, rgba(255,100,10,0.6) 100%)",
          boxShadow: "0 0 12px rgba(255,220,80,0.9), 0 0 24px rgba(255,160,20,0.5)",
          pointerEvents: "none",
        }}
      />

      {/* Smoke wisps */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -(60 + i * 15)], x: [0, (i - 1) * 20], opacity: [0, 0.25, 0], scale: [0.3, 1.8] }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          style={{ position: "absolute", bottom: 70, left: `calc(50% + ${(i - 1) * 14}px)`, width: 16, height: 16, borderRadius: "50%", background: "rgba(120,80,60,0.5)", filter: "blur(4px)", pointerEvents: "none" }}
        />
      ))}

      {/* Header */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(220,120,40,0.65)" }}>FORJANDO</span>
        {timeLabel && (
          <motion.span animate={{ opacity: [1, 0.55, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 900, color: "rgb(220,150,50)", fontFamily: "var(--font-cinzel, serif)" }}>
            {timeLabel}
          </motion.span>
        )}
      </div>

      {itemName && (
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(255,190,70,0.75)", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.12em" }}>
          {itemName}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 16, right: 16 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(60,20,5,0.6)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(200,80,10,0.9), rgb(255,200,30))", boxShadow: "0 0 8px rgba(255,160,20,0.9)" }} />
        </div>
      </div>
    </div>
  );
}
