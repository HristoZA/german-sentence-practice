// src/utils/llm.js

// --- Configuration ---
const LLM_MODEL = 'gpt-4o-mini'; // Still relevant for backend prompt construction
const API_ENDPOINT = 'http://localhost:3000/api/llm'; // Backend endpoint

// --- API Functions ---

/**
 * Fetches a new exercise from the LLM backend.
 * @param {object} userProfile - The user's profile data.
 * @returns {Promise<object>} The exercise data.
 */
export async function fetchExercise(userProfile) {
  console.log(`Fetching exercise for level ${userProfile.proficiencyLevel}, focusing on ${userProfile.problemAreas.join(', ')}`);
  
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'generateExercise', 
        // model: LLM_MODEL, // Model selection is handled by backend
        userProfile 
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Try to get error details
      throw new Error(`Failed to fetch exercise: ${response.statusText} ${errorData.error || ''}`);
    }
    const data = await response.json();
    console.log('Received exercise from backend:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchExercise:', error);
    // Re-throw the error so App.vue can catch it and display a message
    throw error; 
  }
}

/**
 * Sends the user's answer to the LLM backend for grading.
 * @param {object} exercise - The current exercise data.
 * @param {string} userAnswer - The user's submitted sentence.
 * @returns {Promise<object>} The grading feedback.
 */
export async function gradeSentence(exercise, userAnswer) {
  console.log(`Sending answer "${userAnswer}" for exercise ${exercise.exerciseId} to backend for grading`);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'gradeSentence', 
        // model: LLM_MODEL, // Model selection is handled by backend
        exercise, 
        userAnswer 
      })
    });
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({})); // Try to get error details
      throw new Error(`Failed to grade sentence: ${response.statusText} ${errorData.error || ''}`);
    }
    const data = await response.json();
    console.log('Received grading from backend:', data);
    return data;
  } catch (error) {
     console.error('Error in gradeSentence:', error);
    // Re-throw the error so App.vue can catch it
    throw error;
  }
}
