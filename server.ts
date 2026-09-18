import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const currentDirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = 3000;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: ['text/*', 'application/json'], limit: '10mb' }));

// 서버 파일 영구 저장소 경로 결정 (Windows APPDATA 또는 로컬 폴더)
function resolveDataDir(): string {
  if (process.env.APPDATA) {
    const p = path.join(process.env.APPDATA, 'MapleSchedule', 'data');
    if (!fs.existsSync(p)) {
      try { fs.mkdirSync(p, { recursive: true }); } catch (e) {}
    }
    return p;
  }
  if (process.env.HOME) {
    const p = path.join(process.env.HOME, '.mapleschedule', 'data');
    if (!fs.existsSync(p)) {
      try { fs.mkdirSync(p, { recursive: true }); } catch (e) {}
    }
    return p;
  }
  const local = path.join(process.cwd(), 'data');
  if (!fs.existsSync(local)) {
    try { fs.mkdirSync(local, { recursive: true }); } catch (e) {}
  }
  return local;
}

const DATA_DIR = resolveDataDir();
const DATA_FILE = path.join(DATA_DIR, 'storage.json');
const API_KEY_FILE = path.join(DATA_DIR, 'api_key.json');

export interface ApiKeyRecord {
  id: string;
  alias: string;
  apiKey: string;
  createdAt: string;
}

// 등록된 전체 API 키 목록 가져오기 (구버전 단일 키 마이그레이션 지원)
function getSavedApiKeys(): ApiKeyRecord[] {
  if (fs.existsSync(API_KEY_FILE)) {
    try {
      const raw = fs.readFileSync(API_KEY_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.keys)) {
        return parsed.keys;
      }
      if (parsed && typeof parsed.apiKey === 'string' && parsed.apiKey.trim().length > 0) {
        return [{
          id: 'key_migrated_1',
          alias: 'API1',
          apiKey: parsed.apiKey.trim(),
          createdAt: parsed.savedAt || new Date().toISOString(),
        }];
      }
    } catch (e) {
      console.error('Failed to read saved api keys:', e);
    }
  }
  return [];
}

function saveApiKeys(keys: ApiKeyRecord[]): void {
  fs.writeFileSync(
    API_KEY_FILE,
    JSON.stringify({ keys, savedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );
  apiCache.clear();
}

// 등록된 모든 유효 API 키 레코드 반환 (클라이언트 요청 헤더 우선)
function getActiveApiKeyRecords(req?: express.Request): ApiKeyRecord[] {
  if (req) {
    const itemsHeader = req.headers['x-user-api-key-items'] as string;
    if (itemsHeader) {
      try {
        const parsed = JSON.parse(itemsHeader);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (item: any) => item && typeof item.apiKey === 'string' && item.apiKey.trim().length > 0
          );
          if (valid.length > 0) return valid;
        }
      } catch (_) {}
    }
  }
  const saved = getSavedApiKeys();
  if (saved.length > 0) return saved;
  const envKey = (process.env.NEXON_API_KEY || '').trim();
  if (envKey) {
    return [{
      id: 'env_key_default',
      alias: '기본 API',
      apiKey: envKey,
      createdAt: new Date().toISOString(),
    }];
  }
  return [];
}

// API 키 가져오기 (특정 apiKeyId 우선 -> 클라이언트 요청 헤더 우선 -> 첫 번째 키 -> 환경변수)
function getActiveApiKey(req?: express.Request): string {
  if (req) {
    const requestedKeyId = (req.query?.apiKeyId as string) || (req.headers['x-api-key-id'] as string);
    if (requestedKeyId) {
      const records = getActiveApiKeyRecords(req);
      const matched = records.find((r) => r.id === requestedKeyId);
      if (matched && matched.apiKey) return matched.apiKey.trim();
    }
    const headerKey = (req.headers['x-nxopen-api-key'] as string) || (req.headers['x-user-api-key'] as string);
    if (headerKey && headerKey.trim().length > 0) {
      return headerKey.trim();
    }
  }
  const keys = getSavedApiKeys();
  if (keys.length > 0 && keys[0].apiKey) {
    return keys[0].apiKey.trim();
  }
  return (process.env.NEXON_API_KEY || '').trim();
}

// 등록된 모든 유효 API 키 반환 (클라이언트 요청 헤더 우선)
function getAllActiveApiKeys(req?: express.Request): string[] {
  const records = getActiveApiKeyRecords(req);
  if (records.length > 0) {
    return Array.from(new Set(records.map((r) => r.apiKey.trim()).filter((k) => k.length > 0)));
  }
  return [];
}

// OCID -> API Key 매핑 캐시 (스케줄러 조회 시 해당 캐릭터를 보유한 계정의 키로 즉시 라우팅)
const ocidToApiKeyMap = new Map<string, string>();

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '';
  const prefix = key.slice(0, 6);
  const suffix = key.slice(-4);
  return `${prefix}****${suffix}`;
}

// 개선된 인메모리 캐시 (Rate Limit 및 중복 호출 방지)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}
const apiCache = new Map<string, CacheEntry>();
const DEFAULT_CACHE_TTL_MS = 60 * 1000; // 기본 1분 캐시

function getFromCache(key: string): any | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    apiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, ttlMs = DEFAULT_CACHE_TTL_MS) {
  apiCache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

// 타임아웃 및 에러를 안전하게 처리하는 fetch 래퍼 함수
async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 동시 실행 수를 제한하는 병렬 맵 함수 (TLS/소켓 고갈 및 ConnectTimeout 방지)
// 개별 작업 실패 시에도 undefined가 남지 않고 안전하게 처리
async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) return [];
  const results: (R | null)[] = new Array(items.length).fill(null);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (currentIndex < items.length) {
      const i = currentIndex++;
      try {
        results[i] = await fn(items[i]);
      } catch (e) {
        results[i] = null;
      }
    }
  });

  await Promise.all(workers);
  return results.filter((r): r is R => r !== null);
}

// ----------------------------------------------------
// 1. NEXON API Key & Proxy Endpoints
// ----------------------------------------------------

// 인메모리 이미지 캐시 (동일 아바타 반복 요청 시 네트워크 지연 0ms 보장 및 버퍼링 완전 제거)
interface CachedImage {
  buffer: Buffer;
  contentType: string;
  timestamp: number;
}
const imageMemoryCache = new Map<string, CachedImage>();
const MAX_IMAGE_CACHE_SIZE = 150;
const IMAGE_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2시간 유지

// 캐릭터 프로필 이미지 프록시 (CORS/CDN/보안 제약 없이 100% 안정 표시)
app.get('/api/proxy/image', async (req, res) => {
  let imageUrl = req.query.url as string;
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).send('Image URL required');
  }

  try {
    imageUrl = imageUrl.trim();
    if (imageUrl.startsWith('%')) {
      try {
        imageUrl = decodeURIComponent(imageUrl);
      } catch (_) {}
    }

    // 1. 인메모리 캐시 확인 (0ms 즉시 응답)
    const cached = imageMemoryCache.get(imageUrl);
    if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_TTL_MS) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    };

    const apiKey = getActiveApiKey(req);
    if (apiKey && imageUrl.includes('open.api.nexon.com')) {
      headers['x-nxopen-api-key'] = apiKey;
    }

    let imgRes = await safeFetch(imageUrl, { headers }, 6000).catch(() => null);

    if (!imgRes || !imgRes.ok) {
      // Retry direct without custom headers
      imgRes = await safeFetch(imageUrl, {}, 6000).catch(() => null);
    }

    if (!imgRes || !imgRes.ok) {
      return res.status(imgRes ? imgRes.status : 504).send('Failed to fetch image');
    }

    const contentType = imgRes.headers.get('content-type') || 'image/png';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. 인메모리 캐시 저장 (LRU 방식으로 오래된 캐시 정리)
    if (imageMemoryCache.size >= MAX_IMAGE_CACHE_SIZE) {
      const firstKey = imageMemoryCache.keys().next().value;
      if (firstKey) imageMemoryCache.delete(firstKey);
    }
    imageMemoryCache.set(imageUrl, {
      buffer,
      contentType,
      timestamp: Date.now(),
    });

    return res.send(buffer);
  } catch (err) {
    return res.status(500).send('Image proxy error');
  }
});

// API 상태 확인
app.get('/api/nexon/status', (req, res) => {
  const keys = getAllActiveApiKeys(req);
  const activeKey = getActiveApiKey(req);
  const hasApiKey = activeKey.length > 0;
  res.json({
    hasApiKey,
    count: keys.length,
    serverTime: new Date().toISOString(),
  });
});

// 등록된 전체 API 키 목록 조회 (보안 마스킹 없이 원본 제공)
app.get('/api/nexon/keys', (req, res) => {
  const keys = getSavedApiKeys();
  return res.json({
    success: true,
    keys,
    count: keys.length,
  });
});

// 신규 API 키 추가 (별칭 지정 가능, 미입력 시 'API1', 'API2' 자동 생성)
app.post('/api/nexon/keys', (req, res) => {
  try {
    const { apiKey, alias } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({ success: false, error: '유효한 API 키를 입력해주세요.' });
    }

    const trimmedKey = apiKey.trim();
    const keys = getSavedApiKeys();

    // 중복 체크
    if (keys.some((k) => k.apiKey === trimmedKey)) {
      return res.status(400).json({ success: false, error: '이미 등록되어 있는 API 키입니다.' });
    }

    let assignedAlias = (alias && typeof alias === 'string' && alias.trim().length > 0)
      ? alias.trim()
      : `API ${keys.length + 1}`;

    // 만약 이미 동일한 별칭이 있으면 번호 붙이기
    if (keys.some((k) => k.alias === assignedAlias)) {
      assignedAlias = `API ${keys.length + 1}`;
    }

    const newRecord: ApiKeyRecord = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      alias: assignedAlias,
      apiKey: trimmedKey,
      createdAt: new Date().toISOString(),
    };

    keys.push(newRecord);
    saveApiKeys(keys);

    return res.json({
      success: true,
      keys,
      newKey: newRecord,
      message: `'${assignedAlias}' API 키가 성공적으로 등록되었습니다.`,
    });
  } catch (err: any) {
    console.error('Failed to add API key:', err);
    return res.status(500).json({ success: false, error: err.message || 'API 키 등록 실패' });
  }
});

// API 키 정보(alias 및 apiKey) 수정
app.put('/api/nexon/keys/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { alias, apiKey } = req.body || {};

    if (!alias && !apiKey) {
      return res.status(400).json({ success: false, error: '변경할 별칭 또는 API 키를 입력해주세요.' });
    }

    const keys = getSavedApiKeys();
    const targetIndex = keys.findIndex((k) => k.id === id);
    if (targetIndex === -1) {
      return res.status(404).json({ success: false, error: '해당 API 키를 찾을 수 없습니다.' });
    }

    if (alias && typeof alias === 'string' && alias.trim().length > 0) {
      keys[targetIndex].alias = alias.trim();
    }

    if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
      const trimmedKey = apiKey.trim();
      // 다른 키와 중복 여부 확인
      if (keys.some((k, idx) => idx !== targetIndex && k.apiKey === trimmedKey)) {
        return res.status(400).json({ success: false, error: '이미 다른 항목에 등록되어 있는 API 키입니다.' });
      }
      keys[targetIndex].apiKey = trimmedKey;
      ocidToApiKeyMap.clear();
    }

    saveApiKeys(keys);

    return res.json({
      success: true,
      keys,
      message: 'API 키 정보가 성공적으로 변경되었습니다.',
    });
  } catch (err: any) {
    console.error('Failed to update API key:', err);
    return res.status(500).json({ success: false, error: err.message || 'API 키 수정 실패' });
  }
});

// 특정 API 키 삭제
app.delete('/api/nexon/keys/:id', (req, res) => {
  try {
    const { id } = req.params;
    const keys = getSavedApiKeys();
    const filtered = keys.filter((k) => k.id !== id);

    if (filtered.length === keys.length) {
      return res.status(404).json({ success: false, error: '삭제할 API 키를 찾을 수 없습니다.' });
    }

    saveApiKeys(filtered);
    ocidToApiKeyMap.clear();

    return res.json({
      success: true,
      keys: filtered,
      message: 'API 키가 삭제되었습니다.',
    });
  } catch (err: any) {
    console.error('Failed to delete API key:', err);
    return res.status(500).json({ success: false, error: err.message || 'API 키 삭제 실패' });
  }
});

// 기존 API 키 상세 정보 조회 (하위 호환성)
app.get('/api/nexon/key', (req, res) => {
  const keys = getSavedApiKeys();
  const apiKey = getActiveApiKey();
  const hasCustomKey = keys.length > 0;

  res.json({
    success: true,
    hasApiKey: apiKey.length > 0,
    keys,
    count: keys.length,
    isCustomSaved: hasCustomKey,
    isFromEnv: !hasCustomKey && (process.env.NEXON_API_KEY || '').trim().length > 0,
  });
});

// 기존 API 키 등록 (단일 등록 시 자동 별칭으로 추가)
app.post('/api/nexon/key', (req, res) => {
  try {
    const { apiKey, alias } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({ success: false, error: '유효한 API 키를 입력해주세요.' });
    }

    const trimmedKey = apiKey.trim();
    const keys = getSavedApiKeys();

    let assignedAlias = (alias && typeof alias === 'string' && alias.trim().length > 0)
      ? alias.trim()
      : `API${keys.length + 1}`;

    const existingIdx = keys.findIndex(k => k.apiKey === trimmedKey);
    if (existingIdx !== -1) {
      return res.json({
        success: true,
        hasApiKey: true,
        keys,
        message: '이미 등록된 키입니다.',
      });
    }

    const newRecord: ApiKeyRecord = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      alias: assignedAlias,
      apiKey: trimmedKey,
      createdAt: new Date().toISOString(),
    };

    keys.push(newRecord);
    saveApiKeys(keys);

    return res.json({
      success: true,
      hasApiKey: true,
      keys,
      message: 'API 키가 성공적으로 등록되었습니다.',
    });
  } catch (err: any) {
    console.error('Failed to save API key:', err);
    return res.status(500).json({ success: false, error: err.message || 'API 키 저장 실패' });
  }
});

// 전체 API 키 삭제 (지우기)
app.delete('/api/nexon/key', (req, res) => {
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      fs.unlinkSync(API_KEY_FILE);
    }
    // 캐시 초기화
    apiCache.clear();

    const envKey = (process.env.NEXON_API_KEY || '').trim();
    const hasEnvKey = envKey.length > 0;

    return res.json({
      success: true,
      hasApiKey: hasEnvKey,
      keys: [],
      isFromEnv: hasEnvKey,
      message: '등록된 모든 API 키가 삭제되었습니다.',
    });
  } catch (err: any) {
    console.error('Failed to delete API key:', err);
    return res.status(500).json({ success: false, error: err.message || 'API 키 삭제 실패' });
  }
});

// API 키 유효성 테스트 (실제 넥슨 API 핑 확인)
app.post('/api/nexon/key/test', async (req, res) => {
  const { apiKey: customKey } = req.body || {};
  const targetKey = (customKey && typeof customKey === 'string' && customKey.trim()) 
    ? customKey.trim() 
    : getActiveApiKey(req);

  if (!targetKey) {
    return res.status(400).json({ success: false, error: '검증할 API 키가 없습니다.' });
  }

  try {
    // 넥슨 API 테스트 호출 (예: 메이플 기본 식별자 조회)
    const testUrl = `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent('메이플용사')}`;
    const testRes = await safeFetch(testUrl, {
      headers: {
        'x-nxopen-api-key': targetKey,
        'Content-Type': 'application/json',
      },
    }, 7000);

    const testJson = await testRes.json().catch(() => ({}));

    if (!testRes.ok) {
      const errName = testJson?.error?.name || '';
      const errMsg = testJson?.error?.message || '';

      // 캐릭터명이 없는 경우(OPENAPI00004)는 API 키 자체는 유효함
      if (errName === 'OPENAPI00004') {
        return res.json({
          success: true,
          message: 'NEXON Open API 연결 테스트에 성공했습니다!',
        });
      }

      return res.status(400).json({
        success: false,
        error: errMsg || '유효하지 않은 API 키이거나 권한이 없습니다. 키를 다시 확인해주세요.',
      });
    }

    return res.json({
      success: true,
      message: 'NEXON Open API 연결 테스트에 성공했습니다!',
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || '연결 테스트 중 네트워크 오류가 발생했습니다.',
    });
  }
});

// 캐릭터 검색 및 기본 정보 조회
app.get('/api/nexon/character/search', async (req, res) => {
  const name = req.query.name as string;
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: '캐릭터명을 입력해주세요.' });
  }

  const apiKey = getActiveApiKey(req);
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'NEXON API 키가 등록되지 않았습니다. 상단 [API 등록] 버튼을 눌러 API 키를 등록해주세요.',
    });
  }

  const force = req.query.force === 'true';
  const cacheKey = `search_${name.trim().toLowerCase()}`;
  if (!force) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }
  }

  try {
    // 1단계: OCID 조회
    const idUrl = `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(name.trim())}`;
    const idRes = await safeFetch(idUrl, {
      headers: {
        'x-nxopen-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    }, 7000);

    if (!idRes.ok) {
      const errJson = await idRes.json().catch(() => ({}));
      return res.status(idRes.status).json({
        success: false,
        error: errJson.error?.message || `캐릭터를 찾을 수 없습니다. (상태 코드: ${idRes.status})`,
      });
    }

    const idData = (await idRes.json()) as { ocid: string };
    if (!idData.ocid) {
      return res.status(404).json({ success: false, error: '캐릭터 식별자(OCID)를 가져오지 못했습니다.' });
    }

    // 2단계: 캐릭터 기본 정보 조회
    const basicUrl = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(idData.ocid)}`;
    const basicRes = await safeFetch(basicUrl, {
      headers: {
        'x-nxopen-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    }, 7000);

    if (!basicRes.ok) {
      const errJson = await basicRes.json().catch(() => ({}));
      return res.status(basicRes.status).json({
        success: false,
        error: errJson.error?.message || '캐릭터 기본 정보 조회에 실패했습니다.',
      });
    }

    const basicData = await basicRes.json();
    const result = {
      ocid: idData.ocid,
      basic: basicData,
    };

    setCache(cacheKey, result, 5 * 60 * 1000);
    setCache(`basic_${idData.ocid}`, basicData, 10 * 60 * 1000);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Nexon API search error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || '넥슨 서버와의 통신 중 네트워크 오류가 발생했습니다.',
    });
  }
});

// OCID 기반 캐릭터 기본 정보(프로필 이미지, 레벨, 직업 등) 직접 조회
app.get('/api/nexon/character/basic', async (req, res) => {
  const ocid = req.query.ocid as string;
  const name = req.query.name as string;
  const force = req.query.force === 'true';

  const apiKeys = getAllActiveApiKeys(req);
  if (apiKeys.length === 0) {
    return res.status(400).json({ success: false, error: 'NEXON API 키가 등록되지 않았습니다.' });
  }

  let targetOcid = ocid;
  try {
    // 이름만 있고 OCID가 없는 경우 이름으로 OCID 조회
    if (!targetOcid && name) {
      for (const key of apiKeys) {
        const idUrl = `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(name.trim())}`;
        const idRes = await safeFetch(idUrl, {
          headers: { 'x-nxopen-api-key': key, 'Content-Type': 'application/json' },
        }, 6000);
        if (idRes.ok) {
          const idData = (await idRes.json()) as { ocid: string };
          targetOcid = idData.ocid;
          break;
        }
      }
    }

    if (!targetOcid) {
      return res.status(400).json({ success: false, error: 'OCID 또는 캐릭터명이 필요합니다.' });
    }

    const cacheKey = `basic_${targetOcid}`;
    if (!force) {
      const cachedBasic = getFromCache(cacheKey);
      if (cachedBasic) {
        return res.json({ success: true, ocid: targetOcid, basic: cachedBasic, cached: true });
      }
    }

    // 요청된 apiKeyId 또는 캐릭터를 보유한 키가 매핑되어 있으면 우선 사용
    const requestedKey = (req.query.apiKeyId as string)
      ? getActiveApiKeyRecords(req).find((r) => r.id === req.query.apiKeyId)?.apiKey
      : undefined;
    const preferredKey = requestedKey || ocidToApiKeyMap.get(targetOcid);
    const candidateKeys = preferredKey
      ? [preferredKey, ...apiKeys.filter((k) => k !== preferredKey)]
      : [...apiKeys];

    let basicData: any = null;
    let lastError: string = '기본 정보 조회 실패';

    for (const key of candidateKeys) {
      const basicUrl = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(targetOcid.trim())}`;
      const basicRes = await safeFetch(basicUrl, {
        headers: { 'x-nxopen-api-key': key, 'Content-Type': 'application/json' },
      }, 7000);

      if (basicRes.ok) {
        basicData = await basicRes.json();
        ocidToApiKeyMap.set(targetOcid, key);
        setCache(cacheKey, basicData, 10 * 60 * 1000);
        break;
      } else {
        const errJson = await basicRes.json().catch(() => ({}));
        lastError = errJson.error?.message || `상태 코드 ${basicRes.status}`;
      }
    }

    let isOcidUpdated = false;
    let originalOcid = targetOcid;

    // 월드리프(서버 이전) 등으로 기존 OCID가 만료되어 조회가 실패한 경우:
    // 캐릭터명이 제공되어 있다면 닉네임으로 최신 OCID를 조회하여 자동 치유(Self-Healing)
    if (!basicData && name) {
      for (const key of apiKeys) {
        try {
          const idUrl = `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(name.trim())}`;
          const idRes = await safeFetch(idUrl, {
            headers: { 'x-nxopen-api-key': key, 'Content-Type': 'application/json' },
          }, 6000);
          if (idRes.ok) {
            const idData = (await idRes.json()) as { ocid: string };
            if (idData.ocid && idData.ocid !== originalOcid) {
              const freshOcid = idData.ocid;
              // 신규 발급된 OCID로 기본 정보 재조회
              for (const k of apiKeys) {
                const retryUrl = `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(freshOcid.trim())}`;
                const retryRes = await safeFetch(retryUrl, {
                  headers: { 'x-nxopen-api-key': k, 'Content-Type': 'application/json' },
                }, 7000);
                if (retryRes.ok) {
                  basicData = await retryRes.json();
                  targetOcid = freshOcid;
                  isOcidUpdated = true;
                  ocidToApiKeyMap.set(freshOcid, k);
                  setCache(`basic_${freshOcid}`, basicData, 10 * 60 * 1000);
                  break;
                }
              }
              if (basicData) break;
            }
          }
        } catch (_) {}
      }
    }

    if (!basicData) {
      return res.status(400).json({
        success: false,
        error: lastError,
      });
    }

    return res.json({
      success: true,
      ocid: targetOcid,
      newOcid: isOcidUpdated ? targetOcid : undefined,
      basic: basicData,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || '네트워크 오류' });
  }
});

// API 계정 내 전체 캐릭터 목록 조회 (/maplestory/v1/character/list)
// 등록된 모든 API 키의 계정에서 캐릭터를 병렬로 수집하여 통합 제공
app.get('/api/nexon/account/characters', async (req, res) => {
  const apiKeyRecords = getActiveApiKeyRecords(req);
  if (apiKeyRecords.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'NEXON API 키가 등록되지 않았습니다. 상단 [API 등록] 버튼을 눌러 먼저 키를 등록해주세요.',
    });
  }

  const force = req.query.force === 'true';
  // 등록된 키 목록 기반 결합 캐시 키
  const cacheKey = `account_chars_${apiKeyRecords.map((r) => `${r.id}_${r.apiKey.slice(-6)}`).sort().join('_')}`;
  if (!force) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, characters: cached, cached: true });
    }
  }

  try {
    const listUrl = 'https://open.api.nexon.com/maplestory/v1/character/list';

    // 1) 등록된 모든 API 키에 대해 병렬로 캐릭터 목록 조회
    const accountResults = await Promise.all(
      apiKeyRecords.map(async (record) => {
        try {
          const listRes = await safeFetch(listUrl, {
            headers: {
              'x-nxopen-api-key': record.apiKey,
              'Content-Type': 'application/json',
            },
          }, 8000);

          if (!listRes.ok) return { record, characters: [] };
          const listData = await listRes.json();
          let rawList: any[] = [];

          if (Array.isArray(listData.account_list)) {
            for (const acc of listData.account_list) {
              if (Array.isArray(acc.character_list)) {
                rawList.push(...acc.character_list);
              }
            }
          } else if (Array.isArray(listData.character_list)) {
            rawList = listData.character_list;
          } else if (Array.isArray(listData)) {
            rawList = listData;
          }

          // 해당 API 키가 소유한 OCID 매핑 기록 (스케줄러 조회 시 즉시 해당 키 사용)
          for (const c of rawList) {
            if (c && c.ocid) {
              ocidToApiKeyMap.set(c.ocid, record.apiKey);
            }
          }

          return { record, characters: rawList };
        } catch (e) {
          return { record, characters: [] };
        }
      })
    );

    // 2) 중복 방지 병합 (동일 캐릭터가 중복 등록된 경우 방지)
    const seenOcids = new Set<string>();
    const mergedRawList: { char: any; record: ApiKeyRecord }[] = [];
    for (const resItem of accountResults) {
      for (const char of resItem.characters) {
        const idKey = char.ocid || char.character_name;
        if (idKey && !seenOcids.has(idKey)) {
          seenOcids.add(idKey);
          mergedRawList.push({ char, record: resItem.record });
        }
      }
    }

    // 3) 계정 캐릭터 목록 기본 정보 및 프로필 사진 보강
    // 넥슨 /character/list 응답의 원본 캐릭터(이름, 월드, 직업, 레벨, OCID)는 100% 보존하며,
    // 프로필 사진(character_image)은 캐시 우선 및 동시 3개 이하 안전 조회로 채웁니다.
    const enrichedList = await mapConcurrent(mergedRawList, 3, async ({ char, record }) => {
      const ocid = char.ocid;
      const fallbackChar = {
        ocid: char.ocid || '',
        character_name: char.character_name || '',
        world_name: char.world_name || '메이플',
        character_class: char.character_class || '모험가',
        character_level: Number(char.character_level) || 200,
        character_image: char.character_image || '',
        character_gender: char.character_gender || '',
        character_guild_name: char.character_guild_name || '',
        apiKeyId: record.id,
        apiKeyAlias: record.alias,
      };

      if (!ocid) return fallbackChar;

      const charCacheKey = `basic_${ocid}`;
      const cachedBasic = getFromCache(charCacheKey);

      if (cachedBasic) {
        return {
          ...fallbackChar,
          character_name: char.character_name || cachedBasic.character_name || fallbackChar.character_name,
          world_name: char.world_name || cachedBasic.world_name || fallbackChar.world_name,
          character_class: char.character_class || cachedBasic.character_class || fallbackChar.character_class,
          character_level: Number(char.character_level || cachedBasic.character_level) || fallbackChar.character_level,
          character_image: cachedBasic.character_image || fallbackChar.character_image,
          character_gender: cachedBasic.character_gender || fallbackChar.character_gender,
          character_guild_name: cachedBasic.character_guild_name || fallbackChar.character_guild_name,
          apiKeyId: record.id,
          apiKeyAlias: record.alias,
        };
      }

      // 캐시가 없는 경우 넥슨 /character/basic 안전 조회 (타임아웃 4초)
      try {
        const bRes = await safeFetch(
          `https://open.api.nexon.com/maplestory/v1/character/basic?ocid=${encodeURIComponent(ocid)}`,
          {
            headers: {
              'x-nxopen-api-key': record.apiKey,
              'Content-Type': 'application/json',
            },
          },
          4000
        );
        if (bRes.ok) {
          const bData = await bRes.json();
          setCache(charCacheKey, bData, 15 * 60 * 1000); // 15분 캐싱
          return {
            ...fallbackChar,
            character_name: char.character_name || bData.character_name || fallbackChar.character_name,
            world_name: char.world_name || bData.world_name || fallbackChar.world_name,
            character_class: char.character_class || bData.character_class || fallbackChar.character_class,
            character_level: Number(char.character_level || bData.character_level) || fallbackChar.character_level,
            character_image: bData.character_image || fallbackChar.character_image,
            character_gender: bData.character_gender || fallbackChar.character_gender,
            character_guild_name: bData.character_guild_name || fallbackChar.character_guild_name,
            apiKeyId: record.id,
            apiKeyAlias: record.alias,
          };
        }
      } catch (_) {
        // 네트워크 지연 또는 429 발생 시에도 캐릭터가 절대 누락되지 않도록 fallbackChar 반환
      }

      return fallbackChar;
    });

    // 레벨 높은 순으로 정렬
    enrichedList.sort((a, b) => (Number(b.character_level) || 0) - (Number(a.character_level) || 0));

    setCache(cacheKey, enrichedList, 3 * 60 * 1000); // 3분 캐싱
    return res.json({
      success: true,
      count: enrichedList.length,
      characters: enrichedList,
    });
  } catch (err: any) {
    console.error('Nexon API account characters error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'API 계정 캐릭터 목록을 불러오는 중 네트워크 오류가 발생했습니다.',
    });
  }
});

function getKSTDateString(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60000);
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, '0');
  const d = String(kst.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 스케줄러 상태 조회 (/maplestory/v1/scheduler/character-state 및 /character/quest-history)
app.get('/api/nexon/character/scheduler', async (req, res) => {
  let ocid = req.query.ocid as string;
  const characterName = (req.query.name as string)?.trim();
  const dateParam = (req.query.date as string)?.trim();
  const date = (dateParam || getKSTDateString()).trim();
  const force = req.query.force === 'true';

  if (!ocid || ocid.startsWith('manual_') || ocid.length < 15) {
    return res.json({
      success: true,
      data: null,
      isMockOrEmpty: true,
      error: '유효한 OCID가 아니거나 수동 등록 캐릭터입니다.',
    });
  }

  const apiKeys = getAllActiveApiKeys(req);
  if (apiKeys.length === 0) {
    return res.json({
      success: true,
      data: null,
      isMockOrEmpty: true,
      error: 'NEXON_API_KEY 미설정',
    });
  }

  // 매핑된 키 또는 요청된 apiKeyId가 있으면 최우선 후보로 지정
  const requestedKey = (req.query.apiKeyId as string)
    ? getActiveApiKeyRecords(req).find((r) => r.id === req.query.apiKeyId)?.apiKey
    : undefined;
  const preferredKey = requestedKey || ocidToApiKeyMap.get(ocid);
  const candidateKeys = preferredKey
    ? [preferredKey, ...apiKeys.filter((k) => k !== preferredKey)]
    : [...apiKeys];

  // 오늘 날짜인지 과거 날짜인지 판별하여 캐시 키 및 캐시 수명 차별화
  // (과거 날짜: dateParam이 존재하고, 오늘 KST 날짜가 아니며 유효한 날짜 형식인 경우만)
  const isPastDate = !!(dateParam && dateParam !== getKSTDateString() && /^\d{4}-\d{2}-\d{2}$/.test(dateParam));
  const cacheKey = isPastDate ? `sched_${ocid}_${dateParam}` : `sched_${ocid}`;

  if (!force) {
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }
  }

  try {
    let schedRes: Response | null = null;
    let successfulKey: string = candidateKeys[0];

    // 1) 스케줄러 상태 API 호출 (/scheduler/character-state)
    // 캐릭터를 소유한 계정의 API 키를 찾아 순차/폴백 호출
    for (const key of candidateKeys) {
      const headers = {
        'x-nxopen-api-key': key,
        'Content-Type': 'application/json',
      };

      let schedulerUrl = `https://open.api.nexon.com/maplestory/v1/scheduler/character-state?ocid=${encodeURIComponent(ocid)}`;
      // 넥슨 공식 스펙: 과거 날짜 조회 시에만 date 파라미터 필요. 오늘 실시간 조회 시 date 파라미터가 들어가면 400 에러 발생하므로 생략
      if (isPastDate) {
        schedulerUrl += `&date=${encodeURIComponent(dateParam!)}`;
      }

      let resAttempt = await safeFetch(schedulerUrl, { headers }, 8000).catch(() => null);

      // 과거 날짜 조회 시 간혹 400 (조회 불가 날짜) 발생할 때만 실시간 최신 상태로 1회 재시도
      if (isPastDate && resAttempt && resAttempt.status === 400) {
        const fallbackUrl = `https://open.api.nexon.com/maplestory/v1/scheduler/character-state?ocid=${encodeURIComponent(ocid)}`;
        const fallbackRes = await safeFetch(fallbackUrl, { headers }, 6000).catch(() => null);
        if (fallbackRes && fallbackRes.ok) {
          resAttempt = fallbackRes;
        }
      }

      if (resAttempt && resAttempt.ok) {
        schedRes = resAttempt;
        successfulKey = key;
        ocidToApiKeyMap.set(ocid, key); // 성공한 키로 영구 매핑
        break;
      }

      schedRes = resAttempt;
    }

    const headers = {
      'x-nxopen-api-key': successfulKey,
      'Content-Type': 'application/json',
    };

    let schedData: any = null;
    let schedStatus = schedRes ? schedRes.status : 504;
    let isOcidUpdated = false;

    if (schedRes && schedRes.ok) {
      schedData = await schedRes.json().catch(() => null);
    } else if (schedRes && schedStatus >= 400) {
      console.warn(`[Nexon Scheduler Warning] status ${schedStatus}`);
    }

    // 월드리프 등으로 기존 OCID가 만료되어 스케줄러 조회가 실패한 경우:
    // 캐릭터명이 제공되어 있다면 닉네임으로 최신 OCID를 조회하여 자동 치유(Self-Healing)
    if ((!schedRes || !schedRes.ok || !schedData) && characterName) {
      for (const key of apiKeys) {
        try {
          const idUrl = `https://open.api.nexon.com/maplestory/v1/id?character_name=${encodeURIComponent(characterName.trim())}`;
          const idRes = await safeFetch(idUrl, {
            headers: { 'x-nxopen-api-key': key, 'Content-Type': 'application/json' },
          }, 6000);
          if (idRes.ok) {
            const idData = (await idRes.json()) as { ocid: string };
            if (idData.ocid && idData.ocid !== ocid) {
              const freshOcid = idData.ocid;
              // 신규 발급된 OCID로 스케줄러 재조회 시도
              for (const k of apiKeys) {
                const retryUrl = `https://open.api.nexon.com/maplestory/v1/scheduler/character-state?ocid=${encodeURIComponent(freshOcid.trim())}${isPastDate ? `&date=${encodeURIComponent(dateParam!)}` : ''}`;
                const retryRes = await safeFetch(retryUrl, {
                  headers: { 'x-nxopen-api-key': k, 'Content-Type': 'application/json' },
                }, 8000);
                if (retryRes.ok) {
                  schedData = await retryRes.json().catch(() => null);
                  if (schedData) {
                    schedRes = retryRes;
                    schedStatus = retryRes.status;
                    successfulKey = k;
                    ocid = freshOcid;
                    isOcidUpdated = true;
                    ocidToApiKeyMap.set(freshOcid, k);
                    break;
                  }
                }
              }
              if (schedData) break;
            }
          }
        } catch (_) {}
      }
    }

    // 넥슨 스케줄러 조회가 실패했거나 데이터가 없는 경우, 클라이언트의 기존 클리어 상태를 보존하기 위해 명확히 에러 반환
    if (!schedRes || !schedRes.ok || !schedData) {
      return res.json({
        success: false,
        data: null,
        isMockOrEmpty: true,
        error: `넥슨 스케줄러 정보 조회 실패 (상태 코드: ${schedStatus})`,
      });
    }

    // 2) 보조: 퀘스트 히스토리 API 호출 (/character/quest-history) - 퀘스트 히스토리는 date 파라미터 지원
    let questHistoryData: any = null;
    try {
      let questUrl = `https://open.api.nexon.com/maplestory/v1/character/quest-history?ocid=${encodeURIComponent(ocid)}`;
      if (date && date.trim()) {
        questUrl += `&date=${encodeURIComponent(date.trim())}`;
      }
      const qRes = await safeFetch(questUrl, { headers }, 4000).catch(() => null);
      if (qRes && qRes.ok) {
        questHistoryData = await qRes.json().catch(() => null);
      }
    } catch (qErr) {
      // 퀘스트 히스토리 실패 시 무시
    }

    // 3) 보조: 무릉도장 API 호출 (/character/dojang) - 무릉도장은 date 파라미터 지원
    let dojangData: any = null;
    try {
      let dojangUrl = `https://open.api.nexon.com/maplestory/v1/character/dojang?ocid=${encodeURIComponent(ocid)}`;
      if (date && date.trim()) {
        dojangUrl += `&date=${encodeURIComponent(date.trim())}`;
      }
      const dRes = await safeFetch(dojangUrl, { headers }, 4000).catch(() => null);
      if (dRes && dRes.ok) {
        dojangData = await dRes.json().catch(() => null);
      }
    } catch (dErr) {
      // 무릉도장 실패 시 무시
    }

    const combinedData = {
      scheduler: schedData,
      quest_history: questHistoryData,
      dojang: dojangData,
      ...(schedData && typeof schedData === 'object' ? schedData : {}),
      _meta: {
        schedStatus,
        fetchedAt: new Date().toISOString(),
      },
    };

    // 과거 날짜는 이미 종료되어 변하지 않는 데이터이므로 24시간 캐시, 실시간 오늘은 15초 캐시
    setCache(cacheKey, combinedData, isPastDate ? 24 * 60 * 60 * 1000 : 15 * 1000);
    return res.json({
      success: true,
      data: combinedData,
      ocid,
      newOcid: isOcidUpdated ? ocid : undefined,
    });
  } catch (err: any) {
    console.error('Scheduler fetch error:', err);
    return res.json({
      success: true,
      data: null,
      isMockOrEmpty: true,
      error: err.message,
    });
  }
});

// ----------------------------------------------------
// 2. Server-side Persistent Storage
// ----------------------------------------------------

app.get(['/api/db/load', '/api/storage'], (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const json = JSON.parse(raw);
      return res.json({ success: true, data: json });
    }
    return res.json({ success: true, data: null });
  } catch (err: any) {
    console.error('Load DB error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/db/save', '/api/storage'], (req, res) => {
  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (_) {}
    }
    if (payload && typeof payload === 'object') {
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error('Save DB error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/db/reset', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
    // 등록된 API 키 파일 및 캐시도 영구 초기화
    if (fs.existsSync(API_KEY_FILE)) {
      fs.unlinkSync(API_KEY_FILE);
    }
    apiCache.clear();
    imageMemoryCache.clear();
    ocidToApiKeyMap.clear();

    return res.json({ success: true, message: '모든 데이터 및 API 키가 완전히 초기화되었습니다.' });
  } catch (err: any) {
    console.error('Reset DB error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 3. Vite Middleware (Dev) & Static Serving (Prod)
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn('Vite dev server not available, serving static files:', e);
      serveStaticFiles();
    }
  } else {
    serveStaticFiles();
  }

  function serveStaticFiles() {
    const candidates = [
      currentDirname,
      path.join(currentDirname, '../dist'),
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'app.asar/dist'),
    ];
    let distPath = candidates.find((c) => fs.existsSync(path.join(c, 'index.html'))) || candidates[0];

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('MapleSchedule UI: index.html not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MapleStory Scheduler Server running on http://127.0.0.1:${PORT}`);
  });
}

startServer();
