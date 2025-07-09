import React, { useState } from 'react';
import { useUserStore } from './store/userStore';
import { useMealPlanStore } from './store/mealPlanStore';
import QuickSetup from './components/setup/QuickSetup';
import Dashboard from './components/dashboard/Dashboard';
import WeeklyPlanner from './components/planner/WeeklyPlanner';
import { Leaf } from 'lucide-react';

function App() {
  const { profile, isSetupComplete } = useUserStore();
  const { currentMealPlan } = useMealPlanStore();
  const [currentView, setCurrentView] = useState<'dashboard' | 'meal-plan'>('dashboard');

  // Show setup if user hasn't completed onboarding
  if (!profile || !isSetupComplete()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto pt-8 px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="h-8 w-8 text-primary-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Eat Mor Vegetables</h1>
            </div>
            <p className="text-gray-600">
              Make meal planning easy, budget-friendly, and time-saving
            </p>
          </div>
          <QuickSetup />
        </div>
      </div>
    );
  }

  const handleViewMealPlan = () => {
    setCurrentView('meal-plan');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'meal-plan':
        return <WeeklyPlanner onBack={handleBackToDashboard} />;
      case 'dashboard':
      default:
        return <Dashboard onViewMealPlan={handleViewMealPlan} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center hover:bg-gray-50 rounded-lg p-1 -ml-1"
              >
                <Leaf className="h-6 w-6 text-primary-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">Eat Mor Vegetables</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {currentMealPlan && (
                <button
                  onClick={handleViewMealPlan}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Current Plan
                </button>
              )}
              <span className="text-sm text-gray-600">
                Budget: ${profile.weeklyBudget}/week
              </span>
              <span className="text-sm text-gray-600">
                Household: {profile.householdSize} people
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App; 