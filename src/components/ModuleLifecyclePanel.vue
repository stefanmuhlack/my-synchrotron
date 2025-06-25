<template>
  <div class="space-y-6">
    <!-- System Status Overview -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-white">Module Lifecycle Management</h2>
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <div 
              :class="getSystemHealthColor(systemStatus.systemHealth)"
              class="w-3 h-3 rounded-full"
            ></div>
            <span class="text-sm text-gray-300 capitalize">{{ systemStatus.systemHealth }}</span>
          </div>
          <button @click="refreshStatus" class="btn-secondary text-sm">
            <ArrowPathIcon class="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      <!-- Status Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <PuzzlePieceIcon class="w-8 h-8 text-blue-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Total Modules</p>
              <p class="text-xl font-semibold text-white">{{ systemStatus.totalModules }}</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <CheckCircleIcon class="w-8 h-8 text-green-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Healthy</p>
              <p class="text-xl font-semibold text-white">{{ systemStatus.healthyModules }}</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="w-8 h-8 text-yellow-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Warnings</p>
              <p class="text-xl font-semibold text-white">{{ systemStatus.warningModules }}</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <XCircleIcon class="w-8 h-8 text-red-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Errors</p>
              <p class="text-xl font-semibold text-white">{{ systemStatus.unhealthyModules }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- System Controls -->
      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div class="flex items-center space-x-6">
          <div class="flex items-center space-x-2">
            <button
              @click="toggleHotReload"
              :class="systemStatus.hotReloadEnabled ? 'bg-green-600' : 'bg-gray-600'"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            >
              <span
                :class="systemStatus.hotReloadEnabled ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              />
            </button>
            <span class="text-sm text-gray-300">Hot Reload</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <button
              @click="toggleHealthMonitoring"
              :class="systemStatus.healthMonitoringEnabled ? 'bg-green-600' : 'bg-gray-600'"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            >
              <span
                :class="systemStatus.healthMonitoringEnabled ? 'translate-x-6' : 'translate-x-1'"
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              />
            </button>
            <span class="text-sm text-gray-300">Health Monitoring</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <button @click="activeTab = 'health'" class="btn-secondary text-sm">
            <HeartIcon class="w-4 h-4 mr-1" />
            Health Details
          </button>
          <button @click="activeTab = 'events'" class="btn-secondary text-sm">
            <ClockIcon class="w-4 h-4 mr-1" />
            Lifecycle Events
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="flex space-x-1 bg-gray-800 p-1 rounded-lg">
      <button
        @click="activeTab = 'overview'"
        :class="activeTab === 'overview' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Overview
      </button>
      <button
        @click="activeTab = 'health'"
        :class="activeTab === 'health' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Health Monitoring
      </button>
      <button
        @click="activeTab = 'events'"
        :class="activeTab === 'events' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Lifecycle Events
      </button>
      <button
        @click="activeTab = 'dependencies'"
        :class="activeTab === 'dependencies' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'"
        class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Dependencies
      </button>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="card">
      <h3 class="text-lg font-semibold text-white mb-4">Module Overview</h3>
      
      <div class="space-y-4">
        <div 
          v-for="module in allModules" 
          :key="module.key"
          class="p-4 bg-gray-700 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div 
                :class="getModuleHealthColor(module.health?.status)"
                class="w-3 h-3 rounded-full"
              ></div>
              <div>
                <h4 class="font-medium text-white">{{ module.config.name }}</h4>
                <p class="text-sm text-gray-400">{{ module.config.routePrefix }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <span v-if="module.config.version" class="text-xs text-gray-400">
                v{{ module.config.version }}
              </span>
              
              <button
                v-if="module.config.hotReload !== false && systemStatus.hotReloadEnabled"
                @click="reloadModule(module.key)"
                :disabled="reloadingModules.has(module.key)"
                class="btn-secondary text-sm"
              >
                <ArrowPathIcon 
                  :class="reloadingModules.has(module.key) ? 'animate-spin' : ''"
                  class="w-4 h-4 mr-1" 
                />
                {{ reloadingModules.has(module.key) ? 'Reloading...' : 'Reload' }}
              </button>
              
              <button
                @click="performHealthCheck(module.key)"
                class="btn-secondary text-sm"
              >
                <HeartIcon class="w-4 h-4 mr-1" />
                Check Health
              </button>
            </div>
          </div>
          
          <!-- Module Details -->
          <div v-if="module.health" class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-400">Response Time:</span>
              <span class="text-white ml-2">{{ module.health.responseTime }}ms</span>
            </div>
            <div>
              <span class="text-gray-400">Uptime:</span>
              <span class="text-white ml-2">{{ formatUptime(module.health.uptime) }}</span>
            </div>
            <div>
              <span class="text-gray-400">Errors:</span>
              <span class="text-white ml-2">{{ module.health.errorCount }}</span>
            </div>
            <div>
              <span class="text-gray-400">Last Check:</span>
              <span class="text-white ml-2">{{ formatTime(module.health.lastCheck) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Health Monitoring Tab -->
    <div v-if="activeTab === 'health'" class="space-y-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">Health Monitoring</h3>
        
        <div class="space-y-4">
          <div 
            v-for="health in healthMetrics" 
            :key="health.moduleKey"
            class="p-4 border rounded-lg"
            :class="getHealthCardClass(health.status)"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-3">
                <component 
                  :is="getHealthIcon(health.status)"
                  :class="getHealthIconColor(health.status)"
                  class="w-6 h-6"
                />
                <div>
                  <h4 class="font-medium text-white">{{ health.moduleKey }}</h4>
                  <p class="text-sm text-gray-400 capitalize">{{ health.status }}</p>
                </div>
              </div>
              
              <div class="text-right text-sm">
                <p class="text-gray-400">Response: {{ health.responseTime }}ms</p>
                <p class="text-gray-400">Last: {{ formatTime(health.lastCheck) }}</p>
              </div>
            </div>
            
            <!-- Health Details -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-gray-400">Load Time:</span>
                <span class="text-white ml-2">{{ health.details.loadTime }}ms</span>
              </div>
              <div>
                <span class="text-gray-400">Widget:</span>
                <span class="text-white ml-2 capitalize">{{ health.details.widgetStatus }}</span>
              </div>
              <div>
                <span class="text-gray-400">Errors:</span>
                <span class="text-white ml-2">{{ health.errorCount }}</span>
              </div>
              <div>
                <span class="text-gray-400">Warnings:</span>
                <span class="text-white ml-2">{{ health.warningCount }}</span>
              </div>
            </div>
            
            <!-- Error/Warning Details -->
            <div v-if="health.details.lastError" class="mt-3 p-2 bg-red-900/20 rounded text-sm">
              <span class="text-red-400">Last Error:</span>
              <span class="text-red-300 ml-2">{{ health.details.lastError }}</span>
            </div>
            
            <div v-if="health.details.lastWarning" class="mt-3 p-2 bg-yellow-900/20 rounded text-sm">
              <span class="text-yellow-400">Last Warning:</span>
              <span class="text-yellow-300 ml-2">{{ health.details.lastWarning }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lifecycle Events Tab -->
    <div v-if="activeTab === 'events'" class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">Lifecycle Events</h3>
        <div class="flex space-x-2">
          <select v-model="eventFilter" class="input-field text-sm">
            <option value="">All Events</option>
            <option value="load">Load</option>
            <option value="unload">Unload</option>
            <option value="reload">Reload</option>
            <option value="error">Error</option>
            <option value="health-check">Health Check</option>
          </select>
          <button @click="clearEvents" class="btn-secondary text-sm">
            Clear Events
          </button>
        </div>
      </div>
      
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div 
          v-for="event in filteredEvents" 
          :key="event.id"
          class="p-3 bg-gray-700 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <component 
                :is="getEventIcon(event.event)"
                :class="event.success ? 'text-green-400' : 'text-red-400'"
                class="w-5 h-5"
              />
              <div>
                <span class="font-medium text-white">{{ event.moduleKey }}</span>
                <span class="text-gray-400 ml-2 capitalize">{{ event.event }}</span>
              </div>
            </div>
            
            <div class="text-right text-sm text-gray-400">
              <p>{{ formatTime(event.timestamp) }}</p>
              <p v-if="event.duration">{{ event.duration }}ms</p>
            </div>
          </div>
          
          <div v-if="event.data" class="mt-2 text-sm text-gray-400">
            <pre class="whitespace-pre-wrap">{{ JSON.stringify(event.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
      
      <div v-if="filteredEvents.length === 0" class="text-center py-8">
        <ClockIcon class="w-12 h-12 text-gray-500 mx-auto mb-2" />
        <p class="text-gray-400">No lifecycle events found</p>
      </div>
    </div>

    <!-- Dependencies Tab -->
    <div v-if="activeTab === 'dependencies'" class="card">
      <h3 class="text-lg font-semibold text-white mb-4">Module Dependencies</h3>
      
      <div class="space-y-4">
        <div 
          v-for="[moduleKey, deps] in dependencyGraph" 
          :key="moduleKey"
          class="p-4 bg-gray-700 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-white">{{ moduleKey }}</h4>
            <span class="text-sm text-gray-400">{{ deps.length }} dependencies</span>
          </div>
          
          <div v-if="deps.length > 0" class="flex flex-wrap gap-2">
            <span 
              v-for="dep in deps" 
              :key="dep"
              class="px-2 py-1 bg-primary-500 text-white text-sm rounded"
            >
              {{ dep }}
            </span>
          </div>
          
          <div v-else class="text-sm text-gray-400">
            No dependencies
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useModuleLifecycleStore } from '@/core/moduleLifecycle'
import {
  ArrowPathIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  HeartIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const lifecycleStore = useModuleLifecycleStore()

// Reactive state
const activeTab = ref<'overview' | 'health' | 'events' | 'dependencies'>('overview')
const eventFilter = ref('')
const reloadingModules = ref(new Set<string>())
const refreshInterval = ref<NodeJS.Timeout | null>(null)

// Computed properties
const systemStatus = computed(() => lifecycleStore.getSystemStatus())
const healthMetrics = computed(() => lifecycleStore.getAllHealthMetrics())
const dependencyGraph = computed(() => lifecycleStore.dependencyGraph)

const allModules = computed(() => {
  const modules = []
  for (const [key, config] of lifecycleStore.modules.entries()) {
    const health = lifecycleStore.getModuleHealth(key)
    modules.push({ key, config, health })
  }
  return modules
})

const filteredEvents = computed(() => {
  const events = lifecycleStore.getLifecycleEvents()
  if (!eventFilter.value) return events
  return events.filter(e => e.event === eventFilter.value)
})

// Lifecycle
onMounted(() => {
  refreshStatus()
  
  // Auto-refresh every 30 seconds
  refreshInterval.value = setInterval(refreshStatus, 30000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// Methods
const refreshStatus = () => {
  // Status is automatically updated through the store
}

const toggleHotReload = () => {
  if (systemStatus.value.hotReloadEnabled) {
    lifecycleStore.disableHotReload()
  } else {
    lifecycleStore.enableHotReload()
  }
}

const toggleHealthMonitoring = () => {
  if (systemStatus.value.healthMonitoringEnabled) {
    lifecycleStore.disableHealthMonitoring()
  } else {
    lifecycleStore.enableHealthMonitoring()
  }
}

const reloadModule = async (moduleKey: string) => {
  reloadingModules.value.add(moduleKey)
  try {
    await lifecycleStore.reloadModule(moduleKey)
  } finally {
    reloadingModules.value.delete(moduleKey)
  }
}

const performHealthCheck = async (moduleKey: string) => {
  await lifecycleStore.performHealthCheck(moduleKey)
}

const clearEvents = () => {
  lifecycleStore.lifecycleEvents = []
}

// Helper functions
const getSystemHealthColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-green-500'
    case 'warning': return 'bg-yellow-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getModuleHealthColor = (status?: string) => {
  switch (status) {
    case 'healthy': return 'bg-green-500'
    case 'warning': return 'bg-yellow-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getHealthCardClass = (status: string) => {
  switch (status) {
    case 'healthy': return 'border-green-500/30 bg-green-900/10'
    case 'warning': return 'border-yellow-500/30 bg-yellow-900/10'
    case 'error': return 'border-red-500/30 bg-red-900/10'
    default: return 'border-gray-500/30 bg-gray-900/10'
  }
}

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'healthy': return CheckCircleIcon
    case 'warning': return ExclamationTriangleIcon
    case 'error': return XCircleIcon
    default: return ExclamationCircleIcon
  }
}

const getHealthIconColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-green-400'
    case 'warning': return 'text-yellow-400'
    case 'error': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

const getEventIcon = (event: string) => {
  switch (event) {
    case 'load': return PlayIcon
    case 'unload': return StopIcon
    case 'reload': return ArrowPathIcon
    case 'error': return XCircleIcon
    case 'health-check': return HeartIcon
    default: return ClockIcon
  }
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const formatUptime = (uptime: number) => {
  const seconds = Math.floor((Date.now() - uptime) / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}
</script>