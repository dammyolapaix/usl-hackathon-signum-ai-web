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
import { speakText, announceButton } from "@/lib/audio";

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
      // Announce success for screen readers
      speakText("Excellent! You got it right!", undefined, "high");
    } else {
      // Announce encouragement and correct answer for screen readers
      speakText(`Keep going! The correct answer was ${testItem.correctAnswer}`, undefined, "high");
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
        speakText(`Amazing work! You completed ${categoryName}`, undefined, "high");
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

  // Announce content for screen readers when lesson changes
  useEffect(() => {
    if (displayMode === "lesson" && currentItem && currentItem.type === "lesson") {
      const lessonItem = currentItem as Lesson;
      speakText(`Lesson: ${lessonItem.title}. ${lessonItem.description}`);
    } else if (displayMode === "multiple-choice-test" && currentItem) {
      const testItem = currentItem as MultipleChoiceTest;
      speakText(`Quiz question: ${testItem.question}`);
    } else if (displayMode === "practical-test" && currentItem) {
      const testItem = currentItem as PracticalTest;
      speakText(`Practical test: ${testItem.signToPerform}. ${testItem.instructions}`);
    }
  }, [displayMode, currentIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9E6] via-[#FFE8CC] to-[#FFD1B3] flex flex-col">
      {/* Intro Screen */}
      {displayMode === "intro" && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#58C4F6] via-[#B794F6] to-[#FF7B9C] flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center px-4">
            <div className="animate-bounce-in mb-8">
              <div className="text-[12rem] md:text-[15rem] drop-shadow-2xl">{categoryInfo?.emoji}</div>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 animate-slide-up font-[family-name:var(--font-fredoka)] drop-shadow-lg">
              {categoryName}
            </h1>
            <p className="text-3xl md:text-4xl text-white animate-slide-up font-semibold drop-shadow-md">
              Get ready to learn! 🌟
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {displayMode !== "intro" && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white shadow-lg border-b-4 border-[#58C4F6]">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => {
                announceButton("Go back to home", "click");
                handleBackToHome();
              }}
              onMouseEnter={() => announceButton("Go back to home", "hover")}
              onFocus={() => announceButton("Go back to home", "focus")}
              className="text-[#58C4F6] hover:text-[#4ab3e6] transition-colors p-2 rounded-full hover:bg-[#58C4F6]/10 focus:outline-none focus:ring-4 focus:ring-[#58C4F6]/30"
              aria-label="Go back to home. Button."
            >
              <ArrowLeft className="w-10 h-10" />
            </button>

            {/* Progress bar container - Chunky and colorful */}
            <div className="flex-1 mx-6 h-8 bg-gray-200 rounded-full overflow-hidden relative shadow-inner border-4 border-gray-300">
              <div
                className="h-full transition-all duration-500 ease-out relative shadow-md"
                style={{
                  width: `${progress}%`,
                  background:
                    "repeating-linear-gradient(90deg, #DC143C 0px, #DC143C 15px, #FFD700 15px, #FFD700 30px, #228B22 30px, #228B22 45px, #000000 45px, #000000 60px)",
                }}
              ></div>
            </div>

            {/* Mascot indicator with lesson count */}
            <div className="flex items-center gap-3 bg-[#FFD93D] px-4 py-2 rounded-full shadow-lg">
              <Image
                src="/assets/kweku-ananse-mascot.png"
                alt="Kweku Ananse mascot"
                width={40}
                height={40}
                className="object-contain animate-float"
                style={{ background: "transparent" }}
                unoptimized
              />
              <span className="text-[#2D3748] font-bold text-2xl font-[family-name:var(--font-fredoka)]">
                {currentIndex + 1}/{lessons.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {displayMode !== "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 pt-28">
          <div className="w-full max-w-4xl">
            {/* Lesson Display */}
            {displayMode === "lesson" && (
              <div className="space-y-8 animate-fade-in" role="article" aria-live="polite">
                <Card className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-[#58C4F6]">
                  <CardContent className="p-10 md:p-12">
                    {/* Media container */}
                    <div className="flex flex-col items-center justify-center mb-8">
                      {(currentItem as Lesson).mediaType === "video" ? (
                        <video
                          key={(currentItem as Lesson).mediaSrc}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full max-w-2xl h-80 md:h-96 object-contain rounded-3xl bg-gradient-to-br from-[#E3F2FD] to-[#F3E5F5] shadow-xl border-4 border-[#B794F6]"
                          aria-label={`Video demonstration of ${(currentItem as Lesson).title}`}
                        >
                          <source
                            src={(currentItem as Lesson).mediaSrc}
                            type="video/mp4"
                          />
                        </video>
                      ) : (
                        <div className="relative w-full max-w-2xl h-80 md:h-96 flex items-center justify-center bg-gradient-to-br from-[#E3F2FD] to-[#F3E5F5] rounded-3xl shadow-xl border-4 border-[#B794F6]">
                          <Image
                            src={(currentItem as Lesson).mediaSrc}
                            alt={`Sign language demonstration for ${(currentItem as Lesson).title}`}
                            width={600}
                            height={450}
                            className="object-contain"
                          />
                        </div>
                      )}
                      
                      {/* Replay audio button */}
                      <button
                        onClick={() => {
                          announceButton("Replay lesson", "click");
                          const lessonItem = currentItem as Lesson;
                          speakText(`${lessonItem.title}. ${lessonItem.description}`);
                        }}
                        onMouseEnter={() => announceButton("Replay lesson", "hover")}
                        onFocus={() => announceButton("Replay lesson", "focus")}
                        className="mt-6 flex items-center gap-3 px-8 py-4 bg-[#58C4F6] hover:bg-[#4ab3e6] text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#58C4F6]/50"
                        aria-label="Replay lesson audio. Button."
                      >
                        <Volume2 className="w-8 h-8" />
                        <span className="text-2xl font-bold font-[family-name:var(--font-fredoka)]">Play Audio</span>
                      </button>
                    </div>

                    {/* Title */}
                    <h2 className="text-5xl md:text-6xl font-bold text-[#2D3748] mb-6 text-center font-[family-name:var(--font-fredoka)]">
                      {(currentItem as Lesson).title}
                    </h2>

                    {/* Description */}
                    <p className="text-2xl md:text-3xl text-gray-700 leading-relaxed text-center">
                      {(currentItem as Lesson).description}
                    </p>

                    {/* Hidden audio element */}
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
                    onClick={() => {
                      announceButton("Continue to next lesson", "click");
                      handleLessonComplete();
                    }}
                    onMouseEnter={() => announceButton("Continue to next lesson", "hover")}
                    onFocus={() => announceButton("Continue to next lesson", "focus")}
                    size="xl"
                    variant="success"
                    className="animate-pulse-scale"
                    aria-label="Continue to next lesson. Button."
                  >
                    Continue 🚀
                  </Button>
                </div>
              </div>
            )}

            {/* Multiple Choice Test */}
            {displayMode === "multiple-choice-test" && (
              <div className="space-y-8 animate-fade-in" role="article" aria-live="polite">
                <Card className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-[#FFD93D]">
                  <CardContent className="p-10 md:p-12">
                    {/* Media if available */}
                    {(currentItem as MultipleChoiceTest).mediaSrc && (
                      <div className="flex flex-col items-center justify-center mb-8">
                        {(currentItem as MultipleChoiceTest).mediaType ===
                        "video" ? (
                          <video
                            key={(currentItem as MultipleChoiceTest).mediaSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full max-w-2xl h-80 md:h-96 object-contain rounded-3xl bg-gradient-to-br from-[#FFF9E6] to-[#FFE8CC] shadow-xl border-4 border-[#FFD93D]"
                            aria-label="Quiz video question"
                          >
                            <source
                              src={(currentItem as MultipleChoiceTest).mediaSrc}
                              type="video/mp4"
                            />
                          </video>
                        ) : (
                          <div className="relative w-full max-w-2xl h-80 md:h-96 flex items-center justify-center bg-gradient-to-br from-[#FFF9E6] to-[#FFE8CC] rounded-3xl shadow-xl border-4 border-[#FFD93D]">
                            <Image
                              src={(currentItem as MultipleChoiceTest).mediaSrc!}
                              alt="Quiz image question"
                              width={600}
                              height={450}
                              className="object-contain"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Question */}
                    <div className="flex flex-col items-center justify-center gap-6 mb-8">
                      <button
                        onClick={() => {
                          announceButton("Replay question", "click");
                          const testItem = currentItem as MultipleChoiceTest;
                          speakText(`Quiz question: ${testItem.question}`);
                        }}
                        onMouseEnter={() => announceButton("Replay question", "hover")}
                        onFocus={() => announceButton("Replay question", "focus")}
                        className="flex items-center justify-center w-20 h-20 rounded-full bg-[#58C4F6] hover:bg-[#4ab3e6] active:scale-95 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-[#58C4F6]/50"
                        aria-label="Replay question audio. Button."
                      >
                        <Volume2 className="w-10 h-10 text-white" />
                      </button>
                      <p className="text-3xl md:text-4xl font-bold text-[#2D3748] text-center font-[family-name:var(--font-fredoka)]">
                        {(currentItem as MultipleChoiceTest).question}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Answer options - Colorful and large */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8" role="group" aria-label="Answer choices">
                  {(currentItem as MultipleChoiceTest).options.map((option, index) => {
                    const colors = [
                      { bg: "bg-[#58C4F6]", hover: "hover:bg-[#4ab3e6]", border: "border-[#58C4F6]" },
                      { bg: "bg-[#6BCF7F]", hover: "hover:bg-[#5abf6f]", border: "border-[#6BCF7F]" },
                      { bg: "bg-[#FFD93D]", hover: "hover:bg-[#ffc933]", border: "border-[#FFD93D]" },
                      { bg: "bg-[#B794F6]", hover: "hover:bg-[#a684e6]", border: "border-[#B794F6]" }
                    ];
                    const color = colors[index % colors.length];
                    
                    return (
                      <button
                        key={option}
                        onClick={() => {
                          announceButton(`Select answer ${option}`, "click");
                          handleAnswerSelect(option);
                        }}
                        onMouseEnter={() => announceButton(`Answer option ${option}`, "hover")}
                        onFocus={() => announceButton(`Answer option ${option}`, "focus")}
                        className={`group relative p-8 md:p-10 ${color.bg} ${color.hover} text-white rounded-3xl text-2xl md:text-3xl font-bold transition-all transform hover:scale-105 active:scale-95 shadow-2xl hover:shadow-3xl border-4 ${color.border} focus:outline-none focus:ring-4 focus:ring-white/50`}
                        aria-label={`Answer option: ${option}. Button.`}
                      >
                        <span className="relative z-10 font-[family-name:var(--font-fredoka)]">{option}</span>
                      </button>
                    );
                  })}
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
              <div className="fixed inset-0 bg-gradient-to-br from-[#58C4F6] via-[#B794F6] to-[#FF7B9C] flex items-center justify-center z-50 animate-fade-in overflow-hidden">
                {/* Confetti animation */}
                {isCorrectAnswer && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-4 h-4 animate-confetti"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `-${Math.random() * 20}%`,
                          backgroundColor: ['#FFD93D', '#58C4F6', '#6BCF7F', '#B794F6', '#FF7B9C'][Math.floor(Math.random() * 5)],
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${3 + Math.random() * 2}s`,
                          borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                        }}
                      />
                    ))}
                  </div>
                )}
                
                <div className="text-center px-6 z-10" role="alert" aria-live="assertive">
                  <div className="animate-bounce-in">
                    <video
                      key={isCorrectAnswer ? "celebrate" : "sad"}
                      autoPlay
                      muted
                      playsInline
                      className="mx-auto drop-shadow-2xl w-[400px] h-[400px] md:w-[500px] md:h-[500px] object-contain"
                      aria-hidden="true"
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
                  <div className="mt-12 animate-slide-up">
                    {isCorrectAnswer ? (
                      <>
                        <h2 className="text-7xl md:text-8xl font-bold text-white mb-6 font-[family-name:var(--font-fredoka)] drop-shadow-lg">
                          Excellent! 🎉
                        </h2>
                        <p className="text-4xl md:text-5xl text-white font-semibold drop-shadow-md">
                          You got it right!
                        </p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-6xl md:text-7xl font-bold text-[#FFD93D] mb-6 font-[family-name:var(--font-fredoka)] drop-shadow-lg">
                          Keep Going! 💪
                        </h2>
                        <p className="text-3xl md:text-4xl text-white mb-4 font-semibold drop-shadow-md">
                          The correct answer was:
                        </p>
                        <p className="text-4xl md:text-5xl text-white font-bold drop-shadow-md">
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
              <div className="text-center text-white animate-fade-in" role="alert" aria-live="polite">
                {/* Confetti celebration */}
                <div className="fixed inset-0 pointer-events-none z-0">
                  {[...Array(60)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-6 h-6 animate-confetti"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `-${Math.random() * 20}%`,
                        backgroundColor: ['#FFD93D', '#58C4F6', '#6BCF7F', '#B794F6', '#FF7B9C'][Math.floor(Math.random() * 5)],
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${4 + Math.random() * 3}s`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                      }}
                    />
                  ))}
                </div>

                <Card className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-[#6BCF7F] relative z-10">
                  <CardContent className="p-12 md:p-16">
                    <div className="mb-10 animate-bounce-in">
                      <Image
                        src="/assets/kweku-ananse-mascot.png"
                        alt="Kweku Ananse celebrating"
                        width={280}
                        height={280}
                        className="mx-auto drop-shadow-2xl animate-float"
                        style={{ background: "transparent" }}
                        unoptimized
                      />
                    </div>

                    <h1 className="text-6xl md:text-8xl font-bold mb-8 text-[#2D3748] animate-slide-up font-[family-name:var(--font-fredoka)]">
                      Amazing Work! 🎉
                    </h1>

                    <div className="my-10 p-10 bg-gradient-to-br from-[#FFD93D] to-[#FF7B9C] rounded-3xl animate-slide-up shadow-xl">
                      <p className="text-2xl text-white mb-3 font-semibold">
                        Category Completed
                      </p>
                      <p className="text-5xl md:text-6xl font-bold text-white mb-8">
                        {categoryName}
                      </p>
                      {totalTests > 0 && (
                        <>
                          <p className="text-2xl text-white mb-4 font-semibold">
                            Test Score
                          </p>
                          <p className="text-8xl md:text-9xl font-bold text-white drop-shadow-lg">
                            {score} / {totalTests}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                      <Button
                        onClick={() => {
                          announceButton("Practice this category again", "click");
                          handleRestart();
                        }}
                        onMouseEnter={() => announceButton("Practice this category again", "hover")}
                        onFocus={() => announceButton("Practice this category again", "focus")}
                        size="xl"
                        variant="default"
                        aria-label="Practice this category again. Button."
                      >
                        Practice Again 🔄
                      </Button>
                      <Button
                        onClick={() => {
                          announceButton("Choose another category", "click");
                          handleBackToHome();
                        }}
                        onMouseEnter={() => announceButton("Choose another category", "hover")}
                        onFocus={() => announceButton("Choose another category", "focus")}
                        size="xl"
                        variant="success"
                        aria-label="Go back to home and choose another category. Button."
                      >
                        Choose Another 🏠
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

