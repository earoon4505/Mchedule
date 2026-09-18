import { CharacterInfo, CharacterProgressRecord } from '../types';
import { EPIC_DUNGEONS } from '../data/defaultTasks';
import { broadcastCommonContents } from './syncChannel';

export interface CommonContentItem {
  id: string;
  name: string;
  shortName: string;
  type: 'daily' | 'weekly';
  icon: string;
  fallbackIcon: string;
  minLevel?: number;
  badge?: string;
  desc: string;
}

export const ALL_COMMON_CONTENTS: CommonContentItem[] = [
  {
    id: 'daily_monster_park',
    name: '몬스터파크',
    shortName: '몬스터파크',
    type: 'daily',
    icon: '🎟️',
    fallbackIcon: '🎟️',
    desc: '일일 2회 클리어',
  },
  ...EPIC_DUNGEONS.map((epic) => ({
    id: epic.id,
    name: epic.name,
    shortName: epic.name.replace(/^에픽\s*던전\s*:\s*/, ''),
    type: 'weekly' as const,
    icon: epic.icon,
    fallbackIcon: '⛰️',
    minLevel: epic.minLevel,
    badge: epic.badge,
    desc: `Lv.${epic.minLevel}+`,
  })),
];

export const DEFAULT_COMMON_CONTENT_IDS: string[] = ALL_COMMON_CONTENTS.map((c) => c.id);

/**
 * 저장된 API별 계정 공통 컨텐츠 맵 조회 (하위 호환 지원)
 */
export function getStoredCommonContentsMap(): Record<string, string[]> {
  try {
    const saved = localStorage.getItem('mapleschedule_common_content_ids');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // 기존 단일 배열 포맷 하위 호환
        return { default: parsed };
      } else if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string[]>;
      }
    }
  } catch (e) {}
  return { default: DEFAULT_COMMON_CONTENT_IDS };
}

/**
 * 특정 API(또는 기본 계정)에 활성화된 계정 공통 컨텐츠 ID 목록 조회
 */
export function getStoredCommonContentIds(apiKeyId?: string | null): string[] {
  const map = getStoredCommonContentsMap();
  const key = apiKeyId || 'default';
  if (map[key] && Array.isArray(map[key])) {
    return map[key];
  }
  if (map['default'] && Array.isArray(map['default'])) {
    return map['default'];
  }
  return DEFAULT_COMMON_CONTENT_IDS;
}

/**
 * 특정 API(또는 기본 계정)에 대한 계정 공통 컨텐츠 목록 저장 및 즉각 브로드캐스트
 */
export function saveStoredCommonContentIds(
  apiKeyId: string | null | undefined,
  ids: string[]
): Record<string, string[]> {
  const targetKey = apiKeyId || 'default';
  const map = getStoredCommonContentsMap();
  map[targetKey] = ids;
  // default 키가 없거나 targetKey가 default인 경우 함께 보존
  if (targetKey !== 'default' && !map['default']) {
    map['default'] = ids;
  }

  try {
    localStorage.setItem('mapleschedule_common_content_ids', JSON.stringify(map));
  } catch (e) {}

  // 0ms 실시간 브로드캐스트 통지
  broadcastCommonContents(map);

  return map;
}

/**
 * 삭제된 API 키의 계정 공통 컨텐츠 맞춤 설정 정리
 */
export function removeStoredCommonContentId(apiKeyId: string): void {
  const map = getStoredCommonContentsMap();
  if (map[apiKeyId]) {
    delete map[apiKeyId];
    try {
      localStorage.setItem('mapleschedule_common_content_ids', JSON.stringify(map));
    } catch (e) {}
    broadcastCommonContents(map);
  }
}

export function isCommonTaskCompleted(
  id: string,
  targetCharacters: CharacterInfo[],
  records: Record<string, CharacterProgressRecord>
): boolean {
  if (!targetCharacters || targetCharacters.length === 0) return false;

  if (id === 'daily_monster_park') {
    return targetCharacters.some((char) => {
      const rec = records?.[char.id];
      const mpState = rec?.dailyTasks?.['daily_monster_park'];
      const count = mpState?.currentCount ?? (mpState?.completed ? 2 : 0);
      return !!(mpState?.completed || count >= 2);
    });
  }

  return targetCharacters.some((char) => {
    const rec = records?.[char.id];
    return !!rec?.weeklyTasks?.[id]?.completed;
  });
}
