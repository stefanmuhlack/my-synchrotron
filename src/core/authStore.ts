import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserSession, UserRole } from '@/types'
import { ensureValidRole } from '@/types'
import { apiService } from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const users = ref<User[]>([])
  
  const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours

  // Multi-tenant filtering with robust role checking
  const accessibleUsers = computed(() => {
    if (!user.value) return []
    
    const currentUserRole = user.value.role
    
    if (currentUserRole === 'admin') {
      return users.value // Admin sees all users
    }
    
    if (currentUserRole === 'coach') {
      return users.value.filter(u => 
        u.mandant === user.value!.id || u.id === user.value!.id
      )
    }
    
    // Coachees only see themselves
    return users.value.filter(u => u.id === user.value!.id)
  })

  const validateInput = (email: string, password: string): string | null => {
    if (!email?.trim()) return 'Email is required'
    if (!email.includes('@')) return 'Please enter a valid email address'
    if (!password) return 'Password is required'
    return null
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    error.value = null
    loading.value = true

    try {
      // Validate input
      const validationError = validateInput(email, password)
      if (validationError) {
        error.value = validationError
        return false
      }

      // Call API login
      const loginResponse = await apiService.login({ email, password })
      
      // Validate and ensure role is correct
      const validatedUser: User = {
        ...loginResponse.user,
        role: ensureValidRole(loginResponse.user.role)
      }

      // Create session
      const session: UserSession = {
        user: validatedUser,
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + sessionDuration).toISOString()
      }

      // Store session
      user.value = session.user
      localStorage.setItem('userSession', JSON.stringify(session))

      // Load users for admin/coach roles
      if (validatedUser.role === 'admin' || validatedUser.role === 'coach') {
        await loadUsers()
      }

      return true
    } catch (err) {
      console.error('Login error:', err)
      error.value = err instanceof Error ? err.message : 'Login failed. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = (): void => {
    user.value = null
    error.value = null
    users.value = []
    localStorage.removeItem('userSession')
    apiService.logout()
  }

  const initAuth = async (): Promise<void> => {
    try {
      // Check for existing session
      const storedSession = localStorage.getItem('userSession')
      if (!storedSession) return

      const session: UserSession = JSON.parse(storedSession)
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        localStorage.removeItem('userSession')
        return
      }

      // Verify token with backend
      try {
        const currentUser = await apiService.verifyToken()
        
        user.value = {
          ...currentUser,
          role: ensureValidRole(currentUser.role)
        }

        // Load users for admin/coach roles
        if (user.value.role === 'admin' || user.value.role === 'coach') {
          await loadUsers()
        }
      } catch (tokenError) {
        console.warn('Token verification failed:', tokenError)
        localStorage.removeItem('userSession')
        apiService.logout()
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      localStorage.removeItem('userSession')
      apiService.logout()
    }
  }

  const loadUsers = async (): Promise<void> => {
    try {
      const fetchedUsers = await apiService.getUsers()
      
      // Validate and sanitize user roles
      users.value = fetchedUsers.map(u => ({
        ...u,
        role: ensureValidRole(u.role)
      }))
    } catch (err) {
      console.error('Failed to load users:', err)
      error.value = 'Failed to load user data'
    }
  }

  const hasRole = (role: UserRole): boolean => {
    return user.value?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  const canAccessUser = (targetUserId: string): boolean => {
    if (!user.value) return false
    
    if (user.value.role === 'admin') return true
    
    if (user.value.role === 'coach') {
      const targetUser = users.value.find(u => u.id === targetUserId)
      return targetUser?.mandant === user.value.id || targetUser?.id === user.value.id
    }
    
    return targetUserId === user.value.id
  }

  // CRUD operations for admin with API integration
  const createUser = async (userData: Omit<User, 'id' | 'hashedPassword'> & { password: string }): Promise<boolean> => {
    if (!hasRole('admin')) return false
    
    try {
      const newUser = await apiService.createUser({
        ...userData,
        role: ensureValidRole(userData.role),
        modulePermissions: userData.role === 'admin' ? [] : userData.modulePermissions || []
      })
      
      // Add to local users array
      users.value.push(newUser)
      return true
    } catch (err) {
      console.error('Failed to create user:', err)
      error.value = err instanceof Error ? err.message : 'Failed to create user'
      return false
    }
  }

  const updateUser = async (userId: string, userData: Partial<User> & { password?: string }): Promise<boolean> => {
    if (!hasRole('admin') && !canAccessUser(userId)) return false
    
    try {
      const updateData = { ...userData }
      
      // Validate role if provided
      if (updateData.role) {
        updateData.role = ensureValidRole(updateData.role)
      }
      
      const updatedUser = await apiService.updateUser(userId, updateData)
      
      // Update local users array
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex] = updatedUser
      }
      
      // Update current user if editing self
      if (user.value?.id === userId) {
        user.value = { ...user.value, ...updatedUser }
      }
      
      return true
    } catch (err) {
      console.error('Failed to update user:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update user'
      return false
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!hasRole('admin') || userId === user.value?.id) return false
    
    try {
      await apiService.deleteUser(userId)
      
      // Remove from local users array
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value.splice(userIndex, 1)
      }
      
      return true
    } catch (err) {
      console.error('Failed to delete user:', err)
      error.value = err instanceof Error ? err.message : 'Failed to delete user'
      return false
    }
  }

  const updateUserModulePermissions = async (userId: string, modulePermissions: string[]): Promise<boolean> => {
    if (!hasRole('admin')) return false
    
    try {
      const updatedUser = await apiService.updateUserPermissions(userId, modulePermissions)
      
      // Update local users array
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        users.value[userIndex] = updatedUser
      }
      
      // Update current user if editing self
      if (user.value?.id === userId) {
        user.value.modulePermissions = modulePermissions
      }
      
      return true
    } catch (err) {
      console.error('Failed to update user module permissions:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update user permissions'
      return false
    }
  }

  const getUserStats = async () => {
    try {
      return await apiService.getUserStats()
    } catch (err) {
      console.error('Failed to get user stats:', err)
      throw err
    }
  }

  return {
    user,
    loading,
    error,
    users,
    accessibleUsers,
    login,
    logout,
    initAuth,
    hasRole,
    hasAnyRole,
    canAccessUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserModulePermissions,
    loadUsers,
    getUserStats
  }
})