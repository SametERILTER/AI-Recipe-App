import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  StatusBar,
  Modal,
  Pressable,
  ImageBackground,
  Keyboard,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { generateAIContent } from '../config/ai';
import { readyIngredients, dessertIngredients } from '../data/readyIngredients';

const { width } = Dimensions.get('window');

const AddRecipeScreen = () => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const modalFooterBottomPadding = Math.max(insets.bottom + 18, 36);
  const modalScrollBottomPadding = Math.max(insets.bottom + 110, 140);

  const [title, setTitle] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Genel');
  const [aiLoading, setAiLoading] = useState(false);

  const [pantryModalVisible, setPantryModalVisible] = useState(false);
  const [pantrySelected, setPantrySelected] = useState([]);

  const navigation = useNavigation();

  const categories = [
    { id: 'genel', name: 'Genel', icon: 'utensils' },
    { id: 'corba', name: 'Çorba', icon: 'utensil-spoon' },
    { id: 'anayemek', name: 'Ana Yemek', icon: 'concierge-bell' },
    { id: 'kahvalti', name: 'Kahvaltı', icon: 'egg' },
    { id: 'tatli', name: 'Tatlı', icon: 'ice-cream' },
    { id: 'hamur', name: 'Hamur İşi', icon: 'bread-slice' },
    { id: 'meze', name: 'Meze/Salata', icon: 'leaf' },
  ];

  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients([...ingredients, trimmed]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (item) => {
    setIngredients(ingredients.filter((i) => i !== item));
  };

  const openPantryModal = () => {
    Keyboard.dismiss();
    setPantrySelected([...ingredients]);
    setPantryModalVisible(true);
  };

  const togglePantryItem = (name) => {
    if (pantrySelected.includes(name)) {
      setPantrySelected(pantrySelected.filter((item) => item !== name));
    } else {
      setPantrySelected([...pantrySelected, name]);
    }
  };

  const confirmPantrySelection = () => {
    setIngredients([...pantrySelected]);
    setPantryModalVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Lütfen tarif adı girin.');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir malzeme ekleyin.');
      return;
    }
    if (!instructions.trim()) {
      Alert.alert('Uyarı', 'Lütfen tarifin yapılışını yazın.');
      return;
    }
    const newRecipe = {
      title: title.trim(),
      ingredients,
      instructions: instructions.trim(),
      category: selectedCategory,
      createdAt: Date.now(),
    };
    try {
      const existing = await AsyncStorage.getItem('recipeBooks');
      let recipes = [];
      if (existing) {
        recipes = JSON.parse(existing);
      }
      recipes.push(newRecipe);
      await AsyncStorage.setItem('recipeBooks', JSON.stringify(recipes));
      Alert.alert('Başarılı', 'Tarif başarıyla kaydedildi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', 'Tarif kaydedilirken bir hata oluştu.');
    }
  };

  const handleAICreate = async () => {
    if (!title.trim()) {
      Alert.alert('Uyarı', 'Lütfen önce tarif adı girin.');
      return;
    }
    if (ingredients.length === 0) {
      Alert.alert('Uyarı', 'Lütfen önce en az bir malzeme ekleyin.');
      return;
    }
    setAiLoading(true);
    try {
      const prompt = `Elimde şu malzemeler var: ${ingredients.join(', ')}. Bu malzemelerle ${title.trim()} yemeğini yapmak istiyorum. Bana sadece yapılış aşamasını çok kısa olmayacak şekilde ve öz bir şekilde anlat. Kesinlikle giriş veya sonuç cümlesi kurma, 'Elbette', 'İşte tarif', 'Afiyet olsun' gibi ifadeler asla kullanma. Malzeme listesini tekrar yazma, sadece yapılış adımlarını biraz detaylandırarak numaralandırarak yaz. Maksimum 8-10 adım olsun. Cümleye direkt ilk adımdan başla. Birinin not defterine yemek tarif ekler gibi samimi bir dille yaz. Adımlar arasında bir satır boşluğu bırak.`;

      const aiText = await generateAIContent(prompt, {
        temperature: 1.0,
      });

      if (aiText && aiText.trim()) {
        setInstructions(aiText.trim());
      } else {
        Alert.alert('Hata', 'Yapay zekadan anlamlı bir cevap alınamadı.');
      }
    } catch (e) {
      if (e.message?.includes('API_KEY_MISSING')) {
        Alert.alert(
          'API Anahtarı Eksik',
          'Lütfen .env dosyasına EXPO_PUBLIC_GEMINI_API_KEY değerini ekleyin.'
        );
      } else {
        Alert.alert('Hata', 'Yapay zeka ile bağlantı kurulamadı.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const pantryGroups =
    selectedCategory === 'Tatlı' ? dessertIngredients : readyIngredients;

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* Sabit Üst Başlık */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[
            styles.backBtn,
            { backgroundColor: theme.card },
          ]}
          activeOpacity={0.8}
        >
          <FontAwesome5 name="arrow-left" size={17} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Yeni Tarif Yaz</Text>
        <View style={[styles.datePill, { backgroundColor: theme.card }]}>
          <Text style={[styles.datePillText, { color: theme.secondaryText }]}>
            {new Date().toLocaleDateString('tr-TR', {
              day: 'numeric',
              month: 'short',
            })}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 110, 130) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tarif Adı */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.label, { color: theme.text }]}>Tarif Adı</Text>
            <View style={[styles.inputCard, { backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.titleInput, { color: theme.text }]}
                placeholder="Örn: Anne Köftesi"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={theme.secondaryText}
              />
            </View>
          </View>

          {/* Kategori Seçimi */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.label, { color: theme.text }]}>Kategori</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryListContent}
            >
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      {
                        backgroundColor: isActive ? '#ff7043' : theme.card,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                    activeOpacity={0.85}
                  >
                    <FontAwesome5
                      name={cat.icon}
                      size={13}
                      color={isActive ? '#fff' : '#ff7043'}
                      style={{ marginRight: 7 }}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        { color: isActive ? '#fff' : theme.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Malzemeler */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>
                Malzemeler
              </Text>
              <TouchableOpacity
                style={[
                  styles.pantryChipBtn,
                  {
                    backgroundColor: isDarkMode ? '#221915' : '#fff3ee',
                  },
                ]}
                onPress={openPantryModal}
                activeOpacity={0.85}
              >
                <FontAwesome5
                  name="images"
                  size={12}
                  color="#ff7043"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.pantryChipBtnText}>Hazır Malzemeler</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.ingredientInputRow, { backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.ingredientInput, { color: theme.text }]}
                placeholder="Malzeme yazıp ekle (örn: 2 yumurta)"
                value={ingredientInput}
                onChangeText={setIngredientInput}
                onSubmitEditing={addIngredient}
                returnKeyType="done"
                placeholderTextColor={theme.secondaryText}
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={addIngredient}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="plus" size={13} color="#fff" />
              </TouchableOpacity>
            </View>

            {ingredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {ingredients.map((item, idx) => (
                  <View
                    key={item + idx}
                    style={[styles.ingredientItem, { backgroundColor: theme.card }]}
                  >
                    <View style={styles.ingBullet} />
                    <Text style={[styles.ingredientText, { color: theme.text }]}>
                      {item}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeIngredient(item)}
                      style={styles.removeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <FontAwesome5 name="times" size={13} color={theme.secondaryText} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Yapılışı */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>
                Yapılışı
              </Text>
              <TouchableOpacity
                style={[
                  styles.aiBtn,
                  {
                    backgroundColor: isDarkMode ? '#221915' : '#fff3ee',
                  },
                ]}
                onPress={handleAICreate}
                disabled={aiLoading}
                activeOpacity={0.85}
              >
                {aiLoading ? (
                  <FontAwesome5 name="spinner" spin size={12} color="#ff7043" />
                ) : (
                  <FontAwesome5 name="magic" size={12} color="#ff7043" />
                )}
                <Text style={styles.aiBtnText}>
                  {aiLoading ? 'Yazılıyor...' : 'Yapay zeka ile yaz'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.instructionsCard, { backgroundColor: theme.card }]}>
              <TextInput
                style={[styles.instructionsInput, { color: theme.text }]}
                placeholder="Tarifin adımlarını buraya yaz..."
                value={instructions}
                onChangeText={setInstructions}
                placeholderTextColor={theme.secondaryText}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Sabit Alt Kaydet Barı */}
        <View
          style={[
            styles.saveFooter,
            {
              backgroundColor: theme.background,
              paddingBottom: Math.max(insets.bottom + 16, 28),
            },
          ]}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={['#ff7043', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveButtonGradient}
            >
              <FontAwesome5 name="check" size={16} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.saveButtonText}>Deftere Kaydet</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Hazır Malzeme Ekleme Modalı */}
      <Modal
        visible={pantryModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setPantryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPantryModalVisible(false)}
          />
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Hazır Malzemelerden Seç
                </Text>
                <Text style={[styles.modalSubTitle, { color: theme.secondaryText }]}>
                  Tarifine eklemek istediğin malzemeleri işaretle
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPantryModalVisible(false)}
                style={styles.closeModalBtn}
              >
                <FontAwesome5 name="times" size={19} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 22,
                paddingTop: 6,
                paddingBottom: modalScrollBottomPadding,
              }}
              showsVerticalScrollIndicator={false}
            >
              {pantryGroups.map((category, index) => (
                <View key={index} style={{ marginBottom: 24 }}>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>
                    {category.title}
                  </Text>
                  <View style={styles.categoryGrid}>
                    {category.data.map((item) => {
                      const isSelected = pantrySelected.includes(item.name);
                      return (
                        <TouchableOpacity
                          key={item.name}
                          style={[
                            styles.gridItem,
                            { backgroundColor: isSelected ? '#ff7043' : theme.card },
                            isSelected && styles.gridItemSelected,
                          ]}
                          onPress={() => togglePantryItem(item.name)}
                          activeOpacity={0.85}
                        >
                          {isSelected && (
                            <View style={styles.checkBadge}>
                              <FontAwesome5 name="check" size={12} color="#ff7043" />
                            </View>
                          )}
                          {item.image ? (
                            <ImageBackground
                              source={item.image}
                              style={styles.gridImage}
                              imageStyle={{ borderRadius: 16 }}
                            >
                              {isSelected && <View style={styles.gridImageSelectedTint} />}
                              <View
                                style={[
                                  styles.gridImageOverlay,
                                  isSelected && styles.gridImageOverlaySelected,
                                ]}
                              >
                                <Text style={styles.gridImageText}>{item.name}</Text>
                              </View>
                            </ImageBackground>
                          ) : (
                            <Text
                              style={[
                                styles.gridText,
                                { color: isSelected ? '#fff' : theme.text },
                              ]}
                            >
                              {item.name}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View
              style={[
                styles.modalStickyBottom,
                {
                  backgroundColor: theme.background,
                  paddingBottom: modalFooterBottomPadding,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmPantrySelection}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#ff7043', '#ea580c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <FontAwesome5
                    name="check"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.saveButtonText}>
                    {pantrySelected.length > 0
                      ? `Seçilenleri Ekle (${pantrySelected.length})`
                      : 'Seçimi Tamamla'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  datePill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
  },
  datePillText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSansSemiBold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansBold',
    marginBottom: 10,
  },
  inputCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleInput: {
    fontSize: 17,
    fontFamily: 'PlusJakartaSansSemiBold',
    paddingVertical: 2,
  },
  categoryListContent: {
    paddingVertical: 2,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    marginRight: 8,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansBold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pantryChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pantryChipBtnText: {
    color: '#ff7043',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSansBold',
  },
  ingredientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 6,
  },
  ingredientInput: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSansRegular',
    paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: '#ff7043',
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  ingredientsList: {
    marginTop: 10,
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  ingBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff7043',
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'PlusJakartaSansMedium',
  },
  removeBtn: {
    padding: 4,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  aiBtnText: {
    color: '#ff7043',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSansBold',
    marginLeft: 6,
  },
  instructionsCard: {
    borderRadius: 16,
    padding: 16,
  },
  instructionsInput: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSansRegular',
    lineHeight: 24,
    minHeight: 170,
    paddingTop: 0,
  },
  saveFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    width: '100%',
    paddingTop: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSansExtraBold',
  },
  modalSubTitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSansRegular',
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSansBold',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (width - 60) / 3,
    height: 100,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gridItemSelected: {
    borderColor: '#ff7043',
    borderWidth: 2,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gridImageSelectedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 112, 67, 0.25)',
  },
  gridImageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  gridImageOverlaySelected: {
    backgroundColor: 'rgba(255, 112, 67, 0.85)',
  },
  gridImageText: {
    color: '#fff',
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSansBold',
    textAlign: 'center',
  },
  gridText: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSansBold',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  modalStickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  modalConfirmBtn: {
    borderRadius: 18,
    overflow: 'hidden',
  },
});

export default AddRecipeScreen;
