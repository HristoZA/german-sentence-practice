<script setup>
defineProps({
  exercise: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div
    class="mb-4 p-4 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-750"
  >
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">
      Problem Area: {{ exercise.problemArea }} | Level:
      {{ exercise.proficiencyLevel }}
    </p>
    <h2 class="text-xl font-semibold mb-2">Topic: {{ exercise.topic }}</h2>
    <p class="mb-2">
      <span class="font-medium">Instructions:</span> {{ exercise.instructions }}
    </p>
    <p class="mb-2">
      <span class="font-medium">Context:</span> {{ exercise.context }}
    </p>
    <div class="mt-3">
      <span class="font-medium">Use these words:</span>
      <ul class="list-disc list-inside ml-4">
        <li v-for="word in exercise.keyWords" :key="word" class="italic">
          {{ word }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles for ExerciseDisplay */
</style>
