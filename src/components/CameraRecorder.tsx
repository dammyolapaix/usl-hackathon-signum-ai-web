"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Video, VideoOff, CheckCircle, XCircle } from "lucide-react";
import {
  evaluateSignAction,
  type EvaluationResult as AIEvaluationResult,
} from "@/lib/actions";

interface CameraRecorderProps {
  signToPerform: string;
  instructions: string;
  hints: string[];
  referenceVideoUrl: string;
  signImages?: string[];
  signDescription?: string;
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

export default function CameraRecorder({
  signToPerform,
  instructions,
  hints,
  referenceVideoUrl,
  signImages,
  signDescription,
  onPass,
  onSkip,
}: CameraRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<AIEvaluationResult | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // useActionState for evaluation only
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
    setCountdownValue(3);
    setRecordingState("countdown");

    let count = 3;
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

  // Upload video to Cloudinary via API route
  const uploadToCloudinary = async (blob: Blob): Promise<string> => {
    setUploadProgress("Evaluating your sign...");

    const formData = new FormData();
    formData.append("video", blob, "recording.webm");

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 minute timeout

    try {
      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: "Failed to upload video",
        }));
        throw new Error(error.error || "Failed to upload video");
      }

      const data = await response.json();
      console.log("✅ Video uploaded via API:");
      console.log(`   URL: ${data.url}`);

      return data.url;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error(
          "Upload timed out. Please check your internet connection and try again."
        );
      }
      throw error;
    }
  };

  // Submit recording for evaluation
  const submitRecording = async () => {
    if (!recordedBlobRef.current) return;

    setRecordingState("evaluating");
    setErrorMessage("");

    try {
      // Log video size
      const sizeInBytes = recordedBlobRef.current.size;
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      console.log("📹 Video Recording Complete:");
      console.log(`   Size: ${sizeInBytes} bytes`);
      console.log(`   Size: ${sizeInKB} KB`);
      console.log(`   Size: ${sizeInMB} MB`);

      // Step 1: Upload to Cloudinary via API route
      console.log("📤 Step 1: Uploading to Cloudinary...");
      const videoUrl = await uploadToCloudinary(recordedBlobRef.current);

      // Step 2: Send URL to AI for evaluation
      console.log("🚀 Step 2: Sending to AI for evaluation...");

      const evaluationFormData = new FormData();
      evaluationFormData.append("videoUrl", videoUrl);
      evaluationFormData.append(
        "signDescription",
        signDescription || `${signToPerform}: ${instructions}`
      );
      evaluationFormData.append("referenceVideoUrl", referenceVideoUrl);

      // Add signImages if available
      if (signImages && signImages.length > 0) {
        evaluationFormData.append("signImages", JSON.stringify(signImages));
      }

      formAction(evaluationFormData);
    } catch (error: any) {
      console.error("Error uploading or evaluating sign:", error);
      const errorMsg =
        error?.message ||
        "Failed to upload or evaluate video. Please try again.";
      setErrorMessage(errorMsg);
      setUploadProgress("");
      setRecordingState("recorded"); // Go back to recorded state so user can retry
    }
  };

  // Process action result when it changes
  useEffect(() => {
    if (actionState && recordingState === "evaluating") {
      console.log("✅ AI Evaluation Received:", actionState);

      // Check if it's an error
      if ("error" in actionState) {
        console.error("❌ Evaluation error:", actionState.error);
        setRecordingState("result");
        return;
      }

      // It's a successful evaluation result
      const evaluation = actionState as AIEvaluationResult;
      console.log(`   Accuracy: ${evaluation.accuracy_score}%`);
      console.log(`   Hand Shape: ${evaluation.hand_shape_detected}`);
      console.log(`   Movement: ${evaluation.movement_pattern_detected}`);

      setEvaluationResult(evaluation);
      setRecordingState("result");
    }
  }, [actionState, recordingState]);

  // Try again
  const tryAgain = () => {
    setEvaluationResult(null);
    setErrorMessage("");
    setUploadProgress("");
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
                      {formatTime(recordingTime)} / 5s
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

      {/* Error Message Alert */}
      {errorMessage && (
        <Alert className="bg-red-50 border-4 border-red-400 p-6">
          <XCircle className="h-10 w-10 text-red-600" />
          <AlertDescription className="text-red-900 text-xl md:text-2xl ml-4">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Evaluation Result */}
      {recordingState === "result" && evaluationResult && (
        <div className="space-y-6">
          {/* Accuracy Score Card */}
          <Card
            className={`border-4 ${
              evaluationResult.accuracy_score >= 80
                ? "border-[#6BCF7F] bg-[#6BCF7F]/10"
                : evaluationResult.accuracy_score >= 60
                ? "border-[#FFD93D] bg-[#FFD93D]/10"
                : "border-[#FF7B9C] bg-[#FF7B9C]/10"
            }`}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {evaluationResult.accuracy_score >= 80 ? (
                    <CheckCircle className="h-16 w-16 text-[#6BCF7F]" />
                  ) : evaluationResult.accuracy_score >= 60 ? (
                    <span className="text-6xl">👍</span>
                  ) : (
                    <span className="text-6xl">💪</span>
                  )}
                  <div>
                    <h4 className="text-3xl md:text-4xl font-bold text-[#2D3748] font-[family-name:var(--font-fredoka)]">
                      Accuracy Score
                    </h4>
                    <p className="text-5xl md:text-6xl font-bold text-[#2D3748] mt-2">
                      {evaluationResult.accuracy_score}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Detected Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/80 rounded-2xl p-4 border-2 border-[#58C4F6]">
                  <p className="text-lg font-semibold text-gray-600 mb-1">
                    Hand Shape Detected
                  </p>
                  <p className="text-2xl font-bold text-[#2D3748]">
                    {evaluationResult.hand_shape_detected}
                  </p>
                </div>
                <div className="bg-white/80 rounded-2xl p-4 border-2 border-[#B794F6]">
                  <p className="text-lg font-semibold text-gray-600 mb-1">
                    Movement Pattern
                  </p>
                  <p className="text-2xl font-bold text-[#2D3748]">
                    {evaluationResult.movement_pattern_detected}
                  </p>
                </div>
              </div>

              {/* Critical Feedback */}
              <Alert className="bg-[#58C4F6]/20 border-3 border-[#58C4F6] mb-4">
                <AlertDescription className="text-[#2D3748] text-xl md:text-2xl font-semibold">
                  <strong className="font-bold">🎯 Focus On:</strong>{" "}
                  {evaluationResult.critical_feedback}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Strengths */}
          {evaluationResult.strengths.length > 0 && (
            <Card className="border-4 border-[#6BCF7F] bg-[#6BCF7F]/10">
              <CardContent className="p-8">
                <h4 className="text-3xl font-bold text-[#2D3748] mb-4 font-[family-name:var(--font-fredoka)] flex items-center gap-3">
                  <span className="text-4xl">⭐</span> What You Did Great!
                </h4>
                <ul className="space-y-3">
                  {evaluationResult.strengths.map((strength, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-xl md:text-2xl text-[#2D3748]"
                    >
                      <span className="text-2xl">✅</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Improvements */}
          {evaluationResult.improvements.length > 0 && (
            <Card className="border-4 border-[#FFD93D] bg-[#FFD93D]/10">
              <CardContent className="p-8">
                <h4 className="text-3xl font-bold text-[#2D3748] mb-4 font-[family-name:var(--font-fredoka)] flex items-center gap-3">
                  <span className="text-4xl">💡</span> Ways to Improve
                </h4>
                <div className="space-y-4">
                  {evaluationResult.improvements.map((improvement, index) => {
                    const priorityColors = {
                      critical: "bg-[#FF7B9C] border-[#FF7B9C]",
                      important: "bg-[#FFD93D] border-[#FFD93D]",
                      minor: "bg-[#B794F6] border-[#B794F6]",
                    };
                    const priorityEmoji = {
                      critical: "🔴",
                      important: "🟡",
                      minor: "🔵",
                    };

                    return (
                      <div
                        key={index}
                        className={`p-6 rounded-2xl border-3 ${
                          priorityColors[improvement.priority]
                        }/20 border-${priorityColors[improvement.priority]}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {priorityEmoji[improvement.priority]}
                          </span>
                          <p className="text-xl font-bold text-[#2D3748] capitalize">
                            {improvement.aspect.replace("_", " ")}
                          </p>
                        </div>
                        <p className="text-lg md:text-xl text-gray-700 mb-2">
                          <strong>Issue:</strong> {improvement.issue}
                        </p>
                        <p className="text-lg md:text-xl text-[#2D3748]">
                          <strong>How to Fix:</strong> {improvement.suggestion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Encouragement */}
          <Alert className="bg-gradient-to-r from-[#58C4F6]/20 to-[#B794F6]/20 border-4 border-[#58C4F6] p-8">
            <AlertDescription className="text-[#2D3748] text-2xl md:text-3xl font-semibold text-center">
              <span className="text-4xl mr-3">🌟</span>
              {evaluationResult.encouragement}
            </AlertDescription>
          </Alert>
        </div>
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
          isPending) && (
          <div className="flex items-center gap-4 text-[#2D3748] bg-white px-8 py-6 rounded-full shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#58C4F6]" />
            <span className="text-2xl font-semibold font-[family-name:var(--font-fredoka)]">
              {recordingState === "requesting-permission"
                ? "Requesting camera... 📸"
                : uploadProgress || "Processing... 🤖"}
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
                : `Recording... ${formatTime(recordingTime)}s / 5s ⏺️`}
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
            {evaluationResult.accuracy_score >= 70 ? (
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
