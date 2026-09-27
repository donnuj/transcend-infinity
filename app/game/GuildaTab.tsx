"use client";

import { motion } from "framer-motion";

const ease = [0.23, 1, 0.32, 1] as const;

export default function GuildaTab() {
  return (
    <motion.div
      className="flex h-full flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      <span className="mb-4 text-5xl" style={{ color: "rgba(122,111,160,0.3)" }}>⚜</span>
      <h3
        className="mb-2 text-lg font-black tracking-[0.15em] text-cream/50"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        GUILDS
      </h3>
      <p className="text-[11px] tracking-wider text-violet/35">Em desenvolvimento</p>
    </motion.div>
  );
}
