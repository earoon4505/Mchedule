# 📊 2. 메케줄 데이터 구조 명세서 (DATA_STRUCTURE.md)

이 문서는 **MapleSchedule (메케줄)** 애플리케이션의 핵심 데이터 모델, TypeScript 타입 정의, 스토리지 저장 규격 및 동기화 페이로드를 정의합니다.

---

## 🧩 1. 핵심 인터페이스 (`src/types/index.ts`)

### 1.1 `CharacterInfo` (캐릭터 기본 정보)
각 캐릭터의 고유 메타데이터와 개별 콘텐츠 설정 상태를 보관합니다.
```typescript
export interface CharacterInfo {
  id: string;                      // 클라이언트 내부 고유 ID (생성 시 난수/타임스탬프)
  ocid: string;                    // 넥슨 Open API 캐릭터 고유 식별자 (월드리프 시 자동 갱신)
  characterName: string;           // 캐릭터명
  worldName: string;               // 월드(서버)명 (예: 루나, 스카니아 등)
  characterLevel: number;          // 레벨
  characterClass: string;          // 직업
  characterImage: string;          // 아바타 이미지 URL (웹: 넥슨 CDN / 데스크톱: 로컬 프록시)
  characterGuildName?: string;     // 길드명
  favorite: boolean;               // 즐겨찾기(별) 등록 여부
  sortOrder: number;               // 사이드바 정렬 순서
  enabledTaskIds: string[];        // 캐릭터별 활성화된 일반 콘텐츠 ID 목록
  selectedBossIds: string[];       // 캐릭터별 활성화된 주간 보스 ID 목록
  selectedDailyBossIds?: string[]; // 캐릭터별 활성화된 일일 보스 ID 목록
  selectedBlackMageId?: string;    // 검은 마법사 난이도 ('boss_hard_black_mage' | 'boss_extreme_black_mage')
  apiKeyId?: string;               // 소속된 넥슨 API 키 ID (다계정 분리 핵심 키)
  customTasks?: CustomTask[];      // 캐릭터 전용 커스텀 스케줄 목록
  weeklyBossThreshold?: number;    // 주간 보스 완료 기준 마리수 (기본 12마리, 0~12)
  lastSyncedAt?: string;           // 마지막 인게임 스케줄러 동기화 일시
}
```

### 1.2 `CharacterProgressRecord` (진행도 및 클리어 상태 레코드)
캐릭터별 일일/주간/월간/커스텀 퀘스트의 완료 상태 및 날짜 사이클 키를 보관합니다.
```typescript
export interface CharacterProgressRecord {
  characterId: string;
  dailyDateKey: string;            // 일일 사이클 키 (KST 기준 'YYYY-MM-DD', 자정 00:00 리셋)
  weeklyThuKey: string;            // 주간 목요일 사이클 키 ('YYYY-Wxx-THU', 목요일 00:00 리셋)
  weeklySunKey: string;            // 주간 일요일 사이클 키 ('YYYY-Wxx-SUN', 일요일 자정/월요일 리셋)
  monthlyKey?: string;             // 월간 사이클 키 ('YYYY-MM', 매월 1일 자정 리셋)
  dailyTasks: Record<string, TaskProgressState>;     // 일일 일반 퀘스트/몬파 등 (taskId -> 상태)
  dailyBosses?: Record<string, TaskProgressState>;   // 일일 보스 (dailyBossId -> 상태)
  weeklyTasks: Record<string, TaskProgressState>;    // 주간 퀘스트/에픽던전/수로 등 (taskId -> 상태)
  weeklyBosses: Record<string, TaskProgressState>;   // 주간 보스 (bossId -> 상태)
  blackMage?: TaskProgressState;                     // 검은 마법사 클리어 상태 (월간)
  customTasks?: Record<string, TaskProgressState>;   // 커스텀 스케줄 (customTaskId -> 상태)
  customLastReset?: Record<string, string>;          // 커스텀 스케줄별 마지막 리셋 타임스탬프/키
  dailyBossWeeklyLog?: Record<string, string[]>;     // 요일별(YYYY-MM-DD) 일일보스 처치 히스토리 로그
  updatedAt: string;                                 // 마지막 로컬 갱신 타임스탬프
}
```

### 1.3 `TaskProgressState` (단일 태스크 완료 상태)
```typescript
export interface TaskProgressState {
  completed: boolean;       // 완료 여부 (체크박스 체크 상태)
  currentCount?: number;    // 카운터형 태스크 현재 횟수
  maxCount?: number;        // 카운터형 태스크 목표 횟수
  completedAt?: string;     // 완료 처리된 시각 (ISO 문자열)
  autoSynced?: boolean;     // 인게임 Open API 스케줄러를 통해 자동 체크되었는지 여부
  difficulty?: string;      // 선택된 난이도 식별자
}
```

### 1.4 `ApiKeyItem` (다중 API 키 및 계정 별칭)
```typescript
export interface ApiKeyItem {
  id: string;        // API 키 레코드 고유 ID (UUID 또는 난수)
  alias: string;     // 사용자가 설정한 계정 별칭 (예: '본계정', '부계정', '리부트')
  apiKey: string;    // 넥슨 Open API Secret Key
  createdAt: string; // 등록 일시
}
```

### 1.5 `AppSettings` & `PipSettings` (앱 및 PiP 설정)
```typescript
export interface AppSettings {
  autoStart: boolean;                     // Windows 시작 시 자동 실행 여부
  backgroundNotification?: boolean;      // 백그라운드 알림 여부
  incompleteCharacterIcon: boolean;      // 미완료 캐릭터 강조 아이콘 표시 여부
  showCompletedIcon: boolean;            // 완료된 캐릭터 완료 뱃지 표시 여부
  darkMode: boolean;                     // 다크 모드 활성화 여부
  autoSyncIntervalSec: number;           // 자동 동기화 주기 (초 단위, 기본 120초)
  soundEnabled: boolean;                 // 체크 시 효과음 재생 여부
  includeCustomInCompletion?: boolean;   // 커스텀 스케줄을 캐릭터 완료 기준에 포함할지 여부
  includeBlackMageInCompletion?: boolean;// 검은 마법사를 캐릭터 완료 기준에 포함할지 여부
  notifier?: NotificationSettings;       // 초기화 알리미 설정
  pip?: PipSettings;                     // PiP (Always-on-Top) 창 설정
}

export interface PipSettings {
  enabled: boolean;                      // PiP 오버레이 활성화 여부
  opacity: number;                       // 투명도 (20 ~ 100)
  direction: 'horizontal' | 'vertical';  // 레이아웃 방향: 가로 또는 세로
  align: 'left' | 'center' | 'right';    // 정렬 방향: 좌측, 중앙, 우측
  position: 'top' | 'center' | 'bottom'; // 정렬 위치: 상단, 중앙, 하단
  hideCompleted: boolean;                // 전체 완료 시 해당 캐릭터 카드 자동 숨김
  onlyFavorites?: boolean;               // 즐겨찾기 캐릭터만 표시
  onlyAvatar?: boolean;                  // 아바타 프로필만 미니멀 축소 표시
  visibleCount?: number;                 // 표시할 캐릭터 수 한도 (1 ~ 8)
  showCommonContent?: boolean;           // 계정 공통 컨텐츠(몬파, 에픽던전) 및 계정 인디케이터 표시
}
```

---

## 💾 2. 데이터 영속성 및 저장소 구조

| 저장소 위치 | 환경 | 내용 | 동기화 방식 |
| :--- | :--- | :--- | :--- |
| **`localStorage`** (`mapleschedule_app_data_v1`) | 브라우저 (웹) & Electron Renderer | `AppDataPayload` 전체 상태 JSON 보관 | 상태 변경 시 즉시 기록 + 디바운스 세이브 |
| **`data/storage.json`** | Windows 데스크톱 (Electron 로컬) | `AppDataPayload` 로컬 디스크 파일 저장 | Express 백엔드 API (`/api/data`)를 통해 영구 저장 |
| **`sessionStorage`** | 웹 & 데스크톱 | 아바타 프로필 사진 보강 캐시 (`avatar_cache_...`) | 브라우저 세션 유지 동안 재요청 방지 |
| **`BroadcastChannel`** (`mapleschedule_sync_channel`) | 브라우저 탭 & 독립 PiP 창 | 창 간 상태 동기화 및 0ms API 키 변경 전파 | 실시간 이벤트 브로드캐스트 |

### `AppDataPayload` 구조
```typescript
export interface AppDataPayload {
  characters: CharacterInfo[];
  records: Record<string, CharacterProgressRecord>;
  settings: AppSettings;
  activeCharacterId: string | null;
  lastServerSync: string;
}
```
