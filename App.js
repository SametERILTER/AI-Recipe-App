import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ThemeProvider } from './assets/context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5, Octicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import WelcomeScreen from './assets/screens/WelcomeScreen';
import HomeScreen from './assets/screens/HomeScreen';
import RecipeDetail from './assets/screens/RecipeDetail';
import SavedRecipes from './assets/screens/SavedRecipes';
import SavedRecipeDetail from './assets/screens/SavedRecipeDetail';
import RecipeBookScreen from './assets/screens/RecipeBookScreen';
import AddRecipeScreen from './assets/screens/AddRecipeScreen';
import RecipeDetailBookScreen from './assets/screens/RecipeDetailBookScreen';
import SearchRecipeScreen from './assets/screens/SearchRecipeScreen';
import StartRecipe from './assets/screens/StartRecipe';
import RecipeOfDay from './assets/screens/RecipeOfDay';
import CategoryRecipes from './assets/screens/CategoryRecipes';
import SettingsScreen from './assets/screens/SettingsScreen';
import HelpCenterScreen from './assets/screens/HelpCenterScreen';
import AboutAppScreen from './assets/screens/AboutAppScreen';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { useTheme as useAppTheme } from './assets/context/ThemeContext';

function MainTabs() {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#ff7043',
        tabBarInactiveTintColor: theme.isDarkMode ? '#737373' : '#bdbdbd',
        tabBarStyle: {
          backgroundColor: theme.background,
          height: 105,
          borderWidth: 0,
          borderTopColor: theme.border,
          paddingBottom: 45,
          paddingTop: 6,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Ana Sayfa"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Octicons name="home-fill" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Ara"
        component={SearchRecipeScreen}
        options={{
          lazy: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="search" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Kaydedilenler"
        component={SavedRecipes}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="bookmark" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Tarif Defteri"
        component={RecipeBookScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="book" color={color} size={22} />
          ),
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" color={color} size={22} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme } = useAppTheme();
  const [initialRoute, setInitialRoute] = React.useState(null);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const storedLevel = await AsyncStorage.getItem('chef_cooking_level');
        setInitialRoute(storedLevel ? 'MainTabs' : 'Welcome');
      } catch (e) {
        setInitialRoute('Welcome');
      }
    };
    checkOnboarding();
  }, []);

  if (!initialRoute) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#ff7043" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'simple_push',
          animationDuration: 400,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetail} />
        <Stack.Screen name="SavedRecipeDetail" component={SavedRecipeDetail} />
        <Stack.Screen name="RecipeDetailBook" component={RecipeDetailBookScreen} />
        <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
        <Stack.Screen name="StartRecipe" component={StartRecipe} />
        <Stack.Screen name="RecipeOfDay" component={RecipeOfDay} />
        <Stack.Screen name="CategoryRecipes" component={CategoryRecipes} />
        <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
        <Stack.Screen name="AboutApp" component={AboutAppScreen} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'PoppinsRegular': require('./assets/fonts/Poppins_400Regular.ttf'),
    'PoppinsMedium': require('./assets/fonts/Poppins_500Medium.ttf'),
    'PoppinsSemiBold': require('./assets/fonts/Poppins_600SemiBold.ttf'),
    'PoppinsBold': require('./assets/fonts/Poppins_700Bold.ttf'),
    'PoppinsExtraBold': require('./assets/fonts/Poppins_800ExtraBold.ttf'),
    'ManropeRegular': require('./assets/fonts/Poppins_400Regular.ttf'),
    'ManropeMedium': require('./assets/fonts/Poppins_500Medium.ttf'),
    'ManropeSemiBold': require('./assets/fonts/Poppins_600SemiBold.ttf'),
    'ManropeBold': require('./assets/fonts/Poppins_700Bold.ttf'),
    'ManropeExtraBold': require('./assets/fonts/Poppins_800ExtraBold.ttf'),
    'RubikRegular': require('./assets/fonts/Poppins_400Regular.ttf'),
    'RubikMedium': require('./assets/fonts/Poppins_500Medium.ttf'),
    'RubikSemiBold': require('./assets/fonts/Poppins_600SemiBold.ttf'),
    'RubikBold': require('./assets/fonts/Poppins_700Bold.ttf'),
    'RubikExtraBold': require('./assets/fonts/Poppins_800ExtraBold.ttf'),
    'OutfitRegular': require('./assets/fonts/Poppins_400Regular.ttf'),
    'OutfitMedium': require('./assets/fonts/Poppins_500Medium.ttf'),
    'OutfitSemiBold': require('./assets/fonts/Poppins_600SemiBold.ttf'),
    'OutfitBold': require('./assets/fonts/Poppins_700Bold.ttf'),
    'OutfitExtraBold': require('./assets/fonts/Poppins_800ExtraBold.ttf'),
    'TextRegular': require('./assets/fonts/Poppins_400Regular.ttf'),
    'TextNormal': require('./assets/fonts/Poppins_400Regular.ttf'),
    'TextMedium': require('./assets/fonts/Poppins_500Medium.ttf'),
    'TextSemiBold': require('./assets/fonts/Poppins_600SemiBold.ttf'),
    'TextBold': require('./assets/fonts/Poppins_700Bold.ttf'),
    'TextExtraBold': require('./assets/fonts/Poppins_800ExtraBold.ttf'),
    'Handwriting': require('./assets/fonts/Parisienne-Regular.ttf')
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer]}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
