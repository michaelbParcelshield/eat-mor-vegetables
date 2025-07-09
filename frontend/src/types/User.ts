export interface MVPUserProfile {
  // Step 1: Basic Info
  householdSize: number;
  weeklyBudget: number;
  currency: "USD";
  
  // Step 2: Dietary Basics
  allergies: string[];
  dislikedFoods: string[];
  preferredCuisines?: string[];
  
  // Step 3: Time & Skill
  cookingTime: "15min" | "30min" | "1hour";
  skillLevel: "beginner" | "intermediate" | "advanced";
  enjoysCooking: boolean;
  
  // System fields
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  cuisinePreferences: string[];
  ingredientDislikes: string[];
  allergies: string[];
}

export interface UserConstraints {
  maxCookingTime: number; // in minutes
  skillLevel: "beginner" | "intermediate" | "advanced";
  weeklyBudget: number;
  householdSize: number;
}

export type SetupStep = 1 | 2 | 3;

export interface SetupProgress {
  currentStep: SetupStep;
  completedSteps: SetupStep[];
  isComplete: boolean;
} 