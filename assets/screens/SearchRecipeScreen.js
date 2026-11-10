import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  FlatList,
  Dimensions,
  ImageBackground
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import recipesData from '../data/recipes.json';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';


const { width } = Dimensions.get('window');

const SearchRecipeScreen = () => {
  const { isDarkMode, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [dailyRecipe, setDailyRecipe] = useState(null);
  const navigation = useNavigation();

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'ana yemek': return { lib: 'FontAwesome5', name: 'utensils' };
      case 'börek': return { lib: 'FontAwesome5', name: 'bread-slice' };
      case 'kahvaltı': return { lib: 'MaterialCommunityIcons', name: 'egg-fried' };
      case 'çorba': return { lib: 'FontAwesome5', name: 'mug-hot' };
      case 'tatlı': return { lib: 'MaterialCommunityIcons', name: 'ice-cream' };
      case 'pilav': return { lib: 'FontAwesome6', name: 'bowl-rice' };
      case 'ara sıcak': return { lib: 'FontAwesome5', name: 'fire-alt' };
      case 'meze': return { lib: 'FontAwesome5', name: 'leaf' };
      default: return { lib: 'FontAwesome5', name: 'utensil-spoon' };
    }
  };

  const renderIcon = (cat) => {
    const icon = getCategoryIcon(cat);
    if (icon.lib === 'FontAwesome5') {
      return <FontAwesome5 name={icon.name} size={24} color="#ff7043" />;
    }
    if (icon.lib === 'FontAwesome6') {
      return <FontAwesome6 name={icon.name} size={24} color="#ff7043" />;
    }
    return <MaterialCommunityIcons name={icon.name} size={26} color="#ff7043" />;
  };

  const categories = React.useMemo(() => {
    if (!recipesData.tarifler) return [];
    const counts = {};
    recipesData.tarifler.forEach(r => {
      counts[r.kategori] = (counts[r.kategori] || 0) + 1;
    });
    return Object.keys(counts).sort().map(name => ({
      name,
      count: counts[name]
    }));
  }, []);

  const getDifficultyStars = (difficulty) => {
    let starCount = 1;
    if (difficulty.toLowerCase() === 'orta') starCount = 2;
    if (difficulty.toLowerCase() === 'zor') starCount = 3;

    return (
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyLabelText}>Zorluk: </Text>
        <View style={styles.starContainer}>
          {[...Array(starCount)].map((_, i) => (
            <FontAwesome5 key={i} name="star" size={10} color="#64748b" solid style={{ marginRight: 2 }} />
          ))}
        </View>
      </View>
    );
  };

  // Günün tarifini belirle
  useEffect(() => {
    if (recipesData.tarifler && recipesData.tarifler.length > 0) {
      const today = new Date();
      // Basit bir hash/seed mantığı: YYYYMMDD
      const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      const index = dateSeed % recipesData.tarifler.length;
      setDailyRecipe(recipesData.tarifler[index]);
    }
  }, []);

  // Arama fonksiyonu
  const searchRecipes = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const lowerQuery = query.toLowerCase();

    const results = recipesData.tarifler.filter(recipe => {
      if (recipe.isim.toLowerCase().includes(lowerQuery)) return true;
      if (recipe.kategori.toLowerCase().includes(lowerQuery)) return true;
      if (recipe.malzemeler.some(malzeme => malzeme.toLowerCase().includes(lowerQuery))) return true;
      if (recipe.etiketler.some(etiket => etiket.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });

    setSearchResults(results);
    setIsSearching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchRecipes(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const formatRecipeForDetail = (recipe) => {
    const description = `**Yemek Adı:** ${recipe.isim}

**Malzemeler:**
${recipe.malzemeler.map(malzeme => `- ${malzeme}`).join('\n')}

**Hazırlanışı:**
${recipe.hazirlanis.map((adim, index) => `${index + 1}. ${adim}`).join('\n')}

**İpuçları:**
- ${recipe.sure} sürede hazırlanır
- ${recipe.kisi} kişilik tarif
- Zorluk seviyesi: ${recipe.zorluk}
- Kategori: ${recipe.kategori}`;

    return {
      yemekAdi: recipe.isim,
      malzemeler: recipe.malzemeler,
      description: description,
      imageData: null,
      date: new Date().toISOString(),
    };
  };

  const renderRecipeCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: theme.card }]}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('SavedRecipeDetail', { recipe: formatRecipeForDetail(item) })}
    >
      <View style={styles.cardContent}>
        <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={1}>{item.isim}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <FontAwesome5 name="clock" size={12} color={theme.secondaryText} />
            <Text style={[styles.metaText, { color: theme.secondaryText }]}>{item.sure}</Text>
          </View>

          <View style={styles.metaItem}>
            <FontAwesome5 name="users" size={12} color={theme.secondaryText} />
            <Text style={[styles.metaText, { color: theme.secondaryText }]}>{item.kisi} Kişi</Text>
          </View>
        </View>

        <View style={styles.difficultyContainer}>
          <Text style={[styles.difficultyLabelText, { color: theme.secondaryText }]}>Zorluk: </Text>
          <View style={styles.starContainer}>
            {[...Array(item.zorluk.toLowerCase() === 'orta' ? 2 : (item.zorluk.toLowerCase() === 'zor' ? 3 : 1))].map((_, i) => (
              <FontAwesome5 key={i} name="star" size={10} color={theme.secondaryText} solid style={{ marginRight: 2 }} />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.actionArea}>
        <View style={[styles.arrowCircle, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <FontAwesome5 name="chevron-right" size={12} color={theme.secondaryText} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryCard = (item) => (
    <TouchableOpacity
      style={[styles.catCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      activeOpacity={0.8}
      onPress={() => navigation.navigate('SavedRecipeDetail', { recipe: formatRecipeForDetail(item) })}
    >
      <View style={styles.catCardTop}>
        <Text style={[styles.catCardTitle, { color: theme.text }]} numberOfLines={2}>{item.isim}</Text>
      </View>
      <View style={[styles.catCardBottom, { borderTopColor: theme.border }]}>
        <View style={styles.catMetaRow}>
          <FontAwesome5 name="clock" size={10} color={theme.secondaryText} />
          <Text style={[styles.catMetaText, { color: theme.secondaryText }]}>{item.sure}</Text>
        </View>
        <View style={styles.catMetaRow}>
          <FontAwesome5 name="star" size={10} color="#fbbf24" solid />
          <Text style={[styles.catMetaText, { color: theme.secondaryText }]}>{item.zorluk}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? theme.background : "#f8fafc"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? theme.background : "#fff" }]}>
        <Text style={[styles.title, { color: theme.text }]}>Tarifler</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Binlerce lezzetli tarif elinizin altında</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.searchContainer}>
          <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: inputFocused ? '#ff7043' : theme.border }]}>
            <FontAwesome5 name="search" size={16} color={inputFocused ? '#ff7043' : theme.secondaryText} style={{ marginLeft: 16 }} />
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Yemek, malzeme veya kategori ara..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.secondaryText}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <FontAwesome5 name="times-circle" size={16} color={theme.secondaryText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {searchQuery.length === 0 ? (
          /* Günün Tarifi Section */
          <View>
            <View style={styles.dailySection}>
              {dailyRecipe && (
                <>
                  <View style={styles.sectionHeader}>
                    <FontAwesome5 name="calendar-day" size={18} color="#ff7043" />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Günün Tarifi</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.dailyCard}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('SavedRecipeDetail', { recipe: formatRecipeForDetail(dailyRecipe) })}
                  >
                    <LinearGradient
                      colors={['#ff7043', '#ff8a65']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.dailyGradient}
                    >
                      <View style={styles.dailyContent}>
                        <View style={styles.dailyTop}>
                          <View style={styles.dailyBadge}>
                            <Text style={styles.dailyBadgeText}>{dailyRecipe.kategori}</Text>
                          </View>
                          <View style={styles.difficultyBadge}>
                            <FontAwesome5 name="star" size={10} color="#fbbf24" style={{ marginRight: 4 }} />
                            <Text style={styles.difficultyText}>{dailyRecipe.zorluk}</Text>
                          </View>
                        </View>

                        <Text style={styles.dailyTitle}>{dailyRecipe.isim}</Text>

                        <View style={styles.dailyMetaContainer}>
                          <View style={styles.dailyMetaItem}>
                            <FontAwesome5 name="clock" size={14} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.dailyMetaText}>{dailyRecipe.sure}</Text>
                          </View>
                          <View style={styles.dailyMetaItem}>
                            <FontAwesome5 name="user-friends" size={14} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.dailyMetaText}>{dailyRecipe.kisi} Kişilik</Text>
                          </View>
                        </View>

                        <View style={styles.dailyButton}>
                          <Text style={styles.dailyButtonText}>Tarifi İncele</Text>
                          <FontAwesome5 name="arrow-right" size={14} color="#ff7043" />
                        </View>
                      </View>

                      {/* Decorative Element */}
                      <FontAwesome5 name="utensils" size={120} color="rgba(255,255,255,0.15)" style={styles.dailyDecorIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Quick Categories Selection */}
            <View style={styles.quickCatSection}>
              <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategorileri Keşfet</Text>
              </View>
              <FlatList
                data={categories}
                scrollEnabled={false}
                numColumns={2}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.quickCatBox, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('CategoryRecipes', { categoryName: item.name })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.quickCatContent}>
                      <View style={[styles.quickCatIconContainer, { backgroundColor: isDarkMode ? (item.name === 'tatlı' ? '#9333ea20' : '#ff704315') : '#fff7ed' }]}>
                        {renderIcon(item.name)}
                      </View>
                      <View style={styles.quickCatTextContent}>
                        <Text style={[styles.quickCatText, { color: theme.text }]}>
                          {item.name.charAt(0).toLocaleUpperCase('tr-TR') + item.name.slice(1)}
                        </Text>
                        <Text style={[styles.quickCatCount, { color: theme.secondaryText }]}>
                          {item.count} Tarif
                        </Text>
                      </View>
                    </View>
                    <View style={styles.quickCatArrow}>
                      <FontAwesome5 name="chevron-right" size={10} color={theme.secondaryText} />
                    </View>
                  </TouchableOpacity>
                )}
                keyExtractor={item => item.name}
                contentContainerStyle={{ paddingHorizontal: 24 }}
                columnWrapperStyle={styles.quickCatRow}
              />
            </View>

            {/* Categories Section */}
            <View style={{ marginTop: 20 }}>
              {categories.map((cat, index) => (
                <View key={index} style={{ marginBottom: 24 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('CategoryRecipes', { categoryName: cat.name })}
                    style={{ paddingHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>{cat.name.charAt(0).toLocaleUpperCase('tr-TR') + cat.name.slice(1)}</Text>
                    <FontAwesome5 name="arrow-right" size={14} color={theme.secondaryText} />
                  </TouchableOpacity>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={recipesData.tarifler.filter(r => r.kategori === cat.name)}
                    renderItem={({ item }) => renderCategoryCard(item)}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 24 }}
                    ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : (
          /* Search Results */
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>
              {isSearching ? 'Aranıyor...' : `${searchResults.length} tarif bulundu`}
            </Text>

            {searchResults.length === 0 && !isSearching ? (
              <View style={styles.emptyState}>
                <FontAwesome5 name="search" size={40} color="#e2e8f0" />
                <Text style={styles.emptyText}>Maalesef tarif bulunamadı.</Text>
              </View>
            ) : (
              searchResults.map(item => (
                <View key={item.id} style={{ marginBottom: 12 }}>
                  {renderRecipeCard({ item })}
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'TextExtraBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'TextNormal',
    marginTop: 4,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
  },
  inputWrapperFocused: {
    borderColor: '#ff7043',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'TextNormal',
  },
  clearBtn: {
    padding: 4,
  },
  dailySection: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'TextBold',
  },
  dailyCard: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#ff9a9e',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  dailyGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  dailyContent: {
    zIndex: 2,
  },
  dailyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dailyBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dailyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dailyTitle: {
    fontSize: 26,
    fontFamily: 'TextExtraBold',
    color: '#fff',
    marginBottom: 16,
    lineHeight: 32,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dailyMetaContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dailyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyMetaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dailyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  dailyButtonText: {
    color: '#ff7043',
    fontFamily: 'TextBold',
    fontSize: 14,
  },
  dailyDecorIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    transform: [{ rotate: '-15deg' }],
    zIndex: 1,
  },
  resultsSection: {
    paddingHorizontal: 24,
  },
  resultsTitle: {
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'TextBold',
  },
  recipeCard: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardContent: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontFamily: 'TextBold',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: 'TextNormal',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  difficultyLabelText: {
    fontSize: 12,
    fontFamily: 'TextNormal',
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionArea: {
    marginLeft: 15,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
  catCard: {
    width: 160,
    height: 120,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  catCardTop: {
    flex: 1,
  },
  catCardTitle: {
    fontSize: 15,
    fontFamily: 'TextBold',
    lineHeight: 20,
  },
  catCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  catMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  catMetaText: {
    fontSize: 11,
    fontFamily: 'TextNormal'
  },
  quickCatSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  quickCatRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickCatBox: {
    width: (width - 48 - 14) / 2,
    height: 90,
    borderRadius: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickCatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickCatIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCatTextContent: {
    justifyContent: 'center',
  },
  quickCatText: {
    fontSize: 14,
    fontFamily: 'TextBold',
    marginBottom: 2,
  },
  quickCatCount: {
    fontSize: 11,
    fontFamily: 'TextNormal',
  },
  quickCatArrow: {
    opacity: 0.5,
  }
});

export default SearchRecipeScreen;