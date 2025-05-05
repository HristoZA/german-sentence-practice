<template>
  <div class="question-mode">
    <div v-if="!showAnswerArea" class="question-prompt">
      <button @click="showAnswerArea = true" class="ask-question-button">
        <span>Ask a question about this feedback</span>
        <span class="icon">❓</span>
      </button>
    </div>

    <div v-else class="question-area">
      <h4>Ask about the grammar or feedback</h4>

      <div v-if="previousQuestions.length > 0" class="previous-questions">
        <div
          v-for="(qa, index) in previousQuestions"
          :key="index"
          class="qa-item"
        >
          <div class="question">
            <span class="q-label">Q:</span>
            <span>{{ qa.question }}</span>
          </div>
          <div class="answer">
            <span class="a-label">A:</span>
            <div class="answer-content">{{ qa.answer }}</div>
          </div>
        </div>
      </div>

      <div class="question-input-area">
        <textarea
          v-model="questionText"
          rows="2"
          placeholder="Ask a question about the grammar, word choice, or feedback..."
          :disabled="isLoading"
        ></textarea>

        <div class="question-actions">
          <button
            @click="submitQuestion"
            class="submit-question"
            :disabled="isLoading || !questionText.trim()"
          >
            {{ isLoading ? "Asking..." : "Ask" }}
          </button>
          <button
            @click="showAnswerArea = false"
            class="cancel"
            :disabled="isLoading"
          >
            Close
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="loading-indicator">
        Thinking about your question...
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";

const props = defineProps({
  exercise: {
    type: Object,
    required: true,
  },
  userAnswer: {
    type: String,
    required: true,
  },
  feedback: {
    type: Object,
    required: true,
  },
  previousQuestions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["question-submitted"]);

const questionText = ref("");
const showAnswerArea = ref(false);
const isLoading = ref(false);
const error = ref(null);

async function submitQuestion() {
  if (!questionText.value.trim()) return;

  error.value = null;
  isLoading.value = true;

  try {
    emit("question-submitted", questionText.value);
    questionText.value = ""; // Clear the input after submission
  } catch (err) {
    error.value = "Failed to process your question. Please try again.";
    console.error("Error in question mode:", err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.question-mode {
  margin-top: 16px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.question-prompt {
  display: flex;
  justify-content: center;
}

.ask-question-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 0.9em;
  cursor: pointer;
  transition: background-color 0.2s;
}

.ask-question-button:hover {
  background-color: #e5e7eb;
}

.icon {
  font-size: 1.1em;
}

.question-area {
  margin-top: 8px;
}

.question-area h4 {
  margin-bottom: 10px;
  font-weight: 500;
  color: #374151;
}

.question-input-area {
  margin-top: 10px;
}

.question-input-area textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin-bottom: 8px;
  font-family: inherit;
  resize: vertical;
}

.question-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.submit-question,
.cancel {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
}

.submit-question {
  background-color: #4f46e5;
  color: white;
  border: none;
}

.submit-question:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.cancel {
  background-color: transparent;
  border: 1px solid #e5e7eb;
}

.loading-indicator {
  margin-top: 10px;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.error-message {
  margin-top: 10px;
  padding: 8px;
  background-color: #fee2e2;
  color: #991b1b;
  border-radius: 4px;
  font-size: 0.9em;
}

.previous-questions {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qa-item {
  background-color: #f3f4f6;
  border-radius: 6px;
  padding: 10px;
}

.question,
.answer {
  display: flex;
  gap: 8px;
}

.answer {
  margin-top: 6px;
}

.q-label,
.a-label {
  font-weight: bold;
  color: #4f46e5;
  min-width: 20px;
}

.answer-content {
  flex: 1;
  white-space: pre-line;
}
</style>
