"use client";

import { motion } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { ITEM_MAP, EQUIP_MAP, RUNE_MAP } from "@/lib/game/data/items";
import { useSave } from "@/lib/game/save";
import type { Profile } from "./page";

const ease = [0.23, 1, 0.32, 1] as const;

export default function PerfilTab({
  profile,
  onLogout,
  onAchievements,
  onCodex,
  onSeason,
  onHousing,
  onCompanions,
  onAlchemy,
  onSettings,
}: {
  profile: Profile | null;
  onLogout: () => void;
  onAchievements: () => void;
  onCodex: () => void;
  onSeason: () => void;
  onHousing: () => void;
  onCompanions: () => void;
  onAlchemy: () => void;
  onSettings: () => void;
}) {
  const { save } = useGameStore();
  const unlockedAchievements = save.achievements.unlockedIds.length;
  const { cloudSynced, lastSyncAt, save: manualSave } = useSave();
  const wallet = save.wallet;
  const playerLevel = save.playerLevel;
  const invocador = save.invocador;
  const initial = (profile?.characterName ?? profile?.username ?? "?")[0].toUpperCase();
  const joined = profile?.registeredAt
    ? new Date(profile.registeredAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;
  const xpPct = Math.min(100, (playerLevel.xp / (200 * playerLevel.level)) * 100);

  return (
    <motion.div
      className="flex h-full flex-col overflow-y-auto px-4 pb-6 pt-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Avatar */}
      <div className="mb-5 flex flex-col items-center">
        <div
          className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber/40 text-3xl font-black text-cream"
          style={{
            background: "linear-gradient(135deg, rgba(200,155,60,0.2) 0%, rgba(10,10,22,0.95) 100%)",
            fontFamily: "var(--font-cinzel)",
            boxShadow: "0 0 30px rgba(200,155,60,0.15)",
          }}
        >
          {initial}
        </div>
        <h2
          className="text-xl font-black tracking-[0.15em] text-cream"
          style={{ fontFamily: "var(--font-cinzel)", textShadow: "0 0 20px rgba(200,155,60,0.3)" }}
        >
          {(profile?.characterName ?? "Invocador").toUpperCase()}
        </h2>
        {joined && (
          <p className="mt-1 text-[10px] tracking-wider text-violet/45">Membro desde {joined}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: cloudSynced ? "rgb(100,220,140)" : "rgb(255,100,100)" }} />
          <span className="text-[9px] text-violet/40">
            {cloudSynced
              ? `Sync ${lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "ok"}`
              : "Não sincronizado"}
          </span>
          <motion.button
            onClick={() => manualSave()}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="rounded px-1.5 py-0.5 text-[8px] text-violet/40 border border-violet/15"
          >
            Salvar
          </motion.button>
        </div>
      </div>

      {/* Player level */}
      <div className="mb-4 rounded-xl border border-amber/18 px-5 py-4" style={{ background: "rgba(200,155,60,0.05)" }}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider text-cream/70">NÍVEL {playerLevel.level}</span>
          <span className="text-[10px] text-violet/50">{playerLevel.xp} / {200 * playerLevel.level} EXP</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-violet/12">
          <motion.div
            className="h-full rounded-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${xpPct}%` }}
            transition={{ duration: 0.7, ease, delay: 0.15 }}
            style={{ boxShadow: "0 0 8px rgba(200,155,60,0.5)" }}
          />
        </div>
      </div>

      {/* Wallet */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <CurrencyCard icon="◆" label="Ouro" value={wallet.ouro} color="rgb(200,155,60)" />
        <CurrencyCard icon="✦" label="Cristais Astra" value={wallet.cristaisAstra} color="rgb(170,130,255)" />
        <CurrencyCard icon="✦" label="Selos de Invocação" value={wallet.selosDeInvocacao} color="rgb(90,150,255)" />
        <CurrencyCard icon="★" label="Selos Livres" value={wallet.selosLivres} color="rgb(100,220,140)" />
      </div>

      {/* Invocador stats */}
      <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Invocador</p>
        <div className="grid grid-cols-2 gap-x-4">
          <InfoRow label="Nível" value={String(invocador.level)} />
          <InfoRow label="Total Invocações" value={String(invocador.totalPulls)} />
          <InfoRow label="Heróis Coletados" value={String(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])).size)} last />
          <InfoRow label="Login Streak" value={`${wallet.loginStreak} dias`} last />
        </div>
      </div>

      {/* Inventory */}
      {save.inventory.length > 0 && (
        <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Inventário</p>
          <div className="flex flex-col gap-0.5">
            {save.inventory.map((item) => {
              const def = ITEM_MAP[item.itemId];
              if (!def) return null;
              return (
                <div key={item.itemId} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(122,111,160,0.08)" }}>
                  <span className="text-[10px] text-cream/70">{def.name}</span>
                  <span className="text-[10px] font-bold text-violet/60">×{item.qty}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Equipment inventory */}
      {save.equipmentInventory.length > 0 && (
        <div className="mb-4 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Equipamentos ({save.equipmentInventory.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(save.equipmentInventory)).map((id) => {
              const eq = EQUIP_MAP[id];
              if (!eq) return null;
              const count = save.equipmentInventory.filter((e) => e === id).length;
              return (
                <div key={id} className="rounded-lg border border-violet/10 px-2 py-1" style={{ background: "rgba(122,111,160,0.06)" }}>
                  <span className="text-[9px] text-cream/70">{eq.name}</span>
                  {count > 1 && <span className="ml-1 text-[8px] text-violet/40">×{count}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rune inventory */}
      {save.runeInventory.length > 0 && (
        <div className="mb-5 rounded-xl border border-violet/12 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Runas ({save.runeInventory.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(new Set(save.runeInventory)).map((id) => {
              const rune = RUNE_MAP[id];
              if (!rune) return null;
              const count = save.runeInventory.filter((r) => r === id).length;
              return (
                <div key={id} className="rounded-lg border border-violet/10 px-2 py-1" style={{ background: "rgba(122,111,160,0.06)" }}>
                  <span className="text-[9px] text-cream/70">{rune.name}</span>
                  {count > 1 && <span className="ml-1 text-[8px] text-violet/40">×{count}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account */}
      <div className="mb-5 rounded-xl border border-violet/12 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-violet/40">Conta</p>
        <InfoRow label="Usuário" value={profile?.username ?? "—"} />
        <InfoRow label="E-mail" value={profile?.email ?? "—"} />
        <InfoRow label="ID" value={profile ? `#${profile.id}` : "—"} last />
      </div>

      {/* Alchemy button */}
      <motion.button
        onClick={onAlchemy}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-violet/15 px-4 py-3.5"
        style={{ background: "rgba(122,111,160,0.04)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">ALQUIMIA</span>
        <span className="text-[10px] text-violet/40">Nv.{save.alchemy.stationLevel} →</span>
      </motion.button>

      {/* Companions button */}
      <motion.button
        onClick={onCompanions}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-violet/15 px-4 py-3.5"
        style={{ background: "rgba(122,111,160,0.04)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">COMPANHEIROS</span>
        <span className="text-[10px] text-violet/40">{save.companions.length} coletados →</span>
      </motion.button>

      {/* Housing button */}
      <motion.button
        onClick={onHousing}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-violet/15 px-4 py-3.5"
        style={{ background: "rgba(122,111,160,0.04)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">MORADIA</span>
        <span className="text-[10px] text-violet/40">{save.housing.unlockedRooms.length} cômodos →</span>
      </motion.button>

      {/* Season button */}
      <motion.button
        onClick={onSeason}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-amber/15 px-4 py-3.5"
        style={{ background: "rgba(200,155,60,0.04)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">TEMPORADA</span>
        <span className="text-[10px] font-bold text-amber-400">Nv.{save.season.level} →</span>
      </motion.button>

      {/* Codex button */}
      <motion.button
        onClick={onCodex}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-violet/15 px-4 py-3.5"
        style={{ background: "rgba(122,111,160,0.04)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">CODEX</span>
        <span className="text-[10px] text-violet/40">Heróis & Itens →</span>
      </motion.button>

      {/* Achievements button */}
      <motion.button
        onClick={onAchievements}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-amber/20 px-4 py-3.5"
        style={{ background: "rgba(200,155,60,0.05)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">CONQUISTAS</span>
        <span className="text-[10px] font-bold text-amber-400">{unlockedAchievements} / 23</span>
      </motion.button>

      {/* Settings button */}
      <motion.button
        onClick={onSettings}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="mb-3 flex w-full items-center justify-between rounded-xl border border-violet/15 px-4 py-3.5"
        style={{ background: "rgba(122,111,160,0.04)" }}
      >
        <span className="text-[12px] font-bold tracking-[0.15em] text-cream/70">CONFIGURAÇÕES</span>
        <span className="text-[10px] text-violet/40">Áudio & Sistema →</span>
      </motion.button>

      {/* Logout */}
      <motion.button
        onClick={onLogout}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="w-full rounded-xl border border-red-500/20 py-3.5 text-[12px] font-bold tracking-[0.2em] text-red-400/60 transition-colors duration-150 hover:border-red-500/40 hover:text-red-400/80"
      >
        SAIR DA CONTA
      </motion.button>
    </motion.div>
  );
}

function CurrencyCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border py-3" style={{ borderColor: `${color}28`, background: `${color}08` }}>
      <span className="mb-0.5 text-lg" style={{ color }}>{icon}</span>
      <span className="text-base font-black text-cream">{value.toLocaleString("pt-BR")}</span>
      <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color, opacity: 0.6 }}>{label}</span>
    </div>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between py-2.5"
      style={{ borderBottom: last ? "none" : "1px solid rgba(122,111,160,0.1)" }}
    >
      <span className="text-[10px] font-bold tracking-wider text-violet/45">{label.toUpperCase()}</span>
      <span className="text-[11px] text-cream/60">{value}</span>
    </div>
  );
}
