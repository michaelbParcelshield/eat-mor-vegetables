import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import QuickSetup from './components/setup/QuickSetup';
import Dashboard from './components/dashboard/Dashboard';
import { Leaf } from 'lucide-react';

function App() {
  const { profile, isSetupComplete } = useUserStore();

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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Leaf className="h-6 w-6 text-primary-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">Eat Mor Vegetables</span>
            </div>
            <div className="flex items-center space-x-4">
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/setup" element={<QuickSetup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 