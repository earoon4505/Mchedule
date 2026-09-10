import { CharacterInfo, CharacterProgressRecord } from '../types';
import { EPIC_DUNGEONS } from '../data/defaultTasks';

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

export function getStoredCommonContentIds(): string[] {
  try {
    const saved = localStorage.getItem('mapleschedule_common_content_ids');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return DEFAULT_COMMON_CONTENT_IDS;
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
