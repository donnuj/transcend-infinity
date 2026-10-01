"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
import { scheduleSave } from "@/lib/game/save";
import { buildHeroCombatant, simulateBattle, type CombatantSnapshot } from "@/lib/game/combat";

const ease = [0.23, 1, 0.32, 1] as const;

const RANK_TIERS = [
  { min: 0,    max: 999,  label: "Ferro",     color: "rgb(180,180,210)" },
  { min: 1000, max: 1199, label: "Bronze",    color: "rgb(200,155,60)"  },
  { min: 1200, max: 1499, label: "Prata",     color: "rgb(180,220,255)" },
  { min: 1500, max: 1799, label: "Ouro",      color: "rgb(255,200,50)"  },
  { min: 1800, max: 2099, label: "Platina",   color: "rgb(90,150,255)"  },
  { min: 2100, max: 2499, label: "Diamante",  color: "rgb(180,110,255)" },
  { min: 2500, max: 9999, label: "Lendário",  color: "rgb(255,80,80)"   },
];

function getRankTier(rating: number) {
  return RANK_TIERS.find((t) => rating >= t.min && rating <= t.max) ?? RANK_TIERS[0];
}

const OPPONENT_NAMES = [
  "Kael das Sombras","Lunaris Divina","Mestre Pyreth","Arqueira Selene",
  "Guardião Valdris","Feiticeiro Ossirus","Caçadora Zephyr","Paladino Marco",
];

function buildOpponentTeam(rating: number): CombatantSnapshot[] {
  const level = Math.max(1, Math.floor(rating / 50));
  const heroIds = ["kaelith_eterno","serah_celestial","morghul_sombrio","azara_serafim","gornak_martelo"];
  const picked = heroIds.slice(0, 2 + Math.floor(rating / 600));
  return picked.map((heroId) => {
    const hero = HERO_MAP[heroId];
    if (!hero) return null;
    return buildHeroCombatant(hero, Math.min(6, Math.floor(rating / 400)), 1, level);
  }).filter((h): h is CombatantSnapshot => h !== null);
}

type Screen = "overview" | "select" | "result";

export default function ArenaModal({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>("overview");
  const [team, setTeam] = useState<string[]>([]);
  const [result, setResult] = useState<{ won: boolean; ratingChange: number } | null>(null);
  const { save, getHeroProgression, getHeroLevel } = useGameStore();
  const arena = save.arena;
  const tier = getRankTier(arena.rating);

  function startBattle() {
    if (team.length === 0) return;
    const store = useGameStore.getState();
    const heroes = team.map((heroId) => {
      const hero = HERO_MAP[heroId];
      if (!hero) return null;
      const prog = store.getHeroProgression(heroId);
      const lvl = store.getHeroLevel(heroId);
      const bonuses = store.getHeroBonuses(heroId);
      return buildHeroCombatant(hero, prog.rank, Math.max(1, Math.min(5, prog.stars)) as 1|2|3|4|5, lvl.level, bonuses.forgeBonus, bonuses.atkMult);
    }).filter((h): h is CombatantSnapshot => h !== null);

    const opponents = buildOpponentTeam(arena.rating);
    const r = simulateBattle(heroes, opponents);
    const ratingChange = r.won ? Math.floor(15 + Math.random() * 15) : -Math.floor(5 + Math.random() * 15);
    const newRating = Math.max(0, arena.rating + ratingChange);

    useGameStore.setState((s) => {
      const a = s.save.arena;
      if (r.won) { a.wins++; a.rating = newRating; }
      else { a.losses++; a.rating = newRating; }
    });
    store.addCurrency("ouro", r.won ? 200 : 50);
    if (r.won) store.incrementDailyProgress("arena_wins_today");
    scheduleSave();
    setResult({ won: r.won, ratingChange });
    setScreen("result");
  }

  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id]).filter(Boolean);

  const opponentName = OPPONENT_NAMES[Math.floor(arena.rating / 200) % OPPONENT_NAMES.length];

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
      </div>

      <AnimatePresence mode="wait">
        {screen === "overview" && (
          <motion.div
            key="overview"
            className="flex flex-1 flex-col px-5 py-5 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Rank */}
            <div
              className="mb-5 flex flex-col items-center rounded-xl border py-6"
              style={{ borderColor: `${tier.color}40`, background: `${tier.color}08` }}
            >
              <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Ranking</p>
              <p className="text-3xl font-black" style={{ color: tier.color, fontFamily: "var(--font-cinzel)" }}>
                {tier.label.toUpperCase()}
              </p>
              <p className="mt-1 text-2xl font-black text-cream">{arena.rating}</p>
              <p className="text-[10px] text-violet/50">{arena.wins}W · {arena.losses}L</p>
            </div>

            {/* Opponent preview */}
            <div className="mb-5 rounded-xl border border-violet/15 px-4 py-4" style={{ background: "rgba(122,111,160,0.04)" }}>
              <p className="mb-1 text-[11px] uppercase tracking-[0.2em] text-violet/60">Próximo Oponente</p>
              <p className="text-[14px] font-bold text-cream/80">{opponentName}</p>
              {/* eslint-disable-next-line react-hooks/purity */}
              <p className="text-[10px] text-violet/50">Rating estimado: ~{arena.rating + (Math.random() > 0.5 ? 30 : -30) | 0}</p>
            </div>

            {/* Rank tiers */}
            <div className="mb-5 flex flex-col gap-1.5">
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
                  <span className="text-[11px] text-violet/60">{t.min}+</span>
                </div>
              ))}
            </div>

            <motion.button
              onClick={() => setScreen("select")}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
              style={{ borderColor: "rgba(100,160,255,0.4)", background: "rgba(100,160,255,0.08)", color: "rgb(100,160,255)" }}
            >
              ENTRAR NA ARENA
            </motion.button>
          </motion.div>
        )}

        {screen === "select" && (
          <motion.div
            key="select"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="px-4 pt-4">
              <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                Selecione seu time (máx. 3) — {team.length}/3
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="grid grid-cols-3 gap-2 pb-4">
                {collected.map((hero) => {
                  if (!hero) return null;
                  const sel = team.includes(hero.heroId);
                  return (
                    <motion.button
                      key={hero.heroId}
                      onClick={() => setTeam(sel ? team.filter((id) => id !== hero.heroId) : team.length < 3 ? [...team, hero.heroId] : team)}
                      whileTap={{ scale: 0.94 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                      style={{
                        borderColor: sel ? "rgba(100,160,255,0.5)" : "rgba(122,111,160,0.15)",
                        background: sel ? "rgba(100,160,255,0.1)" : "rgba(122,111,160,0.04)",
                      }}
                    >
                      <span className="mb-1 text-2xl">{hero.portrait}</span>
                      <p className="text-[10px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-violet/10 px-4 py-3">
              <motion.button
                onClick={team.length > 0 ? startBattle : undefined}
                whileTap={team.length > 0 ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                style={{
                  borderColor: team.length > 0 ? "rgba(100,160,255,0.4)" : "rgba(122,111,160,0.1)",
                  background: team.length > 0 ? "rgba(100,160,255,0.1)" : "transparent",
                  color: team.length > 0 ? "rgb(100,160,255)" : "rgba(122,111,160,0.3)",
                }}
              >
                BATALHAR
              </motion.button>
            </div>
          </motion.div>
        )}

        {screen === "result" && result && (
          <motion.div
            key="result"
            className="flex flex-1 flex-col items-center justify-center gap-0 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease }}
          >
            {/* Outcome banner */}
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
                style={{
                  fontFamily: "var(--font-cinzel)",
                  color: result.won ? "rgb(100,220,140)" : "rgb(255,100,100)",
                }}
              >
                {result.won ? "VITÓRIA" : "DERROTA"}
              </p>
            </motion.div>

            {/* Stats row */}
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
                <span className="mt-1 text-xl font-black text-amber-400">+{result.won ? 200 : 50}</span>
              </div>
            </motion.div>

            {/* Rank badge */}
            <motion.div
              className="mb-5 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.25 }}
            >
              <div
                className="rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.15em]"
                style={{ background: `${tier.color}18`, border: `1px solid ${tier.color}40`, color: tier.color }}
              >
                {tier.label}
              </div>
              <span className="text-[10px] text-violet/60">
                {save.arena.wins}V · {save.arena.losses}D
              </span>
            </motion.div>

            <motion.div
              className="flex w-full gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease, delay: 0.3 }}
            >
              <motion.button
                onClick={() => setScreen("select")}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 rounded-xl border border-violet/20 py-3.5 text-[11px] font-bold tracking-wider text-violet/60"
              >
                REPETIR
              </motion.button>
              <motion.button
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
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
