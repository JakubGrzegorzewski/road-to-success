import { createRouter, createWebHistory } from 'vue-router'
import {pagesLinks} from "@/scripts/pagesLinks.ts";

const routes = [
    {
        path: pagesLinks.roadToSuccess+'/',
        name: 'Home',
        component: () => import('@/views/AllAdvancementsView.vue')
    },
    {
        path: pagesLinks.advancement+'/:id',
        name: 'Advancement',
        component: () => import('@/views/AdvancementDetailView.vue'),
        props: route => ({ id: Number(route.params.id) })
    },
    {
        path: pagesLinks.addPerson,
        name: 'AddPerson',
        component: () => import('@/views/AddPersonView.vue')
    },
    {
        path: pagesLinks.addAdvertisement,
        name: 'RankManagement',
        component: () => import('@/views/RankManagementView.vue'),
    },
    {
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
