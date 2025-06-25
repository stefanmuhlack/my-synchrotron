<template>
  <div class="space-y-6">
    <!-- Test Controls -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-semibold text-white">Module Test Runner</h3>
        <div class="flex space-x-3">
          <button
            @click="runTests"
            :disabled="isRunning"
            class="btn-primary"
          >
            <BeakerIcon class="w-5 h-5 mr-2" />
            {{ isRunning ? 'Running Tests...' : 'Run All Tests' }}
          </button>
          <button
            v-if="lastReport"
            @click="exportReport"
            class="btn-secondary"
          >
            <DocumentArrowDownIcon class="w-5 h-5 mr-2" />
            Export Report
          </button>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div v-if="isRunning" class="mb-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-300">Running tests...</span>
          <span class="text-sm text-gray-300">{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-600 rounded-full h-2">
          <div 
            class="bg-primary-500 h-2 rounded-full transition-all duration-300"
            :style="{ width: progress + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Test Summary -->
    <div v-if="lastReport" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-blue-500 rounded-lg">
            <PuzzlePieceIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Total Modules</p>
            <p class="text-2xl font-semibold text-white">{{ lastReport.totalModules }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-green-500 rounded-lg">
            <CheckCircleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Valid</p>
            <p class="text-2xl font-semibold text-white">{{ lastReport.validModules }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-red-500 rounded-lg">
            <XCircleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Invalid</p>
            <p class="text-2xl font-semibold text-white">{{ lastReport.invalidModules }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-500 rounded-lg">
            <ExclamationTriangleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Warnings</p>
            <p class="text-2xl font-semibold text-white">{{ lastReport.warningCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Results -->
    <div v-if="lastReport" class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold text-white">Test Results</h3>
        <div class="flex items-center space-x-4 text-sm text-gray-400">
          <span>Execution Time: {{ lastReport.executionTime }}ms</span>
          <span>Last Run: {{ formatDate(lastReport.timestamp) }}</span>
        </div>
      </div>
      
      <!-- Filter Controls -->
      <div class="mb-4 flex space-x-2">
        <button
          @click="filter = 'all'"
          :class="filter === 'all' ? 'btn-primary' : 'btn-secondary'"
          class="text-sm"
        >
          All ({{ lastReport.totalModules }})
        </button>
        <button
          @click="filter = 'valid'"
          :class="filter === 'valid' ? 'btn-primary' : 'btn-secondary'"
          class="text-sm"
        >
          Valid ({{ lastReport.validModules }})
        </button>
        <button
          @click="filter = 'invalid'"
          :class="filter === 'invalid' ? 'btn-primary' : 'btn-secondary'"
          class="text-sm"
        >
          Invalid ({{ lastReport.invalidModules }})
        </button>
        <button
          @click="filter = 'warnings'"
          :class="filter === 'warnings' ? 'btn-primary' : 'btn-secondary'"
          class="text-sm"
        >
          With Warnings ({{ lastReport.results.filter(r => r.warnings.length > 0).length }})
        </button>
      </div>
      
      <!-- Results List -->
      <div class="space-y-4">
        <div
          v-for="result in filteredResults"
          :key="result.moduleKey"
          class="p-4 rounded-lg border"
          :class="getResultCardClass(result)"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center">
              <component 
                :is="result.valid ? CheckCircleIcon : XCircleIcon"
                :class="result.valid ? 'text-green-400' : 'text-red-400'"
                class="w-6 h-6 mr-3"
              />
              <div>
                <h4 class="font-semibold text-white">{{ result.name }}</h4>
                <div class="flex items-center space-x-4 text-sm text-gray-400">
                  <span>{{ result.executionTime }}ms</span>
                  <span>{{ formatDate(result.lastRun || '') }}</span>
                  <span v-if="result.config?.version" class="text-primary-400">
                    v{{ result.config.version }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <span 
                v-if="result.warnings.length > 0"
                class="px-2 py-1 bg-yellow-500 text-black text-xs rounded-full"
              >
                {{ result.warnings.length }} warning{{ result.warnings.length !== 1 ? 's' : '' }}
              </span>
              <span 
                v-if="result.errors.length > 0"
                class="px-2 py-1 bg-red-500 text-white text-xs rounded-full"
              >
                {{ result.errors.length }} error{{ result.errors.length !== 1 ? 's' : '' }}
              </span>
              <button
                @click="runSingleTest(result.moduleKey)"
                :disabled="isRunning"
                class="btn-secondary text-sm"
              >
                <ArrowPathIcon class="w-4 h-4 mr-1" />
                Re-test
              </button>
            </div>
          </div>
          
          <!-- Module Info -->
          <div v-if="result.config" class="mb-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span class="text-gray-400">Route:</span>
              <span class="text-white ml-2">{{ result.config.routePrefix }}</span>
            </div>
            <div>
              <span class="text-gray-400">Roles:</span>
              <span class="text-white ml-2">{{ result.config.rolesAllowed.join(', ') }}</span>
            </div>
            <div>
              <span class="text-gray-400">Widget:</span>
              <span class="text-white ml-2">{{ result.config.hasWidget ? 'Yes' : 'No' }}</span>
            </div>
            <div v-if="result.config.compatibleWithCore">
              <span class="text-gray-400">Core:</span>
              <span class="text-white ml-2">{{ result.config.compatibleWithCore }}</span>
            </div>
          </div>
          
          <!-- Errors -->
          <div v-if="result.errors.length > 0" class="mb-3">
            <h5 class="text-sm font-medium text-red-400 mb-2">Errors:</h5>
            <ul class="space-y-1">
              <li 
                v-for="error in result.errors" 
                :key="error"
                class="text-sm text-red-300 flex items-start"
              >
                <XCircleIcon class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {{ error }}
              </li>
            </ul>
          </div>
          
          <!-- Warnings -->
          <div v-if="result.warnings.length > 0">
            <h5 class="text-sm font-medium text-yellow-400 mb-2">Warnings:</h5>
            <ul class="space-y-1">
              <li 
                v-for="warning in result.warnings" 
                :key="warning"
                class="text-sm text-yellow-300 flex items-start"
              >
                <ExclamationTriangleIcon class="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {{ warning }}
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredResults.length === 0" class="text-center py-8">
        <BeakerIcon class="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p class="text-gray-400">No modules match the current filter</p>
      </div>
    </div>

    <!-- No Results State -->
    <div v-if="!lastReport && !isRunning" class="card text-center py-12">
      <BeakerIcon class="w-16 h-16 text-gray-500 mx-auto mb-4" />
      <h3 class="text-lg font-semibold text-white mb-2">No Test Results</h3>
      <p class="text-gray-400 mb-6">Run the module tests to see validation results</p>
      <button @click="runTests" class="btn-primary">
        <BeakerIcon class="w-5 h-5 mr-2" />
        Run First Test
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ModuleTestRunner, type TestReport, type ModuleValidationResult } from '@/utils/moduleTestRunner'
import {
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'

const testRunner = new ModuleTestRunner()
const isRunning = ref(false)
const progress = ref(0)
const lastReport = ref<TestReport | null>(null)
const filter = ref<'all' | 'valid' | 'invalid' | 'warnings'>('all')

const filteredResults = computed(() => {
  if (!lastReport.value) return []
  
  const results = lastReport.value.results
  
  switch (filter.value) {
    case 'valid':
      return results.filter(r => r.valid)
    case 'invalid':
      return results.filter(r => !r.valid)
    case 'warnings':
      return results.filter(r => r.warnings.length > 0)
    default:
      return results
  }
})

const runTests = async () => {
  isRunning.value = true
  progress.value = 0
  
  try {
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 20
      }
    }, 200)
    
    const report = await testRunner.runAllTests()
    
    clearInterval(progressInterval)
    progress.value = 100
    
    setTimeout(() => {
      lastReport.value = report
      isRunning.value = false
      progress.value = 0
    }, 500)
    
  } catch (error) {
    console.error('Test execution failed:', error)
    isRunning.value = false
    progress.value = 0
  }
}

const runSingleTest = async (moduleKey: string) => {
  if (isRunning.value) return
  
  try {
    const result = await testRunner.runSingleModuleTest(moduleKey)
    
    // Update the specific result in the report
    if (lastReport.value) {
      const index = lastReport.value.results.findIndex(r => r.moduleKey === moduleKey)
      if (index !== -1) {
        lastReport.value.results[index] = result
        
        // Recalculate summary
        const validModules = lastReport.value.results.filter(r => r.valid).length
        const invalidModules = lastReport.value.results.filter(r => !r.valid).length
        const warningCount = lastReport.value.results.reduce((sum, r) => sum + r.warnings.length, 0)
        
        lastReport.value.validModules = validModules
        lastReport.value.invalidModules = invalidModules
        lastReport.value.warningCount = warningCount
      }
    }
  } catch (error) {
    console.error('Single test execution failed:', error)
  }
}

const exportReport = () => {
  if (!lastReport.value) return
  
  const reportData = {
    ...lastReport.value,
    exportedAt: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `module-test-report-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}

const getResultCardClass = (result: ModuleValidationResult) => {
  if (!result.valid) {
    return 'bg-red-900/20 border-red-500/30'
  } else if (result.warnings.length > 0) {
    return 'bg-yellow-900/20 border-yellow-500/30'
  } else {
    return 'bg-green-900/20 border-green-500/30'
  }
}
</script>