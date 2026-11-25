<script setup lang="ts">
/**
 * Full-screen theatrical wipe used by the "Trailblaze" CTA.
 * Registers its play-in/out API with `useTrailblaze` on mount.
 */
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { registerTrailblazeOverlay } from '@/composables/useTrailblaze'
import { useReducedMotion } from '@/composables/useReducedMotion'

const reduced = useReducedMotion()
const visible = ref(false)
const label = ref('')
const announce = ref('')

const rootEl = ref<HTMLElement | null>(null)
const panelA = ref<HTMLElement | null>(null)
const panelB = ref<HTMLElement | null>(null)
const slashEl = ref<HTMLElement | null>(null)
const centerEl = ref<HTMLElement | null>(null)

let tl: gsap.core.Timeline | null = null

function run(build: (t: gsap.core.Timeline) => void): Promise<void> {
  return new Promise((resolve) => {
    tl?.kill()
    tl = gsap.timeline({ onComplete: resolve, onInterrupt: resolve })
    build(tl)
  })
}

async function playIn(text: string) {
  label.value = text
  announce.value = `Trailblazing to ${text}`
  visible.value = true
  await nextTick()
  if (reduced.value) {
    return run((t) => t.fromTo(rootEl.value, { opacity: 0 }, { opacity: 1, duration: 0.2 }))
  }
  return run((t) =>
    t
      .set(rootEl.value, { opacity: 1 })
      .fromTo(panelA.value, { xPercent: -110 }, { xPercent: 0, duration: 0.45, ease: 'power4.inOut' }, 0)
      .fromTo(panelB.value, { xPercent: 110 }, { xPercent: 0, duration: 0.45, ease: 'power4.inOut' }, 0.04)
      .fromTo(slashEl.value, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.35, ease: 'expo.out' }, 0.25)
      .fromTo(
        centerEl.value,
        { autoAlpha: 0, scale: 0.85, filter: 'blur(6px)' },
        { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' },
        0.28,
      ),
  )
}

async function playOut() {
  if (reduced.value) {
    await run((t) => t.to(rootEl.value, { opacity: 0, duration: 0.25 }))
  } else {
    await run((t) =>
      t
        .to(centerEl.value, { autoAlpha: 0, scale: 1.08, duration: 0.25, ease: 'power2.in' }, 0.1)
        .to(slashEl.value, { opacity: 0, duration: 0.2 }, 0.1)
        .to(panelA.value, { xPercent: 110, duration: 0.55, ease: 'power4.inOut' }, 0.2)
        .to(panelB.value, { xPercent: -110, duration: 0.55, ease: 'power4.inOut' }, 0.24),
    )
  }
  visible.value = false
}

onMounted(() => registerTrailblazeOverlay({ playIn, playOut }))
onUnmounted(() => {
  registerTrailblazeOverlay(null)
  tl?.kill()
})
</script>

<template>
  <div v-show="visible" ref="rootEl" class="tb-overlay" aria-hidden="true">
    <div ref="panelA" class="tb-panel tb-panel-a" />
    <div ref="panelB" class="tb-panel tb-panel-b" />
    <div ref="slashEl" class="tb-slash" />
    <div ref="centerEl" class="tb-center">
      <svg class="tb-sigil" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" class="s-frame" />
        <circle cx="50" cy="50" r="36" class="s-gilt" stroke-dasharray="2 4" />
        <path d="M50 14 L56 44 L86 50 L56 56 L50 86 L44 56 L14 50 L44 44 Z" class="f-elation" />
        <circle cx="50" cy="50" r="4" class="f-gilt" />
      </svg>
      <p class="tb-kicker">Trailblazing</p>
      <p class="tb-label">{{ label }}</p>
    </div>
  </div>
  <p class="sr-only" aria-live="assertive">{{ announce }}</p>
</template>

<style scoped>
.tb-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  overflow: hidden;
  pointer-events: all;
}
.tb-panel {
  position: absolute;
  top: -10%;
  bottom: -10%;
  width: 62%;
  background:
    repeating-linear-gradient(90deg, rgba(58, 51, 102, 0.18) 0 1px, transparent 1px 48px),
    linear-gradient(180deg, var(--color-void-2), var(--color-void));
}
.tb-panel-a {
  left: -6%;
  transform: skewX(-12deg);
  border-right: 2px solid var(--color-gilt);
}
.tb-panel-b {
  right: -6%;
  transform: skewX(-12deg);
  border-left: 2px solid var(--color-elation);
}
.tb-slash {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px;
  margin-top: 64px;
  background: linear-gradient(90deg, transparent, var(--color-elation) 30%, var(--color-gilt) 70%, transparent);
  transform-origin: 0 50%;
  box-shadow: 0 0 18px rgba(255, 42, 109, 0.6);
}
.tb-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  padding: 0 1rem;
}
.tb-sigil {
  width: 84px;
  height: 84px;
  fill: none;
  stroke-width: 1.2;
  animation: sigil-spin 3s linear infinite;
}
.s-frame {
  stroke: var(--color-frame);
}
.s-gilt {
  stroke: var(--color-gilt);
}
.f-elation {
  fill: var(--color-elation);
}
.f-gilt {
  fill: var(--color-gilt);
}
.tb-kicker {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.tb-label {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.4rem);
  letter-spacing: 0.1em;
  color: var(--color-starlight);
}
@keyframes sigil-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
