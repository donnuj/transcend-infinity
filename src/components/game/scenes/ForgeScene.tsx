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
      background: "linear-gradient(160deg, rgba(8,4,2,0.99) 0%, rgba(20,8,2,0.98) 100%)",
      border: "1px solid rgba(200,100,20,0.3)",
      padding: "12px 16px 10px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.7)",
      minHeight: 130,
    }}>
      {/* Furnace glow bg */}
      <div style={{ position: "absolute", left: "10%", bottom: 0, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(255,100,20,0.18) 0%, transparent 70%)", filter: "blur(8px)", pointerEvents: "none" }} />

      {/* Furnace */}
      <div style={{ position: "absolute", left: "8%", bottom: 28 }}>
        <motion.div
          animate={{ boxShadow: ["0 0 18px rgba(255,120,20,0.5)", "0 0 36px rgba(255,160,30,0.9)", "0 0 18px rgba(255,120,20,0.5)"] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 44, height: 52, background: "linear-gradient(180deg, rgb(60,30,10) 0%, rgb(30,12,4) 100%)", borderRadius: "6px 6px 4px 4px", border: "2px solid rgba(180,80,10,0.6)", position: "relative", overflow: "hidden" }}
        >
          {/* Fire mouth */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7], scaleY: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", bottom: 0, left: 4, right: 4, height: 24, borderRadius: "6px 6px 0 0", background: "radial-gradient(ellipse at 50% 100%, rgba(255,200,50,0.95) 0%, rgba(255,100,10,0.8) 50%, transparent 100%)" }}
          />
          {/* Sparks from furnace */}
          {[0, 1, 2, 3].map(i => (
            <motion.div key={i}
              animate={{ y: [0, -40 - i * 8], x: [(i % 2 === 0 ? -8 : 8) * Math.random(), (i % 2 === 0 ? 12 : -12)], opacity: [1, 0] }}
              transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, delay: i * 0.2, ease: "easeOut" }}
              style={{ position: "absolute", bottom: 18, left: 8 + i * 7, width: 3, height: 3, borderRadius: "50%", background: i % 2 === 0 ? "rgb(255,220,50)" : "rgb(255,140,20)" }}
            />
          ))}
        </motion.div>
        {/* Furnace legs */}
        <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: 6, paddingRight: 6 }}>
          {[0, 1].map(i => <div key={i} style={{ width: 8, height: 8, background: "rgb(40,20,5)", borderRadius: "0 0 2px 2px" }} />)}
        </div>
      </div>

      {/* Anvil */}
      <div style={{ position: "absolute", left: "38%", bottom: 28 }}>
        {/* Glowing item on anvil */}
        <motion.div
          animate={{ boxShadow: ["0 0 8px rgba(255,200,50,0.4)", "0 0 20px rgba(255,200,50,0.9)", "0 0 8px rgba(255,200,50,0.4)"] }}
          transition={{ duration: 0.7, repeat: Infinity }}
          style={{ width: 8, height: 28, background: "linear-gradient(180deg, rgba(255,240,100,0.95), rgba(200,150,30,0.8))", borderRadius: 2, margin: "0 auto 2px", transformOrigin: "bottom center" }}
        />
        {/* Anvil top */}
        <div style={{ width: 50, height: 12, background: "linear-gradient(180deg, rgb(80,80,90) 0%, rgb(50,50,60) 100%)", borderRadius: "3px 3px 0 0", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }} />
        {/* Anvil horn */}
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <div style={{ width: 10, height: 8, background: "rgb(60,60,70)", borderRadius: "0 0 0 4px" }} />
          <div style={{ width: 30, height: 14, background: "rgb(60,60,70)" }} />
          <div style={{ width: 10, height: 8, background: "rgb(60,60,70)", borderRadius: "0 0 4px 0" }} />
        </div>
      </div>

      {/* Hammer arm */}
      <div style={{ position: "absolute", left: "calc(38% + 8px)", bottom: 52 }}>
        <motion.div
          animate={{ rotate: [-50, 10, -50] }}
          transition={{ duration: 0.55, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "right top", display: "flex", flexDirection: "column", alignItems: "center" }}
        >
          {/* Handle */}
          <div style={{ width: 5, height: 34, background: "rgb(120,80,30)", borderRadius: 3 }} />
          {/* Head */}
          <div style={{ width: 20, height: 14, background: "linear-gradient(180deg, rgb(130,130,140), rgb(80,80,90))", borderRadius: 3, marginTop: -2, boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }} />
        </motion.div>
        {/* Spark burst on impact */}
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, ease: "easeOut", times: [0.55, 0.6, 1] }}
          style={{ position: "absolute", bottom: -4, left: -6 }}
        >
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div key={i}
              animate={{ x: [0, (i - 2) * 12], y: [0, -16 - i * 3], opacity: [1, 0] }}
              transition={{ duration: 0.35, repeat: Infinity, delay: 0.3 + i * 0.02, ease: "easeOut" }}
              style={{ position: "absolute", width: 4, height: 4, borderRadius: "50%", background: i % 2 === 0 ? "rgb(255,220,50)" : "rgb(255,130,20)" }}
            />
          ))}
        </motion.div>
      </div>

      {/* Smoke from furnace */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ y: [0, -50 - i * 10], x: [0, (i - 1) * 15], opacity: [0.5, 0], scale: [0.5, 1.5] }}
          transition={{ duration: 1.8 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
          style={{ position: "absolute", left: `calc(8% + 18px)`, bottom: 80, width: 10, height: 10, borderRadius: "50%", background: "rgba(150,100,60,0.4)", pointerEvents: "none" }}
        />
      ))}

      {/* Header */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(200,130,50,0.6)" }}>FORJANDO</span>
        {timeLabel && (
          <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.1, repeat: Infinity }}
            style={{ fontSize: 13, fontWeight: 900, color: "rgb(200,155,60)", fontFamily: "var(--font-cinzel, serif)" }}>
            {timeLabel}
          </motion.span>
        )}
      </div>

      {itemName && (
        <div style={{ position: "absolute", bottom: 26, left: "38%", transform: "translateX(-50%)", fontSize: 9, color: "rgba(255,200,80,0.7)", fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "0.1em" }}>
          {itemName}
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 16, right: 16 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(60,30,10,0.5)", overflow: "hidden" }}>
          <motion.div animate={{ width: `${clampedPct * 100}%` }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(200,100,20,0.8), rgb(255,180,30))", boxShadow: "0 0 8px rgba(255,160,20,0.8)" }} />
        </div>
      </div>
    </div>
  );
}
