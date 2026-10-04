"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useEffect } from "react";

interface Props {
  active: boolean;
  intensity?: number;
  duration?: number;
  children: ReactNode;
  className?: string;
}

export function ScreenShake({ active, intensity = 6, duration = 350, children, className }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 800, damping: 15 });
  const sy = useSpring(y, { stiffness: 800, damping: 15 });

  useEffect(() => {
    if (!active) return;
    let t = 0;
    const step = 40;
    const frames = Math.ceil(duration / step);

    function shake(i: number) {
      if (i >= frames) { x.set(0); y.set(0); return; }
      const decay = 1 - i / frames;
      x.set((Math.random() - 0.5) * 2 * intensity * decay);
      y.set((Math.random() - 0.5) * 2 * intensity * decay);
      t = window.setTimeout(() => shake(i + 1), step);
    }

    shake(0);
    return () => clearTimeout(t);
  }, [active, intensity, duration, x, y]);

  return (
    <motion.div style={{ x: sx, y: sy }} className={className}>
      {children}
    </motion.div>
  );
}
