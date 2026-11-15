import React, { useMemo, useState } from 'react';
import { CheckCircle2, Droplet, Filter, RotateCw, ShieldOff } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import {
  createWaterPipePuzzle,
  getOpenPorts,
  rotatePipeAt,
  solvePipeNetwork,
  type PipeCell,
} from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

const renderPipeSvg = (cell: PipeCell, lit: boolean) => {
  if (cell.shape === 'block') {
    return <ShieldOff className="w-5 h-5 text-slate-500" />;
  }
  const ports = getOpenPorts(cell.shape, cell.rotation);
  const strokeColor = lit ? '#38bdf8' : '#94a3b8';

  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      {ports.has(0) && <line x1="20" y1="20" x2="20" y2="2" stroke={strokeColor} strokeWidth="7" strokeLinecap="round" />}
      {ports.has(1) && <line x1="20" y1="20" x2="38" y2="20" stroke={strokeColor} strokeWidth="7" strokeLinecap="round" />}
      {ports.has(2) && <line x1="20" y1="20" x2="20" y2="38" stroke={strokeColor} strokeWidth="7" strokeLinecap="round" />}
      {ports.has(3) && <line x1="20" y1="20" x2="2" y2="20" stroke={strokeColor} strokeWidth="7" strokeLinecap="round" />}
      <circle cx="20" cy="20" r="4.5" fill={lit ? '#7dd3fc' : '#cbd5e1'} />
    </svg>
  );
};

export const WaterPipesMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onWin,
}) => {
  const initialNet = useMemo(() => createWaterPipePuzzle(difficulty, seed), [difficulty, seed]);
  const [network, setNetwork] = useState(initialNet);
  const flow = useMemo(() => solvePipeNetwork(network), [network]);

  const handleRotate = (x: number, y: number) => {
    if (paused) return;
    soundEngine.playClick();
    const next = rotatePipeAt(network, x, y);
    setNetwork(next);
    const nextFlow = solvePipeNetwork(next);
    if (nextFlow.tankReached) {
      soundEngine.playActionSuccess();
      onWin(Math.min(100, Math.round(70 + timeLeft * 0.9)));
    }
  };

  const progressPct = flow.tankReached ? 100 : flow.filterReached ? 60 : Math.min(40, flow.visitedKeys.length * 6);

  return (
    <MiniGameFrame
      icon={<Droplet className="w-4 h-4 text-cyan-300" />}
      instruction={t(lang, 'mg.water_pipes.desc')}
      progressPct={progressPct}
      progressTone={flow.tankReached ? 'emerald' : 'cyan'}
      stats={[
        {
          label: t(lang, 'mg.water.filter'),
          value: flow.filterReached ? 'OK' : '—',
          tone: flow.filterReached ? 'emerald' : 'amber',
        },
        {
          label: t(lang, 'mg.water.tank'),
          value: flow.tankReached ? 'OK' : '—',
          tone: flow.tankReached ? 'emerald' : 'slate',
        },
      ]}
      feedback={{
        tone: flow.filterReached ? 'success' : 'info',
        text: t(lang, 'mg.water.mustFilter'),
      }}
      footer={
        <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-300">
          <span className="inline-flex items-center gap-1 text-cyan-300">
            <Droplet className="w-3.5 h-3.5" />
            {t(lang, 'mg.water.intake')}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Filter className="w-3.5 h-3.5" />
            {t(lang, 'mg.water.filter')}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t(lang, 'mg.water.tank')}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-400">
            <RotateCw className="w-3.5 h-3.5" />
            {lang === 'es' ? 'Girar' : 'Rotate'}
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-5 gap-1.5">
        {network.cells.flatMap((row) =>
          row.map((cell) => {
            const key = `${cell.x},${cell.y}`;
            const lit = flow.visitedKeys.includes(key);
            const isIntake = cell.role === 'intake';
            const isFilter = cell.role === 'filter';
            const isTank = cell.role === 'tank';

            return (
              <button
                key={key}
                type="button"
                disabled={Boolean(cell.locked || cell.shape === 'block')}
                onClick={() => handleRotate(cell.x, cell.y)}
                className={`relative h-14 rounded-xl border flex items-center justify-center transition-colors ${
                  cell.shape === 'block'
                    ? 'bg-slate-900 border-slate-800 cursor-not-allowed'
                    : isTank
                      ? lit
                        ? 'bg-emerald-500/30 border-emerald-400'
                        : 'bg-emerald-950/50 border-emerald-500/45'
                      : isFilter
                        ? lit
                          ? 'bg-amber-500/30 border-amber-300 cursor-pointer'
                          : 'bg-amber-950/45 border-amber-500/50 cursor-pointer'
                        : isIntake
                          ? 'bg-cyan-500/25 border-cyan-400'
                          : lit
                            ? 'bg-sky-900/45 border-cyan-400 cursor-pointer'
                            : 'bg-[#0b152a] hover:bg-slate-800 border-slate-800 cursor-pointer'
                }`}
              >
                {renderPipeSvg(cell, lit)}
                {isIntake && (
                  <span className="absolute top-0.5 left-1 text-[9px] font-black text-cyan-200">IN</span>
                )}
                {isFilter && <Filter className="absolute top-0.5 right-0.5 w-3 h-3 text-amber-300" />}
                {isTank && <CheckCircle2 className="absolute top-0.5 right-0.5 w-3 h-3 text-emerald-300" />}
              </button>
            );
          }),
        )}
      </div>
    </MiniGameFrame>
  );
};
