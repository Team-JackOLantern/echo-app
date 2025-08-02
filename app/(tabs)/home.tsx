import { View, Pressable, Animated, Easing, StyleSheet, Text, Alert, Linking } from "react-native";
import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Audio } from 'expo-av';
import OffIcon from "@/assets/icons/off";
import MetricsCard from "@/components/MetricsCard";
import { StatusBar } from "expo-status-bar";

interface Ripple {
    id: number;
    scale: Animated.Value;
    opacity: Animated.Value;
}

interface DetectionData {
    text?: string;
    message?: string;
    detected?: boolean;
    patterns?: string[];
    pattern?: string;
    confidence?: number;
    energy?: number;
    type?: string;
}

const SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.replace('/ws', '').replace('wss://', 'https://').replace('ws://', 'http://') || process.env.EXPO_PUBLIC_SERVER_URL;
const WS_URL = process.env.EXPO_PUBLIC_SOCKET_URL?.replace('/ws', '') || process.env.EXPO_PUBLIC_SERVER_URL;
const USER_ID = "ae8fb765";

const Home = () => {
    const [isOn, setIsOn] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [recognizedText, setRecognizedText] = useState<string>("");
    const [detectionStatus, setDetectionStatus] = useState<'normal' | 'detected' | 'info'>('info');
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [, setLogs] = useState<string[]>([]);
    const insets = useSafeAreaInsets();

    const buttonScale = useRef(new Animated.Value(1)).current;
    const shadowAnim = useRef(new Animated.Value(1)).current;
    const outerColorAnim = useRef(new Animated.Value(0)).current;
    const middleColorAnim = useRef(new Animated.Value(0)).current;

    const wsRef = useRef<WebSocket | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);
    const audioTransmissionRef = useRef<number | null>(null);

    const addLog = useCallback((message: string, type: 'info' | 'detection' | 'error' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        setLogs(prev => [...prev.slice(-50), logMessage]);
    }, []);

    const startRecordingAPI = useCallback(async () => {
        if (!SERVER_URL) {
            addLog('서버 URL이 설정되지 않았습니다', 'error');
            return false;
        }

        try {
            const response = await fetch(`${SERVER_URL}/recording/on`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': USER_ID,
                },
            });

            if (response.ok) {
                addLog('🎤 녹음 시작 API 호출 성공');
                return true;
            } else {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
        } catch (error) {
            addLog('녹음 시작 API 오류: ' + (error as Error).message, 'error');
            return false;
        }
    }, [addLog]);

    const stopRecordingAPI = useCallback(async () => {
        if (!SERVER_URL) {
            addLog('서버 URL이 설정되지 않았습니다', 'error');
            return false;
        }

        try {
            const response = await fetch(`${SERVER_URL}/recording/off`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': USER_ID,
                },
            });

            if (response.ok) {
                addLog('🛑 녹음 중지 API 호출 성공');
                return true;
            } else {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
        } catch (error) {
            addLog('녹음 중지 API 오류: ' + (error as Error).message, 'error');
            return false;
        }
    }, [addLog]);

    const connectWebSocket = useCallback(() => {
        if (!WS_URL) {
            addLog('서버 URL이 설정되지 않았습니다', 'error');
            Alert.alert('설정 오류', '서버 URL이 설정되지 않았습니다.');
            console.log('❌ WS_URL이 없습니다');
            return;
        }

        const wsUrl = `${WS_URL}/ws?user_id=${USER_ID}`;
        console.log('🔄 WebSocket 연결 시도:', wsUrl);

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('✅ 이미 연결되어 있음');
            return;
        }

        // 기존 연결이 있다면 정리
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        try {
            wsRef.current = new WebSocket(wsUrl);

            // 연결 시도 타임아웃 설정
            const connectionTimeout = setTimeout(() => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
                    console.log('⏰ WebSocket 연결 타임아웃');
                    wsRef.current.close();
                    addLog('WebSocket 연결 타임아웃', 'error');
                }
            }, 10000); // 10초 타임아웃

            wsRef.current.onopen = () => {
                clearTimeout(connectionTimeout);
                console.log('✅ WebSocket 연결 성공!');
                setIsConnected(true);
                addLog('WebSocket 연결 성공');

                // 핑 메시지 전송하지 않음 - 서버에서 지원하지 않을 수 있음
                console.log('📡 WebSocket 연결 완료 - 메시지 전송 대기');
            };

            wsRef.current.onmessage = (event) => {
                console.log('📥 WebSocket 메시지 수신:', event.data);

                try {
                    const data: DetectionData = JSON.parse(event.data);

                    if (data.text) {
                        setRecognizedText(data.text);
                        setDetectionStatus(data.detected ? 'detected' : 'normal');
                    } else if (data.message) {
                        setRecognizedText(data.message);
                        setDetectionStatus('info');
                    }

                    if (data.detected) {
                        addLog(`🔴 욕설 감지! 텍스트: "${data.text}" | 패턴: [${data.patterns ? data.patterns.join(', ') : data.pattern}] | 신뢰도: ${data.confidence?.toFixed(2)} | 에너지: ${data.energy?.toFixed(3)}`, 'detection');
                    } else if (data.text) {
                        addLog(`🟢 정상 텍스트: "${data.text}" | 에너지: ${data.energy?.toFixed(3)}`);
                    } else {
                        addLog(`ℹ️ ${data.message || '음성 활동 없음'} | 에너지: ${data.energy ? data.energy.toFixed(3) : '0.000'}`);
                    }
                } catch (error) {
                    console.log('❌ 메시지 파싱 오류:', error);
                    addLog('메시지 파싱 오류: ' + (error as Error).message, 'error');
                }
            };

            wsRef.current.onclose = (event) => {
                clearTimeout(connectionTimeout);
                console.log('❌ WebSocket 연결 끊김:', event.code, event.reason);
                console.log('연결 끊김 상세 정보:');
                console.log('- 코드:', event.code);
                console.log('- 이유:', event.reason || '이유 불명');
                console.log('- wasClean:', event.wasClean);

                setIsConnected(false);

                // 연결 끊김 이유별 처리
                let disconnectReason = '';
                switch (event.code) {
                    case 1000:
                        disconnectReason = '정상 종료';
                        break;
                    case 1001:
                        disconnectReason = '서버 종료';
                        break;
                    case 1002:
                        disconnectReason = '프로토콜 오류';
                        break;
                    case 1003:
                        disconnectReason = '지원되지 않는 데이터';
                        break;
                    case 1006:
                        disconnectReason = '비정상 연결 종료';
                        break;
                    case 1011:
                        disconnectReason = '서버 오류';
                        break;
                    case 1012:
                        disconnectReason = '서버 재시작';
                        break;
                    default:
                        disconnectReason = `알 수 없는 오류 (${event.code})`;
                }

                addLog(`WebSocket 연결 끊김: ${disconnectReason}`, 'error');

                if (isRecording) {
                    stopRecording();
                }

                // 자동 재연결 시도 (1000번 코드가 아닌 경우)
                if (event.code !== 1000 && isOn) {
                    console.log('🔄 3초 후 자동 재연결 시도...');
                    setTimeout(() => {
                        if (isOn && !isConnected) {
                            console.log('🔄 자동 재연결 시도');
                            addLog('자동 재연결 시도 중...');
                            connectWebSocket();
                        }
                    }, 3000);
                }
            };

            wsRef.current.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.log('❌ WebSocket 오류:', error);
                console.log('오류 상세:', JSON.stringify(error, null, 2));
                addLog('WebSocket 오류 발생', 'error');
            };

        } catch (error) {
            console.log('❌ WebSocket 연결 실패:', error);
            addLog('WebSocket 연결 실패: ' + (error as Error).message, 'error');
        }
    }, [addLog, isRecording, isOn, isConnected]);

    const disconnectWebSocket = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const checkPermissions = useCallback(async () => {
        try {
            const { status } = await Audio.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    '권한 필요',
                    '음성 감지를 위해 마이크 권한이 필요합니다.',
                    [
                        { text: '취소', style: 'cancel' },
                        { text: '설정으로', onPress: () => Linking.openSettings() }
                    ]
                );
                return false;
            }
            return true;
        } catch (error) {
            addLog('권한 확인 오류: ' + (error as Error).message, 'error');
            return false;
        }
    }, [addLog]);

    // API 호출 없는 녹음 시작 함수 (오디오만)
    const startRecordingAudioOnly = useCallback(async () => {
        console.log('🎤 오디오 녹음만 시작...');

        const hasPermission = await checkPermissions();
        if (!hasPermission) return false;

        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync({
                android: {
                    extension: '.wav',
                    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
                    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                },
                ios: {
                    extension: '.wav',
                    audioQuality: Audio.IOSAudioQuality.MEDIUM,
                    sampleRate: 16000,
                    numberOfChannels: 1,
                    bitRate: 128000,
                    linearPCMBitDepth: 16,
                    linearPCMIsBigEndian: false,
                    linearPCMIsFloat: false,
                },
                web: {
                    mimeType: 'audio/wav',
                    bitsPerSecond: 128000,
                },
            });

            await recording.startAsync();
            recordingRef.current = recording;
            setIsRecording(true);
            addLog('🎤 오디오 녹음 시작됨');

            // WebSocket 연결 확인 후 오디오 전송 시작
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                console.log('✅ WebSocket 준비됨 - 오디오 전송 시작');
                setTimeout(() => {
                    startAudioDataTransmission();
                }, 1000);
            } else {
                console.log('⚠️ WebSocket 연결 대기 중...');
            }

            return true;
        } catch (error) {
            console.log('❌ 오디오 녹음 시작 오류:', error);
            addLog('오디오 녹음 오류: ' + (error as Error).message, 'error');
            Alert.alert('오류', '오디오 녹음을 시작할 수 없습니다: ' + (error as Error).message);
            return false;
        }
    }, [addLog, checkPermissions]);

    const startAudioDataTransmission = useCallback(() => {
        // 기존 전송 중지
        if (audioTransmissionRef.current) {
            clearInterval(audioTransmissionRef.current);
            audioTransmissionRef.current = null;
        }

        // WebSocket 연결 상태 확인
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.log('❌ WebSocket이 연결되지 않아 오디오 전송을 시작할 수 없습니다');
            addLog('WebSocket 연결 필요', 'error');
            return;
        }

        console.log('🎵 오디오 데이터 전송 시작');
        addLog('오디오 데이터 전송 시작');

        const interval = setInterval(async () => {
            // 연결 상태 재확인
            if (!isRecording || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !recordingRef.current) {
                console.log('🛑 오디오 전송 중지 - 조건 불만족');
                if (audioTransmissionRef.current) {
                    clearInterval(audioTransmissionRef.current);
                    audioTransmissionRef.current = null;
                }
                return;
            }

            try {
                const status = await recordingRef.current.getStatusAsync();

                if (status.isRecording) {
                    console.log('📤 오디오 데이터 전송 시도...');

                    // 연결 상태 재확인
                    if (wsRef.current.readyState === WebSocket.OPEN) {
                        // 간단한 상태 메시지만 전송 (테스트)
                        const statusMessage = JSON.stringify({
                            type: 'recording_status',
                            timestamp: Date.now(),
                            duration: status.durationMillis || 0
                        });
                        wsRef.current.send(statusMessage);
                        console.log('📤 상태 메시지 전송 성공');
                    } else {
                        console.log('❌ WebSocket 연결 상태 변경됨:', wsRef.current.readyState);
                    }
                }
            } catch (error) {
                console.log('❌ 오디오 전송 오류:', error);
                addLog('오디오 전송 오류: ' + (error as Error).message, 'error');

                // 오류 발생 시 전송 중지
                if (audioTransmissionRef.current) {
                    clearInterval(audioTransmissionRef.current);
                    audioTransmissionRef.current = null;
                }
            }
        }, 2000); // 2초로 간격 늘림

        audioTransmissionRef.current = interval as unknown as number;
    }, [isRecording, addLog]);

    const stopRecording = useCallback(async () => {
        try {
            if (audioTransmissionRef.current) {
                clearInterval(audioTransmissionRef.current);
                audioTransmissionRef.current = null;
            }

            if (recordingRef.current) {
                const status = await recordingRef.current.getStatusAsync();

                if (status.isRecording) {
                    await recordingRef.current.stopAndUnloadAsync();

                    // 마지막 오디오 데이터 전송
                    const uri = recordingRef.current.getURI();
                    if (uri && wsRef.current?.readyState === WebSocket.OPEN) {
                        try {
                            const response = await fetch(uri);
                            const audioArrayBuffer = await response.arrayBuffer();

                            if (audioArrayBuffer.byteLength > 0) {
                                wsRef.current.send(audioArrayBuffer);
                                addLog(`📤 최종 오디오 데이터 전송: ${audioArrayBuffer.byteLength} bytes`);
                            }
                        } catch (error) {
                            addLog('최종 오디오 전송 오류: ' + (error as Error).message, 'error');
                        }
                    }
                }

                recordingRef.current = null;
            }

            setIsRecording(false);
            addLog('🛑 녹음 중지');

            // 서버에 녹음 중지 알림
            await stopRecordingAPI();

        } catch (error) {
            addLog('녹음 중지 오류: ' + (error as Error).message, 'error');
        }
    }, [addLog, stopRecordingAPI]);

    const createRipple = useCallback(() => {
        const id = Date.now() + Math.random();
        const scale = new Animated.Value(0);
        const opacity = new Animated.Value(0.4);

        const newRipple: Ripple = { id, scale, opacity };

        setRipples((prev) => [...prev, newRipple]);

        Animated.parallel([
            Animated.timing(scale, {
                toValue: 1,
                duration: 800,
                easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                useNativeDriver: false,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 800,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }),
        ]).start(() => {
            setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
        });
    }, []);

    const handlePressIn = useCallback(() => {
        Animated.parallel([
            Animated.spring(buttonScale, {
                toValue: 0.96,
                useNativeDriver: false,
                tension: 300,
                friction: 8,
            }),
            Animated.timing(shadowAnim, {
                toValue: 0.4,
                duration: 150,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
        ]).start();
    }, [buttonScale, shadowAnim]);

    const handlePressOut = useCallback(() => {
        Animated.parallel([
            Animated.spring(buttonScale, {
                toValue: 1,
                useNativeDriver: false,
                tension: 200,
                friction: 7,
            }),
            Animated.timing(shadowAnim, {
                toValue: 1,
                duration: 250,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
        ]).start();
    }, [buttonScale, shadowAnim]);

    const waitForConnection = useCallback(() => {
        return new Promise<boolean>((resolve) => {
            if (isConnected) {
                resolve(true);
                return;
            }

            let attempts = 0;
            const maxAttempts = 50; // 5초 대기 (100ms * 50)

            const checkConnection = setInterval(() => {
                attempts++;

                if (isConnected) {
                    clearInterval(checkConnection);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkConnection);
                    resolve(false);
                }
            }, 100);
        });
    }, [isConnected]);

    // 수정된 handlePress 함수 - 순서 변경
    const handlePress = useCallback(async () => {
        const newIsOn = !isOn;
        const toValue = newIsOn ? 1 : 0;

        setIsOn(newIsOn);
        createRipple();

        if (newIsOn) {
            console.log('🔄 1단계: 녹음 시작 API 호출');
            // 1. 먼저 API 호출 (WebSocket 연결 전에)
            const apiSuccess = await startRecordingAPI();
            if (!apiSuccess) {
                Alert.alert('오류', '녹음 시작 API 호출에 실패했습니다');
                setIsOn(false); // 상태 되돌리기
                return;
            }

            console.log('🔄 2단계: WebSocket 연결');
            // 2. API 호출 후 WebSocket 연결
            if (!isConnected) {
                connectWebSocket();
                addLog('WebSocket 연결 중...');

                const connected = await waitForConnection();
                if (!connected) {
                    addLog('WebSocket 연결 실패', 'error');
                    // API 종료 호출
                    await stopRecordingAPI();
                    setIsOn(false);
                    return;
                }
            }

            console.log('🔄 3단계: 오디오 녹음 시작');
            // 3. 마지막으로 오디오 녹음 시작 (API 호출 제외)
            if (!isRecording) {
                const recordingSuccess = await startRecordingAudioOnly();
                if (!recordingSuccess) {
                    // 녹음 실패시 API 종료
                    await stopRecordingAPI();
                    setIsOn(false);
                    return;
                }
            }
        } else {
            if (isRecording) {
                await stopRecording();
            }
            // WebSocket 연결은 유지 (필요시에만 끊기)
        }

        Animated.parallel([
            Animated.timing(outerColorAnim, {
                toValue,
                duration: 350,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: false,
            }),
            Animated.timing(middleColorAnim, {
                toValue,
                duration: 350,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: false,
            }),
        ]).start();
    }, [isOn, createRipple, outerColorAnim, middleColorAnim, isConnected, isRecording, startRecordingAPI, connectWebSocket, waitForConnection, addLog, stopRecordingAPI, startRecordingAudioOnly]);

    const interpolatedValues = useMemo(
        () => ({
            outerBg: outerColorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#2C2C2C", "#845125"],
            }),
            middleBg: middleColorAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["#6D6D6D", "#FF7F11"],
            }),
            shadowOpacity: shadowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.2, 0.45],
            }),
            shadowRadius: shadowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 20],
            }),
            shadowOffset: shadowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [4, 10],
            }),
        }),
        [outerColorAnim, middleColorAnim, shadowAnim]
    );

    useEffect(() => {
        return () => {
            disconnectWebSocket();
            if (isRecording) {
                stopRecording();
            }
            if (audioTransmissionRef.current) {
                clearInterval(audioTransmissionRef.current);
            }
        };
    }, [disconnectWebSocket, stopRecording, isRecording]);

    const getStatusColor = () => {
        switch (detectionStatus) {
            case 'detected': return '#FF4444';
            case 'normal': return '#00FF88';
            default: return '#888888';
        }
    };

    return (
        <>
            <StatusBar style="light" />
            <View style={styles.container}>
                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <View style={styles.statusItem}>
                        <View style={[styles.statusDot, { backgroundColor: isConnected ? '#00FF88' : '#FF4444' }]} />
                        <Text style={styles.statusText}>{isConnected ? '연결됨' : '연결 끊김'}</Text>
                    </View>
                    <View style={styles.statusItem}>
                        <View style={[styles.statusDot, { backgroundColor: isRecording ? '#FF7F11' : '#888888' }]} />
                        <Text style={styles.statusText}>{isRecording ? '녹음 중' : '대기 중'}</Text>
                    </View>
                </View>

                {/* Recognized Text Display */}
                {recognizedText && (
                    <View style={styles.textDisplay}>
                        <Text style={[styles.recognizedText, { color: getStatusColor() }]}>
                            {recognizedText}
                        </Text>
                    </View>
                )}

                <View style={styles.buttonSection}>
                    <Pressable
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={handlePress}
                        accessible={true}
                        accessibilityLabel={`Power button, currently ${isOn ? "on" : "off"}`}
                        accessibilityRole="button"
                    >
                        <Animated.View
                            style={[
                                styles.outerCircle,
                                {
                                    backgroundColor: interpolatedValues.outerBg,
                                    transform: [{ scale: buttonScale }],
                                    shadowOpacity: interpolatedValues.shadowOpacity,
                                    shadowRadius: interpolatedValues.shadowRadius,
                                    shadowOffset: {
                                        width: 0,
                                        height: interpolatedValues.shadowOffset,
                                    },
                                },
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.middleCircle,
                                    { backgroundColor: interpolatedValues.middleBg },
                                ]}
                            >
                                {ripples.map((ripple) => (
                                    <Animated.View
                                        key={ripple.id}
                                        style={[
                                            styles.ripple,
                                            {
                                                backgroundColor: isOn
                                                    ? "rgba(255, 255, 255, 0.2)"
                                                    : "rgba(255, 127, 17, 0.15)",
                                                opacity: ripple.opacity,
                                                transform: [
                                                    {
                                                        scale: ripple.scale.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0.3, 1.4],
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                ))}

                                <View style={styles.centerButton}>
                                    <View style={styles.centerButtonBackdrop} />
                                    <View style={styles.centerButtonHighlight} />
                                    <OffIcon fill={isOn ? "#FF7F11" : "#696969"} />
                                </View>
                            </Animated.View>
                        </Animated.View>
                    </Pressable>
                </View>

                <View
                    style={[styles.metricsWrapper, { paddingBottom: insets.bottom + 20 }]}
                >
                    <MetricsCard
                        activeTime="68:12"
                        vibrationCount={12}
                        activeTimePercent={68.2}
                        compact={false}
                    />
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    textDisplay: {
        marginHorizontal: 20,
        marginVertical: 10,
        padding: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        minHeight: 50,
        justifyContent: 'center',
    },
    recognizedText: {
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
    },
    buttonSection: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    outerCircle: {
        width: 250,
        height: 250,
        borderRadius: 125,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    middleCircle: {
        width: 210,
        height: 210,
        borderRadius: 105,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    ripple: {
        position: "absolute",
        width: 175,
        height: 175,
        borderRadius: 87.5,
    },
    centerButton: {
        width: 175,
        height: 175,
        borderRadius: 87.5,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 1,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.4)",
    },
    centerButtonBackdrop: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 87.5,
    },
    centerButtonHighlight: {
        position: "absolute",
        width: "100%",
        height: "100%",
        borderRadius: 87.5,
    },
    metricsWrapper: {
        paddingHorizontal: 20,
    },
});

export default Home;