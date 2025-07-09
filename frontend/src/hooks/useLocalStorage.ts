import { useState } from "react";

// Storage keys
export const STORAGE_KEYS = {
  USER_PROFILE: "eatMorVegetables_userProfile",
  MEAL_PLANS: "eatMorVegetables_mealPlans",
  RECIPE_CACHE: "eatMorVegetables_recipeCache",
  GROCERY_LISTS: "eatMorVegetables_groceryLists",
  SETUP_PROGRESS: "eatMorVegetables_setupProgress",
} as const;

type StorageKey = keyof typeof STORAGE_KEYS;

export function useLocalStorage<T>(
  key: StorageKey,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEYS[key]);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      window.localStorage.setItem(
        STORAGE_KEYS[key],
        JSON.stringify(valueToStore)
      );
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Utility functions for managing localStorage
export const storageUtils = {
  // Clear all app data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  },

  // Get item directly
  getItem: <T>(key: StorageKey, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEYS[key]);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error getting localStorage item "${key}":`, error);
      return defaultValue;
    }
  },

  // Set item directly
  setItem: <T>(key: StorageKey, value: T): void => {
    try {
      window.localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage item "${key}":`, error);
    }
  },

  // Remove item
  removeItem: (key: StorageKey): void => {
    try {
      window.localStorage.removeItem(STORAGE_KEYS[key]);
    } catch (error) {
      console.error(`Error removing localStorage item "${key}":`, error);
    }
  },

  // Check if key exists
  hasItem: (key: StorageKey): boolean => {
    try {
      return window.localStorage.getItem(STORAGE_KEYS[key]) !== null;
    } catch (error) {
      console.error(`Error checking localStorage item "${key}":`, error);
      return false;
    }
  },

  // Get storage size for debugging
  getStorageSize: (): number => {
    try {
      let total = 0;
      Object.values(STORAGE_KEYS).forEach((key) => {
        const item = window.localStorage.getItem(key);
        if (item) {
          total += item.length;
        }
      });
      return total;
    } catch (error) {
      console.error("Error calculating storage size:", error);
      return 0;
    }
  },
};
