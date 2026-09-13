import React, { useMemo } from 'react';
import { 
  Settings as SettingsIcon, 
  RotateCw, 
  Minus, 
  Square, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Moon, 
  Sun,
  ShieldCheck,
  Key,
  Megaphone
} from 'lucide-react';
import { CharacterInfo, CharacterProgressRecord } from '../../types';
import { getFormattedKSTString } from '../../utils/time';
import { APP_LOGO_SRC, onLogoError } from '../../utils/image';
import { CharacterAvatar } from '../character/CharacterAvatar';
import { getCharacterCompletionStatus } from '../../utils/schedulerParser';
import { supportsWindowControls } from '../../utils/platform';

interface WindowHeaderProps {
  characters: CharacterInfo[];
  records: Record<string, CharacterProgressRecord>;
  onOpenSettings: () => void;
  onOpenApiKeyModal: () => void;
  onOpenNoticeModal: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  onSelectCharacter: (id: string) => void;
  hasApiKey: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentTimeStr: string;
  autoSyncCountdown: number;
  autoSyncIntervalSec?: number;
}

export const WindowHeader: React.FC<WindowHeaderProps> = React.memo(({
  characters,
  records,
  onOpenSettings,
  onOpenApiKeyModal,
  onOpenNoticeModal,
  onRefreshAll,
  isRefreshing,
  onSelectCharacter,
  hasApiKey,
  darkMode,
  onToggleDarkMode,
  currentTimeStr,
  autoSyncCountdown,
  autoSyncIntervalSec = 300,
}) => {
  // 미완료 컨텐츠(일일, 주간, 주간 보스)가 남아있는 캐릭터 목록 (불필요한 반복 연산 방지)
  const incompleteCharacters = useMemo(() => {
    return (characters || []).filter((char) => {
      if (!char) return false;
      const rec = records?.[char.id];
      const status = getCharacterCompletionStatus(char, rec);
      return !status.isAllCompleted;
    });
  }, [characters, records]);

  return (
    <header 
      id="window-titlebar"
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('button, input, select, a, .titlebar-no-drag')) {
          return;
        }
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          (window as any).electronAPI.maximize();
        }
      }}
      className="h-12 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-3 select-none flex-shrink-0 z-30 transition-colors titlebar-drag"
    >
      {/* 1. 좌측 영역: 앱 로고 & 미완료 캐릭터 알림 뱃지 */}
      <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0 titlebar-drag cursor-default">
          <img
            src={APP_LOGO_SRC}
            alt="메케줄"
            onError={onLogoError}
            className="w-7 h-7 rounded-lg object-contain flex-shrink-0 pointer-events-none"
          />
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight pointer-events-none">
            메케줄
          </span>
        </div>

        {/* 미완료 캐릭터 썸네일 얼굴 표시 */}
        {incompleteCharacters.length > 0 ? (
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 flex-shrink-0 titlebar-no-drag">
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
              미완료 {incompleteCharacters.length}
            </span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {incompleteCharacters.slice(0, 3).map((char) => (
                <button
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  title={`${char.characterName} (미완료 컨텐츠 진행 중)`}
                  className="w-5 h-5 rounded-full ring-2 ring-white dark:ring-slate-900 overflow-hidden flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <CharacterAvatar
                    imageUrl={char.characterImage}
                    name={char.characterName}
                    containerClassName="w-full h-full rounded-full border-0"
                    size="custom"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          characters.length > 0 && (
            <div className="hidden xl:flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 pl-2 border-l border-slate-200 dark:border-slate-800 flex-shrink-0 titlebar-drag">
              <CheckCircle2 className="w-3 h-3 pointer-events-none" />
              <span className="pointer-events-none">전체 완료</span>
            </div>
          )
        )}
      </div>

      {/* 2. 중앙 영역 (여백 유지 - 넓은 드래그 가능 영역) */}
      <div className="flex-1 min-w-0 h-full titlebar-drag" />

      {/* 3. 우측 컨트롤 영역 (고정 폭 정렬로 흔들림 차단) */}
      <div className="flex items-center justify-end gap-1.5 flex-shrink-0 titlebar-no-drag">
        {/* 1. 공지사항 버튼 (확성기 아이콘 - API 버튼 왼쪽 배치) */}
        <button
          id="btn-header-notice"
          onClick={onOpenNoticeModal}
          className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-2xs hover:text-orange-500 dark:hover:text-orange-400"
          title="공지사항"
        >
          <Megaphone className="w-3.5 h-3.5" />
        </button>

        {/* 2. API 등록 / 관리 버튼 */}
        <button
          id="btn-header-api-key"
          onClick={onOpenApiKeyModal}
          className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-colors border flex items-center gap-1.5 flex-shrink-0 shadow-2xs ${
            hasApiKey
              ? 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80'
              : 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600'
          }`}
          title={hasApiKey ? 'NEXON API 키 관리 (등록됨)' : 'NEXON API 키 등록하기 (새로 등록 / 변경 / 삭제)'}
        >
          <Key className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">API</span>
        </button>

        {/* 2. 자동갱신 상태 뱃지 (박스 크기 w-[124px] 고정, 문구와 타이머 사이 여백 없이 밀착 배치) */}
        {(() => {
          const intervalText = autoSyncIntervalSec < 60
            ? `${autoSyncIntervalSec}초`
            : `${Math.floor(autoSyncIntervalSec / 60)}분`;
          return (
            <div 
              className="hidden sm:flex items-center justify-center w-[124px] h-7 px-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 select-none flex-shrink-0"
              title={`${intervalText}마다 자동으로 NEXON Open API와 최신 상태가 동기화됩니다`}
            >
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-semibold whitespace-nowrap">자동갱신</span>
              </div>
              <div className="w-[36px] flex items-center justify-center flex-shrink-0">
                {isRefreshing ? (
                  <RotateCw className="w-3 h-3 animate-spin text-orange-500 dark:text-orange-400" />
                ) : (
                  <span className="font-mono font-bold text-orange-500 dark:text-orange-400 text-[11px] whitespace-nowrap">
                    {`${String(Math.floor(autoSyncCountdown / 60)).padStart(2, '0')}:${String(autoSyncCountdown % 60).padStart(2, '0')}`}
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* 3. 새로고침 버튼 (텍스트 제거, 화살표 아이콘만) */}
        <button
          id="btn-refresh-all"
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className="h-7 w-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-2xs disabled:opacity-50"
          title="새로고침"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
        </button>

        {/* 4. 다크/라이트 모드 토글 버튼 (아이콘만 표시) */}
        <button
          id="btn-header-darkmode-toggle"
          onClick={onToggleDarkMode}
          className="h-7 w-7 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0 shadow-2xs"
          title={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
        >
          {darkMode ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* 5. 환경 설정 버튼 */}
        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 flex-shrink-0 shadow-2xs"
          title="설정"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>

        {/* Windows 창 조작 버튼 (데스크톱 전용) */}
        {supportsWindowControls && (
          <div className="flex items-center gap-1 pl-1 ml-0.5 border-l border-slate-200 dark:border-slate-800 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).electronAPI) {
                  (window as any).electronAPI.minimize();
                }
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
              title="최소화"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).electronAPI) {
                  (window as any).electronAPI.maximize();
                }
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-colors"
              title="최대화 / 원래 크기로"
            >
              <Square className="w-2.5 h-2.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && (window as any).electronAPI) {
                  (window as any).electronAPI.close();
                }
              }}
              className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-colors"
              title="닫기"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
});
