<script setup lang="ts">
/**
 * CareerTimelineSection — 2022–2026 chronicle.
 * Desktop: year axis with span bars per milestone (UKRIDA, BCA, FIFGROUP).
 * Mobile: stacked milestone cards on a vertical connector.
 * Hover previews, click/arrow keys select (ARIA tabs); the panel lists domain focus,
 * highlights and connected relics that open the HSR card modal.
 */
import { computed, nextTick, ref } from 'vue'
import RelicArt from '@/components/art/RelicArt.vue'
import { careerTimeline, TIMELINE_END, TIMELINE_START } from '@/data/careerTimeline'
import { projectsForMilestone } from '@/data/projects'
import { useProjectModal } from '@/composables/useProjectModal'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { vReveal } from '@/directives/reveal'
import type { CareerId, CareerMilestone } from '@/types/portfolio'

const { openProject } = useProjectModal()
const reduced = useReducedMotion()

const selectedId = ref<CareerId>('fifgroup')
const hoveredId = ref<CareerId | null>(null)
const panelEl = ref<HTMLElement | null>(null)

const selected = computed(() => careerTimeline.find((m) => m.id === selectedId.value)!)
const connected = computed(() => projectsForMilestone(selected.value))

/** Columns = each year in range, inclusive. */
const years = Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => TIMELINE_START + i)
const span = years.length

function barStyle(m: CareerMilestone) {
  const end = (m.endYear ?? TIMELINE_END) + 1
  const left = ((m.startYear - TIMELINE_START) / span) * 100
  const width = ((end - m.startYear) / span) * 100
  return { left: `${left}%`, width: `${width}%` }
}

const periodLabel = (m: CareerMilestone) => `${m.startYear} — ${m.endYear ?? 'Present'}`

/** Bars covering < 30% of the axis show the period under the org instead of the role. */
const isNarrow = (m: CareerMilestone) => ((m.endYear ?? TIMELINE_END) + 1 - m.startYear) / span < 0.3

async function select(id: CareerId, scroll = false) {
  selectedId.value = id
  if (scroll && window.innerWidth < 900) {
    await nextTick()
    panelEl.value?.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth', block: 'nearest' })
  }
}

function onTabKey(e: KeyboardEvent, index: number) {
  const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  let next: number | null = null
  if (e.key in keys) next = (index + keys[e.key]! + careerTimeline.length) % careerTimeline.length
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = careerTimeline.length - 1
  if (next === null) return
  e.preventDefault()
  const m = careerTimeline[next]!
  void select(m.id)
  document.getElementById(`milestone-trigger-${m.id}`)?.focus()
}
</script>

<template>
  <section id="career" class="career-section" aria-labelledby="career-title">
    <div class="mx-auto max-w-7xl px-4 sm:px-8">
      <header v-reveal class="max-w-2xl">
        <p class="section-kicker">Chronicle · {{ TIMELINE_START }} — {{ TIMELINE_END }}</p>
        <h2 id="career-title" class="section-title mt-3">Career &amp; Education Journey</h2>
        <p class="mt-4 text-[0.98rem] leading-relaxed text-mist">
          Three stations on the trailblaze. Hover to preview, select to inspect the domain focus and the relics forged
          there.
        </p>
      </header>

      <!-- ================= chronicle ================= -->
      <div v-reveal="0.1" class="chronicle hud-panel hud-cut">
        <!-- year ruler (desktop) -->
        <div class="ruler" aria-hidden="true">
          <div v-for="y in years" :key="y" class="ruler-year">
            <span>{{ y }}</span>
          </div>
          <div class="ruler-present">Present ▸</div>
        </div>

        <div class="lanes" role="tablist" aria-label="Career milestones" aria-orientation="vertical">
          <div
            v-for="(m, i) in careerTimeline"
            :id="`milestone-${m.id}`"
            :key="m.id"
            class="lane"
            :class="[
              `tone-${m.accent}`,
              { 'is-selected': selectedId === m.id, 'is-hovered': hoveredId === m.id, 'is-narrow': isNarrow(m) },
            ]"
          >
            <!-- grid guides -->
            <div class="lane-guides" aria-hidden="true">
              <span v-for="y in years" :key="y" />
            </div>

            <button
              :id="`milestone-trigger-${m.id}`"
              type="button"
              role="tab"
              class="lane-bar"
              :style="barStyle(m)"
              :aria-selected="selectedId === m.id"
              aria-controls="milestone-panel"
              :tabindex="selectedId === m.id ? 0 : -1"
              @click="select(m.id, true)"
              @keydown="onTabKey($event, i)"
              @mouseenter="hoveredId = m.id"
              @mouseleave="hoveredId = null"
              @focus="hoveredId = m.id"
              @blur="hoveredId = null"
            >
              <span class="lane-node" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    v-if="m.sigil === 'quill'"
                    d="M19 3c-6 1-10 6-12 13l-2 5 5-2c7-2 11-6 12-12-2 1-4 1-6 1 1-1 2-3 3-5Z"
                  />
                  <path v-else-if="m.sigil === 'vault'" d="M3 9 12 4l9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />
                  <g v-else>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 5.5 14.5 12 12 18.5 9.5 12Z" />
                  </g>
                </svg>
              </span>
              <span class="lane-text">
                <span class="lane-org">{{ m.organization }}</span>
                <span class="lane-role">{{ m.role }}</span>
                <span class="lane-role-alt">{{ periodLabel(m) }}</span>
              </span>
              <span class="lane-period">{{ periodLabel(m) }}</span>
              <span v-if="m.endYear === null" class="lane-arrow" aria-hidden="true" />

              <!-- hover preview -->
              <span class="lane-tip" aria-hidden="true">
                <span class="tip-kind">{{ m.kind }}</span>
                <span class="tip-summary">{{ m.summary }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- ================= inspection panel ================= -->
      <div
        id="milestone-panel"
        ref="panelEl"
        role="tabpanel"
        :aria-labelledby="`milestone-trigger-${selected.id}`"
        class="panel-wrap"
      >
        <Transition name="inspect" mode="out-in">
          <article :key="selected.id" class="inspect hud-panel hud-cut" :class="`tone-${selected.accent}`">
            <div class="inspect-main">
              <p class="inspect-kicker">
                <span class="kind-chip">{{ selected.kind }}</span>
                <span>{{ periodLabel(selected) }}</span>
                <span class="text-mist/70">·</span>
                <span>{{ selected.location }}</span>
              </p>
              <h3 class="inspect-org">{{ selected.organizationFull }}</h3>
              <p class="inspect-role">{{ selected.role }}</p>
              <p class="inspect-summary">{{ selected.summary }}</p>

              <h4 class="inspect-h4">Highlights</h4>
              <ul class="inspect-list">
                <li v-for="h in selected.highlights" :key="h">{{ h }}</li>
              </ul>
            </div>

            <div class="inspect-side">
              <h4 class="inspect-h4">Domain Focus</h4>
              <ul class="mt-3 flex flex-wrap gap-2" role="list">
                <li v-for="d in selected.domainFocus" :key="d" class="chip">{{ d }}</li>
              </ul>

              <h4 class="inspect-h4 mt-7">Connected Relics</h4>
              <ul class="relic-links" role="list">
                <li v-for="p in connected" :key="p.id">
                  <button
                    type="button"
                    class="relic-link"
                    :aria-label="`Unveil ${p.title}`"
                    @click="openProject(p, $event.currentTarget as HTMLElement)"
                  >
                    <span class="relic-thumb" aria-hidden="true">
                      <RelicArt :motif="p.motif" :accent="p.accent" :image-url="p.imageUrl" />
                    </span>
                    <span class="flex min-w-0 flex-col text-left">
                      <span class="relic-link-title">{{ p.title }}</span>
                      <span class="relic-link-meta">{{ p.arcana }} · {{ p.category }}</span>
                    </span>
                    <svg class="relic-link-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
                  </button>
                </li>
                <li v-if="!connected.length" class="text-sm text-mist">No relics linked yet.</li>
              </ul>
            </div>
          </article>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.career-section {
  position: relative;
  padding: clamp(4rem, 9vw, 7rem) 0;
}

/* ---------- chronicle (desktop axis) ---------- */
.chronicle {
  --hud-cut: 18px;
  margin-top: 2.5rem;
  padding: 1.5rem 1.5rem 1.75rem;
}
.ruler {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-frame);
}
.ruler-year {
  position: relative;
  padding-left: 0.5rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  color: var(--color-starlight);
}
.ruler-year::before {
  content: '';
  position: absolute;
  left: 0;
  bottom: -0.8rem;
  width: 1px;
  height: 0.8rem;
  background: var(--color-mist);
}
.ruler-present {
  position: absolute;
  right: 0;
  top: 0;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-gilt);
}
.lanes {
  display: grid;
  gap: 0.9rem;
  margin-top: 1.25rem;
}
.lane {
  position: relative;
  height: 64px;
}
.lane-guides {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  pointer-events: none;
}
.lane-guides span {
  border-left: 1px dashed rgba(58, 51, 102, 0.45);
}

.lane-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0 1rem 0 0.6rem;
  color: inherit;
  text-align: left;
  background: linear-gradient(90deg, rgba(28, 24, 54, 0.95), rgba(28, 24, 54, 0.55));
  border: 1px solid var(--color-frame);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%);
  cursor: pointer;
  transition:
    border-color 0.3s,
    background 0.3s,
    filter 0.3s;
}
.lane-bar:focus-visible {
  outline: none;
  filter: drop-shadow(0 0 1px var(--color-gilt));
}
.lane.is-hovered .lane-bar,
.lane.is-selected .lane-bar {
  border-color: var(--color-gilt);
  background: linear-gradient(90deg, rgba(36, 31, 70, 0.98), rgba(28, 24, 54, 0.7));
}
.lane.is-selected.tone-crimson .lane-bar {
  border-color: var(--color-elation);
}
.lane-node {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  background: var(--color-void);
  border: 1px solid var(--color-frame);
  transform: rotate(45deg);
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}
.lane-node svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--color-mist);
  stroke-width: 1.5;
  stroke-linejoin: round;
  transform: rotate(-45deg);
}
.lane.is-selected .lane-node {
  border-color: var(--color-gilt);
  box-shadow: 0 0 14px rgba(255, 209, 102, 0.45);
}
.lane.is-selected .lane-node svg {
  stroke: var(--color-gilt);
}
.lane.is-selected.tone-crimson .lane-node {
  border-color: var(--color-elation);
  box-shadow: 0 0 14px rgba(255, 42, 109, 0.45);
}
.lane.is-selected.tone-crimson .lane-node svg {
  stroke: var(--color-elation);
}
.lane-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.lane-org {
  font-family: var(--font-display);
  font-size: 1rem;
  letter-spacing: 0.1em;
  color: var(--color-starlight);
}
.lane-role {
  overflow: hidden;
  font-size: 0.8rem;
  color: var(--color-mist);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.lane-period {
  margin-left: auto;
  padding-left: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.14em;
  color: var(--color-mist);
  white-space: nowrap;
}
.lane-arrow {
  width: 8px;
  height: 8px;
  border-top: 1px solid var(--color-gilt);
  border-right: 1px solid var(--color-gilt);
  transform: rotate(45deg);
  animation: present-pulse 1.6s ease-in-out infinite;
}
@keyframes present-pulse {
  50% {
    opacity: 0.3;
    translate: 3px 0;
  }
}

.lane-role-alt {
  display: none;
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  color: var(--color-mist);
  white-space: nowrap;
}
@media (min-width: 900px) {
  .lane.is-narrow .lane-role,
  .lane.is-narrow .lane-period {
    display: none;
  }
  .lane.is-narrow .lane-role-alt {
    display: block;
  }
}

/* hover preview tooltip (desktop only, see media query below) */
.lane-tip {
  display: none;
}

/* ---------- inspection panel ---------- */
.panel-wrap {
  margin-top: 1.25rem;
  scroll-margin-top: calc(var(--hud-height) + 16px);
}
.inspect {
  --hud-cut: 20px;
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: clamp(1.5rem, 4vw, 3.5rem);
  padding: clamp(1.5rem, 3vw, 2.5rem);
  border-left: 2px solid var(--color-gilt);
}
.inspect.tone-crimson {
  border-left-color: var(--color-elation);
}
.inspect-kicker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.kind-chip {
  padding: 0.2rem 0.55rem;
  color: var(--color-void);
  background: var(--color-gilt);
  font-weight: 500;
}
.tone-crimson .kind-chip {
  background: var(--color-elation);
  color: var(--color-starlight);
}
.inspect-org {
  margin-top: 1rem;
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  line-height: 1.15;
}
.inspect-role {
  margin-top: 0.35rem;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.2rem;
  color: var(--color-starlight);
}
.inspect-summary {
  margin-top: 1rem;
  line-height: 1.75;
  color: var(--color-mist);
}
.inspect-h4 {
  margin-top: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--color-starlight);
}
.inspect-side .inspect-h4:first-child {
  margin-top: 0;
}
.inspect-list {
  display: grid;
  gap: 0.55rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}
.inspect-list li {
  position: relative;
  padding-left: 1.1rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--color-mist);
}
.inspect-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 5px;
  height: 5px;
  border: 1px solid var(--color-gilt);
  transform: rotate(45deg);
}
.relic-links {
  display: grid;
  gap: 0.6rem;
  margin: 0.75rem 0 0;
  padding: 0;
  list-style: none;
}
.relic-link {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  color: inherit;
  background: rgba(10, 9, 20, 0.55);
  border: 1px solid var(--color-frame);
  cursor: pointer;
  transition:
    border-color 0.25s,
    transform 0.25s var(--ease-theatre);
}
.relic-link:hover {
  border-color: var(--color-gilt);
  transform: translateX(3px);
}
.relic-thumb {
  flex-shrink: 0;
  width: 46px;
  height: 64px;
  background: var(--color-void);
  border: 1px solid var(--color-frame);
}
.relic-link-title {
  font-family: var(--font-display);
  font-size: 0.92rem;
  letter-spacing: 0.06em;
  color: var(--color-starlight);
}
.relic-link-meta {
  overflow: hidden;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-mist);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.relic-link-chev {
  width: 16px;
  height: 16px;
  margin-left: auto;
  flex-shrink: 0;
  fill: none;
  stroke: var(--color-mist);
  stroke-width: 1.6;
}

.inspect-enter-active,
.inspect-leave-active {
  transition:
    opacity 0.3s var(--ease-theatre),
    transform 0.3s var(--ease-theatre);
}
.inspect-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.inspect-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---------- desktop: hover tooltip above the bar ---------- */
@media (min-width: 900px) {
  .lane {
    z-index: 1;
  }
  .lane.is-hovered {
    z-index: 5;
  }
  .lane.is-hovered:not(.is-selected) .lane-bar {
    clip-path: none;
    overflow: visible;
  }
  .lane.is-hovered:not(.is-selected) .lane-tip {
    position: absolute;
    left: 0;
    bottom: calc(100% + 8px);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: min(340px, 80vw);
    padding: 0.7rem 0.9rem;
    background: var(--color-glass-strong);
    border: 1px solid var(--color-gilt);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  .tip-kind {
    font-family: var(--font-mono);
    font-size: 0.6rem;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--color-gilt);
  }
  .tip-summary {
    font-size: 0.82rem;
    line-height: 1.5;
    color: var(--color-starlight);
  }
}

/* ---------- mobile: vertical chronicle ---------- */
@media (max-width: 899px) {
  .chronicle {
    padding: 1rem;
  }
  .ruler,
  .lane-guides {
    display: none;
  }
  .lanes {
    position: relative;
    margin-top: 0;
    gap: 0.75rem;
  }
  .lanes::before {
    content: '';
    position: absolute;
    left: 29px;
    top: 10px;
    bottom: 10px;
    width: 1px;
    background: linear-gradient(180deg, var(--color-gilt), var(--color-frame) 30%, var(--color-elation) 70%, var(--color-gilt));
  }
  .lane {
    height: auto;
  }
  .lane-bar {
    position: relative;
    left: auto !important;
    width: 100% !important;
    flex-wrap: wrap;
    padding: 0.85rem 1rem 0.85rem 0.6rem;
    clip-path: none;
  }
  .lane-text {
    flex: 1;
  }
  .lane-role {
    white-space: normal;
  }
  .lane-period {
    flex-basis: 100%;
    margin-left: 3.2rem;
    padding-left: 0;
  }
  .lane-arrow {
    display: none;
  }
  .inspect {
    grid-template-columns: 1fr;
  }
}
</style>
