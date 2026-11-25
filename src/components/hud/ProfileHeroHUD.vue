<script setup lang="ts">
/**
 * ProfileHeroHUD — fixed HUD bar (nav + view toggle) and the hero for Richo Setiawan.
 * The right half of the hero is intentionally left open for the WebGL astrolabe.
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import ViewModeToggle from './ViewModeToggle.vue'
import RelicArt from '@/components/art/RelicArt.vue'
import { projects } from '@/data/projects'
import { careerTimeline } from '@/data/careerTimeline'
import { useGallerySceneControls } from '@/composables/useGalleryScene'
import { useReducedMotion } from '@/composables/useReducedMotion'

const scene = useGallerySceneControls()
const reduced = useReducedMotion()

const navItems = [
  { id: 'projects', label: 'Projects' },
  { id: 'career', label: 'Career 2022–2026' },
  { id: 'contact', label: 'Contact Me' },
] as const

const activeSection = ref<string>('')
const scrolled = ref(false)
const menuOpen = ref(false)

const fif = careerTimeline.find((m) => m.id === 'fifgroup')!
const ukrida = careerTimeline.find((m) => m.id === 'ukrida')!
const bca = careerTimeline.find((m) => m.id === 'bca')!

const readouts = computed(() => [
  { label: 'Current Path', value: fif.role.replace(' (MT)', ''), meta: `${fif.organization} · ${fif.startYear}–Present`, tone: 'gilt' },
  { label: 'Origin', value: 'Information Systems', meta: `${ukrida.organization} · ${ukrida.startYear}–${ukrida.endYear}`, tone: 'mist' },
  { label: 'Previous Station', value: bca.role, meta: `${bca.organization} · ${bca.startYear}–${bca.endYear}`, tone: 'mist' },
  { label: 'Relics Archived', value: String(projects.length).padStart(2, '0'), meta: 'Projects in the gallery', tone: 'elation' },
])

function scrollToSection(id: string) {
  menuOpen.value = false
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth', block: 'start' })
  history.replaceState(history.state, '', `#${id}`)
}

/* ---------- scroll state & active section ---------- */
let io: IntersectionObserver | null = null
function onScroll() {
  scrolled.value = window.scrollY > 24
}

const heroEl = ref<HTMLElement | null>(null)

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) activeSection.value = e.target.id
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  navItems.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) io!.observe(el)
  })

  // Hero entrance
  if (!reduced.value && heroEl.value) {
    gsap.from(heroEl.value.querySelectorAll('[data-hero]'), {
      autoAlpha: 0,
      y: 30,
      duration: 1,
      stagger: 0.09,
      ease: 'power3.out',
      delay: 0.15,
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  io?.disconnect()
  if (heroEl.value) gsap.killTweensOf(heroEl.value.querySelectorAll('[data-hero]'))
})
</script>

<template>
  <!-- ================= HUD BAR ================= -->
  <header class="hud-bar" :class="{ 'is-scrolled': scrolled }">
    <div class="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
      <a href="#top" class="hud-brand" aria-label="Richo Setiawan — back to top" @click.prevent="scrollToSection('top')">
        <span class="brand-sigil" aria-hidden="true">
          <svg viewBox="0 0 40 40">
            <path d="M20 2 38 20 20 38 2 20Z" class="sig-frame" />
            <path d="M20 8 32 20 20 32 8 20Z" class="sig-gilt" />
          </svg>
          <span class="brand-mono">RS</span>
        </span>
        <span class="hidden flex-col leading-tight sm:flex">
          <span class="font-display text-sm tracking-[0.18em] text-starlight">RICHO SETIAWAN</span>
          <span class="font-mono text-[0.6rem] tracking-[0.3em] text-mist uppercase">Trailblaze Archive</span>
        </span>
      </a>

      <nav class="hidden md:block" aria-label="Primary">
        <ul class="flex items-center gap-1" role="list">
          <li v-for="item in navItems" :key="item.id">
            <a
              :href="`#${item.id}`"
              class="hud-link"
              :class="{ 'is-active': activeSection === item.id }"
              :aria-current="activeSection === item.id ? 'location' : undefined"
              @click.prevent="scrollToSection(item.id)"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-2">
        <span class="hidden sm:inline-flex"><ViewModeToggle /></span>
        <span class="inline-flex sm:hidden"><ViewModeToggle compact /></span>
        <button
          type="button"
          class="hud-menu"
          :aria-expanded="menuOpen"
          aria-controls="hud-mobile-nav"
          aria-label="Toggle navigation menu"
          @click="menuOpen = !menuOpen"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path v-if="!menuOpen" d="M4 7h16M4 12h16M4 17h10" />
            <path v-else d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </div>

    <Transition name="drop">
      <nav v-if="menuOpen" id="hud-mobile-nav" class="hud-mobile glass-panel" aria-label="Primary mobile">
        <a
          v-for="item in navItems"
          :key="item.id"
          :href="`#${item.id}`"
          class="hud-mobile-link"
          @click.prevent="scrollToSection(item.id)"
        >
          <span class="mobile-gem" aria-hidden="true" />
          {{ item.label }}
        </a>
      </nav>
    </Transition>
  </header>

  <!-- ================= HERO ================= -->
  <section id="top" ref="heroEl" class="hero" aria-labelledby="hero-name">
    <div class="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <p class="section-kicker" data-hero>Trailblazer Profile · 2022 — 2026</p>

        <h1 id="hero-name" class="hero-name" data-hero>
          <span class="block">Richo</span>
          <span class="block hero-name-2">Setiawan</span>
        </h1>

        <div class="hero-roles" data-hero>
          <p>
            <span class="role-gem gem-elation" aria-hidden="true" />
            <span class="text-starlight">Management Trainee</span>
            <span class="text-mist">at</span>
            <span class="text-starlight">FIFGROUP</span>
          </p>
          <p>
            <span class="role-gem gem-gilt" aria-hidden="true" />
            <span class="text-starlight">Information Systems</span>
            <span class="text-mist">·</span>
            <span class="text-mist sm:hidden">UKRIDA</span>
            <span class="hidden text-mist sm:inline">Universitas Kristen Krida Wacana (UKRIDA)</span>
          </p>
        </div>

        <p class="hero-bio" data-hero>
          From Sistem Informasi at UKRIDA, through an Application Developer internship at BCA, to the Management
          Trainee path at FIFGROUP — this archive collects the projects forged along the way.
        </p>

        <div class="mt-8 flex flex-wrap gap-3" data-hero>
          <a href="#projects" class="btn-ghost enter-btn" @click.prevent="scrollToSection('projects')">
            <span class="enter-gem" aria-hidden="true" />
            Enter the Archive
          </a>
          <a href="#contact" class="btn-ghost" @click.prevent="scrollToSection('contact')">Contact Me</a>
        </div>
      </div>

      <!-- Static astrolabe only when WebGL is unavailable; otherwise the canvas fills this space -->
      <div v-if="!scene.webglAvailable.value" class="hero-fallback-art hidden lg:block" aria-hidden="true">
        <RelicArt motif="astrolabe" accent="gold" hero />
      </div>
    </div>

    <!-- HUD readouts -->
    <div class="mx-auto mt-12 w-full max-w-7xl px-4 sm:px-8">
      <dl class="readouts" data-hero>
        <div v-for="r in readouts" :key="r.label" class="readout hud-panel hud-cut-sm">
          <dt class="readout-label">
            <span class="readout-dot" :class="`dot-${r.tone}`" aria-hidden="true" />
            {{ r.label }}
          </dt>
          <dd class="readout-value">{{ r.value }}</dd>
          <dd class="readout-meta">{{ r.meta }}</dd>
        </div>
      </dl>
    </div>

    <a href="#projects" class="scroll-cue" aria-label="Scroll to projects" @click.prevent="scrollToSection('projects')">
      <span>Scroll</span>
      <span class="scroll-line" aria-hidden="true" />
    </a>
  </section>
</template>

<style scoped>
/* ---------- HUD bar ---------- */
.hud-bar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: var(--hud-height);
  border-bottom: 1px solid transparent;
  transition:
    background 0.35s,
    border-color 0.35s,
    backdrop-filter 0.35s;
}
.hud-bar.is-scrolled {
  background: rgba(10, 9, 20, 0.72);
  border-bottom-color: rgba(58, 51, 102, 0.7);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
.hud-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}
.brand-sigil {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
}
.brand-sigil svg {
  position: absolute;
  inset: 0;
  fill: none;
  stroke-width: 1.2;
}
.sig-frame {
  stroke: var(--color-frame);
  fill: rgba(18, 16, 36, 0.8);
}
.sig-gilt {
  stroke: var(--color-gilt);
}
.brand-mono {
  position: relative;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  color: var(--color-starlight);
}
.hud-link {
  position: relative;
  display: inline-block;
  padding: 0.55rem 0.9rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-mist);
  text-decoration: none;
  transition: color 0.25s;
}
.hud-link::after {
  content: '';
  position: absolute;
  left: 0.9rem;
  right: 0.9rem;
  bottom: 0.2rem;
  height: 1px;
  background: var(--color-gilt);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease-theatre);
}
.hud-link:hover,
.hud-link.is-active {
  color: var(--color-starlight);
}
.hud-link:hover::after,
.hud-link.is-active::after {
  transform: scaleX(1);
}
.hud-menu {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--color-starlight);
  background: var(--color-glass);
  border: 1px solid var(--color-frame);
}
.hud-menu svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
}
.hud-mobile {
  position: absolute;
  top: calc(var(--hud-height) - 4px);
  left: 1rem;
  right: 1rem;
  display: grid;
  padding: 0.5rem;
}
.hud-mobile-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-starlight);
  text-decoration: none;
  border-bottom: 1px solid rgba(58, 51, 102, 0.5);
}
.hud-mobile-link:last-child {
  border-bottom: 0;
}
.mobile-gem {
  width: 6px;
  height: 6px;
  border: 1px solid var(--color-gilt);
  transform: rotate(45deg);
}
.drop-enter-active,
.drop-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s var(--ease-theatre);
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---------- hero ---------- */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100svh;
  padding: calc(var(--hud-height) + 3rem) 0 6rem;
}
.hero-name {
  margin-top: 1.25rem;
  font-size: clamp(3rem, 9vw, 6.75rem);
  font-weight: 600;
  line-height: 0.95;
  letter-spacing: 0.06em;
  text-shadow: 0 0 40px rgba(58, 51, 102, 0.8);
}
.hero-name-2 {
  position: relative;
  display: inline-block;
  padding-bottom: 0.15em;
}
.hero-name-2::after {
  content: '';
  position: absolute;
  left: 0.05em;
  bottom: 0;
  width: 46%;
  height: 2px;
  background: linear-gradient(90deg, var(--color-gilt), var(--color-elation) 60%, transparent);
}
.hero-roles {
  display: grid;
  gap: 0.5rem;
  margin-top: 1.75rem;
  font-size: clamp(1rem, 1.6vw, 1.15rem);
}
.hero-roles p {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.role-gem {
  width: 7px;
  height: 7px;
  transform: rotate(45deg);
  flex-shrink: 0;
}
.gem-elation {
  background: var(--color-elation);
}
.gem-gilt {
  background: var(--color-gilt);
}
.hero-bio {
  max-width: 36rem;
  margin-top: 1.5rem;
  font-size: 0.98rem;
  line-height: 1.75;
  color: var(--color-mist);
}
.enter-btn {
  border-color: rgba(255, 209, 102, 0.55);
}
.enter-gem {
  width: 6px;
  height: 6px;
  background: var(--color-gilt);
  transform: rotate(45deg);
}
.hero-fallback-art {
  width: min(420px, 100%);
  aspect-ratio: 5 / 7;
  justify-self: center;
  opacity: 0.85;
}

/* ---------- readouts ---------- */
.readouts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
  margin: 0;
}
.readout {
  --hud-cut-sm: 10px;
  padding: 1rem 1.1rem;
}
.readout-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.readout-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot-gilt {
  background: var(--color-gilt);
  box-shadow: 0 0 8px var(--color-gilt);
}
.dot-elation {
  background: var(--color-elation);
  box-shadow: 0 0 8px var(--color-elation);
}
.dot-mist {
  background: var(--color-mist);
}
.readout-value {
  margin: 0.55rem 0 0;
  font-family: var(--font-display);
  font-size: 1.02rem;
  letter-spacing: 0.04em;
  color: var(--color-starlight);
}
.readout-meta {
  margin: 0.2rem 0 0;
  font-size: 0.8rem;
  color: var(--color-mist);
}

.scroll-cue {
  position: absolute;
  left: 50%;
  bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  translate: -50% 0;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--color-mist);
  text-decoration: none;
}
.scroll-line {
  position: relative;
  width: 1px;
  height: 38px;
  overflow: hidden;
  background: rgba(58, 51, 102, 0.8);
}
.scroll-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: -40%;
  width: 1px;
  height: 40%;
  background: var(--color-gilt);
  animation: scroll-drip 2.2s var(--ease-theatre) infinite;
}
@keyframes scroll-drip {
  to {
    top: 100%;
  }
}

@media (max-width: 639px) {
  .scroll-cue {
    display: none;
  }
}
@media (min-width: 768px) {
  .hud-menu,
  .hud-mobile {
    display: none;
  }
}
</style>
