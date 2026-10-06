"use client";

import { motion } from "framer-motion";

const HEROES = [
  { id: "hero_mago",       left: "10%", size: 128, floatDuration: 2.8 },
  { id: "hero_gladiador",  left: "27%", size: 158, floatDuration: 3.1 },
  { id: "hero_curandeiro", left: "46%", size: 118, floatDuration: 2.6 },
];

const ENEMIES = [
  { id: "enemy_boss", right: "6%", size: 170 },
];

export default function GameField({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        height: 200,
        overflow: "hidden",
        background: "linear-gradient(180deg, #0e0820 0%, #06070f 100%)",
        borderBottom: "1px solid rgba(200,155,60,0.07)",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      {/* névoa */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 60% at 25% 110%, rgba(90,50,160,0.2) 0%, transparent 65%), radial-gradient(ellipse 70% 50% at 75% 110%, rgba(180,50,50,0.15) 0%, transparent 65%)",
      }} />

      {/* linha do chão */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 1, pointerEvents: "none",
        background: "linear-gradient(90deg, transparent, rgba(200,155,60,0.2) 50%, transparent)",
      }} />

      {/* heróis — esquerda */}
      {HEROES.map((h) => {
        const w = Math.round(h.size * 2 / 3);
        return (
          <motion.div
            key={h.id}
            style={{
              position: "absolute",
              bottom: 0,
              left: h.left,
              width: w,
              height: h.size,
              transformOrigin: "bottom center",
              mixBlendMode: "screen",
            }}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: h.floatDuration, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/game/characters/sprites/${h.id}.png`}
              alt={h.id}
              width={w}
              height={h.size}
              style={{ display: "block", pointerEvents: "none" }}
            />
          </motion.div>
        );
      })}

      {/* VS */}
      <div style={{
        position: "absolute", left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        color: "rgba(200,155,60,0.4)",
        fontFamily: "var(--font-cinzel)",
        fontSize: 11, fontWeight: 900, letterSpacing: "0.35em",
        pointerEvents: "none",
        textShadow: "0 0 16px rgba(200,155,60,0.2)",
      }}>
        VS
      </div>

      {/* inimigos — direita */}
      {ENEMIES.map((e) => {
        const w = Math.round(e.size * 2 / 3);
        return (
          <motion.div
            key={e.id}
            style={{
              position: "absolute",
              bottom: 0,
              right: e.right,
              width: w,
              height: e.size,
              transformOrigin: "bottom center",
              transform: "scaleX(-1)",
              mixBlendMode: "screen",
            }}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.1, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/assets/game/characters/sprites/${e.id}.png`}
              alt={e.id}
              width={w}
              height={e.size}
              style={{ display: "block", pointerEvents: "none" }}
            />
          </motion.div>
        );
      })}

      {/* CTA */}
      {onClick && (
        <motion.div
          style={{
            position: "absolute", bottom: 10, left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(200,155,60,0.1)",
            border: "1px solid rgba(200,155,60,0.3)",
            borderRadius: 999,
            padding: "3px 14px",
            color: "rgba(200,155,60,0.8)",
            fontFamily: "var(--font-cinzel)",
            fontSize: 9, fontWeight: 900, letterSpacing: "0.25em",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          BATALHAR
        </motion.div>
      )}
    </div>
  );
}
