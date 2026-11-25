<script setup lang="ts">
import { useViewMode, type ViewMode } from '@/composables/useViewMode'

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })

const { viewMode, setViewMode } = useViewMode()

const options: { value: ViewMode; label: string; short: string }[] = [
  { value: 'stage', label: '3D Stage', short: '3D' },
  { value: 'gallery', label: '2D Gallery', short: '2D' },
]

function onKey(e: KeyboardEvent) {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
  e.preventDefault()
  const next = viewMode.value === 'stage' ? 'gallery' : 'stage'
  setViewMode(next)
  const target = (e.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-value="${next}"]`)
  target?.focus()
}
</script>

<template>
  <div class="mode-toggle hud-cut-sm" role="radiogroup" aria-label="Gallery view mode" @keydown="onKey">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      class="mode-option"
      :data-value="opt.value"
      :aria-checked="viewMode === opt.value"
      :tabindex="viewMode === opt.value ? 0 : -1"
      :title="opt.label"
      @click="setViewMode(opt.value)"
    >
      <svg v-if="opt.value === 'stage'" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9Z" />
        <path d="M12 12 20 7.5M12 12v9M12 12 4 7.5" />
      </svg>
      <svg v-else viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </svg>
      <span>{{ compact ? opt.short : opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.mode-toggle {
  --hud-cut-sm: 8px;
  display: inline-flex;
  padding: 3px;
  gap: 3px;
  background: var(--color-glass);
  border: 1px solid var(--color-frame);
}
.mode-option {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.8rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-mist);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    color 0.25s,
    background 0.25s,
    border-color 0.25s;
}
.mode-option svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linejoin: round;
}
.mode-option:hover {
  color: var(--color-starlight);
}
.mode-option[aria-checked='true'] {
  color: var(--color-starlight);
  background: rgba(10, 9, 20, 0.7);
  border-color: var(--color-gilt);
}
.mode-option[aria-checked='true'] svg {
  stroke: var(--color-gilt);
}
</style>
