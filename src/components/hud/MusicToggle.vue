<script setup lang="ts">
/**
 * ♪ Background-music switch for the HUD bars.
 * Equalizer bars dance in gold while playing; hidden when no audio file exists
 * (dimmed with a hint in dev so you can see where it will appear).
 */
import { computed } from 'vue'
import { useBackgroundMusic } from '@/composables/useBackgroundMusic'

withDefaults(defineProps<{ showLabel?: boolean }>(), { showLabel: true })

const { current, available, devMissing, playing, loading, toggle } = useBackgroundMusic()

const nowTitle = computed(() => current.value?.title ?? 'Music')
const label = computed(() => {
  const action = playing.value ? 'Pause background music' : 'Play background music'
  const song = current.value ? `: ${current.value.title} by ${current.value.artist}` : ''
  return action + song
})
const hint = computed(() =>
  available.value && current.value
    ? `${current.value.title} — ${current.value.artist}`
    : 'Add audio files to src/assets/audio/ to enable music',
)
</script>

<template>
  <button
    v-if="available || devMissing"
    type="button"
    class="music-toggle hud-cut-sm"
    :class="{ 'is-on': playing, 'is-loading': loading, 'is-missing': !available }"
    data-music-toggle
    :aria-pressed="playing"
    :aria-label="label"
    :title="hint"
    :disabled="!available"
    @click="toggle"
  >
    <span class="eq" aria-hidden="true"><i /><i /><i /><i /></span>
    <span v-if="showLabel" class="music-label" aria-hidden="true">
      <span class="music-state">{{ playing ? 'Now playing' : 'Music' }}</span>
      <span class="music-title">{{ nowTitle }}</span>
    </span>
  </button>
</template>

<style scoped>
.music-toggle {
  --hud-cut-sm: 8px;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  height: 40px;
  padding: 0 0.75rem;
  color: var(--color-mist);
  background: var(--color-glass);
  border: 1px solid var(--color-frame);
  cursor: pointer;
  transition:
    color 0.25s,
    border-color 0.25s,
    background 0.25s;
}
.music-toggle:hover:not(:disabled) {
  color: var(--color-starlight);
  border-color: var(--color-gilt);
}
.music-toggle.is-on {
  color: var(--color-starlight);
  border-color: var(--color-gilt);
  background: rgba(10, 9, 20, 0.7);
}
.music-toggle.is-missing {
  opacity: 0.45;
  cursor: not-allowed;
  border-style: dashed;
}

/* equalizer */
.eq {
  display: inline-flex;
  align-items: flex-end;
  gap: 2px;
  width: 16px;
  height: 14px;
}
.eq i {
  flex: 1;
  height: 25%;
  background: currentColor;
  transform-origin: bottom;
  transition: height 0.3s;
}
.is-on .eq i {
  background: var(--color-gilt);
  animation: eq-bounce 1s ease-in-out infinite;
}
.is-on .eq i:nth-child(2) {
  animation-duration: 0.8s;
  animation-delay: -0.3s;
}
.is-on .eq i:nth-child(3) {
  animation-duration: 1.15s;
  animation-delay: -0.6s;
}
.is-on .eq i:nth-child(4) {
  background: var(--color-elation);
  animation-duration: 0.9s;
  animation-delay: -0.15s;
}
.is-loading .eq i {
  animation-duration: 2.4s;
  opacity: 0.6;
}
@keyframes eq-bounce {
  0%,
  100% {
    height: 25%;
  }
  50% {
    height: 100%;
  }
}
/* reduced motion: show a steady "on" level instead of bouncing */
@media (prefers-reduced-motion: reduce) {
  .is-on .eq i {
    height: 70%;
  }
}

.music-label {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-align: left;
}
.music-state {
  font-family: var(--font-mono);
  font-size: 0.52rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-mist);
}
.music-title {
  font-family: var(--font-display);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  color: var(--color-starlight);
  white-space: nowrap;
  max-width: 11rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 1100px) {
  .music-label {
    display: none;
  }
  .music-toggle {
    width: 40px;
    justify-content: center;
    padding: 0;
  }
}
</style>
