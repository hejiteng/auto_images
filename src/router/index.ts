import { createRouter, createWebHistory } from 'vue-router'

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

export default router
