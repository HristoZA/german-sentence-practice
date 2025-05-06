# German Sentence Practice

A modern web application for practicing German sentence construction with AI-powered feedback and personalized exercises.

![German Sentence Practice App](https://placeholder-for-app-screenshot.png)

## Overview

German Sentence Practice is an interactive language learning tool designed to help users improve their German sentence construction skills. The application uses AI to generate personalized exercises, provide immediate feedback on user-created sentences, and track progress over time.

## Features

- **AI-Generated Exercises**: Custom exercises based on your proficiency level (A1-C2) and specific grammar focus areas
- **Personalized Feedback**: Detailed analysis of your sentences with grammar explanations and improvement suggestions
- **Progress Tracking**: Monitor your performance and see improvement over time
- **Exercise History**: Review past attempts and revisit challenging exercises
- **Interactive Q&A**: Ask questions about grammar rules and receive detailed explanations
- **Adaptive Learning**: The app identifies your weak areas and generates targeted practice opportunities

## Getting Started

### Prerequisites

- Node.js (v16.0 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/german-sentence-practice.git
   cd german-sentence-practice
   ```

2. Install dependencies for both frontend and backend:
   ```
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Environment setup:
   Create a `.env` file in the backend directory with the following variables:
   ```
   LLM_API_KEY=your_openai_api_key
   LLM_MODEL_NAME=gpt-4o-mini
   PORT=3000
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

## How to Use

### Generating Exercises

1. Select your proficiency level (A1-C2) and grammar focus area in the Progress section
2. Click "New Exercise" to generate a custom practice activity
3. Read the instructions, context, and example sentences carefully

### Practicing Sentences

1. Type your German sentence in the answer box, using the provided keywords and grammar focus
2. Submit your answer for immediate AI analysis
3. Review the feedback, which includes:
   - Overall correctness assessment
   - Specific grammar and vocabulary feedback
   - Suggestions for improvement

### Asking Questions

If you're unsure about the feedback or want to learn more about a grammar point:
1. Use the Question Mode to ask specific questions
2. The AI will provide detailed grammar explanations and examples

### Tracking Progress

- View your progress statistics in the Progress section
- Review your exercise history to see improvement over time
- Revisit incomplete exercises to master challenging grammar concepts

## Technical Architecture

The application consists of two main components:

1. **Frontend** (Vue 3 + Vite)
   - Modern reactive UI with component-based architecture
   - Local state management for user preferences and history

2. **Backend** (Node.js + Express)
   - LLM integration with OpenAI for exercise generation and sentence grading
   - API endpoints for exercise generation, grading, and answering questions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This was completely vibe coded out of laziness and it's really only so I can practice as much sentence construction as possible. Use at own risk.
