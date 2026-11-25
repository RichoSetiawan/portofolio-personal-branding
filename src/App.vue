<script setup lang="ts">
import CosmicBackdrop from '@/components/CosmicBackdrop.vue'
import HsrCardModal from '@/components/gallery/HsrCardModal.vue'
import TrailblazeTransition from '@/components/TrailblazeTransition.vue'
</script>

<template>
  <CosmicBackdrop>
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell">
      <RouterView />
    </div>
    <!-- app-level overlays so they work from any route -->
    <HsrCardModal />
    <TrailblazeTransition />
  </CosmicBackdrop>
</template>

<style>
.app-shell {
  position: relative;
  z-index: 1;
}
.skip-link {
  position: fixed;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 200;
  padding: 0.6rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  color: var(--color-void);
  background: var(--color-gilt);
  transform: translateY(-160%);
  transition: transform 0.2s;
}
.skip-link:focus {
  transform: translateY(0);
}
#main:focus {
  outline: none;
}
</style>
