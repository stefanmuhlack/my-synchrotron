<template>
  <div class="space-y-6">
    <!-- Health Overview -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-white">Module Health Monitor</h2>
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <div 
              :class="getSystemHealthColor(systemStatus.systemHealth)"
              class="w-3 h-3 rounded-full"
            ></div>
            <span class="text-sm text-gray-300 capitalize">{{ systemStatus.systemHealth }}</span>
          </div>
          <button @click="refreshHealth" :disabled="refreshing" class="btn-secondary text-sm">
            <ArrowPathIcon 
              :class="refreshing ? 'animate-spin' : ''"
              class="w-4 h-4 mr-1" 
            />
            {{ refreshing ? 'Refreshing...' : 'Refresh' }}
          </button>
        </div>
      </div>
      
      <!-- Health Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <PuzzlePieceIcon class="w-8 h-8 text-blue-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Total Modules</p>
              <p class="text-xl font-semibold text-white">{{ healthMetrics.length }}</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <CheckCircleIcon class="w-8 h-8 text-green-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Healthy</p>
              <p class="text-xl font-semibold text-white">{{ healthyCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="w-8 h-8 text-yellow-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Warnings</p>
              <p class="text-xl font-semibold text-white">{{ warningCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <XCircleIcon class="w-8 h-8 text-red-400 mr-3" />
            <div>
              <p class="text-sm text-gray-400">Errors</p>
              <p class="text-xl font-semibold text-white">{{ errorCount }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Health Controls -->
      <div class="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
        <div class="flex items-center space-x-6">
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
            <span class="text-sm text-gray-300">Auto Monitoring</span>
          </div>
          
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-300">Check Interval:</span>
            <select v-model="checkInterval" class="input-field text-sm">
              <option value="10000">10 seconds</option>
              <option value="30000">30 seconds</option>
              <option value="60000">1 minute</option>
              <option value="300000">5 minutes</option>
            </select>
          </div>
        </div>
        
        <button @click="checkAllModules" :disabled="refreshing" class="btn-primary text-sm">
          <HeartIcon class="w-4 h-4 mr-1" />
          Check All Modules
        </button>
      </div>
    </div>

    <!-- Health Details -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">Module Health Details</h3>
        <div class="flex space-x-2">
          <select v-model="statusFilter" class="input-field text-sm">
            <option value="">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>
      
      <div class="space-y-4">
        <div 
          v-for="health in filteredHealthMetrics" 
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
                <h4 class="font-medium text-white">{{ getModuleName(health.moduleKey) }}</h4>
                <div class="flex items-center space-x-3 text-sm">
                  <span class="text-gray-400 capitalize">{{ health.status }}</span>
                  <span class="text-gray-400">{{ formatTime(health.lastCheck) }}</span>
                </div>
              </div>
            </div>
            
            <div class="flex space-x-2">
              <button 
                @click="performHealthCheck(health.moduleKey)"
                :disabled="checkingModules.has(health.moduleKey)"
                class="btn-secondary text-sm"
              >
                <HeartIcon 
                  :class="checkingModules.has(health.moduleKey) ? 'animate-pulse' : ''"
                  class="w-4 h-4 mr-1" 
                />
                Check
              </button>
              <button 
                @click="showHealthDetails(health)"
                class="btn-secondary text-sm"
              >
                <EyeIcon class="w-4 h-4 mr-1" />
                Details
              </button>
            </div>
          </div>
          
          <!-- Health Metrics -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-400">Response:</span>
              <span 
                :class="getResponseTimeColor(health.responseTime)"
                class="ml-2"
              >
                {{ health.responseTime }}ms
              </span>
            </div>
            <div>
              <span class="text-gray-400">Uptime:</span>
              <span class="text-white ml-2">{{ formatUptime(health.uptime) }}</span>
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
        </div>
      </div>
      
      <div v-if="filteredHealthMetrics.length === 0" class="text-center py-8">
        <HeartIcon class="w-12 h-12 text-gray-500 mx-auto mb-2" />
        <p class="text-gray-400">No health metrics available</p>
      </div>
    </div>

    <!-- Health Details Modal -->
    <div 
      v-if="selectedHealth" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-white">Health Details: {{ selectedHealth.moduleKey }}</h3>
          <button @click="selectedHealth = null" class="text-gray-400 hover:text-white">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div class="space-y-4">
          <!-- Status Overview -->
          <div class="flex items-center space-x-3 p-3 rounded-lg" :class="getHealthCardClass(selectedHealth.status)">
            <component 
              :is="getHealthIcon(selectedHealth.status)"
              :class="getHealthIconColor(selectedHealth.status)"
              class="w-6 h-6"
            />
            <div>
              <span class="font-medium text-white capitalize">{{ selectedHealth.status }}</span>
              <span class="text-gray-400 ml-3">Last checked: {{ formatTime(selectedHealth.lastCheck) }}</span>
            </div>
          </div>
          
          <!-- Detailed Metrics -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-gray-700 rounded-lg">
              <h4 class="font-medium text-white mb-2">Performance</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Response Time:</span>
                  <span 
                    :class="getResponseTimeColor(selectedHealth.responseTime)"
                  >
                    {{ selectedHealth.responseTime }}ms
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Load Time:</span>
                  <span class="text-white">{{ selectedHealth.details.loadTime }}ms</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Uptime:</span>
                  <span class="text-white">{{ formatUptime(selectedHealth.uptime) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Memory Usage:</span>
                  <span class="text-white">{{ selectedHealth.memoryUsage || 'N/A' }}</span>
                </div>
              </div>
            </div>
            
            <div class="p-3 bg-gray-700 rounded-lg">
              <h4 class="font-medium text-white mb-2">Status</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Widget Status:</span>
                  <span class="text-white capitalize">{{ selectedHealth.details.widgetStatus }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Route Count:</span>
                  <span class="text-white">{{ selectedHealth.details.routeCount }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Error Count:</span>
                  <span class="text-white">{{ selectedHealth.errorCount }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Warning Count:</span>
                  <span class="text-white">{{ selectedHealth.warningCount }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Error/Warning Details -->
          <div v-if="selectedHealth.details.lastError" class="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <h4 class="font-medium text-red-400 mb-2">Last Error</h4>
            <p class="text-sm text-red-300">{{ selectedHealth.details.lastError }}</p>
          </div>
          
          <div v-if="selectedHealth.details.lastWarning" class="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <h4 class="font-medium text-yellow-400 mb-2">Last Warning</h4>
            <p class="text-sm text-yellow-300">{{ selectedHealth.details.lastWarning }}</p>
          </div>
          
          <!-- Recent Events -->
          <div class="p-3 bg-gray-700 rounded-lg">
            <h4 class="font-medium text-white mb-2">Recent Events</h4>
            <div class="space-y-2 max-h-40 overflow-y-auto">
              <div 
                v-for="event in moduleEvents" 
                :key="event.id"
                class="flex items-center justify-between text-sm p-2 rounded"
                :class="event.success ? 'bg-green-900/10' : 'bg-red-900/10'"
              >
                <div class="flex items-center space-x-2">
                  <component 
                    :is="getEventIcon(event.event)"
                    :class="event.success ? 'text-green-400' : 'text-red-400'"
                    class="w-4 h-4"
                  />
                  <span class="text-gray-300 capitalize">{{ event.event }}</span>
                </div>
                <div class="text-gray-400">
                  {{ formatTime(event.timestamp) }}
                </div>
              </div>
            </div>
            
            <div v-if="moduleEvents.length === 0" class="text-center py-4">
              <p class="text-sm text-gray-400">No recent events</p>
            </div>
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 mt-6">
          <button 
            @click="performHealthCheck(selectedHealth.moduleKey)"
            :disabled="checkingModules.has(selectedHealth.moduleKey)"
            class="btn-secondary"
          >
            <HeartIcon 
              :class="checkingModules.has(selectedHealth.moduleKey) ? 'animate-pulse' : ''"
              class="w-5 h-5 mr-2" 
            />
            Run Health Check
          </button>
          <button @click="selectedHealth = null" class="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useModuleLifecycleStore } from '@/core/moduleLifecycle'
import type { ModuleHealthMetrics } from '@/core/moduleLifecycle'
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
  EyeIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const lifecycleStore = useModuleLifecycleStore()

// Reactive state
const refreshing = ref(false)
const statusFilter = ref('')
const checkInterval = ref(30000)
const checkingModules = ref(new Set<string>())
const selectedHealth = ref<ModuleHealthMetrics | null>(null)
const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)
const moduleEvents = ref<any[]>([])

// Computed properties
const systemStatus = computed(() => lifecycleStore.getSystemStatus())
const healthMetrics = computed(() => lifecycleStore.getAllHealthMetrics())

const filteredHealthMetrics = computed(() => {
  if (!statusFilter.value) return healthMetrics.value
  return healthMetrics.value.filter(m => m.status === statusFilter.value)
})

const healthyCount = computed(() => 
  healthMetrics.value.filter(m => m.status === 'healthy').length
)

const warningCount = computed(() => 
  healthMetrics.value.filter(m => m.status === 'warning').length
)

const errorCount = computed(() => 
  healthMetrics.value.filter(m => m.status === 'error').length
)

// Watchers
watch(checkInterval, (newInterval) => {
  // Update the refresh interval
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
  
  if (systemStatus.value.healthMonitoringEnabled) {
    autoRefreshInterval.value = setInterval(refreshHealth, newInterval)
  }
})

watch(() => selectedHealth.value?.moduleKey, (moduleKey) => {
  if (moduleKey) {
    // Load events for this module
    moduleEvents.value = lifecycleStore.getLifecycleEvents(moduleKey, 10)
  } else {
    moduleEvents.value = []
  }
})

// Lifecycle
onMounted(() => {
  refreshHealth()
  
  // Set up auto-refresh if enabled
  if (systemStatus.value.healthMonitoringEnabled) {
    autoRefreshInterval.value = setInterval(refreshHealth, checkInterval.value)
  }
})

onUnmounted(() => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
  }
})

// Methods
const refreshHealth = async () => {
  refreshing.value = true
  try {
    // Health metrics are automatically updated through the store
    // This is just to trigger a UI refresh
    await new Promise(resolve => setTimeout(resolve, 300))
  } finally {
    refreshing.value = false
  }
}

const toggleHealthMonitoring = () => {
  if (systemStatus.value.healthMonitoringEnabled) {
    lifecycleStore.disableHealthMonitoring()
    
    // Clear auto-refresh interval
    if (autoRefreshInterval.value) {
      clearInterval(autoRefreshInterval.value)
      autoRefreshInterval.value = null
    }
  } else {
    lifecycleStore.enableHealthMonitoring()
    
    // Set up auto-refresh
    autoRefreshInterval.value = setInterval(refreshHealth, checkInterval.value)
  }
}

const checkAllModules = async () => {
  refreshing.value = true
  
  try {
    const promises = []
    
    for (const module of lifecycleStore.modules.keys()) {
      checkingModules.value.add(module)
      promises.push(lifecycleStore.performHealthCheck(module))
    }
    
    await Promise.all(promises)
  } finally {
    checkingModules.value.clear()
    refreshing.value = false
  }
}

const performHealthCheck = async (moduleKey: string) => {
  checkingModules.value.add(moduleKey)
  
  try {
    await lifecycleStore.performHealthCheck(moduleKey)
    
    // If we're viewing details for this module, refresh the events
    if (selectedHealth.value?.moduleKey === moduleKey) {
      moduleEvents.value = lifecycleStore.getLifecycleEvents(moduleKey, 10)
    }
  } finally {
    checkingModules.value.delete(moduleKey)
  }
}

const showHealthDetails = (health: ModuleHealthMetrics) => {
  selectedHealth.value = health
  moduleEvents.value = lifecycleStore.getLifecycleEvents(health.moduleKey, 10)
}

// Helper functions
const getModuleName = (moduleKey: string): string => {
  const module = lifecycleStore.modules.get(moduleKey)
  return module?.name || moduleKey
}

const getSystemHealthColor = (status: string) => {
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
    default: return HeartIcon
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

const getResponseTimeColor = (time: number) => {
  if (time < 100) return 'text-green-400'
  if (time < 300) return 'text-yellow-400'
  return 'text-red-400'
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