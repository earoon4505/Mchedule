import { AppDataPayload, ApiKeyItem } from '../types';

export const APP_DATA_STORAGE_KEY = 'maplestory_scheduler_app_data_v1';
export const COMMON_CONTENTS_STORAGE_KEY = 'mapleschedule_common_content_ids';
export const COMMON_CONTENTS_UPDATED_EVENT = 'mapleschedule:common-contents-updated';
export const API_KEYS_UPDATED_EVENT = 'mapleschedule:apikeys-updated';
const CHANNEL_NAME = 'mapleschedule_sync_channel';

let channel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  channel = null;
}

/**
 * 메인 윈도우와 PiP 윈도우 간 즉각(0ms) 데이터 동기화 브로드캐스트
 */
export function broadcastAppData(payload: AppDataPayload): void {
  if (channel) {
    try {
      channel.postMessage({
        type: 'DATA_SYNC',
        payload,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }
  }
  try {
    localStorage.setItem('mapleschedule_last_broadcast', String(Date.now()));
  } catch (e) {}
}

/**
 * API 키 추가/삭제/별칭 수정 즉각(0ms) 동기화 브로드캐스트
 */
export function broadcastApiKeys(keys: ApiKeyItem[]): void {
  if (channel) {
    try {
      channel.postMessage({
        type: 'API_KEYS_SYNC',
        keys,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('BroadcastChannel apiKeys postMessage error:', e);
    }
  }

  // 동일 윈도우 내 모든 컴포넌트(App, ProgressPanel, PiPOverlay 등)에 즉각 통지 및 동기 캐시
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mapleschedule_cached_apikeys_v1', JSON.stringify(keys));
      window.dispatchEvent(new CustomEvent(API_KEYS_UPDATED_EVENT, { detail: keys }));
      localStorage.setItem('mapleschedule_apikeys_broadcast', String(Date.now()));
    } catch (e) {}
  }
}

/**
 * API 키 변경 이벤트 구독 (동일 창 CustomEvent + 다른 창 BroadcastChannel + Storage 이벤트 통합)
 */
export function subscribeToApiKeys(callback: (keys: ApiKeyItem[]) => void): () => void {
  const unsubscribers: Array<() => void> = [];

  if (channel) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'API_KEYS_SYNC' && Array.isArray(event.data.keys)) {
        try {
          localStorage.setItem('mapleschedule_cached_apikeys_v1', JSON.stringify(event.data.keys));
        } catch (_) {}
        callback(event.data.keys);
      }
    };
    channel.addEventListener('message', handleMessage);
    unsubscribers.push(() => {
      channel?.removeEventListener('message', handleMessage);
    });
  }

  if (typeof window !== 'undefined') {
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ApiKeyItem[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        callback(customEvent.detail);
      }
    };
    window.addEventListener(API_KEYS_UPDATED_EVENT, handleCustomEvent);
    unsubscribers.push(() => {
      window.removeEventListener(API_KEYS_UPDATED_EVENT, handleCustomEvent);
    });
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * 브로드캐스트 이벤트 구독 (메인 창 및 PiP 창에서 실시간 수신)
 */
export function subscribeToBroadcast(callback: (payload: AppDataPayload) => void): () => void {
  const unsubscribers: Array<() => void> = [];

  if (channel) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'DATA_SYNC' && event.data.payload) {
        callback(event.data.payload);
      }
    };
    channel.addEventListener('message', handleMessage);
    unsubscribers.push(() => {
      channel?.removeEventListener('message', handleMessage);
    });
  }

  // 로컬스토리지 변경 이벤트 보조 수신 (다중 창/탭 간 완벽 동기화 보장)
  if (typeof window !== 'undefined') {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === APP_DATA_STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          callback(parsed);
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    unsubscribers.push(() => {
      window.removeEventListener('storage', handleStorage);
    });
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}

/**
 * 계정 공통 컨텐츠(API별 설정 맵) 즉각(0ms) 동기화 브로드캐스트
 */
export function broadcastCommonContents(map: Record<string, string[]>): void {
  if (channel) {
    try {
      channel.postMessage({
        type: 'COMMON_CONTENTS_SYNC',
        map,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('BroadcastChannel commonContents postMessage error:', e);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent(COMMON_CONTENTS_UPDATED_EVENT, { detail: map }));
      window.dispatchEvent(new Event('storage'));
      localStorage.setItem('mapleschedule_common_contents_broadcast', String(Date.now()));
    } catch (e) {}
  }
}

/**
 * 계정 공통 컨텐츠 변경 이벤트 구독 (동일 창 CustomEvent + 다른 창 BroadcastChannel + Storage 이벤트 통합)
 */
export function subscribeToCommonContents(callback: (map: Record<string, string[]>) => void): () => void {
  const unsubscribers: Array<() => void> = [];

  if (channel) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'COMMON_CONTENTS_SYNC' && event.data.map && typeof event.data.map === 'object') {
        callback(event.data.map);
      }
    };
    channel.addEventListener('message', handleMessage);
    unsubscribers.push(() => {
      channel?.removeEventListener('message', handleMessage);
    });
  }

  if (typeof window !== 'undefined') {
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<Record<string, string[]>>;
      if (customEvent.detail && typeof customEvent.detail === 'object') {
        callback(customEvent.detail);
      }
    };
    window.addEventListener(COMMON_CONTENTS_UPDATED_EVENT, handleCustomEvent);
    unsubscribers.push(() => {
      window.removeEventListener(COMMON_CONTENTS_UPDATED_EVENT, handleCustomEvent);
    });
  }

  return () => {
    unsubscribers.forEach((unsub) => unsub());
  };
}
