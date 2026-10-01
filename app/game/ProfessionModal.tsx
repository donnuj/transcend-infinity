"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type ProfDef = {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  color: string;
  bonuses: string[];
  tasks: { id: string; label: string; xp: number }[];
  milestones: { level: number; perk: string }[];
};

const PROFESSIONS: ProfDef[] = [
  {
    id: "ferreiro",
    name: "Ferreiro",
    icon: "⚒",
    tagline: "Molda ferro e aço com maestria",
    color: "rgb(200,120,60)",
    bonuses: ["Forja 20% mais barata", "Itens forjados têm +5% de bônus", "Acesso a receitas exclusivas de armas"],
    tasks: [
      { id: "ferreiro_forge1",  label: "Forjar 1 equipamento",    xp: 80 },
      { id: "ferreiro_craft1",  label: "Usar 3 materiais de craft", xp: 60 },
      { id: "ferreiro_sell1",   label: "Ganhar 500 ouro via forja",  xp: 50 },
    ],
    milestones: [
      { level: 2,  perk: "Custo de forja -10%" },
      { level: 4,  perk: "+1 slot de runa em forja" },
      { level: 6,  perk: "Desbloqueia: Lâmina do Abismo" },
      { level: 8,  perk: "Forja dupla (2 itens por vez)" },
      { level: 10, perk: "Mestre Ferreiro: custo -30%, bônus +15%" },
    ],
  },
  {
    id: "herbalista",
    name: "Herbalista",
    icon: "🌿",
    tagline: "A natureza revela seus segredos",
    color: "rgb(80,200,120)",
    bonuses: ["Poções produzidas com dobro de efeito", "+15% de ervas coletadas", "Acesso a elixires raros"],
    tasks: [
      { id: "herb_brew1",    label: "Fabricar 2 poções",         xp: 80 },
      { id: "herb_collect1", label: "Coletar 5 ingredientes",     xp: 60 },
      { id: "herb_use1",     label: "Usar 1 poção em combate",    xp: 50 },
    ],
    milestones: [
      { level: 2,  perk: "Poções duram 2x mais" },
      { level: 4,  perk: "Fabricação em lote (5 por vez)" },
      { level: 6,  perk: "Desbloqueia: Elixir da Eternidade" },
      { level: 8,  perk: "Ingredientes nunca desperdiçados" },
      { level: 10, perk: "Mestre Herbalista: todas as poções se tornam lendárias" },
    ],
  },
  {
    id: "comerciante",
    name: "Comerciante",
    icon: "⚖",
    tagline: "Lucro em cada transação",
    color: "rgb(200,170,50)",
    bonuses: ["Compras no mercado 15% mais baratas", "Vendas rendem 20% a mais", "Acesso ao mercado negro"],
    tasks: [
      { id: "merc_buy1",  label: "Comprar 1 item no mercado",  xp: 80 },
      { id: "merc_sell1", label: "Vender 3 itens",             xp: 60 },
      { id: "merc_trade1",label: "Lucrar 300 ouro num dia",    xp: 50 },
    ],
    milestones: [
      { level: 2,  perk: "Desconto de 5% permanente no mercado" },
      { level: 4,  perk: "Restock do mercado 2x ao dia" },
      { level: 6,  perk: "Desbloqueia: Mercado Negro" },
      { level: 8,  perk: "Comissão de caravana reduzida" },
      { level: 10, perk: "Mestre Comerciante: preços 30% menores, venda +35%" },
    ],
  },
  {
    id: "cacador",
    name: "Caçador",
    icon: "🏹",
    tagline: "Rastreia, persegue, conquista",
    color: "rgb(100,180,255)",
    bonuses: ["Bosses têm +15% de drop", "+20% dano em bosses", "Rastreia monstros raros no mapa"],
    tasks: [
      { id: "hunt_boss1",  label: "Derrotar 1 boss hunt",       xp: 80 },
      { id: "hunt_dungeon",label: "Completar 1 masmorra",        xp: 60 },
      { id: "hunt_drop1",  label: "Obter 1 item de drop de boss",xp: 50 },
    ],
    milestones: [
      { level: 2,  perk: "Boss Hunt reseta 2x por semana" },
      { level: 4,  perk: "+1 tentativa de Boss por semana" },
      { level: 6,  perk: "Desbloqueia: Boss Elite exclusivo" },
      { level: 8,  perk: "Drop duplo em bosses uma vez por semana" },
      { level: 10, perk: "Mestre Caçador: bosses +25% drop, aparecimento de boss lendário" },
    ],
  },
  {
    id: "erudito",
    name: "Erudito",
    icon: "📖",
    tagline: "O conhecimento é a maior força",
    color: "rgb(180,130,255)",
    bonuses: ["+25% de XP em tudo", "Desbloqueia diálogos secretos de NPCs", "Habilidades de heróis evoluem mais rápido"],
    tasks: [
      { id: "eru_npc1",   label: "Conversar com 2 NPCs",         xp: 80 },
      { id: "eru_skill1", label: "Evoluir 1 habilidade de herói", xp: 60 },
      { id: "eru_codex1", label: "Descobrir 1 entrada no Codex",  xp: 50 },
    ],
    milestones: [
      { level: 2,  perk: "+10% XP de player" },
      { level: 4,  perk: "NPCs oferecem missões especiais" },
      { level: 6,  perk: "Desbloqueia: Biblioteca Ancestral" },
      { level: 8,  perk: "Habilidades custam 25% menos ouro" },
      { level: 10, perk: "Mestre Erudito: +40% XP, todos NPCs desbloqueados" },
    ],
  },
];

const XP_PER_LEVEL = 50; // level = floor(sqrt(xp/50)) + 1

function getProfLevel(xp: number) {
  return Math.min(10, Math.floor(Math.sqrt(xp / XP_PER_LEVEL)) + 1);
}

function xpForLevel(level: number) {
  return (level - 1) * (level - 1) * XP_PER_LEVEL;
}

export default function ProfessionModal({ onClose }: { onClose: () => void }) {
  const { save, chooseProfession, completeProfessionTask, addProfessionXp } = useGameStore();
  const prof = save.profession;
  const currentLevel = getProfLevel(prof.xp);
  const chosen = PROFESSIONS.find((p) => p.id === prof.chosenProfession);
  const [screen, setScreen] = useState<"list" | "detail">(prof.chosenProfession ? "detail" : "list");
  const [toast, setToast] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const tasksReset = save.professionTasks.lastReset === today;
  const completedToday = tasksReset ? save.professionTasks.completedToday : [];

  function handleChoose(profId: string) {
    chooseProfession(profId);
    scheduleSave();
    setScreen("detail");
  }

  function handleTask(taskId: string, xp: number) {
    const ok = useGameStore.getState().completeProfessionTask(taskId);
    if (!ok) return;
    scheduleSave();
    setToast(`+${xp} XP de profissão`);
    setTimeout(() => setToast(""), 2000);
  }

  const xpToNext = chosen ? xpForLevel(currentLevel + 1) - prof.xp : 0;
  const xpStart = chosen ? xpForLevel(currentLevel) : 0;
  const xpEnd = chosen ? xpForLevel(currentLevel + 1) : 1;
  const xpPct = chosen ? Math.min(100, ((prof.xp - xpStart) / (xpEnd - xpStart)) * 100) : 0;

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
      <div className="flex items-center gap-3 border-b border-amber/12 px-4 py-3">
        <motion.button
          onClick={screen === "detail" && !prof.chosenProfession ? onClose : screen === "detail" ? () => setScreen("list") : onClose}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="text-[10px] font-bold tracking-widest text-violet/60"
        >
          ← {screen === "detail" && prof.chosenProfession ? "Trocar" : "Fechar"}
        </motion.button>
        <span className="h-4 w-[1px] bg-violet/20" />
        <span className="text-[11px] font-bold tracking-widest text-cream/70">PROFISSÃO</span>
        {chosen && (
          <span className="ml-auto text-[10px] font-bold" style={{ color: chosen.color }}>
            {chosen.icon} {chosen.name} Nv.{currentLevel}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {screen === "list" && (
            <motion.div
              key="list"
              className="px-4 pb-8 pt-5"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, ease }}
            >
              <p className="mb-1 text-[11px] font-bold text-cream/70">Escolha sua Profissão</p>
              <p className="mb-5 text-[11px] leading-relaxed text-violet/60">
                Sua profissão define bônus passivos e tarefas diárias exclusivas. Pode ser trocada com custo de ouro.
              </p>
              <div className="flex flex-col gap-3">
                {PROFESSIONS.map((p) => (
                  <motion.button
                    key={p.id}
                    onClick={() => handleChoose(p.id)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-center gap-4 rounded-xl border px-5 py-4 text-left"
                    style={{
                      borderColor: `${p.color}30`,
                      background: `linear-gradient(135deg, ${p.color}08 0%, rgba(10,10,22,0.9) 100%)`,
                    }}
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold" style={{ color: p.color }}>{p.name}</p>
                      <p className="mt-0.5 text-[11px] text-violet/50">{p.tagline}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.bonuses.slice(0, 2).map((b, i) => (
                          <span
                            key={i}
                            className="rounded-full px-2 py-0.5 text-[10px]"
                            style={{ background: `${p.color}15`, color: p.color }}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                    {prof.chosenProfession === p.id && (
                      <span className="text-[11px] font-bold text-amber-400">ATIVA</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {screen === "detail" && chosen && (
            <motion.div
              key="detail"
              className="px-4 pb-8 pt-5"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, ease }}
            >
              {/* Prof banner */}
              <div
                className="mb-5 rounded-xl border px-5 py-5"
                style={{
                  borderColor: `${chosen.color}30`,
                  background: `linear-gradient(135deg, ${chosen.color}10 0%, rgba(10,10,22,0.95) 70%)`,
                }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="text-3xl">{chosen.icon}</span>
                  <div>
                    <p className="text-[14px] font-black tracking-wide" style={{ color: chosen.color }}>{chosen.name}</p>
                    <p className="text-[11px] text-violet/50">{chosen.tagline}</p>
                  </div>
                </div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-violet/60">NÍVEL {currentLevel} / 10</span>
                  {currentLevel < 10 && (
                    <span className="text-[11px] text-violet/60">{xpToNext} XP para próximo</span>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-violet/15">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: chosen.color, width: `${xpPct}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.7, ease }}
                  />
                </div>
              </div>

              {/* Bônus ativos */}
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Bônus Passivos</p>
              <div className="mb-5 rounded-xl border border-violet/12 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
                {chosen.bonuses.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 py-2"
                    style={{ borderBottom: i < chosen.bonuses.length - 1 ? "1px solid rgba(122,111,160,0.1)" : "none" }}
                  >
                    <span className="mt-0.5 text-[10px]" style={{ color: chosen.color }}>◆</span>
                    <span className="text-[10px] text-cream/65">{b}</span>
                  </div>
                ))}
              </div>

              {/* Tarefas diárias */}
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Tarefas Diárias</p>
              <div className="mb-5 flex flex-col gap-2">
                {chosen.tasks.map((t) => {
                  const done = completedToday.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border px-4 py-3"
                      style={{
                        borderColor: done ? "rgba(100,220,140,0.2)" : "rgba(122,111,160,0.12)",
                        background: done ? "rgba(100,220,140,0.04)" : "rgba(122,111,160,0.03)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold"
                          style={{
                            borderColor: done ? "rgba(100,220,140,0.5)" : "rgba(122,111,160,0.2)",
                            color: done ? "rgb(100,220,140)" : "rgba(122,111,160,0.4)",
                          }}
                        >
                          {done ? "✓" : "○"}
                        </div>
                        <span className="text-[10px]" style={{ color: done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.8)" }}>
                          {t.label}
                        </span>
                      </div>
                      {!done ? (
                        <motion.button
                          onClick={() => handleTask(t.id, t.xp)}
                          whileTap={{ scale: 0.94 }}
                          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                          className="rounded-lg border px-3 py-1.5 text-[11px] font-bold"
                          style={{ borderColor: `${chosen.color}40`, color: chosen.color, background: `${chosen.color}10` }}
                        >
                          +{t.xp} XP
                        </motion.button>
                      ) : (
                        <span className="text-[11px] text-violet/30">+{t.xp} XP</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Marcos */}
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Marcos de Evolução</p>
              <div className="rounded-xl border border-violet/12 px-5 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                {chosen.milestones.map((m, i) => {
                  const unlocked = currentLevel >= m.level;
                  return (
                    <div
                      key={m.level}
                      className="flex items-center gap-3 py-2.5"
                      style={{ borderBottom: i < chosen.milestones.length - 1 ? "1px solid rgba(122,111,160,0.1)" : "none" }}
                    >
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                        style={{
                          background: unlocked ? `${chosen.color}20` : "rgba(122,111,160,0.08)",
                          color: unlocked ? chosen.color : "rgba(122,111,160,0.3)",
                          border: `1px solid ${unlocked ? `${chosen.color}40` : "rgba(122,111,160,0.15)"}`,
                        }}
                      >
                        {m.level}
                      </div>
                      <span
                        className="text-[10px]"
                        style={{ color: unlocked ? "rgba(255,255,255,0.75)" : "rgba(122,111,160,0.35)" }}
                      >
                        {m.perk}
                      </span>
                      {unlocked && (
                        <span className="ml-auto text-[10px] font-bold text-green-400/60">ATIVO</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-violet/20 bg-void px-5 py-2.5 text-[10px] font-bold text-cream/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
