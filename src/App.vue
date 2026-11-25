<script setup lang="ts">
import CosmicBackdrop from '@/components/CosmicBackdrop.vue'
import HsrCardModal from '@/components/gallery/HsrCardModal.vue'
import TrailblazeTransition from '@/components/TrailblazeTransition.vue'
import EntryGate from '@/components/EntryGate.vue'
import { useBackgroundMusic } from '@/composables/useBackgroundMusic'

const { gate } = useBackgroundMusic()
</script>

<template>
  <CosmicBackdrop>
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="app-shell" :inert="gate === 'open'">
      <RouterView />
    </div>
    <!-- app-level overlays so they work from any route -->
    <HsrCardModal />
    <TrailblazeTransition />
    <EntryGate />
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
