export type DialogueChoice = {
  choiceId: string;
  text: string;
  nextId: string | null;
  rewardType?: string;
  rewardAmount?: number;
  isQuest?: boolean;
  questLabel?: string;
};

export type DialogueNode = {
  id: string;
  npcId: string;
  text: string;
  choices: DialogueChoice[];
};

export const DIALOGUE_NODES: DialogueNode[] = [
  // ── Brennus (comerciante) — quests: trade routes, supplies ──────────────────
  {
    id: "dlg_brennus_1",
    npcId: "npc_comerciante_valdris",
    text: "Bem-vindo, aventureiro! Sou Brennus, mercador de Valdris. Tenho negócios e informações para oferecer. O que deseja?",
    choices: [
      { choiceId: "brennus_quest_supplies", text: "Tem alguma missão paga?",        nextId: "dlg_brennus_quest_supplies", isQuest: true },
      { choiceId: "brennus_lore",           text: "Conte sobre Valdris.",            nextId: "dlg_brennus_lore"   },
      { choiceId: "brennus_trade",          text: "O que você comercia?",            nextId: "dlg_brennus_trade"  },
      { choiceId: "brennus_bye",            text: "Não preciso de nada.",            nextId: null                 },
    ],
  },
  {
    id: "dlg_brennus_quest_supplies",
    npcId: "npc_comerciante_valdris",
    text: "Sim! Preciso de suprimentos para minha caravana. Se concluir três expedições de caravana esta semana, pago generosamente. Cada rota concluída vale uma gorjeta.",
    choices: [
      { choiceId: "brennus_accept_quest",  text: "Toparei. O que precisa exatamente?", nextId: "dlg_brennus_quest_detail" },
      { choiceId: "brennus_skip_quest",    text: "Talvez mais tarde.",                  nextId: "dlg_brennus_1" },
    ],
  },
  {
    id: "dlg_brennus_quest_detail",
    npcId: "npc_comerciante_valdris",
    text: "Simples — envie suas caravanas nas rotas disponíveis. Cada viagem bem-sucedida contribui para minha rede de suprimentos. Como recompensa adiantada, tome esta gorjeta.",
    choices: [
      { choiceId: "brennus_quest_reward", text: "Obrigado, Brennus. Começarei já.",
        nextId: null, rewardType: "ouro", rewardAmount: 500, isQuest: true, questLabel: "Missão aceita: Completar caravanas" },
    ],
  },
  {
    id: "dlg_brennus_lore",
    npcId: "npc_comerciante_valdris",
    text: "Valdris foi fundado pelo Imperador Valdris há cinco séculos. As ruínas ao sul guardam segredos daquele tempo. Muitos aventureiros entram, poucos voltam com bolsos cheios.",
    choices: [
      { choiceId: "brennus_ruins",  text: "O que há nas ruínas?",   nextId: "dlg_brennus_ruins"  },
      { choiceId: "brennus_back",   text: "Obrigado pela história.", nextId: "dlg_brennus_1"      },
    ],
  },
  {
    id: "dlg_brennus_ruins",
    npcId: "npc_comerciante_valdris",
    text: "O tesouro do Imperador Valdris ainda está lá — selado por magia antiga. Mas cuidado: os guardiões nunca morreram, apenas mudaram de forma. Explore as masmorras com cuidado.",
    choices: [
      { choiceId: "brennus_thanks", text: "Informação valiosa. Obrigado!",
        nextId: null, rewardType: "ouro", rewardAmount: 300 },
      { choiceId: "brennus_back2",  text: "Voltarei mais tarde.",   nextId: "dlg_brennus_1" },
    ],
  },
  {
    id: "dlg_brennus_trade",
    npcId: "npc_comerciante_valdris",
    text: "Tenho ervas, metais e pergaminhos. O mercado abre ao nascer do sol. Às vezes consigo itens raros de caravanas do Deserto Cinza — mas o fornecimento é imprevisível.",
    choices: [
      { choiceId: "brennus_caravan", text: "Como funcionam as caravanas?",  nextId: "dlg_brennus_caravan" },
      { choiceId: "brennus_back3",   text: "Passarei pelo mercado depois.", nextId: null                  },
    ],
  },
  {
    id: "dlg_brennus_caravan",
    npcId: "npc_comerciante_valdris",
    text: "Caravanas levam dias de viagem real. Envie heróis como escolta — quanto mais fortes, menores os riscos. Uma caravana sem escolta tem boa chance de ser saqueada no meio do caminho.",
    choices: [
      { choiceId: "brennus_invest", text: "Enviarei meus melhores heróis!",
        nextId: null, rewardType: "ouro", rewardAmount: 200 },
      { choiceId: "brennus_risky",  text: "Entendido. Serei cuidadoso.", nextId: "dlg_brennus_1" },
    ],
  },

  // ── Thorgam (ferreiro) — quests: forja, melhorias ──────────────────────────
  {
    id: "dlg_thorgam_1",
    npcId: "npc_ferreiro_picos",
    text: "Hmm? Um visitante. Sou Thorgam — forjo, não falo. Mas posso ter trabalho para alguém como você.",
    choices: [
      { choiceId: "thorgam_quest_forge",  text: "Você tem uma missão?",           nextId: "dlg_thorgam_quest_forge", isQuest: true },
      { choiceId: "thorgam_forge_info",   text: "Fale sobre a forja.",             nextId: "dlg_thorgam_forge"   },
      { choiceId: "thorgam_mounts",       text: "Como é viver nas montanhas?",     nextId: "dlg_thorgam_mounts"  },
      { choiceId: "thorgam_bye",          text: "Nada. Desculpe.",                 nextId: null                  },
    ],
  },
  {
    id: "dlg_thorgam_quest_forge",
    npcId: "npc_ferreiro_picos",
    text: "Preciso de minério. Minha forja consome muito. Se usar a Fortaleza para forjar e melhorar heróis regularmente, isso prova que você sabe trabalhar com metal. Em troca, dou cristais de mana.",
    choices: [
      { choiceId: "thorgam_accept",  text: "Usarei a Forja da minha Fortaleza.",
        nextId: null, rewardType: "cristaisAstra", rewardAmount: 150, isQuest: true, questLabel: "Missão: Usar a Forja 5 vezes" },
      { choiceId: "thorgam_decline", text: "Não por agora.",                   nextId: "dlg_thorgam_1" },
    ],
  },
  {
    id: "dlg_thorgam_forge",
    npcId: "npc_ferreiro_picos",
    text: "Esta forja tem trezentos anos. Meu avô a construiu sobre um filão de minério arcano. Armas forjadas aqui guardam um fragmento da montanha — são diferentes das outras.",
    choices: [
      { choiceId: "thorgam_learn",  text: "Pode me ensinar?",     nextId: "dlg_thorgam_learn"  },
      { choiceId: "thorgam_back",   text: "Impressionante.",      nextId: "dlg_thorgam_1"      },
    ],
  },
  {
    id: "dlg_thorgam_learn",
    npcId: "npc_ferreiro_picos",
    text: "Forjar é uma vida, não uma lição. Mas segredo: cristais de mana amplificam qualquer metal. Na Fortaleza, coloque um ferreiro na Oficina — o bônus será visível na produção.",
    choices: [
      { choiceId: "thorgam_reward", text: "Obrigado, Thorgam.",
        nextId: null, rewardType: "cristaisAstra", rewardAmount: 100 },
    ],
  },
  {
    id: "dlg_thorgam_mounts",
    npcId: "npc_ferreiro_picos",
    text: "Frio, silêncio e minério. Perfeito. Os anões têm um ditado: quem não aguenta o frio do pico nunca sentirá o calor do metal. A mina de cristais ao norte vale uma visita.",
    choices: [
      { choiceId: "thorgam_back2",  text: "Explorarei a mina.", nextId: null,
        rewardType: "ouro", rewardAmount: 150 },
      { choiceId: "thorgam_return", text: "Retornarei.",        nextId: "dlg_thorgam_1" },
    ],
  },

  // ── Eira (sábia) — quests: explorar regiões, conhecimento ─────────────────
  {
    id: "dlg_eira_1",
    npcId: "npc_sage_floresta",
    text: "Ah, um caminhante. A floresta me disse que virias. Sou Eira. Cada árvore aqui tem cem anos de memória. O que você busca?",
    choices: [
      { choiceId: "eira_quest_explore",  text: "Tem alguma missão para mim?",       nextId: "dlg_eira_quest_explore", isQuest: true },
      { choiceId: "eira_magic",          text: "Fale da magia desta floresta.",      nextId: "dlg_eira_magic"   },
      { choiceId: "eira_spirits",        text: "Que espíritos habitam aqui?",        nextId: "dlg_eira_spirits" },
      { choiceId: "eira_bye",            text: "Apenas passei.",                     nextId: null               },
    ],
  },
  {
    id: "dlg_eira_quest_explore",
    npcId: "npc_sage_floresta",
    text: "Sim. Preciso que um herói explore as regiões mais perigosas do mapa — o que você não conhece é o que te matará. Explore o Deserto Cinza ou o Vulcão. Retorne com os achados.",
    choices: [
      { choiceId: "eira_accept_explore", text: "Enviarei um herói imediatamente.",
        nextId: null, rewardType: "selosDeInvocacao", rewardAmount: 3, isQuest: true, questLabel: "Missão: Explorar uma região de nível 20+" },
      { choiceId: "eira_skip_explore",   text: "Quando meu herói estiver pronto.", nextId: "dlg_eira_1" },
    ],
  },
  {
    id: "dlg_eira_magic",
    npcId: "npc_sage_floresta",
    text: "A Floresta Eterna é alimentada pela energia residual dos Arcontes. Cada poro da terra pulsa com magia natural. Por isso as criaturas aqui são tão poderosas — mas também os tesouros.",
    choices: [
      { choiceId: "eira_harness",  text: "Posso aprender a canalizar isso?", nextId: "dlg_eira_harness" },
      { choiceId: "eira_back",     text: "Fascinante.",                      nextId: "dlg_eira_1"       },
    ],
  },
  {
    id: "dlg_eira_harness",
    npcId: "npc_sage_floresta",
    text: "Medite sob uma Árvore Anciã. Sua essência de habilidade se expandirá. Alternativamente — suba os andares da Torre. Cada andar é uma forma de meditação forçada.",
    choices: [
      { choiceId: "eira_gift", text: "Tentarei a Torre então.",
        nextId: null, rewardType: "cristaisAstra", rewardAmount: 200 },
      { choiceId: "eira_patience", text: "Prefiro a meditação.", nextId: "dlg_eira_1" },
    ],
  },
  {
    id: "dlg_eira_spirits",
    npcId: "npc_sage_floresta",
    text: "Os espíritos aqui são ecos de heróis que morreram protegendo a floresta. Não são malignos — apenas perdidos. Eles bênçoam quem age com honra. Vencer a Arena honra a memória deles.",
    choices: [
      { choiceId: "eira_bless", text: "Lutarei com honra na Arena.",
        nextId: null, rewardType: "selosDeInvocacao", rewardAmount: 2 },
      { choiceId: "eira_back2", text: "Respeitarei o santuário.", nextId: "dlg_eira_1" },
    ],
  },

  // ── Nereus (capitão) — quests: caravanas marítimas, boss hunt ──────────────
  {
    id: "dlg_nereus_1",
    npcId: "npc_capitao_porto",
    text: "Ahoy! Capitão Nereus à seu serviço. Naveguei todos os mares deste mundo. Tenho tesouros para compartilhar — por um preço justo.",
    choices: [
      { choiceId: "nereus_quest_kraken",  text: "Tem alguma missão perigosa?",      nextId: "dlg_nereus_quest_kraken", isQuest: true },
      { choiceId: "nereus_sea",           text: "Conte sobre o Mar Interno.",        nextId: "dlg_nereus_sea"   },
      { choiceId: "nereus_bye",           text: "Apenas admirando o horizonte.",     nextId: null               },
    ],
  },
  {
    id: "dlg_nereus_quest_kraken",
    npcId: "npc_capitao_porto",
    text: "Há um Boss nessas águas — o Kraken das Profundezas. Ele emergiu no Mar Interno e está destruindo rotas comerciais. Derrote-o uma vez e pago com minha reserva pessoal de Selos.",
    choices: [
      { choiceId: "nereus_accept_kraken", text: "Enfrentarei o Kraken.",
        nextId: null, rewardType: "selosDeInvocacao", rewardAmount: 5, isQuest: true, questLabel: "Missão: Derrotar 1 boss no Boss Hunt" },
      { choiceId: "nereus_skip_kraken",   text: "Não estou pronto ainda.", nextId: "dlg_nereus_1" },
    ],
  },
  {
    id: "dlg_nereus_sea",
    npcId: "npc_capitao_porto",
    text: "O Mar Interno tem profundezas que nenhum mapa alcança. Encontrei cidades submersas e tesouros de civilizações extintas. As rotas de caravana marítima são as mais lucrativas — e as mais mortais.",
    choices: [
      { choiceId: "nereus_temple", text: "Fale do Templo Afundado.",       nextId: "dlg_nereus_temple" },
      { choiceId: "nereus_back",   text: "Fascinante. Obrigado.",          nextId: "dlg_nereus_1"      },
    ],
  },
  {
    id: "dlg_nereus_temple",
    npcId: "npc_capitao_porto",
    text: "Fui lá uma vez. Só uma. As nagas que guardam o templo são antigas como o oceano. Mas os artefatos de lá valem cada cicatriz — e cada Selo de Invocação que você puder conter.",
    choices: [
      { choiceId: "nereus_chart",  text: "Tem algum mapa ou dica?",
        nextId: null, rewardType: "ouro", rewardAmount: 400 },
      { choiceId: "nereus_brave",  text: "Serei mais cuidadoso do que você.", nextId: "dlg_nereus_1" },
    ],
  },

  // ── Solaris (arconte) — quests: torre, Arena, poderes ──────────────────────
  {
    id: "dlg_solaris_1",
    npcId: "npc_arconte_luz",
    text: "Mortal. Você chegou ao Plano Celestial. Poucos têm força suficiente. Sou Solaris, Guardião da Luz. O que traz um ser de carne a este lugar?",
    choices: [
      { choiceId: "solaris_quest_tower",  text: "Busco um desafio digno.",            nextId: "dlg_solaris_quest_tower", isQuest: true },
      { choiceId: "solaris_truth",        text: "Busco a verdade sobre os Arcontes.", nextId: "dlg_solaris_truth"   },
      { choiceId: "solaris_power",        text: "Quero poder.",                        nextId: "dlg_solaris_power"  },
      { choiceId: "solaris_bye",          text: "Admiração, apenas.",                  nextId: null                 },
    ],
  },
  {
    id: "dlg_solaris_quest_tower",
    npcId: "npc_arconte_luz",
    text: "Desafio digno? Suba a Torre do Infinito além do andar 20. É onde os verdadeiros guerreiros são forjados. Retorne quando tiver passado dessa prova e darei uma bênção dos Arcontes.",
    choices: [
      { choiceId: "solaris_accept_tower", text: "Subirei até o andar 20.",
        nextId: null, rewardType: "cristaisAstra", rewardAmount: 500, isQuest: true, questLabel: "Missão: Atingir o andar 20 da Torre" },
      { choiceId: "solaris_skip_tower",   text: "Ainda não estou pronto.",           nextId: "dlg_solaris_1" },
    ],
  },
  {
    id: "dlg_solaris_truth",
    npcId: "npc_arconte_luz",
    text: "A verdade: os Arcontes não são deuses. Somos guardiões. Quando o Véu entre os planos foi rasgado, nós nos interpusemos. Cada Era renova nosso juramento.",
    choices: [
      { choiceId: "solaris_veil",   text: "O que está além do Véu?",      nextId: "dlg_solaris_veil"   },
      { choiceId: "solaris_back",   text: "Que peso enorme de carregar.", nextId: "dlg_solaris_1"      },
    ],
  },
  {
    id: "dlg_solaris_veil",
    npcId: "npc_arconte_luz",
    text: "Caos. Puro e vasto. Sem forma, sem propósito. Por isso os Arcontes existem — para que a Criação sobreviva ao Infinito. Sua jornada, herói, faz parte disso. Aceite seu papel.",
    choices: [
      { choiceId: "solaris_bless", text: "Aceito esse fardo.",
        nextId: null, rewardType: "cristaisAstra", rewardAmount: 300 },
      { choiceId: "solaris_back2", text: "Preciso processar isso.", nextId: "dlg_solaris_1" },
    ],
  },
  {
    id: "dlg_solaris_power",
    npcId: "npc_arconte_luz",
    text: "Poder sem propósito é destruição. Mas vejo em você algo mais — uma chama que não se apaga facilmente. Prove que usa o poder para proteger os mais fracos.",
    choices: [
      { choiceId: "solaris_prove",  text: "Como posso provar meu valor?", nextId: "dlg_solaris_prove"  },
      { choiceId: "solaris_back3",  text: "Retornarei quando for mais forte.", nextId: null             },
    ],
  },
  {
    id: "dlg_solaris_prove",
    npcId: "npc_arconte_luz",
    text: "Vença na Arena cem vezes. Não por glória pessoal — mostre que você pode dominar estratégia e combate. O Plano Celestial se abrirá mais para você quando o fizer.",
    choices: [
      { choiceId: "solaris_accept_arena", text: "Aceito o desafio da Arena.",
        nextId: null, rewardType: "selosDeInvocacao", rewardAmount: 5, isQuest: true, questLabel: "Missão: Vencer 10 lutas na Arena" },
    ],
  },
];

export const DIALOGUE_MAP: Record<string, DialogueNode> =
  Object.fromEntries(DIALOGUE_NODES.map((d) => [d.id, d]));
