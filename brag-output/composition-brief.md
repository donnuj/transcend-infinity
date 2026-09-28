# Hyperframes Composition Brief: Transcend Infinity

## Objective

Criar um vídeo de lançamento épico para Transcend Infinity — um RPG gacha completo rodando no browser.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920×1080
- Duration: 20 seconds

## Source Material

- Project root: `D:/Projetos/transcend-infinity`
- Primary files read: `app/game/InvocarTab.tsx`, `app/game/CartasTab.tsx`, `app/game/ArenaModal.tsx`, `app/globals.css`
- Product name: **Transcend Infinity**
- Tagline: **"Transcend os limites do browser."**
- Key UI moments to recreate:
  1. InvocarTab — tela de invocação gacha com 10 cartas revelando, a última sendo Lendária
  2. CartasTab — grade de hero cards art deco com bordas coloridas por raridade
  3. Sistemas do jogo como ícones em grid rápido
- Copy que deve aparecer verbatim:
  - "Um RPG gacha."
  - "No browser."
  - "200 heróis. 7 raridades."
  - "21 sistemas."
  - "TRANSCEND INFINITY"
  - "Transcend os limites do browser."
  - "transcend-infinity.pages.dev"

## Creative Direction

- **Tone preset:** `cinematic`
- **Creative direction:** "Epic game trailer energy — mas é uma aba do Chrome."
- **Interpretation:** Ritmo dramático com revelações em peso. Texto ALL CAPS ou Cinzel heavy. Cada cena faz uma afirmação. Paleta escura void + ouro âmbar. Nada de filler abstrato — cada frame mostra o jogo de verdade.
- **Angle:** O contraste entre "RPG gacha" (expectativa: mobile, instalação) e "No browser" é a premissa de todo o vídeo.
- **Hook:** Tela void preta. "Um RPG gacha." entra em Cinzel. Beat de tensão. "No browser." entra em âmbar maior. Hard cut.
- **Outro:** Logo TRANSCEND INFINITY full-screen em Cinzel dourado com glow sutil. Tagline. URL discreta.
- **Avoid:**
  - Linguagem genérica de SaaS ("streamline your workflow", "boost productivity")
  - Filler visual abstrato (padrões, gradientes sem conteúdo)
  - Redesign visual não condizente com a paleta void/âmbar do projeto

## Visual Identity

- **Background:** `rgb(6, 7, 15)` — void escuro
- **Card surface:** `rgb(10, 10, 22)` — inner core dos cards
- **Accent/brand:** `rgb(200, 155, 60)` — âmbar dourado
- **Text primary:** `rgb(232, 217, 160)` — creme
- **Text secondary:** `rgb(122, 111, 160)` — violeta
- **Rarity Lendário:** `rgb(255, 160, 40)` com glow `rgba(255,160,40,0.5)`
- **Rarity Épico:** `rgb(160, 80, 220)` com glow `rgba(160,80,220,0.3)`
- **Rarity Raro:** `rgb(60, 120, 220)` com glow `rgba(60,120,220,0.25)`
- **Display font:** Cinzel (Google Fonts, serif majestoso — usar via CDN ou fallback `Georgia, serif`)
- **Body font:** Inter (sans-serif)
- **Visual references:**
  - Hero card Doppelrand: outer shell `linear-gradient(145deg, ${color}16, ${color}06)` + `border: 1px solid ${color}1e` + `borderRadius: 1.125rem` + `padding: 3px`; inner core `linear-gradient(160deg, rgba(13,12,26,0.98), rgba(6,7,15,0.99))` + `borderRadius: calc(1.125rem - 3px)` + `inset 0 1px 1px rgba(255,255,255,0.04)`
  - Hero portrait: `object-position: center 20%` + `maskImage: linear-gradient(to bottom, black 65%, transparent 100%)`
  - Easing padrão: `cubic-bezier(0.23, 1, 0.32, 1)`

## Storyboard

Referência completa: `brag-output/brag-plan.md`. Resumo das cenas:

1. **Hook** — 3s — texto "Um RPG gacha." / "No browser." entra sequencialmente em fundo void; hard cut.
2. **A Invocação** — 6s — simulação InvocarTab: 10 cartas revelam beat-synced; carta 10 é Lendário com glow dourado e hold 1.2s.
3. **Hero Collection** — 4s — CartasTab: grade de hero cards art deco em stagger (0.055s delay); texto "200 heróis. 7 raridades." aparece após os cards.
4. **Scale** — 3s — 7 ícones de sistemas entram sequencialmente (0.3s cada); texto "21 sistemas." centraliza.
5. **Outro** — 4s — logo TRANSCEND INFINITY slam full-screen; tagline; URL discreta.

## Audio

- **Audio role:** Cinematic upbeat progressivo — bed orquestral que sobe de tensão.
- **Audio arc:** Fade-in sutil no hook → tensão crescente nos card reveals → hit no Lendário → breath nos hero cards → ritmo nos sistemas → slam + fade no logo.
- **Music file:** `brag-output/composition/assets/music/happy-beats-business-moves-vol-12-by-ende-dot-app.mp3`
- **Music treatment:** Fade-in 0.5s no início; volume constante no meio; fade-out começa em ~23s; strong beat em ~22.93s para o logo slam.
- **Music cue guidance:** Preset bundled em `~/.claude/skills/brag/assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`. Tempo: 109.96 BPM. Beat grid espaçado ~0.55s. Targets sugeridos:
  - ~8.74s → primeiro card reveal do pull (beat-lock ±0.15s)
  - ~13.11s → carta Lendário flash (beat-lock ±0.15s)
  - ~17.47s → entrada do hero grid (beat-lock ±0.15s)
  - ~22.93s → logo slam no outro (beat-lock ±0.15s)
  - Cards 1–10 no pull: beat-grid consecutivo ~0.55s cada, começando em ~8.74s; revelar rápido, manter cada card visível ≥0.8s antes do próximo (não é texto lido — pode usar beat a beat).
- **Audio-reactive treatment:** Sutil. Usar RMS/bass para fazer glow dos hero cards respirar levemente. No Lendário, reatividade mais expressiva (glow âmbar pulsa com o bass). Sem waveform, equalizer ou particle system.
- **Audio-coupled moments:**
  - Scene 2 (cada card) → card flip SFX leve (casino/card-slide ou card-place)
  - Scene 2 (Lendário) → impact hit seco em ~13.11s
  - Scene 4 (cada ícone) → click/interface SFX leve
  - Scene 5 (logo slam) → impact bell/bong seco em ~22.93s
- **SFX selection guidance:** Preferir sons de baixa frequência e não estridente para os card flips repetidos. Reservar impact para momentos únicos. Não adicionar SFX em elementos secundários de texto.
- **SFX analysis guidance:** `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` — usar como guia de seleção.
- **Exact SFX choice:** Hyperframes escolhe filenames, timestamps, densidade e volume após implementar as animações.
- **Audio files:** Copiar a música e SFX selecionados em `brag-output/composition/assets/`.

## Hyperframes Instructions

Carregar os domain skills: `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. Este é o workflow `/brag` — não entrar no intent interview do Hyperframes nem no generic promo/launch-video workflow.

**Requirements:**
- Mostrar pelo menos um elemento real da UI do projeto (hero card, tela de invocação, ou grade de heróis).
- Manter todo texto legível no render final — short label ≥0.8s settled; headline ≥0.3s por palavra.
- Manter duração total entre 15–25s (target: 20s).
- Incluir a camada de música e SFX conforme o plano.
- Tratar cue metadata como hints opcionais — pacing e legibilidade têm prioridade.
- Beat-lock pelo menos 1 major tween em strong cue (marcado `// beat-locked`).
- Sequential card reveals: snap a beats consecutivos (marcado `// beat-grid`).
- Usar local assets para áudio.
- Rodar `hyperframes check` antes do render.
