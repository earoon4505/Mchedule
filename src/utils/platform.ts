/**
 * 플랫폼 환경 감지 및 지원 기능 플래그
 * 데스크톱(Electron)과 웹(Web Browser) 듀얼 환경을 단일 코드베이스로 지원합니다.
 */

export const isElectron: boolean = 
  typeof window !== 'undefined' && !!(window as any).electronAPI;

export const isWeb: boolean = !isElectron;

export const supportsPiP: boolean = isElectron;
export const supportsWindowControls: boolean = isElectron;
export const supportsAutoStart: boolean = isElectron;
export const supportsFileBackup: boolean = isElectron;

export const LOCAL_STORAGE_DATA_KEY = 'maplestory_scheduler_app_data_v1';
export const LOCAL_STORAGE_WEB_KEYS_KEY = 'maplestory_web_api_keys_v1';
