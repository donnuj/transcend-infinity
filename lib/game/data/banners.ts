import type { BannerDef } from "../types";

export const BANNERS: BannerDef[] = [
  {
    bannerId: "ascensao_celestial",
    name: "Ascensão Celestial",
    lore: "Os heróis mais poderosos do plano da Luz respondem ao chamado do Invocador.",
    invocationType: "Herois",
    isLimited: false,
    pityThreshold: 90,
    softPityStart: 75,
    pool: [
      // Lendário 3%
      { heroId: "serah_celestial",    rarity: "Lendário", weight: 1.0  },
      { heroId: "azara_serafim",      rarity: "Lendário", weight: 0.7  },
      { heroId: "valdris_imperador",  rarity: "Lendário", weight: 0.7  },
      { heroId: "kaelith_eterno",     rarity: "Lendário", weight: 0.5  },
      { heroId: "lunae_profetisa",    rarity: "Lendário", weight: 0.1  },
      // Épico 12%
      { heroId: "aria_valquiria",     rarity: "Épico",    weight: 3.0  },
      { heroId: "sylvan_druida",      rarity: "Épico",    weight: 2.5  },
      { heroId: "frost_cavaleiro",    rarity: "Épico",    weight: 2.5  },
      { heroId: "zephyr_vento",       rarity: "Épico",    weight: 2.0  },
      { heroId: "gornak_ferreiro",    rarity: "Épico",    weight: 1.0  },
      { heroId: "mira_alquimista",    rarity: "Épico",    weight: 1.0  },
      // Raro 25%
      { heroId: "selene_maga",        rarity: "Raro",     weight: 6.0  },
      { heroId: "aldric_cavaleiro_negro", rarity: "Raro", weight: 5.5  },
      { heroId: "ember_fenix",        rarity: "Raro",     weight: 5.5  },
      { heroId: "bastion_guardiao",   rarity: "Raro",     weight: 4.5  },
      { heroId: "lyra_sereia",        rarity: "Raro",     weight: 3.5  },
      // Incomum 35%
      { heroId: "marco_soldado",      rarity: "Incomum",  weight: 12.0 },
      { heroId: "nyx_elfa",           rarity: "Incomum",  weight: 10.0 },
      { heroId: "kaito_monge",        rarity: "Incomum",  weight: 7.0  },
      { heroId: "krak_golem",         rarity: "Incomum",  weight: 6.0  },
      // Comum 25%
      { heroId: "brennan_escudeiro",  rarity: "Comum",    weight: 10.0 },
      { heroId: "hana_curandeira",    rarity: "Comum",    weight: 8.0  },
      { heroId: "finn_aprendiz",      rarity: "Comum",    weight: 7.0  },
    ],
  },
  {
    bannerId: "chama_eterna",
    name: "Chama Eterna",
    lore: "Heróis do elemento Fogo dominam este banner. Kaelith e seus aliados das chamas.",
    invocationType: "Herois",
    isLimited: true,
    startDate: "2026-09-01",
    endDate: "2026-10-01",
    pityThreshold: 90,
    softPityStart: 75,
    pool: [
      // Lendário 3% — rate up em Kaelith
      { heroId: "kaelith_eterno",     rarity: "Lendário", weight: 2.0  },
      { heroId: "serah_celestial",    rarity: "Lendário", weight: 0.5  },
      { heroId: "morghul_titan",      rarity: "Lendário", weight: 0.5  },
      // Épico 12% — rate up em Gornak
      { heroId: "gornak_ferreiro",    rarity: "Épico",    weight: 5.0  },
      { heroId: "aria_valquiria",     rarity: "Épico",    weight: 3.5  },
      { heroId: "ossirus_necromante", rarity: "Épico",    weight: 3.5  },
      // Raro 25%
      { heroId: "kira_xama",          rarity: "Raro",     weight: 9.0  },
      { heroId: "ember_fenix",        rarity: "Raro",     weight: 8.0  },
      { heroId: "aldric_cavaleiro_negro", rarity: "Raro", weight: 8.0  },
      // Incomum 35%
      { heroId: "marco_soldado",      rarity: "Incomum",  weight: 18.0 },
      { heroId: "kaito_monge",        rarity: "Incomum",  weight: 17.0 },
      // Comum 25%
      { heroId: "brennan_escudeiro",  rarity: "Comum",    weight: 15.0 },
      { heroId: "finn_aprendiz",      rarity: "Comum",    weight: 10.0 },
    ],
  },
  {
    bannerId: "abismo_sombrio",
    name: "Abismo Sombrio",
    lore: "Das profundezas das Trevas surgem guerreiros que a luz não pode tocar.",
    invocationType: "Herois",
    isLimited: false,
    pityThreshold: 90,
    softPityStart: 75,
    pool: [
      // Lendário 3%
      { heroId: "morghul_titan",      rarity: "Lendário", weight: 1.5  },
      { heroId: "lunae_profetisa",    rarity: "Lendário", weight: 0.8  },
      { heroId: "pyreth_alma",        rarity: "Lendário", weight: 0.7  },
      // Épico 12%
      { heroId: "ossirus_necromante", rarity: "Épico",    weight: 4.0  },
      { heroId: "sylvan_druida",      rarity: "Épico",    weight: 4.0  },
      { heroId: "frost_cavaleiro",    rarity: "Épico",    weight: 4.0  },
      // Raro 25%
      { heroId: "aldric_cavaleiro_negro", rarity: "Raro", weight: 8.0  },
      { heroId: "gale_espirito",      rarity: "Raro",     weight: 8.0  },
      { heroId: "bastion_guardiao",   rarity: "Raro",     weight: 9.0  },
      // Incomum 35%
      { heroId: "nyx_elfa",           rarity: "Incomum",  weight: 18.0 },
      { heroId: "krak_golem",         rarity: "Incomum",  weight: 17.0 },
      // Comum 25%
      { heroId: "brennan_escudeiro",  rarity: "Comum",    weight: 13.0 },
      { heroId: "hana_curandeira",    rarity: "Comum",    weight: 12.0 },
    ],
  },
  {
    bannerId: "novato",
    name: "Banner do Novato",
    lore: "10 invocações com garantia de pelo menos 3 heróis Raros ou superior.",
    invocationType: "Herois",
    isLimited: false,
    pityThreshold: 10,  // garante lendário ou épico no 10-pull do novato
    softPityStart: 8,
    pool: [
      { heroId: "marco_soldado",      rarity: "Incomum",  weight: 20.0 },
      { heroId: "nyx_elfa",           rarity: "Incomum",  weight: 15.0 },
      { heroId: "kaito_monge",        rarity: "Incomum",  weight: 15.0 },
      { heroId: "selene_maga",        rarity: "Raro",     weight: 12.0 },
      { heroId: "ember_fenix",        rarity: "Raro",     weight: 12.0 },
      { heroId: "aldric_cavaleiro_negro", rarity: "Raro", weight: 10.0 },
      { heroId: "bastion_guardiao",   rarity: "Raro",     weight: 8.0  },
      { heroId: "aria_valquiria",     rarity: "Épico",    weight: 5.0  },
      { heroId: "frost_cavaleiro",    rarity: "Épico",    weight: 3.0  },
    ],
  },
];

export const BANNER_MAP: Record<string, BannerDef> =
  Object.fromEntries(BANNERS.map((b) => [b.bannerId, b]));
