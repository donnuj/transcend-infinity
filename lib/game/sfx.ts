let _sfxVol = 1;

export function syncSfxVolume(vol: number) {
  _sfxVol = vol;
}

function play(src: string, baseVol = 1) {
  if (typeof window === "undefined" || _sfxVol === 0) return;
  const audio = new Audio(src);
  audio.volume = Math.min(1, _sfxVol * baseVol);
  audio.play().catch(() => null);
}

export const sfx = {
  click:   () => play("/audio/click.mp3", 0.4),
  victory: () => play("/audio/victory.mp3", 0.65),
};
