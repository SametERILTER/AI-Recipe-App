import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Modal,
  Pressable,
  Dimensions,
  ImageBackground,
  Keyboard,
  PanResponder,
  BackHandler
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { getRecentRecipes } from '../utils/recentRecipes';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const HomeScreen = () => {
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const modalFooterBottomPadding = Math.max(insets.bottom + 18, 48);
  const modalScrollBottomPadding = Math.max(insets.bottom + 115, 145);
  const [input, setInput] = useState('');
  const [malzemeler, setMalzemeler] = useState([]);
  const scrollY = useSharedValue(0);
  const [greeting, setGreeting] = useState('Merhaba');

  const navigation = useNavigation();

  // Yapay Zeka Tarif Sihirbazı modal state'leri
  const [wizardModalVisible, setWizardModalVisible] = useState(false);
  const wizardSheetY = useSharedValue(SCREEN_HEIGHT);
  const isWizardOpenRef = useRef(false);

  // Resimli Hazır Malzemeler modal state'leri
  const [pantryModalVisible, setPantryModalVisible] = useState(false);
  const pantrySheetY = useSharedValue(SCREEN_HEIGHT);
  const [pantrySelected, setPantrySelected] = useState([]);
  const isPantryOpenRef = useRef(false);

  // Rastgele tarif modal state'leri
  const [randomModalVisible, setRandomModalVisible] = useState(false);
  const randomSheetY = useSharedValue(SCREEN_HEIGHT);
  const [randomStep, setRandomStep] = useState(1); // 1: yemek zamanı, 2: tarz
  const [selectedMealTime, setSelectedMealTime] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const continueAnim = useSharedValue(0);
  const generateAnim = useSharedValue(0);

  // Yapay Zeka Şef Ayarları state'leri
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const settingsSheetY = useSharedValue(SCREEN_HEIGHT);
  const [cookingLevel, setCookingLevel] = useState('intermediate'); // varsayılan orta
  const [recentRecipes, setRecentRecipes] = useState([]);

  // Ayarları ve son bakılan tarifleri yükle
  useFocusEffect(
    useCallback(() => {
      const loadFocusData = async () => {
        try {
          const [savedLevel, recents] = await Promise.all([
            AsyncStorage.getItem('chef_cooking_level'),
            getRecentRecipes(),
          ]);
          if (savedLevel) setCookingLevel(savedLevel);
          setRecentRecipes(recents);
        } catch (e) {
          console.log('Ana sayfa verileri yüklenemedi:', e);
        }
      };
      loadFocusData();
    }, [])
  );

  const saveCookingLevel = async (level) => {
    try {
      setCookingLevel(level);
      await AsyncStorage.setItem('chef_cooking_level', level);
    } catch (e) {
      console.log('Ayarlar kaydedilemedi:', e);
    }
  };

  const openSettingsModal = () => {
    settingsSheetY.value = SCREEN_HEIGHT;
    setSettingsModalVisible(true);
  };

  useEffect(() => {
    if (settingsModalVisible) {
      requestAnimationFrame(() => {
        settingsSheetY.value = withTiming(0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
      });
    }
  }, [settingsModalVisible]);

  const closeSettingsModal = () => {
    settingsSheetY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setSettingsModalVisible)(false);
        }
      }
    );
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
        { name: 'Kakao', image: null },
        { name: 'Vanilya', image: null },
        { name: 'Çikolata', image: null },
      ]
    }
  ];

  const openWizardModal = () => {
    Keyboard.dismiss();
    wizardSheetY.value = SCREEN_HEIGHT;
    isWizardOpenRef.current = true;
    setWizardModalVisible(true);
  };

  const closeWizardModal = () => {
    Keyboard.dismiss();
    isWizardOpenRef.current = false;
    wizardSheetY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setWizardModalVisible)(false);
        }
      }
    );
  };

  useEffect(() => {
    if (wizardModalVisible) {
      requestAnimationFrame(() => {
        wizardSheetY.value = withTiming(0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
      });
    }
  }, [wizardModalVisible]);

  const openWizardWithStyle = (styleKey) => {
    setSelectedMealType(styleKey);
    setActiveTab('meal');
    openWizardModal();
  };

  const openWizardWithTab = (tabKey) => {
    setActiveTab(tabKey);
    openWizardModal();
  };

  const openPantryModal = () => {
    Keyboard.dismiss();
    setPantrySelected([...malzemeler]);
    pantrySheetY.value = SCREEN_HEIGHT;
    isPantryOpenRef.current = true;
    setPantryModalVisible(true);
  };

  const closePantryModal = () => {
    isPantryOpenRef.current = false;
    pantrySheetY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setPantryModalVisible)(false);
        }
      }
    );
  };

  useEffect(() => {
    if (pantryModalVisible) {
      requestAnimationFrame(() => {
        pantrySheetY.value = withTiming(0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
      });
    }
  }, [pantryModalVisible]);

  const confirmPantrySelection = () => {
    setMalzemeler([...pantrySelected]);
    closePantryModal();
  };

  const togglePantryItem = (name) => {
    if (pantrySelected.includes(name)) {
      setPantrySelected(pantrySelected.filter(item => item !== name));
    } else {
      setPantrySelected([...pantrySelected, name]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isPantryOpenRef.current) {
          closePantryModal();
          return true;
        }
        if (isWizardOpenRef.current) {
          closeWizardModal();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const openRandomModal = () => {
    randomSheetY.value = SCREEN_HEIGHT;
    continueAnim.value = 0;
    generateAnim.value = 0;
    setRandomStep(1);
    setSelectedMealTime(null);
    setSelectedStyle(null);
    setRandomModalVisible(true);
  };

  useEffect(() => {
    if (randomModalVisible) {
      requestAnimationFrame(() => {
        randomSheetY.value = withTiming(0, {
          duration: 280,
          easing: Easing.out(Easing.cubic),
        });
      });
    }
  }, [randomModalVisible]);

  const closeRandomModal = () => {
    randomSheetY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setRandomModalVisible)(false);
        }
      }
    );
  };

  const handleMealTimeSelect = (mealTime) => {
    setSelectedMealTime(mealTime);
    continueAnim.value = withTiming(mealTime ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    generateAnim.value = withTiming(style ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  };

  const handleContinue = () => {
    setRandomStep(2);
    continueAnim.value = 0;
    generateAnim.value = 0;
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

  const toggleMalzeme = (item) => {
    if (malzemeler.includes(item)) {
      setMalzemeler(malzemeler.filter(m => m !== item));
    } else {
      setMalzemeler([...malzemeler, item]);
    }
  };

  const malzemeSil = (item) => {
    setMalzemeler(malzemeler.filter(malzeme => malzeme !== item));
  };

  const tarifUret = () => {
    if (malzemeler.length === 0) return;
    const currentMalzemeler = [...malzemeler];
    const currentMealType = selectedMealType;
    const currentServing = servingSize;
    const currentCategory = activeTab;
    closeWizardModal();
    navigation.navigate('RecipeDetail', {
      malzemeler: currentMalzemeler,
      mealType: currentMealType,
      servingSize: currentServing,
      category: currentCategory,
    });
    setMalzemeler([]);
  };

  const wizardSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: wizardSheetY.value }],
  }));

  const pantrySheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pantrySheetY.value }],
  }));

  const randomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: randomSheetY.value }],
  }));

  const continueButtonStyle = useAnimatedStyle(() => ({
    opacity: continueAnim.value,
  }));

  const generateButtonStyle = useAnimatedStyle(() => ({
    opacity: generateAnim.value,
  }));

  const settingsSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: settingsSheetY.value }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    paddingTop: interpolate(scrollY.value, [0, 70], [56, 46], Extrapolation.CLAMP),
    paddingBottom: interpolate(scrollY.value, [0, 70], [14, 8], Extrapolation.CLAMP),
  }));

  const greetingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 35], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 35], [0, -6], Extrapolation.CLAMP) },
    ],
  }));

  const compactTitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [25, 65], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [25, 65], [6, 0], Extrapolation.CLAMP) },
    ],
  }));

  const bigTitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 45], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, 70], [38, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 55], [0, -10], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      {/* Header */}
      <Animated.View style={[styles.header, { backgroundColor: theme.background }, headerAnimatedStyle]}>
        <View style={styles.headerTextCol}>
          <View style={styles.greetingSlot}>
            <Animated.Text style={[styles.greeting, greetingAnimatedStyle]}>
              {greeting}, Şef
            </Animated.Text>
            <Animated.Text style={[styles.compactHeaderTitle, { color: theme.text }, compactTitleAnimatedStyle]}>
              Bugün ne pişirelim?
            </Animated.Text>
          </View>
          <Animated.View style={[styles.bigTitleSlot, bigTitleAnimatedStyle]}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              Bugün ne pişirelim?
            </Text>
          </Animated.View>
        </View>
        <TouchableOpacity
          style={styles.settingsHeaderBtn}
          onPress={openSettingsModal}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.settingsIconCircle,
              { backgroundColor: theme.card, borderColor: theme.border }
            ]}
          >
            <FontAwesome5 name="sliders-h" size={18} color={theme.text} />
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO KARTI - AKILLI ŞEF MASASI */}
        <TouchableOpacity
          style={styles.heroCardContainer}
          onPress={openWizardModal}
          activeOpacity={0.92}
        >
          <LinearGradient
            colors={isDarkMode ? ['#271c18', '#1a1310'] : ['#fff5f0', '#ffeae0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.heroCard,
              { borderColor: isDarkMode ? '#4a2c22' : '#ffd5c2' }
            ]}
          >
            {malzemeler.length > 0 && (
              <View style={styles.heroBadgeRow}>
                <View style={styles.heroIngredientsCount}>
                  <Text style={styles.heroIngredientsCountText}>
                    {malzemeler.length} malzeme hazır
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.heroTitle, { color: theme.text }]}>
              Dolabındaki Malzemelerle Harika Bir Tarif Üret
            </Text>

            <Text style={[styles.heroSubtitle, { color: theme.secondaryText }]}>
              {malzemeler.length > 0
                ? `${malzemeler.slice(0, 3).join(', ')}${malzemeler.length > 3 ? ` ve +${malzemeler.length - 3}` : ''} seçili.`
                : 'Elindeki malzemeleri ekle; şef sana özel adım adım tarif hazırlasın.'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* SON BAKILAN TARİFLER */}
        {recentRecipes.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 0 }]}>
                Son Bakılan Tarifler
              </Text>
              <Text style={[styles.recentCountText, { color: theme.secondaryText }]}>
                Son {recentRecipes.length} tarif
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recentRecipes.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.recentCard,
                    { backgroundColor: theme.card, borderColor: theme.border }
                  ]}
                  onPress={() => navigation.navigate(item.routeName, item.params)}
                  activeOpacity={0.86}
                >
                  <Text style={[styles.recentCardTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.recentCardFooter}>
                    <Text style={[styles.recentCardMeta, { color: theme.secondaryText }]} numberOfLines={1}>
                      {item.meta || 'Tarifi aç'}
                    </Text>
                    <FontAwesome5 name="chevron-right" size={11} color="#ff7043" />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 2. GÜNÜN İLHAMI: GÜNÜN MENÜSÜ & RASTGELE TARİF */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Günün İlhamı</Text>
        <View style={styles.quickCardsRow}>
          <TouchableOpacity
            style={styles.quickCardWrapper}
            onPress={() => navigation.navigate('RecipeOfDay')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#ff7043', '#ea580c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.cardIconBadge}>
                <FontAwesome5 name="concierge-bell" size={16} color="#fff" />
              </View>
              <Text style={styles.gradientCardTitle}>Günün Menüsü</Text>
              <Text style={styles.gradientCardDesc}>3 öğünlük dengeli lezzetler</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCardWrapper}
            onPress={openRandomModal}
            activeOpacity={0.9}
          >
            <View style={[styles.plainCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.cardIconBadge, { backgroundColor: 'rgba(255, 112, 67, 0.14)' }]}>
                <FontAwesome5 name="dice" size={16} color="#ff7043" />
              </View>
              <Text style={[styles.plainCardTitle, { color: theme.text }]}>Rastgele Tarif</Text>
              <Text style={[styles.plainCardDesc, { color: theme.secondaryText }]}>Kararsız kaldığında tıkla</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 3. HIZLI FİKİRLER */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Hızlı Fikirler</Text>
        <View style={styles.conceptsGrid}>
          {[
            {
              id: 'pratik',
              title: '15 Dk Yemekleri',
              desc: 'Hızlı & pratik',
              icon: 'clock',
              color: '#3b82f6',
              bgLight: '#eff6ff',
              bgDark: '#172554',
              action: () => openWizardWithStyle('pratik'),
            },
            {
              id: 'hafif',
              title: 'Hafif & Fit',
              desc: 'Düşük kalorili',
              icon: 'leaf',
              color: '#10b981',
              bgLight: '#ecfdf5',
              bgDark: '#064e3b',
              action: () => openWizardWithStyle('hafif'),
            },
            {
              id: 'dessert',
              title: 'Tatlı Kaçamağı',
              desc: 'Hızlı tatlılar',
              icon: 'cookie-bite',
              color: '#ec4899',
              bgLight: '#fdf2f8',
              bgDark: '#500724',
              action: () => openWizardWithTab('dessert'),
            },
            {
              id: 'misafir',
              title: 'Misafir Sofrası',
              desc: 'Özenli lezzetler',
              icon: 'users',
              color: '#8b5cf6',
              bgLight: '#f5f3ff',
              bgDark: '#2e1065',
              action: () => openWizardWithStyle('misafir'),
            },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.conceptCard,
                { backgroundColor: theme.card, borderColor: theme.border }
              ]}
              onPress={item.action}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.conceptIconBox,
                  { backgroundColor: isDarkMode ? item.bgDark : item.bgLight }
                ]}
              >
                <FontAwesome5 name={item.icon} size={15} color={item.color} />
              </View>
              <View style={styles.conceptTextCol}>
                <Text style={[styles.conceptTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.conceptDesc, { color: theme.secondaryText }]}>{item.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.mainFab}
        onPress={openWizardModal}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#ff7043', '#ea580c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <FontAwesome5 name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.fabText}>Tarif Üret</Text>
          {malzemeler.length > 0 && (
            <View style={styles.fabBadge}>
              <Text style={styles.fabBadgeText}>{malzemeler.length}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* 1. Yapay Zeka Tarif Sihirbazı Modalı */}
      <Modal
        visible={wizardModalVisible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={closeWizardModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeWizardModal} />
          <Animated.View
            style={[
              styles.modalContainer,
              styles.wizardModalContainer,
              { backgroundColor: theme.background },
              wizardSheetStyle,
            ]}
          >
            {/* Modal Header */}
            <View style={styles.wizardModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Tarif Sihirbazı</Text>
                <Text style={[styles.modalSubTitle, { color: theme.secondaryText }]}>
                  Malzemelerini seç, şefin tarifini yazsın
                </Text>
              </View>
              <TouchableOpacity onPress={closeWizardModal} style={styles.closeModalBtn}>
                <FontAwesome5 name="times" size={19} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: modalScrollBottomPadding }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Yemek / Tatlı Toggle */}
              <View style={[styles.wizardTabRow, { backgroundColor: isDarkMode ? '#181818' : '#f0f0f0' }]}>
                <TouchableOpacity
                  style={[
                    styles.wizardTabBtn,
                    activeTab === 'meal' && [styles.wizardTabBtnActive, { backgroundColor: isDarkMode ? '#282828' : '#ffffff' }]
                  ]}
                  onPress={() => setActiveTab('meal')}
                  activeOpacity={0.85}
                >
                  <FontAwesome5
                    name="utensils"
                    size={13}
                    color={activeTab === 'meal' ? '#ff7043' : theme.secondaryText}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.wizardTabBtnText,
                      { color: activeTab === 'meal' ? theme.text : theme.secondaryText },
                      activeTab === 'meal' && styles.wizardTabBtnTextActive
                    ]}
                  >
                    Yemek Tarifi
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.wizardTabBtn,
                    activeTab === 'dessert' && [styles.wizardTabBtnActive, { backgroundColor: isDarkMode ? '#282828' : '#ffffff' }]
                  ]}
                  onPress={() => setActiveTab('dessert')}
                  activeOpacity={0.85}
                >
                  <FontAwesome5
                    name="cookie-bite"
                    size={13}
                    color={activeTab === 'dessert' ? '#ff7043' : theme.secondaryText}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.wizardTabBtnText,
                      { color: activeTab === 'dessert' ? theme.text : theme.secondaryText },
                      activeTab === 'dessert' && styles.wizardTabBtnTextActive
                    ]}
                  >
                    Tatlı Tarifi
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Malzeme Ekleme Alanı */}
              <View style={{ marginBottom: 16 }}>
                {/* 1. Yazarak Arama Input */}
                <View style={[styles.wizardInputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <FontAwesome5 name="carrot" size={15} color="#ff7043" style={{ marginLeft: 14 }} />
                  <TextInput
                    style={[styles.wizardInput, { color: theme.text }]}
                    placeholder={activeTab === 'meal' ? 'Malzeme yaz (örn. domates, makarna)' : 'Tatlı malzemesi yaz (örn. çikolata)'}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={malzemeEkle}
                    placeholderTextColor={theme.secondaryText}
                    returnKeyType="done"
                  />
                  {input.trim().length > 0 && (
                    <TouchableOpacity onPress={malzemeEkle} style={styles.wizardAddBtn} activeOpacity={0.85}>
                      <FontAwesome5 name="plus" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. Resimli Dolaptan Seç Butonu */}
                <TouchableOpacity
                  style={[
                    styles.openPantryBtn,
                    {
                      backgroundColor: isDarkMode ? '#221915' : '#fff3ee',
                      borderColor: isDarkMode ? '#44261c' : '#ffd8c8'
                    }
                  ]}
                  onPress={openPantryModal}
                  activeOpacity={0.85}
                >
                  <View style={styles.openPantryIconCircle}>
                    <FontAwesome5 name="images" size={13} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.openPantryTitle, { color: theme.text }]}>Resimli Dolaptan Seç</Text>
                    <Text style={[styles.openPantrySub, { color: theme.secondaryText }]}>
                      Fotoğraflı hazır malzemeleri dokunarak ekle
                    </Text>
                  </View>
                  <View style={styles.openPantryArrow}>
                    <FontAwesome5 name="chevron-right" size={12} color="#ff7043" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Eklenen Malzemeler Chip Listesi */}
              {malzemeler.length > 0 && (
                <View style={styles.selectedMalzemelerArea}>
                  <View style={styles.selectedMalzemelerHeader}>
                    <Text style={[styles.selectedMalzemelerCount, { color: theme.text }]}>
                      Seçilen Malzemeler ({malzemeler.length})
                    </Text>
                    <TouchableOpacity onPress={() => setMalzemeler([])} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={styles.clearAllBtnText}>Temizle</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.selectedChipsRow}>
                    {malzemeler.map((item, index) => (
                      <View key={index} style={[styles.selectedChip, { backgroundColor: isDarkMode ? '#281c17' : '#fff1eb', borderColor: '#ff7043' }]}>
                        <Text style={[styles.selectedChipText, { color: isDarkMode ? '#ff8a65' : '#ea580c' }]}>{item}</Text>
                        <TouchableOpacity
                          onPress={() => malzemeSil(item)}
                          style={styles.selectedChipRemove}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <FontAwesome5 name="times" size={10} color="#ff7043" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Porsiyon ve Yemek Tarzı Tercihleri */}
              <View style={[styles.wizardPrefsBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.wizardSectionTitle, { color: theme.text, marginBottom: 12 }]}>
                  Tarif Tercihleri
                </Text>

                <Text style={[styles.wizardPrefLabel, { color: theme.secondaryText }]}>Porsiyon</Text>
                <View style={styles.wizardPortionsRow}>
                  {[
                    { label: '1 Kişi', value: 1 },
                    { label: '2 Kişi', value: 2 },
                    { label: '4 Kişi', value: 4 },
                    { label: '4+ Kişi', value: '4+' },
                  ].map((option) => {
                    const isSelected = servingSize === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.wizardPortionBtn,
                          { backgroundColor: isSelected ? '#ff7043' : (isDarkMode ? '#1a1a1a' : '#f5f5f5') }
                        ]}
                        onPress={() => setServingSize(option.value)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.wizardPortionText,
                            { color: isSelected ? '#ffffff' : theme.text },
                            isSelected && { fontFamily: 'PoppinsBold' }
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.styleHeaderRow}>
                  <Text style={[styles.wizardPrefLabel, { color: theme.secondaryText, marginBottom: 0 }]}>
                    Tarz (İsteğe Bağlı)
                  </Text>
                  {selectedMealType && (
                    <TouchableOpacity onPress={() => setSelectedMealType(null)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={styles.clearAllBtnText}>Sıfırla</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {mealTypes.map((type) => {
                    const isSelected = selectedMealType === type.key;
                    return (
                      <TouchableOpacity
                        key={type.key}
                        style={[
                          styles.styleChip,
                          {
                            backgroundColor: isSelected ? '#ff7043' : (isDarkMode ? '#1a1a1a' : '#f5f5f5')
                          }
                        ]}
                        onPress={() => setSelectedMealType(isSelected ? null : type.key)}
                        activeOpacity={0.8}
                      >
                        <FontAwesome5
                          name={type.icon}
                          size={11}
                          color={isSelected ? '#ffffff' : '#ff7043'}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.styleChipText,
                            { color: isSelected ? '#ffffff' : theme.text },
                            isSelected && styles.styleChipTextActive
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </ScrollView>

            {/* Sabit Alt Buton */}
            <View
              style={[
                styles.wizardStickyBottom,
                {
                  backgroundColor: theme.background,
                  borderTopColor: theme.divider,
                  paddingBottom: modalFooterBottomPadding,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.wizardSubmitBtn,
                  { opacity: malzemeler.length > 0 ? 1 : 0.6 }
                ]}
                onPress={tarifUret}
                disabled={malzemeler.length === 0}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={malzemeler.length > 0 ? ['#ff7043', '#ea580c'] : ['#bdbdbd', '#9e9e9e']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.wizardSubmitBtnGradient}
                >
                  <FontAwesome5 name="magic" size={17} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.wizardSubmitBtnText}>
                    {malzemeler.length > 0 ? `Tarifi Oluştur (${malzemeler.length} Malzeme)` : 'En Az 1 Malzeme Ekleyin'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 2. Resimli Hazır Malzemeler Modalı */}
      <Modal
        visible={pantryModalVisible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={closePantryModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closePantryModal} />
          <Animated.View
            style={[
              styles.modalContainer,
              styles.wizardModalContainer,
              { backgroundColor: theme.background },
              pantrySheetStyle,
            ]}
          >
            {/* Pantry Modal Header */}
            <View style={styles.wizardModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Dolabımdan Seç</Text>
                <Text style={[styles.modalSubTitle, { color: theme.secondaryText }]}>
                  Mutfaktaki hazır malzemeleri dokunarak işaretle
                </Text>
              </View>
              <TouchableOpacity onPress={closePantryModal} style={styles.closeModalBtn}>
                <FontAwesome5 name="times" size={19} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: modalScrollBottomPadding }}
              showsVerticalScrollIndicator={false}
            >
              {(activeTab === 'meal' ? readyIngredients : dessertIngredients).map((category, index) => (
                <View key={index} style={{ marginBottom: 24 }}>
                  <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
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
                            <ImageBackground source={item.image} style={styles.gridImage} imageStyle={{ borderRadius: 16 }}>
                              {isSelected && <View style={styles.gridImageSelectedTint} />}
                              <View style={[styles.gridImageOverlay, isSelected && styles.gridImageOverlaySelected]}>
                                <Text style={styles.gridImageText}>{item.name}</Text>
                              </View>
                            </ImageBackground>
                          ) : (
                            <Text style={[styles.gridText, { color: isSelected ? '#fff' : theme.text }]}>{item.name}</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Sabit Onay Butonu */}
            <View
              style={[
                styles.wizardStickyBottom,
                {
                  backgroundColor: theme.background,
                  borderTopColor: theme.divider,
                  paddingBottom: modalFooterBottomPadding,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.wizardSubmitBtn}
                onPress={confirmPantrySelection}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={['#ff7043', '#ea580c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.wizardSubmitBtnGradient}
                >
                  <FontAwesome5 name="check" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.wizardSubmitBtnText}>
                    {pantrySelected.length > 0
                      ? `Seçilenleri Ekle (${pantrySelected.length})`
                      : 'Seçimi Tamamla'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 2. Rastgele Tarif Modalı */}
      <Modal visible={randomModalVisible} animationType="none" transparent statusBarTranslucent onRequestClose={closeRandomModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeRandomModal} />
          <Animated.View style={[styles.modalContainer, styles.randomModalContainer, { backgroundColor: theme.background }, randomSheetStyle]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Rastgele Tarif</Text>
              <TouchableOpacity onPress={closeRandomModal} style={styles.closeModalBtn}>
                <FontAwesome5 name="times" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
            {randomStep === 1 ? (
              <View style={styles.randomStepBody}>
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
                <Animated.View style={[styles.bottomAction, continueButtonStyle]}>
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
              <View style={styles.randomStepBody}>
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
                <Animated.View style={[styles.bottomAction, generateButtonStyle]}>
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
      <Modal visible={settingsModalVisible} animationType="none" transparent statusBarTranslucent onRequestClose={closeSettingsModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSettingsModal} />
          <Animated.View style={[styles.modalContainer, { backgroundColor: theme.background }, settingsSheetStyle]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.aiModalIcon}>
                  <FontAwesome5 name="sliders-h" size={15} color="#fff" />
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
                      <View style={[styles.levelIconBox, { backgroundColor: isDarkMode ? '#181818' : '#eeeeee' }, cookingLevel === item.id && styles.levelIconBoxActive]}>
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingSlot: {
    height: 26,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'PoppinsBold',
    color: '#ff7043',
    letterSpacing: 0.3,
  },
  compactHeaderTitle: {
    position: 'absolute',
    left: 0,
    fontSize: 18,
    fontFamily: 'PoppinsExtraBold',
  },
  bigTitleSlot: {
    height: 38,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: 'PoppinsExtraBold',
  },
  scrollContent: {
    paddingTop: 136,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  mainCard: {
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  modeBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
  },
  modeBtnTextActive: {
    fontFamily: 'PoppinsBold',
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    height: 50,
    marginBottom: 0,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
  },
  addIngredientBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#ff7043',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  activeIngredientsArea: {
    marginTop: 14,
    paddingTop: 12,
  },
  activeIngredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  activeIngredientsCount: {
    fontSize: 12,
    fontFamily: 'PoppinsMedium',
  },
  clearAllBtnText: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    color: '#ff7043',
  },
  ingredientsChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  myIngredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 12,
    gap: 6,
  },
  myIngredientChipText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
  },
  myIngredientRemoveBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupCard: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },
  cardHeaderTitle: {
    fontSize: 17,
    fontFamily: 'PoppinsBold',
    marginBottom: 14,
    letterSpacing: 0,
  },
  miniHeader: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  portionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  portionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  portionItemText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
  },
  portionItemTextActive: {
    fontFamily: 'PoppinsBold',
  },
  styleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stylesScroll: {
    gap: 8,
  },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  styleChipText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
  },
  styleChipTextActive: {
    fontFamily: 'PoppinsBold',
  },
  quickCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    alignItems: 'stretch',
  },
  quickCardWrapper: {
    flex: 1,
  },
  gradientCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    height: 126,
    justifyContent: 'space-between',
  },
  plainCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    height: 126,
    justifyContent: 'space-between',
  },
  cardIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCardTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#ffffff',
    marginTop: 10,
    marginBottom: 2,
  },
  gradientCardDesc: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  plainCardTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    marginTop: 10,
    marginBottom: 2,
  },
  plainCardDesc: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
  },
  quickActionHalf: {
    flex: 1,
  },
  quickCard: {
    borderRadius: 18,
    padding: 15,
    minHeight: 104,
    justifyContent: 'space-between',
  },
  quickCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickIconBoxLight: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickIconBoxAccent: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 112, 67, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickCardTitle: {
    fontFamily: 'PoppinsBold',
    fontSize: 15,
    color: '#fff',
    marginBottom: 2,
  },
  quickCardSub: {
    fontFamily: 'PoppinsRegular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.88)',
  },
  // Hero Card
  heroCardContainer: {
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 112, 67, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: 'PoppinsBold',
    color: '#ff7043',
    letterSpacing: 0.3,
  },
  heroIngredientsCount: {
    backgroundColor: '#ff7043',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroIngredientsCountText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'PoppinsBold',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsExtraBold',
    lineHeight: 27,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: 'PoppinsRegular',
    lineHeight: 19,
    marginBottom: 0,
  },

  // Son Bakılan Tarifler
  recentSection: {
    marginBottom: 24,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  recentCountText: {
    fontSize: 12,
    fontFamily: 'PoppinsMedium',
  },
  recentScrollContent: {
    paddingRight: 8,
    gap: 12,
  },
  recentCard: {
    width: 210,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  recentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentSourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 112, 67, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  recentSourceText: {
    fontSize: 10,
    fontFamily: 'PoppinsBold',
    color: '#ff7043',
  },
  recentCardTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    lineHeight: 20,
    marginBottom: 12,
    minHeight: 40,
  },
  recentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentCardMeta: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    flex: 1,
    marginRight: 8,
  },

  // Sections & Quick Concepts
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  conceptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  conceptCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  conceptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conceptTextCol: {
    flex: 1,
  },
  conceptTitle: {
    fontSize: 13,
    fontFamily: 'PoppinsBold',
    lineHeight: 17,
  },
  conceptDesc: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    marginTop: 1,
  },

  // FAB (Floating Action Button)
  mainFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 25,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
  },
  fabText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.3,
  },
  fabBadge: {
    backgroundColor: '#fff',
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fabBadgeText: {
    color: '#ff7043',
    fontSize: 11,
    fontFamily: 'PoppinsBold',
  },

  // Wizard & Pantry Modal
  wizardModalContainer: {
    height: '92%',
    maxHeight: '95%',
    paddingHorizontal: 0,
    paddingTop: 16,
    paddingBottom: 0,
  },
  wizardModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 6,
    marginBottom: 16,
  },
  modalSubTitle: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    marginTop: 2,
  },
  wizardTabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  wizardTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  wizardTabBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  wizardTabBtnText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
  },
  wizardTabBtnTextActive: {
    fontFamily: 'PoppinsBold',
  },
  wizardInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    height: 52,
    marginBottom: 10,
  },
  wizardInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
  },
  wizardAddBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#ff7043',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  openPantryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  openPantryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ff7043',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openPantryTitle: {
    fontSize: 13,
    fontFamily: 'PoppinsBold',
  },
  openPantrySub: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    marginTop: 1,
  },
  openPantryArrow: {
    paddingRight: 4,
  },
  selectedMalzemelerArea: {
    marginBottom: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 112, 67, 0.06)',
  },
  selectedMalzemelerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedMalzemelerCount: {
    fontSize: 13,
    fontFamily: 'PoppinsBold',
  },
  selectedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 13,
    fontFamily: 'PoppinsBold',
  },
  selectedChipRemove: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardSectionTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    marginBottom: 2,
  },
  wizardSectionSub: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    marginBottom: 14,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  ingredientChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pantryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  pantryChipText: {
    fontSize: 12,
    fontFamily: 'PoppinsMedium',
  },
  wizardPrefsBox: {
    marginTop: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 10,
  },
  wizardPrefLabel: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  wizardPortionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  wizardPortionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  wizardPortionText: {
    fontSize: 13,
    fontFamily: 'PoppinsMedium',
  },
  wizardStickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  wizardSubmitBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  wizardSubmitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  wizardSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
    fontFamily: 'PoppinsExtraBold',
  },
  closeModalBtn: {
    padding: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
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
    borderWidth: 0,
    overflow: 'hidden',
  },
  gridItemSelected: {
    transform: [{ scale: 0.96 }],
  },
  gridText: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gridImageSelectedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 112, 67, 0.42)',
  },
  gridImageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    width: '100%',
    paddingVertical: 6,
    alignItems: 'center',
  },
  gridImageOverlaySelected: {
    backgroundColor: '#ff7043',
    paddingVertical: 7,
  },
  gridImageText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PoppinsBold',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },

  randomModalContainer: {
    height: '82%',
  },
  randomStepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
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
    borderWidth: 0,
  },
  optionCardSelected: {
    borderColor: '#ff7043',
    backgroundColor: '#ff7043',
  },
  optionText: {
    marginTop: 10,
    fontSize: 15,
    fontFamily: 'PoppinsBold',
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
    fontFamily: 'PoppinsBold',
  },
  settingsHeaderBtn: {
    padding: 2,
  },
  settingsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  settingsBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ff7043',
    borderWidth: 0,
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
    fontFamily: 'PoppinsBold',
    marginBottom: 4,
  },
  settingsSubLabel: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
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
    borderWidth: 0,
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
    fontFamily: 'PoppinsBold',
  },
  levelTitleActive: {
    color: '#262626',
  },
  levelSub: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    marginTop: 2,
  },
  levelCheck: {
    marginLeft: 10,
  },
  settingsFooter: {
    padding: 24,
    paddingTop: 16,
    borderWidth: 0,
  },
  settingsConfirmBtn: {
    backgroundColor: '#ff7043',
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  settingsConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PoppinsBold',
  },
});


export default HomeScreen;