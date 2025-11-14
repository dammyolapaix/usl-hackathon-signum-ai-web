"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ananseStory } from "@/lib/data";
import { speakText, announceButton } from "@/lib/audio";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StoryPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Announce page title for accessibility
    const announceTitle = setTimeout(() => {
      speakText(
        "Story Time with Kweku Ananse! Watch and learn about the clever spider from Ghana."
      );
    }, 500);

    return () => clearTimeout(announceTitle);
  }, []);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        announceButton("Pause story", "click");
      } else {
        videoRef.current.play();
        announceButton("Play story", "click");
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowCelebration(true);
    speakText("Great job watching the story! You're amazing!");

    // Hide celebration after 3 seconds
    setTimeout(() => {
      setShowCelebration(false);
    }, 3000);
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setShowCelebration(false);
      announceButton("Restart story", "click");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9E6] via-[#FFE8CC] to-[#FFD1B3] py-8 px-4">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-8" role="banner">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            onClick={() => announceButton("Back to Home", "click")}
            onMouseEnter={() => announceButton("Back to Home", "hover")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2D3748] font-bold text-lg rounded-full hover:shadow-lg transition-all shadow-md transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50"
            aria-label="Back to Home. Button."
          >
            <span className="text-2xl">🏠</span>
            <span>Home</span>
          </Link>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-4 animate-float">
            <Image
              src="/assets/kweku-ananse-mascot.png"
              alt="Kweku Ananse mascot - your storytelling companion"
              width={140}
              height={140}
              className="drop-shadow-2xl"
              style={{ background: "transparent" }}
              unoptimized
              priority
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-[#2D3748] mb-3 font-[family-name:var(--font-fredoka)] animate-slide-up">
            📖 Story Time with Kweku Ananse
          </h1>
          <p className="text-xl md:text-2xl text-[#58C4F6] font-semibold animate-slide-up">
            Learn about the clever spider from Ghana! 🕷️✨
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto" role="main">
        <Card className="bg-white border-4 border-[#58C4F6] shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              <video
                ref={videoRef}
                src={ananseStory}
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleVideoEnd}
                aria-label="Kweku Ananse story video"
              >
                Your browser does not support the video tag.
              </video>

              {/* Celebration Overlay */}
              {showCelebration && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-fade-in">
                  <div className="text-center">
                    <div className="text-9xl mb-4 animate-bounce">🎉</div>
                    <p className="text-4xl font-bold text-white font-[family-name:var(--font-fredoka)]">
                      Great Job!
                    </p>
                    <p className="text-2xl text-white mt-2">
                      You watched the whole story! ⭐
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="p-6 md:p-8 bg-gradient-to-r from-[#58C4F6]/10 to-[#B794F6]/10">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handlePlayPause}
                  onMouseEnter={() =>
                    announceButton(isPlaying ? "Pause" : "Play", "hover")
                  }
                  className="w-full sm:w-auto px-8 py-6 text-xl md:text-2xl font-bold rounded-full bg-gradient-to-r from-[#58C4F6] to-[#B794F6] hover:shadow-2xl transition-all shadow-lg transform hover:scale-105 active:scale-95"
                  aria-label={
                    isPlaying ? "Pause story. Button." : "Play story. Button."
                  }
                >
                  <span className="mr-2 text-2xl">
                    {isPlaying ? "⏸️" : "▶️"}
                  </span>
                  {isPlaying ? "Pause" : "Play Story"}
                </Button>

                <Button
                  onClick={handleRestart}
                  onMouseEnter={() => announceButton("Restart", "hover")}
                  className="w-full sm:w-auto px-8 py-6 text-xl md:text-2xl font-bold rounded-full bg-gradient-to-r from-[#FFD93D] to-[#FF7B9C] hover:shadow-2xl transition-all shadow-lg transform hover:scale-105 active:scale-95"
                  aria-label="Restart story from beginning. Button."
                >
                  <span className="mr-2 text-2xl">🔄</span>
                  Restart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Story Info Card */}
        <Card className="mt-8 bg-white border-4 border-[#FFD93D] shadow-2xl">
          <CardContent className="p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-4 font-[family-name:var(--font-fredoka)]">
              🕷️ About Kweku Ananse
            </h2>
            <div className="space-y-4 text-lg md:text-xl text-gray-700">
              <p>
                <strong className="text-[#58C4F6]">Who is Kweku Ananse?</strong>
                <br />
                Kweku Ananse (also known as Anansi) is a clever spider character
                from Ghanaian and West African folklore. He is known for his
                wisdom and cunning!
              </p>
              <p>
                <strong className="text-[#B794F6]">
                  Why learn about Ananse?
                </strong>
                <br />
                Ananse stories teach us important lessons about being smart,
                creative, and kind to others. They're fun and help us learn!
              </p>
              <p>
                <strong className="text-[#6BCF7F]">What's special?</strong>
                <br />
                Through these stories, we learn about Ghanaian culture and
                traditions while having fun and improving our sign language
                skills!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/lessons/family"
            onClick={() => announceButton("Start Learning", "click")}
            onMouseEnter={() => announceButton("Start Learning", "hover")}
            className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-[#6BCF7F] to-[#58C4F6] text-white font-bold text-xl md:text-2xl rounded-full hover:shadow-2xl transition-all shadow-xl transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/50"
            aria-label="Start learning sign language. Button."
          >
            <span className="mr-2 text-2xl">📚</span>
            Start Learning!
          </Link>

          <Link
            href="/practise"
            onClick={() => announceButton("Practice Now", "click")}
            onMouseEnter={() => announceButton("Practice Now", "hover")}
            className="inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-[#FFD93D] to-[#FF7B9C] text-[#2D3748] font-bold text-xl md:text-2xl rounded-full hover:shadow-2xl transition-all shadow-xl transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#FFD93D]/50"
            aria-label="Practice sign language. Button."
          >
            <span className="mr-2 text-2xl">🎮</span>
            Practice Now!
          </Link>
        </div>
      </main>
    </div>
  );
}

