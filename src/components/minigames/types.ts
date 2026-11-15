import type { Language, MiniGameDifficulty } from '../../types/game';

export interface MiniGameComponentProps {
  lang: Language;
  difficulty: MiniGameDifficulty;
  paused: boolean;
  timeLeft: number;
  seed: number;
  onPenaltySeconds: (sec: number) => void;
  onWin: (scorePct: number) => void;
  onFail: () => void;
}
