"use client";

import { motion } from "framer-motion";
import { ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  intensity?: number;
  period?: number;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function IdleBreathing({
  children,
  intensity = 0.025,
  period = 3.5,
  active = true,
  className,
  style,
}: Props) {
  if (!active) return <div className={className} style={style}>{children}</div>;

  return (
    <motion.div
      className={className}
      style={style}
      animate={{
        scaleY: [1, 1 + intensity, 1 - intensity * 0.4, 1],
        scaleX: [1, 1 - intensity * 0.5, 1 + intensity * 0.3, 1],
      }}
      transition={{
        duration: period,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
        times: [0, 0.45, 0.75, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

interface HitFlashProps {
  active: boolean;
  children: ReactNode;
  color?: string;
  className?: string;
}

export function HitFlash({ active, children, color = "rgba(255,80,80,0.6)", className }: HitFlashProps) {
  return (
    <motion.div
      className={className}
      animate={active ? {
        filter: [`brightness(1)`, `brightness(3) saturate(0)`, `brightness(1.5)`, `brightness(1)`],
        x: [0, -5, 4, -3, 0],
      } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
