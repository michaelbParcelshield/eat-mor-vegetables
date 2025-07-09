npm# 🍽️ Meal Planning MVP - "Eat Mor Vegetables"

## 🎯 Core Problem Statement
People struggle to eat healthy, save money, and save time around meals. They waste food, make last-minute decisions, and either eat poorly or overspend on takeout.

## 🚀 MVP Solution Focus
Build a React 18 application that makes meal planning **simple, budget-conscious, and time-saving** with just the essential features people actually need.

---

## ✨ MVP Feature Set (3-4 Week Build)

### 🔥 Critical Features (Week 1-2)

#### 1. **Quick User Setup** (Simplified to 3 steps)
```typescript
interface MVPUserProfile {
  // Step 1: Basic Info
  householdSize: number;
  weeklyBudget: number;
  
  // Step 2: Dietary Basics
  allergies: string[];
  dislikedFoods: string[];
  
  // Step 3: Time & Skill
  cookingTime: "15min" | "30min" | "1hour";
  skillLevel: "beginner" | "intermediate" | "advanced";
}
```

#### 2. **Smart Recipe Recommendations**
- **Source**: TheMealDB (free, unlimited)
- **Filter by**: Budget, time, skill level, dietary restrictions
- **Display**: Recipe cards with prep time, estimated cost, difficulty

#### 3. **Automatic Grocery Lists**
- Generate shopping lists from selected recipes
- Group ingredients by grocery store sections
- Show estimated total cost
- Mark items as "have at home"

#### 4. **Budget Tracker**
- Weekly budget vs. actual spending
- Cost per meal calculation
- "Budget-friendly" recipe highlighting

### 🎯 Essential Features (Week 3)

#### 5. **7-Day Meal Planner**
- Simple drag-and-drop meal assignment
- Breakfast, lunch, dinner slots
- Leftover suggestions to reduce waste

#### 6. **Local Storage Data**
- Save user preferences
- Cache selected recipes
- Persist meal plans

### 📱 Core User Flow

```
1. Quick Setup (5 minutes)
   ↓
2. Get Recipe Recommendations 
   ↓
3. Build Weekly Meal Plan
   ↓
4. Generate Grocery List
   ↓
5. Track Budget & Shop
```

---

## 🛠️ Technical MVP Stack

### **Frontend Only** (Simplified Architecture)
```
React 18 + TypeScript
├── Tailwind CSS (styling)
├── React Hook Form (forms)
├── Zustand (state management)
├── Local Storage (persistence)
└── Fetch API (HTTP requests)
```

### **API Integration** (Minimal)
- **TheMealDB**: Recipe data (free, unlimited)
- **USDA FoodData**: Basic nutrition info (free, 1000/day)
- **Open Food Facts**: Ingredient pricing estimates (free)

---

## 📊 Simplified Data Collection

### **3-Step Onboarding** (vs. 9 steps in full plan)

#### Step 1: Household & Budget
```typescript
{
  householdSize: number;
  weeklyBudget: number;
  currency: "USD";
}
```

#### Step 2: Food Preferences
```typescript
{
  allergies: string[]; // Common ones: nuts, dairy, gluten
  dislikedFoods: string[]; // Free text input
  preferredCuisines?: string[]; // Optional
}
```

#### Step 3: Cooking Reality
```typescript
{
  availableTime: "15min" | "30min" | "1hour";
  skillLevel: "beginner" | "intermediate" | "advanced";
  enjoysCooking: boolean;
}
```

---

## 🔄 MVP User Stories

### **Primary User Stories**
1. **As a busy parent**, I want meal suggestions that fit my budget and time so I don't order expensive takeout
2. **As a health-conscious person**, I want recipes that avoid my allergies so I can eat safely
3. **As a budget-conscious individual**, I want to see grocery costs upfront so I don't overspend
4. **As someone who wastes food**, I want planned meals so I only buy what I'll use

### **MVP Success Metrics**
- User completes setup: >70%
- Generates first meal plan: >50%
- Returns within a week: >30%
- Average weekly budget savings: >$20

---

## 📁 MVP Project Structure (Simplified)

```
frontend/
├── src/
│   ├── components/
│   │   ├── setup/
│   │   │   ├── QuickSetup.tsx
│   │   │   └── StepIndicator.tsx
│   │   ├── recipes/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeGrid.tsx
│   │   │   └── RecipeFilters.tsx
│   │   ├── planner/
│   │   │   ├── WeeklyPlanner.tsx
│   │   │   ├── MealSlot.tsx
│   │   │   └── GroceryList.tsx
│   │   └── common/
│   │       ├── BudgetMeter.tsx
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   ├── useRecipes.ts
│   │   └── useBudget.ts
│   ├── services/
│   │   ├── recipeService.ts
│   │   └── nutritionService.ts
│   ├── types/
│   │   ├── User.ts
│   │   ├── Recipe.ts
│   │   └── MealPlan.ts
│   ├── utils/
│   │   ├── budgetCalculator.ts
│   │   └── recipeFilters.ts
│   ├── store/
│   │   ├── userStore.ts
│   │   ├── recipeStore.ts
│   │   └── mealPlanStore.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── index.html
│   └── favicon.ico
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

## ⚡ 4-Week MVP Timeline

### **Week 1: Foundation**
- [x] Project setup (React 18 + TypeScript + Tailwind)
- [ ] Quick 3-step user setup
- [ ] Local storage utilities
- [ ] Basic recipe service integration

### **Week 2: Core Features**
- [ ] Recipe recommendation engine
- [ ] Recipe filtering by budget/time/dietary needs
- [ ] Basic meal planning interface
- [ ] Grocery list generation

### **Week 3: Polish & Integration**
- [ ] Budget tracking and cost calculations
- [ ] Recipe caching for offline use
- [ ] Mobile responsive design
- [ ] Basic error handling

### **Week 4: Testing & Launch**
- [ ] User testing with real meal planning scenarios
- [ ] Performance optimization
- [ ] Bug fixes and polish
- [ ] Deploy and gather feedback

---

## 🎯 MVP vs. Full Plan Comparison

| Feature | Full Plan | MVP |
|---------|-----------|-----|
| User Setup | 9 detailed steps | 3 quick steps |
| APIs | 5+ complex integrations | 2-3 simple ones |
| Data Storage | IndexedDB + LocalStorage | LocalStorage only |
| Nutrition | Detailed macro tracking | Basic info only |
| Grocery Integration | Kroger cart API | Simple lists |
| Timeline | 6-8 weeks | 4 weeks |

---

## 🔄 Post-MVP Roadmap

### **Phase 2** (if MVP succeeds)
- Add phone number collection for reminders
- Integrate Kroger API for real grocery prices
- Enhanced nutrition tracking
- Recipe rating and favorites

### **Phase 3** (growth features)
- Social sharing and meal plan exchange
- Advanced dietary goal tracking
- Smart leftover suggestions
- Seasonal/local ingredient recommendations

---

## ✅ MVP Success Definition

**The MVP succeeds if users can:**
1. Set up their profile in under 5 minutes
2. Get relevant recipe recommendations immediately
3. Create a week's meal plan in under 15 minutes
4. Generate a grocery list they actually use
5. Stay within their weekly food budget

This MVP focuses on the **core value proposition**: making meal planning so easy and useful that people actually stick with it, while directly addressing the problems of healthy eating, saving money, and saving time.

---

## 🔧 Implementation Details

### **Dependencies**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.47.0",
    "zustand": "^4.4.1",
    "lucide-react": "^0.284.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.22",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.4",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.2.2",
    "vite": "^4.4.9"
  }
}
```

### **API Endpoints**
- **TheMealDB**: `https://www.themealdb.com/api/json/v1/1/`
- **USDA FoodData**: `https://api.nal.usda.gov/fdc/v1/`
- **Open Food Facts**: `https://world.openfoodfacts.org/api/v0/`

### **Environment Variables**
```env
VITE_THEMEALDB_BASE_URL=https://www.themealdb.com/api/json/v1/1
VITE_USDA_API_KEY=your_usda_api_key
VITE_USDA_BASE_URL=https://api.nal.usda.gov/fdc/v1
```

### **Local Storage Schema**
```typescript
// localStorage keys
const STORAGE_KEYS = {
  USER_PROFILE: 'eatMorVegetables_userProfile',
  MEAL_PLANS: 'eatMorVegetables_mealPlans',
  RECIPE_CACHE: 'eatMorVegetables_recipeCache',
  GROCERY_LISTS: 'eatMorVegetables_groceryLists'
};
```

This plan provides a clear, focused roadmap for building a functional MVP that solves real user problems while staying within technical and time constraints. 