<script setup lang="ts">
/**
 * GalleryStage — the Relic Archive.
 *  • 3D Stage: 2.5D coverflow carousel on a lit pedestal; the WebGL astrolabe
 *    locks behind it and turns to the selected relic.
 *  • 2D Gallery: responsive grid fallback (default on small screens / reduced motion).
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { gsap } from 'gsap'
import ProjectRelicCard from './ProjectRelicCard.vue'
import ViewModeToggle from '@/components/hud/ViewModeToggle.vue'
import { projects } from '@/data/projects'
import { useViewMode } from '@/composables/useViewMode'
import { useProjectModal } from '@/composables/useProjectModal'
import { useGallerySceneControls } from '@/composables/useGalleryScene'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { vReveal } from '@/directives/reveal'

const { viewMode } = useViewMode()
const { openProject, activeProject: modalProject } = useProjectModal()
const scene = useGallerySceneControls()
const reduced = useReducedMotion()

const total = projects.length
const active = ref(0)
const current = computed(() => projects[active.value]!)

const stageEl = ref<HTMLElement | null>(null)
const gridEl = ref<HTMLElement | null>(null)
const vw = ref(typeof window !== 'undefined' ? window.innerWidth : 1280)

/* ---------- coverflow geometry ---------- */
const cardWidth = computed(() => {
  if (vw.value < 640) return Math.min(vw.value * 0.66, 270)
  return Math.min(Math.max(vw.value * 0.2, 230), 290)
})
const visibleRange = computed(() => (vw.value < 640 ? 1 : 2))

/** Shortest signed distance on the ring so the stage wraps around. */
function offsetOf(i: number): number {
  let d = i - active.value
  if (d > total / 2) d -= total
  if (d < -total / 2) d += total
  return d
}

function cardStyle(i: number): Record<string, string | number> {
  const d = offsetOf(i)
  const abs = Math.abs(d)
  const gap = cardWidth.value * (vw.value < 640 ? 0.78 : 0.74)
  const hidden = abs > visibleRange.value
  const x = d * gap + Math.sign(d) * (abs > 0 ? cardWidth.value * 0.12 : 0)
  return {
    width: `${cardWidth.value}px`,
    transform: `translate(-50%, -50%) translateX(${x}px) translateZ(${abs === 0 ? 60 : -abs * 170}px) rotateY(${-Math.sign(d) * Math.min(abs * 32, 48)}deg)`,
    opacity: hidden ? 0 : abs === 0 ? 1 : 1 - abs * 0.28,
    filter: abs === 0 ? 'none' : `brightness(${1 - abs * 0.25}) saturate(${1 - abs * 0.2})`,
    zIndex: 10 - abs,
    pointerEvents: hidden ? 'none' : 'auto',
  }
}

function go(step: number) {
  active.value = (active.value + step + total) % total
}

function onCardSelect(i: number, el: HTMLElement) {
  if (dragged) return
  if (viewMode.value === 'stage' && i !== active.value) {
    active.value = i
    return
  }
  active.value = i
  scene.pulse(projects[i]!.accent === 'gold' ? 'gold' : 'crimson')
  openProject(projects[i]!, el)
}

function inspectCurrent() {
  const el = stageEl.value?.querySelector<HTMLElement>(`[data-index="${active.value}"] .relic-card`)
  scene.pulse(current.value.accent === 'gold' ? 'gold' : 'crimson')
  openProject(current.value, el ?? null)
}

/* ---------- swipe / drag ---------- */
let startX = 0
let dragging = false
let dragged = false

function onPointerDown(e: PointerEvent) {
  dragging = true
  dragged = false
  startX = e.clientX
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  if (Math.abs(e.clientX - startX) > 12) dragged = true
}
function onPointerUp(e: PointerEvent) {
  if (!dragging) return
  dragging = false
  const dx = e.clientX - startX
  if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1)
  // let the click that follows a drag be swallowed, then reset
  setTimeout(() => (dragged = false), 0)
}

function onStageKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    go(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    go(-1)
  } else if (e.key === 'Home') {
    e.preventDefault()
    active.value = 0
  } else if (e.key === 'End') {
    e.preventDefault()
    active.value = total - 1
  }
}

/* ---------- scene sync ---------- */
function syncScene() {
  scene.setMode(viewMode.value === 'stage' ? 'stage' : 'gallery')
  scene.bindStage(viewMode.value === 'stage' ? stageEl.value : gridEl.value)
  scene.focusCard(active.value, total)
}

watch(active, (i) => scene.focusCard(i, total))

// Keep the stage centred on whichever relic the modal opened (e.g. from the timeline)
watch(modalProject, (p) => {
  if (!p) return
  const i = projects.findIndex((x) => x.id === p.id)
  if (i >= 0) active.value = i
})

watch(viewMode, async () => {
  await nextTick()
  syncScene()
  if (viewMode.value === 'gallery' && gridEl.value && !reduced.value) {
    gsap.fromTo(
      gridEl.value.querySelectorAll('.grid-item'),
      { autoAlpha: 0, y: 40, rotateX: -18 },
      { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out', clearProps: 'transform' },
    )
  }
})

function onResize() {
  vw.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  syncScene()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  scene.bindStage(null)
})
</script>

<template>
  <section id="projects" class="gallery-section" aria-labelledby="projects-title">
    <div class="mx-auto max-w-7xl px-4 sm:px-8">
      <header class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div v-reveal class="max-w-2xl">
          <p class="section-kicker">Relic Archive · {{ String(total).padStart(2, '0') }} Arcana</p>
          <h2 id="projects-title" class="section-title mt-3">Projects</h2>
          <p class="mt-4 text-[0.98rem] leading-relaxed text-mist">
            Each relic seals a project. Select one to unveil its dossier — architecture, highlights and the stack
            behind it — then <span class="text-starlight">Trailblaze</span> straight into it.
          </p>
        </div>
        <div v-reveal="0.1" class="flex items-center gap-3">
          <ViewModeToggle />
        </div>
      </header>

      <!-- 3D STAGE -->
      <Transition name="mode" mode="out-in">
        <div v-if="viewMode === 'stage'" key="stage" class="stage-wrap">
          <div
            ref="stageEl"
            class="stage"
            role="region"
            aria-roledescription="carousel"
            aria-label="Project relics — use left and right arrow keys to rotate the stage"
            tabindex="0"
            @keydown="onStageKey"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="dragging = false"
          >
            <div class="stage-track">
              <div
                v-for="(project, i) in projects"
                :key="project.id"
                class="stage-slot"
                :data-index="i"
                :style="cardStyle(i)"
                :aria-hidden="Math.abs(offsetOf(i)) > visibleRange"
                role="group"
                aria-roledescription="slide"
                :aria-label="`${i + 1} of ${total}: ${project.title}`"
              >
                <ProjectRelicCard
                  :project="project"
                  :active="i === active"
                  :still="i !== active"
                  :tabbable="i === active"
                  @select="(el) => onCardSelect(i, el)"
                />
              </div>
            </div>
            <div class="stage-floor" aria-hidden="true" />
          </div>

          <!-- stage console -->
          <div class="stage-console hud-panel hud-cut" aria-live="polite">
            <button type="button" class="console-arrow" aria-label="Previous relic" @click="go(-1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
            </button>

            <div class="console-body">
              <div class="flex items-center justify-center gap-3 font-mono text-[0.66rem] uppercase tracking-[0.28em]">
                <span class="console-numeral">{{ current.arcana }}</span>
                <span class="text-mist">{{ current.category }} · {{ current.year }}</span>
              </div>
              <h3 class="mt-2 text-xl sm:text-2xl">{{ current.title }}</h3>
              <p class="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-mist">{{ current.summary }}</p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-3">
                <button type="button" class="btn-ghost" @click="inspectCurrent">
                  <span class="cue-diamond" aria-hidden="true" />
                  Unveil Relic
                </button>
              </div>
              <div class="console-dots" role="group" aria-label="Choose relic">
                <button
                  v-for="(p, i) in projects"
                  :key="p.id"
                  type="button"
                  class="console-dot"
                  :class="{ 'is-on': i === active }"
                  :aria-label="`Show ${p.title}`"
                  :aria-current="i === active ? 'true' : undefined"
                  @click="active = i"
                />
              </div>
            </div>

            <button type="button" class="console-arrow" aria-label="Next relic" @click="go(1)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        <!-- 2D GALLERY -->
        <ul v-else key="gallery" ref="gridEl" class="gallery-grid" role="list">
          <li v-for="(project, i) in projects" :key="project.id" class="grid-item">
            <ProjectRelicCard :project="project" @select="(el) => onCardSelect(i, el)" />
          </li>
        </ul>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.gallery-section {
  position: relative;
  padding: clamp(5rem, 10vw, 8rem) 0 clamp(4rem, 8vw, 6rem);
}

/* ---------- stage ---------- */
.stage-wrap {
  margin-top: 2.5rem;
}
.stage {
  position: relative;
  height: clamp(440px, 62vh, 620px);
  perspective: 1500px;
  perspective-origin: 50% 40%;
  touch-action: pan-y;
  user-select: none;
  outline: none;
}
.stage:focus-visible {
  outline: 1px dashed var(--color-frame);
  outline-offset: 8px;
}
.stage-track {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
.stage-slot {
  position: absolute;
  top: 47%;
  left: 50%;
  transform-style: preserve-3d;
  transition:
    transform 0.85s var(--ease-theatre),
    opacity 0.6s var(--ease-theatre),
    filter 0.6s var(--ease-theatre);
  will-change: transform;
}
.stage-floor {
  position: absolute;
  left: 50%;
  bottom: 2%;
  width: min(760px, 92%);
  height: 70px;
  transform: translateX(-50%);
  background: radial-gradient(50% 50% at 50% 50%, rgba(255, 209, 102, 0.14), rgba(58, 51, 102, 0.18) 45%, transparent 72%);
  pointer-events: none;
}

/* ---------- console ---------- */
.stage-console {
  --hud-cut: 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  max-width: 760px;
  margin: 0.5rem auto 0;
  padding: 1.25rem 1rem;
  text-align: center;
}
.console-numeral {
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--color-gilt);
}
.console-arrow {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--color-starlight);
  background: rgba(10, 9, 20, 0.6);
  border: 1px solid var(--color-frame);
  cursor: pointer;
  transition:
    border-color 0.25s,
    color 0.25s;
}
.console-arrow svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}
.console-arrow:hover {
  border-color: var(--color-gilt);
  color: var(--color-gilt);
}
.console-dots {
  display: flex;
  justify-content: center;
  gap: 0.55rem;
  margin-top: 1.1rem;
}
.console-dot {
  width: 9px;
  height: 9px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--color-frame);
  transform: rotate(45deg);
  cursor: pointer;
  transition:
    background 0.3s,
    border-color 0.3s,
    transform 0.3s;
}
.console-dot:hover {
  border-color: var(--color-mist);
}
.console-dot.is-on {
  background: var(--color-gilt);
  border-color: var(--color-gilt);
  transform: rotate(45deg) scale(1.25);
}
.cue-diamond {
  width: 6px;
  height: 6px;
  background: var(--color-elation);
  transform: rotate(45deg);
}

/* ---------- grid ---------- */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
  gap: clamp(1.25rem, 3vw, 2.25rem);
  margin: 3rem 0 0;
  padding: 0;
  list-style: none;
  perspective: 1200px;
}
.grid-item {
  max-width: 340px;
  width: 100%;
  justify-self: center;
}

/* ---------- mode transition ---------- */
.mode-enter-active,
.mode-leave-active {
  transition:
    opacity 0.35s var(--ease-theatre),
    transform 0.35s var(--ease-theatre);
}
.mode-enter-from,
.mode-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

@media (max-width: 639px) {
  .stage {
    height: 470px;
  }
  .stage-console {
    grid-template-columns: 1fr;
    padding: 1.25rem 1rem 1rem;
  }
  .console-arrow {
    display: none;
  }
}
</style>
