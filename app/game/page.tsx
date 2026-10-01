"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeSimple, Cards, Sparkle, Shield, User } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { getUser, isAuthenticated, clearSession } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import { useGameStore } from "@/lib/game/store";
import { loadCloudSave, uploadCloudSave } from "@/lib/game/save";
import dynamic from "next/dynamic";
import WorldTab from "./WorldTab";
import CartasTab from "./CartasTab";
import InvocarTab from "./InvocarTab";
import GuildaTab from "./GuildaTab";
import PerfilTab from "./PerfilTab";

const DungeonModal       = dynamic(() => import("./DungeonModal"),       { ssr: false });
const ArenaModal         = dynamic(() => import("./ArenaModal"),         { ssr: false });
const MercadoModal       = dynamic(() => import("./MercadoModal"),       { ssr: false });
const BattlePassModal    = dynamic(() => import("./BattlePassModal"),    { ssr: false });
const TorreModal         = dynamic(() => import("./TorreModal"),         { ssr: false });
const AchievementsModal  = dynamic(() => import("./AchievementsModal"),  { ssr: false });
const DailyChallengesModal = dynamic(() => import("./DailyChallengesModal"), { ssr: false });
const CodexModal         = dynamic(() => import("./CodexModal"),         { ssr: false });
const FortressModal      = dynamic(() => import("./FortressModal"),      { ssr: false });
const BossHuntModal      = dynamic(() => import("./BossHuntModal"),      { ssr: false });
const SeasonModal        = dynamic(() => import("./SeasonModal"),        { ssr: false });
const HousingModal       = dynamic(() => import("./HousingModal"),       { ssr: false });
const CompanionsModal    = dynamic(() => import("./CompanionsModal"),    { ssr: false });
const AlchemyModal       = dynamic(() => import("./AlchemyModal"),       { ssr: false });
const WorldMapModal      = dynamic(() => import("./WorldMapModal"),      { ssr: false });
const NpcDialogueModal   = dynamic(() => import("./NpcDialogueModal"),   { ssr: false });
const CaravanaModal      = dynamic(() => import("./CaravanaModal"),      { ssr: false });
const SettingsModal      = dynamic(() => import("./SettingsModal"),      { ssr: false });
const ProfessionModal    = dynamic(() => import("./ProfessionModal"),    { ssr: false });
const ForgeModal         = dynamic(() => import("./ForgeModal"),         { ssr: false });
const WikiModal          = dynamic(() => import("./WikiModal"),          { ssr: false });

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

type Tab = "mundo" | "cartas" | "invocar" | "guilda" | "perfil";

type PhosphorIcon = React.ComponentType<{ weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; size?: number; color?: string }>;

const TABS: { id: Tab; label: string; Icon: PhosphorIcon; color: string }[] = [
  { id: "mundo",   label: "Mundo",   Icon: GlobeSimple, color: "rgb(90,160,255)"   },
  { id: "cartas",  label: "Cartas",  Icon: Cards,       color: "rgb(180,110,255)"  },
  { id: "invocar", label: "Invocar", Icon: Sparkle,     color: "rgb(200,155,60)"   },
  { id: "guilda",  label: "Guilda",  Icon: Shield,      color: "rgb(100,210,130)"  },
  { id: "perfil",  label: "Perfil",  Icon: User,        color: "rgb(232,217,160)"  },
];

const ease = [0.23, 1, 0.32, 1] as const;

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wallet = useGameStore((s) => s.save.wallet);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("mundo");
  const [showDungeon, setShowDungeon] = useState(false);
  const [showArena, setShowArena] = useState(false);
  const [showMercado, setShowMercado] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showTorre, setShowTorre] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showFortress, setShowFortress] = useState(false);
  const [showBossHunt, setShowBossHunt] = useState(false);
  const [showSeason, setShowSeason] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showCompanions, setShowCompanions] = useState(false);
  const [showAlchemy, setShowAlchemy] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showNpcDialogue, setShowNpcDialogue] = useState(false);
  const [showCaravana, setShowCaravana] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfession, setShowProfession] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [showWiki, setShowWiki] = useState(false);
  const [offlineReward, setOfflineReward] = useState<{ ouro: number; xp: number } | null>(null);
  const [showNovatos, setShowNovatos] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failure" | "pending" | null>(null);
  const isPremium = useGameStore((s) => s.save.battlePass.isPremium);

  // Modal callbacks — stable references
  const openInvocar      = useCallback(() => setTab("invocar"), []);
  const openDungeon      = useCallback(() => setShowDungeon(true), []);
  const closeDungeon     = useCallback(() => setShowDungeon(false), []);
  const openArena        = useCallback(() => setShowArena(true), []);
  const closeArena       = useCallback(() => setShowArena(false), []);
  const openMercado      = useCallback(() => setShowMercado(true), []);
  const closeMercado     = useCallback(() => setShowMercado(false), []);
  const openBattlePass   = useCallback(() => setShowBattlePass(true), []);
  const closeBattlePass  = useCallback(() => setShowBattlePass(false), []);
  const openTorre        = useCallback(() => setShowTorre(true), []);
  const closeTorre       = useCallback(() => setShowTorre(false), []);
  const openAchievements = useCallback(() => setShowAchievements(true), []);
  const closeAchievements= useCallback(() => setShowAchievements(false), []);
  const openDaily        = useCallback(() => setShowDailyChallenges(true), []);
  const closeDaily       = useCallback(() => setShowDailyChallenges(false), []);
  const openCodex        = useCallback(() => setShowCodex(true), []);
  const closeCodex       = useCallback(() => setShowCodex(false), []);
  const openFortress     = useCallback(() => setShowFortress(true), []);
  const closeFortress    = useCallback(() => setShowFortress(false), []);
  const openBossHunt     = useCallback(() => setShowBossHunt(true), []);
  const closeBossHunt    = useCallback(() => setShowBossHunt(false), []);
  const openSeason       = useCallback(() => setShowSeason(true), []);
  const closeSeason      = useCallback(() => setShowSeason(false), []);
  const openHousing      = useCallback(() => setShowHousing(true), []);
  const closeHousing     = useCallback(() => setShowHousing(false), []);
  const openCompanions   = useCallback(() => setShowCompanions(true), []);
  const closeCompanions  = useCallback(() => setShowCompanions(false), []);
  const openAlchemy      = useCallback(() => setShowAlchemy(true), []);
  const closeAlchemy     = useCallback(() => setShowAlchemy(false), []);
  const openWorldMap     = useCallback(() => setShowWorldMap(true), []);
  const closeWorldMap    = useCallback(() => setShowWorldMap(false), []);
  const openNpcDialogue  = useCallback(() => setShowNpcDialogue(true), []);
  const closeNpcDialogue = useCallback(() => setShowNpcDialogue(false), []);
  const openCaravana     = useCallback(() => setShowCaravana(true), []);
  const closeCaravana    = useCallback(() => setShowCaravana(false), []);
  const openSettings     = useCallback(() => setShowSettings(true), []);
  const closeSettings    = useCallback(() => setShowSettings(false), []);
  const openProfession   = useCallback(() => setShowProfession(true), []);
  const closeProfession  = useCallback(() => setShowProfession(false), []);
  const openForge        = useCallback(() => setShowForge(true), []);
  const closeForge       = useCallback(() => setShowForge(false), []);
  const openWiki         = useCallback(() => setShowWiki(true), []);
  const closeWiki        = useCallback(() => setShowWiki(false), []);

  useEffect(() => {
    const offline = localStorage.getItem("ti_offline") === "1";
    if (offline) {
      localStorage.removeItem("ti_offline");
      document.cookie = "ti_offline=; path=/; max-age=0";
    }

    if (!offline && !isAuthenticated()) { router.replace("/login"); return; }
    if (offline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser({ id: "offline", username: "Viajante", email: "", level: 1 });
      return;
    }
    const u = getUser();
    api.get<Profile>("/player/profile").then((p) => setProfile(p)).catch(() => null);
    localStorage.removeItem("ti_game_save");
    useGameStore.getState().resetSave();
    loadCloudSave()
      .then((serverOfflineMs) => {
        if (serverOfflineMs === null) return uploadCloudSave(); // save ainda não existe
        // Use server-provided elapsed time — not manipulable by the client
        const reward = useGameStore.getState().collectOfflineRewards(serverOfflineMs);
        if (reward) { setOfflineReward(reward); return uploadCloudSave(); }
      })
      .catch((err) => {
        // Erro real (rede, 5xx, auth) — não fazer upload para não sobrescrever save existente
        console.error("[game] load save failed, showing unsynced state", err);
        useGameStore.getState().setCloudSynced(false);
      })
      .finally(() => { setUser(u); setShowNovatos(true); });
  }, [router]);

  // Detecta retorno do checkout MP
  useEffect(() => {
    const status = searchParams.get("payment") as "success" | "failure" | "pending" | null;
    if (!status) return;
    setPaymentStatus(status);
    router.replace("/game");
    if (status === "success") {
      setTimeout(() => loadCloudSave().catch(() => null), 3000);
    }
  }, [searchParams, router]);

  // Keep-alive: mantém o backend no Render acordado enquanto o jogador está na sessão
  useEffect(() => {
    const ping = () => api.get("/health").catch(() => null);
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Flush save when the user closes the tab or navigates away
  useEffect(() => {
    const flush = () => { uploadCloudSave(); };
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, []);

  async function handleLogout() {
    await uploadCloudSave();
    try {
      await api.post("/auth/logout");
    } catch {
      // cookie já expirado ou servidor offline — continua com logout local
    }
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

  return (
    <div className="bg-atmosphere flex h-full">
    <div className="relative flex h-full w-full flex-col">
      {/* Top bar */}
      <header
        className="relative"
        style={{
          background: "linear-gradient(180deg, rgba(6,7,15,0.98) 0%, rgba(10,10,22,0.92) 100%)",
          borderBottom: "1px solid rgba(200,155,60,0.1)",
          boxShadow: "0 1px 0 rgba(200,155,60,0.04), 0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black"
            style={{
              background: "linear-gradient(135deg, rgba(200,155,60,0.25) 0%, rgba(200,155,60,0.08) 100%)",
              border: "1px solid rgba(200,155,60,0.3)",
              color: "rgb(200,155,60)",
              fontFamily: "var(--font-cinzel)",
            }}
          >
            {(profile?.characterName ?? user.username)[0].toUpperCase()}
          </div>
          <span
            className="text-[11px] font-black tracking-[0.2em] text-cream/90"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            {(profile?.characterName ?? user.username).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isPremium ? (
            <div className="flex items-center gap-1 rounded-lg border border-amber/30 px-2 py-1 text-[10px] font-black tracking-wide"
              style={{ background: "linear-gradient(135deg,rgba(200,155,60,0.2),rgba(200,155,60,0.08))", color: "rgb(200,155,60)" }}>
              ★ PREMIUM
            </div>
          ) : (
            <motion.button onClick={openBattlePass} whileTap={{ scale: 0.92 }} transition={{ duration: 0.08 }}
              className="flex items-center gap-1 rounded-lg border border-violet/20 px-2 py-1 text-[10px] font-bold tracking-wide text-violet/60">
              ✦ Premium
            </motion.button>
          )}
          <Chip icon="✦" value={wallet.cristaisAstra} color="rgb(170,130,255)" />
          <Chip icon="◆" value={wallet.ouro} color="rgb(200,155,60)" />
        </div>
      </div>
      </header>

      {/* Content */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "mundo"   && <WorldTab   key="mundo"   profile={profile} onInvocar={openInvocar} onDungeon={openDungeon} onArena={openArena} onMercado={openMercado} onBattlePass={openBattlePass} onTorre={openTorre} onDailyChallenges={openDaily} onBossHunt={openBossHunt} onWorldMap={openWorldMap} onNpcDialogue={openNpcDialogue} onCaravana={openCaravana} />}
          {tab === "cartas"  && <CartasTab  key="cartas" />}
          {tab === "invocar" && <InvocarTab key="invocar" />}
          {tab === "guilda"  && <GuildaTab  key="guilda" onFortress={openFortress} />}
          {tab === "perfil"  && <PerfilTab  key="perfil" profile={profile} onLogout={handleLogout} onAchievements={openAchievements} onCodex={openCodex} onSeason={openSeason} onHousing={openHousing} onCompanions={openCompanions} onAlchemy={openAlchemy} onSettings={openSettings} onProfession={openProfession} onForge={openForge} onWiki={openWiki} />}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showDungeon    && <DungeonModal        key="dungeon"    onClose={closeDungeon} />}
        {showArena      && <ArenaModal          key="arena"      onClose={closeArena} />}
        {showMercado    && <MercadoModal        key="mercado"    onClose={closeMercado} />}
        {showBattlePass && <BattlePassModal     key="battlepass" onClose={closeBattlePass} />}
        {showTorre      && <TorreModal          key="torre"      onClose={closeTorre} />}
        {showAchievements && <AchievementsModal key="achievements" onClose={closeAchievements} />}
        {showDailyChallenges && <DailyChallengesModal key="daily" onClose={closeDaily} />}
        {showCodex      && <CodexModal          key="codex"      onClose={closeCodex} />}
        {showFortress   && <FortressModal       key="fortress"   onClose={closeFortress} />}
        {showBossHunt   && <BossHuntModal       key="bosshunt"   onClose={closeBossHunt} />}
        {showSeason     && <SeasonModal         key="season"     onClose={closeSeason} />}
        {showHousing    && <HousingModal        key="housing"    onClose={closeHousing} />}
        {showCompanions && <CompanionsModal     key="companions" onClose={closeCompanions} />}
        {showAlchemy    && <AlchemyModal        key="alchemy"    onClose={closeAlchemy} />}
        {showWorldMap   && <WorldMapModal       key="worldmap"   onClose={closeWorldMap} />}
        {showNpcDialogue && <NpcDialogueModal   key="npcdialogue" onClose={closeNpcDialogue} />}
        {showCaravana   && <CaravanaModal       key="caravana"   onClose={closeCaravana} />}
        {showSettings   && <SettingsModal       key="settings"   onClose={closeSettings} />}
        {showProfession && <ProfessionModal     key="profession" onClose={closeProfession} />}
        {showForge      && <ForgeModal          key="forge"      onClose={closeForge} />}
        {showWiki       && <WikiModal           key="wiki"       onClose={closeWiki} />}
      </AnimatePresence>

      {/* Retorno de pagamento */}
      <AnimatePresence>
        {paymentStatus && (
          <motion.div
            className="absolute inset-x-0 bottom-20 z-[90] flex justify-center px-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl"
              style={{
                background: paymentStatus === "success" ? "rgba(10,30,15,0.98)" : "rgba(20,10,10,0.98)",
                borderColor: paymentStatus === "success" ? "rgba(100,220,140,0.35)" : paymentStatus === "pending" ? "rgba(200,155,60,0.35)" : "rgba(255,100,100,0.35)",
              }}
            >
              <span className="text-xl">{paymentStatus === "success" ? "🎉" : paymentStatus === "pending" ? "⏳" : "❌"}</span>
              <div>
                <p className="text-[12px] font-bold" style={{ color: paymentStatus === "success" ? "rgb(100,220,140)" : paymentStatus === "pending" ? "rgb(200,155,60)" : "rgb(255,100,100)" }}>
                  {paymentStatus === "success" ? "Pagamento aprovado!" : paymentStatus === "pending" ? "Pagamento em análise" : "Pagamento não concluído"}
                </p>
                <p className="text-[10px] text-violet/60">
                  {paymentStatus === "success" ? "Premium ativado. Recarregando save..." : paymentStatus === "pending" ? "Você será notificado quando confirmar." : "Tente novamente quando quiser."}
                </p>
              </div>
              <motion.button onClick={() => setPaymentStatus(null)} whileTap={{ scale: 0.9 }} transition={{ duration: 0.08 }} className="ml-2 text-[11px] text-violet/40">✕</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guia do Novato banner */}
      <AnimatePresence>
        {showNovatos && (
          <motion.div
            className="absolute inset-x-0 top-0 z-[90] px-4 pt-3"
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
                  <p className="text-[10px] text-violet/55">Aprenda mecânicas, heróis e estratégias</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => { setShowNovatos(false); openWiki(); }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.08 }}
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

      {/* Offline reward popup */}
      <AnimatePresence>
        {offlineReward && (
          <motion.div
            className="absolute inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: "rgba(6,7,15,0.85)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-2xl border border-amber/20 px-6 py-7"
              style={{ background: "linear-gradient(145deg, rgba(10,10,22,0.99), rgba(6,7,15,0.99))" }}
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
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
              <motion.button
                onClick={() => setOfflineReward(null)}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border border-amber/30 bg-amber/10 py-3 text-[11px] font-bold tracking-widest text-amber-400"
              >
                RESGATAR
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom nav */}
      <nav
        className="relative"
        style={{
          background: "linear-gradient(0deg, rgba(6,7,15,0.99) 0%, rgba(10,10,22,0.96) 100%)",
          borderTop: "1px solid rgba(200,155,60,0.08)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 -1px 0 rgba(200,155,60,0.05)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
      <div className="mx-auto flex max-w-5xl">
        {TABS.map(({ id, label, Icon, color }) => {
          const active = tab === id;
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3.5"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-t-2xl"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}15 0%, transparent 70%)` }}
                  transition={{ duration: 0.3, ease }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="nav-line"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-7 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}cc` }}
                  transition={{ duration: 0.25, ease }}
                />
              )}
              <motion.div
                className="relative z-10"
                animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                style={{ filter: active ? `drop-shadow(0 0 5px ${color}90)` : "none" }}
              >
                <Icon
                  weight={active ? "fill" : "light"}
                  size={20}
                  color={active ? color : "rgba(180,170,210,0.65)"}
                />
              </motion.div>
              <span
                className="relative z-10 text-[11px] font-bold tracking-[0.14em]"
                style={{
                  color: active ? color : "rgba(180,170,210,0.55)",
                  transition: "color 220ms cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                {label.toUpperCase()}
              </span>
            </motion.button>
          );
        })}
      </div>
      </nav>
    </div>
    </div>
  );
}

function Chip({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1px solid ${color}28`,
        color,
        boxShadow: `0 1px 6px ${color}10, 0 0 0 0.5px ${color}15 inset`,
      }}
    >
      <span className="text-[10px]">{icon}</span>
      <span>{value.toLocaleString("pt-BR")}</span>
    </div>
  );
}
