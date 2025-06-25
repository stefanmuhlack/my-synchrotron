<template>
  <div class="min-h-screen bg-gray-900 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-gray-800 border-r border-gray-700">
      <div class="p-6">
        <h1 class="text-xl font-bold text-white">Modular App</h1>
        <p class="text-sm text-gray-400 mt-1">{{ authStore.user?.role }} Portal</p>
      </div>
      
      <nav class="mt-6">
        <div class="px-6 py-2">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Main
          </h2>
        </div>
        
        <router-link
          to="/"
          class="flex items-center px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700 text-white': $route.name === 'Dashboard' }"
        >
          <HomeIcon class="w-5 h-5 mr-3" />
          Dashboard
        </router-link>
        
        <router-link
          v-if="authStore.hasRole('admin')"
          to="/admin"
          class="flex items-center px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          :class="{ 'bg-gray-700 text-white': $route.name === 'Admin' }"
        >
          <CogIcon class="w-5 h-5 mr-3" />
          Admin Panel
        </router-link>
        
        <!-- Module Navigation -->
        <div v-if="moduleNavigation.length > 0" class="mt-6">
          <div class="px-6 py-2">
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Modules
            </h2>
          </div>
          
          <router-link
            v-for="nav in moduleNavigation"
            :key="nav.path"
            :to="nav.path"
            class="flex items-center px-6 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            :class="{ 'bg-gray-700 text-white': $route.path.startsWith(nav.path) }"
          >
            <component :is="nav.icon" class="w-5 h-5 mr-3" />
            {{ nav.name }}
          </router-link>
        </div>
      </nav>
      
      <!-- User Profile -->
      <div class="absolute bottom-0 w-64 p-6 border-t border-gray-700">
        <div class="flex items-center">
          <img
            :src="authStore.user?.avatar"
            :alt="authStore.user?.name"
            class="w-8 h-8 rounded-full"
          />
          <div class="ml-3">
            <p class="text-sm font-medium text-white">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-400 capitalize">{{ authStore.user?.role }}</p>
          </div>
        </div>
        <button
          @click="logout"
          class="mt-3 w-full btn-secondary text-sm"
        >
          Logout
        </button>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/authStore'
import { useModulesStore } from '@/stores/modules'
import { 
  HomeIcon, 
  CogIcon, 
  PuzzlePieceIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const modulesStore = useModulesStore()

const moduleNavigation = computed(() => {
  const nav = []
  
  for (const module of modulesStore.userAccessibleModules) {
    nav.push({
      name: module.config.name,
      path: `/${module.config.routePrefix}`,
      icon: getModuleIcon(module.key)
    })
  }
  
  return nav
})

const getModuleIcon = (moduleKey: string) => {
  const iconMap: Record<string, any> = {
    'goals': ChartBarIcon,
    'tasks': ClipboardDocumentListIcon,
    'coaching': PuzzlePieceIcon
  }
  return iconMap[moduleKey] || PuzzlePieceIcon
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>