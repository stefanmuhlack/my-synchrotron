<template>
  <div class="p-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">Admin Panel</h1>
      <p class="text-gray-400">Manage system modules and users</p>
    </div>
    
    <!-- Tab Navigation -->
    <div class="mb-8">
      <nav class="flex space-x-8">
        <button
          @click="activeTab = 'modules'"
          :class="activeTab === 'modules' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Module Management
        </button>
        <button
          @click="activeTab = 'upload'"
          :class="activeTab === 'upload' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Upload Module
        </button>
        <button
          @click="activeTab = 'users'"
          :class="activeTab === 'users' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          User Management
        </button>
        <button
          @click="activeTab = 'tests'"
          :class="activeTab === 'tests' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Module Tests
        </button>
        <button
          @click="activeTab = 'versions'"
          :class="activeTab === 'versions' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Version Report
        </button>
        <button
          @click="activeTab = 'lifecycle'"
          :class="activeTab === 'lifecycle' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Module Lifecycle
        </button>
        <button
          @click="activeTab = 'health'"
          :class="activeTab === 'health' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-300'"
          class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          Health Monitor
        </button>
      </nav>
    </div>
    
    <!-- Module Management Tab -->
    <div v-if="activeTab === 'modules'">
      <div class="card mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-white">Module Management</h2>
          <button class="btn-primary" @click="refreshModules">
            <ArrowPathIcon class="w-4 h-4 mr-2" />
            Refresh Modules
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left py-3 px-4 text-gray-300">Module</th>
                <th class="text-left py-3 px-4 text-gray-300">Version</th>
                <th class="text-left py-3 px-4 text-gray-300">Compatibility</th>
                <th class="text-left py-3 px-4 text-gray-300">Roles Allowed</th>
                <th class="text-left py-3 px-4 text-gray-300">Has Widget</th>
                <th class="text-left py-3 px-4 text-gray-300">Status</th>
                <th class="text-left py-3 px-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="module in allModules" 
                :key="module.key"
                class="border-b border-gray-700"
              >
                <td class="py-4 px-4">
                  <div>
                    <h3 class="font-medium text-white">{{ module.config.name }}</h3>
                    <p class="text-sm text-gray-400">{{ module.config.description || 'No description' }}</p>
                    <div v-if="module.error" class="mt-1">
                      <span class="text-xs text-red-400 bg-red-900 px-2 py-1 rounded">
                        {{ module.error }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div>
                    <span class="text-white">{{ module.config.version || 'N/A' }}</span>
                    <div v-if="module.config.author" class="text-xs text-gray-500">
                      by {{ module.config.author }}
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div v-if="module.config.compatibleWithCore">
                    <span class="text-white text-sm">{{ module.config.compatibleWithCore }}</span>
                    <div class="text-xs text-gray-500">Core: {{ coreVersion }}</div>
                  </div>
                  <span v-else class="text-yellow-400 text-sm">Not specified</span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="role in module.config.rolesAllowed" 
                      :key="role"
                      class="px-2 py-1 bg-primary-500 text-white text-xs rounded-full"
                    >
                      {{ role }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <span :class="module.config.hasWidget ? 'text-green-400' : 'text-gray-400'">
                    {{ module.config.hasWidget ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <span 
                    :class="module.error ? 'text-red-400' : module.enabled ? 'text-green-400' : 'text-gray-400'"
                    class="font-medium"
                  >
                    {{ module.error ? 'Error' : module.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </td>
                <td class="py-4 px-4">
                  <div class="flex space-x-2">
                    <template v-if="!module.error">
                      <button
                        @click="toggleModule(module.key)"
                        :class="module.enabled ? 'btn-secondary' : 'btn-primary'"
                        class="text-sm"
                      >
                        {{ module.enabled ? 'Disable' : 'Enable' }}
                      </button>
                    </template>
                    <template v-else>
                      <button
                        @click="clearModuleError(module.key)"
                        class="btn-primary text-sm"
                      >
                        Clear Error
                      </button>
                    </template>
                    <button
                      @click="confirmDeleteModule(module.key, module.config.name)"
                      class="btn-secondary text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      title="Delete module"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Module Upload Tab -->
    <div v-if="activeTab === 'upload'">
      <ModuleUploadPanel />
    </div>
    
    <!-- Enhanced User Management Tab -->
    <div v-if="activeTab === 'users'">
      <div class="mb-6">
        <h2 class="text-xl font-semibold text-white mb-4">User Management</h2>
        <p class="text-gray-400">Manage system users, roles, and module permissions</p>
      </div>
      
      <!-- Filters -->
      <div class="card mb-6">
        <div class="flex flex-wrap gap-4 items-center">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Filter by Role</label>
            <select v-model="roleFilter" class="input-field">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="coachee">Coachee</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Filter by Mandant</label>
            <select v-model="mandantFilter" class="input-field">
              <option value="">All Mandants</option>
              <option value="*">System Wide (*)</option>
              <option v-for="coach in coaches" :key="coach.id" :value="coach.id">
                Coach {{ coach.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Filter by Module</label>
            <select v-model="moduleFilter" class="input-field">
              <option value="">All Modules</option>
              <option v-for="module in allAvailableModules" :key="module.key" :value="module.key">
                {{ module.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Search</label>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search users..."
              class="input-field"
            />
          </div>
          
          <div class="flex items-end">
            <button @click="clearFilters" class="btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      <!-- User Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-blue-500 rounded-lg">
              <UsersIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Total Users</p>
              <p class="text-2xl font-semibold text-white">{{ filteredUsers.length }}</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-red-500 rounded-lg">
              <ShieldCheckIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Admins</p>
              <p class="text-2xl font-semibold text-white">{{ adminCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-green-500 rounded-lg">
              <UserGroupIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Coaches</p>
              <p class="text-2xl font-semibold text-white">{{ coachCount }}</p>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="flex items-center">
            <div class="p-3 bg-purple-500 rounded-lg">
              <AcademicCapIcon class="w-6 h-6 text-white" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-400">Coachees</p>
              <p class="text-2xl font-semibold text-white">{{ coacheeCount }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Users Table -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-white">Users</h3>
          <button class="btn-primary" @click="showCreateModal = true">
            <PlusIcon class="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left py-3 px-4 text-gray-300">User</th>
                <th class="text-left py-3 px-4 text-gray-300">Email</th>
                <th class="text-left py-3 px-4 text-gray-300">Role</th>
                <th class="text-left py-3 px-4 text-gray-300">Mandant</th>
                <th class="text-left py-3 px-4 text-gray-300">Module Access</th>
                <th class="text-left py-3 px-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="user in paginatedUsers" 
                :key="user.id"
                class="border-b border-gray-700 hover:bg-gray-700"
              >
                <td class="py-4 px-4">
                  <div class="flex items-center">
                    <img 
                      :src="user.avatar" 
                      :alt="user.name"
                      class="w-10 h-10 rounded-full mr-3"
                    />
                    <div>
                      <span class="font-medium text-white">{{ user.name }}</span>
                      <div class="text-sm text-gray-400">ID: {{ user.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-4 text-gray-300">{{ user.email }}</td>
                <td class="py-4 px-4">
                  <span 
                    :class="getRoleColor(user.role)"
                    class="px-3 py-1 text-sm rounded-full capitalize"
                  >
                    {{ user.role }}
                  </span>
                </td>
                <td class="py-4 px-4 text-gray-300">
                  {{ getMandantDisplay(user.mandant) }}
                </td>
                <td class="py-4 px-4">
                  <div v-if="user.role === 'admin'" class="flex items-center">
                    <CheckCircleIcon class="w-4 h-4 text-green-400 mr-2" />
                    <span class="text-green-400 text-sm font-medium">All Modules</span>
                  </div>
                  <div v-else-if="user.modulePermissions && user.modulePermissions.length > 0">
                    <div class="flex flex-wrap gap-1 mb-2">
                      <span 
                        v-for="moduleKey in user.modulePermissions.slice(0, 2)" 
                        :key="moduleKey"
                        class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full"
                      >
                        {{ getModuleName(moduleKey) }}
                      </span>
                      <button
                        v-if="user.modulePermissions.length > 2"
                        @click="showModuleDetails(user)"
                        class="px-2 py-1 bg-gray-600 text-white text-xs rounded-full hover:bg-gray-500"
                      >
                        +{{ user.modulePermissions.length - 2 }} more
                      </button>
                    </div>
                    <div class="text-xs text-gray-400">
                      {{ user.modulePermissions.length }} module{{ user.modulePermissions.length !== 1 ? 's' : '' }}
                    </div>
                  </div>
                  <div v-else class="flex items-center">
                    <XCircleIcon class="w-4 h-4 text-red-400 mr-2" />
                    <span class="text-red-400 text-sm">No Access</span>
                  </div>
                </td>
                <td class="py-4 px-4">
                  <div class="flex space-x-2">
                    <button
                      @click="editUser(user)"
                      class="btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      @click="editUserModules(user)"
                      class="btn-secondary text-sm"
                    >
                      Modules
                    </button>
                    <button
                      v-if="user.id !== authStore.user?.id"
                      @click="deleteUser(user.id)"
                      class="btn-secondary text-sm text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-6">
          <div class="text-sm text-gray-400">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, filteredUsers.length) }} of {{ filteredUsers.length }} users
          </div>
          <div class="flex space-x-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="btn-secondary text-sm"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
            >
              Previous
            </button>
            <span class="px-3 py-2 text-sm text-gray-300">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="btn-secondary text-sm"
              :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Module Tests Tab -->
    <div v-if="activeTab === 'tests'">
      <ModuleTestPanel />
    </div>
    
    <!-- Version Report Tab -->
    <div v-if="activeTab === 'versions'">
      <VersionMismatchReport />
    </div>
    
    <!-- Module Lifecycle Tab -->
    <div v-if="activeTab === 'lifecycle'">
      <ModuleLifecyclePanel />
    </div>
    
    <!-- Health Monitor Tab -->
    <div v-if="activeTab === 'health'">
      <ModuleHealthMonitor />
    </div>
    
    <!-- Create/Edit User Modal -->
    <div 
      v-if="showCreateModal || editingUser" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold text-white mb-4">
          {{ editingUser ? 'Edit User' : 'Create New User' }}
        </h3>
        
        <form @submit.prevent="saveUser">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input 
                v-model="userForm.name"
                type="text" 
                class="input-field"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input 
                v-model="userForm.email"
                type="email" 
                class="input-field"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input 
                v-model="userForm.password"
                type="password" 
                class="input-field"
                :required="!editingUser"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Role</label>
              <select v-model="userForm.role" class="input-field">
                <option value="admin">Admin</option>
                <option value="coach">Coach</option>
                <option value="coachee">Coachee</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Mandant</label>
              <input 
                v-model="userForm.mandant"
                type="text" 
                class="input-field"
                placeholder="Coach ID or * for admin"
                required
              />
            </div>
            
            <!-- Module Permissions for non-admin users -->
            <div v-if="userForm.role !== 'admin'">
              <label class="block text-sm font-medium text-gray-300 mb-2">Module Permissions</label>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <label 
                  v-for="module in allAvailableModules.filter(m => m.rolesAllowed.includes(userForm.role))" 
                  :key="module.key"
                  class="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    :value="module.key"
                    v-model="userForm.modulePermissions"
                    class="rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-300">{{ module.name }}</span>
                </label>
              </div>
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
              {{ editingUser ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Module Permissions Modal -->
    <div 
      v-if="showModuleModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-white">
            Module Permissions: {{ selectedUser?.name }}
          </h3>
          <button @click="closeModuleModal" class="text-gray-400 hover:text-white">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div v-if="selectedUser?.role === 'admin'" class="text-center py-8">
          <CheckCircleIcon class="w-16 h-16 text-green-400 mx-auto mb-4" />
          <p class="text-green-400 font-medium">Admin users have access to all modules</p>
        </div>
        
        <div v-else>
          <form @submit.prevent="saveModulePermissions">
            <div class="space-y-3 max-h-60 overflow-y-auto mb-6">
              <label 
                v-for="module in allAvailableModules.filter(m => m.rolesAllowed.includes(selectedUser?.role || 'coachee'))" 
                :key="module.key"
                class="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    :value="module.key"
                    v-model="modulePermissionsForm"
                    class="rounded border-gray-600 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <span class="text-white font-medium">{{ module.name }}</span>
                    <p class="text-sm text-gray-400">{{ module.description || 'No description' }}</p>
                  </div>
                </div>
                <span 
                  :class="module.enabled ? 'text-green-400' : 'text-red-400'"
                  class="text-xs"
                >
                  {{ module.enabled ? 'Active' : 'Disabled' }}
                </span>
              </label>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                @click="closeModuleModal"
                class="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Save Permissions
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Module Details Modal -->
    <div 
      v-if="showModuleDetailsModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-white">
            Module Access: {{ selectedUser?.name }}
          </h3>
          <button @click="showModuleDetailsModal = false" class="text-gray-400 hover:text-white">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div class="space-y-2">
          <div 
            v-for="moduleKey in selectedUser?.modulePermissions || []" 
            :key="moduleKey"
            class="flex items-center justify-between p-2 bg-gray-700 rounded"
          >
            <span class="text-white">{{ getModuleName(moduleKey) }}</span>
            <span 
              :class="getModuleStatus(moduleKey) ? 'text-green-400' : 'text-red-400'"
              class="text-xs"
            >
              {{ getModuleStatus(moduleKey) ? 'Active' : 'Disabled' }}
            </span>
          </div>
        </div>
        
        <div class="flex justify-end mt-6">
          <button @click="showModuleDetailsModal = false" class="btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Module Confirmation Modal -->
    <div 
      v-if="showDeleteModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div class="flex items-center mb-4">
          <ExclamationTriangleIcon class="w-8 h-8 text-red-400 mr-3" />
          <h3 class="text-xl font-semibold text-white">Delete Module</h3>
        </div>
        
        <div class="mb-6">
          <p class="text-gray-300 mb-2">
            Are you sure you want to delete the module <strong>"{{ moduleToDelete?.name }}"</strong>?
          </p>
          <p class="text-sm text-red-400">
            This action cannot be undone. The module will be completely removed from the system.
          </p>
        </div>
        
        <div class="flex justify-end space-x-3">
          <button 
            @click="cancelDeleteModule"
            class="btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="executeDeleteModule"
            class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <TrashIcon class="w-4 h-4 mr-2 inline" />
            Delete Module
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/core/authStore'
import { useModulesStore } from '@/stores/modules'
import { useModuleLifecycleStore } from '@/core/moduleLifecycle'
import { moduleRegistry } from '@/core/registry'
import { CORE_VERSION } from '@/constants/version'
import type { User, UserRole } from '@/types'
import { 
  ArrowPathIcon, 
  PlusIcon, 
  UsersIcon, 
  ShieldCheckIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import ModuleTestPanel from './ModuleTestPanel.vue'
import ModuleUploadPanel from './ModuleUploadPanel.vue'
import VersionMismatchReport from './VersionMismatchReport.vue'
import ModuleLifecyclePanel from './ModuleLifecyclePanel.vue'
import ModuleHealthMonitor from './ModuleHealthMonitor.vue'

const authStore = useAuthStore()
const modulesStore = useModulesStore()
const lifecycleStore = useModuleLifecycleStore()

const activeTab = ref<'modules' | 'upload' | 'users' | 'tests' | 'versions' | 'lifecycle' | 'health'>('modules')
const showCreateModal = ref(false)
const showModuleModal = ref(false)
const showModuleDetailsModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<User | null>(null)
const selectedUser = ref<User | null>(null)
const moduleToDelete = ref<{ key: string; name: string } | null>(null)

// User management filters and pagination
const roleFilter = ref<UserRole | ''>('')
const mandantFilter = ref('')
const moduleFilter = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const userForm = ref({
  name: '',
  email: '',
  password: '',
  role: 'coachee' as UserRole,
  mandant: '',
  modulePermissions: [] as string[]
})

const modulePermissionsForm = ref<string[]>([])

const coreVersion = computed(() => CORE_VERSION)

const allModules = computed(() => {
  return Object.entries(modulesStore.modules).map(([key, module]) => ({
    key,
    ...module
  }))
})

const allAvailableModules = computed(() => modulesStore.getAllAvailableModules)

// User filtering and pagination
const coaches = computed(() => authStore.users.filter(u => u.role === 'coach'))

const filteredUsers = computed(() => {
  let users = authStore.users

  if (roleFilter.value) {
    users = users.filter(u => u.role === roleFilter.value)
  }

  if (mandantFilter.value) {
    users = users.filter(u => u.mandant === mandantFilter.value)
  }

  if (moduleFilter.value) {
    users = users.filter(u => 
      u.role === 'admin' || 
      (u.modulePermissions && u.modulePermissions.includes(moduleFilter.value))
    )
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    users = users.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }

  return users
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / pageSize.value))

// User stats with robust role filtering
const adminCount = computed(() => authStore.users.filter(u => u.role === 'admin').length)
const coachCount = computed(() => authStore.users.filter(u => u.role === 'coach').length)
const coacheeCount = computed(() => authStore.users.filter(u => u.role === 'coachee').length)

// Helper functions
const getRoleColor = (role: UserRole) => {
  switch (role) {
    case 'admin': return 'bg-red-500 text-white'
    case 'coach': return 'bg-green-500 text-white'
    case 'coachee': return 'bg-blue-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const getMandantDisplay = (mandant: string) => {
  if (mandant === '*') return 'System Wide'
  const coach = authStore.users.find(u => u.id === mandant && u.role === 'coach')
  return coach ? `Coach ${coach.name}` : `Coach ${mandant}`
}

const getModuleName = (moduleKey: string) => {
  const module = allAvailableModules.value.find(m => m.key === moduleKey)
  return module ? module.name : moduleKey
}

const getModuleStatus = (moduleKey: string) => {
  const module = allAvailableModules.value.find(m => m.key === moduleKey)
  return module ? module.enabled : false
}

const clearFilters = () => {
  roleFilter.value = ''
  mandantFilter.value = ''
  moduleFilter.value = ''
  searchQuery.value = ''
  currentPage.value = 1
}

// Module management functions
const toggleModule = (key: string) => {
  modulesStore.toggleModule(key)
}

const refreshModules = async () => {
  await moduleRegistry.loadModules()
}

const clearModuleError = (key: string) => {
  modulesStore.clearModuleError(key)
}

const confirmDeleteModule = (key: string, name: string) => {
  moduleToDelete.value = { key, name }
  showDeleteModal.value = true
}

const cancelDeleteModule = () => {
  moduleToDelete.value = null
  showDeleteModal.value = false
}

const executeDeleteModule = async () => {
  if (moduleToDelete.value) {
    const success = await modulesStore.deleteModule(moduleToDelete.value.key)
    
    if (success) {
      console.info(`✅ Module '${moduleToDelete.value.name}' deleted successfully`)
      
      // Also remove from lifecycle store if it exists
      try {
        lifecycleStore.unregisterModule(moduleToDelete.value.key)
      } catch (error) {
        console.warn(`Module '${moduleToDelete.value.key}' not found in lifecycle store`)
      }
    } else {
      console.error(`❌ Failed to delete module '${moduleToDelete.value.name}'`)
    }
  }
  
  cancelDeleteModule()
}

// User management functions
const editUser = (user: User) => {
  editingUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email,
    password: '',
    role: user.role,
    mandant: user.mandant,
    modulePermissions: user.modulePermissions || []
  }
}

const editUserModules = (user: User) => {
  selectedUser.value = user
  modulePermissionsForm.value = [...(user.modulePermissions || [])]
  showModuleModal.value = true
}

const showModuleDetails = (user: User) => {
  selectedUser.value = user
  showModuleDetailsModal.value = true
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingUser.value = null
  userForm.value = {
    name: '',
    email: '',
    password: '',
    role: 'coachee',
    mandant: '',
    modulePermissions: []
  }
}

const saveUser = async () => {
  if (editingUser.value) {
    const updateData: Partial<User> = {
      name: userForm.value.name,
      email: userForm.value.email,
      role: userForm.value.role,
      mandant: userForm.value.mandant,
      modulePermissions: userForm.value.role === 'admin' ? [] : userForm.value.modulePermissions
    }
    
    if (userForm.value.password) {
      updateData.password = userForm.value.password
    }
    
    await authStore.updateUser(editingUser.value.id, updateData)
  } else {
    await authStore.createUser({
      ...userForm.value,
      modulePermissions: userForm.value.role === 'admin' ? [] : userForm.value.modulePermissions
    })
  }
  
  cancelEdit()
}

const deleteUser = async (userId: string) => {
  if (confirm('Are you sure you want to delete this user?')) {
    await authStore.deleteUser(userId)
  }
}

const closeModuleModal = () => {
  showModuleModal.value = false
  selectedUser.value = null
  modulePermissionsForm.value = []
}

const saveModulePermissions = async () => {
  if (selectedUser.value) {
    await authStore.updateUserModulePermissions(selectedUser.value.id, modulePermissionsForm.value)
    closeModuleModal()
  }
}
</script>