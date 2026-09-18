import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CharacterInfo, 
  CharacterProgressRecord, 
  AppSettings, 
  AppDataPayload,
  CustomTask,
  ApiKeyItem
} from './types';
import { 
  getKSTDailyKey, 
  getKSTWeeklyThuKey, 
  getKSTWeeklySunKey, 
  getKSTMonthlyKey,
  getFormattedKSTString,
  getPastDatesInCurrentWeeklyThuCycle,
  shouldResetCustomTask,
  resetExpiredCustomTasks
} from './utils/time';
import { 
  checkServerApiStatus, 
  loadServerAppData, 
  saveServerAppData, 
  resetServerAppData,
  deleteApiKey,
  fetchNexonSchedulerState, 
  searchNexonCharacter,
  fetchCharacterBasic,
  fetchApiKeys
} from './services/api';
import { 
  getDefaultEnabledTasksForLevel, 
  getDefaultBossesForLevel 
} from './data/defaultTasks';
import { 
  applyNexonSchedulerData, 
  extractInGameRegisteredTasks,
  extractCompletedDailyBossIdsFromData,
  sortTaskIdsByStandardOrder, 
  sortBossIdsByStandardOrder,
  sortDailyBossIdsByStandardOrder
} from './utils/schedulerParser';
import { sendWindowsNotification, playCheckSound } from './utils/notifications';
import { APP_LOGO_SRC, onLogoError } from './utils/image';
import { broadcastAppData, subscribeToBroadcast, subscribeToApiKeys } from './utils/syncChannel';
import { getStoredApiKeys } from './utils/accountHelper';
import { getStoredCommonContentsMap, removeStoredCommonContentId } from './utils/commonContents';

import { WindowHeader } from './components/common/WindowHeader';
import { CharacterSidebar } from './components/character/CharacterSidebar';
import { CharacterSearchModal } from './components/character/CharacterSearchModal';
import { DailyTaskList } from './components/tasks/DailyTaskList';
import { DailyBossList } from './components/tasks/DailyBossList';
import { WeeklyTaskList } from './components/tasks/WeeklyTaskList';
import { WeeklyBossList } from './components/tasks/WeeklyBossList';
import { BlackMageCard } from './components/tasks/BlackMageCard';
import { CustomTaskList } from './components/tasks/CustomTaskList';
import { ContentConfigModal } from './components/tasks/ContentConfigModal';
import { ProgressPanel } from './components/stats/ProgressPanel';
import { SettingsModal } from './components/settings/SettingsModal';
import { AdSenseBanner } from './components/ads/AdSenseBanner';
import { ApiKeyModal } from './components/settings/ApiKeyModal';
import { NoticeModal } from './components/common/NoticeModal';
import { LegalModal, LegalTab } from './components/legal/LegalModal';
import { PiPOverlay } from './components/pip/PiPOverlay';
import { IncompleteScheduleAlertModal } from './components/common/IncompleteScheduleAlertModal';
import { 
  CharacterAlertStatus, 
  AccountAlertStatus,
  getResetAlertActiveMap, 
  evaluateCharacterAlerts, 
  evaluateAccountAlerts,
  getActiveAlertCycleKey 
} from './utils/alertNotifier';
import { Plus, SlidersHorizontal, Calendar, Flame, Crown, LayoutGrid, ShieldAlert } from 'lucide-react';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { motion } from 'motion/react';
import { isWeb, isElectron, supportsPiP, LOCAL_STORAGE_DATA_KEY } from './utils/platform';

const LOCAL_STORAGE_KEY = LOCAL_STORAGE_DATA_KEY;

const DEFAULT_SETTINGS: AppSettings = {
  autoStart: false,
  backgroundNotification: false,
  incompleteCharacterIcon: true,
  showCompletedIcon: true,
  darkMode: false, // 기본 라이트 모드 (토글 버튼으로 원클릭 전환)
  autoSyncIntervalSec: 120, // 2분
  soundEnabled: true,
  includeCustomInCompletion: true,
  includeBlackMageInCompletion: true,
  notifier: {
    enabled: false,
    hours: 1,
    minutes: 0,
    onlyFavorites: false,
  },
  pip: {
    enabled: false,
    opacity: 100,
    direction: 'horizontal',
    align: 'right',
    position: 'top',
    hideCompleted: false,
    onlyFavorites: false,
    onlyAvatar: false,
    visibleCount: 6,
    showCommonContent: false,
  },
};

export default function App() {
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [records, setRecords] = useState<Record<string, CharacterProgressRecord>>({});
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // 알림이 (초기화 임박 알림) 모달 및 상태
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [characterAlertMap, setCharacterAlertMap] = useState<Record<string, CharacterAlertStatus>>({});
  const [incompleteAlertList, setIncompleteAlertList] = useState<
    Array<{ character: CharacterInfo; alertStatus: CharacterAlertStatus }>
  >([]);
  const [accountAlertStatus, setAccountAlertStatus] = useState<AccountAlertStatus>({
    hasAlert: false,
    incompleteTasks: [],
    dailyAlert: false,
    weeklyAlert: false,
  });
  const lastAlertCycleKeyRef = useRef<string>('');
  const currentAlertCycleKeyRef = useRef<string>('');
  const dismissedCycleKeysRef = useRef<Set<string>>(new Set());
  
  // 상태 및 로딩
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => getStoredApiKeys());
  const [lastUpdatedStr, setLastUpdatedStr] = useState<string>('');
  const [autoSyncCountdown, setAutoSyncCountdown] = useState<number>(300);

  // 중앙 탭: 'all' | 'daily' | 'daily_boss' | 'weekly' | 'bosses' | 'custom'
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'daily_boss' | 'weekly' | 'bosses' | 'custom'>('all');
  const [collapseTrigger, setCollapseTrigger] = useState<number>(0);
  const [characterSelectTrigger, setCharacterSelectTrigger] = useState<number>(0);

  const handleSelectCharacter = (id: string) => {
    setActiveCharacterId(id);
    setCollapseTrigger((prev) => prev + 1);
    setCharacterSelectTrigger((prev) => prev + 1);
    // 메인 창 캐릭터 선택 즉시 로컬 스토리지 저장 및 PiP로 0ms 브로드캐스트
    persistData(charactersRef.current, recordsRef.current, settingsRef.current, id, false);
    // 데스크톱 Electron IPC 실시간 0ms 동기화
    if ((window as any).electronAPI?.sendActiveCharacter) {
      (window as any).electronAPI.sendActiveCharacter(id);
    }
  };

  // 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTab>('terms');
  const [configCharacterId, setConfigCharacterId] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleOpenLegalModal = (tab: LegalTab = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastFeedback({ message, type });
    setTimeout(() => {
      setToastFeedback(null);
    }, 3500);
  };

  const isSavingRef = useRef(false);
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  isRefreshingRef.current = isRefreshing;

  const charactersRef = useRef(characters);
  charactersRef.current = characters;
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const activeCharacterIdRef = useRef(activeCharacterId);
  activeCharacterIdRef.current = activeCharacterId;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const latestPayloadRef = useRef<AppDataPayload | null>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // 상단 탭 마우스 휠 가로 스크롤 핸들러
  const handleTabWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (tabScrollRef.current && e.deltaY !== 0) {
      tabScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // 다크모드 HTML 클래스 연동
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // 페이지 새로고침(F5) 또는 탭 닫기 시 디바운스 대기 중인 최신 데이터 즉시 서버 동기화 (데스크톱 전용)
  useEffect(() => {
    if (isWeb) return; // 웹 모드는 LocalStorage를 사용하므로 서버 비콘 동기화 불필요
    const handleBeforeUnload = () => {
      if (latestPayloadRef.current) {
        try {
          const blob = new Blob([JSON.stringify(latestPayloadRef.current)], { type: 'application/json' });
          if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/storage', blob);
          } else {
            fetch('/api/storage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(latestPayloadRef.current),
              keepalive: true,
            }).catch(() => {});
          }
        } catch (_) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ----------------------------------------------------
  // 1. 데이터 저장 (웹: 100% 브라우저 LocalStorage 단독 저장 / 데스크톱: 서버 파일 + 로컬스토리지 + PiP)
  // ----------------------------------------------------

  const persistData = useCallback(
    (
      currentCharList: CharacterInfo[],
      currentRecords: Record<string, CharacterProgressRecord>,
      currentSettings: AppSettings,
      currentActiveId: string | null,
      immediate: boolean = false
    ) => {
      const payload: AppDataPayload = {
        characters: currentCharList,
        records: currentRecords,
        settings: currentSettings,
        activeCharacterId: currentActiveId,
        lastServerSync: new Date().toISOString(),
      };
      latestPayloadRef.current = payload;

      // 1. 즉시 로컬 스토리지 동기 저장 (0ms 보장)
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('LocalStorage 저장 실패', e);
      }

      // 2. 다른 탭 및 PiP 윈도우로 실시간 0ms 브로드캐스트 전송
      broadcastAppData(payload);

      // 웹 모드인 경우 서버 파일(storage.json) 저장 생략 (사용자별 완전 격리)
      if (isWeb) {
        return;
      }

      // 3. 데스크톱(Electron) 환경: 서버 파일 저장 (사용자 수동 토글 시 즉시 비동기 전송, 자동 갱신 시 200ms 디바운스)
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }

      if (immediate) {
        saveServerAppData(payload).catch((e) => console.warn('서버 즉시 저장 오류:', e));
      } else {
        saveDebounceTimerRef.current = setTimeout(async () => {
          try {
            await saveServerAppData(payload);
          } catch (e) {
            console.warn('서버 저장 오류:', e);
          }
        }, 200);
      }
    },
    []
  );

  // PiP 창 및 다중 창 간 실시간 수신 리스너
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((payload) => {
      if (payload) {
        if (payload.characters) setCharacters(payload.characters);
        if (payload.records) setRecords(payload.records);
        if (payload.settings) setSettings(payload.settings);
        if (payload.activeCharacterId !== undefined) {
          setActiveCharacterId(payload.activeCharacterId);
        }
      }
    });

    // Electron 환경에서 PiP 창이 사용자에 의해 닫혔을 때 메인 UI 상태 동기화
    let unsubscribePiPClosed: (() => void) | undefined;
    if ((window as any).electronAPI?.onPiPClosed) {
      unsubscribePiPClosed = (window as any).electronAPI.onPiPClosed(() => {
        setSettings((prev) => {
          const next = {
            ...prev,
            pip: {
              ...prev.pip,
              enabled: false,
            },
          };
          persistData(charactersRef.current, recordsRef.current, next, activeCharacterIdRef.current);
          return next;
        });
      });
    }

    // Electron 환경에서 PiP 창에서 캐릭터 선택 시 메인 창 즉각 0ms 동기화
    let unsubscribeActiveChar: (() => void) | undefined;
    if ((window as any).electronAPI?.onActiveCharacterChanged) {
      unsubscribeActiveChar = (window as any).electronAPI.onActiveCharacterChanged((charId: string) => {
        if (charId && charId !== activeCharacterIdRef.current) {
          setActiveCharacterId(charId);
          setCollapseTrigger((prev) => prev + 1);
          setCharacterSelectTrigger((prev) => prev + 1);
        }
      });
    }

    return () => {
      unsubscribe();
      if (unsubscribePiPClosed) unsubscribePiPClosed();
      if (unsubscribeActiveChar) unsubscribeActiveChar();
    };
  }, [persistData]);

  // ----------------------------------------------------
  // 2. 초기화 & 저장소 로드 & 날짜 리셋 판정 (초고속 부팅)
  // ----------------------------------------------------

  const checkAndResetRecords = useCallback((rawRecords: Record<string, CharacterProgressRecord>, charList?: CharacterInfo[]) => {
    const currentDailyKey = getKSTDailyKey();
    const currentWeeklyThuKey = getKSTWeeklyThuKey();
    const currentWeeklySunKey = getKSTWeeklySunKey();
    const currentMonthlyKey = getKSTMonthlyKey();

    const targetChars = charList || charactersRef.current;
    const updatedRecords: Record<string, CharacterProgressRecord> = {};

    Object.entries(rawRecords).forEach(([charId, rec]) => {
      let isDailyResetNeeded = rec.dailyDateKey ? rec.dailyDateKey !== currentDailyKey : false;
      let isWeeklyThuResetNeeded = rec.weeklyThuKey ? rec.weeklyThuKey !== currentWeeklyThuKey : false;
      let isWeeklySunResetNeeded = rec.weeklySunKey ? rec.weeklySunKey !== currentWeeklySunKey : false;
      let isMonthlyResetNeeded = rec.monthlyKey ? rec.monthlyKey !== currentMonthlyKey : false;

      const newDailyTasks = isDailyResetNeeded ? {} : { ...rec.dailyTasks };
      const newDailyBosses = isDailyResetNeeded ? {} : { ...rec.dailyBosses };
      const newDailyBossWeeklyLog = isWeeklyThuResetNeeded ? {} : { ...(rec.dailyBossWeeklyLog || {}) };
      const newWeeklyTasks = { ...rec.weeklyTasks };
      const newWeeklyBosses = isWeeklyThuResetNeeded ? {} : { ...rec.weeklyBosses };
      const newBlackMage = isMonthlyResetNeeded ? { completed: false } : (rec.blackMage || { completed: false });
      const newCustomTasks = { ...(rec.customTasks || {}) };

      // 커스텀 컨텐츠 자동 초기화 (등록된 요일 및 시간에 맞춰 정확하게 자동 리셋)
      // 완료는 무조건 수동 조작으로만 이루어지며, 등록된 초기화 시점이 지나면 자동으로 리셋
      const char = targetChars.find((c) => c.id === charId);
      if (char?.customTasks && char.customTasks.length > 0) {
        char.customTasks.forEach((ct) => {
          const taskState = newCustomTasks[ct.id];
          if (taskState?.completed && shouldResetCustomTask(ct, taskState)) {
            delete newCustomTasks[ct.id];
          }
        });
      }

      // 주간 콘텐츠 초기화 (목요일 정기 리셋: 주간 퀘스트, 주간 보스, 지하 수로, 플래그 등 모든 주간 데이터 초기화)
      if (isWeeklyThuResetNeeded) {
        Object.keys(newWeeklyTasks).forEach((k) => {
          delete newWeeklyTasks[k];
        });
      }

      // 주간 콘텐츠 중 일요일 리셋 항목 초기화 (일요일 23:59 리셋 대비)
      if (isWeeklySunResetNeeded) {
        delete newWeeklyTasks['weekly_mulung_dojang'];
        delete newWeeklyTasks['weekly_sharenian_culvert'];
        delete newWeeklyTasks['weekly_flag_race'];
      }

      updatedRecords[charId] = {
        characterId: charId,
        dailyDateKey: currentDailyKey,
        weeklyThuKey: currentWeeklyThuKey,
        weeklySunKey: currentWeeklySunKey,
        monthlyKey: currentMonthlyKey,
        dailyTasks: newDailyTasks,
        dailyBosses: newDailyBosses,
        dailyBossWeeklyLog: newDailyBossWeeklyLog,
        weeklyTasks: newWeeklyTasks,
        weeklyBosses: newWeeklyBosses,
        blackMage: newBlackMage,
        customTasks: newCustomTasks,
        updatedAt: new Date().toISOString(),
      };
    });

    return updatedRecords;
  }, []);

  // 이번 주차(목~어제) 중 아직 기록되지 않은 과거 일일 보스 내역을 백그라운드에서 조회하여 채움 (소급 동기화)
  // 이미 기록이 있는 날짜는 절대 다시 조회하지 않으며, 목요일 리셋 시 전체가 초기화된 후 다시 당일부터 누적됨
  const backfillPastWeeklyDailyBosses = useCallback(async (chars: CharacterInfo[], recordsMap: Record<string, CharacterProgressRecord>) => {
    const pastDates = getPastDatesInCurrentWeeklyThuCycle();
    if (pastDates.length === 0) return; // 오늘이 목요일이면 과거 날짜 없음

    let hasAnyBackfilled = false;
    const updatedRecords = { ...recordsMap };

    for (const char of chars) {
      if (!char.ocid || char.ocid.startsWith('manual_')) continue;
      const rec = updatedRecords[char.id];
      if (!rec) continue;

      const currentWeeklyLog = { ...(rec.dailyBossWeeklyLog || {}) };
      // 과거 날짜 중 dailyBossWeeklyLog에 키가 아직 없는 날짜만 골라냄
      const missingDates = pastDates.filter((d) => !currentWeeklyLog[d]);
      if (missingDates.length === 0) continue; // 이미 모든 과거 날짜가 기록되어 있으면 스킵!

      for (const pDate of missingDates) {
        try {
          // force=false로 하여 24시간 장기 캐시 적극 활용
          const pastRes = await fetchNexonSchedulerState(char.ocid, false, pDate, char.characterName, char.apiKeyId);
          if (pastRes.success && pastRes.data) {
            const completedBossIds = extractCompletedDailyBossIdsFromData(pastRes.data);
            currentWeeklyLog[pDate] = completedBossIds;
            hasAnyBackfilled = true;
          } else {
            // 조회가 실패하거나 빈 데이터인 경우 빈 배열로 마킹하여 반복 호출 방지
            currentWeeklyLog[pDate] = [];
            hasAnyBackfilled = true;
          }
        } catch (e) {
          console.warn(`[Backfill] ${char.characterName} (${pDate}) 조회 실패:`, e);
          currentWeeklyLog[pDate] = [];
        }
      }

      if (hasAnyBackfilled) {
        updatedRecords[char.id] = {
          ...rec,
          dailyBossWeeklyLog: currentWeeklyLog,
        };
      }
    }

    if (hasAnyBackfilled) {
      setRecords((prev) => {
        const merged = { ...prev };
        Object.keys(updatedRecords).forEach((cId) => {
          if (merged[cId]) {
            merged[cId] = {
              ...merged[cId],
              dailyBossWeeklyLog: {
                ...(updatedRecords[cId].dailyBossWeeklyLog || {}),
                ...(merged[cId].dailyBossWeeklyLog || {}), // 오늘 실시간 데이터는 덮어쓰지 않음
              },
            };
          }
        });
        persistData(charactersRef.current, merged, settingsRef.current, activeCharacterIdRef.current, true);
        return merged;
      });
    }
  }, [persistData]);

  useEffect(() => {
    async function init() {
      // ========================================================
      // [A] 웹 브라우저 환경 (One Codebase - Web Mode)
      // ========================================================
      if (isWeb) {
        let localData: AppDataPayload | null = null;
        try {
          const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localRaw) {
            localData = JSON.parse(localRaw);
          }
        } catch (e) {
          console.warn('웹 모드 LocalStorage 파싱 에러:', e);
        }

        // 웹 모드 API 키 상태 확인 (브라우저 LocalStorage 기반)
        const statusRes = await checkServerApiStatus().catch(() => ({ hasApiKey: false }));
        const hasKey = !!statusRes.hasApiKey;
        setHasApiKey(hasKey);

        if (localData && localData.characters && localData.characters.length > 0) {
          // 기존 방문자: 본인 브라우저의 LocalStorage에서 즉시 0ms 로드
          const validatedRecords = checkAndResetRecords(localData.records || {}, localData.characters);
          const cleanedChars = localData.characters.map((c) => ({
            ...c,
            enabledTaskIds: sortTaskIdsByStandardOrder(c.enabledTaskIds || []),
            selectedBossIds: sortBossIdsByStandardOrder(c.selectedBossIds || []),
          }));
          setCharacters(cleanedChars);
          setSettings(localData.settings || DEFAULT_SETTINGS);
          setActiveCharacterId(localData.activeCharacterId || cleanedChars[0]?.id || null);
          setRecords(validatedRecords);
          setIsInitializing(false);
          setLastUpdatedStr(getFormattedKSTString());

          // 백그라운드 아바타 보강
          if (hasKey) {
            const missingAvatarChars = cleanedChars.filter(
              (c) => (!c.characterImage || c.characterImage.length < 5) && c.ocid && !c.ocid.startsWith('manual_')
            );
            if (missingAvatarChars.length > 0) {
              const fetchTasks = missingAvatarChars.map(async (char) => {
                try {
                  const bRes = await fetchCharacterBasic({ ocid: char.ocid, name: char.characterName }, false, char.apiKeyId);
                  if (bRes.success && bRes.basic?.character_image) {
                    return {
                      id: char.id,
                      ocid: bRes.newOcid || char.ocid,
                      image: bRes.basic.character_image,
                      level: Number(bRes.basic.character_level) || char.characterLevel,
                      cls: bRes.basic.character_class || char.characterClass,
                      world: bRes.basic.world_name || char.worldName,
                    };
                  }
                } catch (e) {}
                return null;
              });

              const results = await Promise.all(fetchTasks);
              const validResults = results.filter(Boolean);
              if (validResults.length > 0) {
                setCharacters((prev) => {
                  const updated = prev.map((char) => {
                    const found = validResults.find((r) => r?.id === char.id);
                    if (found) {
                      return {
                        ...char,
                        ocid: found.ocid,
                        characterImage: found.image,
                        characterLevel: found.level,
                        characterClass: found.cls,
                        worldName: found.world,
                      };
                    }
                    return char;
                  });
                  persistData(updated, validatedRecords, localData?.settings || DEFAULT_SETTINGS, localData?.activeCharacterId || updated[0]?.id || null);
                  return updated;
                });
              }
            }
          }

          // 주간 일일 보스 소급 조회
          backfillPastWeeklyDailyBosses(cleanedChars, validatedRecords);
        } else {
          // 첫 방문자: 빈 상태에서 시작 & API 키 미등록 시 자동 안내 모달 오픈
          setCharacters([]);
          setRecords({});
          setSettings(DEFAULT_SETTINGS);
          setActiveCharacterId(null);
          setIsInitializing(false);
          setLastUpdatedStr(getFormattedKSTString());

          if (!hasKey) {
            setIsApiKeyModalOpen(true);
          }
        }
        return;
      }

      // ========================================================
      // [B] 데스크톱 환경 (Electron Desktop Mode)
      // ========================================================
      // 1. 로컬 스토리지 즉시 캐시 로드 (첫 화면 0ms 렌더링으로 렉 완전 해소)
      let initialData: AppDataPayload | null = null;
      try {
        const localRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localRaw) {
          initialData = JSON.parse(localRaw);
          if (initialData && initialData.characters && initialData.characters.length > 0) {
            setCharacters(initialData.characters);
            setSettings(initialData.settings || DEFAULT_SETTINGS);
            setActiveCharacterId(initialData.activeCharacterId || initialData.characters[0]?.id || null);
            setRecords(checkAndResetRecords(initialData.records || {}, initialData.characters));

            // 로컬 스토리지 상에서 pip.enabled가 켜져 있으면 즉시 PiP 창 오픈
            if (initialData.settings?.pip?.enabled && (window as any).electronAPI?.openPiPWindow) {
              (window as any).electronAPI.openPiPWindow();
            }
          }
        }
      } catch (e) {
        console.warn('초기 로컬 캐시 읽기 실패', e);
      }

      // 초기 뷰 즉시 표시
      setIsInitializing(false);
      setLastUpdatedStr(getFormattedKSTString());

      // 2. 백그라운드 병렬 조회 (서버 데이터 + API 키 상태를 동시 호출)
      try {
        const [statusRes, serverData] = await Promise.all([
          checkServerApiStatus().catch(() => ({ hasApiKey: false })),
          loadServerAppData().catch(() => null),
        ]);

        const hasKey = !!statusRes.hasApiKey;
        setHasApiKey(hasKey);

        let loadedData: AppDataPayload | null = null;
        if (serverData && initialData) {
          // 둘 다 존재할 경우 타임스탬프(updatedAt)를 비교하여 최신 사용자 상태(체크 및 체크 해제)를 온전히 보존
          const mergedRecords: Record<string, CharacterProgressRecord> = { ...(serverData.records || {}) };
          let hasLocalNewerRecord = false;

          if (initialData.records) {
            Object.entries(initialData.records).forEach(([charId, localRec]) => {
              const serverRec = mergedRecords[charId];
              if (!serverRec) {
                mergedRecords[charId] = localRec;
                hasLocalNewerRecord = true;
              } else {
                const localTime = localRec.updatedAt ? new Date(localRec.updatedAt).getTime() : 0;
                const serverTime = serverRec.updatedAt ? new Date(serverRec.updatedAt).getTime() : 0;

                if (localTime >= serverTime) {
                  // 로컬이 최신이거나 같으면 로컬의 수동 체크/해제 상태를 그대로 최우선 반영
                  mergedRecords[charId] = {
                    ...serverRec,
                    ...localRec,
                    updatedAt: localRec.updatedAt || new Date().toISOString(),
                  };
                  hasLocalNewerRecord = true;
                } else {
                  // 서버가 더 최신인 경우라도 로컬에만 존재하는 커스텀 컨텐츠가 있으면 병합
                  const mergedCustom = { ...(serverRec.customTasks || {}) };
                  if (localRec.customTasks) {
                    Object.entries(localRec.customTasks).forEach(([taskId, tState]) => {
                      if (!mergedCustom[taskId]) {
                        mergedCustom[taskId] = tState;
                      }
                    });
                  }
                  mergedRecords[charId] = {
                    ...serverRec,
                    customTasks: mergedCustom,
                  };
                }
              }
            });
          }

          loadedData = {
            characters: serverData.characters?.length ? serverData.characters : (initialData.characters || []),
            records: mergedRecords,
            settings: serverData.settings || initialData.settings || DEFAULT_SETTINGS,
            activeCharacterId: serverData.activeCharacterId || initialData.activeCharacterId || null,
            lastServerSync: new Date().toISOString(),
          };

          // 로컬 데이터가 더 최신이었던 경우 서버에 최신 병합 데이터를 즉시 저장
          if (hasLocalNewerRecord) {
            saveServerAppData(loadedData).catch(() => {});
          }
        } else {
          loadedData = serverData || initialData;
        }
        if (loadedData && loadedData.characters && loadedData.characters.length > 0) {
          const validatedRecords = checkAndResetRecords(loadedData.records || {}, loadedData.characters);
          const cleanedChars = loadedData.characters.map((c) => ({
            ...c,
            enabledTaskIds: sortTaskIdsByStandardOrder(c.enabledTaskIds || []),
            selectedBossIds: sortBossIdsByStandardOrder(c.selectedBossIds || []),
          }));
          setCharacters(cleanedChars);
          setSettings(loadedData.settings || DEFAULT_SETTINGS);
          setActiveCharacterId(loadedData.activeCharacterId || cleanedChars[0]?.id || null);
          setRecords(validatedRecords);

          // Electron 환경에서 pip.enabled가 켜져 있으면 PiP 창 활성화
          if (loadedData.settings?.pip?.enabled && (window as any).electronAPI?.openPiPWindow) {
            (window as any).electronAPI.openPiPWindow();
          }

          // 3. 백그라운드 비동기 아바타 보강 (메인 스레드 멈춤/지연 없음)
          if (hasKey) {
            const missingAvatarChars = loadedData.characters.filter(
              (c) => (!c.characterImage || c.characterImage.length < 5) && c.ocid && !c.ocid.startsWith('manual_')
            );
            if (missingAvatarChars.length > 0) {
              const fetchTasks = missingAvatarChars.map(async (char) => {
                try {
                  const bRes = await fetchCharacterBasic({ ocid: char.ocid, name: char.characterName }, false, char.apiKeyId);
                  if (bRes.success && bRes.basic?.character_image) {
                    return {
                      id: char.id,
                      ocid: bRes.newOcid || char.ocid,
                      image: bRes.basic.character_image,
                      level: Number(bRes.basic.character_level) || char.characterLevel,
                      cls: bRes.basic.character_class || char.characterClass,
                      world: bRes.basic.world_name || char.worldName,
                    };
                  }
                } catch (e) {}
                return null;
              });

              const results = await Promise.all(fetchTasks);
              const validResults = results.filter(Boolean);
              if (validResults.length > 0) {
                setCharacters((prev) => {
                  const updated = prev.map((char) => {
                    const found = validResults.find((r) => r?.id === char.id);
                    if (found) {
                      return {
                        ...char,
                        ocid: found.ocid,
                        characterImage: found.image,
                        characterLevel: found.level,
                        characterClass: found.cls,
                        worldName: found.world,
                      };
                    }
                    return char;
                  });
                  persistData(updated, validatedRecords, loadedData.settings || DEFAULT_SETTINGS, loadedData.activeCharacterId || updated[0]?.id || null);
                  return updated;
                });
              }
            }
          }

          // 4. 백그라운드 비동기 과거 일일 보스 소급 조회 (이번 주차 목~어제 중 누락분)
          backfillPastWeeklyDailyBosses(cleanedChars, validatedRecords);
        }
      } catch (e) {
        console.warn('백그라운드 동기화 경고:', e);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------
  // 실시간 API 키 변경 핸들러 및 구독
  // 키 삭제 시 해당 API 키와 연동된 캐릭터 전체 일괄 삭제
  // ----------------------------------------------------
  const handleApplyUpdatedApiKeys = useCallback((hasKey: boolean, updatedKeys?: ApiKeyItem[]) => {
    setHasApiKey(hasKey);
    if (updatedKeys) {
      setApiKeys(updatedKeys);
      const validKeyIds = new Set(updatedKeys.map((k) => k.id));
      const aliasMap = new Map(updatedKeys.map((k) => [k.id, k.alias]));

      // 1. 등록된 API 키가 0개인 경우: 모든 캐릭터 및 진행도 기록 완전 삭제
      if (updatedKeys.length === 0) {
        setCharacters([]);
        setRecords({});
        setActiveCharacterId(null);
        persistData([], {}, settingsRef.current, null, true);
        try {
          localStorage.removeItem('mapleschedule_common_content_ids');
        } catch (_) {}
        return;
      }

      // 2. API 키가 남아있는 경우:
      // 삭제된 API 키에 소속된 캐릭터를 전부 삭제(filter)하고, 유효한 키에 소속된 캐릭터만 보존
      setCharacters((prev) => {
        let changed = false;
        const kept: CharacterInfo[] = [];

        for (const c of prev) {
          if (c.apiKeyId) {
            if (validKeyIds.has(c.apiKeyId)) {
              // 유효한 키에 소속된 캐릭터: 보존 및 최신 별칭 동기화
              const newAlias = aliasMap.get(c.apiKeyId);
              if (newAlias && c.apiKeyAlias !== newAlias) {
                changed = true;
                kept.push({ ...c, apiKeyAlias: newAlias });
              } else {
                kept.push(c);
              }
            } else {
              // 소속된 API 키가 삭제된 캐릭터: 완전 삭제
              changed = true;
            }
          } else {
            // apiKeyId가 없는 레거시 캐릭터: 유효 키가 정확히 1개일 때만 자동 연결하여 보존, 아니면 삭제
            if (updatedKeys.length === 1) {
              changed = true;
              kept.push({
                ...c,
                apiKeyId: updatedKeys[0].id,
                apiKeyAlias: updatedKeys[0].alias,
              });
            } else {
              changed = true;
            }
          }
        }

        // 삭제된 API 키의 계정 공통 컨텐츠 맞춤 설정 정리
        try {
          const commonMap = getStoredCommonContentsMap();
          Object.keys(commonMap).forEach((kId) => {
            if (kId !== 'default' && !validKeyIds.has(kId)) {
              removeStoredCommonContentId(kId);
            }
          });
        } catch (_) {}

        if (changed) {
          // 삭제된 캐릭터들의 진행 기록(records) 정리
          const keptIds = new Set(kept.map((c) => c.id));
          const currentRecords = recordsRef.current;
          let recordsChanged = false;
          const nextRecords: Record<string, CharacterProgressRecord> = {};
          for (const cid of Object.keys(currentRecords)) {
            if (keptIds.has(cid) && currentRecords[cid]) {
              nextRecords[cid] = currentRecords[cid];
            } else {
              recordsChanged = true;
            }
          }
          if (recordsChanged) {
            setRecords(nextRecords);
          }

          // 활성 캐릭터가 삭제되었으면 첫 번째 남은 캐릭터로 전환하거나 null 처리
          let nextActiveId = activeCharacterIdRef.current;
          if (nextActiveId && !keptIds.has(nextActiveId)) {
            nextActiveId = kept[0]?.id || null;
            setActiveCharacterId(nextActiveId);
          }

          persistData(kept, recordsChanged ? nextRecords : currentRecords, settingsRef.current, nextActiveId, true);
          return kept;
        }

        return prev;
      });
    }
  }, [persistData]);

  useEffect(() => {
    let isMounted = true;
    fetchApiKeys().then((res: any) => {
      const keys = Array.isArray(res) ? res : res?.keys;
      if (isMounted && Array.isArray(keys)) {
        setApiKeys(keys);
        setHasApiKey(keys.length > 0);
        try {
          localStorage.setItem('mapleschedule_cached_apikeys_v1', JSON.stringify(keys));
        } catch (_) {}
      }
    }).catch(() => {});

    const unsubscribe = subscribeToApiKeys((updatedKeys) => {
      if (isMounted && Array.isArray(updatedKeys)) {
        handleApplyUpdatedApiKeys(updatedKeys.length > 0, updatedKeys);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [handleApplyUpdatedApiKeys]);

  // ----------------------------------------------------
  // 알림이 (초기화 임박 알림) 평가 및 팝업 트리거
  // ----------------------------------------------------
  useEffect(() => {
    const checkAlerts = () => {
      if (!settings.notifier?.enabled) {
        setCharacterAlertMap({});
        setIncompleteAlertList([]);
        setAccountAlertStatus({ hasAlert: false, incompleteTasks: [], dailyAlert: false, weeklyAlert: false });
        return;
      }

      const activeMap = getResetAlertActiveMap(settings.notifier);
      const isAnyActive = activeMap.daily || activeMap.weeklyThu || activeMap.weeklySun || activeMap.monthly;

      const newMap: Record<string, CharacterAlertStatus> = {};
      const newIncomplete: Array<{ character: CharacterInfo; alertStatus: CharacterAlertStatus }> = [];

      for (const char of characters) {
        if (settings.notifier?.onlyFavorites && !char.favorite) {
          continue;
        }
        const alertStatus = evaluateCharacterAlerts(char, records[char.id], activeMap, settings);
        newMap[char.id] = alertStatus;
        if (alertStatus.hasAnyAlert) {
          newIncomplete.push({ character: char, alertStatus });
        }
      }

      const activeChar = characters.find((c) => c.id === activeCharacterId);
      const accAlert = evaluateAccountAlerts(characters, records, activeMap, settings, activeChar?.apiKeyId);

      setCharacterAlertMap(newMap);
      setIncompleteAlertList(newIncomplete);
      setAccountAlertStatus(accAlert);

      // 팝업 알림 조건 검사: 활성 주기 내에 있고 (미완료 캐릭터가 있거나 미완료 계정 컨텐츠가 있을 때)
      const hasCustomAlert = newIncomplete.some((item) => item.alertStatus.customAlert);
      const isTriggerable = isAnyActive || hasCustomAlert;
      const hasAnyIncomplete = newIncomplete.length > 0 || accAlert.hasAlert;

      if (isTriggerable && hasAnyIncomplete) {
        const cycleKey = getActiveAlertCycleKey(settings.notifier, activeMap, characters);
        currentAlertCycleKeyRef.current = cycleKey;

        if (
          cycleKey &&
          !dismissedCycleKeysRef.current.has(cycleKey) &&
          cycleKey !== lastAlertCycleKeyRef.current
        ) {
          lastAlertCycleKeyRef.current = cycleKey;
          setIsAlertModalOpen(true);
        }
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [characters, records, settings]);

  const handleCloseAlertModal = useCallback(() => {
    if (currentAlertCycleKeyRef.current) {
      dismissedCycleKeysRef.current.add(currentAlertCycleKeyRef.current);
    }
    setIsAlertModalOpen(false);
  }, []);

  // ----------------------------------------------------
  // 3. 2분 자동 갱신 타이머 & 수동 새로고침
  // ----------------------------------------------------

  const handleRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    setIsRefreshing(true);

    try {
      // 1. 날짜 리셋 체크 (항상 최신 recordsRef.current를 기반으로 리셋 검사)
      let currentRecords = { ...recordsRef.current };
      currentRecords = checkAndResetRecords(currentRecords);

      // 2. 등록된 캐릭터들의 NEXON API 정보 및 스케줄러(/maplestory/v1/scheduler/character-state) 갱신 (force=true로 실시간 조회)
      const updatedChars = [...charactersRef.current];
      let hasCharUpdate = false;

      for (let i = 0; i < updatedChars.length; i++) {
        const char = updatedChars[i];
        if (char.ocid && !char.ocid.startsWith('manual_')) {
          try {
            // 캐릭터 기본 정보 최신화 (레벨업, 코디/프로필 사진 변경 실시간 반영, 월드리프 시 OCID/월드 자동 치유)
            const bRes = await fetchCharacterBasic({ ocid: char.ocid, name: char.characterName }, true, char.apiKeyId);
            let activeOcid = char.ocid;

            if (bRes.success && bRes.basic) {
              const newImage = bRes.basic.character_image || char.characterImage;
              const newLevel = Number(bRes.basic.character_level) || char.characterLevel;
              const newClass = bRes.basic.character_class || char.characterClass;
              const newWorld = bRes.basic.world_name || char.worldName;
              const newOcid = bRes.newOcid || char.ocid;

              if (newOcid !== char.ocid) {
                activeOcid = newOcid;
              }

              if (
                newImage !== char.characterImage ||
                newLevel !== char.characterLevel ||
                newClass !== char.characterClass ||
                newWorld !== char.worldName ||
                newOcid !== char.ocid ||
                char.syncError
              ) {
                updatedChars[i] = {
                  ...char,
                  ocid: newOcid,
                  characterImage: newImage,
                  characterLevel: newLevel,
                  characterClass: newClass,
                  worldName: newWorld,
                  syncError: false,
                  syncErrorMessage: undefined,
                };
                hasCharUpdate = true;
              }
            } else if (!bRes.success) {
              // 닉네임 변경이나 서버 이전 등으로 OCID 재발급까지 실패한 경우
              if (!char.syncError) {
                updatedChars[i] = {
                  ...char,
                  syncError: true,
                  syncErrorMessage: bRes.error || '캐릭터 정보를 찾을 수 없습니다. (닉네임/서버 변경 확인 필요)',
                };
                hasCharUpdate = true;
              }
            }

            const schedRes = await fetchNexonSchedulerState(activeOcid, true, undefined, char.characterName, char.apiKeyId);
            if (schedRes.newOcid && schedRes.newOcid !== updatedChars[i].ocid) {
              updatedChars[i] = {
                ...updatedChars[i],
                ocid: schedRes.newOcid,
              };
              hasCharUpdate = true;
            }

            if (schedRes.success && schedRes.data) {
              const prevRec = currentRecords[char.id] || {
                characterId: char.id,
                dailyDateKey: getKSTDailyKey(),
                weeklyThuKey: getKSTWeeklyThuKey(),
                weeklySunKey: getKSTWeeklySunKey(),
                monthlyKey: getKSTMonthlyKey(),
                dailyTasks: {},
                dailyBosses: {},
                dailyBossWeeklyLog: {},
                weeklyTasks: {},
                weeklyBosses: {},
                blackMage: { completed: false },
                customTasks: {},
                updatedAt: new Date().toISOString(),
              };

              const { updatedRecord } = applyNexonSchedulerData(
                prevRec, 
                schedRes.data,
                updatedChars[i].enabledTaskIds,
                updatedChars[i].selectedBossIds,
                updatedChars[i].selectedDailyBossIds,
                updatedChars[i].selectedBlackMageId
              );

              // 검은 마법사는 주간/일일 보스와 마찬가지로 미선택 처치 보스로 정상 표시되므로 selectedBlackMageId 강제 할당 불필요
              if (updatedRecord.blackMage?.completed && !updatedRecord.blackMage.difficulty) {
                updatedRecord.blackMage.difficulty = updatedChars[i].selectedBlackMageId || 'boss_hard_black_mage';
              }

              // 커스텀 컨텐츠는 오직 수동 완료만 허용되며, 외부 API/스케줄러 동기화로 자동 완료되지 않도록 기존 최신 상태 100% 유지
              updatedRecord.customTasks = { ...(prevRec.customTasks || {}) };
              currentRecords[char.id] = updatedRecord;
            }
          } catch (err) {
            console.warn(`${char.characterName} 스케줄러 동기화 실패:`, err);
          }
        }
      }

      setRecords(currentRecords);
      if (hasCharUpdate) {
        setCharacters(updatedChars);
      }
      persistData(updatedChars, currentRecords, settingsRef.current, activeCharacterIdRef.current, true);

      // 3. 백그라운드 소급 조회 (오늘 화면 즉시 렌더링 후 비어있는 과거 날짜 비동기 보강)
      backfillPastWeeklyDailyBosses(updatedChars, currentRecords);

      setLastUpdatedStr(getFormattedKSTString());
      setAutoSyncCountdown(settingsRef.current.autoSyncIntervalSec || 300);
    } catch (e) {
      console.error('새로고침 오류:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    checkAndResetRecords,
    persistData,
    backfillPastWeeklyDailyBosses,
  ]);

  const refreshHandlerRef = useRef(handleRefresh);
  refreshHandlerRef.current = handleRefresh;
  const autoSyncIntervalRef = useRef(settings.autoSyncIntervalSec || 300);
  autoSyncIntervalRef.current = settings.autoSyncIntervalSec || 300;

  // 1초 카운트다운 및 설정된 주기마다 자동 갱신 트리거
  useEffect(() => {
    let tickCount = 0;
    const timer = setInterval(() => {
      tickCount++;
      // 매 10초마다 만료된 커스텀 컨텐츠가 있는지 검사하여 자동 초기화 실행
      if (tickCount % 10 === 0) {
        setRecords((prev) => {
          let anyChanged = false;
          const nextRecords = { ...prev };
          charactersRef.current.forEach((char) => {
            const rec = nextRecords[char.id];
            if (char.customTasks && char.customTasks.length > 0 && rec?.customTasks) {
              const { record: updatedRec, changed } = resetExpiredCustomTasks(char, rec);
              if (changed) {
                nextRecords[char.id] = updatedRec;
                anyChanged = true;
              }
            }
          });
          if (anyChanged) {
            persistData(charactersRef.current, nextRecords, settings, activeCharacterIdRef.current);
            return nextRecords;
          }
          return prev;
        });
      }

      setAutoSyncCountdown((prev) => {
        if (prev <= 1) {
          refreshHandlerRef.current();
          return autoSyncIntervalRef.current;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [persistData, settings]);

  // 설정에서 주기가 변경될 때 카운트다운 리셋
  useEffect(() => {
    setAutoSyncCountdown(settings.autoSyncIntervalSec || 300);
  }, [settings.autoSyncIntervalSec]);

  // ----------------------------------------------------
  // 4. 태스크 및 보스 완료 토글 핸들러
  // ----------------------------------------------------

  const handleToggleTask = (taskId: string, completed: boolean, count?: number) => {
    if (!activeCharacterId) return;

    setRecords((prev) => {
      const currentRec = prev[activeCharacterId] || {
        characterId: activeCharacterId,
        dailyDateKey: getKSTDailyKey(),
        weeklyThuKey: getKSTWeeklyThuKey(),
        weeklySunKey: getKSTWeeklySunKey(),
        dailyTasks: {},
        weeklyTasks: {},
        weeklyBosses: {},
        updatedAt: new Date().toISOString(),
      };

      const isWeekly = taskId.startsWith('weekly_');
      const targetMap = isWeekly ? { ...currentRec.weeklyTasks } : { ...currentRec.dailyTasks };

      targetMap[taskId] = {
        completed,
        currentCount: count !== undefined ? count : completed ? (taskId === 'daily_monster_park' ? 2 : 1) : 0,
        completedAt: completed ? new Date().toISOString() : undefined,
      };

      const updatedRecord: CharacterProgressRecord = {
        ...currentRec,
        dailyTasks: isWeekly ? currentRec.dailyTasks : targetMap,
        weeklyTasks: isWeekly ? targetMap : currentRec.weeklyTasks,
        updatedAt: new Date().toISOString(),
      };

      const nextRecords: Record<string, CharacterProgressRecord> = {
        ...prev,
        [activeCharacterId]: updatedRecord,
      };

      persistData(characters, nextRecords, settings, activeCharacterId);
      return nextRecords;
    });
  };

  const handleToggleCommonTask = (
    taskId: string,
    completed: boolean,
    count?: number,
    targetApiKeyId?: string,
    targetCharacterId?: string
  ) => {
    if (completed && settings.soundEnabled) {
      playCheckSound();
    }

    setRecords((prev) => {
      const nextRecords: Record<string, CharacterProgressRecord> = { ...prev };
      const nowStr = new Date().toISOString();
      const dailyKey = getKSTDailyKey();
      const weeklyThuKey = getKSTWeeklyThuKey();
      const weeklySunKey = getKSTWeeklySunKey();

      // 대상 계정 키(apiKeyId) 결정: targetApiKeyId -> targetCharacterId 기준 -> activeCharacter 기준
      let resolvedApiKeyId = targetApiKeyId;
      if (!resolvedApiKeyId && targetCharacterId) {
        const c = characters.find((char) => char.id === targetCharacterId);
        if (c) resolvedApiKeyId = c.apiKeyId;
      }
      if (!resolvedApiKeyId && activeCharacterId) {
        const c = characters.find((char) => char.id === activeCharacterId);
        if (c) resolvedApiKeyId = c.apiKeyId;
      }

      // 등록된 apiKeyId가 존재하는 다중 계정 환경인 경우, 동일 apiKeyId를 가진 캐릭터들만 업데이트
      // 다른 계정에 속한 캐릭터들의 레코드는 완벽히 보존
      const hasAnyApiKey = characters.some((c) => !!c.apiKeyId);
      const targetChars = (hasAnyApiKey && resolvedApiKeyId)
        ? characters.filter((c) => c.apiKeyId === resolvedApiKeyId)
        : characters;

      targetChars.forEach((char) => {
        const charId = char.id;
        const currentRec = nextRecords[charId] || {
          characterId: charId,
          dailyDateKey: dailyKey,
          weeklyThuKey,
          weeklySunKey,
          dailyTasks: {},
          weeklyTasks: {},
          weeklyBosses: {},
          updatedAt: nowStr,
        };

        const updatedDaily = { ...currentRec.dailyTasks };
        const updatedWeekly = { ...currentRec.weeklyTasks };

        if (taskId === 'daily_monster_park') {
          const nextCount = count !== undefined ? count : completed ? 2 : 0;
          const isDone = completed || nextCount >= 2;
          updatedDaily['daily_monster_park'] = {
            completed: isDone,
            currentCount: nextCount,
            maxCount: 7,
            completedAt: isDone ? nowStr : undefined,
          };
        } else {
          updatedWeekly[taskId] = {
            completed,
            currentCount: completed ? 1 : 0,
            maxCount: 1,
            completedAt: completed ? nowStr : undefined,
          };
        }

        nextRecords[charId] = {
          ...currentRec,
          dailyTasks: updatedDaily,
          weeklyTasks: updatedWeekly,
          updatedAt: nowStr,
        };
      });

      persistData(charactersRef.current, nextRecords, settingsRef.current, activeCharacterId, true);
      return nextRecords;
    });
  };

  const handleToggleDailyBoss = (bossId: string, completed: boolean) => {
    if (!activeCharacterId) return;

    setRecords((prev) => {
      const currentRec = prev[activeCharacterId] || {
        characterId: activeCharacterId,
        dailyDateKey: getKSTDailyKey(),
        weeklyThuKey: getKSTWeeklyThuKey(),
        weeklySunKey: getKSTWeeklySunKey(),
        dailyTasks: {},
        dailyBosses: {},
        dailyBossWeeklyLog: {},
        weeklyTasks: {},
        weeklyBosses: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedDailyBosses = {
        ...(currentRec.dailyBosses || {}),
        [bossId]: {
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        },
      };

      // dailyBossWeeklyLog (목~수 누적): 오늘 날짜 키에 bossId 기록
      const todayKey = getKSTDailyKey();
      const currentLog = { ...(currentRec.dailyBossWeeklyLog || {}) };
      const todayList = new Set(currentLog[todayKey] || []);
      if (completed) {
        todayList.add(bossId);
      } else {
        todayList.delete(bossId);
      }
      currentLog[todayKey] = Array.from(todayList);

      const updatedRecord: CharacterProgressRecord = {
        ...currentRec,
        dailyBosses: updatedDailyBosses,
        dailyBossWeeklyLog: currentLog,
        updatedAt: new Date().toISOString(),
      };

      const nextRecords = {
        ...prev,
        [activeCharacterId]: updatedRecord,
      };

      persistData(charactersRef.current, nextRecords, settingsRef.current, activeCharacterId, true);
      return nextRecords;
    });
  };

  const handleToggleBoss = (bossId: string, completed: boolean) => {
    if (!activeCharacterId) return;

    setRecords((prev) => {
      const currentRec = prev[activeCharacterId] || {
        characterId: activeCharacterId,
        dailyDateKey: getKSTDailyKey(),
        weeklyThuKey: getKSTWeeklyThuKey(),
        weeklySunKey: getKSTWeeklySunKey(),
        dailyTasks: {},
        dailyBosses: {},
        dailyBossWeeklyLog: {},
        weeklyTasks: {},
        weeklyBosses: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedBosses = {
        ...currentRec.weeklyBosses,
        [bossId]: {
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        },
      };

      const updatedRecord: CharacterProgressRecord = {
        ...currentRec,
        weeklyBosses: updatedBosses,
        updatedAt: new Date().toISOString(),
      };

      const nextRecords = {
        ...prev,
        [activeCharacterId]: updatedRecord,
      };

      persistData(charactersRef.current, nextRecords, settingsRef.current, activeCharacterId, true);
      return nextRecords;
    });
  };

  const handleToggleBlackMage = (completed: boolean, difficultyId?: string) => {
    if (!activeCharacterId) return;

    setRecords((prev) => {
      const currentRec = prev[activeCharacterId] || {
        characterId: activeCharacterId,
        dailyDateKey: getKSTDailyKey(),
        weeklyThuKey: getKSTWeeklyThuKey(),
        weeklySunKey: getKSTWeeklySunKey(),
        monthlyKey: getKSTMonthlyKey(),
        dailyTasks: {},
        dailyBosses: {},
        dailyBossWeeklyLog: {},
        weeklyTasks: {},
        weeklyBosses: {},
        blackMage: { completed: false },
        customTasks: {},
        updatedAt: new Date().toISOString(),
      };

      const activeChar = characters.find((c) => c.id === activeCharacterId);
      const effectiveDiff = completed
        ? (difficultyId || currentRec.blackMage?.difficulty || activeChar?.selectedBlackMageId || 'boss_hard_black_mage')
        : undefined;

      const updatedRecord: CharacterProgressRecord = {
        ...currentRec,
        blackMage: {
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          difficulty: effectiveDiff,
          autoSynced: false,
        },
        updatedAt: new Date().toISOString(),
      };

      const nextRecords = {
        ...prev,
        [activeCharacterId]: updatedRecord,
      };

      persistData(charactersRef.current, nextRecords, settingsRef.current, activeCharacterId, true);
      return nextRecords;
    });
  };

  const handleToggleCustomTask = (taskId: string, completed: boolean) => {
    if (!activeCharacterId) return;

    setRecords((prev) => {
      const currentRec = prev[activeCharacterId] || {
        characterId: activeCharacterId,
        dailyDateKey: getKSTDailyKey(),
        weeklyThuKey: getKSTWeeklyThuKey(),
        weeklySunKey: getKSTWeeklySunKey(),
        monthlyKey: getKSTMonthlyKey(),
        dailyTasks: {},
        dailyBosses: {},
        dailyBossWeeklyLog: {},
        weeklyTasks: {},
        weeklyBosses: {},
        blackMage: { completed: false },
        customTasks: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedCustom = {
        ...(currentRec.customTasks || {}),
        [taskId]: {
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        },
      };

      const updatedRecord: CharacterProgressRecord = {
        ...currentRec,
        customTasks: updatedCustom,
        updatedAt: new Date().toISOString(),
      };

      const nextRecords = {
        ...prev,
        [activeCharacterId]: updatedRecord,
      };

      persistData(charactersRef.current, nextRecords, settingsRef.current, activeCharacterId, true);
      return nextRecords;
    });
  };

  // 일괄 완료/해제
  const handleBatchComplete = (ids: string[], complete: boolean) => {
    if (!activeCharacterId) return;

    const activeChar = characters.find((c) => c.id === activeCharacterId);
    const hasMonsterPark = ids.includes('daily_monster_park');

    setRecords((prev) => {
      const currentRec = prev[activeCharacterId] || {
        characterId: activeCharacterId,
        dailyDateKey: getKSTDailyKey(),
        weeklyThuKey: getKSTWeeklyThuKey(),
        weeklySunKey: getKSTWeeklySunKey(),
        dailyTasks: {},
        dailyBosses: {},
        dailyBossWeeklyLog: {},
        weeklyTasks: {},
        weeklyBosses: {},
        updatedAt: new Date().toISOString(),
      };

      const updatedDaily = { ...currentRec.dailyTasks };
      const updatedDailyBosses = { ...(currentRec.dailyBosses || {}) };
      const updatedWeekly = { ...currentRec.weeklyTasks };
      const updatedBosses = { ...currentRec.weeklyBosses };
      const updatedCustom = { ...(currentRec.customTasks || {}) };
      const currentLog = { ...(currentRec.dailyBossWeeklyLog || {}) };
      const todayKey = getKSTDailyKey();
      const todayList = new Set(currentLog[todayKey] || []);

      ids.forEach((id) => {
        if (id.startsWith('daily_boss_')) {
          updatedDailyBosses[id] = { completed: complete, completedAt: complete ? new Date().toISOString() : undefined };
          if (complete) {
            todayList.add(id);
          } else {
            todayList.delete(id);
          }
        } else if (id.startsWith('boss_')) {
          updatedBosses[id] = { completed: complete, completedAt: complete ? new Date().toISOString() : undefined };
        } else if (id.startsWith('weekly_')) {
          updatedWeekly[id] = { completed: complete, completedAt: complete ? new Date().toISOString() : undefined };
        } else if (activeChar?.customTasks?.some((ct) => ct.id === id)) {
          updatedCustom[id] = { completed: complete, completedAt: complete ? new Date().toISOString() : undefined };
        } else {
          updatedDaily[id] = {
            completed: complete,
            currentCount: id === 'daily_monster_park' ? (complete ? 7 : 0) : (complete ? 1 : 0),
            completedAt: complete ? new Date().toISOString() : undefined,
          };
        }
      });

      currentLog[todayKey] = Array.from(todayList);

      const updatedRecord: CharacterProgressRecord = {
        ...currentRec,
        dailyTasks: updatedDaily,
        dailyBosses: updatedDailyBosses,
        dailyBossWeeklyLog: currentLog,
        weeklyTasks: updatedWeekly,
        weeklyBosses: updatedBosses,
        customTasks: updatedCustom,
        updatedAt: new Date().toISOString(),
      };

      const nextRecords: Record<string, CharacterProgressRecord> = {
        ...prev,
        [activeCharacterId]: updatedRecord,
      };

      persistData(charactersRef.current, nextRecords, settingsRef.current, activeCharacterId, true);
      return nextRecords;
    });
  };

  // ----------------------------------------------------
  // 5. 캐릭터 관리
  // ----------------------------------------------------

  const handleAddCharacter = async (newChar: CharacterInfo) => {
    let formattedChar: CharacterInfo = {
      ...newChar,
      enabledTaskIds: sortTaskIdsByStandardOrder(newChar.enabledTaskIds || []),
      selectedBossIds: sortBossIdsByStandardOrder(newChar.selectedBossIds || []),
      selectedDailyBossIds: sortDailyBossIdsByStandardOrder(newChar.selectedDailyBossIds || []),
      selectedBlackMageId: newChar.selectedBlackMageId,
    };
    const nextChars = [...characters, formattedChar];
    setCharacters(nextChars);
    setActiveCharacterId(formattedChar.id);

    let initialRecord: CharacterProgressRecord = {
      characterId: formattedChar.id,
      dailyDateKey: getKSTDailyKey(),
      weeklyThuKey: getKSTWeeklyThuKey(),
      weeklySunKey: getKSTWeeklySunKey(),
      monthlyKey: getKSTMonthlyKey(),
      dailyTasks: {},
      dailyBosses: {},
      dailyBossWeeklyLog: {},
      weeklyTasks: {},
      weeklyBosses: {},
      blackMage: { completed: false },
      updatedAt: new Date().toISOString(),
    };

    // 캐릭터 등록 시 인게임 스케줄러 상태 및 진행/완료 기록을 즉시 가져와 반영
    if (formattedChar.ocid && !formattedChar.ocid.startsWith('manual_')) {
      try {
        const schedRes = await fetchNexonSchedulerState(
          formattedChar.ocid,
          true,
          undefined,
          formattedChar.characterName,
          formattedChar.apiKeyId
        );
        if (schedRes.success && schedRes.data) {
          if (!formattedChar.selectedBlackMageId) {
            const { selectedBlackMageId } = extractInGameRegisteredTasks(schedRes.data);
            if (selectedBlackMageId) {
              formattedChar.selectedBlackMageId = selectedBlackMageId;
            }
          }
          const { updatedRecord } = applyNexonSchedulerData(
            initialRecord,
            schedRes.data,
            formattedChar.enabledTaskIds,
            formattedChar.selectedBossIds,
            formattedChar.selectedDailyBossIds,
            formattedChar.selectedBlackMageId
          );
          initialRecord = updatedRecord;
        }
      } catch (err) {
        // 백업 기본 레코드 유지
      }
    }

    setRecords((prev) => {
      const nextRecords = {
        ...prev,
        [formattedChar.id]: initialRecord,
      };
      persistData(nextChars, nextRecords, settings, formattedChar.id);
      return nextRecords;
    });

    // 신규 캐릭터 등록 시 이번 주차 과거 일일 보스 내역 백그라운드 소급 조회 (0.2초 즉시 렌더링 후 비동기 보강)
    backfillPastWeeklyDailyBosses([formattedChar], { [formattedChar.id]: initialRecord });
  };

  const handleDeleteCharacter = (id: string) => {
    const nextChars = characters.filter((c) => c.id !== id);
    setCharacters(nextChars);

    let nextActiveId = activeCharacterId;
    if (activeCharacterId === id) {
      nextActiveId = nextChars.length > 0 ? nextChars[0].id : null;
      setActiveCharacterId(nextActiveId);
    }

    setRecords((prev) => {
      const nextRecords = { ...prev };
      delete nextRecords[id];
      persistData(nextChars, nextRecords, settings, nextActiveId);
      return nextRecords;
    });
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextChars = characters.map((c) =>
      c.id === id ? { ...c, favorite: !c.favorite } : c
    );
    setCharacters(nextChars);
    persistData(nextChars, records, settings, activeCharacterId, true);
  };

  const handleMoveCharacter = (id: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const index = characters.findIndex((c) => c.id === id);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= characters.length) return;

    const nextChars = [...characters];
    const [moved] = nextChars.splice(index, 1);
    nextChars.splice(targetIndex, 0, moved);

    nextChars.forEach((c, idx) => {
      c.sortOrder = idx;
    });

    setCharacters(nextChars);
    persistData(nextChars, records, settings, activeCharacterId);
  };

  const handleSaveContentConfig = (
    characterId: string,
    enabledTaskIds: string[],
    selectedBossIds: string[],
    weeklyBossThreshold?: number,
    selectedDailyBossIds?: string[],
    selectedBlackMageId?: string | null,
    customTasks?: CustomTask[]
  ) => {
    const sortedTasks = sortTaskIdsByStandardOrder(enabledTaskIds);
    const sortedBosses = sortBossIdsByStandardOrder(selectedBossIds);
    const sortedDailyBosses = sortDailyBossIdsByStandardOrder(selectedDailyBossIds || []);

    const nextChars = characters.map((c) =>
      c.id === characterId
        ? { 
            ...c, 
            enabledTaskIds: sortedTasks, 
            selectedBossIds: sortedBosses, 
            selectedDailyBossIds: sortedDailyBosses,
            weeklyBossThreshold: weeklyBossThreshold !== undefined ? weeklyBossThreshold : (c.weeklyBossThreshold ?? 12),
            selectedBlackMageId: selectedBlackMageId !== undefined ? selectedBlackMageId : c.selectedBlackMageId,
            customTasks: customTasks !== undefined ? customTasks : c.customTasks,
          }
        : c
    );
    setCharacters(nextChars);
    persistData(nextChars, records, settings, activeCharacterId);
  };

  const handleUpdateCustomTask = (updatedTask: CustomTask) => {
    if (!activeCharacterId) return;
    const nextChars = characters.map((c) => {
      if (c.id === activeCharacterId) {
        const nextCustom = (c.customTasks || []).map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        );
        return { ...c, customTasks: nextCustom };
      }
      return c;
    });
    setCharacters(nextChars);
    charactersRef.current = nextChars;
    persistData(nextChars, recordsRef.current, settings, activeCharacterId);
  };

  // ----------------------------------------------------
  // 6. 설정 및 백업 / 복원
  // ----------------------------------------------------

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    const next = { ...settings, ...newSettings };
    if (newSettings.pip?.enabled !== undefined && (window as any).electronAPI) {
      if (newSettings.pip.enabled) {
        (window as any).electronAPI.openPiPWindow?.();
      } else {
        (window as any).electronAPI.closePiPWindow?.();
      }
    }
    setSettings(next);
    persistData(characters, records, next, activeCharacterId);
  };

  const handleExportData = () => {
    const payload: AppDataPayload = {
      characters,
      records,
      settings,
      activeCharacterId,
      lastServerSync: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `메이플스토리_스케줄러_백업_${getKSTDailyKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as AppDataPayload;
        if (json.characters && Array.isArray(json.characters)) {
          setCharacters(json.characters);
          setRecords(json.records || {});
          setSettings(json.settings || DEFAULT_SETTINGS);
          setActiveCharacterId(json.activeCharacterId || json.characters[0]?.id || null);
          await persistData(json.characters, json.records || {}, json.settings || DEFAULT_SETTINGS, json.activeCharacterId || null);
          showToast('데이터 복원이 성공적으로 완료되었습니다.', 'success');
        } else {
          showToast('유효하지 않은 백업 파일 형식입니다.', 'error');
        }
      } catch (err) {
        showToast('백업 파일 읽기 실패: JSON 형식이 올바르지 않습니다.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = async () => {
    setCharacters([]);
    setRecords({});
    setActiveCharacterId(null);
    setSettings(DEFAULT_SETTINGS);
    setHasApiKey(false);

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem('mapleschedule_common_content_ids');
      localStorage.removeItem('mapleschedule_progress_only_favorites');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {
      console.warn('로컬스토리지 삭제 실패', e);
    }

    if (!isWeb) {
      // 데스크톱 환경: 서버 DB 데이터 초기화 및 등록된 API 키 영구 삭제
      try {
        await Promise.all([
          resetServerAppData(),
          deleteApiKey().catch(() => null),
        ]);
      } catch (e) {
        console.warn('서버 초기화 중 오류:', e);
      }

      await saveServerAppData({
        characters: [],
        records: {},
        settings: DEFAULT_SETTINGS,
        activeCharacterId: null,
        lastServerSync: new Date().toISOString(),
      });
    } else {
      // 웹 환경: 브라우저 LocalStorage 데이터 및 로컬 API 키 삭제
      try {
        await deleteApiKey().catch(() => null);
      } catch (e) {}
    }

    // PiP 및 다른 창으로 초기화 브로드캐스트
    broadcastAppData({
      characters: [],
      records: {},
      settings: DEFAULT_SETTINGS,
      activeCharacterId: null,
      lastServerSync: new Date().toISOString(),
    });

    showToast('모든 데이터 및 API 키가 성공적으로 초기화되었습니다.', 'success');
  };

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) || null;
  const configCharacter = characters.find((c) => c.id === configCharacterId) || null;

  if (isInitializing) {
    return (
      <div className="h-screen w-screen bg-[#F8F9FB] dark:bg-slate-950 flex flex-col items-center justify-center text-slate-800 dark:text-slate-100">
        <LoadingSpinner size="xl" text="메이플스토리 스케줄러 시스템을 준비하는 중..." />
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${settings.darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#F8F9FB] text-slate-800'}`}>
      {/* 1. 상단 Windows 헤더 */}
      <WindowHeader
        characters={characters}
        records={records}
        onSelectCharacter={handleSelectCharacter}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
        onRefreshAll={handleRefresh}
        isRefreshing={isRefreshing}
        hasApiKey={hasApiKey}
        darkMode={settings.darkMode}
        onToggleDarkMode={() => handleUpdateSettings({ darkMode: !settings.darkMode })}
        currentTimeStr={lastUpdatedStr}
        autoSyncCountdown={autoSyncCountdown}
        autoSyncIntervalSec={settings.autoSyncIntervalSec || 300}
      />

      {/* 2. 메인 3분할 뷰 */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#F8F9FB] dark:bg-slate-950 min-h-0 min-w-0">
        {/* 좌측 사이드바: 캐릭터 목록 */}
        <CharacterSidebar
          characters={characters}
          records={records}
          activeCharacterId={activeCharacterId}
          apiKeys={apiKeys}
          settings={settings}
          characterAlertMap={characterAlertMap}
          onSelectCharacter={handleSelectCharacter}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onToggleFavorite={handleToggleFavorite}
          onMoveCharacter={handleMoveCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onOpenContentConfig={(id, e) => {
            e.stopPropagation();
            setConfigCharacterId(id);
          }}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenLegalModal={handleOpenLegalModal}
        />

        {/* 중앙: 선택된 캐릭터의 콘텐츠 관리 영역 */}
        <section 
          id="main-content-section" 
          className="flex-1 flex flex-col bg-[#F8F9FB] dark:bg-slate-950 overflow-hidden min-h-0 min-w-0"
        >
          {activeCharacter ? (
            (() => {
              const activeCharAlert = characterAlertMap[activeCharacter.id];
              return (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
              {/* 중앙 상단: 탭 헤더 (가로 한 줄 고정 정렬 & 마우스 휠 가로 스크롤 지원) */}
              <div 
                ref={tabScrollRef}
                onWheel={handleTabWheel}
                className="px-5 sm:px-6 py-3.5 bg-[#F8F9FB] dark:bg-slate-950 flex items-center justify-between gap-3 flex-shrink-0 overflow-x-auto custom-scrollbar"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  {/* 한국어 탭 세그먼트 버튼 (부드러운 슬라이딩 모션 전환) */}
                  <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 shadow-xs flex-shrink-0 relative">
                    {[
                      { id: 'all', label: '전체', icon: LayoutGrid, activeBg: 'bg-orange-500', activeText: 'text-white' },
                      { id: 'daily', label: '일일 컨텐츠', icon: Calendar, activeBg: 'bg-amber-500', activeText: 'text-white' },
                      { id: 'daily_boss', label: '일일 보스', icon: Crown, activeBg: 'bg-sky-600', activeText: 'text-white' },
                      { id: 'weekly', label: '주간 컨텐츠', icon: Flame, activeBg: 'bg-rose-700', activeText: 'text-white' },
                      { id: 'bosses', label: '주간 보스', icon: Crown, activeBg: 'bg-purple-600', activeText: 'text-white' },
                      { id: 'custom', label: '커스텀', icon: Plus, activeBg: 'bg-black dark:bg-white', activeText: 'text-white dark:text-black' },
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          id={`tab-btn-${tab.id}`}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`relative px-3 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer z-10 select-none ${
                            isActive
                              ? tab.activeText
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="mainActiveTabPill"
                              className={`absolute inset-0 rounded-lg shadow-xs -z-10 ${tab.activeBg}`}
                              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                            />
                          )}
                          <Icon className="w-3.5 h-3.5 relative z-10" />
                          <span className="relative z-10">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfigCharacterId(activeCharacter.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />
                    <span>스케줄 설정</span>
                  </button>
                </div>
              </div>

              {/* 스크롤 가능한 콘텐츠 뷰 (스크롤바 표시 시 크기 흔들림 방지) */}
              <div className="flex-1 overflow-y-scroll p-4 sm:p-6 space-y-6 custom-scrollbar [scrollbar-gutter:stable]">
                {(activeTab === 'all' || activeTab === 'daily') && (
                  <DailyTaskList
                    key={`${activeCharacter.id}-${collapseTrigger}-daily`}
                    character={activeCharacter}
                    record={records[activeCharacter.id]}
                    onToggleTask={handleToggleTask}
                    onBatchComplete={handleBatchComplete}
                    onOpenContentConfig={() => setConfigCharacterId(activeCharacter.id)}
                    soundEnabled={settings.soundEnabled}
                    collapsible={activeTab === 'all'}
                    isAlertActive={activeCharAlert?.dailyAlert}
                  />
                )}

                {(activeTab === 'all' || activeTab === 'daily_boss') && (
                  <DailyBossList
                    key={`${activeCharacter.id}-${collapseTrigger}-daily-boss`}
                    character={activeCharacter}
                    record={records[activeCharacter.id]}
                    onToggleDailyBoss={handleToggleDailyBoss}
                    onToggleBoss={handleToggleDailyBoss}
                    onBatchComplete={handleBatchComplete}
                    onOpenContentConfig={() => setConfigCharacterId(activeCharacter.id)}
                    soundEnabled={settings.soundEnabled}
                    collapsible={activeTab === 'all'}
                    isAlertActive={activeCharAlert?.dailyBossAlert}
                  />
                )}

                {(activeTab === 'all' || activeTab === 'weekly') && (
                  <WeeklyTaskList
                    key={`${activeCharacter.id}-${collapseTrigger}-weekly`}
                    character={activeCharacter}
                    record={records[activeCharacter.id]}
                    onToggleTask={handleToggleTask}
                    onBatchComplete={handleBatchComplete}
                    onOpenContentConfig={() => setConfigCharacterId(activeCharacter.id)}
                    soundEnabled={settings.soundEnabled}
                    collapsible={activeTab === 'all'}
                    isAlertActive={activeCharAlert?.weeklyAlert}
                  />
                )}

                {(activeTab === 'all' || activeTab === 'bosses') && (
                  <WeeklyBossList
                    key={`${activeCharacter.id}-${collapseTrigger}-bosses`}
                    character={activeCharacter}
                    record={records[activeCharacter.id]}
                    onToggleBoss={handleToggleBoss}
                    onBatchComplete={handleBatchComplete}
                    onOpenContentConfig={() => setConfigCharacterId(activeCharacter.id)}
                    soundEnabled={settings.soundEnabled}
                    collapsible={activeTab === 'all'}
                    isAlertActive={activeCharAlert?.bossAlert}
                  />
                )}

                {(activeTab === 'all' || activeTab === 'bosses') && (
                  <BlackMageCard
                    key={`${activeCharacter.id}-${collapseTrigger}-black-mage`}
                    character={activeCharacter}
                    record={records[activeCharacter.id]}
                    onToggleBlackMage={handleToggleBlackMage}
                    onOpenContentConfig={() => setConfigCharacterId(activeCharacter.id)}
                    soundEnabled={settings.soundEnabled}
                    collapsible={activeTab === 'all'}
                    isAlertActive={activeCharAlert?.blackMageAlert}
                  />
                )}

                {(activeTab === 'all' || activeTab === 'custom') && (
                  <CustomTaskList
                    key={`${activeCharacter.id}-${collapseTrigger}-custom`}
                    character={activeCharacter}
                    record={records[activeCharacter.id]}
                    onToggleCustomTask={handleToggleCustomTask}
                    onUpdateCustomTask={handleUpdateCustomTask}
                    onOpenContentConfig={() => setConfigCharacterId(activeCharacter.id)}
                    soundEnabled={settings.soundEnabled}
                    collapsible={activeTab === 'all'}
                    isAlertActive={activeCharAlert?.customAlert}
                  />
                )}
              </div>
            </div>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <div className="w-16 h-16 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 flex items-center justify-center mb-3 shadow-xs p-2.5">
                <img
                  src={APP_LOGO_SRC}
                  alt="메케줄"
                  onError={onLogoError}
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                선택된 캐릭터가 없습니다
              </h3>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>캐릭터 추가하기</span>
              </button>
            </div>
          )}

          {/* 중앙 하단: 구글 애드센스 광고 분리 영역 (웹 전용: 스케줄 목록과 분리된 독립 칸) */}
          {isWeb && (
            <div 
              id="main-bottom-adsense-footer"
              className="px-4 py-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-900/40 flex-shrink-0 flex items-center justify-center select-none"
            >
              <AdSenseBanner />
            </div>
          )}
        </section>

        {/* 우측 진행률 패널 */}
        <ProgressPanel
          characters={characters}
          records={records}
          activeCharacter={activeCharacter}
          apiKeys={apiKeys}
          characterSelectTrigger={characterSelectTrigger}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          autoSyncCountdown={autoSyncCountdown}
          onToggleCommonTask={handleToggleCommonTask}
          settings={settings}
          accountAlertStatus={accountAlertStatus}
          onUpdateSettings={handleUpdateSettings}
        />
      </main>

      {/* 모달 컴포넌트들 */}
      <CharacterSearchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddCharacter={handleAddCharacter}
        existingCharacters={characters}
        hasApiKey={hasApiKey}
        apiKeys={apiKeys}
        onOpenApiKeyModal={() => {
          setIsAddModalOpen(false);
          setIsApiKeyModalOpen(true);
        }}
      />

      <ContentConfigModal
        isOpen={!!configCharacterId}
        onClose={() => setConfigCharacterId(null)}
        character={configCharacter}
        onSaveConfig={handleSaveContentConfig}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        hasApiKey={hasApiKey}
        onOpenApiKeyModal={() => {
          setIsSettingsModalOpen(false);
          setIsApiKeyModalOpen(true);
        }}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetAllData={handleResetAllData}
        onOpenLegalModal={handleOpenLegalModal}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={handleApplyUpdatedApiKeys}
      />

      {/* 공지사항 모달 (API 버튼 옆 확성기 아이콘 클릭 시 표시) */}
      <NoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
      />

      {/* 이용약관 및 개인정보처리방침 법적 고지 모달 */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* 글로벌 토스트 알림 */}
      {toastFeedback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toastFeedback.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900 dark:border-slate-200'
              : 'bg-rose-600 text-white border-rose-700'
          }`}>
            <span>{toastFeedback.message}</span>
          </div>
        </div>
      )}

      {/* 미완료 스케줄 리셋 임박 팝업 알림 (띠링 띠링 사운드 루프 포함) */}
      <IncompleteScheduleAlertModal
        isOpen={isAlertModalOpen}
        onClose={handleCloseAlertModal}
        incompleteList={incompleteAlertList}
        incompleteAccountTasks={accountAlertStatus.incompleteTasks}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* 웹 환경 전용 인앱 PiP 오버레이 (임시 웹 PiP 숨김 처리: 데스크톱만 지원하도록 보호하며 코드는 100% 보존) */}
      {supportsPiP && !isElectron && settings.pip?.enabled && (
        <PiPOverlay
          characters={characters}
          records={records}
          activeCharacterId={activeCharacterId}
          settings={settings}
          characterAlertMap={characterAlertMap}
          accountAlertStatus={accountAlertStatus}
          onSelectCharacter={handleSelectCharacter}
          onSelectTab={(tab) => setActiveTab(tab)}
          onToggleCommonTask={handleToggleCommonTask}
        />
      )}
    </div>
  );
}
