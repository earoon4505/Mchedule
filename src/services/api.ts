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

// API 키 별칭 수정
export async function updateApiKeyAlias(id: string, alias: string): Promise<{ success: boolean; keys?: ApiKeyItem[]; message?: string; error?: string }> {
  if (isWeb) {
    if (!alias || typeof alias !== 'string' || alias.trim().length === 0) {
      return { success: false, error: '변경할 별칭을 입력해주세요.' };
    }
    const keys = getWebLocalApiKeys();
    const idx = keys.findIndex((k) => k.id === id);
    if (idx === -1) {
      return { success: false, error: '해당 API 키를 찾을 수 없습니다.' };
    }
    keys[idx].alias = alias.trim();
    saveWebLocalApiKeys(keys);
    return { success: true, keys, message: '별칭이 성공적으로 변경되었습니다.' };
  }

  try {
    const res = await fetch(`/api/nexon/keys/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || '별칭 수정에 실패했습니다.' };
    }
    return { success: true, keys: json.keys, message: json.message };
  } catch (e: any) {
    return { success: false, error: e.message || '네트워크 오류가 발생했습니다.' };
  }
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

export async function testApiKey(apiKey?: string): Promise<{ success: boolean; message?: string; error?: string }> {
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

export async function fetchCharacterBasic(ocidOrName: { ocid?: string; name?: string }, force = false): Promise<{ success: boolean; basic?: NexonCharacterBasic; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (ocidOrName.ocid) params.set('ocid', ocidOrName.ocid);
    if (ocidOrName.name) params.set('name', ocidOrName.name);
    if (force) params.set('force', 'true');

    const headers = getRequestHeaders();
    const res = await fetch(`/api/nexon/character/basic?${params.toString()}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || '기본 정보 조회 실패' };
    }
    return { success: true, basic: data.basic };
  } catch (err: any) {
    return { success: false, error: err.message || '네트워크 오류' };
  }
}

export interface AccountCharactersResult {
  success: boolean;
  characters?: NexonAccountCharacter[];
  count?: number;
  error?: string;
}

export async function fetchAccountCharacters(force = false): Promise<AccountCharactersResult> {
  try {
    const headers = getRequestHeaders();
    const res = await fetch(`/api/nexon/account/characters${force ? '?force=true' : ''}`, {
      headers,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'API 계정 캐릭터 목록을 불러오지 못했습니다.',
      };
    }
    return {
      success: true,
      characters: data.characters || [],
      count: data.count || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || '네트워크 연결 오류가 발생했습니다.',
    };
  }
}

export async function fetchNexonSchedulerState(ocid: string, force = false, customDate?: string): Promise<SyncSchedulerResult> {
  try {
    const params = new URLSearchParams();
    params.set('ocid', ocid);
    if (customDate) {
      params.set('date', customDate);
    }
    if (force) {
      params.set('force', 'true');
    }
    const headers = getRequestHeaders();
    const url = `/api/nexon/character/scheduler?${params.toString()}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || '스케줄러 상태 조회 실패',
      };
    }
    return {
      success: true,
      data: data.data,
      isMockOrEmpty: data.isMockOrEmpty,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || '네트워크 오류',
    };
  }
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
