<template>
  <div class="space-y-6">
    <!-- Upload Area -->
    <div class="card">
      <h3 class="text-xl font-semibold text-white mb-4">Upload Module ZIP</h3>
      
      <div
        @drop="handleDrop"
        @dragover.prevent
        @dragenter.prevent
        :class="isDragging ? 'border-primary-500 bg-primary-500/10' : 'border-gray-600'"
        class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
      >
        <CloudArrowUpIcon class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        
        <div v-if="!selectedFile">
          <p class="text-lg font-medium text-white mb-2">
            Drop your module ZIP file here
          </p>
          <p class="text-gray-400 mb-4">
            or click to browse files
          </p>
          <input
            ref="fileInput"
            type="file"
            accept=".zip"
            @change="handleFileSelect"
            class="hidden"
          />
          <button
            @click="$refs.fileInput?.click()"
            class="btn-primary"
          >
            <DocumentArrowUpIcon class="w-5 h-5 mr-2" />
            Select ZIP File
          </button>
        </div>
        
        <div v-else class="space-y-4">
          <div class="flex items-center justify-center space-x-3">
            <DocumentIcon class="w-8 h-8 text-primary-400" />
            <div class="text-left">
              <p class="font-medium text-white">{{ selectedFile.name }}</p>
              <p class="text-sm text-gray-400">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button
              @click="validateModule"
              :disabled="isValidating"
              class="btn-primary"
            >
              <BeakerIcon class="w-5 h-5 mr-2" />
              {{ isValidating ? 'Validating...' : 'Validate Module' }}
            </button>
            <button
              @click="clearFile"
              class="btn-secondary"
            >
              <XMarkIcon class="w-5 h-5 mr-2" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Progress -->
    <div v-if="isValidating" class="card">
      <div class="flex items-center space-x-3 mb-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
        <span class="text-white font-medium">Validating module...</span>
      </div>
      
      <div class="space-y-2 text-sm text-gray-400">
        <div class="flex items-center space-x-2">
          <CheckIcon v-if="validationSteps.structure" class="w-4 h-4 text-green-400" />
          <ClockIcon v-else class="w-4 h-4 text-gray-400" />
          <span>Checking module structure</span>
        </div>
        <div class="flex items-center space-x-2">
          <CheckIcon v-if="validationSteps.config" class="w-4 h-4 text-green-400" />
          <ClockIcon v-else class="w-4 h-4 text-gray-400" />
          <span>Validating configuration</span>
        </div>
        <div class="flex items-center space-x-2">
          <CheckIcon v-if="validationSteps.compatibility" class="w-4 h-4 text-green-400" />
          <ClockIcon v-else class="w-4 h-4 text-gray-400" />
          <span>Checking compatibility</span>
        </div>
      </div>
    </div>

    <!-- Validation Results -->
    <div v-if="validationResult" class="space-y-4">
      <!-- Summary Card -->
      <div 
        class="card border-l-4"
        :class="validationResult.valid ? 'border-green-500' : 'border-red-500'"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <component 
              :is="validationResult.valid ? CheckCircleIcon : XCircleIcon"
              :class="validationResult.valid ? 'text-green-400' : 'text-red-400'"
              class="w-8 h-8"
            />
            <div>
              <h3 class="text-xl font-semibold text-white">
                {{ validationResult.valid ? 'Validation Passed' : 'Validation Failed' }}
              </h3>
              <p class="text-gray-400">
                {{ validationResult.config?.name || 'Unknown Module' }}
              </p>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button
              @click="downloadReport"
              class="btn-secondary text-sm"
            >
              <DocumentArrowDownIcon class="w-4 h-4 mr-2" />
              Download Report
            </button>
            <button
              v-if="validationResult.valid"
              @click="installModule"
              :disabled="isInstalling"
              class="btn-primary text-sm"
            >
              <CloudArrowUpIcon class="w-4 h-4 mr-2" />
              {{ isInstalling ? 'Installing...' : 'Install Module' }}
            </button>
          </div>
        </div>
        
        <!-- Module Info -->
        <div v-if="validationResult.config" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-400">Version:</span>
            <span class="text-white ml-2">{{ validationResult.config.version || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-gray-400">Author:</span>
            <span class="text-white ml-2">{{ validationResult.config.author || 'N/A' }}</span>
          </div>
          <div>
            <span class="text-gray-400">Route Prefix:</span>
            <span class="text-white ml-2">{{ validationResult.config.routePrefix }}</span>
          </div>
          <div>
            <span class="text-gray-400">Has Widget:</span>
            <span class="text-white ml-2">{{ validationResult.config.hasWidget ? 'Yes' : 'No' }}</span>
          </div>
        </div>
      </div>

      <!-- Errors -->
      <div v-if="validationResult.errors.length > 0" class="card bg-red-900/20 border border-red-500/30">
        <h4 class="text-lg font-semibold text-red-400 mb-3">
          Errors ({{ validationResult.errors.length }})
        </h4>
        <ul class="space-y-2">
          <li 
            v-for="error in validationResult.errors" 
            :key="error"
            class="flex items-start space-x-2 text-red-300"
          >
            <XCircleIcon class="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{{ error }}</span>
          </li>
        </ul>
      </div>

      <!-- Warnings -->
      <div v-if="validationResult.warnings.length > 0" class="card bg-yellow-900/20 border border-yellow-500/30">
        <h4 class="text-lg font-semibold text-yellow-400 mb-3">
          Warnings ({{ validationResult.warnings.length }})
        </h4>
        <ul class="space-y-2">
          <li 
            v-for="warning in validationResult.warnings" 
            :key="warning"
            class="flex items-start space-x-2 text-yellow-300"
          >
            <ExclamationTriangleIcon class="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{{ warning }}</span>
          </li>
        </ul>
      </div>

      <!-- File Preview -->
      <div v-if="validationResult.extractedFiles && Object.keys(validationResult.extractedFiles).length > 0" class="card">
        <h4 class="text-lg font-semibold text-white mb-4">File Preview</h4>
        
        <div class="space-y-4">
          <div
            v-for="(content, filePath) in validationResult.extractedFiles"
            :key="filePath"
            class="border border-gray-600 rounded-lg overflow-hidden"
          >
            <div class="bg-gray-700 px-4 py-2 border-b border-gray-600">
              <div class="flex items-center justify-between">
                <span class="font-medium text-white">{{ filePath }}</span>
                <button
                  @click="toggleFileExpansion(filePath)"
                  class="text-gray-400 hover:text-white"
                >
                  <component 
                    :is="expandedFiles.has(filePath) ? ChevronUpIcon : ChevronDownIcon"
                    class="w-5 h-5"
                  />
                </button>
              </div>
            </div>
            
            <div v-if="expandedFiles.has(filePath)" class="p-4 bg-gray-800">
              <pre class="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">{{ content }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Installation Success -->
    <div v-if="installationResult" class="card bg-green-900/20 border border-green-500/30">
      <div class="flex items-center space-x-3">
        <CheckCircleIcon class="w-8 h-8 text-green-400" />
        <div>
          <h3 class="text-lg font-semibold text-green-400">Module Installed Successfully</h3>
          <p class="text-green-300">{{ installationResult.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { validateModuleZip, generateValidationReport, type ModuleValidationResult } from '@/utils/validateModuleZip'
import {
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  DocumentIcon,
  BeakerIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/vue/24/outline'

const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const isValidating = ref(false)
const isInstalling = ref(false)
const validationResult = ref<ModuleValidationResult | null>(null)
const installationResult = ref<{ message: string } | null>(null)
const expandedFiles = ref(new Set<string>())

const validationSteps = reactive({
  structure: false,
  config: false,
  compatibility: false
})

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.name.endsWith('.zip')) {
      selectedFile.value = file
      resetValidation()
    } else {
      alert('Please select a ZIP file')
    }
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (files && files.length > 0) {
    selectedFile.value = files[0]
    resetValidation()
  }
}

const clearFile = () => {
  selectedFile.value = null
  resetValidation()
}

const resetValidation = () => {
  validationResult.value = null
  installationResult.value = null
  expandedFiles.value.clear()
  Object.keys(validationSteps).forEach(key => {
    validationSteps[key as keyof typeof validationSteps] = false
  })
}

const validateModule = async () => {
  if (!selectedFile.value) return
  
  isValidating.value = true
  resetValidation()
  
  try {
    // Simulate validation steps
    setTimeout(() => { validationSteps.structure = true }, 500)
    setTimeout(() => { validationSteps.config = true }, 1000)
    setTimeout(() => { validationSteps.compatibility = true }, 1500)
    
    const result = await validateModuleZip(selectedFile.value)
    validationResult.value = result
    
  } catch (error) {
    console.error('Validation failed:', error)
    validationResult.value = {
      valid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    }
  } finally {
    isValidating.value = false
  }
}

const installModule = async () => {
  if (!validationResult.value?.valid || !selectedFile.value) return
  
  isInstalling.value = true
  
  try {
    // Simulate installation process
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    installationResult.value = {
      message: `Module "${validationResult.value.config?.name}" has been installed successfully. Please refresh the page to see the new module.`
    }
    
    // In a real implementation, you would:
    // 1. Extract the ZIP to the modules directory
    // 2. Register the module with the module registry
    // 3. Update the application state
    
  } catch (error) {
    console.error('Installation failed:', error)
    alert(`Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    isInstalling.value = false
  }
}

const downloadReport = () => {
  if (!validationResult.value) return
  
  const report = generateValidationReport(validationResult.value)
  const blob = new Blob([report], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `module-validation-report-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const toggleFileExpansion = (filePath: string) => {
  if (expandedFiles.value.has(filePath)) {
    expandedFiles.value.delete(filePath)
  } else {
    expandedFiles.value.add(filePath)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>