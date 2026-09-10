import { AppDataPayload } from '../types';

export const APP_DATA_STORAGE_KEY = 'maplestory_scheduler_app_data_v1';
export const COMMON_CONTENTS_STORAGE_KEY = 'mapleschedule_common_content_ids';
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
