<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
</script>

<template>
  <div class="app-layout">
    <div class="top-nav">
      <router-link to="/dashboard" class="nav-link">首页</router-link>
      <div class="nav-buttons">
        <button :class="['nav-btn', { active: route.path === '/practice' }]" @click="router.push('/practice')">
          答题模式
        </button>
        <button :class="['nav-btn', { active: route.path === '/admin' }]" @click="router.push('/admin')">
          管理模式
        </button>
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

.nav-link {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-decoration: none;
}

.nav-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nav-btn {
  padding: 8px 20px;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }

  &.active {
    background: #409eff;
    border-color: #409eff;
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
