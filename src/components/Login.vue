<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900">
    <div class="max-w-md w-full space-y-8 p-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-sm text-gray-400">
          Enter your credentials to access the system
        </p>
      </div>
      
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300">
              Email address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field mt-1"
              placeholder="Enter your email"
              :disabled="authStore.loading"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field mt-1"
              placeholder="Enter your password"
              :disabled="authStore.loading"
            />
          </div>
        </div>
        
        <div v-if="authStore.error" class="text-red-400 text-sm text-center">
          {{ authStore.error }}
        </div>
        
        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full btn-primary"
        >
          <span v-if="authStore.loading">Signing in...</span>
          <span v-else>Sign in</span>
        </button>
      </form>
      
      <!-- Demo Credentials -->
      <div class="mt-6 p-4 bg-gray-800 rounded-lg">
        <h3 class="text-sm font-medium text-gray-300 mb-3">Demo Credentials:</h3>
        <div class="space-y-2 text-xs text-gray-400">
          <div class="flex justify-between">
            <span>admin@example.com</span>
            <span class="text-red-400">admin123</span>
          </div>
          <div class="flex justify-between">
            <span>coach1@example.com</span>
            <span class="text-blue-400">coach123</span>
          </div>
          <div class="flex justify-between">
            <span>coachee1@example.com</span>
            <span class="text-green-400">coachee123</span>
          </div>
        </div>
        
        <!-- Quick Login Buttons -->
        <div class="mt-4 space-y-2">
          <button
            v-for="credential in demoCredentials"
            :key="credential.email"
            @click="quickLogin(credential)"
            :disabled="authStore.loading"
            class="w-full text-left px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            <span class="font-medium">{{ credential.role }}</span>
            <span class="text-gray-400 ml-2">{{ credential.email }}</span>
          </button>
        </div>
      </div>
      
      <!-- API Status -->
      <div class="mt-4 p-3 bg-gray-800 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-400">API Status:</span>
          <div class="flex items-center space-x-2">
            <div 
              :class="apiStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'"
              class="w-2 h-2 rounded-full"
            ></div>
            <span class="text-xs text-gray-400 capitalize">{{ apiStatus }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/authStore'
import { apiService } from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const apiStatus = ref<'connected' | 'disconnected'>('disconnected')

const demoCredentials = [
  { email: 'admin@example.com', password: 'admin123', role: 'Admin' },
  { email: 'coach1@example.com', password: 'coach123', role: 'Coach' },
  { email: 'coachee1@example.com', password: 'coachee123', role: 'Coachee' }
]

const handleLogin = async () => {
  const success = await authStore.login(form.value.email, form.value.password)
  
  if (success) {
    router.push('/')
  }
}

const quickLogin = async (credential: { email: string; password: string; role: string }) => {
  form.value.email = credential.email
  form.value.password = credential.password
  await handleLogin()
}

const checkApiStatus = async () => {
  try {
    await apiService.healthCheck()
    apiStatus.value = 'connected'
  } catch (error) {
    apiStatus.value = 'disconnected'
    console.warn('API health check failed:', error)
  }
}

onMounted(() => {
  checkApiStatus()
})
</script>