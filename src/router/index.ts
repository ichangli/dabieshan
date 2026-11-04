import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { IS_DEMO } from "@/composables/mode";

const { isLoggedIn, username, clearAuth } = useAuth()

const router = createRouter({
    history: IS_DEMO ? createWebHashHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'Login',
            component: () => import('@/views/LoginView.vue'),
            meta: { requireAuth: false }
        },
        {
            path: '/',
            name: 'Home',
            component: () => import('@/views/HomeView.vue'),
            meta: { requireAuth: true }
        }
    ]
})

router.beforeEach(async (to) => {
    if (IS_DEMO) {
        return to.path === '/login' ? '/' : true
    }

    if (!to.meta.requireAuth) {
        return true
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
        clearAuth()
        return '/login'
    }

    try {
        const res = await fetch('/api/me', {
            headers: {
                Authorization: 'Bearer ' + token
            }
        })

        if (res.status === 200) {
            const data = await res.json()
            if (!data || typeof data.account != 'string') {
                throw new Error('身份格式响应错误')
            }
            isLoggedIn.value = true
            username.value = data.account
            localStorage.setItem('auth_username', data.account)
            return true
        }

        if (res.status === 401) {
            clearAuth()
            return '/login'
        }
    } catch (err) { }

    isLoggedIn.value = false
    username.value = ''

    return {
        path: '/login',
        query: { reason: 'unavailable' }
    }
})

export default router