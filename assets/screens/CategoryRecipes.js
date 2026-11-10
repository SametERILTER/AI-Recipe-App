import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    FlatList,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

import recipesData from '../data/recipes.json';

const { width } = Dimensions.get('window');

const CategoryRecipes = () => {
    const { isDarkMode, theme } = useTheme();
    const navigation = useNavigation();
    const route = useRoute();
    const { categoryName } = route.params;


    const categoryRecipes = recipesData.tarifler.filter(
        (recipe) => recipe.kategori.toLocaleLowerCase('tr-TR') === categoryName.toLocaleLowerCase('tr-TR')
    );

    const formatRecipeForDetail = (recipe) => {
        const description = `**Yemek Adı:** ${recipe.isim}

**Malzemeler:**
${recipe.malzemeler.map(malzeme => `- ${malzeme}`).join('\n')}

**Hazırlanışı:**
${recipe.hazirlanis.map((adim, index) => `${index + 1}. ${adim}`).join('\n')}

**İpuçları:**
- ${recipe.sure} sürede hazırlanır
- ${recipe.kisi} kişilik tarif
- Zorluk seviyesi: ${recipe.zorluk}
- Kategori: ${recipe.kategori}`;

        return {
            yemekAdi: recipe.isim,
            malzemeler: recipe.malzemeler,
            description: description,
            imageData: null,
            date: new Date().toISOString(),
        };
    };

    const getDifficultyStars = (difficulty) => {
        let starCount = 1;
        if (difficulty.toLowerCase() === 'orta') starCount = 2;
        if (difficulty.toLowerCase() === 'zor') starCount = 3;

        return (
            <View style={styles.difficultyContainer}>
                <Text style={[styles.difficultyLabelText, { color: theme.secondaryText }]}>Zorluk: </Text>
                <View style={styles.starContainer}>
                    {[...Array(starCount)].map((_, i) => (
                        <FontAwesome5 key={i} name="star" size={10} color={isDarkMode ? '#ffcc80' : "#64748b"} solid style={{ marginRight: 2 }} />
                    ))}
                </View>
            </View>
        );
    };

    const renderAIChefCTA = () => (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.aiCardContainer}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Ana Sayfa' })}
        >
            <LinearGradient
                colors={['#ff7043', '#ff8a65']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiGradient}
            >
                <View style={styles.aiContent}>
                    <View style={styles.aiIconWrapper}>
                        <MaterialCommunityIcons name="robot-happy" size={32} color="#fff" />
                    </View>
                    <View style={styles.aiTextWrapper}>
                        <Text style={styles.aiTitle}>Aradığınız tarifi bulamadınız mı?</Text>
                        <Text style={styles.aiSubtitle}>Yapay zeka şefimiz sizin için istediğiniz yemeği anında hazırlayabilir!</Text>
                        <View style={styles.aiButton}>
                            <Text style={styles.aiButtonText}>Şefe Sor</Text>
                            <FontAwesome5 name="magic" size={12} color="#ff7043" />
                        </View>
                    </View>
                </View>
                {/* Decorative Icon */}
                <MaterialCommunityIcons
                    name="chef-hat"
                    size={80}
                    color="rgba(255,255,255,0.15)"
                    style={styles.aiDecorIcon}
                />
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderRecipeCard = ({ item }) => (
        <TouchableOpacity
            style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: isDarkMode ? 1 : 0 }]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SavedRecipeDetail', { recipe: formatRecipeForDetail(item) })}
        >
            <View style={styles.cardContent}>
                <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={1}>{item.isim}</Text>

                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <FontAwesome5 name="clock" size={12} color={theme.secondaryText} />
                        <Text style={[styles.metaText, { color: theme.secondaryText }]}>{item.sure}</Text>
                    </View>

                    <View style={styles.metaItem}>
                        <FontAwesome5 name="users" size={12} color={theme.secondaryText} />
                        <Text style={[styles.metaText, { color: theme.secondaryText }]}>{item.kisi} Kişi</Text>
                    </View>
                </View>

                {getDifficultyStars(item.zorluk)}
            </View>

            <View style={styles.actionArea}>
                <View style={[styles.arrowCircle, { backgroundColor: isDarkMode ? theme.background : '#fff', borderColor: theme.border }]}>
                    <FontAwesome5 name="chevron-right" size={12} color={theme.secondaryText} />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>{categoryName.charAt(0).toLocaleUpperCase('tr-TR') + categoryName.slice(1)}</Text>
                <View style={styles.badge}>
                    <Text style={[styles.countText, { color: theme.secondaryText }]}>{categoryRecipes.length} Harika Tarif</Text>
                </View>
            </View>

            <FlatList
                data={categoryRecipes}
                renderItem={renderRecipeCard}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={renderAIChefCTA}
                ListFooterComponentStyle={{ marginTop: 20 }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 45,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    title: {
        fontSize: 32,
        fontFamily: 'TextExtraBold',
        color: '#1e293b',
    },
    badge: {
        marginTop: 4,
    },
    countText: {
        fontSize: 15,
        color: '#64748b',
        fontFamily: 'TextNormal',
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingTop: 10,
        paddingBottom: 100,
    },
    recipeCard: {
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardContent: {
        flex: 1,
    },
    recipeName: {
        fontSize: 18,
        fontFamily: 'TextBold',
        color: '#1e293b',
        marginBottom: 8,
    },
    starContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#64748b',
        fontFamily: 'TextNormal',
    },
    difficultyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    difficultyLabelText: {
        fontSize: 12,
        color: '#94a3b8',
        fontFamily: 'TextNormal',
    },
    actionArea: {
        marginLeft: 15,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    aiCardContainer: {
        marginTop: 10,
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#ff7043',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    aiGradient: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    aiContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 2,
    },
    aiIconWrapper: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    aiTextWrapper: {
        flex: 1,
    },
    aiTitle: {
        fontSize: 18,
        fontFamily: 'TextBold',
        color: '#fff',
        marginBottom: 4,
    },
    aiSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontFamily: 'TextNormal',
        marginBottom: 12,
        lineHeight: 18,
    },
    aiButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 8,
    },
    aiButtonText: {
        color: '#ff7043',
        fontFamily: 'TextBold',
        fontSize: 13,
    },
    aiDecorIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
        transform: [{ rotate: '-15deg' }],
        zIndex: 1,
    }
});

export default CategoryRecipes;
