import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  ImageBackground,
  Keyboard
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';


const HomeScreen = () => {
  const { isDarkMode, theme } = useTheme();
  const [input, setInput] = useState('');
  const [malzemeler, setMalzemeler] = useState([]);
  const [slideAnim] = useState(new Animated.Value(100));
  const [inputFocused, setInputFocused] = useState(false);
  const [greeting, setGreeting] = useState('Merhaba');

  const navigation = useNavigation();

  // Rastgele tarif modal state'leri
  const [randomModalVisible, setRandomModalVisible] = useState(false);
  const [randomModalAnim] = useState(new Animated.Value(0));
  const [randomStep, setRandomStep] = useState(1); // 1: yemek zamanı, 2: tarz
  const [selectedMealTime, setSelectedMealTime] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [continueAnim] = useState(new Animated.Value(0));
  const [generateAnim] = useState(new Animated.Value(0));

  // Yapay Zeka Şef Ayarları state'leri
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settingsModalAnim] = useState(new Animated.Value(0));
  const [cookingLevel, setCookingLevel] = useState('intermediate'); // varsayılan orta

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLevel = await AsyncStorage.getItem('chef_cooking_level');
        if (savedLevel) setCookingLevel(savedLevel);
      } catch (e) {
        console.log('Ayarlar yüklenemedi:', e);
      }
    };
    loadSettings();
  }, []);

  const saveCookingLevel = async (level) => {
    try {
      setCookingLevel(level);
      await AsyncStorage.setItem('chef_cooking_level', level);
    } catch (e) {
      console.log('Ayarlar kaydedilemedi:', e);
    }
  };

  const openSettingsModal = () => {
    setSettingsModalVisible(true);
    Animated.spring(settingsModalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  };

  const closeSettingsModal = () => {
    Animated.spring(settingsModalAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start(() => setSettingsModalVisible(false));
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Günaydın');
    else if (hour >= 12 && hour < 17) setGreeting('Tünaydın');
    else if (hour >= 17 && hour < 23) setGreeting('İyi Akşamlar');
    else setGreeting('İyi Geceler');
  }, []);

  const mealTypes = [
    { key: 'kolay', label: 'Yapımı Kolay', icon: 'magic' },
    { key: 'hafif', label: 'Hafif', icon: 'leaf' },
    { key: 'misafir', label: 'Misafirlik', icon: 'users' },
    { key: 'pratik', label: 'Pratik', icon: 'clock' },
    { key: 'favori', label: 'Favori', icon: 'heart' },
  ];

  const mealTimes = [
    { key: 'kahvalti', label: 'Kahvaltı', icon: 'sun' },
    { key: 'ogle', label: 'Öğle Yemeği', icon: 'utensils' },
    { key: 'aksam', label: 'Akşam Yemeği', icon: 'moon' },
    { key: 'gece', label: 'Gece Atıştırmalığı', icon: 'star' },
    { key: 'ara', label: 'Ara Öğün', icon: 'clock' },
  ];

  const recipeStyles = [
    { key: 'kolay', label: 'Yapımı Kolay', icon: 'magic' },
    { key: 'misafir', label: 'Misafirlik', icon: 'users' },
    { key: 'pratik', label: 'Pratik', icon: 'clock' },
    { key: 'agir', label: 'Ağır', icon: 'dumbbell' },
  ];

  const [selectedMealType, setSelectedMealType] = useState(null);
  const [activeTab, setActiveTab] = useState('meal'); // 'meal' or 'dessert'
  const [servingSize, setServingSize] = useState(2);

  const readyIngredients = [
    {
      title: 'Sebze & Meyve',
      data: [
        { name: 'Domates', image: require('../images/ingredients/tomato.jpg') },
        { name: 'Soğan', image: require('../images/ingredients/onion.jpg') },
        { name: 'Patates', image: require('../images/ingredients/potato.jpg') },
        { name: 'Biber', image: require('../images/ingredients/pepper.jpg') },
        { name: 'Sarımsak', image: require('../images/ingredients/garlic.jpg') },
        { name: 'Zeytin', image: require('../images/ingredients/olive.jpg') },
        { name: 'Mısır', image: require('../images/ingredients/corn.jpg') }
      ]
    },
    {
      title: 'Süt & Kahvaltılık',
      data: [
        { name: 'Peynir', image: require('../images/ingredients/cheese.jpg') },
        { name: 'Yumurta', image: require('../images/ingredients/egg.jpg') },
        { name: 'Süt', image: require('../images/ingredients/milk.jpg') },
        { name: 'Yağ', image: require('../images/ingredients/oil.jpg') },
        { name: 'Şeker', image: require('../images/ingredients/sugar.jpg') },
      ]
    },
    {
      title: 'Et & Tavuk',
      data: [
        { name: 'Tavuk', image: require('../images/ingredients/chicken.jpg') },
        { name: 'Kıyma', image: require('../images/ingredients/mince.jpg') },
      ]
    },
    {
      title: 'Bakliyat & Unlu',
      data: [
        { name: 'Un', image: require('../images/ingredients/flour.jpg') },
        { name: 'Makarna', image: require('../images/ingredients/pasta.jpg') },
        { name: 'Pirinç', image: require('../images/ingredients/rice.jpg') },
        { name: 'Bulgur', image: require('../images/ingredients/bulgur.jpg') },
      ]
    }
  ];

  const dessertIngredients = [
    {
      title: 'Temel Malzemeler',
      data: [
        { name: 'Un', image: require('../images/ingredients/flour.jpg') },
        { name: 'Şeker', image: require('../images/ingredients/sugar.jpg') },
        { name: 'Süt', image: require('../images/ingredients/milk.jpg') },
        { name: 'Yumurta', image: require('../images/ingredients/egg.jpg') },
        { name: 'Yağ', image: require('../images/ingredients/oil.jpg') },
        { name: 'Peynir', image: require('../images/ingredients/cheese.jpg') },
      ]
    },
    {
      title: 'Ekstralar',
      data: [
        { name: 'Kakao', image: require('../images/ingredients/sugar.jpg') }, // Placeholder
        { name: 'Vanilya', image: require('../images/ingredients/sugar.jpg') }, // Placeholder
        { name: 'Çikolata', image: require('../images/ingredients/sugar.jpg') }, // Placeholder
      ]
    }
  ];

  const [modalVisible, setModalVisible] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const [confirmAnim] = useState(new Animated.Value(0));
  const [modalSelected, setModalSelected] = useState([]);

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(modalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
    Animated.timing(confirmAnim, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.spring(modalAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start(() => setModalVisible(false));
  };

  useEffect(() => {
    if (modalVisible) {
      setModalSelected(malzemeler);
    }
  }, [modalVisible]);

  useEffect(() => {
    if (modalVisible) {
      if (modalSelected.length > 0) {
        Animated.spring(confirmAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      } else {
        Animated.spring(confirmAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  }, [modalSelected, modalVisible]);

  const handleConfirm = () => {
    setMalzemeler(modalSelected);
    closeModal();
  };

  const openRandomModal = () => {
    setRandomModalVisible(true);
    setRandomStep(1);
    setSelectedMealTime(null);
    setSelectedStyle(null);
    Animated.spring(randomModalAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  };

  const closeRandomModal = () => {
    Animated.spring(randomModalAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start(() => setRandomModalVisible(false));
  };

  const handleMealTimeSelect = (mealTime) => {
    setSelectedMealTime(mealTime);
    if (mealTime) {
      Animated.spring(continueAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.spring(continueAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    }
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    if (style) {
      Animated.spring(generateAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.spring(generateAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    }
  };

  const handleContinue = () => {
    setRandomStep(2);
    continueAnim.setValue(0);
    generateAnim.setValue(0);
  };

  const handleGenerateRecipe = () => {
    navigation.navigate('RecipeDetail', {
      mealTime: selectedMealTime,
      style: selectedStyle,
      isRandom: true,
      servingSize
    });
    closeRandomModal();
  };

  const malzemeEkle = () => {
    if (input.trim() && !malzemeler.includes(input.trim())) {
      setMalzemeler([...malzemeler, input.trim()]);
      setInput('');
      Keyboard.dismiss();
    }
  };

  const malzemeSil = (item) => {
    setMalzemeler(malzemeler.filter(malzeme => malzeme !== item));
  };

  const tarifUret = () => {
    navigation.navigate('RecipeDetail', { malzemeler, mealType: selectedMealType, servingSize, category: activeTab });
    setMalzemeler([]); // Malzemeleri temizle
  };

  // Malzeme listesi değiştiğinde animasyon
  useEffect(() => {
    if (malzemeler.length > 0) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100, friction: 8 }).start();
    } else {
      Animated.spring(slideAnim, { toValue: 100, useNativeDriver: true, tension: 100, friction: 8 }).start();
    }
  }, [malzemeler.length]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? theme.background : "#f8fafc"} />

      {/* Header */}
      <View style={[styles.header, activeTab === 'dessert' && styles.headerDessert]}>
        <View>
          <Text style={styles.greeting}>{greeting} Şef! 👋</Text>
          <Text style={styles.headerTitle}>Bugün ne pişirelim?</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsHeaderBtn}
          onPress={openSettingsModal}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={isDarkMode ? ['#1e293b', '#0f172a'] : ['#fff', '#f1f5f9']}
            style={[styles.settingsIconCircle, { borderColor: isDarkMode ? '#334155' : '#ffd8c4' }]}
          >
            <FontAwesome5 name="robot" size={18} color="#ff7043" />
            <View style={[styles.settingsBadge, { borderColor: isDarkMode ? '#1e293b' : '#fff' }]} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Günün Menüsü Banner */}
        <TouchableOpacity
          style={{ marginBottom: 24 }}
          onPress={() => navigation.navigate('RecipeOfDay')}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={['#fb923c', '#ea580c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 24,
              paddingVertical: 22,
              borderRadius: 24,
              // overflow: 'hidden', // GÖRÜNMEZLİK SORUNU İÇİN KALDIRILDI
              position: 'relative',
              zIndex: 10, // Üstte görünsün
              minHeight: 110, // Garanti yükseklik
            }}
          >
            {/* Dekoratif Arka Plan İkonu */}
            <View style={{ position: 'absolute', right: -20, bottom: -25, overflow: 'hidden', borderRadius: 24 }}>
              {/* Bu View wrapper'ı overflow için kullanılabilir ama şimdilik direkt render edelim */}
            </View>
            <FontAwesome5
              name="utensils"
              size={90}
              color="#fff"
              style={{
                position: 'absolute',
                right: 10, // Ekranda görünsün diye içeri aldım
                bottom: 10,
                opacity: 0.15,
                transform: [{ rotate: '-15deg' }]
              }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontFamily: 'TextBold', fontSize: 20, color: '#fff' }}>Günün Menüsü</Text>
                </View>
                <Text style={{ fontFamily: 'TextMedium', fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
                  Şefin bugün sizin için hazırladığı 3 öğünlük özel plan.
                </Text>
              </View>

              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2
              }}>
                <FontAwesome5 name="arrow-right" size={16} color="#ea580c" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Ingredient Input Section */}
        <View style={styles.card}>
          <View style={[styles.toggleContainer, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={[styles.toggleButton, activeTab === 'meal' && styles.toggleButtonActive]} onPress={() => setActiveTab('meal')}>
              <Text style={[styles.toggleText, { color: activeTab === 'meal' ? '#fff' : theme.secondaryText }]}>Yemek</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleButton, activeTab === 'dessert' && styles.toggleButtonActive]} onPress={() => setActiveTab('dessert')}>
              <Text style={[styles.toggleText, { color: activeTab === 'dessert' ? '#fff' : theme.secondaryText }]}>Tatlı</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: theme.card, borderColor: inputFocused ? '#ff7043' : theme.border }]}>
              <FontAwesome5 name="search" size={16} color={theme.secondaryText} style={{ marginLeft: 16 }} />
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder="Malzeme ekle..."
                value={input}
                onChangeText={setInput}
                onSubmitEditing={malzemeEkle}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholderTextColor={theme.secondaryText}
              />
              {input.length > 0 && (
                <TouchableOpacity onPress={malzemeEkle} style={styles.addButton}>
                  <FontAwesome5 name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            {/* Serving Size Selection */}
            <View style={styles.servingContainer}>
              <View style={styles.servingRow}>
                {[
                  { label: '1 Kişilik', value: 1 },
                  { label: '2 Kişilik', value: 2 },
                  { label: '4 Kişilik', value: 4 },
                  { label: '4+ Kişilik', value: '4+' },
                ].map((option) => {
                  const isSelected = servingSize === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.servingButton,
                        { backgroundColor: isSelected ? '#ff7043' : theme.card },
                        isSelected && styles.servingButtonSelected
                      ]}
                      onPress={() => setServingSize(option.value)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.servingIconWrapper}>
                        {option.value === 1 && (
                          <FontAwesome5 name="user-alt" size={12} color={isSelected ? '#fff' : '#64748b'} />
                        )}
                        {option.value === 2 && (
                          <View style={{ flexDirection: 'row' }}>
                            <FontAwesome5 name="user-alt" size={12} color={isSelected ? '#fff' : '#64748b'} />
                            <FontAwesome5 name="user-alt" size={12} color={isSelected ? '#fff' : '#64748b'} style={{ marginLeft: -5 }} />
                          </View>
                        )}
                        {(option.value === 4 || option.value === '4+') && (
                          <FontAwesome5 name="users" size={14} color={isSelected ? '#fff' : '#64748b'} />
                        )}
                      </View>
                      <Text style={[styles.servingButtonText, { color: isSelected ? '#fff' : theme.secondaryText }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.listButton} onPress={openModal}>
            <FontAwesome5 name="list-ul" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.listButtonText}>Hazır Listeden Seç</Text>
          </TouchableOpacity>

          {/* Vertical List Display */}
          <View style={styles.listContainer}>
            {malzemeler.length > 0 ? (
              malzemeler.map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <View style={[styles.bulletPoint, { backgroundColor: theme.isDarkMode ? '#ff7043' : '#ff7043' }]} />
                    <Text style={[styles.listItemText, { color: theme.text }]}>{item}</Text>
                  </View>
                  <TouchableOpacity onPress={() => malzemeSil(item)} style={styles.deleteBtn}>
                    <FontAwesome5 name="trash-alt" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <FontAwesome5 name="shopping-basket" size={24} color={theme.border} style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>Dolabınızda neler var? Eklemeye başlayın.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Meal Type Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tarz Seçimi</Text>
          {selectedMealType && (
            <TouchableOpacity onPress={() => setSelectedMealType(null)}>
              <Text style={{ color: '#ef4444', fontSize: 13, fontFamily: 'TextBold' }}>Temizle</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mealTypesContainer}>
          {mealTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.mealTypeCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                selectedMealType === type.key && styles.mealTypeCardSelected
              ]}
              onPress={() => setSelectedMealType(type.key === selectedMealType ? null : type.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }, selectedMealType === type.key && styles.iconCircleSelected]}>
                <FontAwesome5 name={type.icon} size={16} color={selectedMealType === type.key ? '#fff' : theme.secondaryText} />
              </View>
              <Text style={[styles.mealTypeLabel, { color: selectedMealType === type.key ? (isDarkMode ? '#ff7043' : '#c2410c') : theme.secondaryText }]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Random Recipe Card */}
        <TouchableOpacity style={[styles.randomCard, { backgroundColor: '#3b82f6' }]} onPress={openRandomModal} activeOpacity={0.95}>
          <View style={styles.randomContent}>
            <View style={styles.randomIconContainer}>
              <FontAwesome5 name="dice" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.randomTitle}>Kararsız mı kaldın?</Text>
              <Text style={styles.randomSubtitle}>Sana özel rastgele bir tarif önerelim!</Text>
            </View>
            <View style={styles.arrowCircle}>
              <FontAwesome5 name="arrow-right" size={14} color="#3b82f6" />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Generate Button */}
      {malzemeler.length > 0 && (
        <Animated.View style={[styles.fabContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity style={styles.fabButton} onPress={tarifUret} activeOpacity={0.9}>
            <FontAwesome5 name="magic" size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.fabText}>Tarif Üret</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{malzemeler.length}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Modals from previous implementation */}
      {/* 1. Malzeme Seçme Modalı */}
      <Modal visible={modalVisible} animationType="none" transparent onRequestClose={closeModal}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <Animated.View style={[styles.modalContainer, { backgroundColor: theme.background, transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').height, 0] }) }] }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Hazır Malzemeler</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeModalBtn}>
                <FontAwesome5 name="times" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
              {(activeTab === 'meal' ? readyIngredients : dessertIngredients).map((category, index) => (
                <View key={index} style={{ marginBottom: 40 }}>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
                  <View style={styles.categoryGrid}>
                    {category.data.map((item) => {
                      const isSelected = modalSelected.includes(item.name);
                      return (
                        <TouchableOpacity
                          key={item.name}
                          style={[styles.gridItem, { backgroundColor: theme.card, borderColor: isSelected ? '#10b981' : theme.border }, isSelected && styles.gridItemSelected]}
                          onPress={() => isSelected ? setModalSelected(modalSelected.filter(m => m !== item.name)) : setModalSelected([...modalSelected, item.name])}
                        >
                          {isSelected && <View style={styles.checkBadge}><FontAwesome5 name="check" size={10} color="#fff" /></View>}
                          {item.image ? (
                            <ImageBackground source={item.image} style={styles.gridImage} imageStyle={{ borderRadius: 16 }}>
                              <View style={styles.gridImageOverlay}><Text style={styles.gridImageText}>{item.name}</Text></View>
                            </ImageBackground>
                          ) : (
                            <Text style={[styles.gridText, { color: isSelected ? '#10b981' : theme.text }, isSelected && styles.gridTextSelected]}>{item.name}</Text>
                          )}
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
            <Animated.View style={[styles.confirmContainer, { opacity: confirmAnim, transform: [{ translateY: confirmAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]} pointerEvents={modalSelected.length > 0 ? 'auto' : 'none'}>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Seçilenleri Ekle ({modalSelected.length})</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>

      {/* 2. Rastgele Tarif Modalı */}
      <Modal visible={randomModalVisible} animationType="none" transparent onRequestClose={closeRandomModal}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={styles.modalBackdrop} onPress={closeRandomModal} />
          <Animated.View style={[styles.modalContainer, { backgroundColor: theme.background, transform: [{ translateY: randomModalAnim.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').height, 0] }) }] }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Rastgele Tarif</Text>
              <TouchableOpacity onPress={closeRandomModal}><FontAwesome5 name="times" size={20} color={theme.secondaryText} /></TouchableOpacity>
            </View>
            {randomStep === 1 ? (
              <View>
                <Text style={[styles.stepTitle, { color: theme.text }]}>Ne zaman yiyeceksiniz?</Text>
                <View style={styles.optionsGrid}>
                  {mealTimes.map(item => (
                    <TouchableOpacity key={item.key} style={[styles.optionCard, { backgroundColor: theme.card, borderColor: selectedMealTime === item.key ? '#ff7043' : theme.border }, selectedMealTime === item.key && styles.optionCardSelected]} onPress={() => handleMealTimeSelect(item.key)}>
                      <View style={styles.optionIconContainer}>
                        <FontAwesome5 name={item.icon} size={28} color={selectedMealTime === item.key ? '#fff' : '#ff7043'} />
                      </View>
                      <Text style={[styles.optionText, { color: selectedMealTime === item.key ? '#fff' : theme.secondaryText }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ height: 80 }} />
                <Animated.View style={[styles.bottomAction, { opacity: continueAnim }]}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { opacity: selectedMealTime ? 1 : 0.6 }]}
                    onPress={handleContinue}
                    disabled={!selectedMealTime}
                  >
                    <Text style={styles.primaryBtnText}>Devam Et</Text>
                    <FontAwesome5 name="arrow-right" size={16} color="#fff" style={{ marginLeft: 10 }} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            ) : (
              <View>
                <Text style={[styles.stepTitle, { color: theme.text }]}>Nasıl bir tarif olsun?</Text>
                <View style={styles.optionsGrid}>
                  {recipeStyles.map(item => (
                    <TouchableOpacity key={item.key} style={[styles.optionCard, { backgroundColor: theme.card, borderColor: selectedStyle === item.key ? '#ff7043' : theme.border }, selectedStyle === item.key && styles.optionCardSelected]} onPress={() => handleStyleSelect(item.key)}>
                      <View style={styles.optionIconContainer}>
                        <FontAwesome5 name={item.icon} size={28} color={selectedStyle === item.key ? '#fff' : '#ff7043'} />
                      </View>
                      <Text style={[styles.optionText, { color: selectedStyle === item.key ? '#fff' : theme.secondaryText }]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={{ height: 80 }} />
                <Animated.View style={[styles.bottomAction, { opacity: generateAnim }]}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { opacity: selectedStyle ? 1 : 0.6 }]}
                    onPress={handleGenerateRecipe}
                    disabled={!selectedStyle}
                  >
                    <FontAwesome5 name="magic" size={16} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.primaryBtnText}>Tarifi Oluştur</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* 3. Yapay Zeka Şef Ayarları Modalı */}
      <Modal visible={settingsModalVisible} animationType="none" transparent onRequestClose={closeSettingsModal}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={styles.modalBackdrop} onPress={closeSettingsModal} />
          <Animated.View style={[styles.modalContainer, { backgroundColor: theme.background, transform: [{ translateY: settingsModalAnim.interpolate({ inputRange: [0, 1], outputRange: [Dimensions.get('window').height, 0] }) }] }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.aiModalIcon}>
                  <FontAwesome5 name="robot" size={16} color="#fff" />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Yapay Zeka Şef Ayarları</Text>
              </View>
              <TouchableOpacity onPress={closeSettingsModal} style={styles.closeModalBtn}>
                <FontAwesome5 name="times" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <View style={styles.settingsSection}>
                <Text style={[styles.settingsLabel, { color: theme.text }]}>Yapay zeka yemekleri nasıl tarif etsin?</Text>
                <Text style={[styles.settingsSubLabel, { color: theme.secondaryText }]}>Tecrübenize göre anlatım dili ve detay seviyesi değişir.</Text>

                <View style={styles.levelOptions}>
                  {[
                    { id: 'beginner', title: 'Yemek Yapmakta Yeniyim', sub: 'Adım adım, çok detaylı ve basit anlatım.', icon: 'child' },
                    { id: 'intermediate', title: 'Biraz Biliyorum', sub: 'Standart detayda, anlaşılır ve pratik anlatım.', icon: 'user' },
                    { id: 'advanced', title: 'Tecrübeliyim', sub: 'Hızlı, teknik detaylı ve profesyonel anlatım.', icon: 'crown' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.levelCard, { backgroundColor: theme.card, borderColor: cookingLevel === item.id ? '#ffd8c4' : theme.border }, cookingLevel === item.id && styles.levelCardActive]}
                      onPress={() => saveCookingLevel(item.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.levelIconBox, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }, cookingLevel === item.id && styles.levelIconBoxActive]}>
                        <FontAwesome5 name={item.icon} size={18} color={cookingLevel === item.id ? '#fff' : theme.secondaryText} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.levelTitle, { color: theme.text }, cookingLevel === item.id && styles.levelTitleActive]}>{item.title}</Text>
                        <Text style={[styles.levelSub, { color: theme.secondaryText }]}>{item.sub}</Text>
                      </View>
                      {cookingLevel === item.id && (
                        <View style={styles.levelCheck}>
                          <FontAwesome5 name="check-circle" size={20} color="#ff7043" solid />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.settingsSection, { opacity: 0.5 }]}>
                <Text style={[styles.settingsLabel, { color: theme.text }]}>Mutfak Tercihleri (Yakında)</Text>
                <View style={{ height: 100, backgroundColor: theme.card, borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: theme.border, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: theme.secondaryText, fontFamily: 'TextMedium' }}>Yeni ayarlar çok yakında eklenecek...</Text>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.settingsFooter, { borderTopColor: theme.divider }]}>
              <TouchableOpacity style={styles.settingsConfirmBtn} onPress={closeSettingsModal}>
                <Text style={styles.settingsConfirmText}>Ayarları Kaydet ve Kapat</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#ff7043',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'TextBold',
    color: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'TextExtraBold',
    color: '#fff',
  },
  scrollContent: {
    padding: 24,
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'TextBold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: '#ff7043',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  listButtonText: {
    color: '#fff',
    fontFamily: 'TextBold',
    fontSize: 15,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  listItemText: {
    fontSize: 15,
    fontFamily: 'TextBold',
  },
  deleteBtn: {
    padding: 8,
  },
  emptyStateContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontStyle: 'italic',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'TextBold',
  },
  mealTypesContainer: {
    gap: 12,
    marginBottom: 32,
  },
  mealTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  mealTypeCardSelected: {
    borderColor: '#ff7043',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconCircleSelected: {
    backgroundColor: '#ff7043',
  },
  mealTypeLabel: {
    fontSize: 14,
    fontFamily: 'TextBold',
  },
  randomCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    height: 100,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  randomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  randomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  randomTitle: {
    fontSize: 18,
    fontFamily: 'TextBold',
    color: '#fff',
    marginBottom: 4,
  },
  randomSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'TextNormal',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  fabButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ff7043',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    backgroundColor: '#ff7043',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
  },
  fabText: {
    fontSize: 18,
    fontFamily: 'TextBold',
    color: '#fff',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 450, // Kesin görünürlük için
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'TextExtraBold',
  },
  closeModalBtn: {
    padding: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'TextBold',
    marginBottom: 12,
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridItem: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridItemSelected: {
    borderColor: '#10b981',
  },
  gridText: {
    fontSize: 14,
    fontFamily: 'TextBold',
  },
  gridTextSelected: {
    color: '#059669',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gridImageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
  },
  gridImageText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'TextBold',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#10b981',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  confirmContainer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  confirmBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'TextBold',
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'TextBold',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionCard: {
    width: '45%',
    aspectRatio: 1.1,
    borderRadius: 24,
    justifyContent: 'flex-start',
    paddingTop: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  optionCardSelected: {
    borderColor: '#ff7043',
    backgroundColor: '#ff7043',
  },
  optionText: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: 'TextBold',
    textAlign: 'center',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#fff',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  primaryBtn: {
    flexDirection: 'row',
    backgroundColor: '#ff7043',
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7043',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'TextBold',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  toggleButtonActive: {
    backgroundColor: '#ff7043',
  },
  toggleText: {
    fontSize: 16,
    fontFamily: 'TextBold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  headerDessert: {
    backgroundColor: '#a855f7',
  },
  servingContainer: {
    marginBottom: 20,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  servingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  servingButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  servingButtonSelected: {
    backgroundColor: '#ff7043',
  },
  servingIconWrapper: {
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  servingButtonText: {
    fontSize: 12,
    fontFamily: 'TextBold',
  },
  servingButtonTextSelected: {
    color: '#fff',
  },
  settingsHeaderBtn: {
    padding: 2,
  },
  settingsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff7043',
    borderWidth: 2,
    borderColor: '#fff',
  },
  aiModalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff7043',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsLabel: {
    fontSize: 18,
    fontFamily: 'TextBold',
    marginBottom: 4,
  },
  settingsSubLabel: {
    fontSize: 14,
    fontFamily: 'TextRegular',
    marginBottom: 20,
  },
  levelOptions: {
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  levelCardActive: {
    borderColor: '#ffd8c4',
    backgroundColor: '#fff7ed',
  },
  levelIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelIconBoxActive: {
    backgroundColor: '#ff7043',
  },
  levelTitle: {
    fontSize: 15,
    fontFamily: 'TextBold',
  },
  levelTitleActive: {
    color: '#1e293b',
  },
  levelSub: {
    fontSize: 12,
    fontFamily: 'TextRegular',
    marginTop: 2,
  },
  levelCheck: {
    marginLeft: 10,
  },
  settingsFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  settingsConfirmBtn: {
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  settingsConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'TextBold',
  },
});


export default HomeScreen;