<script setup lang="ts">
/** Stroke-style social glyphs (24×24) that inherit `currentColor`. */
import type { SocialPlatform } from '@/types/portfolio'

defineProps<{ platform: SocialPlatform }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <template v-if="platform === 'linkedin'">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.3v.01M12 17v-6.5M12 13.3c0-1.7 1-2.8 2.5-2.8S17 11.5 17 13.3V17" />
    </template>
    <template v-else-if="platform === 'github'">
      <path
        d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
      />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </template>
    <template v-else-if="platform === 'instagram'">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5v.01" />
    </template>
    <template v-else-if="platform === 'tiktok'">
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.7 2.2 4.4 5 4.6" />
    </template>
    <template v-else>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.3v5.4l4.6-2.7Z" fill="currentColor" />
    </template>
  </svg>
</template>
