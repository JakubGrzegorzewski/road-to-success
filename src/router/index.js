import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/myAdvancement',
    name: 'MyAdvancement',
    component: () => import('../views/MyAdvancementView.vue')
  },
  {
    path: '/menteesAdvancements',
    name: 'MenteesAdvancements',
    component: () => import('../views/MenteesAdvancementsView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router