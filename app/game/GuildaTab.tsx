"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { FACTIONS } from "@/lib/game/data/world";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type SubTab = "faccoes" | "guilda" | "fortaleza";

// Faction territory effects shown in UI
const FACTION_TERRITORY: Record<string, { icon: string; effects: string[] }> = {
  fac_ordem_imperial: {
    icon: "⚜",
    effects: [
      "Itens no Mercado 10% mais baratos",
      "+10% ouro em recompensas de missões",
      "Acesso à Arena Imperial (tier 3+)",
      "+15% EXP de dungeons (tier 4+)",
    ],
  },
  fac_druidas: {
    icon: "🌿",
    effects: [
      "+10% drop de Ervas em explorações",
      "Cura no Hospital 25% mais rápida",
      "Caravanas na Floresta têm 10% menos risco",
      "+20% poder de cura de itens (tier 4+)",
    ],
  },
  fac_mercadores: {
    icon: "💰",
    effects: [
      "+10% lucro em todas as Caravanas",
      "Acesso a rotas exclusivas (tier 3+)",
      "+15% negociação no Mercado Negro",
      "+20% drop de Ouro em dungeons (tier 4+)",
    ],
  },
  fac_arcontes: {
    icon: "✦",
    effects: [
      "+5% Cristais Astra por sessão",
      "Acesso à Planície do Céu (tier 3+)",
      "Banner Celestial desbloqueado (tier 4+)",
      "Herói Mítico desbloqueado (tier 5+)",
    ],
  },
};

// How to earn faction points
const FACTION_EARN: Record<string, string[]> = {
  fac_ordem_imperial: ["Vencer lutas na Arena", "Completar dungeons", "Subir andares na Torre"],
  fac_druidas:        ["Explorar regiões no Mapa", "Completar caravanas na Floresta", "Interagir com NPCs druidas"],
  fac_mercadores:     ["Enviar caravanas", "Negociar no Mercado", "Completar missões comerciais de NPC"],
  fac_arcontes:       ["Derrotar bosses", "Subir torre além do andar 20", "Completar missões de NPCs Arcontes"],
};

const GUILD_FOUND_COST = { ouro: 5000, minLevel: 10, minInfluence: 500 };

function getTierInfo(faction: typeof FACTIONS[0], points: number) {
  let tier = faction.tiers[0];
  for (const t of faction.tiers) {
    if (points >= t.minPoints) tier = t;
    else break;
  }
  const nextTier = faction.tiers[faction.tiers.indexOf(tier) + 1] ?? null;
  const pct = nextTier
    ? Math.min(100, ((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
    : 100;
  return { tier, nextTier, pct };
}

export default function GuildaTab({ onFortress }: { onFortress: () => void }) {
  const [sub, setSub] = useState<SubTab>("faccoes");
  const [foundingName, setFoundingName] = useState("");
  const [foundingFaction, setFoundingFaction] = useState("");
  const [showFoundingForm, setShowFoundingForm] = useState(false);
  const { save, getReputation, addReputation } = useGameStore();

  const playerLevel = save.playerLevel?.level ?? save.invocador?.level ?? 1;
  const totalInfluence = FACTIONS.reduce((sum, f) => sum + getReputation(f.factionId), 0);
  const canFound = playerLevel >= GUILD_FOUND_COST.minLevel
    && save.wallet.ouro >= GUILD_FOUND_COST.ouro
    && totalInfluence >= GUILD_FOUND_COST.minInfluence;

  function foundGuild() {
    if (!canFound || !foundingName.trim() || !foundingFaction) return;
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= GUILD_FOUND_COST.ouro;
      s.save.guildAdvanced.founded = true;
      s.save.guildAdvanced.guildName = foundingName.trim();
      s.save.guildAdvanced.factionAffiliation = foundingFaction;
    });
    scheduleSave();
    setShowFoundingForm(false);
  }

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease }}
    >
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-violet/10 px-4 pb-3 pt-4">
        {(["faccoes","guilda","fortaleza"] as const).map((t) => (
          <motion.button
            key={t}
            onClick={() => setSub(t)}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.08 }}
            className="flex-1 rounded-lg py-2 text-[11px] font-bold tracking-wider transition-colors duration-150"
            style={{
              background: sub === t ? "rgba(200,155,60,0.1)" : "transparent",
              color:      sub === t ? "rgb(200,155,60)" : "rgba(210,205,240,0.4)",
              border:     `1px solid ${sub === t ? "rgba(200,155,60,0.3)" : "transparent"}`,
            }}
          >
            {t === "faccoes" ? "FACÇÕES" : t === "guilda" ? "GUILDA" : "FORTALEZA"}
          </motion.button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <AnimatePresence mode="wait">
          {/* FACÇÕES */}
          {sub === "faccoes" && (
            <motion.div
              key="faccoes"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.15, ease }}
              className="flex flex-col gap-4"
            >
              <p className="text-[10px] text-violet/50 leading-relaxed">
                Ganhe pontos de facção completando atividades no jogo. Cada facção controla um território — quanto maior seu tier, maiores os bônus que você recebe naquele território.
              </p>

              {FACTIONS.map((f) => {
                const points = getReputation(f.factionId);
                const { tier, nextTier, pct } = getTierInfo(f, points);
                const territory = FACTION_TERRITORY[f.factionId];
                const earnTips = FACTION_EARN[f.factionId] ?? [];
                return (
                  <div
                    key={f.factionId}
                    className="rounded-xl border border-violet/12 px-4 py-4"
                    style={{ background: "rgba(122,111,160,0.04)" }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-2xl">{f.emoji}</span>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-cream/85">{f.name}</p>
                        <p className="text-[10px] text-violet/50">{f.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-amber-400">{tier.label}</p>
                        <p className="text-[9px] text-violet/40">{points.toLocaleString("pt-BR")} pts</p>
                      </div>
                    </div>

                    <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-violet/10">
                      <motion.div
                        className="h-full rounded-full bg-amber"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </div>
                    {nextTier && (
                      <p className="mb-3 text-right text-[9px] text-violet/30">
                        → {nextTier.label} ({(nextTier.minPoints - points).toLocaleString("pt-BR")} pts)
                      </p>
                    )}

                    {/* Territory effects */}
                    {territory && (
                      <div className="mb-3 rounded-lg border border-violet/10 px-3 py-2.5" style={{ background: "rgba(122,111,160,0.03)" }}>
                        <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-violet/40">Efeitos de Território</p>
                        {territory.effects.map((e, i) => (
                          <p key={i} className="text-[10px] text-violet/55">• {e}</p>
                        ))}
                      </div>
                    )}

                    {/* How to earn */}
                    <div className="rounded-lg border border-violet/8 px-3 py-2" style={{ background: "rgba(122,111,160,0.02)" }}>
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-violet/35">Como ganhar pontos</p>
                      {earnTips.map((t, i) => (
                        <p key={i} className="text-[10px] text-violet/40">◈ {t}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* GUILDA */}
          {sub === "guilda" && (
            <motion.div
              key="guilda"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease }}
            >
              {save.guildAdvanced.founded ? (
                <FoundedGuildSection
                  guild={save.guildAdvanced}
                  factions={FACTIONS}
                  getReputation={getReputation}
                />
              ) : (
                <GuildFoundingSection
                  playerLevel={playerLevel}
                  ouro={save.wallet.ouro}
                  totalInfluence={totalInfluence}
                  canFound={canFound}
                  foundingName={foundingName}
                  foundingFaction={foundingFaction}
                  showForm={showFoundingForm}
                  onShowForm={() => setShowFoundingForm(true)}
                  onNameChange={setFoundingName}
                  onFactionChange={setFoundingFaction}
                  onFound={foundGuild}
                  factions={FACTIONS}
                  requirements={GUILD_FOUND_COST}
                />
              )}
            </motion.div>
          )}

          {/* FORTALEZA */}
          {sub === "fortaleza" && (
            <motion.div
              key="fortaleza"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease }}
            >
              <FortalezaSummary fortress={save.fortress} onManage={onFortress} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Guild not yet founded ──────────────────────────────────────────────────────

function GuildFoundingSection({
  playerLevel, ouro, totalInfluence, canFound,
  foundingName, foundingFaction, showForm,
  onShowForm, onNameChange, onFactionChange, onFound,
  factions, requirements,
}: {
  playerLevel: number; ouro: number; totalInfluence: number; canFound: boolean;
  foundingName: string; foundingFaction: string; showForm: boolean;
  onShowForm: () => void; onNameChange: (v: string) => void;
  onFactionChange: (v: string) => void; onFound: () => void;
  factions: typeof FACTIONS; requirements: typeof GUILD_FOUND_COST;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber/18 px-5 py-5" style={{ background: "rgba(200,155,60,0.04)" }}>
        <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Construir uma Guilda</p>
        <p className="text-[12px] font-bold text-cream/75" style={{ fontFamily: "var(--font-cinzel)" }}>
          FUNDAR SUA GUILDA
        </p>
        <p className="mt-2 text-[11px] text-violet/55 leading-relaxed">
          Uma Guilda é um prédio físico — você precisa de ouro para construir e de influência (pontos de facção) para que as pessoas te respeitem. Escolha uma facção parceira para definir o território e os bônus do seu grupo.
        </p>
      </div>

      {/* Requirements */}
      <div className="rounded-xl border border-violet/12 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Requisitos</p>
        <div className="flex flex-col gap-2">
          {[
            { label: `Nível ${requirements.minLevel}`, met: playerLevel >= requirements.minLevel, current: `Nv.${playerLevel}` },
            { label: `${requirements.ouro.toLocaleString()} Ouro`, met: ouro >= requirements.ouro, current: `${ouro.toLocaleString()}` },
            { label: `${requirements.minInfluence} Influência total`, met: totalInfluence >= requirements.minInfluence, current: `${totalInfluence.toLocaleString()} pts` },
          ].map((req) => (
            <div key={req.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px]" style={{ color: req.met ? "rgb(100,220,140)" : "rgb(255,100,100)" }}>
                  {req.met ? "✓" : "✗"}
                </span>
                <span className="text-[11px] text-cream/70">{req.label}</span>
              </div>
              <span className="text-[10px] text-violet/50">{req.current}</span>
            </div>
          ))}
        </div>
      </div>

      {!showForm ? (
        <motion.button
          onClick={canFound ? onShowForm : undefined}
          whileTap={canFound ? { scale: 0.97 } : undefined}
          transition={{ duration: 0.08 }}
          className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
          style={{
            borderColor: canFound ? "rgba(200,155,60,0.45)" : "rgba(122,111,160,0.12)",
            background: canFound ? "rgba(200,155,60,0.1)" : "transparent",
            color: canFound ? "rgb(200,155,60)" : "rgba(122,111,160,0.3)",
          }}
        >
          {canFound ? "FUNDAR GUILDA" : "REQUISITOS NÃO ATENDIDOS"}
        </motion.button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-amber/20 px-4 py-4" style={{ background: "rgba(200,155,60,0.04)" }}>
          <p className="text-[11px] font-bold text-amber-400">Nome da Guilda</p>
          <input
            type="text"
            value={foundingName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ex: Guardiões do Vazio"
            maxLength={30}
            className="h-10 w-full rounded-lg border border-violet/25 bg-void px-3 text-[12px] text-cream placeholder:text-cream/25 focus:border-amber/50 focus:outline-none"
          />
          <p className="text-[11px] font-bold text-amber-400">Facção Parceira</p>
          <div className="grid grid-cols-2 gap-2">
            {factions.map((f) => (
              <motion.button
                key={f.factionId}
                onClick={() => onFactionChange(f.factionId)}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.08 }}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-left"
                style={{
                  borderColor: foundingFaction === f.factionId ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                  background: foundingFaction === f.factionId ? "rgba(200,155,60,0.08)" : "transparent",
                }}
              >
                <span className="text-base">{f.emoji}</span>
                <span className="text-[10px] font-bold text-cream/70">{f.name.split(" ")[0]}</span>
              </motion.button>
            ))}
          </div>
          <motion.button
            onClick={foundingName.trim() && foundingFaction ? onFound : undefined}
            whileTap={foundingName.trim() && foundingFaction ? { scale: 0.97 } : undefined}
            transition={{ duration: 0.08 }}
            className="w-full rounded-xl border py-3 text-[11px] font-bold tracking-widest"
            style={{
              borderColor: foundingName.trim() && foundingFaction ? "rgba(200,155,60,0.45)" : "rgba(122,111,160,0.1)",
              background: foundingName.trim() && foundingFaction ? "rgba(200,155,60,0.12)" : "transparent",
              color: foundingName.trim() && foundingFaction ? "rgb(200,155,60)" : "rgba(122,111,160,0.3)",
            }}
          >
            CONSTRUIR GUILDA (−5.000 ouro)
          </motion.button>
        </div>
      )}
    </div>
  );
}

// ── Guild founded ──────────────────────────────────────────────────────────────

function FoundedGuildSection({
  guild, factions, getReputation,
}: {
  guild: ReturnType<typeof useGameStore.getState>["save"]["guildAdvanced"];
  factions: typeof FACTIONS;
  getReputation: (id: string) => number;
}) {
  const affiliatedFaction = factions.find((f) => f.factionId === guild.factionAffiliation);
  const affPoints = guild.factionAffiliation ? getReputation(guild.factionAffiliation) : 0;
  const { tier } = affiliatedFaction ? getTierInfo(affiliatedFaction, affPoints) : { tier: { label: "—", bonus: "—" } };
  const territory = guild.factionAffiliation ? FACTION_TERRITORY[guild.factionAffiliation] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-amber/20 px-5 py-5" style={{ background: "rgba(200,155,60,0.05)" }}>
        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Sua Guilda</p>
        <h3 className="mb-2 text-xl font-black text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
          {guild.guildName.toUpperCase()}
        </h3>
        {affiliatedFaction && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{affiliatedFaction.emoji}</span>
            <span className="text-[11px] text-violet/70">{affiliatedFaction.name}</span>
            <span className="rounded-full border border-amber/25 px-2 py-0.5 text-[9px] font-bold text-amber/80">{tier.label}</span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-violet/10 px-2 py-2 text-center" style={{ background: "rgba(122,111,160,0.04)" }}>
            <p className="text-[9px] text-violet/50">Tesouro</p>
            <p className="text-[11px] font-bold text-amber-400">{guild.treasury.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-violet/10 px-2 py-2 text-center" style={{ background: "rgba(122,111,160,0.04)" }}>
            <p className="text-[9px] text-violet/50">Missões</p>
            <p className="text-[11px] font-bold text-cream/70">{guild.completedMissions.length}</p>
          </div>
          <div className="rounded-lg border border-violet/10 px-2 py-2 text-center" style={{ background: "rgba(122,111,160,0.04)" }}>
            <p className="text-[9px] text-violet/50">Influência</p>
            <p className="text-[11px] font-bold text-cream/70">{affPoints.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Active territory bonuses */}
      {territory && (
        <div className="rounded-xl border border-violet/12 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Bônus de Território Ativo</p>
          {territory.effects.map((e, i) => (
            <div key={i} className="flex items-start gap-2 py-1 border-b border-violet/8 last:border-0">
              <span className="text-[10px] text-green-400">✓</span>
              <p className="text-[11px] text-violet/65">{e}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-violet/10 px-4 py-3" style={{ background: "rgba(122,111,160,0.03)" }}>
        <p className="text-[10px] text-violet/40 leading-relaxed">
          Continue completando atividades para ganhar mais pontos de facção e subir de tier. Quanto maior o tier, mais poderosos os bônus do seu território.
        </p>
      </div>
    </div>
  );
}

// ── Fortaleza summary ──────────────────────────────────────────────────────────

type FortressSave = ReturnType<typeof useGameStore.getState>["save"]["fortress"];

function FortalezaSummary({ fortress, onManage }: { fortress: FortressSave; onManage: () => void }) {
  const RESOURCE_ICON: Record<string, string> = { Food: "◆", Wood: "◈", Stone: "●", Herbs: "◉", Morale: "★" };
  // eslint-disable-next-line react-hooks/purity
  const isBuilding = !!fortress.pendingConstruction && new Date(fortress.pendingConstruction.endTime).getTime() > Date.now();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-violet/20 px-5 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Fortaleza</p>
        <h3 className="mb-1 text-lg font-black text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
          {fortress.fortressName.toUpperCase()}
        </h3>
        <p className="text-[11px] text-violet/50">Pop.: {fortress.population} · Reputação: {fortress.reputation}</p>
        {isBuilding && (
          <p className="mt-1 text-[10px] font-bold text-amber/70">Construção em andamento...</p>
        )}
      </div>

      <div className="rounded-xl border border-violet/12 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
        <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Recursos</p>
        <div className="grid grid-cols-5 gap-1.5">
          {fortress.resources.map((r) => (
            <div key={r.key} className="flex flex-col items-center rounded-lg border border-violet/8 py-1.5" style={{ background: "rgba(122,111,160,0.04)" }}>
              <span className="text-[10px] text-violet/60">{RESOURCE_ICON[r.key] ?? "◈"}</span>
              <span className="text-[11px] font-bold text-cream/70">{r.value}</span>
              <span className="text-[6px] text-violet/35">{r.key}</span>
            </div>
          ))}
        </div>
      </div>

      <motion.button
        onClick={onManage}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.08 }}
        className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
        style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.08)", color: "rgb(200,155,60)" }}
      >
        GERENCIAR FORTALEZA
      </motion.button>
    </div>
  );
}
