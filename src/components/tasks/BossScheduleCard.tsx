import React, { useState } from 'react';
import { TaskItem, CharacterInfo } from '../../types';
import { MapleIcon } from '../common/MapleIcon';
import {
  getBossSpec,
  calculateLevelDamageRate,
  calculateForceDamageRate,
  getDifficultyBadgeStyle,
  getDifficultyLabel,
} from '../../utils/bossSpecHelper';

interface BossScheduleCardProps {
  boss: TaskItem;
  character: CharacterInfo;
  isDone: boolean;
  onToggle: (bossId: string, currentCompleted: boolean) => void;
  themeType?: 'weekly' | 'daily' | 'black_mage';
}

/**
 * 인게임 공식 스펙 막대 게이지 바 컴포넌트
 */
const BossSpecMiniBar: React.FC<{
  label: string;
  userValue: number;
  bossValue: number;
  rate: number;
  rateLabel: string;
  maxRate: number;
}> = ({ label, userValue, bossValue, rate, rateLabel, maxRate }) => {
  // 게이지 바 퍼센트 계산 (보스 요구치 기준)
  const percent = bossValue > 0 ? Math.min(100, Math.max(10, Math.round((userValue / bossValue) * 100))) : 100;

  // 색상 판별 (100% 미만: 붉은 색 / 100% 이상: 파란색 / 최대치: 초록색)
  let textColor = 'text-blue-500 dark:text-blue-400';
  let barColor = 'bg-blue-500';

  if (rate < 100) {
    textColor = 'text-rose-500 dark:text-rose-400';
    barColor = 'bg-rose-500';
  } else if (rate >= maxRate) {
    textColor = 'text-emerald-500 dark:text-emerald-400';
    barColor = 'bg-emerald-500';
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
          <span>{label}</span>
          <span className="font-mono text-[10.5px] text-slate-500 dark:text-slate-400 font-normal">
            {bossValue}/{userValue}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`font-black font-mono text-[11.5px] ${textColor}`}>
            {rateLabel}
          </span>
        </div>
      </div>
      {/* 게이지 바 */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export const BossScheduleCard: React.FC<BossScheduleCardProps> = ({
  boss,
  character,
  isDone,
  onToggle,
  themeType = 'weekly',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 보스명 정규화 (앞쪽 난이도 접두사 및 뒤쪽 괄호 난이도 (하드/익스트림 등) 제거)
  const displayName = boss.name
    .replace(/^(이지|노말|하드|카오스|익스트림)\s*/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();
  const diffLabel = getDifficultyLabel(boss.difficulty);
  const diffBadgeStyle = getDifficultyBadgeStyle(boss.difficulty);
  const isBlackMage = displayName.includes('검은 마법사') || displayName.includes('검은마법사') || themeType === 'black_mage' || boss.id.includes('black_mage');

  // 캐릭터 스펙 (레벨, 아케인, 어센틱)
  const userLevel = Number(character.characterLevel ?? (character as any).character_level) || 200;
  const userArcane = Number(character.arcaneForce ?? (character as any).arcane_force) || 0;
  const userAuthentic = Number(character.authenticForce ?? (character as any).authentic_force) || 0;

  // 공식 보스 스펙 (레벨, 아케인, 어센틱)
  const spec = getBossSpec(displayName, boss.difficulty);
  const hasSpecData = spec.bossLevel != null;

  // 인게임 공식 배율 계산 (검은 마법사는 아케인 1.1배 110% 상한 적용)
  const levelInfo = calculateLevelDamageRate(userLevel, spec.bossLevel);
  const forceInfo = calculateForceDamageRate(userArcane, userAuthentic, spec.bossArcaneForce, spec.bossAuthenticForce, isBlackMage);

  // 결정석 메소 문자열
  let mesoStr = '';
  if (boss.mesoValue) {
    if (boss.mesoValue >= 100000000) {
      const eok = boss.mesoValue / 100000000;
      mesoStr = `${Number.isInteger(eok) ? eok : eok.toFixed(2)}억 메소`;
    } else {
      mesoStr = `${(boss.mesoValue / 10000).toLocaleString()}만 메소`;
    }
  }

  // 테마별 컬러 분기 (주간 / 일일 / 검은 마법사)
  let themeBorderActive = 'border-purple-300 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-700';
  // 주간 보스 완료 시 다크모드 배경(#23083d)에 맞춰 테두리만 살짝 더 밝게(dark:border-purple-700) 적용
  let themeDoneBg = 'bg-purple-100 dark:bg-[#23083d] border-purple-300 dark:border-purple-700 ring-1 ring-purple-400/30 dark:ring-purple-600/20 shadow-xs';
  let themeCheckColor = 'bg-purple-600 border-purple-600 text-white';
  let mesoColor = 'text-purple-600 dark:text-purple-400';

  if (isBlackMage) {
    themeBorderActive = 'border-red-400/80 dark:border-red-800 hover:border-red-500';
    themeDoneBg = 'bg-black dark:bg-black border-red-600 dark:border-red-600 ring-1 ring-red-600/50 shadow-md shadow-red-950/40 text-red-500';
    themeCheckColor = 'bg-red-600 border-red-600 text-white';
    mesoColor = isDone ? 'text-red-500 font-bold' : 'text-red-600 dark:text-red-400';
  } else if (themeType === 'daily') {
    themeBorderActive = 'border-sky-300 dark:border-sky-800 hover:border-sky-400 dark:hover:border-sky-700';
    themeDoneBg = 'bg-sky-100 dark:bg-sky-950 border-sky-300 dark:border-sky-700 ring-1 ring-sky-400/40 shadow-xs';
    themeCheckColor = 'bg-sky-500 border-sky-500 text-white';
    mesoColor = 'text-sky-600 dark:text-sky-400';
  }

  return (
    <div className="relative h-[86px]">
      <div
        className={`group absolute top-0 left-0 right-0 z-10 transition-all duration-350 ease-out border rounded-2xl shadow-2xs ${
          isHovered ? 'z-30 shadow-2xl' : ''
        } ${
          isDone
            ? themeDoneBg
            : `bg-white dark:bg-slate-900 border-slate-200/85 dark:border-slate-800 ${themeBorderActive}`
        }`}
      >
        {/* 기본 상단 카드 영역: 이 영역에 마우스가 있을 때만 추가 정보가 표시되며, 벗어나면(추가 정보 영역 포함) 즉시 접힘 */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => onToggle(boss.id, isDone)}
          className="h-[84px] p-3.5 flex items-center justify-between gap-3.5 cursor-pointer select-none"
        >
          {/* 좌측: 보스 이미지 */}
          <div className="w-13.5 h-13.5 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center">
            <MapleIcon
              name={displayName}
              icon={boss.icon}
              fallback="💀"
              className="w-full h-full object-contain drop-shadow-md transition-all group-hover:scale-105"
            />
          </div>

          {/* 중앙: 3단 수직 정돈 [난이도 배지] -> [보스 이름] -> [결정석 메소] */}
          <div className="flex-1 flex flex-col justify-center min-w-0 gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {diffLabel && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex-shrink-0 leading-tight ${
                  isDone && isBlackMage
                    ? 'bg-red-950/80 border-red-700/80 text-red-400'
                    : diffBadgeStyle
                }`}>
                  {diffLabel}
                </span>
              )}
            </div>

            <p className={`text-xs sm:text-sm font-black truncate transition-colors ${
              isDone && isBlackMage ? 'text-red-500 dark:text-red-500' : 'text-slate-800 dark:text-slate-100'
            }`}>
              {displayName}
            </p>

            {mesoStr && (
              <p className={`text-[11px] font-mono font-bold leading-tight ${mesoColor}`}>
                {mesoStr}
              </p>
            )}
          </div>
        </div>

        {/* 하단: 마우스가 상단 보스 카드에 올려져 있을 때만 아래로 부드럽게 펼쳐지는 인게임 공식 스펙 영역 (보스 카드와 추가 정보 칸 사이 선 제거) */}
        {hasSpecData && (
          <div
            className={`overflow-hidden transition-all duration-350 ease-out px-3.5 pointer-events-none ${
              isHovered
                ? 'max-h-48 opacity-100 pb-3.5 pt-1.5'
                : 'max-h-0 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-2 pt-0.5">
              {/* 1. 레벨 바 */}
              {spec.bossLevel != null && (
                <BossSpecMiniBar
                  label="레벨"
                  userValue={userLevel}
                  bossValue={spec.bossLevel}
                  rate={levelInfo.rate}
                  rateLabel={levelInfo.label}
                  maxRate={120}
                />
              )}

              {/* 2. 포스 바 (어센틱 또는 아케인) */}
              {forceInfo.type !== 'none' && (
                <BossSpecMiniBar
                  label={forceInfo.type === 'authentic' ? '어센틱포스' : '아케인포스'}
                  userValue={forceInfo.userForce}
                  bossValue={forceInfo.reqForce}
                  rate={forceInfo.rate}
                  rateLabel={forceInfo.label}
                  maxRate={forceInfo.type === 'authentic' ? 125 : (isBlackMage ? 110 : 150)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
