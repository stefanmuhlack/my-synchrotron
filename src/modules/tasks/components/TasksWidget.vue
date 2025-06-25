<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-white">Recent Tasks</h3>
      <router-link to="/tasks" class="text-primary-400 hover:text-primary-300 text-sm">
        View All
      </router-link>
    </div>
    
    <div class="space-y-3">
      <div 
        v-for="task in recentTasks" 
        :key="task.id"
        class="p-3 bg-gray-700 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              :checked="task.status === 'completed'"
              @change="toggleTaskStatus(task.id)"
              class="rounded border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            <h4 
              :class="task.status === 'completed' ? 'line-through text-gray-400' : 'text-white'"
              class="text-sm font-medium"
            >
              {{ task.title }}
            </h4>
          </div>
          <span 
            :class="getPriorityColor(task.priority)"
            class="px-2 py-1 text-xs rounded-full"
          >
            {{ task.priority }}
          </span>
        </div>
        
        <div class="flex justify-between items-center">
          <span 
            :class="getStatusColor(task.status)"
            class="px-2 py-1 text-xs rounded-full"
          >
            {{ task.status }}
          </span>
          <span class="text-xs text-gray-400">Due {{ formatDate(task.dueDate) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="recentTasks.length === 0" class="text-center py-4">
      <p class="text-gray-400 text-sm">No tasks yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string
}

const tasks = ref<Task[]>([
  {
    id: '1',
    title: 'Review quarterly reports',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-02-15'
  },
  {
    id: '2',
    title: 'Prepare presentation slides',
    status: 'pending',
    priority: 'medium',
    dueDate: '2024-02-20'
  }
])

const recentTasks = computed(() => tasks.value.slice(0, 3))

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
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}

const toggleTaskStatus = (id: string) => {
  const task = tasks.value.find(t => t.id === id)
  if (task) {
    task.status = task.status === 'completed' ? 'pending' : 'completed'
  }
}
</script>