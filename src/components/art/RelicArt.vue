<script setup lang="ts">
/**
 * RelicArt — original SVG centerpiece for a project card.
 * Gothic-baroque filigree + divination emblem + Planarcardia halo.
 * If the project supplies `imageUrl`, that illustration replaces the emblem
 * while the frame, spotlight and filigree remain.
 */
import { computed, useId } from 'vue'
import type { AccentTone, RelicMotif } from '@/types/portfolio'

withDefaults(
  defineProps<{
    motif: RelicMotif
    accent?: AccentTone
    imageUrl?: string
    /** Larger, more detailed rendering for modal / dossier. */
    hero?: boolean
  }>(),
  { accent: 'gold', imageUrl: undefined, hero: false },
)

const uid = `relic-${useId()}`

/** n-point star path centred at (cx, cy). */
function starPath(cx: number, cy: number, points: number, outer: number, inner: number): string {
  const step = Math.PI / points
  let d = ''
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    d += `${i === 0 ? 'M' : 'L'}${(cx + Math.cos(a) * r).toFixed(2)} ${(cy + Math.sin(a) * r).toFixed(2)}`
  }
  return `${d}Z`
}

const glints = computed(() =>
  [
    [30, 70, 4],
    [172, 58, 5],
    [160, 232, 3.5],
    [42, 214, 3],
    [146, 98, 2.5],
  ].map(([x, y, s]) => starPath(x!, y!, 4, s!, s! * 0.25)),
)

const ticks24 = Array.from({ length: 24 }, (_, i) => i * 15)
const rays = Array.from({ length: 9 }, (_, i) => -150 + i * 15)

const BUTTERFLY =
  'M0 0 C-10 -12 -19 -4 -12 3 C-16 10 -6 14 0 4 C6 14 16 10 12 3 C19 -4 10 -12 0 0 Z'
const CUBE_TOP = 'M88 100 L118 114 L88 128 L58 114 Z'
const CUBE_LEFT = 'M58 114 L88 128 L88 162 L58 148 Z'
const CUBE_RIGHT = 'M88 128 L118 114 L118 148 L88 162 Z'
</script>

<template>
  <span class="relic-art" :data-accent="accent" :class="{ 'is-hero': hero }">
    <svg
      viewBox="0 0 200 280"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.2"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient :id="`${uid}-spot`" cx="50%" cy="0%" r="90%">
          <stop offset="0%" style="stop-color: var(--relic-accent); stop-opacity: 0.22" />
          <stop offset="45%" style="stop-color: var(--color-frame); stop-opacity: 0.18" />
          <stop offset="100%" style="stop-color: var(--color-void); stop-opacity: 0" />
        </radialGradient>
        <radialGradient :id="`${uid}-fog`" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color: var(--color-mist); stop-opacity: 0.16" />
          <stop offset="100%" style="stop-color: var(--color-mist); stop-opacity: 0" />
        </radialGradient>
        <g :id="`${uid}-corner`">
          <path d="M12 44 C12 26 26 12 44 12" class="s-accent" />
          <path d="M12 32 C20 32 32 20 32 12" class="s-frame" />
          <path d="M44 12 C52 12 55 19 50 23 C46 26 41 22 44 19" class="s-accent" />
          <path d="M12 44 C12 52 19 55 23 50 C26 46 22 41 19 44" class="s-accent" />
          <circle cx="22" cy="22" r="2.5" class="f-alt" />
        </g>
      </defs>

      <!-- spotlight + fog bank -->
      <rect width="200" height="280" :fill="`url(#${uid}-spot)`" />
      <ellipse cx="100" cy="232" rx="96" ry="30" :fill="`url(#${uid}-fog)`" />
      <ellipse cx="100" cy="226" rx="54" ry="8" class="s-frame" opacity="0.8" />

      <!-- halo -->
      <g class="halo">
        <circle cx="100" cy="140" r="80" class="s-frame" opacity="0.7" />
        <circle cx="100" cy="140" r="86" class="s-frame" stroke-dasharray="1 6" />
      </g>

      <!-- filigree corners -->
      <use :href="`#${uid}-corner`" />
      <use :href="`#${uid}-corner`" transform="translate(200 0) scale(-1 1)" />
      <use :href="`#${uid}-corner`" transform="translate(0 280) scale(1 -1)" />
      <use :href="`#${uid}-corner`" transform="translate(200 280) scale(-1 -1)" />

      <!-- custom illustration slot -->
      <g v-if="imageUrl" class="emblem">
        <clipPath :id="`${uid}-clip`">
          <circle cx="100" cy="140" r="74" />
        </clipPath>
        <image
          :href="imageUrl"
          x="26"
          y="66"
          width="148"
          height="148"
          preserveAspectRatio="xMidYMid slice"
          :clip-path="`url(#${uid}-clip)`"
        />
        <circle cx="100" cy="140" r="74" class="s-accent" />
      </g>

      <!-- ASTROLABE — Planarcardia star-chart -->
      <g v-else-if="motif === 'astrolabe'" class="emblem">
        <circle cx="100" cy="140" r="56" class="s-frame" stroke-width="1.6" />
        <line
          v-for="deg in ticks24"
          :key="deg"
          x1="100"
          y1="84"
          x2="100"
          :y2="deg % 90 === 0 ? 92 : 88"
          :class="deg % 90 === 0 ? 's-accent' : 's-mist'"
          :transform="`rotate(${deg} 100 140)`"
        />
        <circle cx="100" cy="140" r="46" class="s-accent" stroke-dasharray="3 4" />
        <ellipse cx="100" cy="140" rx="46" ry="17" class="s-mist" transform="rotate(-24 100 140)" />
        <ellipse cx="100" cy="140" rx="46" ry="17" class="s-frame" transform="rotate(36 100 140)" />
        <circle cx="100" cy="140" r="24" class="s-mist" />
        <path :d="starPath(100, 140, 8, 22, 7)" class="s-accent f-accent-soft" />
        <line x1="100" y1="140" x2="134" y2="114" class="s-accent" stroke-width="1.6" />
        <circle cx="100" cy="84" r="4" class="f-alt" />
        <circle cx="100" cy="140" r="3" class="f-accent" />
      </g>

      <!-- SEER EYE — clockwork divination -->
      <g v-else-if="motif === 'seer-eye'" class="emblem">
        <line
          v-for="deg in rays"
          :key="deg"
          :x1="100 + Math.cos((deg * Math.PI) / 180) * 54"
          :y1="140 + Math.sin((deg * Math.PI) / 180) * 54"
          :x2="100 + Math.cos((deg * Math.PI) / 180) * (deg % 30 === 0 ? 72 : 64)"
          :y2="140 + Math.sin((deg * Math.PI) / 180) * (deg % 30 === 0 ? 72 : 64)"
          :class="deg === -90 ? 's-accent' : 's-mist'"
        />
        <path d="M36 140 Q100 80 164 140 Q100 200 36 140 Z" class="s-frame f-void" stroke-width="1.6" />
        <path d="M48 140 Q100 96 152 140 Q100 184 48 140 Z" class="s-mist" />
        <circle cx="100" cy="140" r="27" class="s-accent" stroke-width="4" stroke-dasharray="2.4 3.2" opacity="0.7" />
        <circle cx="100" cy="140" r="21" class="s-accent" />
        <circle cx="100" cy="140" r="8" class="f-alt" />
        <line x1="100" y1="140" x2="100" y2="124" class="s-accent" />
        <line x1="100" y1="140" x2="112" y2="147" class="s-accent" />
        <circle cx="105" cy="135" r="2.2" class="f-star" />
        <path d="M100 172 L104 184 L100 198 L96 184 Z" class="s-alt" />
      </g>

      <!-- FOOL MASK — Aha's masquerade -->
      <g v-else-if="motif === 'fool-mask'" class="emblem">
        <path d="M64 98 L54 64 L80 84 L100 54 L120 84 L146 64 L136 98" class="s-accent" stroke-width="1.5" />
        <circle cx="54" cy="60" r="4" class="f-alt" />
        <circle cx="100" cy="50" r="4.5" class="f-accent" />
        <circle cx="146" cy="60" r="4" class="f-alt" />
        <path
          d="M62 100 Q100 88 138 100 Q148 140 132 176 Q100 210 68 176 Q52 140 62 100 Z"
          class="s-frame f-void"
          stroke-width="1.6"
        />
        <path d="M100 94 L100 200" class="s-mist" stroke-dasharray="2 4" />
        <path d="M72 128 Q83 114 94 128 Q83 134 72 128 Z" class="s-mist" />
        <path d="M106 128 Q117 114 128 128 Q117 134 106 128 Z" class="s-accent" />
        <path d="M78 158 Q100 182 122 158" class="s-accent" stroke-width="1.6" />
        <path d="M86 161 Q100 172 114 161" class="s-mist" />
        <path d="M117 140 L121 147 L117 154 L113 147 Z" class="f-alt" />
        <path d="M70 148 q6 -6 12 0" class="s-mist" />
      </g>

      <!-- GOLDEN KEY — gilded lock & butterflies -->
      <g v-else-if="motif === 'golden-key'" class="emblem">
        <circle cx="100" cy="98" r="22" class="s-accent" stroke-width="1.6" />
        <circle cx="100" cy="98" r="13" class="s-mist" />
        <circle cx="100" cy="72" r="7" class="s-accent" />
        <circle cx="74" cy="98" r="7" class="s-accent" />
        <circle cx="126" cy="98" r="7" class="s-accent" />
        <path :d="starPath(100, 98, 4, 9, 2.5)" class="f-alt" />
        <path d="M100 120 L100 214" class="s-accent" stroke-width="2.6" />
        <path d="M92 132 L108 132 M94 140 L106 140" class="s-mist" />
        <path d="M100 188 L122 188 L122 196 L112 196 L112 204 L122 204 L122 214 L100 214" class="s-accent" stroke-width="1.6" />
        <g transform="translate(58 164) rotate(-20)">
          <path :d="BUTTERFLY" class="s-alt f-alt-soft" />
          <path d="M0 -6 L0 8" class="s-alt" />
        </g>
        <g transform="translate(148 176) rotate(16) scale(0.75)">
          <path :d="BUTTERFLY" class="s-alt f-alt-soft" />
          <path d="M0 -6 L0 8" class="s-alt" />
        </g>
      </g>

      <!-- CHALICE — the scholar's grail -->
      <g v-else-if="motif === 'chalice'" class="emblem">
        <circle cx="100" cy="132" r="52" class="s-frame" stroke-dasharray="1 5" />
        <path :d="starPath(100, 88, 4, 15, 3.5)" class="f-alt" />
        <path d="M100 66 L100 74 M100 102 L100 108" class="s-mist" />
        <path d="M66 112 L134 112 Q132 152 100 162 Q68 152 66 112 Z" class="s-accent f-void" stroke-width="1.6" />
        <path d="M72 121 L128 121" class="s-mist" />
        <path d="M100 162 L100 192 M90 172 L110 172" class="s-accent" stroke-width="1.6" />
        <path d="M76 204 Q100 186 124 204 Z" class="s-accent" stroke-width="1.6" />
        <path d="M100 128 L106 137 L100 146 L94 137 Z" class="f-alt" />
        <path d="M58 116 Q50 132 60 148 M142 116 Q150 132 140 148" class="s-mist" />
      </g>

      <!-- CARNIVAL DICE — Elation's wager -->
      <g v-else class="emblem">
        <path :d="starPath(100, 140, 12, 64, 54)" class="s-frame" stroke-dasharray="2 3" />
        <g>
          <path :d="CUBE_TOP" class="s-accent f-accent-soft" stroke-width="1.6" />
          <path :d="CUBE_LEFT" class="s-accent f-void" stroke-width="1.6" />
          <path :d="CUBE_RIGHT" class="s-accent f-void" stroke-width="1.6" />
          <circle cx="88" cy="114" r="3.4" class="f-alt" />
          <circle cx="66" cy="128" r="2.6" class="f-star" />
          <circle cx="80" cy="148" r="2.6" class="f-star" />
          <circle cx="95" cy="149" r="2.6" class="f-star" />
          <circle cx="103" cy="138" r="2.6" class="f-star" />
          <circle cx="111" cy="127" r="2.6" class="f-star" />
        </g>
        <g transform="translate(70 70) rotate(18 100 140) scale(0.55)">
          <path :d="CUBE_TOP" class="s-alt" stroke-width="2.4" />
          <path :d="CUBE_LEFT" class="s-alt f-void" stroke-width="2.4" />
          <path :d="CUBE_RIGHT" class="s-alt f-void" stroke-width="2.4" />
          <circle cx="88" cy="114" r="4" class="f-alt" />
        </g>
        <path d="M54 96 L58 101 L54 106 L50 101 Z" class="f-alt" />
        <path d="M150 104 L153 108 L150 112 L147 108 Z" class="f-accent" />
        <path d="M60 192 L63 196 L60 200 L57 196 Z" class="f-accent" />
      </g>

      <!-- starlight glints -->
      <path v-for="(d, i) in glints" :key="i" :d="d" class="f-star glint" :style="{ animationDelay: `${i * 0.6}s` }" />
    </svg>
  </span>
</template>

<style scoped>
.relic-art {
  --relic-accent: var(--color-gilt);
  --relic-alt: var(--color-elation);
  display: block;
  width: 100%;
  height: 100%;
}
.relic-art[data-accent='crimson'] {
  --relic-accent: var(--color-elation);
  --relic-alt: var(--color-gilt);
}
.relic-art svg {
  display: block;
  width: 100%;
  height: 100%;
}

.s-accent {
  stroke: var(--relic-accent);
}
.s-alt {
  stroke: var(--relic-alt);
}
.s-frame {
  stroke: var(--color-frame);
}
.s-mist {
  stroke: var(--color-mist);
  stroke-opacity: 0.65;
}
.f-accent {
  fill: var(--relic-accent);
}
.f-alt {
  fill: var(--relic-alt);
}
.f-star {
  fill: var(--color-starlight);
}
.f-void {
  fill: rgba(10, 9, 20, 0.55);
}
.f-accent-soft {
  fill: color-mix(in srgb, var(--relic-accent) 16%, transparent);
}
.f-alt-soft {
  fill: color-mix(in srgb, var(--relic-alt) 18%, transparent);
}

.halo {
  transform-origin: 100px 140px;
  animation: halo-spin 80s linear infinite;
}
.emblem {
  transform-origin: 100px 140px;
  transition:
    transform 0.6s var(--ease-theatre),
    filter 0.6s var(--ease-theatre);
}
.glint {
  animation: var(--animate-twinkle);
}

@keyframes halo-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
