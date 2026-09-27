export type ChallengeDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
  progressKey: string;
  target: number;
  rewardType: "ouro" | "cristaisAstra" | "selosDeInvocacao" | "playerXp";
  rewardAmount: number;
  rewardLabel: string;
};

export const DAILY_CHALLENGES: ChallengeDef[] = [
  {
    id: "dc_login",
    title: "Presença Diária",
    description: "Faça login e resgaste o bônus diário",
    icon: "◆",
    progressKey: "login_claimed",
    target: 1,
    rewardType: "ouro",
    rewardAmount: 100,
    rewardLabel: "100 Ouro",
  },
  {
    id: "dc_pull",
    title: "Chamado dos Heróis",
    description: "Realize 1 invocação",
    icon: "✦",
    progressKey: "pulls_today",
    target: 1,
    rewardType: "cristaisAstra",
    rewardAmount: 50,
    rewardLabel: "50 Cristais",
  },
  {
    id: "dc_pull5",
    title: "Invocador Ávido",
    description: "Realize 5 invocações",
    icon: "✦",
    progressKey: "pulls_today",
    target: 5,
    rewardType: "cristaisAstra",
    rewardAmount: 150,
    rewardLabel: "150 Cristais",
  },
  {
    id: "dc_dungeon",
    title: "Mergulhador",
    description: "Complete 1 dungeon",
    icon: "⚔",
    progressKey: "dungeons_today",
    target: 1,
    rewardType: "ouro",
    rewardAmount: 300,
    rewardLabel: "300 Ouro",
  },
  {
    id: "dc_arena",
    title: "Gladiador",
    description: "Vença 1 batalha na Arena",
    icon: "⚜",
    progressKey: "arena_wins_today",
    target: 1,
    rewardType: "ouro",
    rewardAmount: 200,
    rewardLabel: "200 Ouro",
  },
  {
    id: "dc_arena3",
    title: "Campeão",
    description: "Vença 3 batalhas na Arena",
    icon: "⚜",
    progressKey: "arena_wins_today",
    target: 3,
    rewardType: "selosDeInvocacao",
    rewardAmount: 1,
    rewardLabel: "1 Selo",
  },
  {
    id: "dc_tower",
    title: "Escalador",
    description: "Suba 5 andares na Torre",
    icon: "🏛",
    progressKey: "tower_floors_today",
    target: 5,
    rewardType: "cristaisAstra",
    rewardAmount: 80,
    rewardLabel: "80 Cristais",
  },
];
