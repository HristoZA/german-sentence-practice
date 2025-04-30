<script setup>
import { ref, reactive } from "vue";
import ExerciseDisplay from "./components/ExerciseDisplay.vue";
import FeedbackDisplay from "./components/FeedbackDisplay.vue"; // Import FeedbackDisplay

// --- User Profile ---
const userProfile = reactive({
  proficiencyLevel: "A1", // Default level
  problemAreas: ["word-order"], // Default problem area
  // Add other fields from LLM_README.md as needed later
});

// --- Current Exercise ---
const currentExercise = reactive({
  exerciseId: "ex-001",
  problemArea: "word-order",
  proficiencyLevel: "A1",
  topic: "Hobbies",
  keyWords: ["spielen", "oft"],
  instructions:
    "Create a sentence about your hobbies using the provided words.",
  context: "You are talking about how often you play something.",
});

// --- User Input ---
const userAnswer = ref("");

// --- Feedback ---
const feedback = reactive({
  isCorrect: null,
  score: null,
  feedback: "",
  suggestions: "",
  grammarNotes: [],
});

// --- Placeholder Functions (to be implemented later) ---
function generateNewExercise() {
  console.log("Generating new exercise based on:", userProfile);
  // TODO: Call LLM API
}

function submitAnswer() {
  console.log("Submitting answer:", userAnswer.value);
  console.log("For exercise:", currentExercise);
  // TODO: Call LLM API for grading
  // TODO: Update feedback reactive variable
  // TODO: Update userProfile based on performance
}

// Initial exercise generation on component mount (optional)
// generateNewExercise();
</script>

<template>
  <div
    id="app"
    class="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
  >
    <div
      class="w-full max-w-2xl p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
    >
      <h1
        class="text-3xl font-bold text-center mb-6 text-blue-600 dark:text-blue-400"
      >
        German Sentence Practice
      </h1>

      <!-- Exercise Display -->
      <ExerciseDisplay :exercise="currentExercise" />

      <!-- User Input Area -->
      <div class="mb-6">
        <textarea
          v-model="userAnswer"
          rows="3"
          class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your sentence here..."
        ></textarea>
        <button
          @click="submitAnswer"
          class="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow"
        >
          Submit Answer
        </button>
      </div>

      <!-- Use FeedbackDisplay component -->
      <FeedbackDisplay :feedback="feedback" />

      <!-- Progress Area Placeholder -->
      <div
        class="p-4 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-750"
      >
        <p class="text-lg font-semibold mb-2">Progress Area</p>
        <p class="text-gray-600 dark:text-gray-400">
          User level: {{ userProfile.proficiencyLevel }}
        </p>
        <p class="text-gray-600 dark:text-gray-400">
          Problem Areas: {{ userProfile.problemAreas.join(", ") }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any component-specific styles here */
</style>
