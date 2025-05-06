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

/**
 * Sends a question about grammar or feedback to the LLM backend.
 * @param {object} exercise - The current exercise data.
 * @param {string} userAnswer - The user's submitted sentence.
 * @param {object} feedback - The feedback received for the sentence.
 * @param {string} question - The user's question about the grammar or feedback.
 * @returns {Promise<object>} The answer to the question.
 */
export async function askQuestionAboutFeedback(exercise, userAnswer, feedback, question) {
  console.log(`Sending question "${question}" about exercise ${exercise.exerciseId} to backend`);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'answerQuestion', 
        exercise, 
        userAnswer,
        feedback,
        question
      })
    });
    
    if (!response.ok) {
       const errorData = await response.json().catch(() => ({})); 
      throw new Error(`Failed to answer question: ${response.statusText} ${errorData.error || ''}`);
    }
    
    const data = await response.json();
    console.log('Received answer from backend:', data);
    return data;
  } catch (error) {
     console.error('Error in askQuestionAboutFeedback:', error);
    throw error;
  }
}

/**
 * Transcribes audio to text using the OpenAI API.
 * @param {Blob} audioBlob - The audio blob to transcribe.
 * @returns {Promise<string>} The transcribed text.
 */
export async function transcribeAudio(audioBlob) {
  console.log('Sending audio for transcription');
  
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to transcribe audio: ${response.statusText} ${errorData.error || ''}`);
    }
    
    const data = await response.json();
    console.log('Received transcription from backend:', data);
    return data.transcription;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}
