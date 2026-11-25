<script setup lang="ts">
/**
 * HsrCardModal — Honkai: Star Rail–inspired card drop & unveil.
 *
 * Sequence (GSAP):
 *   1. Lift   — card leaves its slot, rises and flips to its sigil back.
 *   2. Drop   — descends with a spin, flips to the front and lands.
 *   3. Impact — shockwave ring, light rays, sweep across the face.
 *   4. Unveil — dossier panel wipes open, content staggers in.
 * Close reverses into the stars. Reduced motion → plain fades.
 */
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'
import { gsap } from 'gsap'
import RelicArt from '@/components/art/RelicArt.vue'
import { useProjectModal } from '@/composables/useProjectModal'
import { useTrailblaze } from '@/composables/useTrailblaze'
import { useGallerySceneControls } from '@/composables/useGalleryScene'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { careerTimeline } from '@/data/careerTimeline'

const { activeProject: project, originRect, closeProject } = useProjectModal()
const { trailblaze, inFlight } = useTrailblaze()
const scene = useGallerySceneControls()
const reduced = useReducedMotion()
const titleId = `hsr-title-${useId()}`

const rootEl = ref<HTMLElement | null>(null)
const backdropEl = ref<HTMLElement | null>(null)
const raysEl = ref<HTMLElement | null>(null)
const shockEl = ref<HTMLElement | null>(null)
const cardEl = ref<HTMLElement | null>(null)
const sweepEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

let openTl: gsap.core.Timeline | null = null
let closeTl: gsap.core.Timeline | null = null
const closing = ref(false)

const milestone = computed(() =>
  project.value?.careerId ? careerTimeline.find((m) => m.id === project.value!.careerId) : undefined,
)
const dossierRoute = computed(() => (project.value ? `/projects/${project.value.slug}` : '/'))
const showDossierLink = computed(
  () => project.value && !(project.value.trailblaze.type === 'internal' && project.value.trailblaze.route === dossierRoute.value),
)
const trailblazeHint = computed(() => {
  const t = project.value?.trailblaze
  if (!t) return ''
  return t.type === 'external' ? 'Opens the live deployment in a new tab' : 'Travels to the project dossier'
})

/* ---------- scroll lock ---------- */
let locked = false
function lockScroll() {
  if (locked) return
  locked = true
  const sbw = window.innerWidth - document.documentElement.clientWidth
  document.documentElement.style.overflow = 'hidden'
  if (sbw > 0) document.body.style.paddingRight = `${sbw}px`
}
function unlockScroll() {
  if (!locked) return
  locked = false
  document.documentElement.style.overflow = ''
  document.body.style.paddingRight = ''
}

/* ---------- open ---------- */
async function playOpen() {
  closing.value = false
  closeTl?.kill()
  lockScroll()
  await nextTick()
  const root = rootEl.value
  const card = cardEl.value
  const panel = panelEl.value
  if (!root || !card || !panel) return
  const staggered = panel.querySelectorAll('[data-stagger]')

  openTl?.kill()
  openTl = gsap.timeline({ onComplete: () => closeBtn.value?.focus({ preventScroll: true }) })
  // focus inside the dialog immediately for screen readers / keyboard users
  root.focus({ preventScroll: true })

  if (reduced.value) {
    openTl
      .fromTo(backdropEl.value, { opacity: 0 }, { opacity: 1, duration: 0.2 })
      .fromTo([card, panel], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0)
      .set(raysEl.value, { opacity: 1 }, 0)
    return
  }

  const final = card.getBoundingClientRect()
  const origin = originRect.value
  const from = origin
    ? {
        x: origin.left + origin.width / 2 - (final.left + final.width / 2),
        y: origin.top + origin.height / 2 - (final.top + final.height / 2),
        scale: origin.width / final.width,
      }
    : { x: 0, y: -window.innerHeight * 0.7, scale: 0.6 }
  const apex = -Math.min(window.innerHeight * 0.3, 260)

  gsap.set(card, { transformPerspective: 1400, transformOrigin: '50% 50%' })
  gsap.set(panel, { autoAlpha: 0 })
  gsap.set(staggered, { autoAlpha: 0, y: 18 })

  openTl
    .fromTo([backdropEl.value, closeBtn.value], { opacity: 0 }, { opacity: 1, duration: 0.45, ease: 'power2.out' }, 0)
    // 1. Lift — rise from the slot and flip to the sigil back
    .fromTo(
      card,
      { ...from, rotateY: 0, rotateZ: 0, autoAlpha: 1 },
      { x: 0, y: apex, scale: 0.74, rotateY: 180, rotateZ: -7, duration: 0.55, ease: 'power2.out' },
      0,
    )
    // 2. Drop — fall with a spin, flip back to the face
    .to(card, { y: 0, scale: 1, rotateY: 360, rotateZ: 0, duration: 0.55, ease: 'power4.in' })
    // 3. Impact
    .add(() => scene.pulse(project.value?.accent === 'gold' ? 'gold' : 'crimson'))
    .fromTo(shockEl.value, { scale: 0.35, opacity: 0.95 }, { scale: 2.3, opacity: 0, duration: 0.75, ease: 'power2.out' }, '<')
    .to(card, { y: -9, duration: 0.1, ease: 'power1.out', yoyo: true, repeat: 1 }, '<')
    .fromTo(
      raysEl.value,
      { opacity: 0, scale: 0.55, rotate: -25 },
      { opacity: 1, scale: 1, rotate: 0, duration: 1, ease: 'expo.out' },
      '<',
    )
    .fromTo(sweepEl.value, { xPercent: -140 }, { xPercent: 140, duration: 0.9, ease: 'power2.inOut' }, '<0.05')
    // 4. Unveil the dossier
    .fromTo(
      panel,
      { autoAlpha: 1, clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'expo.out' },
      '<0.1',
    )
    .to(staggered, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '<0.15')
    .set(panel, { clearProps: 'clipPath' })
}

/* ---------- close ---------- */
function finishClose(restoreFocus = true) {
  openTl?.kill()
  closeTl?.kill()
  openTl = closeTl = null
  unlockScroll()
  closing.value = false
  closeProject({ restoreFocus })
}

function close() {
  if (!project.value || closing.value) return
  closing.value = true
  openTl?.kill()
  if (reduced.value) {
    closeTl = gsap.timeline({ onComplete: () => finishClose() })
    closeTl.to(rootEl.value, { autoAlpha: 0, duration: 0.2 })
    return
  }
  closeTl = gsap.timeline({ onComplete: () => finishClose() })
  closeTl
    .to(panelEl.value, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.35, ease: 'power2.in' })
    .to(
      cardEl.value,
      { y: -window.innerHeight * 0.55, scale: 0.7, rotateY: 180, rotateZ: 8, autoAlpha: 0, duration: 0.5, ease: 'power3.in' },
      '<0.05',
    )
    .to([raysEl.value, backdropEl.value, closeBtn.value], { opacity: 0, duration: 0.35, ease: 'power1.in' }, '<0.15')
}

/* ---------- trailblaze ---------- */
async function onTrailblaze() {
  const p = project.value
  if (!p || inFlight.value) return
  scene.pulse('gold')
  await trailblaze(p.trailblaze, p.title, {
    // internal route: dismiss the modal while the overlay hides the screen
    onCovered: p.trailblaze.type === 'internal' ? () => finishClose(false) : undefined,
  })
}

async function openDossier() {
  const p = project.value
  if (!p) return
  await trailblaze({ type: 'internal', route: dossierRoute.value }, p.title, { onCovered: () => finishClose(false) })
}

function goToMilestone() {
  const id = milestone.value?.id
  finishClose(false)
  if (id) {
    requestAnimationFrame(() => {
      document.getElementById(`milestone-${id}`)?.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth', block: 'center' })
      document.getElementById(`milestone-trigger-${id}`)?.click()
    })
  }
}

/* ---------- keyboard: Esc + focus trap ---------- */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    return
  }
  if (e.key !== 'Tab' || !rootEl.value) return
  const focusables = Array.from(
    rootEl.value.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
  ).filter((el) => el.offsetParent !== null)
  if (!focusables.length) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  if (e.shiftKey && (document.activeElement === first || document.activeElement === rootEl.value)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(project, (p, prev) => {
  if (p && p !== prev) void playOpen()
  if (!p) unlockScroll()
})

onUnmounted(() => {
  openTl?.kill()
  closeTl?.kill()
  unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="project"
      ref="rootEl"
      class="hsr-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <div ref="backdropEl" class="hsr-backdrop" @click="close" />
      <div ref="raysEl" class="hsr-rays" aria-hidden="true" />
      <!-- fixed to the viewport so it's always reachable on phones -->
      <button ref="closeBtn" type="button" class="hsr-close" aria-label="Close relic dossier" @click="close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
      </button>

      <div class="hsr-layout" @click.self="close">
        <!-- ============ the dropped card ============ -->
        <div class="hsr-card-col" aria-hidden="true">
          <div ref="shockEl" class="hsr-shock" />
          <div ref="cardEl" class="hsr-card" :class="`tone-${project.accent}`">
            <!-- back: sigil seal -->
            <div class="hsr-face hsr-back hud-cut">
              <svg viewBox="0 0 200 300">
                <rect x="10" y="10" width="180" height="280" class="b-frame" />
                <rect x="18" y="18" width="164" height="264" class="b-frame b-thin" />
                <circle cx="100" cy="150" r="70" class="b-frame" />
                <circle cx="100" cy="150" r="56" class="b-accent" stroke-dasharray="3 5" />
                <path
                  d="M100 80 L114 136 L170 150 L114 164 L100 220 L86 164 L30 150 L86 136 Z"
                  class="b-frame b-fill"
                />
                <path d="M100 118 L108 150 L100 182 L92 150 Z" class="b-gilt" />
                <circle cx="100" cy="150" r="5" class="b-elation" />
                <text x="100" y="268" text-anchor="middle" class="b-text">TRAILBLAZE · ARCHIVE</text>
              </svg>
            </div>

            <!-- front: the relic -->
            <div class="hsr-face hsr-front">
              <div class="front-rim hud-cut" />
              <div class="front-body hud-cut">
                <div class="front-inner ornate-corners">
                  <div class="front-crown">
                    <span class="front-numeral">{{ project.arcana }}</span>
                    <span class="front-line" />
                    <span class="front-cat">{{ project.category }}</span>
                  </div>
                  <div class="front-art">
                    <RelicArt :motif="project.motif" :accent="project.accent" :image-url="project.imageUrl" hero />
                  </div>
                  <div class="front-plate">
                    <span class="front-title">{{ project.title }}</span>
                  </div>
                </div>
                <div ref="sweepEl" class="front-sweep" />
              </div>
            </div>
          </div>
          <p class="hsr-caption">
            <span class="caption-dot" /> Relic {{ project.arcana }} · {{ project.status }}
          </p>
        </div>

        <!-- ============ dossier panel ============ -->
        <div ref="panelEl" class="hsr-panel-wrap">
          <div class="hsr-panel hud-panel hud-cut">

            <header data-stagger>
              <p class="panel-kicker">
                <span class="kicker-numeral">{{ project.arcana }}</span>
                {{ project.category }} · {{ project.year }} ·
                <span :class="project.status === 'Live' ? 'text-gilt' : 'text-mist'">{{ project.status }}</span>
              </p>
              <h2 :id="titleId" class="panel-title">{{ project.title }}</h2>
              <p class="panel-epithet">“{{ project.epithet }}”</p>
            </header>

            <div class="sigil-divider my-5" data-stagger aria-hidden="true">
              <span class="divider-gem" />
            </div>

            <p class="panel-desc" data-stagger>{{ project.description }}</p>

            <div v-if="project.architecture.length || project.highlights.length" class="panel-cols" data-stagger>
              <section v-if="project.architecture.length">
                <h3 class="panel-h3">Architecture</h3>
                <ul class="panel-list">
                  <li v-for="item in project.architecture" :key="item">{{ item }}</li>
                </ul>
              </section>
              <section v-if="project.highlights.length">
                <h3 class="panel-h3">Highlights</h3>
                <ul class="panel-list">
                  <li v-for="item in project.highlights" :key="item">{{ item }}</li>
                </ul>
              </section>
            </div>

            <section v-if="project.techStack.length" data-stagger class="mt-6">
              <h3 class="panel-h3">Tech Stack</h3>
              <ul class="mt-3 flex flex-wrap gap-2" role="list">
                <li v-for="tech in project.techStack" :key="tech" class="chip">{{ tech }}</li>
              </ul>
            </section>

            <button v-if="milestone" type="button" class="panel-milestone" data-stagger @click="goToMilestone">
              <span class="milestone-label">Forged during</span>
              <span class="text-starlight">{{ milestone.organization }}</span>
              <span class="text-mist">— {{ milestone.role }}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>

            <footer class="panel-actions" data-stagger>
              <button
                type="button"
                class="btn-trailblaze"
                :disabled="inFlight"
                :aria-describedby="`${titleId}-hint`"
                @click="onTrailblaze"
              >
                <svg class="tb-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z" />
                </svg>
                Trailblaze
              </button>
              <div class="flex flex-wrap gap-2">
                <button v-if="showDossierLink" type="button" class="btn-ghost" @click="openDossier">Full Dossier</button>
                <a
                  v-if="project.repoUrl"
                  class="btn-ghost"
                  :href="project.repoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source
                </a>
              </div>
              <p :id="`${titleId}-hint`" class="tb-hint">{{ trailblazeHint }}</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hsr-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  outline: none;
}
.hsr-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 55% at 32% 50%, rgba(38, 33, 80, 0.55), transparent 70%),
    rgba(6, 5, 14, 0.86);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.hsr-rays {
  position: absolute;
  left: 30%;
  top: 50%;
  width: min(120vh, 1100px);
  aspect-ratio: 1;
  translate: -50% -50%;
  pointer-events: none;
  opacity: 0;
  background:
    radial-gradient(circle, rgba(255, 209, 102, 0.16) 0%, transparent 42%),
    repeating-conic-gradient(from 0deg, rgba(168, 162, 200, 0.07) 0deg 4deg, transparent 4deg 15deg);
  mask-image: radial-gradient(circle, #000 18%, transparent 62%);
  -webkit-mask-image: radial-gradient(circle, #000 18%, transparent 62%);
  animation: rays-spin 60s linear infinite;
}
@keyframes rays-spin {
  to {
    rotate: 360deg;
  }
}

.hsr-layout {
  position: relative;
  display: grid;
  grid-template-columns: minmax(240px, 0.8fr) minmax(0, 1.2fr);
  /* `safe` keeps tall dossiers scrollable from the top instead of clipping above */
  align-items: safe center;
  gap: clamp(1.5rem, 4vw, 4rem);
  max-width: 1180px;
  height: 100%;
  margin: 0 auto;
  padding: clamp(1rem, 4vh, 3rem) clamp(1rem, 4vw, 3rem);
  overflow-y: auto;
  overscroll-behavior: contain;
}

/* ---------- card ---------- */
.hsr-card-col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.hsr-shock {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 260px;
  height: 260px;
  margin: -130px 0 0 -130px;
  border-radius: 50%;
  border: 2px solid var(--color-gilt);
  box-shadow:
    0 0 30px rgba(255, 209, 102, 0.5),
    inset 0 0 30px rgba(255, 42, 109, 0.35);
  opacity: 0;
  pointer-events: none;
}
.hsr-card {
  --hud-cut: 22px;
  position: relative;
  width: min(330px, 70vw);
  aspect-ratio: 2 / 3;
  transform-style: preserve-3d;
  filter: drop-shadow(0 0 1px rgba(255, 209, 102, 0.8)) drop-shadow(0 0 26px rgba(255, 42, 109, 0.3))
    drop-shadow(0 30px 40px rgba(0, 0, 0, 0.6));
}
.hsr-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.hsr-back {
  transform: rotateY(180deg);
  background:
    radial-gradient(70% 50% at 50% 50%, rgba(58, 51, 102, 0.6), transparent 70%),
    linear-gradient(180deg, var(--color-void-2), var(--color-void));
  border: 1px solid var(--color-frame);
}
.hsr-back svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke-width: 1.2;
}
.b-frame {
  stroke: var(--color-frame);
}
.b-thin {
  stroke-opacity: 0.6;
}
.b-fill {
  fill: rgba(28, 24, 54, 0.8);
}
.b-accent {
  stroke: var(--color-gilt);
}
.b-gilt {
  fill: var(--color-gilt);
}
.b-elation {
  fill: var(--color-elation);
}
.b-text {
  fill: var(--color-mist);
  stroke: none;
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 3px;
}

.front-rim {
  position: absolute;
  inset: 0;
  background: var(--rim);
}
.front-body {
  position: absolute;
  inset: 2px;
  overflow: hidden;
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(58, 51, 102, 0.5), transparent 60%),
    linear-gradient(180deg, #17142e, var(--color-void-2) 45%, var(--color-void));
}
.front-inner {
  position: absolute;
  inset: 10px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(58, 51, 102, 0.8);
}
.front-crown {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1rem 0;
}
.front-numeral {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--color-gilt);
}
.tone-crimson .front-numeral {
  color: var(--color-elation);
}
.front-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--color-frame), transparent);
}
.front-cat {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.front-art {
  flex: 1;
  min-height: 0;
  padding: 0.25rem 0.5rem 0;
}
.front-plate {
  padding: 0.8rem 1rem 1.1rem;
  text-align: center;
  border-top: 1px solid rgba(58, 51, 102, 0.6);
}
.front-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.15rem;
  letter-spacing: 0.08em;
  color: var(--color-starlight);
}
.front-sweep {
  position: absolute;
  inset: -10% -40%;
  background: linear-gradient(105deg, transparent 38%, rgba(255, 240, 210, 0.35) 50%, transparent 62%);
  mix-blend-mode: screen;
  pointer-events: none;
  transform: translateX(-140%);
}
.hsr-caption {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.caption-dot {
  width: 6px;
  height: 6px;
  background: var(--color-elation);
  transform: rotate(45deg);
}

/* ---------- panel ---------- */
.hsr-panel-wrap {
  position: relative;
}
.hsr-panel {
  --hud-cut: 22px;
  position: relative;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  background:
    linear-gradient(var(--color-glass-strong), var(--color-glass-strong)) padding-box,
    linear-gradient(135deg, var(--color-gilt), var(--color-frame) 30%, var(--color-frame) 70%, var(--color-elation))
      border-box;
}
.hsr-close {
  position: fixed;
  top: max(1rem, env(safe-area-inset-top));
  right: max(1rem, env(safe-area-inset-right));
  z-index: 5;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--color-starlight);
  background: rgba(10, 9, 20, 0.85);
  border: 1px solid var(--color-frame);
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}
.hsr-close svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}
.hsr-close:hover {
  color: var(--color-elation);
  border-color: var(--color-elation);
}
.panel-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.kicker-numeral {
  margin-right: 0.4rem;
  padding: 0.15rem 0.5rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: var(--color-gilt);
  border: 1px solid var(--color-gilt);
}
.panel-title {
  margin-top: 0.75rem;
  font-size: clamp(1.8rem, 3.5vw, 2.6rem);
  line-height: 1.05;
}
.panel-epithet {
  margin-top: 0.5rem;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.2rem;
  color: var(--color-mist);
}
.divider-gem {
  width: 8px;
  height: 8px;
  background: var(--color-gilt);
  transform: rotate(45deg);
}
.panel-desc {
  font-size: 0.97rem;
  line-height: 1.75;
  color: var(--color-mist);
}
.panel-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 1.5rem;
}
.panel-h3 {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--color-starlight);
}
.panel-list {
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.55rem;
}
.panel-list li {
  position: relative;
  padding-left: 1.1rem;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-mist);
}
.panel-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 5px;
  height: 5px;
  border: 1px solid var(--color-gilt);
  transform: rotate(45deg);
}
.panel-milestone {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.88rem;
  text-align: left;
  background: rgba(10, 9, 20, 0.5);
  border: 1px solid var(--color-frame);
  cursor: pointer;
  transition: border-color 0.25s;
}
.panel-milestone svg {
  width: 16px;
  height: 16px;
  margin-left: auto;
  fill: none;
  stroke: var(--color-mist);
  stroke-width: 1.6;
}
.panel-milestone:hover {
  border-color: var(--color-gilt);
}
.milestone-label {
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-mist);
  margin-right: 0.3rem;
}
.panel-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}
.tb-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.tb-hint {
  flex-basis: 100%;
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  color: var(--color-mist);
  opacity: 0.8;
}
.btn-trailblaze:disabled {
  opacity: 0.7;
  cursor: progress;
}

@media (max-width: 860px) {
  .hsr-layout {
    grid-template-columns: 1fr;
    align-items: start;
    align-content: start;
    gap: 1.25rem;
    padding: 4.25rem 1rem max(2rem, env(safe-area-inset-bottom));
  }
  .hsr-card {
    --hud-cut: 16px;
    width: min(190px, 48vw);
  }
  .front-cat {
    display: none;
  }
  .front-crown {
    padding: 0.7rem 0.75rem 0;
  }
  .front-plate {
    padding: 0.6rem 0.6rem 0.8rem;
  }
  .front-title {
    font-size: 0.92rem;
    letter-spacing: 0.05em;
  }
  .hsr-panel {
    padding: 1.4rem 1.15rem 1.5rem;
  }
  .panel-actions {
    gap: 0.75rem;
  }
  .panel-actions .btn-trailblaze {
    flex: 1 1 100%;
  }
  .hsr-rays {
    left: 50%;
    top: 26%;
  }
  .panel-cols {
    grid-template-columns: 1fr;
  }
}
</style>
