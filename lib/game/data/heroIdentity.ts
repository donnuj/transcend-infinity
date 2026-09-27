/**
 * Unique visual identity per hero.
 * Color must not repeat across heroes — this is the single source of truth.
 * accentColor: hero's personal color (HSL picked to not clash with rarity frame)
 * bgTone: dominant atmospheric tint for the portrait area
 */
export type HeroIdentity = {
  accentColor: string;
  bgTone: string;
  patternAngle: number;
};

export const HERO_IDENTITY: Record<string, HeroIdentity> = {
  // ── Lendário ────────────────────────────────────────────────────────
  serah_celestial:        { accentColor: "#e8d460", bgTone: "rgba(232,212,96,0.14)",  patternAngle: 135 },
  kaelith_eterno:         { accentColor: "#ff4010", bgTone: "rgba(255,64,16,0.14)",   patternAngle: 160 },
  azara_serafim:          { accentColor: "#e0308a", bgTone: "rgba(224,48,138,0.14)",  patternAngle: 45  },
  morghul_titan:          { accentColor: "#8820d0", bgTone: "rgba(136,32,208,0.14)",  patternAngle: 200 },
  lunae_profetisa:        { accentColor: "#1850c8", bgTone: "rgba(24,80,200,0.14)",   patternAngle: 300 },
  valdris_imperador:      { accentColor: "#c8a000", bgTone: "rgba(200,160,0,0.14)",   patternAngle: 90  },
  pyreth_alma:            { accentColor: "#209870", bgTone: "rgba(32,152,112,0.14)",  patternAngle: 240 },
  // ── Épico ────────────────────────────────────────────────────────────
  sylvan_druida:          { accentColor: "#286820", bgTone: "rgba(40,104,32,0.14)",   patternAngle: 175 },
  frost_cavaleiro:        { accentColor: "#30b0e0", bgTone: "rgba(48,176,224,0.14)",  patternAngle: 260 },
  aria_valquiria:         { accentColor: "#e06070", bgTone: "rgba(224,96,112,0.14)",  patternAngle: 80  },
  ossirus_necromante:     { accentColor: "#a0a888", bgTone: "rgba(160,168,136,0.14)", patternAngle: 320 },
  zephyr_vento:           { accentColor: "#18c898", bgTone: "rgba(24,200,152,0.14)",  patternAngle: 30  },
  gornak_ferreiro:        { accentColor: "#a04010", bgTone: "rgba(160,64,16,0.14)",   patternAngle: 195 },
  mira_alquimista:        { accentColor: "#e84060", bgTone: "rgba(232,64,96,0.14)",   patternAngle: 115 },
  // ── Raro ─────────────────────────────────────────────────────────────
  selene_maga:            { accentColor: "#7040d8", bgTone: "rgba(112,64,216,0.14)",  patternAngle: 290 },
  ember_fenix:            { accentColor: "#ff6810", bgTone: "rgba(255,104,16,0.14)",  patternAngle: 145 },
  aldric_cavaleiro_negro: { accentColor: "#4870a0", bgTone: "rgba(72,112,160,0.14)",  patternAngle: 210 },
  lyra_sereia:            { accentColor: "#2090c8", bgTone: "rgba(32,144,200,0.14)",  patternAngle: 270 },
  bastion_guardiao:       { accentColor: "#608038", bgTone: "rgba(96,128,56,0.14)",   patternAngle: 0   },
  gale_espirito:          { accentColor: "#50c8a8", bgTone: "rgba(80,200,168,0.14)",  patternAngle: 60  },
  kira_xama:              { accentColor: "#c86020", bgTone: "rgba(200,96,32,0.14)",   patternAngle: 170 },
  // ── Incomum ──────────────────────────────────────────────────────────
  marco_soldado:          { accentColor: "#806040", bgTone: "rgba(128,96,64,0.14)",   patternAngle: 180 },
  nyx_elfa:               { accentColor: "#406840", bgTone: "rgba(64,104,64,0.14)",   patternAngle: 340 },
  krak_golem:             { accentColor: "#907060", bgTone: "rgba(144,112,96,0.14)",  patternAngle: 225 },
  kaito_monge:            { accentColor: "#c09858", bgTone: "rgba(192,152,88,0.14)",  patternAngle: 15  },
  // ── Comum ────────────────────────────────────────────────────────────
  brennan_escudeiro:      { accentColor: "#4868a0", bgTone: "rgba(72,104,160,0.14)",  patternAngle: 100 },
  hana_curandeira:        { accentColor: "#d07888", bgTone: "rgba(208,120,136,0.14)", patternAngle: 55  },
  finn_aprendiz:          { accentColor: "#9880a8", bgTone: "rgba(152,128,168,0.14)", patternAngle: 310 },
};

export const CLASS_ICON: Record<string, string> = {
  Arqueiro:    "ra-archer",
  Mago:        "ra-crystal-wand",
  Curandeiro:  "ra-fizzing-flask",
  Gladiador:   "ra-broadsword",
  Bruxo:       "ra-crystal-ball",
  Espadachim:  "ra-crossed-swords",
  Guarda:      "ra-heavy-shield",
  Alquimista:  "ra-flask",
  Ferreiro:    "ra-anvil",
  Caçador:     "ra-crossbow",
};

export const ELEMENT_RA: Record<string, string> = {
  Fire:      "ra-fire",
  Water:     "ra-water-drop",
  Wind:      "ra-feather-wing",
  Earth:     "ra-mountains",
  Light:     "ra-sun",
  Dark:      "ra-death-skull",
  Lightning: "ra-lightning-bolt",
  None:      "ra-rune-stone",
};

export const RARITY_STARS: Record<string, number> = {
  Divino:   5,
  Mítico:   5,
  Lendário: 5,
  Épico:    4,
  Raro:     3,
  Incomum:  2,
  Comum:    1,
};
