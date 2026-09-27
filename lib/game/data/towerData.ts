import type { GachaRarity, DungeonDifficulty } from "@/lib/game/types";

export type TowerTier = {
  tier: number;
  fromFloor: number;
  toFloor: number;
  minutesPerFloor: number;
  bossMultiplier: number; // boss floor takes this × base time
  label: string;
};

export const TOWER_TIERS: TowerTier[] = [
  { tier: 1, fromFloor: 1,   toFloor: 20,  minutesPerFloor: 3,    bossMultiplier: 3, label: "Planícies da Iniciação" },
  { tier: 2, fromFloor: 21,  toFloor: 40,  minutesPerFloor: 8,    bossMultiplier: 3, label: "Salões da Provação" },
  { tier: 3, fromFloor: 41,  toFloor: 60,  minutesPerFloor: 20,   bossMultiplier: 4, label: "Câmaras do Desafio" },
  { tier: 4, fromFloor: 61,  toFloor: 80,  minutesPerFloor: 45,   bossMultiplier: 4, label: "Abismos do Perigo" },
  { tier: 5, fromFloor: 81,  toFloor: 100, minutesPerFloor: 90,   bossMultiplier: 5, label: "Fortaleza das Sombras" },
  { tier: 6, fromFloor: 101, toFloor: 130, minutesPerFloor: 180,  bossMultiplier: 5, label: "Spire do Crepúsculo" },
  { tier: 7, fromFloor: 131, toFloor: 160, minutesPerFloor: 360,  bossMultiplier: 6, label: "Domínio do Vazio" },
  { tier: 8, fromFloor: 161, toFloor: 190, minutesPerFloor: 480,  bossMultiplier: 6, label: "Pináculo Eterno" },
  { tier: 9, fromFloor: 191, toFloor: 200, minutesPerFloor: 720,  bossMultiplier: 8, label: "Ápice Transcendente" },
];

export function getTierForFloor(floor: number): TowerTier {
  return TOWER_TIERS.find((t) => floor >= t.fromFloor && floor <= t.toFloor) ?? TOWER_TIERS[0];
}

export function isBossFloor(floor: number): boolean {
  return floor % 10 === 0;
}

/** Seconds to clear one floor (boss floors take longer) */
export function floorSeconds(floor: number): number {
  const tier = getTierForFloor(floor);
  const base = tier.minutesPerFloor * 60;
  return isBossFloor(floor) ? base * tier.bossMultiplier : base;
}

/** Total seconds to climb from `fromFloor+1` to `targetFloor` inclusive */
export function calcTowerTimeSeconds(fromFloor: number, targetFloor: number): number {
  let total = 0;
  for (let f = fromFloor + 1; f <= targetFloor; f++) {
    total += floorSeconds(f);
  }
  return total;
}

/** Highest floor reachable within `budgetSeconds` starting from `fromFloor` */
export function maxFloorInBudget(fromFloor: number, budgetSeconds: number): number {
  let remaining = budgetSeconds;
  let floor = fromFloor;
  while (floor < 200) {
    const cost = floorSeconds(floor + 1);
    if (cost > remaining) break;
    remaining -= cost;
    floor++;
  }
  return floor;
}

export const DUNGEON_DURATIONS: Record<string, number> = {
  easy:      15 * 60,
  normal:    60 * 60,
  hard:      4 * 60 * 60,
  epic:      12 * 60 * 60,
  legendary: 24 * 60 * 60,
};

export type TowerFloorReward = {
  xp: number;
  gold: number;
  crystals: number;
  itemChance: number;
  itemRarity: GachaRarity;
};

export function calcTowerRewards(fromFloor: number, toFloor: number): TowerFloorReward {
  const tier = getTierForFloor(toFloor);
  const floors = toFloor - fromFloor;
  const bossBonus = Array.from({ length: floors }, (_, i) => fromFloor + 1 + i)
    .filter(isBossFloor).length;

  const rarities: GachaRarity[] = ["Comum","Incomum","Raro","Épico","Lendário","Mítico","Divino"];
  const rarityIdx = Math.min(tier.tier - 1, rarities.length - 1);

  return {
    xp:         floors * tier.tier * 120 + bossBonus * tier.tier * 500,
    gold:       floors * tier.tier * 80  + bossBonus * tier.tier * 300,
    crystals:   Math.floor(floors * tier.tier * 0.5) + bossBonus * tier.tier * 2,
    itemChance: Math.min(0.15 + tier.tier * 0.08, 0.85),
    itemRarity: rarities[rarityIdx],
  };
}

export type DungeonReward = {
  xp: number;
  gold: number;
  crystals: number;
  itemChance: number;
  itemRarity: GachaRarity;
};

export const DUNGEON_REWARDS: Record<string, DungeonReward> = {
  easy:      { xp: 200,   gold: 150,   crystals: 5,   itemChance: 0.30, itemRarity: "Comum"    },
  normal:    { xp: 800,   gold: 600,   crystals: 20,  itemChance: 0.45, itemRarity: "Incomum"  },
  hard:      { xp: 3000,  gold: 2500,  crystals: 80,  itemChance: 0.60, itemRarity: "Raro"     },
  epic:      { xp: 10000, gold: 8000,  crystals: 250, itemChance: 0.75, itemRarity: "Épico"    },
  legendary: { xp: 30000, gold: 25000, crystals: 800, itemChance: 0.90, itemRarity: "Lendário" },
};

// ── Loot tables ───────────────────────────────────────────────────────────────

type LootEntry = { itemId: string; weight: number };

const LOOT_BY_DIFFICULTY: Record<DungeonDifficulty, LootEntry[]> = {
  easy:      [{ itemId: "pocao_cura_p", weight: 50 }, { itemId: "couro_lobo", weight: 30 }, { itemId: "cristal_mana", weight: 20 }],
  normal:    [{ itemId: "pocao_cura_m", weight: 35 }, { itemId: "gema_comum", weight: 30 }, { itemId: "cristal_mana", weight: 25 }, { itemId: "essencia_skill", weight: 10 }],
  hard:      [{ itemId: "pocao_cura_g", weight: 25 }, { itemId: "gema_rara", weight: 30 }, { itemId: "cristal_evolucao", weight: 30 }, { itemId: "essencia_skill", weight: 15 }],
  epic:      [{ itemId: "cristal_evolucao", weight: 35 }, { itemId: "pedra_ascensao", weight: 25 }, { itemId: "gema_rara", weight: 25 }, { itemId: "essencia_skill", weight: 15 }],
  legendary: [{ itemId: "pedra_ascensao", weight: 35 }, { itemId: "fragmento_lendario", weight: 30 }, { itemId: "cristal_evolucao", weight: 20 }, { itemId: "essencia_skill", weight: 15 }],
};

const LOOT_BY_TOWER_TIER: LootEntry[][] = [
  [{ itemId: "pocao_cura_p", weight: 60 }, { itemId: "couro_lobo", weight: 40 }],
  [{ itemId: "pocao_cura_m", weight: 50 }, { itemId: "cristal_mana", weight: 50 }],
  [{ itemId: "gema_comum", weight: 50 }, { itemId: "cristal_mana", weight: 50 }],
  [{ itemId: "gema_rara", weight: 40 }, { itemId: "cristal_evolucao", weight: 60 }],
  [{ itemId: "cristal_evolucao", weight: 50 }, { itemId: "essencia_skill", weight: 50 }],
  [{ itemId: "cristal_evolucao", weight: 40 }, { itemId: "pedra_ascensao", weight: 30 }, { itemId: "essencia_skill", weight: 30 }],
  [{ itemId: "pedra_ascensao", weight: 50 }, { itemId: "fragmento_lendario", weight: 50 }],
  [{ itemId: "fragmento_lendario", weight: 50 }, { itemId: "pedra_ascensao", weight: 50 }],
  [{ itemId: "fragmento_lendario", weight: 60 }, { itemId: "tomo_ancestral", weight: 40 }],
];

function rollLoot(table: LootEntry[]): string {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const entry of table) {
    r -= entry.weight;
    if (r <= 0) return entry.itemId;
  }
  return table[0].itemId;
}

export function rollDungeonLoot(difficulty: DungeonDifficulty, dropMult = 1): { itemId: string; qty: number } | null {
  const rewards = DUNGEON_REWARDS[difficulty];
  if (Math.random() > rewards.itemChance * dropMult) return null;
  return { itemId: rollLoot(LOOT_BY_DIFFICULTY[difficulty]), qty: 1 };
}

export function rollTowerLoot(toFloor: number, dropMult = 1, itemChance: number): { itemId: string; qty: number } | null {
  if (Math.random() > itemChance * dropMult) return null;
  const tier = getTierForFloor(toFloor);
  const table = LOOT_BY_TOWER_TIER[tier.tier - 1] ?? LOOT_BY_TOWER_TIER[0];
  return { itemId: rollLoot(table), qty: 1 };
}
