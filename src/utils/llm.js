// src/utils/llm.js

// --- Configuration ---
const LLM_MODEL = 'gpt-4o-mini'; // As per requirements
const API_ENDPOINT = '/api/llm'; // Placeholder for backend endpoint

// --- Mock Data (for frontend development without a backend) ---
const MOCK_EXERCISES = [
  {
    exerciseId: 'mock-001',
    problemArea: 'word-order',
    proficiencyLevel: 'A1',
    topic: 'Food',
    keyWords: ['essen', 'gern'],
    instructions: 'Create a sentence about food you like using the provided words.',
    context: 'You are expressing your preference for a certain food.'
  },
  {
    exerciseId: 'mock-002',
    problemArea: 'verb-conjugation',
    proficiencyLevel: 'A2',
    topic: 'Travel',
    keyWords: ['fahren', 'Zug'],
    instructions: 'Create a sentence about traveling by train using the provided words.',
    context: 'You are describing a mode of transport for a journey.'
  }
];

const MOCK_GRADING = {
  "ex-001": {
    isCorrect: true,
    score: 0.9,
    feedback: 'Gut gemacht! Word order is correct.',
    suggestions: 'You could add what food you like, e.g., "Ich esse gern Pizza".',
    grammarNotes: [
      { rule: "In simple statements, the conjugated verb is usually the second element.", example: "Ich esse gern." },
      { rule: "Adverbs like 'gern' often follow the verb.", example: "Er spielt gern Fußball." }
    ]
  },
  "mock-001": { // Mock grading for the first mock exercise
    isCorrect: true,
    score: 0.9,
    feedback: 'Gut gemacht! Word order is correct.',
    suggestions: 'You could add what food you like, e.g., "Ich esse gern Pizza".',
    grammarNotes: [
      { rule: "In simple statements, the conjugated verb is usually the second element.", example: "Ich esse gern." },
      { rule: "Adverbs like 'gern' often follow the verb.", example: "Er spielt gern Fußball." }
    ]
  },
   "mock-002": { // Mock grading for the second mock exercise
    isCorrect: false,
    score: 0.4,
    feedback: 'Check the verb conjugation and word order.',
    suggestions: 'Remember how "fahren" conjugates for "ich" or "er/sie/es".',
    grammarNotes: [
      { rule: "The verb 'fahren' is irregular in the present tense (er/sie/es fährt).", example: "Er fährt mit dem Zug." }
    ]
  }
};

// --- API Functions ---

/**
 * Fetches a new exercise from the LLM backend.
 * For now, returns mock data based on user profile.
 * @param {object} userProfile - The user's profile data.
 * @returns {Promise<object>} The exercise data.
 */
export async function fetchExercise(userProfile) {
  console.log(`Fetching exercise for level ${userProfile.proficiencyLevel}, focusing on ${userProfile.problemAreas.join(', ')}`);
  
  // TODO: Replace with actual API call
  // const response = await fetch(API_ENDPOINT, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ 
  //     action: 'generateExercise', 
  //     model: LLM_MODEL, 
  //     userProfile 
  //   })
  // });
  // if (!response.ok) throw new Error('Failed to fetch exercise');
  // const data = await response.json();
  // return data;

  // --- Mock Implementation ---
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  // Select a mock exercise somewhat based on level (very basic logic)
  const exercise = userProfile.proficiencyLevel === 'A1' ? MOCK_EXERCISES[0] : MOCK_EXERCISES[1];
  console.log('Returning mock exercise:', exercise);
  return exercise;
  // --- End Mock Implementation ---
}

/**
 * Sends the user's answer to the LLM backend for grading.
 * For now, returns mock grading data.
 * @param {object} exercise - The current exercise data.
 * @param {string} userAnswer - The user's submitted sentence.
 * @returns {Promise<object>} The grading feedback.
 */
export async function gradeSentence(exercise, userAnswer) {
  console.log(`Grading answer "${userAnswer}" for exercise ${exercise.exerciseId}`);

  // TODO: Replace with actual API call
  // const response = await fetch(API_ENDPOINT, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ 
  //     action: 'gradeSentence', 
  //     model: LLM_MODEL, 
  //     exercise, 
  //     userAnswer 
  //   })
  // });
  // if (!response.ok) throw new Error('Failed to grade sentence');
  // const data = await response.json();
  // return data;

  // --- Mock Implementation ---
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const gradingResult = MOCK_GRADING[exercise.exerciseId] || {
    isCorrect: Math.random() > 0.5,
    score: Math.random(),
    feedback: 'Mock feedback: Looks okay, or maybe not.',
    suggestions: 'Mock suggestion: Try adding more detail.',
    grammarNotes: []
  };
  console.log('Returning mock grading:', gradingResult);
  return gradingResult;
  // --- End Mock Implementation ---
}
