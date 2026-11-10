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
  StatusBar
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { generateAIContent } from '../config/ai';


const { width } = Dimensions.get('window');

const AddRecipeScreen = () => {
  const { isDarkMode, theme } = useTheme();

  const [title, setTitle] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Genel');
  const navigation = useNavigation();
  const [aiLoading, setAiLoading] = useState(false);

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
    if (ingredientInput.trim() && !ingredients.includes(ingredientInput.trim())) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const removeIngredient = (item) => {
    setIngredients(ingredients.filter(i => i !== item));
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
        { text: 'Tamam', onPress: () => navigation.goBack() }
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
        Alert.alert('API Anahtarı Eksik', 'Lütfen .env dosyasına EXPO_PUBLIC_GEMINI_API_KEY değerini ekleyin.');
      } else {
        Alert.alert('Hata', 'Yapay zeka ile bağlantı kurulamadı.');
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />


      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.paperContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? theme.card : '#f1f5f9', borderRadius: 20 }]}>
              <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.pageTitle, { color: theme.text }]}>Yeni Tarif Yaz</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.paperBody}>
            {/* Date */}
            <View style={[styles.dateRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.dateLabel, { color: theme.secondaryText }]}>Tarih:</Text>
              <Text style={[styles.dateValue, { color: theme.text }]}>{new Date().toLocaleDateString('tr-TR')}</Text>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Tarif:</Text>
              <TextInput
                style={[styles.titleInput, { color: theme.text, borderBottomColor: theme.border }]}
                placeholder="Örn: Anne Köftesi"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={isDarkMode ? '#475569' : "#cbd5e1"}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategori Seç:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      selectedCategory === cat.name && [styles.catChipActive, { backgroundColor: '#ff7043', borderColor: '#ff7043' }]
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <FontAwesome5
                      name={cat.icon}
                      size={14}
                      color={selectedCategory === cat.name ? '#fff' : theme.secondaryText}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[
                      styles.catChipText,
                      { color: theme.secondaryText },
                      selectedCategory === cat.name && [styles.catChipTextActive, { color: '#fff' }]
                    ]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Ingredients */}
            <View style={[styles.inputGroup, { zIndex: 10 }]}>
              <Text style={styles.label}>Malzemeler:</Text>

              <View style={[styles.ingredientRow, { borderBottomColor: theme.border }]}>
                <TextInput
                  style={[styles.ingredientInput, { color: theme.text }]}
                  placeholder="Malzeme ekle..."
                  value={ingredientInput}
                  onChangeText={setIngredientInput}
                  onSubmitEditing={addIngredient}
                  placeholderTextColor={isDarkMode ? '#475569' : "#cbd5e1"}
                />
                <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
                  <FontAwesome5 name="plus" size={14} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Vertical List of Ingredients */}
              <View style={styles.ingredientsList}>
                {ingredients.map((item, idx) => (
                  <View key={item + idx} style={[styles.ingredientItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.ingBullet} />
                    <Text style={[styles.ingredientText, { color: theme.text }]}>{item}</Text>
                    <TouchableOpacity onPress={() => removeIngredient(item)} style={styles.removeBtn}>
                      <FontAwesome5 name="trash-alt" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.label, { color: theme.text }]}>Yapılışı:</Text>
                <TouchableOpacity style={[styles.aiBtn, { backgroundColor: isDarkMode ? '#ff704315' : '#fff7ed', borderColor: isDarkMode ? '#ff704340' : '#ffcc80' }]} onPress={handleAICreate} disabled={aiLoading}>
                  {aiLoading ? <FontAwesome5 name="spinner" spin color="#ff7043" /> : <FontAwesome5 name="magic" color="#ff7043" />}
                  <Text style={styles.aiBtnText}>Yapay zeka ile yaz</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.instructionsInput, { color: theme.text, borderBottomColor: theme.border }]}
                placeholder="Tarifi buraya yazmaya başla..."
                value={instructions}
                onChangeText={setInstructions}
                placeholderTextColor={isDarkMode ? '#475569' : "#cbd5e1"}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Centered Orange Button */}
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <FontAwesome5 name="check" size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  paperContent: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backBtn: {
    padding: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: 'TextExtraBold',
    color: '#1e293b',
  },
  paperBody: {
    paddingHorizontal: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  dateLabel: {
    fontFamily: 'TextBold',
    color: '#64748b',
    marginRight: 8,
    fontSize: 14,
  },
  dateValue: {
    fontFamily: 'TextNormal',
    color: '#334155',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontFamily: 'TextBold',
    color: '#334155',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 22,
    fontFamily: 'TextNormal',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    paddingVertical: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    paddingBottom: 8,
    marginBottom: 16,
  },
  ingredientInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'TextNormal',
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#ff7043',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Ingredients List Styles
  ingredientsList: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
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
    fontSize: 16,
    color: '#334155',
    fontFamily: 'TextNormal',
  },
  removeBtn: {
    padding: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  aiBtnText: {
    color: '#ff7043',
    fontSize: 13,
    fontFamily: 'TextBold',
    marginLeft: 6,
  },
  instructionsInput: {
    fontSize: 16, // Handwriting size
    fontFamily: 'TextNormal',
    color: '#0f172a',
    lineHeight: 28, // Line height
    minHeight: 200,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  saveButtonContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#ff7043', // App Main Orange
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#ff7043',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'TextBold',
    marginLeft: 10,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#ff7043',
    borderColor: '#ff7043',
  },
  catChipText: {
    fontSize: 14,
    fontFamily: 'TextBold',
    color: '#64748b',
  },
  catChipTextActive: {
    color: '#fff',
  },
});

export default AddRecipeScreen;