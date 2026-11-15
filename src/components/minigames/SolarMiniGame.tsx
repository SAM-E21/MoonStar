import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Cloud, Sun, Zap } from 'lucide-react';
import { soundEngine } from '../../audio/soundEngine';
import { createPrng } from '../../engine/minigames';
import { t } from '../../i18n/translations';
import { MiniGameFrame } from './MiniGameFrame';
import type { MiniGameComponentProps } from './types';

interface FallingOrb {
  id: number;
  kind: 'ray' | 'surge' | 'dust';
  xPct: number; // 8 - 92
  yPct: number; // 0 - 100
  speed: number; // pct per second
}

export const SolarMiniGame: React.FC<MiniGameComponentProps> = ({
  lang,
  difficulty,
  paused,
  timeLeft,
  seed,
  onPenaltySeconds,
  onWin,
}) => {
  const goalEnergy = difficulty === 'easy' ? 10 : difficulty === 'normal' ? 14 : 18;
  const rngRef = useRef(createPrng(seed + 29));
  const nextIdRef = useRef(1);
  const wonRef = useRef(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  const [panelX, setPanelX] = useState(50);
  const panelXRef = useRef(50);
  const [orbs, setOrbs] = useState<FallingOrb[]>(() => {
    const rng = createPrng(seed + 7);
    return [
      { id: 9001, kind: 'ray', xPct: 25 + rng() * 50, yPct: 14, speed: 34 },
      { id: 9002, kind: 'dust', xPct: 18 + rng() * 64, yPct: 36, speed: 38 },
    ];
  });
  const [captured, setCaptured] = useState(0);
  const capturedRef = useRef(0);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'warning' | 'info'; text: string } | null>(null);

  const movePanel = useCallback(
    (nextX: number) => {
      if (paused || wonRef.current) return;
      const clamped = Math.max(10, Math.min(90, nextX));
      panelXRef.current = clamped;
      setPanelX(clamped);
    },
    [paused],
  );

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || wonRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        movePanel(panelXRef.current - 9);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        movePanel(panelXRef.current + 9);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, movePanel]);

  // Physics + Spawner loop
  useEffect(() => {
    if (paused || wonRef.current) return;

    const dtSec = 0.05;
    const speedBase = difficulty === 'easy' ? 32 : difficulty === 'normal' ? 40 : 48;
    const spawnChance = difficulty === 'easy' ? 0.1 : difficulty === 'normal' ? 0.13 : 0.16;

    const id = window.setInterval(() => {
      let hitEvent: 'ray' | 'surge' | 'dust' | null = null;

      setOrbs((prev) => {
        const surviving: FallingOrb[] = [];
        const px = panelXRef.current;

        for (const orb of prev) {
          const ny = orb.yPct + orb.speed * dtSec;
          const inCatchY = ny >= 76 && ny <= 93;
          const inCatchX = Math.abs(orb.xPct - px) <= 13;

          if (inCatchY && inCatchX) {
            hitEvent = orb.kind;
            continue;
          }
          if (ny < 103) {
            surviving.push({ ...orb, yPct: ny });
          }
        }

        if (surviving.length < 8 && (surviving.length < 2 || rngRef.current() < spawnChance)) {
          const roll = rngRef.current();
          const kind: FallingOrb['kind'] =
            roll < 0.34 ? 'dust' : roll < 0.85 ? 'ray' : 'surge';
          surviving.push({
            id: nextIdRef.current++,
            kind,
            xPct: 10 + rngRef.current() * 80,
            yPct: -4,
            speed: speedBase + rngRef.current() * 14,
          });
        }

        return surviving;
      });

      if (hitEvent === 'ray' || hitEvent === 'surge') {
        soundEngine.playActionSuccess();
        const gain = hitEvent === 'surge' ? 2 : 1;
        const nextTotal = Math.min(goalEnergy, capturedRef.current + gain);
        capturedRef.current = nextTotal;
        setCaptured(nextTotal);
        setFeedback({
          tone: 'success',
          text: t(lang, hitEvent === 'surge' ? 'mg.solar.hitSurge' : 'mg.solar.hitRay'),
        });
        if (nextTotal >= goalEnergy && !wonRef.current) {
          wonRef.current = true;
          onWin(Math.min(100, Math.round(70 + timeLeft * 0.9)));
        }
      } else if (hitEvent === 'dust') {
        soundEngine.playAlert();
        const nextTotal = Math.max(0, capturedRef.current - 1);
        capturedRef.current = nextTotal;
        setCaptured(nextTotal);
        setFeedback({ tone: 'warning', text: t(lang, 'mg.solar.hitDust') });
        onPenaltySeconds(2);
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [paused, difficulty, goalEnergy, lang, onPenaltySeconds, onWin, timeLeft]);

  const handlePointerSteer = (clientX: number) => {
    const el = arenaRef.current;
    if (!el || paused || wonRef.current) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / Math.max(1, rect.width)) * 100;
    movePanel(pct);
  };

  return (
    <MiniGameFrame
      icon={<Sun className="w-4 h-4 text-amber-300" />}
      instruction={t(lang, 'mg.solar_align.desc')}
      progressPct={(captured / goalEnergy) * 100}
      progressTone="amber"
      stats={[
        { label: t(lang, 'mg.solar.captured'), value: `${captured}/${goalEnergy}`, tone: 'amber' },
      ]}
      feedback={feedback}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-semibold">{t(lang, 'mg.solar.moveHint')}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => movePanel(panelX - 12)}
              aria-label="Left"
              className="px-4 py-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => movePanel(panelX + 12)}
              aria-label="Right"
              className="px-4 py-2 rounded-lg bg-[#0b152a] hover:bg-slate-800 border border-slate-700 text-white cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      }
    >
      {/* Falling Sunbeams & Dust Arena */}
      <div
        ref={arenaRef}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'mouse') handlePointerSteer(e.clientX);
        }}
        onPointerDown={(e) => handlePointerSteer(e.clientX)}
        className="relative h-64 rounded-lg bg-gradient-to-b from-[#040814] via-[#09132b] to-[#111c36] border border-slate-800/90 overflow-hidden select-none touch-none cursor-ew-resize"
      >
        {/* Subtle Horizon Rim */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-[#0b1326] border-t border-slate-700/60" />

        {/* Falling Sunbeams & Dust Orbs */}
        {orbs.map((orb) => (
          <div
            key={orb.id}
            style={{
              left: `${orb.xPct}%`,
              top: `${orb.yPct}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute w-9 h-9 rounded-full border flex items-center justify-center pointer-events-none ${
              orb.kind === 'ray'
                ? 'bg-amber-400/25 border-amber-300 text-amber-300'
                : orb.kind === 'surge'
                  ? 'bg-cyan-400/25 border-cyan-300 text-cyan-200'
                  : 'bg-slate-900/95 border-rose-500/70 text-rose-300'
            }`}
          >
            {orb.kind === 'ray' ? (
              <Sun className="w-5 h-5" />
            ) : orb.kind === 'surge' ? (
              <Zap className="w-5 h-5" />
            ) : (
              <Cloud className="w-5 h-5" />
            )}
          </div>
        ))}

        {/* Player Solar Panel Catcher */}
        <div
          style={{
            left: `${panelX}%`,
            bottom: '10px',
            transform: 'translateX(-50%)',
          }}
          className="absolute w-24 h-8 rounded-lg bg-cyan-500/25 border-2 border-cyan-300 flex items-center justify-center gap-1.5 shadow-md pointer-events-none"
        >
          <div className="w-16 h-3 rounded-sm bg-gradient-to-r from-cyan-400/80 via-sky-300/90 to-cyan-400/80 border border-cyan-200/70" />
        </div>
      </div>
    </MiniGameFrame>
  );
};
