"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HEROES, HERO_MAP } from "@/lib/game/data/heroes";
import { ITEM_MAP, EQUIP_MAP, RUNE_MAP } from "@/lib/game/data/items";
import { SKILL_MAP } from "@/lib/game/data/skills";

const ease = [0.23, 1, 0.32, 1] as const;

type Section = "herois" | "itens" | "equipamentos" | "runas";

const ELEMENT_COLORS: Record<string, string> = {
  Fogo: "rgb(255,100,60)",
  Água: "rgb(60,160,255)",
  Terra: "rgb(140,200,60)",
  Vento: "rgb(100,220,200)",
  Luz: "rgb(255,220,80)",
  Trevas: "rgb(170,100,255)",
  Neutro: "rgba(200,200,200,0.6)",
};

const RARITY_COLORS: Record<string, string> = {
  Lendário: "rgb(255,180,50)",
  Épico: "rgb(200,100,255)",
  Raro: "rgb(70,130,255)",
  Incomum: "rgb(80,200,120)",
  Comum: "rgba(200,200,200,0.6)",
};

export default function CodexModal({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<Section>("herois");
  const [selectedHeroId, setSelectedHeroId] = useState<string | null>(null);
  const { save } = useGameStore();

  const discoveredIds = save.codex.discoveredIds;
  const collectedHeroIds = new Set(save.collectedHeroIds.map((k) => k.split("|")[1]));

  const totalHeroes = HEROES.length;
  const discoveredHeroes = HEROES.filter((h) => collectedHeroIds.has(h.heroId) || discoveredIds.includes(h.heroId)).length;

  const allItems = Object.values(ITEM_MAP);
  const allEquips = Object.values(EQUIP_MAP);
  const allRunes = Object.values(RUNE_MAP);

  const selectedHero = selectedHeroId ? HERO_MAP[selectedHeroId] : null;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={selectedHeroId ? () => setSelectedHeroId(null) : onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {selectedHeroId ? "Voltar" : "Fechar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">CODEX</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">{discoveredHeroes}/{totalHeroes} heróis</span>
      </div>

      {!selectedHeroId ? (
        <>
          {/* Section tabs */}
          <div className="flex gap-1 border-b border-violet/10 px-4 py-2">
            {(["herois","itens","equipamentos","runas"] as const).map((s) => (
              <motion.button
                key={s}
                onClick={() => setSection(s)}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 rounded-lg py-1.5 text-[8px] font-bold tracking-wider capitalize"
                style={{
                  background: section === s ? "rgba(200,155,60,0.1)" : "transparent",
                  color: section === s ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
                  border: `1px solid ${section === s ? "rgba(200,155,60,0.3)" : "transparent"}`,
                }}
              >
                {s === "herois" ? "HERÓIS" : s === "itens" ? "ITENS" : s === "equipamentos" ? "EQUIP." : "RUNAS"}
              </motion.button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
            <AnimatePresence mode="wait">
              {section === "herois" && (
                <motion.div key="herois" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <div className="grid grid-cols-3 gap-2">
                    {HEROES.map((hero) => {
                      const discovered = collectedHeroIds.has(hero.heroId) || discoveredIds.includes(hero.heroId);
                      const collected = collectedHeroIds.has(hero.heroId);
                      return (
                        <motion.button
                          key={hero.heroId}
                          onClick={discovered ? () => setSelectedHeroId(hero.heroId) : undefined}
                          whileTap={discovered ? { scale: 0.94 } : undefined}
                          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                          className="flex flex-col items-center rounded-xl border py-3"
                          style={{
                            borderColor: collected ? `${RARITY_COLORS[hero.rarity] ?? "rgba(122,111,160,0.15)"}40` : "rgba(122,111,160,0.1)",
                            background: collected ? `${RARITY_COLORS[hero.rarity] ?? "rgba(122,111,160,0.04)"}10` : "rgba(122,111,160,0.03)",
                            opacity: discovered ? 1 : 0.35,
                          }}
                        >
                          <span className="mb-1 text-2xl" style={{ filter: discovered ? "none" : "grayscale(1)" }}>
                            {discovered ? hero.portrait : "?"}
                          </span>
                          <p className="text-center text-[8px] font-bold" style={{ color: collected ? "rgba(255,255,255,0.8)" : "rgba(122,111,160,0.5)" }}>
                            {discovered ? hero.name.split(",")[0] : "???"}
                          </p>
                          {discovered && (
                            <p className="text-[7px]" style={{ color: RARITY_COLORS[hero.rarity] ?? "rgba(122,111,160,0.4)" }}>
                              {hero.rarity}
                            </p>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {section === "itens" && (
                <motion.div key="itens" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <div className="flex flex-col gap-2">
                    {allItems.map((item) => {
                      const owned = save.inventory.some((i) => i.itemId === item.itemId);
                      return (
                        <div
                          key={item.itemId}
                          className="flex items-center gap-3 rounded-xl border px-4 py-3"
                          style={{
                            borderColor: owned ? "rgba(200,155,60,0.2)" : "rgba(122,111,160,0.08)",
                            background: owned ? "rgba(200,155,60,0.04)" : "transparent",
                            opacity: owned ? 1 : 0.4,
                          }}
                        >
                          <span className="text-xl">◈</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-cream/80">{item.name}</p>
                            <p className="text-[9px] text-violet/40">{item.description}</p>
                          </div>
                          {owned && (
                            <span className="text-[9px] font-bold text-amber-400">
                              ×{save.inventory.find((i) => i.itemId === item.itemId)?.qty ?? 0}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {section === "equipamentos" && (
                <motion.div key="equip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <div className="flex flex-col gap-2">
                    {allEquips.map((eq) => {
                      const owned = save.equipmentInventory.includes(eq.equipId);
                      const mainStat = Object.entries(eq.statBonus ?? {}).map(([k,v]) => `+${v} ${k}`).join(" ");
                      return (
                        <div
                          key={eq.equipId}
                          className="flex items-center gap-3 rounded-xl border px-4 py-3"
                          style={{
                            borderColor: owned ? "rgba(100,160,255,0.2)" : "rgba(122,111,160,0.08)",
                            background: owned ? "rgba(100,160,255,0.04)" : "transparent",
                            opacity: owned ? 1 : 0.4,
                          }}
                        >
                          <span className="text-xl">⚔</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-cream/80">{eq.name}</p>
                            <p className="text-[9px] text-violet/40">{eq.slot} · {mainStat}</p>
                          </div>
                          {owned && <span className="text-[9px] font-bold" style={{ color: "rgb(100,160,255)" }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {section === "runas" && (
                <motion.div key="runas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                  <div className="flex flex-col gap-2">
                    {allRunes.map((rune) => {
                      const owned = save.runeInventory.includes(rune.runeId);
                      return (
                        <div
                          key={rune.runeId}
                          className="flex items-center gap-3 rounded-xl border px-4 py-3"
                          style={{
                            borderColor: owned ? "rgba(170,130,255,0.2)" : "rgba(122,111,160,0.08)",
                            background: owned ? "rgba(170,130,255,0.04)" : "transparent",
                            opacity: owned ? 1 : 0.4,
                          }}
                        >
                          <span className="text-xl">◈</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-cream/80">{rune.name}</p>
                            <p className="text-[9px] text-violet/40">{rune.description}</p>
                          </div>
                          {owned && <span className="text-[9px] font-bold" style={{ color: "rgb(170,130,255)" }}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Hero detail */
        selectedHero && (
          <motion.div
            key="hero-detail"
            className="flex flex-1 flex-col overflow-y-auto px-5 py-5"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease }}
          >
            <div className="mb-5 flex items-center gap-4">
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border text-4xl"
                style={{
                  borderColor: `${RARITY_COLORS[selectedHero.rarity] ?? "rgba(122,111,160,0.2)"}50`,
                  background: `${RARITY_COLORS[selectedHero.rarity] ?? "rgba(122,111,160,0.04)"}10`,
                }}
              >
                {selectedHero.portrait}
              </div>
              <div>
                <p className="text-xl font-black tracking-wide text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                  {selectedHero.name.split(",")[0]}
                </p>
                <p className="text-[10px]" style={{ color: ELEMENT_COLORS[selectedHero.element] ?? "rgba(122,111,160,0.5)" }}>
                  {selectedHero.element} · {selectedHero.role}
                </p>
                <p className="text-[8px] font-bold" style={{ color: RARITY_COLORS[selectedHero.rarity] ?? "rgba(122,111,160,0.4)" }}>
                  {selectedHero.rarity}
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Atributos Base</p>
              <div className="grid grid-cols-2 gap-x-4">
                {Object.entries(selectedHero.baseStats).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-violet/8 py-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-violet/40">{k}</span>
                    <span className="text-[10px] font-bold text-cream/70">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Habilidades</p>
              {selectedHero.skillIds.map((skillId) => {
                const skill = SKILL_MAP[skillId];
                if (!skill) return null;
                return (
                  <div key={skillId} className="mb-2 last:mb-0 border-b border-violet/8 pb-2 last:border-0 last:pb-0">
                    <p className="text-[11px] font-bold text-cream/80">{skill.name}</p>
                    <p className="text-[9px] text-violet/50">{skill.description}</p>
                    <p className="mt-0.5 text-[8px] text-violet/35">
                      CD: {skill.cooldown} · Custo: {skill.manaCost} mana
                    </p>
                  </div>
                );
              })}
            </div>

            {selectedHero.lore && (
              <div className="rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Lore</p>
                <p className="text-[10px] leading-relaxed text-violet/60 italic">&ldquo;{selectedHero.lore}&rdquo;</p>
              </div>
            )}
          </motion.div>
        )
      )}
    </motion.div>
  );
}
