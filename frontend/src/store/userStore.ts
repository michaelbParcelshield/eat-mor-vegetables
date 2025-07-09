import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MVPUserProfile, SetupProgress, SetupStep } from "../types/User";
import { STORAGE_KEYS } from "../hooks/useLocalStorage";

interface UserState {
  // User profile
  profile: MVPUserProfile | null;

  // Setup progress
  setupProgress: SetupProgress;

  // Loading states
  isLoading: boolean;

  // Actions
  setProfile: (profile: MVPUserProfile) => void;
  updateProfile: (updates: Partial<MVPUserProfile>) => void;
  clearProfile: () => void;

  // Setup actions
  setSetupProgress: (progress: SetupProgress) => void;
  completeSetupStep: (step: number) => void;
  resetSetup: () => void;

  // Utility
  isSetupComplete: () => boolean;
  getCurrentStep: () => number;
}

const initialSetupProgress: SetupProgress = {
  currentStep: 1,
  completedSteps: [],
  isComplete: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      setupProgress: initialSetupProgress,
      isLoading: false,

      setProfile: (profile: MVPUserProfile) => {
        set({
          profile: {
            ...profile,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateProfile: (updates: Partial<MVPUserProfile>) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      clearProfile: () => {
        set({
          profile: null,
          setupProgress: initialSetupProgress,
        });
      },

      setSetupProgress: (progress: SetupProgress) => {
        set({ setupProgress: progress });
      },

      completeSetupStep: (step: number) => {
        const { setupProgress } = get();
        const newCompletedSteps = [...setupProgress.completedSteps];

        if (!newCompletedSteps.includes(step as any)) {
          newCompletedSteps.push(step as any);
        }

        const nextStep = Math.min(step + 1, 3) as SetupStep;
        const isComplete = newCompletedSteps.length === 3;

        set({
          setupProgress: {
            currentStep: isComplete ? 3 : nextStep,
            completedSteps: newCompletedSteps,
            isComplete,
          },
        });
      },

      resetSetup: () => {
        set({ setupProgress: initialSetupProgress });
      },

      isSetupComplete: () => {
        return get().setupProgress.isComplete;
      },

      getCurrentStep: () => {
        return get().setupProgress.currentStep;
      },
    }),
    {
      name: STORAGE_KEYS.USER_PROFILE,
      partialize: (state) => ({
        profile: state.profile,
        setupProgress: state.setupProgress,
      }),
    }
  )
);

// Utility functions
export const userUtils = {
  createInitialProfile: (): Partial<MVPUserProfile> => ({
    householdSize: 2,
    weeklyBudget: 100,
    currency: "USD",
    allergies: [],
    dislikedFoods: [],
    preferredCuisines: [],
    cookingTime: "30min",
    skillLevel: "beginner",
    enjoysCooking: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  validateProfile: (profile: Partial<MVPUserProfile>): string[] => {
    const errors: string[] = [];

    if (!profile.householdSize || profile.householdSize < 1) {
      errors.push("Household size must be at least 1");
    }

    if (!profile.weeklyBudget || profile.weeklyBudget < 10) {
      errors.push("Weekly budget must be at least $10");
    }

    if (!profile.cookingTime) {
      errors.push("Please select your available cooking time");
    }

    if (!profile.skillLevel) {
      errors.push("Please select your cooking skill level");
    }

    return errors;
  },

  getMaxCookingTimeMinutes: (cookingTime: string): number => {
    switch (cookingTime) {
      case "15min":
        return 15;
      case "30min":
        return 30;
      case "1hour":
        return 60;
      default:
        return 30;
    }
  },

  getBudgetPerMeal: (weeklyBudget: number, householdSize: number): number => {
    // Assume 3 meals per day, 7 days per week
    return weeklyBudget / (3 * 7) / householdSize;
  },
};
