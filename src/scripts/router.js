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
        path: '/Advancement',
        name: 'AdvancementDetail',
        component: () => import('../views/AdvancementDetailView.vue'),
        props: true
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/RegisterView.vue'),
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginView.vue'),
    },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router