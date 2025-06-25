import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, UserSession, UsersData } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const users = ref<User[]>([]);
  
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

  // Load users from JSON file
  const loadUsers = async (): Promise<void> => {
    try {
      const response = await fetch('/data/users.json');
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      const data: UsersData = await response.json();
      users.value = data.users;
    } catch (err) {
      console.error('Failed to load users:', err);
      error.value = 'Failed to load user data';
    }
  };

  // Multi-tenant filtering
  const accessibleUsers = computed(() => {
    if (!user.value) return [];
    
    if (user.value.role === 'admin') {
      return users.value; // Admin sees all users
    }
    
    if (user.value.role === 'coach') {
      return users.value.filter(u => 
        u.mandant === user.value!.id || u.id === user.value!.id
      );
    }
    
    // Coachees only see themselves
    return users.value.filter(u => u.id === user.value!.id);
  });

  const validateInput = (email: string, password: string): string | null => {
    if (!email?.trim()) return 'Email is required';
    if (!email.includes('@')) return 'Please enter a valid email address';
    if (!password) return 'Password is required';
    return null;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    error.value = null;
    loading.value = true;

    try {
      // Validate input
      const validationError = validateInput(email, password);
      if (validationError) {
        error.value = validationError;
        return false;
      }

      // Load users if not already loaded
      if (users.value.length === 0) {
        await loadUsers();
      }

      // Find user
      const foundUser = users.value.find(u => 
        u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!foundUser || foundUser.password !== password) {
        error.value = 'Invalid email or password';
        return false;
      }

      // Create session
      const session: UserSession = {
        user: { ...foundUser },
        loginTime: new Date().toISOString(),
        expiresAt: new Date(Date.now() + sessionDuration).toISOString()
      };

      // Store session
      user.value = session.user;
      localStorage.setItem('userSession', JSON.stringify(session));

      return true;
    } catch (err) {
      console.error('Login error:', err);
      error.value = 'Login failed. Please try again.';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const logout = (): void => {
    user.value = null;
    error.value = null;
    localStorage.removeItem('userSession');
  };

  const initAuth = async (): Promise<void> => {
    try {
      // Load users first
      await loadUsers();

      // Check for existing session
      const storedSession = localStorage.getItem('userSession');
      if (!storedSession) return;

      const session: UserSession = JSON.parse(storedSession);
      
      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        localStorage.removeItem('userSession');
        return;
      }

      // Validate user still exists and data is current
      const currentUser = users.value.find(u => u.id === session.user.id);
      if (currentUser) {
        user.value = currentUser;
      } else {
        localStorage.removeItem('userSession');
      }
    } catch (err) {
      console.error('Failed to initialize auth:', err);
      localStorage.removeItem('userSession');
    }
  };

  const hasRole = (role: string): boolean => {
    return user.value?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user.value ? roles.includes(user.value.role) : false;
  };

  const canAccessUser = (targetUserId: string): boolean => {
    if (!user.value) return false;
    
    if (user.value.role === 'admin') return true;
    
    if (user.value.role === 'coach') {
      const targetUser = users.value.find(u => u.id === targetUserId);
      return targetUser?.mandant === user.value.id || targetUser?.id === user.value.id;
    }
    
    return targetUserId === user.value.id;
  };

  // CRUD operations for admin
  const createUser = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    if (!hasRole('admin')) return false;
    
    try {
      const newUser: User = {
        ...userData,
        id: Date.now().toString()
      };
      
      users.value.push(newUser);
      // In a real app, this would save to the backend
      return true;
    } catch (err) {
      console.error('Failed to create user:', err);
      return false;
    }
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    if (!hasRole('admin') && !canAccessUser(userId)) return false;
    
    try {
      const userIndex = users.value.findIndex(u => u.id === userId);
      if (userIndex === -1) return false;
      
      users.value[userIndex] = { ...users.value[userIndex], ...userData };
      
      // Update current user if editing self
      if (user.value?.id === userId) {
        user.value = { ...user.value, ...userData };
      }
      
      return true;
    } catch (err) {
      console.error('Failed to update user:', err);
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    if (!hasRole('admin') || userId === user.value?.id) return false;
    
    try {
      const userIndex = users.value.findIndex(u => u.id === userId);
      if (userIndex === -1) return false;
      
      users.value.splice(userIndex, 1);
      return true;
    } catch (err) {
      console.error('Failed to delete user:', err);
      return false;
    }
  };

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
    loadUsers
  };
});