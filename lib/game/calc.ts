import type { PrimaryStats, SecondaryStats, HeroRank, HeroStars, ElementType, HeroLevelSave, HeroProgressionSave } from "./types";

const RANK_MULT: Record<HeroRank, number> = {
  F: 0.6, E: 0.7, D: 0.8, C: 0.9, B: 1.0,
  A: 1.15, S: 1.35, SS: 1.6, SSS: 2.0,
};

const STAR_BONUS: Record<HeroStars, number> = {
  1: 1.00, 2: 1.10, 3: 1.22, 4: 1.37, 5: 1.55,
};

export function deriveStats(
  p: PrimaryStats,
  rank: HeroRank,
  stars: HeroStars,
  level: number,
): SecondaryStats {
  const r = RANK_MULT[rank];
  const s = STAR_BONUS[stars];
  const l = 1 + level * 0.02;
  const t = r * s * l;

  return {
    hp:         (p.VIT * 12 + level * 8) * t,
    mana:       (p.INT * 5 + p.WIS * 3) * t,
    physAtk:    (p.STR * 2.5 + level * 1.2) * t,
    magAtk:     (p.INT * 2.5 + level * 1.2) * t,
    physDef:    (p.STR * 0.4 + p.VIT * 0.6 + level * 0.5) * t,
    magRes:     (p.WIS * 0.5 + p.INT * 0.3 + level * 0.4) * t,
    accuracy:   85 + p.AGI * 0.3,
    evasion:    p.AGI * 0.4,
    critChance: Math.min(Math.max(p.AGI * 0.002 + p.LUK * 0.001, 0.05), 0.5),
    critDamage: 1.5 + p.LUK * 0.005,
    atkSpeed:   1 + p.AGI * 0.005,
    healPower:  (p.WIS * 2 + level * 0.8) * t,
    adminEff:   1 + p.WIS * 0.01 + p.CHA * 0.005,
    prodEff:    1 + p.INT * 0.008 + p.STR * 0.005,
  };
}

export function getStatsAtLevel(
  base: PrimaryStats,
  growth: PrimaryStats,
  level: number,
): PrimaryStats {
  return {
    STR: base.STR + growth.STR * (level - 1),
    AGI: base.AGI + growth.AGI * (level - 1),
    VIT: base.VIT + growth.VIT * (level - 1),
    INT: base.INT + growth.INT * (level - 1),
    WIS: base.WIS + growth.WIS * (level - 1),
    CHA: base.CHA + growth.CHA * (level - 1),
    LUK: base.LUK + growth.LUK * (level - 1),
  };
}

// Ciclo: Fire > Wind > Earth > Water > Fire | Lightning neutro
export function elementMultiplier(attacker: ElementType, defender: ElementType): number {
  if (attacker === "None" || defender === "None" || attacker === "Lightning") return 1;
  const adv: Partial<Record<ElementType, ElementType>> = {
    Fire: "Wind", Wind: "Earth", Earth: "Water", Water: "Fire",
  };
  if (adv[attacker] === defender) return 1.5;
  if (adv[defender] === attacker) return 0.5;
  return 1;
}

// ── Team power & battle time reduction ───────────────────────────────────────

const RANK_MULT_ARR = [0.6, 0.7, 0.8, 0.9, 1.0, 1.15, 1.35, 1.6, 2.0];
const STAR_BONUS_ARR: Record<number, number> = { 1: 1.00, 2: 1.10, 3: 1.22, 4: 1.37, 5: 1.55 };

/** Weighted power score for a team — level × rank_mult × star_bonus, averaged */
export function calcTeamPower(
  heroIds: string[],
  heroLevels: HeroLevelSave[],
  heroProgression: HeroProgressionSave[],
): number {
  if (heroIds.length === 0) return 0;
  let total = 0;
  for (const id of heroIds) {
    const levelSave = heroLevels.find((h) => h.heroId === id);
    const prog = heroProgression.find((h) => h.heroId === id);
    const level = levelSave?.level ?? 1;
    const rankIdx = Math.min(prog?.rank ?? 0, 8);
    const rankMult = RANK_MULT_ARR[rankIdx] ?? 1.0;
    const starBonus = STAR_BONUS_ARR[prog?.stars ?? 1] ?? 1.0;
    total += level * rankMult * starBonus;
  }
  return total / heroIds.length;
}

/**
 * Time multiplier [0.25, 1.0] based on how far the team's power exceeds the
 * content's required level. At 100% power = no reduction; every 2.5% over =
 * 1% faster, capped at 75% reduction.
 */
export function calcBattleTimeMultiplier(teamPower: number, requiredLevel: number): number {
  if (requiredLevel <= 0 || teamPower <= 0) return 1.0;
  const ratio = teamPower / requiredLevel;
  if (ratio <= 1.0) return 1.0;
  const excess = ratio - 1.0;
  const reduction = Math.min(excess * 0.4, 0.75);
  return 1.0 - reduction;
}

export const XP_PER_HERO_LEVEL = (level: number) => 100 + level * 50;
export const XP_PER_INVOCADOR_LEVEL = (level: number) => 100 * level;
export const XP_PER_PLAYER_LEVEL = (level: number) => 200 * level;
export const EXP_PER_PULL = 10;
export const CRISTAIS_POR_SELO = 160;
export const DIAS_LOGIN_PULL_LIVRE = 7;
