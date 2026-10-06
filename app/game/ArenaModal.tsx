"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { BattleScene } from "@/src/components/game/battle/BattleScene";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { scheduleSave } from "@/lib/game/save";
import { buildHeroCombatant, simulateBattle } from "@/lib/game/combat";
import { api } from "@/lib/api";

const ease = [0.23, 1, 0.32, 1] as const;
const MAX_DAILY_FIGHTS = 10;

const RANK_TIERS = [
  { min: 0,    max: 999,  label: "Ferro",    color: "rgb(180,180,210)" },
  { min: 1000, max: 1199, label: "Bronze",   color: "rgb(200,155,60)"  },
  { min: 1200, max: 1499, label: "Prata",    color: "rgb(180,220,255)" },
  { min: 1500, max: 1799, label: "Ouro",     color: "rgb(255,200,50)"  },
  { min: 1800, max: 2099, label: "Platina",  color: "rgb(90,150,255)"  },
  { min: 2100, max: 2499, label: "Diamante", color: "rgb(180,110,255)" },
  { min: 2500, max: 9999, label: "Lendário", color: "rgb(255,80,80)"   },
];

function getRankTier(rating: number) {
  return RANK_TIERS.find((t) => rating >= t.min && rating <= t.max) ?? RANK_TIERS[0];
}

type RealOpponent = {
  username: string;
  characterName: string;
  heroId: string;
  rating: number;
};

type Screen = "overview" | "choose-defender" | "challengers" | "result";

export default function ArenaModal({ onClose, embedded: _embedded }: { onClose: () => void; embedded?: boolean }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [result, setResult] = useState<{ won: boolean; ratingChange: number; opponentName: string } | null>(null);
  const [realOpponents, setRealOpponents] = useState<RealOpponent[] | null>(null);
  const loadingOpponents = screen === "challengers" && realOpponents === null;

  const store = useGameStore.getState();
  const { save } = useGameStore();
  const arena = save.arena;
  const tier = getRankTier(arena.rating);

  const today = new Date().toISOString().split("T")[0];
  const fightsToday = arena.lastFightDate === today ? (arena.dailyFights ?? 0) : 0;
  const fightsLeft = MAX_DAILY_FIGHTS - fightsToday;
  const hasDefender = !!arena.defenderHeroId;

  const defenderHeroData = arena.defenderHeroId ? HERO_MAP[arena.defenderHeroId] : null;
  const defenderLevel = arena.defenderHeroId ? store.getHeroLevel(arena.defenderHeroId).level : 1;

  useEffect(() => {
    if (screen !== "challengers") return;
    api.get<RealOpponent[]>(`/player/arena-opponents?rating=${arena.rating}`)
      .then((data) => setRealOpponents(data))
      .catch(() => setRealOpponents([]));
  }, [screen, arena.rating]);

  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id]).filter(Boolean);

  function setDefender(heroId: string) {
    useGameStore.setState((s) => {
      s.save.arena.defenderHeroId = heroId;
    });
    scheduleSave();
    setScreen("overview");
  }

  function fightOpponent(opponent: RealOpponent) {
    if (fightsLeft <= 0) return;
    if (!arena.defenderHeroId) return;

    const defenderHero = HERO_MAP[arena.defenderHeroId];
    if (!defenderHero) return;

    const defProg = store.getHeroProgression(arena.defenderHeroId);
    const defLvl = store.getHeroLevel(arena.defenderHeroId);
    const defBonuses = store.getHeroBonuses(arena.defenderHeroId);
    const myHero = buildHeroCombatant(
      defenderHero,
      defProg.rank,
      Math.max(1, Math.min(5, defProg.stars)) as 1|2|3|4|5,
      defLvl.level,
      defBonuses.forgeBonus,
      defBonuses.atkMult,
    );

    const opponentHeroData = HERO_MAP[opponent.heroId];
    if (!opponentHeroData) return;
    const opponentLevel = Math.max(1, Math.floor(opponent.rating / 30));
    const opponentSnap = buildHeroCombatant(opponentHeroData, Math.min(6, Math.floor(opponent.rating / 400)) as 0|1|2|3|4|5|6, 1, opponentLevel);

    const r = simulateBattle([myHero], [opponentSnap]);
    const ratingChange = r.won
      ? Math.floor(12 + Math.random() * 18) // eslint-disable-line react-hooks/purity
      : -Math.floor(8 + Math.random() * 12); // eslint-disable-line react-hooks/purity
    const newRating = Math.max(0, arena.rating + ratingChange);

    useGameStore.setState((s) => {
      const a = s.save.arena;
      if (r.won) { a.wins++; a.rating = newRating; }
      else { a.losses++; a.rating = newRating; }
      const todayStr = new Date().toISOString().split("T")[0];
      if (a.lastFightDate !== todayStr) {
        a.dailyFights = 1;
        a.lastFightDate = todayStr;
      } else {
        a.dailyFights = (a.dailyFights ?? 0) + 1;
      }
    });

    if (r.won) {
      useGameStore.getState().addCurrency("ouro", 150 + Math.floor(arena.rating / 50));
      useGameStore.getState().incrementDailyProgress("arena_wins_today");
      useGameStore.getState().addReputation("fac_ordem_imperial", 5);
    } else {
      useGameStore.getState().addCurrency("ouro", 30);
    }
    scheduleSave();
    setResult({ won: r.won, ratingChange, opponentName: opponent.characterName || opponent.username });
    setScreen("result");
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
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={screen === "overview" ? onClose : () => setScreen("overview")}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "overview" ? "Fechar" : "Voltar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">ARENA</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: fightsLeft > 0 ? "rgba(200,155,60,0.9)" : "rgba(255,100,100,0.7)" }}>
          {fightsLeft}/{MAX_DAILY_FIGHTS} lutas hoje
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Overview */}
        {screen === "overview" && (
          <motion.div
            key="overview"
            className="flex flex-1 flex-col overflow-y-auto px-5 py-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Rank card */}
            <div
              className="mb-4 flex flex-col items-center rounded-xl border py-5"
              style={{ borderColor: `${tier.color}40`, background: `${tier.color}08` }}
            >
              <p className="mb-0.5 text-[11px] uppercase tracking-[0.2em] text-violet/60">Ranking</p>
              <p className="text-3xl font-black" style={{ color: tier.color, fontFamily: "var(--font-cinzel)" }}>
                {tier.label.toUpperCase()}
              </p>
              <p className="mt-1 text-xl font-black text-cream">{arena.rating} pts</p>
              <p className="text-[10px] text-violet/50">{arena.wins}V · {arena.losses}D</p>
            </div>

            {/* Arena duel preview */}
            <div className="mb-4">
              <BattleScene
                variant="dungeon"
                heroCount={1}
                enemyName="Oponente"
                progressPct={0.5}
                diffColor={tier.color}
              />
            </div>

            {/* Defender slot */}
            <div className="mb-4 rounded-xl border border-violet/15 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Herói Defensor</p>
              {defenderHeroData ? (
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border text-2xl"
                    style={{ borderColor: `${tier.color}40`, background: `${tier.color}10` }}
                  >
                    {defenderHeroData.portrait}
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-cream/85">{defenderHeroData.name.split(",")[0]}</p>
                    <p className="text-[10px] text-violet/50">Nível {defenderLevel} · Na arena</p>
                  </div>
                  <motion.button
                    onClick={() => setScreen("choose-defender")}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.08 }}
                    className="rounded-lg border border-violet/20 px-3 py-1.5 text-[10px] text-violet/60"
                  >
                    Trocar
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-2">
                  <p className="text-[11px] text-violet/40">Nenhum herói na arena</p>
                  <p className="text-[10px] text-violet/30">Aloque um herói para poder desafiar outros jogadores</p>
                  <motion.button
                    onClick={() => setScreen("choose-defender")}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.08 }}
                    className="mt-1 rounded-xl border border-amber/30 bg-amber/08 px-4 py-2 text-[10px] font-bold tracking-wider text-amber/80"
                  >
                    ALOCAR HERÓI
                  </motion.button>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="mb-4 rounded-xl border border-violet/10 px-4 py-3" style={{ background: "rgba(122,111,160,0.03)" }}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-violet/50">Como funciona</p>
              <p className="text-[11px] leading-relaxed text-violet/55">
                Aloque um herói como defensor. Outros invocadores também alocam seus heróis. As lutas são 1x1 — stats contra stats. Só é possível desafiar alguém se ambos tiverem heróis alocados. O nível do oponente será próximo ao seu.
              </p>
            </div>

            {/* Rank tiers */}
            <div className="mb-4 flex flex-col gap-1.5">
              <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Ligas</p>
              {RANK_TIERS.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{
                    borderColor: arena.rating >= t.min ? `${t.color}40` : "rgba(122,111,160,0.1)",
                    background: arena.rating >= t.min && arena.rating <= t.max ? `${t.color}12` : "transparent",
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: arena.rating >= t.min ? t.color : "rgba(122,111,160,0.35)" }}>
                    {t.label}
                  </span>
                  <span className="text-[11px] text-violet/60">{t.min}+ pts</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={hasDefender && fightsLeft > 0 ? () => setScreen("challengers") : undefined}
              whileTap={hasDefender && fightsLeft > 0 ? { scale: 0.97 } : undefined}
              transition={{ duration: 0.08 }}
              className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
              style={{
                borderColor: hasDefender && fightsLeft > 0 ? "rgba(100,160,255,0.4)" : "rgba(122,111,160,0.1)",
                background: hasDefender && fightsLeft > 0 ? "rgba(100,160,255,0.08)" : "transparent",
                color: hasDefender && fightsLeft > 0 ? "rgb(100,160,255)" : "rgba(122,111,160,0.3)",
              }}
            >
              {!hasDefender ? "ALOQUE UM HERÓI PRIMEIRO" : fightsLeft <= 0 ? "LIMITE DIÁRIO ATINGIDO" : "VER DESAFIANTES"}
            </motion.button>
          </motion.div>
        )}

        {/* Choose defender */}
        {screen === "choose-defender" && (
          <motion.div
            key="choose-defender"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="px-4 pt-4 pb-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-violet/60">
                Escolha seu herói defensor
              </p>
              <p className="mt-1 text-[10px] text-violet/40">
                Este herói ficará na arena e será o base das suas lutas.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              {collected.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[11px] text-violet/40">Nenhum herói coletado ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 pb-4">
                  {collected.map((hero) => {
                    if (!hero) return null;
                    const isCurrent = arena.defenderHeroId === hero.heroId;
                    const lvl = store.getHeroLevel(hero.heroId);
                    return (
                      <motion.button
                        key={hero.heroId}
                        onClick={() => setDefender(hero.heroId)}
                        whileTap={{ scale: 0.94 }}
                        transition={{ duration: 0.08 }}
                        className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                        style={{
                          borderColor: isCurrent ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                          background: isCurrent ? "rgba(200,155,60,0.08)" : "rgba(122,111,160,0.04)",
                        }}
                      >
                        <span className="mb-1 text-2xl">{hero.portrait}</span>
                        <p className="text-[10px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                        <p className="text-[9px] text-violet/45">Nv. {lvl.level}</p>
                        {isCurrent && <p className="mt-0.5 text-[9px] font-bold text-amber/70">ATUAL</p>}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Challengers list */}
        {screen === "challengers" && (
          <motion.div
            key="challengers"
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Desafiantes disponíveis</p>
            <p className="mb-4 text-[10px] text-violet/40">
              Heróis alocados por outros invocadores — nível próximo ao seu ({defenderLevel})
            </p>
            <div className="flex flex-col gap-3">
              {loadingOpponents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber/20 border-t-amber" />
                </div>
              ) : realOpponents?.length === 0 ? (
                <p className="py-8 text-center text-[11px] text-violet/40">Nenhum oponente disponível ainda. Seja o primeiro a desafiar!</p>
              ) : realOpponents?.map((opp, i) => {
                const oppHero = HERO_MAP[opp.heroId];
                const oppTier = getRankTier(opp.rating);
                const oppLevel = Math.max(1, Math.floor(opp.rating / 30));
                const oppName = opp.characterName || opp.username;
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-violet/15 px-4 py-4"
                    style={{ background: "rgba(122,111,160,0.04)" }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      {/* Opponent hero */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet/20 text-2xl" style={{ background: "rgba(122,111,160,0.06)" }}>
                        {oppHero?.portrait ?? "⚔"}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-cream/80">{oppName}</p>
                        <p className="text-[10px] text-violet/50">
                          {oppHero?.name.split(",")[0] ?? "Desconhecido"} · Nv. {oppLevel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black" style={{ color: oppTier.color }}>{oppTier.label}</p>
                        <p className="text-[10px] text-violet/50">{opp.rating} pts</p>
                      </div>
                    </div>

                    {/* Stats comparison */}
                    <div className="mb-3 flex gap-2 text-[10px]">
                      <div className="flex-1 rounded-lg border border-violet/10 px-2 py-1.5 text-center" style={{ background: "rgba(100,160,255,0.05)" }}>
                        <p className="text-violet/50">Seu herói</p>
                        <p className="font-bold text-cream/70">{defenderHeroData?.portrait} Nv.{defenderLevel}</p>
                      </div>
                      <div className="flex items-center text-violet/40 font-bold">VS</div>
                      <div className="flex-1 rounded-lg border border-violet/10 px-2 py-1.5 text-center" style={{ background: "rgba(255,100,60,0.05)" }}>
                        <p className="text-violet/50">Oponente</p>
                        <p className="font-bold text-cream/70">{oppHero?.portrait ?? "⚔"} Nv.{oppLevel}</p>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => fightOpponent(opp)}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08 }}
                      className="w-full rounded-xl border py-2.5 text-[10px] font-bold tracking-widest"
                      style={{ borderColor: "rgba(100,160,255,0.4)", background: "rgba(100,160,255,0.08)", color: "rgb(100,160,255)" }}
                    >
                      DESAFIAR
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Result */}
        {screen === "result" && result && (
          <motion.div
            key="result"
            className="flex flex-1 flex-col items-center justify-center gap-0 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease }}
          >
            <motion.div
              className="relative mb-5 flex w-full flex-col items-center overflow-hidden rounded-2xl py-8"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease }}
              style={{
                background: result.won
                  ? "linear-gradient(160deg, rgba(100,220,140,0.12), rgba(100,220,140,0.04))"
                  : "linear-gradient(160deg, rgba(255,100,100,0.12), rgba(255,100,100,0.04))",
                border: `1px solid ${result.won ? "rgba(100,220,140,0.25)" : "rgba(255,100,100,0.25)"}`,
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: result.won ? "rgba(100,220,140,0.6)" : "rgba(255,100,100,0.6)" }} />
              <motion.div
                className="mb-3 text-5xl"
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 26, delay: 0.1 }}
              >
                {result.won ? "🏆" : "💔"}
              </motion.div>
              <p
                className="text-2xl font-black tracking-[0.25em]"
                style={{ fontFamily: "var(--font-cinzel)", color: result.won ? "rgb(100,220,140)" : "rgb(255,100,100)" }}
              >
                {result.won ? "VITÓRIA" : "DERROTA"}
              </p>
              <p className="mt-2 text-[11px] text-violet/50">vs. {result.opponentName}</p>
            </motion.div>

            <motion.div
              className="mb-5 flex w-full gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.15 }}
            >
              <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3.5" style={{ background: "rgba(122,111,160,0.05)" }}>
                <span className="text-[11px] uppercase tracking-widest text-violet/60">Rating</span>
                <span
                  className="mt-1 text-xl font-black"
                  style={{ color: result.ratingChange > 0 ? "rgb(100,220,140)" : "rgb(255,100,100)" }}
                >
                  {result.ratingChange > 0 ? "+" : ""}{result.ratingChange}
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3.5" style={{ background: "rgba(122,111,160,0.05)" }}>
                <span className="text-[11px] uppercase tracking-widest text-violet/60">Novo Rating</span>
                <span className="mt-1 text-xl font-black text-cream/80">{save.arena.rating}</span>
              </div>
              <div className="flex flex-1 flex-col items-center rounded-xl border border-violet/12 py-3.5" style={{ background: "rgba(122,111,160,0.05)" }}>
                <span className="text-[11px] uppercase tracking-widest text-violet/60">Ouro</span>
                <span className="mt-1 text-xl font-black text-amber-400">+{result.won ? 150 + Math.floor(arena.rating / 50) : 30}</span>
              </div>
            </motion.div>

            <motion.div
              className="mb-4 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.25 }}
            >
              <div
                className="rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em]"
                style={{ background: `${getRankTier(save.arena.rating).color}18`, border: `1px solid ${getRankTier(save.arena.rating).color}40`, color: getRankTier(save.arena.rating).color }}
              >
                {getRankTier(save.arena.rating).label}
              </div>
              <span className="text-[10px] text-violet/60">{save.arena.wins}V · {save.arena.losses}D · {fightsLeft - 1 < 0 ? 0 : fightsLeft - 1} lutas restantes hoje</span>
            </motion.div>

            <motion.div
              className="flex w-full gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: 0.3 }}
            >
              <motion.button
                onClick={fightsLeft > 1 ? () => setScreen("challengers") : undefined}
                whileTap={fightsLeft > 1 ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.08 }}
                className="flex-1 rounded-xl border border-violet/20 py-3.5 text-[11px] font-bold tracking-wider"
                style={{ color: fightsLeft > 1 ? "rgba(180,175,220,0.7)" : "rgba(122,111,160,0.3)" }}
              >
                {fightsLeft > 1 ? "OUTRO DESAFIO" : "SEM LUTAS"}
              </motion.button>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08 }}
                className="flex-1 rounded-xl border py-3.5 text-[11px] font-bold tracking-wider"
                style={{ borderColor: "rgba(100,160,255,0.4)", background: "rgba(100,160,255,0.1)", color: "rgb(100,160,255)" }}
              >
                SAIR
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
