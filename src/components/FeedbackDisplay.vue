<script setup>
defineProps({
  feedback: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div
    v-if="feedback.isCorrect !== null"
    class="mb-6 p-4 border rounded"
    :class="{
      'border-green-500 bg-green-50 dark:bg-green-900/30': feedback.isCorrect,
      'border-red-500 bg-red-50 dark:bg-red-900/30': !feedback.isCorrect,
    }"
  >
    <h3
      class="text-lg font-semibold mb-2"
      :class="{
        'text-green-700 dark:text-green-300': feedback.isCorrect,
        'text-red-700 dark:text-red-300': !feedback.isCorrect,
      }"
    >
      {{ feedback.isCorrect ? "Correct!" : "Needs Improvement" }}
      <span v-if="feedback.score !== null" class="text-sm font-normal">
        (Score: {{ (feedback.score * 100).toFixed(0) }}%)</span
      >
    </h3>
    <p v-if="feedback.feedback" class="mb-2 text-gray-700 dark:text-gray-300">
      {{ feedback.feedback }}
    </p>
    <p
      v-if="feedback.suggestions"
      class="mb-2 text-sm text-blue-600 dark:text-blue-400 italic"
    >
      Suggestion: {{ feedback.suggestions }}
    </p>

    <div
      v-if="feedback.grammarNotes && feedback.grammarNotes.length > 0"
      class="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600"
    >
      <h4 class="font-semibold mb-1 text-gray-600 dark:text-gray-400">
        Grammar Notes:
      </h4>
      <ul
        class="list-disc list-inside ml-4 text-sm text-gray-600 dark:text-gray-400 space-y-1"
      >
        <li v-for="(note, index) in feedback.grammarNotes" :key="index">
          <strong>{{ note.rule }}</strong>
          <span v-if="note.example"> (e.g., "{{ note.example }}")</span>
        </li>
      </ul>
    </div>
  </div>
  <div
    v-else
    class="mb-6 p-4 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-750"
  >
    <p class="text-lg font-semibold mb-2 text-gray-500 dark:text-gray-400">
      Feedback Area
    </p>
    <p class="text-gray-600 dark:text-gray-400">
      Submit your answer to see feedback.
    </p>
  </div>
</template>

<style scoped>
/* Scoped styles for FeedbackDisplay */
</style>
