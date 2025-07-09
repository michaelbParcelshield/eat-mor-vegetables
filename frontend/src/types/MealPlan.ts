import { Recipe } from './Recipe';

export interface MealSlot {
  id: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  recipe?: Recipe;
  servings?: number;
  notes?: string;
  isLeftover?: boolean;
  leftoverFrom?: string; // meal slot id
}

export interface DayPlan {
  date: string; // ISO date string
  meals: MealSlot[];
  totalEstimatedCost?: number;
  totalCalories?: number;
}

export interface WeeklyMealPlan {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  days: DayPlan[];
  
  // Budget tracking
  totalBudget: number;
  estimatedCost: number;
  actualCost?: number;
  
  // Grocery info
  groceryList?: GroceryList;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  category: GroceryCategory;
  estimatedCost?: number;
  actualCost?: number;
  isPurchased: boolean;
  isOptional: boolean;
  stores?: string[]; // where to find this item
  notes?: string;
  
  // Recipe tracking
  usedInRecipes: string[]; // recipe ids
  usedInMeals: string[]; // meal slot ids
}

export interface GroceryList {
  id: string;
  weeklyMealPlanId: string;
  items: GroceryItem[];
  categories: GroceryCategory[];
  
  // Cost tracking
  estimatedTotal: number;
  actualTotal?: number;
  
  // Progress
  totalItems: number;
  purchasedItems: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface GroceryCategory {
  id: string;
  name: string;
  order: number;
  icon?: string;
  color?: string;
}

// Default grocery categories
export const DEFAULT_GROCERY_CATEGORIES: GroceryCategory[] = [
  { id: "produce", name: "Produce", order: 1, icon: "🥬", color: "#22c55e" },
  { id: "meat", name: "Meat & Seafood", order: 2, icon: "🥩", color: "#ef4444" },
  { id: "dairy", name: "Dairy & Eggs", order: 3, icon: "🥛", color: "#3b82f6" },
  { id: "pantry", name: "Pantry", order: 4, icon: "🥫", color: "#f59e0b" },
  { id: "frozen", name: "Frozen", order: 5, icon: "🧊", color: "#06b6d4" },
  { id: "bakery", name: "Bakery", order: 6, icon: "🍞", color: "#d97706" },
  { id: "snacks", name: "Snacks", order: 7, icon: "🍿", color: "#8b5cf6" },
  { id: "beverages", name: "Beverages", order: 8, icon: "🥤", color: "#10b981" },
  { id: "other", name: "Other", order: 9, icon: "🛒", color: "#6b7280" }
];

export interface MealPlanFilters {
  startDate?: string;
  endDate?: string;
  maxBudget?: number;
  includeLeftovers?: boolean;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"; 