import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const RecipeBookScreen = () => {
  const { isDarkMode, theme: globalTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookName, setBookName] = useState('Tarif Defterim');
  const [selectedTheme, setSelectedTheme] = useState('gold');
  const navigation = useNavigation();

  const themes = [
    {
      id: 'gold',
      name: 'Klasik Krem',
      primary: '#c28b1a',
      paper: isDarkMode ? '#121214' : '#fbf8f1',
      headerBg: isDarkMode ? '#18181b' : '#f5efe2',
      cardBg: isDarkMode ? '#1b1b1f' : '#fffdf9',
      ruleLine: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#ece3cf',
      marginLine: isDarkMode ? 'rgba(194, 139, 26, 0.35)' : 'rgba(217, 119, 6, 0.28)',
      border: isDarkMode ? '#2a2a30' : '#eadfc7',
    },
    {
      id: 'green',
      name: 'Adaçayı',
      primary: '#10b981',
      paper: isDarkMode ? '#101413' : '#f5faf7',
      headerBg: isDarkMode ? '#151c19' : '#e8f5ee',
      cardBg: isDarkMode ? '#18201d' : '#ffffff',
      ruleLine: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#d9efe3',
      marginLine: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.3)',
      border: isDarkMode ? '#23332d' : '#cdebd9',
    },
    {
      id: 'purple',
      name: 'Lavanta',
      primary: '#8b5cf6',
      paper: isDarkMode ? '#131217' : '#f8f6fc',
      headerBg: isDarkMode ? '#1a1822' : '#efeafd',
      cardBg: isDarkMode ? '#1d1b26' : '#ffffff',
      ruleLine: isDarkMode ? 'rgba(139, 92, 246, 0.14)' : '#e6defa',
      marginLine: isDarkMode ? 'rgba(139, 92, 246, 0.35)' : 'rgba(139, 92, 246, 0.28)',
      border: isDarkMode ? '#2c283b' : '#ddd2f7',
    },
    {
      id: 'blue',
      name: 'Mürekkep',
      primary: '#3b82f6',
      paper: isDarkMode ? '#101318' : '#f4f8fd',
      headerBg: isDarkMode ? '#161b24' : '#e7f0fc',
      cardBg: isDarkMode ? '#191f2a' : '#ffffff',
      ruleLine: isDarkMode ? 'rgba(59, 130, 246, 0.14)' : '#dbe8fa',
      marginLine: isDarkMode ? 'rgba(59, 130, 246, 0.35)' : 'rgba(59, 130, 246, 0.28)',
      border: isDarkMode ? '#263042' : '#cddff8',
    },
    {
      id: 'rose',
      name: 'Kuru Gül',
      primary: '#f43f5e',
      paper: isDarkMode ? '#161214' : '#fdf6f7',
      headerBg: isDarkMode ? '#1f181c' : '#fae8ec',
      cardBg: isDarkMode ? '#221b1f' : '#ffffff',
      ruleLine: isDarkMode ? 'rgba(244, 63, 94, 0.14)' : '#f7dce1',
      marginLine: isDarkMode ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.28)',
      border: isDarkMode ? '#35252b' : '#f2cfd6',
    },
  ];

  const currentTheme = themes.find((t) => t.id === selectedTheme) || themes[0];

  const categories = [
    { id: 'all', name: 'Tümü', icon: 'th-large' },
    { id: 'genel', name: 'Genel', icon: 'utensils' },
    { id: 'corba', name: 'Çorba', icon: 'utensil-spoon' },
    { id: 'anayemek', name: 'Ana Yemek', icon: 'concierge-bell' },
    { id: 'kahvalti', name: 'Kahvaltı', icon: 'egg' },
    { id: 'tatli', name: 'Tatlı', icon: 'ice-cream' },
    { id: 'hamur', name: 'Hamur İşi', icon: 'bread-slice' },
    { id: 'meze', name: 'Meze/Salata', icon: 'leaf' },
  ];

  const getCategoryIcon = (catName) => {
    return categories.find((c) => c.name === catName)?.icon || 'book';
  };

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const data = await AsyncStorage.getItem('recipeBooks');
          if (data) {
            const parsed = JSON.parse(data).reverse();
            setRecipes(parsed);
            setFilteredRecipes(parsed);
          } else {
            setRecipes([]);
            setFilteredRecipes([]);
          }

          const savedName = await AsyncStorage.getItem('recipeBookName');
          if (savedName) setBookName(savedName);

          const savedTheme = await AsyncStorage.getItem('recipeBookTheme');
          if (savedTheme) setSelectedTheme(savedTheme);
        } catch (e) {
          console.log('Veri okuma hatası:', e);
        }
      };
      fetchData();
    }, [])
  );

  const saveBookName = async (name) => {
    setBookName(name);
    await AsyncStorage.setItem('recipeBookName', name);
  };

  const saveTheme = async (themeId) => {
    setSelectedTheme(themeId);
    await AsyncStorage.setItem('recipeBookTheme', themeId);
  };

  useEffect(() => {
    let result = [...recipes];
    if (activeCategory !== 'Tümü') {
      result = result.filter((r) => r.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLocaleLowerCase('tr-TR');
      result = result.filter(
        (r) =>
          (r.title || '').toLocaleLowerCase('tr-TR').includes(q) ||
          (r.ingredients || []).join(' ').toLocaleLowerCase('tr-TR').includes(q)
      );
    }
    setFilteredRecipes(result);
  }, [searchQuery, activeCategory, recipes]);

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return '';
    }
  };

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyPageCard,
        {
          backgroundColor: currentTheme.cardBg,
          borderColor: currentTheme.border,
        },
      ]}
    >
      <View
        style={[
          styles.emptyIconCircle,
          { backgroundColor: currentTheme.primary + '18' },
        ]}
      >
        <FontAwesome5 name="book-open" size={28} color={currentTheme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: globalTheme.text }]}>
        Defterin henüz boş
      </Text>
      <Text style={[styles.emptySubtitle, { color: globalTheme.secondaryText }]}>
        Sevdiğin tarifleri kaydedip notlarınla birlikte kendi defterini oluşturabilirsin.
      </Text>
    </View>
  );

  const ThemePreview = ({ theme, isSelected, onSelect }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        isSelected && {
          borderColor: theme.primary,
          backgroundColor: theme.primary + '12',
        },
      ]}
      onPress={() => onSelect(theme.id)}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.miniPhone,
          { backgroundColor: theme.paper, borderColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.miniHeader,
            { backgroundColor: theme.headerBg, borderBottomColor: theme.ruleLine },
          ]}
        />
        <View style={styles.miniContent}>
          <View
            style={[
              styles.miniMarginRule,
              { backgroundColor: theme.marginLine },
            ]}
          />
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.miniCard,
                { backgroundColor: theme.cardBg, borderColor: theme.ruleLine },
              ]}
            />
          ))}
        </View>
      </View>
      <Text
        style={[
          styles.themeName,
          { color: globalTheme.secondaryText },
          isSelected && {
            color: theme.primary,
            fontFamily: 'PlusJakartaSansBold',
          },
        ]}
      >
        {theme.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.paper }]}>
      {/* Üst Başlık ve Arama */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: currentTheme.headerBg,
            borderBottomColor: currentTheme.ruleLine,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerTitleCol}>
            <Text
              style={[styles.headerTitle, { color: currentTheme.primary }]}
              numberOfLines={1}
            >
              {bookName || 'Tarif Defterim'}
            </Text>
            <Text style={[styles.headerMeta, { color: globalTheme.secondaryText }]}>
              {recipes.length > 0
                ? `${recipes.length} kayıtlı tarif`
                : 'Kişisel tarif koleksiyonun'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.settingsBtn,
              {
                backgroundColor: currentTheme.cardBg,
                borderColor: currentTheme.border,
              },
            ]}
            onPress={() => setIsModalVisible(true)}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="sliders-h" size={16} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: currentTheme.cardBg,
              borderColor: currentTheme.border,
            },
          ]}
        >
          <FontAwesome5
            name="search"
            size={13}
            color={globalTheme.secondaryText}
            style={{ marginLeft: 14 }}
          />
          <TextInput
            placeholder="Defterde ara..."
            style={[styles.searchInput, { color: globalTheme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={globalTheme.secondaryText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={{ paddingHorizontal: 12 }}
            >
              <FontAwesome5 name="times" size={13} color={globalTheme.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kategori Şeridi */}
      <View
        style={[
          styles.categoryBar,
          {
            backgroundColor: currentTheme.paper,
            borderBottomColor: currentTheme.ruleLine,
          },
        ]}
      >
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => {
            const isActive = activeCategory === item.name;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive
                      ? currentTheme.primary
                      : currentTheme.cardBg,
                    borderColor: isActive
                      ? currentTheme.primary
                      : currentTheme.border,
                  },
                ]}
                onPress={() => setActiveCategory(item.name)}
                activeOpacity={0.82}
              >
                <FontAwesome5
                  name={item.icon}
                  size={11}
                  color={isActive ? '#fff' : currentTheme.primary}
                  style={{ marginRight: 7 }}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: isActive ? '#fff' : globalTheme.text },
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Defter Sayfaları / Tarif Listesi */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
        renderItem={({ item, index }) => {
          const ingredientCount = Array.isArray(item.ingredients)
            ? item.ingredients.length
            : 0;
          const dateLabel = formatDate(item.createdAt);
          return (
            <TouchableOpacity
              style={[
                styles.recipeCard,
                {
                  backgroundColor: currentTheme.cardBg,
                },
              ]}
              onPress={() => navigation.navigate('RecipeDetailBook', { recipe: item })}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.recipeCardIcon,
                  {
                    backgroundColor: currentTheme.primary + '14',
                  },
                ]}
              >
                <FontAwesome5
                  name={getCategoryIcon(item.category)}
                  size={15}
                  color={currentTheme.primary}
                />
              </View>
              <View style={styles.recipeInfoCol}>
                <Text
                  style={[styles.recipeTitle, { color: globalTheme.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <View style={styles.recipeMetaRow}>
                  <Text
                    style={[styles.recipeCategory, { color: currentTheme.primary }]}
                  >
                    {item.category || 'Genel'}
                  </Text>
                  {ingredientCount > 0 && (
                    <Text
                      style={[
                        styles.recipeMetaDot,
                        { color: globalTheme.secondaryText },
                      ]}
                    >
                      • {ingredientCount} malzeme
                    </Text>
                  )}
                  {dateLabel ? (
                    <Text
                      style={[
                        styles.recipeMetaDot,
                        { color: globalTheme.secondaryText },
                      ]}
                    >
                      • {dateLabel}
                    </Text>
                  ) : null}
                </View>
              </View>
              <FontAwesome5
                name="chevron-right"
                size={13}
                color={globalTheme.secondaryText}
                style={{ opacity: 0.55 }}
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Özelleştirme Modalı */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: globalTheme.background,
                paddingBottom: Math.max(insets.bottom + 16, 28),
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeading, { color: globalTheme.text }]}>
                Defterini Özelleştir
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeBtn}
              >
                <FontAwesome5 name="times" size={19} color={globalTheme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingSection}>
                <Text style={[styles.settingLabel, { color: globalTheme.secondaryText }]}>
                  Defter Adı
                </Text>
                <View
                  style={[
                    styles.nameInputWrapper,
                    {
                      backgroundColor: globalTheme.card,
                      borderColor: currentTheme.border,
                    },
                  ]}
                >
                  <FontAwesome5
                    name="pen"
                    size={12}
                    color={currentTheme.primary}
                    style={{ marginRight: 12 }}
                  />
                  <TextInput
                    style={[styles.nameInput, { color: globalTheme.text }]}
                    value={bookName}
                    onChangeText={saveBookName}
                    placeholder="Deftere isim verin..."
                    placeholderTextColor={globalTheme.secondaryText}
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={[styles.settingLabel, { color: globalTheme.secondaryText }]}>
                  Kağıt ve Mürekkep Teması
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 8 }}
                >
                  {themes.map((t) => (
                    <ThemePreview
                      key={t.id}
                      theme={t}
                      isSelected={selectedTheme === t.id}
                      onSelect={saveTheme}
                    />
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: currentTheme.primary }]}
                onPress={() => setIsModalVisible(false)}
                activeOpacity={0.88}
              >
                <Text style={styles.doneBtnText}>Tamamla</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sağ Alt FAB - Tarif Ekle */}
      <TouchableOpacity
        style={[
          styles.addFab,
          { backgroundColor: currentTheme.primary },
        ]}
        onPress={() => navigation.navigate('AddRecipe')}
        activeOpacity={0.88}
      >
        <FontAwesome5 name="plus" size={15} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.addFabText}>Tarif Ekle</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 58,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 12,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontFamily: 'Handwriting',
  },
  headerMeta: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansMedium',
    marginTop: 2,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: 'PlusJakartaSansRegular',
    fontSize: 14,
  },
  categoryBar: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 11,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSansBold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },
  recipeCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  recipeInfoCol: {
    flex: 1,
    paddingRight: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    marginBottom: 3,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  recipeCategory: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansBold',
  },
  recipeMetaDot: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansRegular',
    marginLeft: 5,
  },
  addFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  addFabText: {
    fontSize: 14.5,
    lineHeight: 19,
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: 'PlusJakartaSansBold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeading: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  closeBtn: {
    padding: 4,
  },
  settingSection: {
    marginBottom: 22,
  },
  settingLabel: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSansBold',
    marginBottom: 10,
  },
  nameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'PlusJakartaSansRegular',
  },
  themeOption: {
    width: 92,
    marginRight: 12,
    alignItems: 'center',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  miniPhone: {
    width: 68,
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniHeader: {
    height: 20,
    borderBottomWidth: 1,
  },
  miniContent: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 5,
    paddingTop: 6,
    gap: 5,
  },
  miniMarginRule: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 1,
  },
  miniCard: {
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  themeName: {
    fontSize: 11.5,
    fontFamily: 'PlusJakartaSansMedium',
    textAlign: 'center',
  },
  doneBtn: {
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
  },
  emptyPageCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 38,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSansBold',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSansRegular',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default RecipeBookScreen;
