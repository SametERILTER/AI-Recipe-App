import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';


const RecipeBookScreen = () => {
  const { isDarkMode, theme: globalTheme } = useTheme();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookName, setBookName] = useState('Tarif Defterim');
  const [selectedTheme, setSelectedTheme] = useState('gold');
  const navigation = useNavigation();

  const themes = [
    { id: 'gold', name: 'Klasik Altın', primary: '#bfa100', bg: isDarkMode ? '#1e293b' : '#fffbe6', base: isDarkMode ? '#0f172a' : '#f6f1e7', cardBg: isDarkMode ? '#1e293b' : '#fff', border: isDarkMode ? '#334155' : '#f3e7b4' },
    { id: 'green', name: 'Doğal Yeşil', primary: '#10b981', bg: isDarkMode ? '#064e3b' : '#ecfdf5', base: isDarkMode ? '#022c22' : '#f0fdf4', cardBg: isDarkMode ? '#064e3b' : '#fff', border: isDarkMode ? '#065f46' : '#d1fae5' },
    { id: 'purple', name: 'Zarif Mor', primary: '#8b5cf6', bg: isDarkMode ? '#4c1d95' : '#f5f3ff', base: isDarkMode ? '#2e1065' : '#fafaff', cardBg: isDarkMode ? '#4c1d95' : '#fff', border: isDarkMode ? '#5b21b6' : '#ede9fe' },
    { id: 'blue', name: 'Okyanus Mavisi', primary: '#3b82f6', bg: isDarkMode ? '#1e3a8a' : '#eff6ff', base: isDarkMode ? '#172554' : '#f8faff', cardBg: isDarkMode ? '#1e3a8a' : '#fff', border: isDarkMode ? '#1e40af' : '#dbeafe' },
    { id: 'rose', name: 'Romantik Gül', primary: '#f43f5e', bg: isDarkMode ? '#881337' : '#fff1f2', base: isDarkMode ? '#4c0519' : '#fffbff', cardBg: isDarkMode ? '#881337' : '#fff', border: isDarkMode ? '#9f1239' : '#ffe4e6' },
  ];

  const currentTheme = themes.find(t => t.id === selectedTheme) || themes[0];

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
    return categories.find(c => c.name === catName)?.icon || 'book';
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
      result = result.filter(r => r.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLocaleLowerCase('tr-TR');
      result = result.filter(r =>
        (r.title || '').toLocaleLowerCase('tr-TR').includes(q) ||
        (r.ingredients || []).join(' ').toLocaleLowerCase('tr-TR').includes(q)
      );
    }
    setFilteredRecipes(result);
  }, [searchQuery, activeCategory, recipes]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="book-open" size={64} color={currentTheme.primary} style={{ marginBottom: 20, opacity: 0.3 }} />
      <Text style={styles.emptyTitle}>Henüz tarif eklemedin</Text>
      <Text style={styles.emptySubtitle}>Favori tariflerini buraya ekleyerek kendi tarif defterini oluşturabilirsin!</Text>
    </View>
  );

  const ThemePreview = ({ theme, isSelected, onSelect }) => (
    <TouchableOpacity
      style={[styles.themeOption, isSelected && { borderColor: theme.primary, borderWidth: 2 }]}
      onPress={() => onSelect(theme.id)}
    >
      <View style={[styles.miniPhone, { backgroundColor: theme.base, borderColor: theme.primary }]}>
        <View style={[styles.miniHeader, { backgroundColor: theme.bg, borderBottomColor: theme.border }]} />
        <View style={styles.miniContent}>
          {[1, 2].map(i => <View key={i} style={[styles.miniCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]} />)}
        </View>
        <View style={[styles.miniTabbar, { backgroundColor: theme.cardBg, borderTopColor: theme.border }]}>
          <View style={styles.miniTab} />
          <View style={[styles.miniTab, { backgroundColor: theme.primary, height: 4 }]} />
          <View style={styles.miniTab} />
        </View>
      </View>
      <Text style={[styles.themeName, { color: isDarkMode ? '#fff' : '#64748b' }, isSelected && { color: theme.primary, fontFamily: 'TextBold' }]}>{theme.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.base }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.bg, borderBottomColor: currentTheme.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: currentTheme.primary }]}>{bookName}</Text>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: currentTheme.primary + '15' }]}
            onPress={() => setIsModalVisible(true)}
          >
            <FontAwesome5 name="cog" size={18} color={currentTheme.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: isDarkMode ? '#0f172a' : '#fff', borderColor: isDarkMode ? currentTheme.border : '#e2e8f0' }]}>
          <FontAwesome5 name="search" size={14} color={isDarkMode ? '#64748b' : '#94a3b8'} style={{ marginLeft: 14 }} />
          <TextInput
            placeholder="Ara..."
            style={[styles.searchInput, { color: isDarkMode ? '#fff' : '#334155' }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          />
        </View>
      </View>

      <View style={[styles.categoryBar, { backgroundColor: currentTheme.bg, borderBottomColor: currentTheme.border }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { borderColor: currentTheme.border },
                activeCategory === item.name && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }
              ]}
              onPress={() => setActiveCategory(item.name)}
            >
              <FontAwesome5
                name={item.icon}
                size={12}
                color={activeCategory === item.name ? '#fff' : currentTheme.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[
                styles.categoryText,
                { color: activeCategory === item.name ? '#fff' : currentTheme.primary }
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredRecipes}
        keyExtractor={(item, idx) => idx.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.recipeCard, { backgroundColor: currentTheme.cardBg, borderColor: currentTheme.border }]}
            onPress={() => navigation.navigate('RecipeDetailBook', { recipe: item })}
          >
            <View style={[styles.recipeCardIcon, { backgroundColor: currentTheme.bg, borderColor: currentTheme.border }]}>
              <FontAwesome5 name={getCategoryIcon(item.category)} size={18} color={currentTheme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recipeTitle, { color: isDarkMode ? '#fff' : '#1e293b' }]}>{item.title}</Text>
              <Text style={[styles.recipeCategory, { color: currentTheme.primary }]}>{item.category || 'Genel'}</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={14} color={isDarkMode ? currentTheme.primary : "#e2e8f0"} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      />

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: globalTheme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalHeading, { color: globalTheme.text }]}>Tarif Defterinizi Özelleştirin</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeBtn}>
                <FontAwesome5 name="times" size={20} color={globalTheme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.settingSection}>
                <Text style={[styles.settingLabel, { color: globalTheme.secondaryText }]}>Tarif Defteri Adı</Text>
                <View style={[styles.nameInputWrapper, { backgroundColor: globalTheme.card, borderColor: globalTheme.border }]}>
                  <FontAwesome5 name="pen" size={12} color={currentTheme.primary} style={{ marginRight: 12 }} />
                  <TextInput
                    style={[styles.nameInput, { color: globalTheme.text }]}
                    value={bookName}
                    onChangeText={saveBookName}
                    placeholder="İsim verin..."
                    placeholderTextColor={globalTheme.secondaryText}
                  />
                </View>
              </View>

              <View style={styles.settingSection}>
                <Text style={[styles.settingLabel, { color: globalTheme.secondaryText }]}>Renk Teması</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                  {themes.map(t => <ThemePreview key={t.id} theme={t} isSelected={selectedTheme === t.id} onSelect={saveTheme} />)}
                </ScrollView>
              </View>

              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: currentTheme.primary }]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.doneBtnText}>Kaydet ve Kapat</Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddRecipe')}>
          <FontAwesome5 name="plus" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.addButtonText}>Tarif Ekle</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  headerTitle: { fontSize: 28, fontFamily: 'Handwriting' },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, height: 46, borderWidth: 1, borderColor: '#e2e8f0' },
  searchInput: { flex: 1, paddingHorizontal: 12, fontFamily: 'TextNormal', fontSize: 14 },
  categoryBar: { paddingVertical: 12, borderBottomWidth: 1 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  categoryText: { fontSize: 13, fontFamily: 'TextBold' },
  recipeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  recipeCardIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 15, borderWidth: 1 },
  recipeTitle: { fontSize: 17, fontFamily: 'TextBold', color: '#1e293b', marginBottom: 2 },
  recipeCategory: { fontSize: 12, fontFamily: 'TextBold' },
  addButtonContainer: { position: 'absolute', left: 20, right: 20, bottom: 24, zIndex: 10 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff7043', borderRadius: 16, paddingVertical: 16, elevation: 5 },
  addButtonText: { fontSize: 16, fontFamily: 'TextBold', color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: 600 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalHeading: { fontSize: 20, fontFamily: 'TextExtraBold', color: '#1e293b' },
  settingSection: { marginBottom: 20 },
  settingLabel: { fontSize: 15, fontFamily: 'TextBold', color: '#64748b', marginBottom: 10 },
  nameInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#e2e8f0' },
  nameInput: { flex: 1, fontSize: 15, fontFamily: 'TextNormal', color: '#1e293b' },
  themeOption: { width: 90, marginRight: 12, alignItems: 'center', padding: 4, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  miniPhone: { width: 70, height: 100, borderRadius: 10, borderWidth: 1.5, overflow: 'hidden', marginBottom: 5 },
  miniHeader: { height: 20, borderBottomWidth: 1 },
  miniContent: { padding: 4, gap: 3 },
  miniCard: { height: 10, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1 },
  miniTabbar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee' },
  miniTab: { width: 8, height: 2, backgroundColor: '#eee' },
  themeName: { fontSize: 11, fontFamily: 'TextNormal' },
  doneBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  doneBtnText: { color: '#fff', fontSize: 15, fontFamily: 'TextBold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 18, fontFamily: 'TextBold', color: '#64748b', marginBottom: 5 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center' },
});

export default RecipeBookScreen;