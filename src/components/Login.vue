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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/authStore'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const handleLogin = async () => {
  const success = await authStore.login(form.value.email, form.value.password)
  
  if (success) {
    router.push('/')
  }
}
</script>