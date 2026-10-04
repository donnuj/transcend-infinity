"use client";

export const runtime = 'edge';

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Crown,
  CurrencyDollar,
  ShieldCheck,
  MagnifyingGlass,
  X,
  CaretRight,
  Coins,
  Star,
  Scroll,
  CheckCircle,
  Warning,
  ArrowClockwise,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { getUser, isAuthenticated } from "@/lib/auth";

const ADMIN_EMAIL = "antony.jasper@gmail.com";

// ── Types ────────────────────────────────────────────────────────────────────

type SaveStats = {
  ouro: number;
  cristaisAstra: number;
  selosDeInvocacao: number;
  selosLivres: number;
  isPremium: boolean;
  premiumType: string;
  premiumExpiresAt: string;
  playerLevel: number;
  heroCount: number;
  arenaRating: number;
  towerBestFloor: number;
};

type PlayerRow = {
  id: number;
  email: string;
  username: string;
  isBanned: boolean;
  createdAt: string;
  lastLogin: string;
  hasSave: boolean;
  saveStats: SaveStats | null;
  lastPurchase: { type: string; amount: number; createdAt: string } | null;
};

type PlayerDetail = PlayerRow & {
  banReason: string | null;
  player: {
    level: number;
    experience: number;
    gold: number;
    premiumCurrency: number;
    characterName: string;
  } | null;
  saveData: Record<string, unknown> | null;
  saveRevision: number;
  purchases: Purchase[];
};

type Purchase = {
  id: number;
  accountId: number;
  type: string;
  paymentId: string;
  amount: number;
  status: string;
  createdAt: string;
  account: { email: string; username: string };
};

type Grants = {
  ouro: string;
  cristaisAstra: string;
  selosDeInvocacao: string;
  selosLivres: string;
  premium: "" | "monthly" | "season";
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("pt-BR");
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: PhosphorIcon;
  color: string;
}) {
  return (
    <div
      style={{ borderColor: `${color}30` }}
      className="rounded-xl border bg-[rgb(10,10,22)] p-4 flex items-center gap-3"
    >
      <div
        style={{ background: `${color}18` }}
        className="rounded-lg p-2.5 shrink-0"
      >
        <Icon size={20} color={color} weight="duotone" />
      </div>
      <div>
        <p className="text-xs text-[rgba(232,217,160,0.5)] leading-none mb-1">{label}</p>
        <p className="text-xl font-semibold text-[rgb(232,217,160)] leading-none">{value}</p>
      </div>
    </div>
  );
}

// ── Grant Form ───────────────────────────────────────────────────────────────

function GrantForm({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: () => void;
}) {
  const [grants, setGrants] = useState<Grants>({
    ouro: "",
    cristaisAstra: "",
    selosDeInvocacao: "",
    selosLivres: "",
    premium: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function set(k: keyof Grants, v: string) {
    setGrants((g) => ({ ...g, [k]: v }));
    setResult(null);
  }

  async function submit() {
    setLoading(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {};
      if (grants.ouro) payload.ouro = parseInt(grants.ouro);
      if (grants.cristaisAstra) payload.cristaisAstra = parseInt(grants.cristaisAstra);
      if (grants.selosDeInvocacao) payload.selosDeInvocacao = parseInt(grants.selosDeInvocacao);
      if (grants.selosLivres) payload.selosLivres = parseInt(grants.selosLivres);
      if (grants.premium) payload.premium = grants.premium;

      if (Object.keys(payload).length === 0) {
        setResult("Preencha ao menos um campo.");
        return;
      }

      await api.post("/admin/grant", { email, grants: payload });
      setGrants({ ouro: "", cristaisAstra: "", selosDeInvocacao: "", selosLivres: "", premium: "" });
      setResult("ok");
      onSuccess();
    } catch (e: unknown) {
      setResult((e as Error).message ?? "Erro ao conceder recursos.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "w-full bg-[rgb(6,7,15)] border border-[rgba(200,155,60,0.2)] rounded-lg px-3 py-2 text-[rgb(232,217,160)] text-sm placeholder:text-[rgba(232,217,160,0.3)] focus:border-[rgba(200,155,60,0.6)] transition-colors duration-150";

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[rgba(232,217,160,0.5)] uppercase tracking-wider">
        Conceder recursos
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-[rgba(232,217,160,0.5)] mb-1 block">Ouro</label>
          <input
            type="number"
            placeholder="0"
            value={grants.ouro}
            onChange={(e) => set("ouro", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-[rgba(232,217,160,0.5)] mb-1 block">Cristais Astra</label>
          <input
            type="number"
            placeholder="0"
            value={grants.cristaisAstra}
            onChange={(e) => set("cristaisAstra", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-[rgba(232,217,160,0.5)] mb-1 block">Selos Invocacao</label>
          <input
            type="number"
            placeholder="0"
            value={grants.selosDeInvocacao}
            onChange={(e) => set("selosDeInvocacao", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-xs text-[rgba(232,217,160,0.5)] mb-1 block">Selos Livres</label>
          <input
            type="number"
            placeholder="0"
            value={grants.selosLivres}
            onChange={(e) => set("selosLivres", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-[rgba(232,217,160,0.5)] mb-1 block">Battle Pass Premium</label>
        <select
          value={grants.premium}
          onChange={(e) => set("premium", e.target.value as Grants["premium"])}
          className={inputCls + " cursor-pointer"}
        >
          <option value="">— sem premium —</option>
          <option value="monthly">Mensal (30 dias)</option>
          <option value="season">Temporada (fim do ano)</option>
        </select>
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[rgba(200,155,60,0.15)] border border-[rgba(200,155,60,0.4)] text-[rgb(200,155,60)] text-sm font-semibold transition-all duration-150 hover:bg-[rgba(200,155,60,0.25)] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Concedendo..." : "Conceder"}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
              result === "ok"
                ? "bg-[rgba(80,200,100,0.1)] text-[rgb(80,200,100)]"
                : "bg-[rgba(255,60,60,0.1)] text-[rgb(255,120,120)]"
            }`}
          >
            {result === "ok" ? (
              <CheckCircle size={16} weight="fill" />
            ) : (
              <Warning size={16} weight="fill" />
            )}
            {result === "ok" ? "Recursos concedidos com sucesso." : result}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Player Detail Panel ───────────────────────────────────────────────────────

function PlayerPanel({
  email,
  onClose,
  onRefresh,
}: {
  email: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [detail, setDetail] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<PlayerDetail>(`/admin/player/${encodeURIComponent(email)}`);
      setDetail(d);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function toggleBan() {
    if (!detail) return;
    setBanning(true);
    try {
      const reason = detail.isBanned ? undefined : prompt("Motivo do ban (opcional):") ?? undefined;
      await api.post("/admin/ban", {
        email: detail.email,
        isBanned: !detail.isBanned,
        banReason: reason,
      });
      await load();
      onRefresh();
    } finally {
      setBanning(false);
    }
  }

  const ss = detail?.saveStats;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.05 }}
      className="fixed inset-y-0 right-0 w-full max-w-md bg-[rgb(10,10,22)] border-l border-[rgba(200,155,60,0.15)] flex flex-col z-50 shadow-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[rgba(200,155,60,0.1)]">
        <div className="min-w-0">
          <p className="text-[rgb(232,217,160)] font-semibold truncate">
            {detail?.username ?? email}
          </p>
          <p className="text-xs text-[rgba(232,217,160,0.45)] truncate">{email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <button
            onClick={load}
            className="p-1.5 rounded-lg text-[rgba(232,217,160,0.4)] hover:text-[rgb(232,217,160)] hover:bg-[rgba(232,217,160,0.05)] transition-all duration-150"
          >
            <ArrowClockwise size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[rgba(232,217,160,0.4)] hover:text-[rgb(232,217,160)] hover:bg-[rgba(232,217,160,0.05)] transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[rgba(200,155,60,0.3)] border-t-[rgb(200,155,60)] animate-spin" />
        </div>
      ) : !detail ? (
        <div className="flex-1 flex items-center justify-center text-[rgba(232,217,160,0.4)] text-sm">
          Erro ao carregar jogador.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Status + ban */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                  detail.isBanned
                    ? "bg-[rgba(255,60,60,0.15)] text-[rgb(255,100,100)]"
                    : "bg-[rgba(80,200,100,0.12)] text-[rgb(80,200,100)]"
                }`}
              >
                {detail.isBanned ? "Banido" : "Ativo"}
              </span>
              {ss?.isPremium && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-[rgba(200,155,60,0.15)] text-[rgb(200,155,60)]">
                  <Crown size={10} weight="fill" /> Premium
                </span>
              )}
            </div>
            <button
              onClick={toggleBan}
              disabled={banning}
              className={`text-xs px-3 py-1 rounded-lg border transition-all duration-150 active:scale-[0.97] disabled:opacity-40 ${
                detail.isBanned
                  ? "border-[rgba(80,200,100,0.3)] text-[rgb(80,200,100)] hover:bg-[rgba(80,200,100,0.08)]"
                  : "border-[rgba(255,80,80,0.3)] text-[rgb(255,100,100)] hover:bg-[rgba(255,80,80,0.08)]"
              }`}
            >
              {banning ? "..." : detail.isBanned ? "Desbanir" : "Banir"}
            </button>
          </div>

          {/* Key stats */}
          {ss && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Nivel", value: ss.playerLevel },
                { label: "Herois", value: ss.heroCount },
                { label: "Arena", value: fmt(ss.arenaRating) },
                { label: "Torre", value: `Andar ${ss.towerBestFloor}` },
                { label: "Ouro", value: fmt(ss.ouro) },
                { label: "Cristais Astra", value: fmt(ss.cristaisAstra) },
                { label: "Selos Invocacao", value: fmt(ss.selosDeInvocacao) },
                { label: "Selos Livres", value: fmt(ss.selosLivres) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-[rgb(6,7,15)] rounded-lg px-3 py-2 border border-[rgba(200,155,60,0.1)]"
                >
                  <p className="text-[10px] text-[rgba(232,217,160,0.4)] mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-[rgb(232,217,160)]">{value}</p>
                </div>
              ))}
            </div>
          )}

          {!detail.hasSave && (
            <p className="text-xs text-[rgba(232,217,160,0.35)] text-center py-2">
              Este jogador ainda nao tem save.
            </p>
          )}

          {/* Account info */}
          <div className="text-xs text-[rgba(232,217,160,0.4)] space-y-1">
            <div className="flex justify-between">
              <span>Personagem</span>
              <span className="text-[rgb(232,217,160)]">{detail.player?.characterName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Cadastro</span>
              <span className="text-[rgb(232,217,160)]">{fmtDate(detail.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Ultimo login</span>
              <span className="text-[rgb(232,217,160)]">{relTime(detail.lastLogin)}</span>
            </div>
            <div className="flex justify-between">
              <span>Revisao save</span>
              <span className="text-[rgb(232,217,160)]">#{detail.saveRevision}</span>
            </div>
            {detail.isBanned && detail.banReason && (
              <div className="flex justify-between">
                <span>Motivo ban</span>
                <span className="text-[rgb(255,100,100)] max-w-[60%] text-right">{detail.banReason}</span>
              </div>
            )}
          </div>

          {/* Purchases */}
          {detail.purchases.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[rgba(232,217,160,0.5)] uppercase tracking-wider mb-2">
                Compras
              </p>
              <div className="space-y-1.5">
                {detail.purchases.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-[rgb(6,7,15)] rounded-lg px-3 py-2 border border-[rgba(200,155,60,0.1)]"
                  >
                    <div>
                      <p className="text-xs text-[rgb(232,217,160)] capitalize">
                        Battle Pass {p.type === "monthly" ? "Mensal" : "Temporada"}
                      </p>
                      <p className="text-[10px] text-[rgba(232,217,160,0.4)]">{fmtDate(p.createdAt)}</p>
                    </div>
                    <p className="text-xs font-semibold text-[rgb(80,200,100)]">
                      R$ {p.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grant form */}
          {detail.hasSave && (
            <GrantForm email={email} onSuccess={load} />
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Purchases Tab ─────────────────────────────────────────────────────────────

function PurchasesTab() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Purchase[]>("/admin/purchases")
      .then(setPurchases)
      .finally(() => setLoading(false));
  }, []);

  const total = purchases.reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-[rgba(200,155,60,0.3)] border-t-[rgb(200,155,60)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(232,217,160,0.6)]">
          {purchases.length} compra{purchases.length !== 1 ? "s" : ""}
        </p>
        <p className="text-sm font-semibold text-[rgb(80,200,100)]">
          Total: R$ {total.toFixed(2)}
        </p>
      </div>

      {purchases.length === 0 ? (
        <p className="text-center text-[rgba(232,217,160,0.35)] text-sm py-12">
          Nenhuma compra registrada.
        </p>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between bg-[rgb(10,10,22)] border border-[rgba(200,155,60,0.1)] rounded-xl px-4 py-3"
            >
              <div>
                <p className="text-sm text-[rgb(232,217,160)] font-medium">
                  {p.account.username}
                </p>
                <p className="text-xs text-[rgba(232,217,160,0.45)]">{p.account.email}</p>
                <p className="text-xs text-[rgba(232,217,160,0.35)] mt-0.5">
                  Battle Pass {p.type === "monthly" ? "Mensal" : "Temporada"} · {fmtDate(p.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[rgb(80,200,100)]">
                  R$ {p.amount.toFixed(2)}
                </p>
                <p
                  className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                    p.status === "approved"
                      ? "bg-[rgba(80,200,100,0.12)] text-[rgb(80,200,100)]"
                      : "bg-[rgba(255,160,40,0.12)] text-[rgb(255,160,40)]"
                  }`}
                >
                  {p.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"players" | "purchases">("players");
  const initializedRef = useRef(false);

  const loadPlayers = useCallback(async () => {
    try {
      const res = await api.get<{ data: PlayerRow[] } | PlayerRow[]>("/admin/players");
      setPlayers(Array.isArray(res) ? res : res.data);
    } catch {
      router.replace("/game");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (!isAuthenticated()) { router.replace("/login"); return; }
    const user = getUser();
    if (!user || user.email !== ADMIN_EMAIL) { router.replace("/game"); return; }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlayers();
  }, [loadPlayers, router]);

  const filtered = players.filter(
    (p) =>
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase()),
  );

  const premiumCount = players.filter((p) => p.saveStats?.isPremium).length;
  const bannedCount = players.filter((p) => p.isBanned).length;

  return (
    <div className="min-h-screen bg-[rgb(6,7,15)] text-[rgb(232,217,160)]">
      {/* Header */}
      <header className="border-b border-[rgba(200,155,60,0.1)] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-[rgb(232,217,160)]">
            Transcend Infinity — Admin
          </h1>
          <p className="text-xs text-[rgba(232,217,160,0.4)]">
            {ADMIN_EMAIL}
          </p>
        </div>
        <button
          onClick={() => router.push("/game")}
          className="text-xs px-3 py-1.5 rounded-lg border border-[rgba(200,155,60,0.25)] text-[rgba(200,155,60,0.7)] hover:text-[rgb(200,155,60)] hover:border-[rgba(200,155,60,0.5)] transition-all duration-150 active:scale-[0.97]"
        >
          Voltar ao jogo
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Jogadores"
            value={players.length}
            icon={Users}
            color="rgb(90,160,255)"
          />
          <StatCard
            label="Premium"
            value={premiumCount}
            icon={Crown}
            color="rgb(200,155,60)"
          />
          <StatCard
            label="Banidos"
            value={bannedCount}
            icon={ShieldCheck}
            color="rgb(255,100,100)"
          />
          <StatCard
            label="Receita"
            value="Ver compras"
            icon={CurrencyDollar}
            color="rgb(80,200,100)"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[rgb(10,10,22)] border border-[rgba(200,155,60,0.1)] rounded-xl p-1 w-fit">
          {(["players", "purchases"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                tab === t
                  ? "bg-[rgba(200,155,60,0.15)] text-[rgb(200,155,60)]"
                  : "text-[rgba(232,217,160,0.45)] hover:text-[rgba(232,217,160,0.75)]"
              }`}
            >
              {t === "players" ? "Jogadores" : "Compras"}
            </button>
          ))}
        </div>

        {/* Players tab */}
        {tab === "players" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(232,217,160,0.35)]"
              />
              <input
                placeholder="Buscar por email ou username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[rgb(10,10,22)] border border-[rgba(200,155,60,0.15)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[rgb(232,217,160)] placeholder:text-[rgba(232,217,160,0.3)] focus:border-[rgba(200,155,60,0.4)] transition-colors duration-150"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 rounded-full border-2 border-[rgba(200,155,60,0.3)] border-t-[rgb(200,155,60)] animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-[rgba(232,217,160,0.35)] text-sm py-12">
                {search ? "Nenhum resultado." : "Nenhum jogador cadastrado."}
              </p>
            ) : (
              <div className="space-y-2">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.04, 0.3) }}
                  >
                    <button
                      onClick={() => setSelected(p.email)}
                      className="w-full flex items-center gap-4 bg-[rgb(10,10,22)] border border-[rgba(200,155,60,0.1)] rounded-xl px-4 py-3 text-left hover:border-[rgba(200,155,60,0.25)] hover:bg-[rgba(200,155,60,0.03)] transition-all duration-150 active:scale-[0.995] group"
                    >
                      {/* Avatar placeholder */}
                      <div className="w-9 h-9 rounded-full bg-[rgba(200,155,60,0.1)] border border-[rgba(200,155,60,0.2)] flex items-center justify-center shrink-0 text-sm font-bold text-[rgb(200,155,60)]">
                        {p.username[0]?.toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-[rgb(232,217,160)] truncate">
                            {p.username}
                          </span>
                          {p.saveStats?.isPremium && (
                            <Crown
                              size={12}
                              weight="fill"
                              className="text-[rgb(200,155,60)] shrink-0"
                            />
                          )}
                          {p.isBanned && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(255,60,60,0.15)] text-[rgb(255,100,100)] shrink-0">
                              banido
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[rgba(232,217,160,0.4)] truncate">{p.email}</p>
                      </div>

                      <div className="hidden sm:flex items-center gap-4 text-xs text-[rgba(232,217,160,0.4)] shrink-0">
                        {p.saveStats && (
                          <>
                            <span className="flex items-center gap-1">
                              <Star size={11} weight="fill" className="text-[rgba(200,155,60,0.5)]" />
                              Lv {p.saveStats.playerLevel}
                            </span>
                            <span className="flex items-center gap-1">
                              <Coins size={11} className="text-[rgba(200,155,60,0.5)]" />
                              {fmt(p.saveStats.ouro)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Scroll size={11} className="text-[rgba(160,80,220,0.7)]" />
                              {fmt(p.saveStats.cristaisAstra)}
                            </span>
                          </>
                        )}
                        <span>{relTime(p.lastLogin)}</span>
                      </div>

                      <CaretRight
                        size={14}
                        className="text-[rgba(200,155,60,0.3)] group-hover:text-[rgba(200,155,60,0.6)] transition-colors duration-150 shrink-0"
                      />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "purchases" && <PurchasesTab />}
      </main>

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <PlayerPanel
              email={selected}
              onClose={() => setSelected(null)}
              onRefresh={loadPlayers}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
