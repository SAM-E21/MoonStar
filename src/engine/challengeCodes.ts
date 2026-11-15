import type {
  ChallengeScoreEntry,
  CrewSize,
  Difficulty,
  LandingSiteId,
  MissionConfig,
  MissionDuration,
} from '../types/game';

const SITE_CODE: Record<LandingSiteId, string> = {
  shackleton: 'SHK',
  cabeus: 'CAB',
  tranquility: 'TRQ',
  aristarchus: 'ARI',
};

const CODE_SITE: Record<string, LandingSiteId> = {
  SHK: 'shackleton',
  CAB: 'cabeus',
  TRQ: 'tranquility',
  ARI: 'aristarchus',
};

const DIFF_CODE: Record<Difficulty, string> = {
  explorer: 'E',
  engineer: 'I',
  commander: 'C',
  veteran: 'V',
};

const CODE_DIFF: Record<string, Difficulty> = {
  E: 'explorer',
  I: 'engineer',
  C: 'commander',
  V: 'veteran',
};

export function generateRandomChallengeSeed(): number {
  return Math.floor(Math.random() * 900) + 100;
}

export function encodeChallengeCode(config: MissionConfig): string {
  const site = SITE_CODE[config.landingSite] ?? 'SHK';
  const diff = DIFF_CODE[config.difficulty] ?? 'I';
  const rawSeed = Math.abs(Math.round(config.seed ?? 419));
  // Preserve 3-digit seeds (100..999) idempotently so decode -> encode returns the exact same code.
  const seed = rawSeed >= 100 && rawSeed <= 999 ? rawSeed : (rawSeed % 900) + 100;
  return `MRX-${site}-${config.crewSize}${diff}${config.duration}-${seed}`;
}

export function decodeChallengeCode(raw: string): Partial<MissionConfig> | null {
  const clean = raw.trim().toUpperCase();
  const parts = clean.split('-');
  if (parts.length !== 4 || parts[0] !== 'MRX') return null;

  const site = CODE_SITE[parts[1]];
  if (!site) return null;

  const meta = parts[2];
  if (meta.length !== 3) return null;
  const crewNum = Number(meta[0]);
  const diff = CODE_DIFF[meta[1]];
  const durNum = Number(meta[2]);
  const seed = Number(parts[3]);

  if (
    (crewNum !== 2 && crewNum !== 4) ||
    !diff ||
    (durNum !== 5 && durNum !== 7) ||
    !Number.isFinite(seed) ||
    seed < 100 ||
    seed > 999
  ) {
    return null;
  }

  return {
    landingSite: site,
    crewSize: crewNum as CrewSize,
    difficulty: diff,
    duration: durNum as MissionDuration,
    seed,
    challengeCode: clean,
  };
}

const CHALLENGE_SCORES_KEY = 'moonstar_challenge_scores_v1';

export function getChallengeScores(filterCode?: string): ChallengeScoreEntry[] {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(CHALLENGE_SCORES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ChallengeScoreEntry[];
    const valid = Array.isArray(list) ? list : [];
    const needle = filterCode?.trim().toUpperCase();
    const filtered = needle
      ? valid.filter((entry) => entry.code.toUpperCase().includes(needle))
      : valid;
    return [...filtered].sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export function saveChallengeScore(entry: Omit<ChallengeScoreEntry, 'id' | 'date'>): ChallengeScoreEntry[] {
  try {
    const existing = getChallengeScores();
    const normalizedCode = entry.code.trim().toUpperCase();
    const next: ChallengeScoreEntry[] = [
      {
        ...entry,
        code: normalizedCode,
        id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString().slice(0, 10),
      },
      ...existing,
    ].slice(0, 40);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CHALLENGE_SCORES_KEY, JSON.stringify(next));
    }
    return [...next].sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

export function deleteChallengeScore(id: string): ChallengeScoreEntry[] {
  try {
    const existing = getChallengeScores();
    const next = existing.filter((entry) => entry.id !== id);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CHALLENGE_SCORES_KEY, JSON.stringify(next));
    }
    return next;
  } catch {
    return [];
  }
}
