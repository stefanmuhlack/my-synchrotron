<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Task Management</h1>
      <p class="text-gray-400">Organize and track your tasks and assignments</p>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-blue-500 rounded-lg">
            <ClipboardDocumentListIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Total Tasks</p>
            <p class="text-2xl font-semibold text-white">{{ tasks.length }}</p>
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
            <p class="text-2xl font-semibold text-white">{{ completedTasks }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-500 rounded-lg">
            <ClockIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Pending</p>
            <p class="text-2xl font-semibold text-white">{{ pendingTasks }}</p>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center">
          <div class="p-3 bg-red-500 rounded-lg">
            <ExclamationTriangleIcon class="w-6 h-6 text-white" />
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-400">Overdue</p>
            <p class="text-2xl font-semibold text-white">{{ overdueTasks }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Task Filters -->
    <div class="card mb-6">
      <div class="flex flex-wrap gap-4 items-center">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Filter by Status</label>
          <select v-model="statusFilter" class="input-field">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Filter by Priority</label>
          <select v-model="priorityFilter" class="input-field">
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <div class="flex items-end">
          <button @click="clearFilters" class="btn-secondary">
            Clear Filters
          </button>
        </div>
      </div>
    </div>
    
    <!-- Tasks List -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-white">Your Tasks</h2>
        <button @click="showCreateModal = true" class="btn-primary">
          <PlusIcon class="w-5 h-5 mr-2" />
          Add Task
        </button>
      </div>
      
      <div class="space-y-4">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                :checked="task.status === 'completed'"
                @change="toggleTaskStatus(task.id)"
                class="rounded border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <div class="flex-1">
                <h3 
                  :class="task.status === 'completed' ? 'line-through text-gray-400' : 'text-white'"
                  class="font-medium"
                >
                  {{ task.title }}
                </h3>
                <p class="text-sm text-gray-400 mt-1">{{ task.description }}</p>
                <div class="flex items-center space-x-4 mt-2">
                  <span 
                    :class="getStatusColor(task.status)"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ task.status }}
                  </span>
                  <span 
                    :class="getPriorityColor(task.priority)"
                    class="px-2 py-1 text-xs rounded-full"
                  >
                    {{ task.priority }} priority
                  </span>
                  <span class="text-xs text-gray-400">
                    Due: {{ formatDate(task.dueDate) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex space-x-2">
              <button @click="editTask(task)" class="btn-secondary text-sm">
                Edit
              </button>
              <button @click="deleteTask(task.id)" class="btn-secondary text-sm text-red-400">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="filteredTasks.length === 0" class="text-center py-8">
        <ClipboardDocumentListIcon class="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p class="text-gray-400">No tasks found. Create your first task to get started!</p>
      </div>
    </div>
    
    <!-- Create/Edit Task Modal -->
    <div 
      v-if="showCreateModal || editingTask" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold text-white mb-4">
          {{ editingTask ? 'Edit Task' : 'Create New Task' }}
        </h3>
        
        <form @submit.prevent="saveTask">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input 
                v-model="taskForm.title"
                type="text" 
                class="input-field"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea 
                v-model="taskForm.description"
                class="input-field"
                rows="3"
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
              <input 
                v-model="taskForm.dueDate"
                type="date" 
                class="input-field"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select v-model="taskForm.priority" class="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select v-model="taskForm.status" class="input-field">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
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
              {{ editingTask ? 'Update' : 'Create' }}
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
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  PlusIcon 
} from '@heroicons/vue/24/outline'

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdAt: string
}

const tasks = ref<Task[]>([
  {
    id: '1',
    title: 'Review quarterly reports',
    description: 'Analyze Q1 performance metrics and prepare summary',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-02-15',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'Prepare presentation slides',
    description: 'Create slides for next week\'s team meeting',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-02-20',
    createdAt: '2024-01-20'
  }
])

const showCreateModal = ref(false)
const editingTask = ref<Task | null>(null)
const statusFilter = ref('')
const priorityFilter = ref('')

const taskForm = ref({
  title: '',
  description: '',
  status: 'pending' as Task['status'],
  priority: 'medium' as Task['priority'],
  dueDate: ''
})

const completedTasks = computed(() => 
  tasks.value.filter(t => t.status === 'completed').length
)

const pendingTasks = computed(() => 
  tasks.value.filter(t => t.status === 'pending').length
)

const overdueTasks = computed(() => 
  tasks.value.filter(t => t.status === 'overdue' || 
    (t.status !== 'completed' && new Date(t.dueDate) < new Date())).length
)

const filteredTasks = computed(() => {
  let filtered = tasks.value

  if (statusFilter.value) {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }

  if (priorityFilter.value) {
    filtered = filtered.filter(t => t.priority === priorityFilter.value)
  }

  return filtered
})

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500 text-white'
    case 'in-progress': return 'bg-blue-500 text-white'
    case 'overdue': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500 text-white'
    case 'medium': return 'bg-yellow-500 text-black'
    default: return 'bg-green-500 text-white'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const clearFilters = () => {
  statusFilter.value = ''
  priorityFilter.value = ''
}

const toggleTaskStatus = (id: string) => {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    task.status = task.status === 'completed' ? 'pending' : 'completed'
  }
}

const editTask = (task: Task) => {
  editingTask.value = task
  taskForm.value = {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate
  }
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingTask.value = null
  taskForm.value = {
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: ''
  }
}

const saveTask = () => {
  if (editingTask.value) {
    const index = tasks.value.findIndex(t => t.id === editingTask.value!.id)
    if (index !== -1) {
      tasks.value[index] = {
        ...editingTask.value,
        ...taskForm.value
      }
    }
  } else {
    const newTask: Task = {
      id: Date.now().toString(),
      ...taskForm.value,
      createdAt: new Date().toISOString()
    }
    tasks.value.push(newTask)
  }
  
  cancelEdit()
}

const deleteTask = (id: string) => {
  if (confirm('Are you sure you want to delete this task?')) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }
}
</script>