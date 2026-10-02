"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game/store";
import { syncSfxVolume } from "@/lib/game/sfx";

export default function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicVolume = useGameStore((s) => s.save.audio.musicVolume);
  const sfxVolume = useGameStore((s) => s.save.audio.sfxVolume);

  // Keep sfx module in sync with store
  useEffect(() => { syncSfxVolume(sfxVolume); }, [sfxVolume]);

  useEffect(() => {
    const audio = new Audio("/audio/ambient.mp3");
    audio.loop = true;
    audio.volume = useGameStore.getState().save.audio.musicVolume;
    audioRef.current = audio;

    let cleanup: (() => void) | null = null;

    // Try autoplay immediately; browsers with autoplay policy will reject —
    // fall back to first user gesture in that case
    audio.play().catch(() => {
      const play = () => audio.play().catch(() => null);
      document.addEventListener("click", play, { once: true });
      document.addEventListener("keydown", play, { once: true });
      cleanup = () => {
        document.removeEventListener("click", play);
        document.removeEventListener("keydown", play);
      };
    });

    return () => {
      cleanup?.();
      audio.pause();
      audio.src = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume changes from settings
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  return null;
}
