import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SaveData, DungeonDifficulty, PendingTowerClimb, PendingDungeonRun } from "./types";
import { ACHIEVEMENTS } from "./data/achievements";
import { DAILY_CHALLENGES } from "./data/challenges";
import { maxFloorInBudget, calcTowerTimeSeconds, DUNGEON_DURATIONS } from "./data/towerData";
import { COMPANION_MAP } from "./data/companions";
import { FACTIONS } from "./data/world";

// ── Estado inicial (novo jogador) ─────────────────────────────────────────────

export function newSave(): SaveData {
  return {
    version: "1.0",
    savedAt: new Date().toISOString(),
    wallet: {
      cristaisAstra: 0,
      selosDeInvocacao: 10,
      ouro: 500,
      selosLivres: 0,
      moedasDeEvento: 0,
      loginStreak: 0,
      lastLoginDate: "",
    },
    invocador: { level: 1, totalPulls: 0, experience: 0 },
    bannerPity: [],
    collectedHeroIds: [],
    fragmentos: [],
    heroProgression: [],
    heroSkills: [],
    heroLevels: [],
    heroEquipment: [],
    heroRunes: [],
    inventory: [
      { itemId: "pocao_cura_p",     qty: 5 },
      { itemId: "cristal_evolucao", qty: 3 },
      { itemId: "pedra_ascensao",   qty: 1 },
    ],
    equipmentInventory: [
      "espada_ferro","espada_ferro","espada_ferro","espada_ferro",
      "arco_caçador","arco_caçador","arco_caçador",
      "cajado_iniciante","cajado_iniciante","cajado_iniciante",
      "armadura_couro","armadura_couro","armadura_couro","armadura_couro","armadura_couro",
      "armadura_couro","armadura_couro","armadura_couro","armadura_couro","armadura_couro",
      "anel_forca","anel_forca","anel_forca","anel_forca","anel_forca",
      "anel_forca","anel_forca","anel_forca","anel_forca","anel_forca",
    ],
    runeInventory: ["runa_forca","runa_sorte"],
    dungeon: [],
    travel: { unlockedDestinationIds: ["reg_valdris"], hasHorse: false, hasShip: false },
    reputation: [],
    achievements: { unlockedIds: [], progress: [] },
    codex: { discoveredIds: [] },
    companions: [],
    activeCompanionId: "",
    dailyChallenges: { lastReset: "", completed: [], progress: [] },
    loginBonus: { dayInCycle: 1, cycle: 1, claimedToday: false, lastClaimDate: "" },
    karma: { value: 0, nonRepeatableDone: [] },
    tower: { bestFloor: 0, weeklyBest: 0, weekStart: "" },
    arena: { rating: 1000, wins: 0, losses: 0, weekStart: "" },
    caravan: { activeRouteId: "", investedGold: 0, inTransit: false, arrivalTime: "" },
    housing: { houseLevel: 0, unlockedRooms: [] },
    bossHunt: { weekStart: "", weeklyDefeated: [], allTimeKills: [] },
    battlePass: { xp: 0, level: 1, isPremium: false, claimedFree: [], claimedPremium: [] },
    guildAdvanced: { specialization: 0, treasury: 0, completedMissions: [], completedResearch: [], buildings: [] },
    profession: { chosenProfession: "", xp: 0, craftedRecipeIds: [] },
    season: { seasonId: 1, xp: 0, level: 1, claimedLevels: [] },
    playerLevel: { xp: 0, level: 1 },
    dialogue: { seenDialogues: [], choiceHistory: [] },
    worldMap: { currentRegionId: "reg_valdris", discoveredRegions: ["reg_valdris"], discoveredPois: [] },
    npcState: { gameHour: 8, instances: [] },
    alchemy: { stationLevel: 1 },
    fortress: {
      fortressName: "Nova Ordem",
      reputation: 0,
      population: 10,
      resources: [
        { key: "Food",  value: 200 },
        { key: "Wood",  value: 100 },
        { key: "Stone", value: 30  },
        { key: "Herbs", value: 30  },
        { key: "Morale",value: 50  },
      ],
      buildings: [],
    },
    audio: { musicVolume: 0.7, sfxVolume: 1.0 },
    forge: [],
    professionTasks: { lastReset: "", completedToday: [] },
    offline: { lastActiveAt: new Date().toISOString() },
    pendingTower: null,
    pendingDungeons: [],
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

type GameStore = {
  save: SaveData;
  cloudSynced: boolean;
  lastSyncAt: string;

  // Wallet
  addCurrency: (type: keyof SaveData["wallet"], amount: number) => void;
  spendCurrency: (type: keyof SaveData["wallet"], amount: number) => boolean;

  // Gacha
  getPity: (bannerId: string) => number;
  setPity: (bannerId: string, count: number) => void;
  addCollectedHero: (bannerId: string, heroId: string) => void;
  hasHero: (bannerId: string, heroId: string) => boolean;
  addFragmento: (heroId: string, amount: number) => void;
  registerPull: () => void;

  // Hero Progression
  getHeroProgression: (heroId: string) => SaveData["heroProgression"][0];
  getHeroLevel: (heroId: string) => SaveData["heroLevels"][0];
  getHeroSkills: (heroId: string) => SaveData["heroSkills"][0];
  getHeroEquipment: (heroId: string) => SaveData["heroEquipment"][0];
  getHeroRunes: (heroId: string) => SaveData["heroRunes"][0];
  getFragmentos: (heroId: string) => number;
  addHeroXp: (heroId: string, xp: number) => void;
  useXpItem: (heroId: string) => boolean;
  ascendHero: (heroId: string) => boolean;
  rankUpHero: (heroId: string) => boolean;
  upgradeHeroStars: (heroId: string) => boolean;
  awakenHero: (heroId: string) => boolean;
  upgradeHeroSkill: (heroId: string, skillId: string) => boolean;
  equipItem: (heroId: string, slot: "weaponId" | "armorId" | "accessoryId" | "reliquiaId", equipId: string) => void;
  equipRune: (heroId: string, slot: "slot0" | "slot1", runeId: string) => void;

  // Inventory
  addItem: (itemId: string, qty: number, origin?: string) => void;
  removeItem: (itemId: string, qty: number) => boolean;
  getItemQty: (itemId: string) => number;
  addEquipment: (equipId: string) => void;
  addRune: (runeId: string) => void;

  // World
  discoverRegion: (regionId: string) => void;
  discoverPoi: (poiId: string) => void;

  // Player level
  addPlayerXp: (xp: number) => void;

  // Reputation
  addReputation: (factionId: string, points: number) => void;
  getReputation: (factionId: string) => number;

  // Daily login
  processLogin: () => void;

  // Dungeon
  updateDungeonProgress: (dungeonId: string, rank: string, timeSeconds: number) => void;

  // Tower
  updateTower: (floor: number) => void;
  dispatchTowerClimb: (heroIds: string[], targetFloor: number) => boolean;
  resolveTowerClimb: () => PendingTowerClimb | null;
  cancelTowerClimb: () => void;

  // Dungeon dispatch
  dispatchDungeonRun: (dungeonId: string, heroIds: string[], difficulty: DungeonDifficulty) => string | null;
  resolveDungeonRun: (runId: string) => PendingDungeonRun | null;
  cancelDungeonRun: (runId: string) => void;

  // Busy heroes (dispatched to tower or dungeon)
  getBusyHeroIds: () => string[];

  // Cloud sync
  setCloudSynced: (synced: boolean, at?: string) => void;

  // Daily Challenges
  resetDailyChallengesIfNeeded: () => void;
  incrementDailyProgress: (key: string, amount?: number) => void;
  claimDailyReward: (challengeId: string) => boolean;
  getDailyProgress: (key: string) => number;

  // Achievements
  checkAchievements: () => string[];

  // Companions
  collectCompanion: (id: string) => void;
  addCompanionBond: (id: string, amount: number) => void;
  evolveCompanion: (id: string) => boolean;
  setActiveCompanion: (id: string) => void;
  getCompanion: (id: string) => SaveData["companions"][0] | undefined;

  // Forge
  getForgeLevel: (equipId: string) => number;
  forgeEnhance: (equipId: string) => boolean;

  // Profession
  chooseProfession: (profId: string) => void;
  addProfessionXp: (amount: number) => void;
  completeProfessionTask: (taskId: string) => boolean;
  getProfessionLevel: () => number;

  // Offline
  collectOfflineRewards: () => { ouro: number; xp: number } | null;
  pingLastActive: () => void;

  // Bonus helpers (companion + forge + faction + housing)
  getCompanionBonuses: () => { xpMult: number; atkMult: number; crystalMult: number; dropMult: number; ouroMult: number };
  getHeroBonuses: (heroId: string) => { forgeBonus: number; atkMult: number };
  getFactionBonuses: () => { ouroMult: number; crystalMult: number; xpMult: number; caravanMult: number };
  getHousingBonuses: () => { xpMult: number; dropMult: number };

  // Reset (debug)
  resetSave: () => void;
};

const CURRENCY_KEYS = new Set<keyof SaveData["wallet"]>([
  "cristaisAstra","selosDeInvocacao","ouro","selosLivres","moedasDeEvento",
]);

export const useGameStore = create<GameStore>()(
  persist(
    immer((set, get) => ({
      save: newSave(),
      cloudSynced: false,
      lastSyncAt: "",

      // ── Wallet ──────────────────────────────────────────────────────────────

      addCurrency(type, amount) {
        if (!CURRENCY_KEYS.has(type) || amount <= 0) return;
        let final = amount;
        if (type === "cristaisAstra") {
          const cb = get().getCompanionBonuses();
          const fb = get().getFactionBonuses();
          final = Math.round(amount * cb.crystalMult * fb.crystalMult);
        } else if (type === "ouro") {
          const cb = get().getCompanionBonuses();
          const fb = get().getFactionBonuses();
          final = Math.round(amount * cb.ouroMult * fb.ouroMult);
        }
        set((s) => { (s.save.wallet[type] as number) += final; });
      },

      spendCurrency(type, amount) {
        if (!CURRENCY_KEYS.has(type)) return false;
        const have = get().save.wallet[type] as number;
        if (have < amount) return false;
        set((s) => { (s.save.wallet[type] as number) -= amount; });
        return true;
      },

      // ── Gacha ───────────────────────────────────────────────────────────────

      getPity(bannerId) {
        return get().save.bannerPity.find((p) => p.bannerId === bannerId)?.pullCount ?? 0;
      },

      setPity(bannerId, count) {
        set((s) => {
          const idx = s.save.bannerPity.findIndex((p) => p.bannerId === bannerId);
          if (idx >= 0) s.save.bannerPity[idx].pullCount = count;
          else s.save.bannerPity.push({ bannerId, pullCount: count });
        });
      },

      addCollectedHero(bannerId, heroId) {
        const key = `${bannerId}|${heroId}`;
        set((s) => {
          if (!s.save.collectedHeroIds.includes(key))
            s.save.collectedHeroIds.push(key);
        });
      },

      hasHero(bannerId, heroId) {
        return get().save.collectedHeroIds.includes(`${bannerId}|${heroId}`);
      },

      addFragmento(heroId, amount) {
        set((s) => {
          const idx = s.save.fragmentos.findIndex((f) => f.heroId === heroId);
          if (idx >= 0) s.save.fragmentos[idx].count += amount;
          else s.save.fragmentos.push({ heroId, count: amount });
        });
      },

      registerPull() {
        set((s) => {
          const inv = s.save.invocador;
          inv.totalPulls++;
          inv.experience += 10;
          const threshold = 100 * inv.level;
          while (inv.experience >= threshold) {
            inv.experience -= threshold;
            inv.level++;
          }
        });
      },

      // ── Hero ────────────────────────────────────────────────────────────────

      getHeroProgression(heroId) {
        return get().save.heroProgression.find((h) => h.heroId === heroId) ?? {
          heroId, rank: 0, stars: 1, awakenLevel: 0, protectionStacks: 0,
        };
      },

      getHeroLevel(heroId) {
        return get().save.heroLevels.find((h) => h.heroId === heroId) ?? {
          heroId, level: 1, xp: 0, tier: 0, talentPath: -1,
        };
      },

      getHeroSkills(heroId) {
        return get().save.heroSkills.find((h) => h.heroId === heroId) ?? {
          heroId, skillLevels: [],
        };
      },

      getHeroEquipment(heroId) {
        return get().save.heroEquipment.find((h) => h.heroId === heroId) ?? { heroId };
      },

      getHeroRunes(heroId) {
        return get().save.heroRunes.find((h) => h.heroId === heroId) ?? { heroId };
      },

      getFragmentos(heroId) {
        return get().save.fragmentos.find((f) => f.heroId === heroId)?.count ?? 0;
      },

      addHeroXp(heroId, xp) {
        set((s) => {
          let entry = s.save.heroLevels.find((h) => h.heroId === heroId);
          if (!entry) {
            s.save.heroLevels.push({ heroId, level: 1, xp: 0, tier: 0, talentPath: -1 });
            entry = s.save.heroLevels[s.save.heroLevels.length - 1];
          }
          entry.xp += xp;
          const threshold = 100 + entry.level * 50;
          while (entry.xp >= threshold) {
            entry.xp -= threshold;
            entry.level++;
          }
        });
      },

      useXpItem(heroId) {
        const CRISTAL_XP = 500;
        const qty = get().getItemQty("cristal_evolucao");
        if (qty < 1) return false;
        get().removeItem("cristal_evolucao", 1);
        get().addHeroXp(heroId, CRISTAL_XP);
        return true;
      },

      ascendHero(heroId) {
        const TIER_MAX_LEVEL = [20, 30, 40, 50, 60, 70];
        const pedras = get().getItemQty("pedra_ascensao");
        if (pedras < 1) return false;
        const lvl = get().getHeroLevel(heroId);
        if (lvl.tier >= 5) return false;
        const maxAtTier = TIER_MAX_LEVEL[lvl.tier];
        if (lvl.level < maxAtTier) return false;
        get().removeItem("pedra_ascensao", 1);
        set((s) => {
          let entry = s.save.heroLevels.find((h) => h.heroId === heroId);
          if (!entry) { s.save.heroLevels.push({ heroId, level: 1, xp: 0, tier: 0, talentPath: -1 }); entry = s.save.heroLevels[s.save.heroLevels.length - 1]; }
          entry.tier = (entry.tier + 1) as typeof entry.tier;
        });
        return true;
      },

      rankUpHero(heroId) {
        const RANK_FRAG_COST = [10, 20, 30, 40, 50, 60];
        const prog = get().getHeroProgression(heroId);
        if (prog.rank >= 6) return false;
        const cost = RANK_FRAG_COST[prog.rank];
        const frags = get().getFragmentos(heroId);
        if (frags < cost) return false;
        set((s) => {
          const fIdx = s.save.fragmentos.findIndex((f) => f.heroId === heroId);
          if (fIdx >= 0) s.save.fragmentos[fIdx].count -= cost;
          let p = s.save.heroProgression.find((h) => h.heroId === heroId);
          if (!p) { s.save.heroProgression.push({ heroId, rank: 0, stars: 1, awakenLevel: 0, protectionStacks: 0 }); p = s.save.heroProgression[s.save.heroProgression.length - 1]; }
          p.rank = (p.rank + 1) as typeof p.rank;
        });
        return true;
      },

      upgradeHeroStars(heroId) {
        const STAR_FRAG_COST = [5, 10, 15, 20];
        const prog = get().getHeroProgression(heroId);
        if (prog.stars >= 5) return false;
        const cost = STAR_FRAG_COST[prog.stars - 1];
        const frags = get().getFragmentos(heroId);
        if (frags < cost) return false;
        set((s) => {
          const fIdx = s.save.fragmentos.findIndex((f) => f.heroId === heroId);
          if (fIdx >= 0) s.save.fragmentos[fIdx].count -= cost;
          let p = s.save.heroProgression.find((h) => h.heroId === heroId);
          if (!p) { s.save.heroProgression.push({ heroId, rank: 0, stars: 1, awakenLevel: 0, protectionStacks: 0 }); p = s.save.heroProgression[s.save.heroProgression.length - 1]; }
          p.stars = (p.stars + 1) as typeof p.stars;
        });
        return true;
      },

      awakenHero(heroId) {
        const AWAKEN_FRAG_COST = [20, 40, 60, 80, 100];
        const prog = get().getHeroProgression(heroId);
        if (prog.awakenLevel >= 5) return false;
        const cost = AWAKEN_FRAG_COST[prog.awakenLevel];
        const frags = get().getFragmentos(heroId);
        if (frags < cost) return false;
        set((s) => {
          const fIdx = s.save.fragmentos.findIndex((f) => f.heroId === heroId);
          if (fIdx >= 0) s.save.fragmentos[fIdx].count -= cost;
          let p = s.save.heroProgression.find((h) => h.heroId === heroId);
          if (!p) { s.save.heroProgression.push({ heroId, rank: 0, stars: 1, awakenLevel: 0, protectionStacks: 0 }); p = s.save.heroProgression[s.save.heroProgression.length - 1]; }
          p.awakenLevel++;
        });
        return true;
      },

      upgradeHeroSkill(heroId, skillId) {
        const SKILL_OURO_COST = (lvl: number) => 100 * lvl;
        const MAX_SKILL_LEVEL = 5;
        const skills = get().getHeroSkills(heroId);
        const current = skills.skillLevels.find((sl) => sl.skillId === skillId)?.level ?? 1;
        if (current >= MAX_SKILL_LEVEL) return false;
        const cost = SKILL_OURO_COST(current);
        const ouro = get().save.wallet.ouro;
        if (ouro < cost) return false;
        set((s) => {
          s.save.wallet.ouro -= cost;
          let sk = s.save.heroSkills.find((h) => h.heroId === heroId);
          if (!sk) { s.save.heroSkills.push({ heroId, skillLevels: [] }); sk = s.save.heroSkills[s.save.heroSkills.length - 1]; }
          const slIdx = sk.skillLevels.findIndex((sl) => sl.skillId === skillId);
          if (slIdx >= 0) sk.skillLevels[slIdx].level++;
          else sk.skillLevels.push({ skillId, level: 2 });
        });
        return true;
      },

      equipItem(heroId, slot, equipId) {
        set((s) => {
          const idx = s.save.equipmentInventory.indexOf(equipId);
          if (idx === -1) return;
          s.save.equipmentInventory.splice(idx, 1);

          let entry = s.save.heroEquipment.find((h) => h.heroId === heroId);
          if (!entry) {
            s.save.heroEquipment.push({ heroId });
            entry = s.save.heroEquipment[s.save.heroEquipment.length - 1];
          }
          const prev = (entry as Record<string, string | undefined>)[slot];
          if (prev) s.save.equipmentInventory.push(prev);
          (entry as Record<string, string>)[slot] = equipId;
        });
      },

      equipRune(heroId, slot, runeId) {
        set((s) => {
          const idx = s.save.runeInventory.indexOf(runeId);
          if (idx === -1) return;
          s.save.runeInventory.splice(idx, 1);

          let entry = s.save.heroRunes.find((h) => h.heroId === heroId);
          if (!entry) {
            s.save.heroRunes.push({ heroId });
            entry = s.save.heroRunes[s.save.heroRunes.length - 1];
          }
          const prev = (entry as Record<string, string | undefined>)[slot];
          if (prev) s.save.runeInventory.push(prev);
          (entry as Record<string, string>)[slot] = runeId;
        });
      },

      // ── Inventory ───────────────────────────────────────────────────────────

      addItem(itemId, qty, origin) {
        set((s) => {
          const entry = s.save.inventory.find((i) => i.itemId === itemId);
          if (entry) entry.qty += qty;
          else s.save.inventory.push({ itemId, qty, origin });
        });
      },

      removeItem(itemId, qty) {
        const have = get().getItemQty(itemId);
        if (have < qty) return false;
        set((s) => {
          const entry = s.save.inventory.find((i) => i.itemId === itemId);
          if (!entry) return;
          entry.qty -= qty;
          if (entry.qty <= 0)
            s.save.inventory = s.save.inventory.filter((i) => i.itemId !== itemId);
        });
        return true;
      },

      getItemQty(itemId) {
        return get().save.inventory.find((i) => i.itemId === itemId)?.qty ?? 0;
      },

      addEquipment(equipId) {
        set((s) => { s.save.equipmentInventory.push(equipId); });
      },

      addRune(runeId) {
        set((s) => { s.save.runeInventory.push(runeId); });
      },

      // ── World ────────────────────────────────────────────────────────────────

      discoverRegion(regionId) {
        set((s) => {
          if (!s.save.worldMap.discoveredRegions.includes(regionId))
            s.save.worldMap.discoveredRegions.push(regionId);
        });
      },

      discoverPoi(poiId) {
        set((s) => {
          if (!s.save.worldMap.discoveredPois.includes(poiId))
            s.save.worldMap.discoveredPois.push(poiId);
        });
      },

      // ── Player Level ─────────────────────────────────────────────────────────

      addPlayerXp(xp) {
        const cb = get().getCompanionBonuses();
        const fb = get().getFactionBonuses();
        const hb = get().getHousingBonuses();
        const final = Math.round(xp * cb.xpMult * fb.xpMult * hb.xpMult);
        set((s) => {
          const pl = s.save.playerLevel;
          pl.xp += final;
          const threshold = 200 * pl.level;
          while (pl.xp >= threshold) {
            pl.xp -= threshold;
            pl.level++;
          }
        });
      },

      // ── Reputation ───────────────────────────────────────────────────────────

      addReputation(factionId, points) {
        set((s) => {
          const entry = s.save.reputation.find((r) => r.factionId === factionId);
          if (entry) entry.points += points;
          else s.save.reputation.push({ factionId, points });
        });
      },

      getReputation(factionId) {
        return get().save.reputation.find((r) => r.factionId === factionId)?.points ?? 0;
      },

      // ── Daily Login ──────────────────────────────────────────────────────────

      processLogin() {
        set((s) => {
          const today = new Date().toISOString().split("T")[0];
          const w = s.save.wallet;
          if (w.lastLoginDate === today) return;
          const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          const consecutive = w.lastLoginDate === yesterday;
          w.loginStreak = consecutive ? w.loginStreak + 1 : 1;
          w.lastLoginDate = today;
          if (w.loginStreak % 7 === 0) w.selosLivres += 1;

          // Jardim produces 10 Herbs per day
          if (s.save.housing.unlockedRooms.includes("jardim")) {
            const herb = s.save.fortress.resources.find((r) => r.key === "Herbs");
            if (herb) herb.value += 10;
          }
        });
      },

      // ── Dungeon ──────────────────────────────────────────────────────────────

      updateDungeonProgress(dungeonId, rank, timeSeconds) {
        const RANKS = ["", "D", "C", "B", "A", "S", "SS"];
        set((s) => {
          let entry = s.save.dungeon.find((d) => d.dungeonId === dungeonId);
          if (!entry) {
            s.save.dungeon.push({ dungeonId, bestRank: "", bestTimeSeconds: 0, totalRuns: 0 });
            entry = s.save.dungeon[s.save.dungeon.length - 1];
          }
          entry.totalRuns++;
          if (RANKS.indexOf(rank) > RANKS.indexOf(entry.bestRank)) entry.bestRank = rank as "D"|"C"|"B"|"A"|"S"|"SS";
          if (entry.bestTimeSeconds === 0 || timeSeconds < entry.bestTimeSeconds) entry.bestTimeSeconds = timeSeconds;
        });
      },

      // ── Tower ────────────────────────────────────────────────────────────────

      updateTower(floor) {
        set((s) => {
          if (floor > s.save.tower.bestFloor) s.save.tower.bestFloor = floor;
          if (floor > s.save.tower.weeklyBest) s.save.tower.weeklyBest = floor;
        });
      },

      dispatchTowerClimb(heroIds, targetFloor) {
        const state = get();
        if (state.save.pendingTower) return false;
        const busy = state.getBusyHeroIds();
        if (heroIds.some((id) => busy.includes(id))) return false;
        const fromFloor = state.save.tower.bestFloor;
        if (targetFloor <= fromFloor) return false;

        const seconds = calcTowerTimeSeconds(fromFloor, targetFloor);
        const now = new Date();
        const endTime = new Date(now.getTime() + seconds * 1000);

        set((s) => {
          s.save.pendingTower = {
            heroIds,
            fromFloor,
            targetFloor,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
          };
        });
        return true;
      },

      resolveTowerClimb() {
        const pending = get().save.pendingTower;
        if (!pending) return null;
        if (new Date() < new Date(pending.endTime)) return null;
        set((s) => {
          const floor = s.save.pendingTower!.targetFloor;
          if (floor > s.save.tower.bestFloor) s.save.tower.bestFloor = floor;
          if (floor > s.save.tower.weeklyBest) s.save.tower.weeklyBest = floor;
          s.save.pendingTower = null;
        });
        return pending;
      },

      cancelTowerClimb() {
        set((s) => { s.save.pendingTower = null; });
      },

      dispatchDungeonRun(dungeonId, heroIds, difficulty) {
        const state = get();
        const busy = state.getBusyHeroIds();
        if (heroIds.some((id) => busy.includes(id))) return null;
        const seconds = DUNGEON_DURATIONS[difficulty];
        const now = new Date();
        const runId = `${dungeonId}_${now.getTime()}`;
        const endTime = new Date(now.getTime() + seconds * 1000);
        set((s) => {
          s.save.pendingDungeons.push({
            runId,
            dungeonId,
            heroIds,
            difficulty,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
          });
        });
        return runId;
      },

      resolveDungeonRun(runId) {
        const run = get().save.pendingDungeons.find((r) => r.runId === runId);
        if (!run) return null;
        if (new Date() < new Date(run.endTime)) return null;
        set((s) => {
          s.save.pendingDungeons = s.save.pendingDungeons.filter((r) => r.runId !== runId);
        });
        return run;
      },

      cancelDungeonRun(runId) {
        set((s) => {
          s.save.pendingDungeons = s.save.pendingDungeons.filter((r) => r.runId !== runId);
        });
      },

      getBusyHeroIds() {
        const { pendingTower, pendingDungeons } = get().save;
        const ids: string[] = [];
        if (pendingTower) ids.push(...pendingTower.heroIds);
        for (const run of pendingDungeons) ids.push(...run.heroIds);
        return ids;
      },

      // ── Cloud sync ───────────────────────────────────────────────────────────

      setCloudSynced(synced, at) {
        set((s) => {
          s.cloudSynced = synced;
          if (at) s.lastSyncAt = at;
        });
      },

      // ── Daily Challenges ─────────────────────────────────────────────────────

      resetDailyChallengesIfNeeded() {
        const today = new Date().toISOString().split("T")[0];
        if (get().save.dailyChallenges.lastReset !== today) {
          set((s) => {
            s.save.dailyChallenges.lastReset = today;
            s.save.dailyChallenges.completed = [];
            s.save.dailyChallenges.progress = [];
          });
        }
      },

      incrementDailyProgress(key, amount = 1) {
        get().resetDailyChallengesIfNeeded();
        set((s) => {
          const entry = s.save.dailyChallenges.progress.find((p) => p.key === key);
          if (entry) entry.value += amount;
          else s.save.dailyChallenges.progress.push({ key, value: amount });
        });
      },

      claimDailyReward(challengeId) {
        get().resetDailyChallengesIfNeeded();
        const dc = get().save.dailyChallenges;
        if (dc.completed.includes(challengeId)) return false;
        const def = DAILY_CHALLENGES.find((c) => c.id === challengeId);
        if (!def) return false;
        const progress = dc.progress.find((p) => p.key === def.progressKey)?.value ?? 0;
        if (progress < def.target) return false;
        if (def.rewardType === "playerXp") {
          get().addPlayerXp(def.rewardAmount);
        } else {
          get().addCurrency(def.rewardType, def.rewardAmount);
        }
        set((s) => { s.save.dailyChallenges.completed.push(challengeId); });
        return true;
      },

      getDailyProgress(key) {
        get().resetDailyChallengesIfNeeded();
        return get().save.dailyChallenges.progress.find((p) => p.key === key)?.value ?? 0;
      },

      // ── Achievements ─────────────────────────────────────────────────────────

      checkAchievements() {
        const save = get().save;
        const newUnlocks: string[] = [];
        for (const ach of ACHIEVEMENTS) {
          if (!save.achievements.unlockedIds.includes(ach.id) && ach.check(save)) {
            newUnlocks.push(ach.id);
          }
        }
        if (newUnlocks.length > 0) {
          set((s) => {
            s.save.achievements.unlockedIds.push(...newUnlocks);
          });
        }
        return newUnlocks;
      },

      // ── Companions ───────────────────────────────────────────────────────────

      collectCompanion(id) {
        set((s) => {
          if (!s.save.companions.find((c) => c.companionId === id))
            s.save.companions.push({ companionId: id, bond: 0, form: 0, isActive: false });
        });
      },

      addCompanionBond(id, amount) {
        set((s) => {
          const c = s.save.companions.find((c) => c.companionId === id);
          if (c) c.bond = Math.min(100, c.bond + amount);
        });
      },

      evolveCompanion(id) {
        const c = get().save.companions.find((c) => c.companionId === id);
        if (!c) return false;
        set((s) => {
          const entry = s.save.companions.find((c) => c.companionId === id);
          if (entry) entry.form += 1;
        });
        return true;
      },

      setActiveCompanion(id) {
        set((s) => {
          s.save.activeCompanionId = id;
          for (const c of s.save.companions) c.isActive = c.companionId === id;
        });
      },

      getCompanion(id) {
        return get().save.companions.find((c) => c.companionId === id);
      },

      // ── Forge ────────────────────────────────────────────────────────────────

      getForgeLevel(equipId) {
        return get().save.forge.find((f) => f.equipId === equipId)?.level ?? 0;
      },

      forgeEnhance(equipId) {
        const FORGE_COSTS = [200, 400, 800, 1500, 2500, 4000, 6000, 9000, 13000, 18000];
        const current = get().getForgeLevel(equipId);
        if (current >= 10) return false;
        const cost = FORGE_COSTS[current];
        if (!get().spendCurrency("ouro", cost)) return false;
        set((s) => {
          const entry = s.save.forge.find((f) => f.equipId === equipId);
          if (entry) entry.level++;
          else s.save.forge.push({ equipId, level: 1 });
        });
        return true;
      },

      // ── Profession ───────────────────────────────────────────────────────────

      getProfessionLevel() {
        const xp = get().save.profession.xp;
        return Math.floor(Math.sqrt(xp / 50)) + 1;
      },

      chooseProfession(profId) {
        set((s) => { s.save.profession.chosenProfession = profId; });
      },

      addProfessionXp(amount) {
        set((s) => { s.save.profession.xp += amount; });
      },

      completeProfessionTask(taskId) {
        const today = new Date().toISOString().split("T")[0];
        const tasks = get().save.professionTasks;
        if (tasks.lastReset !== today) {
          set((s) => { s.save.professionTasks = { lastReset: today, completedToday: [] }; });
        }
        if (get().save.professionTasks.completedToday.includes(taskId)) return false;
        set((s) => { s.save.professionTasks.completedToday.push(taskId); });
        get().addProfessionXp(80);
        return true;
      },

      // ── Offline ──────────────────────────────────────────────────────────────

      collectOfflineRewards() {
        const lastActive = get().save.offline?.lastActiveAt;
        if (!lastActive) {
          get().pingLastActive();
          return null;
        }
        const elapsed = Math.min(Date.now() - new Date(lastActive).getTime(), 8 * 3600 * 1000);
        if (elapsed < 5 * 60 * 1000) {
          get().pingLastActive();
          return null;
        }
        const level = get().save.playerLevel.level;
        const hoursAway = elapsed / 3600000;
        const ouro = Math.floor((level * 12 + 20) * hoursAway);
        const xp = Math.floor((level * 5 + 10) * hoursAway);
        get().addCurrency("ouro", ouro);
        get().addPlayerXp(xp);
        get().pingLastActive();
        return { ouro, xp };
      },

      pingLastActive() {
        set((s) => { s.save.offline = { lastActiveAt: new Date().toISOString() }; });
      },

      // ── Bonus helpers ────────────────────────────────────────────────────────

      getCompanionBonuses() {
        const { activeCompanionId, companions } = get().save;
        const comp = companions.find((c) => c.companionId === activeCompanionId);
        if (!comp) return { xpMult: 1, atkMult: 1, crystalMult: 1, dropMult: 1, ouroMult: 1 };
        const def = COMPANION_MAP[comp.companionId];
        if (!def) return { xpMult: 1, atkMult: 1, crystalMult: 1, dropMult: 1, ouroMult: 1 };
        const form = def.forms[comp.form] ?? def.forms[0];
        const bonus = form.bonus;
        let xpMult = 1, atkMult = 1, crystalMult = 1, dropMult = 1, ouroMult = 1;
        const pct = (str: string) => { const m = str.match(/\+(\d+)%/); return m ? 1 + Number(m[1]) / 100 : 1; };
        if (bonus.includes("EXP"))    xpMult      = pct(bonus);
        if (bonus.includes("ATQ"))    atkMult     = pct(bonus);
        if (bonus.includes("cristais") || bonus.includes("drops cristais")) crystalMult = pct(bonus);
        if (bonus.includes("drop rate")) dropMult = pct(bonus);
        if (bonus.includes("ouro"))   ouroMult    = pct(bonus);
        return { xpMult, atkMult, crystalMult, dropMult, ouroMult };
      },

      getHeroBonuses(heroId) {
        const { heroEquipment, forge } = get().save;
        const equip = heroEquipment.find((h) => h.heroId === heroId);
        if (!equip) return { forgeBonus: 0, atkMult: get().getCompanionBonuses().atkMult };
        const slots = [equip.weaponId, equip.armorId, equip.accessoryId, equip.reliquiaId].filter(Boolean) as string[];
        const forgeBonus = slots.reduce((sum, equipId) => {
          return sum + (forge.find((f) => f.equipId === equipId)?.level ?? 0);
        }, 0);
        return { forgeBonus, atkMult: get().getCompanionBonuses().atkMult };
      },

      getFactionBonuses() {
        const reputation = get().save.reputation;
        let ouroMult = 1, crystalMult = 1, xpMult = 1, caravanMult = 1;
        for (const entry of reputation) {
          const pts = entry.points;
          if (entry.factionId === "fac_mercadores") {
            if (pts >= 2000) ouroMult = Math.max(ouroMult, 1.20);
            else if (pts >= 100) caravanMult = Math.max(caravanMult, 1.05);
          }
          if (entry.factionId === "fac_arcontes") {
            if (pts >= 200) crystalMult = Math.max(crystalMult, 1.05);
          }
          if (entry.factionId === "fac_ordem_imperial") {
            if (pts >= 2000) xpMult = Math.max(xpMult, 1.15);
          }
        }
        return { ouroMult, crystalMult, xpMult, caravanMult };
      },

      getHousingBonuses() {
        const rooms = get().save.housing.unlockedRooms;
        const xpMult = rooms.includes("biblioteca") ? 1.05 : 1;
        const dropMult = rooms.includes("observatorio") ? 1.03 : 1;
        return { xpMult, dropMult };
      },

      // ── Reset ────────────────────────────────────────────────────────────────

      resetSave() {
        set((s) => { s.save = newSave(); s.cloudSynced = false; });
      },
    })),
    {
      name: "ti_game_save",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (state) => ({ save: state.save }),
    },
  ),
);
