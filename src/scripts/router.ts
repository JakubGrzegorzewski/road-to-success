import {
    createRouter,
    createWebHistory,
    type RouteLocationNormalized,
    type RouteRecordRaw,
} from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/AllAdvancementsView.vue'),
    },
    {
        path: '/stopien/:id',
        name: 'Advancement',
        component: () => import('@/views/CreatingAdvancement.vue'),
        props: (route: RouteLocationNormalized) => ({ id: Number(route.params.id) }),
    },
    {
        path: '/dodaj-osobe/',
        name: 'AddPerson',
        component: () => import('@/views/AddPersonView.vue'),
    },
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
