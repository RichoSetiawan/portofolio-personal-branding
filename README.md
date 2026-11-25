# Trailblaze Archive — Richo Setiawan

Personal profile & portfolio hub. Vue 3 (Composition API + TypeScript), Three.js, GSAP, Tailwind CSS v4.

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check (vue-tsc) + production build → dist/
npm run preview    # serve dist/
```

## Editing content

All content is data-driven. You should rarely need to touch components.

| What | File |
| --- | --- |
| Projects (relic cards, modal, dossier pages) | `src/data/projects.ts` |
| Career & education chronicle 2022–2026 | `src/data/careerTimeline.ts` |
| Contact Me social links | `src/data/socialLinks.ts` |
| Background music playlist (files in `src/assets/audio/`) | `src/data/backgroundMusic.ts` |

- **Before publishing:** replace the remaining `your-handle` entries in `socialLinks.ts`. Projects other than *Trailblaze Archive* are **sample entries** with `https://example.com` placeholder URLs.

### Adding a project

Add one object to the array in `src/data/projects.ts`. The comment at the top of that file has a copy-paste template. Nothing else needs editing. The card, its 3D stage slot, the astrolabe node, the modal, the `/projects/<id>` page and the career-timeline link are all generated from it.

Required fields: `id`, `title`, `epithet`, `category`, `year`, `status` and `summary`. Everything else is filled in automatically when you leave it out:

| Field | Default |
| --- | --- |
| `arcana` | Tarot numeral from the project's position in the array: 0, I, II … XXI, XXII … |
| `slug` | Same as `id` |
| `motif` | Rotates through the six emblems (`astrolabe`, `seer-eye`, `fool-mask`, `golden-key`, `chalice`, `carnival-dice`) |
| `accent` | Alternates gold and crimson |
| `trailblaze` | The project's own dossier page |
| `description` | Same as `summary` |
| `architecture`, `highlights`, `techStack` | Empty. The matching sections are hidden. |

- **Order:** array order is the order on the stage and in the grid, and it sets the numerals. Set `arcana: 'XIII'` yourself if you want a fixed numeral.
- **Career link:** `careerId: 'ukrida' | 'bca' | 'fifgroup'` makes the project appear under that milestone automatically.
- **Trailblaze button:** `{ type: 'external', url }` opens a new tab. `{ type: 'internal', route }` navigates inside the app.
- **Custom art:** `imageUrl: '/relics/foo.webp'` (file in `public/relics/`) replaces the SVG emblem.
- **Mistake check:** in `npm run dev`, mistakes such as a duplicate id, an unknown `careerId` or a bad URL are reported in the browser console as `[portfolio data] …`.
- **Many projects:** tested with 18. Scroll length per card shrinks as the list grows, capped at about 5 screens. Only the cards near the centre are drawn, and the phone grid uses 2 columns.

### Background music

**Playlist.** Every audio file in `src/assets/audio/` is picked up automatically at build time (`.mp3`, `.m4a`, `.aac`, `.ogg`, `.opus`, `.webm`, `.wav`, `.flac`). After a song ends, the next one plays. After the last song, it starts again from the first. A single song simply loops.

Settings live in `src/data/backgroundMusic.ts`:

| Setting | What it does |
| --- | --- |
| `tracks` | Sets the play order: songs listed here play first, in that order, and other files follow by file name. Also sets each song's `title`, `artist` and footer `credit`. Use it for downloaded files with messy names. Keys are file names; case and repeated spaces don't matter. |
| `mode` | `'playlist'` (default), `'shuffle'` (reshuffled each round) or `'repeat-one'` (loops the first song). |
| `volume` | 0–1 fade-in level. The default is 0.35. |
| `credit` | Default rights line in the footer. The footer lists every title, grouped by credit. |
| `autoplay` / `entryGate` | See below. |
| `enabled` | `false` removes the feature. |

OS media keys and lock-screen controls support play, pause, next and previous. Only the song that is playing gets downloaded.

**Starting:**
- `autoplay: true` (the default) makes music **on by default**. It tries to start as soon as the page opens. Chrome, Safari and Firefox block sound until the visitor interacts with the page, and no site can bypass that.
- `entryGate: true` (the default) handles that block. When the browser refuses, a **"Begin Trailblaze" entry screen** covers the site. Clicking or tapping anywhere on it is the interaction the browser needs, so the music starts as the site opens. The hero intro waits for it.
- "Enter without sound" or Escape enters silently, and that choice is remembered.
- The screen is skipped when the browser already allows sound (the music just plays), when the folder is empty, and for visitors who chose silence before.
- With `entryGate: false` there is no screen. The music starts on the first click, tap or key press anywhere; scrolling alone doesn't count.
- `autoplay: false` keeps it off until the visitor presses the ♪ button in the top bar.
- Visitors can switch it off with ♪, and that choice is remembered over the default.
- It fades in and out (on iPhone too) and keeps playing across page changes.
- With `playInBackground: true` (the default), it keeps playing when the visitor switches tabs or minimizes the browser. The browser's media controls (the ♫ icon in Chrome/Edge's toolbar, the phone's notification or lock screen) can pause it or skip songs. Set it to `false` to pause while the tab is hidden.
- On phones the OS decides what happens in the background. Android Chrome usually keeps playing. iPhone Safari may stop the music when Safari itself goes to the background or the screen locks.
- With no audio files, the ♪ button is hidden on the live site. In `npm run dev` it shows dimmed with a hint.

⚠️ HOYO-MiX songs are © HoYoverse, and Wuthering Waves music is © Kuro Games. Putting the files on a public website, or in a public Git repo, redistributes them. Check each publisher's fan-content policy before you deploy, or use tracks you have rights to.

### 3D Stage controls

The stage pins to the screen while you scroll the page, and scrolling turns the cards. The mouse wheel, trackpad, a finger on a phone and the scrollbar all work. It settles on the nearest card when you stop, one wheel notch or short flick per card. After the last card the page continues normally. You can also use a horizontal trackpad swipe, arrow keys or Home/End, the ‹ › buttons, or click the progress bar. Clicking a side card brings it to the centre, and clicking the centre card unveils it.

## Structure

```
src/
├─ main.ts · App.vue               app shell: backdrop, modal and transition overlays
├─ router/index.ts                 / and /projects/:slug, plus hash scrolling and page titles
├─ types/portfolio.ts              Project, CareerMilestone, SocialLink types
├─ data/                           projects.ts · careerTimeline.ts · socialLinks.ts
├─ composables/
│  ├─ useGalleryScene.ts           Three.js backdrop and stage (provide/inject controller)
│  ├─ useProjectModal.ts           shared modal state (gallery and timeline open it)
│  ├─ useTrailblaze.ts             "Trailblaze" redirect with theatrical overlay
│  ├─ useViewMode.ts               3D Stage / 2D Gallery toggle (persisted)
│  └─ useReducedMotion.ts
├─ directives/reveal.ts            v-reveal section entrances (GSAP + IntersectionObserver)
├─ components/
│  ├─ CosmicBackdrop.vue           owns the WebGL canvas, provides scene controls
│  ├─ TrailblazeTransition.vue     full-screen wipe used by Trailblaze
│  ├─ EntryGate.vue                "Begin Trailblaze" screen that unlocks background music
│  ├─ hud/ProfileHeroHUD.vue · ViewModeToggle.vue
│  ├─ gallery/GalleryStage.vue · ProjectRelicCard.vue · HsrCardModal.vue
│  ├─ career/CareerTimelineSection.vue
│  ├─ footer/ContactFooter.vue
│  ├─ art/RelicArt.vue             original SVG emblems and filigree
│  └─ icons/SocialIcon.vue
├─ views/HomeView.vue · ProjectDetailView.vue
└─ assets/styles/main.css          Tailwind v4 @theme tokens (60:30:10) and component classes
```

## The 60 : 30 : 10 palette

The palette is defined once in `src/assets/styles/main.css` (`@theme`). It is exposed as Tailwind utilities (`bg-void`, `text-mist`, `border-frame`, `text-gilt`…) and as CSS variables (`var(--color-elation)`).

| Share | Role | Tokens |
| --- | --- | --- |
| 60% | Cosmic void and velvet canvas | `void #0A0914`, `void-2 #121024` |
| 30% | Glass, fog, frames, type | `glass rgba(28,24,54,.76)`, `frame #3A3366`, `fog`, `starlight #F4F2FF`, `mist #A8A2C8` |
| 10% | Accent | `elation #FF2A6D`, `gilt #FFD166` |

Use accents only for rims, glows, nodes, small glyphs, active states and the Trailblaze CTA. Never use them for panel fills or body text. The starfield and nebula follow the same split.

## Notes

- **WebGL fallback:** if WebGL is unavailable, a CSS starfield and a static SVG astrolabe replace the canvas. The 3D Stage carousel is CSS 3D, so it still works.
- **Motion:** `prefers-reduced-motion` slows the canvas, swaps GSAP sequences for fades and defaults to the 2D Gallery.
- **External Trailblaze:** the cover animation is kept under about 600 ms, so `window.open` still counts as a user action and popup blockers allow it.
- **Hosting:** the app uses HTML5 history routing. Configure your host to serve `index.html` for unknown paths, such as a Netlify `_redirects` file or a Vercel rewrite.
- **Attribution:** the aesthetic is fan-inspired. *Honkai: Star Rail* © HoYoverse, *Umineko When They Cry* © 07th Expansion, *Lord of the Mysteries* © Cuttlefish That Loves Diving. All artwork in this repo is original.
