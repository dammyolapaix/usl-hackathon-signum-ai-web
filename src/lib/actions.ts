"use server";

import { evaluateSign } from "./ai";

export type EvaluationResult = {
  accuracy_score: number;
  hand_shape_detected: string;
  movement_pattern_detected: string;
  strengths: string[];
  improvements: Array<{
    aspect: string;
    issue: string;
    suggestion: string;
    priority: "critical" | "important" | "minor";
  }>;
  critical_feedback: string;
  encouragement: string;
};

export async function evaluateSignAction(
  prevState: EvaluationResult | { error: string } | null,
  formData: FormData
): Promise<EvaluationResult | { error: string }> {
  try {
    // Get data from formData
    const videoUrl = formData.get("videoUrl") as string;
    const signDescription = formData.get("signDescription") as string;
    const referenceVideoUrl = formData.get("referenceVideoUrl") as string;
    const signImagesJson = formData.get("signImages") as string | null;

    if (!videoUrl) {
      return { error: "No video URL provided" };
    }

    // Parse signImages if provided
    let signImages: string[] | undefined;
    if (signImagesJson) {
      try {
        signImages = JSON.parse(signImagesJson);
      } catch (e) {
        console.error("Failed to parse signImages:", e);
      }
    }

    console.log("🎯 Evaluating sign:", signDescription);
    console.log("📹 Video URL:", videoUrl);
    if (signImages) {
      console.log("🖼️ Reference images:", signImages.length);
    }

    const evaluation = await evaluateSign({
      userVideoUrl: videoUrl,
      signDescription: signDescription || undefined,
      referenceVideoUrl,
      signImages,
    });

    console.log("✅ AI Evaluation:", evaluation);
    return evaluation as EvaluationResult;
  } catch (error) {
    console.error("❌ Error in evaluateSignAction:", error);
    return { error: "Failed to evaluate sign. Please try again." };
  }
}
