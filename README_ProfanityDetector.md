# 실시간 욕설 감지 WebSocket 클라이언트

React hooks를 사용한 실시간 욕설 감지 시스템의 웹 클라이언트입니다.

## 🚀 주요 기능

- **실시간 WebSocket 연결**: `ws://localhost:8000/ws?user_id={사용자ID}`로 연결
- **실시간 오디오 캡처**: 16kHz, 16bit PCM 형태로 오디오 데이터 전송
- **욕설 감지 알림**: 브라우저 알림과 UI 알림으로 욕설 감지 결과 표시
- **연결 상태 관리**: 연결/해제/재연결 상태를 실시간으로 표시
- **상세 로그**: 모든 WebSocket 이벤트와 오디오 처리 과정을 로그로 기록
- **반응형 UI**: 모바일과 데스크톱 환경 모두 지원

## 📋 사용 방법

### 1. 컴포넌트 import
```jsx
import ProfanityDetector from './ProfanityDetector';
import './ProfanityDetector.css';

function App() {
  return (
    <div className="App">
      <ProfanityDetector />
    </div>
  );
}
```

### 2. 서버 연결
1. 사용자 ID 입력 (기본값: `user_001`)
2. "연결" 버튼 클릭
3. WebSocket 연결 상태 확인

### 3. 오디오 녹음
1. WebSocket 연결 후 "녹음 시작" 버튼 클릭
2. 브라우저에서 마이크 권한 허용
3. 실시간으로 오디오 데이터가 서버로 전송됨

### 4. 욕설 감지 결과 확인
- 서버에서 욕설이 감지되면 브라우저 알림과 UI 알림이 표시됩니다
- 감지된 텍스트, 패턴, 신뢰도, 시간 정보를 확인할 수 있습니다

## 🔧 기술 사양

### WebSocket 프로토콜

**보낼 수 있는 메시지:**
- `"ping"` (텍스트): 연결 상태 확인
- `"close"` (텍스트): 연결 종료
- `AudioBuffer` (바이너리): 실시간 오디오 데이터 (16kHz, 16bit PCM)

**받는 메시지 형태:**
```json
// 연결 확인
{
  "type": "pong",
  "message": "연결 활성"
}

// 욕설 감지
{
  "type": "detection",
  "text": "감지된텍스트",
  "pattern": "욕설패턴",
  "confidence": 0.95,
  "timestamp": "2024-08-02T15:30:00"
}

// 에러
{
  "type": "error",
  "message": "에러내용"
}
```

### 오디오 설정
- **샘플링 레이트**: 16kHz
- **비트 깊이**: 16bit
- **채널**: 모노 (1채널)
- **형식**: PCM
- **버퍼 크기**: 4096 샘플

## 🛠️ 구현 세부사항

### React hooks 사용
- `useState`: 컴포넌트 상태 관리
- `useRef`: WebSocket, 오디오 컨텍스트 참조
- `useCallback`: 메모이제이션으로 성능 최적화
- `useEffect`: 컴포넌트 생명주기 관리

### 오디오 처리
```javascript
// AudioContext 설정 (16kHz)
audioContextRef.current = new AudioContext({ sampleRate: 16000 });

// Float32Array를 16bit PCM으로 변환
const pcmBuffer = new Int16Array(inputData.length);
for (let i = 0; i < inputData.length; i++) {
  const sample = Math.max(-1, Math.min(1, inputData[i]));
  pcmBuffer[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
}
```

### 에러 처리 및 재연결
- 연결 타임아웃: 10초
- 자동 재연결: 비정상 종료 시 3초 후 재시도
- 마이크 권한 오류 처리
- WebSocket 상태별 상세 에러 메시지

## 🎨 UI 구성요소

### 연결 상태 표시
- 🟢 연결됨 (녹색)
- 🟡 연결 중 (노란색)
- 🔴 오류/연결 안됨 (빨간색/회색)

### 컨트롤 버튼
- **연결/연결 해제**: WebSocket 연결 제어
- **녹음 시작/중지**: 오디오 캡처 제어

### 알림 시스템
- **브라우저 알림**: 백그라운드에서도 욕설 감지 알림
- **UI 알림**: 상세한 감지 결과 표시

### 로그 시스템
- 실시간 이벤트 로그
- 색상별 로그 레벨 (정보/성공/경고/오류/감지)
- 자동 스크롤 및 로그 제한 (최대 50개)

## 🔒 보안 고려사항

- **HTTPS 환경**: 마이크 접근을 위해 HTTPS 환경에서 실행 권장
- **권한 관리**: 마이크 및 알림 권한 적절히 처리
- **데이터 암호화**: 프로덕션 환경에서는 WSS(WebSocket Secure) 사용 권장

## 🌐 브라우저 호환성

- Chrome 66+
- Firefox 60+
- Safari 12+
- Edge 79+

*WebRTC와 WebSocket을 지원하는 모든 모던 브라우저에서 동작합니다.*

## 🐛 트러블슈팅

### 마이크 접근 오류
- HTTPS 환경에서 실행하세요
- 브라우저 설정에서 마이크 권한을 확인하세요

### WebSocket 연결 실패
- 서버가 실행 중인지 확인하세요
- 네트워크 방화벽 설정을 확인하세요
- 브라우저 개발자 도구에서 네트워크 탭을 확인하세요

### 오디오 전송 오류
- 마이크가 제대로 연결되어 있는지 확인하세요
- 다른 애플리케이션에서 마이크를 사용 중인지 확인하세요

## 📝 라이센스

MIT License