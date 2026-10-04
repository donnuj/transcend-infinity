import { BannerDef, GachaRarity } from './banners.data';

export interface RollResult {
  heroId: string;
  rarity: GachaRarity;
  wasPity: boolean;
}

export function rollBanner(banner: BannerDef, pityCount: number): RollResult {
  const legendRarities: GachaRarity[] = ['Lendário', 'Mítico', 'Divino'];

  if (pityCount >= banner.pityThreshold) {
    const legendPool = banner.pool.filter((e) => legendRarities.includes(e.rarity));
    if (legendPool.length) {
      const picked = legendPool[Math.floor(Math.random() * legendPool.length)]!;
      return { heroId: picked.heroId, rarity: picked.rarity, wasPity: true };
    }
  }

  const softMult =
    pityCount >= banner.softPityStart
      ? 1 + (pityCount - banner.softPityStart) * 0.05
      : 1;

  let totalWeight = 0;
  for (const e of banner.pool) {
    const isLegend = legendRarities.includes(e.rarity);
    totalWeight += isLegend ? e.weight * softMult : e.weight;
  }

  let roll = Math.random() * totalWeight;
  for (const e of banner.pool) {
    const isLegend = legendRarities.includes(e.rarity);
    const w = isLegend ? e.weight * softMult : e.weight;
    roll -= w;
    if (roll <= 0) return { heroId: e.heroId, rarity: e.rarity, wasPity: false };
  }

  const last = banner.pool[banner.pool.length - 1]!;
  return { heroId: last.heroId, rarity: last.rarity, wasPity: false };
}
