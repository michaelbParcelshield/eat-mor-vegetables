import React, { useState } from 'react';
import { useUserStore, userUtils } from '../../store/userStore';
import { MVPUserProfile, SetupStep } from '../../types/User';
import { ChevronRight, ChevronLeft, Check, Users, DollarSign, Clock, ChefHat, Heart } from 'lucide-react';

const QuickSetup: React.FC = () => {
  const { profile, setupProgress, setProfile, completeSetupStep } = useUserStore();
  const [currentStep, setCurrentStep] = useState<SetupStep>(setupProgress.currentStep);
  const [formData, setFormData] = useState<Partial<MVPUserProfile>>(
    profile || userUtils.createInitialProfile()
  );
  const [errors, setErrors] = useState<string[]>([]);

  const steps = [
    { id: 1, title: 'Household & Budget', icon: Users },
    { id: 2, title: 'Food Preferences', icon: Heart },
    { id: 3, title: 'Cooking Reality', icon: ChefHat },
  ];

  const handleInputChange = (field: keyof MVPUserProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    setErrors([]);
  };

  const handleArrayInputChange = (field: keyof MVPUserProfile, value: string) => {
    if (value.trim()) {
      const currentArray = (formData[field] as string[]) || [];
      if (!currentArray.includes(value.trim())) {
        handleInputChange(field, [...currentArray, value.trim()]);
      }
    }
  };

  const removeArrayItem = (field: keyof MVPUserProfile, index: number) => {
    const currentArray = (formData[field] as string[]) || [];
    handleInputChange(field, currentArray.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.householdSize || formData.householdSize < 1) {
          newErrors.push('Household size must be at least 1');
        }
        if (!formData.weeklyBudget || formData.weeklyBudget < 10) {
          newErrors.push('Weekly budget must be at least $10');
        }
        break;
      case 2:
        // Optional validation for step 2
        break;
      case 3:
        if (!formData.cookingTime) {
          newErrors.push('Please select your available cooking time');
        }
        if (!formData.skillLevel) {
          newErrors.push('Please select your cooking skill level');
        }
        break;
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      completeSetupStep(currentStep);
      if (currentStep < 3) {
        setCurrentStep((currentStep + 1) as SetupStep);
      } else {
        // Complete setup
        const completeProfile: MVPUserProfile = {
          ...formData,
          householdSize: formData.householdSize || 2,
          weeklyBudget: formData.weeklyBudget || 100,
          currency: 'USD',
          allergies: formData.allergies || [],
          dislikedFoods: formData.dislikedFoods || [],
          preferredCuisines: formData.preferredCuisines || [],
          cookingTime: formData.cookingTime || '30min',
          skillLevel: formData.skillLevel || 'beginner',
          enjoysCooking: formData.enjoysCooking ?? true,
          createdAt: formData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setProfile(completeProfile);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as SetupStep);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start with the basics</h2>
        <p className="text-gray-600">Tell us about your household and budget</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How many people are in your household?
          </label>
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5, 6].map(size => (
              <button
                key={size}
                onClick={() => handleInputChange('householdSize', size)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  formData.householdSize === size
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's your weekly grocery budget?
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={formData.weeklyBudget || ''}
              onChange={(e) => handleInputChange('weeklyBudget', parseInt(e.target.value) || 0)}
              className="input pl-10"
              placeholder="100"
              min="10"
              max="1000"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Average American household spends $150-200/week on groceries
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Heart className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Food preferences</h2>
        <p className="text-gray-600">Help us personalize your recommendations</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any food allergies?
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {['Nuts', 'Dairy', 'Gluten', 'Shellfish', 'Eggs', 'Soy'].map(allergy => (
              <button
                key={allergy}
                onClick={() => {
                  const allergies = formData.allergies || [];
                  if (allergies.includes(allergy)) {
                    handleInputChange('allergies', allergies.filter(a => a !== allergy));
                  } else {
                    handleInputChange('allergies', [...allergies, allergy]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (formData.allergies || []).includes(allergy)
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {allergy}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {(formData.allergies || []).map((allergy, index) => (
              <span
                key={index}
                className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs flex items-center"
              >
                {allergy}
                <button
                  onClick={() => removeArrayItem('allergies', index)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foods you don't like (optional)
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g., mushrooms, olives, spinach"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleArrayInputChange('dislikedFoods', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <div className="flex flex-wrap gap-1 mt-2">
            {(formData.dislikedFoods || []).map((food, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center"
              >
                {food}
                <button
                  onClick={() => removeArrayItem('dislikedFoods', index)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-1">Press Enter to add items</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Favorite cuisines (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian'].map(cuisine => (
              <button
                key={cuisine}
                onClick={() => {
                  const cuisines = formData.preferredCuisines || [];
                  if (cuisines.includes(cuisine)) {
                    handleInputChange('preferredCuisines', cuisines.filter(c => c !== cuisine));
                  } else {
                    handleInputChange('preferredCuisines', [...cuisines, cuisine]);
                  }
                }}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  (formData.preferredCuisines || []).includes(cuisine)
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <ChefHat className="h-12 w-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cooking reality check</h2>
        <p className="text-gray-600">Let's match recipes to your actual situation</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How much time do you usually have to cook?
          </label>
          <div className="space-y-2">
            {[
              { value: '15min', label: '15 minutes or less', desc: 'Quick meals, minimal prep' },
              { value: '30min', label: '30 minutes', desc: 'Most weeknight dinners' },
              { value: '1hour', label: '1 hour or more', desc: 'Weekend cooking, elaborate meals' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleInputChange('cookingTime', option.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.cookingTime === option.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What's your cooking skill level?
          </label>
          <div className="space-y-2">
            {[
              { value: 'beginner', label: 'Beginner', desc: 'Basic recipes, simple techniques' },
              { value: 'intermediate', label: 'Intermediate', desc: 'Comfortable with most recipes' },
              { value: 'advanced', label: 'Advanced', desc: 'Enjoy complex cooking challenges' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => handleInputChange('skillLevel', option.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  formData.skillLevel === option.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Do you enjoy cooking?
          </label>
          <div className="flex space-x-4">
            {[
              { value: true, label: 'Yes, I love it!' },
              { value: false, label: 'Not really, but I have to' }
            ].map(option => (
              <button
                key={option.value.toString()}
                onClick={() => handleInputChange('enjoysCooking', option.value)}
                className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                  formData.enjoysCooking === option.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          {steps.map(step => (
            <span key={step.id} className="text-center">
              {step.title}
            </span>
          ))}
        </div>
      </div>

      {/* Current step content */}
      {renderCurrentStep()}

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside text-sm text-red-700">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          className={`btn flex items-center ${
            currentStep === 1
              ? 'btn-secondary opacity-50 cursor-not-allowed'
              : 'btn-secondary hover:bg-gray-300'
          }`}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </button>

        <button
          onClick={handleNext}
          className="btn-primary flex items-center"
        >
          {currentStep === 3 ? 'Complete Setup' : 'Next'}
          {currentStep < 3 && <ChevronRight className="h-4 w-4 ml-1" />}
        </button>
      </div>
    </div>
  );
};

export default QuickSetup; 