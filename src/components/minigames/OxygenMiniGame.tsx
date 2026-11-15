import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Wind, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

export const OxygenMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onWin,
}) => {
  const initial = useMemo(() => {
    const rng = createPrng(seed + 31);
    return {
      electrolysis: Math.round(30 + rng() * 40),
      scrubber: Math.round(30 + rng() * 40),
      o2: Math.round(38 + rng() * 40),
      co2: Math.round(24 + rng() * 30),
      phase: rng() * Math.PI * 2,
    };
  }, [seed]);

  const [electrolysis, setElectrolysis] = useState(initial.electrolysis);
  const [scrubber, setScrubber] = useState(initial.scrubber);
  const [o2, setO2] = useState(initial.o2);
  const [co2, setCo2] = useState(initial.co2);
  const [stabilityPct, setStabilityPct] = useState(0);

  const o2Safe = o2 >= 50 && o2 <= 82;
  const co2Safe = co2 <= 38;
  const bothSafe = o2Safe && co2Safe;

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      const surge = difficulty === 'hard' ? 1.55 : difficulty === 'normal' ? 1.15 : 0.85;
      const pulse = Math.sin(Date.now() / 1600 + initial.phase);

      setO2((prev) => {
        const delta = (electrolysis - 52) * 0.16 - (2.0 + pulse * 1.4) * surge;
        return Math.max(10, Math.min(99, prev + delta));
      });
      setCo2((prev) => {
        const delta = (3.4 + pulse * 1.2) * surge - (scrubber - 30) * 0.14;
        return Math.max(5, Math.min(95, prev + delta));
      });

      setStabilityPct((prev) => {
        const gain = bothSafe ? 9 : o2Safe || co2Safe ? 1 : -4;
        const next = Math.max(0, Math.min(100, prev + gain));
        if (next >= 100) {
          soundEngine.playActionSuccess();
          onWin(Math.min(100, Math.round(70 + timeLeft * 1.1)));
        }
        return next;
      });
    }, 350);

    return () => window.clearInterval(timer);
  }, [paused, difficulty, initial.phase, electrolysis, scrubber, bothSafe, o2Safe, co2Safe, timeLeft, onWin]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-xl border p-3 ${
            o2Safe ? 'bg-emerald-950/40 border-emerald-400/60' : 'bg-amber-950/45 border-amber-500/60'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-300">{t(lang, 'mg.oxy.o2Level')}</div>
          <div className="text-2xl font-black text-white tabular-nums mt-0.5">{Math.round(o2)}%</div>
          <div className="text-[10px] font-bold text-cyan-300">50% – 82% SAFE</div>
          <div className="h-2.5 bg-slate-900 rounded-full mt-2 overflow-hidden relative">
            <div className="absolute inset-y-0 left-[50%] w-[32%] bg-emerald-500/30" />
            <div className="h-full bg-cyan-400 transition-all duration-150" style={{ width: `${o2}%` }} />
          </div>
        </div>

        <div
          className={`rounded-xl border p-3 ${
            co2Safe ? 'bg-emerald-950/40 border-emerald-400/60' : 'bg-red-950/45 border-red-500/60'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-300">{t(lang, 'mg.oxy.co2Level')}</div>
          <div className="text-2xl font-black text-white tabular-nums mt-0.5">{Math.round(co2)}%</div>
          <div className="text-[10px] font-bold text-emerald-300">&lt;= 38% SAFE</div>
          <div className="h-2.5 bg-slate-900 rounded-full mt-2 overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-[38%] bg-emerald-500/30" />
            <div className="h-full bg-amber-400 transition-all duration-150" style={{ width: `${co2}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-300" />
              {t(lang, 'mg.oxy.electro')}
            </span>
            <span className="text-cyan-300 tabular-nums">{electrolysis}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={electrolysis}
            onChange={(e) => setElectrolysis(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
            <span className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-300" />
              {t(lang, 'mg.oxy.scrubber')}
            </span>
            <span className="text-emerald-300 tabular-nums">{scrubber}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={scrubber}
            onChange={(e) => setScrubber(Number(e.target.value))}
            className="w-full accent-emerald-400 cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Activity className="w-4 h-4 text-emerald-300" />
            {t(lang, 'mg.oxy.stability')}
          </span>
          <span className="text-emerald-300 tabular-nums">{Math.round(stabilityPct)}%</span>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
          <div className="h-full bg-emerald-400 transition-all duration-150" style={{ width: `${stabilityPct}%` }} />
        </div>
      </div>
    </div>
  );
};
