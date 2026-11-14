import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bot, CheckCircle2, CloudFog, Mountain, Radio, Snowflake, Sparkles, Sun, X } from 'lucide-react';
import { t } from '../i18n/translations';
import type { Language, MiniGameKind } from '../types/game';

interface MiniGameModalProps {
  lang: Language;
  kind: MiniGameKind;
  onComplete: (kind: MiniGameKind, won: boolean) => void;
  onClose: () => void;
}

export const MiniGameModal: React.FC<MiniGameModalProps> = ({ lang, kind, onComplete, onClose }) => {
  // Game 1: Solar Dust Cleaning (click/hover 12 tiles)
  const [dustTiles, setDustTiles] = useState<boolean[]>(() => Array(12).fill(true));
  const [timeLeft, setTimeLeft] = useState(15);

  // Game 2: Comms Frequency Tuner
  const [freq, setFreq] = useState(32);
  const [tilt, setTilt] = useState(74);
  const targetFreq = 68;
  const targetTilt = 45;

  // Game 3: Rover Ice Path (5 cols x 4 rows)
  const [roverPos, setRoverPos] = useState({ x: 0, y: 0 });
  const [collectedIce, setCollectedIce] = useState<string[]>([]);
  const iceCells = ['1,2', '3,1', '4,3'];
  const rockCells = ['1,0', '2,2', '3,2'];

  const [finished, setFinished] = useState<boolean | null>(null);

  useEffect(() => {
    if (finished !== null) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinished(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  const cleanTile = (idx: number) => {
    if (finished !== null) return;
    setDustTiles((prev) => {
      if (!prev[idx]) return prev;
      const next = [...prev];
      next[idx] = false;
      if (next.every((dirty) => !dirty)) {
        setFinished(true);
      }
      return next;
    });
  };

  const checkCommsLock = () => {
    if (finished !== null) return;
    if (Math.abs(freq - targetFreq) <= 8 && Math.abs(tilt - targetTilt) <= 8) {
      setFinished(true);
    }
  };

  const moveRover = (dx: number, dy: number) => {
    if (finished !== null) return;
    const nx = Math.max(0, Math.min(4, roverPos.x + dx));
    const ny = Math.max(0, Math.min(3, roverPos.y + dy));
    const key = `${nx},${ny}`;
    if (rockCells.includes(key)) return;
    setRoverPos({ x: nx, y: ny });
    if (iceCells.includes(key) && !collectedIce.includes(key)) {
      const nextIce = [...collectedIce, key];
      setCollectedIce(nextIce);
      if (nextIce.length === iceCells.length) {
        setFinished(true);
      }
    }
  };

  const isLockedComms = Math.abs(freq - targetFreq) <= 8 && Math.abs(tilt - targetTilt) <= 8;

  return (
    <div className="fixed inset-0 z-40 bg-[#040813]/85 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#081022] border border-cyan-500/45 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-amber-300">
              {t(lang, 'mg.badge')} · {timeLeft}s
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">{t(lang, `mg.${kind}.title`)}</h2>
            <p className="text-xs text-slate-300 mt-0.5">{t(lang, `mg.${kind}.desc`)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(lang, 'bld.close')}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mini-game 1: Solar Dust Clean */}
        {kind === 'solar_dust' && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 bg-[#0c162d] p-3 rounded-xl border border-slate-800">
              {dustTiles.map((dirty, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => cleanTile(idx)}
                  onMouseEnter={(e) => {
                    if (e.buttons === 1) cleanTile(idx);
                  }}
                  className={`h-14 rounded-lg border font-bold text-xs flex items-center justify-center cursor-pointer transition-colors ${
                    dirty
                      ? 'bg-amber-900/60 border-amber-500/50 text-amber-200 hover:bg-amber-800/70'
                      : 'bg-sky-500/25 border-cyan-400 text-cyan-200'
                  }`}
                >
                  {dirty ? (
                    <span className="flex items-center gap-1.5">
                      <CloudFog className="w-4 h-4 text-amber-300" />
                      {t(lang, 'mg.dustLabel')}
                    </span>
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-300" />
                  )}
                </button>
              ))}
            </div>
            <div className="text-xs text-center text-cyan-300 font-semibold">
              {dustTiles.filter((d) => !d).length}/12 {t(lang, 'mg.solar_dust.progress')}
            </div>
          </div>
        )}

        {/* Mini-game 2: Comms Frequency Tuner */}
        {kind === 'comms_tune' && (
          <div className="space-y-4 bg-[#0c162d] p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-200 mb-1">
                <span>{t(lang, 'mg.comms_tune.freq')}</span>
                <span className="font-bold text-cyan-300 tabular-nums">
                  {freq} MHz ({t(lang, 'mg.comms_tune.target')}: ~{targetFreq})
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-200 mb-1">
                <span>{t(lang, 'mg.comms_tune.angle')}</span>
                <span className="font-bold text-violet-300 tabular-nums">
                  {tilt}° ({t(lang, 'mg.comms_tune.target')}: ~{targetTilt}°)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                value={tilt}
                onChange={(e) => setTilt(Number(e.target.value))}
                className="w-full accent-violet-400 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={checkCommsLock}
              disabled={!isLockedComms || finished !== null}
              className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-colors ${
                isLockedComms
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Radio className="w-4 h-4" />
              {isLockedComms ? t(lang, 'mg.comms_tune.lock') : t(lang, 'mg.comms_tune.adjust')}
            </button>
          </div>
        )}

        {/* Mini-game 3: Rover Ice Path */}
        {kind === 'rover_ice' && (
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-1.5 bg-[#0c162d] p-3 rounded-xl border border-slate-800">
              {Array.from({ length: 4 }).map((_, y) =>
                Array.from({ length: 5 }).map((__, x) => {
                  const key = `${x},${y}`;
                  const isRover = roverPos.x === x && roverPos.y === y;
                  const isRock = rockCells.includes(key);
                  const isIce = iceCells.includes(key) && !collectedIce.includes(key);
                  return (
                    <div
                      key={key}
                      className={`h-11 rounded-lg border flex items-center justify-center text-sm font-bold ${
                        isRover
                          ? 'bg-amber-400 text-slate-950 border-amber-200'
                          : isRock
                            ? 'bg-slate-800 border-slate-700 text-slate-400'
                            : isIce
                              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                              : 'bg-[#081020] border-slate-800 text-slate-600'
                      }`}
                    >
                      {isRover ? (
                        <Bot className="w-5 h-5" />
                      ) : isRock ? (
                        <Mountain className="w-4 h-4" />
                      ) : isIce ? (
                        <Snowflake className="w-4 h-4" />
                      ) : (
                        '·'
                      )}
                    </div>
                  );
                }),
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Snowflake className="w-4 h-4" />
                {collectedIce.length}/{iceCells.length}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveRover(-1, 0)}
                  aria-label="Left"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRover(0, -1)}
                  aria-label="Up"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white cursor-pointer"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRover(0, 1)}
                  aria-label="Down"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white cursor-pointer"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRover(1, 0)}
                  aria-label="Right"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result Footer */}
        {finished !== null && (
          <div
            className={`mt-4 p-4 rounded-xl border flex flex-col gap-3 ${
              finished ? 'bg-emerald-950/50 border-emerald-400/60' : 'bg-amber-950/45 border-amber-500/50'
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-extrabold text-white">
              {finished ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
              {finished ? t(lang, `mg.${kind}.win`) : t(lang, 'mg.timeout')}
            </div>
            <button
              type="button"
              onClick={() => onComplete(kind, finished)}
              className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              {t(lang, 'mg.claim')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
