"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type Room = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockLevel: number;
  ouroReq: number;
  bonus: string;
};

const ROOMS: Room[] = [
  { id: "quarto",     name: "Quarto do Herói",      description: "Recuperação de HP 20% mais rápida.",        icon: "🛏", unlockLevel: 1,  ouroReq: 500,   bonus: "+20% HP regen"    },
  { id: "biblioteca", name: "Biblioteca",            description: "+5% de EXP em todas as atividades.",        icon: "📚", unlockLevel: 2,  ouroReq: 1200,  bonus: "+5% EXP"          },
  { id: "forja",      name: "Forja Pessoal",         description: "Permite forjar itens raros no lar.",        icon: "⚒",  unlockLevel: 3,  ouroReq: 2000,  bonus: "Forja rara"       },
  { id: "jardim",     name: "Jardim de Ervas",       description: "Produz 5 Ervas por dia passivamente.",      icon: "🌿", unlockLevel: 4,  ouroReq: 2500,  bonus: "+5 Herbs/dia"     },
  { id: "observatorio",name:"Observatório Arcano",   description: "+3% de drop rate em dungeons.",             icon: "🔭", unlockLevel: 5,  ouroReq: 4000,  bonus: "+3% drop rate"    },
  { id: "santuario",  name: "Santuário do Guardião", description: "Companheiro ativo ganha +15% de bônus.",    icon: "⛩", unlockLevel: 6,  ouroReq: 6000,  bonus: "+15% companheiro" },
];

const HOUSE_UPGRADES: { level: number; name: string; ouroReq: number; description: string; unlocks: string }[] = [
  { level: 1, name: "Cabana",          ouroReq: 0,    description: "Um abrigo simples. Ponto de partida.",                                  unlocks: "Desbloqueia: Quarto do Herói" },
  { level: 2, name: "Casa",            ouroReq: 800,  description: "Estrutura sólida. Novos cômodos disponíveis.",                         unlocks: "Desbloqueia: Biblioteca (+5% EXP)" },
  { level: 3, name: "Mansão",          ouroReq: 2500, description: "Residência espaçosa com área de trabalho própria.",                    unlocks: "Desbloqueia: Forja Pessoal (forja itens raros)" },
  { level: 4, name: "Cidadela",        ouroReq: 6000, description: "Fortaleza pessoal. Produção passiva de recursos.",                     unlocks: "Desbloqueia: Jardim de Ervas (+5 Ervas/dia)" },
  { level: 5, name: "Palácio Arcano",  ouroReq: 15000,description: "Obra-prima imbuída de magia. Bônus máximos desbloqueados.",            unlocks: "Desbloqueia: Observatório (+3% drop) e Santuário (+15% companheiro)" },
];

export default function HousingModal({ onClose }: { onClose: () => void }) {
  const { save } = useGameStore();
  const housing = save.housing;

  function upgradeHouse() {
    const nextLevel = housing.houseLevel + 1;
    const upgrade = HOUSE_UPGRADES.find((u) => u.level === nextLevel);
    if (!upgrade || save.wallet.ouro < upgrade.ouroReq) return;
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= upgrade.ouroReq;
      s.save.housing.houseLevel = nextLevel;
    });
    scheduleSave();
  }

  function unlockRoom(room: Room) {
    if (housing.houseLevel < room.unlockLevel) return;
    if (housing.unlockedRooms.includes(room.id)) return;
    if (save.wallet.ouro < room.ouroReq) return;
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= room.ouroReq;
      s.save.housing.unlockedRooms.push(room.id);
    });
    scheduleSave();
  }

  const currentHouse = HOUSE_UPGRADES.find((u) => u.level === housing.houseLevel) ?? HOUSE_UPGRADES[0];
  const nextHouseUpgrade = HOUSE_UPGRADES.find((u) => u.level === housing.houseLevel + 1);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button onClick={onClose} whileTap={{ scale: 0.94 }} transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }} className="text-[10px] font-bold tracking-widest text-violet/60">
            ← Fechar
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">MORADIA</span>
        </div>
        <span className="text-[10px] font-bold text-amber-400">{currentHouse.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* House level */}
        <div className="mb-5 mt-4 rounded-xl border border-amber/20 px-5 py-5" style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(10,10,22,0.95) 70%)" }}>
          <div className="mb-3 flex items-center gap-4">
            <span className="text-4xl">🏠</span>
            <div>
              <p className="text-xl font-black tracking-wide text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>{currentHouse.name.toUpperCase()}</p>
              <p className="text-[10px] text-violet/50">{currentHouse.description}</p>
            </div>
          </div>
          {/* Level bars */}
          <div className="flex gap-1.5">
            {HOUSE_UPGRADES.map((u) => (
              <div key={u.level} className="flex-1 rounded-full" style={{ height: 4, background: housing.houseLevel >= u.level ? "rgb(200,155,60)" : "rgba(122,111,160,0.15)", boxShadow: housing.houseLevel >= u.level ? "0 0 6px rgba(200,155,60,0.4)" : "none" }} />
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-relaxed text-violet/50">{currentHouse.unlocks}</p>
          {nextHouseUpgrade ? (
            <div className="mt-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-violet/60">Próximo: {nextHouseUpgrade.name}</span>
                <p className="mt-0.5 text-[10px] text-violet/35">{nextHouseUpgrade.unlocks}</p>
              </div>
              <motion.button
                onClick={save.wallet.ouro >= nextHouseUpgrade.ouroReq ? upgradeHouse : undefined}
                whileTap={save.wallet.ouro >= nextHouseUpgrade.ouroReq ? { scale: 0.94 } : undefined}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-lg border px-3 py-1 text-[11px] font-bold"
                style={{
                  borderColor: save.wallet.ouro >= nextHouseUpgrade.ouroReq ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                  background: save.wallet.ouro >= nextHouseUpgrade.ouroReq ? "rgba(200,155,60,0.1)" : "transparent",
                  color: save.wallet.ouro >= nextHouseUpgrade.ouroReq ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                }}
              >
                {nextHouseUpgrade.ouroReq.toLocaleString("pt-BR")} ouro
              </motion.button>
            </div>
          ) : (
            <p className="mt-3 text-[11px] font-bold text-green-400">Nível máximo atingido!</p>
          )}
        </div>

        {/* Rooms */}
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Cômodos</p>
        <div className="flex flex-col gap-2">
          {ROOMS.map((room) => {
            const unlocked = housing.unlockedRooms.includes(room.id);
            const canUnlock = !unlocked && housing.houseLevel >= room.unlockLevel && save.wallet.ouro >= room.ouroReq;
            const needsLevel = housing.houseLevel < room.unlockLevel;
            return (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-xl border px-4 py-3"
                style={{
                  borderColor: unlocked ? "rgba(100,220,140,0.2)" : needsLevel ? "rgba(122,111,160,0.08)" : "rgba(200,155,60,0.15)",
                  background: unlocked ? "rgba(100,220,140,0.04)" : "rgba(122,111,160,0.03)",
                  opacity: needsLevel ? 0.45 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{room.icon}</span>
                  <div>
                    <p className="text-[11px] font-bold text-cream/80">{room.name}</p>
                    <p className="text-[10px] text-violet/60">{room.description}</p>
                    <p className="text-[10px] font-bold" style={{ color: unlocked ? "rgb(100,220,140)" : "rgb(200,155,60)", opacity: unlocked ? 1 : 0.7 }}>{room.bonus}</p>
                  </div>
                </div>
                {unlocked ? (
                  <span className="text-[12px] text-green-400">✓</span>
                ) : needsLevel ? (
                  <span className="text-[10px] text-violet/35">Casa Nv.{room.unlockLevel}</span>
                ) : (
                  <motion.button
                    onClick={canUnlock ? () => unlockRoom(room) : undefined}
                    whileTap={canUnlock ? { scale: 0.94 } : undefined}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="rounded-lg border px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      borderColor: canUnlock ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                      background: canUnlock ? "rgba(200,155,60,0.1)" : "transparent",
                      color: canUnlock ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                    }}
                  >
                    {room.ouroReq.toLocaleString("pt-BR")} ouro
                  </motion.button>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-violet/30">
          Ouro disponível: <span className="font-bold text-amber-400">{save.wallet.ouro.toLocaleString("pt-BR")}</span>
        </p>
      </div>
    </motion.div>
  );
}
