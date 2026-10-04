"use client";

import { useRef, useEffect, CSSProperties } from "react";

export interface SpriteSheetMeta {
  frameWidth: number;
  frameHeight: number;
  columns: number;
  rows: number;
  scale?: number;
}

export interface AnimationDef {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
}

interface Props {
  src: string;
  meta: SpriteSheetMeta;
  animation: AnimationDef;
  playing?: boolean;
  className?: string;
  style?: CSSProperties;
  onComplete?: () => void;
  pixelated?: boolean;
}

export function SpriteSheet({
  src,
  meta,
  animation,
  playing = true,
  className,
  style,
  onComplete,
  pixelated = true,
}: Props) {
  const scale = meta.scale ?? 1;
  const w = meta.frameWidth * scale;
  const h = meta.frameHeight * scale;
  const frame = useRef(0);
  const elapsed = useRef(0);
  const raf = useRef<number>(0);
  const prev = useRef<number | null>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    frame.current = 0;
    elapsed.current = 0;
    prev.current = null;

    if (!playing || animation.frames <= 1) {
      if (divRef.current) {
        const x = -frame.current * w;
        const y = -animation.row * h;
        divRef.current.style.backgroundPosition = `${x}px ${y}px`;
      }
      return;
    }

    const interval = 1000 / animation.fps;

    function tick(ts: number) {
      if (prev.current === null) prev.current = ts;
      elapsed.current += ts - prev.current;
      prev.current = ts;

      if (elapsed.current >= interval) {
        elapsed.current -= interval;
        frame.current += 1;

        if (frame.current >= animation.frames) {
          if (!animation.loop) {
            frame.current = animation.frames - 1;
            onComplete?.();
            return;
          }
          frame.current = 0;
        }

        if (divRef.current) {
          const x = -frame.current * w;
          const y = -animation.row * h;
          divRef.current.style.backgroundPosition = `${x}px ${y}px`;
        }
      }

      raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [src, animation, playing, w, h, onComplete]);

  const sheetW = meta.frameWidth * meta.columns * scale;
  const sheetH = meta.frameHeight * meta.rows * scale;

  const initX = 0;
  const initY = -animation.row * h;

  return (
    <div
      ref={divRef}
      className={className}
      style={{
        width: w,
        height: h,
        backgroundImage: `url(${src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${sheetW}px ${sheetH}px`,
        backgroundPosition: `${initX}px ${initY}px`,
        imageRendering: pixelated ? "pixelated" : "auto",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
