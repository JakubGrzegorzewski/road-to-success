import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/AllAdvancementsView.vue')
    },
    {
        path: '/advancement/:id',
        name: 'Advancement',
        component: () => import('@/views/AdvancementDetailView.vue'),
        props: route => ({ id: Number(route.params.id) })
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
