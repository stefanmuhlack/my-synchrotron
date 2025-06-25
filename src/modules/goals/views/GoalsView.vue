<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Goal Management</h1>
      <p class="text-gray-400">Set, track, and achieve your coaching goals</p>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-blue-500 rounded-lg">
            <TargetIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Total Goals</p>
            <p class="text-2xl font-semibold text-white">{{ goals.length }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-green-500 rounded-lg">
            <CheckCircleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Completed</p>
            <p class="text-2xl font-semibold text-white">{{ completedGoals }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-500 rounded-lg">
            <ClockIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">In Progress</p>
            <p class="text-2xl font-semibold text-white">{{ inProgressGoals }}</p>
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
    
    <!-- Goals List -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-white">Your Goals</h2>
        <button @click="showCreateModal = true" class="btn-primary">
          <PlusIcon class="w-5 h-5 mr-2" />
          Add Goal
        </button>
      </div>
      
      <div class="space-y-4">
        <div 
          v-for="goal in goals" 
          :key="goal.id"
          class="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="font-medium text-white">{{ goal.title }}</h3>
              <p class="text-sm text-gray-400 mt-1">{{ goal.description }}</p>
              <div class="flex items-center space-x-4 mt-2">
                <span 
                  :class="getStatusColor(goal.status)"
                  class="px-2 py-1 text-xs rounded-full"
                >
                  {{ goal.status }}
                </span>
                <span class="text-xs text-gray-400">
                  Due: {{ formatDate(goal.dueDate) }}
                </span>
                <span class="text-xs text-gray-400">
                  Progress: {{ goal.progress }}%
                </span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button @click="editGoal(goal)" class="btn-secondary text-sm">
                Edit
              </button>
              <button @click="deleteGoal(goal.id)" class="btn-secondary text-sm text-red-400">
                Delete
              </button>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-3">
            <div class="w-full bg-gray-600 rounded-full h-2">
              <div 
                class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: goal.progress + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="goals.length === 0" class="text-center py-8">
        <TargetIcon class="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p class="text-gray-400">No goals yet. Create your first goal to get started!</p>
      </div>
    </div>
    
    <!-- Create/Edit Goal Modal -->
    <div 
      v-if="showCreateModal || editingGoal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold text-white mb-4">
          {{ editingGoal ? 'Edit Goal' : 'Create New Goal' }}
        </h3>
        
        <form @submit.prevent="saveGoal">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input 
                v-model="goalForm.title"
                type="text" 
                class="input-field"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea 
                v-model="goalForm.description"
                class="input-field"
                rows="3"
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
              <input 
                v-model="goalForm.dueDate"
                type="date" 
                class="input-field"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select v-model="goalForm.status" class="input-field">
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Progress (%)</label>
              <input 
                v-model.number="goalForm.progress"
                type="number" 
                min="0"
                max="100"
                class="input-field"
              />
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 mt-6">
            <button 
              type="button" 
              @click="cancelEdit"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              {{ editingGoal ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  FlagIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ChartBarIcon, 
  PlusIcon 
} from '@heroicons/vue/24/outline'

interface Goal {
  id: string
  title: string
  description: string
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold'
  progress: number
  dueDate: string
  createdAt: string
}

const goals = ref<Goal[]>([
  {
    id: '1',
    title: 'Improve Communication Skills',
    description: 'Work on active listening and clear expression of ideas',
    status: 'in-progress',
    progress: 65,
    dueDate: '2024-03-15',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Complete Leadership Training',
    description: 'Finish the advanced leadership certification program',
    status: 'not-started',
    progress: 0,
    dueDate: '2024-04-30',
    createdAt: '2024-01-20'
  }
])

const showCreateModal = ref(false)
const editingGoal = ref<Goal | null>(null)
const goalForm = ref({
  title: '',
  description: '',
  status: 'not-started' as Goal['status'],
  progress: 0,
  dueDate: ''
})

const completedGoals = computed(() => 
  goals.value.filter(g => g.status === 'completed').length
)

const inProgressGoals = computed(() => 
  goals.value.filter(g => g.status === 'in-progress').length
)

const successRate = computed(() => {
  if (goals.value.length === 0) return 0
  return Math.round((completedGoals.value / goals.value.length) * 100)
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500 text-white'
    case 'in-progress': return 'bg-blue-500 text-white'
    case 'on-hold': return 'bg-yellow-500 text-black'
    default: return 'bg-gray-500 text-white'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const editGoal = (goal: Goal) => {
  editingGoal.value = goal
  goalForm.value = {
    title: goal.title,
    description: goal.description,
    status: goal.status,
    progress: goal.progress,
    dueDate: goal.dueDate
  }
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingGoal.value = null
  goalForm.value = {
    title: '',
    description: '',
    status: 'not-started',
    progress: 0,
    dueDate: ''
  }
}

const saveGoal = () => {
  if (editingGoal.value) {
    const index = goals.value.findIndex(g => g.id === editingGoal.value!.id)
    if (index !== -1) {
      goals.value[index] = {
        ...editingGoal.value,
        ...goalForm.value
      }
    }
  } else {
    const newGoal: Goal = {
      id: Date.now().toString(),
      ...goalForm.value,
      createdAt: new Date().toISOString()
    }
    goals.value.push(newGoal)
  }
  
  cancelEdit()
}

const deleteGoal = (id: string) => {
  if (confirm('Are you sure you want to delete this goal?')) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value.splice(index, 1)
    }
  }
}
</script>