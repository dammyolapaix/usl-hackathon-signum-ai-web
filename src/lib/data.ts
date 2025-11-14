// Category definitions
export const categories = [
  { name: "FAMILY", emoji: "👨‍👩‍👧‍👦" },
  { name: "ALPHABETS", emoji: "🔤" },
  { name: "NUMERALS", emoji: "🔢" },
  { name: "COLORS", emoji: "🎨" },
  { name: "ANIMALS", emoji: "🐾" },
  { name: "FOOD", emoji: "🍎" },
] as const;

export type CategoryName = (typeof categories)[number]["name"];

export const ananseStory =
  "https://res.cloudinary.com/techbiznez/video/upload/v1763104482/SIGNUM%20AI%20ASSETS/ananse-video_rjbhl2.mp4";

// Lesson and test type definitions
// Note: We use browser's speech synthesis instead of audio files for accessibility
export interface Lesson {
  id: number;
  type: "lesson";
  mediaType: "video" | "image";
  mediaSrc: string;
  imageSrc?: string;
  title: string;
  description: string;
}

export interface MultipleChoiceTest {
  id: number;
  type: "test";
  testType: "multiple-choice";
  question: string;
  options: string[];
  correctAnswer: string;
  mediaType?: "video" | "image";
  mediaSrc?: string;
}

export interface PracticalTest {
  id: number;
  type: "test";
  testType: "practical";
  signToPerform: string;
  instructions: string;
  hints: string[];
  referenceVideoUrl: string;
  signImages?: string[];
  signDescription?: string;
}

export type LessonItem = Lesson | MultipleChoiceTest | PracticalTest;

// Lesson data for all categories
export const lessonsData: Record<CategoryName, LessonItem[]> = {
  FAMILY: [
    // Lesson 1
    {
      id: 1,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      title: "Boy",
      description:
        "This is the sign for 'Boy' in sign language. The sign is made by forming a flat hand near your forehead, representing a cap that boys traditionally wore.",
    },
    // Lesson 2
    {
      id: 2,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_open_hand.png",
      title: "Girl",
      description:
        "This is the sign for 'Girl' in sign language. The sign is made by drawing your thumb down along your jawline, representing the strings of a bonnet.",
    },
    // Lesson 3
    {
      id: 3,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      title: "Mother",
      description:
        "This is the sign for 'Mother' in sign language. Touch your thumb to your chin with your hand open, showing respect and connection to mother.",
    },
    // Test 1 - Multiple Choice
    {
      id: 4,
      type: "test",
      testType: "multiple-choice",
      question: "What does this sign mean?",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      options: ["Boy", "Girl", "Mother", "Father"],
      correctAnswer: "Boy",
    },
    // Lesson 4
    {
      id: 5,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input2.mp4",
      title: "Father",
      description:
        "This is the sign for 'Father' in sign language. Touch your thumb to your forehead with your hand open, similar to mother but at the forehead.",
    },
    // Lesson 5
    {
      id: 6,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_curved_hand.png",
      title: "Sister",
      description:
        "This is the sign for 'Sister' in sign language. Combine the signs for 'girl' and 'same' to indicate a female sibling.",
    },
    // Lesson 6
    {
      id: 7,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input3.mp4",
      title: "Brother",
      description:
        "This is the sign for 'Brother' in sign language. Combine the signs for 'boy' and 'same' to indicate a male sibling.",
    },
    // Test 2 - Practical
    {
      id: 8,
      type: "test",
      testType: "practical",
      signToPerform: "Family",
      instructions:
        "Show the sign for 'Family' using your camera. Touch your thumb to your chin with your hand open.",
      referenceVideoUrl: "",
      hints: [
        "Make sure your hand is clearly visible",
        "Touch your thumb to your chin area",
        "Keep your fingers spread naturally",
      ],
    },
  ],

  ALPHABETS: [
    // Lesson 1
    {
      id: 1,
      type: "lesson",
      mediaType: "video",
      mediaSrc:
        "https://res.cloudinary.com/techbiznez/video/upload/v1763110199/Unicef%20Hackathon%20Videos/Alphabets%20and%20Their%20associations/a_for_apple_j46210.mp4",
      title: "Letter A for Apple",
      imageSrc:
        "https://res.cloudinary.com/techbiznez/image/upload/v1763104452/SIGNUM%20AI%20ASSETS/apple-image_i63d6b.jpg",
      description:
        "To sign A for Apple: Make a fist with your thumb resting on the side of your hand. Place the thumb of the “A” hand on the cheek and twist back and forth.",
    },
    // Lesson 2
    {
      id: 2,
      type: "lesson",
      mediaType: "video",
      mediaSrc:
        "https://res.cloudinary.com/techbiznez/video/upload/v1763110324/Unicef%20Hackathon%20Videos/Alphabets%20and%20Their%20associations/b_for_banana_sjlxqk.mp4",
      title: "Letter B for Banana",
      imageSrc:
        "https://res.cloudinary.com/techbiznez/image/upload/v1763104456/SIGNUM%20AI%20ASSETS/banana-image_piwo3z.jpg",
      description:
        "To sign B for Banana: With your left index finger pointing up, use the right hand to make a peeling motion around it.",
    },
    // Lesson 3
    {
      id: 3,
      type: "lesson",
      mediaType: "video",
      mediaSrc:
        "https://res.cloudinary.com/techbiznez/video/upload/v1763110198/Unicef%20Hackathon%20Videos/Alphabets%20and%20Their%20associations/c_for_coconut_bi81ca.mp4",
      imageSrc:
        "https://res.cloudinary.com/techbiznez/image/upload/v1763104462/SIGNUM%20AI%20ASSETS/coconut-image_gjlpta.jpg",
      title: "Letter C for Coconut",
      description:
        "To sign C for Coconut: Place both curved hands at the ear with palms facing each other and shake back and forth.",
    },
    // Test 1
    {
      id: 4,
      type: "test",
      testType: "multiple-choice",
      question:
        "We learned that the letter 'B' is for a yummy yellow fruit. Which one is it?",
      mediaType: "video",
      mediaSrc:
        "https://res.cloudinary.com/techbiznez/video/upload/v1763019401/Unicef%20Hackathon%20Videos/Alphabets%20and%20Their%20associations/b_for_banana_vby1qz.mp4",
      options: ["Apple", "Banana", "Coconut", "Dog"],
      correctAnswer: "Banana",
    },

    // Test 2 - Practical
    {
      id: 5,
      type: "test",
      testType: "practical",
      signToPerform: "A for Apple",
      instructions:
        "It's snack time! 🍎 Can you show the camera the sign for 'A for Apple'? Make a fist like you are holding a round, crunchy apple!",
      referenceVideoUrl:
        "https://res.cloudinary.com/techbiznez/video/upload/v1763110199/Unicef%20Hackathon%20Videos/Alphabets%20and%20Their%20associations/a_for_apple_j46210.mp4",

      signImages: [
        "https://res.cloudinary.com/techbiznez/image/upload/v1763026857/Unicef%20Hackathon%20Videos/Alphabets/A_vc4a2d.png",
        "https://res.cloudinary.com/techbiznez/image/upload/v1763120277/Unicef%20Hackathon%20Videos/Alphabets/Screenshot_2025-11-14_at_11.33.57_e4kvqa.png",
      ],
      signDescription:
        "Place the thumb of the “A” hand on the cheek and twist back and forth.",
      hints: [
        "Place the thumb of the “A” hand on the cheek and twist back and forth.",
        "Hold your hand steady in front of the camera",
      ],
    },
  ],

  NUMERALS: [
    // Lesson 1
    {
      id: 1,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      title: "Number 1",
      description:
        "This is the sign for number '1'. Hold up your index finger while keeping other fingers closed.",
    },
    // Lesson 2
    {
      id: 2,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      title: "Number 2",
      description:
        "This is the sign for number '2'. Hold up your index and middle fingers in a 'V' shape.",
    },
    // Lesson 3
    {
      id: 3,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input2.mp4",
      title: "Number 3",
      description:
        "This is the sign for number '3'. Hold up your thumb, index, and middle fingers.",
    },
    // Test 1
    {
      id: 4,
      type: "test",
      testType: "multiple-choice",
      question: "What number is being signed?",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      options: ["Number 1", "Number 2", "Number 3", "Number 4"],
      correctAnswer: "Number 2",
    },
    // Lesson 4
    {
      id: 5,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_open_hand.png",
      title: "Number 4",
      description:
        "This is the sign for number '4'. Hold up four fingers (index through pinky) with thumb tucked in.",
    },
    // Lesson 5
    {
      id: 6,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_flat_hand.png",
      title: "Number 5",
      description:
        "This is the sign for number '5'. Hold up all five fingers with your palm facing forward.",
    },
    // Lesson 6
    {
      id: 7,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input3.mp4",
      title: "Number 10",
      description:
        "This is the sign for number '10'. Make a fist with your thumb extended, then shake it slightly.",
    },
    // Test 2 - Practical
    {
      id: 8,
      type: "test",
      testType: "practical",
      signToPerform: "Number 3",
      instructions:
        "Show the sign for number '3' using your camera. Hold up three fingers clearly.",
      referenceVideoUrl: "",
      hints: [
        "Hold up your thumb, index, and middle fingers",
        "Keep other fingers closed",
        "Make sure all three fingers are clearly visible",
      ],
    },
  ],

  COLORS: [
    // Lesson 1
    {
      id: 1,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      title: "Red",
      description:
        "This is the sign for 'Red'. Touch your lips with your index finger and move it down, representing the color of lips.",
    },
    // Lesson 2
    {
      id: 2,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_open_hand.png",
      title: "Blue",
      description:
        "This is the sign for 'Blue'. Make the letter 'B' sign and twist your hand back and forth.",
    },
    // Lesson 3
    {
      id: 3,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      title: "Yellow",
      description:
        "This is the sign for 'Yellow'. Make the letter 'Y' sign and twist your hand back and forth.",
    },
    // Test 1
    {
      id: 4,
      type: "test",
      testType: "multiple-choice",
      question: "What color is being signed?",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      options: ["Red", "Blue", "Yellow", "Green"],
      correctAnswer: "Red",
    },
    // Lesson 4
    {
      id: 5,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input2.mp4",
      title: "Green",
      description:
        "This is the sign for 'Green'. Make the letter 'G' sign and twist your hand back and forth.",
    },
    // Lesson 5
    {
      id: 6,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_curved_hand.png",
      title: "Black",
      description:
        "This is the sign for 'Black'. Draw your index finger across your forehead from one side to the other.",
    },
    // Lesson 6
    {
      id: 7,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_flat_hand.png",
      title: "White",
      description:
        "This is the sign for 'White'. Start with your hand on your chest and pull it away while closing your fingers, like pulling white from your shirt.",
    },
    // Test 2 - Practical
    {
      id: 8,
      type: "test",
      testType: "practical",
      signToPerform: "Blue",
      instructions:
        "Show the sign for 'Blue' using your camera. Make the letter 'B' and twist your hand.",
      referenceVideoUrl: "",
      hints: [
        "Form the letter 'B' hand shape first",
        "Twist your wrist back and forth",
        "Keep the movement small and controlled",
      ],
    },
  ],

  ANIMALS: [
    // Lesson 1
    {
      id: 1,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      title: "Dog",
      description:
        "This is the sign for 'Dog'. Snap your fingers and pat your thigh, like calling a dog.",
    },
    // Lesson 2
    {
      id: 2,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_clawed_hand.png",
      title: "Cat",
      description:
        "This is the sign for 'Cat'. Pinch your fingers together near your cheek and pull outward, representing whiskers.",
    },
    // Lesson 3
    {
      id: 3,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      title: "Bird",
      description:
        "This is the sign for 'Bird'. Make a beak shape with your index finger and thumb near your mouth, opening and closing them.",
    },
    // Test 1
    {
      id: 4,
      type: "test",
      testType: "multiple-choice",
      question: "What animal is being signed?",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_clawed_hand.png",
      options: ["Dog", "Cat", "Bird", "Fish"],
      correctAnswer: "Cat",
    },
    // Lesson 4
    {
      id: 5,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input2.mp4",
      title: "Fish",
      description:
        "This is the sign for 'Fish'. Hold your hand flat and move it forward in a swimming motion.",
    },
    // Lesson 5
    {
      id: 6,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_bent_hand.png",
      title: "Elephant",
      description:
        "This is the sign for 'Elephant'. Start with your hand at your nose and move it down and forward, tracing the shape of an elephant's trunk.",
    },
    // Lesson 6
    {
      id: 7,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input3.mp4",
      title: "Lion",
      description:
        "This is the sign for 'Lion'. Make a claw shape with your hand and move it back from your face, representing a lion's mane.",
    },
    // Test 2 - Practical
    {
      id: 8,
      type: "test",
      testType: "practical",
      signToPerform: "Bird",
      instructions:
        "Show the sign for 'Bird' using your camera. Make a beak shape near your mouth.",
      referenceVideoUrl: "",
      hints: [
        "Use your index finger and thumb to form a beak",
        "Position near your mouth",
        "Open and close the 'beak' motion",
      ],
    },
  ],

  FOOD: [
    // Lesson 1
    {
      id: 1,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      title: "Water",
      description:
        "This is the sign for 'Water'. Make the letter 'W' sign and tap it against your chin twice.",
    },
    // Lesson 2
    {
      id: 2,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_flat_hand.png",
      title: "Bread",
      description:
        "This is the sign for 'Bread'. Use your dominant hand to make slicing motions on the back of your other hand, like slicing bread.",
    },
    // Lesson 3
    {
      id: 3,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input1.mp4",
      title: "Apple",
      description:
        "This is the sign for 'Apple'. Make an 'A' fist and twist it against your cheek, like taking a bite of an apple.",
    },
    // Test 1
    {
      id: 4,
      type: "test",
      testType: "multiple-choice",
      question: "What food is being signed?",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input.mp4",
      options: ["Water", "Bread", "Apple", "Milk"],
      correctAnswer: "Water",
    },
    // Lesson 4
    {
      id: 5,
      type: "lesson",
      mediaType: "video",
      mediaSrc: "/assets/veo3_with_image_input2.mp4",
      title: "Milk",
      description:
        "This is the sign for 'Milk'. Make a squeezing motion with your fist, like milking a cow.",
    },
    // Lesson 5
    {
      id: 6,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_curved_hand.png",
      title: "Rice",
      description:
        "This is the sign for 'Rice'. Bring your hand to your mouth as if eating with chopsticks or a spoon.",
    },
    // Lesson 6
    {
      id: 7,
      type: "lesson",
      mediaType: "image",
      mediaSrc: "/assets/sign_page7_open_hand.png",
      title: "Egg",
      description:
        "This is the sign for 'Egg'. Make two 'H' hand shapes and move them apart, like cracking an egg.",
    },
    // Test 2 - Practical
    {
      id: 8,
      type: "test",
      testType: "practical",
      signToPerform: "Apple",
      referenceVideoUrl: "",
      instructions:
        "Show the sign for 'Apple' using your camera. Make an 'A' fist and twist it against your cheek.",
      hints: [
        "Form a fist with thumb on the side (letter A)",
        "Place your fist against your cheek",
        "Make a twisting motion",
      ],
    },
  ],
};
