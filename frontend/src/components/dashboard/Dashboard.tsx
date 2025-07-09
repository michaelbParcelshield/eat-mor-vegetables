import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { recipeService } from '../../services/recipeService';
import { Recipe } from '../../types/Recipe';
import { 
  Calendar, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  ChefHat, 
  Plus, 
  Sparkles,
  Heart,
  Filter
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile } = useUserStore();
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (profile) {
        setLoading(true);
        try {
          const recipes = await recipeService.getRecommendations(profile);
          setRecommendations(recipes);
        } catch (error) {
          console.error('Error loading recommendations:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRecommendations();
  }, [profile]);

  const handleAddToMealPlan = (recipe: Recipe) => {
    setSelectedRecipes(prev => [...prev, recipe]);
    // TODO: Add to actual meal plan store
  };

  const getBudgetPerMeal = () => {
    if (!profile) return 0;
    return profile.weeklyBudget / 21; // 3 meals * 7 days
  };

  const getTimeDescription = (cookingTime: string) => {
    switch (cookingTime) {
      case '15min': return 'Quick meals';
      case '30min': return 'Regular cooking';
      case '1hour': return 'Elaborate meals';
      default: return 'Flexible';
    }
  };

  const RecipeCard: React.FC<{ recipe: Recipe }> = ({ recipe }) => (
    <div className="card hover:shadow-md transition-shadow">
      <div className="relative">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
        <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
          <Heart className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-gray-900">{recipe.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {recipe.totalTime}m
          </div>
          <div className="flex items-center">
            <ChefHat className="h-4 w-4 mr-1" />
            {recipe.difficulty}
          </div>
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-1" />
            ${recipe.costPerServing?.toFixed(2)}
          </div>
        </div>
        
        <div className="pt-2">
          <button
            onClick={() => handleAddToMealPlan(recipe)}
            className="w-full btn-primary flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add to Meal Plan
          </button>
        </div>
      </div>
    </div>
  );

  const StatsCard: React.FC<{ 
    title: string; 
    value: string; 
    description: string; 
    icon: React.ReactNode; 
    color: string;
  }> = ({ title, value, description, icon, color }) => (
    <div className={`card ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="text-primary-600">
          {icon}
        </div>
      </div>
    </div>
  );

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Let's plan some delicious and budget-friendly meals
          </p>
        </div>
        <div className="flex space-x-4">
          <button className="btn-outline">
            <Calendar className="h-4 w-4 mr-2" />
            View Meal Plan
          </button>
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            New Meal Plan
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Weekly Budget"
          value={`$${profile.weeklyBudget}`}
          description="For groceries & meals"
          icon={<DollarSign className="h-8 w-8" />}
          color="bg-green-50"
        />
        <StatsCard
          title="Household Size"
          value={`${profile.householdSize}`}
          description="People to feed"
          icon={<Calendar className="h-8 w-8" />}
          color="bg-blue-50"
        />
        <StatsCard
          title="Cooking Time"
          value={getTimeDescription(profile.cookingTime)}
          description="Available for cooking"
          icon={<Clock className="h-8 w-8" />}
          color="bg-purple-50"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="card hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold">Plan This Week</h3>
              <p className="text-sm text-gray-600">Create meal schedule</p>
            </div>
          </div>
        </button>
        
        <button className="card hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Grocery List</h3>
              <p className="text-sm text-gray-600">Generate shopping list</p>
            </div>
          </div>
        </button>
        
        <button className="card hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Get Inspired</h3>
              <p className="text-sm text-gray-600">Discover new recipes</p>
            </div>
          </div>
        </button>
        
        <button className="card hover:shadow-md transition-shadow text-left">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Budget Tracker</h3>
              <p className="text-sm text-gray-600">Monitor spending</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recipe Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Perfect for You
            </h2>
            <p className="text-gray-600">
              Based on your preferences and budget (${getBudgetPerMeal().toFixed(2)}/meal)
            </p>
          </div>
          <div className="flex space-x-4">
            <button className="btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
            <button className="btn-outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-200 h-3 rounded w-full"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No recommendations yet
            </h3>
            <p className="text-gray-600 mb-4">
              We're having trouble finding recipes that match your preferences.
            </p>
            <button className="btn-primary">
              <Sparkles className="h-4 w-4 mr-2" />
              Try Different Filters
            </button>
          </div>
        )}
      </div>

      {/* Selected Recipes */}
      {selectedRecipes.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Added to Meal Plan ({selectedRecipes.length})
            </h3>
            <button className="btn-primary">
              <Calendar className="h-4 w-4 mr-2" />
              Create Meal Plan
            </button>
          </div>
          <div className="flex space-x-4 overflow-x-auto">
            {selectedRecipes.map((recipe, index) => (
              <div key={index} className="flex-shrink-0 w-48">
                <img
                  src={recipe.image}
                  alt={recipe.name}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h4 className="font-medium text-sm text-gray-900">{recipe.name}</h4>
                <p className="text-xs text-gray-500">${recipe.costPerServing?.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 