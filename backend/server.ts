import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

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
    review: z
      .string()
      .describe(
        "Comprehensive review of the sentence, explaining grammatical issues, suggesting improvements, and providing constructive feedback"
      ),
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

// Question and Answer types
type QuestionRequest = {
  exercise: Exercise;
  userAnswer: string;
  feedback: GradingResult;
  question: string;
};

type QuestionResponse = {
  answer: string;
};

// Define the word list entry structure
type WordListEntry = {
  german: string;
  english: string;
  germanSentence: string;
  clozeSentence: string;
};

interface ApiRequestBody {
  action: "generateExercise" | "gradeSentence" | "answerQuestion";
  userProfile?: UserProfile;
  exercise?: Exercise; // Use inferred type
  userAnswer?: string;
  feedback?: GradingResult;
  question?: string;
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

// --- Word List Functions ---
let wordListCache: WordListEntry[] | null = null;

function parseWordListCSV(filePath: string): WordListEntry[] {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    // Skip the first line if it's a header
    const parsedData = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return parsedData.map((row: any) => ({
      german: row.German,
      english: row.English,
      germanSentence: row["German Sentence"],
      clozeSentence: row["Cloze Sentence"],
    }));
  } catch (error) {
    console.error("Error reading or parsing word list CSV:", error);
    return [];
  }
}

function getRandomWords(count: number = 10): WordListEntry[] {
  if (!wordListCache) {
    const filePath = path.join(__dirname, "data", "word_list.csv");
    wordListCache = parseWordListCSV(filePath);
    console.log(`Loaded ${wordListCache.length} words from CSV file.`);
  }

  if (wordListCache.length === 0) {
    console.warn("Word list is empty, cannot select random words.");
    return [];
  }

  // Shuffle the array and pick the first 'count' elements
  const shuffled = [...wordListCache].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function formatRandomWordsForPrompt(words: WordListEntry[]): string {
  if (words.length === 0) return "";

  const formattedWords = words
    .map((word) => `"${word.german}" (${word.english}): ${word.germanSentence}`)
    .join("\n");

  return `Here are some random German words you can use for inspiration:\n\n${formattedWords}\n\n`;
}

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

  // Get 10 random words from our CSV file for inspiration
  const randomWords = getRandomWords(10);
  const randomWordsSection = formatRandomWordsForPrompt(randomWords);
  console.log(`Selected ${randomWords.length} random words for inspiration`);

  const prompt: string = `Generate a German sentence exercise for a ${userProfile.proficiencyLevel} learner focusing specifically on "${targetFocusArea}". 
  
  ${randomWordsSection}
  
  Provide:
  - topic: something interesting and relevant to the grammar focus
  - 1-2 diverse and less common keywords related to the topic (consider using one or two from the inspiration list above if they fit the grammar focus)
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
  } learner: "${userAnswer}". 

The exercise topic was "${exercise.topic}", focusing on ${
    exercise.problemArea
  }, using keywords ${exercise.keyWords.join(", ")}.

IMPORTANT GRADING GUIDELINES:
1. Be lenient on whether the sentence matches the intended category, problem area, or uses all the suggested keywords.
2. However, be strict on fundamental grammar rules, particularly:
   - Article gender agreement (der, die, das) must match the noun gender
   - Adjective endings must agree with the noun's gender, number, and case
   - Subject-verb agreement must be correct
   - Case usage (nominative, accusative, dative, genitive) must be appropriate

First, assess whether the sentence is correct (true/false) based on grammar, spelling, and proper use of the German language. The sentence should be grammatically correct and make sense in German. A sentence with incorrect article gender (e.g., "eine Kleid" instead of "ein Kleid") should be marked as incorrect.

Then, provide:
1. A score between 0.0 and 1.0 reflecting the quality of the answer
2. Brief feedback summarizing the overall assessment
3. An in-depth review addressing the question: "What's wrong with this German sentence?" If nothing is wrong, explain what makes it a good sentence.

In your review:
- Explain any grammatical or spelling errors
- Comment on word choice and sentence structure
- Pay special attention to article-noun gender agreement
- Provide constructive suggestions for improvement
- If relevant, explain the grammar rules being violated or applied correctly

Adhere strictly to the provided JSON schema.`;

  try {
    console.log("Sending prompt to LLM for grading...");
    // Use the new parse method with zodResponseFormat
    const completion = await openai.beta.chat.completions.parse({
      model: llmModel,
      messages: [
        {
          role: "system",
          content:
            "You are an assistant grading German language sentences. Respond in English. Be strict about grammatical correctness, especially regarding article-noun gender agreement, while being lenient about adhering to the exercise's specific topic focus.",
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

async function handleAnswerQuestion(
  exercise: Exercise,
  userAnswer: string,
  feedback: GradingResult,
  question: string
): Promise<QuestionResponse> {
  console.log(`Answering question "${question}" for exercise:`, exercise);

  const prompt: string = `You are a German language teacher assistant. A student has submitted a German sentence and received feedback. 
  Now they have a follow-up question about the grammar or feedback.

  Exercise topic: "${exercise.topic}"
  Grammar focus: ${exercise.problemArea}
  Student's sentence: "${userAnswer}"
  
  Feedback received:
  - Correct: ${feedback.isCorrect ? "Yes" : "No"}
  - Score: ${feedback.score}
  - Feedback: "${feedback.feedback}"
  - Review: "${feedback.review}"
  
  Student's question: "${question}"
  
  Please answer the student's question thoroughly but concisely. Focus specifically on what they're asking about.
  If they're asking about grammar rules, explain the rule clearly with examples.
  If they're asking about word choice, explain the difference between alternatives.
  If they're asking about sentence structure, explain how it works in German.`;

  try {
    console.log("Sending question to LLM...");

    const completion = await openai.chat.completions.create({
      model: llmModel,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful German language teaching assistant. Provide clear, accurate and educational responses to questions about German grammar, vocabulary, and language usage.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3, // Lower temperature for more focused answers
    });

    const answer = completion.choices[0].message.content;

    if (!answer) {
      throw new Error("No answer received from LLM");
    }

    console.log("Received answer from LLM:", answer);
    return { answer };
  } catch (error: any) {
    console.error("Error answering question:", error);
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API Error (${error.status}): ${error.message}`);
    }
    throw new Error(`Failed to answer question with LLM: ${error.message}`);
  }
}
// --- End Helper Functions ---

// --- API Route ---
app.post(
  "/api/llm",
  async (req: Request<{}, {}, ApiRequestBody>, res: Response) => {
    console.log("Received request on /api/llm:", req.body);
    const { action, userProfile, exercise, userAnswer, feedback, question } =
      req.body;

    try {
      let result: Exercise | GradingResult | QuestionResponse;
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
      } else if (action === "answerQuestion") {
        if (!exercise || userAnswer === undefined || !feedback || !question)
          throw new Error(
            "exercise, userAnswer, feedback, and question are required for answerQuestion"
          );
        result = await handleAnswerQuestion(
          exercise,
          userAnswer as string,
          feedback,
          question
        );
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
