import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isAdminMode = ref(false)

  const login = (username: string, password: string) => {
    user.value = {
      id: '1',
      username,
      token: 'mock-token',
      role: 'user',
    }
    localStorage.setItem('token', 'mock-token')
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('token')
    isAdminMode.value = false
  }

  const toggleAdminMode = () => {
    // TODO: 正式上线时启用密码验证
    // const ADMIN_PASSWORD = 'admin123'
    // if (!isAdminMode.value) {
    //   const password = await ElMessageBox.prompt('请输入 Admin 密码', '验证')
    //   if (password.value !== ADMIN_PASSWORD) {
    //     ElMessage.error('密码错误')
    //     return
    //   }
    // }
    isAdminMode.value = !isAdminMode.value
    ElMessage.success(isAdminMode.value ? '已切换 Admin 模式' : '已切换普通模式')
  }

  return { user, isAdminMode, login, logout, toggleAdminMode }
})
