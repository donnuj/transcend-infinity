import type { ItemDef, EquipmentDef, RuneDef } from "../types";

// ── Consumíveis & Materiais ───────────────────────────────────────────────────

export const ITEMS: ItemDef[] = [
  { itemId: "pocao_cura_p",      name: "Poção de Cura",           description: "Restaura 500 HP.",                           category: "Consumiveis", rarity: "Comum",    baseValue: 30,   stackable: true,  maxStack: 99 },
  { itemId: "pocao_cura_m",      name: "Poção de Cura II",        description: "Restaura 2000 HP.",                          category: "Consumiveis", rarity: "Incomum",  baseValue: 80,   stackable: true,  maxStack: 99 },
  { itemId: "pocao_cura_g",      name: "Elixir de Cura",          description: "Restaura HP totalmente.",                   category: "Consumiveis", rarity: "Raro",     baseValue: 200,  stackable: true,  maxStack: 50 },
  { itemId: "pocao_mana_p",      name: "Poção de Mana",           description: "Restaura 200 MP.",                           category: "Consumiveis", rarity: "Comum",    baseValue: 40,   stackable: true,  maxStack: 99 },
  { itemId: "pocao_mana_m",      name: "Poção de Mana II",        description: "Restaura 1000 MP.",                          category: "Consumiveis", rarity: "Incomum",  baseValue: 90,   stackable: true,  maxStack: 99 },
  { itemId: "elixir_forca",      name: "Elixir de Força",         description: "+30% ATQ físico por 3 batalhas.",            category: "Consumiveis", rarity: "Raro",     baseValue: 150,  stackable: true,  maxStack: 30 },
  { itemId: "cristal_mana",      name: "Cristal de Mana",         description: "Material para alquimia e encantamento.",     category: "Materiais",   rarity: "Incomum",  baseValue: 25,   stackable: true,  maxStack: 999 },
  { itemId: "cristal_evolucao",  name: "Cristal de Evolução",     description: "Necessário para ascensão de heróis.",        category: "Materiais",   rarity: "Raro",     baseValue: 80,   stackable: true,  maxStack: 999 },
  { itemId: "pedra_ascensao",    name: "Pedra de Ascensão",       description: "Eleva o tier de ascensão de um herói.",      category: "Materiais",   rarity: "Épico",    baseValue: 300,  stackable: true,  maxStack: 99  },
  { itemId: "essencia_skill",    name: "Essência de Habilidade",  description: "Sobe o nível de uma skill.",                 category: "Materiais",   rarity: "Raro",     baseValue: 60,   stackable: true,  maxStack: 999 },
  { itemId: "couro_lobo",        name: "Couro de Lobo",           description: "Material básico de crafting.",               category: "Materiais",   rarity: "Comum",    baseValue: 8,    stackable: true,  maxStack: 999 },
  { itemId: "gema_comum",        name: "Gema Comum",              description: "Material de encantamento básico.",           category: "Materiais",   rarity: "Incomum",  baseValue: 15,   stackable: true,  maxStack: 999 },
  { itemId: "gema_rara",         name: "Gema Rara",               description: "Material de encantamento avançado.",        category: "Materiais",   rarity: "Raro",     baseValue: 80,   stackable: true,  maxStack: 99  },
  { itemId: "essencia_evento",   name: "Essência do Evento",      description: "Moeda especial de evento.",                  category: "Especial",    rarity: "Raro",     baseValue: 0,    stackable: true,  maxStack: 9999 },
  { itemId: "chave_masmorra",    name: "Chave de Masmorra",       description: "Abre uma dungeon de dificuldade normal.",    category: "Chave",       rarity: "Comum",    baseValue: 20,   stackable: true,  maxStack: 20  },
  { itemId: "chave_elite",       name: "Chave Elite",             description: "Abre uma dungeon de dificuldade elite.",    category: "Chave",       rarity: "Incomum",  baseValue: 60,   stackable: true,  maxStack: 10  },
  { itemId: "fragmento_lendario",name: "Fragmento Lendário",      description: "Acumule para invocar um herói lendário.",    category: "Especial",    rarity: "Lendário", baseValue: 0,    stackable: true,  maxStack: 100 },
  { itemId: "tomo_ancestral",    name: "Tomo Ancestral",          description: "Contém segredos de civilizações passadas.",  category: "Reliquias",   rarity: "Lendário", baseValue: 500,  stackable: false, maxStack: 1   },
];

export const ITEM_MAP: Record<string, ItemDef> =
  Object.fromEntries(ITEMS.map((i) => [i.itemId, i]));

// ── Equipamentos ─────────────────────────────────────────────────────────────

export const EQUIPMENT: EquipmentDef[] = [
  // Armas
  { equipId: "espada_ferro",      name: "Espada de Ferro",       description: "Lâmina forjada em ferro comum.",          slot: "weapon",    rarity: "Comum",    statBonus: { STR: 5  },          requiredLevel: 1  },
  { equipId: "espada_aco",        name: "Espada de Aço",         description: "Aço temperado pela forja nãos.",          slot: "weapon",    rarity: "Incomum",  statBonus: { STR: 10, AGI: 3 },  requiredLevel: 5  },
  { equipId: "espada_encantada",  name: "Espada Encantada",      description: "Imbuída com energia arcana.",             slot: "weapon",    rarity: "Raro",     statBonus: { STR: 18, INT: 8 }, element: "Lightning", requiredLevel: 10 },
  { equipId: "arco_caçador",      name: "Arco do Caçador",       description: "Arco preciso de madeira de teixo.",       slot: "weapon",    rarity: "Comum",    statBonus: { AGI: 6  },          requiredLevel: 1  },
  { equipId: "arco_vento",        name: "Arco dos Ventos",       description: "Flecha sai antes de você perceber.",      slot: "weapon",    rarity: "Raro",     statBonus: { AGI: 20, LUK: 8 }, element: "Wind",      requiredLevel: 10 },
  { equipId: "cajado_iniciante",  name: "Cajado do Iniciante",   description: "Foca energia mágica básica.",             slot: "weapon",    rarity: "Comum",    statBonus: { INT: 6  },          requiredLevel: 1  },
  { equipId: "cajado_arcano",     name: "Cajado Arcano",         description: "Amplifica magia elementar.",             slot: "weapon",    rarity: "Raro",     statBonus: { INT: 18, WIS: 6 },  requiredLevel: 10 },
  { equipId: "cajado_lendario",   name: "Cajado do Cosmos",      description: "Forjado com estrelas primordiais.",       slot: "weapon",    rarity: "Lendário", statBonus: { INT: 35, WIS: 15, LUK: 10 }, element: "None", requiredLevel: 30 },
  { equipId: "martelo_guerra",    name: "Martelo de Guerra",     description: "Esmaga com o peso da terra.",             slot: "weapon",    rarity: "Incomum",  statBonus: { STR: 14, VIT: 4 }, element: "Earth",     requiredLevel: 5  },
  // Armaduras
  { equipId: "armadura_couro",    name: "Armadura de Couro",     description: "Proteção básica leve.",                   slot: "armor",     rarity: "Comum",    statBonus: { VIT: 5  },          requiredLevel: 1  },
  { equipId: "armadura_malha",    name: "Armadura de Malha",     description: "Anel de ferro entrelaçado.",             slot: "armor",     rarity: "Incomum",  statBonus: { VIT: 12, STR: 3 },  requiredLevel: 5  },
  { equipId: "armadura_placas",   name: "Armadura de Placas",    description: "Proteção pesada de aço.",                slot: "armor",     rarity: "Raro",     statBonus: { VIT: 22, STR: 6 },  requiredLevel: 10 },
  { equipId: "manto_arcano",      name: "Manto Arcano",          description: "Tecido com fios de mana.",               slot: "armor",     rarity: "Raro",     statBonus: { INT: 15, WIS: 10 },  requiredLevel: 10 },
  { equipId: "coraca_lendaria",   name: "Couraça da Eternidade", description: "Forjada em névoa cristalizada.",          slot: "armor",     rarity: "Lendário", statBonus: { VIT: 40, STR: 12, WIS: 8 }, requiredLevel: 30 },
  // Acessórios
  { equipId: "anel_forca",        name: "Anel de Força",         description: "Aumenta levemente a força.",              slot: "accessory", rarity: "Comum",    statBonus: { STR: 4  },          requiredLevel: 1  },
  { equipId: "amuleto_sabedoria", name: "Amuleto da Sabedoria",  description: "Clarifica o pensamento mágico.",         slot: "accessory", rarity: "Incomum",  statBonus: { WIS: 8, INT: 4 },   requiredLevel: 5  },
  { equipId: "colar_sorte",       name: "Colar da Sorte",        description: "Muda o destino levemente a seu favor.",  slot: "accessory", rarity: "Raro",     statBonus: { LUK: 20, CHA: 8 },  requiredLevel: 10 },
  { equipId: "broche_lendario",   name: "Broche do Destino",     description: "Quem usa está destinado a algo maior.",  slot: "accessory", rarity: "Lendário", statBonus: { LUK: 30, CHA: 20, WIS: 10 }, requiredLevel: 25 },
  // Relíquias
  { equipId: "cristal_nucleo",    name: "Cristal do Núcleo",     description: "Fragmento do núcleo do mundo.",          slot: "reliquia",  rarity: "Épico",    statBonus: { INT: 20, WIS: 12, LUK: 8 }, requiredLevel: 15 },
  { equipId: "orbe_celestial",    name: "Orbe Celestial",        description: "Artefato da era pré-imperial.",          slot: "reliquia",  rarity: "Lendário", statBonus: { INT: 30, WIS: 20, CHA: 15, LUK: 10 }, requiredLevel: 28 },
];

export const EQUIP_MAP: Record<string, EquipmentDef> =
  Object.fromEntries(EQUIPMENT.map((e) => [e.equipId, e]));

// ── Runas ────────────────────────────────────────────────────────────────────

export const RUNES: RuneDef[] = [
  { runeId: "runa_fogo",       name: "Runa de Fogo",      description: "+10 INT e affinity Fogo.",       rarity: "Raro",     statBonus: { INT: 10 },          element: "Fire"      },
  { runeId: "runa_agua",       name: "Runa d'Água",       description: "+10 WIS e affinity Água.",       rarity: "Raro",     statBonus: { WIS: 10 },          element: "Water"     },
  { runeId: "runa_terra",      name: "Runa de Terra",     description: "+12 VIT.",                        rarity: "Raro",     statBonus: { VIT: 12 },          element: "Earth"     },
  { runeId: "runa_vento",      name: "Runa do Vento",     description: "+12 AGI.",                        rarity: "Raro",     statBonus: { AGI: 12 },          element: "Wind"      },
  { runeId: "runa_luz",        name: "Runa da Luz",       description: "+8 WIS, +5 CHA.",                rarity: "Épico",    statBonus: { WIS: 8, CHA: 5 },  element: "Light"     },
  { runeId: "runa_sombra",     name: "Runa das Sombras",  description: "+8 AGI, +5 LUK.",                rarity: "Épico",    statBonus: { AGI: 8, LUK: 5 },  element: "Dark"      },
  { runeId: "runa_raio",       name: "Runa do Raio",      description: "+8 STR, +8 AGI.",                rarity: "Épico",    statBonus: { STR: 8, AGI: 8 },  element: "Lightning" },
  { runeId: "runa_forca",      name: "Runa da Força",     description: "+15 STR.",                        rarity: "Incomum",  statBonus: { STR: 15 }                               },
  { runeId: "runa_sorte",      name: "Runa da Sorte",     description: "+15 LUK.",                        rarity: "Incomum",  statBonus: { LUK: 15 }                               },
  { runeId: "runa_cosmos",     name: "Runa do Cosmos",    description: "+12 a todos os atributos.",      rarity: "Lendário", statBonus: { STR: 12, AGI: 12, VIT: 12, INT: 12, WIS: 12, CHA: 12, LUK: 12 } },
];

export const RUNE_MAP: Record<string, RuneDef> =
  Object.fromEntries(RUNES.map((r) => [r.runeId, r]));
