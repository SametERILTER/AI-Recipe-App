import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Switch,
    Modal,
    Pressable,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { FontAwesome5, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SENSITIVITY_OPTIONS = [
    { id: 'low', label: 'Düşük Hassasiyet', desc: 'Daha sert sallama gerektirir, yanlış algılamaları önler.' },
    { id: 'normal', label: 'Normal Hassasiyet', desc: 'Standart el sallama ve telefon hareketi dengesi.' },
    { id: 'high', label: 'Yüksek Hassasiyet', desc: 'Hafif sallama ve düşük ışık değişimlerinde bile hızlı tepki verir.' },
];

const COOKING_LEVEL_OPTIONS = [
    { id: 'beginner', label: 'Yemek Yapmakta Yeniyim', desc: 'Adım adım, çok detaylı ve basit anlatım.' },
    { id: 'intermediate', label: 'Biraz Biliyorum', desc: 'Standart detayda, anlaşılır ve pratik anlatım.' },
    { id: 'advanced', label: 'Tecrübeliyim', desc: 'Hızlı, teknik detaylı ve profesyonel anlatım.' },
];

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const [gestureControl, setGestureControl] = useState(true);
    const [sensitivity, setSensitivity] = useState('normal');
    const [cookingLevel, setCookingLevel] = useState('intermediate');
    const [sensitivityModalVisible, setSensitivityModalVisible] = useState(false);
    const [levelModalVisible, setLevelModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadSettings();
        }, [])
    );

    const loadSettings = async () => {
        try {
            const val = await AsyncStorage.getItem('gesture_control');
            if (val !== null) {
                setGestureControl(JSON.parse(val));
            }
            const sens = await AsyncStorage.getItem('gesture_sensitivity');
            if (sens) {
                setSensitivity(sens);
            }
            const level = await AsyncStorage.getItem('chef_cooking_level');
            if (level) {
                setCookingLevel(level);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleGestureToggle = async (val) => {
        setGestureControl(val);
        try {
            await AsyncStorage.setItem('gesture_control', JSON.stringify(val));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSensitivitySelect = async (val) => {
        setSensitivity(val);
        try {
            await AsyncStorage.setItem('gesture_sensitivity', val);
        } catch (e) {
            console.error(e);
        }
        setSensitivityModalVisible(false);
    };

    const handleCookingLevelSelect = async (val) => {
        setCookingLevel(val);
        try {
            await AsyncStorage.setItem('chef_cooking_level', val);
        } catch (e) {
            console.error(e);
        }
        setLevelModalVisible(false);
    };

    const SettingItem = ({ icon, title, subtitle, value, onValueChange, iconType = 'font-awesome', type = 'toggle', onPress, iconColor = '#ff7043' }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={type === 'toggle'}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                {iconType === 'material' ? (
                    <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
                ) : (
                    <FontAwesome5 name={icon} size={18} color={iconColor} />
                )}
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
                {subtitle && <Text style={[styles.settingSubtitle, { color: theme.secondaryText }]}>{subtitle}</Text>}
            </View>

            {type === 'toggle' ? (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: isDarkMode ? '#383838' : '#e5e5e5', true: '#ff704330' }}
                    thumbColor={value ? '#ff7043' : (isDarkMode ? '#a3a3a3' : '#eeeeee')}
                />
            ) : (
                <Octicons name="chevron-right" size={16} color={theme.secondaryText} />
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }) => (
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#ff7043' : '#525252' }]}>{title}</Text>
    );

    const currentSensitivityLabel = SENSITIVITY_OPTIONS.find(o => o.id === sensitivity)?.label || 'Normal Hassasiyet';
    const currentLevelLabel = COOKING_LEVEL_OPTIONS.find(o => o.id === cookingLevel)?.label || 'Biraz Biliyorum';

    const scrollY = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const centeredHeaderTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [30, 65],
            [0, 1],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [30, 65],
            [6, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    const bigTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, 40],
            [1, 0],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [0, 40],
            [0, -10],
            Extrapolation.CLAMP
        );
        return {
            opacity,
            transform: [{ translateY }],
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Sabit Header */}
            <View style={[styles.fixedHeader, { backgroundColor: theme.background }]} pointerEvents="box-none">
                <Animated.Text
                    style={[styles.centeredHeaderTitle, { color: theme.text }, centeredHeaderTitleStyle]}
                    numberOfLines={1}
                >
                    Ayarlar
                </Animated.Text>
            </View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {/* Sayfa İçi Büyük Başlık */}
                <Animated.View style={[styles.bigTitleContainer, bigTitleStyle]}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Ayarlar</Text>
                </Animated.View>

                <View style={styles.section}>
                    <SectionHeader title="Görünüm ve Yapay Zeka Şef" />
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <SettingItem
                            icon="moon"
                            title="Karanlık Mod"
                            subtitle={isDarkMode ? "Açık" : "Kapalı"}
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="robot"
                            title="Yapay Zeka Şef Seviyesi"
                            subtitle={currentLevelLabel}
                            type="button"
                            onPress={() => setLevelModalVisible(true)}
                            iconColor="#10b981"
                        />
                    </View>

                    <SectionHeader title="Pişirme Deneyimi" />
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <SettingItem
                            icon="human-handsup"
                            iconType="material"
                            title="Temassız Kontrol"
                            subtitle="Sensör ve sallama hareketleri ile adım geçme"
                            value={gestureControl}
                            onValueChange={handleGestureToggle}
                            iconColor="#ec4899"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="tune"
                            iconType="material"
                            title="Hassasiyet Ayarları"
                            subtitle={currentSensitivityLabel}
                            type="button"
                            onPress={() => setSensitivityModalVisible(true)}
                            iconColor="#8b5cf6"
                        />
                    </View>

                    <SectionHeader title="Destek ve Hakkında" />
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <SettingItem
                            icon="question-circle"
                            title="Yardım Merkezi"
                            subtitle="Sıkça sorulan sorular ve kullanım ipuçları"
                            type="button"
                            onPress={() => navigation.navigate('HelpCenter')}
                            iconColor="#737373"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="info-circle"
                            title="Uygulama Hakkında"
                            subtitle="Sürüm ve özellik bilgileri"
                            type="button"
                            onPress={() => navigation.navigate('AboutApp')}
                            iconColor="#737373"
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* Hassasiyet Ayarları Modalı */}
            <Modal visible={sensitivityModalVisible} transparent animationType="fade" onRequestClose={() => setSensitivityModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setSensitivityModalVisible(false)} />
                    <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Sensör Hassasiyeti</Text>
                        <Text style={[styles.modalSub, { color: theme.secondaryText }]}>
                            Tarif adımlarında telefonu sallama ve el sensörü tepki eşiği:
                        </Text>
                        {SENSITIVITY_OPTIONS.map(opt => {
                            const selected = sensitivity === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.optionCard,
                                        { backgroundColor: theme.card, borderColor: selected ? '#ff7043' : theme.border }
                                    ]}
                                    onPress={() => handleSensitivitySelect(opt.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionLabel, { color: selected ? '#ff7043' : theme.text }]}>{opt.label}</Text>
                                        <Text style={[styles.optionDesc, { color: theme.secondaryText }]}>{opt.desc}</Text>
                                    </View>
                                    {selected && <FontAwesome5 name="check-circle" size={18} color="#ff7043" solid />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>

            {/* Şef Seviyesi Modalı */}
            <Modal visible={levelModalVisible} transparent animationType="fade" onRequestClose={() => setLevelModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={() => setLevelModalVisible(false)} />
                    <View style={[styles.modalBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Yapay Zeka Şef Seviyesi</Text>
                        <Text style={[styles.modalSub, { color: theme.secondaryText }]}>
                            Üretilen tariflerin anlatım dili ve detay seviyesi:
                        </Text>
                        {COOKING_LEVEL_OPTIONS.map(opt => {
                            const selected = cookingLevel === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.optionCard,
                                        { backgroundColor: theme.card, borderColor: selected ? '#ff7043' : theme.border }
                                    ]}
                                    onPress={() => handleCookingLevelSelect(opt.id)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionLabel, { color: selected ? '#ff7043' : theme.text }]}>{opt.label}</Text>
                                        <Text style={[styles.optionDesc, { color: theme.secondaryText }]}>{opt.desc}</Text>
                                    </View>
                                    {selected && <FontAwesome5 name="check-circle" size={18} color="#ff7043" solid />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 104,
        paddingBottom: 40,
    },
    fixedHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 50,
        height: 98,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        zIndex: 10,
    },
    centeredHeaderTitle: {
        fontSize: 18,
        fontFamily: 'PoppinsBold',
        textAlign: 'center',
    },
    bigTitleContainer: {
        paddingTop: 4,
        paddingBottom: 20,
        paddingHorizontal: 4,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'PoppinsExtraBold',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 16,
        fontFamily: 'PoppinsExtraBold',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 24,
        padding: 8,
        marginBottom: 24,
        borderWidth: 0,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    settingTitle: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
    },
    settingSubtitle: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        padding: 24,
    },
    modalBox: {
        borderRadius: 24,
        padding: 22,
        borderWidth: 0,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsExtraBold',
        marginBottom: 6,
    },
    modalSub: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        marginBottom: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        borderWidth: 0,
        marginBottom: 10,
    },
    optionLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsBold',
        marginBottom: 3,
    },
    optionDesc: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        lineHeight: 17,
    },
});

export default SettingsScreen;
