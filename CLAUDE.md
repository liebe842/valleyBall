# Body Volleyball Game - 프로젝트 가이드

## 프로젝트 개요

**프로젝트명**: Body Volleyball Game (바디 모션 배구 게임)
**버전**: v1.0 MVP
**기술 스택**: p5.js + ml5.js (PoseNet)
**게임 타입**: 2인 대전 액티브 게임
**참고**: 피카츄 배구 (1997)

이 프로젝트는 웹캠을 통해 플레이어의 손 동작을 인식하여 배구 게임을 플레이하는 인터랙티브 게임입니다.

---

## 파일 구조

```
/valleyBall
├── index.html          # 메인 HTML (라이브러리 로드, 캔버스 컨테이너)
├── sketch.js           # p5.js 메인 루프 (setup, draw, PoseNet 초기화)
├── ball.js             # Ball 클래스 (물리 엔진, 충돌 감지)
├── player.js           # Player 클래스 (손목 추적, 렌더링)
├── game.js             # Game 클래스 (게임 상태, 점수, 승패 관리)
├── CLAUDE.md           # 이 파일 (프로젝트 가이드)
└── README.md           # 사용자용 설명서 (예정)
```

---

## 핵심 클래스 및 책임

### 1. Ball 클래스 (`ball.js`)

**책임**: 공의 물리 법칙 및 충돌 처리

**주요 속성**:
- `pos` (Vector): 공의 현재 위치
- `vel` (Vector): 공의 속도 벡터
- `radius`: 20 (지름 40px)
- `gravity`: 0.5 (중력 가속도)
- `bounceCoefficient`: 0.7 (바닥 반발 계수)

**주요 메서드**:
- `update()`: 물리 업데이트 (중력, 이동, 벽/바닥 충돌), 득점 시 플레이어 번호 반환
- `handleFloorCollision()`: 바닥 충돌 시 득점 판정 (1 or 2)
- `checkNetCollision()`: 네트 충돌 시 x속도 감소 (0.5배)
- `checkHandCollision(p1Hands, p2Hands)`: 손-공 충돌 감지 (60px 반경)
- `hitByHand(handX)`: 손에 맞았을 때 속도 변경 (x방향 반전 1.2~1.5배, y방향 -8 고정)
- `serve(fromRight)`: 서브 위치 및 초기 속도 설정
- `display()`: 공 렌더링 (그림자 포함)

**충돌 감지 우선순위**:
1. 손-공 충돌 (최우선)
2. 네트 충돌
3. 바닥 충돌 (득점)

---

### 2. Player 클래스 (`player.js`)

**책임**: PoseNet 데이터를 통한 플레이어 손 위치 추적

**주요 속성**:
- `playerNumber`: 1 (좌측, 파란색) or 2 (우측, 빨간색)
- `hands`: 손목 위치 배열 `[{x, y}, ...]`
- `color`: 플레이어별 색상
- `isDetected`: 현재 프레임에서 감지 여부

**주요 메서드**:
- `updateFromPose(pose)`: PoseNet 포즈 데이터에서 손목(left_wrist, right_wrist) 추출
  - 신뢰도(score) 0.5 이상인 손목만 인식
- `display()`: 손 위치에 원 표시 + 플레이어 라벨
- `getHands()`: 충돌 감지용 손 배열 반환
- `detected()`: 감지 여부 boolean 반환

**좌우 구분 로직**:
- PoseNet는 x 위치로 정렬
- x < width/2 → Player 1 (좌측)
- x >= width/2 → Player 2 (우측)

---

### 3. Game 클래스 (`game.js`)

**책임**: 게임 전체 흐름 및 상태 관리

**게임 상태 (state)**:
- `WAITING`: 플레이어 대기 중 (2명 감지 대기)
- `PLAYING`: 게임 진행 중
- `WIN`: 승자 결정, 재시작 카운트다운

**주요 속성**:
- `player1Score`, `player2Score`: 점수 (0~15)
- `winScore`: 15 (승리 조건)
- `ball`: Ball 인스턴스
- `player1`, `player2`: Player 인스턴스
- `lastScorer`: 마지막 득점자 (서브권)
- `winTimer`, `winCountdown`: 승리 후 재시작 타이머

**주요 메서드**:
- `update()`: 게임 로직 업데이트 (상태별 분기)
- `startGame()`: WAITING → PLAYING 전환
- `handleScore(scorer)`: 득점 처리, 승리 조건 체크, 서브 재설정
- `reset()`: 게임 초기화 (점수 0, 상태 WAITING)
- `updatePoses(poses)`: PoseNet 결과를 플레이어에게 할당
  - x 위치 정렬 후 좌측/우측 플레이어 구분
- `display()`: 코트, 네트, 플레이어, 공, UI 렌더링
- `drawWaitingScreen()`: 대기 화면 (플레이어 감지 상태 표시)
- `drawWinScreen()`: 승리 화면 (카운트다운)

**득점 규칙**:
- 공이 좌측 바닥에 닿으면 → Player 2 득점
- 공이 우측 바닥에 닿으면 → Player 1 득점
- 득점한 플레이어가 다음 서브권 획득

---

### 4. sketch.js (메인 엔트리)

**책임**: p5.js 라이프사이클 및 PoseNet 초기화

**전역 변수**:
- `video`: 웹캠 캡처 객체
- `poseNet`: ml5 PoseNet 모델
- `poses`: 감지된 포즈 배열
- `game`: Game 인스턴스
- `isModelReady`: PoseNet 로드 완료 여부

**setup()**:
- 800x600 캔버스 생성
- 웹캠 캡처 시작 (숨김)
- PoseNet 초기화 (옵션: maxPoseDetections=2, flipHorizontal=true)
- Game 인스턴스 생성

**draw()**:
1. 비디오 배경 렌더링 (좌우 반전)
2. 반투명 오버레이
3. 모델 로딩 중이면 로딩 화면 표시
4. `game.updatePoses(poses)` - 포즈 데이터 전달
5. `game.update()` - 게임 로직 업데이트
6. `game.display()` - 화면 렌더링

**PoseNet 옵션**:
```javascript
{
  imageScaleFactor: 0.3,
  outputStride: 16,
  flipHorizontal: true,
  minConfidence: 0.5,
  maxPoseDetections: 2,  // 2명만 감지
  scoreThreshold: 0.5,
  nmsRadius: 20
}
```

**키보드 단축키**:
- `R`: 게임 리셋
- `D`: 디버그 정보 콘솔 출력

---

## 게임 플로우

```
setup() 실행
  ↓
웹캠 + PoseNet 초기화
  ↓
[WAITING 상태]
  - 2명의 플레이어 감지 대기
  - 양손 손목(wrist) 추적
  ↓
2명 감지 시 → [PLAYING 상태]
  ↓
공 서브 (랜덤 플레이어)
  ↓
게임 진행 루프:
  - 공 물리 업데이트
  - 손-공 충돌 감지
  - 네트 충돌 체크
  - 바닥 충돌 → 득점
  ↓
15점 도달 → [WIN 상태]
  ↓
3초 카운트다운
  ↓
reset() → [WAITING 상태]
```

---

## 물리 엔진 상세

### 중력 및 속도
- **중력**: 매 프레임 `vel.y += 0.5`
- **초기 서브 속도**:
  - x방향: ±3~5 (random)
  - y방향: -8 (위로)

### 바운스
- **바닥 충돌**: `vel.y *= -0.7` (30% 에너지 손실)
- **손 충돌**:
  - x속도: 반전 후 1.2~1.5배 증폭
  - y속도: -8 (고정값, 일정한 높이 튀어오름)

### 충돌 감지
- **손-공**: 유클리드 거리 < 60px
  ```javascript
  dist(ball.x, ball.y, hand.x, hand.y) < 60
  ```
- **네트-공**: `abs(ball.x - width/2) < radius` && 네트 높이 영역

---

## 화면 레이아웃

```
┌────────────────────────────────────────┐
│  Canvas: 800 x 600                      │
├────────────────────────────────────────┤
│         P1: 0    |    P2: 0            │ ← y=40 (점수판)
├──────────────────┬─────────────────────┤
│ 좌측 코트          │ 네트 │  우측 코트      │
│ (청록색 반투명)     │ x=400│ (주황색 반투명) │
│                  │  │  │                │
│  Player 1        │  │  │    Player 2    │
│  (파란색 손)       │  │  │  (빨간색 손)    │
│        ●         │  │  │                │ ← 공 (노란색)
│                  │  │  │                │
└──────────────────┴──┴──┴────────────────┘
                     ↑ y=550 (바닥선)
```

**네트 높이**: 200px (y=350~550)
**바닥선**: y=550 (height - 50)

---

## 색상 코드

- **Player 1**: `color(66, 133, 244)` - 파란색
- **Player 2**: `color(234, 67, 53)` - 빨간색
- **공**: `color(255, 215, 0)` - 금색 (#FFD700)
- **네트**: `color(255)` - 흰색
- **좌측 코트 배경**: `color(72, 209, 204, 100)` - 청록색 (투명도 100)
- **우측 코트 배경**: `color(255, 165, 0, 100)` - 주황색 (투명도 100)

---

## 성능 목표

- **프레임레이트**: 60 FPS 목표
- **PoseNet 처리**: ~20-30 FPS (모델 특성상)
- **신뢰도 임계값**: 0.5 (50% 이상만 인식)
- **최대 감지 인원**: 2명

---

## 개발 컨벤션

### 네이밍 규칙
- 클래스: PascalCase (`Ball`, `Player`, `Game`)
- 메서드/함수: camelCase (`updatePoses`, `checkCollision`)
- 상수: UPPER_SNAKE_CASE (게임 상태: `WAITING`, `PLAYING`, `WIN`)

### 좌표계
- 원점: 좌측 상단 (0, 0)
- x축: 우측으로 증가
- y축: 아래로 증가
- **주의**: 비디오는 좌우 반전됨 (`flipHorizontal: true`)

### 코드 구조
- 각 클래스는 독립 파일
- `sketch.js`는 p5.js 라이프사이클만 관리
- 게임 로직은 `Game` 클래스에 캡슐화

---

## 알려진 제약사항 (v1.0 MVP)

다음 기능은 **의도적으로 제외**되었습니다:

- ❌ 손 속도 감지 (파워샷)
- ❌ 점프 동작 인식
- ❌ 효과음 및 배경음악
- ❌ 파티클 이펙트
- ❌ 캐릭터 애니메이션
- ❌ 난이도 조절
- ❌ 스코어 저장
- ❌ 리플레이 기능

---

## 디버깅 팁

### 플레이어가 감지되지 않을 때
1. 조명 확인 (밝은 환경 권장)
2. 카메라 각도 조정
3. 손을 명확하게 들기
4. 배경과 대비되는 옷 착용
5. `D` 키로 감지 상태 확인

### 공이 이상하게 튀길 때
- `ball.js`의 `hitByHand()` 메서드 확인
- 충돌 감지 거리(60px) 조정
- 속도 증폭 배율(1.2~1.5) 조정

### FPS 저하 시
- PoseNet `imageScaleFactor` 낮추기 (0.3 → 0.2)
- `outputStride` 높이기 (16 → 32)
- 비디오 해상도 조정

---

## 향후 확장 가능성 (v2.0)

### Phase 2 - 중급 기능
- [ ] 손 속도 감지로 공 파워 조절
- [ ] 점프 동작 인식 (무릎-엉덩이 높이 차이)
- [ ] 효과음 추가 (Web Audio API)
- [ ] 파티클 이펙트 (득점 시)

### Phase 3 - 고급 기능
- [ ] 캐릭터 스프라이트
- [ ] 배경 테마 변경
- [ ] 특수 기술 (스매시, 블로킹)
- [ ] Firebase 점수 순위표
- [ ] 모바일 터치 지원

---

## 외부 의존성

### CDN 라이브러리
- **p5.js**: v1.7.0
  `https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js`

- **ml5.js**: v0.12.2
  `https://unpkg.com/ml5@0.12.2/dist/ml5.min.js`

### 브라우저 요구사항
- WebRTC 지원 (웹캠 접근)
- ES6+ 지원 (화살표 함수, 클래스)
- Canvas API
- 권장: Chrome 90+, Edge 90+

---

## 라이선스 및 출처

**개발 목적**: 교육용 게임 프로젝트
**참고 게임**: 피카츄 배구 (1997, Sachi Soft / SEGA)
**기술 스택**: p5.js (LGPL), ml5.js (MIT)

---

**마지막 업데이트**: 2025-11-22
**버전**: 1.0 MVP
