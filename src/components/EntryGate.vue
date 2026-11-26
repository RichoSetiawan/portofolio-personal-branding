<script setup lang="ts">
/**
 * EntryGate — "Begin Trailblaze" intro screen.
 * When it shows is set by `entryGate` in src/data/backgroundMusic.ts: 'always' means every page
 * load, 'when-blocked' means only when the browser blocks sound. Its click is the interaction
 * browsers require before sound, so the music starts the moment the site opens.
 * Clicking anywhere enters with music; "Enter without sound" (or Escape) enters silently.
 */
import { nextTick, onUnmounted, watch, useTemplateRef } from 'vue'
import { useBackgroundMusic } from '@/composables/useBackgroundMusic'

const { gate, current, available, enter } = useBackgroundMusic()
const beginBtn = useTemplateRef<HTMLButtonElement>('beginBtn')
const silentBtn = useTemplateRef<HTMLButtonElement>('silentBtn')

const ticks = Array.from({ length: 12 }, (_, i) => i * 30)

watch(
  () => gate.value === 'open',
  async (open) => {
    document.documentElement.classList.toggle('gate-locked', open)
    if (!open) return
    await nextTick()
    beginBtn.value?.focus({ preventScroll: true })
  },
  { immediate: true },
)
onUnmounted(() => document.documentElement.classList.remove('gate-locked'))

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    enter(false)
  } else if (e.key === 'Tab') {
    // keep focus on the gate's two buttons
    e.preventDefault()
    const next = document.activeElement === beginBtn.value ? silentBtn.value : beginBtn.value
    next?.focus()
  }
}
</script>

<template>
  <Transition name="gate-fade">
    <div
      v-if="gate === 'open'"
      class="entry-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      aria-describedby="gate-desc"
      data-music-toggle
      @click="enter(true)"
      @keydown="onKeydown"
    >
      <div class="gate-veil" aria-hidden="true" />

      <div class="gate-inner">
        <div class="gate-sigil" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <g class="spin">
              <circle class="ring" cx="100" cy="100" r="92" />
              <line
                v-for="deg in ticks"
                :key="deg"
                class="tick"
                x1="100"
                y1="6"
                x2="100"
                :y2="deg % 90 === 0 ? 20 : 14"
                :transform="`rotate(${deg} 100 100)`"
              />
            </g>
            <circle class="ring dashed spin-back" cx="100" cy="100" r="72" />
            <path class="star" d="M100 52 109 91 148 100 109 109 100 148 91 109 52 100 91 91Z" />
            <circle class="core" cx="100" cy="100" r="5" />
          </svg>
        </div>

        <p class="section-kicker justify-center">Trailblaze Archive</p>
        <h2 id="gate-title" class="section-title gate-title">Richo Setiawan</h2>
        <p id="gate-desc" class="gate-line">The Archive awaits, Trailblazer.</p>

        <button ref="beginBtn" type="button" class="btn-trailblaze gate-begin" @click.stop="enter(true)">
          <svg class="gate-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5Z" />
          </svg>
          Begin Trailblaze
        </button>

        <p v-if="available" class="gate-now">
          <span class="gate-eq" aria-hidden="true"><i /><i /><i /></span>
          Sound on<template v-if="current"> · {{ current.title }} — {{ current.artist }}</template>
        </p>

        <button v-if="available" ref="silentBtn" type="button" class="gate-silent" @click.stop="enter(false)">
          Enter without sound
        </button>
      </div>

      <p class="gate-tap" aria-hidden="true">
        <span class="on-touch">Tap</span><span class="on-mouse">Click</span> anywhere to begin
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.entry-gate {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1.5rem 1rem calc(4.5rem + env(safe-area-inset-bottom));
  text-align: center;
  color: var(--color-starlight);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.gate-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(55% 45% at 50% 45%, rgba(18, 16, 36, 0.5), rgba(10, 9, 20, 0.94) 78%),
    rgba(10, 9, 20, 0.3);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}
.gate-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 32rem;
}

/* ---------- sigil ---------- */
.gate-sigil {
  width: clamp(116px, 30vw, 172px);
  aspect-ratio: 1;
  margin-bottom: 1.6rem;
  filter: drop-shadow(0 0 18px rgba(255, 209, 102, 0.25));
}
.gate-sigil svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.ring {
  fill: none;
  stroke: var(--color-frame);
  stroke-width: 1.2;
}
.ring.dashed {
  stroke: var(--color-gilt);
  stroke-opacity: 0.55;
  stroke-dasharray: 2 7;
}
.tick {
  stroke: var(--color-gilt);
  stroke-width: 1.4;
  stroke-opacity: 0.8;
}
.star {
  fill: var(--color-gilt);
  animation: gate-breathe 3.2s ease-in-out infinite;
  transform-origin: 100px 100px;
}
.core {
  fill: var(--color-elation);
}
.spin,
.spin-back {
  transform-origin: 100px 100px;
  animation: gate-spin 48s linear infinite;
}
.spin-back {
  animation-duration: 30s;
  animation-direction: reverse;
}

/* ---------- type ---------- */
.gate-title {
  margin-top: 0.9rem;
  font-size: clamp(2rem, 7vw, 3.4rem);
}
.gate-line {
  margin-top: 0.6rem;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(1.05rem, 3.6vw, 1.3rem);
  color: var(--color-mist);
}
.gate-begin {
  margin-top: 2.2rem;
}
.gate-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}
.gate-now {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.4rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.gate-eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  height: 11px;
}
.gate-eq i {
  width: 2px;
  height: 100%;
  background: var(--color-gilt);
  transform-origin: bottom;
  animation: gate-eq 1.1s ease-in-out infinite;
}
.gate-eq i:nth-child(2) {
  animation-delay: -0.35s;
  background: var(--color-elation);
}
.gate-eq i:nth-child(3) {
  animation-delay: -0.7s;
}
.gate-silent {
  margin-top: 0.9rem;
  padding: 0.5rem 0.75rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  color: var(--color-mist);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(168, 162, 200, 0.4);
  text-underline-offset: 4px;
  transition: color 0.2s;
}
.gate-silent:hover,
.gate-silent:focus-visible {
  color: var(--color-starlight);
  text-decoration-color: var(--color-gilt);
}
.gate-tap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(1.75rem + env(safe-area-inset-bottom));
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: var(--color-mist);
  animation: gate-blink 2.4s ease-in-out infinite;
}
.on-mouse {
  display: none;
}
@media (hover: hover) and (pointer: fine) {
  .on-touch {
    display: none;
  }
  .on-mouse {
    display: inline;
  }
}

/* ---------- enter / leave ---------- */
.gate-fade-enter-active {
  transition: opacity 0.6s ease;
}
.gate-fade-enter-active .gate-inner {
  transition:
    opacity 0.9s 0.1s ease,
    transform 0.9s 0.1s var(--ease-theatre);
}
.gate-fade-leave-active {
  transition: opacity 0.9s ease 0.15s;
}
.gate-fade-leave-active .gate-inner {
  transition:
    opacity 0.5s ease,
    transform 0.7s var(--ease-theatre);
}
.gate-fade-enter-from,
.gate-fade-leave-to {
  opacity: 0;
}
.gate-fade-enter-from .gate-inner {
  opacity: 0;
  transform: translateY(14px);
}
.gate-fade-leave-to .gate-inner {
  opacity: 0;
  transform: scale(1.06);
}

@keyframes gate-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes gate-breathe {
  50% {
    transform: scale(0.9);
    opacity: 0.8;
  }
}
@keyframes gate-blink {
  50% {
    opacity: 0.35;
  }
}
@keyframes gate-eq {
  0%,
  100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin,
  .spin-back,
  .star,
  .gate-tap,
  .gate-eq i {
    animation: none;
  }
  .gate-fade-enter-from .gate-inner,
  .gate-fade-leave-to .gate-inner {
    transform: none;
  }
}
</style>

<style>
/* page stays put behind the gate */
html.gate-locked {
  overflow: hidden;
}
</style>
