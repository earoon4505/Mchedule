import React, { useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Check, ChevronRight, Sparkles } from 'lucide-react';
import { CharacterInfo } from '../../types';
import { CharacterAlertStatus, ChimeLoopController } from '../../utils/alertNotifier';
import { CommonContentItem } from '../../utils/commonContents';
import { CharacterAvatar } from '../character/CharacterAvatar';
import { MapleIcon } from '../common/MapleIcon';

interface IncompleteScheduleAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  incompleteList: Array<{
    character: CharacterInfo;
    alertStatus: CharacterAlertStatus;
  }>;
  incompleteAccountTasks?: CommonContentItem[];
  onSelectCharacter?: (characterId: string) => void;
}

export const IncompleteScheduleAlertModal: React.FC<IncompleteScheduleAlertModalProps> = ({
  isOpen,
  onClose,
  incompleteList,
  incompleteAccountTasks = [],
  onSelectCharacter,
}) => {
  const chimeControllerRef = useRef<ChimeLoopController | null>(null);

  // 모달이 열리면 주기적으로 띠링 띠링 소리 울림, 닫히면 정지
  useEffect(() => {
    if (isOpen) {
      if (!chimeControllerRef.current) {
        chimeControllerRef.current = new ChimeLoopController();
      }
      chimeControllerRef.current.start(1800);
    } else {
      if (chimeControllerRef.current) {
        chimeControllerRef.current.stop();
      }
    }

    return () => {
      if (chimeControllerRef.current) {
        chimeControllerRef.current.stop();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (chimeControllerRef.current) {
      chimeControllerRef.current.stop();
    }
    onClose();
  };

  const handleCardClick = (charId: string) => {
    if (onSelectCharacter) {
      onSelectCharacter(charId);
    }
    handleConfirm();
  };

  return (
    <div 
      id="incomplete-schedule-alert-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div 
        id="incomplete-schedule-alert-modal"
        className="w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-red-500/80 rounded-2xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 flex flex-col max-h-[85vh] ring-4 ring-red-500/20 animate-in zoom-in-95 duration-200"
      >
        {/* 상단 알림 헤더: 알림 아이콘과 타이틀을 같은 줄로 배치 */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center animate-bounce flex-shrink-0">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-white">
              스케줄이 완료되지 않았습니다.
            </h3>
          </div>
        </div>

        {/* 미완료 캐릭터 및 프로필 사진 영역 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {/* 계정 컨텐츠 미완료 카드 (상단 고정 노출 - 캐릭터와 동일한 레드 테마 적용) */}
          {incompleteAccountTasks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-600/80 shadow-xs">
              <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-red-200/80 dark:border-red-900/50">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-red-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    계정 컨텐츠
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500 text-white shadow-2xs flex-shrink-0">
                  미완료 {incompleteAccountTasks.length}개
                </span>
              </div>

              <div className="space-y-2">
                {incompleteAccountTasks.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-white/90 dark:bg-slate-900/90 border border-red-200/80 dark:border-red-900/50 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MapleIcon
                        name={item.name}
                        icon={item.icon}
                        fallback={item.fallbackIcon}
                        className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            item.type === 'daily'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                              : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900'
                          }`}
                        >
                          {item.type === 'daily' ? '일일' : '주간'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {incompleteList.map(({ character, alertStatus }) => {
              const { incompleteSummary } = alertStatus;

              return (
                <div
                  key={character.id}
                  onClick={() => handleCardClick(character.id)}
                  className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-600/80 hover:border-red-500 dark:hover:border-red-500 shadow-xs flex items-center gap-3.5 transition-all cursor-pointer group"
                >
                  {/* 캐릭터 프사 - CharacterAvatar 활용으로 잘림 방지 및 얼굴 중심 포커스 */}
                  <div className="relative flex-shrink-0">
                    <CharacterAvatar
                      imageUrl={character.characterImage}
                      name={character.characterName}
                      size="xl"
                      containerClassName="border-2 border-red-500/80 ring-2 ring-red-500/20 shadow-xs"
                    />
                  </div>

                  {/* 캐릭터 정보 및 미완료 뱃지 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {character.characterName}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold truncate">
                          {character.worldName}
                        </span>
                      </div>
                      <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono flex-shrink-0 bg-rose-100/80 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50">
                        Lv.{character.characterLevel}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {alertStatus.dailyAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500 text-white shadow-2xs">
                          일일 {incompleteSummary.dailyRemaining}개 남음
                        </span>
                      )}
                      {alertStatus.dailyBossAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white shadow-2xs">
                          일보 {incompleteSummary.dailyBossRemaining}개 남음
                        </span>
                      )}
                      {alertStatus.weeklyAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs">
                          주간 {incompleteSummary.weeklyRemaining}개 남음
                        </span>
                      )}
                      {alertStatus.bossAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-600 text-white shadow-2xs">
                          주보 {incompleteSummary.bossRemaining}개 남음
                        </span>
                      )}
                      {alertStatus.blackMageAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white shadow-2xs border border-red-500">
                          검은 마법사 미완료
                        </span>
                      )}
                      {alertStatus.customAlert && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500 text-white shadow-2xs">
                          커스텀 {incompleteSummary.customRemaining}개 남음
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              );
            })}
          </div>

          {incompleteAccountTasks.length === 0 && incompleteList.length === 0 && (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-800 dark:text-slate-200">모든 스케줄을 완료했습니다!</p>
            </div>
          )}
        </div>

        {/* 하단 확인 버튼 (클릭 시 팝업 닫히고 소리 멈춤) */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-end">
          <button
            type="button"
            id="btn-confirm-schedule-alert"
            onClick={handleConfirm}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};
