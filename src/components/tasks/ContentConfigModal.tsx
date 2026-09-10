import React, { useState, useEffect } from 'react';
import { 
  Check, 
  SlidersHorizontal, 
  Coins, 
  Crown, 
  Flame, 
  Calendar,
  Download,
  Loader2,
  X,
  Plus,
  Minus,
  Trash2,
  Edit3,
  ShieldAlert
} from 'lucide-react';
import { BlackMageSilhouetteIcon } from '../common/BlackMageIcon';
import { CharacterInfo, CustomTask } from '../../types';
import { 
  ARCANE_DAILY_QUESTS,
  GRANDIS_DAILY_QUESTS,
  WEEKLY_QUESTS, 
  WEEKLY_GUILD_AND_MISC,
  WEEKLY_BOSSES,
  BOSS_GROUP_DEFINITIONS,
  DAILY_BOSS_GROUP_DEFINITIONS,
  BLACK_MAGE_BOSS
} from '../../data/defaultTasks';
import { fetchNexonSchedulerState } from '../../services/api';
import { 
  extractInGameRegisteredTasks, 
  sortTaskIdsByStandardOrder, 
  sortBossIdsByStandardOrder,
  sortDailyBossIdsByStandardOrder
} from '../../utils/schedulerParser';
import { MapleIcon } from '../common/MapleIcon';
import { CustomTaskModal } from './CustomTaskModal';
import { CustomTaskEditModal } from './CustomTaskEditModal';

interface ContentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterInfo | null;
  onSaveConfig: (
    characterId: string,
    enabledTaskIds: string[],
    selectedBossIds: string[],
    weeklyBossThreshold?: number,
    selectedDailyBossIds?: string[],
    selectedBlackMageId?: string | null,
    customTasks?: CustomTask[]
  ) => void;
}

export const ContentConfigModal: React.FC<ContentConfigModalProps> = ({
  isOpen,
  onClose,
  character,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'daily_boss' | 'weekly' | 'bosses' | 'black_mage' | 'custom'>('daily');
  const [enabledTaskIds, setEnabledTaskIds] = useState<string[]>([]);
  const [selectedBossIds, setSelectedBossIds] = useState<string[]>([]);
  const [selectedDailyBossIds, setSelectedDailyBossIds] = useState<string[]>([]);
  const [weeklyBossThreshold, setWeeklyBossThreshold] = useState<number>(12);
  const [selectedBlackMageId, setSelectedBlackMageId] = useState<string | null>(null);
  const [customTasks, setCustomTasks] = useState<CustomTask[]>([]);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomTask, setEditingCustomTask] = useState<CustomTask | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (character) {
      setEnabledTaskIds([...(character.enabledTaskIds || [])]);
      setSelectedBossIds([...(character.selectedBossIds || [])]);
      setSelectedDailyBossIds([...(character.selectedDailyBossIds || [])]);
      setWeeklyBossThreshold(character.weeklyBossThreshold ?? 12);
      setSelectedBlackMageId(character.selectedBlackMageId ?? null);
      setCustomTasks([...(character.customTasks || [])]);
      setImportStatusMsg(null);
    }
  }, [character, isOpen]);

  if (!isOpen || !character) return null;

  // 게임 내 등록된 스케줄러 목록 불러오기 (/scheduler/character-state)
  const handleImportInGameScheduler = async () => {
    if (!character.ocid || character.ocid.startsWith('manual_')) {
      alert('NEXON API로 연동된 캐릭터만 게임 내 스케줄러를 불러올 수 있습니다.');
      return;
    }

    setIsImporting(true);
    setImportStatusMsg(null);

    try {
      const res = await fetchNexonSchedulerState(character.ocid, true);
      if (res.success && res.data) {
        const { 
          enabledTaskIds: inGameTasks, 
          selectedBossIds: inGameBosses,
          selectedDailyBossIds: inGameDailyBosses,
          selectedBlackMageId: inGameBlackMageId,
        } = extractInGameRegisteredTasks(res.data);
        
        if (inGameTasks.length === 0 && inGameBosses.length === 0 && inGameDailyBosses.length === 0 && !inGameBlackMageId) {
          // 인게임 미접속이거나 게임 내 스케줄러 등록 항목이 없는 경우 기존 설정을 보존하고 안내
          setImportStatusMsg('오늘 인게임에 접속하지 않았거나, 게임 내 [메이플 스케줄러]에 등록된 항목이 없습니다. (기존 설정 유지)');
        } else {
          // 인게임 스케줄러에 등록된 항목 그대로 반영
          setEnabledTaskIds(inGameTasks);
          setSelectedBossIds(inGameBosses);
          setSelectedDailyBossIds(inGameDailyBosses);
          if (inGameBlackMageId) {
            setSelectedBlackMageId(inGameBlackMageId);
          }
          setImportStatusMsg(
            `게임 내 스케줄러에서 퀘스트 ${inGameTasks.length}개, 주간보스 ${inGameBosses.length}개, 일일보스 ${inGameDailyBosses.length}개${inGameBlackMageId ? ', 검은 마법사' : ''}를 불러왔습니다!`
          );
        }
      } else {
        setImportStatusMsg(res.error || '게임 내 스케줄러 데이터를 가져오지 못했습니다.');
      }
    } catch (err: any) {
      setImportStatusMsg('스케줄러 연동 중 오류가 발생했습니다.');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleTask = (id: string) => {
    setEnabledTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 주간 보스 단일 난이도 토글 (동일 보스는 1개 난이도만 선택 가능)
  const handleToggleBossDifficulty = (groupBossIds: string[], targetBossId: string) => {
    setSelectedBossIds((prev) => {
      const isAlreadySelected = prev.includes(targetBossId);
      const filtered = prev.filter((id) => !groupBossIds.includes(id));
      if (isAlreadySelected) {
        return filtered;
      }
      return [...filtered, targetBossId];
    });
  };

  // 일일 보스 단일 난이도 토글 (동일 보스는 1개 난이도만 선택 가능)
  const handleToggleDailyBossDifficulty = (groupBossIds: string[], targetBossId: string) => {
    setSelectedDailyBossIds((prev) => {
      const isAlreadySelected = prev.includes(targetBossId);
      const filtered = prev.filter((id) => !groupBossIds.includes(id));
      if (isAlreadySelected) {
        return filtered;
      }
      return [...filtered, targetBossId];
    });
  };

  // 일일 보스 전체 선택 (가장 높은 난이도 자동 선택)
  const handleSelectAllDailyBosses = () => {
    const highestBossIds = DAILY_BOSS_GROUP_DEFINITIONS.map(
      (g) => g.difficulties[g.difficulties.length - 1].id
    );
    setSelectedDailyBossIds(highestBossIds);
  };

  // 일일 보스 전체 해제
  const handleClearAllDailyBosses = () => {
    setSelectedDailyBossIds([]);
  };

  const handleAddCustomTask = (newTask: Omit<CustomTask, 'id' | 'createdAt'>) => {
    const task: CustomTask = {
      ...newTask,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setCustomTasks((prev) => [...prev, task]);
  };

  const handleRemoveCustomTask = (taskId: string) => {
    setCustomTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleUpdateCustomTask = (updated: CustomTask) => {
    setCustomTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setEditingCustomTask(null);
  };

  const handleSave = () => {
    const sortedTasks = sortTaskIdsByStandardOrder(enabledTaskIds);
    const sortedBosses = sortBossIdsByStandardOrder(selectedBossIds);
    const sortedDailyBosses = sortDailyBossIdsByStandardOrder(selectedDailyBossIds);
    onSaveConfig(
      character.id, 
      sortedTasks, 
      sortedBosses, 
      weeklyBossThreshold, 
      sortedDailyBosses,
      selectedBlackMageId,
      customTasks
    );
    onClose();
  };

  const getDifficultyBadgeStyle = (diff: string, isSelected: boolean) => {
    if (isSelected) {
      switch (diff) {
        case 'easy':
          return 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
        case 'normal':
          return 'bg-sky-600 text-white border-sky-700 shadow-xs';
        case 'hard':
          return 'bg-red-600 text-white border-red-700 shadow-xs';
        case 'chaos':
          return 'bg-purple-600 text-white border-purple-700 shadow-xs';
        case 'extreme':
          return 'bg-black text-red-500 font-bold border border-red-500 shadow-xs';
        default:
          return 'bg-slate-800 text-white border-slate-900';
      }
    }
    return 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200';
  };

  return (
    <div 
      id="content-config-modal-backdrop" 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        id="content-config-modal" 
        className="w-full max-w-4xl h-[720px] max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col"
      >
        {/* 모달 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                스케줄 설정
              </h3>
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                {character.characterName} (Lv.{character.characterLevel})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {character.ocid && !character.ocid.startsWith('manual_') && (
              <button
                onClick={handleImportInGameScheduler}
                disabled={isImporting}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-1.5 shadow-xs"
                title="게임 내 스케줄러에 등록된 퀘스트/보스 목록을 그대로 불러옵니다"
              >
                {isImporting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>인게임 스케줄러 불러오기</span>
              </button>
            )}
          </div>
        </div>

        {/* 탭 네비게이션: 1. 일일 컨텐츠 -> 2. 주간 컨텐츠/에픽던전 -> 3. 주간 보스 */}
        {importStatusMsg && (
          <div className="px-6 py-2 bg-orange-50 dark:bg-orange-950/40 border-b border-orange-200 dark:border-orange-900/50 text-xs font-semibold text-orange-700 dark:text-orange-300 flex items-center justify-between">
            <span>{importStatusMsg}</span>
            <button onClick={() => setImportStatusMsg(null)} className="text-orange-400 hover:text-orange-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="px-6 pt-2.5 pb-1 flex items-center justify-between gap-2 bg-white dark:bg-slate-900 flex-wrap">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex-wrap">
            <button
              id="config-tab-daily"
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>일일 컨텐츠</span>
            </button>
            <button
              id="config-tab-daily-boss"
              onClick={() => setActiveTab('daily_boss')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'daily_boss'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-sky-500" />
              <span>일일 보스</span>
            </button>
            <button
              id="config-tab-weekly"
              onClick={() => setActiveTab('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>주간 컨텐츠</span>
            </button>
            <button
              id="config-tab-bosses"
              onClick={() => setActiveTab('bosses')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'bosses'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>주간 보스</span>
            </button>
            <button
              id="config-tab-black-mage"
              onClick={() => setActiveTab('black_mage')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'black_mage'
                  ? 'bg-black text-white border border-red-600 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BlackMageSilhouetteIcon size={14} className="text-red-500" />
              <span>검은 마법사</span>
            </button>
            <button
              id="config-tab-custom"
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'custom'
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>커스텀</span>
            </button>
          </div>

          {/* 우측: 주간 보스 탭일 때의 완료 기준 조작 버튼 */}
          {activeTab === 'bosses' ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1 select-none">
                완료 기준
              </span>
              <button
                type="button"
                onClick={() => setWeeklyBossThreshold((prev) => Math.max(0, prev - 1))}
                disabled={weeklyBossThreshold <= 0}
                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="완료 기준 1마리 감소"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-mono font-bold text-slate-900 dark:text-white select-none">
                {weeklyBossThreshold}
              </span>
              <button
                type="button"
                onClick={() => setWeeklyBossThreshold((prev) => Math.min(12, prev + 1))}
                disabled={weeklyBossThreshold >= 12}
                className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="완료 기준 1마리 증가"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>

        {/* 탭 본문 영역 */}
        <div className="px-6 pb-6 pt-3 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {/* 1. 일일 컨텐츠 탭 */}
          {activeTab === 'daily' && (
            <div className="space-y-5">
              {/* 아케인리버 일일 퀘스트 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>아케인리버 일일 퀘스트</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ARCANE_DAILY_QUESTS.map((task) => {
                    const isSelected = enabledTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                          isSelected
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <MapleIcon name={task.name} icon={task.icon} className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {task.name}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 그란디스 일일 퀘스트 */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>그란디스 일일 퀘스트</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {GRANDIS_DAILY_QUESTS.map((task) => {
                    const isSelected = enabledTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                          isSelected
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <MapleIcon name={task.name} icon={task.icon} className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {task.name}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 일일 보스 설정 탭 (sky 계열) */}
          {activeTab === 'daily_boss' && (
            <div className="space-y-1.5 pt-1">
              {DAILY_BOSS_GROUP_DEFINITIONS.map((group) => {
                const groupIds = group.difficulties.map((d) => d.id);
                const selectedInGroup = group.difficulties.find((d) => selectedDailyBossIds.includes(d.id));
                const isAnySelectedInGroup = !!selectedInGroup;

                return (
                  <div
                    key={group.baseName}
                    className={`px-4 py-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isAnySelectedInGroup
                        ? 'bg-sky-50/40 dark:bg-sky-950/20 border-sky-300/80 dark:border-sky-800/80 shadow-xs'
                        : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* 좌측: 보스 아이콘 및 이름 & 선택된 난이도 결정석 메소 가격 */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <MapleIcon name={group.baseName} icon={group.icon} fallback="💀" className="w-12 h-12 rounded-xl object-contain flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {group.baseName}
                          </span>
                          {selectedInGroup && (
                            <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-100/70 dark:bg-sky-950/70 px-2 py-0.5 rounded-md border border-sky-300/80 dark:border-sky-800/80">
                              {selectedInGroup.mesoValue >= 100000000
                                ? `${(selectedInGroup.mesoValue / 100000000).toLocaleString(undefined, { minimumFractionDigits: selectedInGroup.mesoValue % 100000000 === 0 ? 0 : 2, maximumFractionDigits: 2 })}억 메소`
                                : `${(selectedInGroup.mesoValue / 10000).toLocaleString()}만 메소`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 우측: 난이도별 체크박스 / 토글 버튼 그룹 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {group.difficulties.map((diff) => {
                        const isSelected = selectedDailyBossIds.includes(diff.id);

                        return (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => handleToggleDailyBossDifficulty(groupIds, diff.id)}
                            className={`w-[82px] py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${getDifficultyBadgeStyle(diff.difficulty, isSelected)}`}
                          >
                            <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] flex-shrink-0 ${
                              isSelected 
                                ? 'bg-white text-slate-900 border-white' 
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                            <span>{diff.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. 주간 컨텐츠 탭 */}
          {activeTab === 'weekly' && (
            <div className="space-y-5">
              {/* 아케인리버 주간 컨텐츠 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>아케인리버 주간 컨텐츠</span>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800">
                    목요일 리셋
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {WEEKLY_QUESTS.map((task) => {
                    const isSelected = enabledTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                          isSelected
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <MapleIcon name={task.name} icon={task.icon} className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {task.name}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 길드 및 주간 콘텐츠 (무릉도장, 지하수로, 플래그 레이스) */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>길드 및 주간 컨텐츠</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-1.5 py-0.2 rounded border border-orange-200 dark:border-orange-800">
                    일요일 23:30 마감
                  </span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {WEEKLY_GUILD_AND_MISC.map((task) => {
                    const isSelected = enabledTaskIds.includes(task.id);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                          isSelected
                            ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                          <MapleIcon name={task.name} icon={task.icon} className="w-11 h-11 rounded-xl object-contain flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {task.name}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 4. 주간 보스 설정 탭 (한 줄 정리 & 보스당 1개 난이도 체크 - purple 테마) */}
          {activeTab === 'bosses' && (
            <div className="space-y-1.5 pt-1">
              {/* 보스 단일 행(Row) 리스트 */}
              {BOSS_GROUP_DEFINITIONS.map((group) => {
                  const groupIds = group.difficulties.map((d) => d.id);
                  const selectedInGroup = group.difficulties.find((d) => selectedBossIds.includes(d.id));
                  const isAnySelectedInGroup = !!selectedInGroup;

                  return (
                    <div
                      key={group.baseName}
                      className={`px-4 py-2.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isAnySelectedInGroup
                          ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-300/80 dark:border-purple-800/80 shadow-xs'
                          : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* 좌측: 보스 아이콘 및 이름 & 선택된 난이도 결정석 메소 가격 */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <MapleIcon name={group.baseName} icon={group.icon} fallback="💀" className="w-12 h-12 rounded-xl object-contain flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {group.baseName}
                            </span>
                            {selectedInGroup && (
                              <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-100/70 dark:bg-purple-950/70 px-2 py-0.5 rounded-md border border-purple-300/80 dark:border-purple-800/80">
                                {selectedInGroup.mesoValue >= 100000000
                                  ? `${(selectedInGroup.mesoValue / 100000000).toLocaleString(undefined, { minimumFractionDigits: selectedInGroup.mesoValue % 100000000 === 0 ? 0 : 2, maximumFractionDigits: 2 })}억 메소`
                                  : `${(selectedInGroup.mesoValue / 10000).toLocaleString()}만 메소`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 우측: 난이도별 체크박스 / 토글 버튼 그룹 (모든 난이도 버튼 가로 크기 균일 통일 w-[82px]) */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {group.difficulties.map((diff) => {
                          const isSelected = selectedBossIds.includes(diff.id);

                          return (
                            <button
                              key={diff.id}
                              type="button"
                              onClick={() => handleToggleBossDifficulty(groupIds, diff.id)}
                              className={`w-[82px] py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${getDifficultyBadgeStyle(diff.difficulty, isSelected)}`}
                            >
                              <span className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center text-[10px] flex-shrink-0 ${
                                isSelected 
                                  ? 'bg-white text-slate-900 border-white' 
                                  : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </span>
                              <span>{diff.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 5. 검은 마법사 탭 */}
          {activeTab === 'black_mage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BlackMageSilhouetteIcon size={20} className="text-red-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    검은 마법사
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {BLACK_MAGE_BOSS.difficulties.map((diff) => {
                  const isSelected = selectedBlackMageId === diff.id;
                  const mesoStr = diff.mesoValue >= 100000000 
                    ? `${(diff.mesoValue / 100000000).toLocaleString(undefined, { minimumFractionDigits: diff.mesoValue % 100000000 === 0 ? 0 : 2, maximumFractionDigits: 2 })}억 메소`
                    : `${(diff.mesoValue / 10000).toLocaleString()}만 메소`;

                  return (
                    <div
                      key={diff.id}
                      onClick={() => setSelectedBlackMageId(isSelected ? null : diff.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-black dark:bg-black border-red-600 dark:border-red-600 text-white ring-1 ring-red-600/40 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-900/50 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MapleIcon
                          name="검은 마법사"
                          icon="/icons/검은 마법사.png"
                          fallback="⚫"
                          className="w-12 h-12 rounded-xl object-contain flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {diff.label}
                            </span>
                            <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                              isSelected
                                ? 'text-red-400 bg-red-950/70 border-red-700/80'
                                : 'text-red-600 dark:text-red-400 bg-red-100/70 dark:bg-red-950/70 border-red-300/80 dark:border-red-800/80'
                            }`}>
                              {mesoStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected 
                          ? 'bg-black border-red-600 text-red-500' 
                          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-transparent'
                      }`}>
                        <Check className={`w-3.5 h-3.5 ${isSelected ? 'scale-100' : 'scale-0'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. 커스텀 컨텐츠 탭 */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">커스텀 스케줄</h4>
                <button
                  id="btn-add-custom-task-modal"
                  type="button"
                  onClick={() => setIsCustomModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>컨텐츠 추가</span>
                </button>
              </div>

              {customTasks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    등록된 커스텀 컨텐츠가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customTasks.map((task) => {
                    const resetLabel = task.resetType === 'none'
                      ? '수동'
                      : task.resetType === 'daily'
                        ? `매일 ${task.resetTime || '00:00'}`
                        : `매주 ${['일','월','화','수','목','금','토'][task.resetDayOfWeek ?? 4]}요일 ${task.resetTime || '00:00'}`;

                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold truncate">{task.title}</span>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                            {resetLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingCustomTask(task)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="커스텀 컨텐츠 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>수정</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomTask(task.id)}
                            className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="커스텀 컨텐츠 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>삭제</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/80">
          <div className="text-xs text-slate-400">
            퀘스트 {enabledTaskIds.length}개 · 일일보스 {selectedDailyBossIds.length}개 · 주간보스 {selectedBossIds.length}개
            {selectedBlackMageId ? ' · 검은마법사 등록됨' : ''}
            {customTasks.length > 0 ? ` · 커스텀 ${customTasks.length}개` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-sm transition-all"
            >
              <span>저장</span>
            </button>
          </div>
        </div>
      </div>

      <CustomTaskModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleAddCustomTask}
      />

      {editingCustomTask && (
        <CustomTaskEditModal
          isOpen={!!editingCustomTask}
          task={editingCustomTask}
          onClose={() => setEditingCustomTask(null)}
          onUpdate={handleUpdateCustomTask}
        />
      )}
    </div>
  );
};
