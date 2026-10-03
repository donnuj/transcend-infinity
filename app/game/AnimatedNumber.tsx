"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export default function AnimatedNumber({
  value,
  format,
}: {
  value: number;
  format?: (v: number) => string;
}) {
  const spring = useSpring(value, { stiffness: 80, damping: 18, restDelta: 0.5 });
  const display = useTransform(spring, (v) =>
    format ? format(Math.round(v)) : Math.round(v).toLocaleString("pt-BR")
  );

  useEffect(() => { spring.set(value); }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}
