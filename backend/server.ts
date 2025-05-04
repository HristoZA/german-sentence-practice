import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

dotenv.config();

// --- Zod Schema Definitions ---
const ExerciseSchema = z
  .object({
    exerciseId: z
      .string()
      .describe("Unique ID for the exercise, e.g., gen-<uuid>"),
    problemArea: z
      .string()
      .describe("The specific grammar or vocabulary area targeted"),
    proficiencyLevel: z.string().describe("CEFR level (A1-C2)"),
    topic: z.string().describe("The general topic of the exercise"),
    keyWords: z
      .array(z.string())
      .describe("1-2 diverse keywords to be used in the sentence"),
    instructions: z.string().describe("Clear instructions for the user"),
    context: z.string().describe("Contextual information for the sentence"),
    exampleSentences: z
      .array(z.string())
      .describe(
        "Two example sentences related to the activity, but not using the exact keywords"
      ),
  })
  .required()
  .describe("Schema for a German sentence exercise");

const GrammarNoteSchema = z
  .object({
    rule: z.string().describe("The grammar rule explained"),
    example: z.string().optional().describe("An example illustrating the rule"),
  })
  .required();

const GradingResultSchema = z
  .object({
    isCorrect: z
      .boolean()
      .describe("Whether the user's answer is considered correct"),
    score: z.number().describe("A score between 0.0 and 1.0"),
    feedback: z.string().describe("Concise overall feedback on the answer"),
    suggestions: z
      .string()
      .optional()
      .describe("A helpful suggestion for improvement"),
    grammarNotes: z
      .array(GrammarNoteSchema)
      .optional()
      .describe("Specific grammar notes if incorrect"),
  })
  .required()
  .describe("Schema for grading feedback on a German sentence");

// --- Type Definitions (derived from Zod) ---
type Exercise = z.infer<typeof ExerciseSchema>;
type GradingResult = z.infer<typeof GradingResultSchema>;
type UserProfile = {
  proficiencyLevel: string;
  problemAreas: string[];
  focusArea?: string; // Optional property for the selected grammar topic to focus on
};

interface ApiRequestBody {
  action: "generateExercise" | "gradeSentence";
  userProfile?: UserProfile;
  exercise?: Exercise; // Use inferred type
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

  // Determine the focus area - prioritize the user selected focus area if available
  let targetFocusArea: string = "general grammar";
  if (userProfile.focusArea && userProfile.focusArea.trim() !== "") {
    // User has selected a specific focus area
    targetFocusArea = userProfile.focusArea;
    console.log(`Using user selected focus area: ${targetFocusArea}`);
  } else if (userProfile.problemAreas.length > 0) {
    // Fall back to problem areas if no specific focus area selected
    targetFocusArea = userProfile.problemAreas.join(", ");
    console.log(`Using problem areas: ${targetFocusArea}`);
  }

  const prompt: string = `Generate a German sentence exercise for a ${userProfile.proficiencyLevel} learner focusing specifically on "${targetFocusArea}". 
  
  Provide:
  - topic: something interesting and relevant to the grammar focus
  - 1-2 diverse and less common keywords related to the topic (avoid overly frequent words like 'essen' or 'Frühstück' unless highly relevant)
  - instructions: clear directions on how to form the sentence using the grammar point
  - context: brief scenario to help frame the sentence
  - problemArea: set this exactly to "${targetFocusArea}" as this is what the user wants to practice
  - TWO example sentences in German that demonstrate similar grammar or vocabulary usage, but do NOT use the exact keywords you've provided. These should help the learner understand what kind of sentence to create.
  
  Adhere strictly to the provided JSON schema.`;

  try {
    console.log("Sending prompt to LLM for exercise generation...");
    // Use the new parse method with zodResponseFormat
    const completion = await openai.beta.chat.completions.parse({
      model: llmModel,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant generating German language exercises. Respond in English, but include German example sentences.",
        },
        { role: "user", content: prompt },
      ],
      response_format: zodResponseFormat(ExerciseSchema, "exercise_details"),
      temperature: 0.8,
    });

    const message = completion.choices[0].message;

    // Handle potential refusal
    if (message.refusal) {
      console.error("LLM refused to generate exercise:", message.refusal);
      throw new Error(`LLM refused request: ${message.refusal}`);
    }

    // Access the parsed result directly
    const result = message.parsed;

    if (!result) {
      // This case should be less likely with zodResponseFormat but good to keep
      console.error(
        "LLM response parsing failed despite using zodResponseFormat"
      );
      throw new Error("Failed to parse LLM response.");
    }

    // Zod handles the validation, so manual checks can be removed
    console.log("Parsed LLM Response (Exercise):", result);
    return result;
  } catch (error: any) {
    console.error(
      "Error calling OpenAI or processing response for exercise generation:",
      error
    );
    // Check if it's an OpenAI API error for more details
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (${error.status}): ${error.message}`);
    }
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
  )}. Assess correctness (true/false), grammar, keyword usage, and relevance. Provide a score (0.0-1.0), concise feedback, a helpful suggestion, and specific grammar notes if incorrect. Adhere strictly to the provided JSON schema.`; // Updated prompt slightly

  try {
    console.log("Sending prompt to LLM for grading...");
    // Use the new parse method with zodResponseFormat
    const completion = await openai.beta.chat.completions.parse({
      model: llmModel,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant grading German language sentences. Respond in English.",
        },
        { role: "user", content: prompt },
      ],
      response_format: zodResponseFormat(
        GradingResultSchema,
        "grading_feedback"
      ), // Use Zod schema
      temperature: 0.5,
    });

    const message = completion.choices[0].message;

    // Handle potential refusal
    if (message.refusal) {
      console.error("LLM refused to grade sentence:", message.refusal);
      throw new Error(`LLM refused request: ${message.refusal}`);
    }

    // Access the parsed result directly
    const result = message.parsed;

    if (!result) {
      console.error(
        "LLM response parsing failed despite using zodResponseFormat"
      );
      throw new Error("Failed to parse LLM response.");
    }

    // Zod handles validation
    console.log("Parsed LLM Response (Grading):", result);
    return result;
  } catch (error: any) {
    console.error(
      "Error calling OpenAI or processing response for grading:",
      error
    );
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (${error.status}): ${error.message}`);
    }
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
