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
 * Record a new attempt for an exercise
 * @param {string} exerciseId - The ID of the exercise
 * @param {string} userAnswer - The submitted answer
 * @param {Object} feedback - The feedback received
 * @returns {ExerciseAttempt} The recorded attempt
 */
export function recordExerciseAttempt(exerciseId, userAnswer, feedback) {
  const history = loadExerciseHistory();
  
  if (!history[exerciseId]) {
    throw new Error(`Exercise with ID ${exerciseId} not found in history`);
  }
  
  const attempt = {
    exerciseId,
    userAnswer,
    feedback,
    timestamp: new Date()
  };
  
  history[exerciseId].attempts.push(attempt);
  
  // Mark exercise as complete if the answer is correct
  if (feedback.isCorrect) {
    history[exerciseId].isComplete = true;
  }
  
  saveExerciseHistory(history);
  return attempt;
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
