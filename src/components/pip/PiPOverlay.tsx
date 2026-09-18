import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  Calendar, 
  Flame, 
  Crown,
  Check,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { BlackMageSilhouetteIcon } from '../common/BlackMageIcon';
import { CharacterInfo, CharacterProgressRecord, AppSettings, PipSettings, ApiKeyItem } from '../../types';
import { CharacterAvatar } from '../character/CharacterAvatar';
import { WEEKLY_BOSSES } from '../../data/defaultTasks';
import { 
  ALL_COMMON_CONTENTS, 
  DEFAULT_COMMON_CONTENT_IDS,
  getStoredCommonContentsMap, 
  getStoredCommonContentIds, 
  isCommonTaskCompleted,
  CommonContentItem
} from '../../utils/commonContents';
import { MapleIcon } from '../common/MapleIcon';
import { getCharacterCompletionStatus } from '../../utils/schedulerParser';
import { 
  CharacterAlertStatus, 
  AccountAlertStatus, 
  evaluateAccountAlerts, 
  getResetAlertActiveMap 
} from '../../utils/alertNotifier';
import { AccountIndicatorBar } from './AccountIndicatorBar';
import { buildAccountIndicatorItems, getStoredApiKeys } from '../../utils/accountHelper';
import { fetchApiKeys } from '../../services/api';
import { subscribeToApiKeys, subscribeToCommonContents } from '../../utils/syncChannel';
import { motion, AnimatePresence } from 'motion/react';

interface PiPOverlayProps {
  characters: CharacterInfo[];
  records: Record<string, CharacterProgressRecord>;
  activeCharacterId: string | null;
  settings: AppSettings;
  characterAlertMap?: Record<string, CharacterAlertStatus>;
  accountAlertStatus?: AccountAlertStatus;
  onSelectCharacter: (id: string) => void;
  onSelectTab?: (tab: 'all' | 'daily' | 'daily_boss' | 'weekly' | 'bosses' | 'custom') => void;
  onToggleCommonTask?: (taskId: string, completed: boolean, count?: number, targetApiKeyId?: string, targetCharacterId?: string) => void;
}

export const PiPOverlay: React.FC<PiPOverlayProps> = React.memo(({
  characters = [],
  records = {},
  activeCharacterId,
  settings,
  characterAlertMap,
  accountAlertStatus,
  onSelectCharacter,
  onSelectTab,
  onToggleCommonTask,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rootContainerRef = useRef<HTMLDivElement>(null);

  const effectiveAccountAlertStatus = useMemo<AccountAlertStatus>(() => {
    if (accountAlertStatus) return accountAlertStatus;
    if (!settings?.notifier?.enabled) {
      return { hasAlert: false, incompleteTasks: [], dailyAlert: false, weeklyAlert: false };
    }
    const activeMap = getResetAlertActiveMap(settings.notifier);
    return evaluateAccountAlerts(characters, records, activeMap, settings);
  }, [accountAlertStatus, settings, characters, records]);

  const pip: PipSettings = settings.pip || {
    enabled: false,
    opacity: 100,
    direction: 'horizontal',
    align: 'right',
    position: 'top',
    hideCompleted: false,
    onlyFavorites: false,
    onlyAvatar: false,
    showCommonContent: false,
  };

  // 계정 공통 컨텐츠 설정 맵 (API별 독립 격리)
  const [commonContentsMap, setCommonContentsMap] = useState<Record<string, string[]>>(getStoredCommonContentsMap);
  // 등록된 API 키(계정) 목록
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(getStoredApiKeys);

  useEffect(() => {
    fetchApiKeys().then((res) => {
      if (res.success && res.keys) {
        setApiKeys(res.keys);
      }
    }).catch(() => {});

    const unsubscribe = subscribeToApiKeys((updated) => {
      if (Array.isArray(updated)) {
        setApiKeys(updated);
      }
    });

    const unsubscribeCommon = subscribeToCommonContents((map) => {
      if (map && typeof map === 'object') {
        setCommonContentsMap(map);
      }
    });

    const handleStorage = () => {
      setCommonContentsMap(getStoredCommonContentsMap());
      setApiKeys(getStoredApiKeys());
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      unsubscribeCommon();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const safeCharacters = Array.isArray(characters) ? characters : [];

  // 현재 활성 캐릭터 및 동일 소속 계정(apiKeyId) 캐릭터 필터링
  const currentActiveChar = useMemo(() => {
    return safeCharacters.find((c) => c.id === activeCharacterId) || safeCharacters[0];
  }, [safeCharacters, activeCharacterId]);

  const targetAccountChars = useMemo(() => {
    if (!currentActiveChar?.apiKeyId) return safeCharacters;
    const sameAccount = safeCharacters.filter((c) => c.apiKeyId === currentActiveChar.apiKeyId);
    return sameAccount.length > 0 ? sameAccount : safeCharacters;
  }, [safeCharacters, currentActiveChar]);

  // 현재 활성 계정에 해당하는 계정 공통 컨텐츠 ID 목록 산출
  const effectiveCommonIds = useMemo(() => {
    const key = currentActiveChar?.apiKeyId || 'default';
    return commonContentsMap[key] || commonContentsMap['default'] || DEFAULT_COMMON_CONTENT_IDS;
  }, [commonContentsMap, currentActiveChar?.apiKeyId]);

  // 등록된 API 키의 ID -> 별칭 맵 생성 (메인화면과 100% 동일한 별칭 매핑)
  const accountAliasMap = useMemo(() => {
    const map = new Map<string, string>();
    apiKeys.forEach((key, idx) => {
      if (key.id) {
        map.set(key.id, key.alias?.trim() || `계정 ${idx + 1}`);
      }
    });
    safeCharacters.forEach((c) => {
      if (c.apiKeyId && !map.has(c.apiKeyId) && c.apiKeyAlias) {
        map.set(c.apiKeyId, c.apiKeyAlias);
      }
    });
    return map;
  }, [apiKeys, safeCharacters]);

  const hasMultipleAccounts = useMemo(() => {
    const ids = new Set<string>();
    safeCharacters.forEach((c) => {
      ids.add(c.apiKeyId || 'default');
    });
    return ids.size > 1;
  }, [safeCharacters]);

  const activeCommonContents = useMemo(() => {
    if (!pip.showCommonContent) return [];
    const contents = ALL_COMMON_CONTENTS.filter((item) => effectiveCommonIds.includes(item.id));
    // 프로필 사진만 모드이면서 완료 숨김 옵션이 켜져 있을 때 완료된 공통 컨텐츠 숨김
    if (pip.onlyAvatar && pip.hideCompleted) {
      return contents.filter((item) => !isCommonTaskCompleted(item.id, targetAccountChars, records));
    }
    return contents;
  }, [pip.showCommonContent, effectiveCommonIds, pip.onlyAvatar, pip.hideCompleted, targetAccountChars, records]);

  // PiP 카드 노출 개수 (기본값: 가로 6, 세로 4 / 최소 1 ~ 최대 8)
  const visibleCount = Math.max(1, Math.min(8, pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4)));

  // 카드 치수 상수 정의 (메인 화면 사이드바 카드 비율과 100% 일치하도록 조정)
  const CARD_W = pip.onlyAvatar ? 56 : 280;
  const CARD_H = pip.onlyAvatar ? 56 : 142;
  const GAP = 8;
  const INNER_PAD = 8;

  // 마우스 휠 이벤트 (휠 1회 회전당 정확히 카드 1개 크기+간격만큼 스냅 이동)
  useEffect(() => {
    if (!pip.enabled) return;

    const handleNativeWheel = (e: WheelEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const cardStep = (pip.direction === 'horizontal' ? CARD_W : CARD_H) + GAP;

      if (pip.direction === 'horizontal') {
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (delta !== 0) {
          const direction = delta > 0 ? 1 : -1;
          const currentTarget = Math.round(container.scrollLeft / cardStep) * cardStep;
          const nextTarget = currentTarget + direction * cardStep;
          container.scrollTo({
            left: Math.max(0, nextTarget),
            behavior: 'smooth',
          });
          e.preventDefault();
        }
      } else {
        if (e.deltaY !== 0) {
          const direction = e.deltaY > 0 ? 1 : -1;
          const currentTarget = Math.round(container.scrollTop / cardStep) * cardStep;
          const nextTarget = currentTarget + direction * cardStep;
          container.scrollTo({
            top: Math.max(0, nextTarget),
            behavior: 'smooth',
          });
          e.preventDefault();
        }
      }
    };

    const rootEl = rootContainerRef.current;
    if (rootEl) {
      rootEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    }

    return () => {
      if (rootEl) {
        rootEl.removeEventListener('wheel', handleNativeWheel);
      }
    };
  }, [pip.enabled, pip.direction, CARD_W, CARD_H, GAP]);

  if (!pip.enabled) return null;

  // 프로필 사진만 표시 모드(onlyAvatar)이면서 다계정 환경인 경우, 현재 활성 계정의 캐릭터들만 선별
  const baseCharacters = useMemo(() => {
    if (pip.onlyAvatar && currentActiveChar?.apiKeyId) {
      const hasMultipleAccounts = safeCharacters.some((c) => c.apiKeyId && c.apiKeyId !== currentActiveChar.apiKeyId);
      if (hasMultipleAccounts) {
        const filtered = safeCharacters.filter((c) => c.apiKeyId === currentActiveChar.apiKeyId);
        if (filtered.length > 0) return filtered;
      }
    }
    return safeCharacters;
  }, [safeCharacters, pip.onlyAvatar, currentActiveChar?.apiKeyId]);

  // 1. 캐릭터 필터링 (완료된 캐릭터 숨기기 + 즐겨찾기 필터)
  const visibleCharacters = useMemo(() => {
    return baseCharacters.filter((char) => {
      if (!char) return false;
      if (pip.onlyFavorites && !char.favorite) {
        return false;
      }

      const rec = records?.[char.id];
      const status = getCharacterCompletionStatus(char, rec, {
        includeCustom: settings.includeCustomInCompletion,
        includeBlackMage: settings.includeBlackMageInCompletion,
      });

      if (pip.hideCompleted && status.isAllCompleted) {
        return false;
      }
      return true;
    });
  }, [baseCharacters, pip.onlyFavorites, pip.hideCompleted, records, settings]);

  // 표시할 캐릭터와 계정 공통 컨텐츠 모두 없을 경우 null 반환
  if (visibleCharacters.length === 0 && activeCommonContents.length === 0) {
    return null;
  }

  // PiP 카드 노출 개수 (설정값과 실제 노출 가능한 캐릭터 수 중 최솟값으로 계산하여 빈 투명 공간 제거)
  const maxVisibleCount = Math.max(1, Math.min(8, pip.visibleCount ?? (pip.direction === 'horizontal' ? 6 : 4)));
  const totalAvatarItemCount = visibleCharacters.length + (pip.showCommonContent ? activeCommonContents.length : 0);
  const displayAvatarCount = Math.min(maxVisibleCount, Math.max(1, totalAvatarItemCount));
  const displayCharacterCount = Math.min(maxVisibleCount, Math.max(1, visibleCharacters.length));

  // 정확한 캐릭터 스크롤 컨테이너 크기 (실제 캐릭터 개수에 맞춰 정확히 산출)
  const countForDimension = pip.onlyAvatar ? displayAvatarCount : displayCharacterCount;
  const characterScrollStyle: React.CSSProperties = pip.direction === 'horizontal'
    ? {
        width: `${countForDimension * CARD_W + (countForDimension - 1) * GAP + INNER_PAD}px`,
        maxWidth: `${countForDimension * CARD_W + (countForDimension - 1) * GAP + INNER_PAD}px`,
        height: `${CARD_H + INNER_PAD}px`,
        maxHeight: `${CARD_H + INNER_PAD}px`,
        background: 'transparent',
        backgroundColor: 'transparent',
      }
    : {
        width: `${CARD_W + INNER_PAD}px`,
        maxWidth: `${CARD_W + INNER_PAD}px`,
        height: `${countForDimension * CARD_H + (countForDimension - 1) * GAP + INNER_PAD}px`,
        maxHeight: `${countForDimension * CARD_H + (countForDimension - 1) * GAP + INNER_PAD}px`,
        background: 'transparent',
        backgroundColor: 'transparent',
      };

  // 복수 계정 인디케이터 아이템 목록 계산
  const accountIndicatorItems = useMemo(() => {
    return buildAccountIndicatorItems(safeCharacters, activeCharacterId, apiKeys);
  }, [safeCharacters, activeCharacterId, apiKeys]);

  // 계정 공통 컨텐츠 클릭 토글 (현재 활성 캐릭터의 계정 기준으로 전달)
  const handleCommonTaskClick = (item: CommonContentItem) => {
    const isCurrentlyDone = isCommonTaskCompleted(item.id, targetAccountChars, records);
    onToggleCommonTask?.(item.id, !isCurrentlyDone, undefined, currentActiveChar?.apiKeyId, currentActiveChar?.id);
  };

  // 계정 공통 컨텐츠 렌더러 (일반 모드용)
  const renderFixedCommonContents = () => {
    if (!pip.showCommonContent || pip.onlyAvatar || activeCommonContents.length === 0) {
      return null;
    }

    // 1. 세로 모드일 때: 캐릭터 카드 맨 위에 가로 방향 일렬로 정렬 (너비: 캐릭터 카드 가로 길이 CARD_W = 280px 맞춤, 5개 이상 적응형 크기)
    if (pip.direction === 'vertical') {
      const isMany = activeCommonContents.length > 4;
      return (
        <div 
          id="pip-common-contents-top-bar"
          className={`w-[280px] min-w-[280px] max-w-[280px] ${
            isMany ? 'h-[58px] min-h-[58px] max-h-[58px]' : 'h-[64px] min-h-[64px] max-h-[64px]'
          } p-1 flex items-center justify-center ${
            isMany ? 'gap-2' : 'gap-2.5'
          } bg-transparent border-0 shadow-none box-border pointer-events-auto flex-shrink-0 overflow-x-auto no-scrollbar`}
        >
          {activeCommonContents.map((item) => {
            const isDone = isCommonTaskCompleted(item.id, targetAccountChars, records);
            const isItemAlerting = !isDone && (
              (item.type === 'daily' && !!effectiveAccountAlertStatus.dailyAlert) ||
              (item.type === 'weekly' && !!effectiveAccountAlertStatus.weeklyAlert)
            );
            return (
              <button
                key={item.id}
                type="button"
                id={`pip-common-item-${item.id}`}
                onClick={() => handleCommonTaskClick(item)}
                title={`[계정 컨텐츠] ${item.name} (${item.type === 'daily' ? '일일' : '주간'})\n${isDone ? '완료됨 (클리어)' : '미완료'}\n(클릭하여 완료 토글)`}
                className={`${
                  isMany 
                    ? 'w-[46px] h-[46px] min-w-[46px] min-h-[46px] max-w-[46px] max-h-[46px] p-1' 
                    : 'w-[52px] h-[52px] min-w-[52px] min-h-[52px] max-w-[52px] max-h-[52px] p-1'
                } aspect-square rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-sm relative select-none flex-shrink-0 ${
                  isItemAlerting
                    ? 'border-red-500 shadow-md alert-pulse-red bg-red-50 dark:bg-slate-900'
                    : isDone
                    ? item.type === 'daily'
                      ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-400 dark:border-amber-500 shadow-amber-500/20 ring-1 ring-amber-400/40'
                      : 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 dark:border-rose-500 shadow-rose-500/20 ring-1 ring-rose-400/40'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-orange-300'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <MapleIcon
                    name={item.name}
                    icon={item.icon}
                    fallback={item.fallbackIcon}
                    className={`${isMany ? 'w-7 h-7' : 'w-8 h-8'} object-contain rounded-lg transition-all ${
                      isDone ? 'grayscale-0 opacity-100 scale-105' : 'grayscale-50 opacity-60'
                    }`}
                  />
                  {isDone && (
                    <div className={`absolute -bottom-1 -right-1 ${isMany ? 'w-3.5 h-3.5 text-[8px]' : 'w-4 h-4 text-[9px]'} rounded-full text-white flex items-center justify-center shadow-xs font-bold ${
                      item.type === 'daily' ? 'bg-amber-500' : 'bg-rose-600'
                    }`}>
                      <Check className={`${isMany ? 'w-2 h-2' : 'w-2.5 h-2.5'} stroke-[3]`} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // 2. 가로 모드일 때: 2행 그리드 배치 (캐릭터 카드 높이 142px에 맞추어 54x54px 대형 아이콘 적용)
    const cols = Math.ceil(activeCommonContents.length / 2);
    const itemSize = 54;
    const gap = 8;
    const boxWidth = cols * itemSize + (cols - 1) * gap + 10;
    const isOdd = activeCommonContents.length % 2 !== 0;

    const renderCommonItemButton = (item: typeof activeCommonContents[0]) => {
      const isDone = isCommonTaskCompleted(item.id, targetAccountChars, records);
      const isItemAlerting = !isDone && (
        (item.type === 'daily' && !!effectiveAccountAlertStatus.dailyAlert) ||
        (item.type === 'weekly' && !!effectiveAccountAlertStatus.weeklyAlert)
      );
      return (
        <button
          key={item.id}
          type="button"
          id={`pip-common-item-${item.id}`}
          onClick={() => handleCommonTaskClick(item)}
          title={`[계정 컨텐츠] ${item.name} (${item.type === 'daily' ? '일일' : '주간'})\n${isDone ? '완료됨 (클리어)' : '미완료'}\n(클릭하여 완료 토글)`}
          className={`w-[54px] h-[54px] min-w-[54px] min-h-[54px] max-w-[54px] max-h-[54px] aspect-square rounded-2xl border flex items-center justify-center p-1 transition-all cursor-pointer shadow-sm relative select-none flex-shrink-0 ${
            isItemAlerting
              ? 'border-red-500 shadow-md alert-pulse-red bg-red-50 dark:bg-slate-900'
              : isDone
              ? item.type === 'daily'
                ? 'bg-amber-50 dark:bg-amber-950/80 border-amber-400 dark:border-amber-500 shadow-amber-500/20 ring-1 ring-amber-400/40'
                : 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 dark:border-rose-500 shadow-rose-500/20 ring-1 ring-rose-400/40'
              : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-orange-300'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <MapleIcon
              name={item.name}
              icon={item.icon}
              fallback={item.fallbackIcon}
              className={`w-9 h-9 object-contain rounded-lg transition-all ${
                isDone ? 'grayscale-0 opacity-100 scale-105' : 'grayscale-50 opacity-60'
              }`}
            />
            {isDone && (
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs text-[9px] font-bold ${
                item.type === 'daily' ? 'bg-amber-500' : 'bg-rose-600'
              }`}>
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
          </div>
        </button>
      );
    };

    return (
      <div 
        id="pip-common-contents-left-bar"
        style={{ width: `${boxWidth}px`, height: `${CARD_H}px` }}
        className="h-[142px] min-h-[142px] max-h-[142px] p-1 flex-shrink-0 bg-transparent border-0 shadow-none box-border pointer-events-auto flex items-center justify-center my-1"
      >
        {isOdd ? (
          <div className="flex items-center gap-2 h-full w-full justify-center">
            {/* 홀수 개수일 때: 왼쪽에 첫 번째 아이템(몬스터파크 등) 1개만 수직 중앙 단독 배치 */}
            <div className="flex flex-col items-center justify-center h-full flex-shrink-0">
              {renderCommonItemButton(activeCommonContents[0])}
            </div>
            {/* 나머지 아이템들: 오른쪽에 2행 그리드로 2개씩 깔끔하게 정렬 */}
            {activeCommonContents.length > 1 && (
              <div className="grid grid-rows-2 grid-flow-col gap-2 h-full items-center justify-center">
                {activeCommonContents.slice(1).map((item) => renderCommonItemButton(item))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-rows-2 grid-flow-col gap-2 h-full w-full items-center justify-center">
            {activeCommonContents.map((item) => renderCommonItemButton(item))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={rootContainerRef}
      id="pip-mode-overlay-container"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className="fixed top-4 right-4 z-40 pointer-events-none transition-all flex flex-col items-end select-none"
      style={{
        opacity: (pip.opacity ?? 100) / 100,
        WebkitUserDrag: 'none',
        userSelect: 'none',
      }}
    >
      {/* 복수 계정 등록 시 계정 인디케이터 (계정 컨텐츠 켜져 있을 때만 노출 / 세로: 가운데 / 가로: 맨 왼쪽 / 프로필 전용: 현재 별칭만) */}
      {accountIndicatorItems.length > 1 && pip.showCommonContent && (
        <div 
          className={`mb-1.5 flex items-center w-full ${
            pip.direction === 'horizontal' ? 'justify-start' : 'justify-center'
          }`}
        >
          <AccountIndicatorBar
            accounts={accountIndicatorItems}
            onlyCurrentAlias={pip.onlyAvatar}
            onSelectAccount={onSelectCharacter}
          />
        </div>
      )}

      {/* 전체 PiP 레이아웃 (세로 모드: 상단 계정공통 + 하단 캐릭터 스크롤 / 가로 모드: 좌측 계정공통 + 우측 캐릭터 스크롤) */}
      <div 
        className={`flex gap-2 items-start ${
          pip.direction === 'horizontal' ? 'flex-row' : 'flex-col items-center'
        }`}
      >
        {/* 일반 상세 모드일 때 고정 배치되는 계정 공통 컨텐츠 영역 */}
        {renderFixedCommonContents()}

        {/* 캐릭터 카드 목록 영역 (스크롤바 숨김 + 마우스 휠로 스크롤 이동) */}
        <div 
          ref={scrollContainerRef}
          style={characterScrollStyle}
          className={`pointer-events-auto flex gap-2 p-1 transition-all no-scrollbar ${
            pip.direction === 'horizontal'
              ? 'flex-row flex-nowrap overflow-x-auto overflow-y-hidden'
              : 'flex-col flex-nowrap overflow-y-auto overflow-x-hidden'
          }`}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {/* 프로필 사진만 표시 모드(onlyAvatar)일 경우: 맨 앞(상단/좌측)에 계정 공통 컨텐츠를 56x56px 아이콘으로 함께 스크롤되도록 배치 */}
            {pip.onlyAvatar && pip.showCommonContent && activeCommonContents.map((item) => {
              const isDone = isCommonTaskCompleted(item.id, targetAccountChars, records);
              const isItemAlerting = !isDone && (
                (item.type === 'daily' && !!effectiveAccountAlertStatus.dailyAlert) ||
                (item.type === 'weekly' && !!effectiveAccountAlertStatus.weeklyAlert)
              );
              return (
                <motion.div
                  key={`pip-avatar-common-${item.id}`}
                  id={`pip-card-avatar-common-${item.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                  onClick={() => handleCommonTaskClick(item)}
                  title={`[계정] ${item.name} (${item.type === 'daily' ? '일일' : '주간'})\n${isDone ? '완료됨 (클리어)' : '미완료'}\n(클릭하여 완료 토글)`}
                  className={`group relative p-1 rounded-2xl border transition-colors cursor-pointer select-none w-[56px] min-w-[56px] max-w-[56px] h-[56px] min-h-[56px] max-h-[56px] flex-shrink-0 shadow-none flex items-center justify-center box-border ${
                    isItemAlerting
                      ? 'border-2 border-red-500 alert-pulse-red bg-red-50/20 dark:bg-red-950/20'
                      : isDone
                      ? item.type === 'daily'
                        ? 'bg-amber-100 dark:bg-amber-950 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40'
                        : 'bg-rose-100 dark:bg-rose-950 border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/40'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300'
                  }`}
                >
                  <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center p-1 transition-all ${
                    isDone
                      ? item.type === 'daily'
                        ? 'bg-amber-200/60 dark:bg-amber-900/60'
                        : 'bg-rose-200/60 dark:bg-rose-900/60'
                      : 'bg-slate-100 dark:bg-slate-800/80'
                  }`}>
                    <MapleIcon
                      name={item.name}
                      icon={item.icon}
                      fallback={item.fallbackIcon}
                      className={`w-9 h-9 object-contain rounded-lg transition-all ${
                        isDone ? 'grayscale-0 opacity-100 scale-105' : 'grayscale-50 opacity-60'
                      }`}
                    />
                    {isDone && (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs text-[10px] font-bold ${
                        item.type === 'daily' ? 'bg-amber-500' : 'bg-rose-600'
                      }`}>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* 캐릭터 카드 목록 */}
            {visibleCharacters.map((char) => {
              const isActive = char.id === activeCharacterId;
              const rec = records?.[char.id];

              const status = getCharacterCompletionStatus(char, rec, {
                includeCustom: settings.includeCustomInCompletion,
                includeBlackMage: settings.includeBlackMageInCompletion,
              });
              const { 
                dailyTotal, 
                dailyDone, 
                dailyBossTotal, 
                dailyBossDone, 
                weeklyTotal, 
                weeklyDone, 
                bossThreshold, 
                clearedBossCount, 
                isDailyAllDone, 
                isDailyBossAllDone, 
                isWeeklyAllDone, 
                isBossAllDone, 
                isAllCompleted 
              } = status;

              const charAlert = characterAlertMap?.[char.id];
              const isAlerting = !!charAlert?.hasAnyAlert;

              // A. 프로필 사진만 표시 모드 (pip.onlyAvatar) - 56x56px 고정
              if (pip.onlyAvatar) {
                return (
                  <motion.div
                    key={char.id}
                    id={`pip-card-avatar-${char.id}`}
                    layout
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                    onClick={() => onSelectCharacter(char.id)}
                    title={`${char.characterName} (Lv.${char.characterLevel})\n일일 ${dailyDone}/${dailyTotal} · 일보 ${dailyBossDone}/${dailyBossTotal} · 주간 ${weeklyDone}/${weeklyTotal} · 주보 ${clearedBossCount}/${bossThreshold}`}
                    className={`group relative p-1 rounded-2xl border transition-colors cursor-pointer select-none w-[56px] min-w-[56px] max-w-[56px] h-[56px] min-h-[56px] max-h-[56px] flex-shrink-0 shadow-none flex items-center justify-center box-border ${
                      isAlerting
                        ? 'border-red-500 alert-pulse-red bg-red-50 dark:bg-slate-900'
                        : isAllCompleted
                        ? isActive
                          ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 ring-2 ring-emerald-400'
                          : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-400 hover:border-emerald-500'
                        : isActive
                        ? 'bg-orange-50 dark:bg-slate-900 border-orange-400 ring-2 ring-orange-400/60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300'
                    }`}
                  >
                    <CharacterAvatar
                      imageUrl={char.characterImage}
                      name={char.characterName}
                      size="custom"
                      containerClassName="w-11 h-11 rounded-xl"
                      isAllCompleted={isAllCompleted}
                      favorite={char.favorite}
                    />
                  </motion.div>
                );
              }

              // B. 일반 상세 카드 뷰 (메인 화면 사이드바 카드 비율과 동일하게 280x132px 적용)
              return (
                <motion.div
                  key={char.id}
                  id={`pip-card-${char.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -8 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                  onClick={() => onSelectCharacter(char.id)}
                  style={{
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    WebkitFontSmoothing: 'antialiased',
                  }}
                  className={`group relative p-3 rounded-2xl border transition-colors cursor-pointer select-none w-[280px] min-w-[280px] max-w-[280px] h-[142px] min-h-[142px] max-h-[142px] flex-shrink-0 shadow-none box-border flex flex-col justify-between overflow-hidden ${
                    isAlerting
                      ? 'border-red-500 alert-pulse-red bg-red-50 dark:bg-slate-900'
                      : isAllCompleted
                      ? isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 shadow-xs'
                      : isActive
                      ? 'bg-white dark:bg-slate-900 border-orange-400 dark:border-orange-500 shadow-sm ring-2 ring-orange-500/20 dark:ring-orange-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs hover:shadow-sm'
                  }`}
                >
                  {/* 1. 상단 캐릭터 기본 헤더 (프로필 사진과 닉네임/정보를 세로 중앙 정렬) */}
                  <div className="flex items-center gap-3 pointer-events-none">
                    <CharacterAvatar
                      imageUrl={char.characterImage}
                      name={char.characterName}
                      size="xl"
                      isAllCompleted={isAllCompleted}
                      favorite={char.favorite}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className={`text-sm font-bold truncate ${
                            isAllCompleted ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                          }`}>
                            {char.characterName}
                          </h3>
                          {isAllCompleted && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-white flex-shrink-0 shadow-xs">
                              완료
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isAllCompleted
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          Lv.{char.characterLevel}
                        </span>
                      </div>

                      {/* 2행: 서버 및 직업 정보 (좌) & 다중 계정 식별 뱃지 (우) */}
                      <div className="flex items-center justify-between gap-1.5 mt-1 min-w-0">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate min-w-0">
                          {char.worldName} · {char.characterClass || '직업 미지정'}
                        </p>
                        {hasMultipleAccounts && char.apiKeyId && (accountAliasMap.get(char.apiKeyId) || char.apiKeyAlias) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 tracking-tight whitespace-nowrap flex-shrink-0 max-w-[80px] truncate">
                            {accountAliasMap.get(char.apiKeyId) || char.apiKeyAlias}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. 하단 현황 뱃지 (메인 화면과 동일한 3열 2행 구성) */}
                  <div className="mt-2.5 grid grid-cols-3 gap-1 text-[9.5px]">
                    {/* a1. 일일 퀘스트 뱃지 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('daily');
                      }}
                      title="일일 컨텐츠 현황 (클릭 시 이동)"
                      className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors min-w-0 leading-tight whitespace-nowrap overflow-hidden ${
                        charAlert?.dailyAlert && !isDailyAllDone
                          ? 'text-red-700 dark:text-red-300 border-red-500 alert-badge-pulse font-bold'
                          : isDailyAllDone
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold border-transparent'
                          : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border-transparent'
                      }`}
                    >
                      <Calendar className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">일일 {dailyDone}/{dailyTotal}</span>
                    </button>

                    {/* a2. 일일 보스 뱃지 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('daily_boss');
                      }}
                      title="일일 보스 현황 (클릭 시 이동)"
                      className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors min-w-0 leading-tight whitespace-nowrap overflow-hidden ${
                        charAlert?.dailyBossAlert && !isDailyBossAllDone
                          ? 'text-red-700 dark:text-red-300 border-red-500 alert-badge-pulse font-bold'
                          : isDailyBossAllDone
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold border-transparent'
                          : 'text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 border-transparent'
                      }`}
                    >
                      <Crown className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">일보 {dailyBossDone}/{dailyBossTotal}</span>
                    </button>

                    {/* a3. 검은 마법사 뱃지 (메인 화면과 동일하게 미완료 시 검정 배경에 빨간 테두리 폰트, 완료 시 초록색 완료) */}
                    {char.selectedBlackMageId ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCharacter(char.id);
                          onSelectTab?.('bosses');
                        }}
                        title="검은 마법사 현황 (클릭 시 이동)"
                        className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors min-w-0 leading-tight whitespace-nowrap overflow-hidden ${
                          charAlert?.blackMageAlert && !status.isBlackMageDone
                            ? 'bg-black border-red-500 text-red-500 alert-pulse-red font-bold shadow-xs'
                            : status.isBlackMageDone
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold border-transparent'
                            : 'bg-black border-red-600 text-red-500 hover:bg-zinc-900 font-bold'
                        }`}
                      >
                        <BlackMageSilhouetteIcon size={11} className={`flex-shrink-0 ${status.isBlackMageDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`} />
                        <span className="truncate">검마 {status.isBlackMageDone ? 1 : 0}/1</span>
                      </button>
                    ) : (
                      <div
                        title="검은 마법사 미등록"
                        className="flex items-center justify-center gap-1 font-medium py-1 px-1 rounded border border-transparent text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/40 select-none min-w-0 leading-tight whitespace-nowrap overflow-hidden"
                      >
                        <span className="truncate">검마 -</span>
                      </div>
                    )}

                    {/* b1. 주간 퀘스트 뱃지 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('weekly');
                      }}
                      title="주간 컨텐츠 현황 (클릭 시 이동)"
                      className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors min-w-0 leading-tight whitespace-nowrap overflow-hidden ${
                        charAlert?.weeklyAlert && !isWeeklyAllDone
                          ? 'text-red-700 dark:text-red-300 border-red-500 alert-badge-pulse font-bold'
                          : isWeeklyAllDone
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold border-transparent'
                          : 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border-transparent'
                      }`}
                    >
                      <Flame className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">주간 {weeklyDone}/{weeklyTotal}</span>
                    </button>

                    {/* b2. 주간 보스 뱃지 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('bosses');
                      }}
                      title="주간 보스 현황 (클릭 시 이동)"
                      className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors min-w-0 leading-tight whitespace-nowrap overflow-hidden ${
                        charAlert?.bossAlert && !isBossAllDone
                          ? 'text-red-700 dark:text-red-300 border-red-500 alert-badge-pulse font-bold'
                          : isBossAllDone
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold border-transparent'
                          : 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 border-transparent'
                      }`}
                    >
                      <Crown className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">주보 {clearedBossCount}/{bossThreshold}</span>
                    </button>

                    {/* b3. 커스텀 컨텐츠 (완료 시 일일/주간과 동일한 초록색 완료 스타일) */}
                    {(char.customTasks && char.customTasks.length > 0) ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCharacter(char.id);
                          onSelectTab?.('custom');
                        }}
                        title="커스텀 스케줄 현황 (클릭 시 이동)"
                        className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors min-w-0 leading-tight whitespace-nowrap overflow-hidden ${
                          charAlert?.customAlert && !status.isCustomAllDone
                            ? 'text-red-700 dark:text-red-300 border-red-500 alert-badge-pulse font-bold'
                            : status.isCustomAllDone
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold border-transparent'
                            : 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-transparent'
                        }`}
                      >
                        <Plus className={`w-2.5 h-2.5 flex-shrink-0 stroke-[2.5] ${status.isCustomAllDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                        <span className="truncate">커스텀 {status.customDone}/{status.customTotal}</span>
                      </button>
                    ) : (
                      <div
                        title="커스텀 컨텐츠 미등록"
                        className="flex items-center justify-center gap-1 font-medium py-1 px-1 rounded border border-transparent text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/40 select-none min-w-0 leading-tight whitespace-nowrap overflow-hidden"
                      >
                        <span className="truncate">커스텀 -</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
