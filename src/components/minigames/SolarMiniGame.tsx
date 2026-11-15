import React, { useEffect, useMemo, useState } from 'react';
import { CloudFog, Sparkles, Sun, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { computeSolarCapture, createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import type { MiniGameComponentProps } from './types';

export const SolarMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onWin,
}) => {
  const initial = useMemo(() => {
    const rng = createPrng(seed + 11);
    const sunStart = Math.round((rng() - 0.5) * 90);
    const panelStart = Math.round((rng() - 0.5) * 70);
    const shadowStart = Math.round((rng() - 0.5) * 80);
    const dustStart = Math.round(45 + rng() * 35);
    const phaseSun = rng() * Math.PI * 2;
    const phaseShadow = rng() * Math.PI * 2;
    return { sunStart, panelStart, shadowStart, dustStart, phaseSun, phaseShadow };
  }, [seed]);

  const targetWh = difficulty === 'easy' ? 180 : difficulty === 'normal' ? 240 : 300;
  const [panelAngle, setPanelAngle] = useState(initial.panelStart);
  const [sunAngle, setSunAngle] = useState(initial.sunStart);
  const [shadowCenter, setShadowCenter] = useState(initial.shadowStart);
  const [dustCleanPct, setDustCleanPct] = useState(initial.dustStart);
  const [harvestedWh, setHarvestedWh] = useState(0);

  const shadowHalfWidth = difficulty === 'hard' ? 15 : 12;
  const capture = computeSolarCapture(panelAngle, sunAngle, shadowCenter, shadowHalfWidth, dustCleanPct);

  useEffect(() => {
    if (paused) return;
    const tick = window.setInterval(() => {
      const speedMult = difficulty === 'hard' ? 1.45 : difficulty === 'normal' ? 1.1 : 0.85;
      const tSec = Date.now() / 1000;
      setSunAngle(Math.round(Math.sin(tSec * 0.65 * speedMult + initial.phaseSun) * 58));
      setShadowCenter(Math.round(Math.cos(tSec * 0.45 * speedMult + initial.phaseShadow) * 48));
      setDustCleanPct((prev) => Math.max(25, prev - (difficulty === 'hard' ? 2.5 : 1.5)));
    }, 350);
    return () => window.clearInterval(tick);
  }, [paused, difficulty, initial.phaseSun, initial.phaseShadow]);

  useEffect(() => {
    if (paused) return;
    const harvestTimer = window.setInterval(() => {
      setHarvestedWh((prev) => {
        const next = Math.min(targetWh, prev + capture.wattsPerSec * 0.35);
        if (next >= targetWh) {
          soundEngine.playActionSuccess();
          onWin(Math.min(100, Math.round(70 + timeLeft * 1.2)));
        }
        return next;
      });
    }, 350);
    return () => window.clearInterval(harvestTimer);
  }, [paused, capture.wattsPerSec, targetWh, timeLeft, onWin]);

  const brushDust = () => {
    if (paused) return;
    soundEngine.playClick();
    setDustCleanPct((prev) => Math.min(100, prev + 28));
  };

  // Convert angle (-70..70) to SVG arc coordinates
  const toPoint = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: 160 + r * Math.cos(rad), y: 112 + r * Math.sin(rad) };
  };
  const sunPt = toPoint(sunAngle, 86);
  const shadowPt = toPoint(shadowCenter, 86);

  return (
    <div className="space-y-3">
      {/* Live Sun & Crater Shadow Alignment Stage */}
      <div className="bg-[#070f22] border border-slate-700 rounded-xl p-3">
        <svg viewBox="0 0 320 135" className="w-full h-36 select-none" aria-label={t(lang, 'mg.solar_align.title')}>
          <defs>
            <linearGradient id="skyArcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#081022" />
            </linearGradient>
          </defs>
          <rect width="320" height="135" rx="10" fill="url(#skyArcGrad)" />
          {/* Polar Horizon Ground */}
          <path d="M 10 112 Q 160 104 310 112 L 310 135 L 10 135 Z" fill="#1e293b" />
          {/* Sky arc guide */}
          <path d="M 65 112 A 95 95 0 0 1 255 112" fill="none" stroke="#334155" strokeDasharray="4 4" strokeWidth="1.5" />

          {/* Crater Shadow Cone */}
          <line
            x1="160"
            y1="112"
            x2={shadowPt.x}
            y2={shadowPt.y}
            stroke="rgba(15, 23, 42, 0.9)"
            strokeWidth="22"
            strokeLinecap="round"
          />
          <circle cx={shadowPt.x} cy={shadowPt.y} r="13" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <text x={shadowPt.x} y={shadowPt.y + 3} textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">
            SHADE
          </text>

          {/* Active Sun Ray */}
          <line
            x1={sunPt.x}
            y1={sunPt.y}
            x2="160"
            y2="112"
            stroke={capture.inShadow ? '#64748b' : '#fde047'}
            strokeWidth={capture.inShadow ? '1.5' : '3'}
            strokeDasharray={capture.inShadow ? '3 3' : undefined}
          />
          <circle cx={sunPt.x} cy={sunPt.y} r="12" fill="#facc15" />
          <circle cx={sunPt.x} cy={sunPt.y} r="17" fill="#facc15" opacity="0.22" />

          {/* Tilting Solar Array */}
          <g transform={`translate(160, 108) rotate(${panelAngle})`}>
            <rect x="-44" y="-8" width="88" height="10" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="-22" y1="-8" x2="-22" y2="2" stroke="#bae6fd" strokeWidth="1" opacity="0.5" />
            <line x1="0" y1="-8" x2="0" y2="2" stroke="#bae6fd" strokeWidth="1" opacity="0.5" />
            <line x1="22" y1="-8" x2="22" y2="2" stroke="#bae6fd" strokeWidth="1" opacity="0.5" />
            {dustCleanPct < 80 && (
              <rect
                x="-44"
                y="-8"
                width="88"
                height="10"
                rx="3"
                fill="#d97706"
                opacity={(100 - dustCleanPct) / 140}
              />
            )}
          </g>
          <rect x="157" y="108" width="6" height="16" fill="#94a3b8" />
        </svg>

        <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
          <div className="bg-[#0c162d] rounded-lg p-1.5 border border-slate-800">
            <div className="text-slate-400">{t(lang, 'mg.solar_align.sun')}</div>
            <div className="font-extrabold text-amber-300 tabular-nums">{sunAngle}°</div>
          </div>
          <div className="bg-[#0c162d] rounded-lg p-1.5 border border-slate-800">
            <div className="text-slate-400">{t(lang, 'mg.solar_align.shadow')}</div>
            <div className={`font-extrabold tabular-nums ${capture.inShadow ? 'text-red-400' : 'text-slate-300'}`}>
              {shadowCenter}°
            </div>
          </div>
          <div className="bg-[#0c162d] rounded-lg p-1.5 border border-slate-800">
            <div className="text-slate-400">{t(lang, 'mg.solar_align.output')}</div>
            <div className="font-extrabold text-cyan-300 tabular-nums">{capture.wattsPerSec} W/s</div>
          </div>
        </div>
      </div>

      {/* Panel Tilt Control + Dust Brush */}
      <div className="bg-[#0c162d] border border-slate-800 rounded-xl p-3 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-slate-200 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Sun className="w-4 h-4 text-yellow-300" />
              {t(lang, 'mg.solar_align.tilt')}
            </span>
            <span className="font-black text-cyan-300 tabular-nums">
              {panelAngle}° · {capture.efficiencyPct}% eff
            </span>
          </div>
          <input
            type="range"
            min={-65}
            max={65}
            value={panelAngle}
            onChange={(e) => setPanelAngle(Number(e.target.value))}
            className="w-full accent-yellow-400 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={brushDust}
            className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <CloudFog className="w-4 h-4" />
            {t(lang, 'mg.solar_align.dustBtn')} ({Math.round(dustCleanPct)}% {t(lang, 'mg.solar_align.clean')})
          </button>

          <div className="flex-1">
            <div className="flex justify-between text-[11px] font-bold text-slate-200 mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                {t(lang, 'mg.solar_align.energyTarget')}
              </span>
              <span className="tabular-nums text-emerald-300">
                {Math.round(harvestedWh)}/{targetWh} Wh
              </span>
            </div>
            <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-emerald-400 transition-all duration-200"
                style={{ width: `${Math.min(100, (harvestedWh / targetWh) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {capture.inShadow && (
        <div className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {t(lang, 'mg.solar_align.shadow')}!
        </div>
      )}
    </div>
  );
};
