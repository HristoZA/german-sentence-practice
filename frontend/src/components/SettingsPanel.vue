<template>
  <div class="settings-panel">
    <div class="level-selector">
      <label for="level-select">Proficiency Level</label>
      <select id="level-select" v-model="selectedLevel">
        <option v-for="level in proficiencyLevels" :key="level" :value="level">
          {{ level }}
        </option>
      </select>
      <p class="level-description">Choose your CEFR language level (A1-C2)</p>
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
</script>

<style scoped>
.settings-panel {
  width: 100%;
}

.level-selector,
.problem-area-selector {
  margin-bottom: 15px;
}

.level-description {
  font-size: 0.85em;
  color: #6b7280;
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
  background-color: white;
}

.problem-area-selector {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}
</style>
