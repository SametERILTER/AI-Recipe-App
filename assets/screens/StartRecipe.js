import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Image,
    Modal,
    Alert
} from 'react-native';
import { Accelerometer, LightSensor } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { FontAwesome5, MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createAudioPlayer } from 'expo-audio';
import { Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';


const { width, height } = Dimensions.get('window');

function parseInlineBold(text, baseStyle) {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <Text style={baseStyle}>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <Text key={index} style={{ fontFamily: 'TextBold' }}>
                            {part.substring(2, part.length - 2)}
                        </Text>
                    );
                }
                return part;
            })}
        </Text>
    );
}

const StartRecipe = ({ route, navigation }) => {
    const { isDarkMode, theme } = useTheme();
    const { steps = [], tips = [], recipeName = 'Tarif', recipeImage, malzemeler, description, isRandom } = route.params;

    const [currentStep, setCurrentStep] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [gestureEnabled, setGestureEnabled] = useState(true);
    const toastOpacity = useRef(new Animated.Value(0)).current;
    const toastTranslateY = useRef(new Animated.Value(20)).current;

    // Animation values
    // Animation values
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const [subscription, setSubscription] = useState(null);
    const lastShakeTime = useRef(0);
    const handleNextStepRef = useRef(null);
    const lastLightState = useRef(false);
    // Müzik Player State
    const [musicModalVisible, setMusicModalVisible] = useState(false);
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentMusic, setCurrentMusic] = useState(null);
    const spinValue = useRef(new Animated.Value(0)).current;

    // Completion Animations
    const successScale = useRef(new Animated.Value(2)).current;
    const successTranslateY = useRef(new Animated.Value(height / 6)).current;
    const completionFade = useRef(new Animated.Value(0)).current;

    const musicList = [
        { id: 'calm', name: 'Sakin Mod', source: require('../musics/calm.mp3'), color: '#a5b4fc', icon: 'coffee' },
        { id: 'middleeast', name: 'Orta Doğu', source: require('../musics/middleeast.mp3'), color: '#ee7c18ff', icon: 'music' },
        { id: 'energetic', name: 'Hareketli', source: require('../musics/energetic.mp3'), color: '#fcd34d', icon: 'bolt' },
    ];

    useEffect(() => {
        // Unmount temizliği
        return () => {
            if (sound) {
                sound.remove();
            }
        };
    }, [sound]);

    const checkSaved = async () => {
        try {
            const existing = await AsyncStorage.getItem('saved_recipes');
            if (existing) {
                const recipes = JSON.parse(existing);
                const found = recipes.some(r => r.yemekAdi === recipeName);
                setIsSaved(found);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        checkSaved();
    }, [recipeName]);

    useFocusEffect(
        useCallback(() => {
            const loadSettings = async () => {
                try {
                    const val = await AsyncStorage.getItem('gesture_control');
                    const sens = (await AsyncStorage.getItem('gesture_sensitivity')) || 'normal';
                    if (val !== null) {
                        const enabled = JSON.parse(val);
                        setGestureEnabled(enabled);
                        if (!enabled) {
                            _unsubscribe();
                        } else {
                            _subscribe(sens);
                        }
                    } else {
                        setGestureEnabled(true);
                        _subscribe(sens);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            loadSettings();

            return () => {
                _unsubscribe();
            };
        }, [])
    );

    // Dönme Animasyonu
    useEffect(() => {
        if (isPlaying) {
            spinValue.setValue(0);
            Animated.loop(
                Animated.timing(spinValue, {
                    toValue: 1,
                    duration: 4000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            spinValue.setValue(0);
            spinValue.stopAnimation();
        }
    }, [isPlaying]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const playSound = async (musicItem) => {
        try {
            if (sound) {
                sound.remove();
            }
            const newSound = createAudioPlayer(musicItem.source);
            newSound.loop = true;
            setSound(newSound);
            setCurrentMusic(musicItem);
            setIsPlaying(true);
            setMusicModalVisible(false);
            newSound.play();
        } catch (error) {
            console.error("Müzik çalma hatası:", error);
        }
    };

    const stopSound = async () => {
        if (sound) {
            sound.pause(); // Pause instead of stop to resume later if needed, but user asked to stop
            setIsPlaying(false);
        }
    };

    const togglePlay = () => {
        if (isPlaying) {
            stopSound();
        } else {
            setMusicModalVisible(true);
        }
    };

    const playSuccessSound = async () => {
        try {
            // Arka plan müziğini durdur
            if (sound) {
                sound.pause();
                setIsPlaying(false);
            }

            // Ta-da sesini çal
            const successSound = createAudioPlayer(require('../musics/ta-da.mp3'));
            const sub = successSound.addListener('playbackStatusUpdate', (status) => {
                if (status.didJustFinish) {
                    sub.remove();
                    successSound.remove();
                }
            });
            successSound.play();
        } catch (error) {
            console.error("Başarı sesi çalma hatası:", error);
        }
    };

    // Keep the latest handleNextStep function in a ref
    useEffect(() => {
        handleNextStepRef.current = handleNextStep;
    });

    // Progress animation
    useEffect(() => {
        const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) : 0;
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 300,
            useNativeDriver: false,
        }).start();
    }, [currentStep, steps.length]);

    useEffect(() => {
        return () => _unsubscribe();
    }, []);

    const _subscribe = (sensitivityLevel = 'normal') => {
        const shakeThreshold = sensitivityLevel === 'high' ? 2.0 : sensitivityLevel === 'low' ? 3.6 : 2.8;
        const darkThreshold = sensitivityLevel === 'high' ? 35 : sensitivityLevel === 'low' ? 12 : 20;

        // Accelerometer (Sallama)
        const subAcc = Accelerometer.addListener(accelerometerData => {
            const { x, y, z } = accelerometerData;

            if (Math.abs(x) > shakeThreshold) {
                // Y'deki hareket (yukarı-aşağı) X'ten (sağa-sola) az olmalı ki çapraz algılamasın
                if (Math.abs(x) > Math.abs(y)) {
                    const now = Date.now();
                    if (now - lastShakeTime.current > 1000) {
                        console.log("Shake Detected (X-axis)!");
                        lastShakeTime.current = now;
                        if (handleNextStepRef.current) {
                            handleNextStepRef.current();
                        }
                    }
                }
            }
        });
        Accelerometer.setUpdateInterval(100);

        // Light Sensor (El Sallama / Kararma)
        let subLight = null;
        try {
            // LightSensor listener
            if (LightSensor) {
                LightSensor.setUpdateInterval(50); // Daha hızlı tepki
                subLight = LightSensor.addListener(data => {
                    const { illuminance } = data;

                    const DARK_THRESHOLD = darkThreshold;

                    if (illuminance < DARK_THRESHOLD) {
                        if (!lastLightState.current) {
                            lastLightState.current = true; // El koyuldu
                        }
                    } else {
                        // El çekildi (Aydınlık)
                        if (lastLightState.current && illuminance > (DARK_THRESHOLD + 5)) {
                            console.log("Hand Wave (Light) Triggered!");
                            const now = Date.now();
                            if (now - lastShakeTime.current > 1200) {
                                lastShakeTime.current = now;
                                if (handleNextStepRef.current) {
                                    handleNextStepRef.current();
                                }
                            }
                            lastLightState.current = false;
                        }
                    }
                });
            }
        } catch (e) {
            console.warn("Light sensor error:", e);
        }

        // Set both subscriptions
        setSubscription([subAcc, subLight].filter(Boolean));
    };

    const _unsubscribe = () => {
        if (Array.isArray(subscription)) {
            subscription.forEach(sub => sub && sub.remove && sub.remove());
        } else if (subscription && subscription.remove) {
            subscription.remove();
        } else if (subscription) {
            // If checking fails, try to unsubscribe strictly
        }
        setSubscription(null);
    };

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const stopSpeaking = async () => {
        Speech.stop();
        setIsSpeaking(false);
        // Ses okuma durduğunda müzik sesini geri yükselt
        if (sound) {
            sound.volume = 1.0;
        }
    };

    const speakCurrentStep = async () => {
        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        const stepText = steps[currentStep];
        if (!stepText) return;

        // Clean text if needed (e.g. remove markdown)
        const textToSpeak = stepText.replace(/\*\*/g, '').replace(/\[.*?\]/g, '');

        Speech.speak(textToSpeak, {
            language: 'tr', // Turkish
            pitch: 1.0,
            rate: 1.1,
            onStart: async () => {
                setIsSpeaking(true);
                // Sesli okuma başladığında müzik sesini kıs
                if (sound) {
                    sound.volume = 0.1;
                }
            },
            onDone: async () => {
                setIsSpeaking(false);
                // Sesli okuma bittiğinde müzik sesini geri yükselt
                if (sound) {
                    sound.volume = 1.0;
                }
            },
            onStopped: async () => {
                setIsSpeaking(false);
                // Sesli okuma durdurulduğunda müzik sesini geri yükselt
                if (sound) {
                    sound.volume = 1.0;
                }
            },
            onError: async () => {
                setIsSpeaking(false);
                // Hata durumunda da müzik sesini geri yükselt
                if (sound) {
                    sound.volume = 1.0;
                }
            },
        });
    };

    const handleNextStep = () => {
        stopSpeaking();
        if (currentStep < steps.length - 1) {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(prev => prev + 1);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        } else {
            setIsCompleted(true);
            playSuccessSound(); // Başarı sesini başlat
            // Kutlama animasyonu sekansı
            Animated.sequence([
                Animated.delay(1500), // İlk büyük animasyonun görülmesi için süre
                Animated.parallel([
                    Animated.spring(successScale, {
                        toValue: 1,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true
                    }),
                    Animated.spring(successTranslateY, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true
                    }),
                    Animated.timing(completionFade, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true
                    })
                ])
            ]).start();
        }
    };

    const handlePrevStep = () => {
        stopSpeaking();
        if (currentStep > 0) {
            // Fade out
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentStep(prev => prev - 1);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const triggerToast = () => {
        setShowToast(true);
        Animated.parallel([
            Animated.timing(toastOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(toastTranslateY, {
                toValue: 0,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start(() => {
            setTimeout(() => {
                Animated.parallel([
                    Animated.timing(toastOpacity, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(toastTranslateY, {
                        toValue: -20,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start(() => setShowToast(false));
            }, 2500);
        });
    };

    const handleSaveRecipe = async () => {
        if (!description || isSaved) return;
        const recipeToSave = {
            yemekAdi: recipeName,
            malzemeler: malzemeler || [],
            description: description,
            imageData: recipeImage,
            date: new Date().toISOString(),
            isRandom: isRandom || false,
        };
        try {
            const existing = await AsyncStorage.getItem('saved_recipes');
            let recipes = [];
            if (existing) {
                recipes = JSON.parse(existing);
            }
            recipes.push(recipeToSave);
            await AsyncStorage.setItem('saved_recipes', JSON.stringify(recipes));
            setIsSaved(true);
            triggerToast();
        } catch (e) {
            Alert.alert('Hata', 'Tarif kaydedilemedi.');
        }
    };

    if (isCompleted) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />


                <View style={[styles.completionContainer, { paddingTop: height / 10 }]}>
                    <Animated.View style={{
                        transform: [
                            { translateY: successTranslateY },
                            { scale: successScale }
                        ],
                        zIndex: 10
                    }}>
                        <LottieView
                            autoPlay
                            loop={false}
                            style={{
                                width: 220,
                                height: 220,
                            }}
                            source={require('../animations/Success.json')}
                        />
                    </Animated.View>

                    <Animated.View style={{ opacity: completionFade, alignItems: 'center', width: '100%' }}>
                        <Text style={[styles.congratsTitle, { color: theme.text }]}>Tebrikler!</Text>
                        <Text style={[styles.congratsSubtitle, { color: theme.secondaryText }]}>
                            Tarifi başarıyla tamamladınız.
                        </Text>


                        <View style={[styles.preparedFoodContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <Text style={[styles.preparedFoodLabel, { color: theme.secondaryText }]}>HAZIRLANAN YEMEK</Text>
                            <Text style={[styles.preparedFoodName, { color: theme.text }]}>{recipeName}</Text>
                        </View>


                        <Text style={[styles.cheerText, { color: theme.secondaryText }]}>
                            Eline sağlık, çok güzel gözüküyor!
                        </Text>

                        {/* Action Buttons */}
                        <View style={styles.completionActions}>
                            {description && !isSaved && (
                                <TouchableOpacity style={[styles.saveButton, { backgroundColor: isDarkMode ? theme.card : '#fff3f0', borderColor: isDarkMode ? theme.border : '#ffede6' }]} onPress={handleSaveRecipe}>
                                    <FontAwesome5 name="bookmark" size={18} color="#ff7043" />
                                    <Text style={[styles.saveButtonText, { color: '#ff7043' }]}>Tarifi Kaydet</Text>
                                </TouchableOpacity>
                            )}

                            {isSaved && (
                                <View style={styles.savedInfoBadge}>
                                    <FontAwesome5 name="check-circle" size={18} color="#10b981" />
                                    <Text style={styles.savedInfoText}>Tarif Kaydedildi</Text>
                                </View>
                            )}

                            <TouchableOpacity style={styles.homeActionButton} onPress={() => navigation.navigate('MainTabs')}>
                                <Octicons name="home" size={18} color="#fff" />
                                <Text style={styles.homeActionButtonText}>Ana Sayfa</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                <Animated.View style={{ opacity: completionFade, position: 'absolute', bottom: 0, width: '100%' }}>
                    <LinearGradient
                        colors={['transparent', theme.background]}
                        style={styles.bottomGradientCompletion}
                        pointerEvents="none"
                    />
                </Animated.View>

                {/* Custom Toast */}
                {showToast && (
                    <Animated.View
                        style={[
                            styles.toastContainer,
                            {
                                opacity: toastOpacity,
                                transform: [{ translateY: toastTranslateY }]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.toastGradient}
                        >
                            <FontAwesome5 name="check-circle" size={18} color="#fff" />
                            <Text style={styles.toastText}>Tarif defterine kaydedildi!</Text>
                        </LinearGradient>
                    </Animated.View>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.closeButton, { backgroundColor: isDarkMode ? theme.card : '#f1f5f9' }]}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome5 name="times" size={20} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                    Adım {currentStep + 1} / {steps.length}
                </Text>

                {/* Müzik Butonu */}
                <TouchableOpacity
                    style={[styles.musicButton, isPlaying && styles.musicButtonActive, !isPlaying && { backgroundColor: isDarkMode ? theme.card : '#f1f5f9' }]}
                    onPress={togglePlay}
                >
                    <Animated.View style={{ transform: [{ rotate: isPlaying ? spin : '0deg' }] }}>
                        <MaterialIcons name="library-music" size={18} color={isPlaying ? "#fff" : "#ff7043"} />
                    </Animated.View>
                    <Text style={[styles.musicButtonText, isPlaying ? { color: '#fff' } : { color: theme.text }]}>
                        {isPlaying ? currentMusic?.name : "Müzik"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}>
                <Animated.View

                    style={[
                        styles.progressBar,
                        {
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            })
                        }
                    ]}
                />
            </View>

            {/* Sensor Info Trigger */}
            <TouchableOpacity
                style={[styles.sensorInfoButton, { backgroundColor: isDarkMode ? theme.card : '#f8fafc', borderColor: theme.border }, !gestureEnabled && { borderColor: '#ef444430' }]}
                onPress={() => setInfoModalVisible(true)}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons
                    name={gestureEnabled ? "cellphone-nfc" : "cellphone-off"}
                    size={16}
                    color={gestureEnabled ? "#94a3b8" : "#ef4444"}
                    style={{ marginRight: 6 }}
                />
                <Text style={[styles.sensorInfoText, { color: gestureEnabled ? theme.secondaryText : "#ef4444" }]} numberOfLines={1}>
                    {gestureEnabled
                        ? "Sonraki adım için telefonu salla veya elini yaklaştır"
                        : "Temassız Kontrol Kapalı - Ayarlardan Açabilirsiniz"}
                </Text>
                <View style={[styles.infoBadge, !gestureEnabled && { backgroundColor: '#ef4444' }]}>
                    <FontAwesome5 name={gestureEnabled ? "question" : "exclamation"} size={8} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* Content */}
            <View style={styles.contentContainer}>
                <Animated.View
                    style={[
                        styles.stepCard,
                        {
                            backgroundColor: theme.card,
                            borderColor: theme.border,
                            opacity: fadeAnim
                        }
                    ]}
                >
                    <View style={styles.stepHeader}>

                        <View style={styles.stepBadge}>
                            <Text style={styles.stepBadgeText}>
                                {currentStep + 1}
                            </Text>
                        </View>
                        <Text style={styles.stepLabel}>ADIM</Text>

                        <TouchableOpacity
                            style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
                            onPress={speakCurrentStep}
                        >
                            <FontAwesome5
                                name={isSpeaking ? "stop" : "volume-up"}
                                size={14}
                                color="#fff"
                            />
                            <Text style={styles.speakButtonText}>
                                {isSpeaking ? "Durdur" : "Sesli Oku"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                        {(() => {
                            const stepText = steps[currentStep];
                            let tip = null;
                            let mainText = stepText;

                            // Robust search for Chef's Tip marker
                            const markerRegex = /(\[|\*\*)?\s*Şefin Tavsiyesi:/i;
                            const match = stepText.match(markerRegex);

                            if (match) {
                                const markerIndex = match.index;
                                mainText = stepText.substring(0, markerIndex).trim();

                                let rawTip = stepText.substring(markerIndex);
                                tip = rawTip
                                    .replace(/^(\[|\*\*)?\s*Şefin Tavsiyesi:?\s*(\*\*)?\s*/i, '')
                                    .replace(/(\]|\*\*)\s*$/, '')
                                    .trim();
                            }

                            return (
                                <>
                                    {(() => {
                                        // Mutfak terimi tespiti için regex
                                        const termRegex = /(\(?\*\*Temel Mutfak Terimi:?\s*(.*?)\*\*\)?|\(Temel Mutfak Terimi:?\s*(.*?)\)|Temel Mutfak Terimi:?\s*(.*))/i;
                                        const termMatch = mainText.match(termRegex);

                                        let cleanMainText = mainText;
                                        let termContent = null;

                                        if (termMatch) {
                                            cleanMainText = mainText.replace(termMatch[0], '').trim();
                                            termContent = termMatch[2] || termMatch[3] || termMatch[4];
                                            if (cleanMainText.endsWith('(')) cleanMainText = cleanMainText.slice(0, -1).trim();
                                        }

                                        return (
                                            <View>
                                                {cleanMainText.length > 0 && parseInlineBold(cleanMainText, [styles.stepTextContent, { color: theme.text }])}
                                                {termContent && (
                                                    <View style={[styles.termBox, { backgroundColor: isDarkMode ? '#0ea5e915' : '#f0f9ff' }]}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                                                            <FontAwesome5 name="info-circle" size={12} color="#0ea5e9" style={{ marginRight: 6 }} />
                                                            <Text style={[styles.termTitle, { color: isDarkMode ? '#38bdf8' : '#0369a1' }]}>Mutfak Sözlüğü</Text>
                                                        </View>
                                                        <Text style={[styles.termText, { color: isDarkMode ? '#7dd3fc' : '#075985' }]}>{termContent}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })()}
                                    {tip && (
                                        <View style={[styles.chefTipContainer, { backgroundColor: isDarkMode ? '#f59e0b15' : '#fff7ed' }]}>
                                            <View style={styles.chefTipHeader}>
                                                <MaterialCommunityIcons name="chef-hat" size={14} color="#f59e0b" style={{ marginRight: 8 }} />
                                                <Text style={[styles.chefTipTitle, { color: isDarkMode ? '#fbbf24' : '#9a3412' }]}>Şefin Notu</Text>
                                            </View>
                                            <Text style={[styles.chefTipText, { color: isDarkMode ? '#fcd34d' : '#9a3412' }]}>{tip}</Text>
                                        </View>
                                    )}
                                </>
                            );
                        })()}
                    </ScrollView>
                </Animated.View>
            </View>

            {/* Controls */}
            <View style={[styles.controls, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                <TouchableOpacity
                    style={[styles.controlButton, styles.prevButton, { backgroundColor: isDarkMode ? theme.background : '#f1f5f9' }, currentStep === 0 && styles.disabledButton]}
                    onPress={handlePrevStep}
                    disabled={currentStep === 0}
                >
                    <FontAwesome5 name="arrow-left" size={20} color={currentStep === 0 ? (isDarkMode ? '#334155' : "#cbd5e1") : theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.controlButton, styles.nextButton]}
                    onPress={handleNextStep}
                >
                    <Text style={styles.nextButtonText}>
                        {currentStep === steps.length - 1 ? 'Tarifi Bitir' : 'Sonraki Adım'}
                    </Text>
                    <FontAwesome5
                        name={currentStep === steps.length - 1 ? "check" : "arrow-right"}
                        size={16}
                        color="#fff"
                        style={{ marginLeft: 8 }}
                    />
                </TouchableOpacity>
            </View>
            {/* Info Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={infoModalVisible}
                onRequestClose={() => setInfoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setInfoModalVisible(false)}
                        >
                            <FontAwesome5 name="times" size={20} color={theme.secondaryText} />
                        </TouchableOpacity>

                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            {gestureEnabled ? "Temassız Kontrol" : "Ayar Kapalı"}
                        </Text>
                        <Text style={[styles.modalSubtitle, { color: theme.secondaryText }]}>
                            {gestureEnabled ? "Yemek yaparken elleriniz kirlenmesin!" : "Temassız kontrol şu an devre dışı."}
                        </Text>

                        {!gestureEnabled ? (
                            <View style={{ width: '100%', alignItems: 'center', marginTop: 20 }}>
                                <View style={[styles.infoIconBox, { backgroundColor: '#ef444415', marginBottom: 20, marginRight: 0 }]}>
                                    <MaterialCommunityIcons name="cellphone-off" size={48} color="#ef4444" />
                                </View>
                                <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 32, fontSize: 16, fontFamily: 'TextNormal', lineHeight: 24 }}>
                                    Sensör ve sallama hareketleri ile adım geçişi yapmak için ayarlardan bu özelliği aktifleştirebilirsiniz.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.homeActionButton, { width: '100%', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
                                    onPress={() => {
                                        setInfoModalVisible(false);
                                        navigation.navigate('MainTabs', { screen: 'Ayarlar' });
                                    }}
                                >
                                    <MaterialIcons name="settings" size={20} color="#fff" />
                                    <Text style={styles.homeActionButtonText}>Ayarlara Git</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <View style={styles.infoRow}>
                                    <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#ff704320' : '#fff3f0' }]}>
                                        <MaterialCommunityIcons name="vibrate" size={32} color="#ff7043" />
                                    </View>
                                    <View style={styles.infoTextBox}>
                                        <Text style={[styles.infoTopic, { color: theme.text }]}>Telefonu Salla</Text>
                                        <Text style={[styles.infoDesc, { color: theme.secondaryText }]}>
                                            Bir sonraki adıma geçmek için telefonunuzu hafifçe sallayın.
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                                <View style={styles.infoRow}>
                                    <View style={[styles.infoIconBox, { backgroundColor: isDarkMode ? '#4338ca20' : '#e0e7ff' }]}>
                                        <MaterialCommunityIcons name="hand-wave" size={32} color="#6366f1" />
                                    </View>
                                    <View style={styles.infoTextBox}>
                                        <Text style={[styles.infoTopic, { color: theme.text }]}>Eline Sensöre Yaklaştır</Text>
                                        <Text style={[styles.infoDesc, { color: theme.secondaryText }]}>
                                            Elinizi telefonun üst kısmındaki (ahize yanı) sensöre yaklaştırıp çekin.
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.gotItButton}
                            onPress={() => setInfoModalVisible(false)}
                        >
                            <Text style={styles.gotItButtonText}>Anladım</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Müzik Seçim Modalı */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={musicModalVisible}
                onRequestClose={() => setMusicModalVisible(false)}
            >
                <View style={styles.musicModalOverlay}>
                    <View style={styles.musicModalContent}>
                        <View style={styles.modalHeaderRow}>
                            <View>
                                <Text style={styles.musicModalTitle}>Mutfak Radyosu 📻</Text>
                                <Text style={styles.musicModalSubtitle}>Moduna göre müzik seç</Text>
                            </View>
                            <TouchableOpacity style={styles.modalCloseButtonSmall} onPress={() => setMusicModalVisible(false)}>
                                <FontAwesome5 name="times" size={16} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 500 }}
                            contentContainerStyle={styles.musicListContainer}
                        >
                            {musicList.map((item) => {
                                const isSelected = currentMusic?.id === item.id;
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.musicCard,
                                            { backgroundColor: item.color },
                                            isSelected && styles.musicCardSelected
                                        ]}
                                        onPress={() => playSound(item)}
                                        activeOpacity={0.9}
                                    >
                                        <View style={styles.musicIconCircle}>
                                            <FontAwesome5 name={item.icon} size={24} color="#fff" />
                                        </View>
                                        <Text style={styles.musicCardTitle}>{item.name}</Text>

                                        {isSelected && (
                                            <View style={styles.playingBadge}>
                                                <FontAwesome5 name="volume-up" size={12} color={item.color} />
                                                <Text style={{ fontSize: 10, fontFamily: 'TextBold', color: item.color, marginLeft: 4 }}>Çaliyor</Text>
                                            </View>
                                        )}

                                        {!isSelected && (
                                            <View style={styles.playBadge}>
                                                <FontAwesome5 name="play" size={10} color={item.color} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {isPlaying && (
                            <TouchableOpacity style={styles.stopMusicCheckButton} onPress={stopSound}>
                                <FontAwesome5 name="stop" size={14} color="#ef4444" style={{ marginRight: 8 }} />
                                <Text style={{ fontFamily: 'TextBold', color: '#ef4444' }}>Müziği Durdur</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        paddingTop: 44,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'TextBold',
        color: '#334155',
    },
    progressContainer: {
        height: 6,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 24,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 32,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#ff7043',
        borderRadius: 3,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    stepCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        // Less shadow, border style
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'flex-start', // Left align
        justifyContent: 'flex-start',
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    stepBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ff7043',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#ff7043',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    stepBadgeText: {
        color: '#fff',
        fontFamily: 'TextBold',
        fontSize: 18,
    },
    stepLabel: {
        fontSize: 14,
        fontFamily: 'TextBold',
        color: '#94a3b8',
        letterSpacing: 1.5,
    },
    stepTextContent: {
        fontSize: 22,
        fontFamily: 'TextBold',
        color: '#2a3340ff',
        textAlign: 'left',
        lineHeight: 34,
    },
    controls: {
        flexDirection: 'row',
        padding: 24,
        paddingBottom: 80,
        gap: 16,
    },
    controlButton: {
        height: 64,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    prevButton: {
        width: 64,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#ff7043',
        shadowColor: '#ff7043',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    nextButtonText: {
        fontSize: 18,
        fontFamily: 'TextBold',
        color: '#fff',
    },
    disabledButton: {
        opacity: 0.5,
    },

    // Completion Styles
    completionContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    congratsIconContainer: {
        marginBottom: 24,
        transform: [{ scale: 1.2 }],
    },
    congratsTitle: {
        fontSize: 32,
        fontFamily: 'TextExtraBold',
        color: '#1e293b',
        marginBottom: 12,
        textAlign: 'center',
    },
    congratsSubtitle: {
        fontSize: 18,
        color: '#64748b',
        fontFamily: 'TextNormal',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 28,
    },
    tipsContainer: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        maxHeight: 250,
    },
    tipsTitle: {
        fontSize: 18,
        fontFamily: 'TextBold',
        color: '#1e293b',
        marginBottom: 16,
    },
    tipsList: {
        maxHeight: 200,
    },
    tipItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    tipDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#f59e0b',
        marginTop: 8,
        marginRight: 12,
    },
    tipText: {
        fontSize: 15,
        color: '#2a3340ff',
        fontFamily: 'TextNormal',
        lineHeight: 22,
        flex: 1,
    },
    finishButton: {
        width: '100%',
        height: 64,
        backgroundColor: '#ff7043',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff7043',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
    },
    finishButtonText: {
        fontSize: 18,
        fontFamily: 'TextBold',
        color: '#fff',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    bottomGradientCompletion: {
        height: 100,
        width: '100%',
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
        fontFamily: 'TextBold',
        color: '#1e293b',
    },
    chefTipText: {
        fontSize: 15,
        fontFamily: 'TextNormal',
        color: '#2a3340ff',
        lineHeight: 24,
    },
    // New Completed Styles
    preparedFoodContainer: {
        width: '100%',
        backgroundColor: '#fff7ed',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#fed7aa',
    },
    preparedFoodLabel: {
        fontSize: 12,
        fontFamily: 'TextBold',
        color: '#f97316',
        marginBottom: 8,
        letterSpacing: 1.5,
    },
    preparedFoodName: {
        fontSize: 24,
        fontFamily: 'TextExtraBold',
        color: '#c2410c',
        textAlign: 'center',
        lineHeight: 32,
    },
    cheerText: {
        fontSize: 18,
        fontFamily: 'TextNormal',
        color: '#475569',
        marginTop: 8,
        textAlign: 'center',
    },
    completionActions: {
        width: '100%',
        marginTop: 32,
        gap: 16,
    },
    saveButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ff7043',
        gap: 12,
    },
    saveButtonText: {
        fontSize: 16,
        fontFamily: 'TextBold',
        color: '#ff7043',
    },
    homeActionButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#ff7043',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#ff7043',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 8,
        gap: 12,
    },
    // Music Player Styles
    musicButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: '#ff7043',
        gap: 8,
        shadowColor: '#ff7043',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    musicButtonActive: {
        backgroundColor: '#ff7043',
        borderColor: '#ff7043',
    },
    musicButtonText: {
        fontSize: 14,
        fontFamily: 'TextBold',
        color: '#ff7043',
    },
    musicModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        width: '100%',
        minHeight: '70%', // Uzunluğu artırıldı
    },
    musicModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    musicModalTitle: {
        fontSize: 24,
        fontFamily: 'TextExtraBold',
        color: '#1e293b',
        marginBottom: 4,
    },
    musicModalSubtitle: {
        fontSize: 15,
        fontFamily: 'TextMedium',
        color: '#64748b',
    },
    modalCloseButtonSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    musicListContainer: {
        paddingBottom: 20,
    },
    musicCard: {
        width: '100%',
        height: 100,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row', // Alt alta listeleme için daha iyi görünüm
        alignItems: 'center',
    },
    musicCardSelected: {
        borderWidth: 3,
        borderColor: '#000',
    },
    musicIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    musicCardTitle: {
        fontSize: 18,
        fontFamily: 'TextExtraBold',
        color: '#fff',
        marginLeft: 16,
        flex: 1,
    },
    playBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    stopMusicCheckButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff1f2',
        paddingVertical: 16,
        borderRadius: 20,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#fecaca',
    },

    homeActionButtonText: {
        fontSize: 16,
        fontFamily: 'TextBold',
        color: '#fff',
    },
    speakButton: {
        marginLeft: 'auto',
        height: 36,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    speakButtonActive: {
        width: 'auto',
        paddingHorizontal: 16,
        backgroundColor: '#ef4444',
        gap: 8,
    },
    speakButtonText: {
        fontSize: 12,
        fontFamily: 'TextBold',
        color: '#fff',
    },
    // Sensor Info & Modal Styles
    sensorInfoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sensorInfoText: {
        fontSize: 11,
        fontFamily: 'TextMedium',
        color: '#94a3b8',
        marginRight: 6,
    },
    infoBadge: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'TextBold',
        color: '#1e293b',
        marginBottom: 8,
        marginTop: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: 'TextMedium',
        color: '#64748b',
        marginBottom: 32,
        textAlign: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    infoIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#fff7ed',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoTextBox: {
        flex: 1,
    },
    infoTopic: {
        fontSize: 16,
        fontFamily: 'TextBold',
        color: '#1e293b',
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 14,
        fontFamily: 'TextRegular',
        color: '#64748b',
        lineHeight: 20,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 20,
    },
    gotItButton: {
        marginTop: 24,
        width: '100%',
        backgroundColor: '#ff7043',
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    gotItButtonText: {
        fontSize: 16,
        fontFamily: 'TextBold',
        color: '#fff',
    },
    termBox: {
        marginTop: 12,
        backgroundColor: '#f0f9ff',
        padding: 16,
        borderRadius: 20,
    },
    termTitle: {
        fontSize: 12,
        fontFamily: 'TextBold',
        color: '#0369a1',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    termText: {
        fontSize: 14,
        color: '#075985',
        fontFamily: 'TextNormal',
        lineHeight: 20,
    },
    savedInfoBadge: {
        width: '100%',
        height: 56,
        backgroundColor: '#f0fdf4',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#10b981',
        gap: 12,
    },
    savedInfoText: {
        fontSize: 16,
        fontFamily: 'TextBold',
        color: '#10b981',
    },
    toastContainer: {
        position: 'absolute',
        top: 60,
        left: 24,
        right: 24,
        zIndex: 9999,
        alignItems: 'center',
    },
    toastGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 20,
        gap: 12,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    toastText: {
        color: '#fff',
        fontFamily: 'TextBold',
        fontSize: 15,
    },
});

export default StartRecipe;
