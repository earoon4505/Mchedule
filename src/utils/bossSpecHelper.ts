import bossSpecDefs from '../data/bossSpecDefinitions.json';

/**
 * 넥슨 인게임 공식 레벨 차이별 데미지 배율 테이블
 */
export const LEVEL_GAP_TABLE: Record<string, number> = {
  '5': 120, '4': 118, '3': 116, '2': 114, '1': 112, '0': 110,
  '-1': 105.3, '-2': 100.7, '-3': 96.2, '-4': 91.8, '-5': 87.5,
  '-6': 85, '-7': 82.5, '-8': 80, '-9': 77.5, '-10': 75,
  '-11': 72.5, '-12': 70, '-13': 67.5, '-14': 65, '-15': 62.5,
  '-16': 60, '-17': 57.5, '-18': 55, '-19': 52.5, '-20': 50,
  '-21': 47.5, '-22': 45, '-23': 42.5, '-24': 40, '-25': 37.5,
  '-26': 35, '-27': 32.5, '-28': 30, '-29': 27.5, '-30': 25,
  '-31': 22.5, '-32': 20, '-33': 17.5, '-34': 15, '-35': 12.5,
  '-36': 10, '-37': 7.5, '-38': 5, '-39': 2.5, '-40': 0,
};

/**
 * 넥슨 인게임 공식 아케인포스 데미지 배율 산출
 */
export function getArcaneGapDmg(bossForce: number, userForce: number, isBlackMage = false): number {
  if (!bossForce || bossForce <= 0) return 100;
  const ratio = (userForce / bossForce) * 100;
  if (ratio < 10) return 10;
  if (ratio < 30) return 30;
  if (ratio < 50) return 60;
  if (ratio < 70) return 70;
  if (ratio < 100) return 80;
  if (ratio < 110) return 100;
  if (ratio < 130) return 110;
  if (isBlackMage) return 110;
  if (ratio < 150) return 130;
  return 150;
}

/**
 * 넥슨 인게임 공식 어센틱포스 데미지 배율 산출
 */
export function getAuthenticGapDmg(bossForce: number, userForce: number): number {
  if (!bossForce || bossForce <= 0) return 100;
  const diff = userForce - bossForce;
  if (diff < -90) return 5;
  if (diff < -80) return 10;
  if (diff < -70) return 20;
  if (diff < -60) return 30;
  if (diff < -50) return 40;
  if (diff < -40) return 50;
  if (diff < -30) return 60;
  if (diff < -20) return 70;
  if (diff < -10) return 80;
  if (diff < 0) return 90;
  if (diff < 10) return 100;
  if (diff < 20) return 105;
  if (diff < 30) return 110;
  if (diff < 40) return 115;
  if (diff < 50) return 120;
  return 125;
}

export interface BossSpecInfo {
  bossLevel?: number;
  bossArcaneForce?: number;
  bossAuthenticForce?: number;
}

// 일일 및 주간 보스 수동 보강 맵 (이름_난이도)
const MANUAL_BOSS_SPEC_MAP: Record<string, BossSpecInfo> = {
  // 일일 보스
  '자쿰_easy': { bossLevel: 50 },
  '자쿰_normal': { bossLevel: 110 },
  '자쿰_chaos': { bossLevel: 180 },
  '매그너스_easy': { bossLevel: 115 },
  '매그너스_normal': { bossLevel: 130 },
  '매그너스_hard': { bossLevel: 190 },
  '힐라_normal': { bossLevel: 120 },
  '힐라_hard': { bossLevel: 170 },
  '카웅_normal': { bossLevel: 180 },
  '파풀라투스_easy': { bossLevel: 115 },
  '파풀라투스_normal': { bossLevel: 155 },
  '파풀라투스_chaos': { bossLevel: 190 },
  '반반_normal': { bossLevel: 120 },
  '반반_chaos': { bossLevel: 190 },
  '피에르_normal': { bossLevel: 120 },
  '피에르_chaos': { bossLevel: 190 },
  '블러디퀸_normal': { bossLevel: 120 },
  '블러디퀸_chaos': { bossLevel: 190 },
  '블러디 퀸_normal': { bossLevel: 120 },
  '블러디 퀸_chaos': { bossLevel: 190 },
  '벨룸_normal': { bossLevel: 130 },
  '벨룸_chaos': { bossLevel: 190 },
  '반레온_easy': { bossLevel: 125 },
  '반레온_normal': { bossLevel: 130 },
  '반레온_hard': { bossLevel: 140 },
  '반 레온_easy': { bossLevel: 125 },
  '반 레온_normal': { bossLevel: 130 },
  '반 레온_hard': { bossLevel: 140 },
  '혼테일_easy': { bossLevel: 130 },
  '혼테일_normal': { bossLevel: 130 },
  '혼테일_chaos': { bossLevel: 135 },
  '아카이럼_easy': { bossLevel: 140 },
  '아카이럼_normal': { bossLevel: 140 },
  '핑크빈_normal': { bossLevel: 160 },
  '핑크빈_chaos': { bossLevel: 170 },
  '시그너스_easy': { bossLevel: 140 },
  '시그너스_normal': { bossLevel: 140 },
  '우르스_normal': { bossLevel: 100 },
  // 검은 마법사 (월간 보스)
  '검은마법사_hard': { bossLevel: 275, bossArcaneForce: 1320 },
  '검은마법사_extreme': { bossLevel: 280, bossArcaneForce: 1320 },
  '검은 마법사_hard': { bossLevel: 275, bossArcaneForce: 1320 },
  '검은 마법사_extreme': { bossLevel: 280, bossArcaneForce: 1320 },
};

// bossSpecDefinitions.json 기반 보스 공식 스펙 인덱싱
const BOSS_SPEC_MAP = new Map<string, BossSpecInfo>();

(bossSpecDefs as any[]).forEach((b) => {
  const diffLower = String(b.difficulty || '').toLowerCase();
  const bossClean = String(b.boss || '').replace(/\s+/g, '').toLowerCase();
  const nameClean = String(b.name || '').replace(/\s+/g, '').toLowerCase();

  const spec: BossSpecInfo = {
    bossLevel: b.level,
    bossArcaneForce: b.arcaneForce,
    bossAuthenticForce: b.authenticForce,
  };

  BOSS_SPEC_MAP.set(`${bossClean}_${diffLower}`, spec);
  BOSS_SPEC_MAP.set(`${nameClean}_${diffLower}`, spec);
  // 별칭 매핑
  if (bossClean === '대적자') BOSS_SPEC_MAP.set(`최초의대적자_${diffLower}`, spec);
  if (bossClean === '칼로스') BOSS_SPEC_MAP.set(`감시자칼로스_${diffLower}`, spec);
  if (bossClean === '세렌') BOSS_SPEC_MAP.set(`선택받은세렌_${diffLower}`, spec);
  if (bossClean === '흉성') BOSS_SPEC_MAP.set(`찬란한흉성_${diffLower}`, spec);
  if (bossClean === '가엔슬') BOSS_SPEC_MAP.set(`가디언엔젤슬라임_${diffLower}`, spec);
});

/**
 * 보스 이름과 난이도로 공식 레벨 및 요구 포스 조회
 */
export function getBossSpec(bossName: string, difficulty?: string): BossSpecInfo {
  const diff = String(difficulty || 'normal').toLowerCase();
  const cleanName = bossName.replace(/\s+/g, '').toLowerCase();

  // 1. 수동 일일 보스 맵 조회
  const manualKey = `${bossName}_${diff}`;
  const manualCleanKey = `${cleanName}_${diff}`;
  if (MANUAL_BOSS_SPEC_MAP[manualKey]) return MANUAL_BOSS_SPEC_MAP[manualKey];
  if (MANUAL_BOSS_SPEC_MAP[manualCleanKey]) return MANUAL_BOSS_SPEC_MAP[manualCleanKey];

  // 2. 보스 공식 스펙 맵 조회
  const spec = BOSS_SPEC_MAP.get(manualCleanKey);
  if (spec) return spec;

  return {};
}

/**
 * 내 캐릭터와 보스 기준 공식 레벨 데미지 배율 산출
 */
export function calculateLevelDamageRate(userLevel: number, bossLevel?: number): {
  rate: number;
  bonusPercent: number;
  isLoss: boolean;
  label: string;
} {
  if (bossLevel == null) return { rate: 100, bonusPercent: 0, isLoss: false, label: '100%' };

  const dLevel = userLevel - bossLevel;
  const levelKey = (dLevel > 5 ? 5 : dLevel < -40 ? -40 : dLevel).toString();
  const rate = LEVEL_GAP_TABLE[levelKey] ?? 100;
  const isLoss = dLevel < 0;
  const bonusPercent = Math.round((rate - 100) * 10) / 10;

  return {
    rate,
    bonusPercent,
    isLoss,
    label: `${rate}%`,
  };
}

/**
 * 내 캐릭터와 보스 기준 공식 포스 데미지 배율 산출
 */
export function calculateForceDamageRate(
  userArcaneForce: number,
  userAuthenticForce: number,
  bossArcaneForce?: number,
  bossAuthenticForce?: number,
  isBlackMage: boolean = false
): {
  type: 'authentic' | 'arcane' | 'none';
  rate: number;
  bonusPercent: number;
  isLoss: boolean;
  label: string;
  userForce: number;
  reqForce: number;
  maxForce: number;
} {
  if (bossAuthenticForce && bossAuthenticForce > 0) {
    const rate = getAuthenticGapDmg(bossAuthenticForce, userAuthenticForce);
    const isLoss = userAuthenticForce < bossAuthenticForce;
    const bonusPercent = Math.round((rate - 100) * 10) / 10;
    return {
      type: 'authentic',
      rate,
      bonusPercent,
      isLoss,
      label: `${rate}%`,
      userForce: userAuthenticForce,
      reqForce: bossAuthenticForce,
      maxForce: bossAuthenticForce + 50,
    };
  }

  if (bossArcaneForce && bossArcaneForce > 0) {
    let rate = getArcaneGapDmg(bossArcaneForce, userArcaneForce);
    if (isBlackMage && rate > 110) {
      rate = 110;
    }
    const isLoss = userArcaneForce < bossArcaneForce;
    const bonusPercent = Math.round((rate - 100) * 10) / 10;
    return {
      type: 'arcane',
      rate,
      bonusPercent,
      isLoss,
      label: `${rate}%`,
      userForce: userArcaneForce,
      reqForce: bossArcaneForce,
      maxForce: isBlackMage ? Math.round(bossArcaneForce * 1.1) : Math.round(bossArcaneForce * 1.5),
    };
  }

  return {
    type: 'none',
    rate: 100,
    bonusPercent: 0,
    isLoss: false,
    label: '100%',
    userForce: 0,
    reqForce: 0,
    maxForce: 0,
  };
}

/**
 * 난이도별 세련된 배지 스타일 반환 (환산 스타일)
 */
export function getDifficultyBadgeStyle(diff?: string): string {
  switch (diff?.toLowerCase()) {
    case 'extreme':
      return 'bg-black text-[#FF2E2E] border border-[#FF2E2E]/80 font-black shadow-2xs';
    case 'chaos':
      return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold';
    case 'hard':
      return 'bg-rose-600 text-white border border-rose-700 font-black shadow-2xs';
    case 'normal':
      return 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold';
    case 'easy':
      return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-bold';
  }
}

/**
 * 난이도 한글 라벨 반환
 */
export function getDifficultyLabel(diff?: string): string {
  switch (diff?.toLowerCase()) {
    case 'extreme': return '익스트림';
    case 'chaos': return '카오스';
    case 'hard': return '하드';
    case 'normal': return '노말';
    case 'easy': return '이지';
    default: return diff || '';
  }
}
