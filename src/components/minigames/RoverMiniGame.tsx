import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Mountain,
  RefreshCw,
  Snowflake,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createRandomMiniGameSeed, generateRoverMap, type RoverMapConfig } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

export const RoverMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const [mapSeed, setMapSeed] = useState(seed);
  const [map, setMap] = useState<RoverMapConfig>(() => generateRoverMap(difficulty, seed));
  const [roverPos, setRoverPos] = useState({ x: 0, y: 0 });
  const [collectedIce, setCollectedIce] = useState<string[]>([]);
  const [hazardHitMsg, setHazardHitMsg] = useState(false);

  const rerollMap = () => {
    const nextSeed = createRandomMiniGameSeed();
    setMapSeed(nextSeed);
    setMap(generateRoverMap(difficulty, nextSeed));
    setRoverPos({ x: 0, y: 0 });
    setCollectedIce([]);
    setHazardHitMsg(false);
    soundEngine.playClick();
  };

  useEffect(() => {
    setMapSeed(seed);
  }, [seed]);

  useEffect(() => {
    setMap(generateRoverMap(difficulty, mapSeed));
    setRoverPos({ x: 0, y: 0 });
    setCollectedIce([]);
  }, [difficulty, mapSeed]);

  const moveRover = useCallback(
    (dx: number, dy: number) => {
      if (paused) return;
      const nx = Math.max(0, Math.min(map.cols - 1, roverPos.x + dx));
      const ny = Math.max(0, Math.min(map.rows - 1, roverPos.y + dy));
      if (nx === roverPos.x && ny === roverPos.y) return;

      const key = `${nx},${ny}`;
      if (map.rocks.includes(key)) {
        soundEngine.playAlert();
        return;
      }

      soundEngine.playClick();
      setRoverPos({ x: nx, y: ny });

      if (map.hazards.includes(key)) {
        setHazardHitMsg(true);
        onPenaltySeconds(2);
      } else {
        setHazardHitMsg(false);
      }

      if (map.crystals.includes(key) && !collectedIce.includes(key)) {
        const nextIce = [...collectedIce, key];
        setCollectedIce(nextIce);
        soundEngine.playActionSuccess();
        if (nextIce.length === map.crystals.length) {
          onWin(Math.min(100, Math.round(70 + timeLeft * 0.9)));
        }
      }
    },
    [paused, map, roverPos, collectedIce, onPenaltySeconds, onWin, timeLeft],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        moveRover(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        moveRover(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moveRover(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moveRover(1, 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveRover]);

  return (
    <MiniGameFrame
      icon={<Bot className="w-4 h-4 text-amber-300" />}
      instruction={t(lang, 'mg.rover_ice.desc')}
      progressPct={(collectedIce.length / Math.max(1, map.crystals.length)) * 100}
      progressTone="cyan"
      stats={[
        { label: 'H2O', value: `${collectedIce.length}/${map.crystals.length}`, tone: 'cyan' },
      ]}
      feedback={hazardHitMsg ? { tone: 'warning', text: t(lang, 'mg.rover.hazardWarn') } : null}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={rerollMap}
            className="px-3 py-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t(lang, 'mg.rover.newMap')}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => moveRover(-1, 0)}
              aria-label="Left"
              className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveRover(0, -1)}
              aria-label="Up"
              className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveRover(0, 1)}
              aria-label="Down"
              className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => moveRover(1, 0)}
              aria-label="Right"
              className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${map.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: map.rows }).map((_, y) =>
          Array.from({ length: map.cols }).map((__, x) => {
            const key = `${x},${y}`;
            const isRover = roverPos.x === x && roverPos.y === y;
            const isRock = map.rocks.includes(key);
            const isHazard = map.hazards.includes(key);
            const isIce = map.crystals.includes(key) && !collectedIce.includes(key);

            return (
              <div
                key={key}
                className={`h-11 rounded-lg border flex items-center justify-center text-sm font-bold transition-colors ${
                  isRover
                    ? 'bg-amber-400 text-slate-950 border-amber-200'
                    : isRock
                      ? 'bg-slate-900 border-slate-800 text-slate-500'
                      : isIce
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                        : isHazard
                          ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                          : 'bg-[#0b152a] border-slate-800 text-slate-600'
                }`}
              >
                {isRover ? (
                  <Bot className="w-5 h-5" />
                ) : isRock ? (
                  <Mountain className="w-4 h-4" />
                ) : isIce ? (
                  <Snowflake className="w-4 h-4" />
                ) : isHazard ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                  '·'
                )}
              </div>
            );
          }),
        )}
      </div>
    </MiniGameFrame>
  );
};
