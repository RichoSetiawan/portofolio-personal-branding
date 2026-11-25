import { readonly, ref, watch } from 'vue'

export type ViewMode = 'stage' | 'gallery'

const STORAGE_KEY = 'rs-archive:view-mode'

function initialMode(): ViewMode {
  if (typeof window === 'undefined') return 'stage'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'stage' || saved === 'gallery') return saved
  } catch {
    /* storage blocked — fall through to heuristics */
  }
  // The scroll-driven stage adapts to phones too; only reduced-motion users start in the grid.
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return reduced ? 'gallery' : 'stage'
}

const viewMode = ref<ViewMode>(initialMode())

watch(viewMode, (mode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
})

/** Shared `3D Stage` / `2D Gallery` toggle state (HUD ↔ GalleryStage). */
export function useViewMode() {
  return {
    viewMode: readonly(viewMode),
    setViewMode: (mode: ViewMode) => {
      viewMode.value = mode
    },
  }
}
