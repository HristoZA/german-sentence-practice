# German Sentence Construction App - Progress Tracker

## Project Structure
- `frontend/`: Contains the Vue.js application (Vite, Tailwind CSS).
- `backend/`: Placeholder for the backend service (Node.js/Python).
- `LLM_README.md`: This file.

## Instructions for LLM
This markdown file serves as a progress tracker for the development of the German sentence construction app. You should:

1. Reference this file at the beginning of each development session to understand current status
2. Update this file after completing each task by adding checkmarks `[x]` to completed items
3. Add notes in the "Development Notes" section for important decisions or challenges
4. Track any bugs or issues in the "Known Issues" section
5. Use the structured data examples to ensure consistent output formats
6. no // comments in VUE code, (script tag is fine, but actual vue templates no.)

## Project Components

### Backend Setup
- [x] Initialize project structure (Node.js/Express)
- [x] Set up API endpoint (`/api/llm`)
- [x] Implement secure LLM API key management (`.env`)
- [x] Implement LLM integration (GPT-4o mini using `openai` package)
- [x] Create prompt template for open-ended exercise generation
- [x] Create prompt template for flexible sentence grading
- [x] Implement logic to parse LLM responses into structured JSON
- [x] Handle potential LLM API errors

### Frontend Development
- [x] Set up Vue.js project with Vite and Tailwind CSS
- [x] Create responsive layout (`App.vue`)
- [x] Implement user profile management UI (`ProgressDisplay.vue`)
- [x] Design minimal exercise display components (`ExerciseDisplay.vue`)
- [x] Create sentence submission form (`App.vue`)
- [x] Design feedback display components (`FeedbackDisplay.vue`)
- [x] Implement progress tracking visualization (`ProgressDisplay.vue`)
- [x] Add mock LLM utility (`src/utils/llm.js`)
- [x] Add basic input validation

### User Profile Management
- [x] Create data structure for user profiles (`src/utils/userProfile.js`)
- [x] Implement proficiency level tracking (A1-C2)
- [x] Create problem areas management (dynamic addition)
- [x] Set up cookie-based storage (`js-cookie`, `src/utils/userProfile.js`)

### Exercise System
- [ ] Define open-ended exercise format (JSON structure defined)
- [ ] Create prompt templates for topic and keyword generation (Backend task)
- [ ] Implement grading rubric for open-ended responses (Backend task)
- [ ] Design adaptive difficulty progression (Backend task, using user profile)

### Testing and Optimization
- [ ] Test exercise generation variety (Backend/LLM task)
- [ ] Test grading flexibility and accuracy (Backend/LLM task)
- [ ] Optimize LLM prompt performance (Backend/LLM task)
- [ ] User experience testing (Frontend)
- [ ] Performance optimization (Frontend/Backend)

## Structured Data Examples

### User Profile Format
```json
{
  "userId": "generated-id",
  "proficiencyLevel": "A1",
  "problemAreas": ["word-order", "verb-conjugation", "prepositions"],
  "exercisesCompleted": 0,
  "correctAnswers": 0,
  "lastActive": "2025-04-30T12:00:00Z"
}
```

### Open-Ended Exercise Format
```json
{
  "exerciseId": "ex-123",
  "problemArea": "verb-conjugation",
  "proficiencyLevel": "A1",
  "topic": "Daily Routine",
  "keyWords": ["aufstehen", "früh"],
  "instructions": "Create a sentence about your daily routine using the provided words.",
  "context": "You are describing when you wake up in the morning."
}
```

### Grading Response Format
```json
{
  "exerciseId": "ex-123",
  "userAnswer": "Ich stehe jeden Tag früh auf.",`
  "isCorrect": true,
  "score": 0.9,
  "feedback": "Great job! You've correctly used the separable verb 'aufstehen' and placed 'früh' appropriately.",
  "suggestions": "You could also add a specific time to make your sentence more detailed.",
  "grammarNotes": [
    {
      "rule": "Separable verbs like 'aufstehen' split in conjugated forms with the prefix at the end of the sentence.",
      "example": "Ich stehe um 6 Uhr auf."
    }
  ]
}
```

## Development Notes
- The app focuses on open-ended exercises requiring creative sentence construction
- Exercise difficulty should adapt based on user proficiency level
- Grading should be flexible, allowing for multiple correct solutions
- Cleaned up default Vue components (`App.vue`, removed `HelloWorld.vue`).
- Frontend components (Exercise, Feedback, Progress) are implemented.
- User profile (level, problem areas, stats) persists via cookies.
- Mock LLM utility (`llm.js`) simulates API calls for frontend development.
- Added ability for users to manually change proficiency level.

## Known Issues
- Tailwind CSS required `@tailwindcss/postcss` package and config update.
- `npm run dev` initially failed due to PostCSS configuration issue (resolved).

## Next Steps
- [ ] Test exercise generation variety (Backend/LLM task)
- [ ] Test grading flexibility and accuracy (Backend/LLM task)
- [ ] Optimize LLM prompt performance (Backend/LLM task)
- [ ] User experience testing (Frontend)
- [ ] Performance optimization (Frontend/Backend)
- [ ] Consider adding more robust error handling and UI feedback for API issues.
- [ ] Prepare for deployment (e.g., configure CORS for production, build frontend).
