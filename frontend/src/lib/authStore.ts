import { create } from 'zustand'
import { api } from './api'

export interface User {
  id: string
  email: string
  name: string
  role: 'CANDIDATE' | 'COMPANY' | 'RECRUITER' | 'ADMIN'
  avatarUrl?: string | null
  candidate?: {
    id: string
    headline?: string | null
    skills: string[]
    resumeUrl?: string | null
  } | null
  company?: {
    id: string
    cnpj: string
    logoUrl?: string | null
    size: string
  } | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; name: string; password: string; role: 'CANDIDATE' | 'COMPANY'; cnpj?: string }) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.post<{ user: User; token: string }>('/api/v1/auth/login', { email, password })
      if (data.token) {
        localStorage.setItem('jobspark_token', data.token)
      }
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'E-mail ou senha incorretos.', isLoading: false, isAuthenticated: false })
      throw err
    }
  },

  register: async (registerData) => {
    set({ isLoading: true, error: null })
    try {
      const data = await api.post<{ user: User; token: string }>('/api/v1/auth/register', registerData)
      if (data.token) {
        localStorage.setItem('jobspark_token', data.token)
      }
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Erro ao realizar o cadastro.', isLoading: false, isAuthenticated: false })
      throw err
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      const token = localStorage.getItem('jobspark_token')
      const headers: Record<string, string> = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      await api.post('/api/v1/auth/logout', {}, { headers })
    } catch (err) {
      console.warn('Backend logout failed, clearing client state anyway', err)
    } finally {
      localStorage.removeItem('jobspark_token')
      set({ user: null, isAuthenticated: false, isLoading: false, error: null })
    }
  },

  loadUser: async () => {
    if (typeof window === 'undefined') return

    set({ isLoading: true, error: null })
    try {
      const token = localStorage.getItem('jobspark_token')
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false })
        return
      }

      const data = await api.get<{ user: User }>('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (err) {
      localStorage.removeItem('jobspark_token')
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  }
}))
