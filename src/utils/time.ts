import { CharacterInfo, CharacterProgressRecord, CustomTask, TaskProgressState } from '../types';

/**
 * Asia/Seoul (KST, UTC+9) Timezone Utilities
 */

// 현재 KST Date 객체 생성
export function getKSTDate(now = new Date()): Date {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstOffset = 9 * 60 * 60000;
  return new Date(utc + kstOffset);
}

// KST 기준 일일 날짜 키 (YYYY-MM-DD)
export function getKSTDailyKey(now = new Date()): string {
  const kst = getKSTDate(now);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// KST 기준 목요일 00:00 리셋 주간 키
// 메이플스토리 주간 보스 & 에픽던전 & 주간퀘스트는 매주 목요일 00:00 KST에 리셋됨
export function getKSTWeeklyThuKey(now = new Date()): string {
  const kst = getKSTDate(now);
  // day of week: 0(일), 1(월), 2(화), 3(수), 4(목), 5(금), 6(토)
  const day = kst.getDay();
  // 지난 목요일까지 뺀 날짜 계산 (목요일이 당일이면 diff = 0)
  const diffToThu = (day >= 4 ? day - 4 : day + 3);
  
  const thuDate = new Date(kst.getTime() - diffToThu * 24 * 60 * 60 * 1000);
  const y = thuDate.getFullYear();
  const m = String(thuDate.getMonth() + 1).padStart(2, '0');
  const d = String(thuDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}-THU`;
}

// 이번 주 목요일 00:00 KST부터 어제까지의 과거 날짜 목록(YYYY-MM-DD) 반환
// 오늘이 목요일이면 과거 날짜 없음([] 반환), 금요일이면 [목], 화요일이면 [목, 금, 토, 일, 월] 반환
export function getPastDatesInCurrentWeeklyThuCycle(now = new Date()): string[] {
  const kst = getKSTDate(now);
  const day = kst.getDay(); // 0(일), 1(월), 2(화), 3(수), 4(목), 5(금), 6(토)
  const diffToThu = (day >= 4 ? day - 4 : day + 3);

  if (diffToThu <= 0) {
    return [];
  }

  const dates: string[] = [];
  for (let i = diffToThu; i >= 1; i--) {
    const pastDate = new Date(kst.getTime() - i * 24 * 60 * 60 * 1000);
    const y = pastDate.getFullYear();
    const m = String(pastDate.getMonth() + 1).padStart(2, '0');
    const d = String(pastDate.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
  }
  return dates;
}

// KST 기준 일요일 23:30 ~ 월요일 00:00 리셋 주간 키 (무릉, 지하수로 등)
export function getKSTWeeklySunKey(now = new Date()): string {
  const kst = getKSTDate(now);
  const day = kst.getDay();
  // 지난 월요일 날짜 기준
  const diffToMon = (day === 0 ? 6 : day - 1);
  
  const monDate = new Date(kst.getTime() - diffToMon * 24 * 60 * 60 * 1000);
  const y = monDate.getFullYear();
  const m = String(monDate.getMonth() + 1).padStart(2, '0');
  const d = String(monDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}-SUN`;
}

// KST 기준 월간 키 (YYYY-MM) - 매달 1일 00:00 KST 리셋 (검은 마법사 등)
export function getKSTMonthlyKey(now = new Date()): string {
  const kst = getKSTDate(now);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// 다음 일일 리셋(매일 자정 KST)까지 남은 시간 (초)
export function getSecondsUntilDailyReset(now = new Date()): number {
  const kst = getKSTDate(now);
  const nextMidnight = new Date(kst);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((nextMidnight.getTime() - kst.getTime()) / 1000));
}

// 다음 주간 목요일 리셋까지 남은 시간 (초)
export function getSecondsUntilWeeklyThuReset(now = new Date()): number {
  const kst = getKSTDate(now);
  const day = kst.getDay();
  let daysUntilThu = 4 - day;
  if (daysUntilThu <= 0) {
    daysUntilThu += 7;
  }
  const nextThu = new Date(kst);
  nextThu.setDate(kst.getDate() + daysUntilThu);
  nextThu.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((nextThu.getTime() - kst.getTime()) / 1000));
}

// 다음 주간 일요일 자정(월요일 00:00 KST) 리셋까지 남은 시간 (초)
export function getSecondsUntilWeeklySunReset(now = new Date()): number {
  const kst = getKSTDate(now);
  const day = kst.getDay(); // 0: 일요일, 1: 월요일...
  let daysUntilMon = 1 - day;
  if (daysUntilMon <= 0) {
    daysUntilMon += 7;
  }
  const nextMon = new Date(kst);
  nextMon.setDate(kst.getDate() + daysUntilMon);
  nextMon.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((nextMon.getTime() - kst.getTime()) / 1000));
}

// 다음 월간(매월 1일 자정 KST) 리셋까지 남은 시간 (초)
export function getSecondsUntilMonthlyReset(now = new Date()): number {
  const kst = getKSTDate(now);
  const nextMonth = new Date(kst.getFullYear(), kst.getMonth() + 1, 1, 0, 0, 0, 0);
  return Math.max(0, Math.floor((nextMonth.getTime() - kst.getTime()) / 1000));
}

// 일일 자정 리셋 시/분/초 객체 반환
export function getTimeUntilKSTMidnight(now = new Date()): { hours: number; minutes: number; seconds: number } {
  const totalSec = getSecondsUntilDailyReset(now);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { hours, minutes, seconds };
}

// 주간 목요일 리셋 일/시/분 객체 반환
export function getTimeUntilKSTWeeklyThu(now = new Date()): { days: number; hours: number; minutes: number } {
  const totalSec = getSecondsUntilWeeklyThuReset(now);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  return { days, hours, minutes };
}

// 초 단위를 'hh:mm:ss' 또는 'D일 hh:mm'으로 포맷
export function formatRemainingTime(seconds: number): string {
  if (seconds <= 0) return '00:00:00';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}일 ${String(hours).padStart(2, '0')}시간 ${String(minutes).padStart(2, '0')}분`;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// 포맷팅된 현재 KST 시간 스트링
export function getFormattedKSTString(now = new Date()): string {
  const kst = getKSTDate(now);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  const h = String(kst.getHours()).padStart(2, '0');
  const min = String(kst.getMinutes()).padStart(2, '0');
  const s = String(kst.getSeconds()).padStart(2, '0');
  return `${y}.${m}.${d} ${h}:${min}:${s} (KST)`;
}

/**
 * 커스텀 컨텐츠가 등록된 요일 및 시간에 맞춰 리셋 시점에 도달했는지 판정
 * 
 * - resetType === 'none': 자동 초기화 안 함 (100% 수동 완료/해제)
 * - resetType === 'daily' 또는 'weekly':
 *   등록된 초기화 요일(resetDayOfWeek)과 시간(resetTime)을 기준으로
 *   가장 최근에 도래한 정기 리셋 시점(KST)을 계산하고,
 *   사용자가 완료한 시각(completedAt)이 그 리셋 시점 이전이면 자동 리셋 대상으로 판정합니다.
 *   (즉, 사용자가 완료한 이후 리셋 시점이 도래했을 때만 리셋되며, 완료 자체는 무조건 수동으로만 이루어짐)
 */
export function shouldResetCustomTask(
  task: CustomTask,
  taskState: TaskProgressState | undefined,
  now = new Date()
): boolean {
  if (!taskState || !taskState.completed) {
    return false;
  }

  // 자동 초기화가 꺼진 경우 무조건 수동 유지
  if (!task.resetType || task.resetType === 'none') {
    return false;
  }

  // 완료 기록된 시각 (UTC epoch ms)
  const completedTime = taskState.completedAt ? new Date(taskState.completedAt).getTime() : 0;
  if (!completedTime || isNaN(completedTime)) {
    // 사용자가 방금 체크했거나 완료 시각 정보가 없는 경우, 초기화 시간 전까지 임의로 해제되지 않도록 보호
    return false;
  }

  const [hStr, mStr] = (task.resetTime || '00:00').split(':');
  const targetH = parseInt(hStr, 10) || 0;
  const targetM = parseInt(mStr, 10) || 0;

  // 현재 KST 시각
  const kstEpoch = now.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstEpoch);
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = kstDate.getUTCMonth(); // 0..11
  const kstDay = kstDate.getUTCDate();
  const kstDayOfWeek = kstDate.getUTCDay(); // 0=일..6=토
  const kstMinutesNow = kstDate.getUTCHours() * 60 + kstDate.getUTCMinutes();
  const targetMinutes = targetH * 60 + targetM;

  let lastResetUtcTime: number;

  if (task.resetType === 'daily') {
    // 당일 리셋 시간 지났으면 오늘, 아니면 어제
    if (kstMinutesNow >= targetMinutes) {
      lastResetUtcTime = Date.UTC(kstYear, kstMonth, kstDay, targetH, targetM, 0, 0) - 9 * 60 * 60 * 1000;
    } else {
      lastResetUtcTime = Date.UTC(kstYear, kstMonth, kstDay - 1, targetH, targetM, 0, 0) - 9 * 60 * 60 * 1000;
    }
  } else if (task.resetType === 'monthly' || task.resetDayOfMonth !== undefined) {
    // monthly: 매월 특정 날짜(1~31일) 리셋
    const targetDayOfMonth = Math.max(1, Math.min(31, task.resetDayOfMonth || 1));
    const daysInCurrentMonth = new Date(kstYear, kstMonth + 1, 0).getDate();
    const effectiveDayThisMonth = Math.min(targetDayOfMonth, daysInCurrentMonth);

    const isPassedThisMonth = kstDay > effectiveDayThisMonth || 
      (kstDay === effectiveDayThisMonth && kstMinutesNow >= targetMinutes);

    if (isPassedThisMonth) {
      lastResetUtcTime = Date.UTC(kstYear, kstMonth, effectiveDayThisMonth, targetH, targetM, 0, 0) - 9 * 60 * 60 * 1000;
    } else {
      const prevYear = kstMonth === 0 ? kstYear - 1 : kstYear;
      const prevMonth = kstMonth === 0 ? 11 : kstMonth - 1;
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      const effectiveDayPrevMonth = Math.min(targetDayOfMonth, daysInPrevMonth);
      lastResetUtcTime = Date.UTC(prevYear, prevMonth, effectiveDayPrevMonth, targetH, targetM, 0, 0) - 9 * 60 * 60 * 1000;
    }
  } else {
    // weekly: 대상 요일 목록 (최대 6개 지원, 0=일..6=토, 기본값 4=목)
    const days: number[] = (task.resetDaysOfWeek && task.resetDaysOfWeek.length > 0)
      ? task.resetDaysOfWeek
      : (task.resetDayOfWeek !== undefined ? [task.resetDayOfWeek] : [4]);

    // 선택된 요일들 중 가장 최근에 도래한 리셋 시점 (최소 diffDays) 계산
    let minDiffDays = 8;
    for (const targetDay of days) {
      let diffDays = (kstDayOfWeek - targetDay + 7) % 7;
      // 만약 요일이 오늘인데 아직 리셋 시각 전이면, 지난주(7일 전) 리셋
      if (diffDays === 0 && kstMinutesNow < targetMinutes) {
        diffDays = 7;
      }
      if (diffDays < minDiffDays) {
        minDiffDays = diffDays;
      }
    }
    if (minDiffDays > 7) minDiffDays = 7;

    lastResetUtcTime = Date.UTC(kstYear, kstMonth, kstDay - minDiffDays, targetH, targetM, 0, 0) - 9 * 60 * 60 * 1000;
  }

  // 완료된 시점이 가장 최근 정기 리셋 시점보다 이전이면 리셋 대상!
  return completedTime < lastResetUtcTime;
}

/**
 * 캐릭터의 만료된 커스텀 컨텐츠를 검사하여 자동 초기화
 */
export function resetExpiredCustomTasks(
  character: CharacterInfo,
  record: CharacterProgressRecord,
  now = new Date()
): { record: CharacterProgressRecord; changed: boolean } {
  if (!character.customTasks || character.customTasks.length === 0 || !record.customTasks) {
    return { record, changed: false };
  }

  let changed = false;
  const updatedCustom = { ...record.customTasks };

  character.customTasks.forEach((task) => {
    const state = updatedCustom[task.id];
    if (state?.completed && shouldResetCustomTask(task, state, now)) {
      delete updatedCustom[task.id];
      changed = true;
    }
  });

  if (!changed) {
    return { record, changed: false };
  }

  return {
    record: {
      ...record,
      customTasks: updatedCustom,
      updatedAt: now.toISOString(),
    },
    changed: true,
  };
}

/**
 * 특정 커스텀 컨텐츠의 '다음 리셋 시점'까지 남은 시간(초) 계산
 * - resetType === 'daily': 오늘 또는 내일 설정된 resetTime(기본 00:00)까지의 초
 * - resetType === 'weekly': 선택된 요일들 중 가장 빠르게 다가올 resetTime까지의 초
 * - resetType === 'none': 자동 리셋이 없으므로 일일 자정 리셋 시간 반환하여 자정 알림에 동기화
 */
export function getSecondsUntilCustomTaskReset(task: CustomTask, now = new Date()): number {
  const kst = getKSTDate(now);
  const kstDayOfWeek = kst.getDay(); // 0(일) ~ 6(토)
  const currentMinutes = kst.getHours() * 60 + kst.getMinutes();

  let targetH = 0;
  let targetM = 0;
  if (task.resetTime && task.resetTime.includes(':')) {
    const [hStr, mStr] = task.resetTime.split(':');
    targetH = parseInt(hStr, 10) || 0;
    targetM = parseInt(mStr, 10) || 0;
  }
  const targetMinutes = targetH * 60 + targetM;

  if (task.resetType === 'none') {
    // 자동 초기화가 없는 커스텀은 매일 자정 리셋 시각 기준으로 알림에 동기화
    return getSecondsUntilDailyReset(now);
  }

  if (task.resetType === 'daily') {
    const nextResetDate = new Date(kst);
    if (currentMinutes < targetMinutes) {
      // 오늘 아직 리셋 시각 전
      nextResetDate.setHours(targetH, targetM, 0, 0);
    } else {
      // 오늘 지났으므로 내일 리셋 시각
      nextResetDate.setDate(kst.getDate() + 1);
      nextResetDate.setHours(targetH, targetM, 0, 0);
    }
    return Math.max(0, Math.floor((nextResetDate.getTime() - kst.getTime()) / 1000));
  }

  if (task.resetType === 'monthly' || task.resetDayOfMonth !== undefined) {
    const targetDayOfMonth = Math.max(1, Math.min(31, task.resetDayOfMonth || 1));
    const daysInCurrentMonth = new Date(kst.getFullYear(), kst.getMonth() + 1, 0).getDate();
    const effectiveDayThisMonth = Math.min(targetDayOfMonth, daysInCurrentMonth);

    const thisMonthReset = new Date(kst.getFullYear(), kst.getMonth(), effectiveDayThisMonth, targetH, targetM, 0, 0);
    if (kst.getTime() < thisMonthReset.getTime()) {
      return Math.max(0, Math.floor((thisMonthReset.getTime() - kst.getTime()) / 1000));
    }

    const nextMonthYear = kst.getMonth() === 11 ? kst.getFullYear() + 1 : kst.getFullYear();
    const nextMonth = (kst.getMonth() + 1) % 12;
    const daysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
    const effectiveDayNextMonth = Math.min(targetDayOfMonth, daysInNextMonth);
    const nextMonthReset = new Date(nextMonthYear, nextMonth, effectiveDayNextMonth, targetH, targetM, 0, 0);

    return Math.max(0, Math.floor((nextMonthReset.getTime() - kst.getTime()) / 1000));
  }

  // weekly
  const days: number[] = (task.resetDaysOfWeek && task.resetDaysOfWeek.length > 0)
    ? task.resetDaysOfWeek
    : (task.resetDayOfWeek !== undefined ? [task.resetDayOfWeek] : [4]);

  let minDiffDays = 8;
  for (const targetDay of days) {
    let diffDays = (targetDay - kstDayOfWeek + 7) % 7;
    // 오늘 요일인데 이미 리셋 시각이 지난 경우, 다음 주(7일 뒤) 대상
    if (diffDays === 0 && currentMinutes >= targetMinutes) {
      diffDays = 7;
    }
    if (diffDays < minDiffDays) {
      minDiffDays = diffDays;
    }
  }
  if (minDiffDays > 7) minDiffDays = 7;

  const nextResetDate = new Date(kst);
  nextResetDate.setDate(kst.getDate() + minDiffDays);
  nextResetDate.setHours(targetH, targetM, 0, 0);

  return Math.max(0, Math.floor((nextResetDate.getTime() - kst.getTime()) / 1000));
}

