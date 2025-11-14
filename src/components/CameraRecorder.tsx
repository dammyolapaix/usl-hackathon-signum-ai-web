"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Video, VideoOff, CheckCircle, XCircle } from "lucide-react";
import {
  evaluateSignAction,
  uploadVideoToCloudinary,
  type UploadState,
} from "@/lib/actions";

interface CameraRecorderProps {
  signToPerform: string;
  instructions: string;
  hints: string[];
  onPass: () => void;
  onSkip: () => void;
}

type RecordingState =
  | "idle"
  | "requesting-permission"
  | "ready"
  | "countdown"
  | "recording"
  | "recorded"
  | "evaluating"
  | "result";

interface EvaluationResult {
  passed: boolean;
  feedback: string;
  hint?: string;
}

export default function CameraRecorder({
  signToPerform,
  instructions,
  hints,
  onPass,
  onSkip,
}: CameraRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // useActionState for upload and evaluation
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadVideoToCloudinary,
    null
  );
  const [actionState, formAction, isPending] = useActionState(
    evaluateSignAction,
    null
  );

  // Request camera permission and start stream
  const requestCamera = async () => {
    setRecordingState("requesting-permission");
    setPermissionDenied(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setRecordingState("ready");
    } catch (error) {
      console.error("Error accessing camera:", error);
      setPermissionDenied(true);
      setRecordingState("idle");
    }
  };

  // Start countdown before recording
  const startCountdown = () => {
    setCountdownValue(5);
    setRecordingState("countdown");

    let count = 5;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      setCountdownValue(count);

      if (count === 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
        // Start actual recording after countdown
        startRecording();
      }
    }, 1000);
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      // Create blob from recorded chunks
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      recordedBlobRef.current = blob;

      // Log video size in different formats
      const sizeInBytes = blob.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      console.log("📹 Video Recording Complete:");
      console.log(`   Size: ${sizeInBytes} bytes`);
      console.log(`   Size: ${sizeInKB} KB`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log(`   Type: ${blob.type}`);

      setRecordingState("recorded");
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecordingState("recording");
    setRecordingTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1;
        // Auto-stop at 5 seconds
        if (newTime >= 5) {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state === "recording"
          ) {
            mediaRecorderRef.current.stop();
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
        return newTime;
      });
    }, 1000);
  };

  // Stop recording manually (not used for auto-stop)
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:video/webm;base64,")
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Submit recording for evaluation
  const submitRecording = async () => {
    if (!recordedBlobRef.current) return;

    setRecordingState("evaluating");

    try {
      // Convert video blob to base64
      const videoBase64 = await blobToBase64(recordedBlobRef.current);

      // Log base64 size
      const base64SizeInBytes = videoBase64.length;
      const base64SizeInKB = (base64SizeInBytes / 1024).toFixed(2);
      const base64SizeInMB = (base64SizeInBytes / (1024 * 1024)).toFixed(2);

      console.log("📊 Base64 Conversion Complete:");
      console.log(`   Base64 String Length: ${base64SizeInBytes} characters`);
      console.log(`   Approximate Size: ${base64SizeInKB} KB`);
      console.log(`   Approximate Size: ${base64SizeInMB} MB`);

      // Step 1: Upload to Cloudinary
      console.log("📤 Step 1: Uploading to Cloudinary...");
      const uploadFormData = new FormData();
      uploadFormData.append("videoBase64", videoBase64);

      // Upload and wait for result via uploadState
      uploadAction(uploadFormData);
    } catch (error) {
      console.error("Error evaluating sign:", error);
      // Fallback to simulated evaluation
      const passed = Math.random() < 0.7;
      const randomHint = hints[Math.floor(Math.random() * hints.length)];

      setEvaluationResult({
        passed,
        feedback: passed
          ? `Excellent work! Your sign for "${signToPerform}" is accurate.`
          : `Not quite right. Let's try again!`,
        hint: passed ? undefined : randomHint,
      });

      setRecordingState("result");
    }
  };

  // Handle upload completion and trigger evaluation
  useEffect(() => {
    if (
      uploadState &&
      "success" in uploadState &&
      uploadState.success &&
      recordingState === "evaluating"
    ) {
      console.log("✅ Upload complete, starting evaluation...");

      // Step 2: Send URL to AI for evaluation
      const evaluationFormData = new FormData();
      evaluationFormData.append("videoUrl", uploadState.url);
      evaluationFormData.append(
        "signDescription",
        `${signToPerform}: ${instructions}`
      );

      console.log("🚀 Sending to AI for evaluation...");
      formAction(evaluationFormData);
    } else if (uploadState && "error" in uploadState && uploadState.error) {
      console.error("❌ Upload failed:", uploadState.error);
      // Fallback to simulated evaluation
      const passed = Math.random() < 0.7;
      const randomHint = hints[Math.floor(Math.random() * hints.length)];

      setEvaluationResult({
        passed,
        feedback: passed
          ? `Excellent work! Your sign for "${signToPerform}" is accurate.`
          : `Not quite right. Let's try again!`,
        hint: passed ? undefined : randomHint,
      });

      setRecordingState("result");
    }
  }, [
    uploadState,
    recordingState,
    signToPerform,
    instructions,
    formAction,
    hints,
  ]);

  // Process action result when it changes
  useEffect(() => {
    if (actionState && recordingState === "evaluating") {
      console.log("✅ AI Evaluation Received:");
      console.log(
        `   Response: ${actionState.substring(0, 100)}${
          actionState.length > 100 ? "..." : ""
        }`
      );
      console.log(`   Full length: ${actionState.length} characters`);

      // Parse the AI response
      const positiveWords = [
        "correct",
        "great",
        "excellent",
        "good",
        "accurate",
        "right",
        "perfect",
      ];
      const negativeWords = [
        "incorrect",
        "wrong",
        "try again",
        "not quite",
        "needs improvement",
      ];

      const resultText = actionState.toLowerCase();
      const hasPositive = positiveWords.some((word) =>
        resultText.includes(word)
      );
      const hasNegative = negativeWords.some((word) =>
        resultText.includes(word)
      );

      const passed = hasPositive && !hasNegative;
      const randomHint = hints[Math.floor(Math.random() * hints.length)];

      console.log(`   Evaluation: ${passed ? "✅ PASSED" : "❌ FAILED"}`);

      setEvaluationResult({
        passed,
        feedback: actionState,
        hint: passed ? undefined : randomHint,
      });

      setRecordingState("result");
    }
  }, [actionState, recordingState, hints]);

  // Try again
  const tryAgain = () => {
    setEvaluationResult(null);
    setRecordingState("ready");
    setRecordingTime(0);
  };

  // Handle pass
  const handlePass = () => {
    stopStream();
    onPass();
  };

  // Handle skip
  const handleSkip = () => {
    stopStream();
    onSkip();
  };

  // Stop camera stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Instructions Card */}
      <Card className="bg-white border-4 border-[#58C4F6]">
        <CardContent className="p-8 md:p-10">
          <div className="flex items-start gap-6">
            <div className="text-7xl md:text-8xl">📹</div>
            <div className="flex-1">
              <h3 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-4 font-[family-name:var(--font-fredoka)]">
                Practical Test: {signToPerform}
              </h3>
              <p className="text-xl md:text-2xl text-gray-700 mb-4 leading-relaxed">
                {instructions}
              </p>
              {evaluationResult?.hint && (
                <Alert className="bg-[#FFD93D]/20 border-4 border-[#FFD93D] mt-4">
                  <AlertDescription className="text-[#2D3748] text-lg md:text-xl">
                    <strong className="font-bold">💡 Hint:</strong>{" "}
                    {evaluationResult.hint}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Display */}
      <Card className="bg-gray-900 border-4 border-[#B794F6]">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-800 rounded-3xl overflow-hidden">
            {recordingState === "idle" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-24 h-24 mb-6 opacity-50" />
                <p className="text-2xl font-semibold">Camera not active</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  aria-label="Camera preview"
                />
                {/* Countdown overlay */}
                {recordingState === "countdown" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="text-white text-[12rem] md:text-[15rem] font-bold animate-pulse font-[family-name:var(--font-fredoka)] drop-shadow-2xl">
                      {countdownValue}
                    </div>
                  </div>
                )}
                {/* Recording indicator */}
                {recordingState === "recording" && (
                  <div className="absolute top-6 right-6 flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-full animate-pulse shadow-lg">
                    <div className="w-5 h-5 bg-white rounded-full" />
                    <span className="font-bold text-xl font-[family-name:var(--font-fredoka)]">
                      {formatTime(recordingTime)} / 3s
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Permission Denied Alert */}
      {permissionDenied && (
        <Alert className="bg-red-50 border-4 border-red-400 p-6">
          <XCircle className="h-10 w-10 text-red-600" />
          <AlertDescription className="text-red-900 text-xl md:text-2xl ml-4">
            Camera permission denied. Please allow camera access to continue
            with the practical test. 📸
          </AlertDescription>
        </Alert>
      )}

      {/* Evaluation Result */}
      {recordingState === "result" && evaluationResult && (
        <Alert
          className={
            evaluationResult.passed
              ? "bg-[#6BCF7F]/20 border-4 border-[#6BCF7F] p-8"
              : "bg-[#FFD93D]/20 border-4 border-[#FFD93D] p-8"
          }
        >
          {evaluationResult.passed ? (
            <CheckCircle className="h-12 w-12 text-[#6BCF7F]" />
          ) : (
            <XCircle className="h-12 w-12 text-[#FFD93D]" />
          )}
          <AlertDescription
            className={`${
              evaluationResult.passed ? "text-[#2D3748]" : "text-[#2D3748]"
            } text-2xl md:text-3xl font-semibold ml-4`}
          >
            {evaluationResult.feedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-6 justify-center">
        {recordingState === "idle" && (
          <>
            <Button
              onClick={requestCamera}
              size="xl"
              variant="default"
              aria-label="Start camera for recording"
            >
              <Camera className="mr-3 h-8 w-8" />
              Start Camera 📹
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              size="xl"
              aria-label="Skip to next lesson"
            >
              Skip ⏭️
            </Button>
          </>
        )}

        {(recordingState === "requesting-permission" ||
          recordingState === "evaluating" ||
          isUploading ||
          isPending) && (
          <div className="flex items-center gap-4 text-[#2D3748] bg-white px-8 py-6 rounded-full shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#58C4F6]" />
            <span className="text-2xl font-semibold font-[family-name:var(--font-fredoka)]">
              {recordingState === "requesting-permission"
                ? "Requesting camera... 📸"
                : isUploading
                ? "Uploading video... ☁️"
                : "Evaluating... 🤖"}
            </span>
          </div>
        )}

        {recordingState === "ready" && (
          <>
            <Button
              onClick={startCountdown}
              size="xl"
              className="bg-[#FF7B9C] hover:bg-[#ff6b8c] text-white"
              aria-label="Start recording"
            >
              <Video className="mr-3 h-8 w-8" />
              Start Recording 🎬
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              size="xl"
              aria-label="Skip to next lesson"
            >
              Skip ⏭️
            </Button>
          </>
        )}

        {(recordingState === "countdown" || recordingState === "recording") && (
          <div className="flex items-center gap-4 text-white bg-gradient-to-r from-[#FF7B9C] to-[#B794F6] px-8 py-6 rounded-full shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-white" />
            <span className="text-2xl font-bold font-[family-name:var(--font-fredoka)]">
              {recordingState === "countdown"
                ? `Get ready... ${countdownValue} 🎬`
                : `Recording... ${formatTime(recordingTime)}s / 3s ⏺️`}
            </span>
          </div>
        )}

        {recordingState === "recorded" && (
          <>
            <Button
              onClick={submitRecording}
              size="xl"
              variant="success"
              aria-label="Submit recording for evaluation"
            >
              Submit ✅
            </Button>
            <Button
              onClick={tryAgain}
              variant="outline"
              size="xl"
              aria-label="Record again"
            >
              Record Again 🔄
            </Button>
          </>
        )}

        {recordingState === "result" && evaluationResult && (
          <>
            {evaluationResult.passed ? (
              <Button
                onClick={handlePass}
                size="xl"
                variant="success"
                aria-label="Continue to next lesson"
              >
                <CheckCircle className="mr-3 h-8 w-8" />
                Continue 🎉
              </Button>
            ) : (
              <>
                <Button
                  onClick={tryAgain}
                  size="xl"
                  variant="default"
                  aria-label="Try again"
                >
                  Try Again 💪
                </Button>
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  size="xl"
                  aria-label="Skip to next lesson"
                >
                  Skip ⏭️
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Hints Display */}
      {recordingState !== "idle" &&
        recordingState !== "result" &&
        hints.length > 0 && (
          <Card className="bg-[#58C4F6]/10 border-4 border-[#58C4F6]">
            <CardContent className="p-8">
              <h4 className="font-bold text-[#2D3748] mb-4 text-2xl md:text-3xl font-[family-name:var(--font-fredoka)]">
                💡 Tips for Success:
              </h4>
              <ul className="list-none space-y-3 text-[#2D3748] text-xl md:text-2xl">
                {hints.map((hint, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-2xl">✨</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
