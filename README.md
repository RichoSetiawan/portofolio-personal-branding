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

- **Before publishing:** replace every `your-handle` in `socialLinks.ts`. Projects other than *Trailblaze Archive* are **sample entries** with `https://example.com` placeholder URLs.
- `trailblaze: { type: 'external', url }` opens a new tab. `{ type: 'internal', route }` navigates inside the app.
- `motif` picks the card emblem: `astrolabe`, `seer-eye`, `fool-mask`, `golden-key`, `chalice` or `carnival-dice`. Set `imageUrl` to use your own illustration instead. Put the file in `public/` and reference it as `/relics/foo.webp`.
- `careerId` links a project to a timeline milestone. Add the project id to that milestone's `connectedProjectIds` so the link works both ways.

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
