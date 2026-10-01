// ── Enums ──────────────────────────────────────────────────────────────────────

export type GachaRarity = "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário" | "Mítico" | "Divino";

export type ElementType = "None" | "Fire" | "Wind" | "Earth" | "Water" | "Lightning" | "Light" | "Dark";

export type HeroClass =
  | "Espadachim" | "Guarda" | "Gladiador" | "Arqueiro" | "Caçador"
  | "Curandeiro" | "Ferreiro" | "Alquimista" | "Mago" | "Bruxo";

export type HeroRole = "DPS" | "Tank" | "Healer" | "Support" | "Utility";

export type HeroRank = "F" | "E" | "D" | "C" | "B" | "A" | "S" | "SS" | "SSS";

export type HeroStars = 1 | 2 | 3 | 4 | 5;

export type AscensionTier = 0 | 1 | 2 | 3 | 4 | 5;

export type SkillType = "Basic" | "Active" | "Ultimate" | "Passive";
export type SkillEffectType = "Damage" | "Heal" | "Shield" | "Buff" | "Debuff" | "Revive";
export type SkillTargetType = "SingleEnemy" | "AllEnemies" | "Self" | "SingleAlly" | "AllAllies";

export type CurrencyType =
  | "CristaisAstra" | "SelosDeInvocacao" | "Ouro" | "SelosLivres" | "MoedasDeEvento";

export type ItemCategory =
  | "Consumiveis" | "Materiais" | "Equipamentos" | "Reliquias" | "Chave" | "Especial";

export type ItemRarity = "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário" | "Mítico" | "Ancestral";

export type BiomeType = "Floresta" | "Deserto" | "Neve" | "Mar" | "Montanha" | "Planície" | "Pântano" | "Vulcão";

export type ResourceType = "Food" | "Wood" | "Stone" | "Herbs" | "Morale";

export type GachaInvocationType = "Herois" | "Equipamentos" | "Itens";

export type HeroProgressionRank = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// ── Primary & Secondary Stats ─────────────────────────────────────────────────

export type PrimaryStats = {
  STR: number; // Força   — dano físico, construção
  AGI: number; // Agilidade — esquiva, velocidade, crítico
  VIT: number; // Vitalidade — HP, resistência
  INT: number; // Inteligência — magia, pesquisa
  WIS: number; // Sabedoria — cura, mana, administração
  CHA: number; // Carisma — liderança, diplomacia
  LUK: number; // Sorte — loot, gacha, críticos
};

export type SecondaryStats = {
  hp: number;
  mana: number;
  physAtk: number;
  magAtk: number;
  physDef: number;
  magRes: number;
  accuracy: number;
  evasion: number;
  critChance: number;
  critDamage: number;
  atkSpeed: number;
  healPower: number;
  adminEff: number;
  prodEff: number;
};

// ── Static Definitions (game data, never saved) ───────────────────────────────

export type SkillDef = {
  skillId: string;
  name: string;
  description: string;
  type: SkillType;
  effectType: SkillEffectType;
  targetType: SkillTargetType;
  element: ElementType;
  cooldown: number;
  manaCost: number;
  damageMult: number;
  healMult: number;
  powerContrib: number;
};

export type HeroDef = {
  heroId: string;
  name: string;
  lore: string;
  rarity: GachaRarity;
  heroClass: HeroClass;
  role: HeroRole;
  element: ElementType;
  baseStats: PrimaryStats;
  growthPerLevel: PrimaryStats;
  leadership: number;
  affinities: { barracks: number; library: number; hospital: number; workshop: number; laboratory: number };
  skillIds: string[]; // [basic, active, ultimate, passive]
  portrait: string;   // emoji ou asset id futuro
};

export type BannerPoolEntry = {
  heroId: string;
  rarity: GachaRarity;
  weight: number;
};

export type BannerDef = {
  bannerId: string;
  name: string;
  lore: string;
  invocationType: GachaInvocationType;
  startDate?: string; // ISO — vazio = sem limite
  endDate?: string;
  isLimited: boolean;
  pityThreshold: number;  // hard pity
  softPityStart: number;
  pool: BannerPoolEntry[];
};

export type ItemDef = {
  itemId: string;
  name: string;
  description: string;
  category: ItemCategory;
  rarity: ItemRarity;
  baseValue: number;
  stackable: boolean;
  maxStack: number;
};

export type EquipmentSlot = "weapon" | "armor" | "accessory" | "reliquia";

export type EquipmentDef = {
  equipId: string;
  name: string;
  description: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  statBonus: Partial<PrimaryStats>;
  element?: ElementType;
  requiredLevel: number;
};

export type RuneDef = {
  runeId: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  statBonus: Partial<PrimaryStats>;
  element?: ElementType;
};

export type RegionDef = {
  regionId: string;
  name: string;
  biome: BiomeType;
  description: string;
  level: number;        // nível recomendado
  discoveredByDefault: boolean;
  pois: PoiDef[];
};

export type PoiDef = {
  poiId: string;
  name: string;
  type: "dungeon" | "npc" | "market" | "boss" | "event";
};

export type NpcDef = {
  npcId: string;
  name: string;
  role: string;
  regionId: string;
  portraitEmoji: string;
  dialogueRootId: string;
};

export type DialogueDef = {
  dialogueId: string;
  text: string;
  speaker: string;
  choices?: { label: string; nextId?: string; condition?: string }[];
};

export type QuestDef = {
  questId: string;
  title: string;
  description: string;
  type: "main" | "side" | "daily";
  objectives: { key: string; description: string; target: number }[];
  rewards: { type: CurrencyType | "item"; id?: string; amount: number }[];
  prerequisiteIds: string[];
};

export type FactionDef = {
  factionId: string;
  name: string;
  description: string;
  emoji: string;
  tiers: { label: string; minPoints: number; bonus: string }[];
};

export type DungeonDef = {
  dungeonId: string;
  name: string;
  description: string;
  regionId: string;
  recommendedLevel: number;
  stages: number;
  lootTableId: string;
  element?: ElementType;
};

export type BuildingDef = {
  buildingId: string;
  name: string;
  category: "production" | "military" | "research" | "housing" | "special";
  description: string;
  maxLevel: number;
  resourceCosts: { level: number; costs: Partial<Record<ResourceType, number>>; goldCost: number }[];
  production?: { resource: ResourceType; perHour: number }[]; // por nível
};

// ── Save Data (persisted) ─────────────────────────────────────────────────────

export type WalletSave = {
  cristaisAstra: number;
  selosDeInvocacao: number;
  ouro: number;
  selosLivres: number;
  moedasDeEvento: number;
  loginStreak: number;
  lastLoginDate: string; // ISO
};

export type InvocadorSave = {
  level: number;
  totalPulls: number;
  experience: number;
};

export type BannerPitySave = {
  bannerId: string;
  pullCount: number;
};

export type MemoriaFragmentoSave = {
  heroId: string;
  count: number;
};

export type HeroProgressionSave = {
  heroId: string;
  rank: HeroProgressionRank;
  stars: HeroStars;
  awakenLevel: number;    // 0–5
  protectionStacks: number;
};

export type HeroSkillsSave = {
  heroId: string;
  skillLevels: { skillId: string; level: number }[];
};

export type HeroLevelSave = {
  heroId: string;
  level: number;
  xp: number;
  tier: AscensionTier;
  talentPath: number; // -1 = não escolhido
};

export type HeroEquipmentSave = {
  heroId: string;
  weaponId?: string;
  armorId?: string;
  accessoryId?: string;
  reliquiaId?: string;
};

export type HeroRuneSave = {
  heroId: string;
  slot0?: string;
  slot1?: string;
};

export type InventoryItemSave = {
  itemId: string;
  qty: number;
  origin?: string;
};

export type DungeonProgressSave = {
  dungeonId: string;
  bestRank: "D" | "C" | "B" | "A" | "S" | "SS" | "";
  bestTimeSeconds: number;
  totalRuns: number;
};

export type TravelSave = {
  unlockedDestinationIds: string[];
  hasHorse: boolean;
  hasShip: boolean;
};

export type ReputationEntry = {
  factionId: string;
  points: number;
};

export type AchievementsSave = {
  unlockedIds: string[];
  progress: { key: string; value: number }[];
};

export type CodexSave = {
  discoveredIds: string[];
};

export type CompanionSave = {
  companionId: string;
  bond: number;
  form: number;
  isActive: boolean;
};

export type DailyChallengeSave = {
  lastReset: string;
  completed: string[];
  progress: { key: string; value: number }[];
};

export type LoginBonusSave = {
  dayInCycle: number;
  cycle: number;
  claimedToday: boolean;
  lastClaimDate: string;
};

export type KarmaSave = {
  value: number;
  nonRepeatableDone: string[];
};

export type TowerSave = {
  bestFloor: number;
  weeklyBest: number;
  weekStart: string;
};

export type DungeonDifficulty = "easy" | "normal" | "hard" | "epic" | "legendary";

export type PendingTowerClimb = {
  heroIds: string[];
  fromFloor: number;
  targetFloor: number;
  startTime: string;
  endTime: string;
};

export type PendingDungeonRun = {
  runId: string;
  dungeonId: string;
  heroIds: string[];
  difficulty: DungeonDifficulty;
  startTime: string;
  endTime: string;
};

export type ArenaSave = {
  rating: number;
  wins: number;
  losses: number;
  weekStart: string;
};

export type CaravanSave = {
  activeRouteId: string;
  investedGold: number;
  inTransit: boolean;
  arrivalTime: string;
};

export type HousingSave = {
  houseLevel: number;
  unlockedRooms: string[];
};

export type BossHuntSave = {
  weekStart: string;
  weeklyDefeated: string[];
  allTimeKills: string[];
};

export type BattlePassSave = {
  xp: number;
  level: number;
  isPremium: boolean;
  claimedFree: number[];
  claimedPremium: number[];
};

export type ResourceEntry = { key: ResourceType; value: number };

export type BuildingSave = {
  buildingId: string;
  level: number;
  assignedHeroId?: string;
};

export type FortressSave = {
  fortressName: string;
  reputation: number;
  population: number;
  resources: ResourceEntry[];
  buildings: BuildingSave[];
};

export type GuildAdvancedSave = {
  specialization: number;
  treasury: number;
  completedMissions: string[];
  completedResearch: string[];
  buildings: { typeId: string; level: number }[];
};

export type ProfessionSave = {
  chosenProfession: string;
  xp: number;
  craftedRecipeIds: string[];
};

export type SeasonSave = {
  seasonId: number;
  xp: number;
  level: number;
  claimedLevels: number[];
};

export type PlayerLevelSave = {
  xp: number;
  level: number;
};

export type DialogueSaveData = {
  seenDialogues: string[];
  choiceHistory: string[];
};

export type WorldMapSave = {
  currentRegionId: string;
  discoveredRegions: string[];
  discoveredPois: string[];
};

export type NpcStateSave = {
  gameHour: number;
  instances: { npcId: string; moodIndex: number; hasBeenTalkedTo: boolean }[];
};

export type AlchemySave = {
  stationLevel: number;
};

export type AudioSave = {
  musicVolume: number;
  sfxVolume: number;
};

export type ForgeEnhancement = {
  equipId: string;
  level: number; // 1–10
};

export type ProfessionTaskSave = {
  lastReset: string;
  completedToday: string[];
};

export type OfflineSave = {
  lastActiveAt: string;
}

// ── Full Save ─────────────────────────────────────────────────────────────────

export type SaveData = {
  version: string;
  wallet: WalletSave;
  invocador: InvocadorSave;
  bannerPity: BannerPitySave[];
  collectedHeroIds: string[];   // "bannerId|heroId"
  fragmentos: MemoriaFragmentoSave[];
  heroProgression: HeroProgressionSave[];
  heroSkills: HeroSkillsSave[];
  heroLevels: HeroLevelSave[];
  heroEquipment: HeroEquipmentSave[];
  heroRunes: HeroRuneSave[];
  inventory: InventoryItemSave[];
  equipmentInventory: string[];   // equipId[]
  runeInventory: string[];        // runeId[]
  dungeon: DungeonProgressSave[];
  travel: TravelSave;
  reputation: ReputationEntry[];
  achievements: AchievementsSave;
  codex: CodexSave;
  companions: CompanionSave[];
  activeCompanionId: string;
  dailyChallenges: DailyChallengeSave;
  loginBonus: LoginBonusSave;
  karma: KarmaSave;
  tower: TowerSave;
  arena: ArenaSave;
  caravan: CaravanSave;
  housing: HousingSave;
  bossHunt: BossHuntSave;
  battlePass: BattlePassSave;
  guildAdvanced: GuildAdvancedSave;
  profession: ProfessionSave;
  season: SeasonSave;
  playerLevel: PlayerLevelSave;
  dialogue: DialogueSaveData;
  worldMap: WorldMapSave;
  npcState: NpcStateSave;
  alchemy: AlchemySave;
  fortress: FortressSave;
  audio: AudioSave;
  forge: ForgeEnhancement[];
  professionTasks: ProfessionTaskSave;
  offline: OfflineSave;
  pendingTower: PendingTowerClimb | null;
  pendingDungeons: PendingDungeonRun[];
};
