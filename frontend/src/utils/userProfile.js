// src/utils/userProfile.js
import Cookies from 'js-cookie';

const PROFILE_COOKIE_NAME = 'germanAppUserProfile';

// Default profile structure
const defaultProfile = {
  proficiencyLevel: 'A1',
  problemAreas: ['word-order'],
  // Add other fields as needed, matching LLM_README.md
  exercisesCompleted: 0,
  correctAnswers: 0,
};

/**
 * Loads the user profile from cookies.
 * If no profile exists, returns the default profile.
 * @returns {object} The user profile object.
 */
export function loadUserProfile() {
  const savedProfile = Cookies.get(PROFILE_COOKIE_NAME);
  if (savedProfile) {
    try {
      const parsedProfile = JSON.parse(savedProfile);
      // Merge with default to ensure all keys exist
      return { ...defaultProfile, ...parsedProfile };
    } catch (error) {
      console.error('Error parsing user profile cookie:', error);
      // Fallback to default if cookie is corrupted
      return { ...defaultProfile };
    }
  } else {
    return { ...defaultProfile }; // Return a copy of the default
  }
}

/**
 * Saves the user profile to cookies.
 * @param {object} profile - The user profile object to save.
 */
export function saveUserProfile(profile) {
  try {
    const profileString = JSON.stringify(profile);
    Cookies.set(PROFILE_COOKIE_NAME, profileString, { expires: 365 }); // Expires in 1 year
  } catch (error) {
    console.error('Error saving user profile cookie:', error);
  }
}

/**
 * Updates specific fields in the user profile and saves it.
 * @param {object} updates - An object containing the fields to update.
 */
export function updateUserProfile(updates) {
  const currentProfile = loadUserProfile();
  const updatedProfile = { ...currentProfile, ...updates };
  saveUserProfile(updatedProfile);
  return updatedProfile; // Return the updated profile
}
