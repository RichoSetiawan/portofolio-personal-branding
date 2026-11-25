import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { findProjectBySlug } from '@/data/projects'

const SITE = 'Richo Setiawan · Trailblaze Archive'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/projects/:slug',
      name: 'project',
      component: () => import('@/views/ProjectDetailView.vue'),
      props: true,
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      // give the target view a moment to mount before resolving the anchor
      return new Promise((resolve) =>
        setTimeout(() => resolve({ el: to.hash, top: 80, behavior: 'smooth' }), from.name === to.name ? 0 : 120),
      )
    }
    if (to.path !== from.path) return { top: 0 }
    return false
  },
})

router.afterEach((to) => {
  if (to.name === 'project') {
    const project = findProjectBySlug(String(to.params.slug))
    document.title = project ? `${project.title} · ${SITE}` : `Relic not found · ${SITE}`
  } else {
    document.title = SITE
  }
})

export default router
