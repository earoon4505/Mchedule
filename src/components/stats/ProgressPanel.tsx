import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, 
  Coins, 
  Calendar, 
  Flame, 
  Crown,
  Star,
  Sparkles,
  Check,
  Settings2,
  Plus,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Eye,
  EyeOff,
  Tv
} from 'lucide-react';
import { BlackMageSilhouetteIcon } from '../common/BlackMageIcon';
import { CharacterInfo, CharacterProgressRecord, AppSettings, PipSettings, ApiKeyItem } from '../../types';
import { WEEKLY_BOSSES, EPIC_DUNGEONS, DAILY_BOSSES, BLACK_MAGE_BOSS } from '../../data/defaultTasks';
import { MapleIcon } from '../common/MapleIcon';
import { 
  ALL_COMMON_CONTENTS, 
  DEFAULT_COMMON_CONTENT_IDS, 
  getStoredCommonContentsMap,
  getStoredCommonContentIds,
  saveStoredCommonContentIds,
  CommonContentItem
} from '../../utils/commonContents';
import { AccountAlertStatus } from '../../utils/alertNotifier';
import { supportsPiP } from '../../utils/platform';
import { getStoredApiKeys, buildAccountIndicatorItems } from '../../utils/accountHelper';
import { fetchApiKeys } from '../../services/api';
import { subscribeToApiKeys, subscribeToCommonContents } from '../../utils/syncChannel';
import { motion, AnimatePresence } from 'motion/react';
import { SwitchToggle } from '../common/SwitchToggle';

export type ProgressPanelSectionId =
  | 'total_rate'
  | 'daily_tasks'
  | 'daily_boss'
  | 'weekly_tasks'
  | 'weekly_boss'
  | 'black_mage'
  | 'custom_tasks'
  | 'meso_daily_boss'
  | 'meso_weekly_boss'
  | 'meso_black_mage'
  | 'common_contents'
  | 'pip_toggle';

export interface ProgressPanelSectionConfig {
  id: ProgressPanelSectionId;
  label: string;
  visible: boolean;
}

export const DEFAULT_PROGRESS_SECTIONS: ProgressPanelSectionConfig[] = [
  { id: 'total_rate', label: '전체 달성률', visible: true },
  { id: 'daily_tasks', label: '일일 컨텐츠', visible: true },
  { id: 'daily_boss', label: '일일 보스', visible: true },
  { id: 'weekly_tasks', label: '주간 컨텐츠', visible: true },
  { id: 'weekly_boss', label: '주간 보스', visible: true },
  { id: 'black_mage', label: '검은 마법사', visible: true },
  { id: 'custom_tasks', label: '커스텀', visible: true },
  { id: 'meso_daily_boss', label: '일일 보스 결정석 (일주일 누적)', visible: true },
  { id: 'meso_weekly_boss', label: '주간 보스 결정석', visible: true },
  { id: 'meso_black_mage', label: '검은 마법사 결정석', visible: true },
  { id: 'common_contents', label: '계정 컨텐츠', visible: true },
  { id: 'pip_toggle', label: 'PIP', visible: true },
];

const SECTIONS_STORAGE_KEY = 'mapleschedule_progress_panel_sections_v1';

function getStoredProgressSections(): ProgressPanelSectionConfig[] {
  try {
    const raw = localStorage.getItem(SECTIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS_SECTIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_PROGRESS_SECTIONS;

    const result: ProgressPanelSectionConfig[] = [];
    parsed.forEach((item: any) => {
      const def = DEFAULT_PROGRESS_SECTIONS.find((d) => d.id === item.id);
      if (def) {
        result.push({
          id: def.id,
          label: def.label,
          visible: item.visible !== false,
        });
      }
    });

    DEFAULT_PROGRESS_SECTIONS.forEach((def) => {
      if (!result.some((r) => r.id === def.id)) {
        result.push({ ...def });
      }
    });

    return result;
  } catch (e) {
    return DEFAULT_PROGRESS_SECTIONS;
  }
}

interface ProgressPanelProps {
  characters: CharacterInfo[];
  records: Record<string, CharacterProgressRecord>;
  activeCharacter: CharacterInfo | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  autoSyncCountdown: number;
  onToggleCommonTask?: (taskId: string, completed: boolean, count?: number, targetApiKeyId?: string, targetCharacterId?: string) => void;
  settings?: AppSettings;
  accountAlertStatus?: AccountAlertStatus;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
  apiKeys?: ApiKeyItem[];
  characterSelectTrigger?: number;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = React.memo(({
  characters,
  records,
  activeCharacter,
  onRefresh,
  isRefreshing,
  autoSyncCountdown,
  onToggleCommonTask,
  settings,
  accountAlertStatus,
  onUpdateSettings,
  apiKeys: initialApiKeys,
  characterSelectTrigger,
}) => {
  // 즐겨찾기 캐릭터만 필터링 여부
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mapleschedule_progress_only_favorites') === 'true';
    } catch (e) {
      return false;
    }
  });

  // 계정 공통 컨텐츠 편집 모달 및 활성화된 목록 맵 (API별 독립 격리)
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [commonContentsMap, setCommonContentsMap] = useState<Record<string, string[]>>(getStoredCommonContentsMap);
  const [modalEditingApiKeyId, setModalEditingApiKeyId] = useState<string>('default');

  // 진행 현황 UI 항목 순서 및 노출 편집 모달 상태
  const [isEditUiModalOpen, setIsEditUiModalOpen] = useState(false);
  const [panelSections, setPanelSections] = useState<ProgressPanelSectionConfig[]>(getStoredProgressSections);

  // 다중 계정 API 키 목록 및 계정별 선택 상태 (실시간 동기화 지원)
  const [knownApiKeys, setKnownApiKeys] = useState<ApiKeyItem[]>(() => initialApiKeys || getStoredApiKeys());

  useEffect(() => {
    if (initialApiKeys && Array.isArray(initialApiKeys)) {
      setKnownApiKeys(initialApiKeys);
    }
  }, [initialApiKeys]);

  useEffect(() => {
    let isMounted = true;
    fetchApiKeys().then((res: any) => {
      if (isMounted && res?.success && Array.isArray(res.keys)) {
        setKnownApiKeys(res.keys);
      }
    }).catch(() => {});

    // 실시간 API 키 변경(추가/삭제/별칭 수정) 즉각(0ms) 구독
    const unsubscribe = subscribeToApiKeys((updatedKeys) => {
      if (isMounted && Array.isArray(updatedKeys)) {
        setKnownApiKeys(updatedKeys);
      }
    });

    const handleStorage = () => {
      if (isMounted) {
        setKnownApiKeys(getStoredApiKeys());
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [characters]);

  // 계정 인디케이터 아이템 목록 생성 (등록 순서 보장, 2개 이상일 때만 활성화)
  const accountIndicatorItems = useMemo(() => {
    return buildAccountIndicatorItems(characters, activeCharacter?.id || null, knownApiKeys);
  }, [characters, activeCharacter?.id, knownApiKeys]);

  // 사용자가 선택한 계정 API 키 ID
  const [selectedCommonApiKeyId, setSelectedCommonApiKeyId] = useState<string | null>(null);

  // 캐릭터를 클릭하거나 활성 캐릭터가 변경될 때, 계정 컨텐츠를 해당 캐릭터가 속한 API 키(계정)로 즉시 동기화
  useEffect(() => {
    if (activeCharacter) {
      setSelectedCommonApiKeyId(activeCharacter.apiKeyId || 'default');
    }
  }, [activeCharacter?.id, activeCharacter?.apiKeyId, characterSelectTrigger]);

  // API 키가 삭제되거나 변경되었을 때, 선택된 계정 ID가 더 이상 유효하지 않으면 활성 캐릭터의 계정으로 자동 갱신
  useEffect(() => {
    if (selectedCommonApiKeyId && selectedCommonApiKeyId !== 'default' && !knownApiKeys.some((k) => k.id === selectedCommonApiKeyId)) {
      setSelectedCommonApiKeyId(activeCharacter?.apiKeyId || 'default');
    }
  }, [knownApiKeys, selectedCommonApiKeyId, activeCharacter?.apiKeyId]);

  // 최종 적용할 계정 API 키 ID
  const effectiveApiKeyId = useMemo(() => {
    if (selectedCommonApiKeyId && accountIndicatorItems.some((acc) => acc.id === selectedCommonApiKeyId)) {
      return selectedCommonApiKeyId;
    }
    if (activeCharacter?.apiKeyId && accountIndicatorItems.some((acc) => acc.id === activeCharacter.apiKeyId)) {
      return activeCharacter.apiKeyId;
    }
    return accountIndicatorItems[0]?.id || (activeCharacter?.apiKeyId || 'default');
  }, [selectedCommonApiKeyId, activeCharacter?.apiKeyId, accountIndicatorItems]);

  // 웹 모드(!supportsPiP)일 때 PIP 토글 섹션 제외
  const filteredSections = useMemo(() => {
    return panelSections.filter((sec) => supportsPiP || sec.id !== 'pip_toggle');
  }, [panelSections]);

  useEffect(() => {
    const unsubscribeCommon = subscribeToCommonContents((map) => {
      if (map && typeof map === 'object') {
        setCommonContentsMap(map);
      }
    });
    const handleStorage = () => {
      setCommonContentsMap(getStoredCommonContentsMap());
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      unsubscribeCommon();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 현재 선택된 계정(effectiveApiKeyId)에 활성화된 계정 공통 컨텐츠 ID 목록
  const currentEnabledCommonIds = useMemo(() => {
    return commonContentsMap[effectiveApiKeyId] || commonContentsMap['default'] || DEFAULT_COMMON_CONTENT_IDS;
  }, [commonContentsMap, effectiveApiKeyId]);

  // 편집 모달에서 현재 선택된 API의 계정 공통 컨텐츠 ID 목록
  const modalEditingEnabledIds = useMemo(() => {
    return commonContentsMap[modalEditingApiKeyId] || commonContentsMap['default'] || DEFAULT_COMMON_CONTENT_IDS;
  }, [commonContentsMap, modalEditingApiKeyId]);

  const handleToggleFavorites = () => {
    const next = !onlyFavorites;
    setOnlyFavorites(next);
    try {
      localStorage.setItem('mapleschedule_progress_only_favorites', String(next));
    } catch (e) {}
  };

  const saveSections = (newSections: ProgressPanelSectionConfig[]) => {
    setPanelSections(newSections);
    try {
      localStorage.setItem(SECTIONS_STORAGE_KEY, JSON.stringify(newSections));
    } catch (e) {}
  };

  const handleToggleSectionVisibility = (id: ProgressPanelSectionId) => {
    const next = panelSections.map((sec) =>
      sec.id === id ? { ...sec, visible: !sec.visible } : sec
    );
    saveSections(next);
  };

  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return;
    const target = filteredSections[index];
    const prevTarget = filteredSections[index - 1];
    if (!target || !prevTarget) return;

    const rawIndex = panelSections.findIndex((s) => s.id === target.id);
    const rawPrevIndex = panelSections.findIndex((s) => s.id === prevTarget.id);
    if (rawIndex === -1 || rawPrevIndex === -1) return;

    const next = [...panelSections];
    const temp = next[rawPrevIndex];
    next[rawPrevIndex] = next[rawIndex];
    next[rawIndex] = temp;
    saveSections(next);
  };

  const handleMoveSectionDown = (index: number) => {
    if (index >= filteredSections.length - 1) return;
    const target = filteredSections[index];
    const nextTarget = filteredSections[index + 1];
    if (!target || !nextTarget) return;

    const rawIndex = panelSections.findIndex((s) => s.id === target.id);
    const rawNextIndex = panelSections.findIndex((s) => s.id === nextTarget.id);
    if (rawIndex === -1 || rawNextIndex === -1) return;

    const next = [...panelSections];
    const temp = next[rawNextIndex];
    next[rawNextIndex] = next[rawIndex];
    next[rawIndex] = temp;
    saveSections(next);
  };

  const handleResetSections = () => {
    saveSections(DEFAULT_PROGRESS_SECTIONS.map((s) => ({ ...s })));
  };

  const handleToggleCommonContent = (id: string) => {
    const targetKey = modalEditingApiKeyId || effectiveApiKeyId || 'default';
    const currentIds = commonContentsMap[targetKey] || commonContentsMap['default'] || DEFAULT_COMMON_CONTENT_IDS;
    const next = currentIds.includes(id)
      ? currentIds.filter((item) => item !== id)
      : [...currentIds, id];

    const updated = saveStoredCommonContentIds(targetKey, next);
    setCommonContentsMap(updated);
  };

  // 대상 캐릭터 목록 (전체 또는 즐겨찾기)
  const targetCharacters = useMemo(() => {
    return onlyFavorites
      ? characters.filter((c) => c.favorite)
      : characters;
  }, [onlyFavorites, characters]);

  // ----------------------------------------------------
  // 계정/월드 공통 컨텐츠 및 통합 통계 계산 (불필요한 초 단위 재연산 방지)
  // 계정 공통 컨텐츠는 현재 선택된 캐릭터의 계정(apiKeyId)을 기준으로 독립 평가
  // ----------------------------------------------------
  const stats = useMemo(() => {
    // 현재 선택된 계정(effectiveApiKeyId) 소속 캐릭터 목록 필터링
    // 계정 공통 컨텐츠는 캐릭터 개별 즐겨찾기 여부와 상관없이 등록된 전체 캐릭터(characters)를 기준으로 항상 평가
    const hasAnyApiKey = characters.some((c) => !!c.apiKeyId);
    const accountChars = (hasAnyApiKey && effectiveApiKeyId)
      ? characters.filter((c) => (c.apiKeyId || 'default') === effectiveApiKeyId)
      : characters;
    const effectiveCommonChars = accountChars.length > 0 ? accountChars : characters;

    // 1. 몬스터파크 (현재 계정의 캐릭터 중 일일 2회 이상 클리어 시 완료)
    let maxMonsterParkCount = 0;
    let isMonsterParkCompleted = false;
    effectiveCommonChars.forEach((char) => {
      const rec = records?.[char.id];
      const mpState = rec?.dailyTasks?.['daily_monster_park'];
      const count = mpState?.currentCount ?? (mpState?.completed ? 2 : 0);
      if (count > maxMonsterParkCount) maxMonsterParkCount = count;
      if (mpState?.completed || count >= 2) isMonsterParkCompleted = true;
    });

    // 2. 에픽 던전들 (현재 계정의 캐릭터 중 클리어 여부 확인)
    const epicDungeonList = EPIC_DUNGEONS.map((epic) => {
      const isDone = effectiveCommonChars.some((char) => {
        const rec = records?.[char.id];
        return !!rec?.weeklyTasks?.[epic.id]?.completed;
      });
      return {
        ...epic,
        isCompleted: isDone,
      };
    });

    // 전체 캐릭터 통합 통계 계산
    let totalDailyTasks = 0;
    let doneDailyTasks = 0;
    let totalDailyBossTasks = 0;
    let doneDailyBossTasks = 0;
    let totalWeeklyTasks = 0;
    let doneWeeklyTasks = 0;
    let totalBossThreshold = 0;
    let doneBossCount = 0;
    let totalBlackMageTasks = 0;
    let doneBlackMageTasks = 0;
    let totalCustomTasks = 0;
    let doneCustomTasks = 0;
    let earnedBossMeso = 0;
    let earnedDailyBossWeeklyMeso = 0;
    let earnedBlackMageMeso = 0;

    targetCharacters.forEach((char) => {
      const rec = records?.[char.id];

      // 1. 일일 숙제 통계 (아케인/그란디스 일일 퀘스트)
      const dailyTaskIds = (char.enabledTaskIds || [])
        .filter((id) => id !== 'daily_monster_park' && id !== 'daily_monster_park_extreme')
        .filter((id) => !id.startsWith('weekly_') && !id.startsWith('boss_'));
      totalDailyTasks += dailyTaskIds.length;
      doneDailyTasks += dailyTaskIds.filter((id) => rec?.dailyTasks?.[id]?.completed).length;

      // 2. 일일 보스 통계 및 목~수 일주일 누적 결정석 계산
      const selectedDailyBossIds = char.selectedDailyBossIds || [];
      totalDailyBossTasks += selectedDailyBossIds.length;
      doneDailyBossTasks += selectedDailyBossIds.filter((id) => rec?.dailyBosses?.[id]?.completed).length;

      if (rec?.dailyBossWeeklyLog) {
        Object.values(rec.dailyBossWeeklyLog).forEach((bossIds) => {
          if (Array.isArray(bossIds)) {
            bossIds.forEach((bId) => {
              const bDef = DAILY_BOSSES.find((b) => b.id === bId);
              if (bDef?.mesoValue) {
                earnedDailyBossWeeklyMeso += bDef.mesoValue;
              }
            });
          }
        });
      }

      // 3. 주간 퀘스트 통계 (아케인 주간, 무릉, 수로, 플래그)
      const weeklyTaskIds = (char.enabledTaskIds || [])
        .filter((id) => id !== 'weekly_monster_park_extreme' && id !== 'daily_monster_park_extreme' && !id.startsWith('weekly_epic_'))
        .filter((id) => id.startsWith('weekly_'));
      totalWeeklyTasks += weeklyTaskIds.length;
      doneWeeklyTasks += weeklyTaskIds.filter((id) => rec?.weeklyTasks?.[id]?.completed).length;

      // 4. 주간 보스 통계 & 결정석 메소
      const selectedBossCount = (char.selectedBossIds || []).length;
      const bossThreshold = selectedBossCount === 0 ? 0 : (char.weeklyBossThreshold ?? Math.min(12, selectedBossCount));
      const allClearedBosses = WEEKLY_BOSSES.filter((b) => rec?.weeklyBosses?.[b.id]?.completed);
      const clearedCount = allClearedBosses.length;

      totalBossThreshold += bossThreshold;
      doneBossCount += Math.min(clearedCount, bossThreshold);

      earnedBossMeso += allClearedBosses.reduce((sum, b) => sum + (b.mesoValue || 0), 0);

      // 5. 검은 마법사 통계 & 결정석 메소 (등록된 보스 + 미선택 처치 보스)
      if (char.selectedBlackMageId) {
        totalBlackMageTasks += 1;
        if (rec?.blackMage?.completed) {
          doneBlackMageTasks += 1;
          const diffId = rec.blackMage.difficulty || char.selectedBlackMageId;
          const bmDef = BLACK_MAGE_BOSS.difficulties.find((d) => d.id === diffId) || BLACK_MAGE_BOSS.difficulties.find((d) => d.id === char.selectedBlackMageId);
          earnedBlackMageMeso += bmDef?.mesoValue || 465000000;
        }
      } else if (rec?.blackMage?.completed) {
        // 미선택 처치 보스
        const diffId = rec.blackMage.difficulty || 'boss_hard_black_mage';
        const bmDef = BLACK_MAGE_BOSS.difficulties.find((d) => d.id === diffId);
        earnedBlackMageMeso += bmDef?.mesoValue || 465000000;
      }

      // 6. 커스텀 컨텐츠 통계
      if (char.customTasks && char.customTasks.length > 0) {
        totalCustomTasks += char.customTasks.length;
        doneCustomTasks += char.customTasks.filter((t) => !!rec?.customTasks?.[t.id]?.completed).length;
      }
    });

    // ----------------------------------------------------
    // 계정 공통 컨텐츠 진행 현황 통계 집계:
    // 다계정 환경인 경우, 등록된 모든 활성 계정의 활성화된 계정 컨텐츠(몬파, 에픽던전)를 전부 포함하여 진행률 계산
    // ----------------------------------------------------
    let totalAllCommonTasks = 0;
    let doneAllCommonTasks = 0;

    // 평가 대상 계정 목록 (다계정이면 등록된 모든 계정, 단일 계정이면 현재 계정)
    const accountsToEvaluate = accountIndicatorItems.length > 1
      ? accountIndicatorItems
      : [{ id: effectiveApiKeyId || 'default', alias: '기본 계정' }];

    // 각 계정별 완료율 맵 (탭 UI 인디케이터용)
    const accountCommonStatusMap: Record<string, { total: number; done: number; isAllDone: boolean }> = {};

    if (characters.length > 0) {
      accountsToEvaluate.forEach((acc) => {
        // 계정 컨텐츠는 즐겨찾기 필터(targetCharacters)와 상관없이 등록된 전체 캐릭터(characters)에서 해당 계정 캐릭터들을 대상으로 조회
        const accChars = characters.filter((c) => (c.apiKeyId || 'default') === acc.id);
        const charsForThisAcc = accChars.length > 0 ? accChars : (accountIndicatorItems.length <= 1 ? characters : []);
        if (charsForThisAcc.length === 0) return;

        const enabledIds = commonContentsMap[acc.id] || commonContentsMap['default'] || DEFAULT_COMMON_CONTENT_IDS;
        let accTotal = 0;
        let accDone = 0;

        // 1. 몬스터파크 (일일 과제에 합산)
        if (enabledIds.includes('daily_monster_park')) {
          totalDailyTasks += 1;
          totalAllCommonTasks += 1;
          accTotal += 1;
          const isDone = charsForThisAcc.some((char) => {
            const rec = records?.[char.id];
            const mpState = rec?.dailyTasks?.['daily_monster_park'];
            const count = mpState?.currentCount ?? (mpState?.completed ? 2 : 0);
            return !!mpState?.completed || count >= 2;
          });
          if (isDone) {
            doneDailyTasks += 1;
            doneAllCommonTasks += 1;
            accDone += 1;
          }
        }

        // 2. 에픽 던전들 (주간 과제에 합산)
        EPIC_DUNGEONS.forEach((epic) => {
          if (enabledIds.includes(epic.id)) {
            totalWeeklyTasks += 1;
            totalAllCommonTasks += 1;
            accTotal += 1;
            const isDone = charsForThisAcc.some((char) => {
              const rec = records?.[char.id];
              return !!rec?.weeklyTasks?.[epic.id]?.completed;
            });
            if (isDone) {
              doneWeeklyTasks += 1;
              doneAllCommonTasks += 1;
              accDone += 1;
            }
          }
        });

        accountCommonStatusMap[acc.id] = {
          total: accTotal,
          done: accDone,
          isAllDone: accTotal > 0 && accDone >= accTotal,
        };
      });
    }

    const dailyPct = totalDailyTasks > 0 ? Math.round((doneDailyTasks / totalDailyTasks) * 100) : 0;
    const dailyBossPct = totalDailyBossTasks > 0 ? Math.round((doneDailyBossTasks / totalDailyBossTasks) * 100) : (totalDailyBossTasks === 0 && targetCharacters.length > 0 ? 100 : 0);
    const weeklyPct = totalWeeklyTasks > 0 ? Math.round((doneWeeklyTasks / totalWeeklyTasks) * 100) : 0;
    const bossPct = totalBossThreshold > 0 ? Math.min(100, Math.round((doneBossCount / totalBossThreshold) * 100)) : (totalBossThreshold === 0 && targetCharacters.length > 0 ? 100 : 0);
    const blackMagePct = totalBlackMageTasks > 0 ? Math.round((doneBlackMageTasks / totalBlackMageTasks) * 100) : 0;
    const customPct = totalCustomTasks > 0 ? Math.round((doneCustomTasks / totalCustomTasks) * 100) : 0;

    // 종합 진행률 (일일 + 일일보스 + 주간 + 주간보스 + 검은마법사 + 커스텀)
    const grandTotal = totalDailyTasks + totalDailyBossTasks + totalWeeklyTasks + totalBossThreshold + totalBlackMageTasks + totalCustomTasks;
    const grandDone = doneDailyTasks + doneDailyBossTasks + doneWeeklyTasks + doneBossCount + doneBlackMageTasks + doneCustomTasks;
    const grandPct = grandTotal > 0 ? Math.round((grandDone / grandTotal) * 100) : 0;
    const isGrandCompleted = grandTotal > 0 && grandPct >= 100;

    return {
      maxMonsterParkCount,
      isMonsterParkCompleted,
      epicDungeonList,
      totalDailyTasks,
      doneDailyTasks,
      totalDailyBossTasks,
      doneDailyBossTasks,
      totalWeeklyTasks,
      doneWeeklyTasks,
      totalBossThreshold,
      doneBossCount,
      totalBlackMageTasks,
      doneBlackMageTasks,
      totalCustomTasks,
      doneCustomTasks,
      earnedBossMeso,
      earnedDailyBossWeeklyMeso,
      earnedBlackMageMeso,
      dailyPct,
      dailyBossPct,
      weeklyPct,
      bossPct,
      blackMagePct,
      customPct,
      grandTotal,
      grandDone,
      grandPct,
      isGrandCompleted,
      effectiveCommonChars,
      totalAllCommonTasks,
      doneAllCommonTasks,
      accountCommonStatusMap,
    };
  }, [targetCharacters, characters, records, currentEnabledCommonIds, activeCharacter, effectiveApiKeyId, accountIndicatorItems, commonContentsMap]);

  const {
    maxMonsterParkCount,
    isMonsterParkCompleted,
    epicDungeonList,
    effectiveCommonChars,
    totalDailyTasks,
    doneDailyTasks,
    totalDailyBossTasks,
    doneDailyBossTasks,
    totalWeeklyTasks,
    doneWeeklyTasks,
    totalBossThreshold,
    doneBossCount,
    totalBlackMageTasks,
    doneBlackMageTasks,
    totalCustomTasks,
    doneCustomTasks,
    earnedBossMeso,
    earnedDailyBossWeeklyMeso,
    earnedBlackMageMeso,
    dailyPct,
    dailyBossPct,
    weeklyPct,
    bossPct,
    blackMagePct,
    customPct,
    grandTotal,
    grandDone,
    grandPct,
    isGrandCompleted,
    totalAllCommonTasks,
    doneAllCommonTasks,
    accountCommonStatusMap,
  } = stats;

  // 표시할 계정 공통 컨텐츠 필터링
  const displayedCommonContents = useMemo(() => {
    return ALL_COMMON_CONTENTS.filter((item) => currentEnabledCommonIds.includes(item.id));
  }, [currentEnabledCommonIds]);

  const pip: PipSettings = settings?.pip || {
    enabled: false,
    opacity: 100,
    direction: 'horizontal',
    align: 'right',
    position: 'top',
    hideCompleted: false,
  };

  const handleTogglePip = () => {
    const nextEnabled = !pip.enabled;
    if ((window as any).electronAPI?.togglePiPWindow) {
      (window as any).electronAPI.togglePiPWindow();
    }
    onUpdateSettings?.({
      pip: {
        ...pip,
        enabled: nextEnabled,
      },
    });
  };

  const getSectionIcon = (id: ProgressPanelSectionId) => {
    switch (id) {
      case 'total_rate':
        return <BarChart3 className="w-4 h-4 text-orange-500" />;
      case 'daily_tasks':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'daily_boss':
        return <Crown className="w-4 h-4 text-sky-500" />;
      case 'weekly_tasks':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'weekly_boss':
        return <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'black_mage':
        return <BlackMageSilhouetteIcon size={16} className="text-[#bc364d]" />;
      case 'custom_tasks':
        return <Plus className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />;
      case 'meso_daily_boss':
        return <Coins className="w-4 h-4 text-sky-500" />;
      case 'meso_weekly_boss':
        return <Coins className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'meso_black_mage':
        return <Coins className="w-4 h-4 text-red-500" />;
      case 'common_contents':
        return <Sparkles className="w-4 h-4 text-orange-500" />;
      case 'pip_toggle':
        return <Tv className="w-4 h-4 text-slate-500" />;
    }
  };

  // 개별 섹션 렌더링 함수
  const renderSection = (sectionId: ProgressPanelSectionId) => {
    switch (sectionId) {
      case 'total_rate':
        return (
          <div className={`p-4 rounded-2xl border text-center transition-all shadow-xs ${
            isGrandCompleted
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/20'
              : 'bg-white dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/90'
          }`}>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
              전체 달성률
            </p>

            <div className="relative w-28 h-28 mx-auto flex items-center justify-center my-1">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="10"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={`transition-all duration-500 ease-out ${
                    isGrandCompleted ? 'stroke-emerald-500' : 'stroke-orange-500'
                  }`}
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * grandPct) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-2xl font-black font-mono ${
                  isGrandCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {grandPct}%
                </span>
              </div>
            </div>
          </div>
        );

      case 'daily_tasks':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>일일 컨텐츠</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                {doneDailyTasks}/{totalDailyTasks}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${dailyPct}%` }}
              />
            </div>
          </div>
        );

      case 'daily_boss':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Crown className="w-3.5 h-3.5 text-sky-500" />
                <span>일일 보스</span>
              </div>
              <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
                {doneDailyBossTasks}/{totalDailyBossTasks}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300 rounded-full"
                style={{ width: `${dailyBossPct}%` }}
              />
            </div>
          </div>
        );

      case 'weekly_tasks':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>주간 컨텐츠</span>
              </div>
              <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                {doneWeeklyTasks}/{totalWeeklyTasks}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-rose-600 dark:bg-rose-500 transition-all duration-300 rounded-full"
                style={{ width: `${weeklyPct}%` }}
              />
            </div>
          </div>
        );

      case 'weekly_boss':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>주간 보스</span>
              </div>
              <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                {doneBossCount}/{totalBossThreshold}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${bossPct}%` }}
              />
            </div>
          </div>
        );

      case 'black_mage':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <BlackMageSilhouetteIcon size={14} className="text-[#bc364d]" />
                <span>검은 마법사</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#bc364d]">
                {doneBlackMageTasks}/{totalBlackMageTasks}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#bc364d] transition-all duration-300 rounded-full"
                style={{ width: `${blackMagePct}%` }}
              />
            </div>
          </div>
        );

      case 'custom_tasks':
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                <Plus className="w-3.5 h-3.5 text-zinc-800 dark:text-zinc-200" />
                <span>커스텀</span>
              </div>
              <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {doneCustomTasks}/{totalCustomTasks}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-zinc-800 dark:bg-zinc-200 transition-all duration-300 rounded-full"
                style={{ width: `${customPct}%` }}
              />
            </div>
          </div>
        );

      case 'meso_daily_boss':
        return (
          <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 rounded-2xl border border-sky-200/80 dark:border-sky-900/50 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-300">
              <div className="flex items-start gap-1.5 min-w-0">
                <Coins className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">일일 보스 결정석</span>
                  <span className="text-[10px] font-normal text-sky-700/80 dark:text-sky-400/80 leading-tight">(일주일 누적)</span>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400 flex-shrink-0">
                {earnedDailyBossWeeklyMeso >= 100000000
                  ? `${(earnedDailyBossWeeklyMeso / 100000000).toLocaleString(undefined, { minimumFractionDigits: earnedDailyBossWeeklyMeso % 100000000 === 0 ? 0 : 2, maximumFractionDigits: 2 })}억 메소`
                  : `${(earnedDailyBossWeeklyMeso / 10000).toLocaleString()}만 메소`
                }
              </span>
            </div>
          </div>
        );

      case 'meso_weekly_boss':
        return (
          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-900/50 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
              <div className="flex items-center gap-1.5 min-w-0">
                <Coins className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="truncate">주간 보스 결정석</span>
              </div>
              <span className="font-mono text-sm font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">
                {earnedBossMeso >= 100000000
                  ? `${(earnedBossMeso / 100000000).toLocaleString(undefined, { minimumFractionDigits: earnedBossMeso % 100000000 === 0 ? 0 : 2, maximumFractionDigits: 2 })}억 메소`
                  : `${(earnedBossMeso / 10000).toLocaleString()}만 메소`
                }
              </span>
            </div>
          </div>
        );

      case 'meso_black_mage':
        return (
          <div className="p-3 bg-black dark:bg-black rounded-2xl border border-red-600 dark:border-red-500 shadow-xs">
            <div className="flex items-center justify-between text-xs font-bold text-red-500 dark:text-red-400">
              <div className="flex items-center gap-1.5 min-w-0">
                <Coins className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span className="truncate text-red-500 dark:text-red-400">검은 마법사 결정석</span>
              </div>
              <span className="font-mono text-sm font-bold text-red-500 dark:text-red-400 flex-shrink-0">
                {earnedBlackMageMeso >= 100000000
                  ? `${(earnedBlackMageMeso / 100000000).toLocaleString(undefined, { minimumFractionDigits: earnedBlackMageMeso % 100000000 === 0 ? 0 : 2, maximumFractionDigits: 2 })}억 메소`
                  : `${(earnedBlackMageMeso / 10000).toLocaleString()}만 메소`
                }
              </span>
            </div>
          </div>
        );

      case 'common_contents':
        return (
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>계정 컨텐츠</span>
                {accountAlertStatus?.hasAlert && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500 text-white animate-pulse shadow-2xs">
                    리셋 임박 {accountAlertStatus.incompleteTasks.length}개
                  </span>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setModalEditingApiKeyId(effectiveApiKeyId);
                  setIsConfigOpen(true);
                }}
                className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                title="계정 컨텐츠 항목 편집"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 다계정 등록 시: '계정 컨텐츠' 바로 아래 줄에 등록된 API 별칭 표시 및 클릭 시 전환 (줄바꿈 wrap 지원 + Seamless Motion) */}
            {accountIndicatorItems.length >= 2 && (
              <div 
                className="flex flex-wrap items-center gap-1.5 py-1 select-none relative"
                title="등록된 계정 목록 (클릭하여 해당 계정의 계정 컨텐츠 현황 보기)"
              >
                {accountIndicatorItems.map((acc) => {
                  const isSelected = acc.id === effectiveApiKeyId;
                  const accStatus = accountCommonStatusMap[acc.id];
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedCommonApiKeyId(acc.id)}
                      className={`relative px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap cursor-pointer focus:outline-hidden transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeProgressAccountPill"
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-xs"
                          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{acc.alias}</span>
                      {accStatus && accStatus.total > 0 && (
                        <span className={`relative z-10 text-[9px] px-1 py-0.2 rounded-full font-medium ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : accStatus.isAllDone
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {accStatus.done}/{accStatus.total}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {displayedCommonContents.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                <p>활성화된 계정 컨텐츠가 없습니다.</p>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(true)}
                  className="mt-1 text-orange-500 font-bold hover:underline"
                >
                  편집에서 추가하기
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {displayedCommonContents.map((item) => {
                  if (item.id === 'daily_monster_park') {
                    const isMpAlert = !isMonsterParkCompleted && !!accountAlertStatus?.dailyAlert;
                    return (
                      <div
                        key={item.id}
                        onClick={() => onToggleCommonTask?.('daily_monster_park', !isMonsterParkCompleted, undefined, effectiveApiKeyId, effectiveCommonChars[0]?.id)}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between shadow-xs cursor-pointer select-none hover:opacity-90 ${
                          isMpAlert
                            ? 'border-2 border-red-500 shadow-md alert-pulse-red bg-red-50/20 dark:bg-red-950/20'
                            : isMonsterParkCompleted
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
                        }`}
                        title="클릭하여 완료/미완료 토글"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <MapleIcon
                            name={item.name}
                            icon={item.icon}
                            fallback={item.fallbackIcon}
                            className="w-9 h-9 rounded-xl object-contain flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${isMonsterParkCompleted ? 'text-amber-900 dark:text-amber-200 line-through' : 'text-slate-900 dark:text-white'}`}>
                                {item.name}
                              </p>
                              {isMpAlert && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500 text-white shadow-2xs">
                                  임박
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                            isMonsterParkCompleted
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : isMpAlert
                              ? 'border-red-400 bg-red-100 dark:bg-red-950 text-transparent'
                              : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-transparent'
                          }`}
                        >
                          {isMonsterParkCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  }

                  const isDone = epicDungeonList.find((e) => e.id === item.id)?.isCompleted;
                  const isEpicAlert = !isDone && !!accountAlertStatus?.weeklyAlert;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleCommonTask?.(item.id, !isDone, undefined, effectiveApiKeyId, effectiveCommonChars[0]?.id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between shadow-xs cursor-pointer select-none hover:opacity-90 ${
                        isEpicAlert
                          ? 'border-2 border-red-500 shadow-md alert-pulse-red bg-red-50/20 dark:bg-red-950/20'
                          : isDone
                          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700'
                      }`}
                      title="클릭하여 완료/미완료 토글"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                        <MapleIcon
                          name={item.name}
                          icon={item.icon}
                          fallback={item.fallbackIcon}
                          className="w-9 h-9 rounded-xl object-contain flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-xs font-bold truncate ${isDone ? 'text-rose-900 dark:text-rose-200 line-through' : 'text-slate-900 dark:text-white'}`}>
                              {item.name}
                            </p>
                            {isEpicAlert && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500 text-white shadow-2xs">
                                임박
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                          isDone
                            ? 'bg-rose-500 border-rose-500 text-white'
                            : isEpicAlert
                            ? 'border-red-400 bg-red-100 dark:bg-red-950 text-transparent'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-transparent'
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'pip_toggle':
        if (!supportsPiP) return null;
        return (
          <div className="pt-2 pb-1 px-1 flex items-center justify-end gap-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              PIP
            </span>

            <SwitchToggle
              id="switch-pip-toggle-panel"
              checked={!!pip.enabled}
              onChange={handleTogglePip}
              size="sm"
              ariaLabel={pip.enabled ? 'PIP 끄기' : 'PIP 켜기'}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <aside 
      id="progress-panel"
      className="w-full lg:w-80 bg-slate-50/90 dark:bg-slate-950/80 border-l border-slate-200/80 dark:border-slate-800/80 flex flex-col flex-shrink-0 select-none overflow-y-auto custom-scrollbar"
    >
      {/* 1. 상단 타이틀 및 컨트롤 버튼 (즐겨찾기 필터 & UI 편집 버튼) */}
      <div className="p-4 flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider truncate">
            진행 현황
          </h3>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* 즐겨찾기만 토글 버튼 */}
          <button
            type="button"
            onClick={handleToggleFavorites}
            className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center border flex-shrink-0 ${
              onlyFavorites
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title={onlyFavorites ? '즐겨찾기 필터 해제 (전체 캐릭터 보기)' : '즐겨찾기 등록된 캐릭터만 통계에 반영'}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white text-white' : 'text-amber-500 fill-amber-500/20'}`} />
          </button>

          {/* 진행 현황 UI 항목 편집 버튼 */}
          <button
            type="button"
            onClick={() => setIsEditUiModalOpen(true)}
            className="w-7 h-7 rounded-xl transition-all flex items-center justify-center border flex-shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
            title="진행 현황 UI 편집 (항목 선택 및 순서 변경)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. 패널 본문 */}
      {targetCharacters.length === 0 ? (
        <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center flex-1">
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {onlyFavorites ? '즐겨찾기된 캐릭터가 없습니다.' : '등록된 캐릭터가 없습니다.'}
          </p>
          {onlyFavorites && (
            <button
              type="button"
              onClick={handleToggleFavorites}
              className="mt-2 text-xs font-bold text-orange-500 hover:underline"
            >
              전체 캐릭터 보기
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 pb-5 pt-1 space-y-3.5">
          {filteredSections.map((sec) => {
            if (!sec.visible) return null;
            return (
              <React.Fragment key={sec.id}>
                {renderSection(sec.id)}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 3. 진행 현황 UI 편집 모달 (순서 변경 및 노출 여부 선택) */}
      {isEditUiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* 모달 헤더 */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  진행 현황 UI 편집
                </h3>
              </div>
            </div>

            {/* 모달 본문 리스트 */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {filteredSections.map((sec, index) => {
                const isFirst = index === 0;
                const isLast = index === filteredSections.length - 1;
                return (
                  <div
                    key={sec.id}
                    className={`p-2.5 px-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                      sec.visible
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-60'
                    }`}
                  >
                    {/* 순서 이동 버튼들 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveSectionUp(index)}
                        disabled={isFirst}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isFirst
                            ? 'border-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title="위로 이동"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSectionDown(index)}
                        disabled={isLast}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          isLast
                            ? 'border-transparent text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title="아래로 이동"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 아이콘 및 라벨 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getSectionIcon(sec.id)}
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {sec.label}
                      </span>
                    </div>

                    {/* 노출/숨김 토글 버튼 */}
                    <button
                      type="button"
                      onClick={() => handleToggleSectionVisibility(sec.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border flex-shrink-0 ${
                        sec.visible
                          ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'
                          : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                      title={sec.visible ? '숨기기' : '표시하기'}
                    >
                      {sec.visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>표시</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>숨김</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* 모달 푸터 */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetSections}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="기본 순서 및 전체 표시로 초기화"
              >
                <RotateCcw className="w-3 h-3" />
                <span>기본값 초기화</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditUiModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-colors"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 계정 공통 컨텐츠 항목 편집 모달 */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* 모달 헤더 (요구사항 8: X 버튼 제거) */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  계정 컨텐츠 편집
                </h3>
              </div>
            </div>

            {/* 다계정 등록 시: 계정 컨텐츠 편집 대상 API 선택 탭 (줄바꿈 wrap 지원) */}
            {accountIndicatorItems.length >= 2 && (
              <div className="px-4 pt-3 pb-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {accountIndicatorItems.map((acc) => {
                    const isSelected = modalEditingApiKeyId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setModalEditingApiKeyId(acc.id)}
                        className={`relative px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap cursor-pointer focus:outline-hidden transition-all duration-200 ${
                          isSelected
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {acc.alias}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 모달 본문 */}
            <div className="p-4 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
              {ALL_COMMON_CONTENTS.map((item) => {
                const isSelected = modalEditingEnabledIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCommonContent(item.id)}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                      isSelected
                        ? item.type === 'daily'
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <MapleIcon
                        name={item.name}
                        icon={item.icon}
                        fallback={item.fallbackIcon}
                        className="w-9 h-9 rounded-xl object-contain flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                        isSelected
                          ? item.type === 'daily'
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-rose-600 border-rose-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 모달 푸터 */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-colors"
              >
                완료
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
});
