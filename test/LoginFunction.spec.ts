import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/core/authStore'
import { hashPassword, verifyPassword } from '@/utils/hashPassword'
import type { User } from '@/types'

// Mock users data with hashed passwords
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    hashedPassword: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    name: 'System Administrator',
    role: 'admin',
    mandant: '*',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1'
  },
  {
    id: '2',
    email: 'coach1@example.com',
    hashedPassword: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // coach123
    name: 'John Coach',
    role: 'coach',
    mandant: '*',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1'
  },
  {
    id: '3',
    email: 'coachee1@example.com',
    hashedPassword: '5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5', // coachee123
    name: 'Alice Coachee',
    role: 'coachee',
    mandant: '2',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1'
  }
]

// Mock fetch
global.fetch = vi.fn()

describe('Login Function Tests', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    // Create fresh Pinia instance for each test
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // Mock fetch to return users data
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ users: mockUsers })
    } as Response)

    // Clear localStorage
    localStorage.clear()
  })

  describe('Password Hashing', () => {
    it('should hash passwords correctly', async () => {
      const password = 'admin123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeTruthy()
      expect(hash).toHaveLength(64) // SHA-256 produces 64 character hex string
      expect(typeof hash).toBe('string')
    })

    it('should verify passwords correctly', async () => {
      const password = 'admin123'
      const hash = await hashPassword(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect passwords', async () => {
      const correctPassword = 'admin123'
      const wrongPassword = 'wrongpassword'
      const hash = await hashPassword(correctPassword)
      
      const isValid = await verifyPassword(wrongPassword, hash)
      expect(isValid).toBe(false)
    })

    it('should produce consistent hashes for same password', async () => {
      const password = 'testpassword'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).toBe(hash2)
    })
  })

  describe('Login Validation', () => {
    it('should successfully login with correct credentials', async () => {
      await authStore.loadUsers()
      
      const success = await authStore.login('admin@example.com', 'admin123')
      
      expect(success).toBe(true)
      expect(authStore.user).toBeTruthy()
      expect(authStore.user?.email).toBe('admin@example.com')
      expect(authStore.user?.role).toBe('admin')
      expect(authStore.error).toBeNull()
    })

    it('should fail login with incorrect password', async () => {
      await authStore.loadUsers()
      
      const success = await authStore.login('admin@example.com', 'wrongpassword')
      
      expect(success).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.error).toBe('Invalid email or password')
    })

    it('should fail login with non-existent email', async () => {
      await authStore.loadUsers()
      
      const success = await authStore.login('nonexistent@example.com', 'password')
      
      expect(success).toBe(false)
      expect(authStore.user).toBeNull()
      expect(authStore.error).toBe('Invalid email or password')
    })

    it('should validate email format', async () => {
      const success = await authStore.login('invalid-email', 'password')
      
      expect(success).toBe(false)
      expect(authStore.error).toBe('Please enter a valid email address')
    })

    it('should require email', async () => {
      const success = await authStore.login('', 'password')
      
      expect(success).toBe(false)
      expect(authStore.error).toBe('Email is required')
    })

    it('should require password', async () => {
      const success = await authStore.login('admin@example.com', '')
      
      expect(success).toBe(false)
      expect(authStore.error).toBe('Password is required')
    })

    it('should be case insensitive for email', async () => {
      await authStore.loadUsers()
      
      const success = await authStore.login('ADMIN@EXAMPLE.COM', 'admin123')
      
      expect(success).toBe(true)
      expect(authStore.user?.email).toBe('admin@example.com')
    })

    it('should trim whitespace from email', async () => {
      await authStore.loadUsers()
      
      const success = await authStore.login('  admin@example.com  ', 'admin123')
      
      expect(success).toBe(true)
      expect(authStore.user?.email).toBe('admin@example.com')
    })
  })

  describe('Session Management', () => {
    it('should create session on successful login', async () => {
      await authStore.loadUsers()
      
      const success = await authStore.login('admin@example.com', 'admin123')
      
      expect(success).toBe(true)
      expect(authStore.user).toBeTruthy()
    })

    it('should restore valid session on init', async () => {
      // Mock existing valid session
      const mockSession = {
        user: mockUsers[0],
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(mockSession))
      
      await authStore.initAuth()
      
      expect(authStore.user).toBeTruthy()
      expect(authStore.user?.email).toBe('admin@example.com')
    })

    it('should clear expired session', async () => {
      // Mock expired session
      const expiredSession = {
        user: mockUsers[0],
        loginTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
      
      vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(expiredSession))
      
      await authStore.initAuth()
      
      expect(authStore.user).toBeNull()
    })

    it('should logout and clear session', () => {
      // Set up logged in state
      authStore.user = mockUsers[0]
      
      authStore.logout()
      
      expect(authStore.user).toBeNull()
      expect(authStore.error).toBeNull()
    })
  })

  describe('Role-based Access', () => {
    it('should correctly identify admin role', async () => {
      await authStore.loadUsers()
      await authStore.login('admin@example.com', 'admin123')
      
      expect(authStore.hasRole('admin')).toBe(true)
      expect(authStore.hasRole('coach')).toBe(false)
      expect(authStore.hasRole('coachee')).toBe(false)
    })

    it('should correctly identify coach role', async () => {
      await authStore.loadUsers()
      await authStore.login('coach1@example.com', 'coach123')
      
      expect(authStore.hasRole('coach')).toBe(true)
      expect(authStore.hasRole('admin')).toBe(false)
      expect(authStore.hasRole('coachee')).toBe(false)
    })

    it('should correctly identify coachee role', async () => {
      await authStore.loadUsers()
      await authStore.login('coachee1@example.com', 'coachee123')
      
      expect(authStore.hasRole('coachee')).toBe(true)
      expect(authStore.hasRole('admin')).toBe(false)
      expect(authStore.hasRole('coach')).toBe(false)
    })

    it('should check multiple roles correctly', async () => {
      await authStore.loadUsers()
      await authStore.login('coach1@example.com', 'coach123')
      
      expect(authStore.hasAnyRole(['admin', 'coach'])).toBe(true)
      expect(authStore.hasAnyRole(['admin', 'coachee'])).toBe(false)
      expect(authStore.hasAnyRole(['coach', 'coachee'])).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'))
      
      const success = await authStore.login('admin@example.com', 'admin123')
      
      expect(success).toBe(false)
      expect(authStore.error).toBe('Login failed. Please try again.')
    })

    it('should handle invalid JSON response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      } as Response)
      
      await authStore.loadUsers()
      
      expect(authStore.error).toBe('Failed to load user data')
      expect(authStore.users).toHaveLength(0)
    })

    it('should handle 404 response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404
      } as Response)
      
      await authStore.loadUsers()
      
      expect(authStore.error).toBe('Failed to load user data')
    })
  })

  describe('User Management', () => {
    it('should create new user (admin only)', async () => {
      await authStore.loadUsers()
      await authStore.login('admin@example.com', 'admin123')
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'coachee' as const,
        mandant: '2',
        avatar: 'https://example.com/avatar.jpg'
      }
      
      const success = await authStore.createUser(userData)
      
      expect(success).toBe(true)
      
      const newUser = authStore.users.find(u => u.email === 'test@example.com')
      expect(newUser).toBeTruthy()
      expect(newUser?.hashedPassword).toBeTruthy()
    })

    it('should not allow non-admin to create users', async () => {
      await authStore.loadUsers()
      await authStore.login('coach1@example.com', 'coach123')
      
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword',
        role: 'coachee' as const,
        mandant: '2',
        avatar: 'https://example.com/avatar.jpg'
      }
      
      const success = await authStore.createUser(userData)
      
      expect(success).toBe(false)
    })
  })
})