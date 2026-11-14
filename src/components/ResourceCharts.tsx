import React, { useState } from 'react';
import type { Language, ResourceSnapshot } from '../types/game';
import { t } from '../i18n/translations';

interface ResourceChartsProps {
  history: ResourceSnapshot[];
  lang: Language;
}

type SeriesKey = 'energy' | 'oxygen' | 'water' | 'food' | 'radiationRisk';

const SERIES_META: Array<{ key: SeriesKey; labelKey: string; color: string }> = [
  { key: 'energy', labelKey: 'hud.energy', color: '#facc15' },
  { key: 'oxygen', labelKey: 'hud.oxygen', color: '#38bdf8' },
  { key: 'water', labelKey: 'hud.water', color: '#22d3ee' },
  { key: 'food', labelKey: 'hud.food', color: '#4ade80' },
  { key: 'radiationRisk', labelKey: 'hud.radiation', color: '#f97316' },
];

export const ResourceCharts: React.FC<ResourceChartsProps> = ({ history, lang }) => {
  const [visibleKeys, setVisibleKeys] = useState<Record<SeriesKey, boolean>>({
    energy: true,
    oxygen: true,
    water: true,
    food: true,
    radiationRisk: true,
  });

  const width = 520;
  const height = 148;
  const padL = 32;
  const padR = 16;
  const padT = 14;
  const padB = 24;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const maxDay = Math.max(2, history.length);
  const xForIndex = (idx: number) =>
    history.length <= 1 ? padL + plotW / 2 : padL + (idx / (maxDay - 1)) * plotW;
  const yForVal = (val: number) => padT + plotH - (Math.min(130, Math.max(0, val)) / 130) * plotH;

  const toggleSeries = (k: SeriesKey) => {
    setVisibleKeys((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {SERIES_META.map((s) => {
          const active = visibleKeys[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                active
                  ? 'bg-slate-800/90 border-slate-600 text-slate-100'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ backgroundColor: active ? s.color : '#475569' }}
              />
              {t(lang, s.labelKey)}
            </button>
          );
        })}
      </div>

      <div className="w-full overflow-x-auto bg-[#060b16] border border-slate-800 rounded-lg p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 block">
          {/* Grid lines */}
          {[0, 35, 70, 100].map((v) => {
            const y = yForVal(v);
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" className="tabular-nums">
                  {v}
                </text>
              </g>
            );
          })}

          {/* Day labels */}
          {history.map((snap, idx) => (
            <text
              key={snap.day}
              x={xForIndex(idx)}
              y={height - 6}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="9"
              className="tabular-nums"
            >
              D{snap.day}
            </text>
          ))}

          {/* Series Polylines */}
          {SERIES_META.map((s) => {
            if (!visibleKeys[s.key]) return null;
            const pts = history
              .map((snap, idx) => `${xForIndex(idx).toFixed(1)},${yForVal(snap[s.key]).toFixed(1)}`)
              .join(' ');
            return (
              <g key={s.key}>
                {history.length > 1 && (
                  <polyline fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" points={pts} />
                )}
                {history.map((snap, idx) => (
                  <circle
                    key={`${s.key}-${snap.day}`}
                    cx={xForIndex(idx)}
                    cy={yForVal(snap[s.key])}
                    r="3.2"
                    fill={s.color}
                    stroke="#060b16"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
