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

      <div v-if="feedback.suggestions" class="feedback-suggestions">
        <h4>Suggestion</h4>
        <p>{{ feedback.suggestions }}</p>
      </div>

      <div
        v-if="feedback.grammarNotes && feedback.grammarNotes.length > 0"
        class="feedback-grammar"
      >
        <h4>Grammar Notes:</h4>
        <ul>
          <li v-for="(note, index) in feedback.grammarNotes" :key="index">
            <p>
              <strong>{{ note.rule }}</strong>
            </p>
            <p v-if="note.example" class="example">
              <em>Example: "{{ note.example }}"</em>
            </p>
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="placeholder">Submit your answer to see feedback</div>
  </div>
</template>

<script setup>
defineProps({
  feedback: {
    type: Object,
    required: true,
  },
});
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
.feedback-suggestions,
.feedback-grammar {
  margin-bottom: 15px;
  font-size: 0.95em;
}

.feedback-suggestions {
  background-color: #eff6ff; /* Light blue */
  border: 1px solid #dbeafe;
  padding: 10px 15px;
  border-radius: 6px;
}

.feedback-grammar h4 {
  margin-bottom: 10px;
  font-weight: 500;
}

.feedback-grammar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.feedback-grammar li {
  background-color: #f3f4f6; /* Very light gray */
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.feedback-grammar .example {
  margin-top: 5px;
  color: #6b7280; /* Medium gray */
  font-size: 0.9em;
}

.placeholder {
  text-align: center;
  color: #6b7280; /* Medium gray */
  padding: 20px;
  background-color: #f9fafb;
  border-radius: 6px;
}
</style>
