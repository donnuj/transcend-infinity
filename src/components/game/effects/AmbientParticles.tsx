"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  drift: number;
  color: string;
}

const COLORS = [
  "rgba(200,155,60,",   // amber
  "rgba(170,130,255,",  // violet
  "rgba(90,150,255,",   // blue
  "rgba(255,255,200,",  // white-gold
  "rgba(180,110,255,",  // purple
];

export function AmbientParticles({ count = 38 }: { count?: number }) {
  const particles = useMemo<Particle[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      opacity: 0.12 + Math.random() * 0.28,
      duration: 8 + Math.random() * 14,
      delay: -Math.random() * 20,
      drift: (Math.random() - 0.5) * 60,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }))
  , [count]);

  return (
    <div
      aria-hidden
      style={{
        position: "absolute", inset: 0,
        overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            bottom: "-4px",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: `${p.color}${p.opacity})`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}${p.opacity * 0.8})`,
          }}
          animate={{
            y: [0, -(window?.innerHeight ?? 800) - 20],
            x: [0, p.drift],
            opacity: [0, p.opacity, p.opacity, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.1, 0.85, 1],
          }}
        />
      ))}

      {/* Static radial glow blobs */}
      <div style={{
        position: "absolute", width: "60%", height: "40%",
        left: "20%", top: "10%",
        background: "radial-gradient(ellipse at center, rgba(200,155,60,0.03) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: "40%", height: "50%",
        left: "-10%", bottom: "20%",
        background: "radial-gradient(ellipse at center, rgba(90,130,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", width: "35%", height: "45%",
        right: "-5%", top: "30%",
        background: "radial-gradient(ellipse at center, rgba(170,100,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
