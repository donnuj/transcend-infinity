"use client";

import { motion } from "framer-motion";
import { CSSProperties, useMemo } from "react";

type EffectType = "slash" | "fire" | "magic" | "star" | "heal" | "ice" | "smoke" | "spark";

const EFFECT_CONFIG: Record<EffectType, {
  particles: string[];
  count: [number, number];
  spread: number;
  speed: number;
  size: [number, number];
  color: string;
  blend?: CSSProperties["mixBlendMode"];
}> = {
  slash: {
    particles: ["/assets/game/particles/slash_01.png", "/assets/game/particles/slash_02.png", "/assets/game/particles/slash_03.png", "/assets/game/particles/slash_04.png"],
    count: [2, 4], spread: 40, speed: 0.35, size: [24, 40], color: "rgba(255,240,200,0.9)", blend: "screen",
  },
  fire: {
    particles: ["/assets/game/particles/fire_01.png", "/assets/game/particles/fire_02.png", "/assets/game/particles/flame_01.png", "/assets/game/particles/flame_02.png"],
    count: [4, 7], spread: 30, speed: 0.55, size: [20, 36], color: "rgba(255,160,60,0.85)", blend: "screen",
  },
  magic: {
    particles: ["/assets/game/particles/magic_01.png", "/assets/game/particles/magic_02.png", "/assets/game/particles/magic_03.png", "/assets/game/particles/light_01.png"],
    count: [5, 9], spread: 55, speed: 0.45, size: [18, 32], color: "rgba(180,130,255,0.9)", blend: "screen",
  },
  star: {
    particles: ["/assets/game/particles/star_01.png", "/assets/game/particles/star_02.png", "/assets/game/particles/star_03.png", "/assets/game/particles/star_04.png"],
    count: [6, 10], spread: 70, speed: 0.5, size: [12, 24], color: "rgba(255,230,100,0.9)", blend: "screen",
  },
  heal: {
    particles: ["/assets/game/particles/magic_01.png", "/assets/game/particles/light_01.png", "/assets/game/particles/light_02.png", "/assets/game/particles/star_02.png"],
    count: [5, 8], spread: 45, speed: 0.6, size: [16, 28], color: "rgba(100,230,140,0.9)", blend: "screen",
  },
  ice: {
    particles: ["/assets/game/particles/magic_02.png", "/assets/game/particles/magic_03.png", "/assets/game/particles/spark_01.png"],
    count: [5, 8], spread: 50, speed: 0.4, size: [14, 26], color: "rgba(140,220,255,0.9)", blend: "screen",
  },
  smoke: {
    particles: ["/assets/game/particles/smoke_01.png", "/assets/game/particles/smoke_02.png"],
    count: [3, 5], spread: 35, speed: 0.7, size: [24, 40], color: "rgba(200,200,220,0.5)", blend: "normal",
  },
  spark: {
    particles: ["/assets/game/particles/spark_01.png", "/assets/game/particles/spark_02.png", "/assets/game/particles/spark_03.png", "/assets/game/particles/spark_04.png"],
    count: [6, 10], spread: 60, speed: 0.3, size: [10, 20], color: "rgba(255,220,100,0.95)", blend: "screen",
  },
};

function rng(min: number, max: number) {
  return min + Math.random() * (max - min);
}

interface Particle {
  id: number;
  src: string;
  size: number;
  angle: number;
  dist: number;
  duration: number;
  delay: number;
  rotate: number;
  color: string;
}

interface Props {
  type?: EffectType;
  x?: number | string;
  y?: number | string;
  onDone?: () => void;
  style?: CSSProperties;
}

export function ParticleEffect({ type = "magic", x = 0, y = 0, onDone, style }: Props) {
  const cfg = EFFECT_CONFIG[type];

  const particles = useMemo<Particle[]>(() => {
    const count = Math.round(rng(cfg.count[0], cfg.count[1]));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      src: cfg.particles[Math.floor(rng(0, cfg.particles.length))],
      size: rng(cfg.size[0], cfg.size[1]),
      angle: rng(0, 360),
      dist: rng(cfg.spread * 0.3, cfg.spread),
      duration: rng(cfg.speed * 0.7, cfg.speed * 1.3),
      delay: rng(0, cfg.speed * 0.3),
      rotate: rng(-180, 180),
      color: cfg.color,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  let doneCount = 0;
  function handleDone() {
    doneCount++;
    if (doneCount >= particles.length) onDone?.();
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 150,
        ...style,
      }}
    >
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.dist;
        const ty = Math.sin(rad) * p.dist;

        return (
          <motion.img
            key={p.id}
            src={p.src}
            alt=""
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              left: -p.size / 2,
              top: -p.size / 2,
              pointerEvents: "none",
              mixBlendMode: cfg.blend,
              filter: `brightness(1.2) saturate(1.4) drop-shadow(0 0 4px ${p.color})`,
            }}
            initial={{ opacity: 0.9, x: 0, y: 0, scale: 0.6, rotate: 0 }}
            animate={{
              opacity: [0.9, 0.8, 0],
              x: tx,
              y: ty,
              scale: [0.6, 1.1, 0.5],
              rotate: p.rotate,
            }}
            transition={{ duration: p.duration, delay: p.delay, ease: [0.23, 1, 0.32, 1] }}
            onAnimationComplete={handleDone}
          />
        );
      })}
    </div>
  );
}
