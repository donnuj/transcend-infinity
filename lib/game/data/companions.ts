export type CompanionDef = {
  id: string;
  name: string;
  portrait: string;
  description: string;
  rarity: "Comum" | "Incomum" | "Raro" | "Épico" | "Lendário";
  bonus: string;
  maxBond: number;
  forms: { form: number; label: string; bondRequired: number; bonus: string }[];
};

export const COMPANIONS: CompanionDef[] = [
  {
    id: "comp_phoebe",
    name: "Phoebe",
    portrait: "🦋",
    description: "Uma fada da floresta cintilante que guia invocadores perdidos.",
    rarity: "Raro",
    bonus: "+5% EXP de herói",
    maxBond: 100,
    forms: [
      { form: 0, label: "Broto",      bondRequired: 0,   bonus: "+5% EXP herói"  },
      { form: 1, label: "Borboleta",  bondRequired: 30,  bonus: "+10% EXP herói" },
      { form: 2, label: "Serafim",    bondRequired: 80,  bonus: "+15% EXP herói" },
    ],
  },
  {
    id: "comp_ryuk",
    name: "Ryuk",
    portrait: "🐺",
    description: "Um lobo das sombras selado por um antigo feiticeiro.",
    rarity: "Épico",
    bonus: "+8% dano de ataque",
    maxBond: 100,
    forms: [
      { form: 0, label: "Filhote",    bondRequired: 0,   bonus: "+8% ATQ"  },
      { form: 1, label: "Sombra",     bondRequired: 40,  bonus: "+15% ATQ" },
      { form: 2, label: "Alfa Negro", bondRequired: 85,  bonus: "+25% ATQ" },
    ],
  },
  {
    id: "comp_stella",
    name: "Stella",
    portrait: "⭐",
    description: "Uma estrela viva que caiu do firmamento durante o eclipse.",
    rarity: "Lendário",
    bonus: "+10% cristais de drops",
    maxBond: 100,
    forms: [
      { form: 0, label: "Centelha",   bondRequired: 0,   bonus: "+10% drops cristais" },
      { form: 1, label: "Estrela",    bondRequired: 50,  bonus: "+20% drops cristais" },
      { form: 2, label: "Supernova",  bondRequired: 90,  bonus: "+35% drops cristais" },
    ],
  },
  {
    id: "comp_goro",
    name: "Goro",
    portrait: "🐸",
    description: "Um sapo místico que conhece os segredos dos pântanos do norte.",
    rarity: "Incomum",
    bonus: "+3% drop rate",
    maxBond: 100,
    forms: [
      { form: 0, label: "Girino",     bondRequired: 0,   bonus: "+3% drop rate" },
      { form: 1, label: "Sapo",       bondRequired: 25,  bonus: "+6% drop rate" },
    ],
  },
  {
    id: "comp_ash",
    name: "Ash",
    portrait: "🦅",
    description: "Uma fênix jovem renascida das cinzas de um templo destruído.",
    rarity: "Épico",
    bonus: "+10% ouro de combate",
    maxBond: 100,
    forms: [
      { form: 0, label: "Cinza",      bondRequired: 0,   bonus: "+10% ouro" },
      { form: 1, label: "Fênix",      bondRequired: 45,  bonus: "+20% ouro" },
      { form: 2, label: "Inferno",    bondRequired: 88,  bonus: "+35% ouro" },
    ],
  },
];

export const COMPANION_MAP: Record<string, CompanionDef> = Object.fromEntries(COMPANIONS.map((c) => [c.id, c]));

const RARITY_COLORS: Record<string, string> = {
  Lendário: "rgb(255,180,50)",
  Épico:    "rgb(200,100,255)",
  Raro:     "rgb(70,130,255)",
  Incomum:  "rgb(80,200,120)",
  Comum:    "rgba(200,200,200,0.6)",
};

export function companionRarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? "rgba(200,200,200,0.6)";
}
