import type { RegionDef, NpcDef, DungeonDef, FactionDef, BuildingDef } from "../types";

// ── Regiões ──────────────────────────────────────────────────────────────────

export const REGIONS: RegionDef[] = [
  {
    regionId: "reg_valdris",
    name: "Planícies de Valdris",
    biome: "Planície",
    description: "Berço do Império, onde tudo começou. Campos dourados e cidades antigas.",
    level: 1,
    discoveredByDefault: true,
    pois: [
      { poiId: "poi_cidade_valdris",  name: "Cidade de Valdris",   type: "npc"     },
      { poiId: "poi_ruinas_antigas",  name: "Ruínas Antigas",      type: "dungeon" },
      { poiId: "poi_mercado_valdris", name: "Mercado das Planícies",type: "market" },
    ],
  },
  {
    regionId: "reg_floresta_eterna",
    name: "Floresta Eterna",
    biome: "Floresta",
    description: "Floresta milenar onde as árvores têm memória e os espíritos ainda caminham.",
    level: 5,
    discoveredByDefault: false,
    pois: [
      { poiId: "poi_sanctuario_druida", name: "Santuário Druídico", type: "npc"     },
      { poiId: "poi_caverna_sombra",    name: "Caverna das Sombras",type: "dungeon" },
      { poiId: "poi_boss_aracula",      name: "Aráculas Rainha",    type: "boss"    },
    ],
  },
  {
    regionId: "reg_picos_eternos",
    name: "Picos Eternos",
    biome: "Neve",
    description: "Montanhas cobertas de neve eterna onde os anões forjam as melhores armas.",
    level: 12,
    discoveredByDefault: false,
    pois: [
      { poiId: "poi_forja_anao",       name: "Grande Forja",        type: "npc"     },
      { poiId: "poi_mina_cristais",    name: "Mina de Cristais",    type: "dungeon" },
      { poiId: "poi_torre_gelo",       name: "Torre de Gelo",       type: "dungeon" },
    ],
  },
  {
    regionId: "reg_deserto_cinza",
    name: "Deserto Cinza",
    biome: "Deserto",
    description: "Onde um antigo reino foi varrido pela maldição. Criaturas do Abismo perambulam.",
    level: 20,
    discoveredByDefault: false,
    pois: [
      { poiId: "poi_necropole",        name: "Necrópole do Esquecimento", type: "dungeon" },
      { poiId: "poi_boss_ossirus",     name: "Crypt Lord",                 type: "boss"    },
      { poiId: "poi_oasis_secreto",    name: "Oásis Secreto",              type: "event"   },
    ],
  },
  {
    regionId: "reg_mar_interno",
    name: "Mar Interno",
    biome: "Mar",
    description: "O lago colossal no centro do continente, lar de criaturas das profundezas.",
    level: 15,
    discoveredByDefault: false,
    pois: [
      { poiId: "poi_porto_lyra",      name: "Porto de Lyra",       type: "npc"     },
      { poiId: "poi_templo_afundado", name: "Templo Afundado",     type: "dungeon" },
      { poiId: "poi_boss_kraken",     name: "Kraken Primordial",   type: "boss"    },
    ],
  },
  {
    regionId: "reg_vulcao_kaelith",
    name: "Vulcão de Kaelith",
    biome: "Vulcão",
    description: "O local onde o Dragão Eterno dormiu por milênios. Fogo e cinzas por toda parte.",
    level: 30,
    discoveredByDefault: false,
    pois: [
      { poiId: "poi_covil_dragao",    name: "Covil do Dragão",     type: "dungeon" },
      { poiId: "poi_boss_kaelith",    name: "Kaelith Liberado",    type: "boss"    },
    ],
  },
  {
    regionId: "reg_planicie_ceu",
    name: "Planície do Céu",
    biome: "Planície",
    description: "Território celestial apenas acessível através de portais. Lar dos Arcontes.",
    level: 40,
    discoveredByDefault: false,
    pois: [
      { poiId: "poi_portal_arconte",  name: "Portal dos Arcontes", type: "event"   },
      { poiId: "poi_sanctuario_serah", name: "Santuário de Serah",   type: "npc"     },
      { poiId: "poi_torre_infinita",  name: "Torre do Infinito",   type: "dungeon" },
    ],
  },
];

export const REGION_MAP: Record<string, RegionDef> =
  Object.fromEntries(REGIONS.map((r) => [r.regionId, r]));

// ── NPCs ─────────────────────────────────────────────────────────────────────

export const NPCS: NpcDef[] = [
  { npcId: "npc_comerciante_valdris", name: "Brennus, o Mercador",     role: "Comerciante",   regionId: "reg_valdris",        portraitEmoji: "🛒", dialogueRootId: "dlg_brennus_1"     },
  { npcId: "npc_ferreiro_picos",      name: "Thorgam",                  role: "Ferreiro",      regionId: "reg_valdris",        portraitEmoji: "⚒",  dialogueRootId: "dlg_thorgam_1"     },
  { npcId: "npc_sage_floresta",       name: "Eira, a Sábia",            role: "Sábia",         regionId: "reg_floresta_eterna",portraitEmoji: "📖", dialogueRootId: "dlg_eira_1"        },
  { npcId: "npc_capitao_porto",       name: "Capitão Nereus",           role: "Navegador",     regionId: "reg_mar_interno",    portraitEmoji: "⚓", dialogueRootId: "dlg_nereus_1"      },
  { npcId: "npc_arconte_luz",         name: "Arconte Solaris",          role: "Arconte",       regionId: "reg_planicie_ceu",   portraitEmoji: "☀",  dialogueRootId: "dlg_solaris_1"     },
];

export const NPC_MAP: Record<string, NpcDef> =
  Object.fromEntries(NPCS.map((n) => [n.npcId, n]));

// ── Dungeons ──────────────────────────────────────────────────────────────────

export const DUNGEONS: DungeonDef[] = [
  { dungeonId: "dun_ruinas",        name: "Ruínas Antigas",            description: "Primeiro desafio dos heróis.",                  regionId: "reg_valdris",        recommendedLevel: 1,  stages: 5,  lootTableId: "dungeon_basico"   },
  { dungeonId: "dun_caverna_sombra",name: "Caverna das Sombras",        description: "Goblins e espíritos das trevas.",                regionId: "reg_floresta_eterna",recommendedLevel: 5,  stages: 8,  lootTableId: "dungeon_basico",   element: "Dark"  },
  { dungeonId: "dun_mina_cristais", name: "Mina de Cristais",           description: "Golens e armadilhas nos túneis da montanha.",   regionId: "reg_picos_eternos",  recommendedLevel: 12, stages: 10, lootTableId: "dungeon_avancado", element: "Earth" },
  { dungeonId: "dun_torre_gelo",    name: "Torre de Gelo",              description: "Pisos congelados, inimigos de água e gelo.",    regionId: "reg_picos_eternos",  recommendedLevel: 15, stages: 15, lootTableId: "dungeon_avancado", element: "Water" },
  { dungeonId: "dun_necropole",     name: "Necrópole do Esquecimento",  description: "Mortos-vivos e feitiços de trevas ancestrais.", regionId: "reg_deserto_cinza",  recommendedLevel: 20, stages: 12, lootTableId: "dungeon_avancado", element: "Dark"  },
  { dungeonId: "dun_templo",        name: "Templo Afundado",            description: "Nagas e serpentes marinhas nas profundezas.",   regionId: "reg_mar_interno",    recommendedLevel: 18, stages: 12, lootTableId: "dungeon_avancado", element: "Water" },
  { dungeonId: "dun_covil_dragao",  name: "Covil do Dragão",            description: "O desafio mais difícil — chamas primordiais.", regionId: "reg_vulcao_kaelith", recommendedLevel: 30, stages: 20, lootTableId: "chefe_basico",     element: "Fire"  },
  { dungeonId: "dun_torre_infinita",name: "Torre do Infinito",          description: "Andares infinitos, loot lendário.",             regionId: "reg_planicie_ceu",   recommendedLevel: 40, stages: 99, lootTableId: "chefe_basico"      },
];

export const DUNGEON_MAP: Record<string, DungeonDef> =
  Object.fromEntries(DUNGEONS.map((d) => [d.dungeonId, d]));

// ── Facções ───────────────────────────────────────────────────────────────────

export const FACTIONS: FactionDef[] = [
  {
    factionId: "fac_ordem_imperial",
    name: "Ordem Imperial",
    description: "Os guardiões do legado do Imperador Valdris.",
    emoji: "⚜",
    tiers: [
      { label: "Desconhecido",  minPoints: 0,    bonus: "Sem bônus"                    },
      { label: "Reconhecido",   minPoints: 100,  bonus: "+5% desconto no Mercado"      },
      { label: "Honrado",       minPoints: 500,  bonus: "Acesso à Arena Imperial"      },
      { label: "Exaltado",      minPoints: 2000, bonus: "+15% EXP de missões"          },
      { label: "Campeão",       minPoints: 5000, bonus: "Banner Exclusivo desbloqueado"},
    ],
  },
  {
    factionId: "fac_druidas",
    name: "Círculo dos Druidas",
    description: "Guardiões da Floresta Eterna e do equilíbrio natural.",
    emoji: "🌿",
    tiers: [
      { label: "Estranho",      minPoints: 0,    bonus: "Sem bônus"                      },
      { label: "Conhecido",     minPoints: 100,  bonus: "+10% drop de Ervas"             },
      { label: "Amigo",         minPoints: 500,  bonus: "Acesso ao Santuário Druídico"   },
      { label: "Aliado",        minPoints: 2000, bonus: "+20% poder de cura"             },
      { label: "Guardião",      minPoints: 5000, bonus: "Companion Exclusivo"            },
    ],
  },
  {
    factionId: "fac_mercadores",
    name: "Liga dos Mercadores",
    description: "Controlam as rotas comerciais e o fluxo de ouro do continente.",
    emoji: "💰",
    tiers: [
      { label: "Cliente",       minPoints: 0,    bonus: "Sem bônus"                    },
      { label: "Parceiro",      minPoints: 100,  bonus: "+5% lucro em Caravanas"       },
      { label: "Sócio",         minPoints: 500,  bonus: "Acesso ao Mercado Negro"      },
      { label: "Magnata",       minPoints: 2000, bonus: "+20% drop de Ouro"            },
      { label: "Barão",         minPoints: 5000, bonus: "Rota de Caravana Exclusiva"   },
    ],
  },
  {
    factionId: "fac_arcontes",
    name: "Ordem dos Arcontes",
    description: "Seres celestiais que guardam o equilíbrio entre os planos.",
    emoji: "✦",
    tiers: [
      { label: "Mortal",        minPoints: 0,    bonus: "Sem bônus"                    },
      { label: "Ungido",        minPoints: 200,  bonus: "+5% CristaisAstra por sessão" },
      { label: "Abençoado",     minPoints: 1000, bonus: "Acesso à Planície do Céu"     },
      { label: "Escolhido",     minPoints: 4000, bonus: "Banner Celestial"             },
      { label: "Arconte",       minPoints: 10000,bonus: "Herói Mítico desbloqueado"    },
    ],
  },
];

export const FACTION_MAP: Record<string, FactionDef> =
  Object.fromEntries(FACTIONS.map((f) => [f.factionId, f]));

// ── Construções da Fortaleza ───────────────────────────────────────────────────

export const BUILDINGS: BuildingDef[] = [
  {
    buildingId: "bld_caserna",
    name: "Caserna",
    category: "military",
    description: "Treina soldados e aumenta a capacidade de heróis na Fortaleza.",
    maxLevel: 5,
    resourceCosts: [
      { level: 1, costs: { Wood: 50,  Stone: 30  }, goldCost: 100  },
      { level: 2, costs: { Wood: 100, Stone: 80  }, goldCost: 250  },
      { level: 3, costs: { Wood: 200, Stone: 150 }, goldCost: 600  },
      { level: 4, costs: { Wood: 400, Stone: 300 }, goldCost: 1500 },
      { level: 5, costs: { Wood: 800, Stone: 600 }, goldCost: 4000 },
    ],
  },
  {
    buildingId: "bld_biblioteca",
    name: "Biblioteca Arcana",
    category: "research",
    description: "Desbloqueia pesquisas e aumenta a EXP de skills.",
    maxLevel: 5,
    resourceCosts: [
      { level: 1, costs: { Wood: 40,  Stone: 20, Herbs: 20 }, goldCost: 120 },
      { level: 2, costs: { Wood: 80,  Stone: 50, Herbs: 40 }, goldCost: 300 },
      { level: 3, costs: { Wood: 160, Stone: 100,Herbs: 80 }, goldCost: 700 },
      { level: 4, costs: { Wood: 320, Stone: 200,Herbs: 150},goldCost: 1800 },
      { level: 5, costs: { Wood: 640, Stone: 400,Herbs: 300},goldCost: 4500 },
    ],
  },
  {
    buildingId: "bld_hospital",
    name: "Hospital de Campanha",
    category: "housing",
    description: "Recupera heróis feridos entre batalhas mais rápido.",
    maxLevel: 4,
    resourceCosts: [
      { level: 1, costs: { Wood: 30, Herbs: 40  }, goldCost: 80  },
      { level: 2, costs: { Wood: 80, Herbs: 100 }, goldCost: 200 },
      { level: 3, costs: { Wood: 180,Herbs: 220 }, goldCost: 500 },
      { level: 4, costs: { Wood: 380,Herbs: 450 }, goldCost: 1200},
    ],
  },
  {
    buildingId: "bld_oficina",
    name: "Oficina do Ferreiro",
    category: "production",
    description: "Permite forjar equipamentos e melhorar armas.",
    maxLevel: 5,
    resourceCosts: [
      { level: 1, costs: { Stone: 50, Wood: 30  }, goldCost: 150  },
      { level: 2, costs: { Stone: 120,Wood: 80  }, goldCost: 380  },
      { level: 3, costs: { Stone: 250,Wood: 180 }, goldCost: 900  },
      { level: 4, costs: { Stone: 500,Wood: 360 }, goldCost: 2200 },
      { level: 5, costs: { Stone: 900,Wood: 700 }, goldCost: 5500 },
    ],
    production: [
      { resource: "Morale", perHour: 2 },
    ],
  },
  {
    buildingId: "bld_laboratorio",
    name: "Laboratório de Alquimia",
    category: "research",
    description: "Amplia receitas de alquimia e encantamento.",
    maxLevel: 5,
    resourceCosts: [
      { level: 1, costs: { Herbs: 60, Stone: 20  }, goldCost: 130  },
      { level: 2, costs: { Herbs: 150,Stone: 50  }, goldCost: 320  },
      { level: 3, costs: { Herbs: 300,Stone: 100 }, goldCost: 800  },
      { level: 4, costs: { Herbs: 600,Stone: 200 }, goldCost: 2000 },
      { level: 5, costs: { Herbs: 1200,Stone:400 }, goldCost: 5000 },
    ],
  },
  {
    buildingId: "bld_fazenda",
    name: "Fazenda",
    category: "production",
    description: "Produz Comida passivamente para sustentar a Fortaleza.",
    maxLevel: 4,
    resourceCosts: [
      { level: 1, costs: { Wood: 40  }, goldCost: 60   },
      { level: 2, costs: { Wood: 100 }, goldCost: 150  },
      { level: 3, costs: { Wood: 220 }, goldCost: 380  },
      { level: 4, costs: { Wood: 450 }, goldCost: 950  },
    ],
    production: [
      { resource: "Food", perHour: 10 },
      { resource: "Food", perHour: 20 },
      { resource: "Food", perHour: 35 },
      { resource: "Food", perHour: 55 },
    ],
  },
  {
    buildingId: "bld_serraria",
    name: "Serraria",
    category: "production",
    description: "Produz Madeira passivamente.",
    maxLevel: 4,
    resourceCosts: [
      { level: 1, costs: { Food: 30  }, goldCost: 50   },
      { level: 2, costs: { Food: 80  }, goldCost: 130  },
      { level: 3, costs: { Food: 180 }, goldCost: 320  },
      { level: 4, costs: { Food: 380 }, goldCost: 800  },
    ],
    production: [
      { resource: "Wood", perHour: 8  },
      { resource: "Wood", perHour: 16 },
      { resource: "Wood", perHour: 28 },
      { resource: "Wood", perHour: 44 },
    ],
  },
];

export const BUILDING_MAP: Record<string, BuildingDef> =
  Object.fromEntries(BUILDINGS.map((b) => [b.buildingId, b]));
