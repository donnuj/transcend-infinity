"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type ShopSection = "selos" | "itens" | "premium";

const SELO_BUNDLES = [
  { id: "s1",  label: "1 Selo",   amount: 1,   ouro: 800,  cristais: 0,   icon: "✦" },
  { id: "s5",  label: "5 Selos",  amount: 5,   ouro: 3500, cristais: 0,   icon: "✦" },
  { id: "s10", label: "10 Selos", amount: 10,  ouro: 6000, cristais: 0,   icon: "✦" },
  { id: "s1c", label: "1 Selo",   amount: 1,   ouro: 0,    cristais: 160, icon: "✦" },
  { id: "s10c",label: "10 Selos", amount: 10,  ouro: 0,    cristais: 1500,icon: "✦" },
];

const ITEM_BUNDLES = [
  { id: "i1", label: "Poção de Cura ×5",      itemId: "pocao_cura_p",     qty: 5,  ouro: 150,  icon: "🧪" },
  { id: "i2", label: "Poção de Cura II ×3",   itemId: "pocao_cura_m",     qty: 3,  ouro: 250,  icon: "🧪" },
  { id: "i3", label: "Cristal de Evolução ×1",itemId: "cristal_evolucao", qty: 1,  ouro: 300,  icon: "💎" },
  { id: "i4", label: "Cristal de Evolução ×5",itemId: "cristal_evolucao", qty: 5,  ouro: 1200, icon: "💎" },
  { id: "i5", label: "Pedra de Ascensão ×1",  itemId: "pedra_ascensao",   qty: 1,  ouro: 800,  icon: "🗿" },
  { id: "i6", label: "Essência de Skill ×3",  itemId: "essencia_skill",   qty: 3,  ouro: 500,  icon: "✨" },
];

const PREMIUM_BUNDLES = [
  { id: "p1", label: "Pacote Iniciante",    cristaisAstra: 320,  description: "320 Cristais Astra",         usd: "R$ 4,99"  },
  { id: "p2", label: "Pacote Aventureiro",  cristaisAstra: 800,  description: "800 Cristais Astra",         usd: "R$ 9,99"  },
  { id: "p3", label: "Pacote Herói",        cristaisAstra: 1680, description: "1680 Cristais + bônus 10%",  usd: "R$ 19,99" },
  { id: "p4", label: "Pacote Lendário",     cristaisAstra: 5000, description: "5000 Cristais + bônus 50%",  usd: "R$ 49,99" },
];

export default function MercadoModal({ onClose, embedded }: { onClose: () => void; embedded?: boolean }) {
  const [section, setSection] = useState<ShopSection>("selos");
  const [feedback, setFeedback] = useState<string | null>(null);
  const { save, spendCurrency, addCurrency, addItem } = useGameStore();

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }

  function buySeloBundle(b: typeof SELO_BUNDLES[0]) {
    if (b.ouro > 0) {
      if (!spendCurrency("ouro", b.ouro)) { showFeedback("Ouro insuficiente"); return; }
    } else if (b.cristais > 0) {
      if (!spendCurrency("cristaisAstra", b.cristais)) { showFeedback("Cristais insuficientes"); return; }
    }
    addCurrency("selosDeInvocacao", b.amount);
    scheduleSave();
    showFeedback(`+${b.amount} Selo${b.amount > 1 ? "s" : ""} adquirido${b.amount > 1 ? "s" : ""}!`);
  }

  function buyItemBundle(b: typeof ITEM_BUNDLES[0]) {
    if (!spendCurrency("ouro", b.ouro)) { showFeedback("Ouro insuficiente"); return; }
    addItem(b.itemId, b.qty);
    scheduleSave();
    showFeedback(`${b.label} adquirido!`);
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
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← Fechar
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">MERCADO</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-bold text-amber-400">◆ {save.wallet.ouro.toLocaleString("pt-BR")}</span>
          <span className="font-bold" style={{ color: "rgb(170,130,255)" }}>✦ {save.wallet.cristaisAstra}</span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 border-b border-violet/10 px-4 py-2">
        {(["selos","itens","premium"] as const).map((s) => (
          <motion.button
            key={s}
            onClick={() => setSection(s)}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="flex-1 rounded-lg py-1.5 text-[11px] font-bold tracking-wider"
            style={{
              background: section === s ? "rgba(200,155,60,0.1)" : "transparent",
              color:      section === s ? "rgb(200,155,60)" : "rgba(122,111,160,0.5)",
              border:     `1px solid ${section === s ? "rgba(200,155,60,0.3)" : "transparent"}`,
            }}
          >
            {s === "selos" ? "SELOS" : s === "itens" ? "ITENS" : "PREMIUM"}
          </motion.button>
        ))}
      </div>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className="absolute left-1/2 top-20 -translate-x-1/2 rounded-full border border-amber/30 bg-amber/10 px-4 py-2 text-[10px] font-bold text-amber-400"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop animation banner */}
      <div style={{ position: "relative", height: 60, overflow: "hidden", background: "linear-gradient(180deg, rgba(200,155,60,0.06) 0%, transparent 100%)", borderBottom: "1px solid rgba(200,155,60,0.08)" }}>
        {[
          { icon: "◆", x: 8,  delay: 0,    color: "rgba(200,155,60,0.7)",  size: 14 },
          { icon: "✦", x: 22, delay: 0.5,  color: "rgba(255,255,200,0.5)", size: 10 },
          { icon: "◆", x: 38, delay: 1.2,  color: "rgba(200,155,60,0.6)",  size: 12 },
          { icon: "✦", x: 55, delay: 0.3,  color: "rgba(170,130,255,0.6)", size: 10 },
          { icon: "◆", x: 68, delay: 0.8,  color: "rgba(200,155,60,0.7)",  size: 14 },
          { icon: "✦", x: 82, delay: 1.6,  color: "rgba(100,210,130,0.6)", size: 11 },
          { icon: "◆", x: 92, delay: 0.4,  color: "rgba(200,155,60,0.5)",  size: 12 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [60, -10], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.5, delay: p.delay, repeat: Infinity, ease: "easeOut", times: [0, 0.2, 0.8, 1] }}
            style={{ position: "absolute", left: `${p.x}%`, bottom: 0, fontSize: p.size, color: p.color, pointerEvents: "none" }}
          >
            {p.icon}
          </motion.div>
        ))}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <motion.span
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.97, 1.03, 0.97] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", color: "rgba(200,155,60,0.4)" }}
          >
            MERCADO DE VALDRIS
          </motion.span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <AnimatePresence mode="wait">
          {section === "selos" && (
            <motion.div
              key="selos"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-3"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-violet/60">Comprar com Ouro</p>
              {SELO_BUNDLES.filter((b) => b.ouro > 0).map((b) => (
                <ShopItem
                  key={b.id}
                  icon={b.icon}
                  label={b.label}
                  price={`${b.ouro.toLocaleString("pt-BR")} ouro`}
                  priceColor="rgb(200,155,60)"
                  canAfford={save.wallet.ouro >= b.ouro}
                  onBuy={() => buySeloBundle(b)}
                />
              ))}
              <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Comprar com Cristais Astra</p>
              {SELO_BUNDLES.filter((b) => b.cristais > 0).map((b) => (
                <ShopItem
                  key={b.id}
                  icon={b.icon}
                  label={b.label}
                  price={`${b.cristais} cristais`}
                  priceColor="rgb(170,130,255)"
                  canAfford={save.wallet.cristaisAstra >= b.cristais}
                  onBuy={() => buySeloBundle(b)}
                />
              ))}
            </motion.div>
          )}

          {section === "itens" && (
            <motion.div
              key="itens"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-3"
            >
              {ITEM_BUNDLES.map((b) => (
                <ShopItem
                  key={b.id}
                  icon={b.icon}
                  label={b.label}
                  price={`${b.ouro.toLocaleString("pt-BR")} ouro`}
                  priceColor="rgb(200,155,60)"
                  canAfford={save.wallet.ouro >= b.ouro}
                  onBuy={() => buyItemBundle(b)}
                />
              ))}
            </motion.div>
          )}

          {section === "premium" && (
            <motion.div
              key="premium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="flex flex-col gap-3"
            >
              <p className="mb-1 text-[11px] text-violet/60">
                Cristais Astra são a moeda premium do jogo. Use para invocar heróis lendários.
              </p>
              {PREMIUM_BUNDLES.map((b) => (
                <motion.button
                  key={b.id}
                  onClick={() => showFeedback("Pagamentos em breve — integração Stripe em desenvolvimento")}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                  className="flex w-full items-center justify-between rounded-xl border border-violet/15 px-4 py-4 text-left"
                  style={{ background: "rgba(170,130,255,0.05)" }}
                >
                  <div>
                    <p className="text-[12px] font-bold text-cream/85">{b.label}</p>
                    <p className="text-[11px] text-violet/50">{b.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="rounded-lg border border-violet/30 bg-violet/10 px-3 py-2 text-[10px] font-bold text-violet/70">
                      {b.usd}
                    </div>
                    <span className="text-[9px] text-violet/30">Em breve</span>
                  </div>
                </motion.button>
              ))}
              <p className="mt-2 text-center text-[11px] text-violet/30">
                Pagamentos via Stripe em desenvolvimento
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ShopItem({ icon, label, price, priceColor, canAfford, onBuy }: {
  icon: string; label: string; price: string; priceColor: string; canAfford: boolean; onBuy: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-violet/12 px-4 py-3.5"
      style={{ background: "rgba(122,111,160,0.04)" }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="text-[11px] font-bold text-cream/80">{label}</span>
      </div>
      <motion.button
        onClick={canAfford ? onBuy : undefined}
        whileTap={canAfford ? { scale: 0.94 } : undefined}
        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
        className="rounded-lg border px-3 py-1.5 text-[11px] font-bold"
        style={{
          borderColor: canAfford ? `${priceColor}40` : "rgba(122,111,160,0.1)",
          background:  canAfford ? `${priceColor}10` : "transparent",
          color:       canAfford ? priceColor : "rgba(122,111,160,0.3)",
          cursor:      canAfford ? "pointer" : "default",
        }}
      >
        {price}
      </motion.button>
    </div>
  );
}
