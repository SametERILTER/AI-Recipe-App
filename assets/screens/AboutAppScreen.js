import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Linking,
    Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';

const GITHUB_URL = 'https://github.com/SametERILTER';

const AboutAppScreen = ({ navigation }) => {
    const { isDarkMode, theme } = useTheme();

    const handleOpenGithub = async () => {
        try {
            const supported = await Linking.canOpenURL(GITHUB_URL);
            if (supported) {
                await Linking.openURL(GITHUB_URL);
            } else {
                Alert.alert('Bağlantı Açılamadı', GITHUB_URL);
            }
        } catch (error) {
            Alert.alert('Hata', 'Bağlantı açılırken bir sorun oluştu.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                >
                    <FontAwesome5 name="arrow-left" size={18} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Uygulama Hakkında</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <LinearGradient colors={['#ff7043', '#ff8a65']} style={styles.logoBadge}>
                        <FontAwesome5 name="utensils" size={28} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.appName, { color: theme.text }]}>YemekTarif</Text>
                    <Text style={[styles.appVersion, { color: theme.secondaryText }]}>Sürüm 1.0.0</Text>
                </View>

                <Text style={[styles.sectionLabel, { color: isDarkMode ? '#ff7043' : '#525252' }]}>
                    Geliştirici
                </Text>

                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <View style={styles.devHeader}>
                        <View style={[styles.devAvatar, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff3f0' }]}>
                            <FontAwesome5 name="code" size={18} color="#ff7043" />
                        </View>
                        <View style={styles.devInfo}>
                            <Text style={[styles.devName, { color: theme.text }]}>Samet ERİLTER</Text>
                            <Text style={[styles.devHandle, { color: theme.secondaryText }]}>@SametERILTER</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />

                    <TouchableOpacity
                        style={[styles.githubButton, { backgroundColor: isDarkMode ? '#262626' : '#ffffff' }]}
                        onPress={handleOpenGithub}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.githubIconBox, { backgroundColor: isDarkMode ? '#f5f5f5' : '#171717' }]}>
                            <FontAwesome5 name="github" size={20} color={isDarkMode ? '#171717' : '#ffffff'} />
                        </View>
                        <View style={styles.githubTextContainer}>
                            <Text style={[styles.githubTitle, { color: theme.text }]}>GitHub Profilim</Text>
                            <Text style={styles.githubUrl} numberOfLines={1}>
                                {GITHUB_URL}
                            </Text>
                        </View>
                        <FontAwesome5 name="external-link-alt" size={14} color={theme.secondaryText} />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        paddingTop: 50,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'PoppinsExtraBold',
        marginLeft: 14,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 28,
    },
    logoBadge: {
        width: 64,
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    appName: {
        fontSize: 22,
        fontFamily: 'PoppinsExtraBold',
    },
    appVersion: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        marginTop: 2,
    },
    sectionLabel: {
        fontSize: 15,
        fontFamily: 'PoppinsExtraBold',
        marginBottom: 10,
        marginLeft: 4,
    },
    card: {
        borderRadius: 22,
        padding: 16,
        borderWidth: 0,
    },
    devHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    devAvatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    devInfo: {
        marginLeft: 14,
        flex: 1,
    },
    devName: {
        fontSize: 16,
        fontFamily: 'PoppinsBold',
    },
    devHandle: {
        fontSize: 13,
        fontFamily: 'PoppinsRegular',
        marginTop: 1,
    },
    divider: {
        height: 1,
        marginVertical: 14,
    },
    githubButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 0,
    },
    githubIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    githubTextContainer: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },
    githubTitle: {
        fontSize: 14,
        fontFamily: 'PoppinsBold',
    },
    githubUrl: {
        fontSize: 12,
        fontFamily: 'PoppinsRegular',
        color: '#ff7043',
        marginTop: 2,
    },
});

export default AboutAppScreen;
