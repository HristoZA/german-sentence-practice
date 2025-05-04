<template>
  <div class="container">
    <h1>
      <span>German</span>
      <span class="brand-color">Sentence</span>
      <span>Practice</span>
    </h1>

    <main>
      <!-- Exercise Card -->
      <div class="card">
        <div class="card-header">
          <!-- Simplified header -->
          <span>Level: {{ currentExercise.proficiencyLevel || "..." }}</span>
          <span>Focus: {{ currentExercise.problemArea || "..." }}</span>
        </div>
        <div class="card-content">
          <div v-if="isLoadingExercise" class="loading-indicator">
            Loading exercise...
          </div>
          <ExerciseDisplay
            v-else-if="currentExercise.exerciseId"
            :exercise="currentExercise"
          />
          <div v-else class="placeholder">No exercise loaded.</div>
        </div>
      </div>

      <!-- Answer Input Section -->
      <div class="card">
        <div class="card-content">
          <div v-if="error" class="error-message">
            {{ error }}
          </div>
          <label for="answer">Your answer:</label>
          <textarea
            id="answer"
            v-model="userAnswer"
            rows="3"
            placeholder="Type your German sentence here..."
            :disabled="isLoadingExercise || isGrading"
            :class="{ 'input-error': inputError }"
            @input="inputError = null"
          ></textarea>
          <p v-if="inputError" class="input-error-text">{{ inputError }}</p>

          <div class="button-group">
            <button
              @click="submitAnswer"
              class="primary"
              :disabled="isLoadingExercise || isGrading || !userAnswer.trim()"
            >
              <span v-if="isGrading">Grading...</span>
              <span v-else>Submit Answer</span>
            </button>
            <button
              @click="generateNewExercise"
              class="secondary"
              :disabled="isLoadingExercise || isGrading"
            >
              <span v-if="isLoadingExercise">Loading...</span>
              <span v-else>New Exercise</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Feedback Section -->
      <div class="card">
        <div class="card-header">
          <h2>Feedback</h2>
        </div>
        <div class="card-content">
          <div v-if="isGrading" class="loading-indicator">
            Analyzing your answer...
          </div>
          <FeedbackDisplay v-else :feedback="feedback" />
        </div>
      </div>

      <!-- Progress Section -->
      <div class="card">
        <div class="card-header">
          <h2>Your Progress</h2>
        </div>
        <div class="card-content">
          <ProgressDisplay
            :user-profile="userProfile"
            @update:level="handleLevelUpdate"
            @update:focusArea="handleFocusAreaUpdate"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import ExerciseDisplay from "./components/ExerciseDisplay.vue";
import FeedbackDisplay from "./components/FeedbackDisplay.vue";
import ProgressDisplay from "./components/ProgressDisplay.vue";
import { fetchExercise, gradeSentence } from "./utils/llm.js";
import {
  loadUserProfile,
  saveUserProfile,
  updateUserProfile,
} from "./utils/userProfile.js";

// --- State Variables ---
const userProfile = reactive(loadUserProfile());
const currentExercise = reactive({
  exerciseId: null,
  problemArea: "",
  proficiencyLevel: "",
  topic: "",
  keyWords: [],
  instructions: "",
  context: "",
});
const userAnswer = ref("");
const feedback = reactive({
  isCorrect: null,
  score: null,
  feedback: "",
  suggestions: "",
  grammarNotes: [],
});
const isLoadingExercise = ref(false);
const isGrading = ref(false);
const error = ref(null);
const inputError = ref(null);

// --- Computed property for input validation ---
const isInputValid = computed(() => {
  const answer = userAnswer.value.trim();
  if (!answer) return false; // Cannot be empty
  // Basic check: at least 2 words or 5 characters
  return answer.split(" ").length >= 2 || answer.length >= 5;
});

// --- Functions ---
async function generateNewExercise() {
  // --- Reset feedback state ---
  Object.assign(feedback, {
    isCorrect: null,
    score: null,
    feedback: "",
    suggestions: "",
    grammarNotes: [],
  });

  isLoadingExercise.value = true;
  error.value = null;
  inputError.value = null;
  userAnswer.value = "";

  try {
    const newExercise = await fetchExercise(userProfile);
    Object.assign(currentExercise, newExercise);
  } catch (err) {
    console.error("Error fetching exercise:", err);
    error.value =
      err.message || "Failed to load a new exercise. Please try again.";
  } finally {
    isLoadingExercise.value = false;
  }
}

async function submitAnswer() {
  inputError.value = null;
  const answer = userAnswer.value.trim();

  if (!answer) {
    inputError.value = "Please enter a sentence.";
    return;
  }
  if (!isInputValid.value) {
    inputError.value =
      "Please enter a more complete sentence (at least 2 words or 5 characters).";
    return;
  }

  isGrading.value = true;
  error.value = null;
  feedback.isCorrect = null;
  try {
    const gradingResult = await gradeSentence(currentExercise, answer);
    Object.assign(feedback, gradingResult);

    // --- Update User Profile based on performance ---
    const profileUpdates = {
      exercisesCompleted: userProfile.exercisesCompleted + 1,
      correctAnswers:
        userProfile.correctAnswers + (gradingResult.isCorrect ? 1 : 0),
      problemAreas: [...userProfile.problemAreas],
    };

    // Add problem area if answer is incorrect and it's not already listed
    if (
      !gradingResult.isCorrect &&
      currentExercise.problemArea &&
      !userProfile.problemAreas.includes(currentExercise.problemArea)
    ) {
      profileUpdates.problemAreas.push(currentExercise.problemArea);
    }

    // Update the reactive object AND save to cookie
    Object.assign(userProfile, updateUserProfile(profileUpdates));
  } catch (err) {
    console.error("Error grading sentence:", err);
    error.value =
      err.message || "Failed to grade the sentence. Please try again.";
    Object.assign(feedback, {
      isCorrect: null,
      score: null,
      feedback: "",
      suggestions: "",
      grammarNotes: [],
    });
  } finally {
    isGrading.value = false;
  }
}

// --- Function to handle level update from ProgressDisplay ---
function handleLevelUpdate(newLevel) {
  console.log("Updating level to:", newLevel);
  // Update the reactive object AND save to cookie
  Object.assign(userProfile, updateUserProfile({ proficiencyLevel: newLevel }));
}

// --- Function to handle focus area update from ProgressDisplay ---
function handleFocusAreaUpdate(newFocusArea) {
  console.log("Updating focus area to:", newFocusArea);
  // Update the reactive object AND save to cookie
  Object.assign(userProfile, updateUserProfile({ focusArea: newFocusArea }));

  // Generate a new exercise with the updated focus area
  if (newFocusArea) {
    generateNewExercise();
  }
}
</script>

<style scoped>
/* Add component-specific styles here if needed */
.brand-color {
  color: #4f46e5; /* Indigo */
}

.input-error {
  border-color: #dc2626; /* Red */
}

.input-error-text {
  color: #dc2626; /* Red */
  font-size: 0.9em;
  margin-top: 5px;
}
</style>
