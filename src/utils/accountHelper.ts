import { CharacterInfo, ApiKeyItem } from '../types';
import { AccountIndicatorItem } from '../components/pip/AccountIndicatorBar';
import { isWeb, LOCAL_STORAGE_WEB_KEYS_KEY } from './platform';
import { fetchApiKeys } from '../services/api';

/**
 * 로컬스토리지에 저장된 웹 모드 API 키 목록 동기적 조회
 */
export function getStoredApiKeys(): ApiKeyItem[] {
  if (typeof window === 'undefined') return [];
  try {
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
 * API 키가 삭제되었을 때 불필요한 유령 탭이 남지 않도록 오직 현재 등록된 knownApiKeys만을 기준으로 생성하며,
 * 등록된 API 키가 2개 미만(0개 또는 1개)일 때는 계정 전환 바를 표시하지 않습니다.
 */
export function buildAccountIndicatorItems(
  characters: CharacterInfo[],
  activeCharacterId: string | null,
  knownApiKeys: ApiKeyItem[] = []
): AccountIndicatorItem[] {
  if (!characters || characters.length === 0) {
    return [];
  }

  // 등록된 유효 API 키가 2개 이상일 때만 계정 전환 바 표시 (단일 계정 또는 키 삭제 시 즉시 숨김)
  if (!knownApiKeys || knownApiKeys.length < 2) {
    return [];
  }

  // 1. 현재 활성 캐릭터의 apiKeyId 파악
  const currentActiveChar = characters.find((c) => c.id === activeCharacterId) || characters[0];
  const activeKeyId = currentActiveChar?.apiKeyId || knownApiKeys[0]?.id;

  // 2. 유효한 API 키 목록 기준 그룹 맵 초기화
  const validKeyIds = new Set(knownApiKeys.map((k) => k.id));
  const accountGroups = new Map<string, { firstCharId: string; count: number }>();
  knownApiKeys.forEach((k) => {
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

  // 4. 캐릭터가 1명 이상 등록된 유효 계정만 인디케이터/탭 아이템으로 생성 (캐릭터가 없는 빈 API 키는 계정 컨텐츠 및 전환 바에서 제외)
  const items: AccountIndicatorItem[] = [];
  knownApiKeys.forEach((keyItem, idx) => {
    if (!keyItem.id) return;
    const group = accountGroups.get(keyItem.id) || { firstCharId: '', count: 0 };
    // 등록된 캐릭터가 1명 이상인 경우에만 노출
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
