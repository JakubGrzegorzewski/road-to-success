import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('../views/HomeView.vue')
    },
    {
        path: '/Advancements',
        name: 'Advancements',
        component: () => import('../views/AdvancementsView.vue')
    },
    {
        path: '/Advancement/:id',
        name: 'AdvancementDetail',
        component: () => import('../views/AdvancementDetailView.vue'),
        props: true
    },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router