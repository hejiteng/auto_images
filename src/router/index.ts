import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: () => import('@/views/Login/index.vue') },
    { path: '/dashboard', component: () => import('@/views/Dashboard/index.vue') },
    { path: '/practice', component: () => import('@/views/Practice/index.vue') },
    { path: '/review', component: () => import('@/views/Review/index.vue') },
    { path: '/upload', component: () => import('@/views/Upload/index.vue') },
    { path: '/admin', component: () => import('@/views/Admin/index.vue') },
  ],
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/admin') {
    const userStore = useUserStore()
    if (!userStore.isAdminMode) {
      ElMessage.warning('无权限，请先切换 Admin 模式')
      // TODO: 正式上线时可改为跳转登录页或弹密码框
      next(false)
      return
    }
  }
  next()
})

export default router
