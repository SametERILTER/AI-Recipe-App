import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { recordRecentRecipe, removeRecentRecipe } from '../utils/recentRecipes';


const { width } = Dimensions.get('window');

// Basit metin formatlayıcı (AI çıktıları için)
function renderFormattedInstructions(text, theme) {

  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <View key={index} style={{ height: 8 }} />;

    // Başlık (Bold)
    if (trimmed.startsWith('**') || trimmed.endsWith(':')) {
      return (
        <Text key={index} style={[styles.instructionHeader, { color: theme.text }]}>
          {trimmed.replace(/\*\*/g, '')}
        </Text>
      );
    }

    // Liste maddesi (Sayı veya Tire)
    if (/^\d+\./.test(trimmed) || /^-/.test(trimmed)) {
      return (
        <View key={index} style={styles.instructionItem}>
          <View style={styles.instructionBullet} />
          <Text style={[styles.instructionText, { color: theme.text }]}>{trimmed}</Text>
        </View>
      );
    }

    // Normal paragraf
    return (
      <Text key={index} style={[styles.instructionText, { color: theme.text }]}>
        {trimmed}
      </Text>
    );
  });
}

const RecipeDetailBookScreen = ({ route }) => {
  const { isDarkMode, theme } = useTheme();
  const { recipe } = route.params;
  const navigation = useNavigation();

  useEffect(() => {
    if (recipe?.title) {
      recordRecentRecipe({
        title: recipe.title,
        sourceLabel: 'Tarif Defteri',
        icon: 'book-open',
        routeName: 'RecipeDetailBook',
        params: { recipe },
        meta: Array.isArray(recipe?.ingredients) && recipe.ingredients.length > 0
          ? `${recipe.ingredients.length} malzeme`
          : 'Kişisel tarif',
      });
    }
  }, [recipe]);

  const handleDeleteBookRecipe = () => {
    Alert.alert(
      'Tarifi Sil',
      'Bu tarifi tarif defterinizden silmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const data = await AsyncStorage.getItem('recipeBooks');
              let list = data ? JSON.parse(data) : [];
              list = list.filter(
                r => (r.id && recipe.id ? r.id !== recipe.id : r.createdAt !== recipe.createdAt && r.title !== recipe.title)
              );
              await AsyncStorage.setItem('recipeBooks', JSON.stringify(list));
              await removeRecentRecipe('RecipeDetailBook', recipe?.title);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Hata', 'Tarif silinemedi.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderRadius: 20 }]}>
          <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text style={[styles.dateText, { color: theme.secondaryText, marginRight: 12 }]}>
          {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('tr-TR') : ''}
        </Text>
        <TouchableOpacity onPress={handleDeleteBookRecipe} style={[styles.backBtn, { backgroundColor: '#fee2e2', borderRadius: 20 }]}>
          <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarif Adı */}
        <Text style={[styles.pageTitle, { color: theme.text }]}>{recipe.title}</Text>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />


        {/* Malzemeler */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome5 name="shopping-basket" size={16} color="#ff7043" style={{ marginRight: 10 }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Malzemeler</Text>
          </View>


          <View style={[styles.ingredientList, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {(recipe.ingredients || []).map((item, idx) => (
              <View key={item + idx} style={[styles.ingredientItem, { borderBottomColor: theme.border }]}>
                <FontAwesome5 name="check" size={12} color="#ff7043" style={{ marginRight: 12 }} />
                <Text style={[styles.ingredientText, { color: theme.text }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Yapılış */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <FontAwesome5 name="utensils" size={16} color="#ff7043" style={{ marginRight: 10 }} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Yapılışı</Text>
          </View>


          <View style={styles.instructionsContainer}>
            {renderFormattedInstructions(recipe.instructions, theme)}
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7', // Warm paper
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  dateText: {
    fontFamily: 'PoppinsBold',
    color: '#a3a3a3',
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'PoppinsExtraBold',
    color: '#262626',
    marginBottom: 16,
    lineHeight: 34,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: '#383838',
  },
  ingredientList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
    borderColor: '#eeeeee',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderWidth: 0,
    borderBottomColor: '#f5f5f5',
  },
  ingredientText: {
    fontSize: 16,
    color: '#2a3340ff',
    fontFamily: 'PoppinsRegular',
    flex: 1,
  },
  instructionsContainer: {
    paddingHorizontal: 4,
  },
  instructionHeader: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#181818',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  instructionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff7043',
    marginTop: 8,
    marginRight: 10,
  },
  instructionText: {
    fontSize: 16,
    color: '#2a3340ff',
    fontFamily: 'PoppinsRegular',
    lineHeight: 26,
    flex: 1,
    marginBottom: 8,
  },
});

export default RecipeDetailBookScreen;