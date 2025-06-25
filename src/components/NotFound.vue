<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-900">
    <div class="text-center">
      <div class="mb-8">
        <ExclamationTriangleIcon class="w-24 h-24 text-yellow-500 mx-auto mb-4" />
        <h1 class="text-6xl font-bold text-white mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-gray-300 mb-2">Page Not Found</h2>
        <p class="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div class="space-y-4">
        <router-link 
          to="/" 
          class="btn-primary inline-flex items-center"
        >
          <HomeIcon class="w-5 h-5 mr-2" />
          Go to Dashboard
        </router-link>
        
        <div>
          <button 
            @click="$router.go(-1)" 
            class="btn-secondary inline-flex items-center"
          >
            <ArrowLeftIcon class="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ExclamationTriangleIcon, 
  HomeIcon, 
  ArrowLeftIcon 
} from '@heroicons/vue/24/outline'
</script>