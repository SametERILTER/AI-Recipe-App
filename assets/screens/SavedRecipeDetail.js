import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
  Share
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { useTheme } from '../context/ThemeContext';


const { width } = Dimensions.get('window');

// Helper Functions
function getSectionIcon(title) {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('malzeme')) return 'list-ul';
  if (titleLower.includes('hazırlan') || titleLower.includes('yapılış')) return 'utensils';
  if (titleLower.includes('ipuç') || titleLower.includes('öneri')) return 'lightbulb';
  if (titleLower.includes('yemek') || titleLower.includes('tarif')) return 'cookie-bite';
  return 'star';
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

    // Numaralı liste öğeleri (Adımlar)
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

              const termRegex = /(\(?\*\*Temel Mutfak Terimi:?\s*(.*?)\*\*\)?|\(Temel Mutfak Terimi:?\s*(.*?)\)|Temel Mutfak Terimi:?\s*(.*))/i;
              const termMatch = stepTextRaw.match(termRegex);

              let cleanText = stepTextRaw;
              let termContent = null;

              if (termMatch) {
                cleanText = stepTextRaw.replace(termMatch[0], '').trim();
                termContent = termMatch[2] || termMatch[3] || termMatch[4];
                if (cleanText.endsWith('(')) cleanText = cleanText.slice(0, -1).trim();
              }

              return (
                <View>
                  {cleanText.length > 0 && parseInlineBold(cleanText, [styles.stepText, { color: theme.text }])}
                  {termContent && (
                    <View style={[styles.termBox, { backgroundColor: isDarkMode ? '#0ea5e915' : '#f0f9ff', borderColor: isDarkMode ? '#0ea5e940' : '#bae6fd', borderWidth: 0 }]}>
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

    if (/^-/.test(line.trim())) {
      return (
        <View key={lineIndex} style={[styles.ingredientRow, { backgroundColor: isDarkMode ? theme.card : '#ffffff', borderBottomColor: theme.border, borderWidth: 0 }]}>
          <View style={styles.ingredientIconContainer}>
            <FontAwesome5 name="check" size={10} color="#ff7043" />
          </View>
          <Text style={[styles.ingredientText, { color: theme.text }]}>
            {line.replace(/^-\s*/, '')}
          </Text>
        </View>
      );
    }

    return (
      <Text key={lineIndex} style={[styles.normalText, { color: theme.text }]}>
        {line}
      </Text>
    );
  });
}

function extractRecipeName(description) {
  const match = description.match(/\*\*Yemek Adı:\*\*\s*(.*)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return 'Yemek Tarifi';
}

const SavedRecipeDetail = ({ route, navigation }) => {
  const { isDarkMode, theme } = useTheme();
  const { recipe } = route.params;

  const scrollY = useRef(new Animated.Value(0)).current;

  // Resim verisi farklı yerlerden farklı formatlarda gelebilir (image, imageData, imageData.url)
  const recipeImage = recipe.image || (recipe.imageData?.url ? recipe.imageData.url : (typeof recipe.imageData === 'string' ? recipe.imageData : null));
  const hasImage = typeof recipeImage === 'string' && recipeImage.trim() !== '';
  const photographer = recipe.imageData?.photographer || null;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSavedInStorage, setIsSavedInStorage] = useState(false);
  const [isStickyVisible, setIsStickyVisible] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      try {
        const existing = await AsyncStorage.getItem('saved_recipes');
        if (existing) {
          const list = JSON.parse(existing);
          const targetName = (recipe.yemekAdi || extractRecipeName(recipe.description)).toLocaleLowerCase('tr-TR');
          const found = list.some(r => (r.yemekAdi || '').toLocaleLowerCase('tr-TR') === targetName);
          setIsSavedInStorage(found);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkSavedStatus();

    return () => {
      Speech.stop();
    };
  }, [recipe]);

  const handleSaveToBookmark = async () => {
    try {
      const existing = await AsyncStorage.getItem('saved_recipes');
      const list = existing ? JSON.parse(existing) : [];
      const recipeName = recipe.yemekAdi || extractRecipeName(recipe.description);
      const alreadyExists = list.some(
        r => (r.yemekAdi || '').toLocaleLowerCase('tr-TR') === recipeName.toLocaleLowerCase('tr-TR')
      );
      if (!alreadyExists) {
        list.push({
          yemekAdi: recipeName,
          malzemeler: recipe.malzemeler || [],
          description: recipe.description,
          imageData: recipe.imageData || null,
          date: new Date().toISOString(),
        });
        await AsyncStorage.setItem('saved_recipes', JSON.stringify(list));
      }
      setIsSavedInStorage(true);
      Alert.alert('Kaydedildi', `"${recipeName}" kaydedilen tariflerinize eklendi.`);
    } catch (e) {
      Alert.alert('Hata', 'Tarif kaydedilemedi.');
    }
  };

  const speakRecipe = () => {
    const title = recipe.yemekAdi || extractRecipeName(recipe.description);

    // Process description to exclude unwanted sections and format for speech
    const lines = recipe.description.split('\n');
    let textToSpeak = title + ". "; // Start with title
    let skipSection = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Check for section headers
      if (/\*\*(.*?)\*\*/.test(trimmed)) {
        const sectionTitle = trimmed.replace(/\*\*/g, '').trim();
        const sectionLower = sectionTitle.toLowerCase();

        // Check if we should skip this section
        if (sectionLower.includes('resim arama kerimeleri') || sectionLower.includes('resim arama kelimeleri')) {
          skipSection = true;
          return;
        }

        // Skip adding "Yemek Adı" header again to text, as we spoke it at start
        if (sectionLower.includes('yemek adı')) {
          skipSection = false; // logic: content of this section is just the name usually, which we have.
          // Actually, the line is usually "**Yemek Adı:** Name".
          // If it's a header line like "**Malzemeler:**", we want to speak "Malzemeler".
          // If it's "**Yemek Adı:** ...", we skip it because we already added title.
          return;
        }

        skipSection = false;
        // Add the section title (e.g., "Malzemeler")
        textToSpeak += sectionTitle + ". ";
        return;
      }

      if (!skipSection) {
        // Clean line: remove bold markers, bullets, etc.
        let cleanLine = trimmed.replace(/\*\*/g, '').replace(/^- /, '').replace(/^-/, '');
        textToSpeak += cleanLine + ". ";
      }
    });

    Speech.speak(textToSpeak, {
      language: 'tr',
      pitch: 1.0,
      rate: 1.1,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const handleShare = async () => {
    if (!recipe || !recipe.description) return;

    const recipeName = recipe.yemekAdi || extractRecipeName(recipe.description);
    const cleanDescription = recipe.description.replace(/\*\*/g, '');

    try {
      await Share.share({
        message: `${recipeName}\n\n${cleanDescription}\n\nLezzetli Tarifler Uygulaması ile gönderildi.`,
        title: recipeName,
      });
    } catch (error) {
      console.error('Paylaşım hatası:', error.message);
    }
  };

  useEffect(() => {
    const threshold = hasImage ? 300 : 110;
    const listenerId = scrollY.addListener(({ value }) => {
      setIsStickyVisible(value > threshold);
    });
    return () => {
      scrollY.removeListener(listenerId);
    };
  }, [scrollY, hasImage]);

  const headerOpacity = scrollY.interpolate({
    inputRange: hasImage ? [300, 360] : [110, 160],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleDeleteRecipe = () => {
    Alert.alert(
      "Tarifi Sil",
      "Bu tarifi kayıtlı tariflerinizden silmek istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              const existing = await AsyncStorage.getItem('saved_recipes');
              let recipes = existing ? JSON.parse(existing) : [];
              const targetName = (recipe.yemekAdi || extractRecipeName(recipe.description)).toLocaleLowerCase('tr-TR');
              recipes = recipes.filter(r => r.date !== recipe.date && (r.yemekAdi || '').toLocaleLowerCase('tr-TR') !== targetName);
              await AsyncStorage.setItem('saved_recipes', JSON.stringify(recipes));
              setIsSavedInStorage(false);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Hata', 'Tarif silinemedi.');
            }
          }
        }
      ]
    );
  };

  const handleStartRecipe = () => {
    if (!recipe || !recipe.description) return;

    const lines = recipe.description.split('\n');
    const steps = [];
    const tips = [];
    let currentSection = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**')) {
        const title = trimmed.replace(/\*\*/g, '').toLowerCase();
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
      Alert.alert('Hata', 'Tarif adımları bulunamadı.');
      return;
    }

    navigation.navigate('StartRecipe', {
      steps,
      tips,
      recipeName: recipe.yemekAdi || extractRecipeName(recipe.description),
      malzemeler: recipe.malzemeler || [],
      description: recipe.description,
      recipeImage: recipe.imageData || recipe.image || null,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header Buttons if NO Image */}
        {!hasImage && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 56, marginBottom: 14 }}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderColor: isDarkMode ? theme.border : '#e5e5e5' }]}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderColor: isDarkMode ? theme.border : '#e5e5e5' }]}
                onPress={handleShare}
              >
                <Octicons name="share" size={18} color={theme.text} />
              </TouchableOpacity>

              {isSavedInStorage ? (
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]}
                  onPress={handleDeleteRecipe}
                >
                  <FontAwesome5 name="trash-alt" size={18} color="#ef4444" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: isDarkMode ? theme.card : '#fff7ed', borderColor: isDarkMode ? theme.border : '#fed7aa' }]}
                  onPress={handleSaveToBookmark}
                >
                  <FontAwesome5 name="bookmark" size={18} color="#ff7043" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tarif Resmi */}
        {hasImage && typeof recipeImage === 'string' && recipeImage.trim() !== '' && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: recipeImage }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageCredit}>
                Fotoğraf: {photographer ? `${photographer} | ` : ''}Unsplash
              </Text>
              <Text style={styles.imageCaption}>
                Fotoğraf temsilidir
              </Text>
            </View>

            {/* Top Gradient & Buttons */}
            <LinearGradient
              colors={['rgba(0,0,0,0.75)', 'transparent']}
              style={styles.topGradient}
            />
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.goBack()}
              >
                <FontAwesome5 name="arrow-left" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleShare}
                >
                  <Octicons name="share" size={18} color="#fff" />
                </TouchableOpacity>

                {isSavedInStorage ? (
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: 'rgba(255, 71, 87, 0.25)', borderColor: 'rgba(255, 71, 87, 0.1)' }]}
                    onPress={handleDeleteRecipe}
                  >
                    <FontAwesome5 name="trash-alt" size={18} color="#fff" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: 'rgba(255, 112, 67, 0.35)', borderColor: 'rgba(255, 112, 67, 0.2)' }]}
                    onPress={handleSaveToBookmark}
                  >
                    <FontAwesome5 name="bookmark" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.recipeNameContainer}>
          {/* Yemek Adı */}
          <Text style={[styles.recipeName, { color: theme.text }]}>
            {recipe.yemekAdi || extractRecipeName(recipe.description)}
          </Text>

          {/* Malzeme & Sesli Okuma Satırı */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>

            <TouchableOpacity
              style={[styles.voiceButton, isSpeaking && styles.voiceButtonActive, { marginBottom: 0 }]}
              onPress={isSpeaking ? stopSpeaking : speakRecipe}
            >
              <FontAwesome5 name={isSpeaking ? "stop" : "volume-up"} size={14} color="#fff" />
              <Text style={styles.voiceButtonText}>
                {isSpeaking ? "Durdur" : "Sesli Oku"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Meta Bilgileri Kutuları */}
          <View style={{ marginTop: 16 }}>
            {(() => {
              const prepTime = recipe.description.match(/\*\*\s*Hazırlama Süresi:\*\*\s*(.*)/i)?.[1]?.trim() || '-';
              const difficulty = recipe.description.match(/\*\*\s*Zorluk Seviyesi:\*\*\s*(.*)/i)?.[1]?.trim() || '-';
              const calorie = recipe.description.match(/\*\*\s*Kalori:\*\*\s*(.*)/i)?.[1]?.trim() || '-';
              const portion = recipe.description.match(/\*\*\s*Porsiyon:\*\*\s*(.*)/i)?.[1]?.trim() || (recipe.kisi ? `${recipe.kisi} Kişilik` : '-');

              if (prepTime === '-' && difficulty === '-' && calorie === '-' && portion === '-') return null;

              return (
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
                  {prepTime !== '-' && (
                    <View style={{ flex: 1, height: 82, backgroundColor: theme.card, borderRadius: 14, justifyContent: 'center', alignItems: 'center', padding: 4, borderWidth: 0, borderColor: theme.border }}>
                      <FontAwesome5 name="clock" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 11, color: theme.secondaryText, fontFamily: 'PoppinsRegular', textAlign: 'center' }}>Süre</Text>
                      <Text style={{ fontSize: 12, color: theme.text, textAlign: 'center', marginTop: 2, fontFamily: 'PoppinsBold' }} numberOfLines={1}>{prepTime}</Text>
                    </View>
                  )}
                  {difficulty !== '-' && (
                    <View style={{ flex: 1, height: 82, backgroundColor: theme.card, borderRadius: 14, justifyContent: 'center', alignItems: 'center', padding: 4, borderWidth: 0, borderColor: theme.border }}>
                      <FontAwesome5 name="chart-bar" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 11, color: theme.secondaryText, fontFamily: 'PoppinsRegular', textAlign: 'center' }}>Zorluk</Text>
                      <Text style={{ fontSize: 12, color: theme.text, textAlign: 'center', marginTop: 2, fontFamily: 'PoppinsBold' }} numberOfLines={1}>{difficulty}</Text>
                    </View>
                  )}
                  {calorie !== '-' && (
                    <View style={{ flex: 1, height: 82, backgroundColor: theme.card, borderRadius: 14, justifyContent: 'center', alignItems: 'center', padding: 4, borderWidth: 0, borderColor: theme.border }}>
                      <FontAwesome5 name="fire-alt" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 11, color: theme.secondaryText, fontFamily: 'PoppinsRegular', textAlign: 'center' }}>Kalori</Text>
                      <Text style={{ fontSize: 12, color: theme.text, textAlign: 'center', marginTop: 2, fontFamily: 'PoppinsBold' }} numberOfLines={1}>{calorie}</Text>
                    </View>
                  )}
                  {portion !== '-' && (
                    <View style={{ flex: 1, height: 82, backgroundColor: theme.card, borderRadius: 14, justifyContent: 'center', alignItems: 'center', padding: 4, borderWidth: 0, borderColor: theme.border }}>
                      <FontAwesome5 name="users" size={18} color="#ff7043" style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 11, color: theme.secondaryText, fontFamily: 'PoppinsRegular', textAlign: 'center' }}>Porsiyon</Text>
                      <Text style={{ fontSize: 12, color: theme.text, textAlign: 'center', marginTop: 2, fontFamily: 'PoppinsBold' }} numberOfLines={1}>{portion}</Text>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        </View>

        {/* Recipe Content */}
        <View style={styles.recipeCard}>
          {renderFormattedText(recipe.description, theme, isDarkMode)}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            opacity: headerOpacity,
            elevation: isStickyVisible ? 4 : 0,
            shadowOpacity: isStickyVisible ? 0.05 : 0,
          }
        ]}
        pointerEvents={isStickyVisible ? 'box-none' : 'none'}
      >
        <View style={styles.stickyHeaderContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.stickyBackButton}>
            <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.stickyHeaderTitle, { color: theme.text }]} numberOfLines={1}>
            {recipe.yemekAdi || extractRecipeName(recipe.description)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={handleShare} style={styles.stickyBackButton}>
              <Octicons name="share" size={18} color={theme.text} />
            </TouchableOpacity>
            {isSavedInStorage ? (
              <TouchableOpacity onPress={handleDeleteRecipe} style={styles.stickyBackButton}>
                <FontAwesome5 name="trash-alt" size={18} color="#ef4444" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSaveToBookmark} style={styles.stickyBackButton}>
                <FontAwesome5 name="bookmark" size={18} color="#ff7043" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Bottom Gradient */}
      <LinearGradient
        colors={['transparent', theme.background]}
        style={[styles.bottomGradient, { opacity: 0.9 }]}
        pointerEvents="none"
      />

      {/* Start Recipe Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartRecipe}
        activeOpacity={0.8}
      >
        <Text style={styles.startButtonText}>Tarife Başla</Text>
        <FontAwesome5 name="play" size={16} color="#fff" style={{ marginLeft: 12 }} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  recipeNameContainer: {
    marginBottom: 24,
    paddingHorizontal: 24,
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
  rightSideContainerWrapped: {
    flexWrap: 'wrap',
    rowGap: 8,
  },
  ingredientsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 112, 67, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start'
  },
  ingredientsText: {
    fontSize: 14,
    color: '#ff7043',
    fontFamily: 'PoppinsBold',
    marginLeft: 6,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 0,
    borderColor: '#e5e5e5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#737373',
    fontFamily: 'PoppinsBold',
    marginLeft: 6,
  },
  recipeCard: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
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
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  headerButtons: {
    position: 'absolute',
    top: 50,
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
    height: 100,
    zIndex: 5,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    zIndex: 6
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
    borderBottomColor: '#f8fcffff',
    shadowColor: '#0000006d',
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
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 8,
  },
  voiceButtonActive: {
    backgroundColor: '#ef4444',
  },
  voiceButtonText: {
    color: '#fff',
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
});

export default SavedRecipeDetail;