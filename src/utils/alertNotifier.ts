import { 
  CharacterInfo, 
  CharacterProgressRecord, 
  NotificationSettings, 
  AppSettings 
} from '../types';
import { 
  getSecondsUntilDailyReset, 
  getSecondsUntilWeeklyThuReset, 
  getSecondsUntilWeeklySunReset, 
  getSecondsUntilMonthlyReset,
  getSecondsUntilCustomTaskReset,
  getKSTDailyKey,
  getKSTWeeklyThuKey
} from './time';
import { getCharacterCompletionStatus } from './schedulerParser';
import { 
  ALL_COMMON_CONTENTS, 
  CommonContentItem, 
  getStoredCommonContentIds, 
  isCommonTaskCompleted 
} from './commonContents';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  hours: 0,
  minutes: 30,
  onlyFavorites: false,
};

export interface CharacterAlertStatus {
  hasAnyAlert: boolean;
  dailyAlert: boolean;
  dailyBossAlert: boolean;
  weeklyAlert: boolean;
  bossAlert: boolean;
  blackMageAlert: boolean;
  customAlert: boolean;
  incompleteSummary: {
    dailyRemaining: number;
    dailyBossRemaining: number;
    weeklyRemaining: number;
    bossRemaining: number;
    blackMageIncomplete: boolean;
    customRemaining: number;
  };
}

export interface AccountAlertStatus {
  hasAlert: boolean;
  incompleteTasks: CommonContentItem[];
  dailyAlert: boolean;
  weeklyAlert: boolean;
}

export interface ResetAlertActiveMap {
  daily: boolean;
  weeklyThu: boolean;
  weeklySun: boolean;
  monthly: boolean;
}

/**
 * 설정된 @시 *분 전 기준으로 각 컨텐츠 리셋까지 남은 시간이 알림 범위에 진입했는지 판별
 */
export function getResetAlertActiveMap(
  notifier: NotificationSettings | undefined,
  now = new Date()
): ResetAlertActiveMap {
  if (!notifier || !notifier.enabled) {
    return { daily: false, weeklyThu: false, weeklySun: false, monthly: false };
  }

  const targetSec = (notifier.hours || 0) * 3600 + (notifier.minutes || 0) * 60;
  // 0시간 0분인 경우 리셋 직전 5분(300초)을 기본 임계치로 사용
  const thresholdSec = targetSec > 0 ? targetSec : 300;

  const secDaily = getSecondsUntilDailyReset(now);
  const secWeeklyThu = getSecondsUntilWeeklyThuReset(now);
  const secWeeklySun = getSecondsUntilWeeklySunReset(now);
  const secMonthly = getSecondsUntilMonthlyReset(now);

  return {
    daily: secDaily > 0 && secDaily <= thresholdSec,
    weeklyThu: secWeeklyThu > 0 && secWeeklyThu <= thresholdSec,
    weeklySun: secWeeklySun > 0 && secWeeklySun <= thresholdSec,
    monthly: secMonthly > 0 && secMonthly <= thresholdSec,
  };
}

/**
 * 특정 캐릭터의 컨텐츠 완료 상태와 리셋 임박 여부를 대조하여 알림 상태 계산
 */
export function evaluateCharacterAlerts(
  char: CharacterInfo,
  record: CharacterProgressRecord | undefined,
  resetActive: ResetAlertActiveMap,
  settings?: AppSettings,
  now = new Date()
): CharacterAlertStatus {
  const status = getCharacterCompletionStatus(char, record, {
    includeCustom: settings?.includeCustomInCompletion,
    includeBlackMage: settings?.includeBlackMageInCompletion,
  });

  const dailyRemaining = Math.max(0, status.dailyTotal - status.dailyDone);
  const dailyBossRemaining = Math.max(0, status.dailyBossTotal - status.dailyBossDone);
  const weeklyRemaining = Math.max(0, status.weeklyTotal - status.weeklyDone);
  const bossRemaining = Math.max(0, status.bossThreshold - status.clearedBossCount);
  const blackMageIncomplete = status.hasBlackMage && !status.isBlackMageDone;
  const customRemaining = Math.max(0, status.customTotal - status.customDone);

  const dailyAlert = !!(resetActive.daily && !status.isDailyAllDone && status.dailyTotal > 0);
  const dailyBossAlert = !!(resetActive.daily && !status.isDailyBossAllDone && status.dailyBossTotal > 0);
  const weeklyAlert = !!(resetActive.weeklyThu && !status.isWeeklyAllDone && status.weeklyTotal > 0);
  const bossAlert = !!(resetActive.weeklyThu && !status.isBossAllDone && status.bossThreshold > 0);
  const blackMageAlert = !!(resetActive.monthly && blackMageIncomplete);
  
  // 커스텀 태스크 알림 판별:
  // 1) 사용자가 설정한 알림 임계 시간(thresholdSec) 계산
  // 2) 각 커스텀 태스크의 다음 리셋 시각까지 남은 초(secUntilReset)를 측정하여 범위 내 진입 여부 판별
  // 3) resetType === 'none' (자동 초기화 안 함)인 경우 자정 리셋 시점에 미완료 상태이면 알림 동기화
  let customAlert = false;
  if (char.customTasks && char.customTasks.length > 0) {
    const notifierSettings = settings?.notifier;
    const targetSec = ((notifierSettings?.hours || 0) * 3600) + ((notifierSettings?.minutes || 0) * 60);
    const effectiveThresholdSec = targetSec > 0 ? targetSec : 300;

    for (const ct of char.customTasks) {
      const p = record?.customTasks?.[ct.id];
      if (!p?.completed) {
        const secUntilReset = getSecondsUntilCustomTaskReset(ct, now);
        const isApproachingReset = secUntilReset > 0 && secUntilReset <= effectiveThresholdSec;
        const isDailyFallbackActive = ct.resetType === 'none' && resetActive.daily;

        if (isApproachingReset || isDailyFallbackActive) {
          customAlert = true;
          break;
        }
      }
    }
  }

  const hasAnyAlert =
    dailyAlert ||
    dailyBossAlert ||
    weeklyAlert ||
    bossAlert ||
    blackMageAlert ||
    customAlert;

  return {
    hasAnyAlert,
    dailyAlert,
    dailyBossAlert,
    weeklyAlert,
    bossAlert,
    blackMageAlert,
    customAlert,
    incompleteSummary: {
      dailyRemaining,
      dailyBossRemaining,
      weeklyRemaining,
      bossRemaining,
      blackMageIncomplete,
      customRemaining,
    },
  };
}

/**
 * 계정 공통 컨텐츠(몬스터파크, 에픽 던전 등)의 미완료 상태 및 리셋 임박 여부 판별
 */
export function evaluateAccountAlerts(
  characters: CharacterInfo[],
  records: Record<string, CharacterProgressRecord>,
  activeMap: ResetAlertActiveMap,
  settings?: AppSettings,
  targetApiKeyId?: string
): AccountAlertStatus {
  // 등록된 캐릭터가 없으면 알림 없음
  if (!characters || characters.length === 0) {
    return { hasAlert: false, incompleteTasks: [], dailyAlert: false, weeklyAlert: false };
  }

  // targetApiKeyId가 지정된 경우 동일 계정 캐릭터 목록 기준으로 판별
  const hasAnyApiKey = characters.some((c) => !!c.apiKeyId);
  const targetCharacters = (hasAnyApiKey && targetApiKeyId)
    ? characters.filter((c) => c.apiKeyId === targetApiKeyId)
    : characters;
  const effectiveChars = targetCharacters.length > 0 ? targetCharacters : characters;

  const enabledIds = getStoredCommonContentIds();
  const incompleteTasks: CommonContentItem[] = [];
  let dailyAlert = false;
  let weeklyAlert = false;

  for (const item of ALL_COMMON_CONTENTS) {
    if (!enabledIds.includes(item.id)) continue;

    const isDone = isCommonTaskCompleted(item.id, effectiveChars, records);
    if (!isDone) {
      if (item.type === 'daily' && activeMap.daily) {
        dailyAlert = true;
        incompleteTasks.push(item);
      } else if (item.type === 'weekly' && activeMap.weeklyThu) {
        weeklyAlert = true;
        incompleteTasks.push(item);
      }
    }
  }

  return {
    hasAlert: incompleteTasks.length > 0,
    incompleteTasks,
    dailyAlert,
    weeklyAlert,
  };
}

/**
 * 띠링 띠링 사운드 1회 재생 (Web Audio API 활용, 외부 의존성 없음)
 */
export function playChimePair(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // 첫 번째 띠링: F5 (698.46 Hz) -> A5 (880 Hz) 부드러운 상행음
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(698.46, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // 두 번째 띠링: C6 (1046.5 Hz) 맑은 울림 (0.15초 뒤)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.15);
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

/**
 * 팝업 등장 시 '띠링 띠링' 소리가 주기적으로 울리는 루프 컨트롤러
 */
export class ChimeLoopController {
  private timer: any = null;

  public start(intervalMs = 1800): void {
    this.stop();
    playChimePair(); // 최초 즉시 재생
    this.timer = setInterval(() => {
      playChimePair();
    }, intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

/**
 * 팝업 최초 1회 발동 여부를 추적하기 위한 현재 활성 사이클 고유 키 생성
 * (주의: 사용자의 체크/완료 여부와 무관하게 순수 '시간대 윈도우' 기준으로만 생성되어 체크 토글 시 키가 변하지 않음)
 */
export function getActiveAlertCycleKey(
  notifier: NotificationSettings,
  activeMap: ResetAlertActiveMap,
  charactersOrCustom: CharacterInfo[] | boolean = [],
  now = new Date()
): string {
  const parts: string[] = [];
  if (activeMap.daily) {
    parts.push(`daily_${getKSTDailyKey(now)}`);
  }
  if (activeMap.weeklyThu) {
    parts.push(`weeklyThu_${getKSTWeeklyThuKey(now)}`);
  }
  if (activeMap.weeklySun) {
    parts.push(`weeklySun_${getKSTDailyKey(now)}`);
  }
  if (activeMap.monthly) {
    const kst = new Date(now.getTime() + 9 * 3600000);
    parts.push(`monthly_${kst.getUTCFullYear()}-${kst.getUTCMonth() + 1}`);
  }

  // 커스텀 태스크들의 임박 리셋 시간대 윈도우 키
  if (Array.isArray(charactersOrCustom)) {
    const targetSec = ((notifier?.hours || 0) * 3600) + ((notifier?.minutes || 0) * 60);
    const effectiveThresholdSec = targetSec > 0 ? targetSec : 300;

    const customTimeKeys = new Set<string>();
    for (const char of charactersOrCustom) {
      if (notifier?.onlyFavorites && !char.favorite) continue;
      if (!char.customTasks) continue;
      for (const ct of char.customTasks) {
        if (ct.resetType === 'none') continue;
        const secUntilReset = getSecondsUntilCustomTaskReset(ct, now);
        if (secUntilReset > 0 && secUntilReset <= effectiveThresholdSec) {
          // 다음 리셋 시각 기준 고유 윈도우 키 (분 단위)
          const resetTimeMinuteTimestamp = Math.floor((now.getTime() + secUntilReset * 1000) / 60000);
          customTimeKeys.add(`custom_${ct.resetType}_${resetTimeMinuteTimestamp}`);
        }
      }
    }
    if (customTimeKeys.size > 0) {
      const sortedKeys = Array.from(customTimeKeys).sort();
      parts.push(...sortedKeys);
    }
  } else if (charactersOrCustom === true) {
    const kst = new Date(now.getTime() + 9 * 3600000);
    parts.push(`custom_${getKSTDailyKey(now)}_${kst.getUTCHours()}`);
  }

  return parts.join('|');
}
