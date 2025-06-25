<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-medium text-white">Recent Checklists</h3>
      <router-link to="/checklists" class="text-primary-400 hover:text-primary-300 text-sm">
        View All
      </router-link>
    </div>
    
    <div class="space-y-3">
      <div class="p-3 bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-white">Onboarding Checklist</h4>
          <span class="text-xs text-green-400">5/5 Complete</span>
        </div>
        <div class="w-full bg-gray-600 rounded-full h-1.5">
          <div class="bg-green-500 h-1.5 rounded-full w-full"></div>
        </div>
      </div>
      
      <div class="p-3 bg-gray-700 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-white">Session Preparation</h4>
          <span class="text-xs text-blue-400">3/4 Complete</span>
        </div>
        <div class="w-full bg-gray-600 rounded-full h-1.5">
          <div class="bg-blue-500 h-1.5 rounded-full w-3/4"></div>
        </div>
      </div>
    </div>
    
    <div class="text-center py-2">
      <p class="text-gray-400 text-sm">2 active checklists</p>
    </div>
  </div>
</template>