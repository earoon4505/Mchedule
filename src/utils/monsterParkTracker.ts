import { getKSTDailyKey } from './time';

/**
 * 몬스터파크 계정/월드별 당일 클리어 추적 및 API 공인 완료(One-Way Ratchet) 관리 모듈
 * 
 * [목적]
 * 1. 넥슨 Open API는 캐릭터 단일 기준(해당 캐릭터의 월드)으로만 몬스터파크 클리어 횟수를 반환합니다.
 * 2. 따라서 크로아에서 1회, 챌린저스에서 1회 분할 클리어 시, 개별 응답만으로는 2회 달성 여부를 알 수 없습니다.
 * 3. 이 모듈은 동일 계정(apiKeyId) 내에서 각 월드(worldName)별 당일 클리어 횟수를 누적 합산하여
 *    합산 2회 이상이 달성되거나 API에서 완료 플래그가 들어오는 즉시 "당일 API 공인 완료(apiVerifiedCompleted)" 도장을 찍습니다.
 * 4. 한 번 공인 완료 도장이 찍히면, 당일 자정(KST) 전까지 다른 월드 캐릭터의 0회 응답이나 수동 조작에도
 *    풀리지 않고 100% 완료 상태를 안전하게 유지합니다.
 * 5. 인게임에서 아직 클리어하지 않고 수동 체크만 해둔 상태라면, API 동기화 시 0회 응답에 의해 자동으로 체크가 해제됩니다.
 */

export interface AccountMonsterParkState {
  dateKey: string; // YYYY-MM-DD (KST)
  worldCounts: Record<string, number>; // { "크로아": 1, "챌린저스": 1 }
  apiVerifiedCompleted: boolean; // 당일 API를 통해 2회 이상 달성 확인 여부
  lastUpdated: string;
}

const STORAGE_KEY = 'mapleschedule_monster_park_tracker_v1';

// 메모리 캐시 (빠른 조회 및 동기화)
const memoryCache: Record<string, AccountMonsterParkState> = {};

/**
 * 로컬 스토리지에서 전체 트래커 데이터 로드
 */
function loadAllTrackers(): Record<string, AccountMonsterParkState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * 전체 트래커 데이터 저장
 */
function saveAllTrackers(data: Record<string, AccountMonsterParkState>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('몬스터파크 트래커 저장 실패:', e);
  }
}

/**
 * 특정 계정(apiKeyId)의 당일 몬스터파크 상태 조회 (날짜가 지났으면 자동 초기화)
 */
export function getAccountMonsterParkState(apiKeyId: string = 'default'): AccountMonsterParkState {
  const todayKey = getKSTDailyKey();
  const effectiveKey = apiKeyId || 'default';

  // 1. 메모리 캐시 확인
  let state = memoryCache[effectiveKey];
  if (!state) {
    const all = loadAllTrackers();
    state = all[effectiveKey];
  }

  // 2. 날짜가 다르거나 데이터가 없으면 새 날짜로 초기화
  if (!state || state.dateKey !== todayKey) {
    state = {
      dateKey: todayKey,
      worldCounts: {},
      apiVerifiedCompleted: false,
      lastUpdated: new Date().toISOString(),
    };
    memoryCache[effectiveKey] = state;
    const all = loadAllTrackers();
    all[effectiveKey] = state;
    saveAllTrackers(all);
  } else {
    memoryCache[effectiveKey] = state;
  }

  return state;
}

/**
 * 넥슨 API 응답 수신 시 월드별 몬스터파크 횟수 기록 및 계정 합산 완료 여부 평가
 * 
 * @param apiKeyId 계정 식별자
 * @param worldName 캐릭터 월드명 (예: "크로아", "챌린저스")
 * @param count 넥슨 API에서 응답받은 횟수 (now_count)
 * @param isDirectlyCompleted 넥슨 API에서 직접 quest_state="2" 등으로 완료 판정되었는지 여부
 */
export function recordWorldMonsterParkCount(
  apiKeyId: string = 'default',
  worldName: string,
  count: number,
  isDirectlyCompleted: boolean = false
): { totalCount: number; isCompleted: boolean; isApiVerified: boolean } {
  const effectiveKey = apiKeyId || 'default';
  const effectiveWorld = worldName || '기본월드';
  const state = getAccountMonsterParkState(effectiveKey);

  const safeCount = Math.max(0, Number(count) || 0);

  // 해당 월드의 클리어 횟수 갱신 (더 큰 값 또는 최신 API 값 반영)
  // 단, 인게임에서 돈 횟수는 줄어들지 않으므로 Math.max 유지
  const prevWorldCount = state.worldCounts[effectiveWorld] || 0;
  state.worldCounts[effectiveWorld] = Math.max(prevWorldCount, safeCount);

  // 계정 내 모든 월드의 클리어 횟수 총합 계산
  const totalCount = Object.values(state.worldCounts).reduce((sum, c) => sum + c, 0);

  // 완료 조건: 계정 전체 월드 합산 >= 2회 또는 넥슨 API 직접 완료 플래그
  if (totalCount >= 2 || isDirectlyCompleted || safeCount >= 2) {
    state.apiVerifiedCompleted = true;
  }

  state.lastUpdated = new Date().toISOString();
  memoryCache[effectiveKey] = state;

  const all = loadAllTrackers();
  all[effectiveKey] = state;
  saveAllTrackers(all);

  return {
    totalCount,
    isCompleted: state.apiVerifiedCompleted || totalCount >= 2,
    isApiVerified: state.apiVerifiedCompleted,
  };
}

/**
 * 특정 계정이 오늘 API를 통해 몬스터파크를 공인 완료했는지 확인
 */
export function isAccountMonsterParkApiVerified(apiKeyId: string = 'default'): boolean {
  const state = getAccountMonsterParkState(apiKeyId);
  return !!state.apiVerifiedCompleted;
}

/**
 * 특정 계정의 오늘 전체 월드 합산 몬스터파크 횟수 조회
 */
export function getAccountMonsterParkTotalCount(apiKeyId: string = 'default'): number {
  const state = getAccountMonsterParkState(apiKeyId);
  return Object.values(state.worldCounts).reduce((sum, c) => sum + c, 0);
}
