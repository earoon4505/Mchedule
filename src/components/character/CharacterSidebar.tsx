import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Star, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  SlidersHorizontal,
  Crown,
  Calendar,
  Flame,
  Check,
  X,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { BlackMageSilhouetteIcon } from '../common/BlackMageIcon';
import { CharacterInfo, CharacterProgressRecord, AppSettings, ApiKeyItem } from '../../types';
import { APP_LOGO_SRC, onLogoError } from '../../utils/image';
import { WEEKLY_BOSSES } from '../../data/defaultTasks';
import { CharacterAvatar } from './CharacterAvatar';
import { getCharacterCompletionStatus } from '../../utils/schedulerParser';
import { CharacterAlertStatus } from '../../utils/alertNotifier';

interface CharacterSidebarProps {
  characters: CharacterInfo[];
  records: Record<string, CharacterProgressRecord>;
  activeCharacterId: string | null;
  apiKeys?: ApiKeyItem[];
  settings?: AppSettings;
  characterAlertMap?: Record<string, CharacterAlertStatus>;
  onSelectCharacter: (id: string) => void;
  onOpenAddModal: () => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onMoveCharacter: (id: string, direction: 'up' | 'down', e: React.MouseEvent) => void;
  onDeleteCharacter: (id: string) => void;
  onOpenContentConfig: (id: string, e: React.MouseEvent) => void;
  onSelectTab?: (tab: 'all' | 'daily' | 'daily_boss' | 'weekly' | 'bosses' | 'custom') => void;
  onOpenLegalModal?: (tab?: 'terms' | 'privacy') => void;
}

export const CharacterSidebar: React.FC<CharacterSidebarProps> = React.memo(({
  characters,
  records,
  activeCharacterId,
  apiKeys = [],
  settings,
  characterAlertMap,
  onSelectCharacter,
  onOpenAddModal,
  onToggleFavorite,
  onMoveCharacter,
  onDeleteCharacter,
  onOpenContentConfig,
  onSelectTab,
  onOpenLegalModal,
}) => {
  // 인라인 삭제 확인 상태 (캐릭터 ID)
  const [deletingCharId, setDeletingCharId] = useState<string | null>(null);
  // 계정 필터 상태 ('all' 또는 특정 apiKeyId)
  const [selectedApiKeyFilter, setSelectedApiKeyFilter] = useState<string>('all');

  // 등록된 API 키의 ID -> 별칭 맵 생성 (캐릭터 객체 내 apiKeyAlias 자가 치유 폴백 지원)
  const accountAliasMap = useMemo(() => {
    const map = new Map<string, string>();
    apiKeys.forEach((key, idx) => {
      if (key.id) {
        map.set(key.id, key.alias?.trim() || `계정 ${idx + 1}`);
      }
    });
    // 캐릭터에 기록된 apiKeyAlias로부터 초고속 폴백 채우기
    characters.forEach((c) => {
      if (c.apiKeyId && !map.has(c.apiKeyId) && c.apiKeyAlias) {
        map.set(c.apiKeyId, c.apiKeyAlias);
      }
    });
    return map;
  }, [apiKeys, characters]);

  // 캐릭터가 속한 계정 목록 추출 (2개 이상의 계정이 있을 때만 필터 및 뱃지 표시)
  const availableAccountList = useMemo(() => {
    const keySet = new Set<string>();
    characters.forEach((char) => {
      if (char.apiKeyId && accountAliasMap.has(char.apiKeyId)) {
        keySet.add(char.apiKeyId);
      }
    });
    const fromApiKeys = apiKeys.filter((key) => key.id && keySet.has(key.id));
    if (fromApiKeys.length > 0) return fromApiKeys;
    return Array.from(keySet).map((id, idx) => ({
      id,
      alias: accountAliasMap.get(id) || `계정 ${idx + 1}`,
      apiKey: '',
      createdAt: '',
    }));
  }, [characters, apiKeys, accountAliasMap]);

  const hasMultipleAccounts = availableAccountList.length >= 2;

  // 선택된 계정 필터 적용 캐릭터 목록
  const displayedCharacters = useMemo(() => {
    if (!hasMultipleAccounts || selectedApiKeyFilter === 'all') {
      return characters;
    }
    return characters.filter((c) => c.apiKeyId === selectedApiKeyFilter);
  }, [characters, hasMultipleAccounts, selectedApiKeyFilter]);

  const handleConfirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteCharacter(id);
    setDeletingCharId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCharId(null);
  };

  return (
    <aside 
      id="character-sidebar"
      className="w-full lg:w-72 lg:min-w-[280px] lg:max-w-[288px] bg-slate-50/90 dark:bg-slate-950/80 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col flex-shrink-0 select-none overflow-hidden"
    >
      {/* 사이드바 헤더 */}
      <div className="p-3.5 pb-2 flex flex-col gap-2 flex-shrink-0">
        <button
          id="btn-add-character"
          onClick={onOpenAddModal}
          className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
          title="NEXON API 검색 또는 수동 캐릭터 추가"
        >
          <Plus className="w-4 h-4" />
          <span>캐릭터 추가</span>
        </button>

        {/* 다계정 등록 시: 계정별 캐릭터 필터 탭 */}
        {hasMultipleAccounts && (
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <button
              type="button"
              onClick={() => setSelectedApiKeyFilter('all')}
              className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
                selectedApiKeyFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              전체
            </button>
            {availableAccountList.map((acc, idx) => {
              const alias = acc.alias?.trim() || `계정 ${idx + 1}`;
              const isSelected = selectedApiKeyFilter === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedApiKeyFilter(acc.id)}
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer truncate max-w-[100px] ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-2xs'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={alias}
                >
                  {alias}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 캐릭터 목록 스크롤 뷰 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {displayedCharacters.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 flex items-center justify-center p-2 shadow-xs">
              <img
                src={APP_LOGO_SRC}
                alt="메케줄"
                className="w-full h-full object-contain"
                onError={onLogoError}
              />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {characters.length === 0 ? '등록된 캐릭터가 없습니다' : '해당 계정에 등록된 캐릭터가 없습니다'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {displayedCharacters.map((char, index) => {
              const isActive = char.id === activeCharacterId;
              const isDeletingThis = deletingCharId === char.id;
              const rec = records?.[char.id];

              const status = getCharacterCompletionStatus(char, rec, {
                includeCustom: settings?.includeCustomInCompletion,
                includeBlackMage: settings?.includeBlackMageInCompletion,
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
              const isCardAlerting = !!charAlert?.hasAnyAlert;

              return (
                <motion.div
                  key={char.id}
                  id={`character-card-${char.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`group relative p-3 rounded-2xl border transition-colors cursor-pointer ${
                    isCardAlerting
                      ? 'border-red-500 shadow-md alert-pulse-red bg-red-50 dark:bg-slate-900'
                      : isAllCompleted
                      ? isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-500/40'
                        : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 shadow-xs'
                      : isActive
                      ? 'bg-white dark:bg-slate-900 border-orange-400 dark:border-orange-500 shadow-sm ring-2 ring-orange-500/20 dark:ring-orange-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs hover:shadow-sm'
                  }`}
                >
                {/* 1. 캐릭터 기본 헤더 (프로필 사진과 닉네임/정보를 세로 중앙 정렬) */}
                <div className="flex items-center gap-3">
                  {/* 프로필 사진 컨테이너 */}
                  <CharacterAvatar
                    imageUrl={char.characterImage}
                    name={char.characterName}
                    size="xl"
                    isAllCompleted={isAllCompleted}
                    favorite={char.favorite}
                  />

                  <div className="flex-1 min-w-0">
                    {/* 1행: 캐릭터 이름 / 완료 뱃지 (좌) & 레벨 뱃지 (우) */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
                        {char.syncError && (
                          <span 
                            title={char.syncErrorMessage || '캐릭터 정보를 불러올 수 없습니다. 닉네임이나 서버 변경 여부를 확인해주세요.'}
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white flex-shrink-0 shadow-xs flex items-center gap-0.5"
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>연결 실패</span>
                          </span>
                        )}
                      </div>
                      
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                        isAllCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        Lv.{char.characterLevel}
                      </span>
                    </div>

                    {/* 2행: 서버 및 직업 정보 (좌) & 다중 계정 식별 뱃지 (우) - 동일한 2번째 줄 양 끝 배치 */}
                    <div className="flex items-center justify-between gap-1.5 mt-1 min-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate min-w-0">
                        {char.worldName} · {char.characterClass || '직업 미지정'}
                      </p>
                      {hasMultipleAccounts && char.apiKeyId && accountAliasMap.has(char.apiKeyId) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100/80 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 tracking-tight whitespace-nowrap flex-shrink-0 max-w-[80px] truncate">
                          {accountAliasMap.get(char.apiKeyId)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. 하단 현황 뱃지 (3열 2행 구성: a1 일일 / a2 일보 / a3 검마, b1 주간 / b2 주보 / b3 커스텀) */}
                <div className="mt-2.5 grid grid-cols-3 gap-1 text-[9.5px]">
                  {/* a1. 일일 퀘스트 뱃지 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCharacter(char.id);
                      onSelectTab?.('daily');
                    }}
                    title="일일 컨텐츠 현황"
                    className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors ${
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
                    title="일일 보스 현황"
                    className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors ${
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

                  {/* a3. 검은 마법사 뱃지 (미클리어 시 검정 배경에 빨간 테두리 폰트, 완료 시 초록색 완료) */}
                  {char.selectedBlackMageId ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('bosses');
                      }}
                      title="검은 마법사 현황"
                      className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors ${
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
                  ) : rec?.blackMage?.completed ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('bosses');
                      }}
                      title="검은 마법사 현황 (미선택 처치)"
                      className="flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border border-transparent transition-colors text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 font-bold"
                    >
                      <BlackMageSilhouetteIcon size={11} className="flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">검마 1/1</span>
                    </button>
                  ) : (
                    <div
                      title="검은 마법사 미등록"
                      className="flex items-center justify-center gap-1 font-medium py-1 px-1 rounded border border-transparent text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/40 select-none"
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
                    title="주간 컨텐츠 현황"
                    className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors ${
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
                    title="주간 보스 현황"
                    className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors ${
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

                  {/* b3. 커스텀 뱃지 (완료 시 일일/주간과 동일한 초록색 완료 스타일) */}
                  {(char.customTasks && char.customTasks.length > 0) ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCharacter(char.id);
                        onSelectTab?.('custom');
                      }}
                      title="커스텀 스케줄 현황"
                      className={`flex items-center justify-center gap-1 font-semibold py-1 px-1 rounded border transition-colors ${
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
                      className="flex items-center justify-center gap-1 font-medium py-1 px-1 rounded border border-transparent text-slate-400 dark:text-slate-600 bg-slate-100/50 dark:bg-slate-900/40 select-none"
                    >
                      <span className="truncate">커스텀 -</span>
                    </div>
                  )}
                </div>

                {/* 3. 호버 시 노출되는 도구 아이콘 모음 */}
                {!isDeletingThis && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-lg p-1 border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-xs z-10">
                    <button
                      onClick={(e) => onOpenContentConfig(char.id, e)}
                      className="p-1 rounded text-slate-500 hover:text-orange-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="스케줄 설정"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => onToggleFavorite(char.id, e)}
                      className={`p-1 rounded ${char.favorite ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'} hover:bg-slate-100 dark:hover:bg-slate-800`}
                      title="즐겨찾기"
                    >
                      <Star className="w-3 h-3" fill={char.favorite ? 'currentColor' : 'none'} />
                    </button>
                    {index > 0 && (
                      <button
                        onClick={(e) => onMoveCharacter(char.id, 'up', e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {index < characters.length - 1 && (
                      <button
                        onClick={(e) => onMoveCharacter(char.id, 'down', e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingCharId(char.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="캐릭터 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* 4. 확실하고 즉각적인 삭제 확인 오버레이 ('X 취소'가 한 줄로 나란히 표시) */}
                {isDeletingThis && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl flex items-center justify-between px-3 py-2 border border-rose-300 dark:border-rose-900 z-20 animate-in fade-in duration-150"
                  >
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate mr-1.5">
                      캐릭터를 삭제할까요?
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleConfirmDelete(char.id, e)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex flex-row items-center gap-1 shadow-xs transition-colors whitespace-nowrap"
                      >
                        <Check className="w-3 h-3 flex-shrink-0" />
                        <span>삭제</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDelete}
                        className="px-2 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex flex-row items-center gap-1 whitespace-nowrap"
                      >
                        <X className="w-3 h-3 flex-shrink-0" />
                        <span>취소</span>
                      </button>
                    </div>
                  </div>
                )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* 좌측 하단 초슬림 법적 고지 및 약관 바 (면적 최소화: 28px) */}
      <div 
        id="sidebar-legal-footer"
        className="px-3 py-1.5 border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-100/50 dark:bg-slate-900/50 flex-shrink-0 text-[10px] text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-0.5 select-none"
      >
        <span className="text-[9px] tracking-tight font-medium text-slate-400/90 dark:text-slate-500/90">
          Data based on NEXON Open API
        </span>
        <div className="flex items-center gap-1.5 font-medium leading-none">
          <button
            type="button"
            onClick={() => onOpenLegalModal?.('terms')}
            className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline transition-colors cursor-pointer"
          >
            이용약관
          </button>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <button
            type="button"
            onClick={() => onOpenLegalModal?.('privacy')}
            className="hover:text-slate-700 dark:hover:text-slate-200 hover:underline transition-colors cursor-pointer"
          >
            개인정보처리방침
          </button>
        </div>
      </div>
    </aside>
  );
});
