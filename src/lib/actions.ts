"use server";

import { evaluateSign } from "./ai";
import cloudinary from "./cloudinary";

export type UploadState =
  | { success: true; url: string; publicId: string }
  | { error: string }
  | null;

export async function uploadVideoToCloudinary(
  prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  try {
    const videoBase64 = formData.get("videoBase64") as string;

    if (!videoBase64) {
      return { error: "No video provided" };
    }

    console.log("📤 Uploading video to Cloudinary...");

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(
      `data:video/webm;base64,${videoBase64}`,
      {
        resource_type: "video",
        folder: "sign-language-videos",
        public_id: `sign-${Date.now()}`,
      }
    );

    console.log("✅ Video uploaded to Cloudinary:");
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Size: ${uploadResult.bytes} bytes`);
    console.log(`   Duration: ${uploadResult.duration}s`);

    return {
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    };
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    return { error: "Failed to upload video" };
  }
}

export async function evaluateSignAction(
  prevState: string | null,
  formData: FormData
) {
  try {
    // Get data from formData
    const videoUrl = formData.get("videoUrl") as string;
    const signDescription = formData.get("signDescription") as string;

    if (!videoUrl) {
      return "Error: No video URL provided";
    }

    console.log("🎯 Evaluating sign:", signDescription);
    console.log("📹 Video URL:", videoUrl);

    const evaluation = await evaluateSign({
      userVideoUrl: videoUrl,
      signDescription: signDescription || undefined,
    });

    console.log("✅ AI Evaluation:", evaluation);
    return evaluation;
  } catch (error) {
    console.error("❌ Error in evaluateSignAction:", error);
    return "Error: Failed to evaluate sign. Please try again.";
  }
}
