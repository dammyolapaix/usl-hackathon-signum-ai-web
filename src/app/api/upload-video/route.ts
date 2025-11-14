import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes timeout for video uploads

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: "No video file provided" },
        { status: 400 }
      );
    }

    console.log("📤 Uploading video to Cloudinary...");
    console.log(`   File size: ${videoFile.size} bytes`);
    console.log(`   File type: ${videoFile.type}`);

    // Convert File to Buffer
    const bytes = await videoFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using a Promise wrapper with timeout
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Upload timeout - exceeded 4 minutes"));
      }, 240000); // 4 minute timeout

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "sign-language-videos",
          public_id: `sign-${Date.now()}`,
          timeout: 240000, // 4 minute timeout in milliseconds
          chunk_size: 6000000, // 6MB chunks for better upload stability
        },
        (error, result) => {
          clearTimeout(timeoutId);
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(buffer);
    });

    console.log("✅ Video uploaded to Cloudinary:");
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Size: ${uploadResult.bytes} bytes`);
    console.log(`   Duration: ${uploadResult.duration}s`);

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    console.error("❌ Error uploading to Cloudinary:", error);
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}
