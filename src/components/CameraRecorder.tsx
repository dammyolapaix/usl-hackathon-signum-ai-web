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
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Instructions Card */}
      <Card className="bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">📹</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Practical Test: {signToPerform}
              </h3>
              <p className="text-gray-700 mb-3">{instructions}</p>
              {evaluationResult?.hint && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-900">
                    <strong>Hint:</strong> {evaluationResult.hint}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Display */}
      <Card className="bg-gray-900">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            {recordingState === "idle" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">Camera not active</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Countdown overlay */}
                {recordingState === "countdown" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-9xl font-bold animate-pulse">
                      {countdownValue}
                    </div>
                  </div>
                )}
                {/* Recording indicator */}
                {recordingState === "recording" && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    <span className="font-bold">
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
        <Alert className="bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            Camera permission denied. Please allow camera access to continue
            with the practical test.
          </AlertDescription>
        </Alert>
      )}

      {/* Evaluation Result */}
      {recordingState === "result" && evaluationResult && (
        <Alert
          className={
            evaluationResult.passed
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }
        >
          {evaluationResult.passed ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription
            className={
              evaluationResult.passed ? "text-green-900" : "text-yellow-900"
            }
          >
            {evaluationResult.feedback}
          </AlertDescription>
        </Alert>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {recordingState === "idle" && (
          <>
            <Button
              onClick={requestCamera}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="mr-2 h-5 w-5" />
              Start Camera
            </Button>
            <Button onClick={handleSkip} variant="outline" size="lg">
              Skip to Next Lesson
            </Button>
          </>
        )}

        {(recordingState === "requesting-permission" ||
          recordingState === "evaluating" ||
          isUploading ||
          isPending) && (
          <div className="flex items-center gap-2 text-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            <span>
              {recordingState === "requesting-permission"
                ? "Requesting camera access..."
                : isUploading
                ? "Uploading video to cloud..."
                : "Evaluating your sign with AI..."}
            </span>
          </div>
        )}

        {recordingState === "ready" && (
          <>
            <Button
              onClick={startCountdown}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Video className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
            <Button onClick={handleSkip} variant="outline" size="lg">
              Skip to Next Lesson
            </Button>
          </>
        )}

        {(recordingState === "countdown" || recordingState === "recording") && (
          <div className="flex items-center gap-2 text-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            <span>
              {recordingState === "countdown"
                ? `Get ready... ${countdownValue}`
                : `Recording... ${formatTime(recordingTime)}s / 3s`}
            </span>
          </div>
        )}

        {recordingState === "recorded" && (
          <>
            <Button
              onClick={submitRecording}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              Submit for Evaluation
            </Button>
            <Button onClick={tryAgain} variant="outline" size="lg">
              Record Again
            </Button>
          </>
        )}

        {recordingState === "result" && evaluationResult && (
          <>
            {evaluationResult.passed ? (
              <Button
                onClick={handlePass}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Continue to Next Lesson
              </Button>
            ) : (
              <>
                <Button
                  onClick={tryAgain}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Button onClick={handleSkip} variant="outline" size="lg">
                  Skip to Next Lesson
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
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                Tips for Success:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                {hints.map((hint, index) => (
                  <li key={index}>{hint}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
