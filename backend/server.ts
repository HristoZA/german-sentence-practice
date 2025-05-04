import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import OpenAI from "openai";

dotenv.config();

// --- Type Definitions ---
interface UserProfile {
  proficiencyLevel: string;
  problemAreas: string[];
  // Add other profile fields if they exist
}

interface Exercise {
  exerciseId: string;
  problemArea: string;
  proficiencyLevel: string;
  topic: string;
  keyWords: string[];
  instructions: string;
  context: string;
}

interface GrammarNote {
  rule: string;
  example?: string; // Example might be optional
}

interface GradingResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  suggestions?: string; // Suggestions might be optional
  grammarNotes?: GrammarNote[]; // Grammar notes might be optional
}

interface ApiRequestBody {
  action: "generateExercise" | "gradeSentence";
  userProfile?: UserProfile;
  exercise?: Exercise;
  userAnswer?: string;
}

// --- OpenAI Client Setup ---
const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
});
const llmModel: string = process.env.LLM_MODEL_NAME || "gpt-4o-mini";
// --- End OpenAI Client Setup ---

const app = express();
const port: number | string = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
// --- End Middleware ---

// --- Helper Functions ---
async function handleGenerateExercise(
  userProfile: UserProfile
): Promise<Exercise> {
  console.log("Generating exercise for profile:", userProfile);
  const problemAreas: string =
    userProfile.problemAreas.length > 0
      ? userProfile.problemAreas.join(", ")
      : "general grammar";
  const prompt: string = `Generate a German sentence exercise for a ${userProfile.proficiencyLevel} learner focusing on ${problemAreas}. Provide topic, 1-2 diverse and less common keywords related to the topic (avoid overly frequent words like 'essen' or 'Frühstück' unless highly relevant), instructions, context, and the specific problem area being targeted (must be one of: ${problemAreas}). Output ONLY valid JSON in this exact format: { "exerciseId": "gen-<uuid>", "problemArea": "...", "proficiencyLevel": "${userProfile.proficiencyLevel}", "topic": "...", "keyWords": ["...", "..."], "instructions": "...", "context": "..." }`;

  try {
    console.log("Sending prompt to LLM for exercise generation...");
    const completion = await openai.chat.completions.create({
      model: llmModel,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant generating German language exercises in a specific JSON format. Output ONLY the JSON object.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const responseContent: string | null =
      completion.choices[0].message.content;
    console.log("LLM Raw Response (Exercise):", responseContent);

    if (!responseContent) {
      throw new Error("LLM returned empty content");
    }

    let result: Exercise;
    try {
      // We assume the LLM returns the correct structure, but add basic validation below
      result = JSON.parse(responseContent) as Exercise;
    } catch (parseError: any) {
      console.error("Failed to parse LLM JSON response:", parseError);
      console.error("Raw response was:", responseContent);
      throw new Error(
        `LLM returned invalid JSON format: ${parseError.message}`
      );
    }

    // Basic validation of the parsed structure
    if (
      !result.exerciseId ||
      !result.topic ||
      !result.keyWords ||
      !result.instructions ||
      !result.problemArea ||
      !result.proficiencyLevel ||
      !result.context
    ) {
      console.error("LLM JSON missing required fields:", result);
      throw new Error("LLM JSON missing required fields");
    }

    console.log("Parsed LLM Response (Exercise):", result);
    return result;
  } catch (error: any) {
    console.error(
      "Error calling OpenAI or processing response for exercise generation:",
      error
    );
    throw new Error(`Failed to generate exercise from LLM: ${error.message}`);
  }
}

async function handleGradeSentence(
  exercise: Exercise,
  userAnswer: string
): Promise<GradingResult> {
  console.log(`Grading answer "${userAnswer}" for exercise:`, exercise);
  const prompt: string = `Grade the following German sentence written by a ${
    exercise.proficiencyLevel
  } learner: "${userAnswer}". The exercise topic was "${
    exercise.topic
  }", focusing on ${
    exercise.problemArea
  }, using keywords ${exercise.keyWords.join(
    ", "
  )}. Assess correctness (true/false), grammar, keyword usage, and relevance. Provide a score (0.0-1.0), concise feedback, a helpful suggestion, and specific grammar notes if incorrect. Output ONLY valid JSON in this exact format: { "isCorrect": boolean, "score": float, "feedback": "...", "suggestions": "...", "grammarNotes": [{ "rule": "...", "example": "..." }] }`;

  try {
    console.log("Sending prompt to LLM for grading...");
    const completion = await openai.chat.completions.create({
      model: llmModel,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant grading German language sentences and providing feedback in a specific JSON format. Output ONLY the JSON object.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const responseContent: string | null =
      completion.choices[0].message.content;
    console.log("LLM Raw Response (Grading):", responseContent);

    if (!responseContent) {
      throw new Error("LLM returned empty content");
    }

    let result: GradingResult;
    try {
      // Assume correct structure, validate below
      result = JSON.parse(responseContent) as GradingResult;
    } catch (parseError: any) {
      console.error("Failed to parse LLM JSON response:", parseError);
      console.error("Raw response was:", responseContent);
      throw new Error(
        `LLM returned invalid JSON format: ${parseError.message}`
      );
    }

    // Basic validation of the parsed structure
    if (
      typeof result.isCorrect !== "boolean" ||
      typeof result.score !== "number" ||
      !result.feedback
    ) {
      console.error("LLM JSON missing required fields:", result);
      throw new Error("LLM JSON missing required fields");
    }

    // Ensure optional fields are at least present (even if empty array/undefined)
    result.suggestions = result.suggestions ?? undefined;
    result.grammarNotes = result.grammarNotes ?? undefined;

    console.log("Parsed LLM Response (Grading):", result);
    return result;
  } catch (error: any) {
    console.error(
      "Error calling OpenAI or processing response for grading:",
      error
    );
    throw new Error(`Failed to grade sentence with LLM: ${error.message}`);
  }
}
// --- End Helper Functions ---

// --- API Route ---
app.post(
  "/api/llm",
  async (req: Request<{}, {}, ApiRequestBody>, res: Response) => {
    console.log("Received request on /api/llm:", req.body);
    const { action, userProfile, exercise, userAnswer } = req.body;

    try {
      let result: Exercise | GradingResult;
      if (action === "generateExercise") {
        if (!userProfile)
          throw new Error("userProfile is required for generateExercise");
        result = await handleGenerateExercise(userProfile);
      } else if (action === "gradeSentence") {
        if (!exercise || userAnswer === undefined)
          throw new Error(
            "exercise and userAnswer are required for gradeSentence"
          );
        // Type assertion needed here as userAnswer could be undefined based on ApiRequestBody
        result = await handleGradeSentence(exercise, userAnswer as string);
      } else {
        // This case should ideally not happen if action type is enforced, but good for safety
        const exhaustiveCheck: never = action;
        throw new Error(`Invalid action specified: ${exhaustiveCheck}`);
      }
      res.json(result);
    } catch (error: any) {
      console.error("API Error:", error.message);
      res
        .status(500)
        .json({ error: error.message || "An internal server error occurred" });
    }
  }
);
// --- End API Route ---

// Basic root route
app.get("/", (req: Request, res: Response) => {
  res.send("German Sentence App Backend is running!");
});

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
