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
        props: (route: RouteLocationNormalized) => ({ id: String(route.params.id) }),
    },
    {
        path: '/dodaj-osobe/',
        name: 'AddPerson',
        component: () => import('@/views/AddPersonView.vue'),
    },
    {
        path: '/synchronizacja',
        name: 'Sync',
        component: () => import('@/views/SyncView.vue'),
    },
    {
        // join link: /dolacz#r=<room>&k=<key> (the fragment never reaches a server)
        path: '/dolacz',
        name: 'JoinRoom',
        component: () => import('@/views/JoinRoomView.vue'),
    },
    {
        path: '/ustawienia',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

export default router
