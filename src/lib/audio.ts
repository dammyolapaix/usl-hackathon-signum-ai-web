/**
 * Audio utility for screen reader support and text-to-speech
 * No audio files needed - uses browser's built-in speech synthesis
 */

/**
 * Speak text using browser's speech synthesis
 * Works great with screen readers for accessibility
 */
export function speakText(text: string, onEnd?: () => void, priority: "high" | "normal" = "normal") {
  if ("speechSynthesis" in window) {
    // Cancel previous speech if high priority
    if (priority === "high") {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Slower for children to understand
    utterance.pitch = 1.1; // Slightly higher pitch for friendliness
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    if (onEnd) {
      utterance.onend = onEnd;
    }

    // Small delay to ensure speech synthesis is ready
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }
}

/**
 * Announce button interaction for blind users
 * Provides clear feedback that an element is clickable
 */
export function announceButton(buttonName: string, action: "hover" | "focus" | "click") {
  const messages = {
    hover: `${buttonName} button. Click to activate.`,
    focus: `${buttonName} button focused. Press Enter or Space to activate.`,
    click: `${buttonName} activated.`,
  };
  
  speakText(messages[action], undefined, action === "click" ? "high" : "normal");
}

/**
 * Cancel speech synthesis
 */
export function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if speech synthesis is available
 */
export function isSpeechAvailable(): boolean {
  return "speechSynthesis" in window;
}

