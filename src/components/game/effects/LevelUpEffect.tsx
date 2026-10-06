"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  show: boolean;
  onDone?: () => void;
}

// Precomputed at module load to avoid Math.random() during render
const PRESET_STARS = Array.from({ length: 20 }, () => ({
  dist: 55 + Math.random() * 35,
  size: 4 + Math.random() * 6,
  dur: 0.7 + Math.random() * 0.3,
  delay: Math.random() * 0.15,
}));

function StarBurst({ count = 10 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * 360;
        const { dist, size, dur, delay } = PRESET_STARS[i];
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              background: i % 3 === 0 ? "rgb(255,230,80)" : i % 3 === 1 ? "rgb(200,255,160)" : "rgb(255,180,240)",
              boxShadow: `0 0 6px currentColor`,
              left: "50%",
              top: "50%",
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: Math.cos(rad) * dist,
              y: Math.sin(rad) * dist,
              scale: [0, 1.3, 0],
              opacity: [1, 0.9, 0],
            }}
            transition={{ duration: dur, ease: [0.23, 1, 0.32, 1], delay }}
          />
        );
      })}
    </>
  );
}

export function LevelUpEffect({ show, onDone }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!show) { setMounted(false); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const t = setTimeout(() => { setMounted(false); onDone?.(); }, 1400);
    return () => clearTimeout(t);
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 200 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div style={{ position: "relative", width: 1, height: 1 }}>
            <StarBurst count={14} />

            {/* ring burst */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                style={{
                  position: "absolute",
                  width: 60 + i * 30,
                  height: 60 + i * 30,
                  borderRadius: "50%",
                  border: "2px solid rgba(255,230,80,0.7)",
                  left: "50%",
                  top: "50%",
                  marginLeft: -(60 + i * 30) / 2,
                  marginTop: -(60 + i * 30) / 2,
                }}
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: [0.3, 1.2, 1.5], opacity: [0, 0.9, 0] }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
              />
            ))}

            {/* label */}
            <motion.div
              style={{
                position: "absolute",
                top: -52,
                left: "50%",
                transform: "translateX(-50%)",
                color: "rgb(255,240,130)",
                fontWeight: 900,
                fontSize: 15,
                letterSpacing: "0.2em",
                whiteSpace: "nowrap",
                textShadow: "0 0 16px rgba(255,220,60,0.8), 0 2px 4px rgba(0,0,0,0.8)",
                fontFamily: "var(--font-cinzel, serif)",
              }}
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], y: [8, 0, -10, -22], scale: [0.8, 1.1, 1.0, 0.9] }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
            >
              LEVEL UP!
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
