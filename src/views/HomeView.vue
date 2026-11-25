<script setup lang="ts">
import ProfileHeroHUD from '@/components/hud/ProfileHeroHUD.vue'
import GalleryStage from '@/components/gallery/GalleryStage.vue'
import CareerTimelineSection from '@/components/career/CareerTimelineSection.vue'
import ContactFooter from '@/components/footer/ContactFooter.vue'
</script>

<template>
  <ProfileHeroHUD />
  <main id="main" tabindex="-1">
    <GalleryStage />
    <CareerTimelineSection />
  </main>
  <ContactFooter />
</template>
