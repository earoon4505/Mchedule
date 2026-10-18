import scouterBossDefinitions from '../data/scouterBossDefinitions.json';
import { BossMultiplierItem } from '../types';

/**
 * 레벨 차이에 따른 데미지 비율 테이블 (메이플스카우터 공식 a.O)
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

export const GRANDIS_BOSSES = ['발드릭스', '림보', '유피테르', '찬란한 흉성', '흉성', '최초의 대적자', '대적자', '카링', '감시자 칼로스', '칼로스', '선택받은 세렌', '세렌', '벨로나'];
export const ARCANE_BOSSES = ['검은 마법사', '검은마법사', '진 힐라', '진힐라', '듄켈', '더스크', '윌', '루시드'];

export const DIFF_LABELS: Record<string, string> = {
  Extreme: '익스트림',
  Destiny: '데스티니',
  Champion: '챔피언',
  Chaos: '카오스',
  Hard: '하드',
  Normal: '노말',
  Easy: '이지',
};

// 표준 표시용 한글 이름 (MapleIcon 호환)
export function normalizeBossDisplayName(rawBoss: string): string {
  if (rawBoss === '대적자') return '최초의 대적자';
  if (rawBoss === '칼로스') return '감시자 칼로스';
  if (rawBoss === '세렌') return '선택받은 세렌';
  if (rawBoss === '흉성') return '찬란한 흉성';
  if (rawBoss === '가엔슬') return '가디언 엔젤 슬라임';
  return rawBoss;
}

export function getBossCategory(bossName: string): '그란디스' | '아케인' | '루타·주간' {
  if (GRANDIS_BOSSES.includes(bossName)) return '그란디스';
  if (ARCANE_BOSSES.includes(bossName)) return '아케인';
  return '루타·주간';
}

/**
 * 아케인포스 반감/증뎀 계산 (메이플스카우터 공식 97571 r)
 */
export function getArcaneGapDmg(reqForce?: number, userForce?: number): number {
  if (!reqForce || reqForce === -1) return 100;
  const ratio = ((userForce || 0) / reqForce) * 100;
  if (ratio < 10) return 10;
  if (ratio < 30) return 30;
  if (ratio < 50) return 60;
  if (ratio < 70) return 70;
  if (ratio < 100) return 80;
  if (ratio < 110) return 100;
  if (ratio < 130) return 110;
  if (ratio < 150) return 130;
  return 150;
}

/**
 * 어센틱포스 반감/증뎀 계산 (메이플스카우터 공식 97571 c)
 */
export function getAuthenticGapDmg(reqForce?: number, userForce?: number): number {
  if (!reqForce || reqForce === -1) return 100;
  const diff = (userForce || 0) - reqForce;
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

/**
 * 큐빅 에르미트 스플라인 보간 함수 (메이플스카우터 공식 62509 M8)
 */
export function evaluateSpline(spline: { x: number[]; y: number[]; m: number[] }, t: number): number {
  const { x, y, m } = spline;
  const a = x.length;
  if (t < x[0]) return y[0] + (t - x[0]) * m[0];
  if (t <= x[a - 1]) {
    let idx = x.length - 2;
    for (let e = 0; e < x.length - 1; e++) {
      if (t >= x[e] && t <= x[e + 1]) {
        idx = e;
        break;
      }
    }
    const l = x[idx + 1] - x[idx];
    const o = (t - x[idx]) / l;
    const r = o * o;
    const c = r * o;
    return (2 * c - 3 * r + 1) * y[idx] + (c - 2 * r + o) * l * m[idx] + (-2 * c + 3 * r) * y[idx + 1] + (c - r) * l * m[idx + 1];
  }
  const l = x[a - 1];
  return y[a - 1] + (t - l) * Math.max(m[a - 1], 1e-9);
}

/**
 * 도핑 및 비약 효율 배율 계산 (메이플스카우터 공식 33528 19번째 인자 R)
 */
export function calcDopingMultiplier(
  specEff: any,
  myClass: string,
  elixir: number = 3,
  minutes: number = 20
): number {
  if (!specEff) return 1;
  const n = Math.min(20, Math.max(0.1, minutes));
  const isBishop = myClass === '비숍';
  const isWildHunter = myClass === '와일드헌터';
  const isDemonAvenger = myClass === '데몬어벤져';

  const r = 8 * (!isBishop ? 1 : 0);
  const o = 30 * (!isBishop ? 1 : 0);
  const c = 10 * (!isBishop ? 1 : 0);
  const d = 1275 * (isDemonAvenger ? 1 : 0);
  const m = 10 * (!isWildHunter ? 1 : 0);

  const x =
    (1 + r * (specEff.cridmgeff1 || 0)) *
    (1 + o * (specEff.atkeff1 || 0)) *
    (1 + c * (specEff.dmgeff1 || 0)) *
    (1 + 0 * (specEff.igreff1 || 0)) *
    (1 + (isDemonAvenger ? d : 0) * (specEff.mainStateff1 || 0)) *
    (1 + 0 * ((specEff.subStateff1 || 0) + (specEff.ssubStateff1 || 0))) *
    1 *
    (1 + m * (specEff.atkPereff1 || 0));

  const p = x * Math.min(n, 8) + x * Math.max(0, Math.min(7, n - 8)) + Math.max(0, Math.min(5, n - 15));
  const l = elixir || 3;
  const mult = ((1 === l || 3 === l ? x : 1) * Math.min(n, 8) +
                (1 === l || 3 === l ? x : 1) * Math.max(0, Math.min(7, n - 8)) +
                Math.max(0, Math.min(5, n - 15))) / p / ((1 === l || 3 === l ? x : 1) / x);

  return mult || 1;
}

/**
 * 보스 클리어 상태 판정 라벨 함수 (메이플스카우터 공식 모듈 97571 Rn)
 */
export function getStatusLabel(
  clearRate: number,
  isParty: boolean,
  partyLimit: number,
  isNewbie: boolean = false,
  newbieCut: number = 100
): string {
  if (isNewbie && newbieCut > 100) {
    const s = newbieCut / 100;
    if (!isParty && 6 === partyLimit) {
      return clearRate >= 5 ? '[뉴비] 여유컷' : clearRate >= s ? '[뉴비] 솔플' : clearRate >= 0.5 * s ? '[뉴비] 2인' : clearRate >= 0.25 * s ? '[뉴비] 4인' : clearRate >= 0.15 * s ? '[뉴비] 6인' : '불가능';
    }
  }

  if (isParty) {
    if (3 === partyLimit) {
      return clearRate >= 2.7 ? '솔플 최소컷' : clearRate >= 1.35 ? '2인 최소컷' : clearRate >= 0.9 ? '3인 최소컷' : '불가능';
    }
    if (clearRate >= 5.1) return '솔플 최소컷';
    if (clearRate >= 2.55) return '2인 최소컷';
    if (clearRate >= 1.7) return '3인 최소컷';
    if (clearRate >= 1.275) return '4인 최소컷';
    if (clearRate >= 0.9) return '6인 최소컷';
    return '불가능';
  } else {
    if (6 === partyLimit) {
      return clearRate >= 2 ? '솔플 여유컷' : clearRate >= 1.1 ? '솔플 가능' : clearRate >= 0.9 ? '솔플 최소컷' : clearRate >= 0.25 ? '파티격 가능' : clearRate >= 0.15 ? '파티 최소컷' : '불가능';
    }
    if (3 === partyLimit) {
      return clearRate >= 2 ? '솔플 여유컷' : clearRate >= 1.1 ? '솔플 가능' : clearRate >= 0.9 ? '솔플 최소컷' : clearRate >= 0.36 ? '파티격 가능' : clearRate >= 0.3 ? '파티 최소컷' : '불가능';
    }
    if (2 === partyLimit) {
      return clearRate >= 2 ? '솔플 여유컷' : clearRate >= 1.1 ? '솔플 가능' : clearRate >= 0.9 ? '솔플 최소컷' : clearRate >= 0.55 ? '파티격 가능' : clearRate >= 0.45 ? '파티 최소컷' : '불가능';
    }
    if (1 === partyLimit) {
      if (clearRate >= 2) return '솔플 여유컷';
      if (clearRate >= 1.1) return '솔플 가능';
      if (clearRate >= 0.9) return '솔플 최소컷';
      return '불가능';
    }
  }

  return '불가능';
}

export interface ScouterBossEvaluationResult {
  multipliers: Record<string, BossMultiplierItem>;
  bossList: BossMultiplierItem[];
}

/**
 * 메이플스카우터 공식 연산 엔진 (100% 공식 프론트엔드 번들 33528/97571 로직 일치)
 * Maplescouter API의 calculatedData와 userStat을 입력받아
 * 공식 순서가 보존된 bossList 및 보스 맵을 반환합니다.
 */
export function calculateScouterBossData(
  scouterApiData: any,
  customBossDefs?: any[]
): ScouterBossEvaluationResult {
  if (!scouterApiData || !scouterApiData.calculatedData) {
    return { multipliers: {}, bossList: [] };
  }

  const { calculatedData: cData, userStat } = scouterApiData;
  const charLevel = Number(userStat?.stat?.level || userStat?.level || scouterApiData.level || 260);
  const charArcane = Number(userStat?.stat?.arcaneForce || userStat?.arcaneForce || scouterApiData.arcaneForce || 0);
  const charAuthentic = Number(userStat?.stat?.authenticForce || userStat?.authenticForce || scouterApiData.authenticForce || 0);
  const myClass = String(cData.class || userStat?.stat?.myClass || '히어로');

  const dHexa = Number(cData.calculatedHexaDamage_300 || 0);
  const uHexa = Number(cData.calculatedHexaDamage_380 || 0);
  const spline_300 = cData.spline_300;
  const spline_380 = cData.spline_380;
  const ascentConst = Number(cData.ascent_const || 0);

  if (!spline_300 || !spline_380 || dHexa <= 0 || uHexa <= 0) {
    return { multipliers: {}, bossList: [] };
  }

  const dopingR = calcDopingMultiplier(cData.specEfficiency, myClass, cData.elixir || 3, 20);

  const defsToUse = (Array.isArray(customBossDefs) && customBossDefs.length > 0)
    ? customBossDefs
    : (scouterBossDefinitions as any[]);

  const multipliers: Record<string, BossMultiplierItem> = {};
  const bossList: BossMultiplierItem[] = [];

  for (const b of defsToUse) {
    const dLevel = charLevel - b.level;
    const levelKey = (dLevel > 5 ? 5 : dLevel < -40 ? -40 : dLevel).toString();
    const levelGapDmg = (LEVEL_GAP_TABLE[levelKey] || 100) / 100;

    const arcaneDmg = getArcaneGapDmg(b.arcaneForce, charArcane) / 100;
    const authenticDmg = getAuthenticGapDmg(b.authenticForce, charAuthentic) / 100;

    let M = 1;
    if (b.arcaneForce && b.boss !== '검은 마법사') M = 1.5;
    if (b.arcaneForce && b.boss === '검은 마법사') M = 1.1;

    const userHexaDmg = 300 === b.guard
      ? dHexa * (b.boss === '가엔슬' ? 1 / (cData.genePassConst || 1) : 1)
      : (b.boss === '카링' ? (cData.calculatedHexaDamage_kaling || uHexa) : uHexa);

    const I = (userHexaDmg * arcaneDmg * authenticDmg * levelGapDmg) / (1.2 * M * (b.authenticForce ? 1.25 : 1));

    const cut = Number(b.bossCut || b.partyBossCut || 10000);
    const targetSpline = 300 === b.guard ? spline_300 : spline_380;
    const E = evaluateSpline(targetSpline, cut);

    const U = (I / (E < 0 ? 10000 : E)) * (b.easyRate ? b.easyRate : 1) * dopingR;
    const G = (3 * ascentConst) / (b.boss === '루시드' && b.difficulty === 'Hard' ? 0.4 : Math.min(3, Math.ceil(20 / U / 5.667))) - ascentConst || 0;
    const clearRate = Math.max(0, U * (1 + G) || 0);

    const multPercent = clearRate * 100;
    const multiplierNum = parseFloat(multPercent.toFixed(1));

    const isParty = !!b.partyBossCut;
    const partyLimit = b.partyLimit || 6;

    const multiplierStr = isParty
      ? `[파티] ${Math.round(multPercent)}%`
      : `${multPercent >= 1000 ? Math.round(multPercent) : multPercent >= 100 ? multPercent.toFixed(1) : multPercent.toFixed(2)}%`;

    const statusLabel = getStatusLabel(clearRate, isParty, partyLimit, false, b.newbieCut || 100);

    const diffLower = String(b.difficulty).toLowerCase();
    const nameLower = String(b.name).toLowerCase();
    const primaryKey = `${diffLower}_${nameLower}`;
    const displayBoss = normalizeBossDisplayName(b.boss);

    const hasAuthentic = !!b.authenticForce;
    const hasArcane = !!b.arcaneForce;
    const forceType: 'authentic' | 'arcane' | 'none' = hasAuthentic ? 'authentic' : hasArcane ? 'arcane' : 'none';
    const reqForce = hasAuthentic ? b.authenticForce : hasArcane ? b.arcaneForce : undefined;
    const userForce = hasAuthentic ? charAuthentic : hasArcane ? charArcane : undefined;
    const forceDmgPercent = hasAuthentic
      ? getAuthenticGapDmg(b.authenticForce, charAuthentic)
      : hasArcane
      ? getArcaneGapDmg(b.arcaneForce, charArcane)
      : 100;
    const levelDmgPercent = LEVEL_GAP_TABLE[levelKey] || 100;

    const isBlackMage = b.boss === '검은 마법사' || b.boss === '검은마법사';
    // 환산 공식: 레벨 최대 뎀뻥(120%) 기준 미달 시 부족(Lv) 판정 (charLevel < b.level + 5)
    const hasLevelPenalty = charLevel < (b.level + 5);
    const maxArcaneReq = isBlackMage ? Math.round(b.arcaneForce * 1.1) : Math.round(b.arcaneForce * 1.5);
    // 환산 공식: 포스 최대 배율 기준 미달 시 부족(F) 판정
    const hasForcePenalty = hasAuthentic
      ? charAuthentic < (b.authenticForce + 50)
      : hasArcane
      ? charArcane < maxArcaneReq
      : false;
    // 환산 공식: 어센틱 심볼 만렙 미달 시 부족(S) 판정
    const isMaxSymbolShortage = hasAuthentic && charAuthentic < (b.authenticForce + 50);

    const maxLevelDmg = 1.2;
    const maxArcaneDmg = isBlackMage ? 1.1 : 1.5;
    const maxAuthenticDmg = 1.25;

    const levelRatio = (levelDmgPercent / 100) / maxLevelDmg;
    const arcaneRatio = hasArcane && b.arcaneForce ? (forceDmgPercent / 100) / maxArcaneDmg : 1;
    const authenticRatio = hasAuthentic && b.authenticForce ? (forceDmgPercent / 100) / maxAuthenticDmg : 1;

    const netRatio = levelRatio * (hasArcane ? arcaneRatio : 1) * (hasAuthentic ? authenticRatio : 1);
    const totalDmgPenaltyPercent = netRatio < 1 ? parseFloat(((1 - netRatio) * 100).toFixed(1)) : 0;

    const item: BossMultiplierItem = {
      id: `scouter_${nameLower}_${diffLower}`,
      bossName: displayBoss,
      difficulty: b.difficulty,
      difficultyLabel: DIFF_LABELS[b.difficulty] || b.difficulty,
      category: getBossCategory(b.boss),
      rawImg: primaryKey,
      iconUrl: `https://maplescouter.com/bossIcon/${primaryKey}.webp`,
      multiplier: multiplierStr,
      multiplierNum,
      statusLabel,
      stat: cut,
      isParty,
      bossLevel: b.level,
      bossArcaneForce: b.arcaneForce,
      bossAuthenticForce: b.authenticForce,
      userLevel: charLevel,
      userArcaneForce: charArcane,
      userAuthenticForce: charAuthentic,
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

    multipliers[primaryKey] = item;
    const bossKorean = b.boss.replace(/\s+/g, '').toLowerCase();
    multipliers[`${diffLower}_${bossKorean}`] = item;

    bossList.push(item);
  }

  return { multipliers, bossList };
}

/**
 * 하위 호환성 래퍼: 보스 맵 반환
 */
export function calculateScouterBossMultipliers(scouterApiData: any): Record<string, BossMultiplierItem> {
  return calculateScouterBossData(scouterApiData).multipliers;
}
