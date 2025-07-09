import React, { useState } from 'react';
import { useMealPlanStore, mealPlanUtils } from '../../store/mealPlanStore';
import { useUserStore } from '../../store/userStore';
import { 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  ChefHat, 
  Plus, 
  ArrowLeft,
  Edit,
  Trash2
} from 'lucide-react';
import { Recipe } from '../../types/Recipe';
import { MealSlot } from '../../types/MealPlan';

interface WeeklyPlannerProps {
  onBack: () => void;
}

const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({ onBack }) => {
  const { profile } = useUserStore();
  const { 
    currentMealPlan, 
    generateGroceryList,
    addRecipeToMealPlan,
    removeRecipeFromMealPlan 
  } = useMealPlanStore();
  const [showGroceryList, setShowGroceryList] = useState(false);

  // Debug: Log the current meal plan data
  console.log('WeeklyPlanner: Current meal plan:', currentMealPlan);
  if (currentMealPlan) {
    console.log('WeeklyPlanner: Days:', currentMealPlan.days);
    currentMealPlan.days.forEach((day, index) => {
      console.log(`Day ${index + 1} (${day.date}):`, day.meals);
    });
  }

  if (!currentMealPlan) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No meal plan selected
        </h3>
        <p className="text-gray-600 mb-4">
          Create a meal plan to get started.
        </p>
        <button onClick={onBack} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleGenerateGroceryList = async () => {
    try {
      await generateGroceryList(currentMealPlan.id);
      setShowGroceryList(true);
    } catch (error) {
      console.error('Error generating grocery list:', error);
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥪';
      case 'dinner': return '🍽️';
      default: return '🍴';
    }
  };

  const MealSlotCard: React.FC<{ 
    meal: MealSlot; 
    dayIndex: number; 
  }> = ({ meal, dayIndex }) => (
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="mr-2">{getMealTypeIcon(meal.type)}</span>
          <span className="font-medium text-sm text-gray-700 capitalize">
            {meal.type}
          </span>
        </div>
        {meal.recipe && (
          <button
            onClick={() => removeRecipeFromMealPlan(dayIndex, meal.id)}
            className="text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {meal.recipe ? (
        <div>
          <img
            src={meal.recipe.image}
            alt={meal.recipe.name}
            className="w-full h-20 object-cover rounded mb-2"
          />
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
            {meal.recipe.name}
          </h4>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {meal.recipe.totalTime}m
            </div>
            <div className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              ${meal.recipe.costPerServing?.toFixed(2)}
            </div>
          </div>
          {meal.servings && (
            <p className="text-xs text-gray-500 mt-1">
              Servings: {meal.servings}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <Plus className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Add recipe</p>
          <button className="text-xs text-primary-600 hover:text-primary-700 mt-1">
            Browse recipes
          </button>
        </div>
      )}
    </div>
  );

  const GroceryListModal: React.FC = () => {
    if (!showGroceryList || !currentMealPlan.groceryList) return null;

    const { groceryList } = currentMealPlan;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Grocery List</h2>
            <button
              onClick={() => setShowGroceryList(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Total:</span>
              <span className="text-lg font-bold text-primary-600">
                ${groceryList.estimatedTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {groceryList.totalItems} items • {groceryList.purchasedItems} purchased
            </div>
          </div>

          <div className="space-y-4">
            {groceryList.categories.map(category => {
              const categoryItems = groceryList.items.filter(
                item => item.category.id === category.id
              );
              
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id}>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {categoryItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.isPurchased}
                            onChange={() => {/* TODO: implement toggle */}}
                            className="mr-3"
                          />
                          <div>
                            <span className={`${item.isPurchased ? 'line-through text-gray-500' : ''}`}>
                              {item.name}
                            </span>
                            <div className="text-sm text-gray-500">
                              {item.amount} {item.unit}
                            </div>
                          </div>
                        </div>
                        <span className="font-medium">
                          ${(item.estimatedCost || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const progress = mealPlanUtils.getMealPlanProgress(currentMealPlan);
  const savings = mealPlanUtils.calculateSavings(
    currentMealPlan.totalBudget, 
    currentMealPlan.estimatedCost
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentMealPlan.name}
            </h1>
            <p className="text-gray-600">
              {mealPlanUtils.getWeekDateRange(currentMealPlan.startDate)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleGenerateGroceryList}
            className="btn-outline"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {currentMealPlan.groceryList ? 'View' : 'Generate'} Grocery List
          </button>
          <button className="btn-outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">{progress}%</p>
            </div>
            <Calendar className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentMealPlan.totalBudget}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estimated Cost</p>
              <p className="text-2xl font-bold text-gray-900">
                ${currentMealPlan.estimatedCost.toFixed(2)}
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Savings</p>
              <p className="text-2xl font-bold text-green-600">
                ${savings.toFixed(2)}
              </p>
            </div>
            <div className="text-green-500">💰</div>
          </div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Meal Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {currentMealPlan.days.map((day, dayIndex) => (
            <div key={day.date} className="space-y-3">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900">
                  {mealPlanUtils.getDayName(day.date)}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(day.date).getDate()}
                </p>
              </div>
              
              <div className="space-y-2">
                {day.meals.map(meal => (
                  <MealSlotCard
                    key={meal.id}
                    meal={meal}
                    dayIndex={dayIndex}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grocery List Modal */}
      <GroceryListModal />
    </div>
  );
};

export default WeeklyPlanner; 