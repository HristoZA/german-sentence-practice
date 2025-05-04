<template>
  <div>
    <div class="level-selector">
      <label for="level-select">Proficiency Level</label>
      <select id="level-select" v-model="selectedLevel">
        <option v-for="level in proficiencyLevels" :key="level" :value="level">
          {{ level }}
        </option>
      </select>
      <p class="level-description">Choose your CEFR language level (A1-C2)</p>
    </div>

    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-label">Completed</div>
        <div class="stat-value">{{ userProfile.exercisesCompleted }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Correct</div>
        <div class="stat-value">{{ userProfile.correctAnswers }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">Accuracy</div>
        <div class="stat-value accuracy" :class="accuracyClass">
          {{ accuracy }}%
        </div>
      </div>
    </div>

    <div class="problem-areas">
      <h3>Problem Areas</h3>
      <div v-if="userProfile.problemAreas.length > 0" class="tags">
        <span v-for="area in userProfile.problemAreas" :key="area" class="tag">
          {{ area }}
        </span>
      </div>
      <div v-else class="placeholder">No problem areas identified yet.</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  userProfile: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:level"]);

const proficiencyLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

const selectedLevel = computed({
  get: () => props.userProfile.proficiencyLevel,
  set: (value) => {
    emit("update:level", value);
  },
});

// Calculate accuracy percentage
const accuracy = computed(() => {
  if (props.userProfile.exercisesCompleted === 0) return 0;
  return Math.round(
    (props.userProfile.correctAnswers / props.userProfile.exercisesCompleted) *
      100
  );
});

const accuracyClass = computed(() => {
  if (props.userProfile.exercisesCompleted === 0) return "default";
  if (accuracy.value >= 70) return "high";
  if (accuracy.value >= 40) return "medium";
  return "low";
});
</script>

<style scoped>
/* Basic styles for ProgressDisplay */
.level-selector {
  margin-bottom: 20px;
}

.level-description {
  font-size: 0.85em;
  color: #6b7280; /* Medium gray */
  margin-top: 5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background-color: #f9fafb; /* Light gray */
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-label {
  font-size: 0.9em;
  color: #6b7280; /* Medium gray */
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.5em;
  font-weight: 600;
}

.stat-value.accuracy.high {
  color: #16a34a; /* Green */
}
.stat-value.accuracy.medium {
  color: #d97706; /* Amber */
}
.stat-value.accuracy.low {
  color: #dc2626; /* Red */
}
.stat-value.accuracy.default {
  color: #374151; /* Dark gray */
}

.problem-areas h3 {
  font-size: 1em;
  font-weight: 500;
  margin-bottom: 10px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  background-color: #e5e7eb; /* Lighter gray */
  color: #374151; /* Darker gray */
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8em;
}

.placeholder {
  font-size: 0.9em;
  color: #6b7280; /* Medium gray */
  background-color: #f9fafb;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
}
</style>
