import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';


const SavedRecipes = () => {
  const { isDarkMode, theme } = useTheme();
  const [recipes, setRecipes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const navigation = useNavigation();

  const categories = [
    { id: 'all', name: 'Tümü', icon: 'th-large' },
    { id: 'soup', name: 'Çorbalar', icon: 'utensil-spoon', keywords: ['çorba', 'soup'] },
    { id: 'main', name: 'Ana Yemekler', icon: 'utensils', keywords: ['kebap', 'köfte', 'tavuk', 'et', 'pilav', 'makarna', 'balık', 'güveç', 'dolma'] },
    { id: 'breakfast', name: 'Kahvaltılıklar', icon: 'egg', keywords: ['yumurta', 'menemen', 'omlet', 'pancake', 'zeytin', 'peynir'] },
    { id: 'dessert', name: 'Tatlılar', icon: 'ice-cream', keywords: ['pasta', 'kek', 'kurabiye', 'tatlı', 'muhallebi', 'helva'] },
    { id: 'snack', name: 'Atıştırmalıklar', icon: 'cookie', keywords: ['börek', 'poğaça', 'salata', 'meze', 'atıştırmalık'] },
  ];

  const loadRecipes = async () => {
    setRefreshing(true);
    const data = await AsyncStorage.getItem('saved_recipes');
    if (data) {
      const arr = JSON.parse(data).reverse();
      setRecipes(arr);
      setFiltered(arr);
    } else {
      setRecipes([]);
      setFiltered([]);
    }
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [])
  );

  useEffect(() => {
    let result = [...recipes];

    // 1. Kategori Filtresi
    if (activeCategory !== 'Tümü') {
      const cat = categories.find(c => c.name === activeCategory);
      if (cat && cat.keywords) {
        result = result.filter(r => {
          const title = (r.yemekAdi || '').toLocaleLowerCase('tr-TR');
          return cat.keywords.some(kw => title.includes(kw.toLocaleLowerCase('tr-TR')));
        });
      }
    }

    // 2. Arama Filtresi
    if (search.trim()) {
      const s = search.toLocaleLowerCase('tr-TR');
      result = result.filter(
        r =>
          (r.yemekAdi || '').toLocaleLowerCase('tr-TR').includes(s) ||
          (Array.isArray(r.malzemeler) && r.malzemeler.join(', ').toLocaleLowerCase('tr-TR').includes(s))
      );
    }

    setFiltered(result);
  }, [search, recipes, activeCategory]);

  const onRefresh = () => {
    loadRecipes();
  };

  const handleRecipePress = (item) => {
    navigation.navigate('SavedRecipeDetail', {
      recipe: item,
    });
  };

  const getRecipeStyle = (recipeName) => {
    const name = recipeName.toLowerCase();
    if (name.includes('çorba')) return { icon: 'utensil-spoon', color: '#0ea5e9', bg: '#f0f9ff' };
    if (name.includes('tatlı') || name.includes('kek') || name.includes('pasta') || name.includes('şeker'))
      return { icon: 'ice-cream', color: '#ec4899', bg: '#fdf2f8' };
    if (name.includes('et') || name.includes('kebap') || name.includes('köfte') || name.includes('tavuk'))
      return { icon: 'drumstick-bite', color: '#ef4444', bg: '#fef2f2' };
    if (name.includes('balık')) return { icon: 'fish', color: '#06b6d4', bg: '#ecfeff' };
    if (name.includes('makarna') || name.includes('pilav')) return { icon: 'utensils', color: '#f59e0b', bg: '#fffbeb' };
    if (name.includes('salata') || name.includes('vegan') || name.includes('sebze'))
      return { icon: 'leaf', color: '#10b981', bg: '#f0fdf4' };

    return { icon: 'cookie-bite', color: '#ff7043', bg: '#fff7ed' };
  };

  const renderRecipeItem = ({ item }) => {
    const { icon, color, bg } = getRecipeStyle(item.yemekAdi);

    return (
      <TouchableOpacity style={[styles.recipeListItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => handleRecipePress(item)}>
        <View style={[styles.recipeListIconBox, { backgroundColor: isDarkMode ? bg + '20' : bg }]}>
          <FontAwesome5 name={icon} size={18} color={color} />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.recipeListTitle, { color: theme.text }]} numberOfLines={1}>{item.yemekAdi}</Text>
          <Text style={[styles.recipeListSub, { color: theme.secondaryText }]} numberOfLines={1}>{(item.malzemeler || []).join(', ')}</Text>
        </View>
        <View style={styles.chevronBox}>
          <FontAwesome5 name="chevron-right" size={12} color="#cbd5e1" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[styles.categoryChip, { backgroundColor: theme.card, borderColor: theme.border }, activeCategory === item.name && styles.categoryChipActive]}
      onPress={() => setActiveCategory(item.name)}
    >
      <FontAwesome5
        name={item.icon}
        size={14}
        color={activeCategory === item.name ? '#fff' : theme.secondaryText}
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.categoryText, { color: activeCategory === item.name ? '#fff' : theme.secondaryText }, activeCategory === item.name && styles.categoryTextActive]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.pageTitle, { color: theme.text }]}>Kaydedilen Tariflerim</Text>

      <View style={[styles.inputWrapper, { margin: 16, marginBottom: 8, backgroundColor: theme.card, borderColor: inputFocused ? '#ff7043' : theme.border }]}>
        <FontAwesome5 name="search" size={16} color={inputFocused ? '#ff7043' : theme.secondaryText} style={{ marginLeft: 16 }} />
        <TextInput
          style={[styles.textInput, { color: theme.text }]}
          placeholder="Tarif veya malzeme ara..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={theme.secondaryText}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
      </View>

      <View style={styles.categoryBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="bookmark" size={48} color={isDarkMode ? theme.border : "#d1d5db"} />
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>Kaydedilmiş tarif bulunamadı</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  pageTitle: {
    fontSize: 26,
    fontFamily: 'TextExtraBold',
    marginLeft: 20,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'TextNormal',
  },
  categoryBar: {
    marginVertical: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: '#ff7043',
    borderColor: '#ff7043',
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'TextBold',
  },
  categoryTextActive: {
    color: '#fff',
  },
  recipeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  recipeListIconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  recipeListTitle: {
    fontSize: 16,
    fontFamily: 'TextBold',
    marginBottom: 3,
  },
  recipeListSub: {
    fontSize: 12,
    fontFamily: 'TextNormal',
    lineHeight: 16,
  },
  chevronBox: {
    paddingRight: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 18,
    textAlign: 'center',
    fontFamily: 'TextBold',
  },
});

export default SavedRecipes;