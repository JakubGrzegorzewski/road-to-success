import {
    createRouter,
    createWebHistory,
    type RouteLocationNormalized,
    type RouteRecordRaw,
} from 'vue-router'
import { pagesLinks } from '@/main'

const routes: RouteRecordRaw[] = [
    {
        path: pagesLinks.roadToSuccess + '/',
        name: 'Home',
        component: () => import('@/views/AllAdvancementsView.vue'),
    },
    {
        path: pagesLinks.advancement + '/:id',
        name: 'Advancement',
        component: () => import('@/views/CreatingAdvancement.vue'),
        props: (route: RouteLocationNormalized) => ({ id: Number(route.params.id) }),
    },
    {
        path: pagesLinks.advancement + '/:id',
        name: 'AdvancementReport',
        component: () => import('@/views/CreatingAdvancementReport.vue'),
        props: (route: RouteLocationNormalized) => ({ id: Number(route.params.id) }),
    },
    {
        path: pagesLinks.addPerson,
        name: 'AddPerson',
        component: () => import('@/views/AddPersonView.vue'),
    },
    {
        path: pagesLinks.addAdvancement,
        name: 'RankManagement',
        component: () => import('@/views/RankManagementView.vue'),
    },
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
