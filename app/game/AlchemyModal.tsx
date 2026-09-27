"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { ITEM_MAP } from "@/lib/game/data/items";

const ease = [0.23, 1, 0.32, 1] as const;

type Ingredient = { itemId: string; qty: number };
type AlchemyRecipe = {
  id: string;
  name: string;
  icon: string;
  outputItemId: string;
  outputQty: number;
  ingredients: Ingredient[];
  stationLevel: number;
  category: "Poções" | "Materiais" | "Elixires";
};

const RECIPES: AlchemyRecipe[] = [
  {
    id: "rec_pocao_cura_m",
    name: "Poção de Cura II",
    icon: "🧪",
    outputItemId: "pocao_cura_m",
    outputQty: 1,
    ingredients: [
      { itemId: "pocao_cura_p", qty: 2 },
      { itemId: "cristal_mana", qty: 1 },
    ],
    stationLevel: 1,
    category: "Poções",
  },
  {
    id: "rec_pocao_cura_g",
    name: "Elixir de Cura",
    icon: "🍶",
    outputItemId: "pocao_cura_g",
    outputQty: 1,
    ingredients: [
      { itemId: "pocao_cura_m", qty: 2 },
      { itemId: "gema_comum",   qty: 1 },
    ],
    stationLevel: 2,
    category: "Poções",
  },
  {
    id: "rec_pocao_mana_m",
    name: "Poção de Mana II",
    icon: "🧪",
    outputItemId: "pocao_mana_m",
    outputQty: 1,
    ingredients: [
      { itemId: "pocao_mana_p", qty: 2 },
      { itemId: "cristal_mana", qty: 1 },
    ],
    stationLevel: 1,
    category: "Poções",
  },
  {
    id: "rec_elixir_forca",
    name: "Elixir de Força",
    icon: "⚗️",
    outputItemId: "elixir_forca",
    outputQty: 1,
    ingredients: [
      { itemId: "couro_lobo",   qty: 3 },
      { itemId: "gema_comum",   qty: 2 },
      { itemId: "cristal_mana", qty: 1 },
    ],
    stationLevel: 2,
    category: "Elixires",
  },
  {
    id: "rec_cristal_evolucao",
    name: "Cristal de Evolução",
    icon: "💎",
    outputItemId: "cristal_evolucao",
    outputQty: 1,
    ingredients: [
      { itemId: "gema_comum",   qty: 5 },
      { itemId: "cristal_mana", qty: 2 },
    ],
    stationLevel: 3,
    category: "Materiais",
  },
  {
    id: "rec_essencia_skill",
    name: "Essência de Habilidade",
    icon: "✨",
    outputItemId: "essencia_skill",
    outputQty: 1,
    ingredients: [
      { itemId: "gema_comum",   qty: 3 },
      { itemId: "cristal_mana", qty: 2 },
      { itemId: "gema_rara",    qty: 1 },
    ],
    stationLevel: 3,
    category: "Materiais",
  },
  {
    id: "rec_gema_rara",
    name: "Gema Rara",
    icon: "💠",
    outputItemId: "gema_rara",
    outputQty: 1,
    ingredients: [
      { itemId: "gema_comum",   qty: 8 },
      { itemId: "cristal_mana", qty: 3 },
    ],
    stationLevel: 2,
    category: "Materiais",
  },
  {
    id: "rec_chave_elite",
    name: "Chave Elite",
    icon: "🗝",
    outputItemId: "chave_elite",
    outputQty: 1,
    ingredients: [
      { itemId: "chave_masmorra", qty: 2 },
      { itemId: "gema_rara",      qty: 1 },
    ],
    stationLevel: 4,
    category: "Materiais",
  },
];

const STATION_UPGRADES = [
  { level: 1, name: "Bancada Básica",    ouroReq: 0,     description: "Alquimia rudimentar." },
  { level: 2, name: "Destilador",        ouroReq: 1500,  description: "Receitas intermediárias." },
  { level: 3, name: "Laboratório",       ouroReq: 4000,  description: "Receitas avançadas." },
  { level: 4, name: "Athanor",           ouroReq: 8000,  description: "Transmutações raras." },
  { level: 5, name: "Forno Primordial",  ouroReq: 20000, description: "O ápice da alquimia." },
];

const CATEGORIES = ["Todas", "Poções", "Elixires", "Materiais"] as const;
type Category = typeof CATEGORIES[number];

export default function AlchemyModal({ onClose }: { onClose: () => void }) {
  const store = useGameStore();
  const { save } = store;
  const [filter, setFilter] = useState<Category>("Todas");
  const [lastCrafted, setLastCrafted] = useState<string | null>(null);

  const stationLevel = save.alchemy.stationLevel;
  const stationDef = STATION_UPGRADES.find((u) => u.level === stationLevel) ?? STATION_UPGRADES[0];
  const nextStation = STATION_UPGRADES.find((u) => u.level === stationLevel + 1);

  function canCraft(recipe: AlchemyRecipe): boolean {
    if (recipe.stationLevel > stationLevel) return false;
    return recipe.ingredients.every((ing) => store.getItemQty(ing.itemId) >= ing.qty);
  }

  function craft(recipe: AlchemyRecipe) {
    if (!canCraft(recipe)) return;
    for (const ing of recipe.ingredients) {
      store.removeItem(ing.itemId, ing.qty);
    }
    store.addItem(recipe.outputItemId, recipe.outputQty);
    useGameStore.setState((s) => {
      if (!s.save.profession.craftedRecipeIds.includes(recipe.id))
        s.save.profession.craftedRecipeIds.push(recipe.id);
    });
    setLastCrafted(recipe.outputItemId);
    scheduleSave();
  }

  function upgradeStation() {
    if (!nextStation || save.wallet.ouro < nextStation.ouroReq) return;
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= nextStation.ouroReq;
      s.save.alchemy.stationLevel += 1;
    });
    scheduleSave();
  }

  const filtered = RECIPES.filter((r) => filter === "Todas" || r.category === filter);

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
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← Fechar
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">ALQUIMIA</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">{stationDef.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Station card */}
        <div
          className="mb-5 mt-4 rounded-xl border border-amber/20 px-5 py-4"
          style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.07) 0%, rgba(10,10,22,0.97) 70%)" }}
        >
          <div className="mb-3 flex items-center gap-4">
            <span className="text-4xl">⚗️</span>
            <div>
              <p className="text-[15px] font-black tracking-wide text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                {stationDef.name.toUpperCase()}
              </p>
              <p className="text-[9px] text-violet/45">{stationDef.description}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {STATION_UPGRADES.map((u) => (
              <div
                key={u.level}
                className="flex-1 rounded-full"
                style={{
                  height: 4,
                  background: stationLevel >= u.level ? "rgb(200,155,60)" : "rgba(122,111,160,0.15)",
                  boxShadow: stationLevel >= u.level ? "0 0 6px rgba(200,155,60,0.4)" : "none",
                }}
              />
            ))}
          </div>
          {nextStation ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[8px] text-violet/40">Próximo: {nextStation.name}</span>
              <motion.button
                onClick={save.wallet.ouro >= nextStation.ouroReq ? upgradeStation : undefined}
                whileTap={save.wallet.ouro >= nextStation.ouroReq ? { scale: 0.94 } : undefined}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-lg border px-3 py-1 text-[9px] font-bold"
                style={{
                  borderColor: save.wallet.ouro >= nextStation.ouroReq ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                  background: save.wallet.ouro >= nextStation.ouroReq ? "rgba(200,155,60,0.1)" : "transparent",
                  color: save.wallet.ouro >= nextStation.ouroReq ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                }}
              >
                {nextStation.ouroReq.toLocaleString("pt-BR")} ouro
              </motion.button>
            </div>
          ) : (
            <p className="mt-3 text-[9px] font-bold text-green-400">Estação máxima!</p>
          )}
        </div>

        {/* Last crafted toast */}
        <AnimatePresence>
          {lastCrafted && ITEM_MAP[lastCrafted] && (
            <motion.div
              key={lastCrafted}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease }}
              onAnimationComplete={() => setTimeout(() => setLastCrafted(null), 2000)}
              className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/25 px-4 py-2.5"
              style={{ background: "rgba(100,220,140,0.06)" }}
            >
              <span className="text-green-400 text-[11px]">✓</span>
              <span className="text-[10px] font-bold text-green-400">
                {ITEM_MAP[lastCrafted].name} criado!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category filter */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setFilter(cat)}
              whileTap={{ scale: 0.93 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="flex-shrink-0 rounded-full border px-3 py-1 text-[9px] font-bold tracking-wider"
              style={{
                borderColor: filter === cat ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                background: filter === cat ? "rgba(200,155,60,0.12)" : "transparent",
                color: filter === cat ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
              }}
            >
              {cat.toUpperCase()}
            </motion.button>
          ))}
        </div>

        {/* Recipes */}
        <div className="flex flex-col gap-3">
          {filtered.map((recipe) => {
            const craftable = canCraft(recipe);
            const locked = recipe.stationLevel > stationLevel;
            const outputDef = ITEM_MAP[recipe.outputItemId];
            return (
              <div
                key={recipe.id}
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: craftable ? "rgba(200,155,60,0.3)" : locked ? "rgba(122,111,160,0.06)" : "rgba(122,111,160,0.12)",
                  background: craftable ? "rgba(200,155,60,0.05)" : "rgba(122,111,160,0.03)",
                  opacity: locked ? 0.4 : 1,
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{recipe.icon}</span>
                    <div>
                      <p className="text-[11px] font-bold text-cream/85">{recipe.name}</p>
                      <p className="text-[8px] text-violet/40">
                        {locked ? `Requer estação Nv.${recipe.stationLevel}` : recipe.category}
                      </p>
                    </div>
                  </div>
                  {!locked && (
                    <motion.button
                      onClick={craftable ? () => craft(recipe) : undefined}
                      whileTap={craftable ? { scale: 0.93 } : undefined}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="rounded-lg border px-3 py-1.5 text-[9px] font-bold"
                      style={{
                        borderColor: craftable ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                        background: craftable ? "rgba(200,155,60,0.12)" : "transparent",
                        color: craftable ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                      }}
                    >
                      CRIAR
                    </motion.button>
                  )}
                </div>

                {/* Ingredients */}
                <div className="flex flex-wrap gap-1.5">
                  {recipe.ingredients.map((ing) => {
                    const def = ITEM_MAP[ing.itemId];
                    const have = store.getItemQty(ing.itemId);
                    const enough = have >= ing.qty;
                    return (
                      <div
                        key={ing.itemId}
                        className="rounded-md border px-2 py-0.5"
                        style={{
                          borderColor: enough ? "rgba(100,220,140,0.25)" : "rgba(255,100,100,0.2)",
                          background: enough ? "rgba(100,220,140,0.04)" : "rgba(255,100,100,0.03)",
                        }}
                      >
                        <span className="text-[8px]" style={{ color: enough ? "rgb(100,220,140)" : "rgb(255,120,120)" }}>
                          {def?.name ?? ing.itemId} ×{ing.qty}
                          <span className="ml-1 opacity-60">({have})</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {outputDef && (
                  <p className="mt-1.5 text-[8px] text-violet/35">
                    → {outputDef.name} ×{recipe.outputQty} &nbsp;·&nbsp; {outputDef.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[9px] text-violet/30">
          Ouro disponível: <span className="font-bold text-amber-400">{save.wallet.ouro.toLocaleString("pt-BR")}</span>
        </p>
      </div>
    </motion.div>
  );
}
