"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { NPCS, NPC_MAP } from "@/lib/game/data/world";
import { DIALOGUE_MAP, type DialogueNode } from "@/lib/game/data/dialogues";
import type { SaveData } from "@/lib/game/types";

const ease = [0.23, 1, 0.32, 1] as const;

export default function NpcDialogueModal({ onClose }: { onClose: () => void }) {
  const { save } = useGameStore();
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);

  const discoveredRegions = save.worldMap.discoveredRegions;
  const seenDialogues = save.dialogue.seenDialogues;
  const choiceHistory = save.dialogue.choiceHistory;

  const visibleNpcs = NPCS.filter((npc) => discoveredRegions.includes(npc.regionId));
  const currentNpc = selectedNpcId ? NPC_MAP[selectedNpcId] : null;
  const currentNode: DialogueNode | null = currentNodeId ? DIALOGUE_MAP[currentNodeId] ?? null : null;

  function startDialogue(npcId: string) {
    const npc = NPC_MAP[npcId];
    if (!npc) return;
    setSelectedNpcId(npcId);
    setCurrentNodeId(npc.dialogueRootId);
    setRewardMessage(null);
    if (!seenDialogues.includes(npc.dialogueRootId)) {
      useGameStore.setState((s) => {
        s.save.dialogue.seenDialogues.push(npc.dialogueRootId);
      });
    }
  }

  function makeChoice(choiceId: string, nextId: string | null, rewardType?: string, rewardAmount?: number) {
    if (!choiceHistory.includes(choiceId)) {
      useGameStore.setState((s) => {
        s.save.dialogue.choiceHistory.push(choiceId);
      });
    }

    if (rewardType && rewardAmount) {
      useGameStore.getState().addCurrency(rewardType as keyof SaveData["wallet"], rewardAmount);
      const labels: Record<string, string> = {
        ouro: "Ouro",
        cristaisAstra: "Cristais Astra",
        selosDeInvocacao: "Selos de Invocação",
        selosLivres: "Selos Livres",
      };
      setRewardMessage(`+${rewardAmount} ${labels[rewardType] ?? rewardType}`);
      scheduleSave();
    }

    if (!nextId) {
      scheduleSave();
      setCurrentNodeId(null);
      setSelectedNpcId(null);
      return;
    }

    if (!seenDialogues.includes(nextId)) {
      useGameStore.setState((s) => {
        s.save.dialogue.seenDialogues.push(nextId);
      });
    }
    setCurrentNodeId(nextId);
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
            onClick={currentNode ? () => { setCurrentNodeId(null); setSelectedNpcId(null); } : onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {currentNode ? "Encerrar" : "Fechar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">NPCs</span>
        </div>
        <span className="text-[10px] text-violet/60">
          {visibleNpcs.length} disponíveis
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          {!currentNode ? (
            <motion.div
              key="npc-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease }}
              className="mt-4"
            >
              {/* Reward toast */}
              <AnimatePresence>
                {rewardMessage && (
                  <motion.div
                    key="reward"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease }}
                    onAnimationComplete={() => setTimeout(() => setRewardMessage(null), 2500)}
                    className="mb-4 flex items-center gap-2 rounded-xl border border-amber/25 px-4 py-2.5"
                    style={{ background: "rgba(200,155,60,0.08)" }}
                  >
                    <span className="text-amber-400 text-[11px]">✦</span>
                    <span className="text-[10px] font-bold text-amber-400">{rewardMessage} recebido!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                Personagens do Mundo
              </p>

              <div className="flex flex-col gap-2.5">
                {NPCS.map((npc) => {
                  const isAccessible = discoveredRegions.includes(npc.regionId);
                  const hasSeenRoot = seenDialogues.includes(npc.dialogueRootId);
                  return (
                    <motion.button
                      key={npc.npcId}
                      onClick={isAccessible ? () => startDialogue(npc.npcId) : undefined}
                      whileTap={isAccessible ? { scale: 0.97 } : undefined}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left"
                      style={{
                        borderColor: !isAccessible
                          ? "rgba(122,111,160,0.08)"
                          : hasSeenRoot
                          ? "rgba(122,111,160,0.15)"
                          : "rgba(200,155,60,0.3)",
                        background: !isAccessible
                          ? "transparent"
                          : hasSeenRoot
                          ? "rgba(122,111,160,0.04)"
                          : "rgba(200,155,60,0.06)",
                        opacity: isAccessible ? 1 : 0.45,
                      }}
                    >
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border text-xl"
                        style={{
                          borderColor: isAccessible ? "rgba(122,111,160,0.2)" : "rgba(122,111,160,0.1)",
                          background: isAccessible ? "rgba(122,111,160,0.06)" : "transparent",
                          filter: isAccessible ? "none" : "grayscale(1)",
                        }}
                      >
                        {npc.portraitEmoji}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-cream/85">{npc.name}</p>
                        <p className="text-[11px] text-violet/65">{npc.role}</p>
                        {!isAccessible && (
                          <p className="mt-0.5 text-[10px] text-violet/35">Explorar para encontrar</p>
                        )}
                      </div>
                      {isAccessible && !hasSeenRoot && (
                        <div className="h-2 w-2 rounded-full bg-amber" style={{ boxShadow: "0 0 6px rgba(200,155,60,0.5)" }} />
                      )}
                      {isAccessible && <span className="text-[11px] text-violet/30">→</span>}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentNodeId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease }}
              className="mt-4"
            >
              {/* NPC portrait + speech bubble */}
              <div className="mb-6 flex items-end gap-4">
                <div
                  className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 text-2xl"
                  style={{
                    borderColor: "rgba(200,155,60,0.3)",
                    background: "linear-gradient(135deg, rgba(200,155,60,0.12) 0%, rgba(10,10,22,0.97) 100%)",
                  }}
                >
                  {currentNpc?.portraitEmoji}
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-[11px] font-bold tracking-wider text-amber-400">{currentNpc?.name.toUpperCase()}</p>
                  <div
                    className="rounded-2xl rounded-bl-md border border-amber/15 px-4 py-3"
                    style={{ background: "rgba(200,155,60,0.05)" }}
                  >
                    <p className="text-[12px] leading-relaxed text-cream/80">{currentNode.text}</p>
                  </div>
                </div>
              </div>

              {/* Choices */}
              <div className="flex flex-col gap-2">
                {currentNode.choices.map((choice) => {
                  const chosen = choiceHistory.includes(choice.choiceId);
                  return (
                    <motion.button
                      key={choice.choiceId}
                      onClick={() => makeChoice(choice.choiceId, choice.nextId, choice.rewardType, choice.rewardAmount)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex items-start gap-3 rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: choice.isQuest
                          ? chosen ? "rgba(100,220,140,0.1)" : "rgba(100,220,140,0.3)"
                          : chosen ? "rgba(122,111,160,0.12)" : "rgba(122,111,160,0.2)",
                        background: choice.isQuest
                          ? chosen ? "rgba(100,220,140,0.02)" : "rgba(100,220,140,0.05)"
                          : chosen ? "rgba(122,111,160,0.03)" : "rgba(122,111,160,0.06)",
                        opacity: chosen ? 0.65 : 1,
                      }}
                    >
                      <span className="mt-0.5 text-[10px] font-bold" style={{ color: choice.isQuest ? "rgb(100,220,140)" : "rgba(122,111,160,0.5)" }}>
                        {choice.isQuest ? "!" : !choice.nextId ? "◇" : "▷"}
                      </span>
                      <div className="flex-1">
                        <span className="text-[11px] text-cream/75">{choice.text}</span>
                        {choice.questLabel && (
                          <p className="mt-0.5 text-[9px] font-bold text-green-400/70">{choice.questLabel}</p>
                        )}
                      </div>
                      {choice.rewardType && (
                        <span
                          className="rounded-full border px-1.5 py-0.5 text-[7px] font-bold"
                          style={{ borderColor: "rgba(200,155,60,0.3)", color: "rgb(200,155,60)", background: "rgba(200,155,60,0.08)" }}
                        >
                          +{choice.rewardAmount} {choice.rewardType === "ouro" ? "◆" : choice.rewardType === "cristaisAstra" ? "✦" : "selos"}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
