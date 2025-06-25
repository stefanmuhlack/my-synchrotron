<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-white">Recent Goals</h3>
      <router-link to="/goals" class="text-primary-400 hover:text-primary-300 text-sm">
        View All
      </router-link>
    </div>
    
    <div class="space-y-3">
      <div 
        v-for="goal in recentGoals" 
        :key="goal.id"
        class="p-3 bg-gray-700 rounded-lg"
      >
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-white">{{ goal.title }}</h4>
          <span 
            :class="getStatusColor(goal.status)"
            class="px-2 py-1 text-xs rounded-full"
          >
            {{ goal.status }}
          </span>
        </div>
        
        <div class="w-full bg-gray-600 rounded-full h-1.5">
          <div 
            class="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
            :style="{ width: goal.progress + '%' }"
          ></div>
        </div>
        
        <div class="flex justify-between items-center mt-2">
          <span class="text-xs text-gray-400">{{ goal.progress }}% complete</span>
          <span class="text-xs text-gray-400">Due {{ formatDate(goal.dueDate) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="recentGoals.length === 0" class="text-center py-4">
      <p class="text-gray-400 text-sm">No goals yet</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Goal {
  id: string
  title: string
  status: string
  progress: number
  dueDate: string
}

const goals = ref<Goal[]>([
  {
    id: '1',
    title: 'Improve Communication Skills',
    status: 'in-progress',
    progress: 65,
    dueDate: '2024-03-15'
  },
  {
    id: '2',
    title: 'Complete Leadership Training',
    status: 'not-started',
    progress: 0,
    dueDate: '2024-04-30'
  }
])

const recentGoals = computed(() => goals.value.slice(0, 3))

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-500 text-white'
    case 'in-progress': return 'bg-blue-500 text-white'
    case 'on-hold': return 'bg-yellow-500 text-black'
    default: return 'bg-gray-500 text-white'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  })
}
</script>