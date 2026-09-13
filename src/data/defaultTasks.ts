import { TaskItem } from '../types';

export const ARCANE_DAILY_QUESTS: TaskItem[] = [
  { id: 'daily_arcane_vanishing', name: '소멸의 여로', category: 'daily_quest', type: 'boolean', minLevel: 200, region: '소멸의 여로', icon: '🌊', resetType: 'daily' },
  { id: 'daily_arcane_chuchu', name: '츄츄 아일랜드', category: 'daily_quest', type: 'boolean', minLevel: 210, region: '츄츄 아일랜드', icon: '🥪', resetType: 'daily' },
  { id: 'daily_arcane_lachelein', name: '레헬른', category: 'daily_quest', type: 'boolean', minLevel: 220, region: '레헬른', icon: '🎭', resetType: 'daily' },
  { id: 'daily_arcane_arcana', name: '아르카나', category: 'daily_quest', type: 'boolean', minLevel: 225, region: '아르카나', icon: '🌳', resetType: 'daily' },
  { id: 'daily_arcane_morass', name: '모라스', category: 'daily_quest', type: 'boolean', minLevel: 230, region: '모라스', icon: '🧪', resetType: 'daily' },
  { id: 'daily_arcane_espera', name: '에스페라', category: 'daily_quest', type: 'boolean', minLevel: 235, region: '에스페라', icon: '✨', resetType: 'daily' },
  { id: 'daily_arcane_moonbridge', name: '문브릿지', category: 'daily_quest', type: 'boolean', minLevel: 245, region: '문브릿지', icon: '🌉', resetType: 'daily' },
  { id: 'daily_arcane_labyrinth', name: '고통의 미궁', category: 'daily_quest', type: 'boolean', minLevel: 250, region: '고통의 미궁', icon: '🕯️', resetType: 'daily' },
  { id: 'daily_arcane_limen', name: '리멘', category: 'daily_quest', type: 'boolean', minLevel: 255, region: '리멘', icon: '⚡', resetType: 'daily' },
];

export const GRANDIS_DAILY_QUESTS: TaskItem[] = [
  { id: 'daily_grandis_cernium', name: '세르니움', category: 'daily_quest', type: 'boolean', minLevel: 260, region: '세르니움', icon: '☀️', resetType: 'daily' },
  { id: 'daily_grandis_arcus', name: '호텔 아르크스', category: 'daily_quest', type: 'boolean', minLevel: 265, region: '아르크스', icon: '🏜️', resetType: 'daily' },
  { id: 'daily_grandis_odium', name: '오디움', category: 'daily_quest', type: 'boolean', minLevel: 270, region: '오디움', icon: '⚙️', resetType: 'daily' },
  { id: 'daily_grandis_dowonkyung', name: '도원경', category: 'daily_quest', type: 'boolean', minLevel: 275, region: '도원경', icon: '🌸', resetType: 'daily' },
  { id: 'daily_grandis_arteria', name: '아르테리아', category: 'daily_quest', type: 'boolean', minLevel: 280, region: '아르테리아', icon: '🚀', resetType: 'daily' },
  { id: 'daily_grandis_carcion', name: '카르시온', category: 'daily_quest', type: 'boolean', minLevel: 285, region: '카르시온', icon: '🌴', resetType: 'daily' },
  { id: 'daily_grandis_tallahart', name: '탈라하트', category: 'daily_quest', type: 'boolean', minLevel: 290, region: '탈라하트', icon: '🌌', resetType: 'daily' },
  { id: 'daily_grandis_geardrock', name: '기어드락', category: 'daily_quest', type: 'boolean', minLevel: 295, region: '기어드락', icon: '🏛️', resetType: 'daily' },
];

export const DAILY_QUESTS: TaskItem[] = [
  ...ARCANE_DAILY_QUESTS,
  ...GRANDIS_DAILY_QUESTS,
];

export const DAILY_OTHER: TaskItem[] = [
  { id: 'daily_monster_park', name: '몬스터파크', category: 'monster_park', type: 'counter', maxCount: 7, icon: '🎟️', resetType: 'daily' },
];

export const WEEKLY_QUESTS: TaskItem[] = [
  { id: 'weekly_arcane_vanishing', name: '소멸의 여로 (에르다 스펙트럼)', category: 'weekly_quest', type: 'boolean', minLevel: 200, region: '소멸의 여로', icon: '🌊', resetType: 'weekly_thu' },
  { id: 'weekly_arcane_chuchu', name: '츄츄 아일랜드 (배고픈 무토)', category: 'weekly_quest', type: 'boolean', minLevel: 210, region: '츄츄 아일랜드', icon: '🥪', resetType: 'weekly_thu' },
  { id: 'weekly_arcane_lachelein', name: '레헬른 (미드나잇 체이서)', category: 'weekly_quest', type: 'boolean', minLevel: 220, region: '레헬른', icon: '🎭', resetType: 'weekly_thu' },
  { id: 'weekly_arcane_arcana', name: '아르카나 (스피릿 세이비어)', category: 'weekly_quest', type: 'boolean', minLevel: 225, region: '아르카나', icon: '🌳', resetType: 'weekly_thu' },
  { id: 'weekly_arcane_morass', name: '모라스 (엔하임 시드)', category: 'weekly_quest', type: 'boolean', minLevel: 230, region: '모라스', icon: '🧪', resetType: 'weekly_thu' },
  { id: 'weekly_arcane_espera', name: '에스페라 (프로텍트 에스페라)', category: 'weekly_quest', type: 'boolean', minLevel: 235, region: '에스페라', icon: '✨', resetType: 'weekly_thu' },
];

export const EPIC_DUNGEONS: TaskItem[] = [
  { id: 'weekly_epic_high_mountain', name: '하이마운틴', category: 'epic_dungeon', type: 'boolean', minLevel: 260, icon: '⛰️', resetType: 'weekly_thu' },
  { id: 'weekly_epic_angler_company', name: '앵글러 컴퍼니', category: 'epic_dungeon', type: 'boolean', minLevel: 270, icon: '🤖', resetType: 'weekly_thu' },
  { id: 'weekly_epic_nightmare_fairyland', name: '악몽 선경', category: 'epic_dungeon', type: 'boolean', minLevel: 280, icon: '🦋', resetType: 'weekly_thu' },
  { id: 'weekly_epic_aurum_regis', name: '아우룸 레기스', category: 'epic_dungeon', type: 'boolean', minLevel: 290, icon: '👑', resetType: 'weekly_thu' },
];

export const WEEKLY_GUILD_AND_MISC: TaskItem[] = [
  { id: 'weekly_sharenian_culvert', name: '샤레니안의 지하 수로', category: 'weekly_content', type: 'boolean', icon: '🏛️', badge: '노블포인트', resetType: 'weekly_sun' },
  { id: 'weekly_flag_race', name: '플래그 레이스', category: 'weekly_content', type: 'boolean', icon: '🚩', badge: '노블포인트', resetType: 'weekly_sun' },
  { id: 'weekly_mulung_dojang', name: '무릉도장', category: 'weekly_content', type: 'boolean', icon: '🥋', badge: '일 23:30 정산', resetType: 'weekly_sun' },
];

// 보스 그룹화 정의 (맞춤 설정 모달에서 보스별 단일 난이도 선택 지원)
export interface BossGroupDefinition {
  baseName: string;
  icon: string;
  difficulties: Array<{
    id: string;
    difficulty: 'easy' | 'normal' | 'hard' | 'chaos' | 'extreme';
    label: string;
    mesoValue: number;
  }>;
}

export const BOSS_GROUP_DEFINITIONS: BossGroupDefinition[] = [
  {
    baseName: '자쿰',
    icon: '🗿',
    difficulties: [
      { id: 'boss_chaos_zakum', difficulty: 'chaos', label: '카오스', mesoValue: 4040000 },
    ],
  },
  {
    baseName: '매그너스',
    icon: '⚔️',
    difficulties: [
      { id: 'boss_hard_magnus', difficulty: 'hard', label: '하드', mesoValue: 4280000 },
    ],
  },
  {
    baseName: '파풀라투스',
    icon: '⏰',
    difficulties: [
      { id: 'boss_chaos_papulatus', difficulty: 'chaos', label: '카오스', mesoValue: 6550000 },
    ],
  },
  {
    baseName: '피에르',
    icon: '🤡',
    difficulties: [
      { id: 'boss_chaos_pierre', difficulty: 'chaos', label: '카오스', mesoValue: 4080000 },
    ],
  },
  {
    baseName: '반반',
    icon: '🐔',
    difficulties: [
      { id: 'boss_chaos_vonbon', difficulty: 'chaos', label: '카오스', mesoValue: 4070000 },
    ],
  },
  {
    baseName: '블러디 퀸',
    icon: '🎭',
    difficulties: [
      { id: 'boss_chaos_queen', difficulty: 'chaos', label: '카오스', mesoValue: 4070000 },
    ],
  },
  {
    baseName: '벨룸',
    icon: '🐉',
    difficulties: [
      { id: 'boss_chaos_vellum', difficulty: 'chaos', label: '카오스', mesoValue: 4640000 },
    ],
  },
  {
    baseName: '스우',
    icon: '🤖',
    difficulties: [
      { id: 'boss_normal_swoo', difficulty: 'normal', label: '노말', mesoValue: 8350000 },
      { id: 'boss_hard_swoo', difficulty: 'hard', label: '하드', mesoValue: 48900000 },
      { id: 'boss_extreme_swoo', difficulty: 'extreme', label: '익스트림', mesoValue: 545000000 },
    ],
  },
  {
    baseName: '데미안',
    icon: '🗡️',
    difficulties: [
      { id: 'boss_normal_demian', difficulty: 'normal', label: '노말', mesoValue: 8750000 },
      { id: 'boss_hard_demian', difficulty: 'hard', label: '하드', mesoValue: 46400000 },
    ],
  },
  {
    baseName: '가디언 엔젤 슬라임',
    icon: '🟢',
    difficulties: [
      { id: 'boss_normal_slime', difficulty: 'normal', label: '노말', mesoValue: 12700000 },
      { id: 'boss_chaos_slime', difficulty: 'chaos', label: '카오스', mesoValue: 71300000 },
    ],
  },
  {
    baseName: '루시드',
    icon: '🦋',
    difficulties: [
      { id: 'boss_easy_lucid', difficulty: 'easy', label: '이지', mesoValue: 14900000 },
      { id: 'boss_normal_lucid', difficulty: 'normal', label: '노말', mesoValue: 17800000 },
      { id: 'boss_hard_lucid', difficulty: 'hard', label: '하드', mesoValue: 59700000 },
    ],
  },
  {
    baseName: '윌',
    icon: '🕷️',
    difficulties: [
      { id: 'boss_easy_will', difficulty: 'easy', label: '이지', mesoValue: 16100000 },
      { id: 'boss_normal_will', difficulty: 'normal', label: '노말', mesoValue: 20500000 },
      { id: 'boss_hard_will', difficulty: 'hard', label: '하드', mesoValue: 73200000 },
    ],
  },
  {
    baseName: '더스크',
    icon: '👁️',
    difficulties: [
      { id: 'boss_normal_dusk', difficulty: 'normal', label: '노말', mesoValue: 22000000 },
      { id: 'boss_chaos_dusk', difficulty: 'chaos', label: '카오스', mesoValue: 66300000 },
    ],
  },
  {
    baseName: '진 힐라',
    icon: '💀',
    difficulties: [
      { id: 'boss_normal_jinhilla', difficulty: 'normal', label: '노말', mesoValue: 67600000 },
      { id: 'boss_hard_jinhilla', difficulty: 'hard', label: '하드', mesoValue: 100000000 },
    ],
  },
  {
    baseName: '듄켈',
    icon: '🛡️',
    difficulties: [
      { id: 'boss_normal_dunkel', difficulty: 'normal', label: '노말', mesoValue: 23700000 },
      { id: 'boss_hard_dunkel', difficulty: 'hard', label: '하드', mesoValue: 89600000 },
    ],
  },
  {
    baseName: '선택받은 세렌',
    icon: '☀️',
    difficulties: [
      { id: 'boss_normal_seren', difficulty: 'normal', label: '노말', mesoValue: 167000000 },
      { id: 'boss_hard_seren', difficulty: 'hard', label: '하드', mesoValue: 302000000 },
      { id: 'boss_extreme_seren', difficulty: 'extreme', label: '익스트림', mesoValue: 1840000000 },
    ],
  },
  {
    baseName: '감시자 칼로스',
    icon: '👁️‍🗨️',
    difficulties: [
      { id: 'boss_easy_kalos', difficulty: 'easy', label: '이지', mesoValue: 238000000 },
      { id: 'boss_normal_kalos', difficulty: 'normal', label: '노말', mesoValue: 479000000 },
      { id: 'boss_chaos_kalos', difficulty: 'chaos', label: '카오스', mesoValue: 1230000000 },
      { id: 'boss_extreme_kalos', difficulty: 'extreme', label: '익스트림', mesoValue: 4104000000 },
    ],
  },
  {
    baseName: '최초의 대적자',
    icon: '⚔️',
    difficulties: [
      { id: 'boss_easy_adversary', difficulty: 'easy', label: '이지', mesoValue: 261000000 },
      { id: 'boss_normal_adversary', difficulty: 'normal', label: '노말', mesoValue: 532000000 },
      { id: 'boss_hard_adversary', difficulty: 'hard', label: '하드', mesoValue: 1390000000 },
      { id: 'boss_extreme_adversary', difficulty: 'extreme', label: '익스트림', mesoValue: 4712000000 },
    ],
  },
  {
    baseName: '카링',
    icon: '👹',
    difficulties: [
      { id: 'boss_easy_kaling', difficulty: 'easy', label: '이지', mesoValue: 320000000 },
      { id: 'boss_normal_kaling', difficulty: 'normal', label: '노말', mesoValue: 576000000 },
      { id: 'boss_hard_kaling', difficulty: 'hard', label: '하드', mesoValue: 1560000000 },
      { id: 'boss_extreme_kaling', difficulty: 'extreme', label: '익스트림', mesoValue: 5387000000 },
    ],
  },
  {
    baseName: '찬란한 흉성',
    icon: '☄️',
    difficulties: [
      { id: 'boss_normal_radiant_star', difficulty: 'normal', label: '노말', mesoValue: 593000000 },
      { id: 'boss_hard_radiant_star', difficulty: 'hard', label: '하드', mesoValue: 2678000000 },
    ],
  },
  {
    baseName: '벨로나',
    icon: '🌙',
    difficulties: [
      { id: 'boss_easy_bellona', difficulty: 'easy', label: '이지', mesoValue: 396000000 },
      { id: 'boss_normal_bellona', difficulty: 'normal', label: '노말', mesoValue: 824000000 },
      { id: 'boss_hard_bellona', difficulty: 'hard', label: '하드', mesoValue: 2950000000 },
    ],
  },
  {
    baseName: '림보',
    icon: '🪐',
    difficulties: [
      { id: 'boss_normal_limbo', difficulty: 'normal', label: '노말', mesoValue: 995000000 },
      { id: 'boss_hard_limbo', difficulty: 'hard', label: '하드', mesoValue: 2385000000 },
    ],
  },
  {
    baseName: '발드릭스',
    icon: '🦇',
    difficulties: [
      { id: 'boss_normal_valdrix', difficulty: 'normal', label: '노말', mesoValue: 1320000000 },
      { id: 'boss_hard_valdrix', difficulty: 'hard', label: '하드', mesoValue: 3078000000 },
    ],
  },
  {
    baseName: '유피테르',
    icon: '⚡',
    difficulties: [
      { id: 'boss_normal_jupiter', difficulty: 'normal', label: '노말', mesoValue: 1560000000 },
      { id: 'boss_hard_jupiter', difficulty: 'hard', label: '하드', mesoValue: 4845000000 },
    ],
  },
];

// 일일 보스 그룹화 정의 (맞춤 설정 모달에서 일일 보스별 단일 난이도 선택 지원)
export const DAILY_BOSS_GROUP_DEFINITIONS: BossGroupDefinition[] = [
  {
    baseName: '자쿰',
    icon: '🗿',
    difficulties: [
      { id: 'daily_boss_easy_zakum', difficulty: 'easy', label: '이지', mesoValue: 114000 },
      { id: 'daily_boss_normal_zakum', difficulty: 'normal', label: '노말', mesoValue: 349000 },
    ],
  },
  {
    baseName: '매그너스',
    icon: '⚔️',
    difficulties: [
      { id: 'daily_boss_easy_magnus', difficulty: 'easy', label: '이지', mesoValue: 411000 },
      { id: 'daily_boss_normal_magnus', difficulty: 'normal', label: '노말', mesoValue: 1160000 },
    ],
  },
  {
    baseName: '힐라',
    icon: '💀',
    difficulties: [
      { id: 'daily_boss_normal_hilla', difficulty: 'normal', label: '노말', mesoValue: 455000 },
      { id: 'daily_boss_hard_hilla', difficulty: 'hard', label: '하드', mesoValue: 1280000 },
    ],
  },
  {
    baseName: '카웅',
    icon: '🛸',
    difficulties: [
      { id: 'daily_boss_normal_kawoong', difficulty: 'normal', label: '노말', mesoValue: 712000 },
    ],
  },
  {
    baseName: '파풀라투스',
    icon: '⏰',
    difficulties: [
      { id: 'daily_boss_easy_papulatus', difficulty: 'easy', label: '이지', mesoValue: 390000 },
      { id: 'daily_boss_normal_papulatus', difficulty: 'normal', label: '노말', mesoValue: 1200000 },
    ],
  },
  {
    baseName: '피에르',
    icon: '🤡',
    difficulties: [
      { id: 'daily_boss_normal_pierre', difficulty: 'normal', label: '노말', mesoValue: 551000 },
    ],
  },
  {
    baseName: '반반',
    icon: '🐔',
    difficulties: [
      { id: 'daily_boss_normal_vonbon', difficulty: 'normal', label: '노말', mesoValue: 551000 },
    ],
  },
  {
    baseName: '블러디 퀸',
    icon: '🎭',
    difficulties: [
      { id: 'daily_boss_normal_queen', difficulty: 'normal', label: '노말', mesoValue: 551000 },
    ],
  },
  {
    baseName: '벨룸',
    icon: '🐉',
    difficulties: [
      { id: 'daily_boss_normal_vellum', difficulty: 'normal', label: '노말', mesoValue: 551000 },
    ],
  },
  {
    baseName: '반 레온',
    icon: '🦁',
    difficulties: [
      { id: 'daily_boss_easy_vanleon', difficulty: 'easy', label: '이지', mesoValue: 602000 },
      { id: 'daily_boss_normal_vanleon', difficulty: 'normal', label: '노말', mesoValue: 830000 },
      { id: 'daily_boss_hard_vanleon', difficulty: 'hard', label: '하드', mesoValue: 1070000 },
    ],
  },
  {
    baseName: '혼테일',
    icon: '🐲',
    difficulties: [
      { id: 'daily_boss_easy_horntail', difficulty: 'easy', label: '이지', mesoValue: 502000 },
      { id: 'daily_boss_normal_horntail', difficulty: 'normal', label: '노말', mesoValue: 576000 },
      { id: 'daily_boss_chaos_horntail', difficulty: 'chaos', label: '카오스', mesoValue: 770000 },
    ],
  },
  {
    baseName: '아카이럼',
    icon: '🐍',
    difficulties: [
      { id: 'daily_boss_easy_arkarium', difficulty: 'easy', label: '이지', mesoValue: 656000 },
      { id: 'daily_boss_normal_arkarium', difficulty: 'normal', label: '노말', mesoValue: 1110000 },
    ],
  },
  {
    baseName: '핑크빈',
    icon: '🐷',
    difficulties: [
      { id: 'daily_boss_normal_pinkbean', difficulty: 'normal', label: '노말', mesoValue: 799000 },
      { id: 'daily_boss_chaos_pinkbean', difficulty: 'chaos', label: '카오스', mesoValue: 1320000 },
    ],
  },
  {
    baseName: '시그너스',
    icon: '👸',
    difficulties: [
      { id: 'daily_boss_normal_cygnus', difficulty: 'normal', label: '노말', mesoValue: 1360000 },
    ],
  },
];

// 개별 DAILY_BOSSES 배열 생성
export const DAILY_BOSSES: TaskItem[] = DAILY_BOSS_GROUP_DEFINITIONS.flatMap((group) =>
  group.difficulties.map((diff) => ({
    id: diff.id,
    name: group.baseName,
    category: 'daily_boss' as const,
    type: 'boolean' as const,
    difficulty: diff.difficulty,
    mesoValue: diff.mesoValue,
    icon: group.icon,
    resetType: 'daily' as const,
  }))
);

// 개별 WEEKLY_BOSSES 배열 생성
export const WEEKLY_BOSSES: TaskItem[] = BOSS_GROUP_DEFINITIONS.flatMap((group) =>
  group.difficulties.map((diff) => ({
    id: diff.id,
    name: group.baseName,
    category: 'weekly_boss' as const,
    type: 'boolean' as const,
    difficulty: diff.difficulty,
    mesoValue: diff.mesoValue,
    icon: group.icon,
    resetType: 'weekly_thu' as const,
  }))
);

// 월간 보스 - 검은 마법사 정의 (하드: 4.65억, 익스트림: 56.8억)
export const BLACK_MAGE_BOSS = {
  baseName: '검은 마법사',
  icon: '⚫',
  difficulties: [
    { id: 'boss_hard_black_mage', difficulty: 'hard' as const, label: '하드', mesoValue: 465000000 },
    { id: 'boss_extreme_black_mage', difficulty: 'extreme' as const, label: '익스트림', mesoValue: 5680000000 },
  ],
};

export const BLACK_MAGE_TASKS: TaskItem[] = BLACK_MAGE_BOSS.difficulties.map((diff) => ({
  id: diff.id,
  name: `검은 마법사 (${diff.label})`,
  category: 'black_mage' as const,
  type: 'boolean' as const,
  difficulty: diff.difficulty,
  mesoValue: diff.mesoValue,
  icon: BLACK_MAGE_BOSS.icon,
  resetType: 'monthly' as const,
}));

export const ALL_TASKS_MAP = new Map<string, TaskItem>([
  ...DAILY_QUESTS.map((t) => [t.id, t] as [string, TaskItem]),
  ...DAILY_OTHER.map((t) => [t.id, t] as [string, TaskItem]),
  ...DAILY_BOSSES.map((t) => [t.id, t] as [string, TaskItem]),
  ...WEEKLY_QUESTS.map((t) => [t.id, t] as [string, TaskItem]),
  ...EPIC_DUNGEONS.map((t) => [t.id, t] as [string, TaskItem]),
  ...WEEKLY_GUILD_AND_MISC.map((t) => [t.id, t] as [string, TaskItem]),
  ...WEEKLY_BOSSES.map((t) => [t.id, t] as [string, TaskItem]),
  ...BLACK_MAGE_TASKS.map((t) => [t.id, t] as [string, TaskItem]),
]);

// 캐릭터 레벨에 맞는 추천 기본 활성 태스크 ID 목록 (몬스터파크, 에픽던전은 계정 공통 관리로 제외)
export function getDefaultEnabledTasksForLevel(level: number): string[] {
  const result: string[] = [];

  // 일일 퀘스트
  DAILY_QUESTS.forEach((q) => {
    if (!q.minLevel || level >= q.minLevel) {
      result.push(q.id);
    }
  });

  // 주간 퀘스트
  WEEKLY_QUESTS.forEach((q) => {
    if (!q.minLevel || level >= q.minLevel) {
      result.push(q.id);
    }
  });

  // 무릉 / 수로 / 플래그
  result.push('weekly_mulung_dojang', 'weekly_sharenian_culvert', 'weekly_flag_race');

  return result;
}

// 레벨에 맞는 추천 기본 주간 보스 (최대 12개)
export function getDefaultBossesForLevel(level: number): string[] {
  if (level < 200) {
    return ['boss_chaos_zakum', 'boss_hard_magnus'];
  }
  if (level < 220) {
    return [
      'boss_chaos_zakum',
      'boss_chaos_queen',
      'boss_chaos_pierre',
      'boss_chaos_vonbon',
      'boss_hard_magnus',
      'boss_chaos_vellum',
      'boss_chaos_papulatus',
    ];
  }
  if (level < 260) {
    return [
      'boss_chaos_queen',
      'boss_chaos_pierre',
      'boss_chaos_vonbon',
      'boss_chaos_vellum',
      'boss_chaos_papulatus',
      'boss_normal_swoo',
      'boss_normal_demian',
      'boss_normal_slime',
      'boss_easy_lucid',
      'boss_easy_will',
    ];
  }
  // 260+ 엔드유저 기본 프리셋 (최대 12개)
  return [
    'boss_hard_swoo',
    'boss_hard_demian',
    'boss_hard_lucid',
    'boss_hard_will',
    'boss_chaos_slime',
    'boss_chaos_dusk',
    'boss_hard_dunkel',
    'boss_hard_jinhilla',
    'boss_normal_seren',
    'boss_easy_kalos',
    'boss_easy_kaling',
    'boss_normal_limbo',
  ].slice(0, 12);
}

// 레벨에 맞는 추천 기본 일일 보스
export function getDefaultDailyBossesForLevel(level: number): string[] {
  if (level < 100) return ['daily_boss_normal_zakum'];
  if (level < 140) return ['daily_boss_normal_zakum', 'daily_boss_normal_hilla'];
  return [
    'daily_boss_normal_zakum',
    'daily_boss_normal_magnus',
    'daily_boss_hard_hilla',
    'daily_boss_normal_kawoong',
    'daily_boss_normal_papulatus',
    'daily_boss_normal_pierre',
    'daily_boss_normal_vonbon',
    'daily_boss_normal_queen',
    'daily_boss_normal_vellum',
    'daily_boss_hard_vanleon',
    'daily_boss_chaos_horntail',
    'daily_boss_normal_arkarium',
    'daily_boss_chaos_pinkbean',
    'daily_boss_normal_cygnus',
  ];
}
