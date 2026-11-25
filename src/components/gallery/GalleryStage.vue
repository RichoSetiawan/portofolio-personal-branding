<script setup lang="ts">
/**
 * GalleryStage — the Relic Archive.
 *
 *  • 3D Stage: the stage pins to the viewport (CSS sticky) and the page's own
 *    vertical scroll turns the carousel — mouse wheel, trackpad, touch, scrollbar
 *    and keyboard all work, nothing is hijacked. Cards rest on each relic
 *    (detent easing) and the scroll gently snaps to the nearest card when you
 *    stop. After the last card the page simply continues.
 *    Also: horizontal trackpad / swipe, arrow keys, ‹ › buttons, progress bar.
 *  • 2D Gallery: responsive grid (2 columns on phones).
 *
 * Scales to any number of projects: scroll length per card shrinks as the
 * archive grows, the progress bar replaces dots, off-stage cards are hidden.
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch, type ComponentPublicInstance } from 'vue'
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
const lastIndex = Math.max(total - 1, 0)
const active = ref(0)
const current = computed(() => projects[active.value]!)
const pad = (n: number) => String(n).padStart(2, '0')

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/* ---------- elements ---------- */
const pinEl = ref<HTMLElement | null>(null)
const stageEl = ref<HTMLElement | null>(null)
const gridEl = ref<HTMLElement | null>(null)
const progressEl = ref<HTMLElement | null>(null)
const slotEls: (HTMLElement | null)[] = []
function setSlotRef(el: Element | ComponentPublicInstance | null, i: number) {
  slotEls[i] = el instanceof HTMLElement ? el : null
}

/* ---------- viewport metrics ---------- */
const isBrowser = typeof window !== 'undefined'
const coarsePointer = isBrowser && window.matchMedia('(pointer: coarse)').matches
const vw = ref(isBrowser ? window.innerWidth : 1280)
const vh = ref(isBrowser ? window.innerHeight : 800)
const stageH = ref(480)
const hudH = isBrowser
  ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-height')) || 64
  : 64

/** Height of the pinned viewport and how much page scroll each card takes. */
const stickyH = computed(() => Math.max(vh.value - hudH, 420))
const perCard = computed(() => vh.value * clamp(4 / Math.max(lastIndex, 1), 0.3, 0.45))
const pinHeight = computed(() => stickyH.value + lastIndex * perCard.value)

const cardWidth = computed(() => {
  const byWidth = vw.value < 640 ? Math.min(vw.value * 0.62, 270) : clamp(vw.value * 0.2, 220, 290)
  const byHeight = (stageH.value * 0.9) / 1.52 // card aspect 5 : 7.6
  return Math.max(150, Math.min(byWidth, byHeight))
})
const visibleRange = computed(() => (vw.value < 640 ? 1.5 : 2.5))

/* ---------- scroll → carousel position ---------- */
function readProgress(): number {
  const pin = pinEl.value
  if (!pin) return 0
  const rect = pin.getBoundingClientRect()
  const range = rect.height - stickyH.value
  if (range <= 0) return 0
  return clamp((hudH - rect.top) / range, 0, 1)
}

/** Holds each card centred for the first/last 18% of its scroll segment. */
function detent(p: number): number {
  const base = Math.floor(p)
  const t = clamp((p - base - 0.18) / 0.64, 0, 1)
  return base + t * t * (3 - 2 * t)
}

/** Writes 3D transforms straight to the DOM — no Vue re-render per frame. */
function layout(pos: number) {
  const w = cardWidth.value
  const gap = w * (vw.value < 640 ? 0.8 : 0.74)
  const range = visibleRange.value
  for (let i = 0; i < slotEls.length; i++) {
    const el = slotEls[i]
    if (!el) continue
    const d = i - pos
    const abs = Math.abs(d)
    const x = d * gap + clamp(d, -1, 1) * w * 0.12
    const z = abs < 1 ? lerp(60, -170, abs) : -abs * 170
    const ry = -clamp(d * 32, -48, 48)
    const opacity = clamp(1 - abs * 0.28, 0, 1) * clamp(range + 0.5 - abs, 0, 1)
    el.style.width = `${w}px`
    el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`
    el.style.opacity = opacity.toFixed(3)
    el.style.filter = abs < 0.04 ? 'none' : `brightness(${(1 - Math.min(abs, 3) * 0.24).toFixed(3)})`
    el.style.zIndex = String(100 - Math.round(abs * 10))
    el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible'
    el.style.pointerEvents = opacity < 0.2 ? 'none' : 'auto'
  }
}

let raf = 0
let running = false
let lastT = 0
let visual = 0
let applied = Number.NaN
let needsLayout = true
let inView = false

function applyFrame(t: number, instant = false) {
  const dt = clamp((t - lastT) / 1000, 0, 0.05)
  lastT = t
  const p = readProgress() * lastIndex
  const target = detent(p)
  if (instant || reduced.value) visual = target
  else {
    visual += (target - visual) * (1 - Math.exp(-dt * 11))
    if (Math.abs(target - visual) < 0.0008) visual = target
  }
  if (needsLayout || visual !== applied) {
    layout(visual)
    applied = visual
    needsLayout = false
    if (progressEl.value) progressEl.value.style.transform = `scaleX(${lastIndex ? visual / lastIndex : 1})`
  }
  const idx = clamp(Math.round(p), 0, lastIndex)
  if (idx !== active.value) active.value = idx
}

function tick(t: number) {
  if (!running) return
  raf = requestAnimationFrame(tick)
  applyFrame(t)
}
function startLoop() {
  if (running) return
  running = true
  lastT = performance.now()
  raf = requestAnimationFrame(tick)
}
function stopLoop() {
  running = false
  cancelAnimationFrame(raf)
}

function relayout() {
  if (stageEl.value) stageH.value = stageEl.value.clientHeight
  needsLayout = true
  void nextTick(() => applyFrame(performance.now(), !running))
}

/* ---------- navigation (always via page scroll, so scroll stays the source of truth) ---------- */
/** Card a button/key press is already travelling to, so rapid presses queue up instead of repeating. */
let navTarget: number | null = null
let navStartedAt = 0

function scrollToIndex(i: number, behavior?: ScrollBehavior) {
  const pin = pinEl.value
  if (!pin) return
  const idx = clamp(i, 0, lastIndex)
  navTarget = idx
  navStartedAt = performance.now()
  const pinTop = window.scrollY + pin.getBoundingClientRect().top
  const range = pin.offsetHeight - stickyH.value
  const top = pinTop - hudH + (lastIndex ? (idx / lastIndex) * range : 0)
  window.scrollTo({ top: Math.round(top), behavior: behavior ?? (reduced.value ? 'instant' : 'smooth') })
}

function go(step: number) {
  scrollToIndex((navTarget ?? active.value) + step)
}

/* gentle snap when scrolling stops inside the pinned range */
let snapTimer = 0
let lastScrollY = isBrowser ? window.scrollY : 0
let scrollDir = 0
let touching = false

function onWindowScroll() {
  const y = window.scrollY
  if (y !== lastScrollY) scrollDir = Math.sign(y - lastScrollY)
  lastScrollY = y
  if (!inView || lastIndex === 0 || viewMode.value !== 'stage') return
  window.clearTimeout(snapTimer)
  snapTimer = window.setTimeout(maybeSnap, 160)
}

function maybeSnap() {
  if (navTarget !== null) {
    // a button/key navigation is still travelling (slow devices can pause between frames) — don't redirect it
    const travelling = Math.abs(readProgress() * lastIndex - navTarget) > 0.02
    if (travelling && performance.now() - navStartedAt < 1500) {
      snapTimer = window.setTimeout(maybeSnap, 160)
      return
    }
    navTarget = null
  }
  if (touching || modalProject.value || viewMode.value !== 'stage') return
  const raw = readProgress()
  if (raw <= 0.0001 || raw >= 0.9999) return
  const p = raw * lastIndex
  const base = Math.floor(p)
  const f = p - base
  if (f < 0.01 || f > 0.99) return
  // one wheel notch / short flick = one card, in the direction you were scrolling
  let target = Math.round(p)
  if (scrollDir > 0) target = f > 0.16 ? base + 1 : base
  else if (scrollDir < 0) target = f < 0.84 ? base : base + 1
  scrollToIndex(target)
}

function onTouchStart() {
  touching = true
  navTarget = null
}
function onTouchEnd() {
  touching = false
  onWindowScroll()
}

/* ---------- stage input ---------- */
let startX = 0
let pointerDown = false
let dragged = false

function onPointerDown(e: PointerEvent) {
  pointerDown = true
  dragged = false
  startX = e.clientX
}
function onPointerMove(e: PointerEvent) {
  if (pointerDown && Math.abs(e.clientX - startX) > 12) dragged = true
}
function onPointerUp(e: PointerEvent) {
  if (!pointerDown) return
  pointerDown = false
  const dx = e.clientX - startX
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
  setTimeout(() => (dragged = false), 0)
}

/** Horizontal trackpad gestures turn the stage too. */
function onWheel(e: WheelEvent) {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 2) {
    e.preventDefault()
    window.scrollBy({ top: e.deltaX * 1.4, behavior: 'instant' })
  }
}

function onStageKey(e: KeyboardEvent) {
  const map: Record<string, () => void> = {
    ArrowRight: () => go(1),
    ArrowLeft: () => go(-1),
    Home: () => scrollToIndex(0),
    End: () => scrollToIndex(lastIndex),
  }
  const fn = map[e.key]
  if (!fn) return
  e.preventDefault()
  fn()
}

function onProgressClick(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  const frac = clamp(e.offsetX / el.clientWidth, 0, 1)
  scrollToIndex(Math.round(frac * lastIndex))
}

function onCardSelect(i: number, el: HTMLElement) {
  if (dragged) return
  if (viewMode.value === 'stage' && i !== active.value) {
    scrollToIndex(i)
    return
  }
  scene.pulse(projects[i]!.accent === 'gold' ? 'gold' : 'crimson')
  openProject(projects[i]!, el)
}

function inspectCurrent() {
  const el = slotEls[active.value]?.querySelector<HTMLElement>('.relic-card') ?? null
  scene.pulse(current.value.accent === 'gold' ? 'gold' : 'crimson')
  openProject(current.value, el)
}

/* ---------- lifecycle ---------- */
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null

function startStage() {
  if (!pinEl.value || !stageEl.value) return
  stageH.value = stageEl.value.clientHeight
  needsLayout = true
  lastT = performance.now()
  applyFrame(lastT, true)
  io = new IntersectionObserver(
    ([entry]) => {
      inView = !!entry?.isIntersecting
      if (inView) startLoop()
      else stopLoop()
    },
    { rootMargin: '30% 0px' },
  )
  io.observe(pinEl.value)
  ro = new ResizeObserver(relayout)
  ro.observe(stageEl.value)
}

function stopStage() {
  io?.disconnect()
  ro?.disconnect()
  io = ro = null
  inView = false
  stopLoop()
}

function syncScene() {
  scene.setMode(viewMode.value === 'stage' ? 'stage' : 'gallery')
  scene.bindStage(viewMode.value === 'stage' ? stageEl.value : gridEl.value)
  scene.focusCard(active.value, total)
}

function onResize() {
  const w = window.innerWidth
  const h = window.innerHeight
  const widthChanged = w !== vw.value
  vw.value = w
  // ignore the mobile URL-bar show/hide so the pinned length doesn't jump mid-scroll
  if (widthChanged || !coarsePointer || Math.abs(h - vh.value) > 120) vh.value = h
  relayout()
}

watch(active, (i) => scene.focusCard(i, total))
watch([cardWidth, visibleRange], () => {
  needsLayout = true
})

watch(viewMode, async (mode) => {
  stopStage()
  await nextTick()
  if (mode === 'stage') startStage()
  syncScene()
  if (mode === 'gallery' && gridEl.value && !reduced.value) {
    gsap.fromTo(
      gridEl.value.querySelectorAll('.grid-item'),
      { autoAlpha: 0, y: 40, rotateX: -18 },
      { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.8, stagger: 0.06, ease: 'power3.out', clearProps: 'transform' },
    )
  }
})

onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onWindowScroll, { passive: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
  if (viewMode.value === 'stage') startStage()
  syncScene()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onWindowScroll)
  window.removeEventListener('touchstart', onTouchStart)
  window.removeEventListener('touchend', onTouchEnd)
  window.removeEventListener('touchcancel', onTouchEnd)
  window.clearTimeout(snapTimer)
  stopStage()
  scene.bindStage(null)
})
</script>

<template>
  <section id="projects" class="gallery-section" :class="`is-${viewMode}`" aria-labelledby="projects-title">
    <div class="mx-auto max-w-7xl px-4 sm:px-8">
      <header class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div v-reveal class="max-w-2xl">
          <p class="section-kicker">Relic Archive · {{ pad(total) }} Arcana</p>
          <h2 id="projects-title" class="section-title mt-3">Projects</h2>
          <p class="mt-4 text-[0.98rem] leading-relaxed text-mist">
            Each relic seals a project. Select one to unveil its dossier — architecture, highlights and the stack
            behind it — then <span class="text-starlight">Trailblaze</span> straight into it.
          </p>
        </div>
        <div v-reveal="0.1">
          <ViewModeToggle />
        </div>
      </header>
    </div>

    <!-- enter-only transition: the old view is removed at once so the new one can be measured immediately -->
    <Transition name="mode">
      <!-- ================= 3D STAGE (scroll-driven, pinned) ================= -->
      <div v-if="viewMode === 'stage'" key="stage" ref="pinEl" class="stage-pin" :style="{ height: `${pinHeight}px` }">
        <div class="stage-sticky" :style="{ height: `${stickyH}px`, top: `${hudH}px` }">
          <div
            ref="stageEl"
            class="stage"
            role="region"
            aria-roledescription="carousel"
            aria-label="Project relics — scroll, swipe or use the arrow keys to turn the stage"
            tabindex="0"
            @keydown="onStageKey"
            @wheel="onWheel"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="pointerDown = false"
          >
            <div class="stage-track">
              <div
                v-for="(project, i) in projects"
                :key="project.id"
                :ref="(el) => setSlotRef(el, i)"
                class="stage-slot"
                role="group"
                aria-roledescription="slide"
                :aria-label="`${i + 1} of ${total}: ${project.title}`"
                :aria-hidden="Math.abs(i - active) > visibleRange"
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

          <!-- console -->
          <div class="px-4 sm:px-8">
            <div class="stage-console hud-panel hud-cut">
              <div class="console-meta">
                <span class="console-numeral">{{ current.arcana }}</span>
                <span class="truncate">{{ current.category }} · {{ current.year }}</span>
                <span class="console-count">{{ pad(active + 1) }} / {{ pad(total) }}</span>
              </div>
              <div aria-live="polite">
                <h3 class="console-title">{{ current.title }}</h3>
                <p class="console-summary">{{ current.summary }}</p>
              </div>
              <div class="console-actions">
                <button
                  type="button"
                  class="console-arrow"
                  aria-label="Previous relic"
                  :disabled="active === 0"
                  @click="go(-1)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
                </button>
                <button type="button" class="btn-ghost console-unveil" @click="inspectCurrent">
                  <span class="cue-diamond" aria-hidden="true" />
                  Unveil Relic
                </button>
                <button
                  type="button"
                  class="console-arrow"
                  aria-label="Next relic"
                  :disabled="active === lastIndex"
                  @click="go(1)"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>
              </div>
              <div v-if="lastIndex > 0" class="console-progress" aria-hidden="true" @click="onProgressClick">
                <span ref="progressEl" class="console-progress-fill" />
              </div>
              <p v-if="lastIndex > 0" class="console-hint">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="7" y="3" width="10" height="16" rx="5" />
                  <path d="M12 7v3" />
                </svg>
                {{ coarsePointer ? 'Scroll or swipe' : 'Scroll' }} to turn the stage · select the centre relic to
                unveil
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ================= 2D GALLERY ================= -->
      <div v-else key="gallery" class="mx-auto max-w-7xl px-4 sm:px-8">
        <ul ref="gridEl" class="gallery-grid" role="list">
          <li v-for="(project, i) in projects" :key="project.id" class="grid-item">
            <ProjectRelicCard :project="project" @select="(el) => onCardSelect(i, el)" />
          </li>
        </ul>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.gallery-section {
  position: relative;
  padding: clamp(5rem, 10vw, 8rem) 0 clamp(4rem, 8vw, 6rem);
}
.gallery-section.is-stage {
  padding-bottom: 1rem;
}

/* ---------- pinned stage ---------- */
.stage-pin {
  position: relative;
  margin-top: 1.5rem;
}
.stage-sticky {
  position: sticky;
  display: flex;
  flex-direction: column;
  padding-bottom: clamp(0.75rem, 2vh, 1.5rem);
  overflow: hidden;
}
.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  perspective: 1500px;
  perspective-origin: 50% 40%;
  touch-action: pan-y;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}
.stage:focus-visible {
  outline: 1px dashed var(--color-frame);
  outline-offset: -8px;
}
.stage-track {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
.stage-slot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 260px;
  transform-style: preserve-3d;
  will-change: transform, opacity;
}
.stage-floor {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: min(760px, 92%);
  height: 60px;
  transform: translateX(-50%);
  background: radial-gradient(50% 50% at 50% 50%, rgba(255, 209, 102, 0.12), rgba(58, 51, 102, 0.16) 45%, transparent 72%);
  pointer-events: none;
}

/* ---------- console ---------- */
.stage-console {
  --hud-cut: 14px;
  max-width: 640px;
  margin: 0 auto;
  padding: 0.9rem 1.1rem 0.85rem;
  text-align: center;
}
.console-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.console-numeral {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: var(--color-gilt);
}
.console-count {
  margin-left: 0.25rem;
  padding-left: 0.6rem;
  border-left: 1px solid var(--color-frame);
  color: var(--color-starlight);
  white-space: nowrap;
}
.console-title {
  margin-top: 0.35rem;
  font-size: clamp(1.1rem, 2.4vw, 1.5rem);
}
.console-summary {
  display: -webkit-box;
  margin: 0.35rem auto 0;
  max-width: 34rem;
  overflow: hidden;
  font-size: 0.86rem;
  line-height: 1.55;
  color: var(--color-mist);
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.console-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 0.75rem;
}
.console-unveil {
  padding: 0.6rem 1.1rem;
}
.console-arrow {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  color: var(--color-starlight);
  background: rgba(10, 9, 20, 0.6);
  border: 1px solid var(--color-frame);
  cursor: pointer;
  transition:
    border-color 0.25s,
    color 0.25s,
    opacity 0.25s;
}
.console-arrow svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}
.console-arrow:hover:not(:disabled) {
  border-color: var(--color-gilt);
  color: var(--color-gilt);
}
.console-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}
.console-progress {
  position: relative;
  height: 14px;
  margin-top: 0.7rem;
  cursor: pointer;
}
.console-progress::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--color-frame);
}
.console-progress-fill {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(50% - 1px);
  height: 2px;
  background: linear-gradient(90deg, var(--color-gilt), var(--color-elation));
  transform: scaleX(0);
  transform-origin: left;
}
.console-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.12em;
  color: var(--color-mist);
  opacity: 0.8;
}
.console-hint svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
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
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: clamp(1rem, 3vw, 2.25rem);
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
.mode-enter-active {
  transition: opacity 0.45s var(--ease-theatre);
}
.mode-enter-from {
  opacity: 0;
}

/* ---------- responsive ---------- */
@media (max-width: 559px) {
  .gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 2rem;
  }
}
@media (max-width: 639px) {
  .console-meta {
    letter-spacing: 0.16em;
  }
  .console-hint {
    font-size: 0.56rem;
    letter-spacing: 0.06em;
  }
}
@media (max-height: 760px) {
  .console-summary {
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
}
@media (max-height: 620px) {
  .console-summary,
  .console-hint {
    display: none;
  }
}
</style>
