"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, lessonsData } from "@/lib/data";
import { getProgress } from "@/lib/storage";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a4d4d] to-[#0d2626]">
      {/* Header */}
      <header className="pt-8 pb-4 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/assets/kweku-ananse-mascot.png"
              alt="Kweku Ananse"
              width={120}
              height={120}
              className="drop-shadow-2xl"
              style={{ background: "transparent" }}
              unoptimized
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Sign Language Learning
          </h1>
          <p className="text-lg md:text-xl text-[#FFD700]">
            Choose a category to begin your journey
          </p>
        </div>
      </header>

      {/* Categories Grid */}
      <main className="px-4 py-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const progress = progressData[category.name];
            const totalLessons = lessonsData[category.name]?.length || 0;
            const isStarted = progress && progress.lastIndex >= 0;
            const isCompleted = progress && progress.percentage === 100;

            return (
              <Link
                key={category.name}
                href={`/lessons/${category.name.toLowerCase()}`}
              >
                <Card className="h-full hover:scale-105 transition-transform duration-300 cursor-pointer bg-white/95 backdrop-blur-sm border-2 hover:border-[#FFD700] shadow-xl">
                  <CardContent className="p-6">
                    {/* Category Icon and Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-6xl">{category.emoji}</div>
                      {isCompleted ? (
                        <Badge className="bg-green-500 hover:bg-green-600">
                          Completed
                        </Badge>
                      ) : isStarted ? (
                        <Badge className="bg-blue-500 hover:bg-blue-600">
                          In Progress
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Started</Badge>
                      )}
                    </div>

                    {/* Category Name */}
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {category.name}
                    </h2>

                    {/* Lesson Count */}
                    <p className="text-sm text-gray-600 mb-4">
                      {totalLessons} lessons
                    </p>

                    {/* Progress Bar */}
                    {isStarted && (
                      <div className="space-y-2">
                        <Progress
                          value={progress.percentage}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-600 text-right">
                          {progress.percentage}% complete
                        </p>
                      </div>
                    )}

                    {/* Continue or Start Button */}
                    <div className="mt-4">
                      <div className="w-full py-2 px-4 bg-gradient-to-r from-[#1a4d4d] to-[#0d2626] text-white text-center rounded-lg font-semibold hover:opacity-90 transition-opacity">
                        {isStarted ? "Continue Learning" : "Start Learning"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Practice Link */}
        <div className="mt-12 text-center">
          <Link
            href="/practise"
            className="inline-block px-8 py-3 bg-[#FFD700] text-gray-900 font-bold rounded-full hover:bg-yellow-400 transition-colors shadow-lg"
          >
            Quick Practice (Old Version)
          </Link>
        </div>
      </main>
    </div>
  );
}
