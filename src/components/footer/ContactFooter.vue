<script setup lang="ts">
/**
 * ContactFooter — "Contact Me" signal station at the very bottom of the page.
 * Links come exclusively from `src/data/socialLinks.ts`.
 */
import SocialIcon from '@/components/icons/SocialIcon.vue'
import { socialLinks } from '@/data/socialLinks'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { vReveal } from '@/directives/reveal'

const reduced = useReducedMotion()
const year = new Date().getFullYear()

function backToTop() {
  window.scrollTo({ top: 0, behavior: reduced.value ? 'auto' : 'smooth' })
}
</script>

<template>
  <footer id="contact" class="contact-footer" aria-labelledby="contact-title">
    <div class="mx-auto max-w-7xl px-4 sm:px-8">
      <div v-reveal class="signal hud-panel hud-cut ornate-corners">
        <div class="signal-head">
          <p class="section-kicker justify-center">Signal the Trailblazer</p>
          <h2 id="contact-title" class="section-title mt-3">Contact Me</h2>
          <p class="signal-prompt">
            Open to collaborations, opportunities and conversations about building where business meets technology.
            Send a signal to <span class="text-starlight">Richo Setiawan</span> on any channel below.
          </p>
        </div>

        <ul class="socials" role="list">
          <li v-for="link in socialLinks" :key="link.platform">
            <a
              class="social-btn hud-cut-sm"
              :class="`is-${link.platform}`"
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="link.ariaLabel"
            >
              <span class="social-icon"><SocialIcon :platform="link.platform" /></span>
              <span class="social-label">{{ link.label }}</span>
            </a>
            <span class="social-tip" aria-hidden="true">{{ link.handle }}</span>
          </li>
        </ul>
      </div>

      <div class="footer-bar">
        <div class="footer-brand">
          <span class="footer-gem" aria-hidden="true" />
          <span>© {{ year }} Richo Setiawan · Trailblaze Archive</span>
        </div>
        <p class="footer-note">
          Built with Vue 3, Three.js &amp; GSAP. Fan-inspired aesthetic nodding to <em>Honkai: Star Rail</em> (HoYoverse),
          <em>Umineko When They Cry</em> (07th Expansion) and <em>Lord of the Mysteries</em> (Cuttlefish That Loves
          Diving). All artwork is original; not affiliated with or endorsed by these rights holders.
        </p>
        <button type="button" class="btn-ghost back-top" @click="backToTop">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
          Back to top
        </button>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.contact-footer {
  position: relative;
  padding: clamp(4rem, 9vw, 7rem) 0 2rem;
}
.signal {
  --hud-cut: 22px;
  --corner-inset: 16px;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem);
  text-align: center;
  background:
    radial-gradient(60% 80% at 50% 0%, rgba(58, 51, 102, 0.45), transparent 70%) padding-box,
    linear-gradient(var(--color-glass), var(--color-glass)) padding-box,
    linear-gradient(135deg, var(--color-frame), rgba(58, 51, 102, 0.35)) border-box;
}
.signal-prompt {
  max-width: 38rem;
  margin: 1rem auto 0;
  line-height: 1.75;
  color: var(--color-mist);
}

.socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: clamp(0.75rem, 2vw, 1.25rem);
  margin: 2.5rem 0 0;
  padding: 0;
  list-style: none;
}
.social-btn {
  --hud-cut-sm: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  width: clamp(92px, 27vw, 104px);
  padding: 1.1rem 0.5rem 0.9rem;
  color: var(--color-starlight);
  text-decoration: none;
  /* smoked-violet glass + silver-lavender border (drawn as background so clip-path keeps it) */
  background:
    linear-gradient(var(--color-glass), var(--color-glass)) padding-box,
    linear-gradient(160deg, var(--color-frame), rgba(58, 51, 102, 0.5)) border-box;
  border: 1px solid transparent;
  transition:
    transform 0.35s var(--ease-theatre),
    background 0.35s,
    filter 0.35s;
}
.social-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 1px solid var(--color-frame);
  transform: rotate(45deg);
  transition:
    border-color 0.35s,
    background 0.35s,
    box-shadow 0.35s;
}
.social-icon :deep(svg) {
  width: 22px;
  height: 22px;
  transform: rotate(-45deg);
  transition: color 0.35s;
}
.social-label {
  margin-top: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-mist);
  transition: color 0.35s;
}
.social-tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  padding: 0.3rem 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--color-starlight);
  background: var(--color-glass-strong);
  border: 1px solid var(--color-gilt);
  translate: -50% 6px;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.25s,
    translate 0.25s var(--ease-theatre);
}

/* hover / focus — 10% accent: crimson rim, gold glyph, dual glow */
.social-btn:hover,
.social-btn:focus-visible {
  transform: translateY(-4px);
  outline: none;
  background:
    linear-gradient(var(--color-glass), var(--color-glass)) padding-box,
    linear-gradient(135deg, var(--color-gilt), var(--color-elation)) border-box;
  filter: drop-shadow(0 0 14px rgba(255, 42, 109, 0.35));
}
.social-btn:hover .social-icon,
.social-btn:focus-visible .social-icon {
  border-color: var(--color-elation);
  background: rgba(255, 42, 109, 0.08);
  box-shadow:
    0 0 16px rgba(255, 42, 109, 0.45),
    inset 0 0 10px rgba(255, 209, 102, 0.2);
}
.social-btn:hover .social-icon :deep(svg),
.social-btn:focus-visible .social-icon :deep(svg) {
  color: var(--color-gilt);
}
.social-btn:hover .social-label,
.social-btn:focus-visible .social-label {
  color: var(--color-starlight);
}
/* tooltip is a sibling of the clipped button so the HUD cut doesn't hide it */
.socials li {
  position: relative;
}
.socials li:hover .social-tip,
.socials li:focus-within .social-tip {
  opacity: 1;
  translate: -50% 0;
}

/* ---------- bottom bar ---------- */
.footer-bar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  margin-top: 3rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(58, 51, 102, 0.6);
}
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--color-starlight);
}
.footer-gem {
  width: 6px;
  height: 6px;
  background: var(--color-gilt);
  transform: rotate(45deg);
}
.footer-note {
  font-size: 0.75rem;
  line-height: 1.6;
  color: var(--color-mist);
  opacity: 0.85;
}
.back-top svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
}

@media (max-width: 860px) {
  .footer-bar {
    grid-template-columns: 1fr;
    text-align: center;
    justify-items: center;
  }
}
</style>
