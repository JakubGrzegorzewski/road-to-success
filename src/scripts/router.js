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
    {
        path: '/menteesAdvancements',
        name: 'MenteesAdvancements',
        component: () => import('../views/MenteesAdvancementsView.vue')
    },
    {
        path: '/CreateAdvancement',
        name: 'CreateAdvancement',
        component: () => import('../views/CreateAdvancementView.vue')
    }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router