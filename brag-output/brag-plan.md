# Brag Plan: Transcend Infinity

## What is this app?

Transcend Infinity é um RPG gacha completo rodando no browser — 200 heróis colecionáveis, sistema de pity, combat engine, Arena ranqueada, 21+ sistemas de jogo, cloud save, e Google OAuth — sem instalar nada.

## The angle

Um jogo que parece mobile, tem a profundidade de um live-service, e roda em uma aba do Chrome. O hook não é "olha o que eu fiz" — é "espera, isso é um jogo de verdade rodando no browser?"

## Hook (primeiros 2-3 segundos)

Tela void preta. Textos entram em Cinzel dourado com timing dramático:

> "Um RPG gacha."  
> *(beat)*  
> "No browser."

O contraste entre "RPG gacha" (implicação: mobile, instalação) e "No browser" é o gancho.

## Key moments (o meio)

- **A invocação:** Simulação da tela InvocarTab — 10 cartas revelando uma a uma, com glow de raridade crescendo. A carta final pulsa dourado intenso: **Lendário**. Beat-synced a cada reveal.
- **Os cards:** Grade de hero cards art deco entrando em stagger — fundo void, borda âmbar, retrato com fade gradiente, estrelas de raridade. Texto: **"200 heróis. 7 raridades."**
- **A escala:** Flash rápido de ícones dos sistemas — Arena, Dungeon, Boss Hunt, Alquimia, Torre, Battle Pass, Housing — terminando com o texto: **"21 sistemas."**

## Outro / punchline

Logo TRANSCEND INFINITY em Cinzel dourado, full-screen, com um glow sutil. Tagline:

> "Transcend os limites do browser."

## User flow worth showing

1. **Entry:** tela de login → spinner âmbar → game abre na WorldTab.
2. **Key action:** InvocarTab → pull 10x → 10 cards revelam um a um com glow de raridade, o último pulsa Lendário dourado.
3. **Result:** CartasTab mostra a coleção — hero cards art deco em grade, cada um com portrait, borda colorida por raridade, ícone de classe RPG.

## Tone

- **Preset:** `cinematic`
- **Creative direction:** "Epic game trailer energy — mas é uma aba do Chrome."
- **Interpretation:** Ritmo dramático com revelações em peso. Texto ALL CAPS ou Cinzel heavy. Cada cena faz uma afirmação. Nada de cor lavada ou filler abstrato — cada frame mostra o jogo de verdade.

## Format: landscape — 1920×1080
## Duration: 20 segundos

## Visual identity (do projeto)

- Background: `rgb(6, 7, 15)` — void
- Accent: `rgb(200, 155, 60)` — âmbar dourado
- Text primary: `rgb(232, 217, 160)` — creme
- Text secondary: `rgb(122, 111, 160)` — violeta
- Display font: Cinzel (serif pesado, majestoso)
- Body font: Inter
- Rarity Lendário: `rgb(255, 160, 40)` — laranja dourado com glow `rgba(255,160,40,0.5)`
- Strongest visual element: Hero card Doppelrand — double-bezel com inner core `rgb(10,10,22)`, borda âmbar, art deco corners, retrato com maskImage fade de 65%

## Share copy (draft)

"200 heróis. Arena ranqueada. Boss raids. Tudo no browser. Transcend Infinity — o gacha completo que você joga sem instalar nada."

## Audio direction

- **Role:** Orquestral épico progressivo — cama cinematográfica com batida que sobe de tensão.
- **Music:** `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` — 109.96 BPM. É upbeat mas tem strong beats bem distribuídos; no contexto visual escuro e épico vai funcionar como bed energético.
- **Music treatment:** Fade-in suave nos primeiros 0.5s, volume constante durante o meio, swell leve antes do outro. Não cortar abruptamente.
- **Music cue guidance (vol-12):**
  - Strong beats disponíveis: 8.74s, 13.11s, 17.47s, 18.56s, 22.93s, 24.56s
  - Targets: ~8.74s → primeiro card reveal do pull; ~13.11s → card Lendário pulsa; ~17.47s → hero grid aparece; ~22.93s → logo slam no outro
  - Sequential card reveals (10 cards em ~5s): usar beat-grid ~0.56s cada (beats consecutivos do vol-12 são espaçados ~0.55s) — revelar rapidamente mas manter cada card visível pelo menos 0.8s antes do próximo
- **Audio-reactive treatment:** Sutil. Usar RMS/bass da música para fazer o glow dos hero cards respirar levemente. No glow do Lendário, reatividade mais expressiva. Sem waveform ou equalizer visuals.
- **SFX posture:** Moderado, motion-matched. Sons escolhidos pelo Hyperframes.
- **Audio-coupled moments:**
  - Cada card reveal no pull → click/card SFX leve
  - Flash do Lendário → impact hit seco
  - Logo slam no outro → impact bell ou bong seco
- **Restraint rule:** Sem SFX em cada letra ou elemento secundário. Reservar sons para os 3 momentos acima.

---

## Storyboard

### Scene 1 — Hook — 3s

**Tela:** Fundo void `rgb(6,7,15)`. Silêncio visual puro.  
Texto 1 entra em Cinzel, médio, creme: **"Um RPG gacha."** — slam in rápido (~0.35s), hold 1s.  
Texto 2 entra abaixo, maior, âmbar: **"No browser."** — slam in rápido, hold 1.2s.  

Sequential/interaction: sim — dois textos entram sequencialmente com pausa dramática entre eles.  
Audio intent: música entra fade-in suave; zero SFX para manter o impacto do silêncio.  
Audio-coupled idea: nenhum — a surpresa é no silêncio.  
Music: bed começa baixo, sobe levemente no "No browser."  
Transition mood: hard cut → Scene 2

---

### Scene 2 — A Invocação — 6s

**Tela:** Simulação da InvocarTab — fundo void, banner destacado no topo, grade de slots de carta.  
10 cartas viram uma a uma em ~0.55s cada (beat-sync com vol-12):  
- Cartas 1–8: glow de raridade variada (Comum/Raro/Épico) — bordas coloridas acendem brevemente.  
- Carta 9: Épico — glow violeta mais intenso, pausa 0.3s extra.  
- Carta 10: **Lendário** — glow dourado explode, borda âmbar pulsa, herói aparece com retrato, texto "**LENDÁRIO**" em Cinzel âmbar aparece com fade-in.  
Hold de 1.2s na carta Lendário antes de cortar.

Sequential/interaction: sim — 10 card flips sequenciais beat-synced, simulação de tap/reveal.  
Audio intent: tensão crescente; o build das cartas culmina no hit do Lendário.  
Audio-coupled idea: card flip SFX leve em cada reveal (casino/card-slide ou card-place); impact hit seco no Lendário (~13.11s beat).  
Music: energético, batida aparente.  
Transition mood: dramatic wipe → Scene 3

---

### Scene 3 — Hero Collection — 4s

**Tela:** CartasTab — grade de hero cards art deco entrando em stagger (delay 0.055s cada).  
Cards têm: fundo `rgb(10,10,22)`, borda colorida por raridade com glow, retrato com fade gradiente, ícone de classe RPG Awesome, nome em Cinzel, estrelas de raridade.  
Texto overlay entra depois dos cards: **"200 heróis. 7 raridades."** em Cinzel médio, creme.  
Hold total 3s com cards visíveis e texto legível.

Sequential/interaction: sim — cards entram em stagger grid com delay 0.055s.  
Audio intent: afirmação de escala — o volume da coleção.  
Audio-coupled idea: glow suave dos cards respira levemente com RMS da música (~17.47s beat target para entrada do grid).  
Music: beat forte em ~17.47s marca a entrada da grade.  
Transition mood: crossfade → Scene 4

---

### Scene 4 — Scale — 3s

**Tela:** Flash rápido de ícones RPG Awesome + labels dos sistemas em lista — cada um entra em 0.3s:  
`⚔ Arena` · `🏰 Dungeon` · `👹 Boss Hunt` · `⚗ Alquimia` · `🗼 Torre` · `📜 Battle Pass` · `🏠 Housing`  
Depois dos ícones, texto grande central entra: **"21 sistemas."**  
Hold 1.5s.

Sequential/interaction: sim — 7 ícones+labels entram sequencialmente (stagger 0.3s cada), seguido do count "21 sistemas." centralizando.  
Audio intent: demonstração de profundidade — isso não é um jogo raso.  
Audio-coupled idea: click SFX leve em cada ícone que entra; impact bell no "21 sistemas." (~22.37s beat).  
Music: forte, ~22.37s strong beat.  
Transition mood: dramatic wipe → Scene 5

---

### Scene 5 — Outro — 4s

**Tela:** Fundo void. Logo **TRANSCEND INFINITY** em Cinzel ALL CAPS, full-width, âmbar dourado, entra com scale 0.92→1.0 + fade-in (0.4s).  
Glow suave pulsa na fonte.  
Tagline entra abaixo em Cinzel menor, creme: **"Transcend os limites do browser."** — fade-in 0.3s, hold.  
URL pequena no bottom: `transcend-infinity.pages.dev` em violeta discreto.  
Hold total 3.5s.

Sequential/interaction: sim — logo slam, depois tagline, depois URL.  
Audio intent: chegada majestosa; o jogo foi apresentado.  
Audio-coupled idea: impact bong/bell suave no logo slam (~22.93s strong beat); glow do logo respira levemente com RMS.  
Music: strong beat em ~22.93s; música continua mas fade-out começa em ~23s.  
Transition mood: fade to black

---

**Music mood for this video:** Cinematic upbeat progressivo — bed que sobe de tensão até o Lendário e mantém energia até o logo slam.  
**Audio summary:** Fade-in sutil no hook → tensão crescente nos card reveals → hit no Lendário → breath nos hero cards → ritmo nos sistemas → slam + fade no logo.

---

## Scene timing check

| Scene | Duration |
|-------|----------|
| 1 — Hook | 3s |
| 2 — Invocação | 6s |
| 3 — Hero Collection | 4s |
| 4 — Scale | 3s |
| 5 — Outro | 4s |
| **Total** | **20s** ✓ |
