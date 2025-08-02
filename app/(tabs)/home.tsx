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
    const [apiDisabled, setApiDisabled] = useState(false); // API 호출 비활성화 플래그 (필요시 true로 변경)
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
        if (apiDisabled) {
            addLog('🚫 API 호출이 비활성화되었습니다', 'warning');
            console.log('🚫 API 호출 비활성화됨 - startRecordingAPI 생략');
            return true; // 성공으로 처리
        }
        
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
    }, [addLog, apiDisabled]);

    const stopRecordingAPI = useCallback(async () => {
        if (apiDisabled) {
            addLog('🚫 API 호출이 비활성화되었습니다', 'warning');
            console.log('🚫 API 호출 비활성화됨 - stopRecordingAPI 생략');
            return true; // 성공으로 처리
        }
        
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
    }, [addLog, apiDisabled]);

    // API 호출 없는 리소스 정리 함수 (무한루프 방지)
    const cleanupResourcesOnly = useCallback(() => {
        console.log('🧹 API 호출 없이 리소스만 정리');
        
        try {
            // 1. 실시간 스트림 정리 (Web Audio API)
            if (audioTransmissionRef.current && typeof audioTransmissionRef.current === 'object') {
                const { audioContext, processor, stream } = audioTransmissionRef.current as any;
                
                if (processor) processor.disconnect();
                if (audioContext) audioContext.close();
                if (stream) stream.getTracks().forEach((track: any) => track.stop());
                
                audioTransmissionRef.current = null;
                console.log('✅ Web Audio API 리소스 정리');
            }
            
            // 2. 기존 interval 정리
            else if (typeof audioTransmissionRef.current === 'number') {
                clearInterval(audioTransmissionRef.current);
                audioTransmissionRef.current = null;
                console.log('✅ 오디오 전송 인터벌 정리');
            }
            
            // 3. expo-av 녹음 정리
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => {});
                recordingRef.current = null;
                console.log('✅ 녹음 리소스 정리');
            }
            
            setIsRecording(false);
            addLog('🧹 리소스 정리 완료 (API 호출 없음)', 'info');
        } catch (error) {
            console.log('❌ 리소스 정리 오류:', error);
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

                // 녹음 중이었다면 정리 (API 호출 없이)
                if (isRecording) {
                    console.log('🛑 WebSocket 연결 끊김으로 녹음 정리 시작');
                    addLog('WebSocket 연결 끊김으로 녹음 상태 정리', 'warning');
                    
                    // 무한루프 방지: API 호출 없이 리소스만 정리
                    cleanupResourcesOnly();
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
    }, [addLog, isRecording, isOn, isConnected, cleanupResourcesOnly]);

    const disconnectWebSocket = useCallback(() => {
        console.log('🔌 WebSocket 수동 연결 해제 시작');
        
        // 먼저 녹음 중이면 API 호출 없이 리소스만 정리
        if (isRecording) {
            console.log('🛑 연결 해제 전 리소스 정리 (API 호출 없음)');
            cleanupResourcesOnly(); // API 호출 없이 리소스만 정리
        }
        
        if (wsRef.current) {
            wsRef.current.close(1000, '사용자 요청');
            wsRef.current = null;
        }
        setIsConnected(false);
        addLog('WebSocket 연결 수동 해제', 'info');
    }, [isRecording, cleanupResourcesOnly, addLog]);

    const checkPermissions = useCallback(async () => {
        try {
            console.log('🎤 마이크 권한 확인 시작...');
            addLog('마이크 권한 확인 중...', 'info');
            
            // 1. 먼저 현재 권한 상태 확인
            const currentPermissions = await Audio.getPermissionsAsync();
            console.log('📋 현재 권한 상태:', currentPermissions);
            addLog(`현재 권한 상태: ${currentPermissions.status}`, 'info');
            
            if (currentPermissions.status === 'granted') {
                console.log('✅ 이미 권한이 승인됨');
                addLog('마이크 권한이 이미 승인되어 있습니다', 'success');
                return true;
            }
            
            // 2. 권한이 없으면 요청
            console.log('🎤 마이크 권한 요청...');
            addLog('마이크 권한을 요청합니다...', 'info');
            
            const { status } = await Audio.requestPermissionsAsync();
            console.log('🎤 권한 요청 결과:', status);
            addLog(`권한 요청 결과: ${status}`, 'info');
            
            if (status !== 'granted') {
                console.log('❌ 권한 거부됨 또는 실패');
                addLog('마이크 권한이 거부되었습니다', 'error');
                return false;
            }
            
            console.log('✅ 권한 승인됨');
            addLog('마이크 권한이 승인되었습니다', 'success');
            return true;
        } catch (error) {
            console.log('❌ 권한 확인 오류:', error);
            addLog('권한 확인 오류: ' + (error as Error).message, 'error');
            return false;
        }
    }, [addLog]);

    // 실시간 오디오 전송 함수 (HTML과 동일한 방식)
    const startRealtimeAudioStream = useCallback(async () => {
        console.log('🎤 실시간 오디오 스트림 시작...');

        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.log('❌ WebSocket 연결 필요');
            addLog('WebSocket 연결이 필요합니다', 'error');
            return false;
        }

        try {
            // 1. Web Audio API 사용 (React Native Web에서 동작)
            if (typeof window !== 'undefined' && window.navigator?.mediaDevices) {
                console.log('🌐 웹 환경 - Web Audio API 사용');
                
                const stream = await window.navigator.mediaDevices.getUserMedia({
                    audio: {
                        sampleRate: 16000,
                        channelCount: 1,
                        echoCancellation: false,
                        noiseSuppression: false
                    }
                });

                // AudioContext 생성
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass({ sampleRate: 16000 });
                
                const source = audioContext.createMediaStreamSource(stream);
                const processor = audioContext.createScriptProcessor(4096, 1, 1);
                
                // 실시간 오디오 처리 (HTML과 동일)
                processor.onaudioprocess = (e) => {
                    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                        console.log('⚠️ WebSocket 연결 끊김 - 오디오 전송 중지');
                        return;
                    }
                    
                    const inputBuffer = e.inputBuffer.getChannelData(0);
                    
                    // Float32를 Int16으로 변환 (HTML과 동일)
                    const int16Buffer = new Int16Array(inputBuffer.length);
                    for (let i = 0; i < inputBuffer.length; i++) {
                        int16Buffer[i] = Math.max(-32768, Math.min(32767, inputBuffer[i] * 32768));
                    }
                    
                    // WebSocket으로 실시간 전송
                    try {
                        wsRef.current.send(int16Buffer.buffer);
                        console.log('📤 실시간 오디오 전송:', int16Buffer.length, 'samples');
                    } catch (error) {
                        console.log('❌ 오디오 전송 오류:', error);
                    }
                };
                
                // 오디오 그래프 연결
                source.connect(processor);
                processor.connect(audioContext.destination);
                
                // refs에 저장
                audioTransmissionRef.current = { audioContext, processor, stream } as any;
                setIsRecording(true);
                addLog('🎤 실시간 오디오 스트림 시작!', 'success');
                
                return true;
            } else {
                // 2. Native 환경 - expo-av 사용
                console.log('📱 네이티브 환경 - expo-av 사용');
                return await startNativeRecording();
            }
            
        } catch (error) {
            console.log('❌ 실시간 오디오 스트림 오류:', error);
            addLog('실시간 오디오 스트림 오류: ' + (error as Error).message, 'error');
            return false;
        }
    }, [addLog]);

    // Native 환경용 녹음 함수
    const startNativeRecording = useCallback(async () => {
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
            addLog('🎤 네이티브 녹음 시작');

            // 실시간 전송 시작
            startAudioDataTransmission();
            return true;

        } catch (error) {
            console.log('❌ 네이티브 녹음 오류:', error);
            addLog('네이티브 녹음 오류: ' + (error as Error).message, 'error');
            return false;
        }
    }, [addLog]);

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
            console.log('🛑 실시간 오디오 스트림 중지 시작');
            
            // 1. 실시간 스트림 정리 (Web Audio API)
            if (audioTransmissionRef.current && typeof audioTransmissionRef.current === 'object') {
                const { audioContext, processor, stream } = audioTransmissionRef.current as any;
                
                console.log('🧹 Web Audio API 리소스 정리');
                if (processor) {
                    processor.disconnect();
                    console.log('✅ ScriptProcessorNode 해제');
                }
                if (audioContext) {
                    audioContext.close();
                    console.log('✅ AudioContext 종료');
                }
                if (stream) {
                    stream.getTracks().forEach((track: any) => track.stop());
                    console.log('✅ MediaStream 중지');
                }
                
                audioTransmissionRef.current = null;
            }
            
            // 2. 기존 interval 정리
            else if (typeof audioTransmissionRef.current === 'number') {
                clearInterval(audioTransmissionRef.current);
                audioTransmissionRef.current = null;
                console.log('✅ 오디오 전송 인터벌 정리');
            }

            // 3. expo-av 녹음 정리
            if (recordingRef.current) {
                console.log('🧹 expo-av 녹음 리소스 정리');
                try {
                    const status = await recordingRef.current.getStatusAsync();
                    if (status.isRecording) {
                        await recordingRef.current.stopAndUnloadAsync();
                        console.log('✅ expo-av 녹음 중지');
                    }
                } catch (error) {
                    console.log('⚠️ expo-av 정리 오류:', error);
                }
                recordingRef.current = null;
            }

            setIsRecording(false);
            addLog('🛑 실시간 오디오 스트림 중지 완료');

        } catch (error) {
            console.log('❌ 오디오 스트림 중지 오류:', error);
            addLog('오디오 스트림 중지 오류: ' + (error as Error).message, 'error');
        }
    }, [addLog]);

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

    // 권한 우선 처리 handlePress 함수
    const handlePress = useCallback(async () => {
        const newIsOn = !isOn;
        const toValue = newIsOn ? 1 : 0;

        setIsOn(newIsOn);
        createRipple();

        if (newIsOn) {
            console.log('🔄 1단계: 마이크 권한 확인 (최우선)');
            // 1. 가장 먼저 권한 확인 - 버튼 누르자마자 권한 체크
            const hasPermission = await checkPermissions();
            if (!hasPermission) {
                console.log('❌ 권한 없음 - Alert 표시 시도');
                addLog('마이크 권한이 거부되어 녹음을 시작할 수 없습니다', 'error');
                
                // 권한 상태 확인 후 적절한 Alert 표시
                try {
                    const currentPermissions = await Audio.getPermissionsAsync();
                    console.log('📋 상세 권한 상태:', currentPermissions);
                    
                    let alertTitle = '🎤 마이크 권한 필요';
                    let alertMessage = '실시간 욕설 감지를 위해서는 마이크 권한이 반드시 필요합니다.';
                    
                    if (currentPermissions.status === 'denied') {
                        alertMessage += '\n\n권한이 영구적으로 거부되었습니다.\n설정에서 직접 변경해주세요.';
                    } else if (currentPermissions.status === 'undetermined') {
                        alertMessage += '\n\n권한을 허용해주세요.';
                    }
                    
                    alertMessage += '\n\n설정 방법:\n• 설정 > 개인정보 보호 및 보안 > 마이크\n• 해당 앱의 마이크 권한을 활성화';
                    
                    console.log('📱 Alert 표시 시도:', alertTitle);
                    
                    setTimeout(() => {
                        Alert.alert(
                            alertTitle,
                            alertMessage,
                            [
                                { 
                                    text: '나중에 하기', 
                                    style: 'cancel', 
                                    onPress: () => {
                                        console.log('👤 사용자가 나중에 하기 선택');
                                        addLog('사용자가 권한 설정을 나중에 하기로 선택', 'info');
                                    } 
                                },
                                { 
                                    text: '설정 열기', 
                                    style: 'default',
                                    onPress: () => {
                                        console.log('⚙️ 설정 앱 열기');
                                        addLog('설정 앱으로 이동', 'info');
                                        Linking.openSettings();
                                    }
                                }
                            ]
                        );
                    }, 100); // 약간의 지연 후 Alert 표시
                    
                } catch (alertError) {
                    console.log('❌ Alert 표시 오류:', alertError);
                    addLog('Alert 표시 실패: ' + (alertError as Error).message, 'error');
                }
                
                // 권한이 없으면 여기서 종료 - API 호출 없음
                setIsOn(false);
                return;
            }

            console.log('🔄 2단계: 권한 승인됨 - API 호출 시작');
            // 2. 권한이 있을 때만 API 호출
            const apiSuccess = await startRecordingAPI();
            if (!apiSuccess) {
                Alert.alert('오류', '녹음 시작 API 호출에 실패했습니다');
                setIsOn(false);
                return;
            }

            console.log('🔄 3단계: WebSocket 연결');
            // 3. API 호출 후 WebSocket 연결
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

            console.log('🔄 4단계: 실시간 오디오 스트림 시작 (권한 이미 확인됨)');
            // 4. 실시간 오디오 스트림 시작 (HTML과 동일한 방식)
            if (!isRecording) {
                const streamSuccess = await startRealtimeAudioStream();
                if (!streamSuccess) {
                    // 스트림 시작 실패 시 정리
                    addLog('실시간 오디오 스트림 시작 실패', 'error');
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
    }, [isOn, createRipple, outerColorAnim, middleColorAnim, isConnected, isRecording, startRecordingAPI, connectWebSocket, waitForConnection, addLog, stopRecordingAPI, checkPermissions, startRealtimeAudioStream, stopRecording]);

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