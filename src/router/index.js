import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../views/Home.vue')
        },
        {
            path: '/admin/dashboard',
            name: 'admin-dashboard',
            component: () => import('../views/AdminDashboard.vue'),
            meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue')
        },
        {
            path: '/signup',
            name: 'signup',
            component: () => import('../views/Signup.vue')
        },
        {
            path: '/meeting/:id',
            name: 'meeting',
            component: () => import('../views/Meeting.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: () => import('../views/ForgotPassword.vue')
        },
        {
            path: '/update-password',
            name: 'update-password',
            component: () => import('../views/UpdatePassword.vue')
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const { data: { session } } = await supabase.auth.getSession()

    if (to.meta.requiresAuth && !session) {
        return next('/login')
    }

    if (session) {
        if (to.name === 'login' || to.name === 'signup') {
            return next('/')
        }

        if (to.meta.requiresAdmin) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single()

            if (profile?.role !== 'admin') {
                return next('/')
            }
        }
    }

    next()
})

export default router
