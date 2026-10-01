"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { COMPANIONS, COMPANION_MAP, companionRarityColor, type CompanionDef } from "@/lib/game/data/companions";

const ease = [0.23, 1, 0.32, 1] as const;

type Screen = "list" | "detail";

export default function CompanionsModal({ onClose }: { onClose: () => void }) {
  const { save, collectCompanion, addCompanionBond, evolveCompanion, setActiveCompanion, getCompanion } = useGameStore();
  const [screen, setScreen] = useState<Screen>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedDef = selectedId ? COMPANION_MAP[selectedId] : null;
  const selectedSave = selectedId ? getCompanion(selectedId) : null;
  const activeId = save.activeCompanionId;

  function handleCollect(id: string) {
    collectCompanion(id);
    scheduleSave();
  }

  function handleBond(id: string) {
    addCompanionBond(id, 10);
    scheduleSave();
  }

  function handleEvolve(id: string) {
    const c = getCompanion(id);
    const def = COMPANION_MAP[id];
    if (!c || !def) return;
    const nextForm = def.forms[c.form + 1];
    if (!nextForm || c.bond < nextForm.bondRequired) return;
    evolveCompanion(id);
    scheduleSave();
  }

  function handleSetActive(id: string) {
    setActiveCompanion(id);
    scheduleSave();
  }

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
            onClick={screen === "detail" ? () => setScreen("list") : onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "detail" ? "Voltar" : "Fechar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">COMPANHEIROS</span>
        </div>
        <span className="text-[10px] text-violet/60">
          {save.companions.length} / {COMPANIONS.length} coletados
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          {screen === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease }}
            >
              {/* Active companion banner */}
              {activeId && COMPANION_MAP[activeId] && (
                <div
                  className="mb-4 mt-4 flex items-center gap-4 rounded-xl border border-amber/25 px-4 py-3"
                  style={{ background: "rgba(200,155,60,0.06)" }}
                >
                  <span className="text-3xl">{COMPANION_MAP[activeId].portrait}</span>
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-violet/60">Companheiro ativo</p>
                    <p className="text-[13px] font-black tracking-wider text-cream">{COMPANION_MAP[activeId].name}</p>
                    <p className="text-[11px] text-amber-400">{COMPANION_MAP[activeId].bonus}</p>
                  </div>
                </div>
              )}

              {/* Companion grid */}
              <p className="mb-3 mt-4 text-[11px] uppercase tracking-[0.2em] text-violet/60">Todos os Companheiros</p>
              <div className="flex flex-col gap-2.5">
                {COMPANIONS.map((def) => {
                  const saved = getCompanion(def.id);
                  const collected = !!saved;
                  const isActive = activeId === def.id;
                  const color = companionRarityColor(def.rarity);
                  const currentForm = saved ? def.forms[saved.form] : def.forms[0];
                  return (
                    <motion.button
                      key={def.id}
                      onClick={() => { setSelectedId(def.id); setScreen("detail"); }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: isActive ? `${color}55` : collected ? `${color}22` : "rgba(122,111,160,0.1)",
                        background: isActive ? `${color}0D` : collected ? `${color}08` : "rgba(122,111,160,0.03)",
                        opacity: collected ? 1 : 0.5,
                      }}
                    >
                      <span className="text-2xl">{def.portrait}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-cream/85">{def.name}</span>
                          {isActive && (
                            <span className="rounded-full border border-amber/40 px-1.5 py-0.5 text-[7px] font-bold text-amber-400">ATIVO</span>
                          )}
                        </div>
                        <p className="text-[10px]" style={{ color, opacity: 0.8 }}>{def.rarity}</p>
                        {collected ? (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-violet/12">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, saved.bond)}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
                              />
                            </div>
                            <span className="text-[7px] text-violet/60">{saved.bond}/100</span>
                          </div>
                        ) : (
                          <p className="mt-0.5 text-[10px] text-violet/35">{def.description.slice(0, 40)}…</p>
                        )}
                      </div>
                      {collected && (
                        <div className="text-right">
                          <p className="text-[10px] font-bold" style={{ color }}>{currentForm.label}</p>
                          <p className="text-[7px] text-violet/35">Forma {saved.form + 1}</p>
                        </div>
                      )}
                      {!collected && (
                        <span className="text-[11px] font-bold text-violet/30">→</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {screen === "detail" && selectedDef && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15, ease }}
            >
              <CompanionDetail
                def={selectedDef}
                saved={selectedSave ?? null}
                isActive={activeId === selectedDef.id}
                onCollect={() => handleCollect(selectedDef.id)}
                onBond={() => handleBond(selectedDef.id)}
                onEvolve={() => handleEvolve(selectedDef.id)}
                onSetActive={() => handleSetActive(selectedDef.id)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CompanionDetail({
  def,
  saved,
  isActive,
  onCollect,
  onBond,
  onEvolve,
  onSetActive,
}: {
  def: CompanionDef;
  saved: { companionId: string; bond: number; form: number; isActive: boolean } | null;
  isActive: boolean;
  onCollect: () => void;
  onBond: () => void;
  onEvolve: () => void;
  onSetActive: () => void;
}) {
  const color = companionRarityColor(def.rarity);
  const currentForm = saved ? def.forms[saved.form] : null;
  const nextForm = saved ? def.forms[saved.form + 1] ?? null : def.forms[0];
  const canEvolve = saved && nextForm && saved.bond >= nextForm.bondRequired;

  return (
    <div className="mt-4">
      {/* Portrait card */}
      <div
        className="mb-5 flex flex-col items-center rounded-2xl border py-8"
        style={{ borderColor: `${color}30`, background: `linear-gradient(135deg, ${color}10 0%, rgba(10,10,22,0.97) 70%)` }}
      >
        <span className="mb-3 text-6xl">{def.portrait}</span>
        <h2 className="text-2xl font-black tracking-[0.2em] text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
          {def.name.toUpperCase()}
        </h2>
        <p className="mt-1 text-[10px] font-bold tracking-wider" style={{ color }}>{def.rarity}</p>
        <p className="mt-2 max-w-[260px] text-center text-[10px] leading-relaxed text-violet/50">{def.description}</p>
        {currentForm && (
          <div className="mt-3 rounded-full border px-3 py-1" style={{ borderColor: `${color}30`, background: `${color}10` }}>
            <span className="text-[11px] font-bold" style={{ color }}>{currentForm.label} — {currentForm.bonus}</span>
          </div>
        )}
      </div>

      {/* Bond progress */}
      {saved && (
        <div className="mb-4 rounded-xl border border-violet/12 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
          <div className="mb-2 flex justify-between">
            <span className="text-[10px] font-bold tracking-wider text-cream/70">VÍNCULO</span>
            <span className="text-[10px] text-violet/50">{saved.bond} / 100</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-violet/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color, boxShadow: `0 0 8px ${color}55` }}
              initial={{ width: 0 }}
              animate={{ width: `${saved.bond}%` }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
            />
          </div>
          {nextForm && (
            <p className="mt-1.5 text-[10px] text-violet/35">Próxima forma em {nextForm.bondRequired} de vínculo</p>
          )}
        </div>
      )}

      {/* Forms */}
      <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Formas de Evolução</p>
      <div className="mb-5 flex flex-col gap-1.5">
        {def.forms.map((form) => {
          const reached = saved && saved.form >= form.form;
          const isCurrent = saved && saved.form === form.form;
          return (
            <div
              key={form.form}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
              style={{
                borderColor: isCurrent ? `${color}40` : reached ? `${color}20` : "rgba(122,111,160,0.08)",
                background: isCurrent ? `${color}0C` : "transparent",
                opacity: reached ? 1 : 0.45,
              }}
            >
              <div>
                <span className="text-[10px] font-bold text-cream/80">{form.label}</span>
                {isCurrent && <span className="ml-2 text-[7px] font-bold" style={{ color }}>ATUAL</span>}
                <p className="text-[10px] font-bold" style={{ color, opacity: 0.75 }}>{form.bonus}</p>
              </div>
              <span className="text-[10px] text-violet/35">{form.bondRequired} vínc.</span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!saved ? (
        <motion.button
          onClick={onCollect}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="mb-2 w-full rounded-xl border py-3.5 text-[12px] font-bold tracking-[0.15em]"
          style={{ borderColor: `${color}40`, background: `${color}12`, color }}
        >
          COLETAR
        </motion.button>
      ) : (
        <>
          {!isActive && (
            <motion.button
              onClick={onSetActive}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="mb-2 w-full rounded-xl border py-3.5 text-[12px] font-bold tracking-[0.15em]"
              style={{ borderColor: `${color}40`, background: `${color}12`, color }}
            >
              DEFINIR COMO ATIVO
            </motion.button>
          )}
          {isActive && (
            <div
              className="mb-2 w-full rounded-xl border py-3.5 text-center text-[12px] font-bold tracking-[0.15em]"
              style={{ borderColor: `${color}25`, background: `${color}08`, color, opacity: 0.6 }}
            >
              COMPANHEIRO ATIVO
            </div>
          )}
          <motion.button
            onClick={onBond}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="mb-2 w-full rounded-xl border border-violet/15 py-3 text-[11px] font-bold tracking-wider text-violet/60"
            style={{ background: "rgba(122,111,160,0.04)" }}
          >
            +10 VÍNCULO (TESTE)
          </motion.button>
          {canEvolve && (
            <motion.button
              onClick={onEvolve}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="w-full rounded-xl border py-3.5 text-[12px] font-bold tracking-[0.15em] text-cream"
              style={{ borderColor: "rgba(100,220,140,0.4)", background: "rgba(100,220,140,0.1)" }}
            >
              EVOLUIR → {nextForm!.label}
            </motion.button>
          )}
        </>
      )}
    </div>
  );
}
