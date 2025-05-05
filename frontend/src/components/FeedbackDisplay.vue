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

      <div v-if="feedback.feedback" class="feedback-general">
        {{ feedback.feedback }}
      </div>

      <div v-if="feedback.review" class="feedback-review">
        <h4>Review</h4>
        <div class="review-content">
          {{ feedback.review }}
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
import { ref, defineProps, defineEmits } from "vue"; // Import defineEmits
import QuestionMode from "./QuestionMode.vue";
import { askQuestionAboutFeedback } from "../utils/llm.js";

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
  // Accept qaHistory as a prop
  qaHistory: {
    type: Array,
    required: true,
  },
});

// Define the emits
const emit = defineEmits(["update:qaHistory"]);

// Remove internal qaHistory ref
// const qaHistory = ref([]);

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
</style>
