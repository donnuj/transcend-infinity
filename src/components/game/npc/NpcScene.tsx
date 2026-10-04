"use client";

import { motion } from "framer-motion";

interface Props {
  npcPortrait?: string;
  npcName?: string;
  playerPortrait?: string;
}

export function NpcScene({ npcPortrait = "👤", npcName, playerPortrait = "⚔" }: Props) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 14,
      overflow: "hidden",
      background: "linear-gradient(160deg, rgba(6,7,18,0.98) 0%, rgba(14,8,28,0.97) 100%)",
      border: "1px solid rgba(122,111,160,0.2)",
      padding: "12px",
      height: 110,
    }}>
      {/* Ground */}
      <div style={{ position: "absolute", bottom: 20, left: "5%", right: "5%", height: 1, background: "linear-gradient(90deg, transparent, rgba(122,111,160,0.2), transparent)" }} />

      {/* Ambient glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(122,111,160,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Player figure (left) */}
      <div style={{ position: "absolute", left: "15%", bottom: 18 }}>
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
        >
          {/* Head */}
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgb(90,150,255), rgba(90,150,255,0.5))", boxShadow: "0 0 8px rgba(90,150,255,0.5)", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {playerPortrait !== "⚔" ? <span style={{ fontSize: 9 }}>{playerPortrait}</span> : null}
          </div>
          {/* Body */}
          <div style={{ width: 12, height: 18, background: "linear-gradient(180deg, rgba(90,150,255,0.8), rgba(90,150,255,0.4))", borderRadius: "3px 3px 1px 1px" }} />
          {/* Legs */}
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1].map(i => (
              <motion.div key={i}
                animate={{ rotate: [i === 0 ? -4 : 4, i === 0 ? 4 : -4, i === 0 ? -4 : 4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                style={{ width: 5, height: 10, background: "rgba(90,150,255,0.5)", borderRadius: 2, transformOrigin: "top center" }}
              />
            ))}
          </div>
        </motion.div>
        {/* Player speech bubble */}
        <motion.div
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.8 }}
          style={{ position: "absolute", top: -22, left: 12, background: "rgba(90,150,255,0.15)", border: "1px solid rgba(90,150,255,0.3)", borderRadius: "6px 6px 6px 2px", padding: "3px 6px", whiteSpace: "nowrap", fontSize: 8, color: "rgba(90,150,255,0.9)" }}
        >
          ...
        </motion.div>
      </div>

      {/* NPC figure (right) */}
      <div style={{ position: "absolute", right: "15%", bottom: 18, transform: "scaleX(-1)" }}>
        <motion.div
          animate={{ y: [0, -2.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}
        >
          {/* Head */}
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgb(200,155,60), rgba(200,155,60,0.5))", boxShadow: "0 0 8px rgba(200,155,60,0.5)", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
          </div>
          {/* Body */}
          <div style={{ width: 12, height: 18, background: "linear-gradient(180deg, rgba(200,155,60,0.8), rgba(200,155,60,0.4))", borderRadius: "3px 3px 1px 1px" }} />
          {/* Legs */}
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1].map(i => (
              <motion.div key={i}
                animate={{ rotate: [i === 0 ? -4 : 4, i === 0 ? 4 : -4, i === 0 ? -4 : 4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.15 + 0.4 }}
                style={{ width: 5, height: 10, background: "rgba(200,155,60,0.5)", borderRadius: 2, transformOrigin: "top center" }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* NPC speech bubble (right side, no scaleX flip) */}
      <motion.div
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", right: "28%", bottom: 66, background: "rgba(200,155,60,0.12)", border: "1px solid rgba(200,155,60,0.3)", borderRadius: "6px 6px 2px 6px", padding: "3px 8px", whiteSpace: "nowrap", fontSize: 8, color: "rgba(200,155,60,0.9)" }}
      >
        {npcName ? npcName + "..." : "Olá, aventureiro..."}
      </motion.div>

      {/* Floating dots (ellipsis) between figures */}
      {[0, 1, 2].map(i => (
        <motion.div key={i}
          animate={{ opacity: [0, 0.8, 0], y: [0, -6, -12] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 + 0.6 }}
          style={{ position: "absolute", left: `${44 + i * 4}%`, bottom: 50, width: 4, height: 4, borderRadius: "50%", background: "rgba(200,155,60,0.6)" }}
        />
      ))}

      {/* Label */}
      <div style={{ position: "absolute", top: 8, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(180,160,220,0.4)" }}>CONVERSA</span>
      </div>
    </div>
  );
}
