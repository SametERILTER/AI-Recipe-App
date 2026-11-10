import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/ThemeContext';

const HelpCenterScreen = ({ navigation }) => {
    const { isDarkMode, theme } = useTheme();
    const faqs = [
        {
            question: "Yemek tariflerini nasıl kaydedebilirim?",
            answer: "Tarif detay sayfasındaki sağ üstte bulunan kaydet (bookmark) ikonuna basarak veya bir tarifi pişirmeyi bitirdiğinizde 'Tarifi Kaydet' butonuna basarak kaydedebilirsiniz."
        },
        {
            question: "Temassız kontrol (Sensör) nasıl çalışır?",
            answer: "Yemek yaparken elleriniz kirlenmesin diye telefonunuzun üst kısmındaki sensöre elinizi yaklaştırarak veya telefonu hafifçe sallayarak bir sonraki adıma geçebilirsiniz."
        },
        {
            question: "Mutfak radyosu ne işe yarar?",
            answer: "Tarifi pişirmeye başladığınızda, mutfaktaki modunuza göre arka planda sakin veya hareketli müzikler çalmanıza olanak tanır."
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Yardım Merkezi</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <LinearGradient colors={['#ff7043', '#ff8a65']} style={styles.contactCard}>
                    <FontAwesome5 name="headset" size={40} color="#fff" />
                    <Text style={styles.contactTitle}>Bize Ulaşın</Text>
                    <Text style={styles.contactSubtitle}>Sorularınız için e-posta gönderebilirsiniz</Text>
                    <TouchableOpacity
                        style={[styles.emailButton, { backgroundColor: theme.background === '#ffffff' ? '#ffffff' : 'rgba(255,255,255,0.2)' }]}
                        onPress={() => Linking.openURL('mailto:sametbilal34@gmail.com')}
                    >
                        <Text style={[styles.emailText, { color: theme.background === '#ffffff' ? '#ff7043' : '#ffffff' }]}>sametbilal34@gmail.com</Text>
                    </TouchableOpacity>
                </LinearGradient>

                <Text style={[styles.faqHeader, { color: theme.text }]}>Sıkça Sorulan Sorular</Text>

                {faqs.map((faq, index) => (
                    <View key={index} style={[styles.faqCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.questionRow}>
                            <MaterialIcons name="help-outline" size={20} color="#ff7043" />
                            <Text style={[styles.questionText, { color: theme.text }]}>{faq.question}</Text>
                        </View>
                        <Text style={[styles.answerText, { color: theme.secondaryText }]}>{faq.answer}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50 },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
    headerTitle: { fontSize: 22, fontFamily: 'TextExtraBold', marginLeft: 15 },
    content: { padding: 20 },
    contactCard: { padding: 30, borderRadius: 24, alignItems: 'center', marginBottom: 30 },
    contactTitle: { fontSize: 20, fontFamily: 'TextExtraBold', color: '#fff', marginTop: 15 },
    contactSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5, textAlign: 'center' },
    emailButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
    emailText: { fontFamily: 'TextBold' },
    faqHeader: { fontSize: 18, fontFamily: 'TextExtraBold', marginBottom: 15 },
    faqCard: { padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1 },
    questionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    questionText: { fontSize: 15, fontFamily: 'TextBold', marginLeft: 10, flex: 1 },
    answerText: { fontSize: 14, fontFamily: 'TextNormal', lineHeight: 22 }
});

export default HelpCenterScreen;
