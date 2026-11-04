import { ref } from 'vue'

const isLoggedIn = ref(false)
const username = ref('')

export function useAuth() {
    async function login(account: string, password: string): Promise<number> {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account, password })
        })

        if (res.status === 200) {
            const data = await res.json()

            if (!data || typeof data.token !== 'string' || !data.token) {
                throw new Error('登录响应缺少有效 token')
            }

            isLoggedIn.value = true
            username.value = account
            localStorage.setItem('auth_token', data.token)
            localStorage.setItem('auth_username', account)
        }

        return res.status
    }

    function clearAuth() {
        isLoggedIn.value = false
        username.value = ''
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_username')
    }

    async function logout(): Promise<boolean> {
        const token = localStorage.getItem('auth_token')

        try {
            if (!token) {
                return true
            }

            const res = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token
                },
                signal: AbortSignal.timeout(5000)
            })

            return res.status === 204
        } catch (err) {
            return false
        } finally {
            clearAuth()
        }
    }
    return { isLoggedIn, username, login, logout, clearAuth }
}