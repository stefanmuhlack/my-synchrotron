import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CORE_VERSION } from '@/constants/version'
import semver from 'semver'

export interface ModuleTestResult {
  name: string
  moduleKey: string
  version?: string
  compatibleWithCore?: string
  isCompatible: boolean
  errors: string[]
  warnings: string[]
  timestamp: string
  executionTime?: number
}

export interface ModuleStatusSummary {
  totalModules: number
  compatibleModules: number
  skippedModules: number
  erroredModules: number
  lastTestRun?: string
}

export const useModuleStatusStore = defineStore('moduleStatus', () => {
  const testResults = ref<ModuleTestResult[]>([])
  const lastTestRun = ref<string | null>(null)
  const isRunningTests = ref(false)

  // Computed properties
  const summary = computed((): ModuleStatusSummary => {
    const total = testResults.value.length
    const compatible = testResults.value.filter(r => r.isCompatible && r.errors.length === 0).length
    const skipped = testResults.value.filter(r => !r.isCompatible).length
    const errored = testResults.value.filter(r => r.errors.length > 0).length

    return {
      totalModules: total,
      compatibleModules: compatible,
      skippedModules: skipped,
      erroredModules: errored,
      lastTestRun: lastTestRun.value || undefined
    }
  })

  const compatibleModules = computed(() => 
    testResults.value.filter(r => r.isCompatible && r.errors.length === 0)
  )

  const skippedModules = computed(() => 
    testResults.value.filter(r => !r.isCompatible)
  )

  const erroredModules = computed(() => 
    testResults.value.filter(r => r.errors.length > 0)
  )

  const modulesWithWarnings = computed(() => 
    testResults.value.filter(r => r.warnings.length > 0)
  )

  // Actions
  const updateTestResults = (results: ModuleTestResult[]) => {
    testResults.value = results
    lastTestRun.value = new Date().toISOString()
  }

  const addTestResult = (result: ModuleTestResult) => {
    const existingIndex = testResults.value.findIndex(r => r.moduleKey === result.moduleKey)
    
    if (existingIndex !== -1) {
      testResults.value[existingIndex] = result
    } else {
      testResults.value.push(result)
    }
    
    lastTestRun.value = new Date().toISOString()
  }

  const clearResults = () => {
    testResults.value = []
    lastTestRun.value = null
  }

  const setTestingStatus = (status: boolean) => {
    isRunningTests.value = status
  }

  const validateModuleCompatibility = (moduleKey: string, config: any): ModuleTestResult => {
    const result: ModuleTestResult = {
      name: config.name || moduleKey,
      moduleKey,
      version: config.version,
      compatibleWithCore: config.compatibleWithCore,
      isCompatible: true,
      errors: [],
      warnings: [],
      timestamp: new Date().toISOString()
    }

    // Check if version is specified
    if (!config.version) {
      result.warnings.push('No version specified - consider adding version field')
    } else {
      // Validate semver format
      if (!semver.valid(config.version)) {
        result.warnings.push(`Version "${config.version}" is not valid semver format`)
      }
    }

    // Check core compatibility
    if (!config.compatibleWithCore) {
      result.warnings.push('No core compatibility specified - assuming compatible')
    } else {
      try {
        const isCompatible = semver.satisfies(CORE_VERSION, config.compatibleWithCore)
        
        if (!isCompatible) {
          result.isCompatible = false
          result.errors.push(`Module requires core version ${config.compatibleWithCore}, but current version is ${CORE_VERSION}`)
        }
      } catch (error) {
        result.warnings.push(`Invalid semver range "${config.compatibleWithCore}"`)
      }
    }

    return result
  }

  const getModuleStatus = (moduleKey: string) => {
    return testResults.value.find(r => r.moduleKey === moduleKey)
  }

  const exportResults = () => {
    return {
      summary: summary.value,
      results: testResults.value,
      coreVersion: CORE_VERSION,
      exportedAt: new Date().toISOString()
    }
  }

  return {
    // State
    testResults,
    lastTestRun,
    isRunningTests,
    
    // Computed
    summary,
    compatibleModules,
    skippedModules,
    erroredModules,
    modulesWithWarnings,
    
    // Actions
    updateTestResults,
    addTestResult,
    clearResults,
    setTestingStatus,
    validateModuleCompatibility,
    getModuleStatus,
    exportResults
  }
})