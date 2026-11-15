import React, { useEffect, useMemo, useState } from 'react';
import { Radio, Waves } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

export const CommsMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onWin,
}) => {
  const initial = useMemo(() => {
    const rng = createPrng(seed + 41);
    return {
      freq: Math.round(20 + rng() * 65),
      tilt: Math.round(12 + rng() * 62),
      targetFreq: Math.round(32 + rng() * 48),
      targetTilt: Math.round(22 + rng() * 48),
      phaseFreq: rng() * Math.PI * 2,
      phaseTilt: rng() * Math.PI * 2,
    };
  }, [seed]);

  const [freq, setFreq] = useState(initial.freq);
  const [tilt, setTilt] = useState(initial.tilt);
  const [targetFreq, setTargetFreq] = useState(initial.targetFreq);
  const [targetTilt, setTargetTilt] = useState(initial.targetTilt);
  const [lockProgress, setLockProgress] = useState(0);

  const tol = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 11 : 14;
  const freqOk = Math.abs(freq - targetFreq) <= tol;
  const tiltOk = Math.abs(tilt - targetTilt) <= tol;
  const locked = freqOk && tiltOk;

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      const speed = difficulty === 'hard' ? 1.35 : difficulty === 'normal' ? 0.95 : 0.6;
      const now = Date.now() / 1000;
      setTargetFreq(Math.round(55 + Math.sin(now * 0.6 * speed + initial.phaseFreq) * 26));
      setTargetTilt(Math.round(45 + Math.cos(now * 0.5 * speed + initial.phaseTilt) * 25));

      setLockProgress((prev) => {
        const gain = locked ? 14 : freqOk || tiltOk ? 2 : -4;
        const next = Math.max(0, Math.min(100, prev + gain));
        if (next >= 100) {
          soundEngine.playActionSuccess();
          onWin(Math.min(100, Math.round(70 + timeLeft * 1.1)));
        }
        return next;
      });
    }, 350);

    return () => window.clearInterval(interval);
  }, [paused, difficulty, initial.phaseFreq, initial.phaseTilt, locked, freqOk, tiltOk, timeLeft, onWin]);

  return (
    <div className="space-y-4 bg-[#0c162d] p-4 rounded-xl border border-slate-800">
      {/* Live Waveform Signal Indicator */}
      <div className="bg-[#070f22] border border-slate-700 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Waves className={`w-5 h-5 ${locked ? 'text-emerald-400 animate-pulse' : 'text-violet-400'}`} />
          <span className={locked ? 'text-emerald-300' : 'text-slate-300'}>
            {locked ? t(lang, 'mg.comms_tune.lock') : t(lang, 'mg.comms_tune.adjust')}
          </span>
        </div>
        <span className="text-xs font-black text-cyan-300 tabular-nums">{Math.round(lockProgress)}%</span>
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-200 mb-1">
          <span>{t(lang, 'mg.comms_tune.freq')}</span>
          <span className={`font-bold tabular-nums ${freqOk ? 'text-emerald-300' : 'text-cyan-300'}`}>
            {freq} MHz ({t(lang, 'mg.comms_tune.target')}: ~{targetFreq})
          </span>
        </div>
        <input
          type="range"
          min={15}
          max={95}
          value={freq}
          onChange={(e) => setFreq(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs text-slate-200 mb-1">
          <span>{t(lang, 'mg.comms_tune.angle')}</span>
          <span className={`font-bold tabular-nums ${tiltOk ? 'text-emerald-300' : 'text-violet-300'}`}>
            {tilt}° ({t(lang, 'mg.comms_tune.target')}: ~{targetTilt}°)
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={85}
          value={tilt}
          onChange={(e) => setTilt(Number(e.target.value))}
          className="w-full accent-violet-400 cursor-pointer"
        />
      </div>

      <div>
        <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-300" />
            {t(lang, 'mg.comms_tune.lockProgress')}
          </span>
          <span className="tabular-nums text-emerald-300">{Math.round(lockProgress)}%</span>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
          <div className="h-full bg-emerald-400 transition-all duration-150" style={{ width: `${lockProgress}%` }} />
        </div>
      </div>
    </div>
  );
};
