<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-white">SGNB Overview</h3>
      <router-link to="/sgnb" class="text-primary-400 hover:text-primary-300 text-sm">
        View Details
      </router-link>
    </div>
    
    <div class="space-y-3">
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <p class="text-sm font-medium text-white">Active Sessions</p>
          <p class="text-xs text-gray-400">Currently running</p>
        </div>
        <span class="text-lg font-semibold text-blue-400">12</span>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <p class="text-sm font-medium text-white">Completed Goals</p>
          <p class="text-xs text-gray-400">This month</p>
        </div>
        <span class="text-lg font-semibold text-green-400">8</span>
      </div>
      
      <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div>
          <p class="text-sm font-medium text-white">Pending Actions</p>
          <p class="text-xs text-gray-400">Require attention</p>
        </div>
        <span class="text-lg font-semibold text-yellow-400">15</span>
      </div>
    </div>
  </div>
</template>