import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image,
  Share,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import LottieView from 'lottie-react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { unsplashAPI } from '../config/unsplash';
import { generateAIContent } from '../config/ai';
import { useTheme } from '../context/ThemeContext';


const { width, height } = Dimensions.get('window');

function categorizeError(error) {
  const errStr = ((error && (error.message || error.toString())) || '').toLowerCase();

  if (errStr.includes('api_key') || errStr.includes('api key')) {
    return {
      error: true,
      type: 'key',
      title: 'Servis Yapılandırma Hatası',
      message: 'Yapay zeka servisi için geçerli bir API anahtarı bulunamadı. Lütfen ayarları kontrol edin.',
    };
  }

  if (errStr.includes('429') || errStr.includes('resource_exhausted') || errStr.includes('quota')) {
    return {
      error: true,
      type: 'quota',
      title: 'Günlük İstek Limiti Doldu',
      message: 'Yapay zeka servisinin günlük kullanım kotasına ulaşıldı. Lütfen daha sonra tekrar deneyin.',
    };
  }

  if (
    errStr.includes('network') ||
    errStr.includes('fetch') ||
    errStr.includes('timeout') ||
    errStr.includes('enotfound') ||
    errStr.includes('econnrefused') ||
    errStr.includes('failed to fetch') ||
    errStr.includes('internet')
  ) {
    return {
      error: true,
      type: 'network',
      title: 'İnternet Bağlantısı Yok',
      message: 'Yapay zeka servisine bağlanılamadı. İnternet bağlantınızı kontrol edip lütfen tekrar deneyin.',
    };
  }

  return {
    error: true,
    type: 'general',
    title: 'Bir Sorun Oluştu',
    message: 'Tarif hazırlanırken beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.',
  };
}

async function geminiRecipe(malzemeler, mealType, servingSize = 2, category = 'meal') {

  // Kullanıcı tecrübe seviyesine göre prompt eklemesi
  let experiencePrompt = "";
  try {
    const savedLevel = await AsyncStorage.getItem('chef_cooking_level');
    if (savedLevel === 'beginner') {
      experiencePrompt = "\nÖNEMLİ: Kullanıcı yemek yapmakta YENİ. Lütfen tarif adımlarını çok detaylı, temel mutfak terimlerini açıklayarak ve çok basit bir dille yaz. Açıklayacağın her temel mutfak terimini MUTLAKA '**Temel Mutfak Terimi: cümle**' formatında yaz.";
    } else if (savedLevel === 'intermediate') {
      experiencePrompt = "\nÖNEMLİ: Kullanıcı mutfakta orta seviyede bilgi sahibi. Standart, anlaşılır ve pratik bir dil kullan.";
    } else if (savedLevel === 'advanced') {
      experiencePrompt = "\nÖNEMLİ: Kullanıcı mutfakta çok TECRÜBELİ. Teknik terimler kullanabilirsin, anlatımı hızlı ve profesyonel/gurme düzeyinde tut.";
    }
  } catch (e) {
    console.log('Tecrübe seviyesi okunamadı:', e);
  }

  let mealTypeText = '';
  if (mealType) {
    if (mealType === 'kolay') mealTypeText = '\nTarif yapımı kolay tarzda olsun.';
    else if (mealType === 'hafif') mealTypeText = '\nTarif hafif ve sağlıklı olsun.';
    else if (mealType === 'misafir') mealTypeText = '\nTarif misafirlik sofralarına uygun, gösterişli olsun.';
    else if (mealType === 'pratik') mealTypeText = '\nTarif pratik ve hızlı hazırlanabilir olsun.';
    else if (mealType === 'favori') mealTypeText = '\nTarif herkesin favorisi olabilecek şekilde olsun.';
  }

  let categoryText = '';
  if (category === 'dessert') {
    categoryText = `\nÖNEMLİ: Kullanıcı özellikle bir TATLI tarifi istiyor. Bu malzemelerle yapılabilecek harika bir tatlı öner. Eğer malzemeler tuzluysa bile yaratıcı bir tatlı fikri bul.`;
  } else {
    categoryText = `\nBu bir yemek tarifi olsun (Tatlı değil).`;
  }

  // 3. ÖNERİ: Dinamik "Tarz" Kelimeleri Ekle
  const creativeThemes = ['Yaratıcı', 'Geleneksel', 'Modern', 'Acılı', 'Farklı', 'Egzotik', 'Pratik', 'Yöresel', 'Gurme', 'Sokak Lezzeti', 'Rustik', 'Cezbedici', 'Anne Eli Değmiş Gibi', 'Restoran Usulü'];
  const randomTheme = creativeThemes[Math.floor(Math.random() * creativeThemes.length)];

  const prompt = `Elimde şu malzemeler var: ${malzemeler.join(', ')}. Bu malzemelerle yapılabilecek, ${servingSize} kişilik lezzetli bir tarif öner. ${categoryText} ${experiencePrompt}
SADECE aşağıdaki formatta tarifi ver. Başka HİÇBİR giriş cümlesi, açıklama veya "İşte tarifiniz" gibi ifadeler KULLANMA. Sadece formatı doldur:

**Yemek Adı:** [Yemek adını yaz]

**Resim Arama Kelimeleri:** [Bu yemek için en uygun resim arama kelimelerini İngilizce olarak yaz. Örnek: "pasta carbonara", "italian pasta dish", "creamy pasta" gibi. Sadece 2-3 kelime olsun.]

**Hazırlama Süresi:** [Örn: 30 dk]
**Zorluk Seviyesi:** [Örn: Kolay, Orta, Zor]
**Kalori:** [Örn: 450 kcal]
**Porsiyon:** [Örn: ${servingSize} Kişilik]

**Malzemeler:**
- [malzeme listesi] (Malzeme miktarlarını ${servingSize} kişi için ayarla)

**Hazırlanışı:**
1. [adım 1] [Şefin Tavsiyesi: Varsa püf noktası]
2. [adım 2]
...

**İpuçları:**
- [faydalı ipuçları]

${mealTypeText}

Lütfen en yaygın bilinen tarifi DEĞİL, bu malzemelerle yapılabilecek **${randomTheme}** tarzda, farklı veya yaratıcı bir tarif öner.
Eğer tarif yoksa sadece "Tarif bulunamadı." yaz.
(Rastgele varyasyon kodu: ${Math.random()})`;

  try {
    console.log("SDK ile İstek Gönderiliyor...");

    const text = await generateAIContent(prompt, {
      temperature: 1.3,
      topP: 0.95,
      topK: 40,
    });

    if (!text || text.trim() === '' || text.includes("Tarif bulunamadı")) {
      return {
        error: true,
        type: 'not_found',
        title: 'Uygun Tarif Bulunamadı',
        message: 'Seçtiğiniz malzemelerle uygun bir tarif üretilemedi. Farklı veya daha fazla malzeme ekleyerek tekrar deneyebilirsiniz.',
      };
    }

    return {
      title: 'AI Tarif Önerisi',
      description: text,
    };

  } catch (error) {
    console.error("SDK HATASI:", error);
    return categorizeError(error);
  }
}

async function geminiRandomRecipe(mealTime, style, servingSize = 2) {

  let mealTimeText = '';
  if (mealTime) {
    if (mealTime === 'kahvalti') mealTimeText = 'kahvaltı için ';
    else if (mealTime === 'ogle') mealTimeText = 'öğle yemeği için ';
    else if (mealTime === 'aksam') mealTimeText = 'akşam yemeği için ';
    else if (mealTime === 'gece') mealTimeText = 'gece atıştırmalığı olarak ';
    else if (mealTime === 'ara') mealTimeText = 'ara öğün olarak ';
  }

  let styleText = '';
  if (style) {
    if (style === 'kolay') styleText = 'yapımı kolay ';
    else if (style === 'misafir') styleText = 'misafirlik sofralarına uygun, gösterişli ';
    else if (style === 'pratik') styleText = 'pratik ve hızlı hazırlanabilir ';
    else if (style === 'agir') styleText = 'ağır ve doyurucu ';
  }

  // Kullanıcı tecrübe seviyesine göre prompt eklemesi
  let experiencePrompt = "";
  try {
    const savedLevel = await AsyncStorage.getItem('chef_cooking_level');
    if (savedLevel === 'beginner') {
      experiencePrompt = "\nÖNEMLİ: Kullanıcı yemek yapmakta YENİ. Lütfen tarif adımlarını çok detaylı, temel mutfak terimlerini açıklayarak ve çok basit bir dille yaz. Açıklayacağın her temel mutfak terimini MUTLAKA '**Temel Mutfak Terimi: cümle**' formatında yaz.";
    } else if (savedLevel === 'intermediate') {
      experiencePrompt = "\nÖNEMLİ: Kullanıcı mutfakta orta seviyede bilgi sahibi. Standart, anlaşılır ve pratik bir dil kullan.";
    } else if (savedLevel === 'advanced') {
      experiencePrompt = "\nÖNEMLİ: Kullanıcı mutfakta çok TECRÜBELİ. Teknik terimler kullanabilirsin, anlatımı hızlı ve profesyonel/gurme düzeyinde tut.";
    }
  } catch (e) {
    console.log('Tecrübe seviyesi okunamadı:', e);
  }

  const prompt = `${mealTimeText}${styleText}${servingSize} kişilik lezzetli bir yemek tarifi öner. ${experiencePrompt}
SADECE aşağıdaki formatta tarifi ver.Başka HİÇBİR giriş cümlesi, açıklama veya "İşte tarifiniz" gibi ifadeler KULLANMA.Sadece formatı doldur:

**Yemek Adı:** [Yemek adını yaz]

**Resim Arama Kelimeleri:** [Bu yemek için en uygun resim arama kelimelerini İngilizce olarak yaz. Örnek: "pasta carbonara", "italian pasta dish", "creamy pasta" gibi. Sadece 2-3 kelime olsun.]

**Hazırlama Süresi:** [Örn: 30 dk]
**Zorluk Seviyesi:** [Örn: Kolay, Orta, Zor]
**Kalori:** [Örn: 450 kcal]
**Porsiyon:** [Örn: ${servingSize} Kişilik]

**Malzemeler:**
- [malzeme listesi] (Malzeme miktarlarını ${servingSize} kişi için ayarla)

**Hazırlanışı:**
1.[adım 1][Şefin Tavsiyesi: Varsa püf noktası]
2.[adım 2]
...
(ÖNEMLİ: Eğer adımda önemli bir püf noktası varsa, sonuna [Şefin Tavsiyesi: Tavsiye] ekle.Her adımda değil.)

**İpuçları:**
-[faydalı ipuçları]

Eğer tarif yoksa sadece "Tarif bulunamadı." yaz.
Lütfen sıradan tarifler yerine, daha yaratıcı ve farklı bir seçenek sun.
(Rastgele varyasyon kodu: ${Math.random()})`;

  try {
    console.log("SDK ile Rastgele Tarif İsteği Gönderiliyor...");

    const text = await generateAIContent(prompt, {
      temperature: 1.3,
      topP: 0.95,
      topK: 40,
    });

    if (!text || text.trim() === '' || text.includes("Tarif bulunamadı")) {
      return {
        error: true,
        type: 'not_found',
        title: 'Uygun Tarif Bulunamadı',
        message: 'Rastgele tarif hazırlanırken uygun bir sonuç bulunamadı. Lütfen tekrar deneyin.',
      };
    }

    return {
      title: 'AI Tarif Önerisi',
      description: text,
    };

  } catch (error) {
    console.error("SDK HATASI (Random):", error);
    return categorizeError(error);
  }
}

function AnimatedDots() {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDots = () => {
      const animations = [dot1, dot2, dot3].map((dot, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        )
      );

      Animated.parallel(animations).start();
    };

    animateDots();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      {[dot1, dot2, dot3].map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: dot,
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function getMealTypeText(mealType) {
  if (!mealType) return '';
  if (mealType === 'kolay') return 'Tarif yapımı kolay tarzda olsun.';
  if (mealType === 'hafif') return 'Tarif hafif ve sağlıklı olsun.';
  if (mealType === 'misafir') return 'Tarif misafirlik sofralarına uygun, gösterişli olsun.';
  if (mealType === 'pratik') return 'Tarif pratik ve hızlı hazırlanabilir olsun.';
  if (mealType === 'favori') return 'Tarif herkesin favorisi olabilecek şekilde olsun.';
  return '';
}

function LoadingAnimation({ malzemeler, mealTypeText, isRandom, mealTime, style }) {
  const { isDarkMode, theme } = useTheme();
  const [progress] = useState(new Animated.Value(0));
  const [percent, setPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    "Malzemeler inceleniyor...",
    "Şef önlüğünü giyiyor...",
    "Lezzet haritası çıkarılıyor...",
    "En iyi tarif aranıyor...",
    "Püf noktalar ekleniyor...",
    "Sunum tabağı hazırlanıyor..."
  ];

  useEffect(() => {
    // 1. Progress Bar Animation
    Animated.timing(progress, {
      toValue: 95,
      duration: 8000,
      useNativeDriver: false,
    }).start();

    // 3. Update percentage text
    const listener = progress.addListener(({ value }) => {
      setPercent(Math.floor(value));
    });

    // 4. Cycle through steps
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2500);

    return () => {
      progress.removeListener(listener);
      clearInterval(stepInterval);
    };
  }, []);

  const widthInterpolate = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const getRandomRecipeText = () => {
    let timeText = '';
    let styleText = '';

    if (mealTime) {
      if (mealTime === 'kahvalti') timeText = 'kahvaltı';
      else if (mealTime === 'ogle') timeText = 'öğle yemeği';
      else if (mealTime === 'aksam') timeText = 'akşam yemeği';
      else if (mealTime === 'gece') timeText = 'gece atıştırmalığı';
      else if (mealTime === 'ara') timeText = 'ara öğün';
    }

    if (style) {
      if (style === 'kolay') styleText = 'yapımı kolay';
      else if (style === 'misafir') styleText = 'misafirlik';
      else if (style === 'pratik') styleText = 'pratik';
      else if (style === 'agir') styleText = 'ağır';
    }

    if (timeText && styleText) return `${timeText} için ${styleText} tarif`;
    if (timeText) return `${timeText} tarifi`;
    if (styleText) return `${styleText} tarif`;
    return 'rastgele tarif';
  };

  return (
    <View style={[styles.loadingContainer, { flex: 1, paddingVertical: 36, backgroundColor: theme.background }]}>

      {/* 1. Üst Kısım: Animasyon ve Başlık */}
      <View style={{ alignItems: 'center', marginTop: -10, marginBottom: 24 }}>
        <LottieView
          autoPlay
          loop
          style={{
            width: 240,
            height: 240,
            marginBottom: -8,
          }}
          source={require('../animations/Cooking.json')}
        />
        <Text style={[styles.loadingTitle, { color: theme.text }]}>Tarif Hazırlanıyor...</Text>
        <Text style={{ textAlign: 'center', color: theme.secondaryText, fontFamily: 'PoppinsRegular', fontSize: 14, marginTop: 4, maxWidth: 260 }}>
          Yapay zeka şefimiz sizin için özel bir tarif oluşturuyor.
        </Text>
      </View>

      {/* 2. İlerleme Kutusu */}
      <View style={{
        width: '100%',
        backgroundColor: theme.card,
        padding: 18,
        borderRadius: 20,
        marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, color: theme.secondaryText, fontFamily: 'PoppinsMedium', flex: 1 }}>
            {loadingSteps[currentStep]}
          </Text>
          <Text style={{ fontSize: 18, color: '#ff7043', fontFamily: 'PoppinsExtraBold' }}>
            %{percent}
          </Text>
        </View>

        <View style={{ width: '100%', height: 10, backgroundColor: isDarkMode ? '#2a2a2a' : '#e5e5e5', borderRadius: 5, overflow: 'hidden' }}>
          <Animated.View
            style={{
              height: '100%',
              backgroundColor: '#ff7043',
              width: widthInterpolate,
              borderRadius: 5
            }}
          />
        </View>
      </View>

      {/* 3. Malzemeler Kartı */}
      <View style={{ width: '100%', flex: 1 }}>
        {isRandom ? (
          <View style={{
            width: '100%',
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 24,
            alignItems: 'center',
          }}>
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 112, 67, 0.14)',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
            }}>
              <FontAwesome5 name="dice" size={28} color="#ff7043" />
            </View>
            <Text style={[styles.loadingHighlightText, { color: theme.text }]}>{getRandomRecipeText().toUpperCase()}</Text>
            <Text style={{ color: theme.secondaryText, fontFamily: 'PoppinsRegular', fontSize: 13, textAlign: 'center' }}>
              Sizin için en uygun lezzeti seçiyoruz...
            </Text>
          </View>
        ) : (
          <View style={{
            width: '100%',
            backgroundColor: theme.card,
            borderRadius: 20,
            padding: 18,
            maxHeight: 230,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  backgroundColor: 'rgba(255, 112, 67, 0.14)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}>
                  <FontAwesome5 name="shopping-basket" size={13} color="#ff7043" />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'PoppinsBold', color: theme.text }}>
                  Seçilen Malzemeler
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255, 112, 67, 0.14)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 10,
              }}>
                <Text style={{ fontSize: 12, fontFamily: 'PoppinsBold', color: '#ff7043' }}>
                  {malzemeler?.length || 0} Malzeme
                </Text>
              </View>
            </View>

            <ScrollView
              style={{ width: '100%' }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}
            >
              {malzemeler && malzemeler.map((malzeme, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDarkMode ? '#262626' : '#ffffff',
                    paddingHorizontal: 13,
                    paddingVertical: 9,
                    borderRadius: 13,
                  }}
                >
                  <View style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: 'rgba(255, 112, 67, 0.15)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 8,
                  }}>
                    <FontAwesome5 name="check" size={9} color="#ff7043" />
                  </View>
                  <Text style={{ color: theme.text, fontSize: 14, fontFamily: 'PoppinsSemiBold' }}>{malzeme}</Text>
                </View>
              ))}
            </ScrollView>

            {mealTypeText ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDarkMode ? '#262626' : '#ffffff',
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                marginTop: 12,
              }}>
                <FontAwesome5 name="sliders-h" size={12} color="#ff7043" style={{ marginRight: 8 }} />
                <Text style={{ color: theme.secondaryText, fontFamily: 'PoppinsMedium', fontSize: 12, flex: 1 }}>
                  {mealTypeText}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* 4. Footer ve Tahmini Süre (En Altta) */}
      <View style={{ alignItems: 'center', width: '100%', marginTop: 'auto', marginBottom: 16 }}>
        <View style={[styles.timeBadge, { marginBottom: 12, backgroundColor: theme.card, borderWidth: 0, paddingHorizontal: 22, paddingVertical: 11 }]}>
          <FontAwesome5 name="hourglass-half" size={13} color={theme.secondaryText} />
          <Text style={[styles.timeText, { fontSize: 13, color: theme.secondaryText }]}>Bu işlem yaklaşık 10 saniye sürer</Text>
        </View>
        <Text style={[styles.aiFooterText, { color: theme.secondaryText, fontFamily: 'PoppinsRegular', opacity: 0.7, marginBottom: 4 }]}>Gemini AI ile güçlendirilmiştir</Text>
      </View>

    </View>
  );
}

function parseInlineBold(text, baseStyle) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <Text style={baseStyle}>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <Text key={index} style={{ fontFamily: 'PoppinsBold' }}>
              {part.substring(2, part.length - 2)}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

function renderFormattedText(text, theme, isDarkMode) {
  const lines = text.split('\n');
  let skipUntilNextSection = false;
  let bulletCounter = 0;

  return lines.map((line, lineIndex) => {
    if (line.trim() === '') {
      return <View key={lineIndex} style={{ height: 8 }} />;
    }

    // **başlık** formatını yakala
    if (/^\*\*[^*]+\*\*/.test(line.trim())) {
      const title = line.replace(/\*\*/g, '').trim();

      // Resim Arama Kelimeleri bölümünü atla
      if (
        title.toLowerCase().includes('resim arama kelimeleri') ||
        title.toLowerCase().includes('yemek adı') ||
        title.toLowerCase().includes('hazırlama süresi') ||
        title.toLowerCase().includes('zorluk seviyesi') ||
        title.toLowerCase().includes('kalori') ||
        title.toLowerCase().includes('porsiyon')
      ) {
        skipUntilNextSection = true;
        return null;
      }

      // Yeni bir bölüm başladığında skip modunu kapat
      if (skipUntilNextSection) {
        skipUntilNextSection = false;
      }

      bulletCounter = 0; // Yeni bölüm için sayacı sıfırla
      return (
        <View key={lineIndex} style={styles.sectionHeader}>
          <FontAwesome5
            name={getSectionIcon(title)}
            size={18}
            color="#ff7043"
            style={styles.sectionIcon}
          />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        </View>
      );
    }

    // Eğer skip modundaysak bu satırı atla
    if (skipUntilNextSection) {
      return null;
    }

    // Numaralı liste öğeleri
    // Numaralı liste öğeleri
    if (/^\d+\./.test(line.trim())) {
      let hasNext = false;
      for (let i = lineIndex + 1; i < lines.length; i++) {
        const l = lines[i].trim();
        if (l === '') continue;
        if (/^\d+\./.test(l)) { hasNext = true; break; }
        if (l.startsWith('**') || /^-/.test(l)) break;
      }

      return (
        <View key={lineIndex} style={styles.stepContainer}>
          <View style={styles.stepLeftColumn}>
            {hasNext && <View style={[styles.stepLine, { backgroundColor: isDarkMode ? '#ff704340' : '#ffcc80' }]} />}
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>
                {line.trim().match(/^\d+/)[0]}
              </Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            {(() => {
              const stepBody = line.replace(/^\d+\.\s*/, '');
              let tip = null;
              let stepTextRaw = stepBody;

              const markerRegex = /(\[|\*\*)?\s*Şefin Tavsiyesi:/i;
              const match = stepBody.match(markerRegex);
              if (match) {
                const markerIndex = match.index;
                stepTextRaw = stepBody.substring(0, markerIndex).trim();
                const rawTip = stepBody.substring(markerIndex);
                tip = rawTip
                  .replace(/^(\[|\*\*)?\s*Şefin Tavsiyesi:?\s*(\*\*)?\s*/i, '')
                  .replace(/(\]|\*\*)\s*$/, '')
                  .trim();
              }

              // Daha kapsamlı regex: Parantezli veya yıldızlı kullanımları yakalar
              const termRegex = /(\(?\*\*Temel Mutfak Terimi:?\s*(.*?)\*\*\)?|\(Temel Mutfak Terimi:?\s*(.*?)\)|Temel Mutfak Terimi:?\s*(.*))/i;
              const termMatch = stepTextRaw.match(termRegex);

              let cleanText = stepTextRaw;
              let termContent = null;

              if (termMatch) {
                cleanText = stepTextRaw.replace(termMatch[0], '').trim();
                // Regex gruplarından dolu olanı al
                termContent = termMatch[2] || termMatch[3] || termMatch[4];

                // Eğer temiz metin sonunda ( kaldıysa temizle (bazı durumlarda regex dışında kalabiliyor)
                if (cleanText.endsWith('(')) cleanText = cleanText.slice(0, -1).trim();
              }

              return (
                <View>
                  {cleanText.length > 0 && parseInlineBold(cleanText, [styles.stepText, { color: theme.text }])}
                  {termContent && (
                    <View style={[styles.termBox, { backgroundColor: isDarkMode ? '#0ea5e915' : '#f0f9ff', borderColor: isDarkMode ? '#0ea5e940' : '#bae6fd' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <FontAwesome5 name="info-circle" size={12} color="#0ea5e9" style={{ marginRight: 6 }} />
                        <Text style={[styles.termTitle, { color: isDarkMode ? '#38bdf8' : '#0369a1' }]}>Mutfak Sözlüğü</Text>
                      </View>
                      <Text style={[styles.termText, { color: isDarkMode ? '#7dd3fc' : '#075985' }]}>{termContent}</Text>
                    </View>
                  )}
                  {tip && (
                    <View style={[styles.chefTipContainer, { backgroundColor: isDarkMode ? '#f59e0b15' : '#fff7ed' }]}>
                      <View style={styles.chefTipHeader}>
                        <MaterialCommunityIcons name="chef-hat" size={14} color="#f59e0b" style={{ marginRight: 8 }} />
                        <Text style={[styles.chefTipTitle, { color: isDarkMode ? '#fbbf24' : '#9a3412' }]}>Şefin Notu</Text>
                      </View>
                      <Text style={[styles.chefTipText, { color: isDarkMode ? '#fcd34d' : '#9a3412' }]}>
                        {tip}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
      );
    }

    // Tire ile başlayan liste öğeleri
    if (/^-/.test(line.trim())) {
      return (
        <View key={lineIndex} style={[styles.ingredientRow, { backgroundColor: isDarkMode ? theme.card : '#ffffff', borderBottomColor: theme.border }]}>
          <View style={styles.ingredientIconContainer}>
            <FontAwesome5 name="check" size={10} color="#ff7043" />
          </View>
          {parseInlineBold(line.replace(/^-\s*/, ''), [styles.ingredientText, { color: theme.text }])}
        </View>
      );
    }

    // Normal metin
    return (
      <View key={lineIndex}>
        {(() => {
          const termRegex = /(\(?\*\*Temel Mutfak Terimi:?\s*(.*?)\*\*\)?|\(Temel Mutfak Terimi:?\s*(.*?)\)|Temel Mutfak Terimi:?\s*(.*))/i;
          const termMatch = line.match(termRegex);

          if (termMatch) {
            let cleanText = line.replace(termMatch[0], '').trim();
            const termContent = termMatch[2] || termMatch[3] || termMatch[4];

            if (cleanText.endsWith('(')) cleanText = cleanText.slice(0, -1).trim();

            return (
              <View>
                {cleanText.length > 0 && parseInlineBold(cleanText, [styles.normalText, { color: theme.text }])}
                <View style={[styles.termBox, { backgroundColor: isDarkMode ? '#0ea5e915' : '#f0f9ff', borderColor: isDarkMode ? '#0ea5e940' : '#bae6fd' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <FontAwesome5 name="info-circle" size={12} color="#0ea5e9" style={{ marginRight: 6 }} />
                    <Text style={[styles.termTitle, { color: isDarkMode ? '#38bdf8' : '#0369a1' }]}>Mutfak Sözlüğü</Text>
                  </View>
                  <Text style={[styles.termText, { color: isDarkMode ? '#7dd3fc' : '#075985' }]}>{termContent}</Text>
                </View>
              </View>
            );
          }
          return parseInlineBold(line, [styles.normalText, { color: theme.text }]);
        })()}
      </View>
    );
  });
}

function getSectionIcon(title) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('malzeme')) return 'list-ul';
  if (titleLower.includes('hazırlan') || titleLower.includes('yapılış')) return 'utensils';
  if (titleLower.includes('ipuç') || titleLower.includes('öneri')) return 'lightbulb';
  if (titleLower.includes('yemek') || titleLower.includes('tarif')) return 'cookie-bite';
  return 'star';
}

// Tarif adını çıkaran fonksiyon
function extractRecipeName(description) {
  const match = description.match(/\*\*\s*Yemek Adı:\*\*\s*(.*)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return 'Yemek Tarifi';
}

// Süre, Zorluk ve Kalori bilgilerini çıkaran fonksiyon
function extractMetadata(description, fallbackServingSize) {
  const timeMatch = description.match(/\*\*\s*Hazırlama Süresi\s*:\s*\*\*\s*(.*)/i) ||
    description.match(/\*\*\s*Hazırlama Süresi\s*:\s*(.*)/i);
  const difficultyMatch = description.match(/\*\*\s*Zorluk Seviyesi\s*:\s*\*\*\s*(.*)/i) ||
    description.match(/\*\*\s*Zorluk Seviyesi\s*:\s*(.*)/i);
  const calorieMatch = description.match(/\*\*\s*Kalori\s*:\s*\*\*\s*(.*)/i) ||
    description.match(/\*\*\s*Kalori\s*:\s*(.*)/i);
  const portionMatch = description.match(/\*\*\s*Porsiyon\s*:\s*\*\*\s*(.*)/i) ||
    description.match(/\*\*\s*Porsiyon\s*:\s*(.*)/i);

  let portionVal = portionMatch ? portionMatch[1].trim().replace(/\*\*/g, '') : null;
  if (!portionVal && fallbackServingSize) {
    portionVal = `${fallbackServingSize} Kişilik`;
  }

  return {
    time: timeMatch ? timeMatch[1].trim().replace(/\*\*/g, '') : '30-45 dk',
    difficulty: difficultyMatch ? difficultyMatch[1].trim().replace(/\*\*/g, '') : 'Orta',
    calories: calorieMatch ? calorieMatch[1].trim().replace(/\*\*/g, '') : '400 kcal',
    portion: portionVal || '2 Kişilik'
  };
}

// Resim arama kelimelerini çıkaran fonksiyon
function extractImageSearchTerms(description) {
  const match = description.match(/\*\*\s*Resim Arama Kelimeleri\s*:\s*\*\*\s*(.*)/i) ||
    description.match(/\*\*\s*Resim Arama Kelimeleri\s*:\s*(.*)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  // Eğer arama kelimeleri yoksa, tarif adını kullan
  const recipeName = extractRecipeName(description);
  return recipeName + ' food';
}

const RecipeDetail = ({ route, navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const { malzemeler = [], mealType, mealTime, style, isRandom, servingSize = 2, category } = route.params;
  const [loading, setLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState(null);
  const [tarif, setTarif] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);
  const [photographer, setPhotographer] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isToastActive, setIsToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('Tarif Başarıyla Kaydedildi!');
  const [isSaved, setIsSaved] = useState(false);
  const toastFadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [300, 400],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const stickyOpacity = scrollY.interpolate({
    inputRange: [350, 400],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    generateRecipe();
    checkIfSaved();
    return () => {
      Speech.stop();
    };
  }, []);

  const checkIfSaved = async () => {
    try {
      const saved = await AsyncStorage.getItem('saved_recipes');
      if (saved) {
        const recipes = JSON.parse(saved);
        const exists = recipes.some(r => r.yemekAdi === extractRecipeName(tarif?.description || ''));
        setIsSaved(exists);
      }
    } catch (e) {
      console.log('Check saved error:', e);
    }
  };

  const generateRecipe = async () => {
    setLoading(true);
    setErrorInfo(null);
    try {
      let result;
      if (isRandom) {
        result = await geminiRandomRecipe(mealTime, style, servingSize);
      } else {
        result = await geminiRecipe(malzemeler, mealType, servingSize, category);
      }

      if (result && result.error) {
        setErrorInfo(result);
        setTarif(null);
      } else if (result && result.description) {
        setTarif(result);
        setErrorInfo(null);
        const searchTerms = extractImageSearchTerms(result.description);
        loadRecipeImage(searchTerms);

        // Check if saved again with new tarif
        const saved = await AsyncStorage.getItem('saved_recipes');
        if (saved) {
          const recipes = JSON.parse(saved);
          const exists = recipes.some(r => r.yemekAdi === extractRecipeName(result.description));
          setIsSaved(exists);
        }
      } else {
        setErrorInfo({
          error: true,
          type: 'general',
          title: 'Bir Sorun Oluştu',
          message: 'Tarif hazırlanırken beklenmedik bir hata meydana geldi. Lütfen tekrar deneyin.',
        });
        setTarif(null);
      }
    } catch (error) {
      console.error('Tarif üretme hatası:', error);
      setErrorInfo(categorizeError(error));
      setTarif(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRecipeImage = async (terms) => {
    setImageLoading(true);
    try {
      const result = await unsplashAPI.searchRecipeImage(terms);
      if (result) {
        setRecipeImage(result.url);
        setPhotographer(result.photographer);
      } else {
        setRecipeImage(null);
        setPhotographer(null);
      }
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
    } finally {
      setImageLoading(false);
    }
  };

  const shareRecipe = async () => {
    if (!tarif) return;
    try {
      await Share.share({
        message: `${extractRecipeName(tarif.description)}\n\n${tarif.description}`,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error);
    }
  };

  const toggleSaveRecipe = async () => {
    if (!tarif) return;
    try {
      const saved = await AsyncStorage.getItem('saved_recipes');
      let recipes = saved ? JSON.parse(saved) : [];
      const recipeName = extractRecipeName(tarif.description);

      if (isSaved) {
        recipes = recipes.filter(r => r.yemekAdi !== recipeName);
        setToastMessage('Tarif Silindi');
        setIsSaved(false);
      } else {
        recipes.push({
          yemekAdi: recipeName,
          description: tarif.description,
          malzemeler: malzemeler,
          tarih: new Date().toISOString(),
          image: recipeImage
        });
        setToastMessage('Tarif Kaydedildi');
        setIsSaved(true);
      }

      await AsyncStorage.setItem('saved_recipes', JSON.stringify(recipes));
      showToast();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
    }
  };

  const showToast = () => {
    setIsToastActive(true);
    Animated.sequence([
      Animated.timing(toastFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setIsToastActive(false));
  };

  const speakRecipe = () => {
    if (!tarif) return;
    setIsSpeaking(true);
    const speechText = tarif.description.replace(/\*\*/g, '');
    Speech.speak(speechText, {
      language: 'tr-TR',
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleStartRecipe = () => {
    if (!tarif) return;
    const lines = tarif.description.split('\n');
    let steps = [];
    let tips = [];
    let currentSection = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**')) {
        const title = trimmed.toLowerCase();
        if (title.includes('hazırlan') || title.includes('yapılış')) currentSection = 'steps';
        else if (title.includes('ipuç') || title.includes('öneri')) currentSection = 'tips';
        else currentSection = '';
        return;
      }

      if (currentSection === 'steps' && /^\d+\./.test(trimmed)) {
        steps.push(trimmed.replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'tips' && /^-/.test(trimmed)) {
        tips.push(trimmed.replace(/^-\s*/, ''));
      }
    });

    if (steps.length === 0) {
      Alert.alert('Bilgi', 'Tarif adımları henüz ayrıştırılamadı. Lütfen metin üzerinden takip edin.');
      return;
    }

    navigation.navigate('StartRecipe', {
      steps,
      tips,
      recipeName: extractRecipeName(tarif.description),
      recipeImage,
      malzemeler,
      description: tarif.description,
      isRandom
    });
  };

  const Toast = () => (
    <Animated.View style={[styles.toastContainer, { opacity: toastFadeAnim, pointerEvents: isToastActive ? 'auto' : 'none' }]}>
      <LinearGradient
        colors={['#ff7043', '#f4511e']}
        style={styles.toastGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.toastIconContainer}>
          <FontAwesome5 name={isSaved ? "check" : "trash-alt"} size={14} color="#ff7043" />
        </View>
        <Text style={styles.toastText}>{toastMessage}</Text>
      </LinearGradient>
    </Animated.View>
  );

  if (loading) {
    return <LoadingAnimation malzemeler={malzemeler} mealTypeText={getMealTypeText(mealType)} isRandom={isRandom} mealTime={mealTime} style={style} />;
  }

  if (errorInfo && !loading) {
    const isNetwork = errorInfo.type === 'network';
    const isQuota = errorInfo.type === 'quota';
    const isKey = errorInfo.type === 'key';
    const isNotFound = errorInfo.type === 'not_found';
    const iconName = isNetwork ? 'wifi' : (isQuota ? 'hourglass-end' : (isKey ? 'key' : (isNotFound ? 'utensils' : 'exclamation-circle')));

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorHeader}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#f5f5f5', borderWidth: 0 }]}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.errorContainer}>
          <View style={[styles.errorCard, { backgroundColor: isDarkMode ? theme.card : '#ffffff' }]}>
            <View style={[styles.errorIconBubble, { backgroundColor: isDarkMode ? 'rgba(255, 112, 67, 0.15)' : '#fff3e0' }]}>
              <FontAwesome5 name={iconName} size={34} color="#ff7043" />
            </View>

            <Text style={[styles.errorTitle, { color: theme.text }]}>
              {errorInfo.title || 'Tarif Hazırlanamadı'}
            </Text>

            <Text style={[styles.errorMessage, { color: theme.secondaryText }]}>
              {errorInfo.message || 'Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={generateRecipe}
              activeOpacity={0.85}
            >
              <FontAwesome5 name="redo-alt" size={14} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryErrorButton, { backgroundColor: isDarkMode ? '#262626' : '#f5f5f5' }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="arrow-left" size={12} color={theme.text} style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryErrorButtonText, { color: theme.text }]}>
                {isRandom ? 'Ana Sayfaya Dön' : 'Malzemeleri Düzenle'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!tarif) return null;

  const recipeName = extractRecipeName(tarif.description);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={[styles.stickyHeader, { backgroundColor: theme.background, borderBottomColor: theme.border, opacity: stickyOpacity }]}>
        <View style={styles.stickyHeaderContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.stickyBackButton}>
            <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.stickyHeaderTitle, { color: theme.text }]} numberOfLines={1}>{recipeName}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={shareRecipe} style={styles.stickyBackButton}>
              <Octicons name="share" size={18} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleSaveRecipe} style={styles.stickyBackButton}>
              <FontAwesome5 name="bookmark" size={18} color={isSaved ? "#ff7043" : theme.text} solid={isSaved} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Resim Alanı veya Resim Yoksa Alternatif Header */}
        {(imageLoading || recipeImage) ? (
          <View style={styles.imageContainer}>
            {recipeImage ? (
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: recipeImage }} style={styles.recipeImage} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageCredit}>
                    Fotoğraf: {photographer ? `${photographer} | ` : ''}Unsplash
                  </Text>
                  <Text style={styles.imageCaption}>
                    Fotoğraf temsilidir
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.recipeImage, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', justifyContent: 'center', alignItems: 'center' }]}>
                {imageLoading && <ActivityIndicator color="#ff7043" size="large" />}
              </View>
            )}
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.topGradient} />
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                <FontAwesome5 name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={styles.iconButton} onPress={shareRecipe}>
                  <Octicons name="share" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton} onPress={toggleSaveRecipe}>
                  <FontAwesome5 name="bookmark" size={18} color={isSaved ? "#ff7043" : "#fff"} solid={isSaved} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Resim Yoksa Gözükecek Basit Header */
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, marginBottom: 10 }}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderColor: theme.border, borderWidth: 0 }]}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderColor: theme.border, borderWidth: 0 }]}
                onPress={shareRecipe}
              >
                <Octicons name="share" size={18} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderColor: theme.border, borderWidth: 0 }]}
                onPress={toggleSaveRecipe}
              >
                <FontAwesome5 name="bookmark" size={18} color={isSaved ? "#ff7043" : theme.text} solid={isSaved} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recipeName, { color: theme.text }]}>{recipeName}</Text>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 24 }}>
                <TouchableOpacity
                  style={[styles.voiceButton, isSpeaking && styles.voiceButtonActive]}
                  onPress={isSpeaking ? stopSpeaking : speakRecipe}
                >
                  <FontAwesome5 name={isSpeaking ? "stop" : "volume-up"} size={14} color="#fff" />
                  <Text style={styles.voiceButtonText}>{isSpeaking ? "Durdur" : "Sesli Oku"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voiceButton, { backgroundColor: isDarkMode ? theme.card : 'rgba(255,112,67,0.08)', borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}
                  onPress={generateRecipe}
                >
                  <FontAwesome5 name="redo" size={14} color="#ff7043" />
                  <Text style={[styles.voiceButtonText, { color: theme.text }]}>Tarifi Yenile</Text>
                </TouchableOpacity>
              </View>

              {/* Meta Bilgileri Kutuları (SavedRecipeDetail.js stili) */}
              <View style={styles.metaContainer}>
                {(() => {
                  const meta = extractMetadata(tarif.description, servingSize);
                  return (
                    <View style={styles.metaRow}>
                      <View style={[styles.metaBox, { backgroundColor: isDarkMode ? theme.card : '#f5f5f5', borderColor: isDarkMode ? theme.border : '#e5e5e5' }]}>
                        <FontAwesome5 name="clock" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                        <Text style={[styles.metaLabel, { color: theme.secondaryText }]}>Süre</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>{meta.time}</Text>
                      </View>
                      <View style={[styles.metaBox, { backgroundColor: isDarkMode ? theme.card : '#f5f5f5', borderColor: isDarkMode ? theme.border : '#e5e5e5' }]}>
                        <FontAwesome5 name="chart-bar" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                        <Text style={[styles.metaLabel, { color: theme.secondaryText }]}>Zorluk</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>{meta.difficulty}</Text>
                      </View>
                      <View style={[styles.metaBox, { backgroundColor: isDarkMode ? theme.card : '#f5f5f5', borderColor: isDarkMode ? theme.border : '#e5e5e5' }]}>
                        <FontAwesome5 name="fire-alt" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                        <Text style={[styles.metaLabel, { color: theme.secondaryText }]}>Kalori</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>{meta.calories}</Text>
                      </View>
                      <View style={[styles.metaBox, { backgroundColor: isDarkMode ? theme.card : '#f5f5f5', borderColor: isDarkMode ? theme.border : '#e5e5e5' }]}>
                        <FontAwesome5 name="users" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                        <Text style={[styles.metaLabel, { color: theme.secondaryText }]}>Porsiyon</Text>
                        <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>{meta.portion}</Text>
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          </View>

          {renderFormattedText(tarif.description, theme, isDarkMode)}
        </View>
      </Animated.ScrollView>

      <LinearGradient colors={['transparent', theme.background]} style={styles.bottomGradient} pointerEvents="none" />
      <TouchableOpacity style={styles.startButton} onPress={handleStartRecipe}>
        <FontAwesome5 name="play" size={14} color="#fff" style={{ marginRight: 12 }} />
        <Text style={styles.startButtonText}>Tarife Başla</Text>
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },

  // Loading Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  aiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 112, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    color: '#262626',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  loadingContentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
    alignItems: 'center',
  },
  loadingListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  loadingListTitle: {
    fontSize: 16,
    fontFamily: 'PoppinsBold',
    color: '#262626',
    marginLeft: 8,
  },
  loadingIngredientsList: {
    width: '100%',
    marginBottom: 20,
  },
  loadingIngredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff', // clean row
    paddingHorizontal: 8,
  },
  loadingBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff7043',
    marginRight: 12,
  },
  loadingIngredientText: {
    fontSize: 16,
    color: '#383838',
    fontFamily: 'PoppinsRegular',
  },
  aiFooter: {
    marginTop: 24,
    alignItems: 'center',
    paddingTop: 16,
    borderWidth: 0,
    borderTopColor: '#eeeeee',
    width: '100%',
  },
  aiFooterText: {
    fontSize: 12,
    color: '#a3a3a3',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 0,
    borderColor: '#fed7aa',
  },
  timeText: {
    fontSize: 13,
    color: '#c2410c',
    fontFamily: 'PoppinsBold',
    marginLeft: 6,
  },
  loadingPreferenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 10,
    width: '100%',
  },
  loadingPreferenceText: {
    fontSize: 13,
    color: '#737373',
    flex: 1,
  },
  noImageHeader: {
    paddingTop: 50,
    paddingHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButtonDark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eeeeee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingHighlightText: {
    fontSize: 18,
    fontFamily: 'PoppinsExtraBold',
    color: '#262626',
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingNote: {
    fontSize: 14,
    color: '#a3a3a3',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff7043',
    marginHorizontal: 4,
  },

  // Recipe Styles
  recipeContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  recipeNameContainer: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  recipeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 28,
    fontFamily: 'PoppinsExtraBold',
    color: '#262626',
    marginBottom: 12,
  },
  rightSideContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,112,67,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ingredientsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 112, 67, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ingredientsText: {
    fontSize: 14,
    color: '#ff7043',
    fontFamily: 'PoppinsBold',
    marginLeft: 6,
  },
  recipeCard: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },

  // Text Formatting Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderWidth: 0,
    borderBottomColor: 'rgba(255, 112, 67, 0.2)',
  },

  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageCaption: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
    opacity: 0.7,
  },
  imageCredit: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
  },

  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: '#262626',
  },
  stepContainer: {
    flexDirection: 'row',
    // alignItems: 'flex-start', // Removed to let line stretch
    paddingBottom: 24,
    paddingLeft: 4,
  },
  stepLeftColumn: {
    alignItems: 'center',
    marginRight: 16,
    width: 28,
  },
  stepLine: {
    position: 'absolute',
    top: 28,
    bottom: -24,
    width: 2,
    backgroundColor: '#ffcc80',
    left: 13,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff7043',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    zIndex: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontFamily: 'PoppinsBold',
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#2a3340ff',
    fontFamily: 'PoppinsRegular',
    lineHeight: 24,
    paddingTop: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 0,
    borderBottomColor: '#eeeeee',
  },
  ingredientRowAlt: {
    backgroundColor: '#f3f5f7ff',
  },
  ingredientIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 112, 67, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#2a3340',
    fontFamily: 'PoppinsRegular',
    lineHeight: 22,
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff7043',
    marginRight: 12,
    marginTop: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: '#2a3340ff',
    fontFamily: 'PoppinsRegular',
    lineHeight: 24,
  },
  normalText: {
    fontSize: 16,
    color: '#2a3340ff',
    fontFamily: 'PoppinsRegular',
    lineHeight: 24,
    marginBottom: 8,
  },

  // Tarifi Yenile Butonu
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,112,67,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#ff7043',
    fontSize: 16,
    fontFamily: 'PoppinsBold',
  },

  // Resim Stilleri
  imageContainer: {
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  recipeImage: {
    width: '100%',
    height: 400,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageCaption: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
    opacity: 0.7,
  },
  imageCredit: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerButtons: {
    position: 'absolute',
    top: 50, // Adjust for status bar
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  startButton: {
    position: 'absolute',
    bottom: 64,
    left: 24,
    right: 24,
    backgroundColor: '#ff7043',
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff7043',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    zIndex: 20,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 5,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: '#fff',
    zIndex: 100,
    justifyContent: 'flex-end',
    paddingBottom: 16,
    borderWidth: 0,
    borderBottomColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  stickyBackButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyHeaderTitle: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    color: '#262626',
    flex: 1,
    textAlign: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PoppinsBold',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  voiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'PoppinsBold',
  },
  ingredientChip: {
    backgroundColor: 'rgba(255, 112, 67, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0,
    borderColor: 'rgba(255, 112, 67, 0.2)',
  },
  ingredientChipText: {
    color: '#d84315',
    fontSize: 14,
    fontFamily: 'PoppinsBold',
  },
  termBox: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
  },
  termTitle: {
    fontSize: 12,
    fontFamily: 'PoppinsBold',
    color: '#0369a1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  termText: {
    fontSize: 13,
    color: '#075985',
    fontFamily: 'PoppinsRegular',
    lineHeight: 18,
  },
  chefTipContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 16,
  },
  chefTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chefTipTitle: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#262626',
  },
  chefTipText: {
    fontSize: 15,
    fontFamily: 'PoppinsRegular',
    color: '#2a3340ff',
    lineHeight: 24,
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 15,
    right: 15,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    justifyContent: 'center',
  },
  toastIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toastText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PoppinsExtraBold',
  },
  metaContainer: {
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  metaBox: {
    flex: 1,
    height: 82,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    borderWidth: 0,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
  },
  metaValue: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'PoppinsBold',
  },
  errorHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  errorCard: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 0,
  },
  errorIconBubble: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'PoppinsRegular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7043',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 10,
    shadowColor: '#ff7043',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  retryButtonText: {
    fontSize: 15,
    fontFamily: 'PoppinsBold',
    color: '#ffffff',
  },
  secondaryErrorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 16,
    width: '100%',
  },
  secondaryErrorButtonText: {
    fontSize: 14,
    fontFamily: 'PoppinsMedium',
  },
});

export default RecipeDetail;