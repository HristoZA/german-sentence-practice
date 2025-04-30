# German Sentence Construction App - Progress Tracker

## Instructions for LLM
This markdown file serves as a progress tracker for the development of the German sentence construction app. You should:

1. Reference this file at the beginning of each development session to understand current status
2. Update this file after completing each task by adding checkmarks `[x]` to completed items
3. Add notes in the "Development Notes" section for important decisions or challenges
4. Track any bugs or issues in the "Known Issues" section
5. Use the structured data examples to ensure consistent output formats

## Project Components

### Backend Setup
- [ ] Initialize project structure
- [ ] Set up API routes
- [ ] Implement LLM integration (GPT4o-mini)
- [ ] Create open-ended exercise generation logic
- [ ] Create flexible sentence grading logic
- [ ] Implement cookie-based user session management
- [ ] Set up data structure for user profiles

### Frontend Development
- [x] Set up Vue.js project with Tailwind CSS
- [ ] Create responsive layout
- [ ] Implement user profile management UI
- [ ] Design minimal exercise display components (`ExerciseDisplay.vue`)
- [ ] Create sentence submission form
- [ ] Design feedback display components
- [ ] Implement progress tracking visualization

### User Profile Management
- [ ] Create data structure for user profiles
- [ ] Implement proficiency level tracking (A1-C2)
- [ ] Create problem areas management
- [ ] Set up cookie-based storage

### Exercise System
- [ ] Define open-ended exercise format
- [ ] Create prompt templates for topic and keyword generation
- [ ] Implement grading rubric for open-ended responses
- [ ] Design adaptive difficulty progression

### Testing and Optimization
- [ ] Test exercise generation variety
- [ ] Test grading flexibility and accuracy
- [ ] Optimize LLM prompt performance
- [ ] User experience testing
- [ ] Performance optimization

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

## Known Issues
- List any bugs or issues here as they are discovered

## Next Steps
- Outline the immediate next tasks to work on
