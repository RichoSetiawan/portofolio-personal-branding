import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

if (import.meta.env.DEV) {
  // Warn in the console about data mistakes (duplicate ids, bad careerId, …)
  Promise.all([import('./data/defineProjects'), import('./data/projects'), import('./data/careerTimeline')]).then(
    ([{ validatePortfolio }, { projects }, { careerTimeline }]) => validatePortfolio(projects, careerTimeline),
  )
}

createApp(App).use(router).mount('#app')
