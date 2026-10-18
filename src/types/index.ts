declare global {
  const __DESKTOP_SCOUTER_ENABLED__: boolean;
}

export type ResetType = 'daily' | 'weekly_thu' | 'weekly_sun' | 'monthly';

export interface CustomTask {
  id: string;
  title: string;
  description?: string;
  resetType: 'none' | 'daily' | 'weekly' | 'monthly';
  resetTime?: string; // '00:00' ~ '23:00'
  resetDayOfWeek?: number; // 0 (일) ~ 6 (토) - 하위 호환용
  resetDaysOfWeek?: number[]; // 0 (일) ~ 6 (토) 최대 6개 요일 선택 가능
  resetDayOfMonth?: number; // 1 ~ 31 (매월 N일)
  createdAt: string;
}

export interface TaskItem {
  id: string;
  name: string;
  category: 'daily_quest' | 'monster_park' | 'daily_boss' | 'weekly_quest' | 'epic_dungeon' | 'weekly_content' | 'weekly_boss' | 'black_mage' | 'custom';
  type: 'boolean' | 'counter';
  minLevel?: number;
  region?: string;
  icon?: string;
  badge?: string;
  resetType: ResetType;
  maxCount?: number;
  mesoValue?: number; // 주간 보스 결정석 가격
  difficulty?: 'easy' | 'normal' | 'hard' | 'chaos' | 'extreme';
  description?: string;
}

export interface BossMultiplierItem {
  id?: string;
  bossName?: string;
  difficulty?: string;
  difficultyLabel?: string;
  category?: '그란디스' | '아케인' | '루타·주간';
  multiplier: string; // 예: '115.4%' 또는 '[파티] 12%'
  multiplierNum?: number | null; // 예: 115.4
  statusLabel: string; // 예: '솔플 여유컷', '솔플 가능', '솔플 최소컷', '파티격 가능', '파티 최소컷', '불가능'
  rawImg?: string; // 예: 'hard_jupiter', 'extreme_kaling'
  iconUrl?: string; // 메이플스카우터 원본 아이콘 이미지 URL (신규 보스 자동 매핑용)
  stat?: string | number; // 보스 요구 환산 스탯
  isParty?: boolean;
  // 호버 팝업 및 레벨/포스 부족 인디케이터용 스탯
  bossLevel?: number;
  bossArcaneForce?: number;
  bossAuthenticForce?: number;
  userLevel?: number;
  userArcaneForce?: number;
  userAuthenticForce?: number;
  levelDmgPercent?: number; // 0 ~ 120%
  forceDmgPercent?: number; // 0 ~ 125% (어센틱) 또는 0 ~ 150% (아케인)
  forceType?: 'authentic' | 'arcane' | 'none';
  reqForce?: number;
  userForce?: number;
  totalDmgPenaltyPercent?: number; // 기준(100%) 대비 최종 데미지 감소율
  hasLevelPenalty?: boolean;
  hasForcePenalty?: boolean;
  isMaxSymbolShortage?: boolean;
}

export interface CharacterScouterStats {
  mainStat?: string; // 환산 주스탯 (예: '65,464' 등)
  hexaStat?: string; // 헥사 환산 주스탯 (예: '58,089' 등)
  bossMultiplier?: string; // 대표 보스 배율
  bossMultipliers?: Record<string, BossMultiplierItem>; // 보스별 메이플스카우터 실측 배율 및 판정 라벨 (0.00% 오차 1:1 일치)
  bossList?: BossMultiplierItem[]; // 메이플스카우터 원본 순서 및 신규 보스 동적 렌더링 리스트
  combatPower?: string; // 메이플스카우터 전투력
  characterClass?: string; // 직업
  arcaneForce?: number; // 아케인포스
  authenticForce?: number; // 어센틱포스
  userSymbol?: Record<string, any>; // 심볼 레벨 및 성장치 데이터
  updatedAt?: string; // 마지막 환산 갱신 일시
}

export interface CharacterInfo {
  id: string;
  ocid: string;
  characterName: string;
  worldName: string;
  characterLevel: number;
  characterClass: string;
  characterImage: string;
  characterGuildName?: string;
  favorite: boolean;
  sortOrder: number;
  enabledTaskIds: string[]; // 캐릭터별 활성화된 콘텐츠 ID 목록
  selectedBossIds: string[]; // 캐릭터별 선택된 주간 보스 ID 목록
  selectedDailyBossIds?: string[]; // 캐릭터별 선택된 일일 보스 ID 목록
  selectedBlackMageId?: string; // 선택된 검은 마법사 난이도 ('boss_hard_black_mage' | 'boss_extreme_black_mage')
  apiKeyId?: string; // 소속된 API 키 식별자 (다계정 분리 지원)
  apiKeyAlias?: string; // 소속된 API 키 별칭 캐시 (PiP 및 오프라인 고속 표시 지원)
  customTasks?: CustomTask[]; // 캐릭터별 커스텀 스케줄 목록
  weeklyBossThreshold?: number; // 주간 보스 완료 기준 마리수 (기본 12, 0~12)
  combatPower?: string; // 넥슨 Open API 공식 전투력
  arcaneForce?: number; // 캐릭터 아케인포스
  authenticForce?: number; // 캐릭터 어센틱포스
  scouterStats?: CharacterScouterStats; // 환산 데이터 (환산 주스탯, 헥사 환산 등)
  lastSyncedAt?: string;
  syncError?: boolean; // 캐릭터 정보 갱신(OCID/닉네임/서버) 실패 여부
  syncErrorMessage?: string; // 실패 사유 안내 메시지
}

export interface TaskProgressState {
  completed: boolean;
  currentCount?: number;
  maxCount?: number;
  completedAt?: string;
  autoSynced?: boolean; // API를 통해 자동으로 동기화된 여부
  difficulty?: string; // 난이도 ID ('boss_hard_black_mage' | 'boss_extreme_black_mage')
}

// dateKey: 'YYYY-MM-DD' (일일), weekKey: 'YYYY-Wxx' (목요일 기준 주간)
export interface CharacterProgressRecord {
  characterId: string;
  dailyDateKey: string; // KST YYYY-MM-DD
  weeklyThuKey: string; // KST YYYY-Wxx-THU
  weeklySunKey: string; // KST YYYY-Wxx-SUN
  monthlyKey?: string; // KST YYYY-MM (매달 1일 리셋)
  dailyTasks: Record<string, TaskProgressState>; // taskId -> state
  dailyBosses?: Record<string, TaskProgressState>; // dailyBossId -> state
  weeklyTasks: Record<string, TaskProgressState>; // taskId -> state
  weeklyBosses: Record<string, TaskProgressState>; // bossId -> state
  blackMage?: TaskProgressState; // 검은 마법사 클리어 상태 (월간)
  customTasks?: Record<string, TaskProgressState>; // customTaskId -> state
  customLastReset?: Record<string, string>; // customTaskId -> 마지막 리셋 타임스탬프 또는 리셋키
  dailyBossWeeklyLog?: Record<string, string[]>; // 날짜별(YYYY-MM-DD) 처치 완료된 일일 보스 ID 배열 (목요일 리셋)
  updatedAt: string;
}

export type PipDirection = 'horizontal' | 'vertical'; // 1. 정렬 방법: 가로 or 세로
export type PipAlign = 'left' | 'center' | 'right'; // 2. 정렬 방향: 좌측 or 중앙 or 우측
export type PipPosition = 'top' | 'center' | 'bottom'; // 3. 정렬 위치: 상단 or 중앙 or 하단

export interface PipSettings {
  enabled: boolean;
  opacity: number; // 20 ~ 100
  direction: PipDirection;
  align: PipAlign;
  position: PipPosition;
  hideCompleted: boolean; // 모든 스케줄 완료 시 해당 캐릭터 카드 pip 안 보이게 하기
  onlyFavorites?: boolean; // 즐겨찾기 한 캐릭터 카드만 pip에 표시
  onlyAvatar?: boolean; // 캐릭터 프로필 사진만 나오게 축소
  visibleCount?: number; // 1 ~ 8 (노출할 카드 크기/개수 조절)
  showCommonContent?: boolean; // 계정 공통 컨텐츠 표시
}

export interface NotificationSettings {
  enabled: boolean;
  hours: number; // 0 ~ 23
  minutes: number; // 0 ~ 55 (5분 단위)
  onlyFavorites?: boolean; // 즐겨찾기 캐릭터만 알림 적용
}

export interface ApiKeyItem {
  id: string;
  alias: string;
  apiKey: string;
  createdAt: string;
}

export interface AppSettings {
  autoStart: boolean;
  backgroundNotification?: boolean;
  incompleteCharacterIcon: boolean;
  showCompletedIcon: boolean;
  darkMode: boolean;
  autoSyncIntervalSec: number; // 기본 120초 (2분)
  soundEnabled: boolean;
  includeCustomInCardCompletion?: boolean; // 커스텀을 캐릭터 카드 완료 기준에 포함 여부
  includeBlackMageInCardCompletion?: boolean; // 검은 마법사를 캐릭터 카드 완료 기준에 포함 여부
  includeCustomInCompletion?: boolean;
  includeBlackMageInCompletion?: boolean;
  notifier?: NotificationSettings; // 알림이 기능 설정
  pip?: PipSettings;
}

export interface AppDataPayload {
  characters: CharacterInfo[];
  records: Record<string, CharacterProgressRecord>; // characterId -> record
  settings: AppSettings;
  activeCharacterId: string | null;
  lastServerSync: string;
  apiKeys?: ApiKeyItem[]; // 등록된 넥슨 Open API 키 목록 (완전 복원 지원)
  commonContentIds?: string[]; // 계정 공통 컨텐츠 ID 목록
}

export interface NexonCharacterBasic {
  date: string;
  character_name: string;
  world_name: string;
  character_gender: string;
  character_class: string;
  character_class_level: string;
  character_level: number;
  character_exp: number;
  character_exp_rate: string;
  character_guild_name: string;
  character_image: string;
}

export interface NexonSchedulerState {
  date?: string;
  character_name?: string;
  scheduler?: any;
  boss_contents?: any[];
  daily_contents?: any[];
  weekly_contents?: any[];
  scheduler_info?: Array<{
    category_name?: string;
    content_name?: string;
    clear_yn?: string; // 'Y' or 'N'
    current_count?: number;
    max_count?: number;
  }>;
  raw?: any;
  [key: string]: any;
}

export interface NexonAccountCharacter {
  ocid: string;
  character_name: string;
  world_name: string;
  character_class: string;
  character_level: number;
  character_image?: string;
  character_gender?: string;
  character_guild_name?: string;
  apiKeyId?: string; // 소속된 API 키 고유 ID
  apiKeyAlias?: string; // 소속된 API 키 별칭 (예: 본계정, 부계정)
}
