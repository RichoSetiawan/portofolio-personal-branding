import { shallowRef } from 'vue'
import type { Project } from '@/types/portfolio'

/**
 * Single source of truth for the HSR card-drop modal.
 * Cards (gallery) and connected-project chips (timeline) both open through here.
 */
const activeProject = shallowRef<Project | null>(null)
const originRect = shallowRef<DOMRect | null>(null)
let returnFocusTo: HTMLElement | null = null

export function useProjectModal() {
  function openProject(project: Project, sourceEl?: HTMLElement | null) {
    returnFocusTo = sourceEl ?? (document.activeElement as HTMLElement | null)
    originRect.value = sourceEl?.getBoundingClientRect() ?? null
    activeProject.value = project
  }

  /** Called by the modal once its exit animation has finished. */
  function closeProject({ restoreFocus = true } = {}) {
    activeProject.value = null
    originRect.value = null
    if (restoreFocus && returnFocusTo?.isConnected) {
      returnFocusTo.focus({ preventScroll: true })
    }
    returnFocusTo = null
  }

  return { activeProject, originRect, openProject, closeProject }
}
