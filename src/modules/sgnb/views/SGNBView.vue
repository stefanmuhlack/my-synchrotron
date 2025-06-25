<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">SGNB Management</h1>
      <p class="text-gray-400">Systematic Goal-oriented Needs-based Coaching</p>
    </div>
    
    <!-- Navigation Tabs -->
    <div class="mb-8">
      <nav class="flex space-x-8">
        <router-link
          to="/sgnb"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md"
          :class="$route.name === 'SGNB' ? 'bg-primary-500 text-white' : 'text-gray-300 hover:text-white'"
        >
          Overview
        </router-link>
        <router-link
          to="/sgnb/goals"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md"
          :class="$route.name === 'SGNBGoals' ? 'bg-primary-500 text-white' : 'text-gray-300 hover:text-white'"
        >
          Goals
        </router-link>
        <router-link
          to="/sgnb/actions"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md"
          :class="$route.name === 'SGNBActions' ? 'bg-primary-500 text-white' : 'text-gray-300 hover:text-white'"
        >
          Actions
        </router-link>
      </nav>
    </div>
    
    <!-- Overview Content -->
    <div class="space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-blue-500 rounded-lg">
              <ChartBarIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Active Sessions</p>
              <p class="text-2xl font-semibold text-white">12</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-green-500 rounded-lg">
              <CheckCircleIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Completed Goals</p>
              <p class="text-2xl font-semibold text-white">8</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-500 rounded-lg">
              <ClockIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Pending Actions</p>
              <p class="text-2xl font-semibold text-white">15</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-purple-500 rounded-lg">
              <UserGroupIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Active Clients</p>
              <p class="text-2xl font-semibold text-white">6</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="card">
        <h2 class="text-xl font-semibold text-white mb-4">Recent Activity</h2>
        <div class="space-y-4">
          <div class="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <div class="flex-1">
              <p class="text-white">Goal "Improve Communication" completed by Alice</p>
              <p class="text-sm text-gray-400">2 hours ago</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
            <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div class="flex-1">
              <p class="text-white">New action plan created for Bob</p>
              <p class="text-sm text-gray-400">4 hours ago</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
            <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div class="flex-1">
              <p class="text-white">Session scheduled with Carol for next week</p>
              <p class="text-sm text-gray-400">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ChartBarIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  UserGroupIcon 
} from '@heroicons/vue/24/outline'
</script>