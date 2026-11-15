import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  DoorClosed,
  DoorOpen,
  Radiation,
  ShieldCheck,
  User,
  BrickWall,
} from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { generateShelterMaze, type ShelterMazeConfig } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

export const ShelterMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const [maze, setMaze] = useState<ShelterMazeConfig>(() => generateShelterMaze(difficulty, seed));
  const [closedGates, setClosedGates] = useState<string[]>([]);
  const [selectedAstroId, setSelectedAstroId] = useState<string>(() => maze.astronauts[0]?.id ?? 'sofia');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const fresh = generateShelterMaze(difficulty, seed);
    setMaze(fresh);
    setClosedGates([]);
    setSelectedAstroId(fresh.astronauts[0]?.id ?? 'sofia');
    setFeedback(null);
  }, [difficulty, seed]);

  const rescuedCount = maze.astronauts.filter((a) => a.rescued).length;
  const totalCrew = maze.astronauts.length;
  const activeAstro =
    maze.astronauts.find((a) => a.id === selectedAstroId && !a.rescued) ??
    maze.astronauts.find((a) => !a.rescued) ??
    null;

  const tryMoveSelected = useCallback(
    (dx: number, dy: number) => {
      if (paused || !activeAstro) return;
      const nx = Math.max(0, Math.min(maze.cols - 1, activeAstro.x + dx));
      const ny = Math.max(0, Math.min(maze.rows - 1, activeAstro.y + dy));
      if (nx === activeAstro.x && ny === activeAstro.y) return;

      const key = `${nx},${ny}`;
      if (maze.walls.includes(key) || closedGates.includes(key)) {
        soundEngine.playAlert();
        return;
      }

      const occupiedByOther = maze.astronauts.some(
        (a) => !a.rescued && a.id !== activeAstro.id && a.x === nx && a.y === ny,
      );
      if (occupiedByOther) {
        soundEngine.playAlert();
        return;
      }

      const reachedShelter = nx === maze.shelterPos.x && ny === maze.shelterPos.y;
      if (maze.radiationZones.includes(key)) {
        soundEngine.playAlert();
        setFeedback({ tone: 'warning', text: t(lang, 'mg.she.radHit') });
        onPenaltySeconds(2);
      } else if (reachedShelter) {
        soundEngine.playActionSuccess();
        setFeedback({ tone: 'success', text: t(lang, 'mg.she.safeReach') });
      } else {
        soundEngine.playClick();
      }

      const updatedAstros = maze.astronauts.map((a) =>
        a.id === activeAstro.id ? { ...a, x: nx, y: ny, rescued: reachedShelter } : a,
      );
      setMaze((prev) => ({ ...prev, astronauts: updatedAstros }));

      if (reachedShelter) {
        const nextRemaining = updatedAstros.find((a) => !a.rescued);
        if (nextRemaining) {
          setSelectedAstroId(nextRemaining.id);
        } else {
          onWin(Math.min(100, Math.round(70 + timeLeft * 0.85)));
        }
      }
    },
    [paused, activeAstro, maze, closedGates, lang, onPenaltySeconds, onWin, timeLeft],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused) return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        tryMoveSelected(0, -1);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        tryMoveSelected(0, 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        tryMoveSelected(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        tryMoveSelected(1, 0);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const remaining = maze.astronauts.filter((a) => !a.rescued);
        if (remaining.length > 1 && activeAstro) {
          const idx = remaining.findIndex((a) => a.id === activeAstro.id);
          setSelectedAstroId(remaining[(idx + 1) % remaining.length].id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, tryMoveSelected, maze.astronauts, activeAstro]);

  const handleTileClick = (x: number, y: number) => {
    if (paused) return;
    const astroHere = maze.astronauts.find((a) => !a.rescued && a.x === x && a.y === y);
    if (astroHere) {
      soundEngine.playClick();
      setSelectedAstroId(astroHere.id);
      return;
    }

    const key = `${x},${y}`;
    if (maze.gates.includes(key)) {
      soundEngine.playClick();
      setClosedGates((prev) => (prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]));
      return;
    }

    if (activeAstro) {
      const dx = x - activeAstro.x;
      const dy = y - activeAstro.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        tryMoveSelected(dx, dy);
      }
    }
  };

  return (
    <MiniGameFrame
      icon={<ShieldCheck className="w-4 h-4 text-emerald-300" />}
      instruction={t(lang, 'mg.shelter_prep.desc')}
      progressPct={(rescuedCount / Math.max(1, totalCrew)) * 100}
      progressTone="emerald"
      stats={[
        { label: t(lang, 'mg.she.rescued'), value: `${rescuedCount}/${totalCrew}`, tone: 'emerald' },
        { label: t(lang, 'mg.she.selected'), value: activeAstro ? activeAstro.name : 'OK', tone: 'cyan' },
      ]}
      feedback={feedback}
      footer={
        <div className="space-y-2">
          {/* Crew Selector Chips + D-Pad */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {maze.astronauts.map((astro) => {
                const isSel = activeAstro?.id === astro.id;
                return (
                  <button
                    key={astro.id}
                    type="button"
                    disabled={astro.rescued}
                    onClick={() => {
                      soundEngine.playClick();
                      setSelectedAstroId(astro.id);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-extrabold flex items-center gap-1 cursor-pointer ${
                      astro.rescued
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 cursor-default'
                        : isSel
                          ? `${astro.colorClass} shadow`
                          : 'bg-[#0b152a] border-slate-700 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {astro.rescued ? <CheckCircle2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    <span>{astro.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => tryMoveSelected(-1, 0)}
                aria-label="Left"
                className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => tryMoveSelected(0, -1)}
                aria-label="Up"
                className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => tryMoveSelected(0, 1)}
                aria-label="Down"
                className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => tryMoveSelected(1, 0)}
                aria-label="Right"
                className="p-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-semibold">{t(lang, 'mg.she.gateTip')}</p>
        </div>
      }
    >
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: maze.rows }).map((_, y) =>
          Array.from({ length: maze.cols }).map((__, x) => {
            const key = `${x},${y}`;
            const isShelter = maze.shelterPos.x === x && maze.shelterPos.y === y;
            const isWall = maze.walls.includes(key);
            const isRad = maze.radiationZones.includes(key);
            const isGate = maze.gates.includes(key);
            const isGateClosed = closedGates.includes(key);
            const astro = maze.astronauts.find((a) => !a.rescued && a.x === x && a.y === y);
            const isSelected = Boolean(astro && activeAstro?.id === astro.id);
            const isAdjacentToSelected =
              Boolean(activeAstro) && Math.abs(x - activeAstro!.x) + Math.abs(y - activeAstro!.y) === 1;

            return (
              <button
                key={key}
                type="button"
                disabled={isWall}
                onClick={() => handleTileClick(x, y)}
                className={`relative h-12 rounded-lg border flex flex-col items-center justify-center transition-colors ${
                  isWall
                    ? 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
                    : astro
                      ? `${astro.colorClass} cursor-pointer ${isSelected ? 'ring-2 ring-white' : ''}`
                      : isShelter
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 cursor-pointer'
                        : isGate
                          ? isGateClosed
                            ? 'bg-amber-950/75 border-amber-400 text-amber-300 cursor-pointer'
                            : 'bg-sky-950/45 border-sky-500/50 text-sky-300 cursor-pointer'
                          : isRad
                            ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 cursor-pointer'
                            : isAdjacentToSelected
                              ? 'bg-[#122244] hover:bg-[#19305c] border-cyan-500/50 text-cyan-200 cursor-pointer'
                              : 'bg-[#0b152a] border-slate-800 text-slate-600 cursor-pointer'
                }`}
              >
                {isWall ? (
                  <BrickWall className="w-4 h-4" />
                ) : astro ? (
                  <>
                    <User className="w-4 h-4" />
                    <span className="text-[9px] font-black leading-none mt-0.5">{astro.name}</span>
                  </>
                ) : isShelter ? (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[8px] font-black leading-none mt-0.5">{t(lang, 'mg.she.shelterLabel')}</span>
                  </>
                ) : isGate ? (
                  isGateClosed ? <DoorClosed className="w-4 h-4" /> : <DoorOpen className="w-4 h-4" />
                ) : isRad ? (
                  <Radiation className="w-4 h-4" />
                ) : (
                  <span className="text-xs">·</span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </MiniGameFrame>
  );
};
