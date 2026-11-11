import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Image,
    Dimensions,
    ActivityIndicator,
    Platform,
    Alert
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import recipesData from '../data/recipes.json';
import { unsplashAPI } from '../config/unsplash';
import { useTheme } from '../context/ThemeContext';


const { width } = Dimensions.get('window');

const RecipeOfDay = () => {
    const { isDarkMode, theme } = useTheme();
    const navigation = useNavigation();

    const [menu, setMenu] = useState({ breakfast: null, lunch: null, dinnerSet: null });

    useEffect(() => {
        selectDailyMenu();
    }, []);

    const selectDailyMenu = async () => {
        try {
            // Veri kontrolü
            if (!recipesData || !recipesData.tarifler || recipesData.tarifler.length === 0) {
                console.error("Tarif verisi yüklenemedi!");
                Alert.alert("Hata", "Tarif listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.");
                return;
            }

            const allRecipes = recipesData.tarifler;
            console.log(`Toplam Tarif: ${allRecipes.length}`);

            // Kahvaltı: Börek, Hamur İşi veya Etiketinde Kahvaltı olanlar
            const breakfastOptions = allRecipes.filter(r =>
                r.kategori === 'börek' ||
                (r.etiketler && r.etiketler.includes('kahvaltı')) ||
                (r.etiketler && r.etiketler.includes('hamur işi'))
            );

            // Öğle: Çorba, Pilav veya Hafif Ana Yemekler
            const lunchOptions = allRecipes.filter(r =>
                r.kategori === 'pilav' ||
                (r.kategori === 'ana yemek' && r.zorluk === 'kolay')
            );

            // Akşam: Zor Ana Yemekler, Kebaplar
            const dinnerOptions = allRecipes.filter(r =>
                r.kategori === 'ana yemek' ||
                (r.etiketler && r.etiketler.includes('kebap'))
            );

            // Bugünün tarihine göre SEED oluşturma
            // Örn: "30-1-2026" stringini sayıya çevir
            const today = new Date();
            const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            // Basit hash fonksiyonu (String -> Number)
            let seed = 0;
            for (let i = 0; i < dateString.length; i++) {
                seed = ((seed << 5) - seed) + dateString.charCodeAt(i);
                seed |= 0; // 32bit integer'a zorla
            }
            seed = Math.abs(seed); // Pozitif yap

            // Seeded Random fonksiyonu
            // seed değerini her çağrıda değiştirerek farklı sayılar alacağız
            const seededRandom = () => {
                const x = Math.sin(seed++) * 10000;
                return x - Math.floor(x);
            };

            // Akşam Yemeği Seti Seçimi
            const soupOptions = allRecipes.filter(r => r.kategori === 'çorba');
            const mainOptions = allRecipes.filter(r => r.kategori === 'ana yemek' || (r.etiketler && r.etiketler.includes('kebap')));
            const sideOptions = allRecipes.filter(r => r.kategori === 'pilav' || r.kategori === 'meze' || r.kategori === 'ara sıcak');

            const selectedBreakfast = breakfastOptions.length > 0 ? breakfastOptions[Math.floor(seededRandom() * breakfastOptions.length)] : allRecipes[0];
            const selectedLunch = lunchOptions.length > 0 ? lunchOptions[Math.floor(seededRandom() * lunchOptions.length)] : allRecipes[1];

            const selectedDinnerSoup = soupOptions.length > 0 ? soupOptions[Math.floor(seededRandom() * soupOptions.length)] : allRecipes[0];
            const selectedDinnerMain = mainOptions.length > 0 ? mainOptions[Math.floor(seededRandom() * mainOptions.length)] : allRecipes[2];
            const selectedDinnerSide = sideOptions.length > 0 ? sideOptions[Math.floor(seededRandom() * sideOptions.length)] : allRecipes[3];

            setMenu({
                breakfast: selectedBreakfast,
                lunch: selectedLunch,
                dinnerSet: {
                    soup: selectedDinnerSoup,
                    main: selectedDinnerMain,
                    side: selectedDinnerSide
                }
            });

            // Load images devre dışı bırakıldı - Sadece lokal placeholder kullanılacak
            // loadImages(selectedBreakfast, selectedLunch, selectedDinner);
        } catch (error) {
            console.error("Menü Hatası:", error);
            Alert.alert("Hata", "Menü oluşturulurken bir sorun oluştu: " + error.message);
        }
    };

    /*
    const loadImages = async (b, l, d) => {
        try {
            if (b) unsplashAPI.searchRecipeImage(b.isim).then(img => setImages(prev => ({ ...prev, breakfast: img })));
            if (l) unsplashAPI.searchRecipeImage(l.isim).then(img => setImages(prev => ({ ...prev, lunch: img })));
            if (d) unsplashAPI.searchRecipeImage(d.isim).then(img => setImages(prev => ({ ...prev, dinner: img })));
        } catch (e) {
            console.log("Error loading menu images", e);
        }
    };
    */

    const handleRecipePress = (recipe, image, title) => {
        if (!recipe) return;

        // Resim belirleme mantığı
        let finalImage = image;

        if (!finalImage) {
            // Unsplash yoksa lokal placeholder kullan
            if (title === 'Kahvaltı') {
                finalImage = require('../images/food-placeholders/breakfast.jpg');
            } else if (title === 'Öğle Yemeği') {
                finalImage = require('../images/food-placeholders/lunch.jpg');
            } else if (title === 'Akşam Yemeği') {
                finalImage = require('../images/food-placeholders/dinner.jpg');
            } else {
                finalImage = require('../images/food-placeholders/breakfast.jpg'); // Default fallback
            }
        } else {
            // Unsplash image formatını koru
            // Ancak SavedRecipeDetail { uri: url } bekliyor olabilir, kontrol edelim.
            // Unsplash API'den dönen obje genelde { url: '...', photographer: '...' } şeklindedir.
        }

        // recipes.json verisini SavedRecipeDetail'in beklediği formata çevir
        const formattedDescription = `**Yemek Adı:** ${recipe.isim}

**Hazırlama Süresi:** ${recipe.sure}
**Zorluk Seviyesi:** ${recipe.zorluk}
**Kalori:** ${recipe.kalori || '350 kcal'}
**Porsiyon:** ${recipe.kisi ? `${recipe.kisi} Kişilik` : '4 Kişilik'}

**Malzemeler:**
${recipe.malzemeler.map(m => `- ${m}`).join('\n')}

**Hazırlanışı:**
${recipe.hazirlanis.map((step, index) => `${index + 1}. ${step}`).join('\n')}

**İpuçları:**
- ${recipe.sure} sürede hazırlanır
- ${recipe.kisi} kişilik tarif
- Zorluk seviyesi: ${recipe.zorluk}
- Kalori: ${recipe.kalori || '350 kcal'}
- Kategori: ${recipe.kategori}`;

        const recipeForDetail = {
            yemekAdi: recipe.isim,
            malzemeler: recipe.malzemeler || [],
            description: formattedDescription,
            imageData: null,
            date: new Date().toISOString(),
            isReadOnly: true
        };

        navigation.navigate('SavedRecipeDetail', { recipe: recipeForDetail });
    };

    const MealCard = ({ title, recipe, image, icon, color }) => {
        if (!recipe) return null;

        // Varsayılan resimler (Placeholder) - require içinde değişken KULLANILAMAZ
        let placeholderSource;

        if (title === 'Kahvaltı') {
            placeholderSource = require('../images/food-placeholders/breakfast.jpg');
        } else if (title === 'Öğle Yemeği') {
            placeholderSource = require('../images/food-placeholders/lunch.jpg');
        } else if (title === 'Akşam Yemeği') {
            placeholderSource = require('../images/food-placeholders/dinner.jpg');
        }

        return (
            <View style={styles.mealSection}>
                <View style={styles.mealHeader}>
                    <View style={[styles.iconBox, { backgroundColor: color }]}>
                        <FontAwesome5 name={icon} size={16} color="#fff" />
                    </View>
                    <Text style={[styles.mealTitle, { color: theme.text }]}>{title}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}
                    activeOpacity={0.9}
                    onPress={() => handleRecipePress(recipe, image, title)}
                >
                    <Image
                        source={typeof image === 'object' && image.url ? { uri: image.url } : placeholderSource}
                        style={styles.cardImage}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.85)']}
                        style={styles.cardGradient}
                    >
                        <View style={styles.cardContent}>
                            <View style={styles.tagContainer}>
                                <View style={styles.tag}>
                                    <FontAwesome5 name="clock" size={10} color="#fff" />
                                    <Text style={styles.tagText}>{recipe.sure}</Text>
                                </View>
                                <View style={styles.tag}>
                                    <FontAwesome5 name="fire" size={10} color="#fff" />
                                    <Text style={styles.tagText}>{recipe.zorluk}</Text>
                                </View>
                            </View>
                            <Text style={styles.recipeName}>{recipe.isim}</Text>
                            <Text style={styles.recipeIngredients} numberOfLines={1}>
                                {recipe.malzemeler.length} Malzeme • {recipe.kisi} Kişilik
                            </Text>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    };

    if (!menu.breakfast || !menu.lunch || !menu.dinnerSet) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color="#f97316" />
            </View>
        );
    }

    // Yemek Görselleri (Placeholder)
    const images = {
        breakfast: require('../images/food-placeholders/breakfast.jpg'),
        lunch: require('../images/food-placeholders/lunch.jpg'),
        dinner: require('../images/food-placeholders/dinner.jpg'), // Generic dinner placeholder
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Günün Menüsü</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
                    Şefin bugün sizin için seçtiği özel lezzetler.
                </Text>

                <MealCard
                    title="Kahvaltı"
                    recipe={menu.breakfast}
                    image={images.breakfast} // Pass local image directly
                    icon="sun"
                    color="#f59e0b" // Amber
                />

                <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />

                <MealCard
                    title="Öğle Yemeği"
                    recipe={menu.lunch}
                    image={images.lunch} // Pass local image directly
                    icon="utensils"
                    color="#f97316" // Orange
                />

                <View style={[styles.connectorLine, { backgroundColor: theme.border }]} />

                {/* AKŞAM YEMEĞİ SETİ - TEK KART TASARIMI */}
                <View style={{ marginTop: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#4338ca40' : '#e0e7ff' }]}>
                        <FontAwesome5 name="moon" size={16} color="#4338ca" />
                    </View>
                    <Text style={[styles.mealTitle, { color: theme.text }]}>Akşam Yemeği</Text>
                </View>
                <View style={{
                    borderRadius: 20,
                    overflow: 'hidden',
                    backgroundColor: theme.card,
                    borderWidth: 0,
                    borderColor: theme.border,
                }}>
                    {/* Tek Büyük Resim */}
                    <Image
                        source={images.dinner}
                        style={{ width: '100%', height: 180 }}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.7)']}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180, justifyContent: 'flex-end', padding: 16 }}
                    >
                        <View style={styles.cardContent}>
                            <Text style={{ fontFamily: 'PoppinsBold', fontSize: 24, color: '#fff', textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}>
                                Akşam Menüsü
                            </Text>
                            <Text style={{ fontFamily: 'PoppinsRegular', fontSize: 14, color: '#ecfeff' }}>
                                3 Lezzet Bir Arada
                            </Text>
                        </View>
                    </LinearGradient>

                    {/* Liste */}
                    <View style={{ backgroundColor: theme.card, paddingVertical: 5 }}>
                        {menu.dinnerSet.soup && (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 0, borderBottomColor: theme.border }}
                                onPress={() => handleRecipePress(menu.dinnerSet.soup, images.dinner, 'Çorba')}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isDarkMode ? '#eff6ff20' : '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <FontAwesome5 name="mug-hot" size={16} color="#3b82f6" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'PoppinsRegular', fontSize: 12, color: theme.secondaryText, marginBottom: 2 }}>Başlangıç</Text>
                                    <Text style={{ fontFamily: 'PoppinsBold', fontSize: 15, color: theme.text }}>{menu.dinnerSet.soup.isim}</Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={12} color={theme.border} />
                            </TouchableOpacity>
                        )}

                        {menu.dinnerSet.side && (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 0, borderBottomColor: theme.border }}
                                onPress={() => handleRecipePress(menu.dinnerSet.side, images.dinner, 'Yan Lezzet')}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isDarkMode ? '#f0fdf420' : '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <FontAwesome5 name="leaf" size={16} color="#22c55e" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'PoppinsRegular', fontSize: 12, color: theme.secondaryText, marginBottom: 2 }}>Yan Lezzet</Text>
                                    <Text style={{ fontFamily: 'PoppinsBold', fontSize: 15, color: theme.text }}>{menu.dinnerSet.side.isim}</Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={12} color={theme.border} />
                            </TouchableOpacity>
                        )}

                        {menu.dinnerSet.main && (
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
                                onPress={() => handleRecipePress(menu.dinnerSet.main, images.dinner, 'Ana Yemek')}
                            >
                                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: isDarkMode ? '#f3e8ff20' : '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                    <FontAwesome5 name="utensils" size={16} color="#9333ea" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontFamily: 'PoppinsBold', fontSize: 11, color: "#9333ea", marginBottom: 2 }}>ANA ÖĞÜN</Text>
                                    <Text style={{ fontFamily: 'PoppinsBold', fontSize: 16, color: isDarkMode ? '#c084fc' : '#6b21a8' }}>{menu.dinnerSet.main.isim}</Text>
                                </View>
                                <FontAwesome5 name="chevron-right" size={12} color={isDarkMode ? '#581c87' : '#d8b4fe'} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={[styles.infoContainer, { backgroundColor: isDarkMode ? theme.card : '#eeeeee', borderColor: theme.border }]}>
                    <FontAwesome5 name="info-circle" size={24} color={isDarkMode ? "#525252" : "#a3a3a3"} style={{ marginRight: 16 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.infoTitle, { color: theme.text }]}>Menüler Günlük Olarak Yenilenir</Text>
                        <Text style={[styles.infoText, { color: theme.secondaryText }]}>
                            Her gün sizin için özenle seçilen yeni lezzetleri keşfetmek için uygulamamızı ziyaret etmeyi unutmayın.
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 0,
        borderColor: '#e5e5e5',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#262626',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'PoppinsRegular',
        color: '#737373',
        marginBottom: 30,
        textAlign: 'center',
    },
    mealSection: {
        flexDirection: 'column',
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    mealTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        color: '#383838',
    },
    card: {
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: "#737373",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 5,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        justifyContent: 'flex-end',
        padding: 16,
    },
    cardContent: {
        width: '100%',
    },
    tagContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    tagText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'PoppinsMedium',
    },
    recipeName: {
        fontSize: 20,
        fontFamily: 'PoppinsBold',
        color: '#fff',
        marginBottom: 4,
    },
    recipeIngredients: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        color: 'rgba(255,255,255,0.9)',
    },
    connectorLine: {
        height: 20,
        width: 2,
        backgroundColor: '#e5e5e5',
        marginLeft: 16, // iconBox center (16)
        marginVertical: 4,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eeeeee',
        padding: 16,
        borderRadius: 16,
        marginTop: 54,
        borderWidth: 0,
        borderColor: '#e5e5e5',
    },
    infoTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
        color: '#525252',
        marginBottom: 2,
    },
    infoText: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#737373',
        lineHeight: 16,
    }
});

export default RecipeOfDay;
