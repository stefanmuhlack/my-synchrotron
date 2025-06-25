<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Dashboard</h1>
      <p class="text-gray-400">Welcome back, {{ authStore.user?.name }}!</p>
      <div v-if="authStore.user?.role !== 'admin'" class="mt-2">
        <span class="text-sm text-gray-500">
          Tenant: {{ authStore.user?.mandant === '*' ? 'All' : `Coach ${authStore.user?.mandant}` }}
        </span>
      </div>
    </div>
    
    <!-- Module Loading Status Banners -->
    <div v-if="moduleStatusStore.summary.totalModules === 0" class="mb-8">
      <div class="card bg-yellow-900/20 border border-yellow-500/30">
        <div class="flex items-center">
          <ExclamationTriangleIcon class="w-8 h-8 text-yellow-400 mr-4" />
          <div>
            <h3 class="text-lg font-semibold text-yellow-400">Keine kompatiblen Module geladen</h3>
            <p class="text-yellow-300">Es wurden keine Module gefunden oder alle Module sind inkompatibel.</p>
            <router-link 
              v-if="authStore.hasRole('admin')" 
              to="/admin" 
              class="text-yellow-200 hover:text-yellow-100 underline mt-2 inline-block"
            >
              Zur Modulverwaltung →
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="moduleStatusStore.summary.skippedModules > 0" class="mb-8">
      <div class="card bg-orange-900/20 border border-orange-500/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <InformationCircleIcon class="w-8 h-8 text-orange-400 mr-4" />
            <div>
              <h3 class="text-lg font-semibold text-orange-400">
                {{ moduleStatusStore.summary.skippedModules }} Module übersprungen
              </h3>
              <p class="text-orange-300">
                Einige Module konnten aufgrund von Versionsinkompatibilitäten nicht geladen werden.
              </p>
            </div>
          </div>
          <div class="flex space-x-3">
            <button 
              @click="showSkippedModules = !showSkippedModules"
              class="btn-secondary text-sm"
            >
              {{ showSkippedModules ? 'Ausblenden' : 'Details anzeigen' }}
            </button>
            <router-link 
              v-if="authStore.hasRole('admin')" 
              to="/admin?tab=versions" 
              class="btn-primary text-sm"
            >
              Versionsbericht
            </router-link>
          </div>
        </div>
        
        <!-- Skipped Modules Details -->
        <div v-if="showSkippedModules" class="mt-4 pt-4 border-t border-orange-500/30">
          <h4 class="font-medium text-orange-300 mb-3">Übersprungene Module:</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div 
              v-for="module in moduleStatusStore.skippedModules" 
              :key="module.moduleKey"
              class="p-3 bg-orange-800/20 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-orange-200">{{ module.name }}</span>
                <span class="text-xs text-orange-400">
                  {{ module.version || 'Keine Version' }}
                </span>
              </div>
              <p class="text-sm text-orange-300 mt-1">
                {{ module.errors[0] || 'Versionsinkompatibilität' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Module Widgets -->
    <div v-if="widgets.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div
        v-for="widget in widgets"
        :key="widget.key"
        class="card"
      >
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-white">{{ widget.name }}</h3>
        </div>
        <Suspense>
          <component :is="widget.component" />
          <template #fallback>
            <div class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          </template>
        </Suspense>
      </div>
    </div>
    
    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-primary-500 rounded-lg">
            <PuzzlePieceIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Available Modules</p>
            <p class="text-2xl font-semibold text-white">{{ modulesStore.userAccessibleModules.length }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-green-500 rounded-lg">
            <UserIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">User Role</p>
            <p class="text-2xl font-semibold text-white capitalize">{{ authStore.user?.role }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-purple-500 rounded-lg">
            <ChartBarIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Accessible Users</p>
            <p class="text-2xl font-semibold text-white">{{ authStore.accessibleUsers.length }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="card">
      <h2 class="text-xl font-semibold text-white mb-4">Quick Actions</h2>
      <div v-if="modulesStore.userAccessibleModules.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <router-link
          v-for="module in modulesStore.userAccessibleModules"
          :key="module.key"
          :to="`/${module.config.routePrefix}`"
          class="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <h3 class="font-medium text-white">{{ module.config.name }}</h3>
          <p class="text-sm text-gray-400 mt-1">{{ module.config.description || 'No description' }}</p>
        </router-link>
      </div>
      <div v-else class="text-center py-8">
        <p class="text-gray-400">No modules available for your role</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/core/authStore'
import { useModulesStore } from '@/stores/modules'
import { useModuleStatusStore } from '@/stores/moduleStatus'
import { 
  PuzzlePieceIcon, 
  UserIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const modulesStore = useModulesStore()
const moduleStatusStore = useModuleStatusStore()

const widgets = ref<any[]>([])
const showSkippedModules = ref(false)

onMounted(async () => {
  try {
    widgets.value = await modulesStore.getDashboardWidgets()
  } catch (error) {
    console.error('Failed to load dashboard widgets:', error)
  }
})
</script>