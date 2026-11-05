<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import '@/styles/login.css'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const account = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const showPassword = ref(false)
const displayError = computed(() => {
  if (loading.value) {
    return ''
  }
  if (errorMsg.value) {
    return errorMsg.value
  }
  if (route.query.reason === 'unavailable') {
    return '服务器暂时不可用，请稍后再试'
  }
  if (route.query.reason === 'logout-unconfirmed') {
    return '已退出当前浏览器，但未能确认服务器注销'
  }
  return ''
})

async function handleLogin() {
  if (loading.value) {
    return
  }

  errorMsg.value = ''

  if (!account.value.trim() || !password.value.trim()) {
    errorMsg.value = '请输入账号和密码'
    return
  }

  loading.value = true
  try {
    const status = await login(account.value, password.value)
    if (status === 200) {
      await router.push('/')
    } else if (status === 401) {
      errorMsg.value = '账号或密码错误，请重试'
    } else {
      errorMsg.value = '服务器暂时不可用，请稍后再试'
    }
  } catch (err) {
    errorMsg.value = '服务器暂时不可用，请稍后再试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="access-page">
    <section class="access-stage" aria-label="大别山生态资源平台登录">
      <div class="access-story">
        <div class="access-brand">
          <span class="access-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m4 24 9-15 5 8 3-5 7 12H4Z" />
              <path d="m10 14 3 3 3-3M5 28h22" />
              <circle cx="24" cy="6" r="2" />
            </svg>
          </span>
          <div><strong>大别山</strong><span>生态资源数据库平台</span></div>
        </div>

        <div class="access-story-copy">
          <span class="access-eyebrow"><i></i> DABIE MOUNTAINS · ECO ATLAS</span>
          <h1>读懂山水，<br />让生态价值可见<span>。</span></h1>
          <p>以地理空间连接自然资源，<br />探索大别山革命老区的生态底色。</p>
        </div>

        <div class="access-landscape" aria-hidden="true">
          <svg class="access-terrain" viewBox="0 0 800 440" fill="none" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="accessMountainBack" x1="400" y1="50" x2="400" y2="440" gradientUnits="userSpaceOnUse">
                <stop stop-color="#7899aa" stop-opacity=".55" />
                <stop offset="1" stop-color="#244454" stop-opacity="0" />
              </linearGradient>
              <linearGradient id="accessMountainFront" x1="400" y1="130" x2="400" y2="440" gradientUnits="userSpaceOnUse">
                <stop stop-color="#b4c8d1" stop-opacity=".5" />
                <stop offset="1" stop-color="#2c4b5c" stop-opacity="0" />
              </linearGradient>
              <pattern id="accessGrid" width="44" height="44" patternUnits="userSpaceOnUse">
                <path d="M44 0H0v44" stroke="#c6d9e3" stroke-opacity=".07" stroke-width=".8" />
              </pattern>
            </defs>
            <rect width="800" height="440" fill="url(#accessGrid)" />
            <circle cx="560" cy="90" r="46" fill="#d0dae0" fill-opacity=".12" />
            <circle cx="560" cy="90" r="62" stroke="#c6d9e3" stroke-opacity=".13" stroke-dasharray="2 7" />
            <path d="M-20 330 45 273 93 291 164 206 209 242 291 114 335 167 384 139 466 252 506 216 574 281 637 237 705 290 820 220V460H-20Z" fill="url(#accessMountainBack)" />
            <path d="M-20 330 45 273 93 291 164 206 209 242 291 114 335 167 384 139 466 252 506 216 574 281 637 237 705 290 820 220" stroke="#9cb4c2" stroke-opacity=".46" />
            <path d="M-20 395 72 315 133 333 226 239 282 277 354 193 405 229 468 170 538 268 590 243 659 316 721 285 820 358V460H-20Z" fill="url(#accessMountainFront)" />
            <path d="M-20 395 72 315 133 333 226 239 282 277 354 193 405 229 468 170 538 268 590 243 659 316 721 285 820 358" stroke="#c2d2dc" stroke-opacity=".7" />
            <g stroke="#b7cdd9" stroke-opacity=".2" stroke-width=".8">
              <path v-for="line in 12" :key="line" :transform="`translate(0 ${line * 13})`" d="M-30 352C40 352 55 300 105 313S174 233 226 254 302 199 354 213 432 155 468 190 527 287 590 263 677 333 725 311 795 334 830 360" />
            </g>
            <path d="M291 114v-42h88M468 170v-38h78" stroke="#c5d6e0" stroke-opacity=".36" stroke-dasharray="3 4" />
            <circle cx="291" cy="114" r="3" fill="#d0dde5" />
            <circle cx="468" cy="170" r="3" fill="#d0dde5" />
            <text x="302" y="64" fill="#b7ccd8" font-size="10" font-family="monospace" letter-spacing="2">31° N / 115° E</text>
            <text x="479" y="124" fill="#b7ccd8" font-size="10" font-family="monospace" letter-spacing="2">DABIE MOUNTAINS</text>
          </svg>
          <div class="access-art-caption"><span>山水之间，万物共生</span><span>LAND · WATER · LIFE</span></div>
        </div>

        <div class="access-story-footer">
          <span>森林资源</span><i></i><span>水文气候</span><i></i><span>湿地生态</span>
        </div>
      </div>

      <div class="access-form-pane">
        <div class="access-form-top"><span class="access-top-dot"></span> 生态资源研究工作台</div>
        <div class="access-form-content">
          <span class="access-form-kicker">WELCOME TO ECO ATLAS</span>
          <h2>欢迎回来</h2>
          <p class="access-form-description">登录工作台，开启你的生态探索。</p>

          <form class="access-form" @submit.prevent="handleLogin" :aria-busy="loading">
            <div class="access-field">
              <label for="access-account">账号 <span>ACCOUNT</span></label>
              <div class="access-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-3a7 7 0 0 1 14 0v3" /></svg>
                <input id="access-account" v-model="account" type="text" placeholder="账号：admin" autocomplete="username" :disabled="loading" />
              </div>
            </div>

            <div class="access-field">
              <label for="access-password">密码 <span>PASSWORD</span></label>
              <div class="access-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
                <input id="access-password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="密码：123456" autocomplete="current-password" :disabled="loading" />
                <button type="button" class="access-password-toggle" :aria-label="showPassword ? '隐藏密码' : '显示密码'" :aria-pressed="showPassword" @click="showPassword = !showPassword">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /><path v-if="!showPassword" d="m3 3 18 18" /></svg>
                </button>
              </div>
            </div>

            <transition name="access-message">
              <p v-if="displayError" class="access-error" role="alert">{{ displayError }}</p>
            </transition>

            <button type="submit" class="access-submit" :disabled="loading">
              <span>{{ loading ? '正在验证身份…' : '进入工作台' }}</span>
              <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>
              <span v-else class="access-spinner" aria-hidden="true"></span>
            </button>
          </form>

          <div class="access-form-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>
            <span>使用授权账号访问生态资源数据</span>
          </div>
        </div>
        <footer class="access-form-footer">© 大别山革命老区生态资源数据库平台</footer>
      </div>
    </section>
  </main>
</template>
