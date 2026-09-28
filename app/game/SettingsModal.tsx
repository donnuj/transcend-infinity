"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave, uploadCloudSave } from "@/lib/game/save";
import { api } from "@/lib/api";
import { clearSession } from "@/lib/auth";

const ease = [0.23, 1, 0.32, 1] as const;

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { save } = useGameStore();
  const audio = save.audio;
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [deleteInput, setDeleteInput] = useState("");

  function setMusicVolume(v: number) {
    useGameStore.setState((s) => { s.save.audio.musicVolume = v; });
    scheduleSave();
  }

  function setSfxVolume(v: number) {
    useGameStore.setState((s) => { s.save.audio.sfxVolume = v; });
    scheduleSave();
  }

  function resetSave() {
    useGameStore.getState().resetSave();
    setConfirmReset(false);
    uploadCloudSave();
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "EXCLUIR") return;
    setDeleteStep("deleting");
    try {
      await api.del<{ success: boolean }>("/auth/account", { body: { confirmation: "EXCLUIR" } });
    } catch {
      // Account deleted even if request fails partially
    }
    clearSession();
    router.replace("/login");
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
      <div className="flex items-center gap-3 border-b border-amber/12 px-4 py-3">
        <motion.button
          onClick={onClose}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
          className="text-[10px] font-bold tracking-widest text-violet/60"
        >
          ← Fechar
        </motion.button>
        <span className="h-4 w-[1px] bg-violet/20" />
        <span className="text-[11px] font-bold tracking-widest text-cream/70">CONFIGURAÇÕES</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Audio */}
        <p className="mb-3 mt-5 text-[9px] uppercase tracking-[0.2em] text-violet/40">Áudio</p>
        <div className="rounded-xl border border-violet/12 px-5 py-5" style={{ background: "rgba(122,111,160,0.04)" }}>
          <VolumeSlider
            label="Música"
            icon="♪"
            value={audio.musicVolume}
            onChange={setMusicVolume}
          />
          <div className="mt-5">
            <VolumeSlider
              label="Efeitos sonoros"
              icon="◈"
              value={audio.sfxVolume}
              onChange={setSfxVolume}
            />
          </div>
        </div>

        {/* Graphics (static info only) */}
        <p className="mb-3 mt-5 text-[9px] uppercase tracking-[0.2em] text-violet/40">Interface</p>
        <div className="rounded-xl border border-violet/12 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
          <InfoRow label="Versão" value="0.1.0" />
          <InfoRow label="Motor" value="Next.js 16" />
          <InfoRow label="Save" value="Local + Cloud" last />
        </div>

        {/* Notifications */}
        <p className="mb-3 mt-5 text-[9px] uppercase tracking-[0.2em] text-violet/40">Notificações</p>
        <div className="rounded-xl border border-violet/12 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
          <ToggleRow label="Caravana chegou" enabled />
          <ToggleRow label="Missões diárias" enabled />
          <ToggleRow label="Boss Hunt semanal" enabled last />
        </div>

        {/* Danger zone */}
        <p className="mb-3 mt-5 text-[9px] uppercase tracking-[0.2em] text-red-400/50">Zona Perigosa</p>
        <div className="rounded-xl border border-red-500/12 px-5 py-4" style={{ background: "rgba(255,50,50,0.03)" }}>
          <p className="mb-3 text-[9px] leading-relaxed text-violet/40">
            Redefinir o save apaga todo o progresso permanentemente. Não há como desfazer.
          </p>
          <AnimatePresence mode="wait">
            {!confirmReset ? (
              <motion.button
                key="reset-btn"
                onClick={() => setConfirmReset(true)}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border border-red-500/20 py-3 text-[11px] font-bold tracking-[0.15em] text-red-400/55 transition-colors duration-150 hover:border-red-500/40 hover:text-red-400/80"
              >
                REDEFINIR SAVE
              </motion.button>
            ) : (
              <motion.div
                key="reset-confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-2"
              >
                <p className="text-center text-[10px] font-bold text-red-400/80">Tem certeza? Isso é irreversível.</p>
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => setConfirmReset(false)}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 rounded-xl border border-violet/20 py-2.5 text-[10px] font-bold text-violet/50"
                  >
                    CANCELAR
                  </motion.button>
                  <motion.button
                    onClick={resetSave}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 rounded-xl border border-red-500/40 py-2.5 text-[10px] font-bold text-red-400/90"
                    style={{ background: "rgba(255,50,50,0.08)" }}
                  >
                    SIM, APAGAR
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Account deletion — LGPD */}
        <p className="mb-3 mt-5 text-[9px] uppercase tracking-[0.2em] text-red-400/50">Exclusão de Conta (LGPD)</p>
        <div className="rounded-xl border border-red-500/12 px-5 py-4" style={{ background: "rgba(255,50,50,0.03)" }}>
          <AnimatePresence mode="wait">
            {deleteStep === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <p className="mb-3 text-[9px] leading-relaxed text-violet/40">
                  Exclui permanentemente sua conta, todos os dados e save. Irreversível.
                </p>
                <motion.button
                  onClick={() => setDeleteStep("confirm")}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="w-full rounded-xl border border-red-500/20 py-3 text-[11px] font-bold tracking-[0.15em] text-red-400/55 transition-colors duration-150 hover:border-red-500/40 hover:text-red-400/80"
                >
                  EXCLUIR CONTA
                </motion.button>
              </motion.div>
            )}
            {deleteStep === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-3">
                <p className="text-[10px] font-bold text-red-400/80 text-center">Esta ação é irreversível. Digite <span className="text-red-400">EXCLUIR</span> para confirmar.</p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="EXCLUIR"
                  className="h-10 rounded border border-red-500/30 bg-void px-3 text-[13px] text-red-400 placeholder:text-red-400/25 focus:border-red-500/60 focus:outline-none"
                />
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => { setDeleteStep("idle"); setDeleteInput(""); }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 rounded-xl border border-violet/20 py-2.5 text-[10px] font-bold text-violet/50"
                  >
                    CANCELAR
                  </motion.button>
                  <motion.button
                    onClick={handleDeleteAccount}
                    disabled={deleteInput !== "EXCLUIR"}
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1 rounded-xl border border-red-500/40 py-2.5 text-[10px] font-bold text-red-400/90 disabled:cursor-not-allowed disabled:opacity-30"
                    style={{ background: deleteInput === "EXCLUIR" ? "rgba(255,50,50,0.1)" : "transparent" }}
                  >
                    EXCLUIR CONTA
                  </motion.button>
                </div>
              </motion.div>
            )}
            {deleteStep === "deleting" && (
              <motion.div key="deleting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function VolumeSlider({ label, icon, value, onChange }: {
  label: string;
  icon: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-violet/50">{icon}</span>
          <span className="text-[10px] font-bold tracking-wider text-cream/70">{label.toUpperCase()}</span>
        </div>
        <span className="text-[10px] text-violet/50">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1.5 w-full cursor-pointer accent-amber-400"
      />
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(122,111,160,0.1)" }}
    >
      <span className="text-[9px] font-bold uppercase tracking-wider text-violet/40">{label}</span>
      <span className="text-[10px] text-cream/55">{value}</span>
    </div>
  );
}

function ToggleRow({ label, enabled, last }: { label: string; enabled: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(122,111,160,0.1)" }}
    >
      <span className="text-[10px] text-cream/65">{label}</span>
      <div
        className="flex h-5 w-9 items-center rounded-full px-0.5"
        style={{ background: enabled ? "rgba(200,155,60,0.3)" : "rgba(122,111,160,0.12)" }}
      >
        <motion.div
          className="h-4 w-4 rounded-full"
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          style={{ background: enabled ? "rgb(200,155,60)" : "rgba(122,111,160,0.4)" }}
        />
      </div>
    </div>
  );
}
