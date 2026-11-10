# YemekTarif - AI-Powered Kitchen and Recipe Assistant

> **Project Status:** This project is currently under active development. New features, user interface refinements, and performance optimizations are continuously being implemented.

---

## Overview

**YemekTarif** is a comprehensive mobile application built with React Native and Expo that generates personalized meal and dessert recipes using artificial intelligence based on the ingredients available in the user's kitchen, serving size, meal style preferences, and culinary experience level. In addition to AI-driven recipe generation, the application includes a curated offline catalog of over 170 traditional and modern Turkish recipes.

Beyond static recipe browsing, YemekTarif acts as an interactive kitchen companion. It guides users step-by-step through the cooking process, supports hands-free step navigation via hardware sensors (device shake and ambient light/proximity detection) when hands are occupied, reads steps aloud using Text-to-Speech (TTS), and provides background kitchen music with automatic audio ducking.

---

## Key Features

### 1. AI Chef and Smart Recipe Generation
- **Ingredient-Based Recipe Generation:** Generate custom meal or dessert recipes by typing available ingredients manually or selecting them from a categorized visual ingredient picker.
- **Serving Size and Style Customization:** Scale recipes dynamically for 1, 2, 4, or 4+ servings, and filter by cooking styles such as Easy to Make, Light, Guest-Worthy, Practical, and Favorite.
- **Skill-Level Adaptation:** Tailors the AI's tone, instruction granularity, culinary glossary boxes, and chef notes according to the user's selected cooking proficiency (*Beginner*, *Intermediate*, or *Advanced*).
- **Random Recipe Generator:** Helps undecided users by generating tailored recipes based on meal time (Breakfast, Lunch, Dinner, Late-Night Snack, or Snack) and desired preparation style.

### 2. Interactive and Hands-Free Cooking Mode
- **Touchless Sensor Navigation:** Advance to the next cooking step without touching the screen by shaking the phone horizontally (`Accelerometer`) or waving a hand over the device's ambient light sensor (`LightSensor`).
- **Configurable Sensor Sensitivity:** Choose between *Low*, *Normal*, and *High* sensor sensitivity thresholds directly from the Settings screen.
- **Voice Guidance (Text-to-Speech):** Listen to individual cooking steps or the entire recipe read aloud in Turkish.
- **Smart Background Music:** Play ambient kitchen music (*Calm Mode*, *Middle Eastern*, or *Energetic*) during cooking, with automatic volume ducking whenever voice guidance is active.

### 3. Built-In Recipe Catalog and Daily Menu
- **171 Curated Offline Recipes:** Organized across 9 categories including Soup, Main Dish, Pastry, Pilaf, Dessert, Meze, Hot Appetizer, Breakfast, and Olive Oil Dishes.
- **Menu of the Day:** Uses a deterministic date-seeded algorithm to curate a daily 3-part meal plan consisting of Breakfast, Lunch, and a 3-course Dinner Menu (Starter Soup, Side Dish, and Main Course).
- **Instant Search:** Search across recipe titles, ingredients, categories, and tags with full Turkish character normalization.

### 4. Personal Recipe Book and Bookmarks
- **Customizable Recipe Book:** Create and store personal recipes, use AI to automatically format and refine raw ingredient lists and instructions, and personalize the notebook title and color theme (*Classic Gold*, *Natural Green*, *Elegant Purple*, *Ocean Blue*, *Romantic Rose*).
- **Saved Recipes:** Bookmark AI-generated or catalog recipes for offline access, filter them by category, and share them with others.
- **Dark Mode Support:** Full light and dark theme synchronization persisted across sessions.

---

## Tech Stack and Libraries

| Layer / Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native `0.88.1` & Expo SDK `58` | Cross-platform mobile application framework |
| **Language & Runtime** | JavaScript (ES6+) / React `19.3.0` | Component architecture and state management |
| **Artificial Intelligence** | `@google/generative-ai` | Google Gemini API (`gemini-3.5-flash-lite`) integration |
| **Image Service** | Unsplash REST API (`axios`) | Dynamic food photography lookup and fallback handling |
| **Navigation** | `@react-navigation/native-stack` & `bottom-tabs` | Screen routing and bottom tab navigation |
| **Audio & Speech** | `expo-audio` & `expo-speech` | Background audio playback and Turkish Text-to-Speech (TTS) |
| **Hardware Sensors** | `expo-sensors` | `Accelerometer` and `LightSensor` for hands-free navigation |
| **Local Storage** | `@react-native-async-storage/async-storage` | Persistent storage for saved recipes, notebook data, and settings |
| **UI & Animations** | `lottie-react-native` & `expo-linear-gradient` | Vector animations and gradient surfaces |

---

## Project Structure

```text
YemekTarif/
├── assets/
│   ├── animations/              # Lottie animation assets (Chef, Loading, Success, etc.)
│   ├── config/
│   │   ├── ai.js                # Centralized Google Gemini AI client and model configuration
│   │   └── unsplash.js          # Unsplash image search API client
│   ├── context/
│   │   └── ThemeContext.js      # Light / Dark theme provider and AsyncStorage persistence
│   ├── data/
│   │   └── recipes.json         # Curated dataset of 171 categorized recipes
│   ├── fonts/                   # Nunito and Parisienne custom font files
│   ├── images/                  # Ingredient thumbnails and meal category placeholders
│   ├── musics/                  # Background audio tracks and completion sound effects
│   └── screens/
│       ├── WelcomeScreen.js         # First-launch onboarding and skill level selection screen
│       ├── HomeScreen.js            # Ingredient input, AI recipe generator, and quick actions
│       ├── RecipeDetail.js          # AI recipe generation and detail view
│       ├── StartRecipe.js           # Step-by-step interactive and hands-free cooking mode
│       ├── RecipeOfDay.js           # Daily seeded 3-meal menu screen
│       ├── SearchRecipeScreen.js    # Catalog search, recipe of the day, and category browser
│       ├── CategoryRecipes.js       # Recipe list filtered by category
│       ├── SavedRecipes.js          # Bookmarked recipes with search and category filters
│       ├── SavedRecipeDetail.js     # Detailed view for saved and catalog recipes
│       ├── RecipeBookScreen.js      # Personal customizable recipe notebook
│       ├── AddRecipeScreen.js       # Custom recipe creation with AI formatting assistance
│       ├── RecipeDetailBookScreen.js# Detail view for personal recipe book entries
│       ├── SettingsScreen.js        # Theme, sensor sensitivity, and AI chef proficiency settings
│       ├── HelpCenterScreen.js      # Frequently asked questions and support contact
│       └── AboutAppScreen.js        # Application overview and version information
├── scripts/
│   └── patch-node20.js          # Automatic postinstall compatibility polyfill for Node.js v20.11.x
├── .env                         # Environment variables (API keys - excluded from Git)
├── App.js                       # Root component, font loader, and navigation container
├── app.json                     # Expo application manifest and platform configuration
├── eas.json                     # Expo Application Services (APK/AAB build) profiles
└── package.json                 # Project dependencies and npm scripts
```

---

## Getting Started

### 1. Prerequisites
- **Node.js:** `v20.11+` or `v22.13+` (LTS recommended)
- **Mobile Client:** **Expo Go (SDK 58)** installed on an Android or iOS device, or an Android Emulator

### 2. Install Dependencies
Run the following command in the project root directory:

```bash
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables (`.env`)
Open the `.env` file in the root directory and add your Google AI Studio Gemini API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy_YOUR_API_KEY_HERE
```

*(Optional: You may also define `EXPO_PUBLIC_UNSPLASH_ACCESS_KEY` in `.env` to enable live food photography lookups via Unsplash.)*

### 4. Start the Development Server
Launch the Metro Bundler with a clean cache:

```bash
npx expo start -c
```

Scan the generated QR code using the **Expo Go** app on your mobile device, or press `a` in the terminal to launch the app on an Android emulator.

---

## Building an Android APK (EAS Build)

The project is pre-configured in `eas.json` (`buildType: "apk"`) to generate a standalone installable `.apk` package for Android devices:

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---


## License

This project is developed for educational and personal development purposes. All rights reserved.
