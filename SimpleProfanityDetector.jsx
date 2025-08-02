import { useState, useRef, useCallback, useEffect } from 'react';
import './ProfanityDetector.css';

const SimpleProfanityDetector = () => {
  // 상태 관리
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [userId, setUserId] = useState('user_001');

  // Refs
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  // 로그 추가
  const addLog = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp,
      message,
      type
    };
    setLogs(prev => [...prev.slice(-49), logEntry]);
    console.log(`[${timestamp}] ${message}`);
  }, []);

  // WebSocket 연결
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('이미 연결되어 있습니다', 'warning');
      return;
    }

    const wsUrl = `wss://baff2434741b.ngrok-free.app/ws?user_id=${userId}`;
    addLog(`WebSocket 연결 시도: ${wsUrl}`);

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        addLog('✅ WebSocket 연결 성공', 'success');
      };

      wsRef.current.onmessage = (event) => {
        try {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data);
            addLog(`서버 응답: ${data.type || 'unknown'}`, 'info');

            if (data.type === 'detection') {
              setDetectionResult({
                text: data.text,
                pattern: data.pattern,
                confidence: data.confidence,
                timestamp: data.timestamp
              });
              addLog(`🚨 욕설 감지! "${data.text}" (${Math.round(data.confidence * 100)}%)`, 'detection');

              // 브라우저 알림
              if (Notification.permission === 'granted') {
                new Notification('욕설 감지!', {
                  body: `"${data.text}" 감지됨`,
                  icon: '🚨'
                });
              }
            } else if (data.type === 'transcription') {
              addLog(`음성 인식: "${data.text}"`, 'info');
            }
          }
        } catch (error) {
          addLog(`메시지 처리 오류: ${error.message}`, 'error');
        }
      };

      wsRef.current.onclose = (event) => {
        setIsConnected(false);
        addLog(`WebSocket 연결 종료 (코드: ${event.code})`, 'error');
        
        // 녹음 중이었다면 정리
        if (isRecording) {
          stopRecording();
        }
      };

      wsRef.current.onerror = (error) => {
        addLog('WebSocket 오류 발생', 'error');
      };

    } catch (error) {
      addLog(`연결 실패: ${error.message}`, 'error');
    }
  }, [userId, addLog, isRecording]);

  // WebSocket 연결 해제
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, '사용자 요청');
      wsRef.current = null;
    }
    setIsConnected(false);
    addLog('WebSocket 연결 해제', 'info');
  }, [addLog]);

  // 오디오 녹음 시작
  const startRecording = useCallback(async () => {
    if (isRecording) {
      addLog('이미 녹음 중입니다', 'warning');
      return;
    }

    if (!isConnected) {
      addLog('먼저 WebSocket에 연결해주세요', 'error');
      return;
    }

    try {
      addLog('🎤 마이크 권한 요청 중...', 'info');

      // 1. 마이크 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      addLog('✅ 마이크 권한 승인', 'success');

      // 2. AudioContext 설정
      const AudioContextClass = window.AudioContext || window['webkitAudioContext'];
      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 3. 오디오 처리 설정
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (event) => {
        if (!isConnected || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = event.inputBuffer.getChannelData(0);
        
        // 음성 활동 감지
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += Math.abs(inputData[i]);
        }
        const avgVolume = sum / inputData.length;

        if (avgVolume > 0.005) {
          try {
            // 16bit PCM 변환
            const pcmBuffer = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              const sample = Math.max(-1, Math.min(1, inputData[i]));
              pcmBuffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            }

            // WebSocket으로 전송
            wsRef.current.send(pcmBuffer.buffer);
          } catch (error) {
            addLog(`오디오 전송 오류: ${error.message}`, 'error');
          }
        }
      };

      // 4. 오디오 그래프 연결
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsRecording(true);
      addLog('🎤 실시간 오디오 녹음 시작!', 'success');

      // 브라우저 알림 권한 요청
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

    } catch (error) {
      addLog(`녹음 시작 실패: ${error.message}`, 'error');
      
      if (error.name === 'NotAllowedError') {
        addLog('마이크 권한이 거부되었습니다', 'error');
        alert('마이크 권한을 허용해주세요.\n브라우저 설정에서 마이크 접근을 허용하고 페이지를 새로고침해주세요.');
      }
    }
  }, [isConnected, isRecording, addLog]);

  // 오디오 녹음 중지
  const stopRecording = useCallback(() => {
    if (!isRecording) {
      addLog('녹음 중이 아닙니다', 'warning');
      return;
    }

    try {
      // 오디오 리소스 정리
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      addLog('🛑 오디오 녹음 중지', 'success');

    } catch (error) {
      addLog(`녹음 중지 오류: ${error.message}`, 'error');
    }
  }, [isRecording, addLog]);

  // 컴포넌트 정리
  useEffect(() => {
    return () => {
      if (isRecording) stopRecording();
      if (isConnected) disconnectWebSocket();
    };
  }, [isRecording, isConnected, stopRecording, disconnectWebSocket]);

  // 스타일 헬퍼
  const getStatusClass = () => {
    if (isConnected) return 'status-connected';
    return 'status-disconnected';
  };

  const getLogClass = (type) => {
    switch (type) {
      case 'success': return 'log-success';
      case 'error': return 'log-error';
      case 'warning': return 'log-warning';
      case 'detection': return 'log-detection';
      default: return 'log-info';
    }
  };

  return (
    <div className="profanity-detector">
      {/* 헤더 */}
      <div className="header">
        <h1>🎤 실시간 욕설 감지기 (심플 버전)</h1>
        <div className={`connection-status ${getStatusClass()}`}>
          <div className="status-indicator"></div>
          <span>{isConnected ? '연결됨' : '연결 안됨'}</span>
        </div>
      </div>

      {/* 컨트롤 */}
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
          <button 
            onClick={connectWebSocket} 
            disabled={isConnected}
            className="btn-connect"
          >
            연결
          </button>
          <button 
            onClick={disconnectWebSocket} 
            disabled={!isConnected}
            className="btn-disconnect"
          >
            연결 해제
          </button>
        </div>

        <div className="recording-controls">
          <button 
            onClick={startRecording} 
            disabled={!isConnected || isRecording}
            className="btn-record"
          >
            🎤 녹음 시작
          </button>
          <button 
            onClick={stopRecording} 
            disabled={!isRecording}
            className="btn-stop"
          >
            ⏹️ 녹음 중지
          </button>
        </div>
      </div>

      {/* 욕설 감지 결과 */}
      {detectionResult && (
        <div className="detection-result">
          <h3>🚨 욕설 감지 결과</h3>
          <div className="detection-details">
            <p><strong>감지된 텍스트:</strong> "{detectionResult.text}"</p>
            <p><strong>패턴:</strong> {detectionResult.pattern}</p>
            <p><strong>신뢰도:</strong> {Math.round(detectionResult.confidence * 100)}%</p>
            <p><strong>시간:</strong> {new Date(detectionResult.timestamp).toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setDetectionResult(null)}
            className="btn-clear"
          >
            확인
          </button>
        </div>
      )}

      {/* 로그 */}
      <div className="logs-section">
        <h3>📋 로그</h3>
        <div className="logs-container">
          {logs.map(log => (
            <div key={log.id} className={`log-entry ${getLogClass(log.type)}`}>
              <span className="log-timestamp">[{log.timestamp}]</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))}
        </div>
        <button 
          onClick={() => setLogs([])}
          className="btn-clear-logs"
        >
          로그 지우기
        </button>
      </div>
    </div>
  );
};

export default SimpleProfanityDetector;