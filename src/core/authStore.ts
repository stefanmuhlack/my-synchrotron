import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { verifyPassword, hashPassword } from '@/utils/hashPassword'
import type { User, UserSession, UsersData, UserRole } from '@/types'
import { ensureValidRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const users = ref<User[]>([])
  
  const sessionDuration = 24 * 60 * 60 * 1000 // 24 hours

  // Load users from JSON file with role validation
  const loadUsers = async (): Promise<void> => {
    try {
      const response = await fetch('/data/users.json')
      if (!response.ok) {
        throw new Error('Failed to load users')
      }
      const data: UsersData = await response.json()
      
      // Validate and sanitize user roles
      users.value = data.users.map(user => ({
        ...user,
        role: ensureValidRole(user.role)
      }))
    } catch (err) {
      console.error('Failed to load users:', err)
      error.value = 'Failed to load user data'
    }
  }

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

      // Load users if not already loaded
      if (users.value.length === 0) {
        await loadUsers()
      }

      // Find user
      const foundUser = users.value.find(u => 
        u.email.toLowerCase() === email.toLowerCase().trim()
      )

      if (!foundUser) {
        error.value = 'Invalid email or password'
        return false
      }

      // For demo purposes, check both hashed password and plain text password
      let isPasswordValid = false
      
      if (foundUser.hashedPassword) {
        // Try hashed password first
        isPasswordValid = await verifyPassword(password, foundUser.hashedPassword)
      }
      
      // If hashed password fails or doesn't exist, try plain text (for backward compatibility)
      if (!isPasswordValid && foundUser.password) {
        isPasswordValid = foundUser.password === password
      }
      
      if (!isPasswordValid) {
        error.value = 'Invalid email or password'
        return false
      }

      // Validate and ensure role is correct
      const validatedUser: User = {
        ...foundUser,
        role: ensureValidRole(foundUser.role)
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

      return true
    } catch (err) {
      console.error('Login error:', err)
      error.value = 'Login failed. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = (): void => {
    user.value = null
    error.value = null
    localStorage.removeItem('userSession')
  }

  const initAuth = async (): Promise<void> => {
    try {
      // Load users first
      await loadUsers()

      // Check for existing session
      const storedSession = localStorage.getItem('userSession')
      if (!storedSession) return

      const session: UserSession = JSON.parse(storedSession)
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        localStorage.removeItem('userSession')
        return
      }

      // Validate user still exists and data is current
      const currentUser = users.value.find(u => u.id === session.user.id)
      if (currentUser) {
        user.value = {
          ...currentUser,
          role: ensureValidRole(currentUser.role)
        }
      } else {
        localStorage.removeItem('userSession')
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err)
      localStorage.removeItem('userSession')
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

  // CRUD operations for admin with role validation
  const createUser = async (userData: Omit<User, 'id' | 'hashedPassword'> & { password: string }): Promise<boolean> => {
    if (!hasRole('admin')) return false
    
    try {
      // Validate role
      const validatedRole = ensureValidRole(userData.role)
      
      const hashedPassword = await hashPassword(userData.password)
      
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        role: validatedRole,
        hashedPassword,
        modulePermissions: userData.modulePermissions || []
      }
      
      // Remove password from the object before storing
      const { password, ...userWithoutPassword } = userData
      Object.assign(newUser, userWithoutPassword)
      
      users.value.push(newUser)
      return true
    } catch (err) {
      console.error('Failed to create user:', err)
      return false
    }
  }

  const updateUser = async (userId: string, userData: Partial<User> & { password?: string }): Promise<boolean> => {
    if (!hasRole('admin') && !canAccessUser(userId)) return false
    
    try {
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex === -1) return false
      
      const updateData = { ...userData }
      
      // Validate role if provided
      if (updateData.role) {
        updateData.role = ensureValidRole(updateData.role)
      }
      
      // Hash password if provided
      if (userData.password) {
        updateData.hashedPassword = await hashPassword(userData.password)
        delete updateData.password
      }
      
      users.value[userIndex] = { ...users.value[userIndex], ...updateData }
      
      // Update current user if editing self
      if (user.value?.id === userId) {
        user.value = { ...user.value, ...updateData }
      }
      
      return true
    } catch (err) {
      console.error('Failed to update user:', err)
      return false
    }
  }

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!hasRole('admin') || userId === user.value?.id) return false
    
    try {
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex === -1) return false
      
      users.value.splice(userIndex, 1)
      return true
    } catch (err) {
      console.error('Failed to delete user:', err)
      return false
    }
  }

  const updateUserModulePermissions = async (userId: string, modulePermissions: string[]): Promise<boolean> => {
    if (!hasRole('admin')) return false
    
    try {
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex === -1) return false
      
      users.value[userIndex].modulePermissions = modulePermissions
      
      // Update current user if editing self
      if (user.value?.id === userId) {
        user.value.modulePermissions = modulePermissions
      }
      
      return true
    } catch (err) {
      console.error('Failed to update user module permissions:', err)
      return false
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
    loadUsers
  }
})