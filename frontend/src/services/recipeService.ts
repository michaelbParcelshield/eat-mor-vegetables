import { Recipe, RecipeFilters, RecipeSearchQuery, RecipeSearchResult, TheMealDBResponse, TheMealDBRecipe } from '../types/Recipe';
import { MVPUserProfile } from '../types/User';

const THEMEALDB_BASE_URL = import.meta.env.VITE_THEMEALDB_BASE_URL || 'https://www.themealdb.com/api/json/v1/1';

// Cost estimation per serving (rough estimates in USD)
const COST_ESTIMATES: Record<string, number> = {
  'Beef': 4.50,
  'Chicken': 2.50,
  'Pork': 3.00,
  'Seafood': 5.50,
  'Vegetarian': 1.50,
  'Vegan': 1.25,
  'Pasta': 1.00,
  'Dessert': 2.00,
  'Breakfast': 1.75,
  'Side': 1.25,
  'Starter': 1.50,
  'Miscellaneous': 2.00
};

// Difficulty estimation based on cooking time and ingredients
const estimateDifficulty = (cookTime: number, ingredientCount: number): "beginner" | "intermediate" | "advanced" => {
  if (cookTime <= 30 && ingredientCount <= 8) return "beginner";
  if (cookTime <= 60 && ingredientCount <= 12) return "intermediate";
  return "advanced";
};

// Convert cooking time text to minutes
const parseCookingTime = (instructions: string): number => {
  const timeRegex = /(\d+)\s*(minutes?|mins?|hours?|hrs?)/gi;
  const matches = instructions.match(timeRegex);
  
  if (!matches) return 30; // Default to 30 minutes
  
  let totalMinutes = 0;
  matches.forEach(match => {
    const [, num, unit] = match.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i) || [];
    if (num && unit) {
      const minutes = parseInt(num) * (unit.toLowerCase().includes('hour') ? 60 : 1);
      totalMinutes = Math.max(totalMinutes, minutes);
    }
  });
  
  return totalMinutes || 30;
};

// Convert TheMealDB recipe to our Recipe type
const convertTheMealDBRecipe = (mealData: TheMealDBRecipe): Recipe => {
  const ingredients = [];
  
  // Extract ingredients (TheMealDB has strIngredient1-20 and strMeasure1-20)
  for (let i = 1; i <= 20; i++) {
    const ingredient = mealData[`strIngredient${i}` as keyof TheMealDBRecipe];
    const measure = mealData[`strMeasure${i}` as keyof TheMealDBRecipe];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        amount: measure?.trim() || '1',
        unit: '',
        estimatedCost: 0.50 // Default cost per ingredient
      });
    }
  }
  
  const cookTime = parseCookingTime(mealData.strInstructions);
  const difficulty = estimateDifficulty(cookTime, ingredients.length);
  const estimatedCost = COST_ESTIMATES[mealData.strCategory] || 2.00;
  
  return {
    id: mealData.idMeal,
    name: mealData.strMeal,
    description: mealData.strInstructions.substring(0, 200) + '...',
    image: mealData.strMealThumb,
    category: mealData.strCategory,
    area: mealData.strArea,
    
    prepTime: 10,
    cookTime,
    totalTime: cookTime + 10,
    servings: 4,
    difficulty,
    
    instructions: mealData.strInstructions.split('.').filter(step => step.trim()),
    ingredients,
    
    estimatedCost: estimatedCost * 4, // For 4 servings
    costPerServing: estimatedCost,
    
    tags: mealData.strTags ? mealData.strTags.split(',').map(tag => tag.trim()) : [],
    cuisineType: mealData.strArea,
    
    source: 'themealdb',
    sourceId: mealData.idMeal,
    sourceUrl: mealData.strSource
  };
};

class RecipeService {
  private cache = new Map<string, Recipe[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private async fetchFromAPI(endpoint: string): Promise<any> {
    const cacheKey = endpoint;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const response = await fetch(`${THEMEALDB_BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
      
      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }

  // Get random recipes
  async getRandomRecipes(count: number = 10): Promise<Recipe[]> {
    const recipes: Recipe[] = [];
    
    try {
      // Fetch multiple random recipes
      const promises = Array.from({ length: count }, () => 
        this.fetchFromAPI('/random.php')
      );
      
      const results = await Promise.all(promises);
      
      results.forEach((result: TheMealDBResponse) => {
        if (result.meals && result.meals[0]) {
          recipes.push(convertTheMealDBRecipe(result.meals[0]));
        }
      });
      
      return recipes;
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      return [];
    }
  }

  // Search recipes by name
  async searchRecipes(query: RecipeSearchQuery): Promise<RecipeSearchResult> {
    try {
      if (!query.query) {
        // If no query, get random recipes
        const recipes = await this.getRandomRecipes(query.limit || 20);
        return {
          recipes: this.filterRecipes(recipes, query.filters),
          total: recipes.length,
          hasMore: false
        };
      }
      
      const data: TheMealDBResponse = await this.fetchFromAPI(`/search.php?s=${encodeURIComponent(query.query)}`);
      
      if (!data.meals) {
        return {
          recipes: [],
          total: 0,
          hasMore: false
        };
      }
      
      const recipes = data.meals.map(convertTheMealDBRecipe);
      const filteredRecipes = this.filterRecipes(recipes, query.filters);
      
      return {
        recipes: filteredRecipes.slice(0, query.limit || 20),
        total: filteredRecipes.length,
        hasMore: filteredRecipes.length > (query.limit || 20)
      };
    } catch (error) {
      console.error('Error searching recipes:', error);
      return {
        recipes: [],
        total: 0,
        hasMore: false
      };
    }
  }

  // Get recipes by category
  async getRecipesByCategory(category: string): Promise<Recipe[]> {
    try {
      const data: TheMealDBResponse = await this.fetchFromAPI(`/filter.php?c=${category}`);
      
      if (!data.meals) return [];
      
      // TheMealDB filter endpoint only returns basic info, need to fetch full recipes
      const detailedRecipes = await Promise.all(
        data.meals.slice(0, 10).map(async (meal) => {
          const detailData: TheMealDBResponse = await this.fetchFromAPI(`/lookup.php?i=${meal.idMeal}`);
          return detailData.meals ? convertTheMealDBRecipe(detailData.meals[0]) : null;
        })
      );
      
      return detailedRecipes.filter(Boolean) as Recipe[];
    } catch (error) {
      console.error('Error fetching recipes by category:', error);
      return [];
    }
  }

  // Get recipe recommendations based on user profile
  async getRecommendations(userProfile: MVPUserProfile): Promise<Recipe[]> {
    try {
      // Get recipes based on user preferences
      const maxCookTime = userProfile.cookingTime === "15min" ? 15 : 
                         userProfile.cookingTime === "30min" ? 30 : 60;
      
      // Start with random recipes
      const randomRecipes = await this.getRandomRecipes(20);
      
      // Filter based on user constraints
      const filteredRecipes = randomRecipes.filter(recipe => {
        // Filter by cooking time
        if (recipe.totalTime > maxCookTime) return false;
        
        // Filter by difficulty
        if (userProfile.skillLevel === "beginner" && recipe.difficulty !== "beginner") return false;
        if (userProfile.skillLevel === "intermediate" && recipe.difficulty === "advanced") return false;
        
        // Filter by budget (cost per serving)
        const maxCostPerServing = userProfile.weeklyBudget / 21; // 3 meals/day * 7 days
        if (recipe.costPerServing && recipe.costPerServing > maxCostPerServing) return false;
        
        // Filter by allergies and dislikes
        const hasAllergy = userProfile.allergies.some(allergy => 
          recipe.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(allergy.toLowerCase())
          )
        );
        if (hasAllergy) return false;
        
        const hasDislikedFood = userProfile.dislikedFoods.some(dislike => 
          recipe.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(dislike.toLowerCase())
          ) || recipe.name.toLowerCase().includes(dislike.toLowerCase())
        );
        if (hasDislikedFood) return false;
        
        return true;
      });
      
      return filteredRecipes.slice(0, 10);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  private filterRecipes(recipes: Recipe[], filters?: RecipeFilters): Recipe[] {
    if (!filters) return recipes;
    
    return recipes.filter(recipe => {
      if (filters.category && recipe.category !== filters.category) return false;
      if (filters.cuisineType && recipe.cuisineType !== filters.cuisineType) return false;
      if (filters.maxCookingTime && recipe.totalTime > filters.maxCookingTime) return false;
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
      if (filters.maxCostPerServing && recipe.costPerServing && recipe.costPerServing > filters.maxCostPerServing) return false;
      
      if (filters.excludeIngredients) {
        const hasExcluded = filters.excludeIngredients.some(excluded => 
          recipe.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(excluded.toLowerCase())
          )
        );
        if (hasExcluded) return false;
      }
      
      if (filters.includeIngredients) {
        const hasIncluded = filters.includeIngredients.some(included => 
          recipe.ingredients.some(ingredient => 
            ingredient.name.toLowerCase().includes(included.toLowerCase())
          )
        );
        if (!hasIncluded) return false;
      }
      
      return true;
    });
  }

  // Get available categories
  async getCategories(): Promise<string[]> {
    try {
      const data = await this.fetchFromAPI('/categories.php');
      return data.categories?.map((cat: any) => cat.strCategory) || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get single recipe by ID
  async getRecipeById(id: string): Promise<Recipe | null> {
    try {
      const data: TheMealDBResponse = await this.fetchFromAPI(`/lookup.php?i=${id}`);
      return data.meals ? convertTheMealDBRecipe(data.meals[0]) : null;
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return null;
    }
  }
}

export const recipeService = new RecipeService(); 