import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng, SHELTER_PROTOCOL_STEPS } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

export const ShelterMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const stepCount = SHELTER_PROTOCOL_STEPS.length;
  const shuffledSteps = useMemo(() => {
    const rng = createPrng(seed + 19);
    const arr = [...SHELTER_PROTOCOL_STEPS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [seed]);

  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [errorFlash, setErrorFlash] = useState(false);

  const nextExpected = SHELTER_PROTOCOL_STEPS[completedIds.length];

  const handlePress = (stepId: string) => {
    if (paused || completedIds.includes(stepId)) return;
    if (nextExpected && stepId === nextExpected.id) {
      soundEngine.playActionSuccess();
      const next = [...completedIds, stepId];
      setCompletedIds(next);
      setErrorFlash(false);
      if (next.length === stepCount) {
        onWin(Math.min(100, Math.round(70 + timeLeft * 1.1)));
      }
    } else {
      soundEngine.playAlert();
      setErrorFlash(true);
      onPenaltySeconds(3);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#0c162d] border border-amber-500/40 rounded-xl p-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
          <ShieldCheck className="w-4 h-4" />
          Protocolo de Emergencia
        </span>
        <span className="text-xs font-black text-cyan-300 tabular-nums">
          {completedIds.length}/{stepCount}
        </span>
      </div>

      {errorFlash && (
        <div className="bg-red-950/60 border border-red-400/60 rounded-xl px-3 py-2 text-xs font-bold text-red-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{t(lang, 'mg.she.wrongOrder')}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {shuffledSteps.map((step) => {
          const done = completedIds.includes(step.id);
          // Strip "1. " prefix so kids actually reason about the logical safety sequence!
          const rawText = t(lang, step.labelKey).replace(/^\d+\.\s*/, '');
          return (
            <button
              key={step.id}
              type="button"
              disabled={done}
              onClick={() => handlePress(step.id)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition-colors ${
                done
                  ? 'bg-emerald-950/50 border-emerald-400/60 text-emerald-200 cursor-default'
                  : 'bg-[#0c162d] hover:bg-slate-800 border-slate-700 hover:border-amber-400 text-white cursor-pointer'
              }`}
            >
              <span>{rawText}</span>
              {done && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
