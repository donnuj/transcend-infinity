export type DialogueChoice = {
  choiceId: string;
  text: string;
  nextId: string | null;
  rewardType?: string;
  rewardAmount?: number;
};

export type DialogueNode = {
  id: string;
  npcId: string;
  text: string;
  choices: DialogueChoice[];
};

export const DIALOGUE_NODES: DialogueNode[] = [
  // ── Brennus (comerciante) ────────────────────────────────────────────────────
  {
    id: "dlg_brennus_1",
    npcId: "npc_comerciante_valdris",
    text: "Bem-vindo, aventureiro! Sou Brennus, mercador das Planícies de Valdris. O que deseja saber?",
    choices: [
      { choiceId: "brennus_lore",   text: "Conte-me sobre Valdris.",      nextId: "dlg_brennus_lore"   },
      { choiceId: "brennus_trade",  text: "O que você comercia?",          nextId: "dlg_brennus_trade"  },
      { choiceId: "brennus_bye",    text: "Não preciso de nada. Até logo.", nextId: null                 },
    ],
  },
  {
    id: "dlg_brennus_lore",
    npcId: "npc_comerciante_valdris",
    text: "Valdris foi fundado pelo Imperador do mesmo nome há cinco séculos. As ruínas ao sul guardam segredos daquele tempo. Muitos aventureiros entram, poucos voltam com os bolsos cheios.",
    choices: [
      { choiceId: "brennus_ruins",  text: "O que há nas ruínas?",          nextId: "dlg_brennus_ruins"  },
      { choiceId: "brennus_back",   text: "Obrigado pela informação.",      nextId: "dlg_brennus_1"      },
    ],
  },
  {
    id: "dlg_brennus_ruins",
    npcId: "npc_comerciante_valdris",
    text: "Dizem que o tesouro do Imperador Valdris ainda está lá, selado por uma magia antiga. Mas cuidado — os guardiões nunca morreram, apenas mudaram de forma.",
    choices: [
      { choiceId: "brennus_thanks", text: "Informação valiosa. Obrigado.", nextId: null,
        rewardType: "ouro", rewardAmount: 50 },
      { choiceId: "brennus_back2",  text: "Voltarei mais tarde.",           nextId: "dlg_brennus_1"  },
    ],
  },
  {
    id: "dlg_brennus_trade",
    npcId: "npc_comerciante_valdris",
    text: "Tenho de tudo: ervas, metais, pergaminhos de feitiços. O mercado abre ao nascer do sol. Às vezes consigo itens raros de caravanas do Deserto Cinza.",
    choices: [
      { choiceId: "brennus_caravan", text: "Uma caravana do deserto?",     nextId: "dlg_brennus_caravan" },
      { choiceId: "brennus_back3",   text: "Passarei pelo mercado.",       nextId: null                  },
    ],
  },
  {
    id: "dlg_brennus_caravan",
    npcId: "npc_comerciante_valdris",
    text: "Sim! As caravanas partem a cada semana. Investir ouro nas rotas pode trazer retornos generosos — mas o deserto é traiçoeiro.",
    choices: [
      { choiceId: "brennus_invest", text: "Parece lucrativo.", nextId: null,
        rewardType: "ouro", rewardAmount: 100 },
      { choiceId: "brennus_risky",  text: "Muito arriscado para mim.", nextId: "dlg_brennus_1" },
    ],
  },

  // ── Thorgam (ferreiro) ────────────────────────────────────────────────────────
  {
    id: "dlg_thorgam_1",
    npcId: "npc_ferreiro_picos",
    text: "Hmm? Um visitante nos Picos. Sou Thorgam. Falo pouco, forjo muito. O que quer?",
    choices: [
      { choiceId: "thorgam_forge",  text: "Fale-me da sua forja.",           nextId: "dlg_thorgam_forge"   },
      { choiceId: "thorgam_mounts", text: "Como é viver nas montanhas?",     nextId: "dlg_thorgam_mounts"  },
      { choiceId: "thorgam_bye",    text: "Nada. Desculpe a interrupção.",   nextId: null                  },
    ],
  },
  {
    id: "dlg_thorgam_forge",
    npcId: "npc_ferreiro_picos",
    text: "Esta forja tem trezentos anos. Meu avô a construiu sobre um filão de minério arcano. As armas que saem daqui guardam um fragmento da montanha dentro delas.",
    choices: [
      { choiceId: "thorgam_learn",  text: "Pode me ensinar a forjar?",    nextId: "dlg_thorgam_learn"  },
      { choiceId: "thorgam_back",   text: "Impressionante.",               nextId: "dlg_thorgam_1"      },
    ],
  },
  {
    id: "dlg_thorgam_learn",
    npcId: "npc_ferreiro_picos",
    text: "Hah. Forjar é uma vida, não uma lição. Mas posso compartilhar um segredo: cristais de mana amplificam qualquer metal se adicionados na fase da lua cheia.",
    choices: [
      { choiceId: "thorgam_reward", text: "Obrigado, Thorgam.", nextId: null,
        rewardType: "cristaisAstra", rewardAmount: 50 },
    ],
  },
  {
    id: "dlg_thorgam_mounts",
    npcId: "npc_ferreiro_picos",
    text: "Frio, silêncio e minério. Perfeito. Os anões têm um ditado: quem não aguenta o frio do pico nunca sentirá o calor do metal. A mina de cristais ao norte vale a visita.",
    choices: [
      { choiceId: "thorgam_back2",  text: "Explorarei a mina.",   nextId: null },
      { choiceId: "thorgam_return", text: "Retornarei.",           nextId: "dlg_thorgam_1" },
    ],
  },

  // ── Eira (sábia) ────────────────────────────────────────────────────────────────
  {
    id: "dlg_eira_1",
    npcId: "npc_sage_floresta",
    text: "Ah, um caminhante. A floresta me disse que virias. Sou Eira. Cada árvore aqui tem cem anos de memória. O que busca saber?",
    choices: [
      { choiceId: "eira_magic",    text: "Fale-me da magia desta floresta.", nextId: "dlg_eira_magic"   },
      { choiceId: "eira_spirits",  text: "Que espíritos habitam aqui?",      nextId: "dlg_eira_spirits" },
      { choiceId: "eira_bye",      text: "Apenas passei por aqui.",          nextId: null               },
    ],
  },
  {
    id: "dlg_eira_magic",
    npcId: "npc_sage_floresta",
    text: "A Floresta Eterna é alimentada pela energia residual dos Arcontes. Cada poro da terra pulsa com magia natural. Por isso as criaturas aqui são tão poderosas.",
    choices: [
      { choiceId: "eira_harness",  text: "Posso aprender a canalizar isso?",  nextId: "dlg_eira_harness" },
      { choiceId: "eira_back",     text: "Fascinante. Obrigado.",              nextId: "dlg_eira_1"       },
    ],
  },
  {
    id: "dlg_eira_harness",
    npcId: "npc_sage_floresta",
    text: "Sim. Medite sob uma Árvore Anciã por uma hora completa. Sua essência de habilidade se expandirá naturalmente. Poucos têm a paciência para isso.",
    choices: [
      { choiceId: "eira_gift",     text: "Tentarei isso.", nextId: null,
        rewardType: "cristaisAstra", rewardAmount: 75 },
      { choiceId: "eira_patience", text: "Não tenho tanto tempo.", nextId: "dlg_eira_1" },
    ],
  },
  {
    id: "dlg_eira_spirits",
    npcId: "npc_sage_floresta",
    text: "Os espíritos aqui são ecos de heróis que morreram protegendo a floresta. Não são malignos — apenas perdidos. Às vezes concedem bênçãos a quem os respeita.",
    choices: [
      { choiceId: "eira_bless",    text: "Quero sua bênção.",              nextId: null,
        rewardType: "selosDeInvocacao", rewardAmount: 1 },
      { choiceId: "eira_back2",    text: "Respeitarei o santuário.",        nextId: "dlg_eira_1" },
    ],
  },

  // ── Nereus (capitão) ────────────────────────────────────────────────────────────
  {
    id: "dlg_nereus_1",
    npcId: "npc_capitao_porto",
    text: "Ahoy! Capitão Nereus, à seu serviço. Naveguei todos os mares deste mundo. O que o traz ao Porto de Lyra?",
    choices: [
      { choiceId: "nereus_sea",    text: "Conte sobre o Mar Interno.",       nextId: "dlg_nereus_sea"   },
      { choiceId: "nereus_kraken", text: "O Kraken é real?",                  nextId: "dlg_nereus_kraken"},
      { choiceId: "nereus_bye",    text: "Só admirando o horizonte.",         nextId: null               },
    ],
  },
  {
    id: "dlg_nereus_sea",
    npcId: "npc_capitao_porto",
    text: "O Mar Interno tem profundidades que nenhum mapa alcança. Encontrei cidades submersas, tesouros de civilizações extintas. E perigos que não ouso nomear.",
    choices: [
      { choiceId: "nereus_temple", text: "O Templo Afundado?",              nextId: "dlg_nereus_temple" },
      { choiceId: "nereus_back",   text: "Que história fascinante.",        nextId: "dlg_nereus_1"      },
    ],
  },
  {
    id: "dlg_nereus_temple",
    npcId: "npc_capitao_porto",
    text: "Ah, o Templo. Fui lá uma vez. Só uma. As nagas que o guardam são antigas como o próprio oceano. Mas os artefatos de lá valem cada cicatriz.",
    choices: [
      { choiceId: "nereus_chart",  text: "Tem algum mapa?", nextId: null,
        rewardType: "ouro", rewardAmount: 150 },
      { choiceId: "nereus_brave",  text: "Serei mais cuidadoso do que você.", nextId: "dlg_nereus_1" },
    ],
  },
  {
    id: "dlg_nereus_kraken",
    npcId: "npc_capitao_porto",
    text: "Real? Perdi meu navio anterior para ele. Emerge das profundezas quando a lua está no zênite. Não o procure a menos que seja muito, muito poderoso.",
    choices: [
      { choiceId: "nereus_strong",  text: "Serei poderoso o suficiente.",   nextId: null },
      { choiceId: "nereus_back2",   text: "Tomarei seu conselho.",           nextId: "dlg_nereus_1" },
    ],
  },

  // ── Solaris (arconte) ────────────────────────────────────────────────────────────
  {
    id: "dlg_solaris_1",
    npcId: "npc_arconte_luz",
    text: "Mortal. Você chegou ao Plano Celestial. Poucos têm força suficiente. Sou Solaris, Guardião da Luz. O que traz um ser de carne a este lugar?",
    choices: [
      { choiceId: "solaris_truth",  text: "Busco a verdade sobre os Arcontes.", nextId: "dlg_solaris_truth"   },
      { choiceId: "solaris_power",  text: "Quero poder.",                        nextId: "dlg_solaris_power"  },
      { choiceId: "solaris_bye",    text: "Admiração, apenas.",                  nextId: null                 },
    ],
  },
  {
    id: "dlg_solaris_truth",
    npcId: "npc_arconte_luz",
    text: "A verdade: os Arcontes não são deuses. Somos guardiões. Quando o Véu entre os planos foi rasgado, nós nos interpusemos. Cada Era renova nosso juramento.",
    choices: [
      { choiceId: "solaris_veil",   text: "O que está além do Véu?",            nextId: "dlg_solaris_veil"   },
      { choiceId: "solaris_back",   text: "Que peso enorme de carregar.",        nextId: "dlg_solaris_1"      },
    ],
  },
  {
    id: "dlg_solaris_veil",
    npcId: "npc_arconte_luz",
    text: "Caos. Puro e vasto. Sem forma, sem propósito. Por isso os Arcontes existem — para que a Criação sobreviva ao Infinito. Sua jornada, herói, faz parte disso.",
    choices: [
      { choiceId: "solaris_bless",  text: "Aceito esse fardo.", nextId: null,
        rewardType: "cristaisAstra", rewardAmount: 200 },
      { choiceId: "solaris_back2",  text: "Preciso processar isso.",            nextId: "dlg_solaris_1"  },
    ],
  },
  {
    id: "dlg_solaris_power",
    npcId: "npc_arconte_luz",
    text: "Poder sem propósito é risco. Mas posso ver em você algo mais — uma chama que não se apaga facilmente. Prove seu valor e eu considerarei.",
    choices: [
      { choiceId: "solaris_prove",  text: "Como posso provar meu valor?",    nextId: "dlg_solaris_prove"  },
      { choiceId: "solaris_back3",  text: "Retornarei quando for mais forte.",nextId: null                 },
    ],
  },
  {
    id: "dlg_solaris_prove",
    npcId: "npc_arconte_luz",
    text: "Derrote cem inimigos. Não por ouro, não por glória — por proteger os mais fracos. Quando fizer isso, o Plano Celestial se abrirá mais para você.",
    choices: [
      { choiceId: "solaris_accept", text: "Aceito o desafio.", nextId: null,
        rewardType: "selosDeInvocacao", rewardAmount: 2 },
    ],
  },
];

export const DIALOGUE_MAP: Record<string, DialogueNode> =
  Object.fromEntries(DIALOGUE_NODES.map((d) => [d.id, d]));
