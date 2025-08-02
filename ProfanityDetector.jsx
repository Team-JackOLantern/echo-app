import { useState, useRef, useCallback, useEffect } from 'react';
import './ProfanityDetector.css';

const ProfanityDetector = () => {
	// WebSocket 및 오디오 관련 상태
	const [isConnected, setIsConnected] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState('disconnected');
	const [detectionResult, setDetectionResult] = useState(null);
	const [logs, setLogs] = useState([]);
	const [userId, setUserId] = useState('user_001');

	// Refs
	const wsRef = useRef(null);
	const audioContextRef = useRef(null);
	const processorRef = useRef(null);
	const streamRef = useRef(null);
	const reconnectTimeoutRef = useRef(null);

	// 로그 추가 함수
	const addLog = useCallback((message, type = 'info') => {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = {
			id: Date.now(),
			timestamp,
			message,
			type,
		};
		setLogs((prev) => [...prev.slice(-49), logEntry]);
	}, []);

	// WebSocket 연결
	const connectWebSocket = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			addLog('이미 연결되어 있습니다', 'warning');
			return;
		}

		// 기존 재연결 타이머 정리
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// ngrok URL 사용 (실제 서버 URL로 변경)
		const wsUrl = `wss://baff2434741b.ngrok-free.app/ws?user_id=${userId}`;
		addLog(`WebSocket 연결 시도: ${wsUrl}`);
		setConnectionStatus('connecting');

		try {
			wsRef.current = new WebSocket(wsUrl);

			// 연결 타임아웃 설정
			const connectionTimeout = setTimeout(() => {
				if (wsRef.current?.readyState === WebSocket.CONNECTING) {
					wsRef.current.close();
					addLog('연결 타임아웃', 'error');
					setConnectionStatus('disconnected');
				}
			}, 10000);

			wsRef.current.onopen = () => {
				clearTimeout(connectionTimeout);
				setIsConnected(true);
				setConnectionStatus('connected');
				addLog('WebSocket 연결 성공', 'success');

				// 연결 확인을 위한 keep-alive 메시지 전송
				setTimeout(() => {
					if (wsRef.current?.readyState === WebSocket.OPEN) {
						try {
							// JSON 형태로 keep-alive 메시지 전송
							const keepAliveMessage = JSON.stringify({
								type: 'keep_alive',
								timestamp: Date.now(),
								user_id: userId,
							});
							wsRef.current.send(keepAliveMessage);
							addLog('Keep-alive 메시지 전송');
						} catch (error) {
							addLog(`Keep-alive 전송 오류: ${error.message}`, 'error');
						}
					}
				}, 1000);
			};

			wsRef.current.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					addLog(`메시지 수신: ${event.data}`);

					switch (data.type) {
						case 'pong':
							addLog('Pong 응답 수신 - 연결 활성', 'success');
							break;

						case 'detection':
							setDetectionResult({
								text: data.text,
								pattern: data.pattern,
								confidence: data.confidence,
								timestamp: data.timestamp,
							});
							addLog(`욕설 감지! 텍스트: "${data.text}", 패턴: "${data.pattern}", 신뢰도: ${data.confidence}`, 'detection');

							// 브라우저 알림 표시
							if (Notification.permission === 'granted') {
								new Notification('욕설 감지!', {
									body: `"${data.text}" 감지됨 (신뢰도: ${Math.round(data.confidence * 100)}%)`,
									icon: '🚨',
								});
							}
							break;

						case 'error':
							addLog(`서버 에러: ${data.message}`, 'error');
							break;

						default:
							addLog(`알 수 없는 메시지 타입: ${data.type}`, 'warning');
					}
				} catch (error) {
					addLog(`메시지 파싱 오류: ${error.message}`, 'error');
				}
			};

			wsRef.current.onclose = (event) => {
				clearTimeout(connectionTimeout);
				setIsConnected(false);
				setConnectionStatus('disconnected');

				// 녹음 중이었다면 중지
				if (isRecording) {
					addLog('WebSocket 연결 끊김으로 녹음 중지', 'warning');
					stopRecording();
				}

				let reason = '알 수 없는 이유';
				let shouldReconnect = false;

				switch (event.code) {
					case 1000:
						reason = '정상 종료';
						// 서버에서 정상적으로 연결을 종료한 경우
						addLog('서버에서 연결을 종료했습니다. 서버 상태를 확인하세요.', 'warning');
						break;
					case 1001:
						reason = '서버 종료';
						shouldReconnect = true;
						break;
					case 1002:
						reason = '프로토콜 오류';
						shouldReconnect = true;
						break;
					case 1006:
						reason = '비정상 연결 종료';
						shouldReconnect = true;
						break;
					case 1011:
						reason = '서버 오류';
						shouldReconnect = true;
						break;
					default:
						reason = `코드 ${event.code}: ${event.reason || '알 수 없는 오류'}`;
						shouldReconnect = event.code !== 1000;
				}

				addLog(`WebSocket 연결 종료: ${reason}`, 'error');

				// 자동 재연결 로직 개선
				if (shouldReconnect && connectionStatus === 'connected') {
					addLog('5초 후 자동 재연결 시도...', 'info');
					reconnectTimeoutRef.current = setTimeout(() => {
						if (!isConnected && connectionStatus !== 'connecting') {
							addLog('자동 재연결 시도 중...', 'info');
							connectWebSocket();
						}
					}, 5000);
				}
			};

			wsRef.current.onerror = (error) => {
				clearTimeout(connectionTimeout);
				addLog(`WebSocket 오류: ${error.message || '연결 오류'}`, 'error');
				setConnectionStatus('error');
			};
		} catch (error) {
			addLog(`WebSocket 연결 실패: ${error.message}`, 'error');
			setConnectionStatus('disconnected');
		}
	}, [userId, addLog, isConnected, connectionStatus]);

	// WebSocket 연결 해제
	const disconnectWebSocket = useCallback(() => {
		// 재연결 타이머 정리
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			try {
				// 종료 메시지 전송
				const closeMessage = JSON.stringify({
					type: 'close',
					user_id: userId,
					timestamp: Date.now(),
				});
				wsRef.current.send(closeMessage);
			} catch (error) {
				addLog(`종료 메시지 전송 오류: ${error.message}`, 'warning');
			}
			wsRef.current.close(1000, '사용자 요청');
		}

		wsRef.current = null;
		setIsConnected(false);
		setConnectionStatus('disconnected');
		addLog('WebSocket 연결 해제');
	}, [addLog, userId]);

	// 마이크 권한 요청
	const requestMicrophonePermission = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});

			// 브라우저 알림 권한도 함께 요청
			if (Notification.permission === 'default') {
				await Notification.requestPermission();
			}

			return stream;
		} catch (error) {
			addLog(`마이크 권한 오류: ${error.message}`, 'error');
			throw error;
		}
	}, [addLog]);

	// 오디오 녹음 시작
	const startRecording = useCallback(async () => {
		if (isRecording) {
			addLog('이미 녹음 중입니다', 'warning');
			return;
		}

		if (!isConnected) {
			addLog('WebSocket에 먼저 연결해주세요', 'error');
			return;
		}

		try {
			const stream = await requestMicrophonePermission();
			streamRef.current = stream;

			// AudioContext 설정 (16kHz, 16bit PCM)
			const AudioContextClass = window.AudioContext || window.webkitAudioContext;
			audioContextRef.current = new AudioContextClass({
				sampleRate: 16000,
			});

			const source = audioContextRef.current.createMediaStreamSource(stream);

			// ScriptProcessorNode를 사용한 실시간 오디오 처리
			processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

			processorRef.current.onaudioprocess = (event) => {
				if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
					return;
				}

				const inputBuffer = event.inputBuffer;
				const inputData = inputBuffer.getChannelData(0);

				// 음성 활동 감지 (간단한 볼륨 체크)
				let sum = 0;
				for (let i = 0; i < inputData.length; i++) {
					sum += Math.abs(inputData[i]);
				}
				const avgVolume = sum / inputData.length;

				// 볼륨이 임계값 이상일 때만 전송 (노이즈 필터링)
				if (avgVolume > 0.01) {
					try {
						// Float32Array를 16bit PCM으로 변환
						const pcmBuffer = new Int16Array(inputData.length);
						for (let i = 0; i < inputData.length; i++) {
							const sample = Math.max(-1, Math.min(1, inputData[i]));
							pcmBuffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
						}

						// 바이너리 데이터로 전송
						wsRef.current.send(pcmBuffer.buffer);
					} catch (error) {
						addLog(`오디오 전송 오류: ${error.message}`, 'error');
					}
				}
			};

			source.connect(processorRef.current);
			processorRef.current.connect(audioContextRef.current.destination);

			setIsRecording(true);
			addLog('오디오 녹음 시작 (16kHz, 16bit PCM)', 'success');
		} catch (error) {
			addLog(`녹음 시작 오류: ${error.message}`, 'error');
		}
	}, [isRecording, isConnected, requestMicrophonePermission, addLog]);

	// 오디오 녹음 중지
	const stopRecording = useCallback(() => {
		if (!isRecording) {
			addLog('녹음 중이 아닙니다', 'warning');
			return;
		}

		try {
			// 오디오 처리 중지
			if (processorRef.current) {
				processorRef.current.disconnect();
				processorRef.current = null;
			}

			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}

			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}

			setIsRecording(false);
			addLog('오디오 녹음 중지', 'success');
		} catch (error) {
			addLog(`녹음 중지 오류: ${error.message}`, 'error');
		}
	}, [isRecording, addLog]);

	// 컴포넌트 언마운트 시 정리
	useEffect(() => {
		return () => {
			// 녹음 중지
			if (isRecording) {
				stopRecording();
			}

			// 재연결 타이머 정리
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
				reconnectTimeoutRef.current = null;
			}

			// WebSocket 연결 해제
			disconnectWebSocket();
		};
	}, [isRecording, stopRecording, disconnectWebSocket]);

	// 연결 상태에 따른 스타일 클래스
	const getStatusClass = () => {
		switch (connectionStatus) {
			case 'connected':
				return 'status-connected';
			case 'connecting':
				return 'status-connecting';
			case 'error':
				return 'status-error';
			default:
				return 'status-disconnected';
		}
	};

	const getLogClass = (type) => {
		switch (type) {
			case 'success':
				return 'log-success';
			case 'error':
				return 'log-error';
			case 'warning':
				return 'log-warning';
			case 'detection':
				return 'log-detection';
			default:
				return 'log-info';
		}
	};

	return (
		<div className="profanity-detector">
			<div className="header">
				<h1>🎤 실시간 욕설 감지기</h1>
				<div className={`connection-status ${getStatusClass()}`}>
					<div className="status-indicator"></div>
					<span>
						{connectionStatus === 'connected'
							? '연결됨'
							: connectionStatus === 'connecting'
							? '연결 중...'
							: connectionStatus === 'error'
							? '오류'
							: '연결 안됨'}
					</span>
				</div>
			</div>

			<div className="controls">
				<div className="user-input">
					<label htmlFor="userId">사용자 ID:</label>
					<input
						id="userId"
						type="text"
						value={userId}
						onChange={(e) => setUserId(e.target.value)}
						disabled={isConnected}
						placeholder="사용자 ID 입력"
					/>
				</div>

				<div className="connection-controls">
					<button onClick={connectWebSocket} disabled={isConnected || connectionStatus === 'connecting'} className="btn-connect">
						{connectionStatus === 'connecting' ? '연결 중...' : '연결'}
					</button>
					<button onClick={disconnectWebSocket} disabled={!isConnected} className="btn-disconnect">
						연결 해제
					</button>
				</div>

				<div className="recording-controls">
					<button onClick={startRecording} disabled={!isConnected || isRecording} className="btn-record">
						🎤 녹음 시작
					</button>
					<button onClick={stopRecording} disabled={!isRecording} className="btn-stop">
						⏹️ 녹음 중지
					</button>
				</div>
			</div>

			{detectionResult && (
				<div className="detection-result">
					<h3>🚨 욕설 감지 결과</h3>
					<div className="detection-details">
						<p>
							<strong>감지된 텍스트:</strong> "{detectionResult.text}"
						</p>
						<p>
							<strong>패턴:</strong> {detectionResult.pattern}
						</p>
						<p>
							<strong>신뢰도:</strong> {Math.round(detectionResult.confidence * 100)}%
						</p>
						<p>
							<strong>시간:</strong> {new Date(detectionResult.timestamp).toLocaleString()}
						</p>
					</div>
					<button onClick={() => setDetectionResult(null)} className="btn-clear">
						확인
					</button>
				</div>
			)}

			<div className="logs-section">
				<h3>📋 로그</h3>
				<div className="logs-container">
					{logs.map((log) => (
						<div key={log.id} className={`log-entry ${getLogClass(log.type)}`}>
							<span className="log-timestamp">[{log.timestamp}]</span>
							<span className="log-message">{log.message}</span>
						</div>
					))}
				</div>
				<button onClick={() => setLogs([])} className="btn-clear-logs">
					로그 지우기
				</button>
			</div>
		</div>
	);
};

export default ProfanityDetector;
