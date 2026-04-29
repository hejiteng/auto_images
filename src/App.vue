<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
</script>

<template>
  <div class="app-layout">
    <div class="top-nav">
      <button class="nav-btn-home" @click="router.push('/dashboard')">首页</button>
      <div class="nav-buttons">
        <el-switch
          v-model="userStore.isAdminMode"
          active-text="Admin"
          inactive-text="普通"
          class="admin-switch"
        />
      </div>
    </div>
    <div class="page-content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  min-height: 100vh;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-btn-home {
  padding: 8px 20px;
  border: 2px solid #409eff;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #409eff;
  transition: all 0.2s;

  &:hover {
    background: #409eff;
    color: #fff;
  }
}

.admin-switch {
  margin-left: 12px;
}

.page-content {
  min-height: calc(100vh - 45px);
}
</style>
