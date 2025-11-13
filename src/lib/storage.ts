import { CategoryName } from "./data";

// Progress data interface
export interface CategoryProgress {
  lastCompletedIndex: number;
  testScores: { lessonId: number; score: number; passed: boolean }[];
  completionPercentage: number;
  lastAccessedDate: string;
}

export interface AllProgress {
  [category: string]: CategoryProgress;
}

const STORAGE_KEY = "sign_language_progress";

/**
 * Get progress for a specific category from localStorage
 */
export function getProgress(category: CategoryName): CategoryProgress | null {
  try {
    if (typeof window === "undefined") return null;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const allProgress: AllProgress = JSON.parse(stored);
    return allProgress[category] || null;
  } catch (error) {
    console.error("Error reading progress from localStorage:", error);
    return null;
  }
}

/**
 * Get all progress from localStorage
 */
export function getAllProgress(): AllProgress {
  try {
    if (typeof window === "undefined") return {};
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};

    return JSON.parse(stored);
  } catch (error) {
    console.error("Error reading all progress from localStorage:", error);
    return {};
  }
}

/**
 * Update progress for a specific category
 */
export function updateProgress(
  category: CategoryName,
  lessonIndex: number,
  totalLessons: number,
  testScore?: { lessonId: number; score: number; passed: boolean }
): void {
  try {
    if (typeof window === "undefined") return;

    const allProgress = getAllProgress();
    const currentProgress = allProgress[category] || {
      lastCompletedIndex: -1,
      testScores: [],
      completionPercentage: 0,
      lastAccessedDate: new Date().toISOString(),
    };

    // Update the last completed index
    if (lessonIndex > currentProgress.lastCompletedIndex) {
      currentProgress.lastCompletedIndex = lessonIndex;
    }

    // Add test score if provided
    if (testScore) {
      // Remove existing score for this lesson if any
      currentProgress.testScores = currentProgress.testScores.filter(
        (score) => score.lessonId !== testScore.lessonId
      );
      currentProgress.testScores.push(testScore);
    }

    // Calculate completion percentage
    currentProgress.completionPercentage = Math.round(
      ((lessonIndex + 1) / totalLessons) * 100
    );

    // Update last accessed date
    currentProgress.lastAccessedDate = new Date().toISOString();

    // Save to localStorage
    allProgress[category] = currentProgress;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error("Error updating progress in localStorage:", error);
  }
}

/**
 * Reset progress for a specific category
 */
export function resetProgress(category: CategoryName): void {
  try {
    if (typeof window === "undefined") return;

    const allProgress = getAllProgress();
    delete allProgress[category];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error("Error resetting progress in localStorage:", error);
  }
}

/**
 * Reset all progress
 */
export function resetAllProgress(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error resetting all progress in localStorage:", error);
  }
}

/**
 * Get completion percentage for a category
 */
export function getCompletionPercentage(category: CategoryName): number {
  const progress = getProgress(category);
  return progress?.completionPercentage || 0;
}

/**
 * Check if a category is completed
 */
export function isCategoryCompleted(
  category: CategoryName,
  totalLessons: number
): boolean {
  const progress = getProgress(category);
  if (!progress) return false;
  return progress.lastCompletedIndex >= totalLessons - 1;
}

/**
 * Get the index of the next lesson to show (resume point)
 */
export function getResumeIndex(category: CategoryName): number {
  const progress = getProgress(category);
  if (!progress || progress.lastCompletedIndex === -1) return 0;
  
  // Return the next lesson after the last completed one
  return progress.lastCompletedIndex + 1;
}

