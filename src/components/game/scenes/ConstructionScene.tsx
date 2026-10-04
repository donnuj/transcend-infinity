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
      background: "linear-gradient(160deg, rgba(4,8,4,0.99) 0%, rgba(8,16,6,0.98) 100%)",
      border: "1px solid rgba(100,180,60,0.25)",
      padding: "12px 16px 10px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.7)",
      minHeight: 130,
    }}>
      {/* Sky glow */}
      <div style={{ position: "absolute", right: "10%", top: 0, width: 140, height: 80, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(100,200,60,0.08) 0%, transparent 70%)", filter: "blur(12px)", pointerEvents: "none" }} />

      {/* Ground */}
      <div style={{ position: "absolute", bottom: 28, left: 0, right: 0, height: 2, background: "rgba(80,120,40,0.3)" }} />

      {/* Tower structure (right side) */}
      <div style={{ position: "absolute", right: "12%", bottom: 30 }}>
        {/* Top battlements */}
        <div style={{ display: "flex", gap: 3, marginBottom: 0, paddingLeft: 4 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: 8, height: 10, background: "rgb(80,100,60)", borderRadius: "2px 2px 0 0" }} />
          ))}
        </div>
        {/* Tower body */}
        <div style={{ width: 44, height: 50, background: "linear-gradient(180deg, rgb(70,90,55) 0%, rgb(50,65,40) 100%)", borderRadius: "2px 2px 0 0", border: "1px solid rgba(100,160,60,0.3)", position: "relative", overflow: "hidden" }}>
          {/* Window */}
          <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", width: 10, height: 14, borderRadius: "4px 4px 0 0", background: "rgba(200,220,100,0.15)", border: "1px solid rgba(100,160,60,0.4)" }} />
          {/* Stone texture lines */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: "absolute", top: 16 + i * 11, left: 4, right: 4, height: 1, background: "rgba(60,80,40,0.6)" }} />
          ))}
        </div>
        {/* Tower base */}
        <div style={{ width: 50, height: 8, background: "rgb(55,70,40)", marginLeft: -3, borderRadius: "0 0 2px 2px" }} />
      </div>

      {/* Scaffolding */}
      <div style={{ position: "absolute", right: "calc(12% - 10px)", bottom: 30 }}>
        {/* Vertical poles */}
        {[0, 1].map(i => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: i * 20, width: 3, height: 70, background: "rgb(100,80,40)", borderRadius: 2 }} />
        ))}
        {/* Horizontal planks */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{ position: "absolute", bottom: 16 + i * 20, left: -2, width: 28, height: 3, background: "rgb(120,95,45)", borderRadius: 1 }} />
        ))}
      </div>

      {/* Worker on scaffolding */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", right: "calc(12% + 2px)", bottom: 90 }}
      >
        {/* Worker body */}
        <div style={{ width: 10, height: 14, background: "rgb(80,120,180)", borderRadius: "3px 3px 0 0", position: "relative" }}>
          {/* Head */}
          <div style={{ position: "absolute", top: -8, left: 1, width: 8, height: 8, borderRadius: "50%", background: "rgb(200,160,100)" }} />
          {/* Helmet */}
          <div style={{ position: "absolute", top: -10, left: 0, width: 10, height: 5, borderRadius: "4px 4px 0 0", background: "rgb(220,160,20)" }} />
        </div>
        {/* Worker arm (hammering) */}
        <motion.div
          animate={{ rotate: [-30, 30, -30] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "top left", position: "absolute", top: 2, right: -8, width: 10, height: 3, background: "rgb(150,120,80)", borderRadius: 2 }}
        />
      </motion.div>

      {/* Worker on ground */}
      <motion.div
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", left: "18%", bottom: 30 }}
      >
        <div style={{ width: 10, height: 16, background: "rgb(140,80,50)", borderRadius: "3px 3px 0 0", position: "relative" }}>
          <div style={{ position: "absolute", top: -9, left: 1, width: 8, height: 8, borderRadius: "50%", background: "rgb(190,150,100)" }} />
          <div style={{ position: "absolute", top: -11, left: 0, width: 10, height: 5, borderRadius: "4px 4px 0 0", background: "rgb(200,80,20)" }} />
        </div>
        {/* Carrying block */}
        <motion.div
          animate={{ y: [-1, 1, -1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ position: "absolute", top: 4, left: -10, width: 8, height: 8, background: "rgb(80,90,60)", borderRadius: 2, border: "1px solid rgba(100,130,70,0.6)" }}
        />
      </motion.div>

      {/* Stone blocks pile */}
      <div style={{ position: "absolute", left: "8%", bottom: 30, display: "flex", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 12, height: 10, background: `rgb(${70 + i * 8},${85 + i * 6},${60 + i * 4})`, borderRadius: 2, border: "1px solid rgba(80,100,60,0.4)" }} />
        ))}
      </div>

      {/* Dust particles */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -30 - i * 8], x: [(i - 1) * 10, (i - 1) * 18], opacity: [0.4, 0], scale: [0.6, 1.4] }}
          transition={{ duration: 1.4 + i * 0.3, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          style={{ position: "absolute", right: "calc(12% + 10px)", bottom: 100 + i * 6, width: 8, height: 8, borderRadius: "50%", background: "rgba(120,140,80,0.3)", pointerEvents: "none" }}
        />
      ))}

      {/* Header */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(100,180,60,0.6)" }}>CONSTRUINDO</span>
        {timeLabel && (
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 900, color: "rgb(100,200,80)", fontFamily: "var(--font-cinzel, serif)" }}>
            {timeLabel}
          </motion.span>
        )}
      </div>

      {buildingName && (
        <div style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(120,200,80,0.7)", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.1em" }}>
          {buildingName}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 16, right: 16 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(20,40,15,0.5)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(60,150,30,0.8), rgb(120,220,60))", boxShadow: "0 0 8px rgba(100,200,50,0.8)" }} />
        </div>
      </div>
    </div>
  );
}
