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

  // Get recipes by area/cuisine
  async getRecipesByArea(area: string): Promise<Recipe[]> {
    try {
      const data: TheMealDBResponse = await this.fetchFromAPI(`/filter.php?a=${encodeURIComponent(area)}`);
      
      if (!data.meals) return [];
      
      // TheMealDB filter endpoint only returns basic info, need to fetch full recipes
      const detailedRecipes = await Promise.all(
        data.meals.slice(0, 8).map(async (meal) => {
          const detailData: TheMealDBResponse = await this.fetchFromAPI(`/lookup.php?i=${meal.idMeal}`);
          return detailData.meals ? convertTheMealDBRecipe(detailData.meals[0]) : null;
        })
      );
      
      return detailedRecipes.filter(Boolean) as Recipe[];
    } catch (error) {
      console.error('Error fetching recipes by area:', error);
      return [];
    }
  }

  // Get recipe recommendations based on user profile
  async getRecommendations(userProfile: MVPUserProfile): Promise<Recipe[]> {
    try {
      console.log('=== RECOMMENDATION ALGORITHM ===');
      console.log('User profile:', userProfile);
      
      const maxCookTime = userProfile.cookingTime === "15min" ? 15 : 
                         userProfile.cookingTime === "30min" ? 30 : 60;
      const maxCostPerServing = userProfile.weeklyBudget / 21; // 3 meals/day * 7 days
      
      console.log('Max cook time:', maxCookTime, 'minutes');
      console.log('Max cost per serving:', maxCostPerServing);
      console.log('Preferred cuisines:', userProfile.preferredCuisines);
      console.log('Allergies:', userProfile.allergies);
      console.log('Disliked foods:', userProfile.dislikedFoods);
      
      let allRecipes: Recipe[] = [];
      
             // 1. First try to get recipes from preferred cuisines
       if (userProfile.preferredCuisines && userProfile.preferredCuisines.length > 0) {
         console.log('Getting recipes from preferred cuisines...');
         for (const cuisine of userProfile.preferredCuisines) {
           try {
             const cuisineRecipes = await this.getRecipesByArea(cuisine);
             allRecipes.push(...cuisineRecipes);
             console.log(`Added ${cuisineRecipes.length} recipes from ${cuisine} cuisine`);
           } catch (error) {
             console.log(`Could not get recipes for ${cuisine} cuisine:`, error);
           }
         }
       }
       
       // 2. Add breakfast-friendly recipes
       const breakfastCategories = ['Breakfast', 'Dessert', 'Miscellaneous'];
       console.log('Getting breakfast-friendly recipes...');
       for (const category of breakfastCategories) {
         try {
           const categoryRecipes = await this.getRecipesByCategory(category);
           allRecipes.push(...categoryRecipes);
           console.log(`Added ${categoryRecipes.length} recipes from ${category} category`);
         } catch (error) {
           console.log(`Could not get recipes for ${category} category:`, error);
         }
       }
       
       // 3. Add recipes from popular categories to expand the pool
       const popularCategories = ['Chicken', 'Vegetarian', 'Pasta', 'Seafood', 'Beef', 'Pork'];
       console.log('Getting recipes from popular categories...');
       for (const category of popularCategories) {
         try {
           const categoryRecipes = await this.getRecipesByCategory(category);
           allRecipes.push(...categoryRecipes);
           console.log(`Added ${categoryRecipes.length} recipes from ${category} category`);
         } catch (error) {
           console.log(`Could not get recipes for ${category} category:`, error);
         }
       }
       
       // 4. Add random recipes to expand the pool further
       const randomRecipes = await this.getRandomRecipes(50);
       allRecipes.push(...randomRecipes);
       console.log(`Added ${randomRecipes.length} random recipes`);
       console.log(`Total recipes pool: ${allRecipes.length} recipes`);
      
      // 3. Remove duplicates
      const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
        index === self.findIndex(r => r.id === recipe.id)
      );
      console.log(`After removing duplicates: ${uniqueRecipes.length} recipes`);
      
             // 4. Filter based on user constraints (with fallback flexibility)
       let filteredRecipes = uniqueRecipes.filter(recipe => {
         // STRICT filtering first
         
         // Filter by allergies (STRICT - never compromise on safety)
         const hasAllergy = userProfile.allergies.some(allergy => 
           recipe.ingredients.some(ingredient => 
             ingredient.name.toLowerCase().includes(allergy.toLowerCase())
           ) || recipe.name.toLowerCase().includes(allergy.toLowerCase())
         );
         if (hasAllergy) {
           console.log(`Filtered out ${recipe.name} - contains allergen`);
           return false;
         }
         
         return true;
       });
       
       console.log(`After allergy filtering: ${filteredRecipes.length} recipes`);
       
       // If we have very few recipes after allergy filtering, be less strict on other criteria
       const needsMoreRecipes = filteredRecipes.length < 20;
       
       if (!needsMoreRecipes) {
         // Apply all other filters normally
         filteredRecipes = filteredRecipes.filter(recipe => {
           // Filter by cooking time
           if (recipe.totalTime > maxCookTime) {
             console.log(`Filtered out ${recipe.name} - too long to cook (${recipe.totalTime}m > ${maxCookTime}m)`);
             return false;
           }
           
           // Filter by difficulty
           if (userProfile.skillLevel === "beginner" && recipe.difficulty !== "beginner") {
             console.log(`Filtered out ${recipe.name} - too difficult (${recipe.difficulty} > beginner)`);
             return false;
           }
           if (userProfile.skillLevel === "intermediate" && recipe.difficulty === "advanced") {
             console.log(`Filtered out ${recipe.name} - too difficult (${recipe.difficulty} > intermediate)`);
             return false;
           }
           
           // Filter by budget (cost per serving)
           if (recipe.costPerServing && recipe.costPerServing > maxCostPerServing) {
             console.log(`Filtered out ${recipe.name} - too expensive ($${recipe.costPerServing} > $${maxCostPerServing})`);
             return false;
           }
           
           // Filter by dislikes
           const hasDislikedFood = userProfile.dislikedFoods.some(dislike => 
             recipe.ingredients.some(ingredient => 
               ingredient.name.toLowerCase().includes(dislike.toLowerCase())
             ) || recipe.name.toLowerCase().includes(dislike.toLowerCase()) ||
             recipe.category.toLowerCase().includes(dislike.toLowerCase())
           );
           if (hasDislikedFood) {
             console.log(`Filtered out ${recipe.name} - contains disliked food`);
             return false;
           }
           
           return true;
         });
       } else {
         console.log('⚠️  Very few recipes after allergy filtering. Being more flexible with other criteria...');
         
         // Apply more lenient filtering
         filteredRecipes = filteredRecipes.filter(recipe => {
           // Be more lenient with cooking time (add 50% buffer)
           const flexibleMaxCookTime = maxCookTime * 1.5;
           if (recipe.totalTime > flexibleMaxCookTime) {
             console.log(`Filtered out ${recipe.name} - too long to cook (${recipe.totalTime}m > ${flexibleMaxCookTime}m) [lenient]`);
             return false;
           }
           
           // Be more lenient with difficulty (beginners can try intermediate)
           if (userProfile.skillLevel === "beginner" && recipe.difficulty === "advanced") {
             console.log(`Filtered out ${recipe.name} - too difficult (advanced for beginner) [lenient]`);
             return false;
           }
           
           // Be more lenient with budget (add 25% buffer)
           const flexibleMaxCost = maxCostPerServing * 1.25;
           if (recipe.costPerServing && recipe.costPerServing > flexibleMaxCost) {
             console.log(`Filtered out ${recipe.name} - too expensive ($${recipe.costPerServing} > $${flexibleMaxCost}) [lenient]`);
             return false;
           }
           
           // Still filter strong dislikes but be more forgiving
           const hasStrongDislike = userProfile.dislikedFoods.some(dislike => 
             recipe.name.toLowerCase().includes(dislike.toLowerCase()) ||
             recipe.category.toLowerCase().includes(dislike.toLowerCase())
           );
           if (hasStrongDislike) {
             console.log(`Filtered out ${recipe.name} - strong dislike match [lenient]`);
             return false;
           }
           
           return true;
         });
       }
      
      console.log(`Final filtered recipes: ${filteredRecipes.length} recipes`);
      
      // 5. Prioritize preferred cuisines at the top
      const sortedRecipes = filteredRecipes.sort((a, b) => {
        const aIsPreferred = userProfile.preferredCuisines?.includes(a.area || '') || false;
        const bIsPreferred = userProfile.preferredCuisines?.includes(b.area || '') || false;
        
        if (aIsPreferred && !bIsPreferred) return -1;
        if (!aIsPreferred && bIsPreferred) return 1;
        
        // Secondary sort by cost (cheaper first)
        return (a.costPerServing || 0) - (b.costPerServing || 0);
      });
      
             // Need at least 21 recipes for a full week (7 breakfast + 7 lunch + 7 dinner)
       const recommendations = sortedRecipes.slice(0, Math.max(25, sortedRecipes.length));
       console.log('Final recommendations:', recommendations.map(r => ({ name: r.name, area: r.area, cost: r.costPerServing, category: r.category })));
       console.log(`Returning ${recommendations.length} recommendations for meal planning`);
       
       return recommendations;
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