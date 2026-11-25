import { readonly, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { TrailblazeTarget } from '@/types/portfolio'

/** Animation API implemented by <TrailblazeTransition>. */
export interface TrailblazeOverlay {
  playIn(label: string): Promise<void>
  playOut(): Promise<void>
}

let overlay: TrailblazeOverlay | null = null
const inFlight = ref(false)

export function registerTrailblazeOverlay(api: TrailblazeOverlay | null) {
  overlay = api
}

export interface TrailblazeOptions {
  /** Runs while the overlay fully covers the screen (e.g. close a modal invisibly). */
  onCovered?: () => void
}

/**
 * "Trailblaze" — theatrical hand-off to a project.
 *  • external → window.open(url, '_blank', 'noopener,noreferrer')
 *  • internal → router.push(route)
 *
 * The cover animation is kept under ~600ms so `window.open` still runs inside the
 * browser's user-activation window and is not treated as an unsolicited popup.
 */
export function useTrailblaze() {
  const router = useRouter()

  async function trailblaze(target: TrailblazeTarget, label: string, options: TrailblazeOptions = {}) {
    if (inFlight.value) return
    inFlight.value = true
    try {
      if (overlay) await overlay.playIn(label)

      if (target.type === 'external') {
        window.open(target.url, '_blank', 'noopener,noreferrer')
        options.onCovered?.()
      } else {
        options.onCovered?.()
        await router.push(target.route)
      }

      if (overlay) await overlay.playOut()
    } finally {
      inFlight.value = false
    }
  }

  return { trailblaze, inFlight: readonly(inFlight) }
}
