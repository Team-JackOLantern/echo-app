# WebSocket 연결 문제 해결 가이드

## 🚨 발생한 문제

WebSocket이 연결된 후 곧바로 **코드 1000(정상 종료)**로 연결이 끊어지는 문제가 발생했습니다.

```
LOG  ✅ WebSocket 연결 성공!
LOG  ❌ WebSocket 연결 끊김: 1000 null
```

## 🔧 적용된 수정사항

### 1. **연결 프로토콜 개선**
```javascript
// 기존: 단순 "ping" 텍스트 전송
wsRef.current.send('ping');

// 수정: JSON 형태의 구조화된 메시지
const keepAliveMessage = JSON.stringify({
  type: 'keep_alive',
  timestamp: Date.now(),
  user_id: userId
});
wsRef.current.send(keepAliveMessage);
```

### 2. **연결 해제 시 적절한 종료 메시지 전송**
```javascript
// 연결 해제 시 서버에 알림
const closeMessage = JSON.stringify({
  type: 'close',
  user_id: userId,
  timestamp: Date.now()
});
wsRef.current.send(closeMessage);
```

### 3. **향상된 재연결 로직**
- 코드 1000(정상 종료) 시 서버 상태 확인 메시지 표시
- 비정상 종료 시에만 자동 재연결 시도
- 재연결 간격을 3초 → 5초로 증가

### 4. **오디오 전송 최적화**
- 음성 활동 감지 (VAD) 추가
- 볼륨 임계값(0.01) 이상일 때만 오디오 데이터 전송
- 노이즈 필터링으로 불필요한 데이터 전송 방지

### 5. **에러 처리 강화**
- 모든 WebSocket 전송에 try-catch 추가
- 상세한 연결 종료 이유 분석
- 타이머 및 리소스 정리 개선

## 🧪 테스트 방법

### 1. **서버 상태 확인**
서버가 다음과 같은 메시지를 제대로 처리하는지 확인:
```json
// Keep-alive 메시지
{
  "type": "keep_alive",
  "timestamp": 1691234567890,
  "user_id": "ae8fb765"
}

// 종료 메시지
{
  "type": "close",
  "user_id": "ae8fb765",
  "timestamp": 1691234567890
}
```

### 2. **연결 테스트 시나리오**
1. WebSocket 연결 후 1초 대기
2. Keep-alive 메시지가 전송되는지 확인
3. 서버에서 적절한 응답을 보내는지 확인
4. 5분간 연결 유지 테스트

### 3. **오디오 전송 테스트**
1. 마이크 권한 허용
2. 조용한 환경에서 노이즈 필터링 확인
3. 말할 때만 오디오 데이터 전송되는지 확인

## 🔍 서버 측 확인사항

### 1. **WebSocket 핸들러 검증**
서버에서 다음을 확인해주세요:

```python
# 예시: Python FastAPI
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    
    try:
        while True:
            # 텍스트 메시지 처리
            message = await websocket.receive_text()
            data = json.loads(message)
            
            if data.get("type") == "keep_alive":
                # Keep-alive 응답
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "message": "연결 활성"
                }))
            
            elif data.get("type") == "close":
                # 정상 종료
                await websocket.close(code=1000)
                break
                
    except Exception as e:
        await websocket.close(code=1011)  # 서버 오류
```

### 2. **바이너리 데이터 처리**
```python
# 오디오 데이터 수신
try:
    audio_data = await websocket.receive_bytes()
    # 16bit PCM 데이터 처리
    audio_array = np.frombuffer(audio_data, dtype=np.int16)
    # 욕설 감지 로직 실행
    
except Exception as e:
    logger.error(f"Audio processing error: {e}")
```

## 🛠️ 추가 디버깅 팁

### 1. **브라우저 개발자 도구**
- Network 탭에서 WebSocket 연결 상태 확인
- Console에서 상세 로그 확인

### 2. **서버 로그 분석**
```bash
# 서버 로그에서 확인할 항목
- WebSocket 연결 수락 로그
- Keep-alive 메시지 수신 로그
- 오디오 데이터 수신 로그
- 연결 종료 이유 로그
```

### 3. **네트워크 환경 확인**
- ngrok 터널이 활성 상태인지 확인
- 방화벽이나 프록시 설정 확인
- HTTPS/WSS 인증서 문제 확인

## 📋 해결 체크리스트

- [ ] 서버에서 keep_alive 메시지 처리 구현
- [ ] 서버에서 close 메시지 처리 구현  
- [ ] 서버 로그에서 연결 종료 이유 확인
- [ ] 클라이언트에서 개선된 코드 적용
- [ ] 5분 이상 연결 유지 테스트
- [ ] 오디오 전송 및 욕설 감지 테스트

## 🎯 예상 결과

수정 후 다음과 같은 로그가 표시되어야 합니다:

```
LOG  ✅ WebSocket 연결 성공
LOG  Keep-alive 메시지 전송
LOG  📥 WebSocket 메시지 수신: {"type":"pong","message":"연결 활성"}
LOG  🎤 오디오 녹음 시작 (16kHz, 16bit PCM)
LOG  📤 오디오 데이터 전송 중...
```

연결이 유지되고 욕설 감지가 정상적으로 작동해야 합니다.