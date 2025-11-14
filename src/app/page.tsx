"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, lessonsData } from "@/lib/data";
import { getProgress } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { speakText, announceButton } from "@/lib/audio";

export default function Home() {
  const [progressData, setProgressData] = useState<
    Record<string, { percentage: number; lastIndex: number }>
  >({});

  useEffect(() => {
    // Load progress for all categories
    const loadProgress = () => {
      const allProgress: Record<
        string,
        { percentage: number; lastIndex: number }
      > = {};
      categories.forEach((category) => {
        const progress = getProgress(category.name);
        allProgress[category.name] = {
          percentage: progress?.completionPercentage || 0,
          lastIndex: progress?.lastCompletedIndex ?? -1,
        };
      });
      setProgressData(allProgress);
    };

    loadProgress();

    // Announce page title for accessibility
    const announceTitle = setTimeout(() => {
      speakText("Welcome to Sign Language Learning! Choose a category to begin your journey.");
    }, 500);

    return () => clearTimeout(announceTitle);
  }, []);

  const handleCardHover = (categoryName: string) => {
    announceButton(`Learn ${categoryName}`, "hover");
  };

  const handleCardClick = (categoryName: string) => {
    announceButton(`Learn ${categoryName}`, "click");
  };

  const handleCardFocus = (categoryName: string) => {
    announceButton(`Learn ${categoryName}`, "focus");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9E6] via-[#FFE8CC] to-[#FFD1B3]">
      {/* Header */}
      <header className="pt-12 pb-8 px-4" role="banner">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6 animate-float">
            <Image
              src="/assets/kweku-ananse-mascot.png"
              alt="Kweku Ananse mascot - friendly learning companion"
              width={180}
              height={180}
              className="drop-shadow-2xl"
              style={{ background: "transparent" }}
              unoptimized
              priority
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#2D3748] mb-4 font-[family-name:var(--font-fredoka)] animate-slide-up">
            Sign Language Learning
          </h1>
          <p className="text-2xl md:text-3xl text-[#58C4F6] font-semibold animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Choose a category to begin your journey! 🌟
          </p>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="px-6 py-12 max-w-7xl mx-auto" role="main">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {categories.map((category, index) => {
            const progress = progressData[category.name];
            const totalLessons = lessonsData[category.name]?.length || 0;
            const isStarted = progress && progress.lastIndex >= 0;
            const isCompleted = progress && progress.percentage === 100;

            return (
              <Link
                key={category.name}
                href={`/lessons/${category.name.toLowerCase()}`}
                onClick={() => handleCardClick(category.name)}
                onMouseEnter={() => handleCardHover(category.name)}
                onFocus={() => handleCardFocus(category.name)}
                aria-label={`Learn ${category.name}. ${isCompleted ? 'Completed' : isStarted ? `${progress.percentage}% complete` : 'Not started'}. Button.`}
                role="button"
                className="focus:outline-none focus:ring-4 focus:ring-primary/50 rounded-[2.5rem]"
              >
                <Card 
                  className="h-full hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer bg-white border-4 border-transparent hover:border-[#58C4F6] shadow-2xl animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8 md:p-10 flex flex-col items-center text-center">
                    {/* Category Icon */}
                    <div className="text-9xl md:text-[10rem] mb-6 animate-bounce-in" style={{ animationDelay: `${index * 0.1 + 0.2}s` }}>
                      {category.emoji}
                    </div>

                    {/* Progress Badge */}
                    <div className="mb-4">
                      {isCompleted ? (
                        <Badge className="bg-[#6BCF7F] hover:bg-[#5abf6f] text-white text-lg px-6 py-2 rounded-full shadow-md">
                          ⭐ Completed!
                        </Badge>
                      ) : isStarted ? (
                        <Badge className="bg-[#58C4F6] hover:bg-[#4ab3e6] text-white text-lg px-6 py-2 rounded-full shadow-md">
                          🚀 {progress.percentage}% Done
                        </Badge>
                      ) : (
                        <Badge className="bg-[#FFD93D] text-[#2D3748] text-lg px-6 py-2 rounded-full shadow-md font-bold">
                          ✨ New!
                        </Badge>
                      )}
                    </div>

                    {/* Category Name */}
                    <h2 className="text-4xl md:text-5xl font-bold text-[#2D3748] mb-3 font-[family-name:var(--font-fredoka)]">
                      {category.name}
                    </h2>

                    {/* Lesson Count */}
                    <p className="text-xl md:text-2xl text-gray-600 mb-6 font-semibold">
                      {totalLessons} fun lessons
                    </p>

                    {/* Progress Bar */}
                    {isStarted && !isCompleted && (
                      <div className="w-full mb-6">
                        <Progress
                          value={progress.percentage}
                          className="h-4"
                        />
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="w-full mt-auto">
                      <div className="w-full py-4 px-8 bg-gradient-to-r from-[#58C4F6] to-[#B794F6] text-white text-center rounded-full font-bold text-xl md:text-2xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95">
                        {isStarted ? "Continue 🎯" : "Start Now! 🚀"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Practice Link */}
        <div className="mt-16 text-center">
          <Link
            href="/practise"
            onClick={() => announceButton("Quick Practice", "click")}
            onMouseEnter={() => announceButton("Quick Practice", "hover")}
            onFocus={() => announceButton("Quick Practice", "focus")}
            className="inline-block px-12 py-5 bg-gradient-to-r from-[#FFD93D] to-[#FF7B9C] text-[#2D3748] font-bold text-2xl rounded-full hover:shadow-2xl transition-all shadow-xl transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#FFD93D]/50"
            aria-label="Quick practice mode. Button."
            role="button"
          >
            🎮 Quick Practice
          </Link>
        </div>
      </main>
    </div>
  );
}
