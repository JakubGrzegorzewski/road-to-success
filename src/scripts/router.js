import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/road-to-success/',
        name: 'Home',
        component: () => import('@/views/AllAdvancementsView.vue')
    },
    {
        path: '/road-to-success/advancement/:id',
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
