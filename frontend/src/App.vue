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

        <!-- Exercise history context -->
        <div
          v-if="
            currentExerciseRecord && currentExerciseRecord.attempts.length > 0
          "
          class="card-footer"
        >
          <div class="history-context">
            <span
              >Previous attempts:
              {{ currentExerciseRecord.attempts.length }}</span
            >
            <button
              class="text-button"
              @click="showExerciseHistory = !showExerciseHistory"
            >
              {{ showExerciseHistory ? "Hide History" : "Show History" }}
            </button>
          </div>

          <!-- History accordion -->
          <div v-if="showExerciseHistory" class="history-accordion">
            <div
              v-for="(attempt, index) in currentExerciseRecord.attempts"
              :key="index"
              class="history-item"
            >
              <div class="history-header">
                <span
                  >Attempt #{{ index + 1 }} -
                  {{ formatDate(attempt.timestamp) }}</span
                >
                <span
                  :class="{
                    correct: attempt.feedback.isCorrect,
                    incorrect: !attempt.feedback.isCorrect,
                  }"
                >
                  {{ attempt.feedback.isCorrect ? "✓ Correct" : "✗ Incorrect" }}
                </span>
              </div>
              <div class="history-content">
                <p><strong>Your answer:</strong> {{ attempt.userAnswer }}</p>
                <p>
                  <strong>Feedback:</strong> {{ attempt.feedback.feedback }}
                </p>
                <div v-if="attempt.feedback.review">
                  <p>
                    <strong>Review:</strong>
                    {{ attempt.feedback.review }}
                  </p>
                </div>

                <!-- Display Q&A History for this attempt -->
                <div
                  v-if="attempt.qaHistory && attempt.qaHistory.length > 0"
                  class="qa-history-section"
                >
                  <h4>Questions about this attempt:</h4>
                  <ul class="qa-list">
                    <li
                      v-for="(qa, qaIndex) in attempt.qaHistory"
                      :key="qaIndex"
                      class="qa-item"
                    >
                      <p class="qa-question">
                        <strong>Q:</strong> {{ qa.question }}
                      </p>
                      <p class="qa-answer">
                        <strong>A:</strong> {{ qa.answer }}
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
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
          <FeedbackDisplay
            v-else
            :feedback="feedback"
            :exercise="currentExercise"
            :user-answer="userAnswer"
            :qa-history="currentAttemptQaHistory"
            @update:qa-history="handleQaHistoryUpdate"
          />
        </div>
      </div>

      <!-- Exercise History Section -->
      <div class="card">
        <div class="card-header">
          <h2>Exercise History</h2>
          <div class="tab-controls">
            <button
              @click="activeHistoryTab = 'recent'"
              :class="{ active: activeHistoryTab === 'recent' }"
            >
              Recent
            </button>
            <button
              @click="activeHistoryTab = 'incomplete'"
              :class="{ active: activeHistoryTab === 'incomplete' }"
            >
              Incomplete
            </button>
          </div>
        </div>
        <div class="card-content">
          <div v-if="activeHistoryTab === 'recent'">
            <div v-if="recentExercises.length === 0" class="placeholder">
              No exercise history yet.
            </div>
            <div v-else class="exercise-history-list">
              <div
                v-for="record in recentExercises"
                :key="record.exercise.exerciseId"
                class="history-exercise-item"
                @click="loadHistoricalExercise(record.exercise)"
              >
                <div class="history-exercise-header">
                  <span>{{ record.exercise.topic }}</span>
                  <span
                    :class="{
                      correct: record.isComplete,
                      incomplete: !record.isComplete,
                    }"
                  >
                    {{ record.isComplete ? "Completed" : "Incomplete" }}
                  </span>
                </div>
                <div class="history-exercise-details">
                  <span
                    >{{ record.exercise.proficiencyLevel }} |
                    {{ record.exercise.problemArea }}</span
                  >
                  <span>Attempts: {{ record.attempts.length }}</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="activeHistoryTab === 'incomplete'">
            <div v-if="incompleteExercises.length === 0" class="placeholder">
              No incomplete exercises!
            </div>
            <div v-else class="exercise-history-list">
              <div
                v-for="record in incompleteExercises"
                :key="record.exercise.exerciseId"
                class="history-exercise-item"
                @click="loadHistoricalExercise(record.exercise)"
              >
                <div class="history-exercise-header">
                  <span>{{ record.exercise.topic }}</span>
                  <span class="attempts">
                    {{ record.attempts.length }} attempt(s)
                  </span>
                </div>
                <div class="history-exercise-details">
                  <span
                    >{{ record.exercise.proficiencyLevel }} |
                    {{ record.exercise.problemArea }}</span
                  >
                  <span>{{ formatDate(record.lastAttemptDate) }}</span>
                </div>
              </div>
            </div>
          </div>
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
import { ref, reactive, onMounted, computed, watch } from "vue";
import ExerciseDisplay from "./components/ExerciseDisplay.vue";
import FeedbackDisplay from "./components/FeedbackDisplay.vue";
import ProgressDisplay from "./components/ProgressDisplay.vue";
import { fetchExercise, gradeSentence } from "./utils/llm.js";
import {
  loadUserProfile,
  saveUserProfile,
  updateUserProfile,
} from "./utils/userProfile.js";
import {
  loadExerciseHistory,
  addExerciseToHistory,
  recordExerciseAttempt,
  updateAttemptQaHistory, // Import the new function
  getExerciseAttempts,
  getRecentExercises,
  getIncompleteExercises,
} from "./utils/exerciseHistory.js";

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
  review: "",
});
const isLoadingExercise = ref(false);
const isGrading = ref(false);
const error = ref(null);
const inputError = ref(null);
const currentAttemptQaHistory = ref([]); // Q&A history for current attempt
const currentAttemptTimestamp = ref(null); // Timestamp of the current attempt

// --- Exercise History State ---
const recentExercises = ref([]);
const incompleteExercises = ref([]);
const currentExerciseRecord = ref(null);
const activeHistoryTab = ref("recent");
const showExerciseHistory = ref(false);

// --- Computed property for input validation ---
const isInputValid = computed(() => {
  const answer = userAnswer.value.trim();
  if (!answer) return false; // Cannot be empty
  // Basic check: at least 2 words or 5 characters
  return answer.split(" ").length >= 2 || answer.length >= 5;
});

// --- Watch for exercise changes to update history record ---
watch(
  () => currentExercise.exerciseId,
  (newId) => {
    if (newId) {
      const history = loadExerciseHistory();
      currentExerciseRecord.value = history[newId] || null;
    } else {
      currentExerciseRecord.value = null;
    }
    // Reset Q&A history when exercise changes
    currentAttemptQaHistory.value = [];
    currentAttemptTimestamp.value = null;
  },
  { immediate: true }
);

// --- Load history data on mount ---
onMounted(() => {
  loadExerciseHistoryData();
  // Generate a new exercise if we don't have one
  if (!currentExercise.exerciseId) {
    generateNewExercise();
  }
});

// --- Functions ---
function loadExerciseHistoryData() {
  recentExercises.value = getRecentExercises();
  incompleteExercises.value = getIncompleteExercises();
}

function formatDate(date) {
  // Format date as "MMM D, YYYY h:mm a" (e.g., "May 5, 2025 3:30 PM")
  if (!date) return "";
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function generateNewExercise() {
  // --- Reset feedback state ---
  Object.assign(feedback, {
    isCorrect: null,
    score: null,
    feedback: "",
    review: "",
  });
  currentAttemptQaHistory.value = []; // Reset Q&A history
  currentAttemptTimestamp.value = null; // Reset timestamp

  isLoadingExercise.value = true;
  error.value = null;
  inputError.value = null;
  userAnswer.value = "";
  showExerciseHistory.value = false;

  try {
    const newExercise = await fetchExercise(userProfile);
    Object.assign(currentExercise, newExercise);

    // Add to exercise history
    const record = addExerciseToHistory(newExercise);
    currentExerciseRecord.value = record;

    // Update history lists
    loadExerciseHistoryData();
  } catch (err) {
    console.error("Error fetching exercise:", err);
    error.value =
      err.message || "Failed to load a new exercise. Please try again.";
  } finally {
    isLoadingExercise.value = false;
  }
}

function loadHistoricalExercise(exercise) {
  // Load an exercise from history
  Object.assign(currentExercise, exercise);

  // Reset input state
  userAnswer.value = "";
  Object.assign(feedback, {
    isCorrect: null,
    score: null,
    feedback: "",
    review: "",
  });
  currentAttemptQaHistory.value = []; // Reset Q&A history
  currentAttemptTimestamp.value = null; // Reset timestamp

  // Get the history record for this exercise
  const history = loadExerciseHistory();
  currentExerciseRecord.value = history[exercise.exerciseId] || null;

  // Show the history by default when loading a historical exercise
  showExerciseHistory.value = true;
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
  // Reset Q&A history for new attempt
  currentAttemptQaHistory.value = [];
  currentAttemptTimestamp.value = null; // Clear timestamp before making a new attempt

  try {
    const gradingResult = await gradeSentence(currentExercise, answer);

    // Record the attempt in history without Q&A initially
    const recordedAttempt = recordExerciseAttempt(
      currentExercise.exerciseId,
      answer,
      gradingResult
    );

    // Store the timestamp of the attempt we just recorded
    currentAttemptTimestamp.value = recordedAttempt.timestamp;
    console.log(
      "Recorded attempt with timestamp:",
      currentAttemptTimestamp.value
    );

    // Update the feedback state
    Object.assign(feedback, gradingResult);

    // Reload the current exercise record
    const history = loadExerciseHistory();
    currentExerciseRecord.value = history[currentExercise.exerciseId] || null;

    // Update history lists
    loadExerciseHistoryData();

    // --- Update User Profile based on performance ---
    // Only count this as a new exercise if it's the first attempt
    const attemptsCount = currentExerciseRecord.value?.attempts.length || 0;
    const isFirstAttempt = attemptsCount === 1;

    if (isFirstAttempt) {
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
    }
  } catch (err) {
    console.error("Error grading sentence:", err);
    error.value =
      err.message || "Failed to grade the sentence. Please try again.";
    // Reset feedback fully on error
    Object.assign(feedback, {
      isCorrect: null,
      score: null,
      feedback: "",
      review: "",
    });
    currentAttemptTimestamp.value = null; // Reset timestamp on error
  } finally {
    isGrading.value = false;
  }
}

// Function to handle updates from FeedbackDisplay
function handleQaHistoryUpdate(newHistory) {
  currentAttemptQaHistory.value = newHistory;

  // If we have a timestamp for the current attempt, update its Q&A history
  if (currentAttemptTimestamp.value && currentExercise.exerciseId) {
    console.log("Updating Q&A for attempt at:", currentAttemptTimestamp.value);
    updateAttemptQaHistory(
      currentExercise.exerciseId,
      currentAttemptTimestamp.value,
      newHistory
    );

    // Reload the current exercise record to reflect the Q&A updates immediately
    const history = loadExerciseHistory();
    currentExerciseRecord.value = history[currentExercise.exerciseId] || null;
  } else {
    console.warn("Cannot update Q&A history: Missing exerciseId or timestamp");
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

/* Exercise History styling */
.tab-controls {
  display: flex;
  gap: 8px;
}

.tab-controls button {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
}

.tab-controls button.active {
  font-weight: bold;
  border-bottom: 2px solid #4f46e5;
}

.exercise-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-exercise-item {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-exercise-item:hover {
  background-color: #f9fafb;
}

.history-exercise-header {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 4px;
}

.history-exercise-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: #6b7280;
}

.correct {
  color: #16a34a; /* Green */
}

.incorrect,
.incomplete {
  color: #dc2626; /* Red */
}

.attempts {
  color: #6b7280; /* Gray */
}

/* Attempt history styling */
.card-footer {
  padding: 8px 16px;
  border-top: 1px solid #e5e7eb;
}

.history-context {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text-button {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  text-decoration: underline;
}

.history-accordion {
  margin-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.history-item {
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.history-header {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
}

.history-content {
  margin-top: 4px;
  padding: 4px 0;
  font-size: 0.9em;
}

/* Styles for Q&A History within attempts */
.qa-history-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e5e7eb; /* Separator */
}

.qa-history-section h4 {
  font-size: 0.9em;
  font-weight: 500;
  color: #4b5563; /* Gray-600 */
  margin-bottom: 5px;
}

.qa-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.qa-item {
  margin-bottom: 8px;
  font-size: 0.85em;
}

.qa-question {
  margin-bottom: 2px;
  color: #374151; /* Gray-700 */
}

.qa-answer {
  margin-bottom: 0;
  color: #1f2937; /* Gray-800 */
  white-space: pre-wrap; /* Preserve line breaks in answers */
}
</style>
