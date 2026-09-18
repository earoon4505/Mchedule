import { CharacterInfo, ApiKeyItem } from '../types';
import { AccountIndicatorItem } from '../components/pip/AccountIndicatorBar';
import { isWeb, LOCAL_STORAGE_WEB_KEYS_KEY } from './platform';
import { fetchApiKeys } from '../services/api';

export const CACHED_API_KEYS_STORAGE_KEY = 'mapleschedule_cached_apikeys_v1';

/**
 * 로컬스토리지에 저장된 API 키 목록 동기적 조회 (웹 및 데스크톱 공통 캐시 지원)
 */
export function getStoredApiKeys(): ApiKeyItem[] {
  if (typeof window === 'undefined') return [];
  try {
    // 1. 공통 캐시 우선 조회 (데스크톱 및 웹 초기 0ms 렌더링 지원)
    const cached = localStorage.getItem(CACHED_API_KEYS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // 2. 웹 모드 전용 키 조회
    const raw = localStorage.getItem(LOCAL_STORAGE_WEB_KEYS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (_) {}
  return [];
}

/**
 * 등록된 캐릭터들과 API 키 목록을 분석하여 PiP 및 메인 화면 계정 인디케이터 아이템 목록을 생성합니다.
 * - knownApiKeys가 비어있을 경우 characters에 내장된 apiKeyId와 apiKeyAlias로부터 자가 치유(fallback) 복원하여
 *   PiP 창 초기화 시에도 API 별칭과 계정 전환 바가 즉시 노출되도록 보장합니다.
 * - 등록된 API 키가 2개 미만(0개 또는 1개)일 때는 계정 전환 바를 표시하지 않습니다.
 */
export function buildAccountIndicatorItems(
  characters: CharacterInfo[],
  activeCharacterId: string | null,
  knownApiKeys: ApiKeyItem[] = []
): AccountIndicatorItem[] {
  if (!characters || characters.length === 0) {
    return [];
  }

  // 1. 만약 knownApiKeys가 아직 비어있다면 characters에 저장된 apiKeyId와 apiKeyAlias로부터 임시 복원
  let effectiveKeys = Array.isArray(knownApiKeys) ? [...knownApiKeys] : [];
  if (effectiveKeys.length === 0) {
    const extractedMap = new Map<string, string>();
    characters.forEach((c) => {
      if (c.apiKeyId) {
        extractedMap.set(c.apiKeyId, c.apiKeyAlias || '계정');
      }
    });
    if (extractedMap.size >= 2) {
      effectiveKeys = Array.from(extractedMap.entries()).map(([id, alias]) => ({
        id,
        alias,
        apiKey: '',
        createdAt: '',
      }));
    }
  }

  // 등록된 유효 API 키가 2개 이상일 때만 계정 전환 바 표시 (단일 계정 또는 키 삭제 시 즉시 숨김)
  if (!effectiveKeys || effectiveKeys.length < 2) {
    return [];
  }

  // 1. 현재 활성 캐릭터의 apiKeyId 파악
  const currentActiveChar = characters.find((c) => c.id === activeCharacterId) || characters[0];
  const activeKeyId = currentActiveChar?.apiKeyId || effectiveKeys[0]?.id;

  // 2. 유효한 API 키 목록 기준 그룹 맵 초기화
  const validKeyIds = new Set(effectiveKeys.map((k) => k.id));
  const accountGroups = new Map<string, { firstCharId: string; count: number }>();
  effectiveKeys.forEach((k) => {
    accountGroups.set(k.id, { firstCharId: '', count: 0 });
  });

  // 3. 캐릭터가 유효한 API 키에 속해 있는 경우에만 계정 그룹에 집계
  characters.forEach((char) => {
    if (char.apiKeyId && validKeyIds.has(char.apiKeyId)) {
      const group = accountGroups.get(char.apiKeyId);
      if (group) {
        if (!group.firstCharId) {
          group.firstCharId = char.id;
        }
        group.count += 1;
      }
    }
  });

  // 4. 캐릭터가 1명 이상 등록된 유효 계정만 인디케이터/탭 아이템으로 생성
  const items: AccountIndicatorItem[] = [];
  effectiveKeys.forEach((keyItem, idx) => {
    if (!keyItem.id) return;
    const group = accountGroups.get(keyItem.id) || { firstCharId: '', count: 0 };
    if (group.count === 0) return;

    const alias = keyItem.alias?.trim() || `계정 ${idx + 1}`;
    const isActive = keyItem.id === activeKeyId;

    items.push({
      id: keyItem.id,
      alias,
      isActive,
      firstCharId: group.firstCharId,
      charCount: group.count,
    });
  });

  return items;
}
