import { openai } from "@ai-sdk/openai";
import { generateObject, generateText } from "ai";
import {
  createSignEvaluationSystemPrompt,
  createSignEvaluationUserPrompt,
} from "./prompts";
import z from "zod";

export async function evaluateSign(params: {
  userVideoUrl: string;
  signDescription?: string;
  signImages?: string[];
  referenceVideoUrl: string;
}) {
  const model = openai("gpt-4.1");

  const { object } = await generateObject({
    model: model,
    schema: z.object({
      accuracy_score: z
        .number()
        .min(0)
        .max(100)
        .describe("A percentage from 0-100 representing overall accuracy"),
      hand_shape_detected: z
        .enum([
          "ILY",
          "Flat",
          "AND",
          "Clawed",
          "Bent",
          "Open",
          "Curved",
          "Other",
        ])
        .describe(
          "The detected hand shape: ILY|Flat|AND|Clawed|Bent|Open|Curved|Other"
        ),
      movement_pattern_detected: z
        .enum([
          "Single Direction",
          "Opposite",
          "Double Arrows",
          "Waves",
          "Curved",
          "Circular",
          "Accents",
          "Double Pointed",
          "Double Curved Lines",
          "Other",
        ])
        .describe(
          "The detected movement pattern: Single Direction|Opposite|Double Arrows|Waves|Curved|Circular|Accents|Double Pointed|Double Curved Lines|Other"
        ),
      strengths: z
        .array(z.string())
        .describe(
          "Specific strengths with technical terminology - what the user is doing well"
        ),
      improvements: z.array(
        z.object({
          aspect: z
            .enum([
              "handshape",
              "movement",
              "location",
              "orientation",
              "facial_expression",
              "stability",
              "speed",
            ])
            .describe(
              "The aspect that needs improvement: handshape|movement|location|orientation|facial_expression|stability|speed"
            ),
          issue: z.string().describe("What's wrong - be specific"),
          suggestion: z
            .string()
            .describe("How to fix it - use technical terms"),
          priority: z
            .enum(["critical", "important", "minor"])
            .describe("Priority level: critical|important|minor"),
        })
      ),
      critical_feedback: z
        .string()
        .describe(
          "The 1-2 most important things the user should focus on first"
        ),
      encouragement: z
        .string()
        .describe("A motivating message to encourage continued practice"),
    }),
    system: createSignEvaluationSystemPrompt(),
    prompt: createSignEvaluationUserPrompt(params),
  });

  return object;
}
