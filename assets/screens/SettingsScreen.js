import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Switch,
    Dimensions,
} from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Octicons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
    const navigation = useNavigation();
    const { isDarkMode, toggleTheme, theme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [gestureControl, setGestureControl] = useState(true);

    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const val = await AsyncStorage.getItem('gesture_control');
            if (val !== null) {
                setGestureControl(JSON.parse(val));
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
                ) : iconType === 'ionicons' ? (
                    <Ionicons name={icon} size={22} color={iconColor} />
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
                    trackColor={{ false: isDarkMode ? '#334155' : '#e2e8f0', true: '#ff704330' }}
                    thumbColor={value ? '#ff7043' : (isDarkMode ? '#94a3b8' : '#f1f5f9')}
                />
            ) : (
                <Octicons name="chevron-right" size={16} color={theme.secondaryText} />
            )}
        </TouchableOpacity>
    );

    const SectionHeader = ({ title }) => (
        <Text style={[styles.sectionHeader, { color: isDarkMode ? '#ff7043' : '#475569' }]}>{title}</Text>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Sabit Header */}
            <View style={[styles.fixedHeader, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Ayarlar</Text>
                <Text style={[styles.headerSubtitle, { color: theme.secondaryText }]}>Uygulama deneyimini özelleştir</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Settings Sections */}
                <View style={styles.section}>
                    <SectionHeader title="Görünüm ve Bildirimler" />
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <SettingItem
                            icon="moon"
                            title="Karanlık Mod"
                            subtitle="Sisteme göre uyarla"
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="notifications"
                            iconType="ionicons"
                            title="Bildirimler"
                            subtitle="Yeni tarifler ve hatırlatıcılar"
                            value={notifications}
                            onValueChange={setNotifications}
                            iconColor="#6366f1"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="language"
                            iconType="ionicons"
                            title="Dil"
                            subtitle="Türkçe (Türkiye)"
                            type="button"
                            iconColor="#10b981"
                        />
                    </View>

                    <SectionHeader title="Pişirme Deneyimi" />
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <SettingItem
                            icon="human-handsup"
                            iconType="material"
                            title="Temassız Kontrol"
                            subtitle="Sensör ve sallama hareketleri"
                            value={gestureControl}
                            onValueChange={handleGestureToggle}
                            iconColor="#ec4899"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="tune"
                            iconType="material"
                            title="Hassasiyet Ayarları"
                            subtitle="Sensör tepki süresini ayarla"
                            type="button"
                            iconColor="#8b5cf6"
                        />
                    </View>

                    <SectionHeader title="Destek ve Hakkında" />
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <SettingItem
                            icon="question-circle"
                            title="Yardım Merkezi"
                            type="button"
                            onPress={() => navigation.navigate('HelpCenter')}
                            iconColor="#64748b"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                        <SettingItem
                            icon="info-circle"
                            title="Uygulama Hakkında"
                            type="button"
                            onPress={() => navigation.navigate('AboutApp')}
                            iconColor="#64748b"
                        />
                        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    </View>
                </View>

                <Text style={[styles.versionText, { color: theme.secondaryText }]}>Versiyon 1.2.0 • Love from Kitchen</Text>
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    fixedHeader: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontFamily: 'TextExtraBold',
    },
    headerSubtitle: {
        fontSize: 15,
        fontFamily: 'TextNormal',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 16,
        fontFamily: 'TextExtraBold',
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 24,
        padding: 8,
        marginBottom: 24,
        borderWidth: 1,
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
        fontFamily: 'TextBold',
    },
    settingSubtitle: {
        fontSize: 12,
        fontFamily: 'TextNormal',
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 12,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'TextNormal',
        marginBottom: 20,
    }
});

export default SettingsScreen;
