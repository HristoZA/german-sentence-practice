<template>
  <div>
    <h3>Topic: {{ exercise.topic }}</h3>

    <div class="instructions">
      <h4>Instructions</h4>
      <p>{{ exercise.instructions }}</p>
    </div>

    <div class="context">
      <h4>Context</h4>
      <p>{{ exercise.context }}</p>
    </div>

    <div class="key-words">
      <h4>Use these words:</h4>
      <ul>
        <li v-for="word in exercise.keyWords" :key="word">
          {{ word }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  exercise: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
/* Basic styles for ExerciseDisplay */
h3 {
  font-size: 1.1em;
  font-weight: 500;
  margin-bottom: 15px;
}

h4 {
  font-weight: 500;
  margin-bottom: 5px;
}

.instructions,
.context,
.key-words {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 4px;
}

.instructions {
  background-color: #eff6ff; /* Light blue */
  border: 1px solid #dbeafe; /* Lighter blue border */
}

.context {
  background-color: #f0fdf4; /* Light green */
  border: 1px solid #dcfce7; /* Lighter green border */
}

.key-words {
  background-color: #fffbeb; /* Light yellow */
  border: 1px solid #fef3c7; /* Lighter yellow border */
}

.key-words ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.key-words li {
  background-color: white;
  padding: 5px 10px;
  border-radius: 15px;
  border: 1px solid #fde68a; /* Yellow border */
  font-size: 0.9em;
}
</style>
