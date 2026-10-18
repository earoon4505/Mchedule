import React, { useEffect, useState, useMemo } from 'react';
import { CharacterInfo } from '../../types';
import { fetchCharacterCombatPower } from '../../services/api';
import { CharacterAvatar } from '../character/CharacterAvatar';
import { ConversionBossList } from './ConversionBossList';
import { Swords, Calculator, Sparkles, RefreshCw, Flame, Shield, Award, RotateCw } from 'lucide-react';

interface ConversionPageViewProps {
  character: CharacterInfo | null;
  onUpdateCharacter?: (updatedChar: CharacterInfo) => void;
}

/**
 * 메이플스토리 한국형 큰 숫자(전투력) 포맷팅 헬퍼
 * 예: 125430000 -> "1억 2,543만" (마우스 호버 시 전체 숫자 표시)
 */
function formatCombatPowerKR(raw?: string | number): { formatted: string; full: string } {
  if (!raw) return { formatted: '-', full: '-' };
  const num = typeof raw === 'number' ? raw : parseInt(String(raw).replace(/,/g, ''), 10);
  if (isNaN(num) || num <= 0) return { formatted: '-', full: '-' };

  const full = num.toLocaleString('ko-KR');

  if (num < 10000) {
    return { formatted: full, full };
  }

  const eok = Math.floor(num / 100000000);
  const man = Math.floor((num % 100000000) / 10000);

  if (eok > 0) {
    if (man > 0) {
      return { formatted: `${eok}억 ${man.toLocaleString('ko-KR')}만`, full };
    }
    return { formatted: `${eok}억`, full };
  }

  return { formatted: `${man.toLocaleString('ko-KR')}만`, full };
}

export const ConversionPageView: React.FC<ConversionPageViewProps> = ({ character, onUpdateCharacter }) => {
  const [combatPower, setCombatPower] = useState<string>(character?.combatPower || '');
  const [isLoadingCombatPower, setIsLoadingCombatPower] = useState(false);

  // 캐릭터 변경 시 캐시된 전투력 동기화 및 부재 시 넥슨 API 1회 자동 로드
  useEffect(() => {
    if (!character) return;
    setCombatPower(character.combatPower || '');

    // 전투력 및 포스가 아직 캐시되어 있지 않다면 백그라운드에서 1회 조회
    if (character.ocid && (!character.combatPower || character.arcaneForce == null || character.authenticForce == null)) {
      let isMounted = true;
      setIsLoadingCombatPower(true);
      fetchCharacterCombatPower(character.ocid, character.apiKeyId)
        .then((res) => {
          if (isMounted && res.success) {
            if (res.combatPower) setCombatPower(res.combatPower);
            if (onUpdateCharacter) {
              onUpdateCharacter({
                ...character,
                combatPower: res.combatPower || character.combatPower,
                arcaneForce: res.arcaneForce ?? character.arcaneForce,
                authenticForce: res.authenticForce ?? character.authenticForce,
              });
            }
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingCombatPower(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [character?.id, character?.ocid]);

  const cpDisplay = useMemo(() => formatCombatPowerKR(combatPower), [combatPower]);

  if (!character) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
        <p className="text-sm font-semibold">선택된 캐릭터가 없습니다.</p>
      </div>
    );
  }

  const [isRefreshingScouter, setIsRefreshingScouter] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // 환산 수동 갱신 핸들러 (수동 버튼 클릭 시에만 1회 동작)
  const handleRefreshConversion = async () => {
    if (!character || isRefreshingScouter) return;
    setIsRefreshingScouter(true);
    setRefreshFeedback(null);

    try {
      let stats = null;

      // 1순위: 초고속 로컬 Express 및 프록시 엔드포인트 호출 (데스크톱 및 웹 공통, 0.2~0.3초 이내 무오차 계산)
      try {
        const res = await fetch(`/api/scouter/stats?name=${encodeURIComponent(character.characterName)}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success && json.stats) {
          stats = json.stats;
        }
      } catch (fetchErr) {
        console.warn('Local proxy fetch failed, falling back:', fetchErr);
      }

      // 2순위: 데스크톱 앱 전용 Electron IPC 핸들러 호출 (로컬 프록시 실패 시 폴백)
      if (!stats && (window as any).electronAPI?.fetchScouterStats) {
        const res = await (window as any).electronAPI.fetchScouterStats(character.characterName);
        if (res && res.success && res.stats) {
          stats = res.stats;
        } else if (res && res.error) {
          throw new Error(res.error);
        }
      }

      if (!stats) {
        throw new Error('환산 데이터를 불러오지 못했습니다. 사이트 응답을 확인해주세요.');
      }

      if (stats) {
        if (stats.combatPower) {
          setCombatPower(stats.combatPower);
        }
        if (onUpdateCharacter) {
          onUpdateCharacter({
            ...character,
            combatPower: stats.combatPower || character.combatPower,
            arcaneForce: typeof stats.arcaneForce === 'number' && stats.arcaneForce > 0 ? stats.arcaneForce : character.arcaneForce,
            authenticForce: typeof stats.authenticForce === 'number' && stats.authenticForce > 0 ? stats.authenticForce : character.authenticForce,
            scouterStats: stats,
          });
        }
        setRefreshFeedback({ message: '환산 스펙이 성공적으로 갱신되었습니다.', isError: false });
        setTimeout(() => setRefreshFeedback(null), 3000);
      }
    } catch (e: any) {
      console.warn('환산 갱신 중 오류:', e);
      setRefreshFeedback({ 
        message: e.message || '환산 정보를 불러오지 못했습니다. 사이트 상태를 확인해주세요.', 
        isError: true 
      });
      setTimeout(() => setRefreshFeedback(null), 4000);
    } finally {
      setIsRefreshingScouter(false);
    }
  };

  const mainStatDisplay = character.scouterStats?.mainStat || '-';
  const hexaStatDisplay = character.scouterStats?.hexaStat || '-';
  const userArcane = character.scouterStats?.arcaneForce != null 
    ? character.scouterStats.arcaneForce 
    : (character.arcaneForce ?? 0);
  const userAuthentic = character.scouterStats?.authenticForce != null 
    ? character.scouterStats.authenticForce 
    : (character.authenticForce ?? 0);

  return (
    <div 
      id="conversion-page-container" 
      className="flex-1 w-full h-full flex flex-col overflow-y-auto no-scrollbar p-4 sm:p-6 bg-[#F8F9FB] dark:bg-slate-950 min-h-0 space-y-5 select-none"
    >
      {/* 1. 선택된 캐릭터 프로필 헤더 바 */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-13 h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
            <CharacterAvatar
              imageUrl={character.characterImage}
              name={character.characterName}
              containerClassName="w-full h-full border-0"
              size="custom"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {character.characterName}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {character.worldName}
              </span>
              {character.characterGuildName && (
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {character.characterGuildName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 flex-wrap">
              <span>Lv.{character.characterLevel}</span>
              <span>•</span>
              <span className="truncate">{character.characterClass}</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60">
                아케인 포스 {userArcane.toLocaleString('ko-KR')}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200/80 dark:border-orange-800/60">
                어센틱 포스 {userAuthentic.toLocaleString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        {/* 캐릭터 프로필 오른쪽: 환산 갱신 버튼 및 안내 */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {refreshFeedback && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border animate-in fade-in duration-200 ${
              refreshFeedback.isError
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}>
              {refreshFeedback.message}
            </span>
          )}

          <button
            type="button"
            id="btn-scouter-refresh-icon"
            onClick={handleRefreshConversion}
            disabled={isRefreshingScouter}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all shadow-2xs hover:text-orange-500 active:scale-95 cursor-pointer disabled:opacity-50"
            title="환산 갱신"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshingScouter ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. 상단 3대 핵심 스탯 카드 (전투력, 환산, 헥사 환산) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* ① 전투력 카드 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all hover:border-orange-300 dark:hover:border-orange-700/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-500 border border-orange-200/70 dark:border-orange-800/80 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                전투력
              </span>
            </div>
            {isLoadingCombatPower && (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
            )}
          </div>
          <div className="mt-1" title={cpDisplay.full !== '-' ? `전투력: ${cpDisplay.full}` : undefined}>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {cpDisplay.formatted}
            </div>
          </div>
        </div>

        {/* ② 환산 (환산 주스탯) 카드 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all hover:border-sky-300 dark:hover:border-sky-700/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-500 border border-sky-200/70 dark:border-sky-800/80 flex items-center justify-center">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                환산
              </span>
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
              {mainStatDisplay}
            </div>
          </div>
        </div>

        {/* ③ 헥사 환산 카드 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden transition-all hover:border-purple-300 dark:hover:border-purple-700/60">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-500 border border-purple-200/70 dark:border-purple-800/80 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                헥사 환산
              </span>
            </div>
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {hexaStatDisplay}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 보스별 배율 및 클리어 컷 카드 목록 (한 줄 3개 가로 직사각형 카드) */}
      <ConversionBossList character={character} />
    </div>
  );
};
