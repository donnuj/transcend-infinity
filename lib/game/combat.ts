import type { PrimaryStats, SecondaryStats, ElementType, HeroDef } from "./types";
import { deriveStats, getStatsAtLevel, elementMultiplier } from "./calc";
import type { DungeonDef } from "./types";

export type CombatantSnapshot = {
  id: string;
  name: string;
  portrait: string;
  isHero: boolean;
  heroId?: string;
  element: ElementType;
  maxHp: number;
  maxMana: number;
  hp: number;
  mana: number;
  stats: SecondaryStats;
  skillIds: string[];
};

export type BattleEvent = {
  tick: number;
  actorId: string;
  targetId: string;
  skillId: string;
  skillName: string;
  value: number;
  type: "damage" | "heal" | "miss";
  isCrit: boolean;
  killedTarget: boolean;
};

export type BattleResult = {
  won: boolean;
  events: BattleEvent[];
  survivors: string[];
  ticksElapsed: number;
  rank: "" | "D" | "C" | "B" | "A" | "S" | "SS";
  xpReward: number;
  ouroReward: number;
  itemDrops: { itemId: string; qty: number }[];
};

const ENEMY_PORTRAITS = ["👹","👺","💀","🐉","👻","🦂","🕷","🐺"];

function enemyStats(level: number, element: ElementType, isBoss: boolean): Omit<CombatantSnapshot, "id" | "name" | "portrait"> {
  const mult = isBoss ? 2.2 : 1;
  const base: PrimaryStats = {
    STR: 8 + level * 2, AGI: 6 + level, VIT: 10 + level * 2,
    INT: 6 + level, WIS: 5 + level, CHA: 3, LUK: 5 + level,
  };
  const stats = deriveStats(base, "B", 1, level);
  return {
    isHero: false,
    element,
    maxHp: Math.round(stats.hp * mult),
    maxMana: Math.round(stats.mana),
    hp: Math.round(stats.hp * mult),
    mana: Math.round(stats.mana),
    stats,
    skillIds: ["enemy_basic"],
  };
}

export function buildHeroCombatant(
  hero: HeroDef,
  rank: number,
  stars: 1|2|3|4|5,
  level: number,
  forgeBonus: number = 0, // total forge enhancement levels across equipped items
  companionAtkMult: number = 1,
): CombatantSnapshot {
  const RANKS = ["F","E","D","C","B","A","S","SS","SSS"] as const;
  const r = RANKS[rank] ?? "F";
  const primary = getStatsAtLevel(hero.baseStats, hero.growthPerLevel, level);
  const stats = deriveStats(primary, r, stars, level);
  // Each forge level adds 5% to attack stats
  const forgeMult = 1 + forgeBonus * 0.05;
  return {
    id: hero.heroId,
    heroId: hero.heroId,
    name: hero.name.split(",")[0],
    portrait: hero.portrait,
    isHero: true,
    element: hero.element,
    maxHp: Math.round(stats.hp),
    maxMana: Math.round(stats.mana),
    hp: Math.round(stats.hp),
    mana: Math.round(stats.mana),
    stats: {
      ...stats,
      physAtk: Math.round(stats.physAtk * forgeMult * companionAtkMult),
      magAtk: Math.round(stats.magAtk * forgeMult * companionAtkMult),
    },
    skillIds: hero.skillIds,
  };
}

export function buildEnemyWave(dungeon: DungeonDef, wave: number): CombatantSnapshot[] {
  const count = wave < dungeon.stages ? 2 : 3;
  const elem = dungeon.element ?? "None";
  const lvl = dungeon.recommendedLevel + wave * 2;
  return Array.from({ length: count }, (_, i) => {
    const isBoss = i === count - 1 && wave === dungeon.stages;
    const id = `enemy_w${wave}_${i}`;
    const base = enemyStats(lvl, elem, isBoss);
    return {
      id,
      name: isBoss ? `${dungeon.name} — Chefe` : `Inimigo ${wave}-${i + 1}`,
      portrait: ENEMY_PORTRAITS[(wave * 3 + i) % ENEMY_PORTRAITS.length],
      ...base,
    };
  });
}

function pickTarget(actors: CombatantSnapshot[], isHero: boolean): CombatantSnapshot | null {
  const enemies = actors.filter((a) => a.isHero !== isHero && a.hp > 0);
  if (enemies.length === 0) return null;
  return enemies[Math.floor(Math.random() * enemies.length)];
}

function takeTurn(
  actor: CombatantSnapshot,
  all: CombatantSnapshot[],
  tick: number,
): BattleEvent | null {
  const target = pickTarget(all, actor.isHero);
  if (!target) return null;

  const miss = Math.random() > (actor.stats.accuracy / 100);
  if (miss) {
    return { tick, actorId: actor.id, targetId: target.id, skillId: "basic", skillName: "Ataque", value: 0, type: "miss", isCrit: false, killedTarget: false };
  }

  const isHealSkill = false;
  const baseDmg = actor.isHero ? actor.stats.physAtk : actor.stats.physAtk;
  const elemMult = elementMultiplier(actor.element, target.element);
  const crit = Math.random() < actor.stats.critChance;
  const critMult = crit ? actor.stats.critDamage : 1;
  const variance = 0.85 + Math.random() * 0.3;
  const damage = Math.max(1, Math.round(baseDmg * elemMult * critMult * variance - target.stats.physDef * 0.5));

  target.hp = Math.max(0, target.hp - damage);

  return {
    tick,
    actorId: actor.id,
    targetId: target.id,
    skillId: "basic",
    skillName: "Ataque",
    value: damage,
    type: "damage",
    isCrit: crit,
    killedTarget: target.hp === 0,
  };
}

export function simulateBattle(
  heroes: CombatantSnapshot[],
  enemies: CombatantSnapshot[],
  maxTicks = 100,
): BattleResult {
  const all = [...heroes.map((h) => ({ ...h })), ...enemies.map((e) => ({ ...e }))];
  const events: BattleEvent[] = [];

  for (let tick = 0; tick < maxTicks; tick++) {
    const alive = all.filter((c) => c.hp > 0);
    const heroesAlive = alive.filter((c) => c.isHero);
    const enemiesAlive = alive.filter((c) => !c.isHero);
    if (heroesAlive.length === 0 || enemiesAlive.length === 0) break;

    const orderedBySpeed = alive.sort((a, b) => b.stats.atkSpeed - a.stats.atkSpeed);
    for (const actor of orderedBySpeed) {
      if (actor.hp <= 0) continue;
      const h = all.filter((c) => c.isHero && c.hp > 0);
      const e = all.filter((c) => !c.isHero && c.hp > 0);
      if (h.length === 0 || e.length === 0) break;

      const event = takeTurn(actor, all, tick);
      if (event) events.push(event);
    }
  }

  const heroSurvivors = all.filter((c) => c.isHero && c.hp > 0).map((c) => c.id);
  const won = heroSurvivors.length > 0;

  const ticksElapsed = events.length > 0 ? events[events.length - 1].tick + 1 : 0;
  const rank = won
    ? heroSurvivors.length === heroes.length
      ? ticksElapsed < 10 ? "SS" : ticksElapsed < 20 ? "S" : ticksElapsed < 35 ? "A" : "B"
      : ticksElapsed < 40 ? "C" : "D"
    : "";

  return {
    won,
    events,
    survivors: heroSurvivors,
    ticksElapsed,
    rank,
    xpReward: won ? 50 + ticksElapsed * 2 : 10,
    ouroReward: won ? 100 + ticksElapsed * 5 : 20,
    itemDrops: won && Math.random() > 0.5
      ? [{ itemId: "cristal_evolucao", qty: 1 }]
      : [],
  };
}
