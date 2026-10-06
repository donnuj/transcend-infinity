"use client";

import { useState, useMemo, CSSProperties } from "react";
import { SpriteSheet, AnimationDef, SpriteSheetMeta } from "./SpriteSheet";

export type CharacterState =
  | "idle" | "walk" | "run" | "attack" | "attack_2"
  | "cast" | "hit" | "block" | "dodge" | "death" | "interact";

type AnimationMap = Partial<Record<CharacterState, AnimationDef>>;

interface Props {
  src: string;
  meta: SpriteSheetMeta;
  animations: AnimationMap;
  state?: CharacterState;
  playing?: boolean;
  className?: string;
  style?: CSSProperties;
  onStateComplete?: (state: CharacterState) => void;
  fallbackSrc?: string;
}

const FALLBACK_CHAIN: Record<CharacterState, CharacterState[]> = {
  idle:      [],
  walk:      ["idle"],
  run:       ["walk", "idle"],
  attack:    ["idle"],
  attack_2:  ["attack", "idle"],
  cast:      ["attack", "idle"],
  hit:       ["idle"],
  block:     ["idle"],
  dodge:     ["idle"],
  death:     ["idle"],
  interact:  ["idle"],
};

export function CharacterSprite({
  src,
  meta,
  animations,
  state = "idle",
  playing = true,
  className,
  style,
  onStateComplete,
  fallbackSrc,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const resolved = useMemo<CharacterState>(() => {
    if (animations[state]) return state;
    const chain = FALLBACK_CHAIN[state] ?? [];
    return (chain.find((s) => animations[s]) ?? "idle") as CharacterState;
  }, [state, animations]);

  const anim = animations[resolved];

  if (imgError && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt=""
        className={className}
        style={{ imageRendering: "pixelated", ...style }}
      />
    );
  }

  if (!anim) return null;

  return (
    <SpriteSheet
      src={src}
      meta={meta}
      animation={anim}
      playing={playing}
      className={className}
      style={style}
      onComplete={() => onStateComplete?.(resolved)}
    />
  );
}
