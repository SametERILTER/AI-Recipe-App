import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

import { useTheme } from '../context/ThemeContext';

const AboutAppScreen = ({ navigation }) => {
    const { isDarkMode, theme } = useTheme();
    const aiChef = {
        icon: "robot",
        title: "Yapay Zeka Şefi",
        desc: "Elinizdeki malzemeleri seçin, yapay zeka size en uygun tarifi anında hazırlasın. Mutfaktaki en zeki yardımcınız!",
        color: "#8b5cf6"
    };

    const features = [
        {
            icon: "calendar-day",
            title: "Günün Menüsü",
            desc: "Hergün özenle seçilmiş dengeli menüler.",
            color: "#ff7043"
        },
        {
            icon: "hand-paper",
            title: "Temassız Pişirme",
            desc: "Sensör teknolojisi ile eller kirlenmeden yönetim.",
            color: "#6366f1"
        },
        {
            icon: "music",
            title: "Mutfak Radyosu",
            desc: "Pişirme esnasında tematik müzik keyfi.",
            color: "#f59e0b"
        },
        {
            icon: "utensils",
            title: "Binlerce Tarif",
            desc: "Gelenekselden moderne dev şef arşivi.",
            color: "#ec4899"
        },
        {
            icon: "bookmark",
            title: "Kendi Defterin",
            desc: "Sevdiğin tariflerle kendi kitabını oluştur.",
            color: "#10b981"
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: theme.card }]}
                >
                    <FontAwesome5 name="arrow-left" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Hakkımızda</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <LinearGradient colors={['#ff7043', '#ff8a65']} style={styles.logoBadge}>
                        <FontAwesome5 name="concierge-bell" size={35} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.appName, { color: theme.text }]}>Mutfak Asistanı</Text>
                    <Text style={[styles.appTagline, { color: theme.secondaryText }]}>Mutfaktaki teknolojik yardımcın</Text>
                </View>

                {/* Simplified Featured AI Chef Section */}
                <View style={styles.featuredSection}>
                    <View style={[styles.aiCardSimple, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={[styles.aiIconBox, { backgroundColor: aiChef.color + '15' }]}>
                            <FontAwesome5 name="robot" size={28} color={aiChef.color} />
                        </View>
                        <View style={styles.aiContent}>
                            <View style={styles.aiHeaderRow}>
                                <Text style={[styles.aiTitleSimple, { color: theme.text }]}>{aiChef.title}</Text>
                            </View>
                            <Text style={[styles.aiDescSimple, { color: theme.text }]}>{aiChef.desc}</Text>
                        </View>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Diğer Özellikler</Text>

                <View style={styles.featuresList}>
                    {features.map((feature, index) => (
                        <View key={index} style={[styles.featureRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={[styles.rowIconBox, { backgroundColor: feature.color + '15' }]}>
                                <FontAwesome5 name={feature.icon} size={18} color={feature.color} />
                            </View>
                            <View style={styles.rowTextContainer}>
                                <Text style={[styles.rowTitle, { color: theme.text }]}>{feature.title}</Text>
                                <Text style={[styles.rowDesc, { color: theme.secondaryText }]}>{feature.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="star-face" size={24} color="#ff7043" />
                        <View style={styles.infoTextContainer}>
                            <Text style={[styles.infoHeading, { color: theme.text }]}>Akıllı Mutfak</Text>
                            <Text style={[styles.infoSubText, { color: theme.secondaryText }]}>Tariflerimiz modern algoritmalarla optimize edilir.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.secondaryText }]}>Afiyetle kalın!</Text>
                    <Text style={[styles.versionText, { color: theme.secondaryText }]}>v1.2.0 • 2024</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 50 },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    headerTitle: { fontSize: 22, fontFamily: 'TextExtraBold', marginLeft: 15 },
    content: { paddingBottom: 40 },
    heroSection: { alignItems: 'center', marginVertical: 20 },
    logoBadge: { width: 64, height: 64, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    appName: { fontSize: 24, fontFamily: 'TextExtraBold' },
    appTagline: { fontSize: 13, fontFamily: 'TextNormal' },

    featuredSection: { paddingHorizontal: 20, marginBottom: 25 },
    aiCardSimple: {
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'flex-start'
    },
    aiIconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    aiContent: { flex: 1, marginLeft: 16 },
    aiHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    aiTitleSimple: { fontSize: 19, fontFamily: 'TextExtraBold' },
    aiDescSimple: { fontSize: 14, fontFamily: 'TextNormal', lineHeight: 22 },

    sectionTitle: { fontSize: 17, fontFamily: 'TextExtraBold', marginBottom: 15, marginLeft: 20 },
    featuresList: { paddingHorizontal: 20, gap: 10 },
    featureRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1 },
    rowIconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    rowTextContainer: { marginLeft: 14, flex: 1 },
    rowTitle: { fontSize: 15, fontFamily: 'TextExtraBold', marginBottom: 2 },
    rowDesc: { fontSize: 12, fontFamily: 'TextNormal' },

    infoBox: { margin: 20, padding: 20, borderRadius: 24, borderWidth: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    infoTextContainer: { marginLeft: 15, flex: 1 },
    infoHeading: { fontSize: 16, fontFamily: 'TextBold' },
    infoSubText: { fontSize: 13, fontFamily: 'TextNormal', marginTop: 2 },

    footer: { marginTop: 20, alignItems: 'center' },
    footerText: { fontSize: 15, fontFamily: 'TextExtraBold' },
    versionText: { fontSize: 11, marginTop: 4 }
});

export default AboutAppScreen;
