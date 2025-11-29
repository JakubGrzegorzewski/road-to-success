import { createRouter, createWebHistory } from 'vue-router'
import {projectSubPage} from "@/scripts/helperFunctions.ts";

const routes = [
    {
        path: projectSubPage,
        name: 'Home',
        component: () => import('@/views/AllAdvancementsView.vue')
    },
    {
        path: projectSubPage+'advancement/:id',
        name: 'Advancement',
        component: () => import('@/views/AdvancementDetailView.vue'),
        props: route => ({ id: Number(route.params.id) })
    },
    {
        path: projectSubPage+'add-person',
        name: 'AddPerson',
        component: () => import('@/views/AddPersonView.vue')
    },
    {
        path: projectSubPage+'add-rank',
        name: 'AddRank',
        component: () => import('@/views/AddRankView.vue'),
    },
    {
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
