import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)

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
  }

  return { user, login, logout }
})
