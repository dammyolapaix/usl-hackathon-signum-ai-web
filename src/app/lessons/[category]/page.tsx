"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  categories,
  lessonsData,
  CategoryName,
  Lesson,
  MultipleChoiceTest,
  PracticalTest,
  LessonItem,
} from "@/lib/data";
import { updateProgress, getProgress } from "@/lib/storage";
import CameraRecorder from "@/components/CameraRecorder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Volume2 } from "lucide-react";

type DisplayMode =
  | "intro"
  | "lesson"
  | "multiple-choice-test"
  | "practical-test"
  | "feedback"
  | "completed";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = params.category as string;
  const categoryName = categoryParam?.toUpperCase() as CategoryName;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("intro");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState<boolean>(false);
  const [score, setScore] = useState(0);
  const [totalTests, setTotalTests] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get lessons for this category
  const lessons = lessonsData[categoryName] || [];
  const currentItem = lessons[currentIndex];
  const progress = ((currentIndex + 1) / lessons.length) * 100;

  // Load progress on mount
  useEffect(() => {
    if (!categoryName || !lessons.length) return;

    const savedProgress = getProgress(categoryName);
    if (savedProgress && savedProgress.lastCompletedIndex >= 0) {
      // Resume from next lesson after last completed
      const resumeIndex = Math.min(
        savedProgress.lastCompletedIndex + 1,
        lessons.length - 1
      );
      setCurrentIndex(resumeIndex);
    }

    // Calculate total tests for scoring
    const testCount = lessons.filter((item) => item.type === "test").length;
    setTotalTests(testCount);

    // Start with intro
    const timer = setTimeout(() => {
      setDisplayMode(getDisplayModeForItem(currentItem));
    }, 3000);

    return () => clearTimeout(timer);
  }, [categoryName]);

  // Determine display mode based on lesson item
  const getDisplayModeForItem = (item: LessonItem): DisplayMode => {
    if (!item) return "completed";
    if (item.type === "lesson") return "lesson";
    if (item.type === "test") {
      return item.testType === "multiple-choice"
        ? "multiple-choice-test"
        : "practical-test";
    }
    return "lesson";
  };

  // Update display mode when current item changes
  useEffect(() => {
    if (displayMode !== "intro" && displayMode !== "feedback") {
      setDisplayMode(getDisplayModeForItem(currentItem));
    }
  }, [currentIndex]);

  // Play audio
  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  // Handle lesson completion
  const handleLessonComplete = () => {
    // Save progress
    updateProgress(categoryName, currentIndex, lessons.length);

    // Move to next lesson
    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setDisplayMode("completed");
    }
  };

  // Handle multiple choice answer
  const handleAnswerSelect = (answer: string) => {
    if (displayMode !== "multiple-choice-test") return;

    const testItem = currentItem as MultipleChoiceTest;
    const correct = answer === testItem.correctAnswer;

    setSelectedAnswer(answer);
    setIsCorrectAnswer(correct);

    if (correct) {
      setScore(score + 1);
    }

    // Save test score
    updateProgress(categoryName, currentIndex, lessons.length, {
      lessonId: testItem.id,
      score: correct ? 1 : 0,
      passed: correct,
    });

    // Show feedback
    setDisplayMode("feedback");

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex < lessons.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer(null);
        setDisplayMode(getDisplayModeForItem(lessons[currentIndex + 1]));
      } else {
        setDisplayMode("completed");
      }
    }, 3000);
  };

  // Handle practical test pass
  const handlePracticalTestPass = () => {
    setScore(score + 1);

    // Save test result
    const testItem = currentItem as PracticalTest;
    updateProgress(categoryName, currentIndex, lessons.length, {
      lessonId: testItem.id,
      score: 1,
      passed: true,
    });

    // Move to next lesson
    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setDisplayMode("completed");
    }
  };

  // Handle practical test skip
  const handlePracticalTestSkip = () => {
    // Save progress without passing
    const testItem = currentItem as PracticalTest;
    updateProgress(categoryName, currentIndex, lessons.length, {
      lessonId: testItem.id,
      score: 0,
      passed: false,
    });

    // Move to next lesson
    if (currentIndex < lessons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setDisplayMode("completed");
    }
  };

  // Go back to home
  const handleBackToHome = () => {
    router.push("/");
  };

  // Restart category
  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setDisplayMode("intro");
    setTimeout(() => {
      setDisplayMode(getDisplayModeForItem(lessons[0]));
    }, 3000);
  };

  // Validate category
  if (!categoryName || !lessons.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a4d4d] to-[#0d2626] flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={handleBackToHome}>Go Back Home</Button>
        </div>
      </div>
    );
  }

  const categoryInfo = categories.find((cat) => cat.name === categoryName);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d4d] to-[#0d2626] flex flex-col">
      {/* Intro Screen */}
      {displayMode === "intro" && (
        <div className="fixed inset-0 bg-gradient-to-b from-[#1a4d4d] to-[#0d2626] flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            <div className="animate-bounce-in mb-8">
              <div className="text-9xl">{categoryInfo?.emoji}</div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 animate-slide-up">
              {categoryName}
            </h1>
            <p className="text-2xl text-[#FFD700] animate-slide-up">
              Get ready to learn...
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {displayMode !== "intro" && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-800">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={handleBackToHome}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Progress bar container */}
            <div className="flex-1 mx-4 h-4 bg-gray-700 rounded-full overflow-hidden relative">
              <div
                className="h-full transition-all duration-500 ease-out relative"
                style={{
                  width: `${progress}%`,
                  background:
                    "repeating-linear-gradient(90deg, #DC143C 0px, #DC143C 10px, #FFD700 10px, #FFD700 20px, #228B22 20px, #228B22 30px, #000000 30px, #000000 40px)",
                }}
              ></div>
            </div>

            {/* Mascot indicator with lesson count */}
            <div className="flex items-center gap-2">
              <Image
                src="/assets/kweku-ananse-mascot.png"
                alt="Kweku Ananse"
                width={32}
                height={32}
                className="object-contain"
                style={{ background: "transparent" }}
                unoptimized
              />
              <span className="text-[#FFD700] font-bold text-lg">
                {currentIndex + 1}/{lessons.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {displayMode !== "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
          <div className="w-full max-w-2xl">
            {/* Lesson Display */}
            {displayMode === "lesson" && (
              <div className="space-y-6 animate-fade-in">
                <Card className="bg-white rounded-3xl shadow-2xl">
                  <CardContent className="p-8">
                    {/* Media container */}
                    <div className="flex flex-col items-center justify-center mb-6">
                      {(currentItem as Lesson).mediaType === "video" ? (
                        <video
                          key={(currentItem as Lesson).mediaSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full max-w-md h-64 object-contain rounded-xl bg-gray-100"
                        >
                          <source
                            src={(currentItem as Lesson).mediaSrc}
                            type="video/mp4"
                          />
                        </video>
                      ) : (
                        <div className="relative w-full max-w-md h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                          <Image
                            src={(currentItem as Lesson).mediaSrc}
                            alt={(currentItem as Lesson).title}
                            width={400}
                            height={300}
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
                      {(currentItem as Lesson).title}
                    </h2>

                    {/* Description */}
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {(currentItem as Lesson).description}
                    </p>

                    {/* Audio button (hidden audio) */}
                    <audio
                      ref={audioRef}
                      src="/assets/audio.wav"
                      preload="auto"
                    />
                  </CardContent>
                </Card>

                {/* Continue button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleLessonComplete}
                    size="lg"
                    className="bg-[#87d92e] hover:bg-[#78c226] text-white px-12 py-6 text-xl rounded-full shadow-xl"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Multiple Choice Test */}
            {displayMode === "multiple-choice-test" && (
              <div className="space-y-6 animate-fade-in">
                <Card className="bg-white rounded-3xl shadow-2xl">
                  <CardContent className="p-8">
                    {/* Media if available */}
                    {(currentItem as MultipleChoiceTest).mediaSrc && (
                      <div className="flex flex-col items-center justify-center mb-6">
                        {(currentItem as MultipleChoiceTest).mediaType ===
                        "video" ? (
                          <video
                            key={(currentItem as MultipleChoiceTest).mediaSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full max-w-md h-64 object-contain rounded-xl bg-gray-100"
                          >
                            <source
                              src={(currentItem as MultipleChoiceTest).mediaSrc}
                              type="video/mp4"
                            />
                          </video>
                        ) : (
                          <div className="relative w-full max-w-md h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                            <Image
                              src={(currentItem as MultipleChoiceTest).mediaSrc!}
                              alt="Test question"
                              width={400}
                              height={300}
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <button
                        onClick={playAudio}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1cb0f6] hover:bg-[#1899d6] active:scale-95 transition-all"
                      >
                        <Volume2 className="w-6 h-6 text-white" />
                      </button>
                      <p className="text-xl font-bold text-gray-800">
                        {(currentItem as MultipleChoiceTest).question}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Answer options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(currentItem as MultipleChoiceTest).options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className="group relative p-6 bg-white rounded-2xl text-lg font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-lg border-2 border-gray-200 hover:border-[#1cb0f6]"
                    >
                      <span className="relative z-10">{option}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Practical Test */}
            {displayMode === "practical-test" && (
              <div className="animate-fade-in">
                <CameraRecorder
                  signToPerform={(currentItem as PracticalTest).signToPerform}
                  instructions={(currentItem as PracticalTest).instructions}
                  hints={(currentItem as PracticalTest).hints}
                  onPass={handlePracticalTestPass}
                  onSkip={handlePracticalTestSkip}
                />
              </div>
            )}

            {/* Feedback Screen */}
            {displayMode === "feedback" && (
              <div className="fixed inset-0 bg-gradient-to-b from-[#1a4d4d] to-[#0d2626] flex items-center justify-center z-50 animate-fade-in">
                <div className="text-center px-4">
                  <div className="animate-bounce-in">
                    <video
                      key={isCorrectAnswer ? "celebrate" : "sad"}
                      autoPlay
                      muted
                      playsInline
                      className="mx-auto drop-shadow-2xl w-[300px] h-[300px] object-contain"
                    >
                      <source
                        src={
                          isCorrectAnswer
                            ? "/assets/kweku-ananse-mascot-celebrate.mp4"
                            : "/assets/kweku-ananse-mascot-sad.mp4"
                        }
                        type="video/mp4"
                      />
                    </video>
                  </div>
                  <div className="mt-8 animate-slide-up">
                    {isCorrectAnswer ? (
                      <>
                        <h2 className="text-5xl font-bold text-[#87d92e] mb-4">
                          Excellent! 🎉
                        </h2>
                        <p className="text-2xl text-white">You got it right!</p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-4xl font-bold text-[#FFD700] mb-4">
                          Keep Going!
                        </h2>
                        <p className="text-xl text-white">
                          The correct answer was:{" "}
                          {(currentItem as MultipleChoiceTest).correctAnswer}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Completed Screen */}
            {displayMode === "completed" && (
              <div className="text-center text-white animate-fade-in">
                <Card className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl">
                  <CardContent className="p-8">
                    <div className="mb-8 animate-bounce-in">
                      <Image
                        src="/assets/kweku-ananse-mascot.png"
                        alt="Kweku Ananse"
                        width={200}
                        height={200}
                        className="mx-auto drop-shadow-2xl"
                        style={{ background: "transparent" }}
                        unoptimized
                      />
                    </div>

                    <h1 className="text-5xl font-bold mb-4 text-[#FFD700] animate-slide-up">
                      Amazing Work! 🎉
                    </h1>

                    <div className="my-8 p-6 bg-white/20 rounded-2xl animate-slide-up">
                      <p className="text-lg text-gray-200 mb-2">
                        Category Completed
                      </p>
                      <p className="text-3xl font-bold text-white mb-4">
                        {categoryName}
                      </p>
                      {totalTests > 0 && (
                        <>
                          <p className="text-lg text-gray-200 mb-2">
                            Test Score
                          </p>
                          <p className="text-6xl font-bold text-[#87d92e]">
                            {score} / {totalTests}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={handleRestart}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-xl rounded-full shadow-xl"
                      >
                        Practice Again
                      </Button>
                      <Button
                        onClick={handleBackToHome}
                        size="lg"
                        className="bg-[#87d92e] hover:bg-[#78c226] text-white px-8 py-6 text-xl rounded-full shadow-xl"
                      >
                        Choose Another Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

