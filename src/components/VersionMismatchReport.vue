<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-white mb-2">Version Compatibility Report</h2>
        <p class="text-gray-400">Module version compatibility with core system</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right">
          <p class="text-sm text-gray-400">Core Version</p>
          <p class="text-lg font-semibold text-white">{{ coreVersion }}</p>
        </div>
        <button @click="refreshReport" :disabled="loading" class="btn-primary">
          <ArrowPathIcon class="w-5 h-5 mr-2" />
          {{ loading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-blue-500 rounded-lg">
            <PuzzlePieceIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Total Found</p>
            <p class="text-2xl font-semibold text-white">{{ summary.totalFound }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-green-500 rounded-lg">
            <CheckCircleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Loaded</p>
            <p class="text-2xl font-semibold text-white">{{ summary.totalLoaded }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-red-500 rounded-lg">
            <XCircleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Skipped</p>
            <p class="text-2xl font-semibold text-white">{{ summary.totalSkipped }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-purple-500 rounded-lg">
            <ChartBarIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Success Rate</p>
            <p class="text-2xl font-semibold text-white">{{ successRate }}%</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loaded Modules -->
    <div v-if="summary.loadedModules.length > 0" class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-white">Successfully Loaded Modules</h3>
        <span class="px-3 py-1 bg-green-500 text-white text-sm rounded-full">
          {{ summary.loadedModules.length }} modules
        </span>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="module in summary.loadedModules" 
          :key="module.key"
          class="p-4 bg-green-900/20 border border-green-500/30 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-white">{{ module.name }}</h4>
            <CheckCircleIcon class="w-5 h-5 text-green-400" />
          </div>
          <div class="text-sm text-gray-400">
            <p>Key: {{ module.key }}</p>
            <p v-if="module.version">Version: {{ module.version }}</p>
            <p v-else class="text-yellow-400">No version specified</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Skipped Modules -->
    <div v-if="summary.skippedModules.length > 0" class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-white">Skipped Modules</h3>
        <span class="px-3 py-1 bg-red-500 text-white text-sm rounded-full">
          {{ summary.skippedModules.length }} modules
        </span>
      </div>
      
      <div class="space-y-4">
        <div 
          v-for="module in summary.skippedModules" 
          :key="module.key"
          class="p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <h4 class="font-medium text-white mr-3">{{ module.name }}</h4>
                <XCircleIcon class="w-5 h-5 text-red-400" />
              </div>
              <div class="text-sm text-gray-400 mb-2">
                <p>Key: {{ module.key }}</p>
                <p v-if="module.requiredVersion">Required: {{ module.requiredVersion }}</p>
              </div>
              <div class="text-sm text-red-300">
                <p>{{ module.reason }}</p>
              </div>
            </div>
            
            <div class="ml-4">
              <button 
                v-if="isVersionIssue(module.reason)"
                @click="showVersionHelp(module)"
                class="btn-secondary text-sm"
              >
                <InformationCircleIcon class="w-4 h-4 mr-1" />
                Help
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Version Compatibility Guide -->
    <div class="card">
      <h3 class="text-xl font-semibold text-white mb-4">Version Compatibility Guide</h3>
      
      <div class="space-y-4">
        <div class="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h4 class="font-medium text-blue-400 mb-2">Semver Ranges</h4>
          <div class="text-sm text-gray-300 space-y-1">
            <p><code class="bg-gray-700 px-2 py-1 rounded">^1.0.0</code> - Compatible with 1.x.x (recommended)</p>
            <p><code class="bg-gray-700 px-2 py-1 rounded">~1.0.0</code> - Compatible with 1.0.x</p>
            <p><code class="bg-gray-700 px-2 py-1 rounded">>=1.0.0</code> - Compatible with 1.0.0 and above</p>
            <p><code class="bg-gray-700 px-2 py-1 rounded">1.0.0</code> - Exact version match</p>
          </div>
        </div>
        
        <div class="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <h4 class="font-medium text-yellow-400 mb-2">Best Practices</h4>
          <ul class="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li>Always specify <code class="bg-gray-700 px-1 rounded">compatibleWithCore</code> in module.config.ts</li>
            <li>Use caret ranges (^) for maximum compatibility</li>
            <li>Test modules with new core versions before deployment</li>
            <li>Keep module versions up to date</li>
          </ul>
        </div>
        
        <div class="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <h4 class="font-medium text-green-400 mb-2">Current Core Version: {{ coreVersion }}</h4>
          <p class="text-sm text-gray-300">
            Modules should specify <code class="bg-gray-700 px-1 rounded">compatibleWithCore: "^{{ coreVersion }}"</code> 
            for maximum compatibility.
          </p>
        </div>
      </div>
    </div>

    <!-- Help Modal -->
    <div 
      v-if="showHelpModal && selectedModule" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-white">Version Compatibility Help</h3>
          <button @click="showHelpModal = false" class="text-gray-400 hover:text-white">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-white mb-2">Module: {{ selectedModule.name }}</h4>
            <div class="text-sm text-gray-400">
              <p>Required: {{ selectedModule.requiredVersion || 'Not specified' }}</p>
              <p>Current Core: {{ coreVersion }}</p>
              <p class="text-red-300 mt-2">{{ selectedModule.reason }}</p>
            </div>
          </div>
          
          <div class="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h5 class="font-medium text-blue-400 mb-2">Solutions:</h5>
            <ul class="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li>Update the module's <code class="bg-gray-700 px-1 rounded">compatibleWithCore</code> to <code class="bg-gray-700 px-1 rounded">^{{ coreVersion }}</code></li>
              <li>Check if a newer version of the module is available</li>
              <li>Contact the module author for compatibility updates</li>
              <li>Consider upgrading/downgrading the core system if needed</li>
            </ul>
          </div>
          
          <div class="p-4 bg-gray-700 rounded-lg">
            <h5 class="font-medium text-white mb-2">Example Fix:</h5>
            <pre class="text-sm text-green-400 bg-gray-800 p-2 rounded overflow-x-auto"><code>// In src/modules/{{ selectedModule.key }}/module.config.ts
export default {
  name: '{{ selectedModule.name }}',
  // ... other config
  compatibleWithCore: '^{{ coreVersion }}' // Add or update this line
}</code></pre>
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <button @click="showHelpModal = false" class="btn-primary">
            Got it
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { moduleRegistry } from '@/core/registry'
import { CORE_VERSION } from '@/constants/version'
import {
  PuzzlePieceIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Reactive state
const loading = ref(false)
const summary = ref(moduleRegistry.getLoadingSummary())
const showHelpModal = ref(false)
const selectedModule = ref<any>(null)

// Computed properties
const coreVersion = computed(() => CORE_VERSION)

const successRate = computed(() => {
  if (summary.value.totalFound === 0) return 0
  return Math.round((summary.value.totalLoaded / summary.value.totalFound) * 100)
})

// Lifecycle
onMounted(() => {
  refreshReport()
})

// Methods
const refreshReport = async () => {
  loading.value = true
  try {
    await moduleRegistry.loadModules()
    summary.value = moduleRegistry.getLoadingSummary()
  } catch (error) {
    console.error('Failed to refresh module report:', error)
  } finally {
    loading.value = false
  }
}

const isVersionIssue = (reason: string): boolean => {
  return reason.includes('version') || reason.includes('compatible')
}

const showVersionHelp = (module: any) => {
  selectedModule.value = module
  showHelpModal.value = true
}
</script>