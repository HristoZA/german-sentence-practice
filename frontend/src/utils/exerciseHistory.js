// src/utils/exerciseHistory.js

/**
 * Utility functions for managing exercise history
 * Stores exercise attempts in localStorage to maintain history between sessions
 */

const HISTORY_KEY = 'germanAppExerciseHistory';

/**
 * Represents an attempt at an exercise
 * @typedef {Object} ExerciseAttempt
 * @property {string} exerciseId - The ID of the exercise
 * @property {string} userAnswer - The user's submitted answer
 * @property {Object} feedback - The feedback received for this attempt
 * @property {Date} timestamp - When the attempt was made
 * @property {Array<{question: string, answer: string, timestamp: Date}>} [qaHistory] - Optional Q&A history for this attempt
 */

/**
 * Represents a complete exercise with all its attempts
 * @typedef {Object} ExerciseRecord
 * @property {Object} exercise - The full exercise data
 * @property {ExerciseAttempt[]} attempts - Array of attempts made for this exercise
 * @property {boolean} isComplete - Whether this exercise is considered completed
 */

/**
 * Load the full exercise history from localStorage
 * @returns {Object.<string, ExerciseRecord>} Map of exercise IDs to their records
 */
export function loadExerciseHistory() {
  try {
    const historyString = localStorage.getItem(HISTORY_KEY);
    if (!historyString) return {};
    
    const history = JSON.parse(historyString);
    
    // Convert string timestamps back to Date objects
    Object.values(history).forEach(record => {
      record.attempts.forEach(attempt => {
        attempt.timestamp = new Date(attempt.timestamp);
      });
    });
    
    return history;
  } catch (error) {
    console.error('Error loading exercise history:', error);
    return {};
  }
}

/**
 * Save the full exercise history to localStorage
 * @param {Object.<string, ExerciseRecord>} history - The exercise history to save
 */
export function saveExerciseHistory(history) {
  try {
    const historyString = JSON.stringify(history);
    localStorage.setItem(HISTORY_KEY, historyString);
  } catch (error) {
    console.error('Error saving exercise history:', error);
  }
}

/**
 * Add a new exercise to the history or update an existing one
 * @param {Object} exercise - The exercise data
 * @returns {ExerciseRecord} The new or updated exercise record
 */
export function addExerciseToHistory(exercise) {
  const history = loadExerciseHistory();
  
  // Check if exercise already exists
  if (!history[exercise.exerciseId]) {
    history[exercise.exerciseId] = {
      exercise,
      attempts: [],
      isComplete: false
    };
  } else {
    // Update exercise data in case it changed
    history[exercise.exerciseId].exercise = exercise;
  }
  
  saveExerciseHistory(history);
  return history[exercise.exerciseId];
}

/**
 * Record a new attempt for an exercise (initially without Q&A)
 * @param {string} exerciseId - The ID of the exercise
 * @param {string} userAnswer - The submitted answer
 * @param {Object} feedback - The feedback received
 * @returns {ExerciseAttempt} The recorded attempt object, including timestamp
 */
export function recordExerciseAttempt(exerciseId, userAnswer, feedback) {
  const history = loadExerciseHistory();

  if (!history[exerciseId]) {
    // If exercise doesn't exist, create it first (optional, depends on desired flow)
    // For now, assume addExerciseToHistory was called previously
     throw new Error(`Exercise with ID ${exerciseId} not found in history. Cannot record attempt.`);
  }

  const timestamp = new Date(); // Capture timestamp accurately
  const attempt = {
    exerciseId,
    userAnswer,
    feedback,
    timestamp: timestamp,
    qaHistory: [] // Initialize as empty
  };

  history[exerciseId].attempts.push(attempt);

  // Mark exercise as complete if the answer is correct
  if (feedback.isCorrect) {
    history[exerciseId].isComplete = true;
  }

  saveExerciseHistory(history);
  return attempt; // Return the full attempt object
}

/**
 * Update the Q&A history for a specific attempt identified by its timestamp
 * @param {string} exerciseId - The ID of the exercise
 * @param {Date | string} attemptTimestamp - The timestamp of the attempt to update
 * @param {Array<{question: string, answer: string, timestamp: Date}>} qaHistory - The new Q&A history
 */
export function updateAttemptQaHistory(exerciseId, attemptTimestamp, qaHistory) {
  const history = loadExerciseHistory();
  if (!history[exerciseId]) {
    console.warn(`Exercise with ID ${exerciseId} not found for updating Q&A.`);
    return;
  }

  const record = history[exerciseId];
  const targetTime = new Date(attemptTimestamp).getTime(); // Ensure comparison is robust

  // Find the attempt by timestamp
  const attemptIndex = record.attempts.findIndex(
    att => att.timestamp.getTime() === targetTime
  );

  if (attemptIndex === -1) {
    console.warn(`Attempt with timestamp ${attemptTimestamp} (time: ${targetTime}) not found for exercise ${exerciseId}. Q&A not saved.`);
    // Log existing timestamps for debugging if needed
    // console.log("Available attempt timestamps:", record.attempts.map(a => a.timestamp.getTime()));
    return;
  }

  // Update the qaHistory of the found attempt
  record.attempts[attemptIndex].qaHistory = qaHistory;
  saveExerciseHistory(history);
  console.log(`Updated Q&A for attempt at ${attemptTimestamp}`); // Log success
}

/**
 * Get all attempts for a specific exercise
 * @param {string} exerciseId - The ID of the exercise
 * @returns {ExerciseAttempt[]} Array of attempts for this exercise
 */
export function getExerciseAttempts(exerciseId) {
  const history = loadExerciseHistory();
  return history[exerciseId]?.attempts || [];
}

/**
 * Get the most recent exercises, sorted by most recent attempt
 * @param {number} limit - Maximum number of exercises to return
 * @returns {ExerciseRecord[]} Array of exercise records
 */
export function getRecentExercises(limit = 10) {
  const history = loadExerciseHistory();
  
  return Object.values(history)
    .map(record => {
      // Add lastAttemptDate for sorting
      const lastAttempt = record.attempts[record.attempts.length - 1];
      return {
        ...record,
        lastAttemptDate: lastAttempt ? lastAttempt.timestamp : new Date(0)
      };
    })
    .sort((a, b) => b.lastAttemptDate - a.lastAttemptDate)
    .slice(0, limit);
}

/**
 * Get exercises that are not yet completed (no correct answer)
 * @param {number} limit - Maximum number of exercises to return
 * @returns {ExerciseRecord[]} Array of incomplete exercise records
 */
export function getIncompleteExercises(limit = 10) {
  const history = loadExerciseHistory();
  
  return Object.values(history)
    .filter(record => !record.isComplete)
    .sort((a, b) => {
      const aDate = a.attempts.length > 0 ? 
        a.attempts[a.attempts.length - 1].timestamp : new Date(0);
      const bDate = b.attempts.length > 0 ? 
        b.attempts[b.attempts.length - 1].timestamp : new Date(0);
      return bDate - aDate;
    })
    .slice(0, limit);
}
