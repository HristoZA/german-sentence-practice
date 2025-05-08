<template>
  <div class="practice-mode">
    <div class="card">
      <div class="card-header">
        <h2>Practice Sentence Recall</h2>
      </div>
      <div class="card-content">
        <!-- Loading Indicator -->
        <div v-if="isLoading" class="loading-indicator">
          Loading sentence...
        </div>

        <!-- Error Message -->
        <div v-else-if="error" class="error-message">
          {{ error }}
          <button
            @click="
              currentStage = 'explanation';
              error = null;
            "
            class="secondary"
          >
            Try Again
          </button>
        </div>

        <!-- Explanation Stage -->
        <div v-if="currentStage === 'explanation' && !isLoading && !error">
          <p class="instructions">
            Welcome to sentence practice! You'll be shown a sentence. Try to
            memorize it. Then, the sentence will be hidden, and you'll
            reconstruct it from memory.
          </p>
          <div class="practice-controls">
            <button @click="initiatePractice" class="primary">
              Start Practice
            </button>
          </div>
        </div>

        <!-- Showing Sentence Stage -->
        <div
          v-if="
            currentStage === 'showingSentence' &&
            generatedSentence &&
            !isLoading &&
            !error
          "
          class="sentence-display"
        >
          <p class="instructions">Memorize this sentence:</p>
          <p class="sentence-text">{{ generatedSentence }}</p>
          <div class="practice-controls">
            <button @click="startRecall" class="primary">Start Recall</button>
            <button @click="initiatePractice" class="secondary">
              New Sentence
            </button>
          </div>
        </div>

        <!-- Input Stage -->
        <div
          v-if="
            currentStage === 'input' &&
            generatedSentence &&
            !isLoading &&
            !error
          "
        >
          <p class="instructions">
            The sentence is now hidden. Try to reconstruct it below.
          </p>
          <div v-if="showVoiceInput">
            <VoiceInput
              @transcription-complete="handleVoiceTranscription"
              @cancel="showVoiceInput = false"
            />
          </div>
          <div v-else>
            <div class="input-header">
              <label for="practice-answer">Your reconstruction:</label>
              <button
                class="voice-button"
                @click="showVoiceInput = true"
                title="Record voice input"
                :disabled="isSubmitting"
              >
                <span class="microphone-icon">🎤</span>
              </button>
            </div>
            <textarea
              id="practice-answer"
              v-model="userAttempt"
              rows="3"
              placeholder="Type or speak the sentence..."
              :disabled="isSubmitting"
              :class="{ 'input-error': inputError }"
              @input="inputError = null"
            ></textarea>
            <p v-if="inputError" class="input-error-text">{{ inputError }}</p>
          </div>
          <div class="practice-controls card-footer">
            <button
              @click="submitAttempt"
              class="primary"
              :disabled="isSubmitting || !userAttempt.trim()"
            >
              <span v-if="isSubmitting">Submitting...</span>
              <span v-else>Submit</span>
            </button>
            <button
              @click="initiatePractice"
              class="secondary"
              :disabled="isSubmitting"
            >
              New Sentence
            </button>
          </div>
        </div>

        <!-- Feedback Stage (now inside the main card) -->
        <div
          v-if="
            currentStage === 'feedback' &&
            feedback.message &&
            !isLoading &&
            !error
          "
        >
          <h3 class="feedback-header">Feedback</h3>
          <div
            :class="[
              'feedback-message',
              feedback.isCorrect ? 'correct' : 'incorrect',
            ]"
            v-html="renderMarkdown(feedback.message)"
          ></div>
          <p v-if="feedback.score !== null" class="feedback-score">
            Score: {{ feedback.score }}%
          </p>
          <div class="practice-controls card-footer">
            <button @click="retryCurrentSentence" class="secondary">
              Try Again
            </button>
            <button @click="initiatePractice" class="primary">
              Practice New Sentence
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, onMounted } from "vue"; // Removed watch
import VoiceInput from "./VoiceInput.vue";
import { fetchPracticeSentence, gradePracticeAttempt } from "../utils/llm.js";
import { marked } from "marked";

const userProfile = inject("userProfile");

const currentStage = ref("explanation"); // Stages: 'explanation', 'showingSentence', 'input', 'feedback'
const generatedSentence = ref("");
const userAttempt = ref("");
const feedback = reactive({
  message: "",
  isCorrect: false,
  score: null,
});
const isLoading = ref(false);
// const isStarted = ref(false); // Replaced by currentStage
const isSubmitting = ref(false);
const error = ref(null);
const inputError = ref(null);
const showVoiceInput = ref(false);

function resetState() {
  generatedSentence.value = "";
  userAttempt.value = "";
  feedback.message = "";
  feedback.isCorrect = false;
  feedback.score = null;
  error.value = null;
  inputError.value = null;
  showVoiceInput.value = false;
  isLoading.value = false;
  isSubmitting.value = false;
}

function retryCurrentSentence() {
  // Keep the current sentence but clear the user's previous attempt
  userAttempt.value = "";
  feedback.message = "";
  feedback.isCorrect = false;
  feedback.score = null;
  inputError.value = null;
  showVoiceInput.value = false;
  // Go back to input stage
  currentStage.value = "input";
}

async function initiatePractice() {
  resetState();
  isLoading.value = true;
  try {
    // We're still checking userProfile here, but it's managed by the SettingsPanel at the top level
    const sentenceData = await fetchPracticeSentence(userProfile);
    generatedSentence.value = sentenceData.sentence;
    currentStage.value = "showingSentence";
  } catch (err) {
    console.error("Error fetching practice sentence:", err);
    error.value =
      err.message || "Failed to load a new sentence. Please try again.";
    currentStage.value = "explanation"; // Go back to explanation on error
  } finally {
    isLoading.value = false;
  }
}

function startRecall() {
  currentStage.value = "input";
  userAttempt.value = ""; // Clear previous attempt if any
  inputError.value = null;
}

async function submitAttempt() {
  if (!userAttempt.value.trim()) {
    inputError.value = "Please enter your attempt.";
    return;
  }
  inputError.value = null;
  isSubmitting.value = true;
  error.value = null; // Clear previous general errors

  try {
    const result = await gradePracticeAttempt(
      generatedSentence.value,
      userAttempt.value
    );
    feedback.message = result.feedback;
    feedback.isCorrect = result.isCorrect;
    feedback.score = result.score;
    currentStage.value = "feedback";
  } catch (err) {
    console.error("Error submitting attempt:", err);
    error.value =
      err.message || "Failed to grade your attempt. Please try again.";
    currentStage.value = "input"; // Allow user to retry or get new sentence
  } finally {
    isSubmitting.value = false;
  }
}

function handleVoiceTranscription(transcription) {
  userAttempt.value = transcription;
  showVoiceInput.value = false;
}

function renderMarkdown(text) {
  if (!text) return "";
  try {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    return marked.parse(text);
  } catch (e) {
    console.error("Error rendering markdown", e);
    return text;
  }
}

// Removed onMounted and watch for automatic sentence fetching.
// Practice starts explicitly with the 'Start Practice' button.
</script>

<style scoped>
.practice-mode .card {
  margin-bottom: 20px;
}

.sentence-display {
  text-align: center;
  margin-bottom: 20px;
}

.sentence-text {
  font-size: 1.3em;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
  border: 1px solid #eee;
}

.instructions {
  text-align: center;
  margin-bottom: 15px;
  font-style: italic;
  color: #555;
  padding: 10px;
}

.input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.voice-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
}

.microphone-icon {
  color: #4f46e5; /* Indigo */
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-family: inherit;
  font-size: 1em;
  box-sizing: border-box; /* Ensures padding doesn't expand width */
}

.input-error {
  border-color: #dc2626; /* Red */
}

.input-error-text {
  color: #dc2626; /* Red */
  font-size: 0.9em;
  margin-top: 5px;
  text-align: left;
}

.practice-controls {
  display: flex;
  justify-content: center; /* Center buttons by default */
  gap: 10px; /* Add space between buttons */
  padding-top: 10px;
  margin-top: 10px;
}

.practice-controls.card-footer {
  border-top: 1px solid #e5e7eb; /* Add a separator if it's in a footer context */
}

.feedback-message {
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
  text-align: left;
}
.feedback-message.correct {
  background-color: #e6fffa;
  border: 1px solid #38a169;
  color: #2f855a;
}
.feedback-message.incorrect {
  background-color: #fff5f5;
  border: 1px solid #e53e3e;
  color: #c53030;
}

.loading-indicator,
.placeholder {
  text-align: center;
  padding: 20px;
  font-size: 1.1em;
}

.error-message {
  text-align: center;
  padding: 15px;
  font-size: 1.1em;
  color: #dc2626;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 5px;
  margin-bottom: 10px;
}
.error-message button {
  margin-top: 10px;
}

.feedback-header {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 600;
  font-size: 1.2em;
  color: #374151;
  border-top: 1px solid #e5e7eb;
  padding-top: 15px;
}

.feedback-score {
  margin-top: 8px;
  font-weight: 500;
}
</style>
