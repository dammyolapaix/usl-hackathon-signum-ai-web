import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  createSignEvaluationSystemPrompt,
  createSignEvaluationUserPrompt,
} from "./prompts";

export async function evaluateSign(params: {
  userVideoUrl: string;
  signDescription?: string;
  signImages?: string[];
}) {
  const model = openai("gpt-4.1");

  const { text } = await generateText({
    model,
    system: createSignEvaluationSystemPrompt(),
    prompt: createSignEvaluationUserPrompt({
      ...params,
      referenceVideoUrl:
        "https://res.cloudinary.com/techbiznez/video/upload/v1763019390/Unicef%20Hackathon%20Videos/Family%2C%20People%20and%20Pronouns/family_jn57s9.mp4",
    }),
  });

  return text;
}
