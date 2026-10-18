import React, { useState, useMemo } from 'react';
import { MapleIcon } from '../common/MapleIcon';
import { CharacterInfo, BossMultiplierItem } from '../../types';
import scouterBossDefs from '../../data/scouterBossDefinitions.json';
import {
  LEVEL_GAP_TABLE,
  getArcaneGapDmg,
  getAuthenticGapDmg,
  DIFF_LABELS,
  normalizeBossDisplayName,
  getBossCategory,
} from '../../utils/scouterEngine';

/**
 * 기본 프리뷰용 보스 목록 (아직 환산 갱신을 누르지 않았을 때 표시)
 */
export const DEFAULT_PREVIEW_BOSSES: BossMultiplierItem[] = (scouterBossDefs as any[]).map((b) => {
  const displayBoss = normalizeBossDisplayName(b.boss);
  const diffLower = String(b.difficulty).toLowerCase();
  const nameLower = String(b.name).toLowerCase();
  const primaryKey = `${diffLower}_${nameLower}`;

  return {
    id: `scouter_${nameLower}_${diffLower}`,
    bossName: displayBoss,
    difficulty: b.difficulty,
    difficultyLabel: DIFF_LABELS[b.difficulty] || b.difficulty,
    category: getBossCategory(b.boss),
    rawImg: primaryKey,
    iconUrl: `https://maplescouter.com/bossIcon/${primaryKey}.webp`,
    multiplier: '-',
    multiplierNum: null,
    statusLabel: '환산 갱신 필요',
    stat: b.bossCut || b.partyBossCut || 10000,
    isParty: !!b.partyBossCut,
    bossLevel: b.level,
    bossArcaneForce: b.arcaneForce,
    bossAuthenticForce: b.authenticForce,
  };
});

// 빠른 검색용 사전 맵 (누락된 보스 이름/난이도/아이콘 자동 복원 보강용)
const PREVIEW_BOSS_MAP = new Map<string, BossMultiplierItem>();
const BOSS_DEF_MAP = new Map<string, any>();

(scouterBossDefs as any[]).forEach((b) => {
  const diffLower = String(b.difficulty).toLowerCase();
  const nameLower = String(b.name).toLowerCase();
  const bossLower = String(b.boss).replace(/\s+/g, '').toLowerCase();
  BOSS_DEF_MAP.set(`${diffLower}_${nameLower}`, b);
  BOSS_DEF_MAP.set(`${diffLower}_${bossLower}`, b);
  BOSS_DEF_MAP.set(nameLower, b);
  BOSS_DEF_MAP.set(bossLower, b);
});

DEFAULT_PREVIEW_BOSSES.forEach((b) => {
  if (b.rawImg) PREVIEW_BOSS_MAP.set(b.rawImg.toLowerCase(), b);
  if (b.id) PREVIEW_BOSS_MAP.set(b.id.toLowerCase(), b);
  const diffLower = String(b.difficulty).toLowerCase();
  const bossLower = String(b.bossName).replace(/\s+/g, '').toLowerCase();
  PREVIEW_BOSS_MAP.set(`${diffLower}_${bossLower}`, b);
});

// 메이플스카우터 공식 어센틱 심볼 매핑 (보스 -> 어센틱 심볼 식별 키)
const BOSS_AUTHENTIC_SYMBOL_KEY: Record<string, string> = {
  // 세르니움 (어센틱 심볼 1)
  '세렌': 'authentic_symbol_1',
  '선택받은 세렌': 'authentic_symbol_1',
  '선택받은세렌': 'authentic_symbol_1',

  // 아르크스 (어센틱 심볼 2)
  '칼로스': 'authentic_symbol_2',
  '감시자 칼로스': 'authentic_symbol_2',
  '감시자칼로스': 'authentic_symbol_2',

  // 오디움 (어센틱 심볼 3)
  '대적자': 'authentic_symbol_3',
  '최초의 대적자': 'authentic_symbol_3',
  '최초의대적자': 'authentic_symbol_3',

  // 도원경 (어센틱 심볼 4)
  '카링': 'authentic_symbol_4',

  // 아르테리아 (어센틱 심볼 5)
  '흉성': 'authentic_symbol_5',
  '찬란한 흉성': 'authentic_symbol_5',
  '찬란한흉성': 'authentic_symbol_5',
  '벨로나': 'authentic_symbol_5',
  '찬란한 벨로나': 'authentic_symbol_5',
  '찬란한벨로나': 'authentic_symbol_5',

  // 카르시온 (어센틱 심볼 6)
  '림보': 'authentic_symbol_6',
  '근원의 림보': 'authentic_symbol_6',
  '근원의림보': 'authentic_symbol_6',

  // 탈라하트 (그랜드 어센틱 심볼 1)
  '발드릭스': 'grand_authentic_symbol_1',

  // 기어드락 (그랜드 어센틱 심볼 2)
  '유피테르': 'grand_authentic_symbol_2',
};

// 보스 이름에 대응하는 어센틱 심볼 식별 키를 안전하게 검색하는 헬퍼 함수
function getSymbolKeyForBoss(bossName?: string): string | undefined {
  if (!bossName) return undefined;
  if (BOSS_AUTHENTIC_SYMBOL_KEY[bossName]) return BOSS_AUTHENTIC_SYMBOL_KEY[bossName];
  const clean = bossName.replace(/\s+/g, '').toLowerCase();
  for (const [key, val] of Object.entries(BOSS_AUTHENTIC_SYMBOL_KEY)) {
    const cleanKey = key.replace(/\s+/g, '').toLowerCase();
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return val;
    }
  }
  return undefined;
}

// 불완전한 데이터가 들어와도 이름, 난이도, 사진 및 레벨/포스 패널티를 100% 완전 복원 및 실시간 계산
function enrichBossItem(item: any, character: CharacterInfo): BossMultiplierItem {
  const rawKey = (item.rawImg || '').toLowerCase();
  const idKey = (item.id || '').toLowerCase();
  const diff = item.difficulty || '';
  const diffLower = diff.toLowerCase();
  const boss = item.bossName || '';
  const bossLower = boss.replace(/\s+/g, '').toLowerCase();

  const fallback = PREVIEW_BOSS_MAP.get(rawKey) ||
                   PREVIEW_BOSS_MAP.get(idKey) ||
                   PREVIEW_BOSS_MAP.get(`${diffLower}_${bossLower}`) ||
                   PREVIEW_BOSS_MAP.get(rawKey.replace(/_/g, ''));

  const rawDef = BOSS_DEF_MAP.get(`${diffLower}_${bossLower}`) ||
                 BOSS_DEF_MAP.get(rawKey) ||
                 BOSS_DEF_MAP.get(bossLower);

  const finalDiff = item.difficulty || fallback?.difficulty || rawDef?.difficulty || 'Normal';
  const finalBoss = normalizeBossDisplayName(item.bossName || fallback?.bossName || rawDef?.boss || '보스');
  const finalRawImg = item.rawImg || fallback?.rawImg || '';
  const finalIconUrl = item.iconUrl || fallback?.iconUrl || (finalRawImg ? `https://maplescouter.com/bossIcon/${finalRawImg}.webp` : '');

  // 1. 보스 스펙 및 유저 스펙 산출 (캐릭터 실시간 최신 정보와 다중 연동)
  const bossLevel = item.bossLevel ?? rawDef?.level ?? fallback?.bossLevel;
  const bossArcaneForce = item.bossArcaneForce ?? rawDef?.arcaneForce ?? fallback?.bossArcaneForce;
  const bossAuthenticForce = item.bossAuthenticForce ?? rawDef?.authenticForce ?? fallback?.bossAuthenticForce;

  const userLevel = item.userLevel || character.characterLevel || 260;
  const userArcaneForce = item.userArcaneForce || character.scouterStats?.arcaneForce || character.arcaneForce || 0;
  const userAuthenticForce = item.userAuthenticForce || character.scouterStats?.authenticForce || character.authenticForce || 0;

  // 2. 레벨 배율 계산 (메이플스카우터 공식 및 메이플 레벨 데미지 테이블)
  let levelDmgPercent = 100;
  let hasLevelPenalty = false;
  if (bossLevel != null) {
    const dLevel = userLevel - bossLevel;
    const levelKey = (dLevel > 5 ? 5 : dLevel < -40 ? -40 : dLevel).toString();
    levelDmgPercent = LEVEL_GAP_TABLE[levelKey] ?? 100;
    // 환산 공식: 레벨 최대 뎀뻥(120%) 기준 미달 시 부족(Lv) 판정 (userLevel < bossLevel + 5)
    hasLevelPenalty = userLevel < (bossLevel + 5);
  }

  // 3. 포스 배율 계산 (어센틱 / 아케인)
  const hasAuthentic = !!bossAuthenticForce;
  const hasArcane = !!bossArcaneForce;
  const forceType: 'authentic' | 'arcane' | 'none' = hasAuthentic ? 'authentic' : hasArcane ? 'arcane' : 'none';
  const reqForce = hasAuthentic ? bossAuthenticForce : hasArcane ? bossArcaneForce : undefined;
  const userForce = hasAuthentic ? userAuthenticForce : hasArcane ? userArcaneForce : undefined;

  let forceDmgPercent = 100;
  let hasForcePenalty = false;
  let isMaxSymbolShortage = false;

  const isBlackMage = finalBoss.includes('검은 마법사') || finalBoss.includes('검은마법사');

  if (hasAuthentic && bossAuthenticForce) {
    forceDmgPercent = getAuthenticGapDmg(bossAuthenticForce, userAuthenticForce);
    // 환산 공식: 어센틱 포스 최대 배율(125%) 기준 미달 시 부족(F) 판정 (userForce < bossForce + 50)
    hasForcePenalty = userAuthenticForce < (bossAuthenticForce + 50);

    // 심볼 만렙 부족(S): 해당 지역 심볼 만렙(Lv.11) 미달 여부
    const symbolKey = getSymbolKeyForBoss(finalBoss) ||
                      getSymbolKeyForBoss(item.bossName) ||
                      getSymbolKeyForBoss(fallback?.bossName);

    const userSymbols = character.scouterStats?.userSymbol;
    if (symbolKey) {
      if (userSymbols) {
        const targetSymbol = userSymbols[symbolKey];
        // 해당 심볼이 인벤토리에 없거나 만렙(11) 미만인 경우 모두 부족(S) 판정
        if (!targetSymbol) {
          isMaxSymbolShortage = true;
        } else {
          const symLevel = Number(targetSymbol.level ?? 0);
          isMaxSymbolShortage = symLevel < 11;
        }
      } else {
        // 심볼 상세 데이터가 아직 조회되지 않은 경우: 보스의 최대 포스뻥(bossForce + 50) 미달 시 부족으로 판정
        isMaxSymbolShortage = userAuthenticForce < (bossAuthenticForce + 50);
      }
    } else {
      // 심볼 키 매핑이 명시되지 않은 어센틱 보스의 경우도 최대 포스뻥 미달 시 부족 판정
      isMaxSymbolShortage = userAuthenticForce < (bossAuthenticForce + 50);
    }
  } else if (hasArcane && bossArcaneForce) {
    forceDmgPercent = getArcaneGapDmg(bossArcaneForce, userArcaneForce);
    // 환산 공식: 아케인 포스 최대 배율(검마 110%, 일반 150%) 기준 미달 시 부족(F) 판정
    const maxArcaneCap = isBlackMage ? Math.round(bossArcaneForce * 1.1) : Math.round(bossArcaneForce * 1.5);
    hasForcePenalty = userArcaneForce < maxArcaneCap;
  }

  // 4. 최대치 대비 최종 데미지 감소율 계산 (환산 공식)
  const maxLevelDmg = 1.2;
  const maxArcaneDmg = isBlackMage ? 1.1 : 1.5;
  const maxAuthenticDmg = 1.25;

  const levelRatio = (levelDmgPercent / 100) / maxLevelDmg;
  const arcaneRatio = hasArcane && bossArcaneForce ? (forceDmgPercent / 100) / maxArcaneDmg : 1;
  const authenticRatio = hasAuthentic && bossAuthenticForce ? (forceDmgPercent / 100) / maxAuthenticDmg : 1;

  const netRatio = levelRatio * (hasArcane ? arcaneRatio : 1) * (hasAuthentic ? authenticRatio : 1);
  const totalDmgPenaltyPercent = netRatio < 1 ? parseFloat(((1 - netRatio) * 100).toFixed(1)) : 0;

  return {
    ...fallback,
    ...item,
    id: item.id || fallback?.id || `scouter_${finalRawImg}`,
    bossName: finalBoss,
    difficulty: finalDiff,
    difficultyLabel: item.difficultyLabel || DIFF_LABELS[finalDiff] || fallback?.difficultyLabel || finalDiff,
    category: item.category || fallback?.category || getBossCategory(finalBoss),
    rawImg: finalRawImg,
    iconUrl: finalIconUrl,
    multiplier: item.multiplier || '-',
    multiplierNum: item.multiplierNum != null ? item.multiplierNum : null,
    statusLabel: item.statusLabel || '환산 갱신 필요',
    isParty: item.isParty !== undefined ? item.isParty : (fallback?.isParty || false),
    bossLevel,
    bossArcaneForce,
    bossAuthenticForce,
    userLevel,
    userArcaneForce,
    userAuthenticForce,
    levelDmgPercent,
    forceDmgPercent,
    forceType,
    reqForce,
    userForce,
    totalDmgPenaltyPercent,
    hasLevelPenalty,
    hasForcePenalty,
    isMaxSymbolShortage,
  };
}

/**
 * 난이도별 배지 색상 스타일 반환
 */
function getDifficultyBadgeStyle(diff?: string) {
  switch (diff) {
    case 'Extreme':
      return 'bg-black text-[#FF0000] border border-[#FF0000] font-extrabold';
    case 'Destiny':
      return 'bg-white text-black border border-black dark:bg-white dark:text-black dark:border-black font-bold';
    case 'Champion':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold';
    case 'Chaos':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-bold';
    case 'Hard':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold';
    case 'Normal':
      return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-medium';
    case 'Easy':
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 font-medium';
  }
}

/**
 * 상태 라벨에 따른 카드 스타일 및 배율 폰트 색상 반환
 */
function getStatusLabelStyle(label: string): { statusStyle: string; cardBorderGlow: string; multiplierColor: string } {
  if (label.includes('솔플')) {
    return {
      statusStyle: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800 font-bold',
      cardBorderGlow: 'hover:border-blue-400 dark:hover:border-blue-500 shadow-2xs',
      multiplierColor: 'text-blue-600 dark:text-blue-400',
    };
  }

  if (label.includes('파티') || label.includes('인')) {
    return {
      statusStyle: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 font-bold',
      cardBorderGlow: 'hover:border-slate-400 dark:hover:border-slate-500 shadow-2xs',
      multiplierColor: 'text-slate-700 dark:text-slate-300',
    };
  }

  if (label.includes('최소컷')) {
    return {
      statusStyle: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-bold',
      cardBorderGlow: 'hover:border-amber-400 dark:hover:border-amber-500 shadow-2xs',
      multiplierColor: 'text-amber-600 dark:text-amber-400',
    };
  }

  if (label.includes('불가능')) {
    return {
      statusStyle: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800 font-semibold',
      cardBorderGlow: 'hover:border-rose-300 dark:hover:border-rose-700 shadow-2xs',
      multiplierColor: 'text-rose-500 dark:text-rose-400',
    };
  }

  return {
    statusStyle: 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800',
    cardBorderGlow: 'hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs',
    multiplierColor: 'text-slate-400 dark:text-slate-500',
  };
}

/**
 * 보스 아이콘 지능형 렌더러
 */
const SmartConversionBossIcon: React.FC<{
  bossName: string;
  rawImg?: string;
  iconUrl?: string;
  className?: string;
}> = ({ bossName, rawImg, iconUrl, className }) => {
  const [loadFailed, setLoadFailed] = useState(false);
  const [useFallbackUrl, setUseFallbackUrl] = useState(false);

  const fallbackScouterUrl = useMemo(() => {
    if (iconUrl) return iconUrl;
    if (rawImg) return `https://maplescouter.com/bossIcon/${rawImg}.webp`;
    return null;
  }, [iconUrl, rawImg]);

  if (!loadFailed && !useFallbackUrl) {
    return (
      <MapleIcon
        type="boss"
        name={bossName}
        className={className}
        onError={() => {
          if (fallbackScouterUrl) {
            setUseFallbackUrl(true);
          } else {
            setLoadFailed(true);
          }
        }}
      />
    );
  }

  if (loadFailed || !fallbackScouterUrl) {
    return (
      <img
        src="/public/icons/default-avatar.png"
        alt={bossName}
        className={className}
      />
    );
  }

  return (
    <img
      src={fallbackScouterUrl}
      alt={bossName}
      className={className}
      onError={() => setLoadFailed(true)}
    />
  );
};

/**
 * 막대 그래프 컴포넌트:
 * [라벨] [보스 수치] [ 막대 그래프 (0 ~ 최대치, 100% 위치에 | 기준선) ] [배율 수치]
 * 색상: 100% 미만 = 붉은 색, 100% 이상 = 파랑 색, 최대치 = 초록 색
 * 좌측 라벨과 수치 폭을 단정하게 정렬하고, 그래프 크기를 카드에 맞춰 조화로운 크기로 균형 조정
 */
interface BossSpecBarProps {
  label: string; // '레벨' | '어센틱 포스' | '아케인 포스'
  bossValue: number; // 보스 요구치
  userValue: number; // 유저 실제 수치
  maxValue: number; // 그래프 최대치 (레벨: bossLevel + 5, 어센틱: bossAuthentic + 50, 아케인: 1.5배 or 검마 1.1배)
  currentRate: number; // 현재 배율 (%)
}

const BossSpecBar: React.FC<BossSpecBarProps> = ({
  label,
  bossValue,
  userValue,
  maxValue,
  currentRate,
}) => {
  // 100% 지점 위치 (%) = (bossValue / maxValue) * 100%
  const hundredPosPercent = maxValue > 0 ? Math.min(100, Math.max(0, (bossValue / maxValue) * 100)) : 100;
  // 유저 수치 기반 채워지는 폭 = (userValue / maxValue) * 100%
  const fillWidthPercent = maxValue > 0 ? Math.min(100, Math.max(0, (userValue / maxValue) * 100)) : 0;

  // 색상 결정 (유저 수치 vs 보스 요구치 및 최대치):
  // 100% 미만(보스 요구치 미만): 붉은 색
  // 100% 이상 ~ 최대치 미만: 파랑 색
  // 최대치 도달: 초록 색
  const isUnder100 = userValue < bossValue;
  const isMaxCap = userValue >= maxValue;

  const barColor = isUnder100
    ? 'bg-rose-500'
    : isMaxCap
    ? 'bg-emerald-500'
    : 'bg-blue-500';

  const textColor = isUnder100
    ? 'text-rose-600 dark:text-rose-400'
    : isMaxCap
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-blue-600 dark:text-blue-400';

  const formattedRate = `${currentRate % 1 === 0 ? currentRate : currentRate.toFixed(1)}%`;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
      {/* 1. 라벨 및 보스 요구 수치: 좌측 여백을 최적화하여 막대 그래프가 왼쪽으로 더 뻗어나가도록 컴팩트하게 배치 */}
      <div className="flex items-center justify-between w-[76px] sm:w-[82px] flex-shrink-0 text-[10.5px]">
        <span className="font-bold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
          {bossValue}
        </span>
      </div>

      {/* 2. 막대 그래프: 왼쪽 남는 여백을 채우며 좀 더 크고 볼륨감 있게 조정된 프로그레스 바 */}
      <div
        className="flex-1 h-2 sm:h-2.5 bg-slate-200/80 dark:bg-slate-800 rounded-full relative overflow-hidden flex items-center"
      >
        {/* 채워지는 게이지 바 */}
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${fillWidthPercent}%` }}
        />

        {/* 100% 구간 세로선 | (라이트 및 다크 모드 모두 선명한 검정색 적용) */}
        <div
          className="absolute top-0 bottom-0 w-[1.5px] bg-black dark:bg-black z-10 shadow-xs"
          style={{ left: `${hundredPosPercent}%` }}
        />
      </div>

      {/* 3. 배율 수치: 고정 너비와 우측 정렬로 흔들림 없이 표시 */}
      <span className={`w-9 sm:w-10 text-[10.5px] font-black text-right flex-shrink-0 tabular-nums ${textColor}`}>
        {formattedRate}
      </span>
    </div>
  );
};

type FilterMode = '전체' | '내 기준' | '솔플 가능' | '파티 가능';

interface ConversionBossListProps {
  character: CharacterInfo;
}

export const ConversionBossList: React.FC<ConversionBossListProps> = ({ character }) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('내 기준');
  const [includeDestinyChampion, setIncludeDestinyChampion] = useState<boolean>(true);

  // 원본 보스 목록을 가져오고 실시간 스펙(레벨/포스 패널티)을 주입
  const activeBossList: BossMultiplierItem[] = useMemo(() => {
    // 1순위: 환산 사이트에서 내려준 원본 순서 배열 (bossList)
    if (Array.isArray(character.scouterStats?.bossList) && character.scouterStats.bossList.length > 0) {
      return character.scouterStats.bossList.map((item) => enrichBossItem(item, character));
    }

    // 2순위: 맵 객체(bossMultipliers)가 있는 경우
    if (character.scouterStats?.bossMultipliers && Object.keys(character.scouterStats.bossMultipliers).length > 0) {
      const mults = character.scouterStats.bossMultipliers;
      const matchedKeys = new Set<string>();

      const list: BossMultiplierItem[] = DEFAULT_PREVIEW_BOSSES.map((previewBoss) => {
        const rawKey = (previewBoss.rawImg || '').toLowerCase();
        const diffLower = String(previewBoss.difficulty).toLowerCase();
        const bossLower = String(previewBoss.bossName).replace(/\s+/g, '').toLowerCase();
        const combKey = `${diffLower}_${bossLower}`;

        const found = mults[rawKey] || mults[combKey] || mults[previewBoss.id];
        if (found) {
          if (found.rawImg) matchedKeys.add(found.rawImg.toLowerCase());
          matchedKeys.add(rawKey);
          matchedKeys.add(combKey);
          return enrichBossItem({ ...previewBoss, ...found }, character);
        }
        return enrichBossItem(previewBoss, character);
      });

      // 공식 명세 외에 신규로 추가된 보스가 있을 경우 목록 뒤에 추가
      const extraItems = Object.values(mults) as any[];
      for (const item of extraItems) {
        const rawKey = (item.rawImg || '').toLowerCase();
        if (rawKey && !matchedKeys.has(rawKey)) {
          matchedKeys.add(rawKey);
          list.push(enrichBossItem(item, character));
        }
      }

      return list;
    }

    // 3순위 (아직 환산 갱신 전): 기본 프리뷰 목록 표시
    return DEFAULT_PREVIEW_BOSSES.map((b) => enrichBossItem(b, character));
  }, [character, character.scouterStats?.bossList, character.scouterStats?.bossMultipliers, character.scouterStats?.arcaneForce, character.scouterStats?.authenticForce, character.arcaneForce, character.authenticForce, character.characterLevel]);

  // 필터링 적용 목록
  const filteredBosses = useMemo(() => {
    return activeBossList.filter((boss) => {
      // 1. 데스티니 / 챔피언 포함 여부
      const isDestinyOrChampion = boss.difficulty === 'Destiny' || boss.difficulty === 'Champion';
      if (!includeDestinyChampion && isDestinyOrChampion) {
        return false;
      }

      const status = boss.statusLabel || '';
      const mult = boss.multiplierNum;
      const clearRate = mult != null ? mult / 100 : null;
      const isParty = boss.isParty || status.includes('파티');

      // 2. 내 기준 필터링
      if (filterMode === '내 기준') {
        if (clearRate != null) {
          if (isParty) {
            const limit = 6;
            if (clearRate / limit > 10) return false;
            if (clearRate < 0.85 / limit) return false;
            return true;
          } else {
            if (clearRate > 10) return false;
            if (clearRate < 0.15) return false;
            return true;
          }
        }
        return true;
      }

      // 3. 솔플 가능
      if (filterMode === '솔플 가능') {
        const isSoloCut = status.includes('솔플');
        const isSoloRate = !isParty && clearRate != null && clearRate >= 0.9;
        return isSoloCut || isSoloRate;
      }

      // 4. 파티 가능
      if (filterMode === '파티 가능') {
        if (status === '불가능' || status === '환산 갱신 필요' || !status) {
          return false;
        }
        return true;
      }

      return true;
    });
  }, [activeBossList, filterMode, includeDestinyChampion]);

  return (
    <div className="flex flex-col space-y-4">
      {/* 상단 필터 바: [전체, 내 기준, 솔플 가능, 파티 가능] 탭 & [데스티니/챔피언] 토글 버튼 */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        {/* 필터 기준 탭 */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          {(['전체', '내 기준', '솔플 가능', '파티 가능'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                filterMode === mode
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* 데스티니 / 챔피언 토글 버튼 */}
        <button
          type="button"
          onClick={() => setIncludeDestinyChampion((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            includeDestinyChampion
              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 line-through opacity-75'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${includeDestinyChampion ? 'bg-orange-500' : 'bg-slate-400'}`} />
          데스티니 / 챔피언
        </button>
      </div>

      {/* 보스 카드 그리드: 한 줄에 총 3개씩 배치 */}
      {filteredBosses.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          선택한 필터 조건에 해당하는 보스가 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-28">
          {filteredBosses.map((boss, idx) => {
            const statusText = boss.statusLabel || '환산 갱신 필요';
            const evalStyle = getStatusLabelStyle(statusText);
            const diffBadgeStyle = getDifficultyBadgeStyle(boss.difficulty);
            const displayName = boss.bossName || '보스';
            const diffLabel = boss.difficultyLabel || DIFF_LABELS[boss.difficulty || ''] || boss.difficulty || '';

            const isBlackMage = displayName.includes('검은 마법사') || displayName.includes('검은마법사');

            // 1. 부족 항목 분석 (레벨: Lv, 포스: F, 심볼 만렙: S)
            const shortageBadges: { code: string; type: string; desc: string }[] = [];
            if (boss.hasLevelPenalty) {
              const isLoss = (boss.userLevel || 0) < (boss.bossLevel || 0);
              shortageBadges.push({
                code: 'Lv',
                type: 'level',
                desc: isLoss
                  ? `레벨 반감 (내 Lv.${boss.userLevel} / 보스 Lv.${boss.bossLevel})`
                  : `레벨 최대치 미달 (내 Lv.${boss.userLevel} / 최대 뎀 Lv.${(boss.bossLevel || 0) + 5})`,
              });
            }
            if (boss.hasForcePenalty) {
              const fName = boss.forceType === 'authentic' ? '어센틱 포스' : '아케인 포스';
              const isLoss = (boss.userForce || 0) < (boss.reqForce || 0);
              const maxReq = boss.forceType === 'authentic'
                ? (boss.bossAuthenticForce || 0) + 50
                : isBlackMage
                ? Math.round((boss.bossArcaneForce || 0) * 1.1)
                : Math.round((boss.bossArcaneForce || 0) * 1.5);
              shortageBadges.push({
                code: 'F',
                type: 'force',
                desc: isLoss
                  ? `${fName} 반감 (내 포스 ${boss.userForce} / 요구 ${boss.reqForce})`
                  : `${fName} 최대치 미달 (내 포스 ${boss.userForce} / 최대 뎀 ${maxReq})`,
              });
            }
            if (boss.isMaxSymbolShortage) {
              shortageBadges.push({
                code: 'S',
                type: 'symbol',
                desc: '심볼 만렙 미달',
              });
            }

            const hasForceRow = (boss.forceType === 'authentic' && boss.bossAuthenticForce) ||
                                (boss.forceType === 'arcane' && boss.bossArcaneForce);

            // 추가 상세 정보 영역 내용 (막대 그래프 + 최종 데미지 감소 문구)
            const specDetailContent = (
              <div className="flex flex-col gap-1.5">
                {/* 1. 레벨 행 (제일 윗 줄에 배치) */}
                {boss.bossLevel != null && (
                  <BossSpecBar
                    label="레벨"
                    bossValue={boss.bossLevel}
                    userValue={boss.userLevel || 260}
                    maxValue={boss.bossLevel + 5}
                    currentRate={boss.levelDmgPercent ?? 100}
                  />
                )}

                {/* 2. 포스 행: 어센틱 포스 or 아케인 포스 */}
                {hasForceRow && boss.forceType === 'authentic' && boss.bossAuthenticForce && (
                  <BossSpecBar
                    label="어센틱 포스"
                    bossValue={boss.bossAuthenticForce}
                    userValue={boss.userAuthenticForce || 0}
                    maxValue={boss.bossAuthenticForce + 50}
                    currentRate={boss.forceDmgPercent ?? 100}
                  />
                )}

                {hasForceRow && boss.forceType === 'arcane' && boss.bossArcaneForce && (
                  <BossSpecBar
                    label="아케인 포스"
                    bossValue={boss.bossArcaneForce}
                    userValue={boss.userArcaneForce || 0}
                    maxValue={isBlackMage ? Math.round(boss.bossArcaneForce * 1.1) : Math.round(boss.bossArcaneForce * 1.5)}
                    currentRate={boss.forceDmgPercent ?? 100}
                  />
                )}

                {/* 최종 데미지 감소 문구 (하단 구분선 제거) */}
                <div className="flex items-center justify-end pt-0.5 text-[11px]">
                  {(boss.totalDmgPenaltyPercent ?? 0) > 0 ? (
                    <span className="font-black text-rose-600 dark:text-rose-400 text-[11px]">
                      최종 데미지 {(boss.totalDmgPenaltyPercent ?? 0).toFixed(1)}% 감소
                    </span>
                  ) : (
                    <span className="font-bold text-slate-400 dark:text-slate-500 text-[10.5px]">
                      최종 데미지 감소 없음
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <ConversionBossCardItem
                key={boss.id || `${boss.difficulty}_${boss.rawImg || boss.bossName}_${idx}`}
                boss={boss}
                idx={idx}
                evalStyle={evalStyle}
                diffBadgeStyle={diffBadgeStyle}
                displayName={displayName}
                diffLabel={diffLabel}
                shortageBadges={shortageBadges}
                specDetailContent={specDetailContent}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * 단일 보스 카드 아이템 컴포넌트
 * - 마우스 호버 시 부드럽게 아래로 길어지며 추가 정보 표시
 * - 모든 보스 카드가 일관되게 아래로 펼쳐짐
 * - 보스 카드 부분이 아닌 추가 내용에 마우스를 올려도 닫히도록 마우스 이벤트를 안 올린 판정으로 처리
 */
interface ConversionBossCardItemProps {
  boss: BossMultiplierItem;
  idx: number;
  evalStyle: { statusStyle: string; cardBorderGlow: string; multiplierColor: string };
  diffBadgeStyle: string;
  displayName: string;
  diffLabel: string;
  shortageBadges: { code: string; type: string; desc: string }[];
  specDetailContent: React.ReactNode;
}

const ConversionBossCardItem: React.FC<ConversionBossCardItemProps> = ({
  boss,
  idx,
  evalStyle,
  diffBadgeStyle,
  displayName,
  diffLabel,
  shortageBadges,
  specDetailContent,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={boss.id || `${boss.difficulty}_${boss.rawImg || boss.bossName}_${idx}`}
      className="relative h-[86px]"
    >
      {/* 실제 카드 컨테이너:
          - 모든 보스 카드가 top-0에 고정되어 아래로 부드럽게 펼쳐짐
          - 부드러운 펼쳐짐/접힘 속도 적용: duration-350 ease-out
      */}
      <div
        className={`group absolute top-0 left-0 right-0 z-10 hover:z-30 transition-all duration-350 ease-out bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs hover:shadow-2xl hover:border-slate-400 dark:hover:border-slate-600 ${evalStyle.cardBorderGlow}`}
      >
        {/* 기본 보스 카드 영역 (호버 트리거):
            - 마우스를 이 보스 카드 부분에 올렸을 때만 열림 (요청 4)
            - 마우스가 보스 카드를 벗어나면 닫힘
        */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            {/* 왼쪽: 보스 사진 */}
            <div className="w-13.5 h-13.5 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center">
              <SmartConversionBossIcon
                bossName={displayName}
                rawImg={boss.rawImg}
                iconUrl={boss.iconUrl}
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* 우측 정보 영역: [위: 난이도 배지 + 부족 영문 뱃지 (Lv, F, S)] -> [중간: 보스 이름] -> [아래: 보스 배율] */}
            <div className="flex-1 flex flex-col justify-center min-w-0 gap-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {diffLabel && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border flex-shrink-0 w-fit ${diffBadgeStyle}`}>
                    {diffLabel}
                  </span>
                )}

                {/* 1. 레벨(Lv), 포스(F), 심볼 만렙(S) 부족 시 빨간 색 영문 뱃지 표시 */}
                {shortageBadges.length > 0 && (
                  <div className="flex items-center gap-1 group/shortage cursor-help relative">
                    {shortageBadges.map((badge) => (
                      <span
                        key={badge.type}
                        className="inline-flex items-center justify-center min-w-[16px] h-[15px] px-1 rounded-full bg-rose-500 text-white text-[8.5px] font-black leading-none shadow-2xs tracking-tighter"
                      >
                        {badge.code}
                      </span>
                    ))}
                    {/* 마우스 호버 시 상세 툴팁 (3번째 열은 진행 현황 UI 가림 방지를 위해 왼쪽으로 노출) */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 hidden group-hover/shortage:flex flex-col whitespace-nowrap bg-slate-900/95 text-white text-[10.5px] px-2.5 py-1.5 rounded-lg shadow-xl z-50 pointer-events-none border border-slate-700/90 gap-0.5 ${
                        idx % 3 === 2 ? 'right-full mr-2' : 'left-full ml-2'
                      }`}
                    >
                      {shortageBadges.map((badge, bIdx) => (
                        <span key={bIdx} className="font-medium">{badge.desc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                {displayName}
              </span>
              <span className={`text-xs sm:text-sm font-black tracking-tight leading-none ${evalStyle.multiplierColor}`}>
                {boss.multiplier || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 추가 상세 정보 영역:
            - 항상 보스 카드 아래에 배치됨 (요청 3: 추가 내용은 다른 카드처럼 아래에 위치)
            - pointer-events-none: 추가 내용에 마우스를 올려도 닫히도록 마우스 이벤트를 안 올린 판정으로 처리 (요청 4)
            - duration-350 ease-out 부드러운 펼쳐짐/접힘 (요청 5)
        */}
        <div
          className={`overflow-hidden transition-all duration-350 ease-out pointer-events-none ${
            isHovered
              ? 'max-h-72 opacity-100 mt-2.5 pt-1.5'
              : 'max-h-0 opacity-0'
          }`}
        >
          {specDetailContent}
        </div>
      </div>
    </div>
  );
};
