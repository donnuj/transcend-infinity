import type { SaveData } from "../types";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "combate" | "invocacao" | "progressao" | "exploracao" | "colecao";
  check: (save: SaveData) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  // Invocação
  { id: "first_pull",      title: "Primeiro Chamado",     description: "Realize sua primeira invocação",         icon: "✦", category: "invocacao",   check: (s) => s.invocador.totalPulls >= 1         },
  { id: "pulls_10",        title: "Invocador Novato",      description: "Realize 10 invocações",                  icon: "✦", category: "invocacao",   check: (s) => s.invocador.totalPulls >= 10        },
  { id: "pulls_100",       title: "Invocador Veterano",    description: "Realize 100 invocações",                 icon: "✦", category: "invocacao",   check: (s) => s.invocador.totalPulls >= 100       },
  { id: "heroes_3",        title: "Pequeno Exército",      description: "Colete 3 heróis distintos",              icon: "⚔", category: "colecao",     check: (s) => new Set(s.collectedHeroIds.map(k => k.split("|")[1])).size >= 3 },
  { id: "heroes_5",        title: "Força de Combate",      description: "Colete 5 heróis distintos",              icon: "⚔", category: "colecao",     check: (s) => new Set(s.collectedHeroIds.map(k => k.split("|")[1])).size >= 5 },
  // Progressão
  { id: "player_lv5",      title: "Aventureiro",           description: "Alcance o nível de invocador 5",        icon: "◉", category: "progressao",  check: (s) => s.playerLevel.level >= 5            },
  { id: "player_lv10",     title: "Veterano",              description: "Alcance o nível de invocador 10",       icon: "◉", category: "progressao",  check: (s) => s.playerLevel.level >= 10           },
  { id: "player_lv20",     title: "Mestre Invocador",      description: "Alcance o nível de invocador 20",       icon: "◉", category: "progressao",  check: (s) => s.playerLevel.level >= 20           },
  { id: "hero_rank3",      title: "Ascensão",              description: "Eleve um herói ao rank 3",               icon: "▲", category: "progressao",  check: (s) => s.heroProgression.some((h) => h.rank >= 3) },
  { id: "hero_awaken",     title: "Despertar",             description: "Desperte um herói",                      icon: "★", category: "progressao",  check: (s) => s.heroProgression.some((h) => h.awakenLevel >= 1) },
  // Combate
  { id: "dungeon_first",   title: "Mergulhador",           description: "Complete sua primeira dungeon",          icon: "⚔", category: "combate",     check: (s) => s.dungeon.some((d) => d.bestRank !== "") },
  { id: "dungeon_s",       title: "Elite",                 description: "Obtenha rank S em qualquer dungeon",    icon: "⚔", category: "combate",     check: (s) => s.dungeon.some((d) => d.bestRank === "S" || d.bestRank === "SS") },
  { id: "arena_10",        title: "Gladiador",             description: "Vença 10 batalhas na arena",             icon: "⚜", category: "combate",     check: (s) => s.arena.wins >= 10                  },
  { id: "arena_bronze",    title: "Bronze",                description: "Alcance rating 1000 na arena",          icon: "⚜", category: "combate",     check: (s) => s.arena.rating >= 1000              },
  { id: "arena_gold",      title: "Ouro",                  description: "Alcance rating 1500 na arena",          icon: "⚜", category: "combate",     check: (s) => s.arena.rating >= 1500              },
  { id: "tower_10",        title: "Escalador",             description: "Alcance o andar 10 da Torre",           icon: "🏛", category: "combate",     check: (s) => s.tower.bestFloor >= 10             },
  { id: "tower_25",        title: "Desafiante",            description: "Alcance o andar 25 da Torre",           icon: "🏛", category: "combate",     check: (s) => s.tower.bestFloor >= 25             },
  { id: "tower_50",        title: "Conquistador",          description: "Alcance o andar 50 da Torre",           icon: "🏛", category: "combate",     check: (s) => s.tower.bestFloor >= 50             },
  // Exploração
  { id: "login_7",         title: "Fiel",                  description: "7 dias de login consecutivo",           icon: "◆", category: "exploracao",  check: (s) => s.wallet.loginStreak >= 7           },
  { id: "login_30",        title: "Devoto",                description: "30 dias de login consecutivo",          icon: "◆", category: "exploracao",  check: (s) => s.wallet.loginStreak >= 30          },
  { id: "bp_lv10",         title: "Passista",              description: "Alcance nível 10 do Battle Pass",       icon: "★", category: "progressao",  check: (s) => s.battlePass.level >= 10            },
  { id: "bp_lv40",         title: "Mestre do Passe",       description: "Complete o Battle Pass (nível 40)",    icon: "★", category: "progressao",  check: (s) => s.battlePass.level >= 40            },
  { id: "ouro_10k",        title: "Comerciante",           description: "Acumule 10.000 de ouro",               icon: "◆", category: "exploracao",  check: (s) => s.wallet.ouro >= 10000              },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
