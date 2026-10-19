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
        path: '/pomoc',
        name: 'Help',
        component: () => import('@/views/HelpView.vue'),
    },
    {
        // sections: /pomoc/<slug>#<heading id>
        path: '/pomoc/:slug',
        name: 'HelpArticle',
        component: () => import('@/views/HelpArticleView.vue'),
        props: (route: RouteLocationNormalized) => ({ slug: String(route.params.slug) }),
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/',
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: (to, from, saved) => {
        if (saved) return saved
        // a section link within the same page (help table of contents); other views scroll to
        // their targets themselves once the content has loaded
        if (to.hash && to.path === from.path) return { el: to.hash, top: 16, behavior: 'smooth' }
        return { top: 0 }
    },
})

export default router
