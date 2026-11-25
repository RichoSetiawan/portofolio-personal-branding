<script setup lang="ts">
/**
 * ProjectDetailView — `/projects/:slug` dossier (internal Trailblaze target).
 * The WebGL astrolabe shifts aside ('dossier' mode) to frame the relic.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import RelicArt from '@/components/art/RelicArt.vue'
import ContactFooter from '@/components/footer/ContactFooter.vue'
import { findProjectBySlug, projects } from '@/data/projects'
import { careerTimeline } from '@/data/careerTimeline'
import { useGallerySceneControls } from '@/composables/useGalleryScene'
import { useTrailblaze } from '@/composables/useTrailblaze'
import { useReducedMotion } from '@/composables/useReducedMotion'

const props = defineProps<{ slug: string }>()

const scene = useGallerySceneControls()
const { trailblaze, inFlight } = useTrailblaze()
const reduced = useReducedMotion()
const rootEl = ref<HTMLElement | null>(null)

const project = computed(() => findProjectBySlug(props.slug))
const index = computed(() => projects.findIndex((p) => p.slug === props.slug))
const prev = computed(() => (index.value >= 0 ? projects[(index.value - 1 + projects.length) % projects.length] : undefined))
const next = computed(() => (index.value >= 0 ? projects[(index.value + 1) % projects.length] : undefined))
const milestone = computed(() =>
  project.value?.careerId ? careerTimeline.find((m) => m.id === project.value!.careerId) : undefined,
)
const externalTarget = computed(() => (project.value?.trailblaze.type === 'external' ? project.value.trailblaze : null))

function onTrailblaze() {
  const p = project.value
  if (!p || !externalTarget.value) return
  scene.pulse('gold')
  void trailblaze(externalTarget.value, p.title)
}

function enter() {
  if (reduced.value || !rootEl.value) return
  gsap.fromTo(
    rootEl.value.querySelectorAll('[data-enter]'),
    { autoAlpha: 0, y: 26 },
    { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', clearProps: 'transform' },
  )
  const card = rootEl.value.querySelector('.dossier-card')
  if (card) {
    gsap.fromTo(
      card,
      { autoAlpha: 0, y: -160, rotateY: 180, rotateZ: -6, transformPerspective: 1400 },
      { autoAlpha: 1, y: 0, rotateY: 360, rotateZ: 0, duration: 1.1, ease: 'power4.out', delay: 0.1 },
    )
  }
}

watch(
  () => props.slug,
  async () => {
    await nextTick()
    enter()
    if (project.value) scene.pulse(project.value.accent === 'gold' ? 'gold' : 'crimson')
  },
)

onMounted(() => {
  scene.setMode('dossier')
  scene.bindStage(null)
  enter()
})

onUnmounted(() => {
  if (rootEl.value) gsap.killTweensOf(rootEl.value.querySelectorAll('[data-enter], .dossier-card'))
})
</script>

<template>
  <div ref="rootEl" class="dossier">
    <!-- top bar -->
    <header class="dossier-bar">
      <div class="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <RouterLink :to="{ path: '/', hash: '#projects' }" class="back-link">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          Return to Archive
        </RouterLink>
        <span class="font-mono text-[0.62rem] tracking-[0.3em] text-mist uppercase">Relic Dossier</span>
      </div>
    </header>

    <main id="main" tabindex="-1" class="mx-auto max-w-7xl px-4 pt-28 pb-10 sm:px-8">
      <!-- ============ found ============ -->
      <template v-if="project">
        <section class="dossier-hero" aria-labelledby="dossier-title">
          <div class="order-2 lg:order-1">
            <p class="section-kicker" data-enter>
              Arcana {{ project.arcana }} · {{ project.category }} · {{ project.year }}
            </p>
            <h1 id="dossier-title" class="dossier-title" data-enter>{{ project.title }}</h1>
            <p class="dossier-epithet" data-enter>“{{ project.epithet }}”</p>
            <p class="dossier-summary" data-enter>{{ project.summary }}</p>

            <div class="mt-6 flex flex-wrap items-center gap-3" data-enter>
              <span class="chip">
                <span class="status-dot" :class="{ 'is-live': project.status === 'Live' }" aria-hidden="true" />
                {{ project.status }}
              </span>
              <span v-if="milestone" class="chip">{{ milestone.organization }} · {{ milestone.kind }}</span>
            </div>

            <div class="mt-8 flex flex-wrap items-center gap-3" data-enter>
              <button
                v-if="externalTarget"
                type="button"
                class="btn-trailblaze"
                :disabled="inFlight"
                @click="onTrailblaze"
              >
                <svg class="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z" />
                </svg>
                Trailblaze
              </button>
              <a v-if="project.repoUrl" :href="project.repoUrl" class="btn-ghost" target="_blank" rel="noopener noreferrer">
                Source
              </a>
              <span v-if="!externalTarget" class="font-mono text-[0.66rem] tracking-[0.18em] text-mist uppercase">
                ◆ You have arrived at this relic
              </span>
            </div>
          </div>

          <div class="order-1 flex justify-center lg:order-2" aria-hidden="true">
            <div class="dossier-card" :class="`tone-${project.accent}`">
              <div class="dc-rim hud-cut" />
              <div class="dc-body hud-cut">
                <div class="dc-inner ornate-corners">
                  <span class="dc-numeral">{{ project.arcana }}</span>
                  <RelicArt :motif="project.motif" :accent="project.accent" :image-url="project.imageUrl" hero />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="sigil-divider my-14" aria-hidden="true"><span class="gem" /></div>

        <section class="dossier-grid" aria-label="Project details">
          <article class="dossier-block hud-panel hud-cut lg:col-span-2" data-enter>
            <h2 class="block-h">Chronicle</h2>
            <p class="block-text">{{ project.description }}</p>
          </article>

          <article class="dossier-block hud-panel hud-cut" data-enter>
            <h2 class="block-h">Architecture</h2>
            <ul class="block-list">
              <li v-for="a in project.architecture" :key="a">{{ a }}</li>
            </ul>
          </article>

          <article class="dossier-block hud-panel hud-cut" data-enter>
            <h2 class="block-h">Highlights</h2>
            <ul class="block-list">
              <li v-for="h in project.highlights" :key="h">{{ h }}</li>
            </ul>
          </article>

          <article class="dossier-block hud-panel hud-cut lg:col-span-2" data-enter>
            <h2 class="block-h">Tech Stack</h2>
            <ul class="mt-4 flex flex-wrap gap-2" role="list">
              <li v-for="t in project.techStack" :key="t" class="chip">{{ t }}</li>
            </ul>
            <RouterLink
              v-if="milestone"
              :to="{ path: '/', hash: '#career' }"
              class="mt-6 inline-flex items-center gap-2 font-mono text-[0.7rem] tracking-[0.16em] text-mist uppercase hover:text-starlight"
            >
              Forged during {{ milestone.organization }} — view in chronicle →
            </RouterLink>
          </article>
        </section>

        <!-- prev / next relic -->
        <nav class="relic-nav" aria-label="More relics" data-enter>
          <RouterLink v-if="prev" :to="`/projects/${prev.slug}`" class="relic-nav-link">
            <span class="nav-dir">← Previous relic</span>
            <span class="nav-title">{{ prev.arcana }} · {{ prev.title }}</span>
          </RouterLink>
          <RouterLink v-if="next" :to="`/projects/${next.slug}`" class="relic-nav-link is-next">
            <span class="nav-dir">Next relic →</span>
            <span class="nav-title">{{ next.arcana }} · {{ next.title }}</span>
          </RouterLink>
        </nav>
      </template>

      <!-- ============ not found ============ -->
      <section v-else class="not-found hud-panel hud-cut" aria-labelledby="nf-title">
        <p class="section-kicker justify-center">Relic not found</p>
        <h1 id="nf-title" class="section-title mt-3">This relic is still veiled</h1>
        <p class="mx-auto mt-4 max-w-md text-mist">
          No project answers to “{{ slug }}”. It may have been renamed or not yet unearthed.
        </p>
        <RouterLink :to="{ path: '/', hash: '#projects' }" class="btn-ghost mt-8">Return to Archive</RouterLink>
      </section>
    </main>

    <ContactFooter />
  </div>
</template>

<style scoped>
.dossier-bar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: var(--hud-height);
  background: rgba(10, 9, 20, 0.72);
  border-bottom: 1px solid rgba(58, 51, 102, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-starlight);
  text-decoration: none;
  transition: color 0.2s;
}
.back-link svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}
.back-link:hover {
  color: var(--color-gilt);
}

.dossier-hero {
  display: grid;
  gap: 3rem;
  align-items: center;
}
@media (min-width: 1024px) {
  .dossier-hero {
    grid-template-columns: 1.2fr 0.8fr;
  }
}
.dossier-title {
  margin-top: 1rem;
  font-size: clamp(2.4rem, 6vw, 4.5rem);
  line-height: 1;
}
.dossier-epithet {
  margin-top: 0.75rem;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.35rem;
  color: var(--color-mist);
}
.dossier-summary {
  max-width: 38rem;
  margin-top: 1.25rem;
  line-height: 1.75;
  color: var(--color-mist);
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-mist);
}
.status-dot.is-live {
  background: var(--color-gilt);
  box-shadow: 0 0 8px var(--color-gilt);
}

/* static relic card */
.dossier-card {
  --hud-cut: 22px;
  position: relative;
  width: min(320px, 72vw);
  aspect-ratio: 2 / 3;
  filter: drop-shadow(0 0 1px rgba(255, 209, 102, 0.8)) drop-shadow(0 0 30px rgba(255, 42, 109, 0.28))
    drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6));
}
.dc-rim {
  position: absolute;
  inset: 0;
  background: var(--rim);
}
.dc-body {
  position: absolute;
  inset: 2px;
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(58, 51, 102, 0.5), transparent 60%),
    linear-gradient(180deg, #17142e, var(--color-void-2) 45%, var(--color-void));
}
.dc-inner {
  position: absolute;
  inset: 10px;
  padding: 2rem 0.5rem 1rem;
  border: 1px solid rgba(58, 51, 102, 0.8);
}
.dc-numeral {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  translate: -50% 0;
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-gilt);
}
.tone-crimson .dc-numeral {
  color: var(--color-elation);
}

.gem {
  width: 8px;
  height: 8px;
  background: var(--color-gilt);
  transform: rotate(45deg);
}

.dossier-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .dossier-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.dossier-block {
  --hud-cut: 16px;
  padding: clamp(1.25rem, 3vw, 2rem);
}
.block-h {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-starlight);
}
.block-text {
  margin-top: 1rem;
  line-height: 1.8;
  color: var(--color-mist);
}
.block-list {
  display: grid;
  gap: 0.65rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}
.block-list li {
  position: relative;
  padding-left: 1.2rem;
  line-height: 1.6;
  color: var(--color-mist);
}
.block-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 6px;
  height: 6px;
  border: 1px solid var(--color-gilt);
  transform: rotate(45deg);
}

.relic-nav {
  display: grid;
  gap: 1rem;
  margin-top: 3rem;
}
@media (min-width: 640px) {
  .relic-nav {
    grid-template-columns: 1fr 1fr;
  }
}
.relic-nav-link {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.1rem 1.25rem;
  text-decoration: none;
  background: var(--color-glass);
  border: 1px solid var(--color-frame);
  transition: border-color 0.25s;
}
.relic-nav-link.is-next {
  text-align: right;
}
.relic-nav-link:hover {
  border-color: var(--color-gilt);
}
.nav-dir {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.nav-title {
  font-family: var(--font-display);
  letter-spacing: 0.06em;
  color: var(--color-starlight);
}

.not-found {
  --hud-cut: 20px;
  margin-top: 4rem;
  padding: 4rem 1.5rem;
  text-align: center;
}
</style>
