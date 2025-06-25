/**
 * API Service Layer
 * Centralized HTTP client for backend communication
 */

import type { User, UserRole, ModuleConfig } from '@/types'

export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: any[]
  timestamp: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CreateUserRequest {
  email: string
  password: string
  name: string
  role: UserRole
  mandant?: string
  avatar?: string
  modulePermissions?: string[]
}

class ApiService {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '/api'
    this.token = localStorage.getItem('authToken')
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('authToken', token)
    } else {
      localStorage.removeItem('authToken')
    }
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data: ApiResponse<T> = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  /**
   * GET request
   */
  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return this.request<T>(url.pathname + url.search)
  }

  /**
   * POST request
   */
  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUT request
   */
  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PATCH request
   */
  private async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETE request
   */
  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  // ==========================================
  // AUTH ENDPOINTS
  // ==========================================

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/login', credentials)
    
    if (response.success && response.data) {
      this.setToken(response.data.token)
      return response.data
    }
    
    throw new Error(response.message || 'Login failed')
  }

  /**
   * Register user
   */
  async register(userData: CreateUserRequest): Promise<LoginResponse> {
    const response = await this.post<LoginResponse>('/auth/register', userData)
    
    if (response.success && response.data) {
      this.setToken(response.data.token)
      return response.data
    }
    
    throw new Error(response.message || 'Registration failed')
  }

  /**
   * Verify token and get current user
   */
  async verifyToken(): Promise<User> {
    const response = await this.get<{ user: User }>('/auth/verify')
    
    if (response.success && response.data) {
      return response.data.user
    }
    
    throw new Error(response.message || 'Token verification failed')
  }

  /**
   * Logout (client-side only)
   */
  logout(): void {
    this.setToken(null)
  }

  // ==========================================
  // USER ENDPOINTS
  // ==========================================

  /**
   * Get all users (with filtering)
   */
  async getUsers(filters?: {
    role?: UserRole
    mandant?: string
    search?: string
  }): Promise<User[]> {
    const response = await this.get<User[]>('/users', filters)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch users')
  }

  /**
   * Get single user
   */
  async getUser(id: string): Promise<User> {
    const response = await this.get<User>(`/users/${id}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch user')
  }

  /**
   * Create user
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.post<User>('/users', userData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to create user')
  }

  /**
   * Update user
   */
  async updateUser(id: string, userData: Partial<User> & { password?: string }): Promise<User> {
    const response = await this.put<User>(`/users/${id}`, userData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to update user')
  }

  /**
   * Update user module permissions
   */
  async updateUserPermissions(id: string, modulePermissions: string[]): Promise<User> {
    const response = await this.patch<User>(`/users/${id}/permissions`, { modulePermissions })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to update user permissions')
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    const response = await this.delete(`/users/${id}`)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user')
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number
    adminCount: number
    coachCount: number
    coacheeCount: number
    lastUpdated: string
  }> {
    const response = await this.get('/users/stats/overview')
    
    if (response.success && response.data) {
      return response.data
    }
    
    return {
      totalUsers: 0,
      adminCount: 0,
      coachCount: 0,
      coacheeCount: 0,
      lastUpdated: new Date().toISOString()
    }
  }

  // ==========================================
  // MODULE ENDPOINTS
  // ==========================================

  /**
   * Get all modules (with filtering)
   */
  async getModules(filters?: {
    enabled?: boolean
    role?: UserRole
    search?: string
  }): Promise<ModuleConfig[]> {
    const response = await this.get<ModuleConfig[]>('/modules', filters)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch modules')
  }

  /**
   * Get single module
   */
  async getModule(key: string): Promise<ModuleConfig> {
    const response = await this.get<ModuleConfig>(`/modules/${key}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch module')
  }

  /**
   * Create module
   */
  async createModule(moduleData: Omit<ModuleConfig, 'id'>): Promise<ModuleConfig> {
    const response = await this.post<ModuleConfig>('/modules', moduleData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to create module')
  }

  /**
   * Update module
   */
  async updateModule(key: string, moduleData: Partial<ModuleConfig>): Promise<ModuleConfig> {
    const response = await this.put<ModuleConfig>(`/modules/${key}`, moduleData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to update module')
  }

  /**
   * Toggle module enabled status
   */
  async toggleModule(key: string): Promise<ModuleConfig> {
    const response = await this.patch<ModuleConfig>(`/modules/${key}/toggle`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to toggle module')
  }

  /**
   * Delete module
   */
  async deleteModule(key: string): Promise<void> {
    const response = await this.delete(`/modules/${key}`)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete module')
    }
  }

  /**
   * Get module health
   */
  async getModuleHealth(key: string): Promise<{
    moduleKey: string
    status: string
    lastCheck: string
    enabled: boolean
    error?: string
    uptime: number
  }> {
    const response = await this.get(`/modules/${key}/health`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    return {
      moduleKey: key,
      status: 'unknown',
      lastCheck: new Date().toISOString(),
      enabled: false,
      uptime: 0
    }
  }

  // ==========================================
  // GOALS ENDPOINTS
  // ==========================================

  /**
   * Get all goals (with filtering)
   */
  async getGoals(filters?: {
    status?: string
    userId?: string
    search?: string
  }): Promise<any[]> {
    const response = await this.get('/goals', filters)
    
    if (response.success && response.data) {
      return response.data
    }
    
    return []
  }

  /**
   * Get single goal
   */
  async getGoal(id: string): Promise<any> {
    const response = await this.get(`/goals/${id}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch goal')
  }

  /**
   * Create goal
   */
  async createGoal(goalData: any): Promise<any> {
    const response = await this.post('/goals', goalData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to create goal')
  }

  /**
   * Update goal
   */
  async updateGoal(id: string, goalData: any): Promise<any> {
    const response = await this.put(`/goals/${id}`, goalData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to update goal')
  }

  /**
   * Delete goal
   */
  async deleteGoal(id: string): Promise<void> {
    const response = await this.delete(`/goals/${id}`)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete goal')
    }
  }

  /**
   * Get goal statistics
   */
  async getGoalStats(): Promise<any> {
    const response = await this.get('/goals/stats/overview')
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch goal statistics')
  }

  // ==========================================
  // TASKS ENDPOINTS
  // ==========================================

  /**
   * Get all tasks (with filtering)
   */
  async getTasks(filters?: {
    status?: string
    priority?: string
    userId?: string
    goalId?: string
    search?: string
  }): Promise<any[]> {
    const response = await this.get('/tasks', filters)
    
    if (response.success && response.data) {
      return response.data
    }
    
    return []
  }

  /**
   * Get single task
   */
  async getTask(id: string): Promise<any> {
    const response = await this.get(`/tasks/${id}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch task')
  }

  /**
   * Create task
   */
  async createTask(taskData: any): Promise<any> {
    const response = await this.post('/tasks', taskData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to create task')
  }

  /**
   * Update task
   */
  async updateTask(id: string, taskData: any): Promise<any> {
    const response = await this.put(`/tasks/${id}`, taskData)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to update task')
  }

  /**
   * Delete task
   */
  async deleteTask(id: string): Promise<void> {
    const response = await this.delete(`/tasks/${id}`)
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete task')
    }
  }

  /**
   * Get task statistics
   */
  async getTaskStats(): Promise<any> {
    const response = await this.get('/tasks/stats/overview')
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.message || 'Failed to fetch task statistics')
  }

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  /**
   * Check API health
   */
  async healthCheck(): Promise<{
    status: string
    timestamp: string
    version: string
    environment: string
    uptime: number
  }> {
    const response = await this.get('/health')
    
    if (response.success && response.data) {
      return response.data
    }
    
    return {
      status: 'unknown',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'unknown',
      uptime: 0
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()
export default apiService