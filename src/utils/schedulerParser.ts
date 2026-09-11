import { CharacterProgressRecord, TaskProgressState, CharacterInfo } from '../types';
import { getKSTDailyKey, getKSTMonthlyKey, getKSTWeeklyThuKey } from './time';
import { 
  ALL_TASKS_MAP, 
  WEEKLY_BOSSES, 
  DAILY_BOSSES,
  BOSS_GROUP_DEFINITIONS,
  DAILY_BOSS_GROUP_DEFINITIONS,
  ARCANE_DAILY_QUESTS,
  GRANDIS_DAILY_QUESTS,
  DAILY_OTHER, 
  WEEKLY_QUESTS, 
  EPIC_DUNGEONS, 
  WEEKLY_GUILD_AND_MISC 
} from '../data/defaultTasks';

/**
 * 모든 태스크의 기본 표준 순서 ID 배열
 */
export const STANDARD_TASK_ORDER: string[] = [
  ...ARCANE_DAILY_QUESTS.map((t) => t.id),
  ...GRANDIS_DAILY_QUESTS.map((t) => t.id),
  ...WEEKLY_QUESTS.map((t) => t.id),
  ...WEEKLY_GUILD_AND_MISC.map((t) => t.id),
];

/**
 * 태스크 ID 목록을 컨텐츠 설정의 표준 순서대로 정렬
 * (캐릭터 개별 컨텐츠 설정용이므로 계정 공통 컨텐츠인 몬스터파크 및 에픽던전 자동 제외)
 */
export function sortTaskIdsByStandardOrder(taskIds: string[]): string[] {
  if (!Array.isArray(taskIds)) return [];
  // 현재 앱에 존재하는 유효한 캐릭터 개별 태스크만 보존
  const validTaskIds = taskIds.filter(
    (id) => 
      ALL_TASKS_MAP.has(id) && 
      id !== 'daily_monster_park' && 
      id !== 'daily_monster_park_extreme' && 
      id !== 'weekly_monster_park_extreme' && 
      !id.startsWith('weekly_epic_')
  );
  const unique = Array.from(new Set(validTaskIds));
  return unique.sort((a, b) => {
    const idxA = STANDARD_TASK_ORDER.indexOf(a);
    const idxB = STANDARD_TASK_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * 보스 ID 목록을 기본 보스 목록 순서대로 정렬
 */
export function sortBossIdsByStandardOrder(bossIds: string[]): string[] {
  if (!Array.isArray(bossIds)) return [];
  const bossOrder = WEEKLY_BOSSES.map((b) => b.id);
  const unique = Array.from(new Set(bossIds));
  return unique.sort((a, b) => {
    const idxA = bossOrder.indexOf(a);
    const idxB = bossOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * 일일 보스 ID 목록을 기본 일일 보스 목록 순서대로 정렬
 */
export function sortDailyBossIdsByStandardOrder(bossIds: string[]): string[] {
  if (!Array.isArray(bossIds)) return [];
  const bossOrder = DAILY_BOSSES.map((b) => b.id);
  const unique = Array.from(new Set(bossIds));
  return unique.sort((a, b) => {
    const idxA = bossOrder.indexOf(a);
    const idxB = bossOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
}

/**
 * 텍스트 정규화 (공백, 특수문자, 괄호 제거, 소문자화)
 */
export function normalizeName(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[\s_:()\[\]\/\-·.,]/g, '')
    .toLowerCase();
}

/**
 * 난이도 문자열 정규화 ('노말' -> 'normal', '하드' -> 'hard' 등)
 */
export function normalizeDifficulty(diffStr: string): string {
  if (!diffStr) return '';
  const s = normalizeName(diffStr);
  if (s.includes('익스트림') || s.includes('extreme')) return 'extreme';
  if (s.includes('카오스') || s.includes('chaos')) return 'chaos';
  if (s.includes('하드') || s.includes('hard')) return 'hard';
  if (s.includes('노말') || s.includes('노멀') || s.includes('normal')) return 'normal';
  if (s.includes('이지') || s.includes('easy')) return 'easy';
  return s;
}

/**
 * 지역/키워드 기반 일일/주간 태스크 ID 매핑 테이블
 */
const KEYWORD_TASK_MAP: Array<{ keywords: string[]; taskId: string; isWeekly?: boolean }> = [
  // 1. 아케인리버 일일 심볼 퀘스트
  { keywords: ['소멸의여로', '여로조사', '여로일일', '소멸의여로일일', '소멸의여로조사', '아케인심볼소멸의여로', '아케인소멸의여로', '여로'], taskId: 'daily_arcane_vanishing', isWeekly: false },
  { keywords: ['츄츄아일랜드', '츄츄일일', '츄츄조사', '츄츄아일랜드조사', '아케인심볼츄츄아일랜드', '아케인츄츄', '츄츄'], taskId: 'daily_arcane_chuchu', isWeekly: false },
  { keywords: ['레헬른', '레헬른일일', '꿈의도시레헬른', '레헬른조사', '아케인심볼레헬른', '아케인레헬른', '꿈의도시'], taskId: 'daily_arcane_lachelein', isWeekly: false },
  { keywords: ['아르카나', '아르카나일일', '신비의숲아르카나', '아르카나조사', '아케인심볼아르카나', '아케인아르카나', '신비의숲'], taskId: 'daily_arcane_arcana', isWeekly: false },
  { keywords: ['모라스', '모라스일일', '기억의늪모라스', '모라스조사', '아케인심볼모라스', '아케인모라스', '기억의늪'], taskId: 'daily_arcane_morass', isWeekly: false },
  { keywords: ['에스페라', '에스페라일일', '시작의바다에스페라', '태초의바다에스페라', '에스페라조사', '아케인심볼에스페라', '아케인에스페라', '시작의바다', '태초의바다'], taskId: 'daily_arcane_espera', isWeekly: false },
  { keywords: ['문브릿지', '문브릿지일일', '문브릿지조사', '사상의경계', '미지의안개'], taskId: 'daily_arcane_moonbridge', isWeekly: false },
  { keywords: ['고통의미궁', '미궁일일', '미궁조사', '고통의미궁조사', '미궁'], taskId: 'daily_arcane_labyrinth', isWeekly: false },
  { keywords: ['리멘', '리멘일일', '리멘조사', '세계의눈물'], taskId: 'daily_arcane_limen', isWeekly: false },

  // 2. 그란디스 일일 어센틱심볼 퀘스트 (모든 게임 내 퀘스트 명칭/지역명/어센틱 표기 포괄 매핑)
  { keywords: ['세르니움', '신의도시세르니움', '신의도시', '불타는세르니움', '세르니움조사', '세르니움일일', '후르니움', '전초기지', '전초기지의평화를위해', '어센틱심볼세르니움', '어센틱세르니움', 'cernium'], taskId: 'daily_grandis_cernium', isWeekly: false },
  { keywords: ['호텔아르크스', '아르크스', '무법자들의황무지', '황무지', '아르크스조사', '호텔아르크스조사', '아르크스일일', '어센틱심볼호텔아르크스', '어센틱심볼아르크스', '어센틱아르크스', '황무지조사', '무법자들의황무지조사', 'arcus'], taskId: 'daily_grandis_arcus', isWeekly: false },
  { keywords: ['오디움', '눈뜬거인의요람', '거인의요람', '눈뜬거인', '오디움조사', '오디움일일', '어센틱심볼오디움', '어센틱오디움', '요람조사', '눈뜬거인의요람조사', 'odium'], taskId: 'daily_grandis_odium', isWeekly: false },
  { keywords: ['도원경', '생명이시작되는곳', '도원경조사', '도원경일일', '어센틱심볼도원경', '어센틱도원경', '생명이시작되는곳조사', 'dowonkyung', 'taowon'], taskId: 'daily_grandis_dowonkyung', isWeekly: false },
  { keywords: ['아르테리아', '전함아르테리아', '전함아르테리아조사', '아르테리아조사', '아르테리아일일', '어센틱심볼아르테리아', '어센틱아르테리아', '전함조사', 'arteria'], taskId: 'daily_grandis_arteria', isWeekly: false },
  { keywords: ['카르시온', '생명의요람카르시온', '생명의요람', '생명의요람조사', '카르시온조사', '카르시온일일', '어센틱심볼카르시온', '어센틱카르시온', '생명의요람카르시온조사', 'carcion'], taskId: 'daily_grandis_carcion', isWeekly: false },
  { keywords: ['탈라하트', '별바다탈라하트', '별바다', '별바다조사', '탈라하트조사', '탈라하트일일', '어센틱심볼탈라하트', '어센틱탈라하트', '별바다탈라하트조사', 'tallahart'], taskId: 'daily_grandis_tallahart', isWeekly: false },
  { keywords: ['기어드락', '시간의균열기어드락', '시간의균열', '시간의균열조사', '기어드락조사', '기어드락일일', '어센틱심볼기어드락', '어센틱기어드락', '시간의균열기어드락조사', 'geardrock'], taskId: 'daily_grandis_geardrock', isWeekly: false },

  // 3. 에픽 던전 (인게임 스케줄러 명칭과 정확히 일치하거나 명확한 키워드만 매칭)
  { keywords: ['에픽던전하이마운틴', '하이마운틴', 'highmountain'], taskId: 'weekly_epic_high_mountain', isWeekly: true },
  { keywords: ['에픽던전앵글러컴퍼니', '앵글러컴퍼니'], taskId: 'weekly_epic_angler_company', isWeekly: true },
  { keywords: ['에픽던전악몽선경', '악몽선경'], taskId: 'weekly_epic_nightmare_fairyland', isWeekly: true },

  // 4. 주간 아케인 퀘스트
  { keywords: ['에르다스펙트럼', '여로주간', '스펙트럼'], taskId: 'weekly_arcane_vanishing', isWeekly: true },
  { keywords: ['배고픈무토', '무토', '츄츄주간'], taskId: 'weekly_arcane_chuchu', isWeekly: true },
  { keywords: ['미드나잇체이서', '미드나잇', '체이서', '레헬른주간'], taskId: 'weekly_arcane_lachelein', isWeekly: true },
  { keywords: ['스피릿세이비어', '아르카나주간', '스세'], taskId: 'weekly_arcane_arcana', isWeekly: true },
  { keywords: ['엔하임시드', '모라스주간', '엔하임'], taskId: 'weekly_arcane_morass', isWeekly: true },
  { keywords: ['프로텍트에스페라', '에스페라주간', '프로텍트'], taskId: 'weekly_arcane_espera', isWeekly: true },

  // 5. 길드 / 주간 컨텐츠 (점수형 컨텐츠 포함)
  { keywords: ['샤레니안의지하수로', '샤레니안지하수로', '샤레니안의지하 수로', '샤레니안', '지하수로', '지하 수로', '수로', 'sharenian', 'culvert', 'sharenianculvert', '아르카누스', '길드지하수로', '길드수로'], taskId: 'weekly_sharenian_culvert', isWeekly: true },
  { keywords: ['플래그레이스', '플래그', '플래그레이스도전', '플래그도전', 'flagrace', 'flag'], taskId: 'weekly_flag_race', isWeekly: true },
  { keywords: ['무릉도장', '무릉', '무릉도장도전', '무릉도장최고기록', 'mulung', 'dojang'], taskId: 'weekly_mulung_dojang', isWeekly: true },
];

/**
 * 넥슨 오픈 API의 boolean 클리어/등록 판별 함수
 */
export function isFlagTrue(val: any): boolean {
  if (val === true || val === 1) return true;
  if (typeof val === 'number') return val > 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return (
      s === 'true' ||
      s === 'y' ||
      s === 'clear' ||
      s === 'cleared' ||
      s === 'completed' ||
      s === 'complete' ||
      s === 'done' ||
      s === 'success' ||
      s === '1' ||
      s === '2' ||
      s === '완료' ||
      s === '클리어' ||
      s === '진행완료' ||
      s === '처치' ||
      s === '처치완료' ||
      s === '보상수령' ||
      s === '수령완료' ||
      s === '참여' ||
      s === '참여완료' ||
      s === '도전완료'
    );
  }
  return false;
}

/**
 * 넥슨 오픈 API의 명시적 미완료/false 판별 함수
 */
export function isFlagFalse(val: any): boolean {
  if (val === false || val === 0 || val === '0') return true;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    return s === 'false' || s === 'n' || s === 'no' || s === 'incomplete' || s === '0' || s === '미완료' || s === '진행중';
  }
  return false;
}

// 루타비스 4종 일일 보스 ID 상수 (인게임 단체 루타비스 등록 및 클리어 판별 지원)
export const ROOTABYSS_DAILY_BOSS_IDS = [
  'daily_boss_normal_pierre',
  'daily_boss_normal_vonbon',
  'daily_boss_normal_queen',
  'daily_boss_normal_vellum',
];

/**
 * 넥슨 오픈 API의 보스 항목 클리어/처치 여부 통합 판별 함수
 */
export function isBossItemCompleted(boss: any): boolean {
  if (!boss) return false;

  // 1. 다양한 완료/클리어 플래그
  if (
    isFlagTrue(boss.complete_flag) ||
    isFlagTrue(boss.clear_flag) ||
    isFlagTrue(boss.clear_yn) ||
    isFlagTrue(boss.clear_status) ||
    isFlagTrue(boss.is_cleared) ||
    isFlagTrue(boss.is_clear) ||
    isFlagTrue(boss.clear) ||
    isFlagTrue(boss.completed) ||
    isFlagTrue(boss.complete) ||
    isFlagTrue(boss.reward_flag) ||
    isFlagTrue(boss.receive_flag) ||
    isFlagTrue(boss.attend_flag) ||
    isFlagTrue(boss.clear_condition_flag) ||
    isFlagTrue(boss.done) ||
    isFlagTrue(boss.success) ||
    isFlagTrue(boss.kill_flag) ||
    isFlagTrue(boss.defeat_flag)
  ) {
    return true;
  }

  // 2. quest_state / state / status 확인
  const qState = String(boss.quest_state ?? boss.state ?? boss.status ?? boss.clear_state ?? '').trim();
  if (qState === '2' || qState === '완료' || qState === '클리어' || qState === '처치' || qState === '처치완료') {
    return true;
  }

  // 3. 수치 카운트 (clear_count, now_count, current_count, enter_count, kill_count 등)
  const countKeys = ['clear_count', 'now_count', 'current_count', 'enter_count', 'play_count', 'count', 'entry_count', 'kill_count', 'defeat_count'];
  for (const k of countKeys) {
    if (typeof boss[k] === 'number' && boss[k] >= 1) return true;
    if (typeof boss[k] === 'string' && Number(boss[k]) >= 1) return true;
  }

  // 4. 잔여 횟수가 0인 경우 (입장/처치 횟수 소진 = 보스 처치 완료)
  if (
    boss.remain_count === 0 || boss.remain_count === '0' ||
    boss.remain_entry_count === 0 || boss.remain_entry_count === '0' ||
    boss.left_count === 0 || boss.left_count === '0' ||
    boss.remaining_count === 0 || boss.remaining_count === '0'
  ) {
    return true;
  }

  // 5. 완료 일시 문자열이 존재하는 경우
  if (
    (typeof boss.clear_time === 'string' && boss.clear_time.trim().length > 0) ||
    (typeof boss.quest_complete_time === 'string' && boss.quest_complete_time.trim().length > 0) ||
    (typeof boss.complete_time === 'string' && boss.complete_time.trim().length > 0)
  ) {
    return true;
  }

  // 6. 객체 내 clear/complete/defeat/kill 관련 키 전수 조사
  if (typeof boss === 'object') {
    for (const [key, val] of Object.entries(boss)) {
      const lKey = key.toLowerCase();
      if (lKey.includes('clear') || lKey.includes('complete') || lKey.includes('defeat') || lKey.includes('kill')) {
        if (isFlagTrue(val)) return true;
      }
    }
  }

  return false;
}

/**
 * 보스 이름과 난이도로 앱의 WEEKLY_BOSSES id 찾기
 * (진 힐라 vs 힐라 혼선 완전 차단 및 주간 보스 전용 식별)
 */
export function findBossTaskId(contentName: string, difficulty?: string): string | null {
  if (!contentName) return null;
  const normName = normalizeName(contentName);

  // 1) '진 힐라'와 일반 '힐라'의 철저한 격리
  if (normName.includes('진힐라') || (normName.includes('진') && normName.includes('힐라'))) {
    // 진 힐라는 주간 보스 매칭 진행
  } else if (normName.includes('힐라')) {
    // 일반 힐라는 주간 보스가 절대 아니므로 즉시 제외!
    return null;
  }

  // 2) 일일 전용 보스는 주간 보스 매칭에서 즉시 제외
  const dailyOnlyBosses = ['카웅', '반레온', '혼테일', '아카이럼', '핑크빈'];
  if (dailyOnlyBosses.some((b) => normName.includes(b))) {
    return null;
  }

  // 난이도 추출 (전달된 difficulty 우선, 없으면 contentName에서 추출)
  let normDiff = difficulty ? normalizeDifficulty(difficulty) : '';
  if (!normDiff) {
    normDiff = normalizeDifficulty(contentName);
  }

  // 3) 주간 보스 그룹에 없는 일일 전용 난이도 배제
  // (예: 노말/이지 자쿰, 노말/이지 매그너스, 노말/이지 파풀라투스, 노말 피에르/반반/블러디퀸/벨룸 등)
  if (normDiff === 'easy' || normDiff === 'normal') {
    const dailyDifficultyOnlyNames = ['자쿰', '매그너스', '파풀라투스', '피에르', '반반', '블러디퀸', '블러디', '벨룸'];
    if (dailyDifficultyOnlyNames.some((b) => normName.includes(b))) {
      return null;
    }
  }

  // 4) 명시적 보스 그룹 식별 (우선순위가 높은 특정 보스들 먼저 처리)
  let matchedGroup: typeof BOSS_GROUP_DEFINITIONS[0] | undefined;

  if (normName.includes('진힐라') || (normName.includes('진') && normName.includes('힐라'))) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '진 힐라');
  } else if (normName.includes('가디언엔젤슬라임') || normName.includes('가엔슬') || normName.includes('슬라임')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '가디언 엔젤 슬라임');
  } else if (normName.includes('선택받은세렌') || normName.includes('세렌')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '선택받은 세렌');
  } else if (normName.includes('감시자칼로스') || normName.includes('칼로스')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '감시자 칼로스');
  } else if (normName.includes('최초의대적자') || normName.includes('대적자')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '최초의 대적자');
  } else if (normName.includes('찬란한흉성') || normName.includes('흉성')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '찬란한 흉성');
  } else if (normName.includes('블러디퀸') || normName.includes('블러디') || normName.includes('퀸')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '블러디 퀸');
  } else if (normName.includes('반반')) {
    matchedGroup = BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '반반');
  } else {
    // 일반적인 baseName 매칭 (길이가 긴 보스 이름부터 정렬하여 매칭)
    const sortedGroups = [...BOSS_GROUP_DEFINITIONS].sort(
      (a, b) => b.baseName.length - a.baseName.length
    );
    matchedGroup = sortedGroups.find((g) => {
      const gNorm = normalizeName(g.baseName);
      return normName.includes(gNorm) || gNorm.includes(normName);
    });
  }

  if (matchedGroup) {
    // 식별된 보스 그룹에서 난이도 매칭
    if (normDiff) {
      const diffMatch = matchedGroup.difficulties.find((d) => d.difficulty === normDiff);
      if (diffMatch) return diffMatch.id;
      // 난이도가 명시적으로 주어졌는데 해당 주간 그룹에 속하지 않는 난이도라면 불일치로 판정
      return null;
    }

    // contentName에 난이도 텍스트가 직접 포함되어 있는지 확인
    for (const d of matchedGroup.difficulties) {
      if (normName.includes(normalizeName(d.label)) || normName.includes(d.difficulty)) {
        return d.id;
      }
    }

    // 난이도가 지정되지 않았고 단일 난이도인 경우 기본 반환
    if (matchedGroup.difficulties.length === 1) {
      return matchedGroup.difficulties[0].id;
    }

    return matchedGroup.difficulties[0].id;
  }

  // 5) 폴백: WEEKLY_BOSSES 전체에서 직접 매칭
  const fallbackMatch = WEEKLY_BOSSES.find((b) => {
    const bNorm = normalizeName(b.name);
    return (
      (bNorm === normName) ||
      (normDiff && b.difficulty === normDiff && bNorm.includes(normName))
    );
  });

  return fallbackMatch ? fallbackMatch.id : null;
}

/**
 * 보스 이름과 난이도로 일일 보스 그룹 정보 및 관련 ID 목록 조회
 * ('진 힐라' 절대 제외 및 일일 보스 전용 식별)
 */
export function findDailyBossGroupInfo(
  contentName: string,
  difficulty?: string
): { group: (typeof DAILY_BOSS_GROUP_DEFINITIONS)[0]; matchedDifficultyId: string; allDifficultyIds: string[] } | null {
  if (!contentName) return null;
  const normName = normalizeName(contentName);

  // 1) '진 힐라'는 절대 일일 보스가 아님 (철저한 격리)
  if (normName.includes('진힐라') || (normName.includes('진') && normName.includes('힐라'))) {
    return null;
  }

  // 2) 주간 전용 보스 키워드 필터링
  const weeklyOnlyKeywords = [
    '스우', '데미안', '루시드', '윌', '더스크', '듄켈',
    '세렌', '칼로스', '대적자', '카링', '흉성', '벨로나', '림보', '발드릭스', '유피테르',
    '가디언엔젤슬라임', '가엔슬', '슬라임', '검은마법사', '검은 마법사'
  ];
  if (weeklyOnlyKeywords.some((kw) => normName.includes(kw))) {
    return null;
  }

  // 난이도 추출 (전달된 difficulty 우선, 없으면 contentName에서 추출)
  let normDiff = difficulty ? normalizeDifficulty(difficulty) : '';
  if (!normDiff) {
    normDiff = normalizeDifficulty(contentName);
  }

  // 3) 주간 전용 난이도 조합 제외 (파풀라투스 카오스, 자쿰 카오스, 루타비스 카오스 등)
  if (normDiff === 'chaos') {
    const chaosWeeklyNames = ['자쿰', '매그너스', '파풀라투스', '피에르', '반반', '블러디퀸', '블러디', '벨룸'];
    if (chaosWeeklyNames.some((b) => normName.includes(b))) {
      return null;
    }
  }
  // - 하드 매그너스는 주간 보스
  if (normDiff === 'hard' && normName.includes('매그너스')) {
    return null;
  }
  // - 이지 시그너스는 주간 보스
  if (normDiff === 'easy' && normName.includes('시그너스')) {
    return null;
  }

  // 4) 일일 보스 그룹 매칭
  let matchedGroup: (typeof DAILY_BOSS_GROUP_DEFINITIONS)[0] | undefined;

  if (normName.includes('힐라')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '힐라');
  } else if (normName.includes('카웅')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '카웅');
  } else if (normName.includes('블러디퀸') || normName.includes('블러디') || normName.includes('퀸')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '블러디 퀸');
  } else if (normName.includes('반레온')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '반 레온');
  } else if (normName.includes('반반')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '반반');
  } else if (normName.includes('혼테일')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '혼테일');
  } else if (normName.includes('아카이럼')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '아카이럼');
  } else if (normName.includes('핑크빈')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '핑크빈');
  } else if (normName.includes('자쿰')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '자쿰');
  } else if (normName.includes('매그너스')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '매그너스');
  } else if (normName.includes('파풀라투스') || normName.includes('파풀')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '파풀라투스');
  } else if (normName.includes('피에르')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '피에르');
  } else if (normName.includes('벨룸')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '벨룸');
  } else if (normName.includes('시그너스')) {
    matchedGroup = DAILY_BOSS_GROUP_DEFINITIONS.find((g) => g.baseName === '시그너스');
  } else {
    const sortedGroups = [...DAILY_BOSS_GROUP_DEFINITIONS].sort(
      (a, b) => b.baseName.length - a.baseName.length
    );
    matchedGroup = sortedGroups.find((g) => {
      const gNorm = normalizeName(g.baseName);
      return normName.includes(gNorm) || gNorm.includes(normName);
    });
  }

  if (!matchedGroup) return null;

  const allDifficultyIds = matchedGroup.difficulties.map((d) => d.id);

  // 난이도 일치 항목 확인
  if (normDiff) {
    const diffMatch = matchedGroup.difficulties.find((d) => d.difficulty === normDiff);
    if (diffMatch) {
      return { group: matchedGroup, matchedDifficultyId: diffMatch.id, allDifficultyIds };
    }
    // 명시된 난이도가 일일 그룹에 없다면 불일치 (예: 카오스 파풀라투스 등)
    return null;
  }

  // contentName에 난이도 텍스트가 직접 포함되어 있는지 확인
  for (const d of matchedGroup.difficulties) {
    if (normName.includes(normalizeName(d.label)) || normName.includes(d.difficulty)) {
      return { group: matchedGroup, matchedDifficultyId: d.id, allDifficultyIds };
    }
  }

  // 단일 난이도 그룹인 경우 바로 반환 (예: 카웅 노말, 시그너스 노말 등)
  if (matchedGroup.difficulties.length === 1) {
    return { group: matchedGroup, matchedDifficultyId: matchedGroup.difficulties[0].id, allDifficultyIds };
  }

  // 기본값: 노말 또는 그룹의 첫 번째 난이도
  const normalMatch = matchedGroup.difficulties.find((d) => d.difficulty === 'normal');
  const fallbackId = normalMatch ? normalMatch.id : matchedGroup.difficulties[0].id;

  return { group: matchedGroup, matchedDifficultyId: fallbackId, allDifficultyIds };
}

/**
 * 보스 이름과 난이도로 앱의 DAILY_BOSSES id 찾기
 * (주간 보스 findBossTaskId와 100% 동일하게 입력된 난이도 그대로 1:1 매칭)
 */
export function findDailyBossTaskId(
  contentName: string,
  difficulty?: string
): string | null {
  const norm = normalizeName(contentName);
  if (norm.includes('루타비스') && !norm.includes('카오스')) {
    return ROOTABYSS_DAILY_BOSS_IDS[0];
  }

  const info = findDailyBossGroupInfo(contentName, difficulty);
  if (info) return info.matchedDifficultyId;

  // 주간 보스 findBossTaskId와 100% 동일한 DAILY_BOSSES 전체 폴백 매칭
  let normDiff = difficulty ? normalizeDifficulty(difficulty) : '';
  if (!normDiff) {
    normDiff = normalizeDifficulty(contentName);
  }

  const fallbackMatch = DAILY_BOSSES.find((b) => {
    const bNorm = normalizeName(b.name);
    return (
      (bNorm === norm) ||
      (normDiff && b.difficulty === normDiff && (bNorm.includes(norm) || norm.includes(bNorm)))
    );
  });

  return fallbackMatch ? fallbackMatch.id : null;
}

/**
 * 보스 이름과 난이도로 검은 마법사 태스크 ID 찾기
 * (주간 보스 findBossTaskId, 일일 보스 findDailyBossTaskId와 100% 동일한 1:1 식별 구조)
 */
export function findBlackMageTaskId(
  contentName: string,
  difficulty?: string
): string | null {
  if (!contentName) return null;
  const norm = normalizeName(contentName);
  if (
    !norm.includes('검은마법사') &&
    !(norm.includes('검은') && norm.includes('마법사')) &&
    !norm.includes('blackmage') &&
    !norm.includes('black_mage')
  ) {
    return null;
  }

  let normDiff = difficulty ? normalizeDifficulty(difficulty) : '';
  if (!normDiff) {
    normDiff = normalizeDifficulty(contentName);
  }

  if (normDiff === 'extreme' || norm.includes('익스트림') || norm.includes('extreme')) {
    return 'boss_extreme_black_mage';
  }
  return 'boss_hard_black_mage';
}

/**
 * 콘텐츠 이름으로 일일/주간 태스크 ID 찾기
 * (몬스터파크 일반 vs 몬스터파크 익스트림 분리 완벽 지원)
 */
export function findTaskItemId(contentName: string): { taskId: string; isWeekly: boolean } | null {
  if (!contentName) return null;
  const norm = normalizeName(contentName);

  // 1) 몬스터파크 (일반 일일)
  // 예: "몬스터파크", "몬파", "몬스터파크 무료 이용", "몬스터파크 2회"
  if (
    !norm.includes('익스트림') &&
    (norm.includes('몬스터파크') || norm.includes('몬파'))
  ) {
    return { taskId: 'daily_monster_park', isWeekly: false };
  }

  // 3) 키워드 맵핑 테이블 (샤레니안의 지하수로, 무릉도장, 플래그레이스, 에픽던전, 심볼 등)
  const foundKeyword = KEYWORD_TASK_MAP.find((entry) =>
    entry.keywords.some((kw) => norm.includes(normalizeName(kw)))
  );
  if (foundKeyword) {
    return { taskId: foundKeyword.taskId, isWeekly: !!foundKeyword.isWeekly };
  }

  // 4) 전체 태스크 맵 순회 매칭 (에픽 던전이나 특수 컨텐츠는 부분 포함이 아닌 정확한 명칭으로만 매칭하여 오등록 방지)
  for (const [taskId, taskItem] of ALL_TASKS_MAP.entries()) {
    const taskNorm = normalizeName(taskItem.name);
    const regionNorm = taskItem.region ? normalizeName(taskItem.region) : '';

    if (norm === taskNorm || (regionNorm && norm === regionNorm)) {
      return { taskId, isWeekly: taskId.startsWith('weekly_') };
    }
    
    // 심볼 일일/주간 퀘스트의 경우 명칭 포함 허용
    if (!taskId.startsWith('weekly_epic_') && !taskId.includes('monster_park')) {
      if (norm.includes(taskNorm) || (regionNorm && norm.includes(regionNorm))) {
        return { taskId, isWeekly: taskId.startsWith('weekly_') };
      }
    }
  }

  return null;
}

/**
 * 다양한 유형의 컨텐츠에 대한 완료 여부 및 진행 수치 판정
 * (점수제 주간 컨텐츠, 몬스터파크 일반/익스트림, 에픽던전, 심볼 퀘스트 등)
 */
export function evaluateContentProgress(item: any, taskId: string): {
  isCompleted: boolean;
  currentCount: number;
  maxCount: number;
} {
  if (!item) return { isCompleted: false, currentCount: 0, maxCount: 1 };

  // 1. 명시적 완료/보상/참여 플래그 확인
  const hasCompleteFlag = 
    isFlagTrue(item.complete_flag) ||
    isFlagTrue(item.clear_yn) ||
    isFlagTrue(item.clear_flag) ||
    isFlagTrue(item.reward_flag) ||
    isFlagTrue(item.receive_flag) ||
    isFlagTrue(item.is_clear) ||
    isFlagTrue(item.is_completed) ||
    isFlagTrue(item.completed) ||
    isFlagTrue(item.participate_flag) ||
    isFlagTrue(item.participated) ||
    isFlagTrue(item.participate_yn) ||
    isFlagTrue(item.attend_flag);

  // 2. quest_state 확인 ("2" = 완료, "1" = 진행 중, "0" = 기타/미진행)
  const questStateStr = String(item.quest_state ?? '').trim();
  const isQuestStateCompleted = questStateStr === '2';

  // 3. 수치 값 추출 (now_count, clear_count, enter_count, play_count, score, point, record)
  const rawNow = Number(item.now_count ?? item.clear_count ?? item.enter_count ?? item.play_count ?? item.count);
  const nowCount = isNaN(rawNow) ? 0 : rawNow;

  const rawMax = Number(item.max_count ?? item.target_count ?? item.total_count);
  const maxCount = isNaN(rawMax) ? 0 : rawMax;

  const scoreVal = Number(item.score || item.point || item.record || item.personal_score || item.guild_score || 0);

  // ----------------------------------------------------
  // A. 점수/수치 기반 주간 컨텐츠 (샤레니안의 지하수로, 무릉도장, 플래그 레이스)
  // ----------------------------------------------------
  if (
    taskId === 'weekly_sharenian_culvert' ||
    taskId === 'weekly_mulung_dojang' ||
    taskId === 'weekly_flag_race'
  ) {
    // 지하 수로, 무릉도장, 플래그는 참여 또는 클리어 시
    // (완료 플래그, 완료 퀘스트 상태, 점수 획득, 진행/도전 횟수 >= 1 중 하나라도 만족하면 완료)
    const isCompleted = 
      hasCompleteFlag ||
      isQuestStateCompleted ||
      scoreVal > 0 ||
      nowCount > 0 ||
      (maxCount > 0 && nowCount >= maxCount);

    return {
      isCompleted,
      currentCount: isCompleted ? 1 : 0,
      maxCount: 1,
    };
  }

  // ----------------------------------------------------
  // B. 몬스터파크 (일반 일일)
  // ----------------------------------------------------
  if (taskId === 'daily_monster_park') {
    const effectiveMax = maxCount > 0 ? maxCount : 7;
    const isCompleted = 
      hasCompleteFlag ||
      isQuestStateCompleted ||
      nowCount >= 2;

    const determinedCount = isCompleted 
      ? Math.max(nowCount, 2) 
      : Math.min(nowCount, effectiveMax);

    return {
      isCompleted,
      currentCount: determinedCount,
      maxCount: effectiveMax,
    };
  }

  // ----------------------------------------------------
  // C. 몬스터파크 익스트림 ('익스트림 몬스터파커에 도전해보겠나?' 퀘스트 quest_state === "2" 또는 클리어 기록)
  // ----------------------------------------------------
  if (taskId === 'weekly_monster_park_extreme' || taskId === 'daily_monster_park_extreme') {
    const isCompleted = 
      isQuestStateCompleted ||
      hasCompleteFlag ||
      nowCount >= 1;

    return {
      isCompleted,
      currentCount: isCompleted ? 1 : 0,
      maxCount: 1,
    };
  }

  // ----------------------------------------------------
  // D. 에픽 던전 (하이 마운틴, 앵글러 컴퍼니, 악몽 선경)
  // ----------------------------------------------------
  if (taskId.startsWith('weekly_epic_')) {
    const isCompleted = 
      hasCompleteFlag ||
      isQuestStateCompleted ||
      nowCount >= 1;

    return {
      isCompleted,
      currentCount: isCompleted ? 1 : 0,
      maxCount: 1,
    };
  }

  // ----------------------------------------------------
  // E. 주간 아케인 퀘스트 (에르다 스펙트럼, 무토, 스세, 엔하임, 프로텍트)
  // ----------------------------------------------------
  if (taskId.startsWith('weekly_arcane_') || taskId.startsWith('weekly_')) {
    const isCompleted = 
      hasCompleteFlag ||
      isQuestStateCompleted;

    return {
      isCompleted,
      currentCount: isCompleted ? 1 : nowCount,
      maxCount: maxCount > 0 ? maxCount : 1,
    };
  }

  // ----------------------------------------------------
  // F. 일반 일일 심볼 퀘스트 및 기타 일일 태스크
  // 처치 마리수(예: 1000/1000)만 채우고 게임 내 퀘스트 완료 수령 전에는 미완료 유지
  // ----------------------------------------------------
  const isCompleted = isQuestStateCompleted || hasCompleteFlag;

  return {
    isCompleted,
    currentCount: isCompleted ? (maxCount > 0 ? maxCount : 1) : nowCount,
    maxCount: maxCount > 0 ? maxCount : 1,
  };
}

/**
 * NEXON Open API 응답에서 인게임 스케줄러 등록된 항목 ID 목록 추출
 * (registration_flag: "true" 인 태스크 & 보스 + 진행/완료 기록이 있는 모든 태스크)
 */
/**
 * 게임 내 스케줄러(/maplestory/v1/scheduler/character-state)에 등록된 설정 항목 추출
 * - '인게임 스케줄러 불러오기'는 클리어/처치 기록이 아니라, 게임 내 스케줄러에 등록된 설정(registration_flag: true)만 그대로 온전히 가져옵니다.
 * - 일일/주간 퀘스트, 일일 보스, 주간 보스를 완벽하게 분리하여 추출합니다.
 */
export function extractInGameRegisteredTasks(apiData: any): {
  enabledTaskIds: string[];
  selectedBossIds: string[];
  selectedDailyBossIds: string[];
  selectedBlackMageId?: string | null;
} {
  const enabledTaskIds: string[] = [];
  const selectedBossIds: string[] = [];
  const selectedDailyBossIds: string[] = [];
  let selectedBlackMageId: string | null = null;

  if (!apiData) return { enabledTaskIds, selectedBossIds, selectedDailyBossIds, selectedBlackMageId };

  const data = apiData.scheduler || apiData;

  const rawDaily = Array.isArray(data.daily_contents) 
    ? data.daily_contents 
    : (Array.isArray(apiData.daily_contents) ? apiData.daily_contents : []);

  const rawWeekly = Array.isArray(data.weekly_contents) 
    ? data.weekly_contents 
    : (Array.isArray(apiData.weekly_contents) ? apiData.weekly_contents : []);

  const rawBoss = Array.isArray(data.boss_contents) 
    ? data.boss_contents 
    : (Array.isArray(apiData.boss_contents) ? apiData.boss_contents : []);

  // 1) daily_contents (일일 퀘스트 및 혹시 일일 컨텐츠 쪽에 포함된 일일 보스)
  rawDaily.forEach((item: any) => {
    if (isFlagTrue(item.registration_flag) || isFlagTrue(item.is_registered) || isFlagTrue(item.register_flag)) {
      const rawName = item.content_name || item.quest_name || item.name || item.title || '';
      const normRaw = normalizeName(rawName);

      // 혹시 검은 마법사가 일일 목록에 포함되어 있을 경우 판별
      if (
        normRaw.includes('검은마법사') || 
        (normRaw.includes('검은') && normRaw.includes('마법사')) || 
        normRaw.includes('blackmage') || 
        normRaw.includes('black_mage')
      ) {
        const normDiff = ((item.difficulty || '') + ' ' + rawName).toLowerCase();
        if (normDiff.includes('익스트림') || normDiff.includes('extreme')) {
          selectedBlackMageId = 'boss_extreme_black_mage';
        } else {
          selectedBlackMageId = 'boss_hard_black_mage';
        }
        return;
      }

      // 루타비스 4종 단체 등록 확인
      if (normRaw.includes('루타비스') && !normRaw.includes('카오스')) {
        ROOTABYSS_DAILY_BOSS_IDS.forEach((id) => {
          if (!selectedDailyBossIds.includes(id)) {
            selectedDailyBossIds.push(id);
          }
        });
        return;
      }
      
      // 일일 보스 확인
      const dailyBossId = findDailyBossTaskId(rawName, item.difficulty);
      if (dailyBossId) {
        if (!selectedDailyBossIds.includes(dailyBossId)) {
          selectedDailyBossIds.push(dailyBossId);
        }
        return;
      }

      const found = findTaskItemId(rawName);
      // daily_monster_park는 캐릭터 맞춤 설정이 아닌 계정 공통 진행 현황이므로 제외
      if (
        found && 
        found.taskId !== 'daily_monster_park' &&
        ALL_TASKS_MAP.has(found.taskId) && 
        !enabledTaskIds.includes(found.taskId)
      ) {
        enabledTaskIds.push(found.taskId);
      }
    }
  });

  // 2) weekly_contents (주간 컨텐츠: registration_flag === true, 계정 공통 에픽던전 제외)
  rawWeekly.forEach((item: any) => {
    if (
      isFlagTrue(item.registration_flag) || 
      isFlagTrue(item.is_registered) || 
      isFlagTrue(item.register_flag) ||
      isFlagTrue(item.register_yn) ||
      isFlagTrue(item.registration_yn)
    ) {
      const rawName = item.content_name || item.quest_name || item.name || item.title || '';
      const normRaw = normalizeName(rawName);

      // 검은 마법사가 주간 목록에 포함된 경우
      if (
        normRaw.includes('검은마법사') || 
        (normRaw.includes('검은') && normRaw.includes('마법사')) || 
        normRaw.includes('blackmage') || 
        normRaw.includes('black_mage')
      ) {
        const normDiff = ((item.difficulty || '') + ' ' + rawName).toLowerCase();
        if (normDiff.includes('익스트림') || normDiff.includes('extreme')) {
          selectedBlackMageId = 'boss_extreme_black_mage';
        } else {
          selectedBlackMageId = 'boss_hard_black_mage';
        }
        return;
      }

      const found = findTaskItemId(rawName);
      // weekly_epic_* (에픽던전)는 캐릭터 맞춤 설정이 아닌 계정 공통 진행 현황이므로 제외
      if (
        found && 
        !found.taskId.startsWith('weekly_epic_') &&
        ALL_TASKS_MAP.has(found.taskId) && 
        !enabledTaskIds.includes(found.taskId)
      ) {
        enabledTaskIds.push(found.taskId);
      }
    }
  });

  // 3) boss_contents (보스 컨텐츠: 일일 보스, 주간 보스 및 검은 마법사)
  rawBoss.forEach((boss: any) => {
    const isRegistered = 
      isFlagTrue(boss.registration_flag) || 
      isFlagTrue(boss.is_registered) || 
      isFlagTrue(boss.register_flag) || 
      isFlagTrue(boss.registered) ||
      isFlagTrue(boss.register_yn) ||
      isFlagTrue(boss.registration_yn);

    if (isRegistered) {
      const rawName = boss.content_name || boss.boss_name || boss.quest_name || boss.name || boss.title || '';
      const diff = boss.difficulty || boss.boss_difficulty;
      const normRaw = normalizeName(rawName);

      // 검은 마법사 확인
      if (
        normRaw.includes('검은마법사') || 
        (normRaw.includes('검은') && normRaw.includes('마법사')) || 
        normRaw.includes('blackmage') || 
        normRaw.includes('black_mage')
      ) {
        const normDiff = ((diff || '') + ' ' + (boss.difficulty || '') + ' ' + rawName).toLowerCase();
        if (normDiff.includes('익스트림') || normDiff.includes('extreme')) {
          selectedBlackMageId = 'boss_extreme_black_mage';
        } else {
          selectedBlackMageId = 'boss_hard_black_mage';
        }
        return;
      }

      // 루타비스 4종 단체 등록 확인
      if (normRaw.includes('루타비스') && !normRaw.includes('카오스')) {
        ROOTABYSS_DAILY_BOSS_IDS.forEach((id) => {
          if (!selectedDailyBossIds.includes(id)) {
            selectedDailyBossIds.push(id);
          }
        });
        return;
      }
      
      // 3-0. cycle 기반 우선 라우팅 (bossWeekly, bossDaily, bossMonthly)
      const cycle = String(boss.cycle || '').toLowerCase();
      if (cycle === 'bossmonthly') {
        const bmId = findBlackMageTaskId(rawName, diff);
        if (bmId) selectedBlackMageId = bmId;
        return;
      }
      if (cycle === 'bossweekly') {
        const bossId = findBossTaskId(rawName, diff);
        if (bossId && !selectedBossIds.includes(bossId)) {
          selectedBossIds.push(bossId);
        }
        return;
      }
      if (cycle === 'bossdaily') {
        const dailyBossId = findDailyBossTaskId(rawName, diff);
        if (dailyBossId && !selectedDailyBossIds.includes(dailyBossId)) {
          selectedDailyBossIds.push(dailyBossId);
        }
        return;
      }

      // 3-1. 일일 보스 확인
      const dailyBossId = findDailyBossTaskId(rawName, diff);
      if (dailyBossId) {
        if (!selectedDailyBossIds.includes(dailyBossId)) {
          selectedDailyBossIds.push(dailyBossId);
        }
        return;
      }

      // 3-2. 주간 보스 확인
      const bossId = findBossTaskId(rawName, diff);
      if (bossId && !selectedBossIds.includes(bossId)) {
        selectedBossIds.push(bossId);
      }
    }
  });

  // 4) scheduler_info 지원 (단일 통합 목록으로 응답이 내려올 경우 대비)
  const rawInfo = Array.isArray(data.scheduler_info)
    ? data.scheduler_info
    : (Array.isArray(apiData.scheduler_info) ? apiData.scheduler_info : []);

  rawInfo.forEach((item: any) => {
    const isRegistered = 
      isFlagTrue(item.registration_flag) || 
      isFlagTrue(item.is_registered) ||
      isFlagTrue(item.register_flag) ||
      isFlagTrue(item.registered) ||
      isFlagTrue(item.register_yn) ||
      isFlagTrue(item.registration_yn);
    if (!isRegistered) return;
    const cat = (item.category_name || '').toLowerCase();
    const rawName = item.content_name || item.quest_name || item.name || '';
    const diff = item.difficulty;
    const normRaw = normalizeName(rawName);

    if (
      normRaw.includes('검은마법사') || 
      (normRaw.includes('검은') && normRaw.includes('마법사')) || 
      normRaw.includes('blackmage') || 
      normRaw.includes('black_mage')
    ) {
      const normDiff = ((diff || '') + ' ' + (item.difficulty || '') + ' ' + rawName).toLowerCase();
      if (normDiff.includes('익스트림') || normDiff.includes('extreme')) {
        selectedBlackMageId = 'boss_extreme_black_mage';
      } else {
        selectedBlackMageId = 'boss_hard_black_mage';
      }
      return;
    }

    if (normRaw.includes('루타비스') && !normRaw.includes('카오스')) {
      ROOTABYSS_DAILY_BOSS_IDS.forEach((id) => {
        if (!selectedDailyBossIds.includes(id)) selectedDailyBossIds.push(id);
      });
      return;
    }

    // 카테고리 명칭과 무관하게 보스/태스크 직접 매칭
    const dailyId = findDailyBossTaskId(rawName, diff);
    if (dailyId) {
      if (!selectedDailyBossIds.includes(dailyId)) selectedDailyBossIds.push(dailyId);
      return;
    }
    const bossId = findBossTaskId(rawName, diff);
    if (bossId) {
      if (!selectedBossIds.includes(bossId)) selectedBossIds.push(bossId);
      return;
    }

    const found = findTaskItemId(rawName);
    if (
      found &&
      found.taskId !== 'daily_monster_park' &&
      !found.taskId.startsWith('weekly_epic_') &&
      ALL_TASKS_MAP.has(found.taskId) &&
      !enabledTaskIds.includes(found.taskId)
    ) {
      enabledTaskIds.push(found.taskId);
    }
  });

  return { 
    enabledTaskIds: sortTaskIdsByStandardOrder(enabledTaskIds), 
    selectedBossIds: sortBossIdsByStandardOrder(selectedBossIds),
    selectedDailyBossIds: sortDailyBossIdsByStandardOrder(selectedDailyBossIds),
    selectedBlackMageId,
  };
}

/**
 * NEXON Open API /maplestory/v1/scheduler/character-state 응답 데이터를
 * 앱의 CharacterProgressRecord 상태로 파싱 및 매핑
 * 
 * - 캐릭터 본인의 활성화된 태스크(characterEnabledTaskIds, characterSelectedBossIds, characterSelectedDailyBossIds)만 격리 반영
 * - 일일 보스 클리어 현황 자동 체크 및 메소 기록 지원
 * - 타 캐릭터/타 월드 오염을 유발하는 dojang_best_floor 및 무차별 quest_history 강제 완료 제거
 */
export function applyNexonSchedulerData(
  currentRecord: CharacterProgressRecord,
  apiData: any,
  characterEnabledTaskIds?: string[],
  characterSelectedBossIds?: string[],
  characterSelectedDailyBossIds?: string[],
  characterSelectedBlackMageId?: string | null
): { updatedRecord: CharacterProgressRecord; syncCount: number } {
  if (!apiData) {
    return { updatedRecord: currentRecord, syncCount: 0 };
  }

  const data = apiData.scheduler || apiData;
  if (!data || typeof data !== 'object') {
    return { updatedRecord: currentRecord, syncCount: 0 };
  }

  const rawDaily = Array.isArray(data.daily_contents) 
    ? data.daily_contents 
    : (Array.isArray(apiData.daily_contents) 
        ? apiData.daily_contents 
        : (Array.isArray(apiData.scheduler?.daily_contents) ? apiData.scheduler.daily_contents : []));

  const rawWeekly = Array.isArray(data.weekly_contents) 
    ? data.weekly_contents 
    : (Array.isArray(apiData.weekly_contents) 
        ? apiData.weekly_contents 
        : (Array.isArray(apiData.scheduler?.weekly_contents) ? apiData.scheduler.weekly_contents : []));

  const rawBoss = Array.isArray(data.boss_contents) 
    ? data.boss_contents 
    : (Array.isArray(apiData.boss_contents) 
        ? apiData.boss_contents 
        : (Array.isArray(apiData.scheduler?.boss_contents) ? apiData.scheduler.boss_contents : []));

  // 넥슨 스케줄러 유효 데이터 존재 여부 엄격 검증:
  // 일일, 주간, 보스 콘텐츠 중 단 하나라도 존재하지 않는 빈 객체/에러 응답인 경우,
  // 기존에 유저가 완료해둔 클리어 현황을 훼손하지 않고 100% 안전하게 원본 유지합니다.
  if (rawDaily.length === 0 && rawWeekly.length === 0 && rawBoss.length === 0) {
    return { updatedRecord: currentRecord, syncCount: 0 };
  }

  // 1) 인게임 스케줄러 기준 동기화:
  // 일일, 주간, 일보, 주보, 검마는 인게임 스케줄러와 비교하여 클리어했을 시에만 체크하고,
  // 그 외에는 수동으로 체크가 되어있더라도 무조건 체크 해제(completed: false) 처리합니다.
  const updatedDaily: Record<string, TaskProgressState> = {};
  if (characterEnabledTaskIds && characterEnabledTaskIds.length > 0) {
    characterEnabledTaskIds.forEach((id) => {
      if (!id.startsWith('weekly_') && !id.startsWith('boss_') && !id.startsWith('daily_boss_')) {
        updatedDaily[id] = { completed: false, currentCount: 0, maxCount: 1, autoSynced: true };
      }
    });
  } else if (currentRecord.dailyTasks) {
    Object.keys(currentRecord.dailyTasks).forEach((id) => {
      updatedDaily[id] = { completed: false, currentCount: 0, maxCount: 1, autoSynced: true };
    });
  }

  const updatedDailyBosses: Record<string, TaskProgressState> = {};
  if (characterSelectedDailyBossIds && characterSelectedDailyBossIds.length > 0) {
    characterSelectedDailyBossIds.forEach((id) => {
      updatedDailyBosses[id] = { completed: false, autoSynced: true };
    });
  } else if (currentRecord.dailyBosses) {
    Object.keys(currentRecord.dailyBosses).forEach((id) => {
      updatedDailyBosses[id] = { completed: false, autoSynced: true };
    });
  }

  const updatedWeekly: Record<string, TaskProgressState> = {};
  if (characterEnabledTaskIds && characterEnabledTaskIds.length > 0) {
    characterEnabledTaskIds.forEach((id) => {
      if (id.startsWith('weekly_')) {
        updatedWeekly[id] = { completed: false, currentCount: 0, maxCount: 1, autoSynced: true };
      }
    });
  } else if (currentRecord.weeklyTasks) {
    Object.keys(currentRecord.weeklyTasks).forEach((id) => {
      updatedWeekly[id] = { completed: false, currentCount: 0, maxCount: 1, autoSynced: true };
    });
  }

  const updatedBosses: Record<string, TaskProgressState> = {};
  if (characterSelectedBossIds && characterSelectedBossIds.length > 0) {
    characterSelectedBossIds.forEach((id) => {
      updatedBosses[id] = { completed: false, autoSynced: true };
    });
  } else if (currentRecord.weeklyBosses) {
    Object.keys(currentRecord.weeklyBosses).forEach((id) => {
      updatedBosses[id] = { completed: false, autoSynced: true };
    });
  }

  let updatedBlackMage: TaskProgressState = {
    completed: false,
    autoSynced: true,
    difficulty: characterSelectedBlackMageId || currentRecord.blackMage?.difficulty || undefined,
  };

  let syncCount = 0;
  const nowIso = new Date().toISOString();

  const rawGuild = Array.isArray(data.guild_contents) 
    ? data.guild_contents 
    : (Array.isArray(apiData.guild_contents) 
        ? apiData.guild_contents 
        : (Array.isArray(apiData.scheduler?.guild_contents) ? apiData.scheduler.guild_contents : []));

  const rawInfo = Array.isArray(data.scheduler_info) 
    ? data.scheduler_info 
    : (Array.isArray(apiData.scheduler_info) 
        ? apiData.scheduler_info 
        : (Array.isArray(apiData.scheduler?.scheduler_info) ? apiData.scheduler.scheduler_info : []));

  // 검은 마법사 동기화 헬퍼 (월간 보스: 인게임 스케줄러 클리어 여부 반영)
  let blackMageClearedInThisSync = false;

  const handleBlackMageSync = (name: string, diff?: string, isCompleted?: boolean): boolean => {
    const bmId = findBlackMageTaskId(name, diff);
    if (!bmId) return false;

    // 이미 이번 동기화에서 다른 난이도(하드/익스트림)로 클리어 처리된 경우, false로 덮어써지지 않도록 보호
    if (blackMageClearedInThisSync && !isCompleted) {
      return true;
    }

    const isSelected = !!characterSelectedBlackMageId && characterSelectedBlackMageId === bmId;

    if (isCompleted) {
      blackMageClearedInThisSync = true;
      updatedBlackMage = {
        completed: true,
        completedAt: updatedBlackMage.completed ? (updatedBlackMage.completedAt || nowIso) : nowIso,
        autoSynced: true,
        difficulty: bmId,
      };
      syncCount++;
    } else if (isSelected || !characterSelectedBlackMageId) {
      if (!blackMageClearedInThisSync) {
        updatedBlackMage = {
          completed: false,
          completedAt: undefined,
          autoSynced: true,
          difficulty: characterSelectedBlackMageId || bmId,
        };
      }
    }

    return true;
  };

  // 일일 보스 동기화 헬퍼 (인게임 스케줄러 클리어 시에만 true, 미클리어 시 false)
  const handleDailyBossSync = (name: string, diff?: string, isCompleted?: boolean): boolean => {
    const norm = normalizeName(name);

    // 1) 루타비스 4종 단체 처리 (피에르, 반반, 블러디 퀸, 벨룸)
    if (norm.includes('루타비스') && !norm.includes('카오스')) {
      let anyHandled = false;
      ROOTABYSS_DAILY_BOSS_IDS.forEach((bId) => {
        const isSelected = !characterSelectedDailyBossIds || characterSelectedDailyBossIds.includes(bId);
        if (isSelected || isCompleted) {
          updatedDailyBosses[bId] = {
            completed: !!isCompleted,
            completedAt: isCompleted ? nowIso : undefined,
            autoSynced: true,
          };
          syncCount++;
          anyHandled = true;
        }
      });
      return anyHandled;
    }

    // 1:1 정확한 일일 보스 ID 조회
    const dailyBossId = findDailyBossTaskId(name, diff);
    if (!dailyBossId) return false;

    const isSelected = !characterSelectedDailyBossIds || characterSelectedDailyBossIds.includes(dailyBossId);

    if (isSelected || isCompleted) {
      updatedDailyBosses[dailyBossId] = {
        completed: !!isCompleted,
        completedAt: isCompleted ? nowIso : undefined,
        autoSynced: true,
      };
      syncCount++;
    }

    return true;
  };

  // 주간 보스 동기화 헬퍼 (1:1 매핑 기반 실시간 동기화: 인게임 스케줄러 클리어 시에만 true, 미클리어 시 false)
  const handleWeeklyBossSync = (name: string, diff?: string, isCompleted?: boolean): boolean => {
    const bossId = findBossTaskId(name, diff);
    if (!bossId) return false;

    const isSelected = !characterSelectedBossIds || characterSelectedBossIds.includes(bossId);

    if (isSelected || isCompleted) {
      updatedBosses[bossId] = {
        completed: !!isCompleted,
        completedAt: isCompleted ? nowIso : undefined,
        autoSynced: true,
      };
      syncCount++;
    }

    return true;
  };

  // 1. 일일 콘텐츠 (daily_contents) 파싱
  if (Array.isArray(rawDaily)) {
    rawDaily.forEach((item: any) => {
      const name = item.content_name || item.quest_name || item.name || item.title || '';
      if (!name) return;

      const diff = item.difficulty || item.boss_difficulty;
      const isCompleted = isBossItemCompleted(item);

      // 1-0. 검은 마법사 매칭 시도
      if (handleBlackMageSync(name, diff, isCompleted)) {
        return;
      }

      // 1-1. 일일 보스 매칭 시도
      if (handleDailyBossSync(name, diff, isCompleted)) {
        return;
      }

      // 1-2. 주간 보스 매칭 시도
      if (handleWeeklyBossSync(name, diff, isCompleted)) {
        return;
      }

      // 1-3. 일반 일일 태스크
      const found = findTaskItemId(name);
      if (!found) return;

      const isCommonTask = found.taskId === 'daily_monster_park' || found.taskId.startsWith('weekly_epic_');
      if (characterEnabledTaskIds && !characterEnabledTaskIds.includes(found.taskId) && !isCommonTask) {
        return;
      }

      const evalResult = evaluateContentProgress(item, found.taskId);
      const targetMap = found.isWeekly ? updatedWeekly : updatedDaily;

      targetMap[found.taskId] = {
        completed: evalResult.isCompleted,
        currentCount: evalResult.currentCount,
        maxCount: evalResult.maxCount,
        completedAt: evalResult.isCompleted ? (targetMap[found.taskId]?.completedAt || nowIso) : undefined,
        autoSynced: true,
      };
      syncCount++;
    });
  }

  // 2. 주간 콘텐츠 (weekly_contents) 파싱 (샤레니안의 지하수로, 무릉도장, 플래그 레이스, 에픽 던전 등)
  if (Array.isArray(rawWeekly)) {
    rawWeekly.forEach((item: any) => {
      const name = item.content_name || item.quest_name || item.name || item.title || '';
      if (!name) return;

      const diff = item.difficulty || item.boss_difficulty;
      const isCompleted = isBossItemCompleted(item);

      // 2-0. 검은 마법사 매칭 시도 (월간/주간 스케줄러 포함)
      if (handleBlackMageSync(name, diff, isCompleted)) {
        return;
      }

      // 2-1. 주간 보스 매칭 시도
      if (handleWeeklyBossSync(name, diff, isCompleted)) {
        return;
      }

      // 2-2. 일일 보스 매칭 시도
      if (handleDailyBossSync(name, diff, isCompleted)) {
        return;
      }

      // 2-3. 주간 일반 태스크
      const found = findTaskItemId(name);
      if (!found) return;

      const isCommonTask = found.taskId === 'daily_monster_park' || found.taskId.startsWith('weekly_epic_');
      if (characterEnabledTaskIds && !characterEnabledTaskIds.includes(found.taskId) && !isCommonTask) {
        return;
      }

      const evalResult = evaluateContentProgress(item, found.taskId);
      const targetMap = found.isWeekly ? updatedWeekly : updatedDaily;

      targetMap[found.taskId] = {
        completed: evalResult.isCompleted,
        currentCount: evalResult.currentCount,
        maxCount: evalResult.maxCount,
        completedAt: evalResult.isCompleted ? (targetMap[found.taskId]?.completedAt || nowIso) : undefined,
        autoSynced: true,
      };
      syncCount++;
    });
  }

  // 2-1. 길드 / 기타 주간 콘텐츠 (guild_contents 등) 파싱
  if (Array.isArray(rawGuild)) {
    rawGuild.forEach((item: any) => {
      const name = item.content_name || item.quest_name || item.name || item.title || '';
      const found = findTaskItemId(name);
      if (!found) return;

      if (characterEnabledTaskIds && !characterEnabledTaskIds.includes(found.taskId)) {
        return;
      }

      const evalResult = evaluateContentProgress(item, found.taskId);
      const targetMap = found.isWeekly ? updatedWeekly : updatedDaily;

      targetMap[found.taskId] = {
        completed: evalResult.isCompleted,
        currentCount: evalResult.currentCount,
        maxCount: evalResult.maxCount,
        completedAt: evalResult.isCompleted ? (targetMap[found.taskId]?.completedAt || nowIso) : undefined,
        autoSynced: true,
      };
      syncCount++;
    });
  }

  // 3. 보스 컨텐츠 (boss_contents) 파싱 - 일일 보스, 주간 보스 및 검은 마법사
  if (Array.isArray(rawBoss)) {
    rawBoss.forEach((boss: any) => {
      const name = boss.content_name || boss.boss_name || boss.quest_name || boss.name || boss.title || '';
      if (!name) return;

      const diff = boss.difficulty || boss.boss_difficulty;
      const isCompleted = isBossItemCompleted(boss);
      const cycle = String(boss.cycle || '').toLowerCase();

      // 1순위: cycle 명시값에 따라 정확한 카테고리로 직접 라우팅
      if (cycle === 'bossmonthly' || name.includes('검은 마법사') || name.includes('검은마법사')) {
        if (handleBlackMageSync(name, diff, isCompleted)) return;
      } else if (cycle === 'bossdaily') {
        if (handleDailyBossSync(name, diff, isCompleted)) return;
      } else if (cycle === 'bossweekly') {
        if (handleWeeklyBossSync(name, diff, isCompleted)) return;
      }

      // 2순위: cycle이 명시되지 않았거나 매칭되지 않은 경우 순차 폴백
      if (handleBlackMageSync(name, diff, isCompleted)) return;
      if (handleDailyBossSync(name, diff, isCompleted)) return;
      if (handleWeeklyBossSync(name, diff, isCompleted)) return;
    });
  }

  // 3-2. 퀘스트 히스토리 기반 보스 처치 및 주간 길드 컨텐츠(샤레니안의 지하수로) 확정 반영
  // 과거 영구 퀘스트로 인한 오염 방지를 위해, KST 기준 완료 시점(오늘/이번 주/당월) 검증 수행
  const rawQuestHistory = apiData?.quest_history?.quest_history || (Array.isArray(apiData?.quest_history) ? apiData.quest_history : []);
  if (Array.isArray(rawQuestHistory)) {
    const todayKst = getKSTDailyKey();
    const currentMonthKst = getKSTMonthlyKey();
    const currentWeeklyThuKst = getKSTWeeklyThuKey();

    const getKstKeysFromTime = (timeStr?: string) => {
      if (!timeStr) return { dailyKey: todayKst, monthKey: currentMonthKst, weeklyKey: currentWeeklyThuKst };
      try {
        const d = new Date(timeStr);
        if (isNaN(d.getTime())) return { dailyKey: todayKst, monthKey: currentMonthKst, weeklyKey: currentWeeklyThuKst };
        return {
          dailyKey: getKSTDailyKey(d),
          monthKey: getKSTMonthlyKey(d),
          weeklyKey: getKSTWeeklyThuKey(d),
        };
      } catch {
        return { dailyKey: todayKst, monthKey: currentMonthKst, weeklyKey: currentWeeklyThuKst };
      }
    };

    rawQuestHistory.forEach((q: any) => {
      const qName = q.quest_name || q.name || '';
      if (!qName) return;
      const normQ = normalizeName(qName);
      const timeKeys = getKstKeysFromTime(q.quest_complete_time);

      // 샤레니안의 지하수로 퀘스트 확인 (이번 주 목요일 리셋 주기 내)
      if (
        normQ.includes('샤레니안') ||
        normQ.includes('지하수로') ||
        normQ.includes('sharenian') ||
        normQ.includes('culvert')
      ) {
        if (timeKeys.weeklyKey === currentWeeklyThuKst) {
          if (!characterEnabledTaskIds || characterEnabledTaskIds.includes('weekly_sharenian_culvert')) {
            if (!updatedWeekly['weekly_sharenian_culvert']?.completed) {
              updatedWeekly['weekly_sharenian_culvert'] = {
                completed: true,
                currentCount: 1,
                maxCount: 1,
                completedAt: q.quest_complete_time || nowIso,
                autoSynced: true,
              };
              syncCount++;
            }
          }
        }
      }

      // 검은 마법사 처치/해방 퀘스트 확정 반영 (이번 달 완료된 검은 마법사 관련 퀘스트)
      if (
        q.quest_complete_time &&
        (normQ.includes('검은마법사') || (normQ.includes('검은') && normQ.includes('마법사')) || normQ.includes('사슬을끊어낸자')) &&
        timeKeys.monthKey === currentMonthKst
      ) {
        handleBlackMageSync(qName, undefined, true);
      }
    });
  }

  // 3-3. 기타 스케줄러 정보 (scheduler_info) 파싱
  if (Array.isArray(rawInfo)) {
    rawInfo.forEach((item: any) => {
      const name = item.content_name || item.boss_name || item.quest_name || item.name || item.title || '';
      if (!name) return;

      const diff = item.difficulty || item.boss_difficulty;
      const isCompleted = isBossItemCompleted(item);

      if (handleBlackMageSync(name, diff, isCompleted)) return;
      if (handleDailyBossSync(name, diff, isCompleted)) return;
      if (handleWeeklyBossSync(name, diff, isCompleted)) return;

      // 3-3-4. 일반 일일/주간 퀘스트 동기화
      const found = findTaskItemId(name);
      if (found && ALL_TASKS_MAP.has(found.taskId)) {
        const evalResult = evaluateContentProgress(item, found.taskId);
        const isItemDone = isCompleted || evalResult.isCompleted;
        const targetMap = found.isWeekly ? updatedWeekly : updatedDaily;
        targetMap[found.taskId] = {
          completed: isItemDone,
          currentCount: evalResult.currentCount !== undefined ? evalResult.currentCount : isItemDone ? (found.taskId === 'daily_monster_park' ? 2 : 1) : 0,
          maxCount: evalResult.maxCount || (found.taskId === 'daily_monster_park' ? 7 : 1),
          completedAt: isItemDone ? (targetMap[found.taskId]?.completedAt || nowIso) : undefined,
          autoSynced: true,
        };
        syncCount++;
      }
    });
  }

  // 4. dailyBossWeeklyLog (목~수 누적) 자동 동기화 반영 (실제 완료된 난이도 기록)
  const currentDailyKey = currentRecord.dailyDateKey || getKSTDailyKey();
  const updatedWeeklyLog = { ...(currentRecord.dailyBossWeeklyLog || {}) };
  
  const clearedDailyBossIds: string[] = [];
  DAILY_BOSS_GROUP_DEFINITIONS.forEach((group) => {
    const completedDiff = group.difficulties.find((d) => updatedDailyBosses[d.id]?.completed);
    if (completedDiff) {
      clearedDailyBossIds.push(completedDiff.id);
    }
  });

  if (clearedDailyBossIds.length > 0 || updatedWeeklyLog[currentDailyKey]) {
    updatedWeeklyLog[currentDailyKey] = clearedDailyBossIds;
  }

  return {
    updatedRecord: {
      ...currentRecord,
      dailyTasks: updatedDaily,
      dailyBosses: updatedDailyBosses,
      weeklyTasks: updatedWeekly,
      weeklyBosses: updatedBosses,
      blackMage: updatedBlackMage,
      dailyBossWeeklyLog: updatedWeeklyLog,
      updatedAt: nowIso,
    },
    syncCount,
  };
}

export interface CharacterCompletionStatus {
  dailyTotal: number;
  dailyDone: number;
  isDailyAllDone: boolean;
  dailyBossTotal: number;
  dailyBossDone: number;
  isDailyBossAllDone: boolean;
  weeklyTotal: number;
  weeklyDone: number;
  isWeeklyAllDone: boolean;
  bossThreshold: number;
  clearedBossCount: number;
  isBossAllDone: boolean;
  customTotal: number;
  customDone: number;
  isCustomAllDone: boolean;
  isBlackMageDone: boolean;
  hasBlackMage: boolean;
  isAllCompleted: boolean;
  hasAnySchedule: boolean;
}

/**
 * 캐릭터별 컨텐츠 완료 여부 통합 계산 함수
 * - 숙제를 아예 선택하지 않은 캐릭터(0/0/0/0)는 완료(초록색) 처리
 * - 일일 보스는 등록된 보스를 모두 클리어했을 시 완료 처리
 * - 주간 보스는 설정된 완료 기준(threshold) 이상 처치 시 완료 처리
 * - 커스텀 및 검은 마법사는 환경설정 옵션에 따라 완료 기준에 포함
 */
export function getCharacterCompletionStatus(
  char: CharacterInfo,
  rec?: CharacterProgressRecord,
  options?: {
    includeCustom?: boolean;
    includeBlackMage?: boolean;
  }
): CharacterCompletionStatus {
  if (!char) {
    return {
      dailyTotal: 0,
      dailyDone: 0,
      isDailyAllDone: true,
      dailyBossTotal: 0,
      dailyBossDone: 0,
      isDailyBossAllDone: true,
      weeklyTotal: 0,
      weeklyDone: 0,
      isWeeklyAllDone: true,
      bossThreshold: 0,
      clearedBossCount: 0,
      isBossAllDone: true,
      customTotal: 0,
      customDone: 0,
      isCustomAllDone: true,
      isBlackMageDone: true,
      hasBlackMage: false,
      isAllCompleted: true,
      hasAnySchedule: false,
    };
  }

  // 1. 일일 퀘스트 (계정 공통인 몬스터파크는 개별 캐릭터 스케줄에서 제외)
  const dailyTaskIds = (char.enabledTaskIds || []).filter(
    (id) =>
      id !== 'daily_monster_park' &&
      id !== 'daily_monster_park_extreme' &&
      !id.startsWith('weekly_') &&
      !id.startsWith('boss_') &&
      !id.startsWith('daily_boss_')
  );
  const dailyTotal = dailyTaskIds.length;
  const dailyDone = dailyTaskIds.filter((id) => !!rec?.dailyTasks?.[id]?.completed).length;
  const isDailyAllDone = dailyTotal === 0 ? true : dailyDone >= dailyTotal;

  // 2. 일일 보스 (등록해놓은 것을 클리어했을 시 완료)
  const dailyBossIds = char.selectedDailyBossIds || [];
  const dailyBossTotal = dailyBossIds.length;
  const dailyBossDone = dailyBossIds.filter((id) => !!rec?.dailyBosses?.[id]?.completed).length;
  const isDailyBossAllDone = dailyBossTotal === 0 ? true : dailyBossDone >= dailyBossTotal;

  // 3. 주간 퀘스트 (계정 공통인 에픽던전, 몬파익스트림은 제외)
  const weeklyTaskIds = (char.enabledTaskIds || []).filter(
    (id) =>
      id.startsWith('weekly_') &&
      id !== 'weekly_monster_park_extreme' &&
      !id.startsWith('weekly_epic_')
  );
  const weeklyTotal = weeklyTaskIds.length;
  const weeklyDone = weeklyTaskIds.filter((id) => !!rec?.weeklyTasks?.[id]?.completed).length;
  const isWeeklyAllDone = weeklyTotal === 0 ? true : weeklyDone >= weeklyTotal;

  // 4. 주간 보스
  const selectedBossCount = (char.selectedBossIds || []).length;
  const bossThreshold = selectedBossCount === 0 ? 0 : (char.weeklyBossThreshold ?? Math.min(12, selectedBossCount));
  const clearedBossCount = WEEKLY_BOSSES.filter((b) => !!rec?.weeklyBosses?.[b.id]?.completed).length;
  const isBossAllDone = bossThreshold === 0 ? true : clearedBossCount >= bossThreshold;

  // 5. 커스텀 컨텐츠
  const customTasks = char.customTasks || [];
  const customTotal = customTasks.length;
  const customDone = customTasks.filter((t) => !!rec?.customTasks?.[t.id]?.completed).length;
  const isCustomAllDone = customTotal === 0 ? true : customDone >= customTotal;

  // 6. 검은 마법사
  const hasBlackMage = !!char.selectedBlackMageId;
  const isBlackMageDone = hasBlackMage ? !!rec?.blackMage?.completed : true;

  const includeCustom = options?.includeCustom !== false;
  const includeBlackMage = options?.includeBlackMage !== false;

  const hasAnySchedule = 
    dailyTotal > 0 || 
    dailyBossTotal > 0 || 
    weeklyTotal > 0 || 
    bossThreshold > 0 || 
    (includeCustom && customTotal > 0) || 
    (includeBlackMage && hasBlackMage);

  let isAllCompleted = hasAnySchedule && isDailyAllDone && isDailyBossAllDone && isWeeklyAllDone && isBossAllDone;
  if (includeCustom && customTotal > 0) {
    isAllCompleted = isAllCompleted && isCustomAllDone;
  }
  if (includeBlackMage && hasBlackMage) {
    isAllCompleted = isAllCompleted && isBlackMageDone;
  }

  return {
    dailyTotal,
    dailyDone,
    isDailyAllDone,
    dailyBossTotal,
    dailyBossDone,
    isDailyBossAllDone,
    weeklyTotal,
    weeklyDone,
    isWeeklyAllDone,
    bossThreshold,
    clearedBossCount,
    isBossAllDone,
    customTotal,
    customDone,
    isCustomAllDone,
    isBlackMageDone,
    hasBlackMage,
    isAllCompleted,
    hasAnySchedule,
  };
}

/**
 * 과거 날짜의 넥슨 스케줄러 응답에서 처치 완료된 일일 보스 ID 배열을 추출 (소급 동기화용)
 */
export function extractCompletedDailyBossIdsFromData(apiData: any): string[] {
  if (!apiData) return [];
  const data = apiData.scheduler || apiData;
  const rawDaily = Array.isArray(data.daily_contents) ? data.daily_contents : [];
  const rawBoss = Array.isArray(data.boss_contents) ? data.boss_contents : [];
  const rawInfo = Array.isArray(data.scheduler_info) ? data.scheduler_info : [];

  const completedIds = new Set<string>();

  const checkBossItem = (item: any) => {
    if (!isBossItemCompleted(item)) return;
    const rawName = item.content_name || item.boss_name || item.quest_name || item.name || '';
    const diff = item.difficulty || item.boss_difficulty;
    const norm = normalizeName(rawName);

    if (norm.includes('루타비스') && !norm.includes('카오스')) {
      ROOTABYSS_DAILY_BOSS_IDS.forEach((id) => completedIds.add(id));
      return;
    }

    const dailyBossId = findDailyBossTaskId(rawName, diff);
    if (dailyBossId) {
      completedIds.add(dailyBossId);
    }
  };

  rawDaily.forEach(checkBossItem);
  rawBoss.forEach((b) => {
    const cycle = String(b.cycle || '').toLowerCase();
    if (cycle === 'bossdaily' || !cycle) {
      checkBossItem(b);
    }
  });
  rawInfo.forEach(checkBossItem);

  return Array.from(completedIds);
}

