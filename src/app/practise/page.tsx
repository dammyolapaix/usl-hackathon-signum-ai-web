"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

// TypeScript interfaces
interface Question {
  id: number;
  mediaType: "video" | "image";
  mediaSrc: string;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

type GameState = "intro" | "playing" | "feedback" | "completed";

export default function PractisePage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>("intro");
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Show intro screen for 5 seconds
  useEffect(() => {
    if (gameState === "intro") {
      const timer = setTimeout(() => {
        setGameState("playing");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Mock questions data using available assets
  const questions: Question[] = [
    {
      id: 1,
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      prompt: "What sign is being shown?",
      correctAnswer: "Hello",
      options: ["Hello", "Thank you", "Please", "Goodbye"],
    },
    {
      id: 2,
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_open_hand.png",
      prompt: "What does this hand sign mean?",
      correctAnswer: "Open Hand",
      options: ["Open Hand", "Closed Fist", "Curved Hand", "Flat Hand"],
    },
    {
      id: 3,
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      prompt: "Identify this sign",
      correctAnswer: "Yes",
      options: ["Yes", "No", "Maybe", "Stop"],
    },
    {
      id: 4,
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_curved_hand.png",
      prompt: "What hand shape is this?",
      correctAnswer: "Curved Hand",
      options: ["Bent Hand", "Curved Hand", "Clawed Hand", "Flat Hand"],
    },
    {
      id: 5,
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input2.mp4",
      prompt: "What is this sign?",
      correctAnswer: "Water",
      options: ["Water", "Food", "Help", "Friend"],
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (gameState !== "playing") return;

    setSelectedAnswer(answer);
    const correct = answer === currentQuestion.correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }

    setGameState("feedback");

    // Auto-advance after delay
    const delay = 8000;
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setGameState("playing");
      } else {
        setGameState("completed");
      }
    }, delay);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameState("intro");
    setSelectedAnswer(null);
    setIsCorrect(false);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#1a4d4d] to-[#0d2626] flex flex-col">
      {/* Intro Screen */}
      {gameState === "intro" && (
        <div className="fixed inset-0 bg-linear-to-b from-[#1a4d4d] to-[#0d2626] flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            <div className="animate-bounce-in">
              <Image
                src="/assets/kweku-ananse-mascot.png"
                alt="Kweku Ananse"
                width={400}
                height={400}
                className="mx-auto drop-shadow-2xl"
                style={{ background: "transparent" }}
                unoptimized
              />
            </div>
            <h1 className="text-5xl font-bold text-white mt-8 animate-slide-up">
              Welcome to Sign Language Practice!
            </h1>
            <p className="text-2xl text-[#FFD700] mt-4 animate-slide-up">
              Get ready to learn...
            </p>
          </div>
        </div>
      )}

      {/* Progress bar with Kente colors */}
      {gameState !== "intro" && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-800">
          <div className="flex items-center justify-between px-4 py-2">
            <button
              onClick={() => window.history.back()}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>

            {/* Progress bar container */}
            <div className="flex-1 mx-4 h-4 bg-gray-700 rounded-full overflow-hidden relative">
              {/* Kente stripe pattern background */}
              <div
                className="h-full transition-all duration-500 ease-out relative"
                style={{
                  width: `${progress}%`,
                  background:
                    "repeating-linear-gradient(90deg, #DC143C 0px, #DC143C 10px, #FFD700 10px, #FFD700 20px, #228B22 20px, #228B22 30px, #000000 30px, #000000 40px)",
                }}
              ></div>
            </div>

            {/* Mascot indicator with question count */}
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
              <span className="text-[#FF6B6B] font-bold text-lg">
                {currentQuestionIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {gameState !== "intro" && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
          <div className="w-full max-w-2xl">
            {gameState === "playing" && (
              <>
                {/* Question display */}
                <div className="mb-8 bg-white rounded-3xl p-8 shadow-2xl">
                  {/* Media container */}
                  <div className="flex flex-col items-center justify-center mb-6">
                    {currentQuestion.mediaType === "video" ? (
                      <video
                        key={currentQuestion.mediaSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full max-w-md h-64 object-contain rounded-xl bg-gray-100"
                      >
                        <source
                          src={currentQuestion.mediaSrc}
                          type="video/mp4"
                        />
                      </video>
                    ) : (
                      <div className="relative w-full max-w-md h-64 flex items-center justify-center bg-gray-100 rounded-xl">
                        <Image
                          src={currentQuestion.mediaSrc}
                          alt="Sign language gesture"
                          width={400}
                          height={300}
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>

                  {/* Prompt with audio icon */}
                  <div className="flex items-center justify-center gap-3 mb-6">
                    <button
                      onClick={playAudio}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1cb0f6] hover:bg-[#1899d6] active:scale-95 transition-all"
                      aria-label="Play audio"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    </button>
                    <p className="text-xl font-bold text-gray-800">
                      {currentQuestion.prompt}
                    </p>
                  </div>

                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    src="/assets/audio.wav"
                    preload="auto"
                  />
                </div>

                {/* Answer options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentQuestion?.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      className="group relative p-6 bg-white rounded-2xl text-lg font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-lg border-2 border-gray-200 hover:border-[#1cb0f6]"
                    >
                      <span className="relative z-10">{option}</span>
                      {/* Subtle shadow effect on hover */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-linear-to-br from-blue-50 to-transparent"></div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {gameState === "feedback" && (
              <div className="fixed inset-0 bg-linear-to-b from-[#1a4d4d] to-[#0d2626] flex items-center justify-center z-50 animate-fade-in">
                {/* Feedback overlay with mascot */}
                <div className="text-center px-4">
                  <div className="animate-bounce-in">
                    <video
                      key={isCorrect ? "celebrate" : "sad"}
                      autoPlay
                      muted
                      playsInline
                      className="mx-auto drop-shadow-2xl w-[300px] h-[300px] object-contain"
                    >
                      <source
                        src={
                          isCorrect
                            ? "/assets/kweku-ananse-mascot-celebrate.mp4"
                            : "/assets/kweku-ananse-mascot-sad.mp4"
                        }
                        type="video/mp4"
                      />
                    </video>
                  </div>
                  <div className="mt-8 animate-slide-up">
                    {isCorrect ? (
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
                        <p className="text-xl text-white">Try the next one!</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {gameState === "completed" && (
              <div className="text-center text-white animate-fade-in">
                {/* Final score screen */}
                <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
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

                  <div className="my-8 p-6 bg-white bg-opacity-20 rounded-2xl animate-slide-up">
                    <p className="text-lg text-gray-200 mb-2">Your Score</p>
                    <p className="text-6xl font-bold text-[#87d92e]">
                      {score} / {questions.length}
                    </p>
                    <div className="mt-4">
                      {score === questions.length ? (
                        <p className="text-xl text-[#FFD700]">
                          Perfect Score! 🌟
                        </p>
                      ) : score >= questions.length * 0.8 ? (
                        <p className="text-xl text-[#87d92e]">Great Job! 👏</p>
                      ) : score >= questions.length * 0.6 ? (
                        <p className="text-xl text-blue-300">Good Effort! 💪</p>
                      ) : (
                        <p className="text-xl text-yellow-300">
                          Keep Practicing! 📚
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleRestart}
                    className="px-12 py-4 bg-[#87d92e] text-white text-xl font-bold rounded-full hover:bg-[#78c226] transition-all transform hover:scale-110 active:scale-95 shadow-xl animate-slide-up"
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
