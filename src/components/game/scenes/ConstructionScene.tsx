"use client";

import { motion } from "framer-motion";

interface Props {
  buildingName?: string;
  progressPct?: number;
  timeLabel?: string;
}

export function ConstructionScene({ buildingName, progressPct = 0.4, timeLabel }: Props) {
  const clampedPct = Math.min(1, Math.max(0, progressPct));

  return (
    <div style={{
      position: "relative", borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, rgba(2,4,8,1) 0%, rgba(4,10,6,1) 100%)",
      border: "1px solid rgba(80,180,60,0.25)",
      padding: "12px 16px 10px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.8)",
      minHeight: 130,
    }}>

      {/* Sky gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(10,20,40,0.8) 0%, transparent 55%)", pointerEvents: "none" }} />

      {/* Stars */}
      {[0,1,2,3,4,5,6].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 1.8 + i * 0.3, repeat: Infinity, delay: i * 0.25 }}
          style={{ position: "absolute", top: 6 + (i % 3) * 10, left: `${8 + i * 12}%`, width: i % 3 === 0 ? 2 : 1.5, height: i % 3 === 0 ? 2 : 1.5, borderRadius: "50%", background: "white", pointerEvents: "none" }}
        />
      ))}

      {/* Moon */}
      <motion.div
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ position: "absolute", top: 10, right: "12%", width: 18, height: 18, borderRadius: "50%", background: "rgb(230,220,190)", boxShadow: "0 0 14px rgba(230,220,190,0.35)", pointerEvents: "none" }}
      />

      {/* Tower silhouette — grows with progress */}
      <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)" }}>
        {/* Base */}
        <div style={{ position: "relative" }}>
          {/* Tower body — height animated by clampedPct */}
          <motion.div
            animate={{ height: 20 + clampedPct * 48 }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            style={{ width: 36, background: "linear-gradient(180deg, rgba(50,70,45,0.95) 0%, rgba(30,45,25,0.95) 100%)", borderRadius: "2px 2px 0 0", overflow: "hidden", position: "relative" }}
          >
            {/* Window glow */}
            <motion.div
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 8, height: 10, borderRadius: "3px 3px 0 0", background: "rgba(180,220,100,0.4)", boxShadow: "0 0 8px rgba(150,220,80,0.5)" }}
            />
          </motion.div>
          {/* Battlements — appear at ~70% progress */}
          <motion.div
            animate={{ opacity: clampedPct > 0.7 ? 1 : 0, y: clampedPct > 0.7 ? 0 : 6 }}
            transition={{ duration: 0.5 }}
            style={{ display: "flex", gap: 3, marginBottom: 0, paddingLeft: 3 }}
          >
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width: 6, height: 8, background: "rgba(50,70,45,0.95)", borderRadius: "1px 1px 0 0" }} />
            ))}
          </motion.div>
        </div>
        {/* Foundation */}
        <div style={{ width: 44, height: 6, background: "rgba(40,55,35,0.95)", borderRadius: "0 0 2px 2px", marginLeft: -4 }} />
      </div>

      {/* Construction energy particles rising */}
      {[0,1,2,3,4].map(i => (
        <motion.div key={i}
          animate={{
            y: [0, -(40 + i * 10)],
            x: [(i - 2) * 6, (i - 2) * 14],
            opacity: [0, 0.9, 0],
            scale: [0.4, 1, 0.2],
          }}
          transition={{ duration: 1.6 + i * 0.2, repeat: Infinity, delay: i * 0.32, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: i % 2 === 0 ? "rgba(120,220,80,0.9)" : "rgba(80,200,140,0.85)",
            boxShadow: i % 2 === 0 ? "0 0 6px rgba(100,200,60,0.8)" : "0 0 5px rgba(60,180,120,0.7)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Ground glow */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", width: 120, height: 30, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(80,180,50,0.2) 0%, transparent 70%)", filter: "blur(6px)", pointerEvents: "none" }}
      />

      {/* Header */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(80,180,60,0.65)" }}>CONSTRUINDO</span>
        {timeLabel && (
          <motion.span animate={{ opacity: [1, 0.55, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 900, color: "rgb(100,200,80)", fontFamily: "var(--font-cinzel, serif)" }}>
            {timeLabel}
          </motion.span>
        )}
      </div>

      {buildingName && (
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(100,200,80,0.75)", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.12em" }}>
          {buildingName}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 16, right: 16 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(10,25,8,0.6)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(40,140,20,0.9), rgb(120,230,60))", boxShadow: "0 0 8px rgba(80,200,40,0.9)" }} />
        </div>
      </div>
    </div>
  );
}
