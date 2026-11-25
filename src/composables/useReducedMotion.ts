import { readonly, ref } from 'vue'

/**
 * App-wide `prefers-reduced-motion` flag.
 * One matchMedia listener for the whole app lifetime (shared singleton).
 */
const reduced = ref(false)
let initialised = false

function init() {
  if (initialised || typeof window === 'undefined' || !window.matchMedia) return
  initialised = true
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduced.value = mq.matches
  mq.addEventListener('change', (e) => {
    reduced.value = e.matches
  })
}

export function useReducedMotion() {
  init()
  return readonly(reduced)
}
