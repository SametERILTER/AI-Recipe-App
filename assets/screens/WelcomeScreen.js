import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, SafeAreaView, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';


const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const [step, setStep] = useState(0);
  const [cookingLevel, setCookingLevel] = useState('intermediate');
  const [hasLevelSet, setHasLevelSet] = useState(false);

  React.useEffect(() => {
    checkStorage();
  }, []);

  const checkStorage = async () => {
    try {
      const storedLevel = await AsyncStorage.getItem('chef_cooking_level');
      if (storedLevel) {
        setHasLevelSet(true);
        setCookingLevel(storedLevel);
      }
    } catch (e) {
      console.log('Storage checkout error:', e);
    }
  };

  // Animasyon değerleri
  const transitionAnim = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (step === 0) {
      if (hasLevelSet) {
        // Eğer zaten seviye seçilmişse direkt uygulamaya geç
        navigation.replace('MainTabs');
      } else {
        // İlk giriş ise seviye seçimine git
        setStep(1);
        Animated.spring(transitionAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();
      }
    } else {
      saveAndStart();
    }
  };

  const saveAndStart = async () => {
    try {
      await AsyncStorage.setItem('chef_cooking_level', cookingLevel);
      navigation.replace('MainTabs');
    } catch (e) {
      console.log('Hata kaydedilemedi:', e);
      navigation.replace('MainTabs');
    }
  };

  const step0Style = {
    opacity: transitionAnim.interpolate({
      inputRange: [0, 0.5],
      outputRange: [1, 0],
    }),
    transform: [{
      translateX: transitionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -width],
      })
    }]
  };

  const step1Style = {
    opacity: transitionAnim.interpolate({
      inputRange: [0.5, 1],
      outputRange: [0, 1],
    }),
    transform: [{
      translateX: transitionAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [width, 0],
      })
    }]
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.content}>
        <View style={styles.stepWrapper}>
          {/* Adım 0: Giriş */}
          <Animated.View style={[styles.stepContainer, step0Style, { position: 'absolute' }]}>
            <View style={styles.animationContainer}>
              <LottieView
                autoPlay
                loop
                style={styles.animation}
                source={require('../animations/Welcome.json')}
              />
            </View>

            <View style={styles.textSection}>
              <Text style={[styles.title, { color: theme.text }]}>Mutfakta Bir{"\n"}<Text style={styles.highlight}>Sihir</Text> Başlıyor</Text>
              <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                Elindeki malzemeleri seç, yapay zeka senin için en lezzetli tarifleri anında hazırlasın.
              </Text>
            </View>
          </Animated.View>

          {/* Adım 1: Seviye Seçimi */}
          <Animated.View style={[styles.stepContainer, step1Style, { position: 'absolute' }]}>
            <View style={styles.levelSelectionContainer}>
              <View style={styles.aiIconLarge}>
                <LinearGradient
                  colors={['#ff7043', '#f4511e']}
                  style={styles.aiIconGradient}
                >
                  <FontAwesome5 name="robot" size={40} color="#fff" />
                </LinearGradient>
              </View>

              <Text style={[styles.levelTitleMain, { color: theme.text }]}>Yapay zeka tarifinizi{"\n"}nasıl anlatsın?</Text>
              <Text style={[styles.levelSubtitleMain, { color: theme.secondaryText }]}>Mutfaktaki tecrübenize göre şefimiz size özel bir dil kullanır.</Text>

              <View style={styles.levelOptions}>
                {[
                  { id: 'beginner', title: 'Yemek Yapmakta Yeniyim', sub: 'Adım adım, çok detaylı ve basit anlatım.', icon: 'child' },
                  { id: 'intermediate', title: 'Biraz Biliyorum', sub: 'Standart detayda, anlaşılır anlatım.', icon: 'user' },
                  { id: 'advanced', title: 'Tecrübeliyim', sub: 'Hızlı, teknik ve profesyonel anlatım.', icon: 'crown' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.levelCard, { backgroundColor: theme.card, borderColor: theme.border }, cookingLevel === item.id && styles.levelCardActive]}
                    onPress={() => setCookingLevel(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.levelIconBox, { backgroundColor: isDarkMode ? '#262626' : '#fff' }, cookingLevel === item.id && styles.levelIconBoxActive]}>
                      <FontAwesome5 name={item.icon} size={18} color={cookingLevel === item.id ? '#fff' : theme.secondaryText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.levelTitle, { color: theme.text }, cookingLevel === item.id && styles.levelTitleActive]}>{item.title}</Text>
                      <Text style={[styles.levelSub, { color: theme.secondaryText }]}>{item.sub}</Text>
                    </View>
                    {cookingLevel === item.id && (
                      <FontAwesome5 name="check-circle" size={20} color="#ff7043" solid />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Button Section */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.mainButton}
            activeOpacity={0.8}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['#ff7043', '#f4511e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>
                {step === 0 ? 'Devam Et' : 'Hadi Başlayalım'}
              </Text>
              <View style={styles.arrowCircle}>
                <FontAwesome5 name="arrow-right" size={14} color="#ff7043" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  stepWrapper: {
    flex: 1,
    width: '100%',
  },
  stepContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  animationContainer: {
    width: width,
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  animation: {
    width: width * 0.85,
    height: width * 0.85,
  },
  textSection: {
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 34,
    fontFamily: 'PoppinsExtraBold',
    textAlign: 'center',
    lineHeight: 42,
  },
  highlight: {
    color: '#ff7043',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  levelSelectionContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  aiIconLarge: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aiIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7043',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  levelTitleMain: {
    fontSize: 28,
    fontFamily: 'PoppinsExtraBold',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
  },
  levelSubtitleMain: {
    fontSize: 15,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  levelOptions: {
    gap: 16,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  levelCardActive: {
    borderColor: '#ff7043',
    shadowColor: '#ff7043',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  levelIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelIconBoxActive: {
    backgroundColor: '#ff7043',
  },
  levelTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
  },
  levelTitleActive: {
    color: '#ff7043',
  },
  levelSub: {
    fontSize: 12,
    fontFamily: 'PoppinsRegular',
    marginTop: 2,
  },
  buttonSection: {
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 60, // Moved up
  },
  mainButton: {
    width: '100%',
    height: 64,
    borderRadius: 22,
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientButton: {
    flex: 1,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PoppinsBold',
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WelcomeScreen;
