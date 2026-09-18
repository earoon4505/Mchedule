import { CharacterInfo, NexonCharacterBasic, NexonSchedulerState, AppDataPayload, NexonAccountCharacter, ApiKeyItem } from '../types';
import { getKSTDailyKey } from '../utils/time';
import { isWeb, LOCAL_STORAGE_DATA_KEY, LOCAL_STORAGE_WEB_KEYS_KEY } from '../utils/platform';

export interface SearchCharacterResult {
  success: boolean;
  data?: {
    ocid: string;
    basic: NexonCharacterBasic;
  };
  error?: string;
}

export interface SyncSchedulerResult {
  success: boolean;
  data?: NexonSchedulerState;
  error?: string;
  isMockOrEmpty?: boolean;
  newOcid?: string;
}

// 웹 모드 전용 LocalStorage API 키 헬퍼 (다른 사용자와 절대 공유되지 않는 브라우저별 로컬 저장)
function getWebLocalApiKeys(): ApiKeyItem[] {
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

function saveWebLocalApiKeys(keys: ApiKeyItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_WEB_KEYS_KEY, JSON.stringify(keys));
  } catch (_) {}
}

function maskApiKey(key?: string): string {
  if (!key || key.length < 8) return '';
  return `${key.slice(0, 6)}****${key.slice(-4)}`;
}

// 웹 모드에서 넥슨 프록시 API 호출 시 본인 고유의 API 키를 헤더에 전달
function getRequestHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (isWeb) {
    const keys = getWebLocalApiKeys();
    if (keys.length > 0) {
      headers['x-nxopen-api-key'] = keys[0].apiKey;
      headers['x-user-api-keys'] = JSON.stringify(keys.map((k) => k.apiKey));
      headers['x-user-api-key-items'] = JSON.stringify(keys);
    }
  }
  return headers;
}

export async function checkServerApiStatus(): Promise<{ hasApiKey: boolean; count?: number; maskedKey?: string; serverTime: string }> {
  if (isWeb) {
    const keys = getWebLocalApiKeys();
    const hasKey = keys.length > 0;
    return {
      hasApiKey: hasKey,
      count: keys.length,
      maskedKey: hasKey ? maskApiKey(keys[0].apiKey) : '',
      serverTime: new Date().toISOString(),
    };
  }

  try {
    const res = await fetch('/api/nexon/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (e) {
    return { hasApiKey: false, serverTime: new Date().toISOString() };
  }
}

export interface ApiKeyInfo {
  success?: boolean;
  hasApiKey: boolean;
  maskedKey?: string;
  keys?: ApiKeyItem[];
  count?: number;
  isCustomSaved?: boolean;
  isFromEnv?: boolean;
  savedAt?: string | null;
}

export async function getApiKeyInfo(): Promise<ApiKeyInfo> {
  if (isWeb) {
    const keys = getWebLocalApiKeys();
    const hasKey = keys.length > 0;
    return {
      success: true,
      hasApiKey: hasKey,
      maskedKey: hasKey ? maskApiKey(keys[0].apiKey) : '',
      keys,
      count: keys.length,
      isCustomSaved: hasKey,
      isFromEnv: false,
      savedAt: keys[0]?.createdAt || null,
    };
  }

  try {
    const res = await fetch('/api/nexon/key');
    if (!res.ok) throw new Error('Failed to fetch api key info');
    return await res.json();
  } catch (e) {
    return { hasApiKey: false, maskedKey: '', keys: [] };
  }
}

// 전체 등록된 API 키 목록 조회
export async function fetchApiKeys(): Promise<{ success: boolean; keys: ApiKeyItem[]; count?: number; error?: string }> {
  if (isWeb) {
    const keys = getWebLocalApiKeys();
    return { success: true, keys, count: keys.length };
  }

  try {
    const res = await fetch('/api/nexon/keys');
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, keys: [], error: json.error || 'API 키 목록을 불러오지 못했습니다.' };
    }
    return { success: true, keys: json.keys || [], count: json.count || 0 };
  } catch (e: any) {
    return { success: false, keys: [], error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

// 신규 API 키 추가 (별칭 지정 가능)
export async function addApiKey(apiKey: string, alias?: string): Promise<{ success: boolean; keys?: ApiKeyItem[]; newKey?: ApiKeyItem; message?: string; error?: string }> {
  if (isWeb) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return { success: false, error: '유효한 API 키를 입력해주세요.' };
    }
    const trimmed = apiKey.trim();
    const keys = getWebLocalApiKeys();
    if (keys.some((k) => k.apiKey === trimmed)) {
      return { success: false, error: '이미 등록되어 있는 API 키입니다.' };
    }

    let assignedAlias = (alias && typeof alias === 'string' && alias.trim().length > 0)
      ? alias.trim()
      : `API ${keys.length + 1}`;

    if (keys.some((k) => k.alias === assignedAlias)) {
      assignedAlias = `API ${keys.length + 1}`;
    }

    const newRecord: ApiKeyItem = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      alias: assignedAlias,
      apiKey: trimmed,
      createdAt: new Date().toISOString(),
    };

    keys.push(newRecord);
    saveWebLocalApiKeys(keys);

    return {
      success: true,
      keys,
      newKey: newRecord,
      message: `'${assignedAlias}' API 키가 성공적으로 등록되었습니다.`,
    };
  }

  try {
    const res = await fetch('/api/nexon/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, alias }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'API 키 등록에 실패했습니다.' };
    }
    return { success: true, keys: json.keys, newKey: json.newKey, message: json.message };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

// API 키 정보(alias, apiKey) 수정
export async function updateApiKey(
  id: string,
  updates: { alias?: string; apiKey?: string }
): Promise<{ success: boolean; keys?: ApiKeyItem[]; message?: string; error?: string }> {
  const { alias, apiKey } = updates;
  if (!alias && !apiKey) {
    return { success: false, error: '변경할 별칭 또는 API 키를 입력해주세요.' };
  }

  if (isWeb) {
    const keys = getWebLocalApiKeys();
    const idx = keys.findIndex((k) => k.id === id);
    if (idx === -1) {
      return { success: false, error: '해당 API 키를 찾을 수 없습니다.' };
    }

    if (alias && alias.trim().length > 0) {
      keys[idx].alias = alias.trim();
    }

    if (apiKey && apiKey.trim().length > 0) {
      const trimmedKey = apiKey.trim();
      if (keys.some((k, i) => i !== idx && k.apiKey === trimmedKey)) {
        return { success: false, error: '이미 다른 항목에 등록되어 있는 API 키입니다.' };
      }
      keys[idx].apiKey = trimmedKey;
    }

    saveWebLocalApiKeys(keys);
    return { success: true, keys, message: 'API 키 정보가 성공적으로 변경되었습니다.' };
  }

  try {
    const res = await fetch(`/api/nexon/keys/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias, apiKey }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'API 키 정보 수정에 실패했습니다.' };
    }
    return { success: true, keys: json.keys, message: json.message };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

// API 키 별칭 수정 (호환성 유지)
export async function updateApiKeyAlias(id: string, alias: string): Promise<{ success: boolean; keys?: ApiKeyItem[]; message?: string; error?: string }> {
  return updateApiKey(id, { alias });
}

// 특정 API 키 삭제
export async function removeApiKey(id: string): Promise<{ success: boolean; keys?: ApiKeyItem[]; message?: string; error?: string }> {
  if (isWeb) {
    const keys = getWebLocalApiKeys();
    const filtered = keys.filter((k) => k.id !== id);
    if (filtered.length === keys.length) {
      return { success: false, error: '삭제할 API 키를 찾을 수 없습니다.' };
    }
    saveWebLocalApiKeys(filtered);
    return { success: true, keys: filtered, message: 'API 키가 삭제되었습니다.' };
  }

  try {
    const res = await fetch(`/api/nexon/keys/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'API 키 삭제에 실패했습니다.' };
    }
    return { success: true, keys: json.keys, message: json.message };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

export async function saveApiKey(apiKey: string, alias?: string): Promise<{ success: boolean; maskedKey?: string; keys?: ApiKeyItem[]; error?: string }> {
  if (isWeb) {
    const result = await addApiKey(apiKey, alias);
    return {
      success: result.success,
      maskedKey: maskApiKey(apiKey),
      keys: result.keys,
      error: result.error,
    };
  }

  try {
    const res = await fetch('/api/nexon/key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, alias }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'API 키 저장에 실패했습니다.' };
    }
    return { success: true, maskedKey: json.maskedKey, keys: json.keys };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

export async function deleteApiKey(): Promise<{ success: boolean; hasApiKey?: boolean; error?: string }> {
  if (isWeb) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_WEB_KEYS_KEY);
    }
    return { success: true, hasApiKey: false };
  }

  try {
    const res = await fetch('/api/nexon/key', {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'API 키 삭제에 실패했습니다.' };
    }
    return { success: true, hasApiKey: json.hasApiKey };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

// ---------------------------------------------------------------------------
// 웹 환경 전용 넥슨 직접 호출 헬퍼 (Vercel 등 서버리스 환경에서 CORS 통신)
// ---------------------------------------------------------------------------
async function fetchNexonWeb(endpoint: string, apiKey?: string): Promise<Response> {
  const targetKey = apiKey || getWebLocalApiKeys()[0]?.apiKey;
  if (!targetKey) {
    throw new Error('NEXON API 키가 등록되지 않았습니다.');
  }
  const url = endpoint.startsWith('http') ? endpoint : `https://open.api.nexon.com${endpoint}`;
  return await fetch(url, {
    headers: {
      'x-nxopen-api-key': targetKey,
      'Content-Type': 'application/json',
    },
  });
}

export async function testApiKey(apiKey?: string): Promise<{ success: boolean; message?: string; error?: string }> {
  if (isWeb) {
    const targetKey = apiKey?.trim() || getWebLocalApiKeys()[0]?.apiKey;
    if (!targetKey) {
      return { success: false, error: '검증할 API 키가 없습니다.' };
    }
    try {
      const res = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent('메이플용사')}`, {
        headers: {
          'x-nxopen-api-key': targetKey,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errName = data?.error?.name || '';
        const errMsg = data?.error?.message || '';

        // 캐릭터명이 없는 경우(OPENAPI00004)는 API 키 자체는 유효한 것임
        if (errName === 'OPENAPI00004') {
          return {
            success: true,
            message: 'NEXON Open API 연결 테스트에 성공했습니다!',
          };
        }

        // 400, 401, 403 및 키 관련 에러코드(OPENAPI00005, OPENAPI00003, OPENAPI00001 등)
        return {
          success: false,
          error: errMsg || '유효하지 않은 API 키이거나 권한이 없습니다. 키를 다시 확인해주세요.',
        };
      }
      return {
        success: true,
        message: 'NEXON Open API 연결 테스트에 성공했습니다!',
      };
    } catch (e: any) {
      return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
    }
  }

  try {
    const headers = getRequestHeaders({ 'Content-Type': 'application/json' });
    const res = await fetch('/api/nexon/key/test', {
      method: 'POST',
      headers,
      body: JSON.stringify({ apiKey }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || 'API 키 검증에 실패했습니다.' };
    }
    return { success: true, message: json.message };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
}

export async function searchNexonCharacter(name: string): Promise<SearchCharacterResult> {
  if (isWeb) {
    try {
      const keys = getWebLocalApiKeys();
      if (keys.length === 0) {
        return {
          success: false,
          error: 'NEXON API 키가 등록되지 않았습니다. 상단 [API 등록] 버튼을 눌러 API 키를 등록해주세요.',
        };
      }
      const activeKey = keys[0].apiKey;

      // 1. OCID 조회
      const idRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(name.trim())}`, {
        headers: {
          'x-nxopen-api-key': activeKey,
          'Content-Type': 'application/json',
        },
      });

      if (!idRes.ok) {
        const errJson = await idRes.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error?.message || `캐릭터를 찾을 수 없습니다. (상태 코드: ${idRes.status})`,
        };
      }

      const idData = (await idRes.json()) as { ocid: string };
      if (!idData.ocid) {
        return { success: false, error: '캐릭터 식별자(OCID)를 가져오지 못했습니다.' };
      }

      // 2. 기본 정보 조회
      const basicRes = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(idData.ocid)}`, {
        headers: {
          'x-nxopen-api-key': activeKey,
          'Content-Type': 'application/json',
        },
      });

      if (!basicRes.ok) {
        const errJson = await basicRes.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error?.message || '캐릭터 기본 정보 조회에 실패했습니다.',
        };
      }

      const basicData = await basicRes.json();
      return {
        success: true,
        data: {
          ocid: idData.ocid,
          basic: basicData,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || '네트워크 오류가 발생했습니다.',
      };
    }
  }

  try {
    const headers = getRequestHeaders();
    const res = await fetch(`/api/nexon/character/search?name=${encodeURIComponent(name.trim())}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || '캐릭터 정보를 찾을 수 없습니다.',
      };
    }
    return {
      success: true,
      data: data.data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || '네트워크 오류가 발생했습니다.',
    };
  }
}

export async function fetchCharacterBasic(
  ocidOrName: { ocid?: string; name?: string },
  force = false,
  apiKeyId?: string
): Promise<{ success: boolean; basic?: NexonCharacterBasic; newOcid?: string; error?: string }> {
  // 1차: 데스크톱(Electron) 환경에서는 로컬 Express 프록시 우선 호출
  if (!isWeb) {
    try {
      const params = new URLSearchParams();
      if (ocidOrName.ocid) params.set('ocid', ocidOrName.ocid);
      if (ocidOrName.name) params.set('name', ocidOrName.name);
      if (apiKeyId) params.set('apiKeyId', apiKeyId);
      if (force) params.set('force', 'true');

      const headers = getRequestHeaders();
      const res = await fetch(`/api/nexon/character/basic?${params.toString()}`, {
        headers,
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.basic) {
          const freshOcid = data.newOcid || (data.ocid && ocidOrName.ocid && data.ocid !== ocidOrName.ocid ? data.ocid : undefined);
          return {
            success: true,
            basic: data.basic,
            newOcid: freshOcid,
          };
        }
      }
    } catch (_) {
      // 프록시 실패 시 아래 직접 조회로 진행
    }
  }

  // 2차: 순수 웹(Vercel 등) 환경 또는 프록시 실패 시 클라이언트 직접 호출
  try {
    const keys = getWebLocalApiKeys();
    if (keys.length === 0) {
      return { success: false, error: '등록된 API 키가 없습니다.' };
    }

    const preferredKey = apiKeyId ? keys.find((k) => k.id === apiKeyId) : undefined;
    const orderedKeys = preferredKey ? [preferredKey, ...keys.filter((k) => k.id !== apiKeyId)] : keys;

    let targetOcid = ocidOrName.ocid;
    if (!targetOcid && ocidOrName.name) {
      for (const k of orderedKeys) {
        try {
          const idRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(ocidOrName.name.trim())}`, {
            headers: { 'x-nxopen-api-key': k.apiKey, 'Content-Type': 'application/json' },
          });
          if (idRes.ok) {
            const idData = await idRes.json();
            targetOcid = idData.ocid;
            break;
          }
        } catch (_) {}
      }
    }

    if (!targetOcid) {
      return { success: false, error: '캐릭터 OCID를 찾을 수 없습니다.' };
    }

    // 등록된 모든 키를 순회하여 성공하는 키로 기본 정보 조회 (선호 키 최우선)
    let basicData: NexonCharacterBasic | null = null;
    for (const k of orderedKeys) {
      try {
        const basicRes = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(targetOcid)}`, {
          headers: { 'x-nxopen-api-key': k.apiKey, 'Content-Type': 'application/json' },
        });
        if (basicRes.ok) {
          basicData = await basicRes.json();
          break;
        }
      } catch (_) {}
    }

    let isOcidUpdated = false;
    // 월드리프 등으로 기존 OCID가 만료되어 조회가 실패한 경우:
    // 캐릭터명이 제공되어 있다면 닉네임으로 최신 OCID를 조회하여 자동 치유(Self-Healing)
    if (!basicData && ocidOrName.name) {
      for (const k of orderedKeys) {
        try {
          const idRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(ocidOrName.name.trim())}`, {
            headers: { 'x-nxopen-api-key': k.apiKey, 'Content-Type': 'application/json' },
          });
          if (idRes.ok) {
            const idData = await idRes.json();
            if (idData.ocid && idData.ocid !== targetOcid) {
              const freshOcid = idData.ocid;
              for (const k2 of orderedKeys) {
                const retryRes = await fetch(`https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(freshOcid)}`, {
                  headers: { 'x-nxopen-api-key': k2.apiKey, 'Content-Type': 'application/json' },
                });
                if (retryRes.ok) {
                  basicData = await retryRes.json();
                  targetOcid = freshOcid;
                  isOcidUpdated = true;
                  break;
                }
              }
              if (basicData) break;
            }
          }
        } catch (_) {}
      }
    }

    if (basicData) {
      return {
        success: true,
        basic: basicData,
        newOcid: isOcidUpdated ? targetOcid : undefined,
      };
    }

    return { success: false, error: '기본 정보 조회 실패' };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류' };
  }
}

export interface AccountCharactersResult {
  success: boolean;
  characters?: NexonAccountCharacter[];
  count?: number;
  error?: string;
}

export async function fetchAccountCharacters(force = false): Promise<AccountCharactersResult> {
  // 1차: 데스크톱(Electron) 환경에서는 로컬 Express 프록시 API 우선 호출
  if (!isWeb) {
    try {
      const headers = getRequestHeaders();
      const res = await fetch(`/api/nexon/account/characters${force ? '?force=true' : ''}`, {
        headers,
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.characters)) {
          return {
            success: true,
            characters: data.characters,
            count: data.characters.length,
          };
        }
        if (data.error) {
          return { success: false, error: data.error };
        }
      }
    } catch (_) {
      // 프록시 실패 시 아래 웹 직접 조회로 폴백
    }
  }

  // 2차: 순수 웹(Vercel 등 정적 웹 호스팅) 환경 - 브라우저에서 직접 넥슨 Open API 호출
  const keys = getWebLocalApiKeys();
  if (keys.length === 0) {
    return {
      success: false,
      error: 'NEXON API 키가 등록되지 않았습니다. 상단 [API 등록] 버튼을 눌러 먼저 키를 등록해주세요.',
    };
  }

  try {
    const allResults = await Promise.all(
      keys.map(async (k) => {
        try {
          const listRes = await fetch('https://open.api.nexon.com/maplestory/v1/character/list', {
            headers: { 'x-nxopen-api-key': k.apiKey, 'Content-Type': 'application/json' },
          });
          if (!listRes.ok) return [];
          const listData = await listRes.json();
          let rawList: any[] = [];
          if (Array.isArray(listData.account_list)) {
            for (const acc of listData.account_list) {
              if (Array.isArray(acc.character_list)) rawList.push(...acc.character_list);
            }
          } else if (Array.isArray(listData.character_list)) {
            rawList = listData.character_list;
          } else if (Array.isArray(listData)) {
            rawList = listData;
          }
          return rawList.map((c) => ({
            ...c,
            _key: k.apiKey,
            apiKeyId: k.id,
            apiKeyAlias: k.alias,
          }));
        } catch (_) {
          return [];
        }
      })
    );

    const seen = new Set<string>();
    const flatList: any[] = [];
    for (const resList of allResults) {
      for (const char of resList) {
        const id = char.ocid || char.character_name;
        if (id && !seen.has(id)) {
          seen.add(id);
          flatList.push(char);
        }
      }
    }

    const mapped: (NexonAccountCharacter & { _key?: string })[] = flatList.map((c) => {
      let cachedImg = '';
      if (typeof window !== 'undefined' && c.ocid) {
        try {
          cachedImg = sessionStorage.getItem(`nexon_avatar_${c.ocid}`) || '';
        } catch (_) {}
      }
      return {
        ocid: c.ocid || '',
        character_name: c.character_name || '',
        world_name: c.world_name || '메이플',
        character_class: c.character_class || '모험가',
        character_level: Number(c.character_level) || 200,
        character_image: c.character_image || cachedImg || '',
        character_gender: c.character_gender || '',
        character_guild_name: c.character_guild_name || '',
        apiKeyId: c.apiKeyId,
        apiKeyAlias: c.apiKeyAlias,
        _key: c._key,
      };
    });

    mapped.sort((a, b) => (b.character_level || 0) - (a.character_level || 0));

    // 상위 레벨 캐릭터(상위 15개) 중 프로필 사진이 비어있는 경우 브라우저에서 직접 basic을 안전 조회하여 보강
    const missingImgChars = mapped.filter((c) => !c.character_image && c.ocid).slice(0, 15);
    if (missingImgChars.length > 0) {
      for (let i = 0; i < missingImgChars.length; i += 3) {
        const chunk = missingImgChars.slice(i, i + 3);
        await Promise.all(
          chunk.map(async (char) => {
            try {
              const apiKey = char._key || keys[0]?.apiKey;
              if (!apiKey || !char.ocid) return;
              const bRes = await fetch(
                `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(char.ocid)}`,
                {
                  headers: { 'x-nxopen-api-key': apiKey, 'Content-Type': 'application/json' },
                }
              );
              if (bRes.ok) {
                const bData = await bRes.json();
                if (bData.character_image) {
                  char.character_image = bData.character_image;
                  try {
                    sessionStorage.setItem(`nexon_avatar_${char.ocid}`, bData.character_image);
                  } catch (_) {}
                }
              }
            } catch (_) {}
          })
        );
      }
    }

    return { success: true, count: mapped.length, characters: mapped };
  } catch (e: any) {
    return { success: false, error: e.message || '계정 캐릭터 목록 조회 오류' };
  }
}

export async function fetchNexonSchedulerState(
  ocid: string,
  force = false,
  customDate?: string,
  characterName?: string,
  apiKeyId?: string
): Promise<SyncSchedulerResult> {
  // 1차: 데스크톱(Electron) 환경에서는 로컬 Express 프록시를 통해 조회
  if (!isWeb) {
    try {
      const params = new URLSearchParams();
      params.set('ocid', ocid);
      if (characterName) params.set('name', characterName);
      if (customDate) params.set('date', customDate);
      if (apiKeyId) params.set('apiKeyId', apiKeyId);
      if (force) params.set('force', 'true');
      const headers = getRequestHeaders();
      const url = `/api/nexon/character/scheduler?${params.toString()}`;
      const res = await fetch(url, { headers });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          return {
            success: true,
            data: data.data,
            isMockOrEmpty: false,
            newOcid: data.newOcid || (data.ocid && data.ocid !== ocid ? data.ocid : undefined),
          };
        }
        if (data.error) {
          return {
            success: false,
            error: data.error,
            isMockOrEmpty: true,
          };
        }
      }
    } catch (_) {
      // 프록시 연결 실패 시 아래 클라이언트 직접 조회로 진행
    }
  }

  // 2차: 웹 환경(Vercel 등 정적 웹 호스팅)에서는 브라우저가 직접 넥슨 공식 Open API 호출
  const keys = getWebLocalApiKeys();
  if (keys.length === 0) {
    return {
      success: false,
      error: '등록된 NEXON API 키가 없습니다. 상단 [API 등록]에서 키를 등록해주세요.',
      isMockOrEmpty: true,
    };
  }

  const preferredKey = apiKeyId ? keys.find((k) => k.id === apiKeyId) : undefined;
  const orderedKeys = preferredKey ? [preferredKey, ...keys.filter((k) => k.id !== apiKeyId)] : keys;

  const dateParam = customDate ? `&date=${encodeURIComponent(customDate)}` : '';
  let targetUrl = `https://open.api.nexon.com/maplestory/v1/scheduler/character-state?ocid=${encodeURIComponent(ocid)}${dateParam}`;

  let lastError = '스케줄러 상태 조회 실패';
  for (const k of orderedKeys) {
    try {
      const res = await fetch(targetUrl, {
        headers: {
          'x-nxopen-api-key': k.apiKey,
          'Content-Type': 'application/json',
        },
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (res.ok) {
          return {
            success: true,
            data: json,
            isMockOrEmpty: false,
          };
        }
        // 권한(400, 403) 오류인 경우 타 계정 캐릭터일 수 있으므로 다음 키 시도
        if (res.status === 400 || res.status === 403) {
          lastError = json.error?.message || `권한 오류 (${res.status})`;
          continue;
        }
        return {
          success: false,
          error: json.error?.message || `넥슨 API 오류 (${res.status})`,
          isMockOrEmpty: true,
        };
      }
    } catch (err: any) {
      lastError = err.message || '네트워크 오류';
    }
  }

  // 웹 환경에서 조회가 실패하고 characterName이 제공된 경우 (월드리프 등으로 OCID 만료 가능성):
  // 닉네임으로 최신 OCID 조회 후 재시도 (자가 치유)
  if (characterName) {
    for (const k of orderedKeys) {
      try {
        const idRes = await fetch(`https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(characterName.trim())}`, {
          headers: { 'x-nxopen-api-key': k.apiKey, 'Content-Type': 'application/json' },
        });
        if (idRes.ok) {
          const idData = await idRes.json();
          if (idData.ocid && idData.ocid !== ocid) {
            const freshOcid = idData.ocid;
            const freshUrl = `https://open.api.nexon.com/maplestory/v1/scheduler/character-state?ocid=${encodeURIComponent(freshOcid)}${dateParam}`;
            for (const k2 of orderedKeys) {
              const res2 = await fetch(freshUrl, {
                headers: { 'x-nxopen-api-key': k2.apiKey, 'Content-Type': 'application/json' },
              });
              const ct2 = res2.headers.get('content-type') || '';
              if (ct2.includes('application/json')) {
                const json2 = await res2.json();
                if (res2.ok) {
                  return {
                    success: true,
                    data: json2,
                    isMockOrEmpty: false,
                    newOcid: freshOcid,
                  };
                }
              }
            }
            break;
          }
        }
      } catch (_) {}
    }
  }

  return {
    success: false,
    error: lastError,
    isMockOrEmpty: true,
  };
}

export async function loadServerAppData(): Promise<AppDataPayload | null> {
  if (isWeb) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Web localStorage read error', e);
    }
    return null;
  }

  try {
    const res = await fetch('/api/db/load');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (e) {
    console.warn('Could not load from server db, fallback to localStorage', e);
    return null;
  }
}

export async function saveServerAppData(data: AppDataPayload): Promise<boolean> {
  if (isWeb) {
    try {
      localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Web localStorage save error', e);
      return false;
    }
  }

  try {
    const res = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to save to server db', e);
    return false;
  }
}

export async function resetServerAppData(): Promise<boolean> {
  if (isWeb) {
    try {
      localStorage.removeItem(LOCAL_STORAGE_DATA_KEY);
      localStorage.removeItem(LOCAL_STORAGE_WEB_KEYS_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  try {
    const res = await fetch('/api/db/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (e) {
    console.error('Failed to reset server db', e);
    return false;
  }
}
