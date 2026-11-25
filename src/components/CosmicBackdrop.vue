<script setup lang="ts">
/**
 * CosmicBackdrop — hosts the single Three.js canvas and provides its controls
 * to every descendant (GalleryStage, modal, dossier view) via `GallerySceneKey`.
 * If WebGL is unavailable, the CSS gradient on <body> + a static star layer remain.
 */
import { provide, ref } from 'vue'
import { GallerySceneKey, useGalleryScene } from '@/composables/useGalleryScene'

const canvasEl = ref<HTMLCanvasElement | null>(null)
const controls = useGalleryScene(canvasEl)
provide(GallerySceneKey, controls)
</script>

<template>
  <div class="cosmic-backdrop" aria-hidden="true">
    <div v-if="!controls.webglAvailable.value" class="static-stars" />
    <canvas v-show="controls.webglAvailable.value" ref="canvasEl" class="cosmic-canvas" />
    <div class="vignette" />
  </div>
  <slot />
</template>

<style scoped>
.cosmic-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.cosmic-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(130% 90% at 50% 40%, transparent 55%, rgba(5, 4, 12, 0.75) 100%);
}
/* Fallback starfield when WebGL is unavailable */
.static-stars {
  position: absolute;
  inset: 0;
  opacity: 0.8;
  background-image:
    radial-gradient(1px 1px at 12% 18%, #f4f2ff, transparent 60%),
    radial-gradient(1px 1px at 72% 12%, #f4f2ff, transparent 60%),
    radial-gradient(1.5px 1.5px at 38% 64%, #a8a2c8, transparent 60%),
    radial-gradient(1px 1px at 88% 48%, #f4f2ff, transparent 60%),
    radial-gradient(2px 2px at 56% 32%, #ffd166, transparent 60%),
    radial-gradient(1px 1px at 22% 82%, #a8a2c8, transparent 60%),
    radial-gradient(1.5px 1.5px at 64% 86%, #f4f2ff, transparent 60%),
    radial-gradient(1.5px 1.5px at 8% 52%, #ff2a6d, transparent 60%);
  background-size: 420px 420px;
  animation: var(--animate-twinkle);
}
</style>
