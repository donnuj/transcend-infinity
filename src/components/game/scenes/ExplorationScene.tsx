"use client";

import { motion } from "framer-motion";

interface Props {
  regionName?: string;
  progressPct?: number;
  timeLabel?: string;
}

export function ExplorationScene({ regionName, progressPct = 0.4, timeLabel }: Props) {
  const clampedPct = Math.min(1, Math.max(0, progressPct));

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(160deg, rgba(2,6,14,0.99) 0%, rgba(6,10,22,0.98) 100%)",
      border: "1px solid rgba(90,150,255,0.25)",
      padding: "12px 16px 10px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.7)",
      minHeight: 130,
    }}>
      {/* Sky atmosphere */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 60, background: "linear-gradient(180deg, rgba(20,30,80,0.4) 0%, transparent 100%)", pointerEvents: "none" }} />

      {/* Stars */}
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          style={{ position: "absolute", top: 8 + (i % 3) * 12, left: `${15 + i * 14}%`, width: 2, height: 2, borderRadius: "50%", background: "white", pointerEvents: "none" }}
        />
      ))}

      {/* Moon */}
      <div style={{ position: "absolute", top: 12, right: "15%", width: 16, height: 16, borderRadius: "50%", background: "rgb(220,210,180)", boxShadow: "0 0 10px rgba(220,210,180,0.4)" }} />

      {/* Mountains (background) */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, pointerEvents: "none" }}>
        <svg width="100%" height="55" viewBox="0 0 340 55" preserveAspectRatio="none">
          <polygon points="0,55 40,20 80,55" fill="rgba(30,35,60,0.8)" />
          <polygon points="30,55 80,10 130,55" fill="rgba(25,30,55,0.9)" />
          <polygon points="90,55 140,18 190,55" fill="rgba(35,40,65,0.7)" />
          <polygon points="160,55 210,22 260,55" fill="rgba(28,33,58,0.85)" />
          <polygon points="220,55 270,12 320,55" fill="rgba(32,38,62,0.8)" />
          <polygon points="280,55 340,20 340,55" fill="rgba(26,31,56,0.9)" />
        </svg>
      </div>

      {/* Ground */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, height: 2, background: "rgba(60,80,140,0.3)" }} />

      {/* Trees */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ scaleY: [1, 1.03, 1] }}
          transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", bottom: 29, left: `${8 + i * 22}%`, transformOrigin: "bottom center" }}
        >
          <div style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: `${18 + i * 4}px solid rgba(30,${70 + i * 10},${30 + i * 5},0.85)`, marginBottom: -3 }} />
          <div style={{ width: 5, height: 10, background: "rgba(60,40,20,0.8)", margin: "0 auto" }} />
        </motion.div>
      ))}

      {/* Hero walking */}
      <motion.div
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: 30, left: "52%", transform: "translateX(-50%)" }}
      >
        {/* Body */}
        <div style={{ width: 12, height: 18, background: "rgb(60,100,200)", borderRadius: "3px 3px 0 0", position: "relative" }}>
          {/* Head */}
          <div style={{ position: "absolute", top: -10, left: 1, width: 10, height: 10, borderRadius: "50%", background: "rgb(200,160,100)" }} />
          {/* Cape */}
          <motion.div
            animate={{ skewX: [-5, 5, -5] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ position: "absolute", top: 2, right: -5, width: 6, height: 12, background: "rgba(180,60,60,0.7)", borderRadius: "0 0 4px 0" }}
          />
        </div>
        {/* Legs */}
        <div style={{ display: "flex", gap: 2 }}>
          <motion.div
            animate={{ rotate: [-20, 20, -20] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ transformOrigin: "top center", width: 5, height: 10, background: "rgb(50,80,160)", borderRadius: "0 0 2px 2px" }}
          />
          <motion.div
            animate={{ rotate: [20, -20, 20] }}
            transition={{ duration: 0.6, repeat: Infinity }}
            style={{ transformOrigin: "top center", width: 5, height: 10, background: "rgb(50,80,160)", borderRadius: "0 0 2px 2px" }}
          />
        </div>
        {/* Sword */}
        <motion.div
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 0.6, repeat: Infinity }}
          style={{ position: "absolute", top: 3, left: -8, width: 8, height: 3, background: "rgb(180,180,200)", borderRadius: 1, transformOrigin: "right center" }}
        />
      </motion.div>

      {/* Torch light effect */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", bottom: 25, left: "52%", width: 60, height: 40, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(90,140,255,0.15) 0%, transparent 70%)", transform: "translateX(-50%)", pointerEvents: "none" }}
      />

      {/* Footstep dust */}
      {[0, 1].map(i => (
        <motion.div key={i}
          animate={{ x: [-5, -20], y: [0, -8], opacity: [0.5, 0], scale: [0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.3, ease: "easeOut" }}
          style={{ position: "absolute", bottom: 29, left: "48%", width: 6, height: 4, borderRadius: "50%", background: "rgba(80,100,160,0.3)", pointerEvents: "none" }}
        />
      ))}

      {/* Header */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(90,150,255,0.6)" }}>EXPLORANDO</span>
        {timeLabel && (
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 900, color: "rgb(110,170,255)", fontFamily: "var(--font-cinzel, serif)" }}>
            {timeLabel}
          </motion.span>
        )}
      </div>

      {regionName && (
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(100,160,255,0.7)", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.1em" }}>
          {regionName}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 16, right: 16 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(10,20,50,0.5)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(40,80,200,0.8), rgb(90,150,255))", boxShadow: "0 0 8px rgba(90,150,255,0.8)" }} />
        </div>
      </div>
    </div>
  );
}
