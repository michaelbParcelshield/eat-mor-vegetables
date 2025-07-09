import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useMealPlanStore } from '../../store/mealPlanStore';
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
  Filter,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react';

interface DashboardProps {
  onViewMealPlan?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewMealPlan }) => {
  const { profile, resetProfile } = useUserStore();
  const { 
    selectedRecipes, 
    addRecipeToSelection, 
    removeRecipeFromSelection,
    createMealPlan,
    deleteMealPlan,
    currentMealPlan,
    isCreating,
    clearSelectedRecipes,
    resetAllData
  } = useMealPlanStore();
  const [recommendations, setRecommendations] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMealPlan, setShowCreateMealPlan] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
    addRecipeToSelection(recipe);
  };

  const handleCreateMealPlan = async (name: string, startDate: string, useRecommendations: boolean = false) => {
    if (!profile) return;
    
    try {
      let recipesToUse = selectedRecipes;
      
      // If user wants to use recommendations, automatically select top recipes
      if (useRecommendations && recommendations.length > 0) {
        // Clear current selection and use top recommendations
        clearSelectedRecipes();
        // Select top 10-12 recipes to fill the week
        recipesToUse = recommendations.slice(0, 12);
        // Add them to selection temporarily
        recipesToUse.forEach(recipe => addRecipeToSelection(recipe));
      }
      
      await createMealPlan(name, startDate, profile.weeklyBudget);
      setShowCreateMealPlan(false);
      onViewMealPlan?.();
    } catch (error) {
      console.error('Error creating meal plan:', error);
    }
  };

  const handleRemoveFromSelection = (recipeId: string) => {
    removeRecipeFromSelection(recipeId);
  };

  const handleDeleteMealPlan = () => {
    if (currentMealPlan) {
      deleteMealPlan(currentMealPlan.id);
    }
  };

  const handleResetAll = () => {
    resetAllData();
    resetProfile();
    setShowResetConfirm(false);
    // Force page reload to ensure clean state
    window.location.reload();
  };

  const getTimeDescription = (cookingTime: string) => {
    switch (cookingTime) {
      case '15min': return 'Quick meals';
      case '30min': return 'Regular cooking';
      case '1hour': return 'Elaborate meals';
      default: return 'Flexible';
    }
  };

  const CreateMealPlanModal: React.FC = () => {
    const [mealPlanName, setMealPlanName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [useAutoGeneration, setUseAutoGeneration] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (mealPlanName && startDate) {
        handleCreateMealPlan(mealPlanName, startDate, useAutoGeneration);
      }
    };

    if (!showCreateMealPlan) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create Meal Plan</h2>
            <button
              onClick={() => setShowCreateMealPlan(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Plan Name
              </label>
              <input
                type="text"
                value={mealPlanName}
                onChange={(e) => setMealPlanName(e.target.value)}
                className="input"
                placeholder="e.g., This Week's Meals"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Meal Selection</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mealSelection"
                    checked={useAutoGeneration}
                    onChange={() => setUseAutoGeneration(true)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Auto-generate from recommendations</span>
                    <p className="text-sm text-gray-600">
                      Automatically select {recommendations.length > 0 ? Math.min(12, recommendations.length) : 12} recipes based on your preferences
                    </p>
                  </div>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mealSelection"
                    checked={!useAutoGeneration}
                    onChange={() => setUseAutoGeneration(false)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Use selected recipes</span>
                    <p className="text-sm text-gray-600">
                      Use the {selectedRecipes.length} recipes you've manually selected
                    </p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">
                Budget: ${profile?.weeklyBudget}/week
              </p>
              <p className="text-sm text-gray-600">
                Household: {profile?.householdSize} people
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateMealPlan(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !mealPlanName || !startDate}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create Meal Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ResetConfirmModal: React.FC = () => {
    if (!showResetConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Reset All Data</h2>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              This will permanently delete all your data including:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Your profile and preferences</li>
              <li>All meal plans</li>
              <li>Selected recipes</li>
              <li>Grocery lists</li>
            </ul>
            <p className="text-sm text-red-600 font-medium">
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className={color}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here are your personalized meal recommendations.
          </p>
        </div>
        
        <div className="flex space-x-3">
          {currentMealPlan && (
            <button
              onClick={handleDeleteMealPlan}
              className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Meal Plan
            </button>
          )}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn-outline text-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Weekly Budget"
          value={`$${profile?.weeklyBudget}`}
          description="Available for meals"
          icon={<DollarSign className="h-6 w-6" />}
          color="text-green-600"
        />
        <StatsCard
          title="Household Size"
          value={`${profile?.householdSize}`}
          description="People to feed"
          icon={<div className="text-blue-600">👥</div>}
          color="text-blue-600"
        />
        <StatsCard
          title="Cooking Time"
          value={getTimeDescription(profile?.cookingTime || '')}
          description="Preferred duration"
          icon={<Clock className="h-6 w-6" />}
          color="text-purple-600"
        />
        <StatsCard
          title="Skill Level"
          value={profile?.skillLevel || 'Beginner'}
          description="Cooking experience"
          icon={<ChefHat className="h-6 w-6" />}
          color="text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowCreateMealPlan(true)}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <div className="text-center">
              <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Create Meal Plan</p>
              <p className="text-sm text-gray-600">Start planning your week</p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="text-center">
              <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">Browse Recipes</p>
              <p className="text-sm text-gray-600">Discover new meals</p>
            </div>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="font-medium text-gray-900">View Calendar</p>
              <p className="text-sm text-gray-600">See your meal schedule</p>
            </div>
          </button>
        </div>
      </div>

      {/* Selected Recipes */}
      {selectedRecipes.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Selected Recipes ({selectedRecipes.length})
            </h2>
            <button
              onClick={clearSelectedRecipes}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedRecipes.map(recipe => (
              <div key={recipe.id} className="relative">
                <RecipeCard recipe={recipe} />
                <button
                  onClick={() => handleRemoveFromSelection(recipe.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-6 w-6 text-yellow-500 mr-2" />
            Recommended for You
          </h2>
          <button className="btn-outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateMealPlanModal />
      <ResetConfirmModal />
    </div>
  );
};

export default Dashboard; 