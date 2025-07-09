import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeeklyMealPlan, DayPlan, MealSlot, GroceryList, GroceryItem, DEFAULT_GROCERY_CATEGORIES } from '../types/MealPlan';
import { Recipe } from '../types/Recipe';
import { STORAGE_KEYS } from '../hooks/useLocalStorage';

interface MealPlanState {
  // Current meal plans
  mealPlans: WeeklyMealPlan[];
  currentMealPlan: WeeklyMealPlan | null;
  
  // Selected recipes for meal plan creation
  selectedRecipes: Recipe[];
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  
  // Actions
  addRecipeToSelection: (recipe: Recipe) => void;
  removeRecipeFromSelection: (recipeId: string) => void;
  clearSelectedRecipes: () => void;
  
  // Meal plan actions
  createMealPlan: (name: string, startDate: string, budget: number, recipesToUse?: Recipe[]) => Promise<WeeklyMealPlan>;
  getMealPlan: (id: string) => WeeklyMealPlan | null;
  updateMealPlan: (id: string, updates: Partial<WeeklyMealPlan>) => void;
  deleteMealPlan: (id: string) => void;
  
  // Current meal plan actions
  setCurrentMealPlan: (mealPlan: WeeklyMealPlan | null) => void;
  addRecipeToMealPlan: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', recipe: Recipe) => void;
  removeRecipeFromMealPlan: (dayIndex: number, mealSlotId: string) => void;
  
  // Grocery list actions
  generateGroceryList: (mealPlanId: string) => Promise<GroceryList>;
  updateGroceryItem: (mealPlanId: string, itemId: string, updates: Partial<GroceryItem>) => void;
  
  // Reset actions
  resetAllData: () => void;
}

// Utility functions
const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyWeek = (startDate: string): DayPlan[] => {
  const days: DayPlan[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    days.push({
      date: date.toISOString().split('T')[0],
      meals: [
        {
          id: generateId(),
          type: 'breakfast',
        },
        {
          id: generateId(),
          type: 'lunch',
        },
        {
          id: generateId(),
          type: 'dinner',
        }
      ]
    });
  }
  
  return days;
};

const calculateMealPlanCost = (days: DayPlan[]): number => {
  return days.reduce((total, day) => {
    const dayCost = day.meals.reduce((dayTotal, meal) => {
      return dayTotal + (meal.recipe?.costPerServing || 0) * (meal.servings || 1);
    }, 0);
    return total + dayCost;
  }, 0);
};

const distributeRecipesAutomatically = (recipes: Recipe[], days: DayPlan[]): DayPlan[] => {
  const updatedDays = [...days];
  let recipeIndex = 0;
  
  console.log('Distributing recipes:', recipes.length, 'recipes across', updatedDays.length, 'days');
  
  // Separate recipes by suitability for different meal types
  const breakfastSuitable = recipes.filter(r => 
    r.category === 'Breakfast' || 
    r.category === 'Dessert' || 
    r.totalTime <= 20 ||
    r.name.toLowerCase().includes('pancake') ||
    r.name.toLowerCase().includes('omelette') ||
    r.name.toLowerCase().includes('toast') ||
    r.name.toLowerCase().includes('egg')
  );
  
  const dinnerSuitable = recipes.filter(r => 
    r.category !== 'Breakfast' && 
    r.category !== 'Dessert'
  );
  
  console.log(`Categorized recipes: ${breakfastSuitable.length} breakfast-suitable, ${dinnerSuitable.length} dinner-suitable`);
  
  // Strategy: Distribute evenly across all meal types to ensure full coverage
  
  // First pass: Fill one meal slot per day to ensure every day has something
  for (let dayIndex = 0; dayIndex < updatedDays.length && recipeIndex < recipes.length; dayIndex++) {
    const day = updatedDays[dayIndex];
    
    // Prioritize dinner for the first pass
    const dinnerMeal = day.meals.find(meal => meal.type === 'dinner');
    if (dinnerMeal && !dinnerMeal.recipe && recipeIndex < recipes.length) {
      const recipe = dinnerSuitable.length > 0 ? dinnerSuitable[recipeIndex % dinnerSuitable.length] : recipes[recipeIndex];
      dinnerMeal.recipe = recipe;
      dinnerMeal.servings = 4;
      console.log(`Added ${recipe.name} to ${day.date} dinner (pass 1)`);
      recipeIndex++;
    }
  }
  
  // Second pass: Add breakfast to every day
  for (let dayIndex = 0; dayIndex < updatedDays.length && recipeIndex < recipes.length; dayIndex++) {
    const day = updatedDays[dayIndex];
    
    const breakfastMeal = day.meals.find(meal => meal.type === 'breakfast');
    if (breakfastMeal && !breakfastMeal.recipe && recipeIndex < recipes.length) {
      // Use breakfast-suitable recipes if available, otherwise any recipe
      const recipe = breakfastSuitable.length > 0 ? 
        breakfastSuitable[(recipeIndex - 7) % breakfastSuitable.length] : 
        recipes[recipeIndex];
      breakfastMeal.recipe = recipe;
      breakfastMeal.servings = 2; // Smaller serving for breakfast
      console.log(`Added ${recipe.name} to ${day.date} breakfast (pass 2)`);
      recipeIndex++;
    }
  }
  
  // Third pass: Add lunch to every day
  for (let dayIndex = 0; dayIndex < updatedDays.length && recipeIndex < recipes.length; dayIndex++) {
    const day = updatedDays[dayIndex];
    
    const lunchMeal = day.meals.find(meal => meal.type === 'lunch');
    if (lunchMeal && !lunchMeal.recipe && recipeIndex < recipes.length) {
      const recipe = recipes[recipeIndex];
      lunchMeal.recipe = recipe;
      lunchMeal.servings = 3; // Medium serving for lunch
      console.log(`Added ${recipe.name} to ${day.date} lunch (pass 3)`);
      recipeIndex++;
    }
  }
  
  // Fourth pass: Fill any remaining empty slots
  for (let dayIndex = 0; dayIndex < updatedDays.length && recipeIndex < recipes.length; dayIndex++) {
    const day = updatedDays[dayIndex];
    
    for (const meal of day.meals) {
      if (!meal.recipe && recipeIndex < recipes.length) {
        meal.recipe = recipes[recipeIndex % recipes.length]; // Cycle through recipes if needed
        meal.servings = meal.type === 'breakfast' ? 2 : meal.type === 'lunch' ? 3 : 4;
        console.log(`Added ${meal.recipe.name} to ${day.date} ${meal.type} (filling remaining slots)`);
        recipeIndex++;
      }
    }
  }
  
  console.log('Distribution complete. Used', recipeIndex, 'out of', recipes.length, 'recipes');
  
  // Log final distribution summary
  const summary = updatedDays.map((day, index) => ({
    day: index + 1,
    date: day.date,
    meals: day.meals.map(meal => ({
      type: meal.type,
      hasRecipe: !!meal.recipe,
      recipeName: meal.recipe?.name || 'Empty'
    }))
  }));
  console.log('Final meal plan distribution:', summary);
  
  return updatedDays;
};

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      mealPlans: [],
      currentMealPlan: null,
      selectedRecipes: [],
      isLoading: false,
      isCreating: false,

      addRecipeToSelection: (recipe: Recipe) => {
        const { selectedRecipes } = get();
        if (!selectedRecipes.find(r => r.id === recipe.id)) {
          set({ selectedRecipes: [...selectedRecipes, recipe] });
        }
      },

      removeRecipeFromSelection: (recipeId: string) => {
        const { selectedRecipes } = get();
        set({ selectedRecipes: selectedRecipes.filter(r => r.id !== recipeId) });
      },

      clearSelectedRecipes: () => {
        set({ selectedRecipes: [] });
      },

      createMealPlan: async (name: string, startDate: string, budget: number, recipesToUse?: Recipe[]) => {
        set({ isCreating: true });
        
        try {
          const { selectedRecipes, mealPlans } = get();
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);
          
          // Use provided recipes or fall back to selected recipes
          const recipes = recipesToUse || selectedRecipes;
          console.log('Creating meal plan with recipes:', recipes.length, 'recipes');
          console.log('Recipe names:', recipes.map(r => r.name));
          
          const emptyDays = createEmptyWeek(startDate);
          console.log('Empty days created:', emptyDays.length, 'days');
          
          const daysWithRecipes = distributeRecipesAutomatically(recipes, emptyDays);
          console.log('Days with recipes:', daysWithRecipes);
          
          const newMealPlan: WeeklyMealPlan = {
            id: generateId(),
            name,
            startDate,
            endDate: endDate.toISOString().split('T')[0],
            days: daysWithRecipes,
            totalBudget: budget,
            estimatedCost: calculateMealPlanCost(daysWithRecipes),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          console.log('Final meal plan created:', newMealPlan);
          
          set({ 
            mealPlans: [...mealPlans, newMealPlan],
            currentMealPlan: newMealPlan,
            selectedRecipes: [] // Clear selected recipes after creating meal plan
          });
          
          // Debug: Check what's actually been set in the store
          const updatedState = get();
          console.log('Store updated. Current meal plan:', updatedState.currentMealPlan);
          console.log('Store updated. All meal plans:', updatedState.mealPlans.length);
          
          return newMealPlan;
        } finally {
          set({ isCreating: false });
        }
      },

      getMealPlan: (id: string) => {
        const { mealPlans } = get();
        return mealPlans.find(plan => plan.id === id) || null;
      },

      updateMealPlan: (id: string, updates: Partial<WeeklyMealPlan>) => {
        const { mealPlans } = get();
        const updatedPlans = mealPlans.map(plan => 
          plan.id === id 
            ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
            : plan
        );
        set({ mealPlans: updatedPlans });
        
        // Update current meal plan if it's the one being updated
        const { currentMealPlan } = get();
        if (currentMealPlan?.id === id) {
          set({ currentMealPlan: { ...currentMealPlan, ...updates, updatedAt: new Date().toISOString() } });
        }
      },

      deleteMealPlan: (id: string) => {
        const { mealPlans, currentMealPlan } = get();
        const updatedPlans = mealPlans.filter(plan => plan.id !== id);
        set({ mealPlans: updatedPlans });
        
        // Clear current meal plan if it's the one being deleted
        if (currentMealPlan?.id === id) {
          set({ currentMealPlan: null });
        }
      },

      setCurrentMealPlan: (mealPlan: WeeklyMealPlan | null) => {
        set({ currentMealPlan: mealPlan });
      },

      addRecipeToMealPlan: (dayIndex: number, mealType: 'breakfast' | 'lunch' | 'dinner', recipe: Recipe) => {
        const { currentMealPlan } = get();
        if (!currentMealPlan) return;
        
        const updatedDays = [...currentMealPlan.days];
        const day = updatedDays[dayIndex];
        const mealSlot = day.meals.find(meal => meal.type === mealType);
        
        if (mealSlot) {
          mealSlot.recipe = recipe;
          mealSlot.servings = 4; // Default serving size
        }
        
        const estimatedCost = calculateMealPlanCost(updatedDays);
        const updatedMealPlan = {
          ...currentMealPlan,
          days: updatedDays,
          estimatedCost,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentMealPlan: updatedMealPlan });
        
        // Update in mealPlans array
        const state = get();
        const updatedPlans = state.mealPlans.map(plan => 
          plan.id === currentMealPlan.id ? updatedMealPlan : plan
        );
        set({ mealPlans: updatedPlans });
      },

      removeRecipeFromMealPlan: (dayIndex: number, mealSlotId: string) => {
        const { currentMealPlan } = get();
        if (!currentMealPlan) return;
        
        const updatedDays = [...currentMealPlan.days];
        const day = updatedDays[dayIndex];
        const mealSlot = day.meals.find(meal => meal.id === mealSlotId);
        
        if (mealSlot) {
          mealSlot.recipe = undefined;
          mealSlot.servings = undefined;
        }
        
        const estimatedCost = calculateMealPlanCost(updatedDays);
        const updatedMealPlan = {
          ...currentMealPlan,
          days: updatedDays,
          estimatedCost,
          updatedAt: new Date().toISOString()
        };
        
        set({ currentMealPlan: updatedMealPlan });
        
        // Update in mealPlans array
        const state2 = get();
        const updatedPlans = state2.mealPlans.map(plan => 
          plan.id === currentMealPlan.id ? updatedMealPlan : plan
        );
        set({ mealPlans: updatedPlans });
      },

      generateGroceryList: async (mealPlanId: string) => {
        const { mealPlans } = get();
        const mealPlan = mealPlans.find(plan => plan.id === mealPlanId);
        
        if (!mealPlan) {
          throw new Error('Meal plan not found');
        }
        
        const ingredientMap = new Map<string, GroceryItem>();
        
        // Collect all ingredients from all recipes in the meal plan
        mealPlan.days.forEach(day => {
          day.meals.forEach(meal => {
            if (meal.recipe) {
              meal.recipe.ingredients.forEach(ingredient => {
                const key = ingredient.name.toLowerCase();
                const servings = meal.servings || 1;
                
                if (ingredientMap.has(key)) {
                  const existingItem = ingredientMap.get(key)!;
                  existingItem.amount = `${existingItem.amount} + ${ingredient.amount}`;
                  existingItem.estimatedCost = (existingItem.estimatedCost || 0) + 
                    (ingredient.estimatedCost || 0) * servings;
                } else {
                  ingredientMap.set(key, {
                    id: generateId(),
                    name: ingredient.name,
                    amount: ingredient.amount,
                    unit: ingredient.unit,
                    category: DEFAULT_GROCERY_CATEGORIES[0], // Default to produce
                    estimatedCost: (ingredient.estimatedCost || 0) * servings,
                    isPurchased: false,
                    isOptional: false,
                    usedInRecipes: [meal.recipe!.id],
                    usedInMeals: [meal.id]
                  });
                }
              });
            }
          });
        });
        
        const groceryItems = Array.from(ingredientMap.values());
        const estimatedTotal = groceryItems.reduce((total, item) => total + (item.estimatedCost || 0), 0);
        
        const groceryList: GroceryList = {
          id: generateId(),
          weeklyMealPlanId: mealPlanId,
          items: groceryItems,
          categories: DEFAULT_GROCERY_CATEGORIES,
          estimatedTotal,
          totalItems: groceryItems.length,
          purchasedItems: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Update the meal plan with the grocery list
        const updatedMealPlan = {
          ...mealPlan,
          groceryList,
          updatedAt: new Date().toISOString()
        };
        
        const state3 = get();
        const updatedPlans = state3.mealPlans.map(plan => 
          plan.id === mealPlanId ? updatedMealPlan : plan
        );
        set({ mealPlans: updatedPlans });
        
        return groceryList;
      },

      updateGroceryItem: (mealPlanId: string, itemId: string, updates: Partial<GroceryItem>) => {
        const { mealPlans } = get();
        const mealPlan = mealPlans.find(plan => plan.id === mealPlanId);
        
        if (!mealPlan || !mealPlan.groceryList) return;
        
        const updatedItems = mealPlan.groceryList.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        
        const purchasedItems = updatedItems.filter(item => item.isPurchased).length;
        const actualTotal = updatedItems.reduce((total, item) => 
          total + (item.actualCost || item.estimatedCost || 0), 0
        );
        
        const updatedGroceryList = {
          ...mealPlan.groceryList,
          items: updatedItems,
          purchasedItems,
          actualTotal,
          updatedAt: new Date().toISOString()
        };
        
        const updatedMealPlan = {
          ...mealPlan,
          groceryList: updatedGroceryList,
          actualCost: actualTotal,
          updatedAt: new Date().toISOString()
        };
        
        const updatedPlans = mealPlans.map(plan => 
          plan.id === mealPlanId ? updatedMealPlan : plan
        );
        set({ mealPlans: updatedPlans });
      },

      resetAllData: () => {
        set({
          mealPlans: [],
          currentMealPlan: null,
          selectedRecipes: [],
          isLoading: false,
          isCreating: false
        });
      }
    }),
    {
      name: STORAGE_KEYS.MEAL_PLANS,
      partialize: (state) => ({
        mealPlans: state.mealPlans,
        currentMealPlan: state.currentMealPlan,
        selectedRecipes: state.selectedRecipes
      })
    }
  )
);

// Utility functions for components
export const mealPlanUtils = {
  formatDate: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  },

  getDayName: (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  },

  getWeekDateRange: (startDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  },

  calculateSavings: (budget: number, actualCost: number): number => {
    return Math.max(0, budget - actualCost);
  },

  getMealPlanProgress: (mealPlan: WeeklyMealPlan): number => {
    const totalMealSlots = mealPlan.days.reduce((total, day) => total + day.meals.length, 0);
    const filledSlots = mealPlan.days.reduce((total, day) => {
      return total + day.meals.filter(meal => meal.recipe).length;
    }, 0);
    
    return Math.round((filledSlots / totalMealSlots) * 100);
  }
}; 