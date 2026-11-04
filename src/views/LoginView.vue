<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const route = useRoute()
const { login } = useAuth()

const account = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
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
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">🌳</div>
        <h1 class="login-title">大别山革命老区</h1>
        <p class="login-subtitle">生态资源数据库平台</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">账号</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input v-model="account" type="text" class="form-input" placeholder="admin" autocomplete="username" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <span class="input-icon">🔒</span>
            <input v-model="password" type="password" class="form-input" placeholder="123456"
              autocomplete="current-password" />
          </div>
        </div>

        <transition name="msg-fade">
          <p v-if="displayError" class="error-msg">{{ displayError }}</p>
        </transition>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '验证中...' : '登 录' }}
        </button>
      </form>
    </div>

    <p class="copyright">© 大别山革命老区生态资源数据库平台</p>
  </div>
</template>