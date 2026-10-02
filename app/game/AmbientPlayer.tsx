"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game/store";

export default function AmbientPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicVolume = useGameStore((s) => s.save.audio.musicVolume);

  useEffect(() => {
    const audio = new Audio("/audio/ambient.mp3");
    audio.loop = true;
    audio.volume = musicVolume;
    audioRef.current = audio;

    const play = () => audio.play().catch(() => null);
    document.addEventListener("click", play, { once: true });
    document.addEventListener("keydown", play, { once: true });

    return () => {
      document.removeEventListener("click", play);
      document.removeEventListener("keydown", play);
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  return null;
}
