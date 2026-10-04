"use client";

import { motion } from "framer-motion";

interface Props {
  routeName?: string;
  from?: string;
  to?: string;
  progressPct?: number;
  timeLabel?: string;
}

export function CaravanScene({ routeName, from, to, progressPct = 0.4, timeLabel }: Props) {
  const clampedPct = Math.min(1, Math.max(0, progressPct));

  return (
    <div style={{
      position: "relative",
      borderRadius: 16,
      overflow: "hidden",
      background: "linear-gradient(160deg, rgba(6,7,18,0.98) 0%, rgba(12,8,22,0.97) 100%)",
      border: "1px solid rgba(200,155,60,0.2)",
      padding: "14px 12px 12px",
      boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
      minHeight: 130,
    }}>
      {/* Sky gradient */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,10,50,0.6) 0%, transparent 50%)", pointerEvents: "none" }} />

      {/* Stars */}
      {[12, 28, 45, 62, 78, 20, 55, 88].map((x, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          style={{ position: "absolute", left: `${x}%`, top: `${8 + (i % 3) * 8}%`, width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,200,0.8)" }}
        />
      ))}

      {/* Moon */}
      <div style={{ position: "absolute", right: "10%", top: "8%", width: 18, height: 18, borderRadius: "50%", background: "radial-gradient(circle at 40% 40%, rgba(255,255,200,0.9), rgba(200,180,100,0.5))", boxShadow: "0 0 12px rgba(255,255,200,0.2)" }} />

      {/* Ground line */}
      <div style={{ position: "absolute", bottom: 48, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(200,155,60,0.25), transparent)" }} />

      {/* Road texture — scrolling lines */}
      <motion.div
        animate={{ x: [0, -40] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", bottom: 44, left: 0, right: 0, height: 8, display: "flex", gap: 0, pointerEvents: "none" }}
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} style={{ width: 24, height: 2, background: "rgba(200,155,60,0.15)", marginRight: 16, marginTop: 3, borderRadius: 1, flexShrink: 0 }} />
        ))}
      </motion.div>

      {/* Dust particles behind cart */}
      {[0, 1, 2, 3].map(i => (
        <motion.div key={i}
          animate={{ x: [0, -30 - i * 8], y: [0, -8 - i * 3], opacity: [0.6, 0] }}
          transition={{ duration: 0.8 + i * 0.2, repeat: Infinity, delay: i * 0.25, ease: "easeOut" }}
          style={{ position: "absolute", bottom: 52, left: `38%`, width: 4 + i * 2, height: 4 + i * 2, borderRadius: "50%", background: "rgba(200,155,60,0.3)" }}
        />
      ))}

      {/* Cart body */}
      <div style={{ position: "absolute", bottom: 50, left: "45%", transform: "translateX(-50%)" }}>
        {/* Cart box */}
        <motion.div
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "relative" }}
        >
          {/* Canopy */}
          <div style={{ width: 44, height: 14, background: "linear-gradient(180deg, rgba(180,100,40,0.9), rgba(140,70,20,0.8))", borderRadius: "4px 4px 0 0", marginBottom: -1, border: "1px solid rgba(200,130,50,0.4)", borderBottom: "none" }} />
          {/* Body */}
          <div style={{ width: 44, height: 18, background: "linear-gradient(180deg, rgba(140,90,30,0.9), rgba(100,60,15,0.85))", border: "1px solid rgba(180,110,40,0.4)", borderRadius: "0 0 2px 2px" }}>
            {/* Slat lines */}
            {[10, 20, 30].map(x => <div key={x} style={{ position: "absolute", top: 2, bottom: 2, left: x, width: 1, background: "rgba(0,0,0,0.25)" }} />)}
          </div>
          {/* Wheels */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 1, paddingLeft: 4, paddingRight: 4 }}>
            {[0, 1].map(i => (
              <motion.div key={i}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(180,120,40,0.9)", background: "rgba(80,50,15,0.8)", position: "relative" }}
              >
                {/* Spokes */}
                <div style={{ position: "absolute", inset: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "100%", height: 1, background: "rgba(180,120,40,0.7)" }} />
                  <div style={{ position: "absolute", width: 1, height: "100%", background: "rgba(180,120,40,0.7)" }} />
                </div>
              </motion.div>
            ))}
          </div>
          {/* Tongue/hitch */}
          <div style={{ position: "absolute", left: -16, bottom: 8, width: 18, height: 2, background: "rgba(140,90,30,0.7)", borderRadius: 1 }} />
        </motion.div>
      </div>

      {/* Horse */}
      <div style={{ position: "absolute", bottom: 50, left: "28%", transform: "translateX(-50%)" }}>
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "relative" }}
        >
          {/* Body */}
          <div style={{ width: 24, height: 14, background: "linear-gradient(180deg, rgba(140,100,60,0.9), rgba(100,70,30,0.8))", borderRadius: 4, position: "relative" }}>
            {/* Head */}
            <div style={{ position: "absolute", right: -10, top: -6, width: 12, height: 10, background: "rgba(140,100,60,0.9)", borderRadius: "4px 6px 2px 2px" }} />
            {/* Mane */}
            <div style={{ position: "absolute", top: -8, right: -4, width: 6, height: 6, background: "rgba(80,50,20,0.8)", borderRadius: "50% 50% 0 0" }} />
          </div>
          {/* Legs animated */}
          {[0, 1, 2, 3].map(i => (
            <motion.div key={i}
              animate={{ rotate: [i % 2 === 0 ? -15 : 15, i % 2 === 0 ? 15 : -15, i % 2 === 0 ? -15 : 15] }}
              transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
              style={{ position: "absolute", bottom: -10, left: 3 + i * 5, width: 3, height: 10, background: "rgba(120,85,40,0.8)", borderRadius: 1, transformOrigin: "top center" }}
            />
          ))}
        </motion.div>
      </div>

      {/* Info row */}
      <div style={{ position: "absolute", top: 10, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(180,160,220,0.5)" }}>CARAVANA EM ROTA</span>
        {timeLabel && (
          <motion.span
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ fontSize: 12, fontWeight: 900, color: "rgb(200,155,60)", fontFamily: "var(--font-cinzel, serif)" }}
          >
            {timeLabel}
          </motion.span>
        )}
      </div>

      {/* Route label */}
      {(from || to) && (
        <div style={{ position: "absolute", bottom: 26, left: 0, right: 0, textAlign: "center" }}>
          <span style={{ fontSize: 9, color: "rgba(180,160,220,0.5)", letterSpacing: "0.15em" }}>
            {from} → {to}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 10, left: 12, right: 12 }}>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(122,111,160,0.12)", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${clampedPct * 100}%` }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg, rgba(200,155,60,0.7), rgb(200,155,60))", boxShadow: "0 0 6px rgba(200,155,60,0.6)" }}
          />
        </div>
      </div>
    </div>
  );
}
