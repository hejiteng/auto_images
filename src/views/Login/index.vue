<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')

const handleLogin = () => {
  if (username.value && password.value) {
    userStore.login(username.value, password.value)
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2>施工质检标注系统</h2>
      <div class="form-group">
        <label>用户名</label>
        <input v-model="username" type="text" placeholder="请输入用户名" />
      </div>
      <div class="form-group">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" />
      </div>
      <button class="btn-login" @click="handleLogin">登录</button>
      <p class="hint">输入任意用户名密码即可登录（演示模式）</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.login-card {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 360px;

  h2 {
    text-align: center;
    margin-bottom: 24px;
  }
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 6px;
    color: #333;
    font-size: 14px;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #409eff;
    }
  }
}

.btn-login {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;

  &:hover {
    background: #3a8ee6;
  }
}

.hint {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin-top: 12px;
}
</style>
