<script setup lang="ts">
/**
 * ProjectRelicCard — the unclicked tarot/arcana relic.
 * Minimal front labels; the emblem carries the identity.
 * Hover: pointer-driven tilt, crimson-gold rim, light sweep, "Unveil" cue.
 */
import { ref } from 'vue'
import RelicArt from '@/components/art/RelicArt.vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import type { Project } from '@/types/portfolio'

const props = withDefaults(
  defineProps<{
    project: Project
    /** Active (centred) card in 3D Stage mode. */
    active?: boolean
    /** Disable tilt (e.g. side cards on the stage). */
    still?: boolean
    tabbable?: boolean
  }>(),
  { active: false, still: false, tabbable: true },
)

const emit = defineEmits<{ select: [el: HTMLElement] }>()

const cardEl = ref<HTMLButtonElement | null>(null)
const reduced = useReducedMotion()
let raf = 0

function onPointerMove(e: PointerEvent) {
  if (props.still || reduced.value || e.pointerType === 'touch') return
  const el = cardEl.value
  if (!el) return
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.setProperty('--rx', x.toFixed(3))
    el.style.setProperty('--ry', y.toFixed(3))
    el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
  })
}

function onPointerLeave() {
  cancelAnimationFrame(raf)
  const el = cardEl.value
  if (!el) return
  el.style.setProperty('--rx', '0')
  el.style.setProperty('--ry', '0')
}

function onClick() {
  if (cardEl.value) emit('select', cardEl.value)
}

defineExpose({ el: cardEl })
</script>

<template>
  <button
    ref="cardEl"
    type="button"
    class="relic-card"
    :class="[`tone-${project.accent}`, { 'is-active': active }]"
    :tabindex="tabbable ? 0 : -1"
    :aria-label="`Unveil relic ${project.arcana}: ${project.title} — ${project.category}`"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @click="onClick"
  >
    <span class="relic-rim hud-cut" aria-hidden="true" />
    <span class="relic-body hud-cut" aria-hidden="true">
      <span class="relic-inner ornate-corners">
        <span class="relic-crown">
          <span class="relic-numeral">{{ project.arcana }}</span>
          <span class="relic-crown-line" />
          <span class="relic-category">{{ project.category }}</span>
        </span>

        <span class="relic-art-wrap">
          <RelicArt :motif="project.motif" :accent="project.accent" :image-url="project.imageUrl" />
        </span>

        <span class="relic-plate">
          <span class="relic-title">{{ project.title }}</span>
          <span class="relic-epithet">{{ project.epithet }}</span>
        </span>
      </span>

      <span class="relic-sweep" />
      <span class="relic-cue">
        <span class="cue-diamond" />
        Unveil
      </span>
    </span>
  </button>
</template>

<style scoped>
.relic-card {
  --rx: 0;
  --ry: 0;
  --mx: 50%;
  --my: 30%;
  --hud-cut: 18px;
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 5 / 7.6;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  text-align: center;
  cursor: pointer;
  transform: perspective(900px) rotateX(calc(var(--ry) * -9deg)) rotateY(calc(var(--rx) * 11deg));
  transform-style: preserve-3d;
  transition:
    transform 0.5s var(--ease-theatre),
    filter 0.5s var(--ease-theatre);
  filter: drop-shadow(0 18px 30px rgba(5, 4, 12, 0.6));
  -webkit-tap-highlight-color: transparent;
}
.relic-card:hover {
  transition:
    transform 0.12s linear,
    filter 0.5s var(--ease-theatre);
}
.relic-card:focus-visible {
  outline: none;
}

/* ---------- frame layers ---------- */
.relic-rim {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, var(--color-frame), rgba(58, 51, 102, 0.45) 50%, var(--color-frame));
  transition: opacity 0.4s;
}
.relic-rim::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--rim);
  opacity: 0;
  transition: opacity 0.45s var(--ease-theatre);
}
.relic-body {
  position: absolute;
  inset: 1.5px;
  overflow: hidden;
  background:
    radial-gradient(120% 70% at 50% 0%, rgba(58, 51, 102, 0.45), transparent 60%),
    linear-gradient(180deg, #17142e 0%, var(--color-void-2) 45%, var(--color-void) 100%);
}
.relic-inner {
  position: absolute;
  inset: 8px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(58, 51, 102, 0.75);
}

/* ---------- crown ---------- */
.relic-crown {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem 0;
}
.relic-numeral {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--color-gilt);
  letter-spacing: 0.1em;
}
.tone-crimson .relic-numeral {
  color: var(--color-elation);
}
.relic-crown-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--color-frame), transparent);
}
.relic-category {
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--color-mist);
  white-space: nowrap;
}

/* ---------- art ---------- */
.relic-art-wrap {
  flex: 1;
  min-height: 0;
  display: block;
  padding: 0.25rem 0.5rem 0;
  transform: translateZ(30px);
}

/* ---------- plate ---------- */
.relic-plate {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.7rem 0.9rem 1rem;
  border-top: 1px solid rgba(58, 51, 102, 0.6);
  background: linear-gradient(180deg, rgba(18, 16, 36, 0.2), rgba(10, 9, 20, 0.85));
}
.relic-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(0.95rem, 1.6vw, 1.15rem);
  letter-spacing: 0.08em;
  color: var(--color-starlight);
}
.relic-epithet {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.92rem;
  color: var(--color-mist);
  line-height: 1.25;
}

/* ---------- light sweep + cue ---------- */
.relic-sweep {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(260px circle at var(--mx) var(--my), rgba(255, 209, 102, 0.16), transparent 55%),
    linear-gradient(115deg, transparent 35%, rgba(244, 242, 255, 0.12) 48%, transparent 60%);
  background-size:
    100% 100%,
    250% 100%;
  background-position:
    0 0,
    150% 0;
  opacity: 0;
  mix-blend-mode: screen;
  transition:
    opacity 0.4s,
    background-position 0.9s var(--ease-theatre);
}
.relic-cue {
  position: absolute;
  left: 50%;
  bottom: 5.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.3rem 0.7rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--color-starlight);
  background: rgba(10, 9, 20, 0.78);
  border: 1px solid var(--color-gilt);
  transform: translate(-50%, 6px);
  opacity: 0;
  transition:
    opacity 0.35s,
    transform 0.35s var(--ease-theatre);
}
.cue-diamond {
  width: 6px;
  height: 6px;
  background: var(--color-elation);
  transform: rotate(45deg);
}

/* ---------- hover / focus / active ---------- */
.relic-card:hover,
.relic-card:focus-visible,
.relic-card.is-active {
  filter: drop-shadow(0 0 1px rgba(255, 209, 102, 0.7)) drop-shadow(0 0 18px rgba(255, 42, 109, 0.32))
    drop-shadow(0 22px 34px rgba(5, 4, 12, 0.7));
}
.relic-card:hover .relic-rim::after,
.relic-card:focus-visible .relic-rim::after,
.relic-card.is-active .relic-rim::after {
  opacity: 1;
}
.relic-card:hover .relic-sweep,
.relic-card:focus-visible .relic-sweep {
  opacity: 1;
  background-position:
    0 0,
    -50% 0;
}
.relic-card:hover .relic-cue,
.relic-card:focus-visible .relic-cue {
  opacity: 1;
  transform: translate(-50%, 0);
}
.relic-card:hover :deep(.emblem),
.relic-card:focus-visible :deep(.emblem),
.relic-card.is-active :deep(.emblem) {
  transform: scale(1.05);
  filter: drop-shadow(0 0 6px color-mix(in srgb, var(--relic-accent) 55%, transparent));
}
</style>
