"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export type SpriteAnim = "idle" | "attack" | "hit" | "dead";

const CLASS_SPRITE: Record<string, string> = {
  Espadachim: "hero_espadachim",
  Guarda:     "hero_guarda",
  Gladiador:  "hero_gladiador",
  Arqueiro:   "hero_arqueiro",
  Cacador:    "hero_cacador",
  Curandeiro: "hero_curandeiro",
  Mago:       "hero_mago",
  Bruxo:      "hero_bruxo",
  Alquimista: "hero_alquimista",
  Ferreiro:   "hero_ferreiro",
};

export function classSpriteId(heroClass: string): string {
  return CLASS_SPRITE[heroClass] ?? "hero_mago";
}

export default function SpriteCharacter({
  spriteId,
  animation = "idle",
  size = 180,
  flip = false,
  className,
  style,
  onAnimationEnd,
}: {
  spriteId: string;
  animation?: SpriteAnim;
  size?: number;
  flip?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onAnimationEnd?: () => void;
}) {
  const [error, setError] = useState(false);
  const w = Math.round(size * (2 / 3));
  const src = `/assets/game/characters/sprites/${spriteId}.png`;
  const dir = flip ? -1 : 1;

  if (error) return <div style={{ width: w, height: size }} />;

  return (
    <div
      className={className}
      style={{
        width: w,
        height: size,
        transform: flip ? "scaleX(-1)" : undefined,
        mixBlendMode: "screen",
        ...style,
      }}
    >
      <motion.div
        style={{ width: w, height: size, transformOrigin: "bottom center" }}
        /* idle: float suave via prop direta — sem useAnimation */
        animate={animation === "idle" ? { y: [0, -7, 0] } : undefined}
        transition={animation === "idle" ? {
          duration: 2.8,
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop",
        } : undefined}
        /* attack */
        {...(animation === "attack" && {
          animate: { x: [0, dir * 30, 0], scale: [1, 1.1, 1] },
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as number[], times: [0, 0.45, 1] },
          onAnimationComplete: onAnimationEnd,
        })}
        /* hit */
        {...(animation === "hit" && {
          animate: { x: [0, -dir * 14, 0], filter: ["brightness(1)", "brightness(10) saturate(0)", "brightness(1)"] },
          transition: { duration: 0.3, ease: "easeOut" },
          onAnimationComplete: onAnimationEnd,
        })}
        /* dead */
        {...(animation === "dead" && {
          initial: { rotate: 0, opacity: 1 },
          animate: { rotate: dir * 90, opacity: 0, y: size * 0.25 },
          transition: { duration: 0.6 },
          onAnimationComplete: onAnimationEnd,
        })}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={spriteId}
          width={w}
          height={size}
          draggable={false}
          onError={() => setError(true)}
          style={{ display: "block", userSelect: "none", pointerEvents: "none" }}
        />
      </motion.div>
    </div>
  );
}
