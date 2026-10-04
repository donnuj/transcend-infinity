"use client";

import { motion } from "framer-motion";
import { CSSProperties } from "react";

interface Props {
  children: React.ReactNode;
  amplitude?: number;
  period?: number;
  style?: CSSProperties;
  className?: string;
}

export function FloatingIcon({ children, amplitude = 5, period = 2.4, style, className }: Props) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{ duration: period, ease: "easeInOut", repeat: Infinity, repeatType: "loop" }}
    >
      {children}
    </motion.div>
  );
}

interface PulseProps {
  children: React.ReactNode;
  color?: string;
  scale?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

export function PulseGlow({ children, color = "rgba(200,155,60,0.4)", scale = 1.06, duration = 1.8, className, style }: PulseProps) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={{
        filter: [`drop-shadow(0 0 2px transparent)`, `drop-shadow(0 0 8px ${color})`, `drop-shadow(0 0 2px transparent)`],
        scale: [1, scale, 1],
      }}
      transition={{ duration, ease: "easeInOut", repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

interface SelectionProps {
  active?: boolean;
  color?: string;
  children: React.ReactNode;
}

export function SelectionRing({ active, color = "rgb(200,155,60)", children }: SelectionProps) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      {children}
      {active && (
        <>
          <motion.div
            style={{
              position: "absolute",
              inset: -3,
              borderRadius: "50%",
              border: `2px solid ${color}`,
              boxShadow: `0 0 8px ${color}, inset 0 0 4px ${color}40`,
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
          />
          {/* targeting dots */}
          {[0, 90, 180, 270].map((deg) => (
            <motion.div
              key={deg}
              style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: color,
                transform: `rotate(${deg}deg) translateY(-50%)`,
                top: "50%",
                left: "calc(50% - 2px)",
                transformOrigin: "2px calc(50% + 14px)",
                boxShadow: `0 0 4px ${color}`,
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.4, delay: deg / 360 * 1.4, ease: "easeInOut", repeat: Infinity }}
            />
          ))}
        </>
      )}
    </div>
  );
}
