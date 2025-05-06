<template>
  <div>
    <div v-if="feedback.isCorrect !== null">
      <div
        class="feedback-header"
        :class="{
          correct: feedback.isCorrect,
          incorrect: !feedback.isCorrect,
        }"
      >
        <span>
          {{ feedback.isCorrect ? "Correct!" : "Needs Improvement" }}
        </span>
        <span v-if="feedback.score !== null" class="score">
          Score: {{ (feedback.score * 100).toFixed(0) }}%
        </span>
      </div>

      <!-- Render feedback with markdown -->
      <div v-if="feedback.feedback" class="feedback-general">
        <div
          v-html="renderMarkdown(feedback.feedback)"
          class="markdown-content"
        ></div>
      </div>

      <!-- Render review with markdown -->
      <div v-if="feedback.review" class="feedback-review">
        <h4>Review</h4>
        <div class="review-content">
          <div
            v-html="renderMarkdown(feedback.review)"
            class="markdown-content"
          ></div>
        </div>
      </div>

      <!-- Add the QuestionMode component if we have an exercise and answer -->
      <QuestionMode
        v-if="exercise && userAnswer"
        :exercise="exercise"
        :user-answer="userAnswer"
        :feedback="feedback"
        :previous-questions="qaHistory"
        @question-submitted="handleQuestionSubmitted"
      />
    </div>

    <div v-else class="placeholder">Submit your answer to see feedback</div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from "vue";
import QuestionMode from "./QuestionMode.vue";
import { askQuestionAboutFeedback } from "../utils/llm.js";
import { marked } from "marked"; // Import the marked library

const props = defineProps({
  feedback: {
    type: Object,
    required: true,
  },
  exercise: {
    type: Object,
    default: null,
  },
  userAnswer: {
    type: String,
    default: "",
  },
  qaHistory: {
    type: Array,
    required: true,
  },
});

// Define the emits
const emit = defineEmits(["update:qaHistory"]);

// Function to safely render Markdown
function renderMarkdown(text) {
  if (!text) return "";
  try {
    // Set options for security and rendering
    marked.setOptions({
      breaks: true, // Convert \n to <br>
      gfm: true, // GitHub Flavored Markdown
      sanitize: false, // We will sanitize manually if needed
    });
    return marked.parse(text);
  } catch (error) {
    console.error("Error rendering Markdown:", error);
    return text; // Return original text if there's an error
  }
}

// Handle when a question is submitted via the QuestionMode component
async function handleQuestionSubmitted(question) {
  try {
    // Create a temporary history to emit
    const currentHistory = [...props.qaHistory];

    // First add the question with a loading placeholder
    const questionEntry = {
      question,
      answer: "Loading...",
      timestamp: new Date(),
    };
    currentHistory.push(questionEntry);
    emit("update:qaHistory", currentHistory); // Emit update

    // Store the index of the current question
    const questionIndex = currentHistory.length - 1;

    // Send the question to the backend
    const response = await askQuestionAboutFeedback(
      props.exercise,
      props.userAnswer,
      props.feedback,
      question
    );

    // Update the answer once received - create a new array for reactivity
    const updatedHistory = [...currentHistory];
    updatedHistory[questionIndex] = {
      ...updatedHistory[questionIndex],
      answer: response.answer,
    };
    emit("update:qaHistory", updatedHistory); // Emit final update
  } catch (error) {
    console.error("Error handling question:", error);
    // Update the placeholder with an error message - create a new array for reactivity
    const currentHistory = [...props.qaHistory];
    const questionIndex = currentHistory.length - 1;
    if (
      questionIndex >= 0 &&
      currentHistory[questionIndex].answer === "Loading..."
    ) {
      const updatedHistory = [...currentHistory];
      updatedHistory[questionIndex] = {
        ...updatedHistory[questionIndex],
        answer: "Failed to get an answer. Please try again.",
      };
      emit("update:qaHistory", updatedHistory); // Emit error update
    }
  }
}
</script>

<style scoped>
/* Basic styles for FeedbackDisplay */
.feedback-header {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.feedback-header.correct {
  background-color: #dcfce7; /* Light green */
  color: #166534; /* Dark green */
  border: 1px solid #bbf7d0;
}

.feedback-header.incorrect {
  background-color: #fee2e2; /* Light red */
  color: #991b1b; /* Dark red */
  border: 1px solid #fecaca;
}

.score {
  font-size: 0.9em;
  padding: 3px 8px;
  border-radius: 4px;
}

.feedback-header.correct .score {
  background-color: #bbf7d0;
}

.feedback-header.incorrect .score {
  background-color: #fecaca;
}

.feedback-general,
.feedback-review {
  margin-bottom: 15px;
  font-size: 0.95em;
}

.feedback-review {
  background-color: #f8fafc; /* Very light blue/gray */
  border: 1px solid #e2e8f0;
  padding: 10px 15px;
  border-radius: 6px;
}

.feedback-review h4 {
  margin-bottom: 10px;
  font-weight: 500;
}

.review-content {
  white-space: pre-line; /* Preserves line breaks in the review text */
}

.placeholder {
  text-align: center;
  color: #6b7280; /* Medium gray */
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 6px;
}

/* Markdown content styling */
:deep(.markdown-content) {
  /* Deep selector to target elements inside v-html */
  line-height: 1.6;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3),
:deep(.markdown-content h4),
:deep(.markdown-content h5),
:deep(.markdown-content h6) {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.markdown-content p) {
  margin-bottom: 0.75em;
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  padding-left: 1.5em;
  margin-bottom: 1em;
}

:deep(.markdown-content li) {
  margin-bottom: 0.25em;
}

:deep(.markdown-content code) {
  background-color: #f3f4f6;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

:deep(.markdown-content pre) {
  background-color: #f3f4f6;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 1em;
}

:deep(.markdown-content blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1em;
  margin-left: 0;
  margin-right: 0;
  font-style: italic;
}

:deep(.markdown-content table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

:deep(.markdown-content th),
:deep(.markdown-content td) {
  border: 1px solid #e5e7eb;
  padding: 0.5em;
  text-align: left;
}
</style>
