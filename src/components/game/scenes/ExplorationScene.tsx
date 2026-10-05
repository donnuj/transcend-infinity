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
      background: "linear-gradient(180deg, rgba(2,4,14,1) 0%, rgba(4,6,18,1) 100%)",
      border: "1px solid rgba(70,120,255,0.22)",
      padding: "12px 16px 10px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.8)",
      minHeight: 130,
    }}>

      {/* Aurora / sky */}
      <motion.div
        animate={{ opacity: [0.15, 0.35, 0.15], scaleX: [0.9, 1.1, 0.9] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 50, background: "linear-gradient(90deg, transparent 0%, rgba(40,80,200,0.25) 30%, rgba(80,160,255,0.3) 50%, rgba(40,200,180,0.2) 70%, transparent 100%)", filter: "blur(8px)", pointerEvents: "none" }}
      />

      {/* Stars */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.1, i % 2 === 0 ? 1 : 0.7, 0.1] }}
          transition={{ duration: 1.5 + i * 0.35, repeat: Infinity, delay: i * 0.2 }}
          style={{ position: "absolute", top: 5 + (i % 4) * 9, left: `${5 + i * 11}%`, width: i % 3 === 0 ? 2 : 1.5, height: i % 3 === 0 ? 2 : 1.5, borderRadius: "50%", background: "white", pointerEvents: "none" }}
        />
      ))}

      {/* Moon with halo */}
      <div style={{ position: "absolute", top: 10, right: "14%", pointerEvents: "none" }}>
        <motion.div
          animate={{ opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,210,255,0.2) 0%, transparent 70%)", filter: "blur(4px)" }}
        />
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgb(210,215,240)", boxShadow: "0 0 10px rgba(190,200,255,0.4)" }} />
      </div>

      {/* Mountain silhouettes */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, pointerEvents: "none" }}>
        <svg width="100%" height="60" viewBox="0 0 360 60" preserveAspectRatio="none">
          <polygon points="0,60 50,18 100,60" fill="rgba(14,20,40,0.95)" />
          <polygon points="35,60 90,6 145,60" fill="rgba(10,16,35,0.98)" />
          <polygon points="100,60 155,20 210,60" fill="rgba(14,20,42,0.9)" />
          <polygon points="170,60 225,10 280,60" fill="rgba(12,18,38,0.96)" />
          <polygon points="240,60 295,22 350,60" fill="rgba(14,20,40,0.92)" />
          <polygon points="310,60 360,16 360,60" fill="rgba(10,16,36,0.98)" />
        </svg>
      </div>

      {/* Ground line */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, height: 1, background: "rgba(50,80,180,0.2)", pointerEvents: "none" }} />

      {/* Lantern light — moving */}
      <motion.div
        animate={{ x: ["-30%", "130%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear", repeatType: "loop" }}
        style={{ position: "absolute", bottom: 15, left: 0, pointerEvents: "none" }}
      >
        {/* Lantern glow */}
        <motion.div
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 0.9, repeat: Infinity }}
          style={{ width: 70, height: 50, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,200,80,0.35) 0%, rgba(180,120,30,0.1) 55%, transparent 80%)", filter: "blur(5px)" }}
        />
        {/* Lantern dot */}
        <motion.div
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ position: "absolute", top: 18, left: 32, width: 6, height: 6, borderRadius: "50%", background: "rgb(255,210,90)", boxShadow: "0 0 8px rgba(255,200,60,0.9)" }}
        />
        {/* Footstep trails */}
        {[0, 1].map(i => (
          <motion.div key={i}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.4 }}
            style={{ position: "absolute", top: 32, left: 28 + i * 8, width: 4, height: 3, borderRadius: "50%", background: "rgba(100,140,255,0.5)" }}
          />
        ))}
      </motion.div>

      {/* Fog wisps */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ x: ["-10%", "110%"], opacity: [0, 0.18, 0.12, 0] }}
          transition={{ duration: 12 + i * 3, repeat: Infinity, delay: i * 4, ease: "linear" }}
          style={{ position: "absolute", bottom: 25 + i * 4, left: 0, width: "35%", height: 12, background: "rgba(60,100,200,0.15)", filter: "blur(8px)", borderRadius: 8, pointerEvents: "none" }}
        />
      ))}

      {/* Header */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(80,140,255,0.65)" }}>EXPLORANDO</span>
        {timeLabel && (
          <motion.span animate={{ opacity: [1, 0.55, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 900, color: "rgb(100,160,255)", fontFamily: "var(--font-cinzel, serif)" }}>
            {timeLabel}
          </motion.span>
        )}
      </div>

      {regionName && (
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(90,150,255,0.75)", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.12em" }}>
          {regionName}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 16, right: 16 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(8,12,40,0.6)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(30,70,200,0.9), rgb(90,160,255))", boxShadow: "0 0 8px rgba(80,150,255,0.9)" }} />
        </div>
      </div>
    </div>
  );
}
