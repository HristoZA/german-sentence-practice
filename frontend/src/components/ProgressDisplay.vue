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

    <div class="problem-area-selector">
      <label for="category-select">Select Category</label>
      <select id="category-select" v-model="selectedCategory">
        <option value="All">All</option>
        <option
          v-for="category in grammarCategories"
          :key="category.name"
          :value="category.name"
        >
          {{ category.name }}
        </option>
      </select>

      <label for="topic-select">Select Problem Area</label>
      <select id="topic-select" v-model="selectedProblemArea">
        <option
          v-for="topic in filteredTopics"
          :key="topic.name"
          :value="topic.name"
        >
          {{ topic.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  userProfile: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:level", "update:focusArea"]);

const proficiencyLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Organized grammar topics from German.net
const grammarCategories = [
  {
    name: "Tenses & Moods",
    topics: [
      "Present Tense",
      "Simple Past",
      "Present Perfect",
      "Past Perfect",
      "Future Tense",
      "Future Perfect",
      "Subjunctive I",
      "Subjunctive II",
      "Imperative",
      "Infinitive",
    ],
  },
  {
    name: "Verbs",
    topics: [
      "Regular Verbs",
      "Irregular Verbs",
      "Modal Verbs",
      "Reflexive Verbs",
      "Separable Verbs",
      "Verb Conjugation",
      "Perfect with sein",
      "Perfect with haben",
      "Verbs with Prepositions",
    ],
  },
  {
    name: "Cases & Declension",
    topics: [
      "Nominative Case",
      "Accusative Case",
      "Dative Case",
      "Genitive Case",
    ],
  },
  {
    name: "Nouns & Articles",
    topics: [
      "Noun Gender",
      "Plural Forms",
      "Definite Articles",
      "Indefinite Articles",
    ],
  },
  {
    name: "Pronouns",
    topics: [
      "Personal Pronouns",
      "Possessive Pronouns",
      "Reflexive Pronouns",
      "Relative Pronouns",
      "Demonstrative Pronouns",
      "Interrogative Pronouns",
    ],
  },
  {
    name: "Adjectives",
    topics: ["Adjective Declension", "Comparative Forms", "Superlative Forms"],
  },
  {
    name: "Prepositions",
    topics: [
      "Accusative Prepositions",
      "Dative Prepositions",
      "Genitive Prepositions",
      "Two-way Prepositions",
    ],
  },
  {
    name: "Sentence Structure",
    topics: [
      "Word Order",
      "Negation",
      "Question Formation",
      "Relative Clauses",
      "Subordinate Clauses",
      "Conjunctions",
      "Passive Voice",
    ],
  },
];

// Flatten categories into a single array of topics for the selector
const allGrammarTopics = grammarCategories.flatMap((category) =>
  category.topics.map((topic) => ({
    category: category.name,
    name: topic,
  }))
);

const selectedLevel = computed({
  get: () => props.userProfile.proficiencyLevel,
  set: (value) => {
    emit("update:level", value);
  },
});

const selectedCategory = ref("All");
const filteredTopics = computed(() => {
  if (selectedCategory.value === "All") {
    return allGrammarTopics;
  } else {
    return allGrammarTopics.filter(
      (topic) => topic.category === selectedCategory.value
    );
  }
});

const selectedProblemArea = computed({
  get: () => props.userProfile.focusArea || "",
  set: (value) => {
    emit("update:focusArea", value);
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
.level-selector,
.problem-area-selector {
  margin-bottom: 20px;
}

.level-description {
  font-size: 0.85em;
  color: #6b7280; /* Medium gray */
  margin-top: 5px;
}

/* Styling for selects and labels */
label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

select {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 12px;
}

.problem-area-selector {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
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
