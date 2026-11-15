import React, { useEffect, useMemo, useState } from 'react';
import { Droplet, Sprout, Sun, Thermometer } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

export const GreenhouseMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onWin,
}) => {
  const scenario = useMemo(() => {
    const rng = createPrng(seed + 23);
    const targetLight = Math.round(45 + rng() * 32);
    const targetTemp = Math.round(42 + rng() * 34);
    const targetWater = Math.round(42 + rng() * 34);
    const startLight = Math.max(15, Math.min(85, targetLight + (rng() > 0.5 ? -24 : 24)));
    const startTemp = Math.max(15, Math.min(85, targetTemp + (rng() > 0.5 ? -22 : 22)));
    const startWater = Math.max(15, Math.min(85, targetWater + (rng() > 0.5 ? -22 : 22)));
    const phaseShift = Math.floor(rng() * 4);
    return { targetLight, targetTemp, targetWater, startLight, startTemp, startWater, phaseShift };
  }, [seed]);

  const [light, setLight] = useState(scenario.startLight);
  const [temp, setTemp] = useState(scenario.startTemp);
  const [water, setWater] = useState(scenario.startWater);
  const [growth, setGrowth] = useState(0);
  const [coldCycle, setColdCycle] = useState(scenario.phaseShift % 2 === 1);

  const halfBand = difficulty === 'hard' ? 13 : difficulty === 'normal' ? 16 : 20;
  const lightInBand = Math.abs(light - scenario.targetLight) <= halfBand;
  const tempInBand = Math.abs(temp - scenario.targetTemp) <= halfBand;
  const waterInBand = Math.abs(water - scenario.targetWater) <= halfBand;
  const allGood = lightInBand && tempInBand && waterInBand;

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(() => {
      const sec = Math.floor(Date.now() / 3500) + scenario.phaseShift;
      const isCold = sec % 2 === 1;
      setColdCycle(isCold);

      const driftMult = difficulty === 'hard' ? 1.4 : difficulty === 'normal' ? 1.0 : 0.7;
      setTemp((p) => Math.max(0, Math.min(100, p + (isCold ? -3.2 : 2.1) * driftMult)));
      setWater((p) => Math.max(0, Math.min(100, p - 2.2 * driftMult)));
      setLight((p) => Math.max(0, Math.min(100, p + (isCold ? -1.4 : 1.5) * driftMult)));

      setGrowth((g) => {
        const rate = allGood ? 7.5 : (lightInBand ? 2 : 0) + (tempInBand ? 2 : 0) + (waterInBand ? 2 : 0) - 2.5;
        const next = Math.max(0, Math.min(100, g + rate));
        if (next >= 100) {
          soundEngine.playActionSuccess();
          onWin(Math.min(100, Math.round(70 + timeLeft * 1.1)));
        }
        return next;
      });
    }, 450);

    return () => window.clearInterval(interval);
  }, [paused, difficulty, scenario.phaseShift, allGood, lightInBand, tempInBand, waterInBand, timeLeft, onWin]);

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border px-3 py-2 text-xs font-bold flex items-center justify-between ${
          coldCycle
            ? 'bg-sky-950/50 border-sky-500/45 text-sky-200'
            : 'bg-amber-950/45 border-amber-500/45 text-amber-200'
        }`}
      >
        <span>{t(lang, coldCycle ? 'mg.green.cycleCold' : 'mg.green.cycleWarm')}</span>
        <span className="tabular-nums text-emerald-300 font-black">
          {Math.round(growth)}% {t(lang, 'mg.green.growth')}
        </span>
      </div>

      {/* Harvest progress bar */}
      <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
        <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${growth}%` }} />
      </div>

      {/* 3 Environmental Sliders with Randomized Green Target Zones */}
      <div className="space-y-3 bg-[#0c162d] border border-slate-800 rounded-xl p-3.5">
        {[
          {
            key: 'light',
            label: t(lang, 'mg.green.light'),
            val: light,
            setter: setLight,
            target: scenario.targetLight,
            ok: lightInBand,
            icon: <Sun className="w-4 h-4 text-fuchsia-300" />,
            unit: '%',
          },
          {
            key: 'temp',
            label: t(lang, 'mg.green.temp'),
            val: temp,
            setter: setTemp,
            target: scenario.targetTemp,
            ok: tempInBand,
            icon: <Thermometer className="w-4 h-4 text-amber-300" />,
            unit: '°',
          },
          {
            key: 'water',
            label: t(lang, 'mg.green.water'),
            val: water,
            setter: setWater,
            target: scenario.targetWater,
            ok: waterInBand,
            icon: <Droplet className="w-4 h-4 text-cyan-300" />,
            unit: '%',
          },
        ].map((ctrl) => (
          <div key={ctrl.key}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                {ctrl.icon}
                {ctrl.label}
              </span>
              <span className={`font-extrabold tabular-nums ${ctrl.ok ? 'text-emerald-300' : 'text-amber-300'}`}>
                {Math.round(ctrl.val)}{ctrl.unit} ({ctrl.target - halfBand}–{ctrl.target + halfBand})
              </span>
            </div>
            <div className="relative h-6 flex items-center">
              <div
                className="absolute h-2 rounded bg-emerald-500/30 border border-emerald-400/50 pointer-events-none"
                style={{ left: `${ctrl.target - halfBand}%`, width: `${halfBand * 2}%` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(ctrl.val)}
                onChange={(e) => ctrl.setter(Number(e.target.value))}
                className="relative w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-300">
        <Sprout className={`w-5 h-5 ${allGood ? 'animate-bounce' : 'opacity-50'}`} />
        <span>{allGood ? 'OPTIMAL GROWTH' : 'ADJUST SLIDERS INTO GREEN ZONES'}</span>
      </div>
    </div>
  );
};
