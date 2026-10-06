"use client";

export const runtime = 'edge';

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Storefront, TreasureChest, UsersThree, Backpack,
  Scales, TreeStructure, ListChecks, Shield,
  MapTrifold, Sword,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { getUser, isAuthenticated, clearSession } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import { useGameStore } from "@/lib/game/store";
import { loadCloudSave, uploadCloudSave } from "@/lib/game/save";
import dynamic from "next/dynamic";
import { AmbientParticles } from "@/src/components/game/effects/AmbientParticles";
import WorldTab from "./WorldTab";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import AnimatedNumber from "./AnimatedNumber";

const CartasTab         = dynamic(() => import("./CartasTab"),         { ssr: false });
const InvocarTab        = dynamic(() => import("./InvocarTab"),        { ssr: false });
const GuildaTab         = dynamic(() => import("./GuildaTab"),         { ssr: false });
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PerfilTab         = dynamic(() => import("./PerfilTab"),         { ssr: false });

const DungeonModal         = dynamic(() => import("./DungeonModal"),         { ssr: false });
const ArenaModal           = dynamic(() => import("./ArenaModal"),           { ssr: false });
const MercadoModal         = dynamic(() => import("./MercadoModal"),         { ssr: false });
const BattlePassModal      = dynamic(() => import("./BattlePassModal"),      { ssr: false });
const TorreModal           = dynamic(() => import("./TorreModal"),           { ssr: false });
const AchievementsModal    = dynamic(() => import("./AchievementsModal"),    { ssr: false });
const DailyChallengesModal = dynamic(() => import("./DailyChallengesModal"), { ssr: false });
const CodexModal           = dynamic(() => import("./CodexModal"),           { ssr: false });
const FortressModal        = dynamic(() => import("./FortressModal"),        { ssr: false });
const BossHuntModal        = dynamic(() => import("./BossHuntModal"),        { ssr: false });
const SeasonModal          = dynamic(() => import("./SeasonModal"),          { ssr: false });
const HousingModal         = dynamic(() => import("./HousingModal"),         { ssr: false });
const CompanionsModal      = dynamic(() => import("./CompanionsModal"),      { ssr: false });
const AlchemyModal         = dynamic(() => import("./AlchemyModal"),         { ssr: false });
const WorldMapModal        = dynamic(() => import("./WorldMapModal"),        { ssr: false });
const NpcDialogueModal     = dynamic(() => import("./NpcDialogueModal"),     { ssr: false });
const CaravanaModal        = dynamic(() => import("./CaravanaModal"),        { ssr: false });
const SettingsModal        = dynamic(() => import("./SettingsModal"),        { ssr: false });
const ProfessionModal      = dynamic(() => import("./ProfessionModal"),      { ssr: false });
const ForgeModal           = dynamic(() => import("./ForgeModal"),           { ssr: false });
const WikiModal            = dynamic(() => import("./WikiModal"),            { ssr: false });
const AmbientPlayer        = dynamic(() => import("./AmbientPlayer"),        { ssr: false });

export type Profile = {
  id: number;
  username: string;
  email: string;
  level: number;
  experience: number;
  gold: number;
  premiumCurrency: number;
  characterName: string;
  registeredAt: string;
};

// Modal overlay panels (aparecem sobre o campo central)
type Panel = "herois" | "baus" | "itens" | "mercado" | "talentos" | "missoes" | "cla" | "fases" | "arena" | "loja" | null;

type PhosphorIcon = React.ComponentType<{ weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; size?: number; color?: string }>;

const NAV_ITEMS: { id: Panel; label: string; Icon: PhosphorIcon }[] = [
  { id: "loja",    label: "Loja",    Icon: Storefront    },
  { id: "baus",    label: "Baus",    Icon: TreasureChest },
  { id: "herois",  label: "Herois",  Icon: UsersThree    },
  { id: "itens",   label: "Itens",   Icon: Backpack      },
  { id: "mercado", label: "Mercado", Icon: Scales        },
  { id: "talentos",label: "Talentos",Icon: TreeStructure },
  { id: "missoes", label: "Missoes", Icon: ListChecks    },
  { id: "cla",     label: "Cla",     Icon: Shield        },
  { id: "fases",   label: "Fases",   Icon: MapTrifold    },
  { id: "arena",   label: "Arena PvP",Icon: Sword        },
];

const AMBER  = "rgb(200,155,60)";

export default function GamePage() {
  const router  = useRouter();
  const wallet  = useGameStore((s) => s.save.wallet);
  const isPremium = useGameStore((s) => s.save.battlePass.isPremium);

  const [user,    setUser]    = useState<StoredUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [panel,   setPanel]   = useState<Panel>(null);
  const [offlineReward, setOfflineReward] = useState<{ ouro: number; xp: number } | null>(null);
  const [showNovatos,   setShowNovatos]   = useState(false);

  // legacy modal flags (mantidos para compatibilidade com WorldTab)
  const [showDungeon,     setShowDungeon]     = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showArena,       setShowArena]       = useState(false);
  const [showBattlePass,  setShowBattlePass]  = useState(false);
  const [showTorre,       setShowTorre]       = useState(false);
  const [showAchievements,setShowAchievements]= useState(false);
  const [showBossHunt,    setShowBossHunt]    = useState(false);
  const [showWorldMap,    setShowWorldMap]    = useState(false);
  const [showNpcDialogue, setShowNpcDialogue] = useState(false);
  const [showCaravana,    setShowCaravana]    = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showProfession,  setShowProfession]  = useState(false);
  const [showForge,       setShowForge]       = useState(false);
  const [showWiki,        setShowWiki]        = useState(false);
  const [showCodex,       setShowCodex]       = useState(false);
  const [showSeason,      setShowSeason]      = useState(false);
  const [showHousing,     setShowHousing]     = useState(false);
  const [showCompanions,  setShowCompanions]  = useState(false);
  const [showAlchemy,     setShowAlchemy]     = useState(false);
  const [showFortress,    setShowFortress]    = useState(false);

  const openPanel    = useCallback((p: Panel) => setPanel(p),    []);
  const closePanel   = useCallback(() => setPanel(null),         []);
  const openInvocar  = useCallback(() => setPanel("baus"),       []);
  const openDungeon  = useCallback(() => setShowDungeon(true),   []);
  const openArena    = useCallback(() => setPanel("arena"),      []);
  const openMercado  = useCallback(() => setPanel("mercado"),    []);
  const openBattlePass = useCallback(() => setShowBattlePass(true), []);
  const openTorre      = useCallback(() => setShowTorre(true),      []);
  const openDaily      = useCallback(() => setPanel("missoes"),     []);
  const openBossHunt   = useCallback(() => setShowBossHunt(true),   []);
  const openWorldMap   = useCallback(() => setShowWorldMap(true),   []);
  const openNpcDialogue= useCallback(() => setShowNpcDialogue(true), []);
  const openCaravana   = useCallback(() => setShowCaravana(true),   []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openAchievements=useCallback(() => setShowAchievements(true),[]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openCodex      = useCallback(() => setShowCodex(true),      []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openSeason     = useCallback(() => setShowSeason(true),     []);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openHousing    = useCallback(() => setShowHousing(true),    []);
  const openCompanions = useCallback(() => setShowCompanions(true), []);
  const openAlchemy    = useCallback(() => setShowAlchemy(true),    []);
  const openSettings   = useCallback(() => setShowSettings(true),   []);
  const openProfession = useCallback(() => setShowProfession(true), []);
  const openForge      = useCallback(() => setShowForge(true),      []);
  const openWiki       = useCallback(() => setShowWiki(true),       []);
  const openFortress   = useCallback(() => setShowFortress(true),   []);

  useEffect(() => {
    const devBypass = process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).get("dev") === "1";
    const offline = devBypass || localStorage.getItem("ti_offline") === "1";
    if (!devBypass && offline) {
      localStorage.removeItem("ti_offline");
      document.cookie = "ti_offline=; path=/; max-age=0";
    }
    if (!offline && !isAuthenticated()) { router.replace("/login"); return; }
    if (offline) {
      setUser({ id: "offline", username: "Viajante", email: "", level: 1 });
      return;
    }
    const u = getUser();
    api.get<Profile>("/player/profile").then((p) => setProfile(p)).catch(() => null);
    localStorage.removeItem("ti_game_save");
    useGameStore.getState().resetSave();
    loadCloudSave()
      .then((serverOfflineMs) => {
        if (serverOfflineMs === null) return uploadCloudSave();
        const reward = useGameStore.getState().collectOfflineRewards(serverOfflineMs);
        if (reward) { setOfflineReward(reward); return uploadCloudSave(); }
      })
      .catch((err) => {
        console.error("[game] load save failed", err);
        useGameStore.getState().setCloudSynced(false);
      })
      .finally(() => { setUser(u); setShowNovatos(true); });
  }, [router]);

  useEffect(() => {
    const ping = () => api.get("/health").catch(() => null);
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const flush = () => { uploadCloudSave(); };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  async function handleLogout() {
    await uploadCloudSave();
    try { await api.post("/auth/logout"); } catch { /* ok */ }
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-atmosphere">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber/20 border-t-amber" />
          <span className="text-[11px] tracking-[0.3em] text-violet/60">CARREGANDO</span>
        </div>
      </div>
    );
  }

  const displayName = (profile?.characterName ?? user.username).toUpperCase();

  return (
    <div className="bg-atmosphere flex h-full flex-col">
      <AmbientPlayer />
      <AmbientParticles />

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        className="relative flex-shrink-0 flex items-center justify-between px-3 py-2 gap-2"
        style={{
          background: "linear-gradient(180deg, rgba(6,7,15,0.99) 0%, rgba(10,10,22,0.96) 100%)",
          borderBottom: "1px solid rgba(200,155,60,0.1)",
          boxShadow: "0 1px 0 rgba(200,155,60,0.04), 0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* player */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-black"
            style={{
              background: "linear-gradient(135deg, rgba(200,155,60,0.25), rgba(200,155,60,0.08))",
              border: "1px solid rgba(200,155,60,0.3)",
              color: AMBER,
              fontFamily: "var(--font-cinzel)",
            }}
          >
            {displayName[0]}
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] font-black tracking-[0.2em] text-cream/90" style={{ fontFamily: "var(--font-cinzel)" }}>
              {displayName}
            </span>
            <span className="text-[9px] text-violet/40">Nivel 1 · Conta comum</span>
          </div>
        </div>

        {/* recursos — centro */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <ResourceChip icon="◆" value={wallet.ouro}          color={AMBER}              label="Ouro"     />
          <ResourceChip icon="✦" value={wallet.cristaisAstra} color="rgb(170,130,255)"   label="Gemas"    />
          <ResourceChip icon="✦" value={wallet.selosDeInvocacao} color="rgb(90,160,255)" label="Selos"    />
        </div>

        {/* actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isPremium ? (
            <div className="flex items-center gap-1 rounded-lg border border-amber/30 px-2 py-1 text-[10px] font-black tracking-wide"
              style={{ background: "linear-gradient(135deg,rgba(200,155,60,0.2),rgba(200,155,60,0.08))", color: AMBER }}>
              ★ PREMIUM
            </div>
          ) : (
            <motion.button onClick={openBattlePass} whileTap={{ scale: 0.92 }} transition={{ duration: 0.08 }}
              className="flex items-center gap-1 rounded-lg border border-violet/20 px-2 py-1 text-[10px] font-bold tracking-wide text-violet/60">
              ✦ Premium
            </motion.button>
          )}
        </div>
      </header>

      {/* ── BODY: 3 colunas ────────────────────────────────────────────── */}
      <div className="relative flex flex-1 min-h-0">

        <LeftSidebar onMissoes={openDaily} />

        {/* CAMPO CENTRAL */}
        <main className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* barra do campo */}
          <div
            className="flex-shrink-0 flex items-center justify-between px-3 py-1.5"
            style={{
              background: "rgba(6,7,15,0.8)",
              borderBottom: "1px solid rgba(200,155,60,0.08)",
            }}
          >
            <span className="text-[10px] font-bold tracking-widest" style={{ color: AMBER, opacity: 0.7 }}>
              TRANSCEND INFINITY
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px]" style={{ color: "rgba(122,111,160,0.5)" }}>Fase 1</span>
              <span
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(80,200,120,0.12)", color: "rgb(80,200,120)", border: "1px solid rgba(80,200,120,0.2)" }}
              >
                Ativo
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(122,111,160,0.4)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 opacity-80 animate-pulse" />
              932 online
            </div>
          </div>

          {/* WorldTab como campo principal */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <WorldTab
              profile={profile}
              onInvocar={openInvocar}
              onDungeon={openDungeon}
              onArena={openArena}
              onMercado={openMercado}
              onBattlePass={openBattlePass}
              onTorre={openTorre}
              onDailyChallenges={openDaily}
              onBossHunt={openBossHunt}
              onWorldMap={openWorldMap}
              onNpcDialogue={openNpcDialogue}
              onCaravana={openCaravana}
            />
          </div>

          {/* Panel overlay — abre sobre o campo central */}
          <AnimatePresence>
            {panel && (
              <motion.div
                key={panel}
                className="absolute inset-0 z-30 flex flex-col"
                style={{ background: "rgba(6,7,15,0.97)" }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-amber/10">
                  <span className="text-[12px] font-bold tracking-widest" style={{ color: "rgb(232,217,160)", fontFamily: "var(--font-cinzel)" }}>
                    {NAV_ITEMS.find(n => n.id === panel)?.label.toUpperCase()}
                  </span>
                  <motion.button onClick={closePanel} whileTap={{ scale: 0.9 }} transition={{ duration: 0.08 }}
                    className="text-[11px] text-violet/40 w-7 h-7 flex items-center justify-center rounded border border-violet/10">
                    ✕
                  </motion.button>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  {panel === "herois"  && <CartasTab />}
                  {panel === "baus"    && <InvocarTab />}
                  {panel === "mercado" && <MercadoModal onClose={closePanel} embedded />}
                  {panel === "cla"     && <GuildaTab onFortress={openFortress} />}
                  {panel === "missoes" && <DailyChallengesModal onClose={closePanel} embedded />}
                  {panel === "fases"   && <WorldMapModal onClose={closePanel} embedded />}
                  {panel === "arena"   && <ArenaModal onClose={closePanel} embedded />}
                  {(panel === "loja" || panel === "talentos" || panel === "itens") && (
                    <ComingSoon label={NAV_ITEMS.find(n => n.id === panel)?.label ?? ""} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <RightSidebar onHerois={() => openPanel("herois")} />
      </div>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────── */}
      <nav
        className="relative flex-shrink-0"
        style={{
          background: "linear-gradient(0deg, rgba(6,7,15,0.99) 0%, rgba(10,10,22,0.96) 100%)",
          borderTop: "1px solid rgba(200,155,60,0.08)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className="flex overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = panel === id;
            return (
              <motion.button
                key={id}
                onClick={() => setPanel(active ? null : id)}
                whileTap={{ scale: 0.88 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 flex-shrink-0"
                style={{ minWidth: 72 }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-glow"
                    className="absolute inset-0"
                    style={{ background: `radial-gradient(ellipse at 50% 100%, ${AMBER}12 0%, transparent 70%)` }}
                    transition={{ duration: 0.25 }}
                  />
                )}
                {active && (
                  <motion.div
                    layoutId="nav-line"
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full"
                    style={{ background: AMBER, boxShadow: `0 0 8px ${AMBER}cc` }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon
                  weight={active ? "fill" : "light"}
                  size={18}
                  color={active ? AMBER : "rgba(180,170,210,0.55)"}
                />
                <span
                  className="text-[9px] font-bold tracking-wide"
                  style={{ color: active ? AMBER : "rgba(180,170,210,0.45)" }}
                >
                  {label.toUpperCase()}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ── MODAIS legados (abertos por WorldTab) ──────────────────────── */}
      <AnimatePresence>
        {showDungeon     && <DungeonModal        key="dungeon"    onClose={() => setShowDungeon(false)} />}
        {showBattlePass  && <BattlePassModal     key="battlepass" onClose={() => setShowBattlePass(false)} />}
        {showTorre       && <TorreModal          key="torre"      onClose={() => setShowTorre(false)} />}
        {showAchievements&& <AchievementsModal   key="achievements" onClose={() => setShowAchievements(false)} />}
        {showCodex       && <CodexModal          key="codex"      onClose={() => setShowCodex(false)} />}
        {showFortress    && <FortressModal       key="fortress"   onClose={() => setShowFortress(false)} />}
        {showBossHunt    && <BossHuntModal       key="bosshunt"   onClose={() => setShowBossHunt(false)} />}
        {showSeason      && <SeasonModal         key="season"     onClose={() => setShowSeason(false)} />}
        {showHousing     && <HousingModal        key="housing"    onClose={() => setShowHousing(false)} />}
        {showCompanions  && <CompanionsModal     key="companions" onClose={() => setShowCompanions(false)} />}
        {showAlchemy     && <AlchemyModal        key="alchemy"    onClose={() => setShowAlchemy(false)} />}
        {showWorldMap    && <WorldMapModal       key="worldmap"   onClose={() => setShowWorldMap(false)} />}
        {showNpcDialogue && <NpcDialogueModal    key="npcdialogue" onClose={() => setShowNpcDialogue(false)} />}
        {showCaravana    && <CaravanaModal       key="caravana"   onClose={() => setShowCaravana(false)} />}
        {showSettings    && <SettingsModal       key="settings"   onClose={() => setShowSettings(false)} />}
        {showProfession  && <ProfessionModal     key="profession" onClose={() => setShowProfession(false)} />}
        {showForge       && <ForgeModal          key="forge"      onClose={() => setShowForge(false)} />}
        {showWiki        && <WikiModal           key="wiki"       onClose={() => setShowWiki(false)} />}
      </AnimatePresence>

      {/* Guia do Novato banner */}
      <AnimatePresence>
        {showNovatos && (
          <motion.div
            className="absolute inset-x-0 top-12 z-[90] px-3"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-center justify-between rounded-xl border border-violet/25 px-4 py-3"
              style={{ background: "linear-gradient(135deg,rgba(122,111,160,0.18),rgba(10,10,22,0.95))", backdropFilter: "blur(12px)" }}>
              <div className="flex items-center gap-2.5">
                <span className="text-base">📖</span>
                <div>
                  <p className="text-[11px] font-bold text-cream/80">Guia do Novato</p>
                  <p className="text-[10px] text-violet/55">Aprenda mecanicas, herois e estrategias</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => { setShowNovatos(false); openWiki(); }}
                  whileTap={{ scale: 0.94 }} transition={{ duration: 0.08 }}
                  className="rounded-lg border border-amber/30 bg-amber/10 px-3 py-1.5 text-[10px] font-bold text-amber-400"
                >
                  Ver Guia
                </motion.button>
                <motion.button onClick={() => setShowNovatos(false)} whileTap={{ scale: 0.94 }} transition={{ duration: 0.08 }}
                  className="text-[11px] text-violet/40 px-1">
                  ✕
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offline reward */}
      <AnimatePresence>
        {offlineReward && (
          <motion.div className="absolute inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: "rgba(6,7,15,0.85)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="w-full max-w-sm rounded-2xl border border-amber/20 px-6 py-7"
              style={{ background: "linear-gradient(145deg, rgba(10,10,22,0.99), rgba(6,7,15,0.99))" }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
              <p className="mb-1 text-[11px] uppercase tracking-[0.25em] text-violet/60">Recompensas Offline</p>
              <p className="mb-4 text-[13px] font-bold text-cream/80">Bem-vindo de volta!</p>
              <div className="mb-5 flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-amber-400">+{offlineReward.ouro.toLocaleString("pt-BR")}</span>
                  <span className="text-[10px] text-violet/60">Ouro</span>
                </div>
                <div className="w-[1px] bg-violet/10" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-black text-cream/70">+{offlineReward.xp.toLocaleString("pt-BR")}</span>
                  <span className="text-[10px] text-violet/60">XP</span>
                </div>
              </div>
              <motion.button onClick={() => setOfflineReward(null)} whileTap={{ scale: 0.97 }}
                className="w-full rounded-xl border border-amber/30 bg-amber/10 py-3 text-[11px] font-bold tracking-widest text-amber-400">
                RESGATAR
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}><PaymentToast /></Suspense>
    </div>
  );
}

function ResourceChip({ icon, value, color, label }: { icon: string; value: number; color: string; label: string }) {
  return (
    <div
      title={label}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1px solid ${color}28`,
        color,
      }}
    >
      <span className="text-[9px]">{icon}</span>
      <AnimatedNumber value={value} />
    </div>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40 py-24">
      <span className="text-4xl">🚧</span>
      <p className="text-[12px] font-bold tracking-widest text-cream/60">{label.toUpperCase()} EM BREVE</p>
    </div>
  );
}

function PaymentToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("payment") as "success" | "failure" | "pending" | null;

  useEffect(() => {
    if (status === "success") setTimeout(() => loadCloudSave().catch(() => null), 3000);
  }, [status]);

  if (!status) return null;
  return (
    <AnimatePresence>
      <motion.div className="absolute inset-x-0 bottom-16 z-[90] flex justify-center px-4"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}>
        <div className="flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl"
          style={{
            background: status === "success" ? "rgba(10,30,15,0.98)" : "rgba(20,10,10,0.98)",
            borderColor: status === "success" ? "rgba(100,220,140,0.35)" : status === "pending" ? "rgba(200,155,60,0.35)" : "rgba(255,100,100,0.35)",
          }}>
          <span className="text-xl">{status === "success" ? "🎉" : status === "pending" ? "⏳" : "❌"}</span>
          <div>
            <p className="text-[12px] font-bold" style={{ color: status === "success" ? "rgb(100,220,140)" : status === "pending" ? "rgb(200,155,60)" : "rgb(255,100,100)" }}>
              {status === "success" ? "Pagamento aprovado!" : status === "pending" ? "Pagamento em analise" : "Pagamento nao concluido"}
            </p>
            <p className="text-[10px] text-violet/60">
              {status === "success" ? "Premium ativado. Recarregando save..." : status === "pending" ? "Voce sera notificado quando confirmar." : "Tente novamente quando quiser."}
            </p>
          </div>
          <motion.button onClick={() => router.replace("/game")} whileTap={{ scale: 0.9 }} className="ml-2 text-[11px] text-violet/40">✕</motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
