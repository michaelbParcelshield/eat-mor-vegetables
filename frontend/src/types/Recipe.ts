export interface Recipe {
  id: string;
  name: string;
  description?: string;
  image?: string;
  category: string;
  area?: string;
  
  // Cooking info
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  totalTime: number; // in minutes
  servings: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  
  // Instructions and ingredients
  instructions: string[];
  ingredients: RecipeIngredient[];
  
  // Nutritional info (basic)
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  
  // Cost estimation
  estimatedCost?: number;
  costPerServing?: number;
  
  // Tags for filtering
  tags: string[];
  cuisineType?: string;
  
  // Source
  source: "themealdb" | "api_ninjas" | "custom";
  sourceId?: string;
  sourceUrl?: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit?: string;
  notes?: string;
  estimatedCost?: number;
}

export interface RecipeFilters {
  category?: string;
  cuisineType?: string;
  maxCookingTime?: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  maxCostPerServing?: number;
  excludeIngredients?: string[];
  includeIngredients?: string[];
  tags?: string[];
}

export interface RecipeSearchQuery {
  query?: string;
  filters?: RecipeFilters;
  limit?: number;
  offset?: number;
}

export interface RecipeSearchResult {
  recipes: Recipe[];
  total: number;
  hasMore: boolean;
}

// TheMealDB API response types
export interface TheMealDBRecipe {
  idMeal: string;
  strMeal: string;
  strDrinkAlternate?: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags?: string;
  strYoutube?: string;
  strSource?: string;
  strImageSource?: string;
  strCreativeCommonsConfirmed?: string;
  strDateModified?: string;
  [key: `strIngredient${number}`]: string;
  [key: `strMeasure${number}`]: string;
}

export interface TheMealDBResponse {
  meals: TheMealDBRecipe[] | null;
} 