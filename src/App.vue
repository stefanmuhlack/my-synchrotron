<template>
  <router-view v-if="!showLayout" />
  <MainLayout v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './components/MainLayout.vue'

const route = useRoute()

const showLayout = computed(() => {
  return !['Login', 'NotFound', 'Unauthorized'].includes(route.name as string)
})
</script>