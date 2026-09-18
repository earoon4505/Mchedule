import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  AlertCircle,
  Check,
  Key,
  RefreshCw,
  Plus
} from 'lucide-react';
import { CharacterInfo, NexonAccountCharacter, ApiKeyItem } from '../../types';
import { fetchAccountCharacters, fetchNexonSchedulerState, fetchCharacterBasic } from '../../services/api';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getDefaultEnabledTasksForLevel, getDefaultBossesForLevel, getDefaultDailyBossesForLevel } from '../../data/defaultTasks';
import { extractInGameRegisteredTasks } from '../../utils/schedulerParser';
import { CharacterAvatar } from './CharacterAvatar';
import { getStoredApiKeys } from '../../utils/accountHelper';
import { motion } from 'motion/react';

interface CharacterSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCharacter: (char: CharacterInfo) => void;
  existingCharacters: CharacterInfo[];
  hasApiKey?: boolean;
  apiKeys?: ApiKeyItem[];
  onOpenApiKeyModal?: () => void;
}

export const CharacterSearchModal: React.FC<CharacterSearchModalProps> = ({
  isOpen,
  onClose,
  onAddCharacter,
  existingCharacters,
  hasApiKey = false,
  apiKeys,
  onOpenApiKeyModal,
}) => {
  const [accountCharacters, setAccountCharacters] = useState<NexonAccountCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorld, setSelectedWorld] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [justAddedNames, setJustAddedNames] = useState<Set<string>>(new Set());

  // 모달 열릴 때 API 캐릭터 목록 로드
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSearchQuery('');
      setSelectedWorld('all');
      setSelectedAccount('all');
      setJustAddedNames(new Set());
      loadApiCharacters(false);
    }
  }, [isOpen, hasApiKey]);

  const loadApiCharacters = async (force = false) => {
    if (!hasApiKey) return;
    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    const res = await fetchAccountCharacters(force);
    setIsLoading(false);
    setIsRefreshing(false);

    if (res.success && res.characters) {
      setAccountCharacters(res.characters);
    } else {
      setErrorMsg(res.error || 'API 계정 캐릭터 목록을 불러오지 못했습니다.');
    }
  };

  // 등록된 캐릭터 식별 셋 (이름 및 OCID 기준)
  const registeredCharNames = useMemo(() => {
    const set = new Set<string>();
    existingCharacters.forEach((c) => {
      set.add(c.characterName.toLowerCase());
      if (c.ocid) set.add(c.ocid);
    });
    return set;
  }, [existingCharacters]);

  // 고유 계정(API Key) 목록 추출 (등록 순서 정렬 보장)
  const availableAccounts = useMemo(() => {
    const map = new Map<string, { alias: string; count: number }>();
    accountCharacters.forEach((c) => {
      const keyId = c.apiKeyId || 'default';
      const alias = c.apiKeyAlias || '기본 계정';
      const existing = map.get(keyId);
      if (existing) {
        existing.count++;
      } else {
        map.set(keyId, { alias, count: 1 });
      }
    });

    const registeredKeys = apiKeys && apiKeys.length > 0 ? apiKeys : getStoredApiKeys();
    const result: { id: string; alias: string; count: number }[] = [];

    if (registeredKeys && registeredKeys.length > 0) {
      registeredKeys.forEach((k) => {
        if (map.has(k.id)) {
          const item = map.get(k.id)!;
          result.push({
            id: k.id,
            alias: k.alias || item.alias,
            count: item.count,
          });
          map.delete(k.id);
        }
      });
    }

    map.forEach((item, id) => {
      result.push({
        id,
        alias: item.alias,
        count: item.count,
      });
    });

    return result;
  }, [accountCharacters, apiKeys]);

  // 연결된 API가 2개 이상인지 여부 (1개 이하일 경우 API 별칭 뱃지 및 계정 필터 미표시)
  const isMultiAccount = useMemo(() => {
    const totalKeys = apiKeys && apiKeys.length > 0 ? apiKeys.length : getStoredApiKeys().length;
    return totalKeys >= 2 || availableAccounts.length >= 2;
  }, [apiKeys, availableAccounts]);

  // 계정 선택 시 해당 계정에 존재하지 않는 월드가 선택되어 있다면 자동으로 전체 월드로 초기화
  const handleSelectAccount = (accId: string) => {
    setSelectedAccount(accId);
    if (selectedWorld !== 'all') {
      const chars = accId === 'all'
        ? accountCharacters
        : accountCharacters.filter((c) => (c.apiKeyId || 'default') === accId);
      const exists = chars.some((c) => c.world_name === selectedWorld);
      if (!exists) {
        setSelectedWorld('all');
      }
    }
  };

  // 고유 월드 목록 추출 및 공식 메이플스토리 월드 순서대로 정렬 (선택된 계정에 존재하는 월드 기준)
  const availableWorlds = useMemo(() => {
    const OFFICIAL_WORLD_ORDER = [
      '스카니아', '베라', '루나', '제니스', '크로아', '유니온', '엘리시움', '이노시스',
      '레드', '오로라', '아케인', '노바',
      '리부트', '리부트2', '에오스', '헬리오스', '버닝', '버닝2', '버닝3', '버닝4', '하이퍼버닝', '챔피언버닝'
    ];

    const worlds = new Set<string>();
    const chars = selectedAccount === 'all'
      ? accountCharacters
      : accountCharacters.filter((c) => (c.apiKeyId || 'default') === selectedAccount);

    chars.forEach((c) => {
      if (c.world_name) worlds.add(c.world_name);
    });

    return Array.from(worlds).sort((a, b) => {
      const idxA = OFFICIAL_WORLD_ORDER.indexOf(a);
      const idxB = OFFICIAL_WORLD_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b, 'ko');
    });
  }, [accountCharacters, selectedAccount]);

  // API 내 캐릭터 검색 & 필터링 (상단 검색기능으로 API 내 캐릭터만 필터링)
  const filteredCharacters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return accountCharacters.filter((char) => {
      // 계정 필터
      if (selectedAccount !== 'all' && (char.apiKeyId || 'default') !== selectedAccount) {
        return false;
      }
      // 월드 필터
      if (selectedWorld !== 'all' && char.world_name !== selectedWorld) {
        return false;
      }
      // 검색어 필터 (API 내 캐릭터의 닉네임, 직업, 월드)
      if (query) {
        const matchName = (char.character_name || '').toLowerCase().includes(query);
        const matchClass = (char.character_class || '').toLowerCase().includes(query);
        const matchWorld = (char.world_name || '').toLowerCase().includes(query);
        return matchName || matchClass || matchWorld;
      }
      return true;
    });
  }, [accountCharacters, searchQuery, selectedAccount, selectedWorld]);

  if (!isOpen) return null;

  // 캐릭터 등록 핸들러
  const handleSelectCharacter = async (char: NexonAccountCharacter) => {
    const isAlreadyAdded = registeredCharNames.has(char.character_name.toLowerCase()) || 
      (char.ocid && registeredCharNames.has(char.ocid)) ||
      justAddedNames.has(char.character_name.toLowerCase());

    if (isAlreadyAdded) return;

    const level = Number(char.character_level) || 200;
    let initialTasks: string[] = [];
    let initialBosses: string[] = [];
    let initialDailyBosses: string[] = [];
    let initialBlackMageId: string | undefined = undefined;
    let charImage = char.character_image || '';

    // 인게임 스케줄러(/maplestory/v1/scheduler/character-state) 설정이 존재할 경우 그대로 가져오기
    // 캐릭터 등록 시 인게임 스케줄러와 똑같이 등록: 인게임에 등록된 것만 등록하고, 인게임에 등록되어 있지 않은 항목은 해제
    if (char.ocid) {
      try {
        // 프로필 이미지가 없는 경우 기본 정보 동시 조회
        const schedPromise = fetchNexonSchedulerState(char.ocid, true, undefined, char.character_name, char.apiKeyId);
        const basicPromise = !charImage ? fetchCharacterBasic({ ocid: char.ocid, name: char.character_name }, false, char.apiKeyId) : Promise.resolve(null);

        const [schedRes, basicRes] = await Promise.all([schedPromise, basicPromise]);

        if (basicRes && basicRes.success && basicRes.basic?.character_image) {
          charImage = basicRes.basic.character_image;
        }

        if (schedRes.success && schedRes.data) {
          const { enabledTaskIds, selectedBossIds, selectedDailyBossIds, selectedBlackMageId } = extractInGameRegisteredTasks(schedRes.data);
          initialTasks = enabledTaskIds;
          initialBosses = selectedBossIds;
          initialDailyBosses = selectedDailyBossIds;
          if (selectedBlackMageId) {
            initialBlackMageId = selectedBlackMageId;
          }
        } else {
          // 인게임 스케줄러 조회 실패 시 최소한의 레벨별 퀘스트만 기본 활성화 (보스는 임의 등록 방지)
          initialTasks = getDefaultEnabledTasksForLevel(level);
        }
      } catch (err) {
        initialTasks = getDefaultEnabledTasksForLevel(level);
      }
    } else {
      initialTasks = getDefaultEnabledTasksForLevel(level);
    }

    const newChar: CharacterInfo = {
      id: char.ocid || `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ocid: char.ocid || '',
      characterName: char.character_name,
      worldName: char.world_name || '메이플',
      characterLevel: level,
      characterClass: char.character_class || '모험가',
      characterImage: charImage,
      characterGuildName: char.character_guild_name || '',
      favorite: false,
      sortOrder: existingCharacters.length + justAddedNames.size,
      enabledTaskIds: initialTasks,
      selectedBossIds: initialBosses,
      selectedDailyBossIds: initialDailyBosses,
      selectedBlackMageId: initialBlackMageId,
      apiKeyId: char.apiKeyId,
      lastSyncedAt: new Date().toISOString(),
    };

    onAddCharacter(newChar);
    setJustAddedNames((prev) => new Set(prev).add(char.character_name.toLowerCase()));
  };

  return (
    <div 
      id="character-search-modal-backdrop" 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
    >
      <div 
        id="character-search-modal"
        className="w-full max-w-4xl h-[85vh] max-h-[850px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col transition-all"
      >
        {/* 1. 모달 상단 헤더 */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center border border-orange-200 dark:border-orange-900/50 shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                캐릭터 추가
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasApiKey && (
              <button
                type="button"
                onClick={() => loadApiCharacters(true)}
                disabled={isRefreshing || isLoading}
                title="API 캐릭터 목록 새로고침"
                className="p-2 rounded-xl text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
                <span className="hidden sm:inline">새로고침</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. API 키 미등록 시 상태 */}
        {!hasApiKey ? (
          <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-6 overflow-y-auto custom-scrollbar">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md flex-shrink-0">
              <Key className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                NEXON Open API 키가 필요합니다
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                API 키를 등록하면 내 계정의 모든 캐릭터를 한 번에 불러와 간편하게 추가할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full pt-2">
              {onOpenApiKeyModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenApiKeyModal();
                  }}
                  className="w-full py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  <span>API 키 등록하기</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        ) : (
          /* 3. API 키 등록 상태: 검색 및 캐릭터 카드 목록 */
          <div className="flex flex-col flex-1 overflow-hidden min-h-0">
            {/* 상단 검색 & 월드 필터 바 */}
            <div className="p-4 sm:px-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800 space-y-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                {/* 실시간 API 내 캐릭터 검색 입력창 */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="api-character-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="캐릭터명, 직업, 월드 검색"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9.5 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-xs"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 월드 선택 셀렉트 */}
                  {availableWorlds.length > 0 && (
                    <div className="flex items-center flex-shrink-0">
                      <select
                        id="api-character-world-filter"
                        value={selectedWorld}
                        onChange={(e) => setSelectedWorld(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-orange-500 shadow-xs cursor-pointer"
                      >
                        <option value="all">전체 월드 ({accountCharacters.length})</option>
                        {availableWorlds.map((world) => {
                          const count = accountCharacters.filter((c) => c.world_name === world).length;
                          return (
                            <option key={world} value={world}>
                              {world} ({count})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* 계정 필터 버튼 목록 (다계정 이용 시 표시: 계정 컨텐츠처럼 필 버튼 목록으로 렌더링) */}
              {isMultiAccount && availableAccounts.length >= 2 && (
                <div 
                  id="api-character-account-buttons"
                  className="flex flex-wrap items-center gap-1.5 pt-0.5 select-none relative"
                >
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex-shrink-0">
                    <Key className="w-3.5 h-3.5 text-orange-500" />
                    <span>계정:</span>
                  </div>

                  {/* 전체 계정 필 버튼 */}
                  <button
                    key="all"
                    type="button"
                    onClick={() => handleSelectAccount('all')}
                    className={`relative px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap cursor-pointer focus:outline-hidden transition-colors ${
                      selectedAccount === 'all'
                        ? 'text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs'
                    }`}
                  >
                    {selectedAccount === 'all' && (
                      <motion.div
                        layoutId="activeModalAccountPill"
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">전체 계정 ({accountCharacters.length})</span>
                  </button>

                  {/* 등록된 개별 계정 필 버튼 */}
                  {availableAccounts.map((acc) => {
                    const isSelected = selectedAccount === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => handleSelectAccount(acc.id)}
                        className={`relative px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap cursor-pointer focus:outline-hidden transition-colors ${
                          isSelected
                            ? 'text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activeModalAccountPill"
                            className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-xs"
                            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">{acc.alias} ({acc.count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 검색 및 필터 현황 카운터 */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>
                  {(searchQuery || selectedWorld !== 'all' || selectedAccount !== 'all') ? (
                    <>필터링 <strong className="text-orange-600 dark:text-orange-400">{filteredCharacters.length}</strong> / 전체 {accountCharacters.length}개</>
                  ) : (
                    <>총 <strong className="text-slate-900 dark:text-white font-bold">{accountCharacters.length}</strong>개 캐릭터</>
                  )}
                </span>
                {(selectedAccount !== 'all' || selectedWorld !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccount('all');
                      setSelectedWorld('all');
                      setSearchQuery('');
                    }}
                    className="text-[10px] text-slate-400 hover:text-orange-500 underline cursor-pointer"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            </div>

            {/* 캐릭터 카드 그리드 영역 */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                  <LoadingSpinner size="lg" text="캐릭터 목록을 불러오는 중..." />
                </div>
              ) : errorMsg ? (
                <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-center space-y-3 my-6 max-w-md mx-auto">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <div>
                    <p className="font-bold text-sm">{errorMsg}</p>
                    <p className="text-xs text-rose-500/80 mt-1">
                      API 키 권한 또는 유효성을 확인하시거나, 키를 다시 등록해주세요.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => loadApiCharacters(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      다시 시도
                    </button>
                    {onOpenApiKeyModal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenApiKeyModal();
                        }}
                        className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        API 키 관리
                      </button>
                    )}
                  </div>
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-xl">
                    🔍
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {searchQuery 
                      ? `'${searchQuery}' 검색 결과와 일치하는 캐릭터가 없습니다.` 
                      : '불러온 캐릭터가 없습니다.'}
                  </p>
                  <p className="text-xs text-slate-400">
                    검색은 연동된 API 계정 내 캐릭터만 가능합니다.
                  </p>
                </div>
              ) : (
                /* 캐릭터 카드 목록 그리드 */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                  {filteredCharacters.map((char) => {
                    const isRegistered = registeredCharNames.has(char.character_name.toLowerCase()) || 
                      (char.ocid && registeredCharNames.has(char.ocid)) ||
                      justAddedNames.has(char.character_name.toLowerCase());

                    return (
                      <div
                        key={char.ocid || char.character_name}
                        id={`api-char-card-${char.character_name}`}
                        onClick={() => !isRegistered && handleSelectCharacter(char)}
                        className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-between text-center ${
                          isRegistered
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/80 shadow-xs cursor-default'
                            : 'bg-white dark:bg-slate-800/70 border-slate-200/90 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md hover:bg-orange-50/20 dark:hover:bg-orange-950/20 cursor-pointer'
                        }`}
                      >
                        {/* 계정 별칭 태그 (연결된 API가 2개 이상인 다계정일 때만 표시) */}
                        {isMultiAccount && char.apiKeyAlias && (
                          <div className="absolute top-2.5 left-2.5 z-10 px-1.5 py-0.5 rounded-md bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 text-[9px] font-semibold border border-slate-200/80 dark:border-slate-700/80 max-w-[85px] truncate shadow-2xs backdrop-blur-xs">
                            {char.apiKeyAlias}
                          </div>
                        )}

                        {/* 1. 캐릭터 프로필 사진 (캐릭터 카드와 같은 비율과 위치) */}
                        <div className="pt-1 w-full flex flex-col items-center">
                          <CharacterAvatar
                            imageUrl={char.character_image}
                            name={char.character_name}
                            containerClassName={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl ${
                              isRegistered
                                ? 'bg-emerald-100/50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 group-hover:scale-105'
                            }`}
                            isAllCompleted={isRegistered}
                            size="custom"
                          />

                          {/* 2. 아래 닉네임, 레벨, 직업 */}
                          <h4 className={`text-sm font-bold truncate max-w-full mt-2.5 px-1 ${
                            isRegistered ? 'text-emerald-950 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                          }`}>
                            {char.character_name}
                          </h4>

                          <div className="mt-1 flex items-center gap-1.5 justify-center flex-wrap">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isRegistered
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                : 'bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200/80 dark:border-orange-800/80'
                            }`}>
                              Lv.{char.character_level}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full mt-1">
                            {char.world_name} · {char.character_class || '직업 미지정'}
                          </p>

                          {char.character_guild_name && (
                            <p className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">
                              {char.character_guild_name}
                            </p>
                          )}
                        </div>

                        {/* 3. 하단 액션 버튼 */}
                        <div className="w-full mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                          {isRegistered ? (
                            <div className="py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>등록 완료</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCharacter(char);
                              }}
                              className="w-full py-1.5 px-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-xs group-hover:shadow-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>추가하기</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 하단 완료 바 */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900 flex-shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {justAddedNames.size > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{justAddedNames.size}개 추가</span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-xs"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
