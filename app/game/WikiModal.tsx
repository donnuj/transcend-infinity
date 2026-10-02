"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, BookOpen, Star, Sword, Coins, Calendar, ArrowRight,
  CheckCircle, Warning, Info,
  Lightning, Crown,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

const ease = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 400, damping: 28 } as const;

type SectionId =
  | "inicio"
  | "economia"
  | "herois"
  | "batalha"
  | "profissao"
  | "diario"
  | "avancado";

const SECTIONS: { id: SectionId; label: string; icon: PhosphorIcon }[] = [
  { id: "inicio",    label: "Primeiros Passos", icon: Star       },
  { id: "economia",  label: "Economia",          icon: Coins      },
  { id: "herois",    label: "Heróis",            icon: Crown      },
  { id: "batalha",   label: "Batalha",           icon: Sword      },
  { id: "profissao", label: "Profissão",         icon: BookOpen   },
  { id: "diario",    label: "Checklist Diária",  icon: Calendar   },
  { id: "avancado",  label: "Sistemas Avançados",icon: Lightning  },
];

export default function WikiModal({ onClose }: { onClose: () => void }) {
  const [section, setSection] = useState<SectionId>("inicio");

  return (
    <>
      <motion.div
        className="absolute inset-0 z-30 bg-void/85"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-40 flex max-h-[92%] flex-col"
        style={{
          background: "linear-gradient(180deg, rgba(10,9,22,0.99) 0%, rgba(6,7,15,1) 100%)",
          borderTop: "1px solid rgba(200,155,60,0.18)",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.7), 0 -1px 0 rgba(200,155,60,0.08)",
        }}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ duration: 0.36, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(200,155,60,0.12)", border: "1px solid rgba(200,155,60,0.25)" }}
            >
              <BookOpen weight="light" size={18} color="rgb(200,155,60)" />
            </div>
            <div>
              <h2
                className="text-[14px] font-black tracking-[0.12em] text-cream"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                GUIA DO NOVATO
              </h2>
              <p className="text-[10px] text-violet/70 tracking-[0.15em]">TRANSCEND INFINITY</p>
            </div>
          </div>
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
            transition={spring}
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{ background: "rgba(122,111,160,0.08)", border: "1px solid rgba(122,111,160,0.14)" }}
          >
            <X weight="light" size={16} color="rgba(122,111,160,0.7)" />
          </motion.button>
        </div>

        {/* Nav pills */}
        <div className="flex flex-shrink-0 gap-2 overflow-x-auto px-4 pb-3 scrollbar-none">
          {SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <motion.button
                key={id}
                onClick={() => setSection(id)}
                whileTap={{ scale: 0.93 }}
                transition={spring}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{
                  background: active ? "rgba(200,155,60,0.12)" : "transparent",
                  border: `1px solid ${active ? "rgba(200,155,60,0.35)" : "rgba(122,111,160,0.16)"}`,
                  color: active ? "rgb(200,155,60)" : "rgba(180,170,210,0.75)",
                  transition: "all 180ms ease",
                }}
              >
                <Icon weight="light" size={11} color={active ? "rgb(200,155,60)" : "rgba(180,170,210,0.75)"} />
                <span className="text-[11px] font-bold tracking-[0.1em]">{label.toUpperCase()}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-5 flex-shrink-0 border-t" style={{ borderColor: "rgba(122,111,160,0.08)" }} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease }}
            >
              {section === "inicio" && <SectionInicio />}
              {section === "economia" && <SectionEconomia />}
              {section === "herois" && <SectionHerois />}
              {section === "batalha" && <SectionBatalha />}
              {section === "profissao" && <SectionProfissao />}
              {section === "diario" && <SectionDiario />}
              {section === "avancado" && <SectionAvancado />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

// ── Seção: Primeiros Passos ────────────────────────────────────────────────────

function SectionInicio() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader
        icon={Star}
        title="Primeiros Passos"
        subtitle="O que fazer nos seus primeiros dias de jogo"
      />

      <InfoBox type="tip">
        Você começa com <b>500 ouro</b> e <b>10 Selos de Invocação</b>. Use-os com sabedoria!
      </InfoBox>

      <WikiH2>Dia 1 — Roteiro Essencial</WikiH2>

      <StepList steps={[
        {
          n: "1",
          title: "Use o Banner do Novato",
          desc: "Vá em Invocar → Banner do Novato. Gastar todos os 10 selos aqui garante um herói Épico ou superior no 10º pull. É a melhor forma de começar.",
          color: "rgb(200,155,60)",
        },
        {
          n: "2",
          title: "Resgate o Login Diário",
          desc: "Aba Mundo → Login Diário. Dia 1 dá 100 ouro. Faça isso todo dia — ao completar 7 dias seguidos você ganha 1 Selo Livre.",
          color: "rgb(90,160,255)",
        },
        {
          n: "3",
          title: "Complete desafios diários",
          desc: "Mundo → Missões Diárias → Ver todas. Fazer login + completar 1 masmorra já te dão 400 ouro + 80 cristais no primeiro dia.",
          color: "rgb(100,210,130)",
        },
        {
          n: "4",
          title: "Faça sua primeira Masmorra",
          desc: "Mundo → Masmorra → Ruínas Antigas (Nível 1). Use o herói recém-invocado. Ganhe ouro e XP de jogador.",
          color: "rgb(255,100,80)",
        },
        {
          n: "5",
          title: "Escolha sua Profissão",
          desc: "Perfil → Profissão. Para iniciantes, escolha Erudito (+25% XP em tudo) ou Caçador (+15% drops de Boss). Leia a seção Profissão deste guia.",
          color: "rgb(180,110,255)",
        },
      ]} />

      <WikiH2>O que NÃO fazer no início</WikiH2>
      <div className="flex flex-col gap-2">
        <InfoBox type="warn">
          <b>Não gaste Cristais Astra em ouro.</b> Cristais são para comprar Selos (160 por selo). Espere acumular 160+ antes de usar.
        </InfoBox>
        <InfoBox type="warn">
          <b>Não tente forjar equipamentos</b> antes de ter um herói consolidado (Rank B, 3+ estrelas). A Forja consome muito ouro.
        </InfoBox>
        <InfoBox type="warn">
          <b>Não invista em múltiplos heróis ao mesmo tempo.</b> Foque em 1 DPS + 1 Tank/Healer primeiro.
        </InfoBox>
      </div>

      <WikiH2>Metas da Primeira Semana</WikiH2>
      <GoalList goals={[
        "Obter pelo menos 2 heróis (1 do Banner Novato, 1 das pulls diárias)",
        "Completar Ruínas Antigas com Rank B",
        "Chegar ao nível 5 de jogador",
        "Atingir login streak de 7 dias → ganhar 1 Selo Livre",
        "Acumular 500+ ouro para primeiros upgrades de hero",
      ]} />
    </div>
  );
}

// ── Seção: Economia ────────────────────────────────────────────────────────────

function SectionEconomia() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader icon={Coins} title="Economia" subtitle="Entenda as 4 moedas do jogo" />

      <div className="flex flex-col gap-2.5">
        <CurrencyCard
          symbol="◆" name="Ouro" color="rgb(200,155,60)"
          desc="Moeda principal. Usada em skills, forja, mercado e ascensão."
          sources={["Dungeons (principal fonte)", "Arena: 200 por vitória, 50 por derrota", "Renda Offline (fique 8h offline)", "Battle Pass gratuito: 2.700 total", "Desafio diário: 100–300 por dia"]}
          priority="Alta"
        />
        <CurrencyCard
          symbol="◈" name="Cristais Astra" color="rgb(170,130,255)"
          desc="Moeda premium obtida no jogo. 160 cristais = 1 Selo de Invocação."
          sources={["Desafios diários: 50–150 por dia", "Torre Infinita (acima do andar 25)", "Boss Hunt: 150–350 por boss", "Battle Pass gratuito: 900 total"]}
          priority="Guardar"
        />
        <CurrencyCard
          symbol="✦" name="Selos de Invocação" color="rgb(90,160,255)"
          desc="Usado no gacha. 1 pull = 1 Selo. Selos Livres são gastos primeiro."
          sources={["Início: 10 selos", "Battle Pass gratuito: 6 selos", "Arena Campeão (3 vitórias): 1 Selo", "Torre andar 10+: 1 a cada 10 andares"]}
          priority="Gastar em banners"
        />
        <CurrencyCard
          symbol="★" name="Selos Livres" color="rgb(100,220,140)"
          desc="Igual ao Selo, mas sem custo de Cristais. Funciona em qualquer banner."
          sources={["Login streak a cada 7 dias: +1", "Battle Pass gratuito nível 20: 1", "Battle Pass gratuito nível 40: 2"]}
          priority="Usar primeiro"
        />
      </div>

      <WikiH2>Conversão de Moedas</WikiH2>
      <WikiTable
        headers={["Você tem", "Equivale a"]}
        rows={[
          ["160 Cristais Astra", "1 Selo de Invocação"],
          ["1.600 Cristais", "10 Selos (banner completo)"],
          ["7 dias de login", "1 Selo Livre"],
          ["10 dias de desafios", "~800 Cristais acumulados"],
        ]}
      />

      <InfoBox type="tip">
        <b>Meta de Cristais:</b> acumule 1.600 (160×10) antes de gastar. O bônus do pull ×10 garante pelo menos 1 herói Raro+ e é mais eficiente.
      </InfoBox>
    </div>
  );
}

// ── Seção: Heróis ──────────────────────────────────────────────────────────────

function SectionHerois() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader icon={Crown} title="Heróis" subtitle="Como evoluir seus personagens" />

      <InfoBox type="info">
        Cada herói tem <b>4 sistemas de evolução independentes</b>: Nível, Rank, Estrelas e Awaken. Entender a ordem correta economiza muito ouro e fragmentos.
      </InfoBox>

      <WikiH2>Hierarquia de Raridade</WikiH2>
      <div className="flex flex-col gap-1.5">
        {[
          { rarity: "Divino", color: "rgb(255,255,200)", stars: 5, comment: "Praticamente inacessível" },
          { rarity: "Mítico", color: "rgb(255,80,80)",   stars: 5, comment: "Eventos especiais" },
          { rarity: "Lendário", color: "rgb(200,155,60)", stars: 5, comment: "Pity no pull 90" },
          { rarity: "Épico",    color: "rgb(180,110,255)", stars: 4, comment: "Rate up em banners" },
          { rarity: "Raro",     color: "rgb(90,150,255)",  stars: 3, comment: "Frequente no gacha" },
          { rarity: "Incomum",  color: "rgb(100,210,130)", stars: 2, comment: "Bom para XP de Invocador" },
          { rarity: "Comum",    color: "rgb(180,180,210)", stars: 1, comment: "Barato para evoluir" },
        ].map((r) => (
          <div
            key={r.rarity}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
            style={{ background: `${r.color}0a`, border: `1px solid ${r.color}25` }}
          >
            <span className="text-[10px] font-black w-20 flex-shrink-0" style={{ color: r.color }}>{r.rarity}</span>
            <span className="text-[11px] text-amber" style={{ color: "rgb(250,190,50)" }}>{"★".repeat(r.stars)}</span>
            <span className="text-[10px] text-violet/70 ml-auto text-right">{r.comment}</span>
          </div>
        ))}
      </div>

      <WikiH2>Ordem de Evolução Recomendada</WikiH2>
      <StepList steps={[
        {
          n: "①",
          title: "Nível (prioridade 1)",
          desc: "Use Cristais de Evolução (+500 XP cada). Custo: gratuito se farmar dungeons. XP necessário por nível: 100 + nível×50. Limite de nível (tier 0): 20.",
          color: "rgb(100,220,140)",
        },
        {
          n: "②",
          title: "Estrelas (prioridade 2)",
          desc: "Custo em fragmentos: 5→10→15→20. Total para 5★: 50 fragmentos. Bônus: ×1.00 → ×1.10 → ×1.22 → ×1.37 → ×1.55 em todos os stats.",
          color: "rgb(250,190,50)",
        },
        {
          n: "③",
          title: "Rank (prioridade 3)",
          desc: "Custo: 10→20→30→40→50→60 fragmentos. De F (×0.60) a SSS (×2.00). Cada rank up é um grande salto de poder.",
          color: "rgb(90,150,255)",
        },
        {
          n: "④",
          title: "Awaken / Despertar (prioridade 4)",
          desc: "Custo: 20→40→60→80→100 fragmentos. Total: 300 fragmentos para Awaken 5. Benefícios: Vel. Atq, Crítico, HP, Stats. Só quando tiver fragmentos sobrando.",
          color: "rgb(180,110,255)",
        },
        {
          n: "⑤",
          title: "Ascensão (desbloqueio de tier)",
          desc: "Requer: nível máximo do tier + 1 Pedra de Ascensão. Desbloqueia o próximo cap (Nv.20→30→40→50→60→70). Pedras são raras — priorize o herói principal.",
          color: "rgb(200,155,60)",
        },
      ]} />

      <WikiH2>Como ganhar Fragmentos</WikiH2>
      <InfoBox type="info">
        Fragmentos vêm de duas fontes: <b>duplicatas no gacha</b> (cada pull em herói já coletado +1 fragmento) e a <b>Forja de Fusão</b> na Fortaleza (sacrifique um herói para dar fragmentos a outro — Comum: 10 frags, Lendário: 400 frags).
      </InfoBox>

      <WikiH2>Vantagem Elementar</WikiH2>
      <WikiTable
        headers={["Atacante → Alvo", "Multiplicador"]}
        rows={[
          ["Fire → Wind", "×1.5 (vantagem)"],
          ["Wind → Earth", "×1.5 (vantagem)"],
          ["Earth → Water", "×1.5 (vantagem)"],
          ["Water → Fire", "×1.5 (vantagem)"],
          ["Elemento → Fraqueza", "×0.5 (desvantagem)"],
          ["Lightning, Light, Dark", "×1.0 (neutro)"],
        ]}
      />

      <WikiH2>Skills dos Heróis</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Cada herói tem 4 skills: Básica (CD 0), Ativa 1 (CD 3–5), Ativa 2 (CD 4–5) e Última (CD 8–9). Upgrade de skill custa <span style={{ color: "rgb(200,155,60)" }}>100 × nível atual</span> em ouro (máximo nível 5 = 400 ouro por upgrade).
      </p>
      <InfoBox type="tip">
        Priorize evoluir a <b>Última</b> do seu DPS principal primeiro — ela tem os maiores multiplicadores de dano (3.5× a 5.0×).
      </InfoBox>
    </div>
  );
}

// ── Seção: Batalha ─────────────────────────────────────────────────────────────

function SectionBatalha() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader icon={Sword} title="Batalha" subtitle="Masmorras, Arena, Torre e Boss Hunt" />

      <WikiH2>Dungeons (Masmorras)</WikiH2>
      <InfoBox type="info">
        8 masmorras no total. Desbloqueie cada uma conforme aumenta de nível. Cada dungeon tem ranqueamento D→SS baseado em performance — quanto melhor o rank, mais ouro.
      </InfoBox>
      <WikiTable
        headers={["Masmorra", "Nível rec.", "Andares"]}
        rows={[
          ["Ruínas Antigas", "1+", "5"],
          ["Caverna das Sombras", "5+", "8"],
          ["Mina de Cristais", "12+", "10"],
          ["Torre de Gelo", "15+", "15"],
          ["Templo Afundado", "18+", "12"],
          ["Necrópole do Esq.", "20+", "12"],
          ["Covil do Dragão", "30+", "20"],
          ["Torre do Infinito", "40+", "99"],
        ]}
      />
      <InfoBox type="tip">
        <b>Time de 3 heróis</b> é sempre melhor. Composição ideal para iniciantes: 1 DPS (Espadachim/Arqueiro/Mago) + 1 Tank (Guarda) + 1 Healer (Curandeiro).
      </InfoBox>

      <WikiH2>Arena PvP — Sistema de Defensor</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Você <b>escolhe um herói defensor</b> (seu representante na arena) e depois desafia oponentes gerados com rating similar. Limite: <b>10 lutas/dia</b>. Vitória: <span style={{ color: "rgb(100,220,140)" }}>+12–30 rating + 150+ ouro + 5 rep Imperial</span>. Derrota: <span style={{ color: "rgb(255,100,80)" }}>-8–20 rating + 30 ouro</span>. Configure seu herói defensor antes de lutar!
      </p>
      <WikiTable
        headers={["Liga", "Rating"]}
        rows={[
          ["Ferro", "0–999"],
          ["Bronze", "1.000–1.199"],
          ["Prata", "1.200–1.499"],
          ["Ouro", "1.500–1.799"],
          ["Platina", "1.800–2.099"],
          ["Diamante", "2.100–2.499"],
          ["Lendário", "2.500+"],
        ]}
      />

      <WikiH2>Torre Infinita</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Sobe andares até perder. Inimigos escalam com o andar. Recompensas crescem com cada andar. Reset semanal no ranking.
      </p>
      <WikiTable
        headers={["Marco", "Recompensa"]}
        rows={[
          ["Andar 10", "500 ouro + 1 Selo"],
          ["Andar 25", "1.000 ouro + 100 Cristais"],
          ["Andar 50", "5 Selos + 500 Cristais"],
          ["Andar 100", "1 Selo Livre + 2.000 Cristais"],
        ]}
      />
      <InfoBox type="tip">
        Chegue ao <b>andar 10 o mais rápido possível</b> para o Selo garantido. Depois o andar 25 para os 100 Cristais.
      </InfoBox>

      <WikiH2>Boss Hunt — Bosses por Nível</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        10 bosses desbloqueados conforme seu nível de jogador (lv10, 20, 30... 100). Recompensas e HP escalam com o boss. Cada vitória dá <b>+10–20 pontos de reputação Arcontes</b>.
      </p>
      <WikiTable
        headers={["Boss", "Req. Nível", "Recompensa"]}
        rows={[
          ["Wyrm do Caos", "10", "500 ouro + 10 cristais"],
          ["Titã de Pedra", "20", "1.200 ouro + 30 cristais"],
          ["Espectro", "30", "2.500 ouro + 60 cristais"],
          ["...", "40–90", "Escalando..."],
          ["Avatar do Vazio", "100", "40.000 ouro + 1.500 cristais + 5 selos"],
        ]}
      />
      <InfoBox type="warn">
        Use vantagem elemental! Wyrm do Caos (Fire) — use herói de Water. Titã de Pedra (Earth) — use Fire. Espectro das Sombras (Dark) — use Light.
      </InfoBox>
    </div>
  );
}

// ── Seção: Profissão ───────────────────────────────────────────────────────────

function SectionProfissao() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader icon={BookOpen} title="Profissão" subtitle="5 especializações — escolha com cuidado" />

      <InfoBox type="info">
        Você pode ter apenas <b>1 profissão ativa</b> por vez. A troca tem custo em ouro. Nível máximo: 10. XP por tarefa completada: ~80 XP.
      </InfoBox>

      <InfoBox type="tip">
        <b>Para iniciantes:</b> escolha <span style={{ color: "rgb(200,155,60)" }}>Erudito</span> para acelerar a progressão inicial, ou <span style={{ color: "rgb(255,100,80)" }}>Caçador</span> se quiser foco em Boss Hunt.
      </InfoBox>

      <div className="flex flex-col gap-3">
        <ProfCard
          icon="⚒" name="Ferreiro" color="rgb(160,100,40)"
          bonus="Forja 20% mais barata · Itens +5% bônus"
          playstyle="Ideal para jogadores que fazem muita Forja de equipamentos"
          milestone10="Forja -30%, bônus +15% — extremamente poderosa no end-game"
          forWho="Jogadores focados em evolução de equipamentos"
        />
        <ProfCard
          icon="🌿" name="Herbalista" color="rgb(80,180,80)"
          bonus="Poções com 2× efeito · +15% ervas"
          playstyle="Poções de cura mais eficientes em dungeons longas"
          milestone10="Todas as poções lendárias desbloqueadas"
          forWho="Jogadores que perdem muita HP em dungeons difíceis"
        />
        <ProfCard
          icon="⚖" name="Comerciante" color="rgb(200,155,60)"
          bonus="Compras -15% · Vendas +20%"
          playstyle="Mais ouro por transação no Mercado"
          milestone10="Preços -30%, venda +35%"
          forWho="Jogadores focados em acumular ouro rapidamente"
        />
        <ProfCard
          icon="🏹" name="Caçador" color="rgb(255,100,60)"
          bonus="+15% drop bosses · +20% dano em bosses"
          playstyle="Mais recompensas do Boss Hunt semanal"
          milestone10="+25% drop, boss lendário aparece"
          forWho="Jogadores focados em Boss Hunt e recompensas semanais"
        />
        <ProfCard
          icon="📖" name="Erudito" color="rgb(90,150,255)"
          bonus="+25% XP em tudo · Skills evoluem mais rápido"
          playstyle="Levela mais rápido em tudo — ideal para iniciantes"
          milestone10="+40% XP, todos NPCs desbloqueados"
          forWho="RECOMENDADO para novos jogadores"
          recommended
        />
      </div>

      <WikiH2>XP de Profissão — Quanto Falta?</WikiH2>
      <WikiTable
        headers={["Nível", "XP necessário total"]}
        rows={[
          ["1 → 2", "50 XP (~1 tarefa)"],
          ["1 → 5", "800 XP (~10 tarefas)"],
          ["1 → 10", "4.050 XP (~50 tarefas)"],
        ]}
      />
    </div>
  );
}

// ── Seção: Checklist Diária ───────────────────────────────────────────────────

function SectionDiario() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader icon={Calendar} title="Checklist Diária" subtitle="O que fazer todo dia para maximizar progresso" />

      <InfoBox type="tip">
        Completar essas atividades diárias garante ~600–900 ouro + 280–380 Cristais por dia, sem gastar nada.
      </InfoBox>

      <WikiH2>Atividades Diárias (em ordem de prioridade)</WikiH2>

      <div className="flex flex-col gap-2">
        {[
          { priority: "1", label: "Resgatar Login Diário", reward: "+100 ouro (+ itens variados)", color: "rgb(200,155,60)", time: "30 seg" },
          { priority: "2", label: "Completar 1 Masmorra", reward: "+300 ouro + desafio diário", color: "rgb(90,150,255)", time: "2 min" },
          { priority: "3", label: "3 batalhas na Arena", reward: "+650 ouro + 1 Selo (desafio Campeão)", color: "rgb(255,100,80)", time: "5 min" },
          { priority: "4", label: "Subir 5 andares na Torre", reward: "+80 Cristais (desafio)", color: "rgb(180,110,255)", time: "3 min" },
          { priority: "5", label: "1 Pull no Banner", reward: "+50 Cristais (desafio) — use Selos Livres primeiro", color: "rgb(200,155,60)", time: "1 min" },
          { priority: "6", label: "Tarefas de Profissão", reward: "+80 XP de profissão × tarefa concluída", color: "rgb(100,210,130)", time: "1 min" },
          { priority: "7", label: "Boss Hunt (semanal)", reward: "2.000–5.000 ouro + 150–350 cristais", color: "rgb(255,80,80)", time: "5 min" },
        ].map((item) => (
          <div
            key={item.priority}
            className="flex items-start gap-3 rounded-xl px-3 py-3"
            style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}
          >
            <div
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-black"
              style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}35` }}
            >
              {item.priority}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-cream/88">{item.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: `${item.color}90` }}>{item.reward}</p>
            </div>
            <span className="text-[10px] text-violet/62 flex-shrink-0">{item.time}</span>
          </div>
        ))}
      </div>

      <WikiH2>Renda Offline</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        O jogo calcula ouro e XP enquanto você está offline. Fórmula: <span style={{ color: "rgb(200,155,60)" }}>(nível × 12 + 20) × horas</span> em ouro. Máximo de <b>8 horas</b> por sessão. Abra o jogo diariamente para não perder a renda acumulada.
      </p>

      <WikiH2>Checklist Semanal</WikiH2>
      <div className="flex flex-col gap-1.5">
        {[
          "Derrotar todos os 3 Boss Hunts (reset na segunda)",
          "Chegar no andar mais alto possível da Torre (ranking semanal)",
          "Completar Battle Pass até o nível máximo gratuito",
          "3 missões de profissão (pelo menos)",
        ].map((g, i) => (
          <div key={i} className="flex items-start gap-2">
            <CheckCircle weight="light" size={14} color="rgba(100,210,130,0.7)" className="flex-shrink-0 mt-0.5" />
            <span className="text-[10px] text-violet/85">{g}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Seção: Avançado ────────────────────────────────────────────────────────────

function SectionAvancado() {
  return (
    <div className="flex flex-col gap-4">
      <WikiHeader icon={Lightning} title="Sistemas Avançados" subtitle="Forja, Fortaleza, Gacha e mais" />

      <WikiH2>Sistema Gacha — Pity</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        O jogo tem um sistema de <b>pity</b>: a partir do pull 75 a chance de Lendário aumenta. No pull <span style={{ color: "rgb(200,155,60)" }}>90</span> é garantido um herói Lendário/Mítico/Divino. O contador reseta ao obter qualquer herói dessa raridade.
      </p>
      <WikiTable
        headers={["Banner", "Pity garantido"]}
        rows={[
          ["Banner do Novato", "10 pulls (Épico+)"],
          ["Ascensão Celestial", "90 pulls (Lendário+)"],
          ["Chama Eterna", "90 pulls (Lendário+)"],
          ["Abismo Sombrio", "90 pulls (Lendário+)"],
        ]}
      />
      <InfoBox type="tip">
        <b>Sempre complete o Banner do Novato primeiro</b> — garante um Épico no pull 10. Depois acumule pulls para o banner limitado atual.
      </InfoBox>

      <WikiH2>Forja de Equipamentos (+1 a +10)</WikiH2>
      <WikiTable
        headers={["Nível", "Custo", "Bônus"]}
        rows={[
          ["+1", "200 ouro", "ATQ +3%"],
          ["+3", "800 ouro", "DEF +5%"],
          ["+5", "2.500 ouro", "HP +8%"],
          ["+7", "6.000 ouro", "VEL +5%"],
          ["+10", "18.000 ouro", "TODOS +10%"],
        ]}
      />
      <p className="text-[11px] text-violet/70">Custo total para +10: 55.400 ouro. Forje apenas o equipamento do herói principal.</p>

      <WikiH2>Battle Pass Gratuito</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        40 níveis, 1.000 XP por nível. O track gratuito dá <b>2.700 ouro + 900 Cristais + 6 Selos + 3 Selos Livres</b> no total. Priorize chegar ao nível 20 (1 Selo Livre) e nível 40 (2 Selos Livres).
      </p>

      <WikiH2>Fortaleza — Construção com Tempo Real</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Upgrades levam tempo real: <b>30min (Nv.1) → 1h → 2h → 4h → 8h (Nv.5)</b>. Apenas uma construção ativa por vez. <b>Aloque heróis</b> nos prédios para bônus: Ferreiro na Oficina = produção bônus, Curandeiro no Hospital = bônus de cura. Use a <b>Forja de Fusão</b> (botão roxo) para sacrificar heróis fracos e transferir fragmentos ao principal.
      </p>

      <WikiH2>Caravanas — Rota Comercial</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Envie um grupo de heróis em uma rota comercial (duração: 4h a 48h). Mais heróis = maior chance de sucesso. Cada rota tem multiplicador de retorno diferente. Sucesso = lucro total; falha = 30% de retorno. Cada caravana bem-sucedida dá <b>+10 rep Mercadores</b>.
      </p>

      <WikiH2>Mapa do Mundo — Exploração</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Envie um herói para explorar uma região desconhecida (duração: 2h a 24h, conforme nível da região). Risco de ferimento: quanto maior a diferença de nível entre herói e região, maior a chance. Herói ferido fica indisponível por algumas horas. Recompensa: região descoberta + ouro.
      </p>

      <WikiH2>Guilda — Como Fundar</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        Requisitos para fundar: <b>nível 10+, 5.000 ouro, 500+ pontos de influência</b> em qualquer facção. Ao fundar, escolha o nome e a afiliação da guilda. Cada facção tem efeitos territoriais diferentes na Guilda.
      </p>

      <WikiH2>Facções — Como Ganhar Reputação</WikiH2>
      <WikiTable
        headers={["Facção", "Fonte Principal"]}
        rows={[
          ["Ordem Imperial", "Arena (vitórias +5) · Dungeons (+3 cada)"],
          ["Ordem dos Arcontes", "Boss Hunt (+10–20 por boss derrotado)"],
          ["Liga dos Mercadores", "Caravana bem-sucedida (+10)"],
          ["Círculo dos Druidas", "Exploração do Mapa · NPCs"],
        ]}
      />

      <WikiH2>Companheiros</WikiH2>
      <p className="text-[10px] leading-relaxed text-violet/82">
        5 companheiros com bônus passivos. <span style={{ color: "rgb(200,155,60)" }}>Stella ⭐</span> (Lendário) dá +35% drops de Cristais no nível máximo. <span style={{ color: "rgb(200,155,60)" }}>Ash 🦅</span> (Épico) dá +35% ouro em combate. Ambos são excelentes para progressão.
      </p>

      <WikiH2>Rota de Progressão a Longo Prazo</WikiH2>
      <StepList steps={[
        { n: "A", title: "Early Game (Lv.1–10)", desc: "Banner Novato → Erudito (profissão) → Masmorras 1–3 → Arena Bronze → Torre andar 25.", color: "rgb(100,220,140)" },
        { n: "B", title: "Mid Game (Lv.10–25)", desc: "1 herói Lendário com Rank A+ → Masmorra 4–6 → Torre andar 50 → Battle Pass completo.", color: "rgb(90,150,255)" },
        { n: "C", title: "Late Game (Lv.25+)", desc: "Herói principal +7 na Forja → Torre andar 100 → Arena Ouro+ → Boss Hunt todas as semanas.", color: "rgb(200,155,60)" },
        { n: "D", title: "End Game (Lv.40+)", desc: "Masmorra 7–8 → Torre andar 100+ → Arena Platina → Fortaleza nível alto → Ascensão completa.", color: "rgb(180,110,255)" },
      ]} />
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function WikiHeader({ icon: Icon, title, subtitle }: { icon: PhosphorIcon; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 pb-1">
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(200,155,60,0.1)", border: "1px solid rgba(200,155,60,0.2)" }}
      >
        <Icon weight="light" size={20} color="rgb(200,155,60)" />
      </div>
      <div>
        <h3
          className="text-[15px] font-black tracking-[0.08em] text-cream"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          {title.toUpperCase()}
        </h3>
        <p className="text-[11px] text-violet/70 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function WikiH2({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[8.5px] font-black uppercase tracking-[0.2em] text-violet/68">{children}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(122,111,160,0.15) 0%, transparent)" }} />
    </div>
  );
}

type InfoType = "tip" | "warn" | "info";
function InfoBox({ type, children }: { type: InfoType; children: React.ReactNode }) {
  const styles = {
    tip:  { bg: "rgba(100,220,130,0.06)", border: "rgba(100,220,130,0.2)",  Icon: CheckCircle, color: "rgb(100,220,130)" },
    warn: { bg: "rgba(255,160,40,0.06)",  border: "rgba(255,160,40,0.22)",  Icon: Warning,     color: "rgb(255,160,40)" },
    info: { bg: "rgba(90,150,255,0.06)",  border: "rgba(90,150,255,0.2)",   Icon: Info,        color: "rgb(90,150,255)" },
  }[type];
  return (
    <div
      className="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
      style={{ background: styles.bg, border: `1px solid ${styles.border}` }}
    >
      <styles.Icon weight="light" size={14} color={styles.color} className="flex-shrink-0 mt-0.5" />
      <p className="text-[10px] leading-relaxed" style={{ color: "rgba(232,217,160,0.92)" }}>{children}</p>
    </div>
  );
}

function StepList({ steps }: { steps: { n: string; title: string; desc: string; color: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((s) => (
        <div key={s.n} className="flex items-start gap-3">
          <div
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-black"
            style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}
          >
            {s.n}
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-cream/88">{s.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-violet/75">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalList({ goals }: { goals: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {goals.map((g, i) => (
        <div key={i} className="flex items-start gap-2">
          <ArrowRight weight="light" size={12} color="rgb(200,155,60)" className="flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-violet/85">{g}</span>
        </div>
      ))}
    </div>
  );
}

function WikiTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(122,111,160,0.12)" }}>
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${headers.length}, 1fr)` }}
      >
        {headers.map((h) => (
          <div key={h} className="px-3 py-2" style={{ background: "rgba(122,111,160,0.08)" }}>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-violet/75">{h}</span>
          </div>
        ))}
        {rows.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="px-3 py-2.5"
              style={{
                background: i % 2 === 0 ? "rgba(122,111,160,0.03)" : "transparent",
                borderTop: "1px solid rgba(122,111,160,0.07)",
              }}
            >
              <span className="text-[11px]" style={{ color: j === 0 ? "rgba(232,217,160,0.92)" : "rgba(200,155,60,0.85)" }}>{cell}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CurrencyCard({ symbol, name, color, desc, sources, priority }: {
  symbol: string; name: string; color: string; desc: string; sources: string[]; priority: string;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px]" style={{ color }}>{symbol}</span>
          <span className="text-[12px] font-black text-cream/90" style={{ fontFamily: "var(--font-cinzel)" }}>{name}</span>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[7px] font-bold tracking-wider"
          style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
        >
          {priority.toUpperCase()}
        </span>
      </div>
      <p className="mb-2 text-[11px] leading-relaxed text-violet/82">{desc}</p>
      <div className="flex flex-col gap-1">
        {sources.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: color, opacity: 0.6 }} />
            <span className="text-[8.5px] text-violet/70">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfCard({ icon, name, color, bonus, playstyle, milestone10, forWho, recommended }: {
  icon: string; name: string; color: string; bonus: string; playstyle: string;
  milestone10: string; forWho: string; recommended?: boolean;
}) {
  return (
    <div
      className="rounded-xl px-4 py-3.5"
      style={{
        background: `${color}0a`,
        border: `1px solid ${recommended ? color + "45" : color + "20"}`,
        boxShadow: recommended ? `0 0 20px ${color}10` : "none",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">{icon}</span>
          <span className="text-[12px] font-black text-cream/90" style={{ fontFamily: "var(--font-cinzel)", color }}>{name}</span>
        </div>
        {recommended && (
          <span
            className="rounded-full px-2 py-0.5 text-[7px] font-black tracking-wider"
            style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
          >
            RECOMENDADO
          </span>
        )}
      </div>
      <p className="text-[11px] font-bold mb-1" style={{ color: `${color}cc` }}>{bonus}</p>
      <p className="text-[8.5px] leading-relaxed text-violet/75 mb-1">{playstyle}</p>
      <p className="text-[10px] text-violet/62">Nível 10: {milestone10}</p>
      <p className="mt-1.5 text-[10px] font-bold" style={{ color: `${color}90` }}>→ {forWho}</p>
    </div>
  );
}
