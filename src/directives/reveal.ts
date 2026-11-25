import type { Directive } from 'vue'
import { gsap } from 'gsap'

/**
 * v-reveal — section entrance: fade + rise when the element enters the viewport.
 * Usage: <h2 v-reveal> or <div v-reveal="0.15"> (delay in seconds).
 * Skipped entirely under prefers-reduced-motion.
 */
const observers = new WeakMap<HTMLElement, IntersectionObserver>()

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) return

    gsap.set(el, { autoAlpha: 0, y: 28 })
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay: binding.value ?? 0,
            ease: 'power3.out',
            clearProps: 'transform',
          })
          io.disconnect()
          observers.delete(el)
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    observers.set(el, io)
  },
  unmounted(el) {
    observers.get(el)?.disconnect()
    observers.delete(el)
    gsap.killTweensOf(el)
  },
}
