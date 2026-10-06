"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, ListChecks, ChatCircleText, Target } from "@phosphor-icons/react";
import { useGameStore } from "@/lib/game/store";

const AMBER  = "rgb(200,155,60)";
const VIOLET = "rgb(122,111,160)";
const CREAM  = "rgb(232,217,160)";

// Missoes ativas (3 fixas para MVP — virão do backend depois)
const SAMPLE_MISSIONS = [
  { id: "derrote", label: "Derrote inimigos", current: 0,   total: 1000, reward: "◆ 400"  },
  { id: "fases",   label: "Conclua fases",    current: 0,   total: 100,  reward: "◆ 300 + ✦ 2" },
  { id: "ouro",    label: "Ganhe ouro",        current: 0,   total: 150000, reward: "◆ 300" },
];

function SectionHeader({ icon, label, open, onToggle }: {
  icon: React.ReactNode; label: string; open: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-3 py-2"
      style={{ borderBottom: "1px solid rgba(200,155,60,0.08)" }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: AMBER, opacity: 0.7 }}>{icon}</span>
        <span className="text-[11px] font-bold tracking-widest" style={{ color: CREAM, opacity: 0.75 }}>
          {label.toUpperCase()}
        </span>
      </div>
      <motion.span
        animate={{ rotate: open ? 0 : -90 }}
        transition={{ duration: 0.2 }}
        style={{ color: VIOLET, opacity: 0.5 }}
      >
        <CaretDown size={12} />
      </motion.span>
    </button>
  );
}

export default function LeftSidebar({ onMissoes }: { onMissoes: () => void }) {
  const save = useGameStore((s) => s.save);
  const [objOpen,     setObjOpen]     = useState(true);
  const [missOpen,    setMissOpen]    = useState(true);
  const [chatOpen,    setChatOpen]    = useState(true);
  const [chatMsg,     setChatMsg]     = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentPhase = (save as any).currentPhase ?? 1;

  const FAKE_CHAT = [
    { user: "AstralKnight", msg: "alguem quer fazer arena?" },
    { user: "Lyrafire",     msg: "ta no boss da fase 12" },
    { user: "DarkWarden",   msg: "mano o mitico caiu kk" },
    { user: "SerahFan99",   msg: "qual heroi usar na torre?" },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0 w-[230px] overflow-y-auto"
      style={{
        background: "rgba(8,8,18,0.97)",
        borderRight: "1px solid rgba(200,155,60,0.1)",
      }}
    >
      {/* Objetivo da fase */}
      <SectionHeader
        icon={<Target size={13} />}
        label="Objetivo da fase"
        open={objOpen}
        onToggle={() => setObjOpen(v => !v)}
      />
      <AnimatePresence initial={false}>
        {objOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 py-3 flex flex-col gap-1.5">
              <p className="text-[11px] font-bold" style={{ color: CREAM, opacity: 0.85 }}>
                Fase {currentPhase}
              </p>
              <p className="text-[10px]" style={{ color: VIOLET, opacity: 0.7 }}>
                Derrote todos os inimigos para avançar.
              </p>
              <div className="mt-1 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(122,111,160,0.15)" }}>
                <div className="h-full rounded-full" style={{ width: "0%", background: AMBER }} />
              </div>
              <p className="text-[10px]" style={{ color: VIOLET, opacity: 0.5 }}>0 / 26 fases</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Missoes */}
      <SectionHeader
        icon={<ListChecks size={13} />}
        label="Missoes"
        open={missOpen}
        onToggle={() => setMissOpen(v => !v)}
      />
      <AnimatePresence initial={false}>
        {missOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-0" style={{ borderBottom: "1px solid rgba(200,155,60,0.06)" }}>
              {SAMPLE_MISSIONS.map((m) => (
                <div key={m.id} className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(122,111,160,0.07)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold" style={{ color: CREAM, opacity: 0.8 }}>{m.label}</span>
                    <span className="text-[9px]" style={{ color: AMBER, opacity: 0.7 }}>{m.reward}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(122,111,160,0.12)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (m.current / m.total) * 100)}%`,
                        background: "linear-gradient(90deg, rgb(122,111,160), rgb(160,130,220))"
                      }}
                    />
                  </div>
                  <p className="mt-0.5 text-[9px]" style={{ color: VIOLET, opacity: 0.5 }}>
                    {m.current.toLocaleString("pt-BR")} / {m.total.toLocaleString("pt-BR")}
                  </p>
                </div>
              ))}
              <button
                onClick={onMissoes}
                className="w-full py-2 text-[10px] font-bold tracking-widest"
                style={{ color: AMBER, opacity: 0.6 }}
              >
                VER TODAS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat global */}
      <SectionHeader
        icon={<ChatCircleText size={13} />}
        label="Chat global"
        open={chatOpen}
        onToggle={() => setChatOpen(v => !v)}
      />
      <AnimatePresence initial={false}>
        {chatOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col"
          >
            {/* messages */}
            <div className="flex flex-col gap-0 px-3 py-2 flex-1 max-h-[180px] overflow-y-auto">
              {FAKE_CHAT.map((c, i) => (
                <div key={i} className="py-1" style={{ borderBottom: "1px solid rgba(122,111,160,0.06)" }}>
                  <span className="text-[9px] font-bold" style={{ color: AMBER, opacity: 0.8 }}>
                    {c.user}
                  </span>
                  <span className="text-[9px] ml-1" style={{ color: CREAM, opacity: 0.55 }}>
                    {c.msg}
                  </span>
                </div>
              ))}
            </div>
            {/* input */}
            <div className="flex items-center gap-1.5 px-2 py-2" style={{ borderTop: "1px solid rgba(200,155,60,0.08)" }}>
              <input
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                placeholder="Escreva uma mensagem..."
                className="flex-1 bg-transparent text-[10px] outline-none placeholder:opacity-30"
                style={{ color: CREAM, opacity: 0.8 }}
              />
              <button
                className="text-[10px] px-2 py-1 rounded"
                style={{ background: "rgba(200,155,60,0.15)", color: AMBER }}
                onClick={() => setChatMsg("")}
              >
                ▶
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
