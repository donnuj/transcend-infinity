import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SaveData } from "./types";

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
    inventory: [],
    equipmentInventory: [],
    runeInventory: [],
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
  addHeroXp: (heroId: string, xp: number) => void;
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

  // Cloud sync
  setCloudSynced: (synced: boolean, at?: string) => void;

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
        set((s) => { (s.save.wallet[type] as number) += amount; });
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

      equipItem(heroId, slot, equipId) {
        set((s) => {
          let entry = s.save.heroEquipment.find((h) => h.heroId === heroId);
          if (!entry) {
            s.save.heroEquipment.push({ heroId });
            entry = s.save.heroEquipment[s.save.heroEquipment.length - 1];
          }
          (entry as Record<string, string>)[slot] = equipId;
        });
      },

      equipRune(heroId, slot, runeId) {
        set((s) => {
          let entry = s.save.heroRunes.find((h) => h.heroId === heroId);
          if (!entry) {
            s.save.heroRunes.push({ heroId });
            entry = s.save.heroRunes[s.save.heroRunes.length - 1];
          }
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
        set((s) => {
          const pl = s.save.playerLevel;
          pl.xp += xp;
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

      // ── Cloud sync ───────────────────────────────────────────────────────────

      setCloudSynced(synced, at) {
        set((s) => {
          s.cloudSynced = synced;
          if (at) s.lastSyncAt = at;
        });
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
