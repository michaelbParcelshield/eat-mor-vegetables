# 🍽️ Complete Meal Planning Application - Development Plan

## 📋 Project Overview

A comprehensive meal planning application that combines intelligent data collection with real-time recipe recommendations, nutritional analysis, and budget-conscious grocery planning. Built with React 18 and TypeScript, featuring persistent local storage and seamless API integrations.

## 🏗️ Technical Architecture

### Frontend Stack

- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive design
- **React Hook Form** for form management and validation
- **Lucide React** for consistent iconography
- **React Query/TanStack Query** for API state management
- **Zustand** for global state management
- **React Router** for navigation
- **Framer Motion** for animations

### Backend Integration

- **Serverless Functions** (Vercel/Netlify) for API proxying only
- **Browser-only caching** (6h TTL for prices, 24h for recipes)
- **Local Storage** for persistent user data
- **No offline functionality** - online-only application

### Data Storage Strategy

- **Local Storage**: User profile, preferences, phone number
- **SessionStorage**: Form progress, temporary data
- **IndexedDB**: Recipe cache, nutrition data, price cache
- **No server-side storage** - client-side only

## 🔑 Required API Keys & Services

### Phase 1 (MVP) - Required Keys

1. **TheMealDB**

   - Type: Developer key (free, unlimited)
   - Purpose: Primary recipe database
   - Registration: https://www.themealdb.com/api.php
   - Cost: Free

2. **API Ninjas - Recipe API**

   - Type: API key (free tier: 50 calls/day)
   - Purpose: Backup recipe search
   - Registration: https://api.api-ninjas.com/
   - Cost: Free tier available

3. **USDA FoodData Central**

   - Type: API key (free, ~1000 calls/day soft limit)
   - Purpose: Nutritional data
   - Registration: https://fdc.nal.usda.gov/api-guide.html
   - Cost: Free

4. **Open Food Facts**

   - Type: No API key required
   - Purpose: Product UPC mapping and price data
   - Registration: None required
   - Cost: Free

5. **Kroger Public APIs**
   - Type: OAuth 2.0 client credentials
   - Purpose: Store-level pricing and cart integration
   - Registration: https://developer.kroger.com/
   - Cost: Free (10,000 product calls/day)

### Phase 2 - Optional Keys

1. **Edamam Recipe Search API**

   - Type: API key (free tier: 100 requests/day)
   - Purpose: Enhanced recipe search with nutrition metadata
   - Registration: https://developer.edamam.com/
   - Cost: Free tier available

2. **Walmart Product Lookup**
   - Type: Affiliate key
   - Purpose: Additional U.S. price coverage
   - Registration: https://developer.walmart.com/
   - Cost: Free with affiliate agreement

## 📊 Data Collection System

### User Profile Data Structure

```typescript
interface UserProfile {
  // Contact Information
  phoneNumber?: string; // Stored in localStorage

  // Demographics
  age: number;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  height: { feet: number; inches: number };
  weight: number; // pounds
  bodyComposition?: {
    bodyFatPercentage?: number;
    muscleMass?: number;
  };

  // Goals & Lifestyle
  primaryGoal:
    | "weight_loss"
    | "weight_gain"
    | "muscle_building"
    | "maintenance"
    | "energy"
    | "health"
    | "performance";
  activityLevel:
    | "sedentary"
    | "lightly_active"
    | "moderately_active"
    | "very_active"
    | "extremely_active";
  occupation:
    | "desk_job"
    | "physical"
    | "mixed"
    | "student"
    | "retired"
    | "other";
  schedule: {
    wakeTime: string;
    sleepTime: string;
    mealTimings: string[];
  };

  // Health & Dietary
  allergies: string[];
  intolerances: string[];
  chronicConditions: string[];
  medications: string[];
  supplements: string[];

  // Preferences
  preferredCuisines: string[];
  flavorProfiles: string[];
  lovedFoods: string[];
  dislikedFoods: string[];
  dietaryRestrictions: string[];

  // Cooking & Logistics
  cookingTime: "15min" | "30min" | "1hour" | "2hours" | "unlimited";
  skillLevel: "beginner" | "intermediate" | "advanced";
  enjoysCooking: boolean;

  // Budget & Access
  weeklyBudget: number;
  currency: string;
  budgetFlexibility: "strict" | "moderate" | "flexible";
  householdSize: number;
  foodAccess: {
    groceryDelivery: boolean;
    farmersMarket: boolean;
    bulkStores: boolean;
    specialtyStores: boolean;
  };
}
```

### 9-Step Data Collection Flow

#### Step 1: Welcome & Introduction

- Value proposition presentation
- Time commitment estimate (5-10 minutes)
- Privacy policy overview
- Progress indicator initialization

#### Step 2: Contact Information

- Optional phone number collection
- Local storage consent
- Privacy assurance messaging
- International format support

#### Step 3: Basic Demographics

- Age, gender, height, weight
- Optional body composition
- Clear data usage explanations

#### Step 4: Goals & Lifestyle Assessment

- Primary goal selection with visual guides
- Activity level with practical examples
- Schedule preferences with time pickers
- Occupation type classification

#### Step 5: Health & Dietary Conditions

- Allergies and intolerances (searchable multi-select)
- Chronic conditions (conditional logic)
- Medications and supplements
- Privacy assurances for sensitive data

#### Step 6: Food Preferences & Habits

- Cuisine preferences (visual selection)
- Flavor profiles
- Loved/disliked foods
- Dietary restrictions

#### Step 7: Cooking & Skill Assessment

- Available cooking time
- Skill level evaluation
- Cooking enjoyment assessment

#### Step 8: Budget & Logistics

- Weekly budget setting
- Household size
- Food access evaluation
- Special considerations

#### Step 9: Review & Confirmation

- Complete profile summary
- Edit capabilities for each section
- Data export options
- Phone number confirmation

## 🔄 API Integration Strategy

### Recipe Data Pipeline

```typescript
interface RecipeSearchStrategy {
  primary: "TheMealDB";
  fallback: "API_Ninjas";
  enhancement: "Edamam"; // Phase 2
}

// Caching Strategy
const RECIPE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const NUTRITION_CACHE_TTL = Infinity; // Until USDA update
const PRICE_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
```

### Nutrition Analysis Flow

1. **Ingredient Parsing**: Free-text → canonical IDs
2. **UPC Mapping**: Open Food Facts database
3. **Nutrition Lookup**: USDA FoodData Central
4. **Macro Calculation**: Custom algorithms
5. **DRI Comparison**: Local reference tables

### Budget & Pricing System

1. **Price Discovery**: Open Food Facts → Kroger API
2. **Store Selection**: User ZIP code → nearest Kroger
3. **Cart Integration**: Direct add-to-cart via Kroger API
4. **Fallback Pricing**: Cached estimates with "estimate" badge

## 💰 Free Tier Limitations & Strategies

### API Usage Limits (Daily)

- **TheMealDB**: Unlimited (but polite usage)
- **API Ninjas**: 50 calls/day (backup only)
- **USDA FoodData Central**: ~1000 calls/day soft limit
- **Kroger API**: 10,000 product calls/day
- **Open Food Facts**: No formal limit (respectful usage)

### Cost Mitigation Strategies

#### Recipe Search Optimization

- **Primary**: TheMealDB for main searches (unlimited)
- **Fallback**: API Ninjas only when TheMealDB fails
- **Caching**: 24h cache for all recipes
- **Bulk Loading**: Pre-load popular recipes during low-traffic periods

#### Nutrition Data Management

- **Bulk Download**: Download USDA nutrient database nightly
- **Local Processing**: Calculate nutrition locally from cached data
- **Ingredient Mapping**: Cache ingredient-to-nutrition mappings
- **Smart Queries**: Batch multiple ingredient lookups

#### Price Data Strategy

- **Store-Specific**: Limit to user's selected Kroger store
- **Throttling**: Max 3 requests/second to Kroger API
- **Aggressive Caching**: 6h cache with background refresh
- **Fallback Pricing**: Use Open Food Facts when Kroger unavailable

#### Usage Monitoring

- **Daily Quotas**: Track API usage per service
- **Circuit Breakers**: Disable services when approaching limits
- **Graceful Degradation**: Show cached data when APIs unavailable
- **User Notifications**: Inform users when features are temporarily limited

## 📁 Project Structure

```
meal-planning-app/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── FormField.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── PhoneInput.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── forms/
│   │   │   ├── ContactInfoForm.tsx
│   │   │   ├── BasicInfoForm.tsx
│   │   │   ├── GoalsForm.tsx
│   │   │   ├── HealthForm.tsx
│   │   │   ├── PreferencesForm.tsx
│   │   │   └── LogisticsForm.tsx
│   │   ├── steps/
│   │   │   ├── WelcomeStep.tsx
│   │   │   ├── ContactInfoStep.tsx
│   │   │   ├── BasicInfoStep.tsx
│   │   │   ├── GoalsLifestyleStep.tsx
│   │   │   ├── HealthConditionsStep.tsx
│   │   │   ├── PreferencesHabitsStep.tsx
│   │   │   ├── MealLogisticsStep.tsx
│   │   │   ├── ReviewStep.tsx
│   │   │   └── CompleteStep.tsx
│   │   ├── dashboard/
│   │   │   ├── MealPlanView.tsx
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── NutritionMeter.tsx
│   │   │   ├── BudgetTracker.tsx
│   │   │   └── GroceryList.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Navigation.tsx
│   │       └── Footer.tsx
│   ├── hooks/
│   │   ├── useFormProgress.ts
│   │   ├── useLocalStorage.ts
│   │   ├── usePhoneStorage.ts
│   │   ├── useRecipeSearch.ts
│   │   ├── useNutritionData.ts
│   │   ├── usePriceData.ts
│   │   └── useGroceryCart.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── recipeService.ts
│   │   │   ├── nutritionService.ts
│   │   │   ├── priceService.ts
│   │   │   └── groceryService.ts
│   │   ├── cache/
│   │   │   ├── recipeCache.ts
│   │   │   ├── nutritionCache.ts
│   │   │   └── priceCache.ts
│   │   └── storage/
│   │       ├── localStorage.ts
│   │       ├── sessionStorage.ts
│   │       └── indexedDB.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── calculations.ts
│   │   ├── phoneUtils.ts
│   │   ├── nutritionUtils.ts
│   │   ├── priceUtils.ts
│   │   └── formatters.ts
│   ├── types/
│   │   ├── UserProfile.ts
│   │   ├── Recipe.ts
│   │   ├── Nutrition.ts
│   │   ├── Price.ts
│   │   └── API.ts
│   ├── constants/
│   │   ├── formOptions.ts
│   │   ├── validationRules.ts
│   │   ├── apiEndpoints.ts
│   │   └── nutritionReferences.ts
│   └── store/
│       ├── userProfileStore.ts
│       ├── recipeStore.ts
│       ├── nutritionStore.ts
│       └── groceryStore.ts
├── public/
│   ├── index.html
│   └── manifest.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## 🚀 Implementation Timeline (6-8 Weeks)

### Week 1-2: Foundation Setup

- [ ] Project initialization and dependency setup
- [ ] API key acquisition and configuration
- [ ] Basic form components and validation
- [ ] Local storage utilities
- [ ] Phone number collection and storage
- [ ] Progress tracking system

### Week 3-4: Core Data Collection

- [ ] All 9 data collection steps
- [ ] Form validation and error handling
- [ ] Conditional logic implementation
- [ ] Local storage persistence
- [ ] Mobile responsiveness

### Week 5-6: API Integration

- [ ] Recipe search implementation (TheMealDB + API Ninjas)
- [ ] Nutrition data pipeline (USDA FoodData Central)
- [ ] Price data integration (Open Food Facts + Kroger)
- [ ] Caching layer implementation
- [ ] Rate limiting and error handling

### Week 7-8: Dashboard & Features

- [ ] Meal planning dashboard
- [ ] Recipe recommendations
- [ ] Nutrition meters and analysis
- [ ] Budget tracking
- [ ] **Kroger cart integration (PRIMARY FEATURE)**
- [ ] Grocery list generation
- [ ] Export functionality

## 🎯 MVP Priority Features

### Critical Path (Must Have)

1. **Data Collection Flow** - All 9 steps with local storage
2. **Recipe Search** - TheMealDB integration with caching
3. **Nutrition Analysis** - USDA data with local processing
4. **Kroger Integration** - Store location, pricing, cart functionality
5. **Budget Tracking** - Real-time price calculations

### Secondary Features (Nice to Have)

1. **API Ninjas Fallback** - Only when TheMealDB fails
2. **Advanced Nutrition** - Detailed macro breakdowns
3. **Export Functionality** - JSON/CSV data export
4. **Mobile Optimization** - Responsive design polish

### Future Enhancements (Phase 2)

1. **Edamam Integration** - Enhanced recipe metadata
2. **Walmart Pricing** - Alternative price sources
3. **Meal Scheduling** - Calendar integration
4. **Social Features** - Recipe sharing

## 🔒 Data Privacy & Security

### Local Storage Strategy

- **Phone Number**: Stored in localStorage with user consent
- **Profile Data**: Compressed and stored locally
- **API Keys**: Server-side proxying only, never exposed to client
- **Cache Data**: Temporary with TTL expiration

### Privacy Measures

- No server transmission of personal data
- Optional data collection with clear explanations
- User control over data deletion
- All data stored locally in browser
- No tracking or analytics

## 📈 Success Metrics

### User Experience KPIs

- Form completion rate: >80%
- Average completion time: <10 minutes
- User satisfaction: >4.5/5
- Phone number collection: >60%
- Return user rate: >40%

### Technical KPIs

- API response time: <500ms
- Cache hit rate: >85%
- Error rate: <1%
- Mobile performance: >90 Lighthouse score

## 🔄 Phase 2 Enhancements

### Advanced Features

- [ ] Edamam Recipe API integration
- [ ] Walmart price comparison
- [ ] Advanced nutrition analysis
- [ ] Meal scheduling and reminders
- [ ] Social features and sharing
- [ ] Dietitian consultation integration

### API Rate Limit Triggers

- **Edamam**: Activate when daily recipe queries > 100
- **Walmart**: Add when >25% of users lack nearby Kroger
- **Advanced Nutrition**: When nutrition becomes key differentiator

## ✅ Finalized Project Decisions

Based on requirements clarification:

1. **Geographic Focus**: US-only (simplifies API integrations)
2. **User Authentication**: Local storage only (no user accounts)
3. **Offline Functionality**: Not required (online-only application)
4. **Accessibility Requirements**: Basic accessibility (no WCAG compliance)
5. **Analytics**: No tracking or analytics
6. **Deployment**: Web application (existing deployment pipeline)
7. **Grocery Integration**: Primary feature (Kroger cart integration)
8. **Budget Constraints**: Must remain free (strict free-tier usage)

## 🎯 Ready for Development

This plan provides a complete roadmap for building a comprehensive meal planning application with Cursor. The architecture is optimized for:

- **Zero-cost operation** with free API tiers
- **US-focused** grocery integration
- **Privacy-first** local storage approach
- **Simplified deployment** as a web application
- **Robust caching** to maximize free tier usage

The modular structure ensures maintainability while the phase-based approach allows for iterative development and testing within the 6-8 week timeline.
